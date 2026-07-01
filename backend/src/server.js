import dotenv from 'dotenv';
import { app } from './app.js';
import { connectDb } from './config/db.js';
import { startJustdialLeadPolling } from './services/justdial.service.js';
import { initializeWhatsApp } from './services/whatsapp.service.js';

dotenv.config();

const port = process.env.PORT || 5000;

connectDb().then(() => {
  startJustdialLeadPolling();
  void initializeWhatsApp();
  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
});

