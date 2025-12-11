import { Request, Response } from 'express';
import { User } from '../models/index';

// Deprecated in favor of Clerk but kept for legacy API compatibility if needed
// Actually, with Clerk we don't need manual register/login endpoints anymore
// because Clerk handles the UI and session management. 
// We just need to ensure the User exists in our DB when they first hit a protected route.

export const registerUser = async (req: Request, res: Response) => {
    res.status(400).json({ message: 'Use Clerk for authentication' });
};

export const loginUser = async (req: Request, res: Response) => {
    res.status(400).json({ message: 'Use Clerk for authentication' });
};
