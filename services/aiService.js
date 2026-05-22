const { geminiClient, groqClient } = require('../config/ai');
const KnowledgeModel = require('../models/knowledgeModel');

class AIService {
  static async generateChatResponse(message, history) {
    // 1. Fetch Knowledge Base Context
    const kb = await KnowledgeModel.getAll();
    const kbContext = kb.map(item => `### ${item.title}\n${item.content}`).join('\n\n');

    const systemPrompt = `You are Qubix AI, the virtual AI assistant for Webnest Studio.
Webnest is a premium digital design and web development agency.
Your task is to answer user queries politely, professionally, and concisely using the details provided below.

=== WEBNEST DETAILS ===
${kbContext}
=======================

GUIDELINES:
1. Always state facts from the provided details when answering questions about Webnest's services, pricing, portfolio, and contact info.
2. Answer all user queries politely, professionally, and helpfully. You are authorized to answer general knowledge questions, coding/programming help, or custom requests alongside queries about Webnest Studio.
3. Keep your tone sleek, futuristic, welcoming, and professional.
4. Keep answers relatively concise (1-3 paragraphs) as they render in a small chat window.
5. NEVER expose internal server details, database schemas, Firestore paths, private keys, API configurations, or code tracebacks to the user.`;
    // 2. Format history for Google Gemini API: [{ role: 'user'|'model', parts: [{ text: '...' }] }]
    // Ensure roles strictly alternate to satisfy Gemini API constraints. Merge consecutive messages from the same sender.
    const geminiHistory = [];
    let lastRole = null;

    (history || [])
      .filter(msg => msg.id !== 'welcome' && msg.text)
      .forEach(msg => {
        const role = msg.sender === 'user' ? 'user' : 'model';
        if (role !== lastRole) {
          geminiHistory.push({
            role: role,
            parts: [{ text: msg.text }]
          });
          lastRole = role;
        } else if (geminiHistory.length > 0) {
          geminiHistory[geminiHistory.length - 1].parts[0].text += "\n" + msg.text;
        }
      });

    // 3. Dispatch to Gemini client if available
    if (geminiClient) {
      console.log(`[ChatService] ${new Date().toISOString()} Generating response using Google Gemini (gemini-2.5-flash-lite)`);
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash-lite",
          systemInstruction: systemPrompt
        });

        const chatOptions = {};
        if (geminiHistory.length > 0) {
          chatOptions.history = geminiHistory;
        }

        const chat = model.startChat(chatOptions);
        const response = await chat.sendMessage(message);
        return response.response.text();
      } catch (geminiError) {
        console.error(`[ChatService] Gemini API call failed: ${geminiError.message}.`);
        const isRateLimit = geminiError.message.includes('429') || 
                            geminiError.message.toLowerCase().includes('quota') || 
                            geminiError.message.toLowerCase().includes('limit') || 
                            geminiError.message.toLowerCase().includes('exhausted');

        if (isRateLimit && groqClient) {
          console.log(`[ChatService] ${new Date().toISOString()} Gemini rate limit hit. Falling back to Groq LLM (llama-3.3-70b-versatile)...`);
          try {
            const groqMessages = [
              { role: 'system', content: systemPrompt }
            ];

            (history || [])
              .filter(msg => msg.id !== 'welcome' && msg.text)
              .forEach(msg => {
                const role = msg.sender === 'user' ? 'user' : 'assistant';
                if (groqMessages.length > 0 && groqMessages[groqMessages.length - 1].role === role) {
                  groqMessages[groqMessages.length - 1].content += "\n" + msg.text;
                } else {
                  groqMessages.push({
                    role: role,
                    content: msg.text
                  });
                }
              });

            groqMessages.push({
              role: 'user',
              content: message
            });

            const chatCompletion = await groqClient.chat.completions.create({
              messages: groqMessages,
              model: 'llama-3.3-70b-versatile',
              temperature: 0.7,
              max_tokens: 1024
            });

            if (chatCompletion.choices && chatCompletion.choices[0] && chatCompletion.choices[0].message) {
              console.log(`[ChatService] Response generated successfully using Groq fallback.`);
              return chatCompletion.choices[0].message.content;
            }
          } catch (groqError) {
            console.error(`[ChatService] Groq API call failed: ${groqError.message}.`);
          }
        }

        console.log(`[ChatService] Falling back to database response matching.`);
        return this.getDatabaseFallback(message, kb);
      }
    } else {
      // Simulated response if no API keys are configured
      console.log(`[ChatService] ${new Date().toISOString()} Simulating response (No GEMINI_API_KEY configured)`);
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.getDatabaseFallback(message, kb));
        }, 800);
      });
    }
  }

  static getDatabaseFallback(message, kb) {
    const lowerMsg = message.toLowerCase();
    
    // 1. Try exact keyword matching on titles first
    for (const item of kb) {
      if (!item || typeof item.title !== 'string' || typeof item.content !== 'string') continue;
      const lowerTitle = item.title.toLowerCase();
      if (lowerMsg.includes('pric') || lowerMsg.includes('cost') || lowerMsg.includes('plan')) {
        if (lowerTitle.includes('price') || lowerTitle.includes('plan')) return item.content;
      }
      if (lowerMsg.includes('service') || lowerMsg.includes('offer') || lowerMsg.includes('do')) {
        if (lowerTitle.includes('service') || lowerTitle.includes('offer')) return item.content;
      }
      if (lowerMsg.includes('contact') || lowerMsg.includes('email') || lowerMsg.includes('reach') || lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
        if (lowerTitle.includes('contact') || lowerTitle.includes('support')) return item.content;
      }
      if (lowerMsg.includes('project') || lowerMsg.includes('portfolio') || lowerMsg.includes('work')) {
        if (lowerTitle.includes('project') || lowerTitle.includes('portfolio')) return item.content;
      }
      if (lowerMsg.includes('about') || lowerMsg.includes('who') || lowerMsg.includes('webnest') || lowerMsg.includes('qubix')) {
        if (lowerTitle.includes('about') || lowerTitle.includes('agency')) return item.content;
      }
    }
    
    // 2. Fallback to token matching score
    let bestMatch = null;
    let maxMatchScore = 0;
    
    for (const item of kb) {
      if (!item || typeof item.title !== 'string' || typeof item.content !== 'string') continue;
      const titleWords = item.title.toLowerCase().split(/[^a-z0-9]+/);
      let score = 0;
      for (const word of titleWords) {
        if (word.length > 2 && lowerMsg.includes(word)) {
          score += 10;
        }
      }
      const contentWords = item.content.toLowerCase().split(/[^a-z0-9]+/);
      for (const word of contentWords) {
        if (word.length > 3 && lowerMsg.includes(word)) {
          score += 1;
        }
      }
      if (score > maxMatchScore) {
        maxMatchScore = score;
        bestMatch = item;
      }
    }
    
    if (bestMatch && maxMatchScore > 0) {
      return bestMatch.content;
    }
    
    // 3. Default general response
    return "I am here to assist you with Webnest Studio's details, custom requests, or general inquiries. Please let me know how I can help!";
  }
}

module.exports = AIService;
