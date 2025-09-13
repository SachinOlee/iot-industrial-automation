// server/src/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

// Load env vars
dotenv.config();

const { connectDB } = require('./config/database');
const User = require('./models/User');

// Connect to database
connectDB().catch(err => {
  console.error('Database connection failed:', err);
  if (process.env.OPTIONAL_DB !== 'true') {
    process.exit(1);
  }
});

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting middleware (imported where needed)
const { apiLimiter } = require('./middleware/rateLimit');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/sensor', require('./routes/sensor'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/machines', require('./routes/machine'));
app.use('/api/system', require('./routes/system'));

// Socket authentication middleware
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return next(new Error('Authentication error'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

io.use(socketAuth);

io.on('connection', (socket) => {
  console.log(`User ${socket.user.email} connected`);

  // Join user to their own room
  socket.join(`user_${socket.user._id}`);

  // Handle sensor data updates
  socket.on('sensor_data', (data) => {
    // Broadcast to user's room
    socket.to(`user_${socket.user._id}`).emit('sensor_update', data);
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.user.email} disconnected`);
  });
});

// Make io available to controllers
app.set('io', io);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
