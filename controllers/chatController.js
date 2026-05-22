const AIService = require('../services/aiService');

class ChatController {
  static async handleChat(req, res) {
    const { message, history } = req.body;
    console.log("Chat Request Body:", JSON.stringify(req.body, null, 2));

    if (!message) {
      return res.status(400).json({ error: 'Message field is required.' });
    }

    try {
      const reply = await AIService.generateChatResponse(message, history);
      return res.status(200).json({ text: reply });
    } catch (error) {
      console.log(`[ChatController] Error processing chat response:`);
      console.dir(error, { depth: null });
      return res.status(500).json({ error: 'Failed to process AI chat query. Please check server logs.' });
    }
  }
}

module.exports = ChatController;
