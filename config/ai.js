const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

// Initialize Google Gemini SDK (Free tier available on Google AI Studio)
let geminiClient = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiClient = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    console.log(`[Gemini] ${new Date().toISOString()} Google Gemini SDK initialized successfully`);
  } catch (err) {
    console.error(`[Gemini] Failed to initialize Gemini SDK:`, err.message);
  }
}

// Initialize Groq SDK (using NEXT_GROQ_API_KEY, GROQ_API_KEY, or GROK_API_KEY)
let groqClient = null;
const groqApiKey = process.env.NEXT_GROQ_API_KEY || process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
if (groqApiKey && groqApiKey !== 'your_groq_api_key_here' && groqApiKey !== 'your_grok_api_key_here') {
  try {
    groqClient = new Groq({ apiKey: groqApiKey });
    console.log(`[Groq] ${new Date().toISOString()} Groq SDK initialized successfully`);
  } catch (err) {
    console.error(`[Groq] Failed to initialize Groq SDK:`, err.message);
  }
}

module.exports = {
  geminiClient,
  groqClient
};
