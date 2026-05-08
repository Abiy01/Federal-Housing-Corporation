# BuildEstate Project Detailed Explanation

## 1) Project Overview

BuildEstate is a full-stack real estate platform composed of three apps:

- `frontend`: public user-facing website (React + TypeScript + Vite)
- `admin`: admin dashboard for managing listings/users/appointments (React + Vite)
- `backend`: REST API + business logic (Node.js + Express + MongoDB)

The platform supports:

- property browsing, filtering, and details
- user authentication and password reset flows
- appointment booking and management
- user-submitted listings with approval workflow

---

## 2) High-Level Architecture

### Client Layer

- `frontend` runs on `http://localhost:5173`
- `admin` runs on `http://localhost:5174`
- both call the same backend API

### API Layer

- `backend/server.js` bootstraps Express app
- applies middleware: `helmet`, `cors`, `compression`, JSON body parsing, rate limiting, mongo sanitization, request IDs, API stats tracking
- exposes API route groups under `/api/*`

### Data/Service Layer

- MongoDB via Mongoose (`backend/config/mongodb.js`)
- Cloudinary for image upload URLs
- SMTP/Brevo for email notifications and password reset

---

## 3) Backend Internals

Main entrypoint:

- `backend/server.js`

Key responsibilities:

- environment loading (`.env.local` in development)
- CORS allowlist from env vars (`FRONTEND_URL`, `ADMIN_URL`, `LOCAL_URLS`, etc.)
- global error handler + graceful shutdown handlers
- health endpoints:
  - `GET /` (status HTML page)
  - `GET /status` (JSON health status)
  - `GET /health/*` (health router)

Important route groups:

- `/api/products` -> core property CRUD/listing endpoints
- `/api/users` -> register/login/admin login/forgot-reset/verify/me
- `/api/appointments` -> guest/auth bookings + admin appointment actions
- `/api/forms` -> contact form submission
- `/api/news` -> news features
- `/api/admin` -> admin dashboard/stats features
- `/api` -> user listing utility routes from `propertyRoutes.js`

---

## 4) Frontend Internals

Entrypoint:

- `frontend/src/main.tsx` -> mounts `App.tsx`

Routing and page composition (`frontend/src/App.tsx`):

- uses `react-router-dom` routes for:
  - home, properties, property details
  - about/contact
  - auth pages (signin/signup/forgot/reset/verify)
  - user listing pages (`/add-property`, `/my-listings`)
- wraps app with `AuthProvider`
- lazy loads route pages for performance
- uses animated transitions via Framer Motion

API base URL:

- controlled by `VITE_API_BASE_URL` (in `frontend/.env.local`)

---

## 5) Admin App Internals

Entrypoint:

- `admin/src/main.jsx`

Main app (`admin/src/App.jsx`):

- route structure with protected pages
- login route + redirect flow
- dashboard/list/add/update/appointments/pending/users/activity logs
- sidebar state and page transition animations
- toasts and error boundary support

Admin API base URL:

- controlled by `VITE_BACKEND_URL` (in `admin/.env.local`)

---

## 6) Environment Variables and Setup

You need local env files in each app:

- `backend/.env.local`
- `frontend/.env.local`
- `admin/.env.local`

I created them from the provided examples.

### Backend required minimum vars

- `PORT=4000`
- `MONGO_URI=...`
- `JWT_SECRET=...`
- `ADMIN_EMAIL=...`
- `ADMIN_PASSWORD=...`
- `WEBSITE_URL=http://localhost:5173`
- `FRONTEND_URL=http://localhost:5173`
- `ADMIN_URL=http://localhost:5174`
- `LOCAL_URLS=http://localhost:5173,http://localhost:5174,http://localhost:4000`

Recommended for full features:

- `SMTP_USER`, `SMTP_PASS`, `EMAIL`, `BREVO_API_KEY`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Frontend vars

- `VITE_API_BASE_URL=http://localhost:4000`

### Admin vars

- `VITE_BACKEND_URL=http://localhost:4000`

---

## 7) How to Run Locally

## Prerequisites

- Node.js 18+
- npm
- MongoDB Atlas URI (or local MongoDB)

## Install

From each app directory:

```powershell
cd backend; npm install
cd ../frontend; npm install
cd ../admin; npm install
```

## Start all services

Use three terminals:

```powershell
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev

# Terminal 3
cd admin
npm run dev
```

Expected URLs:

- frontend: `http://localhost:5173/`
- admin: `http://localhost:5174/`
- backend API: `http://localhost:4000/`
- backend status: `http://localhost:4000/status`

---

## 8) What I Verified in This Run

I installed dependencies successfully for:

- `backend`
- `frontend`
- `admin`

I started all three dev servers and verified startup logs:

- frontend started on `http://localhost:5173`
- admin started on `http://localhost:5174`
- backend started on `http://localhost:4000`

Observed warning on backend:

- MongoDB connection failed because `MONGO_URI` is still placeholder from example (`your_cluster.mongodb.net`)
- server still runs for health checks, but DB-dependent features will fail until a real Mongo URI is configured

---

## 9) Recommended First-Run Checklist

1. Replace `MONGO_URI` and `JWT_SECRET` in `backend/.env.local`
2. Set real `ADMIN_EMAIL` and `ADMIN_PASSWORD`
3. Restart backend after env updates
4. Open:
   - `http://localhost:5173` for user app
   - `http://localhost:5174` for admin app
5. Test backend status endpoint: `http://localhost:4000/status`
6. (Optional) Configure SMTP/Cloudinary keys for complete feature coverage

---

## 10) Quick Troubleshooting

- **Backend starts but data fails**: check MongoDB URI and DB network allowlist in Atlas.
- **CORS errors**: verify frontend/admin URLs match backend env allowlist values.
- **Image upload fails**: validate Cloudinary credentials.
- **Email reset not sending**: validate SMTP/Brevo credentials and sender email.

