// server/src/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');

// Load env vars
dotenv.config();

const connectDB = require('./config/database');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"]
    }
});

// Body parser
app.use(express.json());

// Security headers
app.use(helmet());

// Enable CORS
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rate limiting middleware (imported where needed)
const { apiLimiter } = require('./middleware/rateLimit');

// Route files
const auth = require('./routes/auth');
const sensor = require('./routes/sensor');
const admin = require('./routes/admin');
const maintenance = require('./routes/maintenance');

// Mount routers
app.use('/api/auth', auth);
app.use('/api/sensor', sensor);
app.use('/api/admin', admin);
app.use('/api/maintenance', maintenance);

// Socket.io connection handling
const { protect } = require('./middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// Socket authentication middleware
const socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
            return next(new Error('Authentication error'));
        }

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

    // Handle disconnect
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
        message: 'Something went wrong!'
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
    // Close server & exit process
    server.close(() => {
        process.exit(1);
    });
});
