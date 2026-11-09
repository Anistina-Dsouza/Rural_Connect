import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// Mount API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'RuralCare Connect Telemedicine API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Connect to Database & Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`RuralCare Connect API Service Running`);
    console.log(`Port: ${PORT}`);
    console.log(`Endpoint: http://localhost:${PORT}/api`);
    console.log(`Healthcheck: http://localhost:${PORT}/health`);
    console.log(`=================================================`);
  });
});

export default app;
