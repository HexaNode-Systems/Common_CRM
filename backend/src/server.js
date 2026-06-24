import dotenv from 'dotenv';
import { app } from './app.js';
import { connectDb } from './config/db.js';
import { startJustdialLeadPolling } from './services/justdial.service.js';

dotenv.config();

const port = process.env.PORT || 5000;

connectDb().then(() => {
  startJustdialLeadPolling();
  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
});

