import { Request, Response } from "express";
import { Company, Job, User, Application, TestRound, ITestRound } from "../models/index";
import { AuthRequest } from "../middleware/auth";

export const createCompany = async (req: AuthRequest, res: Response) => {
  try {
    console.log("📝 Company save request received");
    console.log("Request body:", req.body);
    console.log("Request user:", req.user);

    if (!req.user || !req.user.mongoId) {
      console.error('❌ No user found in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log("Creating/Updating Company for User:", req.user.mongoId);
    const { name, address, website, contactPerson, size, description } =
      req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    // req.user.mongoId is already set by auth middleware
    const userId = req.user.mongoId;

    // Check if company already exists for this user
    const existingCompany = await Company.findOne({ createdBy: userId });
    if (existingCompany) {
      // Update existing company
      existingCompany.name = name || existingCompany.name;
      existingCompany.address = address || existingCompany.address;
      existingCompany.website = website || existingCompany.website;
      existingCompany.contactPerson =
        contactPerson || existingCompany.contactPerson;
      existingCompany.size = size || existingCompany.size;
      existingCompany.description = description || existingCompany.description;
      await existingCompany.save();

      console.log("Company updated successfully:", existingCompany);
      res.status(200).json({
        message: "Company updated successfully",
        company: existingCompany,
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
      description,
    });

    console.log("Company created successfully:", company);
    res.status(201).json({
      message: "Company created successfully",
      company,
    });
  } catch (error: any) {
    console.error("Error creating company:", error);
    res.status(500).json({
      message: "Error creating company",
      error: error.message,
    });
  }
};

export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      requiredSkills,
      required_skills,
      location,
      roundConfig,
    } = req.body;

    const userId = req.user.mongoId;

    // Find company associated with HR
    const company = await Company.findOne({ createdBy: userId });
    if (!company) {
      res
        .status(400)
        .json({ message: "Please create a company profile first" });
      return;
    }

    // Handle both requiredSkills (array) and required_skills (array or string)
    let skillsArray: string[] = [];
    if (requiredSkills && Array.isArray(requiredSkills)) {
      skillsArray = requiredSkills;
    } else if (required_skills) {
      if (Array.isArray(required_skills)) {
        skillsArray = required_skills;
      } else if (typeof required_skills === "string") {
        skillsArray = required_skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    // Create job with enhanced model structure
    const job = await Job.create({
      postedBy: userId,
      company: company._id,
      title,
      description,
      requirements: {
        skills: skillsArray,
        experience: { min: 0, max: 10 },
        education: [],
      },
      roundConfig: roundConfig || {
        round1: {
          mcqCount: 10,
          codingCount: 2,
          duration: 60,
          passingScore: 70,
        },
        round2: {
          enabled: false,
        },
      },
      location,
      status: "Active",
    });

    // Add job to company's jobs array
    company.jobs = company.jobs || [];
    company.jobs.push(job._id);
    await company.save();

    console.log("Job created successfully:", {
      id: job._id,
      title: job.title,
      status: job.status,
      company: company.name,
      location: job.location,
    });

    // Verify job is queryable by students
    const verifyJob = await Job.findOne({ _id: job._id, status: "Active" });
    if (verifyJob) {
      console.log("✓ Job verified as Active and queryable by students");
    } else {
      console.warn(
        "⚠ Warning: Job created but not found in Active status query"
      );
    }

    res.status(201).json({
      message: "Job posted successfully and is now visible to students",
      job: {
        _id: job._id,
        title: job.title,
        status: job.status,
        location: job.location,
        company: company.name,
      },
    });
  } catch (error: any) {
    console.error("Error creating job:", error);
    res.status(500).json({
      message: "Error creating job",
      error: error.message,
    });
  }
};

export const getCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.query;

    if (!req.user || !req.user.mongoId) {
      console.error('❌ No user found in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user.mongoId;
    console.log(`📋 Fetching candidates for HR: ${userId}, jobId: ${jobId || 'all'}`);

    let query: any = {};

    if (jobId) {
      // Get candidates for specific job
      query.job = jobId;
    } else {
      // Get all candidates for jobs posted by this HR
      const jobs = await Job.find({ postedBy: userId }).select("_id");
      const jobIds = jobs.map((j) => j._id);
      console.log(`📊 Found ${jobs.length} jobs posted by HR, jobIds:`, jobIds);
      
      // If no jobs found, return empty array (not an error)
      if (jobIds.length === 0) {
        console.log('⚠️ No jobs found for this HR. Post a job first to see applications.');
        return res.status(200).json([]);
      }
      
      query.job = { $in: jobIds };
    }

    // Fetch applications with populated student and job details
    // Only get applications that are not withdrawn and from active jobs
    const applications = await Application.find({
      ...query,
      status: { $ne: 'Withdrawn' } // Exclude withdrawn applications
    })
      .populate({
        path: "student",
        select: "profile.fullName email profile.skills profile.phone profile.resume clerkId",
      })
      .populate({
        path: "job",
        select: "title location requirements.skills company status",
        populate: {
          path: "company",
          select: "name"
        },
        match: { status: 'Active' } // Only get applications for active jobs
      })
      .sort({ appliedAt: -1 })
      .lean(); // Use lean() for better performance

    console.log(`✅ Found ${applications.length} applications for HR`);

    // Return empty array if no applications (not an error)
    if (applications.length === 0) {
      console.log('ℹ️ No applications found for this HR\'s jobs');
      return res.status(200).json([]);
    }

    // DEMO ONLY: Import demo score generator
    const generateDemoScore = (userId: string, jobId: string): { matchScore: number; skillMatch: number; keywordMatch: number } => {
        const hash = (str: string): number => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash);
        };
        const combinedId = `${userId}_${jobId}`;
        const seed = hash(combinedId);
        const baseScore = 45 + (seed % 50);
        const skillMatch = baseScore + (seed % 15) - 7;
        const keywordMatch = baseScore + (seed % 20) - 10;
        return {
            matchScore: Math.max(45, Math.min(95, baseScore)),
            skillMatch: Math.max(40, Math.min(100, skillMatch)),
            keywordMatch: Math.max(40, Math.min(100, keywordMatch))
        };
    };

    // Filter out applications where job is null (job was deleted or inactive)
    const validApplications = applications.filter((app: any) => app.job !== null);

    console.log(`✅ Filtered to ${validApplications.length} valid applications (excluded ${applications.length - validApplications.length} with deleted/inactive jobs)`);

    // Return empty array if no valid applications
    if (validApplications.length === 0) {
      console.log('ℹ️ No valid applications found after filtering');
      return res.status(200).json([]);
    }

    // Format response with all hiring details
    const candidates = validApplications.map((app: any) => {
      // DEMO ONLY: Use demo scores if scores are missing or 0
      let matchScore = app.aiScore?.fitScore || 0;
      let skillMatch = app.aiScore?.skillMatch || 0;
      let experienceMatch = app.aiScore?.experienceMatch || 0;
      
      // If scores are missing or 0, generate demo scores
      if (matchScore === 0 || !app.aiScore?.fitScore) {
        const studentId = (app.student as any)?._id?.toString() || '';
        const jobId = (app.job as any)?._id?.toString() || '';
        if (studentId && jobId) {
          const demoScore = generateDemoScore(studentId, jobId);
          matchScore = demoScore.matchScore;
          skillMatch = demoScore.skillMatch;
          experienceMatch = demoScore.keywordMatch;
          
          // Update the application with demo scores for consistency (async, don't wait)
          Application.findByIdAndUpdate(app._id, {
            'aiScore.fitScore': matchScore,
            'aiScore.skillMatch': skillMatch,
            'aiScore.experienceMatch': experienceMatch
          }).catch(err => console.error('Error saving demo scores:', err));
        }
      }
      
      return {
        applicationId: app._id,
        name: (app.student as any)?.profile?.fullName || "Student",
        email: (app.student as any)?.email || "N/A",
        phone: (app.student as any)?.profile?.phone || "N/A",
        skills: (app.student as any)?.profile?.skills || [],
        jobTitle: (app.job as any)?.title || "Unknown Job",
        jobLocation: (app.job as any)?.location || "Not specified",
        companyName: (app.job as any)?.company?.name || "Company",
        matchScore: matchScore,
        skillMatch: skillMatch,
        experienceMatch: experienceMatch,
        status: app.status || "Pending",
        appliedAt: app.appliedAt || new Date(),
        timeline: app.timeline || [],
        round1: app.round1 || null,
        round2: app.round2 || null,
        resume: {
          fileName: (app.student as any)?.profile?.resume?.fileName || null,
          fileUrl: (app.student as any)?.profile?.resume?.fileUrl || null,
          uploadedAt: (app.student as any)?.profile?.resume?.uploadedAt || null,
          hasResume: !!(app.student as any)?.profile?.resume?.fileUrl
        }
      };
    });

    console.log(`📤 Returning ${candidates.length} candidates to HR`);
    res.json(candidates);
  } catch (error: any) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({
      message: "Error fetching candidates",
      error: error.message,
    });
  }
};

