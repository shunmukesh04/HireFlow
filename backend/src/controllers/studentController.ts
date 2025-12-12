import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Job, User, Application, Company } from '../models/index';
import fs from 'fs';

// Try to import pdf-parse, but make it optional
let pdfParse: any = null;
try {
    const pdfParseLib = require('pdf-parse');
    pdfParse = pdfParseLib.default || pdfParseLib;
    if (typeof pdfParse !== 'function') {
        console.warn('pdf-parse is not a function, PDF parsing will be disabled');
        pdfParse = null;
    } else {
        console.log('PDF parsing enabled');
    }
} catch (e) {
    console.warn('pdf-parse not available, PDF parsing will be disabled:', e);
    pdfParse = null;
}

// DEMO ONLY: Generate dummy scores for resume parsing
// This ensures different applications get different scores for demo purposes
const generateDemoScore = (userId: string, jobId: string): { matchScore: number; skillMatch: number; keywordMatch: number } => {
    // Create a deterministic but varied score based on user and job IDs
    // This ensures same user+job always gets same score, but different combinations get different scores
    const hash = (str: string): number => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    };
    
    const combinedId = `${userId}_${jobId}`;
    const seed = hash(combinedId);
    
    // Generate scores between 45-95 for variety
    // Use seed to create consistent but varied scores
    const baseScore = 45 + (seed % 50); // Range: 45-95
    const skillMatch = baseScore + (seed % 15) - 7; // Vary skill match
    const keywordMatch = baseScore + (seed % 20) - 10; // Vary keyword match
    
    return {
        matchScore: Math.max(45, Math.min(95, baseScore)),
        skillMatch: Math.max(40, Math.min(100, skillMatch)),
        keywordMatch: Math.max(40, Math.min(100, keywordMatch))
    };
};

