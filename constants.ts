import { Language } from "./types";

export const TRANSLATIONS = {
  [Language.VN]: {
    title: "SweetTech R&D Mate",
    subtitle: "Trợ lý R&D Ngành Bánh Kẹo",
    inputPlaceholder: "Nhập tên sản phẩm, mô tả hoặc tải lên hình ảnh/âm thanh...",
    analyzeBtn: "Phân Tích Ngay",
    analyzing: "Đang phân tích dữ liệu thị trường và thành phần...",
    uploadLabel: "Tải ảnh/âm thanh",
    sections: {
      profile: "Hồ sơ sản phẩm",
      ingredients: "Phân tích nguyên liệu",
      specs: "Chỉ số kỹ thuật (Ước tính)",
      benchmark: "So sánh đối thủ",
      insights: "R&D Insights & Cải tiến",
      reviews: "Đánh giá khách hàng",
      sources: "Nguồn dữ liệu"
    },
    tableHeaders: {
      competitor: "Sản phẩm",
      price: "Giá/100g",
      usp: "Điểm bán hàng (USP)",
      sensory: "Cảm quan",
      nutrition: "Dinh dưỡng"
    }
  },
  [Language.EN]: {
    title: "SweetTech R&D Mate",
    subtitle: "Confectionery R&D Assistant",
    inputPlaceholder: "Enter product name, description, or upload image/audio...",
    analyzeBtn: "Analyze Now",
    analyzing: "Analyzing market data and ingredients...",
    uploadLabel: "Upload Media",
    sections: {
      profile: "Product Profile",
      ingredients: "Ingredient Analysis",
      specs: "Tech Specs (Est.)",
      benchmark: "Benchmarking",
      insights: "R&D Insights & Improvements",
      reviews: "Consumer Reviews",
      sources: "Data Sources"
    },
    tableHeaders: {
      competitor: "Product",
      price: "Price/100g",
      usp: "USP",
      sensory: "Sensory",
      nutrition: "Nutrition"
    }
  },
  [Language.KR]: {
    title: "SweetTech R&D Mate",
    subtitle: "제과 R&D 어시스턴트",
    inputPlaceholder: "제품명, 설명을 입력하거나 이미지/오디오를 업로드하세요...",
    analyzeBtn: "분석 시작",
    analyzing: "시장 데이터 및 성분 분석 중...",
    uploadLabel: "미디어 업로드",
    sections: {
      profile: "제품 프로필",
      ingredients: "성분 분석",
      specs: "기술 사양 (추정)",
      benchmark: "경쟁사 벤치마킹",
      insights: "R&D 인사이트 및 개선",
      reviews: "고객 리뷰",
      sources: "데이터 출처"
    },
    tableHeaders: {
      competitor: "제품",
      price: "가격/100g",
      usp: "USP",
      sensory: "관능",
      nutrition: "영양성분"
    }
  }
};

export const SYSTEM_INSTRUCTION = `
You are "SweetTech R&D Mate", an AI expert for the Confectionery R&D industry. 
Your task is to analyze product inputs (text/image) and generate a structured R&D report.

Follow these strict steps:
1.  **Product Profiling:** Identify Name, Brand, Weight, Price, Type, Origin. List ingredients. Identify E-numbers (Codex) and explain their function. Estimate Moisture, Brix, Texture, Flavor.
2.  **Benchmarking:** Find 3 direct competitors (Prioritize Vietnam/Asia markets). Compare Price/100g, USP, Sensory (Sweet/Sour/Texture), Nutrition (Energy, Sugar, Fat, Salt).
3.  **Insights:** 
    - Generate data for a Radar Chart (1-10 scale) for: Sweetness, Sourness, Aroma, Hardness/Chewiness, Appearance.
    - SWOT Analysis.
    - 3 Specific R&D Improvement Ideas (e.g., substitute ingredients, new flavors).
4.  **Reviews:** Find or simulate realistic customer reviews based on the product type.

**OUTPUT FORMAT:**
Return **ONLY** raw JSON data. Do not use Markdown code blocks (\`\`\`json).
The JSON must match this structure:
{
  "profile": {
    "name": "...", "brand": "...", "netWeight": "...", "price": "...", "type": "...", "origin": "...",
    "ingredients": ["..."],
    "additives": [{"code": "E123", "name": "...", "function": "..."}],
    "specs": { "moisture": "...", "brix": "...", "texture": "...", "flavorProfile": "..." }
  },
  "competitors": [
    {
      "name": "...", "pricePer100g": "...", "usp": "...",
      "sensory": { "sweetness": "...", "texture": "...", "aftertaste": "..." },
      "nutrition": { "energy": "...", "sugar": "...", "fat": "...", "salt": "..." }
    }
  ],
  "radarChart": [
    { "subject": "Sweetness", "A": 8, "fullMark": 10 },
    { "subject": "Sourness", "A": 4, "fullMark": 10 },
    { "subject": "Aroma", "A": 7, "fullMark": 10 },
    { "subject": "Texture", "A": 9, "fullMark": 10 },
    { "subject": "Appearance", "A": 8, "fullMark": 10 }
  ],
  "swot": { "strengths": [], "weaknesses": [], "opportunities": [], "threats": [] },
  "improvements": [{ "title": "...", "description": "..." }],
  "reviews": [{ "source": "Shopee", "content": "...", "rating": 5 }],
  "sources": ["url1", "url2"]
}
`;