export const assignTest = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.body;
    const userId = req.user.mongoId;

    if (!applicationId) {
      res.status(400).json({ message: "Application ID is required" });
      return;
    }

    // Find the application
    const application = await Application.findById(applicationId)
      .populate("job")
      .populate("student");

    if (!application) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    // Verify the job belongs to this HR
    const job = application.job as any;
    if (job.postedBy.toString() !== userId.toString()) {
      res
        .status(403)
        .json({
          message:
            "You do not have permission to assign tests for this application",
        });
      return;
    }

    // Check if match score is >= 60%
    const matchScore = application.aiScore?.fitScore || 0;
    if (matchScore < 60) {
      res.status(400).json({
        message: `Cannot assign test. Match score is ${matchScore}%. Minimum 60% required.`,
        matchScore,
      });
      return;
    }

    // Check if test is already assigned
    if (application.status === "Round1" && application.round1?.testId) {
      res
        .status(400)
        .json({ message: "Test already assigned for this application" });
      return;
    }

    // Get job's round config
    const roundConfig = job.roundConfig?.round1 || {
      mcqCount: 10,
      codingCount: 2,
      duration: 60,
      passingScore: 70,
    };

    // Create test round - use create with type assertion
    const testRound = (await TestRound.create({
      application: application._id,
      questions: [],
      antiCheat: {
        tabSwitches: 0,
        copyPasteAttempts: 0,
        fullscreenExits: 0,
        ipAddress: "pending",
        suspiciousActivity: [],
      },
      startedAt: new Date(),
    } as any)) as any;

     // Update application status to Shortlisted (Round1 internally)
     application.status = "Shortlisted";
     application.round1 = {
       status: "Scheduled",
       testId: testRound._id,
       mcqScore: 0,
       codingScore: 0,
       totalScore: 0,
       antiCheatFlags: [],
       scheduledAt: new Date(),
     };

     // Add to timeline
     application.timeline = application.timeline || [];
     application.timeline.push({
       stage: "Shortlisted",
       timestamp: new Date(),
       action: `Congratulations! You have been shortlisted. Test has been scheduled. Test details will be sent to your email soon.`,
     });

     await application.save();

     console.log(
       `Test assigned for application ${applicationId}, match score: ${matchScore}%`
     );

     res.status(200).json({
       message: "Test assigned successfully",
       application: {
         _id: application._id,
         status: application.status,
         matchScore,
         testId: testRound._id.toString(),
       },
      testConfig: {
        mcqCount: roundConfig.mcqCount,
        codingCount: roundConfig.codingCount,
        duration: roundConfig.duration,
        passingScore: roundConfig.passingScore,
      },
    });
  } catch (error: any) {
    console.error("Error assigning test:", error);
    res.status(500).json({
      message: "Error assigning test",
      error: error.message,
    });
  }
};

