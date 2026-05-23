import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API key is missing in .env.local!" }, { status: 500 });
    }

    const prompt = `
      You are an expert data entry assistant for a restaurant POS system.
      Read this menu image carefully and extract all the food and drink items.
      Return ONLY a raw JSON array of objects.
      
      Each object MUST have exactly these keys:
      "name" (string: the name of the dish),
      "category" (string: e.g., "VEG", "NON-VEG"),
      "price" (number: the price as a raw number without currency symbols),
      "description" (string: brief ingredients or empty string if none)
    `;

    // THE RAW FETCH OVERRIDE - Bypassing the NPM package completely
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    // If Google still throws an error, catch the exact message
    if (!response.ok) {
      throw new Error(data.error?.message || "Google API rejected the request.");
    }

    // Safely extract the text from the raw response
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // BULLETPROOF PARSING
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        throw new Error("AI did not return a valid JSON array.");
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error("Gemini Raw Fetch Error:", error.message); 
    return NextResponse.json({ success: false, error: error.message || "Failed to read menu" }, { status: 500 });
  }
}