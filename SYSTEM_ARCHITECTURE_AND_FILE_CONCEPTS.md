# 🚀 MTRX TECH TALENTTRACK — COMPLETE SYSTEM ARCHITECTURE & FILE CONCEPTS GUIDE
**Version**: v2.5.0-PROD  
**Developed by**: MTRX TECH (Founder & CEO: **Marapathran V**)  
**Core Engineering Developers**: **Durga Mikila S.V** (Dev 1), **Murugan S** (Dev 2), **Sundhareswaran S.K** (Dev 3)  
**Web Designer**: **Manu Shree M**  
**Faculty Guidance & Mentor**: **Mrs. C. Krishnakala** (Professor & Personal Mentor)  
**Special Institutional Thanks**: **Ramco Institute of Technology**  

---

## 🏛️ SECTION 1: SYSTEM ARCHITECTURE OVERVIEW

TalentTrack Enterprise is a multi-tenant, zero-trust Career & Placement Management SaaS solution built on the **MERN Stack (MongoDB Atlas, Express.js, React / Vite, Node.js)**. It governs institutional student careers, faculty mentoring, placement tracking, parental oversight, and compliance reporting through a rigid Role-Based Access Control (RBAC) structure.

```
       [ Client Browser / Smartphone ]
                     │
      (HTTPS / Vite React Frontend SPA)
                     │
          [ Express.js Gateway ]
                     │
         [ Auth & Tenant Middleware ]
                     │
       ┌─────────────┴─────────────┐
       ▼                           ▼
[ dataService.js ]      [ CloudStorageService ]
 (Strict DB Only)         (Cloudflare R2 Blob)
       │
       ▼
 [ MongoDB Atlas ] (No local fallback arrays allowed)
```

### Core Architectural Principles & Security Rules:
1. **Strict DB Enforcement (No Local Memory Fallback)**:
   - The platform strictly requires an active connection to **MongoDB Atlas** (`mongoose.connection.readyState === 1`). 
   - All local disk arrays, runtime caching fallback files (`memoryStore.js`, `reconciliationService.js`), and simulated in-memory storage have been eradicated. If the database disconnected, operations fail-closed with explicit error messages without attempting to silently store data locally.
2. **Zero-Trust Role Security (RBAC)**:
   - 6 isolated tier realms: `Student`, `Faculty` (Mentor), `HOD`, `Parent`, `Admin` (College TPO/Dean), and `SuperAdmin` (MTRX TECH Operator).
3. **One Active Parent Constraint**:
   - A student profile can only maintain exactly **one paired guardian account** at any given time. Attempts to generate a secondary parent account are programmatically rejected by the backend.
4. **Cascade Relational Integrity**:
   - When an Administrator or HOD terminates a student user profile, an atomic database cascade locates and purges the associated parent/guardian login account simultaneously, preventing orphaned credentials.
5. **Mentor Deletion Interlock**:
   - Faculty mentors can provision and manage mentee profiles, but are technically blocked from deleting mentee identities they created. Deletions require escalated institutional authority (HOD or Admin).

---

## 📂 SECTION 2: FILE CONCEPTS & CHANGE IMPACT MATRIX
*This matrix answers: **"What does each file do, and what happens if I change it?"***

---

### 🖥️ A. BACKEND ENGINE (NODE.JS / EXPRESS / Mongoose)

#### 1. Server Gateway & Core Setup
- **File**: `server.js` (Root directory)
  - **Concept**: The primary entry point and application gateway for the backend API server. Configures CORS security policies, JSON body parsers, Helmets, HTTP rate limiting, MongoDB Atlas initialization, and routes incoming API requests to appropriate router modules.
  - **Changing this file changes what**: 
    - Altering CORS rules impacts which frontend domains can communicate with the API. 
    - Changing rate limiters affects DoS protection thresholds.
    - Altering MongoDB connection hooks directly determines whether the server goes live or halts on database connection errors.