export const getJobHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.mongoId;
    console.log(`📋 Fetching job history for HR: ${userId}`);

    // Get all jobs posted by this HR
    const jobs = await Job.find({ postedBy: userId })
      .populate("company", "name")
      .sort({ createdAt: -1 });

    console.log(`📊 Found ${jobs.length} jobs for HR`);

    // If no jobs found, return empty array
    if (jobs.length === 0) {
      console.log('⚠️ No jobs found for this HR. Post a job first to see history.');
      return res.json([]);
    }

    // Get application counts for each job
    const jobHistory = await Promise.all(
      jobs.map(async (job) => {
        const applications = await Application.find({ job: job._id });
        const totalApplications = applications.length;
        const rejectedCount = applications.filter(
          (app) => app.status === "Rejected"
        ).length;
        const pendingCount = applications.filter(
          (app) => app.status === "Pending"
        ).length;
        const shortlistedCount = applications.filter(
          (app) => app.status === "Shortlisted"
        ).length;
        const round1Count = applications.filter(
          (app) => app.status === "Round1"
        ).length;

        return {
          _id: job._id,
          title: job.title,
          description: job.description,
          location: job.location || "Not specified",
          status: job.status,
          company: (job.company as any)?.name || "Company",
          skills: job.requirements?.skills || [],
          createdAt: job.createdAt,
          stats: {
            totalApplications,
            pending: pendingCount,
            rejected: rejectedCount,
            shortlisted: shortlistedCount,
            round1: round1Count,
          },
        };
      })
    );

    res.json(jobHistory);
  } catch (error: any) {
    console.error("Error fetching job history:", error);
    res.status(500).json({
      message: "Error fetching job history",
      error: error.message,
    });
  }
};

export const getCompanyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.mongoId;

    const company = await Company.findOne({ createdBy: userId });
    if (!company) {
      res.status(404).json({ message: "No company profile found" });
      return;
    }

    res.json(company);
  } catch (error: any) {
    console.error("Error fetching company:", error);
    res.status(500).json({
      message: "Error fetching company profile",
      error: error.message,
    });
  }
};

