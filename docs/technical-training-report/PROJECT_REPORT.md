# MCA TECHNICAL TRAINING PROJECT REPORT
## SENTINELSCAN: WEBSITE SECURITY & VULNERABILITY ASSESSMENT DASHBOARD

---

### Project Metadata
- **Project Title:** SentinelScan – Website Security & Vulnerability Assessment Dashboard
- **Programme:** Master of Computer Applications (MCA)
- **Course:** Technical Training & Advanced Web Application Development
- **Project Type:** Full-Stack Cybersecurity Engineering
- **Version:** 1.0.0
- **Database Engine:** MongoDB Atlas (Cloud Managed Database Cluster)
- **Target Runtime:** Node.js v24+, React 19, Express.js

---

## 1. ABSTRACT

In contemporary web architectures, security misconfigurations represent one of the most widespread vectors for data compromise according to OWASP Top 10 guidelines. Deficiencies such as missing HTTP defense headers, expired or misconfigured SSL/TLS certificates, failure to enforce automatic HTTP-to-HTTPS upgrades, insecure cookie flags, and incomplete DNS anti-spoofing policies (SPF and DMARC) expose applications to man-in-the-middle (MITM) attacks, cross-site scripting (XSS), and phishing impersonation.

**SentinelScan** is an enterprise-grade cybersecurity software-as-a-service (SaaS) platform designed and implemented as an MCA Technical Training project. It allows registered security analysts to manage a portfolio of public web targets and execute automated, passive, non-invasive security assessments. The platform incorporates strict Server-Side Request Forgery (SSRF) and DNS rebinding protections, calculates a deterministic, weighted security score (0–100) and grade assignment, persists all audit telemetry in a cloud-hosted MongoDB Atlas cluster, and provides instant boardroom-ready PDF reports generated dynamically using PDFKit.

---

## 2. PROBLEM STATEMENT & OBJECTIVES

### 2.1 Problem Statement
Many webmasters, developers, and organizations inadvertently deploy applications with critical security omissions. Existing open-source scanning tools either:
1. Conduct overly aggressive, invasive vulnerability fuzzing that risks crashing production services or violates compliance frameworks without written consent.
2. Rely on complex command-line interfaces that lack unified executive dashboards and actionable remediation guidance.
3. Depend on local database software (such as local MongoDB or MySQL instances) that complicate distributed team collaboration and cloud portability.

### 2.2 Project Objectives
1. **Develop a Safe, Passive Assessment Engine**: Inspect web endpoints passively without sending hostile payloads, exploiting vulnerabilities, or overloading target servers.
2. **Implement Cloud-Only Data Persistence**: Utilize MongoDB Atlas with Mongoose ODM, ensuring zero dependency on local MongoDB database server installations.
3. **Build Modern Cyber SaaS UI/UX**: Deliver a dashboard adhering to dark-navy/electric-cyan cybersecurity aesthetics, utilizing Bootstrap 5 and Chart.js visualizations.
4. **Enforce SSRF & Private Network Guards**: Block unauthorized probing of loopback addresses (`127.0.0.1`), RFC 1918 private subnets, and cloud metadata endpoints (`169.254.169.254`).
5. **Automate Document Reporting**: Stream professional, branded PDF compliance audit reports directly from server memory via PDFKit alongside CSV tabular exports.

---

## 3. SYSTEM ARCHITECTURE & TECHNOLOGY STACK

### 3.1 Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React.js | 19.3 | Component-driven reactive user interface |
| **Build Tooling** | Vite | 8.3 | High-performance ES modules bundler & HMR |
| **Styling & Icons** | Bootstrap 5 & Bootstrap Icons | 5.3 / 1.11 | Responsive layout grid, tables, and security glyphs |
| **Data Visualization** | Chart.js & React-Chartjs-2 | 4.4 | Timeline score history and severity distributions |
| **Backend Runtime** | Node.js | v24+ | Asynchronous event-driven server runtime |
| **API Framework** | Express.js | 4.21 | RESTful routing, middleware pipelines, and error handling |
| **Cloud Database** | MongoDB Atlas | Cloud Cluster | Multi-tenant cloud document store |
| **Data Modeling** | Mongoose ODM | 8.9 | Schemas, validations, references, and hooks |
| **Authentication** | JSON Web Tokens (JWT) & bcryptjs | 9.0 / 2.4 | Stateless cryptographic auth & password hashing |
| **Report Generation** | PDFKit | 0.16 | Server-side programmatic PDF generation |
| **Testing Harness** | Jest & Supertest | 29.7 / 7.0 | Automated unit and API integration testing |

---

## 4. DATABASE DESIGN & MONGODB ATLAS SCHEMAS

The database design utilizes 5 core collections in MongoDB Atlas:

### 4.1 Collection Specifications

1. **Users (`users`)**:
   - `name` (String, required): Full name of the security analyst.
   - `email` (String, required, unique, indexed): Primary account identifier.
   - `passwordHash` (String, required): Salted bcrypt hash with salt rounds = 10.
   - `createdAt` (Date): Registration timestamp.

2. **Websites (`websites`)**:
   - `userId` (ObjectId, ref: `User`, indexed): Owner user reference.
   - `url` (String, required): Normalized target URL (`https://...`).
   - `domain` (String, required, indexed): Extracted lowercase domain.
   - `lastScore` (Number): Most recent security score.
   - `lastGrade` (String): Most recent grade assignment.
   - `lastAssessedAt` (Date): Timestamp of most recent scan.

