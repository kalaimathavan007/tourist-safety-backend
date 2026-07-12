const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// 👇 
app.get('/', (req, res) => {
    res.send("Tourist Safety Backend is running successfully!");
});
// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/zones', require('./routes/zones'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/translate', require('./routes/translate'));
app.use('/api/notify', require('./routes/notify'));
app.use('/api/efir', require('./routes/efir'));
app.use('/api/blockchain', require('./routes/blockchain'));
app.use('/api/identity', require('./routes/identity'));
app.use('/api/admin', require('./routes/admin')); // Admin OTP and user listing

// Socket.io for real-time location sharing
io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('sendLocation', (data) => {
        socket.broadcast.emit('receiveLocation', data);
    });
    socket.on('disconnect', () => console.log('Client disconnected'));
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));