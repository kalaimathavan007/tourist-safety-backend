const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);

// 1. CORS Configuration (Express & Socket.io rendukkum)
const corsOptions = {
    origin: true, // Dynamically reflects request origin (Capacitor/Mobile/Web)
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Socket.io Configuration (Real-time Live Location Tracking)
const io = socketIo(server, {
    cors: corsOptions
});

// 3. Base Health Check Route
app.get('/api/health', (req, res) => {
    res.send("Tourist Safety Backend is running successfully! 🚀");
});

// 4. API Endpoints
app.use('/api/auth', require('./routes/auth'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/zones', require('./routes/zones'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/translate', require('./routes/translate'));
app.use('/api/notify', require('./routes/notify'));
app.use('/api/efir', require('./routes/efir'));
app.use('/api/blockchain', require('./routes/blockchain'));
app.use('/api/identity', require('./routes/identity'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/history', require('./routes/history'));

// 5. Real-Time Location Sharing via Socket.io
io.on('connection', (socket) => {
    console.log(`📡 New client connected: ${socket.id}`);

    socket.on('sendLocation', (data) => {
        socket.broadcast.emit('receiveLocation', data);
    });

    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

// 6. Serve React Frontend Static Files (Google Cloud Single Server Setup)
// React build folder-a backend-oda 'public' folder-ku copy panrom
app.use(express.static(path.join(__dirname, 'public')));

// React router support-ku ella unknown routes-um index.html-ku redirect aagum
app.get('{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 7. Global Error Handler Middleware
app.use((err, req, res, next) => {
    console.error("Server Internal Error:", err.stack);
    res.status(500).json({ message: "Internal server error", error: err.message });
});

// 8. MongoDB Connection & Server Start
const PORT = process.env.PORT || 5000;
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
    console.error('❌ MONGODB_URI is missing in .env. Please add your MongoDB connection string.');
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} without database connection.`));
} else {
    mongoose.connect(mongoURI)
        .then(() => {
            console.log('✅ MongoDB connected successfully');
            server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
        })
        .catch(err => {
            console.error('❌ MongoDB connection error:', err.message);
            server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} without database connection.`));
        });
}