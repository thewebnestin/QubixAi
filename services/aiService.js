const { geminiClient } = require('../config/ai');
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
      .filter(msg => msg.id !== 'welcome')
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
        console.error(`[ChatService] Gemini API call failed: ${geminiError.message}. Falling back to simulated response.`);
        return this.getSimulatedFallback(message);
      }
    } else {
      // Simulated response if no API keys are configured
      console.log(`[ChatService] ${new Date().toISOString()} Simulating response (No GEMINI_API_KEY configured)`);
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.getSimulatedFallback(message));
        }, 800);
      });
    }
  }

  static getSimulatedFallback(message) {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('plan')) {
      return "Webnest Studio offers three premium pricing plans designed to elevate your digital presence:\n\n*   **Startup Plan ($999):** Core custom UI design, full responsive development, basic SEO, and basic contact form setup.\n*   **Growth Plan ($1,999):** Advanced page animations, CMS integrations, custom blog, and one custom external API sync.\n*   **Enterprise Plan ($3,999+):** Custom web application, custom database design, administrative dashboard panel, priority SLA support, and Qubix AI chatbot integration.";
    } else if (lowerMsg.includes('service') || lowerMsg.includes('offer') || lowerMsg.includes('do')) {
      return "Webnest specializes in the following core services:\n\n*   **Custom Web Design & UI/UX**: High-end visuals and fluid web animations.\n*   **Web & Web App Development**: Solid Next.js, React, and Node.js solutions.\n*   **AI Automations & Integrations**: Custom chat systems (Qubix AI), CRM syncs, and automated notification services.\n*   **E-Commerce Solutions**: Modern storefronts, payments, and checkout flows.";
    } else if (lowerMsg.includes('contact') || lowerMsg.includes('email') || lowerMsg.includes('reach') || lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
      return "Hello! You can reach the Webnest team at Hello@webnest.studio, or submit your project details using the 'Start a Project' tab in the navigation menu.";
    } else if (lowerMsg.includes('project') || lowerMsg.includes('portfolio') || lowerMsg.includes('work')) {
      return "We have delivered several premium digital projects:\n\n*   **Verta**: A modern product showcase landing layout with responsive card animations.\n*   **BloomAtelier**: An elegant e-commerce design and branding storefront representing luxury products.\n*   **Sharaco**: A high-performing web-based POS SaaS system equipped with sales metrics and responsive dashboard analytics.";
    }
    
    return "I am here to assist you with Webnest Studio's details, custom requests, or general inquiries. Please let me know how I can help!";
  }
}

module.exports = AIService;
