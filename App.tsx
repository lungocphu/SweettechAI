import React, { useState, useRef, useEffect } from 'react';
import { Language, AnalysisResult, ProcessingState, SWOT, ProductProfile, Competitor, Review, Persona, ReviewAnalysis } from './types';
import { TRANSLATIONS } from './constants';
import { analyzeProduct } from './services/geminiService';
import { RadarChartComponent } from './components/RadarChartComponent';
import { 
  Upload, 
  Mic, 
  Search, 
  ChefHat, 
  Scale, 
  Lightbulb, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  MessageSquare,
  Globe,
  Camera,
  Paperclip,
  AlertTriangle,
  X,
  Save,
  Download,
  History,
  Trash2,
  FlaskConical,
  Info,
  Star,
  FileText,
  FileDown,
  Printer,
  PlusCircle,
  ThumbsDown,
  ThumbsUp,
  BrainCircuit,
  ClipboardList,
  Users,
  Tags,
  Sparkles,
  Cookie,
  HeartPulse,
} from 'lucide-react';

declare var html2pdf: any;

interface HistoryItem {
  id: number;
  queryText: string;
  queryMediaName: string | null;
  result: AnalysisResult;
  timestamp: string;
}

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(Language.VN);
  const [inputText, setInputText] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [state, setState] = useState<ProcessingState>({ status: 'idle' });
  
  const [lastAnalyzedInput, setLastAnalyzedInput] = useState<{ text: string; media: File | null } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(window.innerWidth > 768);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isInitialMount = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  
  const t = TRANSLATIONS[language];

  // Register Service Worker for PWA functionality
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }
  }, []);

  // Load history from localStorage on initial mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('sweetTechHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
    }
  }, []);

  // Effect for toast messages
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);
  
  // Close export menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
            setIsExportMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (lastAnalyzedInput && state.status !== 'analyzing') {
      const reAnalyzeForTranslation = async () => {
        const newTranslations = TRANSLATIONS[language];
        setState({ status: 'analyzing', message: newTranslations.analyzing });
        setResult(null);

        try {
          const data = await analyzeProduct(lastAnalyzedInput.text, lastAnalyzedInput.media, language);
          setResult(data);
          setState({ status: 'complete' });
        } catch (error) {
          setState({ status: 'error', message: "Translation failed. Please try again." });
        }
      };
      reAnalyzeForTranslation();
    }
  }, [language]);

  const handleAnalyze = async () => {
    if (!inputText && !mediaFile) return;
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState({ status: 'analyzing', message: t.analyzing });
    setResult(null);

    try {
      const data = await analyzeProduct(inputText, mediaFile, language);
      if (!controller.signal.aborted) {
        setResult(data);
        setState({ status: 'complete' });
        setLastAnalyzedInput({ text: inputText, media: mediaFile });
      }
    } catch (error) {
       if (!controller.signal.aborted) {
         setState({ status: 'error', message: "Analysis failed. Please try again." });
         setLastAnalyzedInput(null);
       }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };
  
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState({ status: 'idle' });
    setResult(null); 
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMediaFile(e.target.files[0]);
    }
  };

  const handleStartRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `voice-input-${Date.now()}.webm`, { type: 'audio/webm' });
                setMediaFile(audioFile);
                setInputText('Voice memo analysis');
                
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorderRef.current.start();
            setIsRecording(true);
            setMediaFile(null);
            setInputText('');
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setState({ status: 'error', message: 'Microphone access denied. Please allow microphone permissions in your browser.' });
        }
    } else {
        console.error("getUserMedia not supported on your browser!");
        setState({ status: 'error', message: 'Voice recording is not supported on your browser.' });
    }
  };

  const handleStopRecording = () => {
      if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };


  const getShortUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (e) {
      return url;
    }
  };
  
  const handleSaveToHistory = () => {
    if (!result || !lastAnalyzedInput) return;
    const newHistoryItem: HistoryItem = {
      id: Date.now(),
      queryText: lastAnalyzedInput.text,
      queryMediaName: lastAnalyzedInput.media?.name || null,
      result: result,
      timestamp: new Date().toISOString(),
    };
    const isDuplicate = history.some(item => 
        item.queryText === newHistoryItem.queryText &&
        item.queryMediaName === newHistoryItem.queryMediaName &&
        JSON.stringify(item.result.profile) === JSON.stringify(newHistoryItem.result.profile)
    );

    if (!isDuplicate) {
        const updatedHistory = [newHistoryItem, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('sweetTechHistory', JSON.stringify(updatedHistory));
        setToastMessage("Analysis saved to history.");
    } else {
        setToastMessage("This analysis is already in your history.");
    }
  };

  const handleLoadFromHistory = (item: HistoryItem) => {
    setResult(item.result);
    setInputText(item.queryText);
    setMediaFile(null); // Can't restore file object
    setLastAnalyzedInput({ text: item.queryText, media: null });
    setState({ status: 'complete' });
    if(window.innerWidth <= 768) {
        setIsHistoryPanelOpen(false);
    }
  };

  const handleDeleteFromHistory = (id: number) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('sweetTechHistory', JSON.stringify(updatedHistory));
    setToastMessage("History item deleted.");
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all history? This cannot be undone.")) {
        setHistory([]);
        localStorage.removeItem('sweetTechHistory');
        setToastMessage("History cleared.");
    }
  };

  const handleExportTxt = () => {
    if (!result || !lastAnalyzedInput) return;
    let content = `${t.title}\n${t.subtitle}\n\n`;
    content += `Analysis for: ${lastAnalyzedInput.text}\n`;
    if(lastAnalyzedInput.media?.name) content += `Media File: ${lastAnalyzedInput.media.name}\n`;
    content += "=========================================\n\n";

    // Profile
    content += `--- ${t.sections.profile.toUpperCase()} ---\n`;
    const p = result.profile;
    content += `Name: ${p.name}\nBrand: ${p.brand}\nWeight: ${p.netWeight}\nPrice: ${p.price}\nType: ${p.type}\nOrigin: ${p.origin}\nManufacturer: ${p.manufacturer}\nImporter: ${p.importer}\n\n`;
    
    // Ingredients
    content += `--- ${t.sections.ingredients.toUpperCase()} ---\n`;
    content += `${t.sections.labelIngredients}: ${p.labelIngredients}\n`;
    content += `${t.sections.mainIngredients}: ${p.ingredients.join(', ')}\n`;
    content += `${t.sections.additives}:\n${p.additives.map(a => `  - ${a.code} (${a.name}): ${a.function}`).join('\n')}\n`;
    content += `${t.sections.allergens}: ${p.allergens?.join(', ') || 'N/A'}\n\n`;
    
    // Benchmarking
    content += `--- ${t.sections.benchmark.toUpperCase()} ---\n`;
    result.competitors.forEach(c => {
        content += `> ${c.name}\n`;
        content += `  Price/100g: ${c.pricePer100g}\n  USP: ${c.usp}\n`;
        content += `  Sensory: Sweetness(${c.sensory.sweetness}), Texture(${c.sensory.texture}), Aftertaste(${c.sensory.aftertaste})\n`;
        content += `  Nutrition: Energy(${c.nutrition.energy}), Sugar(${c.nutrition.sugar}), Fat(${c.nutrition.fat}), Salt(${c.nutrition.salt})\n\n`;
    });
    
    // SWOT
    content += `--- SWOT ANALYSIS ---\n`;
    content += `Strengths:\n${result.swot.strengths.map(s => `  - ${s}`).join('\n')}\n`;
    content += `Weaknesses:\n${result.swot.weaknesses.map(w => `  - ${w}`).join('\n')}\n`;
    content += `Opportunities:\n${result.swot.opportunities.map(o => `  - ${o}`).join('\n')}\n`;
    content += `Threats:\n${result.swot.threats.map(t => `  - ${t}`).join('\n')}\n\n`;

    // Improvements
    content += `--- ${t.sections.insights.toUpperCase()} ---\n`;
    result.improvements.forEach(i => {
        content += `> ${i.title}\n  ${i.description}\n\n`;
    });
    
    // Persona
    content += `--- ${t.sections.persona.toUpperCase()} ---\n`;
    content += `${t.sections.targetAudience}: ${result.persona.targetAudience}\n`;
    content += `${t.sections.expansionPotential}:\n${result.persona.expansionPotential.map(p => `  - ${p}`).join('\n')}\n\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SweetTech_Analysis_${result.profile.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };
  
  const handlePrint = () => {
      setIsExportMenuOpen(false);
      window.print();
  };
  
  const handleDownloadPdf = () => {
      setIsExportMenuOpen(false);
      if (typeof html2pdf === 'undefined') {
          alert("PDF generator is not loaded yet. Please try again in a moment.");
          return;
      }
      
      setToastMessage(t.generatingPdf);
      const element = document.getElementById('printable-report');
      
      const opt = {
          margin: 5,
          filename: `SweetTech_Report_${result?.profile.name.replace(/\s+/g, '_') || 'Analysis'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().set(opt).from(element).save()
      .then(() => {
         setToastMessage("PDF Downloaded!");
      })
      .catch((err: any) => {
         console.error(err);
         setToastMessage("Failed to generate PDF");
      });
  };

  const renderSection = (icon: React.ReactNode, title: string, children: React.ReactNode, className: string = '') => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 printable-section ${className}`}>
      <h2 className="flex items-center text-xl font-semibold text-gray-800 mb-4">
        {icon}
        <span className="ml-3">{title}</span>
      </h2>
      {children}
    </div>
  );

  const renderProfile = (profile: ProductProfile) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-gray-700">
      <div><strong>Brand:</strong> {profile.brand}</div>
      <div><strong>Origin:</strong> {profile.origin}</div>
      <div><strong>Type:</strong> {profile.type}</div>
      <div><strong>Net Weight:</strong> {profile.netWeight}</div>
      <div><strong>Price:</strong> {profile.price}</div>
      <div><strong>{t.sections.manufacturer}:</strong> {profile.manufacturer || 'N/A'}</div>
      <div className="lg:col-span-3"><strong>{t.sections.importer}:</strong> {profile.importer || 'N/A'}</div>
    </div>
  );

  const renderIngredients = (profile: ProductProfile) => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-gray-600 mb-2">{t.sections.labelIngredients}</h4>
        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">{profile.labelIngredients}</p>
      </div>
      <div>
        <h4 className="font-semibold text-gray-600 mb-2">{t.sections.mainIngredients}</h4>
        <div className="flex flex-wrap gap-2">
          {profile.ingredients.map(ing => <span key={ing} className="bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-1 rounded-full">{ing}</span>)}
        </div>
      </div>
      <div>
        <h4 className="font-semibold text-gray-600 mb-2">{t.sections.additives}</h4>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          {profile.additives.map(add => <li key={add.code}><strong>{add.code} ({add.name}):</strong> {add.function}</li>)}
        </ul>
      </div>
      {profile.allergens && profile.allergens.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-600 mb-2 flex items-center"><AlertTriangle className="w-4 h-4 mr-2 text-amber-500" /> {t.sections.allergens}</h4>
          <p className="text-sm text-gray-600">{profile.allergens.join(', ')}</p>
        </div>
      )}
    </div>
  );

  const renderBenchmark = (competitors: Competitor[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {competitors.map(c => (
            <div key={c.name} className="bg-gray-50/50 rounded-lg border border-gray-200 p-4 flex flex-col">
                <h4 className="font-bold text-gray-800">{c.name}</h4>
                <p className="text-sm text-brand-600 font-semibold mt-1">{c.pricePer100g} <span className="text-gray-500 font-normal">/ 100g</span></p>
                <div className="mt-4">
                    <h5 className="flex items-center text-sm font-semibold text-gray-600"><Sparkles className="w-4 h-4 mr-2 text-yellow-500"/> {t.tableHeaders.usp}</h5>
                    <p className="text-sm text-gray-600 mt-1 pl-6">{c.usp}</p>
                </div>
                <div className="flex-grow mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                    <div>
                        <h5 className="flex items-center text-sm font-semibold text-gray-600 mb-2"><Cookie className="w-4 h-4 mr-2 text-amber-700"/> {t.tableHeaders.sensory}</h5>
                        <ul className="text-xs text-gray-600 space-y-1">
                           <li><span className="font-medium">Sweet:</span> {c.sensory.sweetness}</li>
                           <li><span className="font-medium">Texture:</span> {c.sensory.texture}</li>
                           <li><span className="font-medium">Aftertaste:</span> {c.sensory.aftertaste}</li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="flex items-center text-sm font-semibold text-gray-600 mb-2"><HeartPulse className="w-4 h-4 mr-2 text-red-500"/> {t.tableHeaders.nutrition}</h5>
                        <ul className="text-xs text-gray-600 space-y-1">
                           <li><span className="font-medium">Energy:</span> {c.nutrition.energy}</li>
                           <li><span className="font-medium">Sugar:</span> {c.nutrition.sugar}</li>
                        </ul>
                    </div>
                </div>
            </div>
        ))}
    </div>
  );
  
  const renderSwot = (swot: SWOT) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h4 className="font-semibold text-green-800 flex items-center mb-2"><ThumbsUp className="w-5 h-5 mr-2" /> Strengths</h4>
        <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
          {swot.strengths.map(s => <li key={s}>{s}</li>)}
        </ul>
      </div>
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <h4 className="font-semibold text-red-800 flex items-center mb-2"><ThumbsDown className="w-5 h-5 mr-2" /> Weaknesses</h4>
        <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
          {swot.weaknesses.map(w => <li key={w}>{w}</li>)}
        </ul>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 flex items-center mb-2"><TrendingUp className="w-5 h-5 mr-2" /> Opportunities</h4>
        <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
          {swot.opportunities.map(o => <li key={o}>{o}</li>)}
        </ul>
      </div>
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h4 className="font-semibold text-yellow-800 flex items-center mb-2"><AlertCircle className="w-5 h-5 mr-2" /> Threats</h4>
        <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
          {swot.threats.map(t => <li key={t}>{t}</li>)}
        </ul>
      </div>
    </div>
  );

  const renderImprovements = (improvements: Array<{title: string, description: string}>) => (
    <div className="space-y-4">
      {improvements.map((item, index) => (
        <div key={index} className="bg-gray-50 p-4 rounded-lg border">
          <h4 className="font-semibold text-gray-700 flex items-center"><PlusCircle className="w-5 h-5 mr-2 text-brand-600"/>{item.title}</h4>
          <p className="text-sm text-gray-600 mt-1 ml-7">{item.description}</p>
        </div>
      ))}
    </div>
  );
  
  const renderReviews = (reviewData: ReviewAnalysis) => (
    <div className="space-y-6">
       <div>
          <h4 className="font-semibold text-gray-700 mb-2 flex items-center"><ClipboardList className="w-5 h-5 mr-2 text-brand-600"/> Review Summary</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">{reviewData.summary}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-700 mb-2 flex items-center"><Tags className="w-5 h-5 mr-2 text-brand-600"/> Key Themes</h4>
          <div className="flex flex-wrap gap-2">
            {reviewData.keyThemes.map(theme => (
              <span key={theme} className="bg-sky-100 text-sky-800 text-xs font-medium px-2.5 py-1 rounded-full">{theme}</span>
            ))}
          </div>
        </div>
        
        {reviewData.items.length > 0 && <hr className="border-gray-200" />}
      
        <div className="space-y-4">
          {reviewData.items.map((review, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-sm text-gray-700">{review.source}</span>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 italic">"{review.content}"</p>
            </div>
          ))}
        </div>
    </div>
  );
  
  const renderPersona = (persona: Persona) => (
     <div className="space-y-6">
        <div>
          <h4 className="font-semibold text-gray-600 mb-2">{t.sections.targetAudience}</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">{persona.targetAudience}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-600 mb-2">{t.sections.expansionPotential}</h4>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            {persona.expansionPotential.map(p => <li key={p}>{p}</li>)}
          </ul>
        </div>
      </div>
  );

  const renderSources = (sources: string[]) => (
    <div className="flex flex-wrap gap-2">
      {sources.map(url => (
        <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full hover:bg-blue-200 transition-colors">
          {getShortUrl(url)}
        </a>
      ))}
    </div>
  );


  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
        {/* History Panel */}
        <aside className={`no-print bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${isHistoryPanelOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">History</h2>
                <button onClick={handleClearHistory} disabled={history.length === 0} className="text-gray-500 hover:text-red-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors p-1 rounded-full">
                    <Trash2 size={18} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {history.length > 0 ? (
                    <ul>
                        {history.map(item => (
                            <li key={item.id} className="border-b border-gray-100 relative group">
                                <button onClick={() => handleLoadFromHistory(item)} className="w-full text-left p-4 hover:bg-gray-50 transition-colors pr-10">
                                    <p className="font-medium text-sm truncate text-gray-800">{item.queryText}</p>
                                    {item.queryMediaName && <p className="text-xs text-gray-500 truncate mt-1 flex items-center"><Paperclip size={12} className="mr-1"/> {item.queryMediaName}</p>}
                                    <p className="text-xs text-gray-400 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                                </button>
                                <button onClick={() => handleDeleteFromHistory(item.id)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="p-4 text-center text-sm text-gray-500 mt-4">
                        <History className="mx-auto w-10 h-10 text-gray-300 mb-2"/>
                        <p>No history yet.</p>
                        <p className="text-xs text-gray-400">Your completed analyses will be saved here for future reference.</p>
                    </div>
                )}
            </div>
        </aside>

        {/* Main content */}
        <main className={`flex-1 flex flex-col transition-all duration-300 ${isHistoryPanelOpen ? 'md:ml-80' : 'ml-0'}`}>
            <header className="no-print bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-20">
              <div className="flex items-center">
                <button onClick={() => setIsHistoryPanelOpen(!isHistoryPanelOpen)} className="p-2 rounded-full hover:bg-gray-100 mr-2">
                    <History size={20} className="text-gray-600"/>
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">{t.title}</h1>
                  <p className="text-sm text-gray-500">{t.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {(Object.keys(Language) as Array<keyof typeof Language>).map(key => (
                  <button
                    key={Language[key]}
                    onClick={() => setLanguage(Language[key])}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${language === Language[key] ? 'bg-brand-600 text-white font-semibold' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div id="printable-report" className="max-w-7xl mx-auto space-y-6">
                {state.status === 'idle' && !result && (
                  <div className="text-center py-20">
                    <ChefHat className="mx-auto w-20 h-20 text-brand-400 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800">Welcome to R&D Mate</h2>
                    <p className="text-gray-600 mt-2 max-w-lg mx-auto">Your AI assistant for confectionery product development. Start by entering a product name, uploading a photo, or recording a description below.</p>
                  </div>
                )}

                {state.status === 'analyzing' && (
                  <div className="text-center py-20">
                    <div className="relative w-20 h-20 mx-auto">
                      <div className="absolute inset-0 border-4 border-brand-200 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-brand-500 rounded-full animate-spin border-t-transparent"></div>
                      <FlaskConical className="w-10 h-10 text-brand-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mt-6">{state.message}</h2>
                    <p className="text-gray-500 mt-2">This may take a moment...</p>
                    <button onClick={handleCancel} className="mt-6 bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-300 transition-colors">
                        {t.cancelBtn}
                    </button>
                  </div>
                )}

                {state.status === 'error' && (
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold">An Error Occurred</h3>
                    <p className="text-sm mt-1">{state.message}</p>
                  </div>
                )}

                {state.status === 'complete' && result && (
                  <>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex justify-between items-center no-print">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">{result.profile.name}</h1>
                        <p className="text-md text-gray-600">{result.profile.brand}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={handleSaveToHistory} className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-brand-600 transition-colors" title="Save to History">
                          <Save size={20} />
                        </button>
                        <div className="relative" ref={exportMenuRef}>
                          <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-brand-600 transition-colors" title="Export">
                            <Download size={20} />
                          </button>
                          {isExportMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 z-10 py-1">
                              <button onClick={handlePrint} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                <Printer size={16} className="text-gray-500"/> {t.printBtn}
                              </button>
                              <button onClick={handleDownloadPdf} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                <FileDown size={16} className="text-gray-500"/> {t.exportPdfBtn}
                              </button>
                              <hr className="border-gray-100 my-1"/>
                              <button onClick={handleExportTxt} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                <FileText size={16} className="text-gray-500"/> {t.exportTxtBtn}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {renderSection(<ClipboardList className="w-6 h-6 text-brand-600"/>, t.sections.profile, renderProfile(result.profile))}
                      {renderSection(<Users className="w-6 h-6 text-brand-600"/>, t.sections.persona, renderPersona(result.persona))}
                    </div>

                    {renderSection(<FlaskConical className="w-6 h-6 text-brand-600"/>, t.sections.ingredients, renderIngredients(result.profile))}
                    {renderSection(<Scale className="w-6 h-6 text-brand-600"/>, t.sections.benchmark, renderBenchmark(result.competitors))}
                    
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 page-break-before">
                      <div className="lg:col-span-2">
                        <RadarChartComponent data={result.radarChart} />
                      </div>
                      <div className="lg:col-span-3">
                        {renderSection(<BrainCircuit className="w-6 h-6 text-brand-600"/>, 'SWOT Analysis', renderSwot(result.swot))}
                      </div>
                    </div>
                    
                    {renderSection(<Lightbulb className="w-6 h-6 text-brand-600"/>, t.sections.insights, renderImprovements(result.improvements))}
                    {renderSection(<MessageSquare className="w-6 h-6 text-brand-600"/>, t.sections.reviews, renderReviews(result.reviews))}
                    {renderSection(<Globe className="w-6 h-6 text-brand-600"/>, t.sections.sources, renderSources(result.sources))}
                  </>
                )}
              </div>
            </div>

            <div className="no-print p-4 sm:p-6 lg:p-8 border-t border-gray-200 bg-white/80 backdrop-blur-sm sticky bottom-0">
                <div className="max-w-4xl mx-auto">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                            placeholder={t.inputPlaceholder}
                            className="w-full bg-white border border-gray-300 rounded-full py-3 pl-12 pr-48 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
                            disabled={state.status === 'analyzing'}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-brand-600 transition-colors" title={t.uploadLabel} disabled={isRecording}>
                                <Upload size={20} />
                            </button>
                            <button onClick={() => cameraInputRef.current?.click()} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-brand-600 transition-colors" title={t.cameraLabel} disabled={isRecording}>
                                <Camera size={20} />
                            </button>
                            <button onClick={isRecording ? handleStopRecording : handleStartRecording} className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-500 hover:text-brand-600'}`} title={t.voiceLabel}>
                                <Mic size={20} />
                            </button>
                            <button
                                onClick={handleAnalyze}
                                disabled={(!inputText && !mediaFile) || state.status === 'analyzing'}
                                className="bg-brand-600 text-white font-semibold px-5 py-2 rounded-full hover:bg-brand-700 disabled:bg-brand-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {t.analyzeBtn}
                            </button>
                        </div>
                    </div>
                    {mediaFile && (
                        <div className="mt-3 flex items-center justify-between bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm max-w-xs mx-auto">
                            <div className="flex items-center truncate">
                                {mediaFile.type.startsWith('image/') ? <FileText size={16} className="mr-2 flex-shrink-0" /> : <Mic size={16} className="mr-2 flex-shrink-0" />}
                                <span className="truncate">{mediaFile.name}</span>
                            </div>
                            <button onClick={() => setMediaFile(null)} className="p-1 rounded-full hover:bg-gray-200 ml-2">
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,audio/*" />
            <input type="file" ref={cameraInputRef} onChange={handleFileChange} className="hidden" accept="image/*" capture="environment" />
        </main>

        {toastMessage && (
            <div className="no-print fixed bottom-24 right-6 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center animate-fade-in-out z-30">
                <CheckCircle2 size={18} className="text-green-400 mr-2"/>
                <span>{toastMessage}</span>
            </div>
        )}
    </div>
  );
};

export default App;