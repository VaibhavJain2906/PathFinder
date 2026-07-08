# PathFinder 🚀

PathFinder is a modern, AI-powered platform designed to connect students with high-quality internship and fellowship opportunities. It bridges the gap between organizations looking for talent and students eager to launch their careers, offering a streamlined, intelligent hiring experience.

## 💻 Tech Stack

### Frontend
- **Framework:** React 18 with Vite
- **Language:** TypeScript
- **Routing:** React Router v6
- **Styling:** Vanilla CSS with a bespoke Dark Theme & Glassmorphism aesthetic.
- **Icons:** Lucide React

### Backend
- **Framework:** Node.js with Express
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Database:** SQLite (local development)
- **Authentication:** JWT (JSON Web Tokens) & bcrypt (Password Hashing)
- **File Uploads:** Multer (with memory storage)
- **PDF Parsing:** pdf-parse

### AI Integration
- **Engine:** Google Generative AI (Gemini 1.5 Flash)
- **Usage:** Powering smart resumes, application matching, and automated content generation.

---

## 🌟 Key Features by Role

### 👨‍🎓 1. For Students
PathFinder gives students the tools they need to stand out.
*   **AI Resume Autofill:** Students can upload a PDF resume, and the platform uses Gemini AI to extract their information (Bio, Skills, Major, University) and automatically populate their profile.
*   **Comprehensive Profiles:** Manage skills, certifications, portfolio links, and uploaded documents.
*   **Smart Discovery:** Search, filter, and bookmark opportunities.
*   **AI SOP Generator:** With the click of a button, students can generate a customized Statement of Purpose (SOP) perfectly tailored to the opportunity they are applying for, utilizing their saved skills and bio.
*   **Application Tracking:** Track applications through a detailed timeline (Submitted, Reviewing, Shortlisted, Accepted, Rejected), and withdraw applications if necessary.

### 🏢 2. For Organizations
Organizations get a streamlined, powerful applicant tracking system.
*   **Opportunity Management:** Create, draft, publish, and duplicate opportunities with ease.
*   **Applicant Tracking System (ATS):** Move candidates through structured hiring stages: *Pending -> Reviewing -> Shortlisted -> Accepted / Rejected*. Includes an "Undo" feature for corrected decisions.
*   **AI Match Scoring:** Every application is automatically evaluated in the background by Gemini AI, generating a 0-100% "Match Score" based on the student's skills and cover letter compared to the opportunity requirements. 
*   **AI Candidate Summaries:** Generate a quick, readable summary of a candidate to parse their profile rapidly.

### 🛡️ 3. For Administrators
Admins have overarching control to maintain platform health.
*   **Global Dashboard:** View high-level metrics (Total Students, Organizations, Active Opportunities).
*   **User Management:** View all registered users and safely delete malicious or spam accounts.
*   **Opportunity Moderation:** Review all posted opportunities across the platform and delete those that violate guidelines.

---

## 🎨 Design System
PathFinder was built with a strong emphasis on **UI/UX**. It utilizes a premium **Dark Mode** aesthetic heavily featuring:
- **Glassmorphism:** Translucent panels with background blur.
- **Micro-animations:** Smooth hover states, glowing buttons, and slide-in notifications.
- **Color Theory:** Deep navies and charcoals contrasted with vibrant primary purples (`#8B5CF6`) and intelligent semantic colors (green for success, red for rejection, amber for warnings).

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+)
- Gemini API Key (Optional, for live AI features)

### 1. Setup the Backend
Open a terminal and navigate to the `backend` directory:
```bash
cd backend
npm install
# Ensure .env is configured (PORT, JWT_SECRET, GEMINI_API_KEY)
npx prisma db push
npm run dev
```

### 2. Setup the Frontend
Open a new terminal and navigate to the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```

The application will be accessible at `http://localhost:5173`.
