// src/services/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const key = process.env.REACT_APP_GEMINI_API_KEY;
let genAI = null;
if (key) {
  genAI = new GoogleGenerativeAI(key);
}

export async function askGemini(prompt) {
  if (!genAI) return "Gemini not configured.";
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const res = await model.generateContent(prompt);
  return res.response.text();
}

/** Friendly ice‑breaker tailored to profile & context */
export async function suggestOpener({ me, them, lastMessage }) {
  const base = `
You are a witty but respectful dating coach. Write ONE short opening message (max 160 chars), friendly, specific, and easy to reply to.
Avoid anything cringy or over-flirty. Prefer a question.
My profile: ${JSON.stringify(me || {})}
Their profile: ${JSON.stringify(them || {})}
${lastMessage ? `Latest chat message context: ${lastMessage}` : ""}
Return only the message text.
  `.trim();
  try {
    const text = await askGemini(base);
    return text?.trim() || "Hi! 👋";
  } catch {
    return "Hi! 👋";
  }
}