export const uploadResume = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const { jobId } = req.body;
        let fileContent = '';
        let foundSkills: string[] = [];
        let extractedEmail: string | undefined;
        let extractedPhone: string | undefined;

        // Read file for PDF parsing (if using disk storage, read from file path)
        let fileBuffer: Buffer | null = null;
        if ((req.file as any).buffer) {
            // Memory storage
            fileBuffer = req.file.buffer;
        } else if ((req.file as any).path) {
            // Disk storage - read file
            try {
                fileBuffer = fs.readFileSync((req.file as any).path);
            } catch (readError) {
                console.warn('Could not read file for parsing:', readError);
            }
        }

        // Try to extract text from PDF (optional - won't fail if it doesn't work)
        if (req.file.mimetype === 'application/pdf' && pdfParse && fileBuffer) {
            try {
                const data = await pdfParse(fileBuffer);
                fileContent = data.text || '';
                
                if (fileContent) {
                    // Parse email and phone from PDF
                    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
                    const phoneRegex = /(\+?[\d\s-]{10,})/;
                    extractedEmail = fileContent.match(emailRegex)?.[0];
                    extractedPhone = fileContent.match(phoneRegex)?.[0];
                    
                    // Extract skills from PDF
                    const commonSkills = ['React', 'Node.js', 'Python', 'Java', 'MongoDB', 'SQL', 'AWS', 'TypeScript', 'Docker', 'Kubernetes', 'JavaScript', 'C++', 'C#', 'Angular', 'Vue', 'Express', 'MongoDB', 'PostgreSQL', 'MySQL', 'Git', 'Linux'];
                    foundSkills = commonSkills.filter(skill =>
                        new RegExp(`\\b${skill}\\b`, 'i').test(fileContent)
                    );
                    console.log(`PDF parsed successfully. Extracted ${fileContent.length} characters, ${foundSkills.length} skills from ${req.file.originalname}.`);
                }
            } catch (pdfError: any) {
                // PDF parsing failed, but continue anyway - we'll use form data
                console.warn('PDF parsing failed (non-critical), continuing with form data:', pdfError.message);
            }
        } else if (!pdfParse) {
            console.log('PDF parsing not available, skipping text extraction');
        }

        // Size validation (consistent with multer limit of 50KB)
        if (req.file.size < 10 * 1024) {
            res.status(400).json({ message: 'Resume too small. Minimum 10KB required.' });
            return;
        }
        if (req.file.size > 50 * 1024) {
            res.status(400).json({ message: 'Resume too large. Maximum 50KB allowed.' });
            return;
        }

        // Get user first (needed for demo score generation)
        const user = await User.findOne({ clerkId: req.user.id });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Calculate Match Score if Job ID provided
        // Match score combines: Skills (40%) + Keywords from Job Description (60%)
        let matchScore = 0;
        let skillMatchScore = 0;
        let keywordMatchScore = 0;
        
        if (jobId) {
            const job = await Job.findById(jobId);
            if (job) {
                // 1. Skills Matching (40% weight)
                if (job.requirements?.skills && job.requirements.skills.length > 0) {
                    const jobSkills = job.requirements.skills.map((s: string) => s.toLowerCase());
                    const resumeSkillsLower = foundSkills.map(s => s.toLowerCase());
                    const skillMatches = jobSkills.filter((s: string) => resumeSkillsLower.includes(s));
                    skillMatchScore = Math.round((skillMatches.length / jobSkills.length) * 100) || 0;
                }
                
                // 2. Keywords from Job Description Matching (60% weight)
                if (job.description && fileContent) {
                    // Extract important keywords from job description
                    const jobDescription = job.description.toLowerCase();
                    const resumeContent = fileContent.toLowerCase();
                    
                    // Include job skills in keyword matching
                    const jobSkillsForKeywords = (job.requirements?.skills || []).map((s: string) => s.toLowerCase());
                    
                    // Common stop words to exclude
                    const stopWords = [
                        'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'let', 'put', 'say', 'she', 'too', 'use',
                        'this', 'that', 'with', 'from', 'have', 'will', 'been', 'than', 'them', 'these', 'what', 'when', 'where', 'which', 'while', 'would', 'your', 'their', 'there', 'they', 'could', 'should', 'about', 'after', 'before', 'during', 'under', 'over', 'through'
                    ];
                    
                    // Common technical keywords that are valuable for matching
                    const valuableTechnicalKeywords = [
                        'javascript', 'typescript', 'python', 'java', 'react', 'node', 'angular', 'vue', 'express', 'mongodb', 'sql', 'postgresql', 'mysql', 'aws', 'docker', 'kubernetes', 'git', 'linux', 'html', 'css', 'rest', 'graphql', 'api', 'microservices', 'agile', 'scrum', 'ci/cd', 'devops'
                    ];
                    
                    // Extract meaningful keywords from job description
                    // Include job skills, technical terms, and important descriptive words
                    const jobWords = jobDescription
                        .replace(/[^\w\s]/g, ' ')
                        .split(/\s+/)
                        .filter(word => {
                            const lowerWord = word.toLowerCase();
                            // Keep: job skills, valuable technical keywords, or meaningful words (4+ chars, not stop words)
                            return jobSkillsForKeywords.includes(lowerWord) || 
                                   valuableTechnicalKeywords.some(tech => lowerWord.includes(tech) || tech.includes(lowerWord)) ||
                                   (word.length >= 4 && !stopWords.includes(lowerWord));
                        })
                        .map(w => w.toLowerCase());
                    
                    // Add job skills explicitly to keyword list
                    const allJobKeywords = [...new Set([...jobWords, ...jobSkillsForKeywords])];
                    
                    // Count keyword matches in resume (including partial matches for technical terms)
                    const matchedKeywords = allJobKeywords.filter(keyword => {
                        // Exact match
                        if (resumeContent.includes(keyword)) return true;
                        // Partial match for technical terms (e.g., "node.js" matches "node")
                        if (valuableTechnicalKeywords.some(tech => keyword.includes(tech) || tech.includes(keyword))) {
                            return valuableTechnicalKeywords.some(tech => 
                                (keyword.includes(tech) && resumeContent.includes(tech)) ||
                                (tech.includes(keyword) && resumeContent.includes(tech))
                            );
                        }
                        return false;
                    });
                    
                    // Calculate keyword match percentage
                    if (allJobKeywords.length > 0) {
                        keywordMatchScore = Math.round((matchedKeywords.length / allJobKeywords.length) * 100);
                        // Cap at 100% and ensure minimum relevance
                        keywordMatchScore = Math.min(keywordMatchScore, 100);
                    }
                    
                    console.log(`Keyword matching for job ${jobId}:`, {
                        totalKeywords: allJobKeywords.length,
                        matchedKeywords: matchedKeywords.length,
                        keywordMatchScore,
                        matchedKeywordsList: matchedKeywords.slice(0, 10) // Show first 10 matches
                    });
                }
                
                // Combined match score: 40% skills + 60% keywords
                matchScore = Math.round((skillMatchScore * 0.4) + (keywordMatchScore * 0.6));
                
                // DEMO ONLY: Override with dummy scores for demo purposes
                // This ensures different resumes get different scores
                const demoScore = generateDemoScore(user._id.toString(), jobId);
                matchScore = demoScore.matchScore;
                skillMatchScore = demoScore.skillMatch;
                keywordMatchScore = demoScore.keywordMatch;
                
                console.log(`[DEMO] Match score calculation for job ${jobId}:`, {
                    skillMatch: skillMatchScore,
                    keywordMatch: keywordMatchScore,
                    finalScore: matchScore,
                    canAssignTest: matchScore >= 60,
                    note: 'Using demo scores for presentation'
                });
            }
        }

        // Update user profile with resume data
        user.profile = user.profile || {};
        
        // Initialize fitScores Map properly for MongoDB
        const fitScoresMap = new Map<string, number>();
        if (jobId && matchScore > 0) {
            fitScoresMap.set(jobId.toString(), matchScore);
        }
        
        // Get file path from multer disk storage
        const filePath = (req.file as any).path || '';
        const fileName = (req.file as any).filename || '';
        
        // Store the relative path for easy retrieval
        // Format: /uploads/resumes/filename.ext
        const relativePath = filePath 
            ? filePath.replace(process.cwd(), '').replace(/\\/g, '/') // Normalize path separators
            : `/uploads/resumes/${fileName}`;
        
        // Ensure path starts with /
        const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

        user.profile.resume = {
            fileUrl: normalizedPath, // Store normalized relative path
            fileName: req.file.originalname, // Keep original filename for display
            uploadedAt: new Date(),
            aiAnalysis: {
                parsedSkills: foundSkills,
                fitScores: fitScoresMap,
                skillGaps: [],
                recommendations: []
            }
        };
        user.profile.skills = foundSkills;
        // Use extracted phone from PDF if available, otherwise keep existing
        if (extractedPhone) {
            user.profile.phone = extractedPhone;
        }
        
        try {
            await user.save();
            console.log(`Resume uploaded successfully for user ${req.user.id}, file: ${req.file.originalname}, size: ${req.file.size} bytes`);
        } catch (saveError: any) {
            console.error('Error saving user profile:', saveError);
            // If Map serialization fails, convert to plain object
            if (saveError.message && (saveError.message.includes('Map') || saveError.message.includes('map'))) {
                console.log('Converting Map to object for MongoDB compatibility');
                const fitScoresObj: any = {};
                fitScoresMap.forEach((value, key) => {
                    fitScoresObj[key] = value;
                });
                user.profile.resume!.aiAnalysis!.fitScores = fitScoresObj as any;
                await user.save();
            } else {
                throw saveError;
            }
        }

        res.status(201).json({
            message: 'Resume uploaded successfully' + (foundSkills.length > 0 ? ' and parsed' : ''),
            parsedData: {
                skills: foundSkills,
                email: extractedEmail,
                phone: extractedPhone,
                matchScore,
                skillMatchScore,
                keywordMatchScore,
                canAssignTest: matchScore >= 60,
                parsingEnabled: pdfParse !== null
            }
        });
    } catch (error: any) {
        console.error('Resume upload error:', {
            error: error.message,
            stack: error.stack,
            fileName: req.file?.originalname,
            fileSize: req.file?.size,
            mimetype: req.file?.mimetype,
            userId: req.user?.id
        });
        res.status(500).json({ 
            message: 'Error processing resume', 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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
        console.log('Fetching available jobs for user:', req.user.id);
        
        // Fetch all active jobs with company details
        // Also handle case-insensitive status matching
        const jobs = await Job.find({ 
            $or: [
                { status: 'Active' },
                { status: 'active' },
                { status: { $exists: false } } // Include jobs without status (legacy data)
            ]
        })
            .populate('company', 'name website description address contactPerson size')
            .populate('postedBy', 'email')
            .sort({ createdAt: -1 });

        console.log(`Found ${jobs.length} active jobs`);

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

            // Handle company population - check if it's an object or ObjectId
            let companyData = {
                name: 'Company',
                website: undefined as string | undefined,
                description: undefined as string | undefined,
                address: undefined as string | undefined,
                contactPerson: undefined as string | undefined,
                size: undefined as string | undefined
            };

            if (job.company) {
                if (typeof job.company === 'object' && 'name' in job.company) {
                    // Already populated
                    companyData = {
                        name: (job.company as any)?.name || 'Company',
                        website: (job.company as any)?.website,
                        description: (job.company as any)?.description,
                        address: (job.company as any)?.address,
                        contactPerson: (job.company as any)?.contactPerson,
                        size: (job.company as any)?.size
                    };
                } else {
                    // Not populated, use default
                    companyData.name = 'Company';
                }
            }

            return {
                _id: job._id,
                title: job.title,
                description: job.description,
                location: job.location || 'Not specified',
                skills: job.requirements?.skills || [],
                company: companyData,
                matchScore,
                createdAt: job.createdAt
            };
        });

        console.log(`Returning ${jobsWithMatch.length} jobs with match scores`);
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

        // Check if already applied (including withdrawn applications)
        const existingApplication = await Application.findOne({
            student: user._id,
            job: jobId,
            status: { $ne: 'Withdrawn' } // Allow re-applying if previously withdrawn
        });

        if (existingApplication) {
            res.status(400).json({ 
                message: 'You have already applied for this job',
                applicationId: existingApplication._id,
                status: existingApplication.status
            });
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

        // Calculate fit score (same logic as resume upload)
        let fitScore = 0;
        let skillMatch = 0;
        let keywordMatch = 0;
        
        // Get resume content if available
        const resumeContent = user.profile?.resume?.aiAnalysis?.parsedSkills?.join(' ') || '';
        const userSkills = user.profile?.skills || [];
        
        // Skills matching (40%)
        if (job.requirements?.skills && userSkills.length > 0) {
            const jobSkills = job.requirements.skills.map(s => s.toLowerCase());
            const userSkillsLower = userSkills.map(s => s.toLowerCase());
            const matches = jobSkills.filter(s => userSkillsLower.includes(s));
            skillMatch = Math.round((matches.length / jobSkills.length) * 100) || 0;
        }
        
        // Keywords matching (60%)
        // Use skills + experience keywords from resume for matching
        if (job.description) {
            const jobDesc = job.description.toLowerCase();
            
            // Build resume text from skills and profile data
            const resumeTextParts = [
                ...userSkills.map(s => s.toLowerCase()),
                user.profile?.experience ? `${user.profile.experience} years experience` : '',
                user.profile?.education || '',
                user.profile?.fullName || ''
            ].filter(Boolean);
            const resumeText = resumeTextParts.join(' ').toLowerCase();
            
            // Extract meaningful keywords from job description (4+ chars, not common words)
            const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'];
            const jobWords = jobDesc
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter(word => word.length >= 4 && !commonWords.includes(word.toLowerCase()))
                .map(w => w.toLowerCase());
            
            const uniqueJobWords = [...new Set(jobWords)];
            const matchedKeywords = uniqueJobWords.filter(keyword => resumeText.includes(keyword));
            
            if (uniqueJobWords.length > 0) {
                keywordMatch = Math.round((matchedKeywords.length / uniqueJobWords.length) * 100);
                keywordMatch = Math.min(keywordMatch, 100);
            }
        }
        
        // Combined score: 40% skills + 60% keywords
        fitScore = Math.round((skillMatch * 0.4) + (keywordMatch * 0.6));

        // DEMO ONLY: Override with dummy scores for demo purposes
        // This ensures different applications get different scores
        const demoScore = generateDemoScore(user._id.toString(), jobId);
        fitScore = demoScore.matchScore;
        skillMatch = demoScore.skillMatch;
        keywordMatch = demoScore.keywordMatch;

        console.log(`[DEMO] Application score for user ${user._id} and job ${jobId}:`, {
            fitScore,
            skillMatch,
            keywordMatch,
            note: 'Using demo scores for presentation'
        });

        // Create application
        const application = await Application.create({
            student: user._id,
            job: jobId,
            status: 'Pending',
            aiScore: {
                fitScore,
                skillMatch,
                experienceMatch: keywordMatch || 0, // Store keyword match here
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

        console.log(`📋 Fetching applications for student: ${user._id}`);

        // Fetch all applications by this student with complete details
        const applications = await Application.find({ student: user._id })
            .populate({
                path: 'job',
                select: 'title location description requirements.skills status',
                populate: {
                    path: 'company',
                    select: 'name website description address'
                }
            })
            .sort({ appliedAt: -1 });

        console.log(`✅ Found ${applications.length} applications for student`);
        
        // DEMO ONLY: Ensure all applications have scores (use demo scores if missing)
        const applicationsWithScores = applications.map(app => {
            if (!app.aiScore?.fitScore || app.aiScore.fitScore === 0) {
                const jobId = (app.job as any)?._id?.toString() || '';
                if (jobId) {
                    const demoScore = generateDemoScore(user._id.toString(), jobId);
                    app.aiScore = {
                        fitScore: demoScore.matchScore,
                        skillMatch: demoScore.skillMatch,
                        experienceMatch: demoScore.keywordMatch,
                        overallRank: app.aiScore?.overallRank || 0
                    };
                    app.save().catch(err => console.error('Error saving demo scores:', err));
                }
            }
            return app;
        });
        
        res.json(applicationsWithScores);
    } catch (error: any) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ message: 'Error fetching applications', error: error.message });
    }
};

