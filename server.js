require('dotenv').config();
const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Bind routes
app.use(chatRoutes);

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`[Server] ${new Date().toISOString()} Qubix AI backend running on port ${PORT}`);
});
