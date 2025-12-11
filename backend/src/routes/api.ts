import { Router } from 'express';
import multer from 'multer';
import { protect, authorize } from '../middleware/auth';
import { registerUser, loginUser } from '../controllers/authController';
import { createCompany, createJob, getCandidates, getCompanyProfile, getJobHistory, assignTest, deleteApplication } from '../controllers/hrController';
import { uploadResume, getStudentProfile, getAvailableJobs, applyForJob, getMyApplications, getCompanyByJobId, withdrawApplication } from '../controllers/studentController';
import { getAssignedTests, submitTest } from '../controllers/testController';

const router = Router();

// Configure Multer for Max 50KB with memory storage
const upload = multer({
    storage: multer.memoryStorage(), // Store files in memory as Buffer
    limits: { fileSize: 50 * 1024 }, // 50 KB server-side limit
});

// Auth
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);

// HR Routes
router.get('/hr/company', protect, authorize(['HR']), getCompanyProfile);
router.post('/hr/company', protect, authorize(['HR']), createCompany);
router.post('/hr/job', protect, authorize(['HR']), createJob);
router.get('/hr/candidates', protect, authorize(['HR']), getCandidates);
router.post('/hr/assign-test', protect, authorize(['HR']), assignTest);
router.get('/hr/job-history', protect, authorize(['HR']), getJobHistory);
router.delete('/hr/application/:applicationId', protect, authorize(['HR']), deleteApplication);
// Allow HR to preview jobs that students can see (for testing)
router.get('/hr/preview-jobs', protect, authorize(['HR']), getAvailableJobs);

// Student Routes
router.get('/student/jobs', protect, authorize(['STUDENT']), getAvailableJobs);
router.get('/student/applications', protect, authorize(['STUDENT']), getMyApplications);
router.post('/student/apply', protect, authorize(['STUDENT']), applyForJob);
router.post('/student/upload-resume', protect, authorize(['STUDENT']), upload.single('resume'), uploadResume);
router.get('/student/profile', protect, authorize(['STUDENT']), getStudentProfile);
router.get('/student/company/:jobId', protect, authorize(['STUDENT']), getCompanyByJobId);
router.post('/student/withdraw-application/:applicationId', protect, authorize(['STUDENT']), withdrawApplication);

// Test Routes
router.get('/student/tests', protect, authorize(['STUDENT']), getAssignedTests);
router.post('/student/tests/submit', protect, authorize(['STUDENT']), submitTest);

export default router;
