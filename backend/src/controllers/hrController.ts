import { Request, Response } from 'express';
import { Company, Job, User, Application } from '../models/index';
import { AuthRequest } from '../middleware/auth';

export const createCompany = async (req: AuthRequest, res: Response) => {
    try {
        console.log("Creating Company for User:", req.user);
        const { name, address, website, contactPerson, size, description } = req.body;

        // req.user.mongoId is already set by auth middleware
        const userId = req.user.mongoId;

        // Check if company already exists for this user
        const existingCompany = await Company.findOne({ createdBy: userId });
        if (existingCompany) {
            // Update existing company
            existingCompany.name = name || existingCompany.name;
            existingCompany.address = address || existingCompany.address;
            existingCompany.website = website || existingCompany.website;
            existingCompany.contactPerson = contactPerson || existingCompany.contactPerson;
            existingCompany.size = size || existingCompany.size;
            existingCompany.description = description || existingCompany.description;
            await existingCompany.save();

            console.log("Company updated successfully:", existingCompany);
            res.status(200).json({
                message: 'Company updated successfully',
                company: existingCompany
            });
            return;
        }

        // Create new company
        const company = await Company.create({
            createdBy: userId,
            name,
            address,
            website,
            contactPerson,
            size,
            description
        });

        console.log("Company created successfully:", company);
        res.status(201).json({
            message: 'Company created successfully',
            company
        });
    } catch (error: any) {
        console.error("Error creating company:", error);
        res.status(500).json({
            message: 'Error creating company',
            error: error.message
        });
    }
};

export const createJob = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, requiredSkills, location, roundConfig } = req.body;

        const userId = req.user.mongoId;

        // Find company associated with HR
        const company = await Company.findOne({ createdBy: userId });
        if (!company) {
            res.status(400).json({ message: 'Please create a company profile first' });
            return;
        }

        // Create job with enhanced model structure
        const job = await Job.create({
            postedBy: userId,
            company: company._id,
            title,
            description,
            requirements: {
                skills: requiredSkills || [],
                experience: { min: 0, max: 10 },
                education: []
            },
            roundConfig: roundConfig || {
                round1: {
                    mcqCount: 10,
                    codingCount: 2,
                    duration: 60,
                    passingScore: 70
                },
                round2: {
                    enabled: false
                }
            },
            location,
            status: 'Active'
        });

        // Add job to company's jobs array
        company.jobs = company.jobs || [];
        company.jobs.push(job._id);
        await company.save();

        console.log("Job created successfully:", job);
        res.status(201).json({
            message: 'Job posted successfully',
            job
        });
    } catch (error: any) {
        console.error("Error creating job:", error);
        res.status(500).json({
            message: 'Error creating job',
            error: error.message
        });
    }
};

export const getCandidates = async (req: AuthRequest, res: Response) => {
    try {
        const { jobId } = req.query;

        const userId = req.user.mongoId;

        let query: any = {};

        if (jobId) {
            // Get candidates for specific job
            query.job = jobId;
        } else {
            // Get all candidates for jobs posted by this HR
            const jobs = await Job.find({ postedBy: userId }).select('_id');
            const jobIds = jobs.map(j => j._id);
            query.job = { $in: jobIds };
        }

        // Fetch applications with populated student and job details
        const applications = await Application.find(query)
            .populate('student', 'profile.fullName email profile.skills')
            .populate('job', 'title')
            .sort({ appliedAt: -1 });

        // Format response
        const candidates = applications.map(app => ({
            applicationId: app._id,
            name: (app.student as any)?.profile?.fullName || 'Student',
            email: (app.student as any)?.email,
            skills: (app.student as any)?.profile?.skills || [],
            jobTitle: (app.job as any)?.title,
            matchScore: app.aiScore?.fitScore || 0,
            status: app.status,
            appliedAt: app.appliedAt
        }));

        res.json(candidates);
    } catch (error: any) {
        console.error("Error fetching candidates:", error);
        res.status(500).json({
            message: 'Error fetching candidates',
            error: error.message
        });
    }
};

export const getCompanyProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.mongoId;

        const company = await Company.findOne({ createdBy: userId });
        if (!company) {
            res.status(404).json({ message: 'No company profile found' });
            return;
        }

        res.json(company);
    } catch (error: any) {
        console.error("Error fetching company:", error);
        res.status(500).json({
            message: 'Error fetching company profile',
            error: error.message
        });
    }
};
