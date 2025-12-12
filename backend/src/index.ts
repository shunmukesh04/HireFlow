import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './config/db';
import apiRoutes from './routes/api';
// import { initDb } from './db/index'; // Remove SQLite

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS with proper headers for authentication
// Allow multiple origins for development (frontend on different ports)
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173'
];

// Handle preflight OPTIONS requests first - MUST be before other middleware
// Use a middleware function instead of app.options('*') to avoid path-to-regexp issues
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        const origin = req.headers.origin;
        const requestedMethod = req.headers['access-control-request-method'];
        const requestedHeaders = req.headers['access-control-request-headers'];
        
        console.log('🔍 OPTIONS preflight request:', {
            origin,
            method: requestedMethod,
            headers: requestedHeaders,
            path: req.path
        });
        
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            res.header('Access-Control-Allow-Origin', origin || '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
            res.header('Access-Control-Allow-Credentials', 'true');
            res.header('Access-Control-Max-Age', '86400');
            console.log('✅ CORS preflight allowed for origin:', origin);
            return res.sendStatus(204);
        } else {
            console.error('❌ CORS preflight blocked for origin:', origin);
            return res.sendStatus(403);
        }
    }
    next();
});

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, or curl)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Type', 'Content-Disposition', 'Content-Length'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400 // 24 hours
}));
app.use(express.json());

// Serve uploaded resume files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api', apiRoutes);

// Error handle for multer size limit and CORS errors
app.use((err: any, req: any, res: any, next: any) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Max 50KB allowed.' });
    }
    
    // Handle CORS errors
    if (err.message === 'Not allowed by CORS') {
        console.error('❌ CORS Error:', err.message);
        return res.status(403).json({ 
            message: 'CORS error: Request not allowed from this origin',
            error: err.message 
        });
    }
    
    // Log other errors
    console.error('❌ Unhandled error:', err);
    next(err);
});

app.get('/', (req, res) => {
    res.send('Antigravity API Running');
});

// Start server only after MongoDB connection is established
const startServer = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ MongoDB connection established');
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        console.error('💡 Please check your MongoDB connection string in .env file');
        process.exit(1);
    }
};

startServer();
