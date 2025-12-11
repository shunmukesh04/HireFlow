import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Job, User, Application } from '../models/index';
import fs from 'fs';
const pdf = require('pdf-parse');

export const uploadResume = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const { jobId } = req.body;
        let fileContent = '';

        // Extract text based on file type
        if (req.file.mimetype === 'application/pdf') {
            const data = await pdf(req.file.buffer);
            fileContent = data.text;
        } else {
            fileContent = req.file.buffer.toString('utf-8');
        }

        // Size validation
        if (req.file.size < 30 * 1024) {
            res.status(400).json({ message: 'Resume too small. Minimum 30KB required.' });
            return;
        }

        // Parse email and phone
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
        const phoneRegex = /(\+?[\d\s-]{10,})/;

        const email = fileContent.match(emailRegex)?.[0];
        const phone = fileContent.match(phoneRegex)?.[0];

        // Extract skills
        const commonSkills = ['React', 'Node.js', 'Python', 'Java', 'MongoDB', 'SQL', 'AWS', 'TypeScript', 'Docker', 'Kubernetes'];
        const foundSkills = commonSkills.filter(skill =>
            new RegExp(`\\b${skill}\\b`, 'i').test(fileContent)
        );

        // Calculate Match Score if Job ID provided
        let matchScore = 0;
        if (jobId) {
            const job = await Job.findById(jobId);
            if (job && job.requirements?.skills) {
                const jobSkills = job.requirements.skills.map((s: string) => s.toLowerCase());
                const resumeSkillsLower = foundSkills.map(s => s.toLowerCase());
                const matches = jobSkills.filter((s: string) => resumeSkillsLower.includes(s));
                matchScore = Math.round((matches.length / jobSkills.length) * 100) || 0;
            }
        }

        // Store resume in User model
        const user = await User.findOne({ clerkId: req.user.id });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Update user profile with resume data
        user.profile = user.profile || {};
        user.profile.resume = {
            fileUrl: '', // In production, upload to S3 and store URL
            fileName: req.file.originalname,
            uploadedAt: new Date(),
            aiAnalysis: {
                parsedSkills: foundSkills,
                fitScores: new Map(),
                skillGaps: [],
                recommendations: []
            }
        };
        user.profile.skills = foundSkills;
        if (phone) user.profile.phone = phone;
        await user.save();

        res.status(201).json({
            message: 'Resume uploaded and parsed successfully',
            parsedData: {
                skills: foundSkills,
                email,
                phone,
                matchScore
            }
        });
    } catch (error: any) {
        console.error('Resume upload error:', error);
        res.status(500).json({ message: 'Error processing resume', error: error.message });
    }
};

export const getStudentProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findOne({ clerkId: req.user.id });
        if (!user) {
            res.status(404).json({ message: 'Profile not found' });
            return;
        }

        res.json({
            email: user.email,
            profile: user.profile,
            applications: user.applications || []
        });
    } catch (error: any) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
};

export const getAvailableJobs = async (req: AuthRequest, res: Response) => {
    try {
        // Fetch all active jobs with company details
        const jobs = await Job.find({ status: 'Active' })
            .populate('company', 'name website description')
            .populate('postedBy', 'email')
            .sort({ createdAt: -1 });

        // Get user's skills for match calculation
        const user = await User.findOne({ clerkId: req.user.id });
        const userSkills = user?.profile?.skills || [];

        // Calculate match score for each job
        const jobsWithMatch = jobs.map(job => {
            let matchScore = 0;
            if (job.requirements?.skills && userSkills.length > 0) {
                const jobSkills = job.requirements.skills.map(s => s.toLowerCase());
                const userSkillsLower = userSkills.map(s => s.toLowerCase());
                const matches = jobSkills.filter(s => userSkillsLower.includes(s));
                matchScore = Math.round((matches.length / jobSkills.length) * 100) || 0;
            }

            return {
                _id: job._id,
                title: job.title,
                description: job.description,
                location: job.location,
                skills: job.requirements?.skills || [],
                company: {
                    name: (job.company as any)?.name || 'Company',
                    website: (job.company as any)?.website,
                    description: (job.company as any)?.description
                },
                matchScore,
                createdAt: job.createdAt
            };
        });

        res.json(jobsWithMatch);
    } catch (error: any) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ message: 'Error fetching jobs', error: error.message });
    }
};

export const applyForJob = async (req: AuthRequest, res: Response) => {
    try {
        const { jobId, personalInfo } = req.body;

        const user = await User.findOne({ clerkId: req.user.id });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Check if user has uploaded resume
        if (!user.profile?.resume) {
            res.status(400).json({ message: 'Please upload your resume first' });
            return;
        }

        // Check if already applied
        const existingApplication = await Application.findOne({
            student: user._id,
            job: jobId
        });

        if (existingApplication) {
            res.status(400).json({ message: 'You have already applied for this job' });
            return;
        }

        // Get job details for match score calculation
        const job = await Job.findById(jobId);
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }

        // Update user profile with personal info if provided
        if (personalInfo) {
            user.profile.fullName = `${personalInfo.firstName} ${personalInfo.lastName}`;
            user.profile.phone = personalInfo.phone || user.profile.phone;
            user.email = personalInfo.email || user.email;
            await user.save();
        }

        // Calculate fit score
        let fitScore = 0;
        let skillMatch = 0;
        if (job.requirements?.skills && user.profile?.skills) {
            const jobSkills = job.requirements.skills.map(s => s.toLowerCase());
            const userSkills = user.profile.skills.map(s => s.toLowerCase());
            const matches = jobSkills.filter(s => userSkills.includes(s));
            skillMatch = Math.round((matches.length / jobSkills.length) * 100) || 0;
            fitScore = skillMatch;
        }

        // Create application
        const application = await Application.create({
            student: user._id,
            job: jobId,
            status: 'Pending',
            aiScore: {
                fitScore,
                skillMatch,
                experienceMatch: 0,
                overallRank: 0
            },
            timeline: [{
                stage: 'Applied',
                timestamp: new Date(),
                action: `Application submitted by ${personalInfo?.firstName || 'Student'}`
            }],
            appliedAt: new Date()
        });

        // Add to user's applications
        user.applications = user.applications || [];
        user.applications.push(application._id);
        await user.save();

        // Add to job's applications
        job.applications = job.applications || [];
        job.applications.push(application._id);
        await job.save();

        res.status(201).json({
            message: 'Application submitted successfully! We will review your profile and get back to you soon.',
            application,
            fitScore
        });
    } catch (error: any) {
        console.error('Error applying for job:', error);
        res.status(500).json({ message: 'Error applying for job', error: error.message });
    }
};

export const getMyApplications = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findOne({ clerkId: req.user.id });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Fetch all applications by this student
        const applications = await Application.find({ student: user._id })
            .populate('job', 'title location')
            .populate({
                path: 'job',
                populate: {
                    path: 'company',
                    select: 'name website'
                }
            })
            .sort({ appliedAt: -1 });

        res.json(applications);
    } catch (error: any) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ message: 'Error fetching applications', error: error.message });
    }
};
