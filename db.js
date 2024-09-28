const mongoose = require('mongoose');

// تابع اتصال به دیتابیس
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/authDB', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection failed:', err);
        process.exit(1);
    }
};

mongoose.connection.on('connected', () => {
    console.log('MongoDB connection established.');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB connection disconnected.');
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected successfully.');
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination.');
    process.exit(0);
});

module.exports = connectDB;
