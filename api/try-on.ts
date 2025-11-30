import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

export const config = {
  runtime: 'edge',
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
      4. The background should remain consistent with the person's original photo.
      5. Output ONLY the image.
    `;

    // 1. ZMENA: Pridanie configu pre Safety Settings (aby neblokoval ľudí)
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: personMime, data: personBase64 } },
          { inlineData: { mimeType: clothingMime, data: clothingBase64 } }
        ]
      },
      config: {
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      }
    });

    // 2. ZMENA: Bezpečné vybratie obrázku pomocou otáznikov (?.), aby aplikácia nespadla
    let resultImage = null;
    
    const candidates = response.candidates;
    // Skontrolujeme či máme kandidátov A či prvý kandidát má obsah
    const parts = candidates?.[0]?.content?.parts;

    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          resultImage = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!resultImage) {
      console.log("Full AI Response for debugging:", JSON.stringify(response, null, 2));
      
      // Ak model zablokoval odpoveď kvôli Safety, candidates existuje ale je prázdne alebo má finishReason
      if (candidates?.[0]?.finishReason) {
        throw new Error(`AI model zablokoval generovanie. Dôvod: ${candidates[0].finishReason}`);
      }
      
      throw new Error("Model nevrátil obrázok. Skúste inú fotku.");
    }

    return new Response(JSON.stringify({ resultUrl: resultImage }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("API Error Details:", error);
    
    let errorMessage = error.message || 'Internal Server Error';

    if (JSON.stringify(error).includes('SERVICE_DISABLED') || errorMessage.includes('Generative Language API has not been used')) {
      errorMessage = "Google API nie je povolené. Prosím skontrolujte Google Cloud Console.";
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
