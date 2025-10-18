import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import projectsRouter from './routes/projects';
import entriesRouter from './routes/entries';
import glossaryRouter from './routes/glossary';
import aiRouter from './routes/ai';
import importRouter from './routes/import';
import exportRouter from './routes/export';
import commentsRouter from './routes/comments';
import analyticsRouter from './routes/analytics';
import authRouter from './routes/auth';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'Glossary Tool API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      projects: '/api/projects',
      entries: '/api/entries',
      glossary: '/api/glossary',
      ai: '/api/ai',
      import: '/api/import',
      export: '/api/export',
      comments: '/api/comments',
      analytics: '/api/analytics',
      auth: '/api/auth' // Login, register, me
    }
  });
});

// Mount routes
app.use('/api/projects', projectsRouter);
app.use('/api/entries', entriesRouter);
app.use('/api/glossary', glossaryRouter);
app.use('/api/ai', aiRouter);
app.use('/api/import', importRouter);
app.use('/api/export', exportRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/auth', authRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📚 API documentation: http://localhost:${PORT}/api`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});

export default app;