#### 2. Central Data Repository & Services (`/server/services/`)
- **File**: `server/services/dataService.js`
  - **Concept**: The universal CRUD gatekeeper used by every single controller in the backend. It wraps Mongoose queries and enforces the strict database connection interlock (`verifyDbConnection()`).
  - **Changing this file changes what**: 
    - Modifying this file globally alters how every read, create, update, and delete operation behaves across the entire SaaS platform.
    - If you change error handling here, every API endpoint will change its response when MongoDB is offline.
- **File**: `server/services/cloudStorageService.js`
  - **Concept**: Handles object storage for student resume uploads, placement attachments, and accreditation export blobs using Cloudflare R2 / AWS S3 APIs.
  - **Changing this file changes what**: 
    - Modifying upload streams or bucket configurations alters student milestone proof attachments, resume generation, and file downloading across all dashboards.
- **File**: `server/services/aiAdvisorService.js`
  - **Concept**: Generates automated AI career feedback, placement readiness scoring, and skill gap recommendations for student profiles.
  - **Changing this file changes what**: 
    - Changes directly modify the AI recommendations displayed in the Student Dashboard and alter placement risk score thresholds calculated for Faculty Mentors and HODs.

#### 3. Security & Authentication Middleware (`/server/middleware/`)
- **File**: `server/middleware/authMiddleware.js`
  - **Concept**: Intercepts every secure API request to verify JWT authorization headers, inspect tenant scope isolation (`tenantId`), check user roles against endpoint permissions, and validate cryptographically signed SuperAdmin impersonation tokens.
  - **Changing this file changes what**: 
    - **CRITICAL IMPACT**: Altering token verification logic can either lock out all logged-in users or create severe security vulnerabilities across all portals. Changing role checks directly impacts who can view or modify institutional endpoints.

#### 4. Database Schema Models (`/server/models/`)
- **File**: `server/models/User.js`
  - **Concept**: Defines the universal identity schema for all 6 roles (Student, Mentor, HOD, Parent, Admin, SuperAdmin). Stores hashed passwords, email indices, roll numbers, department links, and student-to-parent associations.
  - **Changing this file changes what**: Modifying field validation or indexing here immediately impacts account login, user CSV registration, password hashing, and user directory tables in Admin and SuperAdmin dashboards.
- **File**: `server/models/PlacementDrive.js`
  - **Concept**: Schema for corporate recruitment events, job descriptions, CTC packages, application deadlines, and student application rosters.
  - **Changing this file changes what**: Affects how placement recruitment drives are displayed on student dashboards and alters institutional accreditation metrics.
- **File**: `server/models/Milestone.js` & `server/models/Internship.js` & `server/models/Assessment.js`
  - **Concept**: Schemas recording student academic achievements, external industry internships, and internal test performance.
  - **Changing this file changes what**: Modifying fields here changes how students log career progress and affects how Faculty Mentors grade or audit mentee accomplishments.
- **File**: `server/models/Tenant.js` & `server/models/GlobalSettings.js`
  - **Concept**: Stores institutional tenant configurations (domain slugs, subscription tier status like `Basic/Standard/Premium/Enterprise Gold`, billing state) and singleton platform parameters.
  - **Changing this file changes what**: Altering these schemas directly affects SuperAdmin subscription locking, college login eligibility, and multi-tenant isolation rules.
- **File**: `server/models/AuditLog.js` & `server/models/Message.js` & `server/models/Notification.js`
  - **Concept**: Schemas for immutable system audit tracking, parent-to-mentor messaging streams, and platform notification broadcasts.
  - **Changing this file changes what**: Modifying these changes compliance audit history logging, live direct messaging between guardians and faculty, and notification bell alerts in the Topbar.

#### 5. API Controllers (`/server/controllers/`) & Routes (`/server/routes/`)
- **File**: `server/controllers/authController.js` (`/server/routes/authRoutes.js`)
  - **Concept**: Implements login verification, JWT signing, password reset routines, and user session termination.
  - **Changing this file changes what**: Affects user authentication UX, session timeout durations, and secure credential parsing.
- **File**: `server/controllers/studentController.js` (`/server/routes/studentRoutes.js`)
  - **Concept**: Serves student dashboard aggregations, milestone submissions, placement application tracking, and AI risk calculations.
  - **Changing this file changes what**: Changes exactly what statistical data and action buttons are loaded when a Student accesses `/student`.
