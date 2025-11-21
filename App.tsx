import React, { useState, useRef } from 'react';
import { Language, AnalysisResult, ProcessingState } from './types';
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
  Globe
} from 'lucide-react';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(Language.VN);
  const [inputText, setInputText] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [state, setState] = useState<ProcessingState>({ status: 'idle' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[language];

  const handleAnalyze = async () => {
    if (!inputText && !mediaFile) return;

    setState({ status: 'analyzing', message: t.analyzing });
    setResult(null);

    try {
      const data = await analyzeProduct(inputText, mediaFile, language);
      setResult(data);
      setState({ status: 'complete' });
    } catch (error) {
      setState({ status: 'error', message: "Analysis failed. Please try again." });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMediaFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-200">
              <ChefHat size={24} />
            </div>
            <div>
              <h1 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-800">
                {t.title}
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex bg-slate-100 rounded-lg p-1">
            {Object.values(Language).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  language === lang
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Input Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all hover:shadow-md">
          <div className="flex flex-col gap-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.inputPlaceholder}
              className="w-full h-24 p-4 rounded-xl border border-slate-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none resize-none text-slate-700 placeholder:text-slate-400"
            />
            
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,audio/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                    mediaFile ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  } transition-colors`}
                >
                  <Upload size={18} />
                  <span className="text-sm font-medium">
                    {mediaFile ? mediaFile.name : t.uploadLabel}
                  </span>
                </button>
                
                {/* Simulated Mic Button for UX completeness - actual implementation assumes file upload for audio */}
                 <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  <Mic size={18} />
                  <span className="text-sm font-medium hidden sm:inline">Voice</span>
                </button>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={state.status === 'analyzing' || (!inputText && !mediaFile)}
                className="flex items-center gap-2 px-8 py-3 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white rounded-xl font-semibold shadow-lg shadow-brand-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
              >
                {state.status === 'analyzing' ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search size={20} />
                )}
                {t.analyzeBtn}
              </button>
            </div>
          </div>
          
          {state.status === 'analyzing' && (
            <div className="mt-4 text-center text-sm text-brand-600 font-medium animate-pulse">
              {t.analyzing}
            </div>
          )}
          {state.status === 'error' && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {state.message}
            </div>
          )}
        </section>

        {/* Results Display */}
        {result && (
          <div className="space-y-8 animate-fade-in">
            
            {/* 1. Product Profile */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-1 h-8 bg-brand-500 rounded-full"></div>
                {t.sections.profile}
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Name</label>
                      <p className="text-lg font-semibold text-slate-800">{result.profile.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Brand</label>
                        <p className="text-slate-700">{result.profile.brand}</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Type</label>
                        <p className="text-slate-700">{result.profile.type}</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Weight</label>
                        <p className="text-slate-700">{result.profile.netWeight}</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Origin</label>
                        <p className="text-slate-700">{result.profile.origin}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                       <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Price (Approx)</label>
                       <p className="text-xl font-bold text-green-600">{result.profile.price}</p>
                    </div>
                  </div>
                </div>

                {/* Ingredients & Specs */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Scale size={18} className="text-brand-500" /> 
                      {t.sections.ingredients}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-3">
                      {result.profile.ingredients.join(', ')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.profile.additives.map((ad, idx) => (
                        <div key={idx} className="px-3 py-1 bg-yellow-50 border border-yellow-100 rounded-full text-xs text-yellow-700 flex items-center gap-1 group relative cursor-help">
                          <span className="font-bold">{ad.code}</span>
                          <span>- {ad.name}</span>
                          {/* Tooltip for additive function */}
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {ad.function}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl">
                    {Object.entries(result.profile.specs).map(([key, val]) => (
                      <div key={key}>
                        <span className="block text-xs text-slate-400 uppercase mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="font-medium text-slate-700 text-sm">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Benchmarking */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
                {t.sections.benchmark}
              </h2>
              <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Item</th>
                      <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t.tableHeaders.competitor}</th>
                      <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t.tableHeaders.price}</th>
                      <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t.tableHeaders.usp}</th>
                      <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t.tableHeaders.sensory}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Primary Product Row */}
                    <tr className="bg-brand-50/30">
                      <td className="p-4">
                         <span className="px-2 py-1 bg-brand-100 text-brand-700 text-xs font-bold rounded">MAIN</span>
                      </td>
                      <td className="p-4 font-semibold text-brand-900">{result.profile.name}</td>
                      <td className="p-4 text-slate-600">{result.profile.price}</td>
                      <td className="p-4 text-slate-600 italic">--</td>
                      <td className="p-4 text-sm text-slate-600">
                        Sweet: {result.profile.specs.flavorProfile}
                      </td>
                    </tr>
                    {/* Competitors */}
                    {result.competitors.map((comp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded">#{idx + 1}</span>
                        </td>
                        <td className="p-4 font-medium text-slate-800">{comp.name}</td>
                        <td className="p-4 text-slate-600">{comp.pricePer100g}</td>
                        <td className="p-4 text-xs text-slate-600 bg-blue-50 rounded p-1 leading-tight">{comp.usp}</td>
                        <td className="p-4 text-xs text-slate-500">
                          <div className="flex flex-col gap-1">
                            <span>🍬 {comp.sensory.sweetness}</span>
                            <span>🦷 {comp.sensory.texture}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3. R&D Insights (Chart + SWOT + Improvements) */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-1 h-8 bg-purple-500 rounded-full"></div>
                {t.sections.insights}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Radar Chart */}
                <div className="md:col-span-1">
                  <RadarChartComponent data={result.radarChart} />
                </div>

                {/* SWOT & Improvements */}
                <div className="md:col-span-2 space-y-6">
                  {/* SWOT Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <h4 className="font-bold text-green-800 text-sm mb-2 flex items-center gap-1">
                        <TrendingUp size={16} /> STRENGTHS
                      </h4>
                      <ul className="list-disc list-inside text-xs text-green-900 space-y-1">
                        {result.swot.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                      <h4 className="font-bold text-red-800 text-sm mb-2 flex items-center gap-1">
                        <AlertCircle size={16} /> WEAKNESSES
                      </h4>
                      <ul className="list-disc list-inside text-xs text-red-900 space-y-1">
                        {result.swot.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-1">
                        <Lightbulb size={16} /> OPPORTUNITIES
                      </h4>
                      <ul className="list-disc list-inside text-xs text-blue-900 space-y-1">
                         {result.swot.opportunities.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                      <h4 className="font-bold text-orange-800 text-sm mb-2 flex items-center gap-1">
                        <AlertCircle size={16} /> THREATS
                      </h4>
                      <ul className="list-disc list-inside text-xs text-orange-900 space-y-1">
                         {result.swot.threats.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* Improvements List */}
                  <div className="bg-gradient-to-r from-brand-50 to-white p-6 rounded-2xl border border-brand-100">
                     <h3 className="text-lg font-bold text-brand-800 mb-4 flex items-center gap-2">
                       <CheckCircle2 className="text-brand-600" /> Recommended Improvements
                     </h3>
                     <div className="space-y-4">
                       {result.improvements.map((imp, idx) => (
                         <div key={idx} className="flex gap-3 items-start">
                           <div className="min-w-[24px] h-6 rounded-full bg-brand-200 text-brand-700 flex items-center justify-center text-xs font-bold mt-0.5">
                             {idx + 1}
                           </div>
                           <div>
                             <h4 className="text-sm font-bold text-slate-800">{imp.title}</h4>
                             <p className="text-sm text-slate-600 mt-1">{imp.description}</p>
                           </div>
                         </div>
                       ))}
                     </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Reviews & Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Reviews */}
              <section className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-1 h-8 bg-yellow-500 rounded-full"></div>
                  {t.sections.reviews}
                </h2>
                <div className="grid gap-4">
                   {result.reviews.map((review, idx) => (
                     <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex gap-4">
                       <div className="min-w-[40px] h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                         <MessageSquare size={20} />
                       </div>
                       <div>
                         <div className="flex items-center gap-2 mb-1">
                           <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{review.source}</span>
                           <div className="flex text-yellow-400 text-xs">
                             {"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}
                           </div>
                         </div>
                         <p className="text-sm text-slate-600 italic">"{review.content}"</p>
                       </div>
                     </div>
                   ))}
                </div>
              </section>

               {/* Sources */}
               <section className="lg:col-span-1">
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-1 h-8 bg-slate-500 rounded-full"></div>
                  {t.sections.sources}
                </h2>
                <div className="bg-slate-800 text-slate-300 p-6 rounded-2xl">
                   <ul className="space-y-3">
                     {result.sources.map((src, idx) => (
                       <li key={idx} className="flex items-start gap-2">
                         <Globe size={14} className="mt-1 shrink-0 text-brand-400" />
                         <a href={src} target="_blank" rel="noopener noreferrer" className="text-xs hover:text-brand-300 break-all transition-colors">
                           {src}
                         </a>
                       </li>
                     ))}
                     {result.sources.length === 0 && (
                       <li className="text-xs text-slate-500 italic">Analysis based on AI internal knowledge and provided inputs.</li>
                     )}
                   </ul>
                </div>
              </section>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;
