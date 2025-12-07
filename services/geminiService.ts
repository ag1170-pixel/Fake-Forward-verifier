import { GoogleGenAI } from "@google/genai";
import { VerificationResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper to reliably parse JSON from AI responses that might include markdown or chatter.
 */
const parseJSON = (text: string): any => {
  try {
    // 1. Try direct parse
    return JSON.parse(text);
  } catch (e) {
    // 2. Extract content between first { and last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonCandidate = text.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(jsonCandidate);
      } catch (e2) {
        // 3. Cleanup common markdown issues
        const cleaned = jsonCandidate.replace(/\\n/g, " ").replace(/\\"/g, '"');
        return JSON.parse(cleaned);
      }
    }
    throw new Error("No JSON object found in response");
  }
};

/**
 * Step 1: Verify the text using Gemini 3 Pro with Google Search Grounding
 */
export const verifyText = async (text: string): Promise<VerificationResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are an expert fact-checker. Your task is to verify this claim: "${text}"

      PROTOCOL:
      1. Use the Google Search tool to find recent and credible evidence.
      2. If the claim is scientifically impossible (e.g., "The sun is green") or obviously false, verify it as "False" immediately, even if specific news articles don't exist.
      3. If the claim is a known hoax/satire, mark it "False" or "Misleading".
      4. If true, mark "True".
      
      OUTPUT FORMAT:
      Return ONLY a raw JSON object. Do not output Markdown code blocks.
      {
        "verdict": "True" | "False" | "Unverified" | "Misleading",
        "confidence": number (0-100),
        "explanation": "A professional, direct explanation of the facts. Max 3 sentences.",
        "category": "Medical" | "Financial" | "Political" | "Science" | "Other"
      }`,
      config: {
        tools: [{ googleSearch: {} }],
        // Note: responseMimeType is not compatible with googleSearch tools in this version
        systemInstruction: "You are a strict, logical fact-checker. You prioritize official sources (NASA, WHO, Gov sites). You do not hedge on obvious facts. Your output is always valid JSON."
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from verification model");
    
    let parsedResult;
    try {
        parsedResult = parseJSON(resultText);
    } catch (e) {
        console.error("JSON Parse Failure", resultText);
        // Instead of defaulting to 'Unverified', throw a specific error to the UI
        throw new Error("The AI verification response was malformed or incomplete. This can happen with ambiguous inputs or temporary service glitches. Please try again.");
    }

    // Extract citations from grounding metadata
    const citations: { title: string; url: string; }[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      for (const chunk of response.candidates[0].groundingMetadata.groundingChunks) {
        if (chunk.web?.uri) {
          citations.push({
            title: chunk.web.title || "Source Link",
            url: chunk.web.uri
          });
        }
      }
    }

    return {
        verdict: parsedResult.verdict || 'Unverified',
        confidence: parsedResult.confidence || 0,
        explanation: parsedResult.explanation || "No explanation provided.",
        category: parsedResult.category || 'Other',
        citations: citations,
        summary: parsedResult.summary
    };
  } catch (error: any) {
    console.error("Verification Error:", error);
    // Propagate specific errors if they are user-friendly, otherwise generic
    if (error.message && (error.message.includes("malformed") || error.message.includes("No response"))) {
        throw error;
    }
    throw new Error("Failed to process verification request. Please check your internet connection or try again later.");
  }
};

/**
 * Step 2: Generate a short summary using a lightweight model
 */
export const generateSummary = async (explanation: string, verdict: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a 10-word warning/confirmation for a user about this fact-check: Verdict: ${verdict}, Details: ${explanation}. Be urgent and clear.`,
    });
    return response.text || "Check verified sources.";
  } catch (error) {
    return "Verification complete.";
  }
};

/**
 * Helper: Perform OCR on an image
 */
export const performOCR = async (base64Data: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: "Transcribe the text in this image. Ignore visual noise." }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to read text from image. Ensure the image is clear.");
  }
};