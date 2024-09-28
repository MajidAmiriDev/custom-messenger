const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true }, // ایمیل کاربر فرستنده
    receiver: { type: String, required: true }, // ایمیل کاربر گیرنده
    content: { type: String, required: true }, // محتوی پیام
    timestamp: { type: Date, default: Date.now } // زمان ارسال پیام
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;