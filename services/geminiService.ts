import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { AnalysisResult } from "../types";

// IMPORTANT: API Key should be in process.env.API_KEY
// For this generated code to work in a preview environment, we assume the env var is set.

export const analyzeProduct = async (
  text: string,
  mediaFile: File | null,
  language: string
): Promise<AnalysisResult> => {
  
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Using gemini-2.5-flash for speed and multimodal capabilities
  // We enable googleSearch to get real market data for benchmarking
  const modelId = "gemini-2.5-flash";

  let base64Data: string | null = null;
  let mimeType: string | null = null;

  if (mediaFile) {
    base64Data = await fileToBase64(mediaFile);
    mimeType = mediaFile.type;
  }

  // Construct the user prompt based on language and input
  const userPrompt = `
    Input Query: ${text}
    Target Language: ${language} (Translate all output content to this language).
    
    If an image is provided, analyze the packaging for ingredients and product details.
    If audio is provided, transcribe it and treat it as the product description.
    
    Perform the SweetTech R&D analysis as defined in the system instruction.
    Use Google Search to find real competitors and prices if possible.
  `;

  const parts: any[] = [{ text: userPrompt }];

  if (base64Data && mimeType) {
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }], // Enable grounding
        temperature: 0.4, // Keep it relatively factual
      },
      contents: {
        parts: parts,
      },
    });

    // Extract text
    let resultText = response.text || "";

    // Clean up potential Markdown code blocks if the model ignores the "ONLY JSON" instruction
    resultText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();

    // Parse JSON
    const data: AnalysisResult = JSON.parse(resultText);
    
    // Extract grounding metadata if available to populate sources
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: string[] = [];
    
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
         if (chunk.web?.uri) {
           sources.push(chunk.web.uri);
         }
      });
    }
    
    // Merge sources into the data object if not already present or to append
    if (sources.length > 0) {
        data.sources = Array.from(new Set([...(data.sources || []), ...sources]));
    }

    return data;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze product. Please try again.");
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the "data:*/*;base64," prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};