- **File**: `server/controllers/facultyController.js` (`/server/routes/facultyRoutes.js`)
  - **Concept**: Governs the Faculty Mentor command center; manages mentee tracking, milestone verification, attendance logging, and enforces the **Mentor Deletion Interlock**.
  - **Changing this file changes what**: Modifying this alters mentor grading capability and can break or alter mentee deletion protection interlocks.
- **File**: `server/controllers/parentController.js` (`/server/routes/parentRoutes.js`)
  - **Concept**: Manages parent linking, guardian data feeds, attendance oversight, and enforces the **One Active Parent Constraint** and **Cascade Parent Deletion**.
  - **Changing this file changes what**: Modifying this directly impacts whether a student can register multiple guardians and dictates whether parent accounts are cleanly purged when a student profile is deleted.
- **File**: `server/controllers/adminController.js` & `superadminController.js` & `tenantController.js`
  - **Concept**: Institutional leadership engines (TPO/Dean user roster bulk CSV importing, NAAC/NBA report compilation) and MTRX TECH operator routines (onboarding colleges, subscription tier modifications, forced activation, soft deletion, zero-trust impersonation claims).
  - **Changing this file changes what**: Modifying these files alters college billing locks, platform ARR calculations, Excel CSV parser behavior, and admin user creation flows.

---

### 🎨 B. FRONTEND REACT APPLICATION (`/client/src/`)

#### 1. Core Application Setup & Routing
- **File**: `client/src/App.jsx`
  - **Concept**: The master single-page application (SPA) controller. Initializes React Router, declares public/protected routes, provides global theme context (`ThemeContext` for light/dark mode), and redirects authenticated identities to their designated portal.
  - **Changing this file changes what**: Altering route paths or protected wrappers changes website URL structure, authentication gating, and application theme persistence across all screens.
- **File**: `client/src/main.jsx` & `client/index.html`
  - **Concept**: DOM bootstrapping mounting React onto the browser viewport and setting HTML page title tags, Favicon metadata, and Google font injections.
  - **Changing this file changes what**: Changes app startup rendering and SEO metadata displayed in browser tabs.

#### 2. Global Styling & Responsive UI System
- **File**: `client/src/index.css`
  - **Concept**: The master CSS stylesheet for the entire SaaS suite. Defines curated HSL custom properties, dark/light mode color tokens, glassmorphism card utilities, animation transitions, table layout boundaries, and responsive media queries (`<= 768px`, `<= 480px`).
  - **Changing this file changes what**: 
    - **UNIVERSAL IMPACT**: Altering variables here instantly transforms the color scheme, button aesthetics, and card spacing across every page of the application.
    - Modifying mobile media queries alters how the navigation sidebar hides off-screen and controls when the Topbar mobile toggle button (`.mobile-topbar-toggle`) is revealed on smartphones and tablets.

#### 3. Frontend Services & API Client
- **File**: `client/src/services/api.js`
  - **Concept**: The standard frontend HTTP client interceptor (`apiFetch`). It auto-injects JWT Bearer tokens from browser localStorage into API request headers, catches database connection offline 500/503 errors, and formats error dialogs.
  - **Changing this file changes what**: 
    - Changing this modifies how the frontend handles networking across all dashboards. If altered improperly, components will stop receiving API payloads or fail to display database offline error banners.

#### 4. Global Structural Components (`/client/src/components/`)
- **File**: `client/src/components/Sidebar.jsx`
  - **Concept**: Houses the navigation menu with tailored navigation item links for all 6 roles. Confines the single unified **Minimize Sidebar Control** (positioned in the user footer on desktop) and the single unified **About Team Button**.
  - **Changing this file changes what**: Modifying navigation lists changes menu items seen by specific roles. Altering the minimize button logic changes how the sidebar folds into a 68px icon ribbon on desktop or dismisses on mobile devices.
