# Antigravity IDE - Hiring & Assessment Platform

**Elevator Pitch:** Antigravity IDE is a secure, end-to-end recruitment platform that automates resume screening with AI, manages specific recruitment drives (HR), and offers a seamless application-to-assessment flow for candidates (Student).

---

## 🛠️ Technology Stack

### **Frontend**
*   **Framework**: React (Vite)
*   **Styling**: Tailwind CSS (v3.4)
*   **Icons**: Lucide React
*   **Routing**: React Router DOM (v6)
*   **HTTP Client**: Axios

### **Backend**
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Language**: TypeScript
*   **Auth**: JWT (JSON Web Tokens) + Cookie/Local Storage
*   **Security**: Bcryptjs (hashing), CORS, Helmet-ready

### **Database**
*   **Primary DB**: MongoDB (Atlas)
*   **ODM**: Mongoose
*   **Features**: Scalable schema for Users, Jobs, Resumes, and Test Results.

---

## 🚀 Quick Start

### 1. Prerequisites
*   Node.js (v18+)
*   MongoDB Atlas Account (or local MongoDB)

### 2. Install Dependencies
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Environment Setup

**Backend (`backend/.env`):**
```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0...mongodb.net/hireflow?retryWrites=true&w=majority
JWT_SECRET=your-secure-secret-key
PORT=3000
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:3000
```

### 4. Run Application
Run both Frontend and Backend concurrently:
```bash
npm run dev
```
*   **Frontend**: [http://localhost:5173](http://localhost:5173)
*   **Backend API**: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Demo Flow

### **1. HR Admin Flow**
1.  Go to **Sign Up** -> Select **HR Admin**.
2.  Login to **HR Dashboard**.
3.  **Create Company**: Set up your organization profile.
4.  **Post Job**: Create a JD (e.g., "Full Stack Dev") and select required skills & tests (Aptitude/Coding).
5.  **View Candidates**: Track applicants and their AI-generated scores.

### **2. Student Flow**
1.  Go to **Sign Up** -> Select **Student**.
2.  **Profile**: View your dashboard.
3.  **Upload Resume**: Upload a PDF/DOCX (Strictly **30KB - 50KB**).
    *   *AI Logic*: Automatically parses contact info & skills.
    *   *Validation*: Rejects files outside size limits to save storage.
4.  **Take Assessment**: View assigned tests (based on applied jobs) and submit them.

---

## 🔒 Security & Architecture
*   **Role-Based Access Control (RBAC)**: Middleware ensures Students cannot access HR routes.
*   **Data Validation**: Strict file size checks (Multer) and input sanitization.
*   **Password Security**: All passwords salted and hashed with `bcrypt`.
*   **Scalability**: Stateless JWT auth allows easy horizontal scaling.

