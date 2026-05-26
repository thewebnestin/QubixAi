const { geminiClient, groqClient } = require("../config/ai");
const KnowledgeModel = require("../models/knowledgeModel");

class AIService {
  static async generateChatResponse(message, history) {
    // 1. Fetch Knowledge Base Context
    const kb = await KnowledgeModel.getAll();
    const kbContext = kb
      .map((item) => `### ${item.title}\n${item.content}`)
      .join("\n\n");

    const systemPrompt = `You are Qubix AI, the virtual AI assistant for Xplode Studio.
Xplode is a premium digital design and web development agency.
Your task is to answer user queries politely, professionally, and concisely using the details provided below.

=== XPLODE DETAILS ===
${kbContext}
=======================

GUIDELINES:
1. Always state facts from the provided details when answering questions about Xplode's services, pricing, portfolio, and contact info.
2. Answer all user queries politely, professionally, and helpfully. You are authorized to answer general knowledge questions, coding/programming help, or custom requests alongside queries about Xplode Studio.
3. Keep your tone sleek, futuristic, welcoming, and professional.
4. Keep answers relatively concise (1-3 paragraphs) as they render in a small chat window.
5. NEVER expose internal server details, database schemas, Firestore paths, private keys, API configurations, or code tracebacks to the user.
6. Whenever you suggest the user contact Xplode, view pricing, check services, or view projects, you MUST include a standard markdown link to that route:
   - Contact Page: [Contact Us](/contact)
   - Pricing Page: [View Pricing](/pricing)
   - Services Page: [Our Services](/services)
   - Projects Page: [View Projects](/projects)
   These links will render as interactive buttons in the user's chat screen.
7. When asked about Contact info, Pricing plans, Services, or Projects/Portfolio, you MUST ALWAYS provide BOTH the details (e.g. phone/email/location, starting prices/packages, service list, or portfolio URLs) and the matching route link together. Do not just link to the page; display the details directly in the chat first so the user gets their answer immediately, followed by the redirect button.`;
    // 2. Format history for Google Gemini API: [{ role: 'user'|'model', parts: [{ text: '...' }] }]
    // Ensure roles strictly alternate to satisfy Gemini API constraints. Merge consecutive messages from the same sender.
    const geminiHistory = [];
    let lastRole = null;

    (history || [])
      .filter((msg) => msg.id !== "welcome" && msg.text)
      .forEach((msg) => {
        const role = msg.sender === "user" ? "user" : "model";
        if (role !== lastRole) {
          geminiHistory.push({
            role: role,
            parts: [{ text: msg.text }],
          });
          lastRole = role;
        } else if (geminiHistory.length > 0) {
          geminiHistory[geminiHistory.length - 1].parts[0].text +=
            "\n" + msg.text;
        }
      });

    // 3. Dispatch to Gemini client if available
    if (geminiClient) {
      console.log(
        `[ChatService] ${new Date().toISOString()} Generating response using Google Gemini (gemini-2.5-flash-lite)`,
      );
      try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash-lite",
          systemInstruction: systemPrompt,
        });

        const chatOptions = {};
        if (geminiHistory.length > 0) {
          chatOptions.history = geminiHistory;
        }