- **File**: `client/src/components/Topbar.jsx`
  - **Concept**: The fixed top header ribbon. Includes dashboard title rendering, notification bell dropdown, theme switch icon, command palette search trigger (`Cmd+K`), and the mobile-exclusive hamburger menu toggle icon (`.mobile-topbar-toggle`).
  - **Changing this file changes what**: Altering button placements here changes upper navigation ergonomics. Changing the mobile toggle class or button props impacts mobile device users trying to open the hidden sidebar drawer.
- **File**: `client/src/components/CommandPalette.jsx`
  - **Concept**: A searchable interactive modal dialog activated by keyboard shortcut (`Cmd+K` / `Ctrl+K`) that indexes pages, settings, reports, and team modals for instant navigation.
  - **Changing this file changes what**: Adding or removing array entries here determines what search results appear when users search across the SaaS app.
- **File**: `client/src/components/TeamInfoModal.jsx`
  - **Concept**: The acknowledgment dialog triggered from the Sidebar footer button. Exhibits detailed profiles of MTRX TECH leadership, developers, designers, and faculty mentorship guidance.
  - **Changing this file changes what**: Directly alters developer attribution, institutional credits, and team descriptions shown to evaluators and administrators.
- **File**: `client/src/components/StatCard.jsx`
  - **Concept**: A reusable statistics display widget utilized across all portals to render numeric performance metrics with decorative background gradients, trend arrows, and comparison percentages.
  - **Changing this file changes what**: Modifying layout or typography here alters the appearance of numerical KPI indicator widgets across Student, Faculty, HOD, Admin, and SuperAdmin dashboards simultaneously.

#### 5. Portal Pages & Role Dashboards (`/client/src/pages/`)
- **File**: `client/src/pages/Login.jsx`
  - **Concept**: The gateway authentication screen. Accommodates email/password inputs, login error handling, demo account credential hints modal, and pre-login access to team acknowledgments.
  - **Changing this file changes what**: Modifying forms or event handlers here affects user login success and onboarding instruction visibility.
- **File**: `client/src/pages/StudentDashboard.jsx`
  - **Concept**: Student portal loaded at `/student`. Renders AI career suggestions, placement application cards, internship timelines, milestone credential submission forms, and assessment score charts.
  - **Changing this file changes what**: Altering state or component rendering directly modifies how students apply for corporate campus recruitment drives and submit credential proofs.
- **File**: `client/src/pages/MentorDashboard.jsx`
  - **Concept**: Department Faculty Mentor hub (`/mentor`). Displays assigned mentees, milestone audit approval buttons, attendance trackers, and mentee risk scoring tables. Enforces UI disabling of mentor mentee deletion routines.
  - **Changing this file changes what**: Modifying this affects faculty capability to approve mentee achievements and manages attendance entry tracking.
- **File**: `client/src/pages/HODDashboard.jsx`
  - **Concept**: Head of Department executive dashboard (`/hod`). Presents department-wide cohort placement conversion rates, mentee risk early warning radars, attendance audits, and Excel/CSV user roster importing.
  - **Changing this file changes what**: Modifying this alters departmental statistical reporting and changes how branch deans monitor placement performance across academic semesters.
- **File**: `client/src/pages/ParentDashboard.jsx`
  - **Concept**: Guardian oversight portal (`/parent`). Offers transparent view-only access to linked student attendance histories, internal test grades, placement drive statuses, and direct mentor messaging.
  - **Changing this file changes what**: Altering this screen impacts parental awareness and mentor communication interfaces.
- **File**: `client/src/pages/AdminDashboard.jsx`
  - **Concept**: Institutional Placement Officer & Dean command center (`/admin`). Orchestrates campus-wide faculty and student provisioning, bulk CSV dry-run parser imports, student profile deletions (which activate parent cascades in backend), institutional subscription status viewing, and official NAAC/NBA accreditation report document generation.
  - **Changing this file changes what**: Modifying this file impacts university administrator capability to manage rosters, generate accreditation paperwork, and monitor campus-wide salary (CTC) benchmarks.
