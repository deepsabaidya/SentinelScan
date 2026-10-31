# SentinelScan 🛡️
### Website Security & Vulnerability Assessment Dashboard
**MCA Technical Training Practical Project | Cybersecurity SaaS Platform**

> **Tagline:** *See Your Security. Strengthen Your Defences.*

---

## 1. Project Overview

**SentinelScan** is a cybersecurity software-as-a-service (SaaS) web application engineered for automated, passive, and non-invasive security assessments. It empowers webmasters, security analysts, and developers to audit public-facing web applications for critical configuration vulnerabilities across **HTTP Security Headers**, **SSL/TLS Certificates**, **HTTPS Redirections**, **DNS Infrastructure & Spoofing Defense**, and **Cookie Directives**.

All application data (User credentials, registered website portfolios, audit logs, granular findings, and technical checks) is persisted in a cloud-hosted **MongoDB Atlas** database cluster. **No local MongoDB server installation is required.**

---

## 2. Key Features

- **Passive & Non-Invasive Auditing**: Zero exploitation, zero payload injection, and zero denial-of-service. 100% compliant with safe auditing baselines.
- **Strict Server-Side SSRF & DNS Rebinding Guard**: Blocks internal network probing (`127.0.0.1`, `10.x`, `192.168.x`, `172.16-31.x`), cloud metadata endpoints (`169.254.169.254`), and dangerous protocols (`file:`, `ftp:`).
- **Multi-Vector Security Engine**:
  1. **HTTP Security Headers**: Deep analysis of CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy.
  2. **SSL/TLS Certificate Deep Handshake**: Inspects certificate chain validity, expiration countdown, CA issuer, SAN hostname matching, and TLS version (TLS 1.2/1.3).
  3. **HTTPS Redirection Audit**: Verifies port 80 requests enforce 301/308 upgrades to HTTPS, preventing SSL-stripping MITM attacks.
  4. **DNS & Email Anti-Spoofing**: Inspects A, AAAA (IPv6 readiness), MX mail exchanges, NS redundancy, SPF TXT records, and DMARC policy enforcement.
  5. **Cookie Security Attributes**: Evaluates `Secure`, `HttpOnly`, and `SameSite` flags without touching user browser credentials.
- **Deterministic 100-Point Scoring Engine**:
  - Transparent weighted categories: Headers (30%), SSL/TLS (35%), Cookies (15%), DNS (20%).
  - Standardized grade mapping: **Excellent (90–100)**, **Good (75–89)**, **Moderate (60–74)**, **Needs Improvement (40–59)**, **Poor (0–39)**.
  - Critical findings impose a strict penalty ceiling on final scores.
- **Boardroom-Ready PDF Reports & CSV Export**: Automated server-side PDF generation powered by **PDFKit** alongside CSV dataset exports.
- **Cybersecurity SaaS Aesthetics**: Dark navy/charcoal palette (`#070d19`), electric blue and cyan accents (`#00e5ff`), Outfit & Inter typography, and interactive **Chart.js** telemetry.

---

## 3. Technology Stack

- **Frontend**: React.js 19, Vite, Bootstrap 5, Bootstrap Icons, Chart.js, React-ChartJS-2, React Router DOM v7
- **Backend**: Node.js v24+, Express.js 4.21, Helmet, Express-Rate-Limit, CORS
- **Database**: MongoDB Atlas (Cloud Managed Cluster), Mongoose ODM 8.9
- **Authentication**: JSON Web Tokens (JWT), bcryptjs password hashing (salt rounds = 10)
- **Document Generation**: PDFKit (Vector PDF rendering)
- **Automated Testing**: Jest, Supertest

---

## 4. System Architecture

