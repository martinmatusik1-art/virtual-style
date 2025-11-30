import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'edge', // Use Edge runtime for faster cold starts
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { personBase64, personMime, clothingBase64, clothingMime } = await request.json();

    if (!process.env.API_KEY) {
      return new Response(JSON.stringify({ error: 'Server configuration error: API Key missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash-image';

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
          { text: prompt },
          { inlineData: { mimeType: personMime, data: personBase64 } },
          { inlineData: { mimeType: clothingMime, data: clothingBase64 } }
        ]
      }
    });

    // Extract image
    let resultImage = null;
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          resultImage = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!resultImage) {
      throw new Error("Model did not return an image.");
    }

    return new Response(JSON.stringify({ resultUrl: resultImage }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
