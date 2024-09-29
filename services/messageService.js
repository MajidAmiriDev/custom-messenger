const Message = require('../models/Message');
const Redis = require('ioredis');

class MessageService {
    constructor() {
        this.redisClient = new Redis({
            host: 'localhost',
            port: 6379,
            password:'somePassword'
        });
    }

    async saveMessage(data) {
        const message = new Message(data);
        await message.save();
        console.log('Saved new message');

        await this.redisClient.rpush(`messages:${data.sender}:${data.receiver}`, JSON.stringify(message));
        await this.redisClient.rpush(`messages:${data.receiver}:${data.sender}`, JSON.stringify(message));

        return message;
    }

    async loadMessages(userEmail, username) {
        const redisMessages = await this.redisClient.lrange(`messages:${userEmail}:${username}`, 0, -1);
        if (redisMessages.length > 0) {
            return redisMessages.map(msg => JSON.parse(msg));
        }

        const dbMessages = await Message.find({
            $or: [
                { sender: userEmail, receiver: username },
                { sender: username, receiver: userEmail }
            ]
        }).sort({ timestamp: 1 });

        for (const msg of dbMessages) {
            await this.redisClient.rpush(`messages:${msg.sender}:${msg.receiver}`, JSON.stringify(msg));
            await this.redisClient.rpush(`messages:${msg.receiver}:${msg.sender}`, JSON.stringify(msg));
        }

        return dbMessages;
    }

    async checkNewMessages(userEmail) {
        return await Message.find({ receiver: userEmail }).exec();
    }
}

module.exports = MessageService;