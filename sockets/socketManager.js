const MessageService = require('../services/messageService');
const User = require('../models/User');
const AuthMiddleware = require('../middlewares/authSocketMiddleware');

class SocketManager {
    constructor(io) {
        this.io = io;
        this.activeSockets = {};
        this.messageService = new MessageService();
        this.initialize();
    }

    initialize() {
        this.io.use(AuthMiddleware.authenticate);

        this.io.on('connection', (socket) => {
            console.log('A user connected');
            const userEmail = socket.handshake.query.email;
            socket.userEmail = userEmail;
            this.activeSockets[userEmail] = socket;
            this.registerSocketEvents(socket, userEmail);
        });
    }

    registerSocketEvents(socket, userEmail) {
        socket.on('findUser', async (username) => this.handleFindUser(socket, username));
        socket.on('sendMessage', async (data) => this.handleSendMessage(data));
        socket.on('checkNewMessages', async () => this.handleCheckNewMessages(socket, userEmail));
        socket.on('loadMessages', async (username) => this.handleLoadMessages(socket, userEmail, username));
        socket.on('disconnect', () => this.handleDisconnect(userEmail));
    }

    async handleFindUser(socket, username) {
        const user = await User.findOne({ email: username });
        if (user) {
            socket.emit('userFound', username);
            const messages = await this.messageService.loadMessages(socket.userEmail, username);
            socket.emit('loadMessages', messages);
        } else {
            socket.emit('userNotFound', username);
        }
    }

    async handleSendMessage(data) {
        const message = await this.messageService.saveMessage(data);
        const { receiver } = data;

        if (this.activeSockets[receiver]) {
            this.activeSockets[receiver].emit('newMessage', { sender: message.sender, content: message.content });
        }
    }

    async handleCheckNewMessages(socket, userEmail) {
        const messages = await this.messageService.checkNewMessages(userEmail);
        if (messages.length > 0) {
            socket.emit('newMessagesAvailable', messages);
        }
    }

    async handleLoadMessages(socket, userEmail, username) {
        const messages = await this.messageService.loadMessages(userEmail, username);
        socket.emit('loadMessages', messages);
    }

    handleDisconnect(userEmail) {
        console.log('User disconnected');
        delete this.activeSockets[userEmail];
    }
}

module.exports = SocketManager;