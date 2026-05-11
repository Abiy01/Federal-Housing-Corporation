# FHC — Very Detailed Project Description

## 1. Executive Summary

The **Federal Housing Corporation (FHC)** platform is a full-stack housing and property-management system (e.g. capstone or final-year delivery), focused on Ethiopia.  
It provides:

- a **public client application** for browsing and interacting with property listings,
- an **admin dashboard** for platform governance and operations,
- a **backend API** implementing business logic, security, and persistence.

The system is designed to solve practical industry problems: fragmented listing workflows, weak moderation controls, and poor visibility of post-listing operations such as maintenance and appointment handling.

---

## 2. Problem Context and Motivation

In many real estate environments, digital operations are fragmented:

- Listings are scattered across disconnected channels.
- Admin moderation is often manual and inconsistent.
- Appointment and maintenance flows are weakly integrated.
- Security and auditing are insufficient in ad-hoc systems.

FHC addresses this by introducing a centralized, role-aware system where users, admins, and maintenance actors operate within one coordinated platform.

---

## 3. Core Goals and Non-Functional Targets

### Functional goals
- End-to-end user journey (discover -> authenticate -> request services).
- Admin moderation and lifecycle control.
- Maintenance workflow implementation.
- Unified API consumed by both client applications.

### Non-functional goals
- Security-first API defaults.
- Modular architecture for maintainability.
- Deployment readiness on modern cloud platforms.
- Environment-driven configurability for local and production use.

---

## 4. System Boundaries and Scope

### In scope
- User authentication and account flows.
- Property listing and detail presentation.
- Appointment scheduling workflows.
- User listing submission and moderation.
- Admin user/status management.
- Maintenance request assignment and completion flow.
- Operational logging and health endpoints.

### Out of scope (current version)
- Native mobile app.
- Comprehensive automated test suite.
- Fully advanced recommendation/search intelligence layer.

---

## 5. High-Level Architecture

The platform follows a client-server architecture with shared backend services:

1. **Frontend (`frontend`)**  
   User-facing SPA built with React + TypeScript + Vite.

2. **Admin (`admin`)**  
   Management SPA built with React + Vite.

3. **Backend (`backend`)**  
   Express REST API managing domain logic, auth, integrations, and MongoDB persistence.

4. **External services**  
   - MongoDB Atlas for persistent data
   - Cloudinary for media management
   - SMTP/Brevo for email delivery

Both frontend and admin clients communicate with the backend over HTTP using JSON APIs (plus multipart where uploads are needed).

---

## 6. Detailed Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Framer Motion

### Admin
- React
- Vite
- Tailwind CSS
- Chart.js / react-chartjs-2
- Axios

### Backend
- Node.js (ES modules)
- Express
- MongoDB + Mongoose
- JWT + bcrypt
- Helmet, CORS, rate limiting, sanitize middleware
- Nodemailer
- Multer + Cloudinary
- Winston logging

---

## 7. Backend Internal Design

Backend entrypoint is `backend/server.js`.

Key concerns implemented:

1. **Environment loading**
   - `.env.local` in development
   - process-level env vars in production

2. **Security middleware**
   - `helmet` for security headers
   - `express-rate-limit` for request throttling
   - `express-mongo-sanitize` for NoSQL injection reduction
   - strict CORS origin allowlist

3. **Operational middleware**
   - request ID middleware for traceability
   - stats tracking middleware
   - centralized error handling

4. **Data/service initialization**
   - MongoDB connection with resilience paths
   - startup of scheduled jobs for lifecycle automation

5. **Routing**
   - modular route/controller structure grouped by domain

6. **Health observability**
   - `/status` JSON endpoint
   - `/health` router

---

## 8. API Domain Modules

Main backend route groups include:

- `/api/users` - registration, login, profile, verification, password reset
- `/api/products` - public/core property retrieval and management paths
- `/api/user/properties` - user-submitted listing workflows
- `/api/appointments` - appointment lifecycle operations
- `/api/admin` - dashboard analytics and moderation features
- `/api/maintenance` - maintenance request lifecycle and staff assignment
- `/api/forms` and `/api/news` - additional platform functionality

This modularity supports maintainability and faster feature evolution.

---

## 9. Data Modeling Strategy

Mongoose models are structured around role and workflow states.

### Key entities
- **User**: identity, role, status, auth metadata
- **Property**: listing content, ownership, status (`pending`, `active`, `rejected`, etc.)
- **Appointment**: user/guest interactions around listings
- **MaintenanceRequest**: issue report -> assignment -> completion lifecycle
- **AdminActivityLog**: operational traceability