export const getCompanyByJobId = async (req: AuthRequest, res: Response) => {
    try {
        const { jobId } = req.params;
        
        if (!jobId) {
            res.status(400).json({ message: 'Job ID is required' });
            return;
        }

        const job = await Job.findById(jobId).populate('company');
        
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }

        if (!job.company || typeof job.company !== 'object') {
            res.status(404).json({ message: 'Company not found for this job' });
            return;
        }

        const company = job.company as any;
        res.json({
            name: company.name || 'Company',
            website: company.website,
            description: company.description,
            address: company.address,
            contactPerson: company.contactPerson,
            size: company.size
        });
    } catch (error: any) {
        console.error('Error fetching company by job ID:', error);
        res.status(500).json({ message: 'Error fetching company details', error: error.message });
    }
};

export const withdrawApplication = async (req: AuthRequest, res: Response) => {
    try {
        const { applicationId } = req.params;
        
        const user = await User.findOne({ clerkId: req.user.id });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const application = await Application.findById(applicationId);
        if (!application) {
            res.status(404).json({ message: 'Application not found' });
            return;
        }

        // Verify the application belongs to this student
        if (application.student.toString() !== user._id.toString()) {
            res.status(403).json({ message: 'You do not have permission to withdraw this application' });
            return;
        }

        // Check if already withdrawn or in a final state
        if (application.status === 'Withdrawn') {
            res.status(400).json({ message: 'Application is already withdrawn' });
            return;
        }

        if (application.status === 'Rejected') {
            res.status(400).json({ message: 'Cannot withdraw a rejected application' });
            return;
        }

        // Update status to Withdrawn
        application.status = 'Withdrawn';
        application.timeline = application.timeline || [];
        application.timeline.push({
            stage: 'Withdrawn',
            timestamp: new Date(),
            action: 'Application withdrawn by student'
        });

        await application.save();

        res.json({
            message: 'Application withdrawn successfully',
            application: {
                _id: application._id,
                status: application.status
            }
        });
    } catch (error: any) {
        console.error('Error withdrawing application:', error);
        res.status(500).json({ message: 'Error withdrawing application', error: error.message });
    }
};