```
sentinelscan/
│
├── frontend/                     # React 19 + Vite Frontend SPA
│   ├── src/
│   │   ├── components/           # Reusable UI (Navbar, Sidebar, Cards, Charts, Tables)
│   │   ├── pages/                # Landing, Login, Register, Dashboard, Websites, NewAssessment, Results, History, Reports, Settings
│   │   ├── services/             # API Client with JWT injection & Blob streaming
│   │   ├── hooks/                # useAuth context hook
│   │   ├── index.css             # Cyber SaaS Design System tokens
│   │   └── App.jsx               # Route definitions & ProtectedRoute guards
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # Express.js REST API Server
│   ├── config/                   # db.js (MongoDB Atlas connection handler)
│   ├── controllers/              # auth, website, assessment, dashboard, report controllers
│   ├── middleware/               # authMiddleware, errorHandler, rateLimiter
│   ├── models/                   # User, Website, Assessment, Finding, AssessmentCheck
│   ├── routes/                   # REST route definitions
│   ├── assessments/              # Header, TLS, HTTPS, DNS, Cookie & Scoring engine modules
│   ├── services/                 # pdfReportService (PDFKit generator)
│   ├── utils/                    # ssrfValidator, jwt
│   ├── tests/                    # Jest automated test suites
│   ├── server.js                 # API server entrypoint
│   └── package.json
│
├── docs/                         # Technical Architecture & Project Report
│   ├── architecture/             # ARCHITECTURE.md (Mermaid diagrams & design patterns)
│   ├── technical-training-report/# PROJECT_REPORT.md (Complete MCA project report)
│   └── screenshots/              # UI walkthrough screenshots
│
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git secrets protection
└── README.md                     # Master documentation
```

---

## 5. MongoDB Atlas Cloud Database Setup Guide

You **do not need local MongoDB installed** on your computer. Follow these quick steps to create your free online MongoDB Atlas cluster:

### Step 1: Create a Free Account & Cluster
1. Navigate to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account.
2. Under **Deploy a database**, select the **M0 Free** shared cluster (Free forever, 512 MB storage).
3. Select your preferred cloud provider (AWS / Google Cloud) and region (e.g. Mumbai, Singapore, Frankfurt, or N. Virginia).
4. Click **Create Deployment**.

### Step 2: Configure a Database User
1. In the Atlas dashboard, navigate to **Security** &gt; **Database Access**.
2. Click **Add New Database User**.
3. Choose **Password** authentication.
4. Set a Username (e.g., `sentinel_admin`) and a secure Password (e.g., `CyberSafe2026!`).
5. Set Database User Privileges to **Read and write to any database**.
6. Click **Add User**.

### Step 3: Configure Network Access (IP Whitelist)
1. In the Atlas dashboard, navigate to **Security** &gt; **Network Access**.
2. Click **Add IP Address**.
3. Click **Allow Access from Anywhere** (adds `0.0.0.0/0`).
4. Click **Confirm**. (This enables your development machine to connect to Atlas without static IP restrictions).

### Step 4: Obtain Connection String
1. In the Atlas dashboard, go to **Database** &gt; **Clusters** and click **Connect**.
2. Choose **Drivers** (Driver: **Node.js**, Version: **5.5 or later**).
3. Copy the connection string. It will look like:
   ```
   mongodb+srv://sentinel_admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your real user password, and append `/sentinelscan` before the `?` query string:
   ```
   mongodb+srv://sentinel_admin:CyberSafe2026!@cluster0.abcde.mongodb.net/sentinelscan?retryWrites=true&w=majority
   ```

---

## 6. Installation & Configuration

### Prerequisites
- **Node.js**: v18+ or v24+ (Run `node -v` to verify)
- **npm**: v9+ or v11+ (Run `npm -v` to verify)
- **Git**: (Run `git --version` to verify)

### Clone & Configure Environment
Open **Windows PowerShell** and run:

```powershell
# 1. Clone repository
git clone https://github.com/<your-username>/sentinelscan.git
cd sentinelscan