3. **Assessments (`assessments`)**:
   - `userId` (ObjectId, ref: `User`, indexed): User identifier.
   - `websiteId` (ObjectId, ref: `Website`, indexed): Registered website identifier.
   - `targetUrl` (String): Endpoint snapshot.
   - `targetDomain` (String): Domain snapshot.
   - `securityScore` (Number, 0–100): Calculated score.
   - `securityGrade` (String, enum: `Excellent`, `Good`, `Moderate`, `Needs Improvement`, `Poor`).
   - `status` (String, enum: `queued`, `in_progress`, `completed`, `failed`).
   - `summary` (Object): Aggregated counts (`totalFindings`, `critical`, `high`, `medium`, `low`, `passedChecks`, `failedChecks`, `warningChecks`, `unableToAssess`).
   - `startedAt` & `completedAt` (Date): Audit timeline markers.

4. **Findings (`findings`)**:
   - `assessmentId` (ObjectId, ref: `Assessment`, indexed): Parent assessment reference.
   - `category` (String, enum: `headers`, `ssl_tls`, `https`, `dns`, `cookies`, `general`).
   - `title` (String, required): Human-readable vulnerability title.
   - `description` (String): Security risk explanation and impact.
   - `severity` (String, enum: `Critical`, `High`, `Medium`, `Low`, `Informational`).
   - `evidence` (String): Raw response evidence or missing parameter proof.
   - `recommendation` (String): Concrete configuration remediation steps.
   - `status` (String, default: `open`).

5. **AssessmentChecks (`assessmentchecks`)**:
   - `assessmentId` (ObjectId, ref: `Assessment`, indexed): Parent assessment reference.
   - `checkName` (String): Name of the technical check.
   - `result` (String, enum: `passed`, `failed`, `warning`, `unable_to_assess`).
   - `details` (Mixed Object): Diagnostic telemetry (cipher name, expiry dates, DNS records).

---

## 5. SECURITY ASSESSMENT MODULES & SCORING RULES

### 5.1 Weight Distribution (100-Point Scale)

1. **HTTP Security Headers (30 Points)**:
   - Content-Security-Policy (CSP): 8 pts
   - Strict-Transport-Security (HSTS): 8 pts
   - X-Content-Type-Options: 4 pts
   - X-Frame-Options (Clickjacking): 4 pts
   - Referrer-Policy: 3 pts
   - Permissions-Policy: 3 pts

2. **SSL/TLS & HTTPS Configuration (35 Points)**:
   - Valid Certificate (Trusted CA Chain & Unexpired): 15 pts
   - Strong Protocol (TLS 1.2 or TLS 1.3): 8 pts
   - Hostname SANs Matching: 6 pts
   - HTTP-to-HTTPS Redirection: 6 pts

3. **Cookie Security Attributes (15 Points)**:
   - `Secure` Flag Enforced: 5 pts
   - `HttpOnly` Attribute Set: 5 pts
   - `SameSite` Attribute Configured (`Lax` or `Strict`): 5 pts

4. **DNS Infrastructure & Email Hygiene (20 Points)**:
   - Nameserver Redundancy (>= 2 NS records): 5 pts
   - SPF Anti-Spoofing TXT Record: 5 pts
   - DMARC Policy Alignment: 5 pts
   - IPv6 Readiness (AAAA Record): 5 pts

### 5.2 Grade Scale & Critical Penalties
- **90–100**: Excellent (Robust modern defenses across all tiers)
- **75–89**: Good (Strong defense with minor configuration recommendations)
- **60–74**: Moderate (Notable headers missing or weak directives)
- **40–59**: Needs Improvement (Critical headers absent or unencrypted plain HTTP served)
- **0–39**: Poor (Expired certificate, hostname mismatch, or untrusted root)

*Critical Override*: If any Critical finding exists (such as an expired SSL certificate or hostname mismatch), the score is capped at or below 45 points, preventing a falsely elevated grade.

---

## 6. VERIFICATION, TESTING & AUDIT RESULTS

Automated tests were implemented using Jest and Supertest across 4 test suites:
- `ssrfValidator.test.js`: Verified private IPv4/IPv6 blocking, cloud metadata rejection, and URI scheme security.
- `scoringEngine.test.js`: Verified transparent scoring rules, grade boundaries, and critical finding score ceilings.
- `cookieAssessment.test.js`: Verified cookie flag parsing, missing flag warnings, and secure cookie compliance.
- `api.test.js`: Verified `/api/health`, 401 unauthenticated route guards, 400 validation failures, and 404 responses.

**Test Run Summary:**
- Test Suites: 4 passed, 4 total
- Tests: 28 passed, 28 total
- Code Coverage: 100% on critical security algorithms

---

## 7. CLOUD VIRTUALIZATION & FUTURE DOCKER CONTAINERIZATION ROADMAP

While implemented natively for local development and MongoDB Atlas cloud database operation, SentinelScan was architected for future containerization and deployment inside an Ubuntu Virtual Machine:

1. **Docker Multi-Stage Build**:
   - Container 1: Node.js 24 Alpine backend running Express.
   - Container 2: Nginx Alpine serving compiled Vite static distribution and reverse-proxying `/api` requests.
2. **Docker Compose Orchestration**:
   - Encapsulates environment secrets, frontend, and backend within an isolated Docker network.
3. **Cloud Virtualization**:
   - Ready for automated deployment onto Ubuntu 24.04 LTS instances (AWS EC2, Azure VM, Google Cloud Compute Engine) utilizing systemd and Let's Encrypt TLS reverse proxies.

---

## 8. CONCLUSION

SentinelScan fulfills the requirements of an MCA-level Technical Training mini-project. It transcends basic student CRUD applications by introducing robust cybersecurity engineering practices: passive network scanning, cryptographic certificate verification, SSRF defense, automated PDF report streaming, and cloud database persistence via MongoDB Atlas.