        const chat = model.startChat(chatOptions);
        const response = await chat.sendMessage(message);
        return response.response.text();
      } catch (geminiError) {
        console.error(
          `[ChatService] Gemini API call failed: ${geminiError.message}.`,
        );
        const isRateLimit =
          geminiError.message.includes("429") ||
          geminiError.message.toLowerCase().includes("quota") ||
          geminiError.message.toLowerCase().includes("limit") ||
          geminiError.message.toLowerCase().includes("exhausted");

        if (isRateLimit && groqClient) {
          console.log(
            `[ChatService] ${new Date().toISOString()} Gemini rate limit hit. Falling back to Groq LLM (llama-3.3-70b-versatile)...`,
          );
          try {
            const groqMessages = [{ role: "system", content: systemPrompt }];

            (history || [])
              .filter((msg) => msg.id !== "welcome" && msg.text)
              .forEach((msg) => {
                const role = msg.sender === "user" ? "user" : "assistant";
                if (
                  groqMessages.length > 0 &&
                  groqMessages[groqMessages.length - 1].role === role
                ) {
                  groqMessages[groqMessages.length - 1].content +=
                    "\n" + msg.text;
                } else {
                  groqMessages.push({
                    role: role,
                    content: msg.text,
                  });
                }
              });

            groqMessages.push({
              role: "user",
              content: message,
            });

            const chatCompletion = await groqClient.chat.completions.create({
              messages: groqMessages,
              model: "llama-3.3-70b-versatile",
              temperature: 0.7,
              max_tokens: 1024,
            });

            if (
              chatCompletion.choices &&
              chatCompletion.choices[0] &&
              chatCompletion.choices[0].message
            ) {
              console.log(
                `[ChatService] Response generated successfully using Groq fallback.`,
              );
              return chatCompletion.choices[0].message.content;
            }
          } catch (groqError) {
            console.error(
              `[ChatService] Groq API call failed: ${groqError.message}.`,
            );
          }
        }

        console.log(
          `[ChatService] Falling back to database response matching.`,
        );
        return this.getDatabaseFallback(message, kb);
      }
    } else {
      // Simulated response if no API keys are configured
      console.log(
        `[ChatService] ${new Date().toISOString()} Simulating response (No GEMINI_API_KEY configured)`,
      );
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
      if (
        !item ||
        typeof item.title !== "string" ||
        typeof item.content !== "string"
      )
        continue;
      const lowerTitle = item.title.toLowerCase();
      if (
        lowerMsg.includes("pric") ||
        lowerMsg.includes("cost") ||
        lowerMsg.includes("plan")
      ) {
        if (lowerTitle.includes("price") || lowerTitle.includes("plan"))
          return item.content + "\n\n[View Pricing](/pricing)";
      }
      if (
        lowerMsg.includes("service") ||
        lowerMsg.includes("offer") ||
        lowerMsg.includes("do")
      ) {
        if (lowerTitle.includes("service") || lowerTitle.includes("offer"))
          return item.content + "\n\n[Our Services](/services)";
      }
      if (
        lowerMsg.includes("contact") ||
        lowerMsg.includes("email") ||
        lowerMsg.includes("reach") ||
        lowerMsg.includes("hire") ||
        lowerMsg.includes("support")
      ) {
        if (lowerTitle.includes("contact") || lowerTitle.includes("support"))
          return item.content + "\n\n[Contact Us](/contact)";
      }
      if (
        lowerMsg.includes("project") ||
        lowerMsg.includes("portfolio") ||
        lowerMsg.includes("work")
      ) {
        if (lowerTitle.includes("project") || lowerTitle.includes("portfolio"))
          return item.content + "\n\n[View Projects](/projects)";
      }
      if (
        lowerMsg.includes("about") ||
        lowerMsg.includes("who") ||
        lowerMsg.includes("xplode") ||
        lowerMsg.includes("qubix")
      ) {
        if (lowerTitle.includes("about") || lowerTitle.includes("agency"))
          return item.content + "\n\n[Our Services](/services)";
      }
    }

    // 2. Fallback to token matching score
    let bestMatch = null;
    let maxMatchScore = 0;

    for (const item of kb) {
      if (
        !item ||
        typeof item.title !== "string" ||
        typeof item.content !== "string"
      )
        continue;
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
      // Append matching quick redirects based on best match category
      const bestTitle = bestMatch.title.toLowerCase();
      let suffix = "";
      if (bestTitle.includes("price") || bestTitle.includes("plan"))
        suffix = "\n\n[View Pricing](/pricing)";
      else if (bestTitle.includes("service") || bestTitle.includes("offer"))
        suffix = "\n\n[Our Services](/services)";
      else if (bestTitle.includes("contact") || bestTitle.includes("support"))
        suffix = "\n\n[Contact Us](/contact)";
      else if (bestTitle.includes("project") || bestTitle.includes("portfolio"))
        suffix = "\n\n[View Projects](/projects)";
      return bestMatch.content + suffix;
    }

    // 3. Default general response
    return "I am here to assist you with Xplode Studio's details. If you'd like to get in touch with our team, feel free to use our [Contact Us](/contact) page!";
  }
}

module.exports = AIService;
