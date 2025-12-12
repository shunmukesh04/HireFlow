import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, authorize } from '../middleware/auth';
import { registerUser, loginUser, checkUserRole } from '../controllers/authController';
import { createCompany, createJob, getCandidates, getCompanyProfile, getJobHistory, assignTest, deleteApplication, downloadResume } from '../controllers/hrController';
import { uploadResume, getStudentProfile, getAvailableJobs, applyForJob, getMyApplications, getCompanyByJobId, withdrawApplication } from '../controllers/studentController';
import { getAssignedTests, submitTest } from '../controllers/testController';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'resumes');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer for Max 50KB with disk storage
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
            // Generate unique filename: userId_timestamp_originalname
            const userId = (req as any).user?.mongoId || 'unknown';
            const timestamp = Date.now();
            const ext = path.extname(file.originalname).toLowerCase();
            const baseName = path.basename(file.originalname, ext);
            const safeName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
            
            // Ensure PDF extension if not provided (for demo purposes)
            const finalExt = ext || '.pdf';
            cb(null, `${userId}_${timestamp}_${safeName}${finalExt}`);
        }
    }),
    limits: { fileSize: 50 * 1024 }, // 50 KB server-side limit
    fileFilter: (req, file, cb) => {
        // Accept PDF, DOC, DOCX files
        const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        
        const allowedExts = ['.pdf', '.doc', '.docx', '.txt'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (allowedExts.includes(ext) || allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
        }
    }
});

// Auth
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.get('/auth/check-role', protect, checkUserRole); // Utility endpoint to check/fix user role

// HR Routes
router.get('/hr/company', protect, authorize(['HR']), getCompanyProfile);
router.post('/hr/company', protect, authorize(['HR']), createCompany);
router.post('/hr/job', protect, authorize(['HR']), createJob);
router.get('/hr/candidates', protect, authorize(['HR']), getCandidates);
router.post('/hr/assign-test', protect, authorize(['HR']), assignTest);
router.get('/hr/job-history', protect, authorize(['HR']), getJobHistory);
router.delete('/hr/application/:applicationId', protect, authorize(['HR']), deleteApplication);
router.get('/hr/resume/:applicationId', protect, authorize(['HR']), downloadResume);
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
