# Hireflow AI: Complete Architecture Implementation Plan

## 🎯 Implementation Phases

### Phase 1: Database Schema & Models ✅
- [x] Enhanced User model (HR/Student separation)
- [ ] Job model with round configuration
- [ ] Application model with status tracking
- [ ] TalentPool model
- [ ] TestRound model (MCQ + Coding)
- [ ] AntiCheatLog model

### Phase 2: Backend Core Services
- [ ] Early Rejection Layer
  - [ ] File validation service
  - [ ] Email/Phone format checker
  - [ ] AI sanity check (fake dates, spam detection)
- [ ] AI Core Engine
  - [ ] Resume parser (contextual)
  - [ ] Fit score calculator
  - [ ] Skill gap analyzer
  - [ ] Auto test generator
- [ ] Anti-Cheat System
  - [ ] Tab switch detector
  - [ ] Copy/paste blocker
  - [ ] IP duplicate checker
  - [ ] Camera monitoring

### Phase 3: HR Dashboard Features
- [ ] Job posting with round config UI
- [ ] Candidate leaderboard
- [ ] AI report viewer
- [ ] Talent pool management
- [ ] Real-time alerts dashboard
- [ ] Bulk actions (move to pool, reject, invite)

### Phase 4: Student Dashboard Features
- [ ] Job browser with fit scores
- [ ] Resume upload with validation
- [ ] Application status tracker
- [ ] Performance feedback view
- [ ] Skill improvement suggestions
- [ ] Resume AI analysis report

### Phase 5: Assessment System
- [ ] Round 1: Online exam (MCQ + Coding)
  - [ ] Timer & progress UI
  - [ ] Fullscreen enforcement
  - [ ] Anti-cheat integration
- [ ] Round 2: Interview/Advanced coding
- [ ] Auto-grading system
- [ ] Result analysis & feedback

### Phase 6: Integration & Testing
- [ ] End-to-end flow testing
- [ ] Anti-cheat validation
- [ ] Performance optimization
- [ ] Production deployment

---

## 📊 Updated Database Schemas

### 1. Enhanced User Model
```javascript
{
  clerkId: String,
  email: String,
  role: 'HR' | 'STUDENT',
  profile: {
    fullName: String,
    phone: String,
    // HR specific
    company: ObjectId (ref: Company),
    designation: String,
    // Student specific
    skills: [String],
    experience: Number,
    education: String,
    resume: {
      fileUrl: String,
      aiAnalysis: {
        parsedSkills: [String],
        fitScores: Map, // jobId -> score
        skillGaps: [String],
        recommendations: [String]
      }
    }
  },
  applications: [ObjectId] (ref: Application),
  createdAt: Date
}
```

### 2. Job Model
```javascript
{
  title: String,
  description: String,
  requirements: {
    skills: [String],
    experience: { min: Number, max: Number },
    education: [String]
  },
  roundConfig: {
    round1: {
      mcqCount: Number (default: 10),
      codingCount: Number (default: 2),
      duration: Number (minutes),
      passingScore: Number (percentage)
    },
    round2: {
      enabled: Boolean,
      type: 'Interview' | 'Coding' | 'Both',
      duration: Number
    }
  },
  postedBy: ObjectId (ref: User, role=HR),
  company: ObjectId (ref: Company),
  status: 'Active' | 'Closed',
  applications: [ObjectId],
  createdAt: Date
}
```

### 3. Application Model (Complete Lifecycle)
```javascript
{
  student: ObjectId (ref: User),
  job: ObjectId (ref: Job),
  status: 'Rejected' | 'Pending' | 'Round1' | 'Round2' | 'Shortlisted' | 'TalentPool',
  rejectionReason: String, // Early rejection or failed round
  aiScore: {
    fitScore: Number (0-100),
    skillMatch: Number,
    experienceMatch: Number,
    overallRank: Number
  },
  round1: {
    status: 'Scheduled' | 'InProgress' | 'Completed' | 'Failed',
    startTime: Date,
    endTime: Date,
    mcqScore: Number,
    codingScore: Number,
    totalScore: Number,
    antiCheatFlags: [String],
    feedback: String
  },
  round2: {
    status: String,
    scheduledAt: Date,
    interviewer: ObjectId,
    notes: String,
    rating: Number
  },
  talentPool: {
    addedAt: Date,
    reason: String, // 'Round2Failed-GoodSkills' | 'WrongRole-TopTalent'
    tags: [String],
    hrNotes: String
  },
  timeline: [{
    stage: String,
    timestamp: Date,
    action: String
  }],
  appliedAt: Date
}
```

