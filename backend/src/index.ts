import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import apiRoutes from './routes/api';
// import { initDb } from './db/index'; // Remove SQLite

dotenv.config();
connectDB(); // Connect Mongo

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

// Error handle for multer size limit
app.use((err: any, req: any, res: any, next: any) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Max 50KB allowed.' });
    }
    next(err);
});

app.get('/', (req, res) => {
    res.send('Antigravity API Running');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
