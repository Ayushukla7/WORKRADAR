const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Import Route Modules
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const workloadRoutes = require('./routes/workloadRoutes');
const riskRoutes = require('./routes/riskRoutes');
const extensionRoutes = require('./routes/extensionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root API Endpoint Welcome Message
app.get('/', (req, res) => {
  res.status(200).json({
    app: 'WorkRadar Predictive REST API',
    status: 'online',
    message: 'Welcome to WorkRadar REST API Server.',
    frontendAppUrl: 'http://localhost:5173',
    healthCheckUrl: 'http://localhost:5000/api/health',
    documentation: 'See README.md for complete REST API endpoint specifications.'
  });
});

// Health Check API Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'WorkRadar API',
    message: 'WorkRadar Backend Server is running smoothly!',
    timestamp: new Date().toISOString()
  });
});

// Register API Route Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/workload', workloadRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/extensions', extensionRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Handler & Global Error Handler
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[WorkRadar Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
