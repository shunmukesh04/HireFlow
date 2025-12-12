import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/hireflow';
        
        // MongoDB connection options for better reliability
        const options = {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            maxPoolSize: 10, // Maintain up to 10 socket connections
            minPoolSize: 2, // Maintain at least 2 socket connections
        };

        const conn = await mongoose.connect(mongoUri, options);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected successfully');
        });

    } catch (error: any) {
        console.error(`❌ MongoDB connection error:`, error.message);
        console.error('Full error:', error);
        console.warn("⚠️  MongoDB connection failed. Ensure MONGO_URI is correct.");
        console.warn("💡 If using MongoDB Atlas, check your connection string and network access settings.");
        throw error; // Re-throw to allow server to handle it
    }
};

export default connectDB;
