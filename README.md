# TalentTrack Enterprise — Multi-Tenant B2B Campus Milestone SaaS Platform
### Developed by MTRX TECH — Founder & CEO: MARAPATHRAN V

TalentTrack Enterprise is a production-grade, commercial higher-education B2B SaaS platform engineered for universities and colleges. It enables institution-wide tracking, verification, and analysis of student milestones (hackathons, patents, publications, certifications) and calculates a real-time, algorithmic **Placement Readiness Score (PRS)** and **Resume Strength Index (RSI)**.

---

## 🚀 1. Zero-Cost Free Internet Deployment Guide ($0.00/month Architecture)
TalentTrack is intentionally designed to deploy on a **$0.00/month cloud architecture** without sacrificing enterprise multi-tenancy, security isolation, or responsiveness.

### Option A: Complete Free Tier Cloud Deployment (Recommended for Production)

#### Step 1: Database (MongoDB Atlas Free M0 Tier)
1. Register for a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Free **M0 Cluster** (512MB storage, sufficient for over 50,000 students and milestones in hybrid text/link mode).
3. In Database Access, create a database user with password authentication.
4. In Network Access, add IP Address `0.0.0.0/0` (or configure AWS VPC endpoints) to allow external server connection.
5. Copy your connection string: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/talenttrack?retryWrites=true&w=majority`.

#### Step 2: Backend API Gateway & Server (Render / Koyeb Free Web Service)
1. Push this clean codebase to your GitHub repository.
2. Sign in to [Render.com](https://render.com) and click **New -> Web Service**.
3. Connect your GitHub repository.
4. Set Build Command: `npm install`
5. Set Start Command: `node server.js`
6. Add Environment Variables under Settings:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas Connection String>`
   - `JWT_SECRET`: `your_secure_random_32_character_jwt_secret`
   - `JWT_REFRESH_SECRET`: `your_secure_random_32_character_refresh_secret`
7. Click **Deploy Web Service**. Render will give you a live HTTPS URL (e.g., `https://talenttrack-api.onrender.com`).

