# Federal Housing Corporation (FHC)

Full-stack digital housing platform for Ethiopia (Federal Housing Corporation), developed as a final-year graduation project.

## Project Overview

The FHC monorepo consists of three applications:

- `frontend` - user-facing web app
- `admin` - admin dashboard
- `backend` - REST API server

The system supports secure authentication, property listing workflows, appointment management, maintenance workflows, and role-based administration.

---

## Key Features

### User Application (`frontend`)
- Register, login, forgot/reset password, email verification
- Browse and view property listings
- Schedule appointments
- Submit personal property listings
- Track maintenance-related requests

### Admin Application (`admin`)
- Dashboard and operational insights
- Review/approve/reject pending listings
- User moderation (suspend/ban/status actions)
- Appointment and workflow management
- Activity and operational controls

### Backend API (`backend`)
- Modular route architecture
- JWT-based auth and role protection
- Security middleware (helmet, rate limiting, sanitize, CORS)
- MongoDB persistence via Mongoose
- Cloudinary media integration
- SMTP/Brevo email integration
- Health and status endpoints

---

## Technology Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Admin:** React, Vite, Tailwind CSS, Chart.js
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Security:** JWT, bcrypt, helmet, CORS, rate limiting
- **Services:** Cloudinary, Nodemailer/SMTP

---

## Repository Structure

```text
Federal-Housing-Corporation/
├── frontend/
├── admin/
├── backend/
├── shared/
└── *.md documentation files
```

---

## Local Setup

## 1) Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../admin && npm install
```

## 2) Configure environment variables

Create local env files:

- `backend/.env.local` (from `backend/.env.example`)
- `frontend/.env.local` (from `frontend/.env.example`)
- `admin/.env.local` (from `admin/.env.example` if available)

Minimum backend variables:

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

## 3) Run the apps

Use three terminals:

```bash
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

Local URLs:

- Frontend: `http://localhost:5173`
- Admin: `http://localhost:5174`
- Backend: `http://localhost:4000`
- Backend status: `http://localhost:4000/status`

---

## Deployment

Recommended deployment model:

- Frontend -> Vercel
- Backend -> Render

See detailed guide:

- `DEPLOYMENT_VERCEL_RENDER_GUIDE.md`

---

## Defense Documents Included

For presentation and viva preparation:

- `PRESENTATION_SCRIPT_DEFENSE.md`
- `DEFENSE_QUESTIONS_AND_ANSWERS.md`
- `PROJECT_DESCRIPTION_VERY_DETAILED.md`

---

## Security Notes

- Do not commit `.env.local` or secrets.
- Keep production credentials only in deployment platform environment settings.
- Rotate sensitive keys periodically.

---

## Current Limitations

- Automated test coverage is limited.
- CI/CD and advanced observability can be expanded.
- Additional optimization and scalability work can be added as future enhancements.

---

## License

Refer to `LICENSE`.

