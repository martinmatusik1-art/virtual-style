import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sends the person image and clothing image to Gemini to generate a composite image.
 */
export const generateTryOnImage = async (
  personBase64: string,
  personMime: string,
  clothingBase64: string,
  clothingMime: string
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash-image'; 

    // Instructions for the model
    const prompt = `
      You are an expert fashion stylist and image editor.
      
      Task:
      Generate a realistic image of the person provided in the first image wearing the garment provided in the second image.
      
      Requirements:
      1. Preserve the person's identity, pose, body shape, and skin tone exactly as they appear in the first image.
      2. Replace the person's current clothing with the garment from the second image.
      3. Adapt the garment to fit the person's body naturally (wrinkles, lighting, drape).
      4. The background should remain consistent with the person's original photo if possible, or be a neutral studio background.
      5. Output ONLY the image.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            text: prompt
          },
          {
            inlineData: {
              mimeType: personMime,
              data: personBase64
            }
          },
          {
            inlineData: {
              mimeType: clothingMime,
              data: clothingBase64
            }
          }
        ]
      }
    });

    // Check for image in the response parts
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("Model did not return an image. It might have refused the request due to safety policies.");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};