#### Step 3: Frontend SPA (Vercel / Cloudflare Pages / Netlify Free Tier)
1. In [Vercel](https://vercel.com) or [Netlify](https://netlify.com), click **Import Project** and select your repository.
2. Set Root Directory to `client`.
3. Set Build Command: `npm run build`
4. Set Output Directory to `dist`.
5. Add Environment Variable:
   - `VITE_API_URL`: `<Your Render Backend HTTPS URL>/api` (or keep empty if hosting monolithic server on a single VM).
6. Click **Deploy**. Your enterprise campus SaaS is now live globally over high-speed CDNs!

---

### Option B: Unified Monolithic Deployment (Single Server Gateway)
The Express backend (`server.js`) contains an intelligent static file router that serves the compiled React app (`client/dist`) and API endpoints simultaneously from a single port:
```bash
# 1. Install all backend dependencies
npm install

# 2. Build the React frontend SPA
cd client && npm install && npm run build && cd ..

# 3. Start the unified Express Gateway Server
node server.js
```
*Access both the interactive API gateway (`/api/*`) and the responsive SPA web portals (`/*`) from `http://localhost:5000`!*

---

## 📱 2. Mobile-Friendly Responsive Design System
TalentTrack features a **Billion-Dollar Design System v3.0** optimized for desktop workstations, iPads/tablets, and mobile touch screens:
- **Responsive Fluid Grid Architecture**: Automatically transforms 4-column institutional stat panels into single-column vertical touch stacks on mobile screens (`< 768px`).
- **Touch-Optimized Interactive Tables**: All data tables (At-Risk Students, Placement Intelligence Rankings, Verification Queues) feature smooth horizontal touch scrolling (`-webkit-overflow-scrolling: touch`) without breaking viewport boundaries.
- **Drawer Navigation & Command Palette**: The left-hand navigation sidebar automatically collapses into an overlay slide-in menu on mobile devices with modal backdrops.
- **Accessible Touch Targets**: Buttons, input fields, and milestone upload triggers enforce minimum touch areas (`min-height: 40px`) to prevent mis-clicks on iOS and Android browsers.
- **Adaptive Typography & Ring Charts**: The circular PRS score dials and statistical header counters scale dynamically to prevent text overlapping on compact phone screens.

---

## 🛡️ 3. Multi-Tenant Role-Based Access Control (RBAC) & Feature Report

The system incorporates strict multi-tenant isolation (filtered via `tenantId` schema scopes) across **6 distinct user portals**:

| Role | Key Features & Verified Workflow Capabilities |
| :--- | :--- |
| **SuperAdmin** | Global platform governance, tenant onboarding/billing management, SaaS system health telemetry, automated database backups, platform-wide maintenance mode toggles, and multi-tenant audit logs. |
| **Institution Admin (TPO)** | Corporate placement partner management, live drive orchestration, placement outcome analytics (**Placement Rate** & **Avg CTC** computed live from verified student offers), and one-click export of compliance documents (**NAAC Criterion 5** & **NBA Placement Integrity** reports). |
| **HOD (Head of Dept)** | Departmental overview dashboards, live computation of **Dept Avg PRS** and **At-Risk Students** (PRS < 50), curriculum roadmap approval, and mentor workload distribution. |
| **Faculty Mentor** | Student assignment oversight, point-value verification queues for milestone submissions, advanced override controls, student workload ratio tracking, and direct parent communication chat rooms. |
| **Student** | Interactive career dashboard with algorithmic **PRS Score Dials** and **RSI Index**, milestone document submission, goal trajectory tracking, mock interview scheduler, resume builder, and self-service **Parent Login Creator** (enforces strict rule: maximum 1 active parent per student account). |
| **Parent & Guardian** | Dedicated real-time monitoring of child's academic milestones, placement eligibility tracking, attendance & RSI visualization, direct messaging channel to assigned Faculty Mentor, and account self-deletion capability. |

---

## 🔧 4. Automated Verification & Quality Assurance Report

### ✔️ 1. Dynamic Analytics & No-Fallback Verification
- **Zero Hardcoded Data**: All portal dashboards (Admin, HOD, Mentor) have been audited and upgraded to compute live metrics directly from database records (`/api/students`, `/api/offers`, `/api/drives`, `/api/milestones`).
- **Live Algorithm Enrichment**: Calling `GET /api/students` dynamically calculates and binds real-time `prs`, `rsi`, and `hasOffer` statuses using `scoringService.js`.

### ✔️ 2. File Download Integrity
- **Browser File Extraction**: All download triggers ("Export Shortlist", "NAAC Criterion 5 Report", "NBA Audit Document", "Term Trends CSV") invoke `fileDownloader.js`, which generates certified binary Blobs (`text/csv` & `application/msword`) and forces browser download directly to the computer.

### ✔️ 3. Security, Parent Cascades & Audit Compliance
- **Student-Parent Rules**: Students are prompted to generate an assigned Parent Login if none exists. If an active parent exists, further generation is locked until the existing parent invokes Self-Delete or is removed by administrators.
- **Cascade Deletion**: When a student record is removed from the database, associated parent tracker credentials and active tokens are automatically purged.
- **Mentor Password Resets & Scoped Updates**: Password modifications via `resetPassword` explicitly pass tenant scoping flags (`bypassRoleScope: true`, `tenantId`), ensuring password hashes persist cleanly in cloud environments while generating tamper-proof `PASSWORD_RESET` audit records.

---

## 🧹 5. Clean Repository Layout (Production Build ready)

```
talent-track/
├── client/                     # Vite + React + Lucide Icons Single-Page Application
│   ├── src/
│   │   ├── components/         # Shared UI: Sidebar, Topbar, Command Palette, Toasts
│   │   ├── pages/              # Role Portals: SuperAdmin, Admin, HOD, Mentor, Student, Parent
│   │   ├── services/           # API fetch wrappers and tenant header injectors
│   │   ├── utils/              # Client file downloader (CSV / DOC / Blob generators)
│   │   └── index.css           # Billion-Dollar Enterprise Design System v3.0 (Mobile Optimized)
│   ├── package.json
│   └── vite.config.js
├── server/                     # Node.js + Express + Mongoose API Gateway & Engine
│   ├── controllers/            # Logic handles: Auth, Student, Parent, Assessment, PRS Scoring
│   ├── models/                 # Schemas: Tenant, User, Student, Milestone, Offer, AuditLog
│   ├── routes/                 # REST APIs: Protected multi-tenant routes with RBAC middlewares
│   ├── services/               # Scoring engines, Memory-Store fallback & reconciliation
│   └── seed.js                 # Automated demo data injector for clean staging deployment
├── server.js                   # Unified Gateway Launcher (Serves API + Frontend Dist SPA)
├── package.json
├── render.yaml                 # Render Free Tier deployment manifest
└── vercel.json                 # Vercel Free Tier routing configuration
```

---
*TalentTrack Enterprise OS &copy; 2026 MTRX TECH. All rights reserved.*
