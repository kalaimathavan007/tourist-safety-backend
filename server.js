const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

// 1. CORS Configuration (Express & Socket.io rendukkum)
const corsOptions = {
    origin: "*", // Development-ku all origins allow pandrom
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
app.get('/', (req, res) => {
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

    // Tourist continuous live coordinates anuppum pothu receive pannum
    socket.on('sendLocation', (data) => {
        // Admin dashboard matrum matha clients-ku broadcast seiyum
        socket.broadcast.emit('receiveLocation', data);
    });

    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

// 6. 404 Route Not Found Handler (API routes-ku mattum)
app.use((req, res, next) => {
    res.status(404).json({ message: "Route not found! Check your API endpoint path." });
});

// 7. Global Error Handler Middleware
app.use((err, req, res, next) => {
    console.error("Server Internal Error:", err.stack);
    res.status(500).json({ message: "Internal server error", error: err.message });
});

// 8. MongoDB Connection & Server Start
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully');
        server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
    });