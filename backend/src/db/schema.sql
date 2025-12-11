CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  role TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  positions INTEGER,
  required_skills TEXT,
  round_config TEXT, -- New: JSON { round1: 'mcq_coding', round2: 'interview' }
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resumes (
  id TEXT PRIMARY KEY,
  job_id TEXT, -- New: Link to job
  status TEXT, -- New: APPLIED, REJECTED, TALENT_POOL, EXAM_PENDING, ROUND_2, SHORTLISTED
  original_file_url TEXT,
  parsed_content TEXT,
  candidate_email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(job_id) REFERENCES jobs(id)
);

CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  resume_id TEXT,
  job_id TEXT,
  base_score REAL,
  skill_match_score REAL,
  exp_score REAL,
  flags TEXT,
  explanation TEXT,
  feedback_links TEXT, -- New: JSON list of learning resources
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(resume_id) REFERENCES resumes(id),
  FOREIGN KEY(job_id) REFERENCES jobs(id)
);

CREATE TABLE IF NOT EXISTS tests (
  id TEXT PRIMARY KEY,
  resume_id TEXT,
  token TEXT UNIQUE,
  type TEXT,
  status TEXT,
  result_score REAL,
  result_feedback TEXT,
  anti_cheat_log TEXT,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(resume_id) REFERENCES resumes(id)
);
