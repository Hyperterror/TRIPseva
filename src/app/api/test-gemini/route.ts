import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * GET /api/test-gemini
 * Simple test endpoint to verify Gemini API is working
 */
export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "GEMINI_API_KEY not found in environment variables"
      }, { status: 500 });
    }

    console.log("[Test Gemini] API Key found, length:", apiKey.length);
    console.log("[Test Gemini] API Key starts with:", apiKey.substring(0, 10));

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Simple test prompt
    const prompt = "Say 'Hello from Gemini!' in one sentence.";
    
    console.log("[Test Gemini] Sending test prompt...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log("[Test Gemini] Success! Response:", text);

    return NextResponse.json({
      success: true,
      message: "Gemini API is working!",
      response: text,
      apiKeyLength: apiKey.length
    }, { status: 200 });

  } catch (error: any) {
    console.error("[Test Gemini] Error:", error);
    console.error("[Test Gemini] Error message:", error.message);
    console.error("[Test Gemini] Error stack:", error.stack);

    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error",
      errorType: error.name || "Error",
      details: error.toString()
    }, { status: 500 });
  }
}
