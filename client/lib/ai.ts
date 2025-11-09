const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = "models/gemini-2.5-flash";

if (!GEMINI_KEY) {
  console.warn("VITE_GEMINI_API_KEY not set; Gemini AI disabled");
}

export async function generateText(prompt: string) {
  if (!GEMINI_KEY) {
    return null;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 256,
        topP: 0.95,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      console.error("Gemini API error:", res.status);
      return null;
    }

    const json = await res.json();

    // Extract text from response
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.warn("No text in Gemini response");
      return null;
    }

    return text;
  } catch (error) {
    console.error("Error in generateText:", error);
    return null;
  }
}
