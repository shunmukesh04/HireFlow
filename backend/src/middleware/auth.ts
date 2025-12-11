import { Request, Response, NextFunction } from 'express';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import { User } from '../models/index';

// Extending Express Request to include 'auth' property form Clerk
declare global {
    namespace Express {
        interface Request {
            auth?: {
                userId: string;
                sessionId: string;
                getToken: () => Promise<string | null>;
            };
            user?: any; // For backward compatibility with our controllers
        }
    }
}

// Export AuthRequest interface for controllers
export interface AuthRequest extends Request {
    user?: any; // or define specific User type
    file?: Express.Multer.File; // For file uploads
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Unauthorized - No Bearer Token' });
        return;
    }

    const clerkMiddleware = ClerkExpressWithAuth();

    clerkMiddleware(req as any, res as any, async () => {
        if (!req.auth || !req.auth.userId) {
            console.error("Clerk Middleware Auth Failed", req.auth);
            res.status(401).json({ message: 'Unauthorized - No Clerk Token' });
            return;
        }

        try {
            // Sync User to MongoDB
            const clerkId = req.auth.userId;
            let user = await User.findOne({ clerkId });


            if (!user) {
                // Creating a shell user profile if valid auth but no DB record
                // Check Clerk user metadata for role
                const { clerkClient } = require('@clerk/clerk-sdk-node');
                let assignedRole = 'STUDENT'; // Default to STUDENT

                try {
                    const clerkUser = await clerkClient.users.getUser(clerkId);
                    // Check unsafeMetadata or publicMetadata for role
                    const metadataRole = clerkUser.unsafeMetadata?.role || clerkUser.publicMetadata?.role;
                    if (metadataRole === 'HR' || metadataRole === 'STUDENT') {
                        assignedRole = metadataRole;
                    }
                } catch (err) {
                    console.error("Failed to fetch Clerk user metadata", err);
                }

                user = await User.create({
                    clerkId,
                    email: 'clerk-user@placeholder.com',
                    role: assignedRole
                });
                console.log(`Created new JIT user for ${clerkId} with role: ${assignedRole}`);

                // Sync Role to Clerk Public Metadata for Frontend use
                try {
                    await clerkClient.users.updateUser(clerkId, {
                        publicMetadata: { role: assignedRole }
                    });
                } catch (err) {
                    console.error("Failed to sync role to Clerk Metadata", err);
                }
            }

            req.user = { id: user.clerkId, role: user.role, mongoId: user._id };
            next();
        } catch (e) {
            console.error("Auth Middleware Error", e);
            res.status(500).json({ message: 'Auth Error' });
        }
    });
};

export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ message: `Role ${req.user?.role} is not authorized` });
            return;
        }
        next();
    };
};
