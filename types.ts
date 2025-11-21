export enum Language {
  VN = 'vi',
  EN = 'en',
  KR = 'ko'
}

export interface ProductSpecs {
  moisture?: string;
  brix?: string;
  texture?: string;
  flavorProfile?: string;
}

export interface ProductProfile {
  name: string;
  brand: string;
  netWeight: string;
  price: string;
  type: string;
  origin: string;
  importer?: string;
  ingredients: string[];
  additives: Array<{ code: string; name: string; function: string }>; // E-numbers analysis
  specs: ProductSpecs;
}

export interface Competitor {
  name: string;
  pricePer100g: string;
  usp: string; // Key Selling Point
  sensory: {
    sweetness: string;
    texture: string;
    sourness?: string;
    aftertaste: string;
  };
  nutrition: {
    energy: string;
    sugar: string;
    fat: string;
    salt: string;
  };
}

export interface RadarData {
  subject: string; // e.g., "Sweetness", "Sourness"
  A: number; // Score 1-10
  fullMark: number;
}

export interface SWOT {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface Review {
  source: string;
  content: string;
  rating: number; // 1-5
}

export interface AnalysisResult {
  profile: ProductProfile;
  competitors: Competitor[];
  radarChart: RadarData[];
  swot: SWOT;
  improvements: Array<{ title: string; description: string }>;
  reviews: Review[];
  sources: string[];
}

export interface ProcessingState {
  status: 'idle' | 'analyzing' | 'complete' | 'error';
  message?: string;
}
