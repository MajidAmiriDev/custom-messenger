const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./db');
const authRoutes = require('./routes/authRoutes');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const redis = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const SocketManager = require('./sockets/socketManager');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const pubClient = redis.createClient({ host: 'localhost', port: 6379 });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(authRoutes);

const socketManager = new SocketManager(io);

app.set('view engine', 'ejs');
app.set('views', './views');

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
