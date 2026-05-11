# FHC Platform Defense: Possible Questions and Model Answers

Use these as practice responses for viva/defense sessions.  
Keep answers natural; do not memorize word-for-word.

---

## A) Project Fundamentals

### 1) What problem does your project solve?
**Answer:**  
The FHC platform addresses fragmentation in housing workflows by bringing property discovery, appointment booking, listing moderation, and maintenance operations into one integrated digital system for Ethiopia.

### 2) Why did you choose this project?
**Answer:**  
Real estate management has practical real-world relevance and requires solving multi-role workflow challenges. It allowed me to demonstrate full-stack skills, security design, and operational architecture.

### 3) What are your main objectives?
**Answer:**  
My objectives were to build a secure and scalable full-stack application, provide separate user and admin experiences, and implement role-based workflows with deployment readiness.

### 4) Who are the target users?
**Answer:**  
Primary users are property seekers and owners. Secondary users are administrators and maintenance staff who manage platform operations and service workflows.

---

## B) Architecture and Design

### 5) Describe your system architecture.
**Answer:**  
The architecture has three applications: frontend, admin dashboard, and backend API. Both clients call the backend REST API, which manages business logic and data persistence in MongoDB.

### 6) Why separate frontend and admin into different apps?
**Answer:**  
The two applications have different UX, route structures, permissions, and release cycles. Separation improves maintainability, security boundaries, and developer clarity.

### 7) Why did you use a REST API approach?
**Answer:**  
REST is simple, well-understood, and ideal for role-based web applications. It also makes integration and future client expansion easier.

### 8) Why MongoDB instead of SQL?
**Answer:**  
MongoDB gave flexibility during evolving requirements and rapid development. Mongoose schemas still enforce structure while allowing iterative feature growth.

---

## C) Tech Stack Choices

### 9) Why React and Vite?
**Answer:**  
React provides component reusability and a strong ecosystem. Vite gives very fast startup/build performance, which improved development productivity.

### 10) Why Node.js and Express for backend?
**Answer:**  
Node.js with Express is lightweight, efficient for JSON APIs, and aligns well with JavaScript across the full stack, reducing context switching.

### 11) Why Mongoose?
**Answer:**  
Mongoose provides schema modeling, validation, middleware support, and cleaner database interaction than writing raw MongoDB operations repeatedly.

### 12) Why Cloudinary and SMTP integration?
**Answer:**  
Cloudinary offloads media storage and optimization. SMTP/Brevo supports real communication flows like password reset and verification emails.

---

## D) Security and Reliability

### 13) How do you secure authentication?
**Answer:**  
I use JWT for session-like stateless auth, bcrypt for password hashing, protected middleware for route authorization, and role checks for sensitive actions.

### 14) How do you handle CORS?
**Answer:**  
I use an allowlist-based CORS policy configured through environment variables, so only trusted frontend/admin origins can call the API.

### 15) How do you prevent abuse or injection?
**Answer:**  
I use rate limiting, helmet security headers, and express-mongo-sanitize to reduce brute-force and NoSQL injection risks.

### 16) What happens when errors occur?
**Answer:**  
There is centralized error handling with structured JSON responses and request IDs. Health endpoints allow operational checks even during partial failures.

---

## E) Workflow Logic

### 17) Explain your listing approval workflow.
**Answer:**  
User-submitted listings are created as `pending`. Admins review and approve/reject. Only approved (`active`) listings appear in public listing endpoints.

### 18) Explain maintenance workflow.
**Answer:**  
A user creates a maintenance request. Admin assigns it to maintenance staff. Staff updates status from assigned to in-progress to completed, with notes and cost details.

### 19) How are roles managed?
**Answer:**  
Users have role states such as user and maintenance. Admin controls promotions/demotions and moderation actions. Admin routes are separately protected.

### 20) How do you ensure data consistency?
**Answer:**  
Status enums and guarded transitions reduce invalid state changes. Controllers enforce ownership/role checks before updates.

---

## F) Deployment and DevOps

### 21) How is the project deployed?
**Answer:**  
Frontend is prepared for Vercel and backend for Render. Environment variables configure endpoints, CORS origins, secrets, database, and integrations.

### 22) How do you verify deployment health?
**Answer:**  
I check backend `/status`, verify frontend API calls target production backend, then run smoke tests for auth, property listing, and key admin actions.

### 23) What deployment issues did you anticipate?
**Answer:**  
Main risks are CORS mismatch, missing env variables, and database connectivity. I prepared health checks and explicit deployment guides to reduce these failures.

### 24) What monitoring approach did you include?
**Answer:**  
I added structured logging and health endpoints. For production, I recommend uptime monitoring on `/status` and centralized log review.

---

## G) Testing and Quality

### 25) How did you test the project?
**Answer:**  
I used build validation, runtime startup checks, endpoint-level verification, and integration smoke tests between frontend, admin, and backend.

### 26) What are the current test limitations?
**Answer:**  
Automated tests are currently limited. Manual validation is strong, but future improvements should include unit, integration, and e2e tests in CI.

### 27) If given more time, what quality improvements would you add?
**Answer:**  
I would add Jest/Vitest unit tests, Playwright e2e tests, CI pipelines, stronger linting gates, and dependency security automation.

---

## H) Academic and Reflection Questions

### 28) What is your original contribution?
**Answer:**  
My contribution is integrating multi-role workflows into one cohesive platform with production-style architecture, security middleware, and deployment-ready structure.

### 29) What was your biggest technical challenge?
**Answer:**  
Coordinating multi-app environment configuration and CORS while preserving secure role-based workflows was the most complex challenge.

### 30) What did you learn from this project?
**Answer:**  
I learned practical full-stack architecture, backend security patterns, deployment operations, and how to design maintainable modular APIs.

### 31) Why is your project suitable for final-year defense?
**Answer:**  
It demonstrates end-to-end software engineering: requirements translation, architecture design, implementation, integration, security, deployment, and evaluation.

---

## I) Tough Examiner Questions (Advanced)

### 32) How would your system scale for high traffic?
**Answer:**  
I would add horizontal scaling for backend instances, caching for read-heavy endpoints, CDN optimization, database indexing reviews, and queue-based background processing.

### 33) Why not use microservices?
**Answer:**  
For this project scope, a modular monolith is more maintainable and faster to deliver. It preserves clean separation while avoiding unnecessary distributed-system complexity.

### 34) How do you handle secret management?
**Answer:**  
Secrets are kept in environment variables on deployment platforms and excluded from version control. `.env.example` files provide safe templates only.

### 35) What are your key security risks remaining?
**Answer:**  
Remaining risks include credential leakage from improper ops practices, third-party dependency vulnerabilities, and insufficient automated security testing in CI.

### 36) What architecture changes would you make for enterprise adoption?
**Answer:**  
I would introduce centralized auth service, audit/event pipeline, observability stack, stronger policy enforcement, and controlled release pipelines with automated testing.

---

## J) 60-Second Closing Answer (if asked “final summary?”)

FHC is a full-stack platform that solves real workflow problems with practical architecture aligned to federal housing operations.  
It includes secure authentication, role-based operations, listing and appointment management, and deployable frontend/backend services.  
The project demonstrates complete software engineering from concept to implementation and deployment, while leaving clear paths for future scalability and test automation.

