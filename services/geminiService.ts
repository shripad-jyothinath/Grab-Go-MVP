import { GoogleGenAI, Type } from "@google/genai";

// Safe access helper
const getApiKey = () => {
    try {
        // @ts-ignore
        return typeof process !== 'undefined' ? process.env.API_KEY : '';
    } catch {
        return '';
    }
}

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const parseMenuFromImage = async (base64Image: string): Promise<any[]> => {
  try {
    const modelId = "gemini-2.5-flash"; // Efficient for OCR/Extraction tasks

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: "image/jpeg", // Assuming JPEG for simplicity, can be dynamic
            },
          },
          {
            text: "Analyze this menu image. Extract all food and drink items. Return a JSON list where each item has: 'name' (string), 'description' (string, keep it short), 'price' (number), and 'category' (string, e.g., 'Starters', 'Mains', 'Drinks'). If a price is not found, estimate or set to 0.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              price: { type: Type.NUMBER },
              category: { type: Type.STRING },
            },
            required: ["name", "price", "category"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to process menu image.");
  }
};