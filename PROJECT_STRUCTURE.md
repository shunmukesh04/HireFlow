# Hireflow - Complete Project Structure

## 📁 Project Overview

Hireflow is a full-stack AI-powered recruitment platform with role-based authentication using Clerk, MongoDB for data persistence, and separate HR and Student dashboards.

---

## 🏗️ Architecture

```
Hireflow/
├── frontend/           # React + Vite + TypeScript
│   ├── src/
│   │   ├── pages/      # Route components
│   │   ├── App.tsx     # Main app with routing
│   │   └── main.tsx    # Entry point with Clerk provider
│   └── .env            # Frontend environment variables
│
├── backend/            # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/  # Business logic
│   │   ├── models/       # MongoDB schemas
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth & validation
│   │   └── services/     # Utility services
│   └── .env            # Backend environment variables
│
└── docs/              # Project documentation
```

---

## 🎯 Core Features

### **Authentication & Authorization**
- **Clerk Integration**: Secure authentication for both HR and Students
- **Role-Based Access Control**: Separate permissions for HR and STUDENT roles
- **JIT User Provisioning**: Auto-create users in MongoDB on first login
- **Public Metadata Sync**: Role stored in Clerk for frontend access

### **HR Dashboard** (Sidebar Layout)
1. **Company Profile** - Create/update company information
2. **Post Job** - Create job postings with required skills
3. **Candidates** - View applicants with AI resume scores

### **Student Dashboard**
1. **Job Listings** - Browse open positions with match scores
2. **Resume Upload** - AI-powered PDF parsing (30-50KB)
3. **Profile Management** - View parsed skills
4. **Assessments** - Take assigned tests

---

## 📂 Detailed File Structure

### **Frontend** (`/frontend`)

```
frontend/
├── public/
├── src/
│   ├── assets/              # Images, icons
│   ├── pages/
│   │   ├── Landing.tsx      # Home page with role selection
│   │   ├── HRDashboard.tsx  # HR interface (sidebar layout)
│   │   ├── StudentDashboard.tsx  # Student interface
│   │   └── Auth.tsx         # (Legacy - replaced by Landing)
│   ├── App.tsx              # Routes and navigation
│   ├── App.css              # Global styles
│   ├── main.tsx             # App entry with ClerkProvider
│   └── index.css            # Tailwind base
├── .env                     # VITE_CLERK_PUBLISHABLE_KEY, VITE_API_URL
├── package.json
├── tsconfig.json
└── vite.config.ts
```

**Key Components:**

#### `Landing.tsx`
- Detects user role from `user.publicMetadata.role`
- Auto-redirects HR users to `/hr-dashboard`
- Shows role-specific sign-in buttons for new users

#### `HRDashboard.tsx`
- **Sidebar Navigation**: Company Profile, Post Job, Candidates
- **Tab State Management**: Switches between sections
- **API Integration**: Axios calls with Clerk Bearer tokens

#### `StudentDashboard.tsx`
- Job listings with match scores
- Resume upload with file size validation (30-50KB)
- Displays parsed skills from AI analysis

---

### **Backend** (`/backend`)

```
backend/
├── src/
│   ├── config/
│   │   └── db.ts           # MongoDB connection
│   ├── controllers/
│   │   ├── authController.ts      # Legacy auth (not used)
│   │   ├── hrController.ts        # Company, Job creation
│   │   ├── studentController.ts   # Resume upload, profile
│   │   └── testController.ts      # Assessment management
│   ├── middleware/
│   │   └── auth.ts         # Clerk auth + role authorization
│   ├── models/
│   │   └── index.ts        # User, Company, Job, Resume schemas
│   ├── routes/
│   │   └── api.ts          # All API endpoints
│   ├── services/
│   │   ├── resumeParser.ts   # PDF text extraction
│   │   ├── aiService.ts      # Skill extraction (placeholder)
│   │   └── testService.ts    # Test generation (placeholder)
│   └── index.ts            # Express app setup
├── .env                    # CLERK_SECRET_KEY, MONGO_URI
├── package.json
└── tsconfig.json
```

**Key Modules:**

#### `middleware/auth.ts`
- **`protect`**: Validates Clerk JWT token
- **`authorize([roles])`**: Checks user role
- **JIT User Creation**: Creates MongoDB user if not exists
- **Metadata Sync**: Updates Clerk publicMetadata with role

#### `routes/api.ts`
- **HR Routes**: `/api/hr/company`, `/api/hr/job`, `/api/hr/candidates`
- **Student Routes**: `/api/student/upload-resume`, `/api/student/profile`, `/api/student/tests`
- **Authorization**: Strict role enforcement (`HR` or `STUDENT`)

#### `models/index.ts`
- **User**: `clerkId`, `email`, `role`, `resumes[]`
- **Company**: Linked to HR user via `createdBy`
- **Job**: Posted by companies, tracks `requiredSkills`
- **Resume**: Stores `parsedData` from AI analysis

---

## 🔧 Environment Variables

### Frontend (`.env`)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3000
```

### Backend (`.env`)
```env
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
MONGO_URI=mongodb+srv://...
PORT=3000
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Clerk account with API keys

### Installation

