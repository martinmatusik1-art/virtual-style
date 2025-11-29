import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI(process.env.API_KEY!);

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
    const model = "gemini-2.5-flash-image";

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

    const response = await ai
      .getGenerativeModel({ model })
      .generateContent({
        contents: [
          { parts: [{ text: prompt }] },
          {
            parts: [
              {
                inlineData: {
                  mimeType: personMime,
                  data: personBase64
                }
              }
            ]
          },
          {
            parts: [
              {
                inlineData: {
                  mimeType: clothingMime,
                  data: clothingBase64
                }
              }
            ]
          }
        ]
      });

    const parts = response.response.candidates?.[0]?.content.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error(
      "Model did not return an image. It might have refused the request due to safety policies."
    );
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