- **File**: `client/src/pages/SuperAdminDashboard.jsx`
  - **Concept**: Global MTRX TECH Platform Operations dashboard (`/superadmin`). Calculates total platform Annual Recurring Revenue (ARR), provides college onboarding tools, executes tenant subscription tier upgrades/force activations/soft deletions, registers real-time security intrusion threats, permits zero-trust Admin account impersonation, and continuously monitors database strictness status (`Strict DB Only`).
  - **Changing this file changes what**: Modifying this screen impacts SaaS business operators managing client colleges, financial revenue calculations, zero-trust security monitoring, and global platform availability.

---

### ⚙️ C. CONFIGURATION & DEVOPS FILES

- **File**: `package.json` & `client/package.json`
  - **Concept**: NPM configuration manifests declaring required libraries (Express, Mongoose, React, Vite, Lucide-React icons) and operational script bindings (`npm run start`, `npm run dev`, `npm run build`).
  - **Changing this file changes what**: Altering dependencies or scripts here affects server building, library versions, and CI/CD deployment execution pipelines.
- **File**: `client/vite.config.js`
  - **Concept**: Vite frontend bundler and dev server config. Maps dev server port to `5173`, configures React plugins, and routes local API proxy requests to `http://localhost:5000`.
  - **Changing this file changes what**: Changing port bindings or proxy rules here will break API communications between the local React development environment and the Express API server.
- **File**: `APP_PROCESS_GUIDE.md` & `README.md`
  - **Concept**: Primary documentation guides describing user journeys, functional workflows, operation handbooks, and free internet deployment instructions.
  - **Changing this file changes what**: Modifying these updates institutional documentation, setup guides, and project onboarding references without altering compiled runtime application code.

---

## 🔐 SECTION 3: QUICK REFERENCE IMPACT MATRIX ("CHANGING THE FILE CHANGES WHAT")

| If you modify this file... | You are changing this behavior / feature... | Primary Roles Impacted |
| :--- | :--- | :--- |
| `server/services/dataService.js` | Universal database strictness, offline error behavior, all CRUD interactions | All Roles (Universal) |
| `server/middleware/authMiddleware.js` | JWT security validation, multi-tenant isolation, Zero-Trust impersonation claims | All Roles (Security Core) |
| `server/controllers/parentController.js` | Guardian account pairing, **One Active Parent Constraint**, attendance data feeds | Parent & Student |
| `server/controllers/adminController.js` | Bulk CSV import validations, NAAC/NBA report calculations, **Cascade Deletion** | Admin (TPO / Dean) |
| `server/controllers/facultyController.js` | Mentee tracking, grading approvals, **Mentor Deletion Interlock** enforcement | Mentor (Faculty) & HOD |
| `server/controllers/superadminController.js` | SaaS college tier pricing, forced activations, soft deletions, security monitoring | SuperAdmin (MTRX TECH) |
| `client/src/index.css` | Color styling, theme responsiveness, mobile menu drawer layout, typography | All Users (UI/UX Core) |
| `client/src/components/Sidebar.jsx` | Navigation item lists, single unified minimize control, team modal access button | All Users (Navigation) |
| `client/src/components/Topbar.jsx` | Upper dashboard header, mobile drawer reopening icon button, search shortcut | All Users (Header Controls)|
| `client/src/pages/SuperAdminDashboard.jsx` | MTRX TECH platform control console, ARR graphs, system health badge monitors | SuperAdmin |

---

## 🌟 SECTION 4: TEAM CREDITS & ACKNOWLEDGEMENTS
- **MTRX TECH Founder & CEO**: **MARAPATHRAN V**
- **Core Engineering Developers**: **DURGA MIKILA S.V** (Developer 1), **MURUGAN S** (Developer 2), **SUNDHARESWARAN S.K** (Developer 3)
- **Web Designer**: **MANU SHREE M**
- **Personal Mentor & Faculty Guidance**: **Mrs. C. Krishnakala** (Professor & Personal Mentor)
- **Special Institutional Thanks**: **RAMCO INSTITUTE OF TECHNOLOGY**

---
*MTRX TECH TalentTrack Enterprise SaaS v2.5.0-PROD — Complete System Documentation & File Concept Impact Analysis Verified.*