```bash
# 1. Install dependencies
npm install           # Root (if applicable)
cd frontend && npm install
cd ../backend && npm install

# 2. Setup environment variables
# Copy .env.example to .env in both frontend and backend
# Add your Clerk keys and MongoDB URI

# 3. Run development servers
# Terminal 1 (Backend)
cd backend
npm run dev

# Terminal 2 (Frontend)
cd frontend
npm run dev
```

**URLs:**
- Frontend: `http://localhost:5173` (or next available port)
- Backend: `http://localhost:3000`

---

## 🔐 Authentication Flow

1. **User clicks "HR Login" or "Student Login"**
   - Clerk modal opens for sign-in/sign-up

2. **After authentication:**
   - Frontend receives Clerk session with JWT token
   - Token sent in `Authorization: Bearer <token>` header

3. **Backend validates:**
   - `protect` middleware verifies Clerk JWT
   - Syncs user to MongoDB (JIT creation if needed)
   - `authorize` middleware checks role

4. **Role-based redirect:**
   - HR users → `/hr-dashboard` (auto-redirect)
   - Students → `/student-dashboard`

---

## 📊 Data Models

### User Schema
```typescript
{
  clerkId: string (unique, indexed)
  email: string
  role: 'HR' | 'STUDENT'
  resumes: [ResumeSchema]
  createdAt: Date
}
```

### Company Schema
```typescript
{
  name: string
  website: string
  createdBy: User.clerkId (HR only)
  jobs: [JobSchema]
}
```

### Job Schema
```typescript
{
  title: string
  description: string
  requiredSkills: string[]
  company: Company._id
  testConfig: { tests: [{type, difficulty}] }
}
```

### Resume Schema
```typescript
{
  fileName: string
  parsedData: {
    skills: string[]
    experience: string
  }
  matchScore: number
  uploadedAt: Date
}
```

---

## 🎨 UI Design Patterns

### Color Scheme
- **Primary (Blue)**: HR-related actions (#2563EB)
- **Success (Green)**: Student-related actions (#059669)
- **Purple**: Assessment/Test features (#7C3AED)

### Layout
- **HR Dashboard**: Sidebar navigation (64px width)
- **Student Dashboard**: Top bar with job cards
- **Forms**: White cards with rounded-xl borders

---

## 🧪 Testing Guide

### HR Workflow
1. Sign in with HR account
2. Navigate to "Company Profile" → Fill details → Save
3. Navigate to "Post Job" → Create job posting
4. Check "Candidates" tab for applicants

### Student Workflow
1. Sign in with Student account
2. Browse job listings
3. Upload resume (30-50KB PDF)
4. View parsed skills
5. Check assigned tests

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Authentication** | Clerk (Session-based JWTs) |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | MongoDB (Mongoose ODM) |
| **File Upload** | Multer (50KB limit) |
| **PDF Parsing** | pdf-parse |
| **AI** | Placeholder (Ready for OpenAI/Claude integration) |

---

## 📝 API Reference

### HR Endpoints

```http
POST /api/hr/company
Authorization: Bearer <clerk-jwt>
Body: { name, website, description, ... }
Response: Company object

POST /api/hr/job
Body: { title, description, requiredSkills[], ... }
Response: Job object

GET /api/hr/candidates
Response: [{ student, resume, matchScore }]
```

### Student Endpoints

```http
POST /api/student/upload-resume
Content-Type: multipart/form-data
Body: FormData with 'resume' field (PDF, 30-50KB)
Response: { parsedData, matchScore }

GET /api/student/profile
Response: User with resumes[]

GET /api/student/tests
Response: [{ type, difficulty, assigned }]
```

---

## 🔒 Security Features

✅ **Clerk JWT Validation** - All protected routes verify tokens  
✅ **Role-Based Authorization** - Strict HR/STUDENT separation  
✅ **CORS Configuration** - Whitelisted origins only  
✅ **File Size Limits** - 50KB max for resume uploads  
✅ **Environment Variables** - Secrets never committed  

---

## 🐛 Common Issues & Fixes

### "Unauthorized - No Clerk Token"
- **Cause**: Token not sent or expired
- **Fix**: Sign out and sign in again to refresh token

### "Role is not authorized"
- **Cause**: User role doesn't match route requirement
- **Fix**: Ensure role is set correctly in MongoDB (default is 'HR')

### Port already in use
- **Fix**: Vite auto-finds next available port (5173, 5174, etc.)

---

## 📈 Future Enhancements

- [ ] Real AI integration (OpenAI/Claude) for resume parsing
- [ ] Automated test generation based on job requirements
- [ ] Video interview scheduling
- [ ] Email notifications for application status
- [ ] Advanced filtering and search
- [ ] Analytics dashboard for HR

---

## 👥 Roles & Responsibilities

### HR Features
- ✅ Create company profile
- ✅ Post job openings
- ✅ View candidate resumes
- 🚧 Assign tests based on resume score
- 🚧 Schedule interviews

### Student Features
- ✅ Browse job listings
- ✅ Upload resume (AI-parsed)
- ✅ View match scores
- 🚧 Take assessments
- 🚧 Track application status

---

## 📞 Support

For issues or questions:
- Check logs in browser console (Frontend)
- Check terminal output (Backend)
- Verify `.env` files are configured correctly
- Ensure MongoDB connection is active

---

**Last Updated:** December 11, 2025  
**Version:** 1.0.0
