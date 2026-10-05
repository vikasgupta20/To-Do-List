import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { checkDbConnection } from './src/db/index.js';
import { authenticateUser } from './src/middleware/auth.middleware.js';
import { notFoundHandler, errorHandler } from './src/middleware/error.middleware.js';
import taskRoutes from './src/routes/task.routes.js';
import subtaskRoutes from './src/routes/subtask.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ============================================================================
// Security & Utility Middleware
// ============================================================================
app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl, postman) or matching CLIENT_URL / localhost
    if (!origin || origin === CLIENT_URL || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ============================================================================
// Health & Diagnostic Routes
// ============================================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ai-todo-backend'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ai-todo-backend'
  });
});

// ============================================================================
// Authenticated API Routes (RLS Protected)
// ============================================================================
app.use('/api/tasks', authenticateUser, taskRoutes);
app.use('/api/subtasks', authenticateUser, subtaskRoutes);

// ============================================================================
// Error Handling
// ============================================================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================================
// Server Bootstrap
// ============================================================================
export const startServer = async () => {
  await checkDbConnection();

  const server = app.listen(PORT, () => {
    console.log(`
🚀 AI To-Do Backend running at: http://localhost:${PORT}
🔒 RLS & Tenant Security Active
🤖 Gemini 2.5 Flash Structured Engine Ready
🌐 Allowed Client Origin: ${CLIENT_URL}
    `);
  });

  return server;
};

// Start automatically if run directly
startServer();

export default app;
