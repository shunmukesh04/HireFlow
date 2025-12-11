"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const index_1 = __importDefault(require("../db/index"));
const parsingService_1 = require("../services/parsingService");
const scoringService_1 = require("../services/scoringService");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)(); // Memory storage
// HR: Job Creation
router.post('/hr/job', (req, res) => {
    const { title, description, positions, required_skills } = req.body;
    const id = (0, uuid_1.v4)();
    const stmt = index_1.default.prepare('INSERT INTO jobs (id, title, description, positions, required_skills) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, title, description, positions, JSON.stringify(required_skills));
    res.json({ id, message: 'Job created' });
});
// HR: List Jobs
router.get('/hr/jobs', (req, res) => {
    const jobs = index_1.default.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all();
    res.json(jobs.map((j) => ({ ...j, required_skills: JSON.parse(j.required_skills) })));
});
// HR: Upload Resume & Score
router.post('/hr/upload-resumes', upload.single('resume'), async (req, res) => {
    try {
        const file = req.file;
        const { jobId } = req.body;
        if (!file || !jobId) {
            res.status(400).json({ error: 'Missing file or jobId' });
            return;
        }
        // 1. Parse
        const parsed = await (0, parsingService_1.parseResume)(file.buffer, file.originalname);
        // 2. Save Resume
        const resumeId = (0, uuid_1.v4)();
        const resumeStmt = index_1.default.prepare('INSERT INTO resumes (id, original_file_url, parsed_content, candidate_email) VALUES (?, ?, ?, ?)');
        resumeStmt.run(resumeId, file.originalname, JSON.stringify(parsed), parsed.email);
        // 3. Score
        const job = index_1.default.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }
        const jobSkills = JSON.parse(job.required_skills);
        const scoreResult = (0, scoringService_1.scoreResume)(parsed, jobSkills);
        const scoreId = (0, uuid_1.v4)();
        const scoreStmt = index_1.default.prepare('INSERT INTO scores (id, resume_id, job_id, base_score, skill_match_score, exp_score, flags, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        scoreStmt.run(scoreId, resumeId, jobId, scoreResult.baseScore, scoreResult.skillMatchScore, scoreResult.expScore, JSON.stringify(scoreResult.flags), JSON.stringify(scoreResult.explanation));
        res.json({ resumeId, score: scoreResult });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Processing failed' });
    }
});
// HR: Get Candidates for Job
router.get('/hr/candidates', (req, res) => {
    const { jobId } = req.query;
    if (!jobId) {
        res.status(400).json({ error: 'Missing jobId' });
        return;
    }
    // Join resumes and scores
    const rows = index_1.default.prepare(`
        SELECT r.*, s.base_score, s.skill_match_score, s.explanation 
        FROM resumes r 
        JOIN scores s ON r.id = s.resume_id 
        WHERE s.job_id = ? 
        ORDER BY s.base_score DESC
    `).all(jobId);
    const candidates = rows.map((row) => ({
        ...row,
        parsed_content: JSON.parse(row.parsed_content),
        explanation: JSON.parse(row.explanation)
    }));
    res.json(candidates);
});
// Test Creation
router.post('/tests/create', (req, res) => {
    const { resumeId, type } = req.body;
    const token = (0, uuid_1.v4)();
    const id = (0, uuid_1.v4)();
    const stmt = index_1.default.prepare('INSERT INTO tests (id, resume_id, token, type, status, expires_at) VALUES (?, ?, ?, ?, ?, ?)');
    // Expire in 24h
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    stmt.run(id, resumeId, token, type || 'general', 'PENDING', expiresAt);
    res.json({ link: `/test/${token}`, token });
});
// Candidate: Get Test
router.get('/tests/:token', (req, res) => {
    const { token } = req.params;
    const test = index_1.default.prepare('SELECT * FROM tests WHERE token = ?').get(token);
    if (!test) {
        res.status(404).json({ error: 'Invalid test token' });
        return;
    } // cast to void or return
    res.json(test);
});
// Candidate: Submit Test
router.post('/tests/:token/submit', (req, res) => {
    const { token } = req.params;
    const { answers, antiCheatLog } = req.body;
    // Mock Grading
    const score = Math.floor(Math.random() * 40) + 60; // 60-100 random
    const stmt = index_1.default.prepare('UPDATE tests SET status = ?, result_score = ?, anti_cheat_log = ? WHERE token = ?');
    stmt.run('COMPLETED', score, JSON.stringify(antiCheatLog), token);
    res.json({ score, message: 'Test submitted' });
});
exports.default = router;