### 4. TalentPool Model
```javascript
{
  candidate: ObjectId (ref: User),
  originalJob: ObjectId (ref: Job),
  reason: String,
  skills: [String],
  fitScores: Map, // potential matches for other jobs
  tags: [String], // 'Frontend Expert', 'NeedsBackend', etc.
  hrNotes: String,
  status: 'Active' | 'Contacted' | 'Hired-OtherRole',
  addedAt: Date
}
```

### 5. TestRound Model (Round 1)
```javascript
{
  application: ObjectId (ref: Application),
  questions: [{
    type: 'MCQ' | 'Coding',
    question: String,
    options: [String], // for MCQ
    correctAnswer: String,
    testCases: [Object], // for Coding
    points: Number,
    studentAnswer: String,
    isCorrect: Boolean,
    timeSpent: Number
  }],
  antiCheat: {
    tabSwitches: Number,
    copyPasteAttempts: Number,
    fullscreenExits: Number,
    ipAddress: String,
    cameraSnapshots: [String], // URLs to stored images
    suspiciousActivity: [String]
  },
  startedAt: Date,
  submittedAt: Date,
  isAutoGraded: Boolean
}
```

### 6. AntiCheatLog Model
```javascript
{
  student: ObjectId,
  test: ObjectId (ref: TestRound),
  eventType: 'TabSwitch' | 'CopyPaste' | 'FullscreenExit' | 'DuplicateIP',
  timestamp: Date,
  metadata: Object,
  severity: 'Low' | 'Medium' | 'High'
}
```

---

## 🔄 Application Flow States

```
Resume Upload → Early Rejection → AI Analysis → Decision Node
                                                     ↓
                            ┌────────────────────────┼─────────────────────┐
                            ↓                        ↓                     ↓
                    (Low Match REJECT)     (High Match → Round 1)   (Good Skills → Talent Pool)
                            ↓                        ↓                     
                    Send Learning Links        MCQ + Coding Exam          
                                                     ↓
                                            (Pass/Fail Analysis)
                                                     ↓
                                            ┌────────┴───────┐
                                            ↓                ↓
                                      (Pass → Round 2)  (Fail → Talent Pool)
                                            ↓
                                    (HR Manual Review)
                                            ↓
                                    ┌───────┴────────┐
                                    ↓                ↓
                            (Final Shortlist)  (Talent Pool)
```

---

## 🎨 UI Component Structure

### HR Dashboard Components
```
/dashboard/hr
├── JobPosting.tsx              # Create job with round config
├── CandidateLeaderboard.tsx    # Ranked list with AI scores
├── ApplicationCard.tsx         # Individual candidate card
├── TalentPoolManager.tsx       # View/manage talent pool
├── AntiCheatAlerts.tsx         # Real-time monitoring
└── ReportViewer.tsx            # AI analysis reports
```

### Student Dashboard Components
```
/dashboard/student
├── JobBrowse.tsx               # List jobs with fit scores
├── ApplicationTracker.tsx      # Status timeline
├── ResumeUpload.tsx            # Upload with validation
├── SkillAnalysis.tsx           # AI report view
├── TestInterface.tsx           # Round 1 exam UI
└── FeedbackView.tsx            # Post-test feedback
```

---

## 🔌 API Endpoints

