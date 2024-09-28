const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./db');
const authRoutes = require('./routes/authRoutes');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const User = require('./models/User');
const Message = require('./models/Message');
dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server); // Attach Socket.IO to the server

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(authRoutes);

const activeSockets = {};
io.on('connection', (socket) => {
    console.log('A user connected');
    const userEmail = socket.handshake.query.email;
    socket.userEmail = userEmail;
    activeSockets[userEmail] = socket;
    socket.on('findUser', async (username) => {
        const user = await User.findOne({ email: username });
        if (user) {
            socket.emit('userFound', username);
            const messages = await Message.find({
                $or: [
                    { sender: socket.handshake.query.email, receiver: username },
                    { sender: username, receiver: socket.handshake.query.email }
                ]
            }).sort({ timestamp: 1 });

            socket.emit('loadMessages', messages); // بارگذاری پیام‌ها
        } else {
            socket.emit('userNotFound', username);
        }
    });

    socket.on('sendMessage', async (data) => {
        const { sender, receiver, content } = data;
        const message = new Message({ sender, receiver, content });
        await message.save();
        console.log('save new message');
        if (activeSockets[receiver]) {
            activeSockets[receiver].emit('newMessage', { sender, content });
        }
        if (receiver === userEmail) {
            alert('aaaa')
            socket.emit('notification', `پیام جدیدی از ${sender} دریافت کردید.`);
        }
    });
    socket.on('checkNewMessages', async () => {
        const messages = await Message.find({ receiver: userEmail }).exec();
        if (messages.length > 0) {
            socket.emit('newMessagesAvailable', messages);
        }
    });

    socket.on('loadMessages', async (username) => {
        const messages = await Message.find({
            $or: [
                { sender: userEmail, receiver: username },
                { sender: username, receiver: userEmail }
            ]
        });

        socket.emit('loadMessages', messages);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

app.set('view engine', 'ejs');
app.set('views', './views');

const PORT = process.env.PORT || 5000; // You can use an environment variable for the port
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});