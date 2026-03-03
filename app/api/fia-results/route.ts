import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { gpName } = await request.json();
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the official FIA results for the 2026 ${gpName}. 
      I need the top 3 finishers, any drivers who DNF'd (retired), any drivers who received post-race penalties, 
      and any drivers who started from 11th or lower on the grid but finished in the top 10.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            p1: { type: Type.STRING },
            p2: { type: Type.STRING },
            p3: { type: Type.STRING },
            dnfs: { type: Type.ARRAY, items: { type: Type.STRING } },
            penalties: { type: Type.ARRAY, items: { type: Type.STRING } },
            rimonte: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["p1", "p2", "p3", "dnfs", "penalties", "rimonte"]
        }
      }
    });

    return NextResponse.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch FIA results" }, { status: 500 });
  }
}
