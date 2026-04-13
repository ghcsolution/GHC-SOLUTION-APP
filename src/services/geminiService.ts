import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface ExtractedItem {
  material: string;
  quantidade: number;
}

export interface ExtractionResult {
  itens: ExtractedItem[];
}

export const extractMaterialsFromImage = async (base64Image: string): Promise<ExtractionResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("Chave da API Gemini não configurada. Por favor, adicione sua GEMINI_API_KEY_1 nas configurações (Secrets).");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Remove data:image/jpeg;base64, prefix if present
  const base64Data = base64Image.split(',')[1] || base64Image;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview", // Using Pro for better table extraction
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            },
          },
          {
            text: "Extraia os materiais e quantidades desta imagem em uma lista JSON estruturada.",
          },
        ],
      },
      config: {
        systemInstruction: `Você é um extrator de dados logísticos especializado em romaneios. Sua tarefa é ler imagens de documentos e extrair APENAS o código do material e a respectiva quantidade.

Regras Estritas:
- Ignore cabeçalhos, datas e números de Handling Unit.
- Identifique a coluna "Material" e "Qtde" (ou Quantidade).
- Se um material aparecer sem posição ou HU, extraia-o da mesma forma.
- Converta vírgulas decimais em pontos (ex: 0,34 vira 0.34).
- Retorne os dados exclusivamente em formato JSON.
- Estrutura esperada: {"itens": [{"material": "STRING", "quantidade": NUMBER}]}`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itens: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  material: { type: Type.STRING },
                  quantidade: { type: Type.NUMBER },
                },
                required: ["material", "quantidade"],
              },
            },
          },
          required: ["itens"],
        },
      },
    });

    if (!response.text) {
      throw new Error("A IA não retornou nenhum texto.");
    }

    const result = JSON.parse(response.text);
    return result as ExtractionResult;
  } catch (error: any) {
    console.error("Erro detalhado do Gemini:", error);
    
    // Handle common API errors
    if (error.message?.includes("API key not valid")) {
      throw new Error("Chave da API Gemini inválida.");
    }
    if (error.message?.includes("quota")) {
      throw new Error("Cota da API Gemini excedida.");
    }
    
    throw new Error(error.message || "Erro desconhecido ao processar a imagem.");
  }
};
