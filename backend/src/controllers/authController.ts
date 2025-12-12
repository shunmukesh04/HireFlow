import { Request, Response } from 'express';
import { User, Company, Job } from '../models/index';
import { AuthRequest } from '../middleware/auth';

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

// Utility endpoint to check and fix user role
export const checkUserRole = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.mongoId;
        const user = await User.findById(userId);
        
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Check if user has created companies or jobs (indicates HR role)
        const hasCompany = await Company.findOne({ createdBy: userId });
        const hasJobs = await Job.findOne({ postedBy: userId });
        
        // If user has companies/jobs but role is not HR, fix it
        if ((hasCompany || hasJobs) && user.role !== 'HR') {
            console.log(`🔧 Fixing user role: User ${userId} has companies/jobs but role is ${user.role}, updating to HR`);
            user.role = 'HR';
            await user.save();
            
            // Also update Clerk metadata
            try {
                const { clerkClient } = require("@clerk/clerk-sdk-node");
                await clerkClient.users.updateUser(user.clerkId, {
                    publicMetadata: { role: 'HR' },
                });
            } catch (err) {
                console.error("Failed to sync role to Clerk Metadata", err);
            }
        }

        res.json({
            userId: user._id,
            clerkId: user.clerkId,
            email: user.email,
            currentRole: user.role,
            hasCompany: !!hasCompany,
            hasJobs: !!hasJobs,
            suggestedRole: (hasCompany || hasJobs) ? 'HR' : user.role,
            roleFixed: (hasCompany || hasJobs) && user.role !== 'HR'
        });
    } catch (error: any) {
        console.error('Error checking user role:', error);
        res.status(500).json({ message: 'Error checking user role', error: error.message });
    }
};
