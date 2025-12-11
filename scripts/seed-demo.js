const path = require('path');
const fs = require('fs');

// Try to resolve better-sqlite3 from backend
let Database;
try {
    Database = require('../backend/node_modules/better-sqlite3');
} catch (e) {
    console.error('Please run "npm install" in backend directory first.');
    process.exit(1);
}

const dbPath = path.join(__dirname, '../backend/dev.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

// DELETE OLD DB to apply new schema clearly
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new Database(dbPath);
console.log('Seeding demo data into', dbPath);

const schemaPath = path.join(__dirname, '../backend/src/db/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);

// --- SEED DATA ---

// 1. Admin User
db.prepare('INSERT OR REPLACE INTO users (id, email, role) VALUES (?, ?, ?)').run('admin-user', 'admin@hireflow.com', 'ADMIN');

// 2. Jobs
const jobs = [
    {
        id: 'job-demo-1',
        title: 'Senior Frontend Engineer',
        description: 'We are looking for an experienced Frontend Engineer to build scalable web applications using React and TypeScript.',
        positions: 2,
        required_skills: JSON.stringify(['React', 'TypeScript', 'Tailwind CSS', 'Redux', 'System Design']),
        round_config: JSON.stringify({ round1: 'Coding,AntiCheat', round2: 'Interview' })
    },
    {
        id: 'job-demo-2',
        title: 'Backend Engineer (Node.js)',
        description: 'Join our backend team to build high-performance APIs.',
        positions: 1,
        required_skills: JSON.stringify(['Node.js', 'Express', 'PostgreSQL', 'Redis', 'Docker']),
        round_config: JSON.stringify({ round1: 'SystemDesign,Coding', round2: 'Managerial' })
    }
];

const insertJob = db.prepare('INSERT OR REPLACE INTO jobs (id, title, description, positions, required_skills, round_config) VALUES (@id, @title, @description, @positions, @required_skills, @round_config)');
jobs.forEach(job => insertJob.run(job));

// 3. Resumes (Mock)
// Bob: Rejected (Score: 28%)
// Charlie: Exam Pending (Score: 85%) -> Has Test Link
// Alice: Talent Pool (Score: 50%)

const resumes = [
    {
        id: 'resume-demo-rej',
        job_id: 'job-demo-1',
        status: 'REJECTED',
        original_file_url: 'bob_junior.pdf',
        parsed_content: JSON.stringify({
            name: 'Bob Script',
            email: 'bob@student.com', // Student Email
            phone: '987-654-3210',
            skills: ['HTML', 'CSS', 'JavaScript'],
            experienceYears: 1,
            education: ['Bootcamp']
        }),
        candidate_email: 'bob@student.com'
    },
    {
        id: 'resume-demo-pass',
        job_id: 'job-demo-1',
        status: 'EXAM_PENDING',
        original_file_url: 'alice_pro.pdf',
        parsed_content: JSON.stringify({
            name: 'Alice Dev',
            email: 'alice@student.com',
            phone: '123-456-7890',
            skills: ['React', 'TypeScript', 'Node.js', 'Redux', 'AWS'],
            experienceYears: 4,
            education: ['BS CS']
        }),
        candidate_email: 'alice@student.com'
    },
    {
        id: 'resume-demo-talent',
        job_id: 'job-demo-2',
        status: 'TALENT_POOL',
        original_file_url: 'charlie_mid.pdf',
        parsed_content: JSON.stringify({
            name: 'Charlie Mid',
            email: 'charlie@student.com',
            phone: '555-000-1111',
            skills: ['Node.js', 'Express', 'Mongo'],
            experienceYears: 2,
            education: ['Self Taught']
        }),
        candidate_email: 'charlie@student.com'
    }
];

const insertResume = db.prepare('INSERT OR REPLACE INTO resumes (id, job_id, status, original_file_url, parsed_content, candidate_email) VALUES (@id, @job_id, @status, @original_file_url, @parsed_content, @candidate_email)');
resumes.forEach(r => insertResume.run(r));

// 4. Scores
db.prepare('INSERT INTO scores (id, resume_id, job_id, base_score, skill_match_score, exp_score, flags, explanation, feedback_links) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run('score-1', 'resume-demo-rej', 'job-demo-1', 28, 20, 10, '["Low Exp"]', '{"missing":["React","Redux"]}', '[{"skill":"React","url":"https://udemy.com"}]');

db.prepare('INSERT INTO scores (id, resume_id, job_id, base_score, skill_match_score, exp_score, flags, explanation, feedback_links) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run('score-2', 'resume-demo-pass', 'job-demo-1', 88, 90, 40, '[]', '{"missing":[]}', '[]');

db.prepare('INSERT INTO scores (id, resume_id, job_id, base_score, skill_match_score, exp_score, flags, explanation, feedback_links) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run('score-3', 'resume-demo-talent', 'job-demo-2', 55, 60, 20, '[]', '{"missing":["Docker"]}', '[{"skill":"Docker","url":"https://udemy.com"}]');


// 5. Tests (For Alice)
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
db.prepare('INSERT INTO tests (id, resume_id, token, type, status, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run('test-1', 'resume-demo-pass', 'demo-token-alice', 'round_1_coding', 'PENDING', tomorrow.toISOString());

console.log('Seeded New Demo Data (Bob=Reject, Alice=Exam, Charlie=TalentPool)');
console.log('Use email "alice@student.com" to view Student Dashboard for a success case.');
