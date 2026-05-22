const express = require('express');
const ChatController = require('../controllers/chatController');
const { geminiClient } = require('../config/ai');
const { db } = require('../config/firebase');

const router = express.Router();

// Health Check Route
router.get('/', (req, res) => {
  res.status(200).send({
    status: 'online',
    service: 'Qubix AI Assistant API',
    firestore: db ? 'configured' : 'not_configured',
    providers: {
      gemini: geminiClient ? 'configured' : 'not_configured'
    }
  });
});

// Chat endpoint
router.post('/api/chat', ChatController.handleChat);

module.exports = router;
