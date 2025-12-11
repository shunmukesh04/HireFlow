import { Request, Response } from "express";
import { Company, Job, User, Application, TestRound, ITestRound } from "../models/index";
import { AuthRequest } from "../middleware/auth";

export const createCompany = async (req: AuthRequest, res: Response) => {
  try {
    console.log("Creating Company for User:", req.user);
    const { name, address, website, contactPerson, size, description } =
      req.body;

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

    const userId = req.user.mongoId;

    let query: any = {};

    if (jobId) {
      // Get candidates for specific job
      query.job = jobId;
    } else {
      // Get all candidates for jobs posted by this HR
      const jobs = await Job.find({ postedBy: userId }).select("_id");
      const jobIds = jobs.map((j) => j._id);
      query.job = { $in: jobIds };
    }

    // Fetch applications with populated student and job details
    const applications = await Application.find(query)
      .populate(
        "student",
        "profile.fullName email profile.skills profile.phone"
      )
      .populate("job", "title location")
      .sort({ appliedAt: -1 });

    // Format response
    const candidates = applications.map((app) => ({
      applicationId: app._id,
      name: (app.student as any)?.profile?.fullName || "Student",
      email: (app.student as any)?.email || "N/A",
      phone: (app.student as any)?.profile?.phone || "N/A",
      skills: (app.student as any)?.profile?.skills || [],
      jobTitle: (app.job as any)?.title || "Unknown Job",
      jobLocation: (app.job as any)?.location || "Not specified",
      matchScore: app.aiScore?.fitScore || 0,
      status: app.status || "Pending",
      appliedAt: app.appliedAt || new Date(),
    }));

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

     // Update application status to Round1
     application.status = "Round1";
     application.round1 = {
       status: "Scheduled",
       testId: testRound._id,
       mcqScore: 0,
       codingScore: 0,
       totalScore: 0,
       antiCheatFlags: [],
     };

     // Add to timeline
     application.timeline = application.timeline || [];
     application.timeline.push({
       stage: "Round1",
       timestamp: new Date(),
       action: `Test assigned by HR. Match score: ${matchScore}%`,
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

    // Get all jobs posted by this HR
    const jobs = await Job.find({ postedBy: userId })
      .populate("company", "name")
      .sort({ createdAt: -1 });

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
