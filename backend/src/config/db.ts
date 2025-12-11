import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hireflow');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error}`);
        console.warn("MongoDB connection failed. Ensure MONGO_URI is correct. Server continuing in limited mode.");
        // process.exit(1);
    }
};

export default connectDB;
