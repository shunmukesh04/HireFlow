import mongoose, { Schema, Document } from 'mongoose';

// ===============================
// USER MODEL (HR & STUDENT)
// ===============================
export interface IUser extends Document {
    clerkId: string;
    email: string;
    role: 'HR' | 'STUDENT';
    profile: {
        fullName?: string;
        phone?: string;
        // HR specific
        company?: mongoose.Types.ObjectId;
        designation?: string;
        // Student specific
        skills?: string[];
        experience?: number;
        education?: string;
        resume?: {
            fileUrl: string;
            fileName: string;
            uploadedAt: Date;
            aiAnalysis?: {
                parsedSkills: string[];
                fitScores: Map<string, number>;
                skillGaps: string[];
                recommendations: string[];
            };
        };
    };
    applications?: mongoose.Types.ObjectId[];
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    role: { type: String, enum: ['HR', 'STUDENT'], default: 'STUDENT' },
    profile: {
        fullName: String,
        phone: String,
        company: { type: Schema.Types.ObjectId, ref: 'Company' },
        designation: String,
        skills: [String],
        experience: Number,
        education: String,
        resume: {
            fileUrl: String,
            fileName: String,
            uploadedAt: Date,
            aiAnalysis: {
                parsedSkills: [String],
                fitScores: { type: Map, of: Number },
                skillGaps: [String],
                recommendations: [String]
            }
        }
    },
    applications: [{ type: Schema.Types.ObjectId, ref: 'Application' }],
    createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model<IUser>('User', UserSchema);

// ===============================
// COMPANY MODEL
// ===============================
export interface ICompany extends Document {
    name: string;
    website?: string;
    description?: string;
    address?: string;
    contactPerson?: string;
    size?: string;
    createdBy: mongoose.Types.ObjectId; // HR User
    jobs?: mongoose.Types.ObjectId[];
    createdAt: Date;
}

const CompanySchema = new Schema<ICompany>({
    name: { type: String, required: true },
    website: String,
    description: String,
    address: String,
    contactPerson: String,
    size: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jobs: [{ type: Schema.Types.ObjectId, ref: 'Job' }],
    createdAt: { type: Date, default: Date.now }
});

export const Company = mongoose.model<ICompany>('Company', CompanySchema);

// ===============================
// JOB MODEL (With Round Config)
// ===============================
export interface IJob extends Document {
    title: string;
    description: string;
    requirements: {
        skills: string[];
        experience: { min: number; max: number };
        education: string[];
    };
    roundConfig: {
        round1: {
            mcqCount: number;
            codingCount: number;
            duration: number; // minutes
            passingScore: number; // percentage
        };
        round2: {
            enabled: boolean;
            type?: 'Interview' | 'Coding' | 'Both';
            duration?: number;
        };
    };
    postedBy: mongoose.Types.ObjectId;
    company: mongoose.Types.ObjectId;
    status: 'Active' | 'Closed';
    applications: mongoose.Types.ObjectId[];
    location?: string;
    createdAt: Date;
}

const JobSchema = new Schema<IJob>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirements: {
        skills: [String],
        experience: {
            min: { type: Number, default: 0 },
            max: { type: Number, default: 10 }
        },
        education: [String]
    },
    roundConfig: {
        round1: {
            mcqCount: { type: Number, default: 10 },
            codingCount: { type: Number, default: 2 },
            duration: { type: Number, default: 60 },
            passingScore: { type: Number, default: 70 }
        },
        round2: {
            enabled: { type: Boolean, default: false },
            type: { type: String, enum: ['Interview', 'Coding', 'Both'] },
            duration: Number
        }
    },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    status: { type: String, enum: ['Active', 'Closed'], default: 'Active' },
    applications: [{ type: Schema.Types.ObjectId, ref: 'Application' }],
    location: String,
    createdAt: { type: Date, default: Date.now }
});

export const Job = mongoose.model<IJob>('Job', JobSchema);

