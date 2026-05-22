const { GoogleGenerativeAI } = require('@google/generative-ai');

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

module.exports = {
  geminiClient
};
