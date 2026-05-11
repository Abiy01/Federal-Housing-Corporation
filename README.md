https://federal-housing-corporation-z61c.vercel.app/login

# Federal Housing Corporation (FHC)

This monorepo powers the **Federal Housing Corporation (FHC)** digital platform: verified property listings, citizen-facing housing services, admin operations, and a shared API. It is organized as three apps:

- `frontend`: user-facing website
- `admin`: admin dashboard
- `backend`: REST API server

## Tech Stack

- Frontend: React + TypeScript + Vite
- Admin: React + Vite
- Backend: Node.js + Express + MongoDB + Mongoose
- Media: Cloudinary
- Email: SMTP/Brevo

## Project Structure

```text
Federal-Housing-Corporation/
├── frontend/
├── admin/
├── backend/
└── shared/
```

## Local Setup

### 1) Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../admin && npm install
```

### 2) Configure environment variables

Create these files from examples:

- `backend/.env.local` from `backend/.env.example`
- `frontend/.env.local` from `frontend/.env.example`
- `admin/.env.local` from `admin/.env.example`

Backend minimum required values:

- `MONGO_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `FRONTEND_URL=http://localhost:5173`
- `ADMIN_URL=http://localhost:5174`

Frontend:

- `VITE_API_BASE_URL=http://localhost:4000`

Admin:

- `VITE_BACKEND_URL=http://localhost:4000`

### 3) Run locally

Use three terminals:

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev

# terminal 3
cd admin
npm run dev
```

Local URLs:

- Frontend: `http://localhost:5173`
- Admin: `http://localhost:5174`
- Backend: `http://localhost:4000`

## Main Features

- User authentication (register/login/reset password)
- Property listing and details
- Appointment scheduling
- User-submitted listings with admin review flow
- Admin dashboard for listings, users, and appointments

## API Overview

- Auth/User: `/api/users/*`
- Properties: `/api/products/*`
- User listings: `/api/user/properties/*`
- Appointments: `/api/appointments/*`
- Admin: `/api/admin/*`
- Forms: `/api/forms/*`
- News: `/api/news/*`

## Notes

- The AI feature and AI routes have been removed from this project.