// ===============================
// APPLICATION MODEL (Complete Lifecycle)
// ===============================
export interface IApplication extends Document {
    student: mongoose.Types.ObjectId;
    job: mongoose.Types.ObjectId;
    status: 'Rejected' | 'Pending' | 'Round1' | 'Round2' | 'Shortlisted' | 'TalentPool';
    rejectionReason?: string;
    aiScore: {
        fitScore: number;
        skillMatch: number;
        experienceMatch: number;
        overallRank: number;
    };
    round1?: {
        status: 'Scheduled' | 'InProgress' | 'Completed' | 'Failed';
        startTime?: Date;
        endTime?: Date;
        mcqScore?: number;
        codingScore?: number;
        totalScore?: number;
        antiCheatFlags?: string[];
        feedback?: string;
    };
    round2?: {
        status: 'Scheduled' | 'Completed' | 'Failed';
        scheduledAt?: Date;
        interviewer?: mongoose.Types.ObjectId;
        notes?: string;
        rating?: number;
    };
    talentPool?: {
        addedAt: Date;
        reason: string;
        tags: string[];
        hrNotes?: string;
    };
    timeline: Array<{
        stage: string;
        timestamp: Date;
        action: string;
    }>;
    appliedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>({
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    status: {
        type: String,
        enum: ['Rejected', 'Pending', 'Round1', 'Round2', 'Shortlisted', 'TalentPool'],
        default: 'Pending'
    },
    rejectionReason: String,
    aiScore: {
        fitScore: { type: Number, default: 0 },
        skillMatch: { type: Number, default: 0 },
        experienceMatch: { type: Number, default: 0 },
        overallRank: { type: Number, default: 0 }
    },
    round1: {
        status: { type: String, enum: ['Scheduled', 'InProgress', 'Completed', 'Failed'] },
        startTime: Date,
        endTime: Date,
        mcqScore: Number,
        codingScore: Number,
        totalScore: Number,
        antiCheatFlags: [String],
        feedback: String
    },
    round2: {
        status: { type: String, enum: ['Scheduled', 'Completed', 'Failed'] },
        scheduledAt: Date,
        interviewer: { type: Schema.Types.ObjectId, ref: 'User' },
        notes: String,
        rating: Number
    },
    talentPool: {
        addedAt: Date,
        reason: String,
        tags: [String],
        hrNotes: String
    },
    timeline: [{
        stage: String,
        timestamp: { type: Date, default: Date.now },
        action: String
    }],
    appliedAt: { type: Date, default: Date.now }
});

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);

// ===============================
// TALENT POOL MODEL
// ===============================
export interface ITalentPool extends Document {
    candidate: mongoose.Types.ObjectId;
    originalJob: mongoose.Types.ObjectId;
    reason: string;
    skills: string[];
    fitScores: Map<string, number>;
    tags: string[];
    hrNotes?: string;
    status: 'Active' | 'Contacted' | 'Hired-OtherRole';
    addedAt: Date;
}

const TalentPoolSchema = new Schema<ITalentPool>({
    candidate: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    originalJob: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    reason: { type: String, required: true },
    skills: [String],
    fitScores: { type: Map, of: Number },
    tags: [String],
    hrNotes: String,
    status: {
        type: String,
        enum: ['Active', 'Contacted', 'Hired-OtherRole'],
        default: 'Active'
    },
    addedAt: { type: Date, default: Date.now }
});

export const TalentPool = mongoose.model<ITalentPool>('TalentPool', TalentPoolSchema);

// ===============================
// TEST ROUND MODEL (Round 1)
// ===============================
export interface ITestRound extends Document {
    application: mongoose.Types.ObjectId;
    questions: Array<{
        type: 'MCQ' | 'Coding';
        question: string;
        options?: string[];
        correctAnswer?: string;
        testCases?: any[];
        points: number;
        studentAnswer?: string;
        isCorrect?: boolean;
        timeSpent?: number;
    }>;
    antiCheat: {
        tabSwitches: number;
        copyPasteAttempts: number;
        fullscreenExits: number;
        ipAddress: string;
        cameraSnapshots?: string[];
        suspiciousActivity: string[];
    };
    startedAt: Date;
    submittedAt?: Date;
    isAutoGraded: boolean;
    totalScore?: number;
}

const TestRoundSchema = new Schema<ITestRound>({
    application: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
    questions: [{
        type: { type: String, enum: ['MCQ', 'Coding'], required: true },
        question: { type: String, required: true },
        options: [String],
        correctAnswer: String,
        testCases: [Schema.Types.Mixed],
        points: { type: Number, required: true },
        studentAnswer: String,
        isCorrect: Boolean,
        timeSpent: Number
    }],
    antiCheat: {
        tabSwitches: { type: Number, default: 0 },
        copyPasteAttempts: { type: Number, default: 0 },
        fullscreenExits: { type: Number, default: 0 },
        ipAddress: { type: String, required: true },
        cameraSnapshots: [String],
        suspiciousActivity: [String]
    },
    startedAt: { type: Date, default: Date.now },
    submittedAt: Date,
    isAutoGraded: { type: Boolean, default: false },
    totalScore: Number
});

export const TestRound = mongoose.model<ITestRound>('TestRound', TestRoundSchema);

// ===============================
// ANTI-CHEAT LOG MODEL
// ===============================
export interface IAntiCheatLog extends Document {
    student: mongoose.Types.ObjectId;
    test: mongoose.Types.ObjectId;
    eventType: 'TabSwitch' | 'CopyPaste' | 'FullscreenExit' | 'DuplicateIP';
    timestamp: Date;
    metadata: any;
    severity: 'Low' | 'Medium' | 'High';
}

const AntiCheatLogSchema = new Schema<IAntiCheatLog>({
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    test: { type: Schema.Types.ObjectId, ref: 'TestRound', required: true },
    eventType: {
        type: String,
        enum: ['TabSwitch', 'CopyPaste', 'FullscreenExit', 'DuplicateIP'],
        required: true
    },
    timestamp: { type: Date, default: Date.now },
    metadata: Schema.Types.Mixed,
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    }
});

export const AntiCheatLog = mongoose.model<IAntiCheatLog>('AntiCheatLog', AntiCheatLogSchema);