### Design principles
- status-driven transitions to enforce business rules,
- role-aware ownership checks in controllers,
- separation between public visibility and internal moderation state.

---

## 10. Authentication and Authorization

### Authentication
- JWT bearer tokens issued on successful auth.
- Passwords hashed with bcrypt before persistence.
- Token checked in protected middleware.

### Authorization
- Role checks for privileged actions.
- Admin-only routes guarded separately.
- Maintenance-specific actions restricted to maintenance role.

This ensures users can access only allowed resources and operations.

---

## 11. Security Posture

Security controls implemented include:

- CORS allowlist based on explicit trusted origins.
- Request throttling for abuse resistance.
- Input sanitization against NoSQL operators.
- Secure HTTP header defaults via Helmet.
- Structured centralized error handling.
- Environment-based secret management.

While strong for project scope, additional enterprise-level controls can be layered later.

---

## 12. Frontend Experience Design

The public frontend is designed as a modern, responsive SPA:

- route-based navigation for major user journeys,
- reusable components for consistency,
- API integration via centralized service layer,
- lazy-loading and transition effects for UX quality.

Users can discover listings, manage account actions, and engage with service flows like appointments and maintenance-related requests.

---

## 13. Admin Experience Design

The admin application emphasizes operational efficiency:

- dashboard summaries and visual cues,
- moderation interfaces for pending workflows,
- user lifecycle controls (including suspension/ban),
- activity visibility and management pages,
- role updates for maintenance operations.

The admin layer transforms the platform from a static listing site into a managed digital system.

---

## 14. Integration Design

### Cloudinary
- Handles image upload/storage concerns.
- Prevents media persistence burden on core app servers.

### Email provider (SMTP/Brevo)
- Enables transactional communication.
- Supports key trust flows such as verification/reset.

### MongoDB Atlas
- Managed persistent layer with flexible schema evolution.
- Suitable for iterative development with evolving domain requirements.

---

## 15. Deployment Model

Target deployment model:

- **Frontend** on Vercel
- **Backend** on Render

Configuration is driven by environment variables:

- frontend receives backend base URL (`VITE_API_BASE_URL`)
- backend receives CORS origins, secrets, DB URI, and service credentials

Health endpoints provide post-deploy validation.

---

## 16. Engineering Challenges and Resolutions

### Challenge 1: Multi-app coordination
Two client apps consuming one backend requires strict contract control.  
**Resolution:** route modularization + shared API conventions + environment templates.

### Challenge 2: CORS and environment mismatches
Frequent source of integration failures.  
**Resolution:** explicit allowlist strategy and deploy-time env alignment.

### Challenge 3: Role-based workflow complexity
Different actors require different capabilities.  
**Resolution:** middleware-based authorization and status-driven domain logic.

### Challenge 4: Operational readiness
Need confidence beyond local execution.  
**Resolution:** health endpoints, structured logs, and deployment guides.

---

## 17. Validation and Verification Approach

Given project scope, verification centered on:

- dependency and build validation,
- backend runtime health checks,
- route-level functional tests via manual/API checks,
- deployment-readiness checks for environment and CORS.

This confirms practical operability though automated test coverage remains a future enhancement area.

---

## 18. Current Limitations

1. Automated tests are limited and should be expanded.
2. Security can be deepened with advanced monitoring and policy automation.
3. CI/CD pipeline can be strengthened with gated checks.
4. Further UX and performance optimizations are possible as scale increases.

---

## 19. Future Enhancements

1. Full automated testing stack (unit, integration, e2e).
2. Observability stack (metrics, traces, alerting dashboards).
3. Performance optimizations and caching strategy.
4. Advanced search/ranking/recommendation capabilities.
5. Mobile client integration.
6. Enterprise-grade audit, compliance, and policy controls.

---

## 20. Academic Value and Learning Outcomes

This project demonstrates:

- applied software architecture,
- full-stack implementation capability,
- secure API development,
- real-world deployment practice,
- workflow-centered domain modeling.

It reflects the transition from theoretical coursework to practical software engineering with production-oriented thinking.

---

## 21. Conclusion

FHC is a complete, multi-role housing platform that integrates frontend UX, admin operations, backend domain logic, security controls, and cloud deployment readiness.  
It is both a functional software product and a strong final-year engineering artifact, with clear potential for further research and industrial-grade extension.

