/**
 * Sends the person image and clothing image to our own backend API.
 * The backend then communicates securely with Gemini.
 */
export const generateTryOnImage = async (
  personBase64: string,
  personMime: string,
  clothingBase64: string,
  clothingMime: string
): Promise<string> => {
  try {
    const response = await fetch('/api/try-on', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personBase64,
        personMime,
        clothingBase64,
        clothingMime,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.resultUrl) {
      throw new Error("Server did not return an image.");
    }

    return data.resultUrl;

  } catch (error) {
    console.error("Try-On Service Error:", error);
    throw error;
  }
};