### HR Routes
```
POST   /api/hr/job/create          # With round config
GET    /api/hr/job/:id/candidates  # Leaderboard
POST   /api/hr/candidate/move-to-pool
POST   /api/hr/candidate/invite-round2
GET    /api/hr/talent-pool          # View stored candidates
PUT    /api/hr/talent-pool/:id/notes
GET    /api/hr/anti-cheat/alerts    # Real-time flags
```

### Student Routes
```
GET    /api/student/jobs            # With fit scores
POST   /api/student/apply/:jobId
GET    /api/student/applications    # Status tracker
POST   /api/student/upload-resume   # With validation
GET    /api/student/resume/analysis
GET    /api/student/test/:id/start
POST   /api/student/test/:id/submit
GET    /api/student/feedback/:appId
```

### Assessment Routes
```
POST   /api/test/generate           # AI generates MCQ+Coding
POST   /api/test/anti-cheat/log     # Tab switch, etc.
POST   /api/test/grade              # Auto-grade Round 1
```

---

## 🧠 AI Services Integration Points

### 1. Resume Parser (Early Rejection)
```typescript
interface ResumeValidation {
  isValid: boolean;
  errors: string[]; // Missing email, invalid phone, etc.
  warnings: string[]; // Suspicious dates, spam keywords
}

async validateResume(file: Buffer): Promise<ResumeValidation>
```

### 2. Fit Score Calculator
```typescript
interface FitScoreResult {
  overall: number; // 0-100
  breakdown: {
    skillMatch: number;
    experienceMatch: number;
    educationMatch: number;
  };
  skillGaps: string[];
  recommendations: string[];
}

async calculateFitScore(resume: Resume, job: Job): Promise<FitScoreResult>
```

### 3. Test Generator
```typescript
interface GeneratedTest {
  mcqs: MCQQuestion[];
  codingProblems: CodingQuestion[];
}

async generateTest(jobDescription: string, config: RoundConfig): Promise<GeneratedTest>
```

---

## 🚨 Anti-Cheat Implementation

### Client-Side (Student Dashboard)
```typescript
// Fullscreen enforcement
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    logAntiCheat('FullscreenExit');
  }
});

// Tab switch detection
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    logAntiCheat('TabSwitch');
  }
});

// Copy/Paste blocking
document.addEventListener('copy', (e) => e.preventDefault());
document.addEventListener('paste', (e) => e.preventDefault());

// Camera monitoring (periodic snapshots)
setInterval(() => captureWebcam(), 60000); // Every 60 seconds
```

### Server-Side Validation
```typescript
// IP duplicate check
async checkDuplicateIP(ip: string, testId: string): Promise<boolean> {
  const existing = await TestRound.findOne({ 
    'antiCheat.ipAddress': ip,
    _id: { $ne: testId },
    submittedAt: { $gte: new Date(Date.now() - 3600000) } // Last hour
  });
  return !!existing;
}
```

---

## 📈 Implementation Priority

**Immediate (Week 1):**
1. Update database models
2. Implement Early Rejection Layer
3. Create basic AI Core (fit scoring)
4. Build HR job posting with round config

**Short-term (Week 2):**
5. Student application flow
6. Round 1 test interface
7. Anti-cheat client-side
8. Auto-grading system

**Medium-term (Week 3-4):**
9. Talent Pool management
10. Round 2 workflows
11. Dashboard analytics
12. Performance optimizations

---

## 🔒 Security & Validation

- ✅ Resume file size: 30-50KB
- ✅ Allowed formats: PDF only
- ✅ Clerk JWT validation on all routes
- ✅ Role-based authorization (strict HR/STUDENT)
- ✅ Rate limiting on test submission
- ✅ Anti-cheat logs encryption
- ✅ Camera snapshots stored securely (S3/Cloudinary)

---

## 📊 Success Metrics

- Resume upload success rate: >95%
- AI fit score accuracy: >80%
- Anti-cheat detection rate: >90%
- Average time to shortlist: <2 days
- Talent pool conversion rate: Track monthly

---

**Status:** Ready for Phase 1 Implementation  
**Last Updated:** December 11, 2025