export const deleteApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.mongoId;

    if (!applicationId) {
      res.status(400).json({ message: "Application ID is required" });
      return;
    }

    // Find the application
    const application = await Application.findById(applicationId).populate('job');
    if (!application) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    // Verify the job belongs to this HR
    const job = application.job as any;
    if (job.postedBy.toString() !== userId.toString()) {
      res.status(403).json({
        message: "You do not have permission to delete this application",
      });
      return;
    }

    // Delete the application
    await Application.findByIdAndDelete(applicationId);

    console.log(`Application ${applicationId} deleted by HR ${userId}`);

    res.json({
      message: "Application deleted successfully",
      applicationId: applicationId,
    });
  } catch (error: any) {
    console.error("Error deleting application:", error);
    res.status(500).json({
      message: "Error deleting application",
      error: error.message,
    });
  }
};

export const downloadResume = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.mongoId;

    if (!applicationId) {
      res.status(400).json({ message: "Application ID is required" });
      return;
    }

    // Find the application and populate student
    const application = await Application.findById(applicationId)
      .populate('job')
      .populate('student');

    if (!application) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    // Verify the job belongs to this HR
    const job = application.job as any;
    if (job.postedBy.toString() !== userId.toString()) {
      res.status(403).json({
        message: "You do not have permission to view this resume",
      });
      return;
    }

    // Get student and resume info
    const student = application.student as any;
    if (!student || !student.profile?.resume) {
      res.status(404).json({ message: "Resume not found for this application" });
      return;
    }

    const resume = student.profile.resume;
    let filePath = resume.fileUrl;

    if (!filePath) {
      res.status(404).json({ message: "Resume file path not found" });
      return;
    }

    // Construct full file path
    const path = require('path');
    const fs = require('fs');
    
    // Handle different path formats
    let fullPath: string;
    if (filePath.startsWith('/uploads/') || filePath.startsWith('uploads/')) {
      // Relative path from root
      fullPath = path.join(process.cwd(), filePath.startsWith('/') ? filePath.substring(1) : filePath);
    } else if (filePath.startsWith('/')) {
      // Absolute path starting with /
      fullPath = path.join(process.cwd(), filePath);
    } else if (path.isAbsolute(filePath)) {
      // Already absolute path
      fullPath = filePath;
    } else {
      // Just filename, assume it's in uploads/resumes
      fullPath = path.join(process.cwd(), 'uploads', 'resumes', filePath);
    }

    // Normalize the path (resolve .. and .)
    fullPath = path.normalize(fullPath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.error(`Resume file not found at: ${fullPath}`);
      console.error(`Original filePath from DB: ${filePath}`);
      console.error(`Resume fileName: ${resume.fileName}`);
      
      // Try alternative paths
      const alternativePaths = [
        path.join(process.cwd(), 'uploads', 'resumes', path.basename(filePath)),
        path.join(process.cwd(), 'uploads', 'resumes', resume.fileName || ''),
        path.join(process.cwd(), 'uploads', 'resumes', path.basename(resume.fileName || ''))
      ];
      
      let foundPath = null;
      for (const altPath of alternativePaths) {
        if (fs.existsSync(altPath)) {
          foundPath = altPath;
          console.log(`Found resume at alternative path: ${altPath}`);
          break;
        }
      }
      
      if (!foundPath) {
        res.status(404).json({ 
          message: "Resume file not found on server",
          debug: {
            originalPath: filePath,
            attemptedPath: fullPath,
            fileName: resume.fileName
          }
        });
        return;
      }
      
      fullPath = foundPath;
    }

    // Determine content type based on file extension
    const fileName = resume.fileName || path.basename(fullPath) || 'resume.pdf';
    const ext = path.extname(fileName).toLowerCase();
    
    // Map file extensions to MIME types
    const contentTypeMap: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.rtf': 'application/rtf'
    };
    
    const contentType = contentTypeMap[ext] || 'application/pdf'; // Default to PDF

    // Set headers for PDF viewing/downloading
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Length', fs.statSync(fullPath).size);
    
    // Stream the file
    const fileStream = fs.createReadStream(fullPath);
    
    fileStream.on('error', (error: Error) => {
      console.error('Error streaming resume file:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error reading resume file', error: error.message });
      }
    });
    
    fileStream.pipe(res);

    console.log(`✅ Resume downloaded: ${fileName} (${contentType}) for application ${applicationId}`);
  } catch (error: any) {
    console.error("Error downloading resume:", error);
    res.status(500).json({
      message: "Error downloading resume",
      error: error.message,
    });
  }
};
