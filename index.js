import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import 'express-async-errors';
import dotenv from 'dotenv';

import connectDB from './config/database.js';
import { authenticateToken, errorHandler } from './middleware/auth.js';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const app = express();

// Security & Performance Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database connection
connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ProjectIQ API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✓ ProjectIQ API Server running on port ${PORT}`);
});

export default app;