# 2. Create your .env file from the template
Copy-Item .env.example .env
```

Open the newly created `.env` file in your editor and enter your **MongoDB Atlas connection string** and a secure **JWT Secret**:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://sentinel_admin:CyberSafe2026!@cluster0.abcde.mongodb.net/sentinelscan?retryWrites=true&w=majority
JWT_SECRET=super_secret_sentinelscan_key_minimum_32_characters_long
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

---

## 7. Running the Application (PowerShell)

### Install Dependencies

```powershell
# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Start the Backend API Server

In your first PowerShell terminal:

```powershell
cd backend
npm run dev
```

*Output:*
```
[MongoDB Atlas] Connected successfully to host: cluster0-shard-00-00.abcde.mongodb.net
[MongoDB Atlas] Database: sentinelscan
=============================================================
  SENTINELSCAN SECURITY API SERVER RUNNING ON PORT: 5000
  Health Check: http://localhost:5000/api/health
=============================================================
```

### Start the React Frontend

In a second PowerShell terminal:

```powershell
cd frontend
npm run dev
```

Open your browser at: **`http://localhost:5173`**

---

## 8. REST API Reference

All requests accept and return `application/json`. Endpoints marked *(Protected)* require the HTTP header `Authorization: Bearer <jwt_token>`.

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new analyst account (`name`, `email`, `password`) |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token (`email`, `password`) |
| `GET` | `/api/auth/me` | *(Protected)* Retrieve current user session profile |

### Websites Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/websites` | *(Protected)* Retrieve all registered websites for user |
| `POST` | `/api/websites` | *(Protected)* Register new target with server-side SSRF validation (`url`) |
| `DELETE` | `/api/websites/:id` | *(Protected)* Delete registered website and cascade-delete assessment logs |

### Security Assessments
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/assessments` | *(Protected)* Launch automated passive assessment (`websiteId`) |
| `GET` | `/api/assessments` | *(Protected)* List past assessments (supports `?websiteId=` query) |
| `GET` | `/api/assessments/:id` | *(Protected)* Retrieve full audit dossier, findings, and checks |
| `DELETE` | `/api/assessments/:id` | *(Protected)* Delete assessment record |

### Dashboard Analytics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | *(Protected)* Aggregated counts, avg score, critical findings, latest scan |
| `GET` | `/api/dashboard/history` | *(Protected)* Score history timeline for Chart.js line graph |
| `GET` | `/api/dashboard/severity`| *(Protected)* Findings grouped by severity for Chart.js doughnut |

### Compliance Reports
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/reports/:id/pdf` | *(Protected)* Download executive PDFKit report (`application/pdf`) |
| `GET` | `/api/reports/:id/csv` | *(Protected)* Download tabular findings dataset (`text/csv`) |

### Diagnostics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health, database connection state, and version |

---

## 9. Automated Testing

The backend includes automated tests covering SSRF validation, scoring rules, cookie analysis, and API route security:

```powershell
cd backend
npm test
```

*Expected Result:*
```
PASS tests/ssrfValidator.test.js
PASS tests/api.test.js
PASS tests/scoringEngine.test.js
PASS tests/cookieAssessment.test.js

Test Suites: 4 passed, 4 total
Tests:       28 passed, 28 total
Snapshots:   0 total
```

---

## 10. Future Virtualization & Docker Roadmap

SentinelScan's decoupled architecture was structured for rapid transition into containerized virtualization:

- **Docker Multi-Stage Build**: Compile Vite static assets into an Nginx Alpine container while running Express in a Node.js 24 Alpine container.
- **Docker Compose**: Orchestrate environment variables and bridge networking with a single command (`docker compose up --build`).
- **Cloud VM Deployment**: Deployable to Ubuntu 24.04 LTS cloud instances (AWS EC2, Azure Virtual Machines, or Google Cloud Compute Engine) behind an automated Let's Encrypt TLS reverse proxy.

---

## 11. License & Academic Declaration

This project is developed as an **MCA Technical Training Mini-Project**. It is licensed under the **MIT License**.
