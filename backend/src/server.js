import dotenv from 'dotenv';
import { createServer } from 'http';
import { app } from './app.js';
import { connectDb } from './config/db.js';
import { startJustdialLeadPolling } from './services/justdial.service.js';
import { initializeSocket } from './services/socket.service.js';

dotenv.config();

const port = process.env.PORT || 5000;
const server = createServer(app);

// Initialize WebSockets
initializeSocket(server);

connectDb().then(() => {
  startJustdialLeadPolling();
  server.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Common CRM Backend is running 🚀",
    version: "1.0.0"
  });
});

