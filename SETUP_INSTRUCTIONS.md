# FHC Setup Instructions

This guide explains how to set up and run the **Federal Housing Corporation (FHC)** monorepo locally in a reliable way.

It covers:

- prerequisites
- environment setup
- dependency installation
- running frontend, backend, and admin
- integration verification
- troubleshooting

---

## 1) Project Overview

This repository contains three apps:

- `backend` -> Express API server (`http://localhost:4000`)
- `frontend` -> user website (`http://localhost:5173`)
- `admin` -> admin dashboard (`http://localhost:5174`)

All client apps (`frontend`, `admin`) call the `backend`.

---

## 2) Prerequisites

Install these before starting:

- Node.js 18+ (recommended: Node 20 LTS)
- npm (comes with Node.js)
- MongoDB Atlas account (or local MongoDB)
- Git (optional but recommended)

Check versions:

```powershell
node -v
npm -v
```

---

## 3) Clone and Enter Project

```powershell
git clone <your-repo-url>
cd Federal-Housing-Corporation
```

If you already have the code, just open the project root:

```powershell
cd "C:\Users\HP\OneDrive\Desktop\Federal-Housing-Corporation"
```

---

## 4) Environment Files

Create local env files for all three apps.

### Backend env

Create `backend/.env.local`:

```env
PORT=4000
NODE_ENV=development
BACKEND_URL=http://localhost:4000

MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/fhc?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret

SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
EMAIL=your_sender_email@domain.com
EMAIL_USER=your_sender_email@domain.com
BREVO_API_KEY=your_brevo_api_key

ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=replace_with_secure_password

WEBSITE_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
LOCAL_URLS=http://localhost:5173,http://localhost:5174,http://localhost:4000
EXTRA_ALLOWED_ORIGINS=

IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=1000
SESSION_TIMEOUT_MINUTES=60
MAX_FILE_SIZE_MB=10
MAX_FILES_PER_PROPERTY=10
```

Minimum required to run core API:

- `MONGO_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `FRONTEND_URL`
- `ADMIN_URL`

### Frontend env

Create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:4000
```

### Admin env

Create `admin/.env.local`:

```env
VITE_BACKEND_URL=http://localhost:4000
```

---

## 5) Install Dependencies

Run these commands from the project root:

```powershell
cd backend
npm install

cd ..\frontend
npm install

cd ..\admin
npm install
```

---

## 6) Start All Apps

Open 3 terminals.

### Terminal 1: Backend

```powershell
cd "C:\Users\HP\OneDrive\Desktop\Federal-Housing-Corporation\backend"
npm run dev
```

Expected:

- backend starts on `http://localhost:4000`
- no Mongo connection error in logs

### Terminal 2: Frontend

```powershell
cd "C:\Users\HP\OneDrive\Desktop\Federal-Housing-Corporation\frontend"
npm run dev
```

Expected:

- frontend starts on `http://localhost:5173`

### Terminal 3: Admin

```powershell
cd "C:\Users\HP\OneDrive\Desktop\Federal-Housing-Corporation\admin"
npm run dev
```

Expected:

- admin starts on `http://localhost:5174`

---

## 7) Integration Verification Checklist

After startup, verify in this order:

1. Backend health:
   - open `http://localhost:4000/status`
   - should return JSON with `"status":"OK"`
2. Frontend UI:
   - open `http://localhost:5173`
   - homepage loads without console/API errors
3. Admin UI:
   - open `http://localhost:5174`
   - login page loads
4. API data route:
   - open `http://localhost:4000/api/products/list`
   - should return JSON data (not server error)
5. CORS check:
   - frontend requests should not show CORS-blocked errors

If step 4 fails with server error, MongoDB is usually misconfigured.

---

## 8) Build Verification (Optional but Recommended)

Run production builds to catch issues early.

### Frontend

```powershell
cd frontend
npm run build
```

### Admin

```powershell
cd admin
npm run build
```

### Backend

Backend has no compile build step; running `npm run dev` or `npm start` is the runtime validation.

---

## 9) Common Issues and Fixes

### Issue: Backend `/api/products/list` returns server error

Likely cause:

- invalid/placeholder `MONGO_URI`

Fix:

- set a real MongoDB URI in `backend/.env.local`
- ensure Mongo Atlas IP/network access allows your current IP
- ensure database user credentials are correct
- restart backend

### Issue: CORS errors from frontend/admin

Fix:

- confirm backend env values:
  - `FRONTEND_URL=http://localhost:5173`
  - `ADMIN_URL=http://localhost:5174`
  - `LOCAL_URLS=http://localhost:5173,http://localhost:5174,http://localhost:4000`
- restart backend after env changes

### Issue: Admin cannot login

Fix:

- ensure `ADMIN_EMAIL` and `ADMIN_PASSWORD` in backend env are set
- use the same credentials in admin login form

### Issue: Email features not working

Fix:

- configure SMTP/Brevo env vars correctly
- verify sender domain/account settings with provider

### Issue: Image upload fails

Fix:

- configure ImageKit credentials:
  - `IMAGEKIT_PUBLIC_KEY`
  - `IMAGEKIT_PRIVATE_KEY`
  - `IMAGEKIT_URL_ENDPOINT`

---

## 10) Recommended First Successful Run

Use this minimal success path:

1. Configure `backend/.env.local` with real `MONGO_URI`, `JWT_SECRET`, admin credentials.
2. Configure frontend/admin API URLs to localhost backend.
3. Start backend -> verify `/status`.
4. Start frontend/admin.
5. Verify `/api/products/list` responds successfully.
6. Browse frontend and admin pages.

Once this is stable, configure optional email and image integrations.

---

## 11) Notes

- AI features/routes have been removed from this codebase.
- If you modify env files, always restart the related app.
- Keep secrets in `.env.local` only; do not commit real credentials.
