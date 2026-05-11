# FHC Deployment Guide (Vercel + Render)

This guide deploys the **Federal Housing Corporation (FHC)** monorepo:

- `frontend` to Vercel
- `backend` to Render

It is written for this repository structure and current codebase.

---

## 1) Pre-deployment checklist

Before deploying, make sure all items below are done:

1. MongoDB Atlas production cluster is ready and network access allows Render.
2. Cloudinary production credentials are available.
3. SMTP/Brevo credentials are available (if you use email features).
4. A strong `JWT_SECRET` is generated.
5. You know your final frontend URL (Vercel domain/custom domain).
6. You know your backend URL (Render service URL).

Local validation commands:

```bash
# backend
cd backend
npm install
npm start

# frontend
cd ../frontend
npm install
npm run build
```

---

## 2) Backend deployment on Render

### 2.1 Create the Web Service

1. Open [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository and select this project.
4. Configure:
   - **Name**: `real-estate-backend` (or your preferred name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm start`
   - **Plan**: choose your preferred plan

### 2.2 Set backend environment variables

Set these in Render -> Service -> **Environment**.

Required:

- `NODE_ENV=production`
- `MONGO_URI=<your atlas connection string>`
- `JWT_SECRET=<long random secure secret>`
- `ADMIN_EMAIL=<admin email>`
- `ADMIN_PASSWORD=<strong admin password>`
- `FRONTEND_URL=https://<your-frontend-domain>`
- `WEBSITE_URL=https://<your-frontend-domain>`

Recommended:

- `ADMIN_URL=https://<your-admin-domain-if-any>`
- `LOCAL_URLS=` (leave empty in production unless needed)
- `EXTRA_ALLOWED_ORIGINS=https://<additional-allowed-origin-1>,https://<additional-allowed-origin-2>`
- `RATE_LIMIT_WINDOW_MS=3600000`
- `RATE_LIMIT_MAX_REQUESTS=1000`
- `SESSION_TIMEOUT_MINUTES=60`
- `MAX_FILE_SIZE_MB=10`
- `MAX_FILES_PER_PROPERTY=10`

If your app uses media uploads:

- `CLOUDINARY_CLOUD_NAME=<cloudinary cloud name>`
- `CLOUDINARY_API_KEY=<cloudinary api key>`
- `CLOUDINARY_API_SECRET=<cloudinary api secret>`

If your app uses outbound emails:

- `SMTP_USER=<smtp username>`
- `SMTP_PASS=<smtp password>`
- `EMAIL=<from email>`
- `EMAIL_USER=<from email>`
- `BREVO_API_KEY=<brevo api key>`

Optional payment/contact fields in current `.env.example`:

- `TELEBIRR_NUMBER`
- `CBE_BIRR_NUMBER`
- `CBE_ACCOUNT_NUMBER`

### 2.3 Deploy and verify backend

After first deploy, test:

1. `https://<your-backend>.onrender.com/status` -> should return JSON with `status: "OK"`.
2. `https://<your-backend>.onrender.com/health` -> should return health response.
3. Confirm logs show DB connection success.

If CORS issues appear, verify:

- `FRONTEND_URL` exactly matches your Vercel domain (including `https://`).
- Any extra origin is included in `EXTRA_ALLOWED_ORIGINS`.

---

## 3) Frontend deployment on Vercel

### 3.1 Import project

1. Open [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Import the same repository.
4. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

The repository already has `frontend/vercel.json` for SPA rewrites/headers/redirects.

### 3.2 Set frontend environment variables

In Vercel -> Project -> **Settings** -> **Environment Variables**, set:

- `VITE_API_BASE_URL=https://<your-backend>.onrender.com`
- `VITE_WEB3FORMS_ACCESS_KEY=<your web3forms key>`

Important:

- Do **not** append `/api` to `VITE_API_BASE_URL`.
- The frontend code appends `/api` automatically.

### 3.3 Deploy and verify frontend

After deployment:

1. Open your Vercel URL.
2. Open browser devtools -> Network and confirm API calls go to:
   - `https://<your-backend>.onrender.com/api/...`
3. Verify key flows:
   - Sign up / Sign in
   - Property listing page load
   - Property details page load
   - Contact form submit

---

## 4) Domain + CORS alignment (critical)

Whenever your frontend domain changes, update backend env vars and redeploy backend:

- `FRONTEND_URL`
- `WEBSITE_URL`
- `EXTRA_ALLOWED_ORIGINS` (if needed)

Then redeploy frontend if backend URL changed.

---

## 5) Post-deployment smoke test checklist

Run this quick checklist:

1. Backend `/status` returns 200.
2. Frontend loads without blank screen.
3. No CORS errors in browser console.
4. Auth routes work (`/api/users/...`).
5. At least one read endpoint works (`/api/products/list`).
6. File upload flow works if enabled (Cloudinary).
7. Email-related actions work if configured.

---

## 6) Common issues and fixes

### CORS blocked for origin

Fix:

- Ensure backend `FRONTEND_URL` exactly equals deployed frontend URL.
- Add extra domains to `EXTRA_ALLOWED_ORIGINS`.
- Redeploy backend.

### Frontend calling localhost in production

Fix:

- Set `VITE_API_BASE_URL` in Vercel Production environment.
- Redeploy frontend.

### Render service boots but DB features fail

Fix:

- Validate `MONGO_URI`.
- Check Atlas network access and user permissions.
- Confirm logs show successful DB connect.

### Upload failures

Fix:

- Confirm Cloudinary env vars are set on Render.
- Validate request payload/file size limits.

---

## 7) Security and operations recommendations

1. Rotate `JWT_SECRET` and API keys periodically.
2. Keep environment variables only in platform dashboards (never in repo).
3. Enable Vercel and Render project access controls (team-based).
4. Set up uptime monitoring for `/status`.
5. Review npm vulnerabilities regularly and patch safely.

---

## 8) Quick reference values

Backend (Render):

- Root dir: `backend`
- Build: `npm run render-build`
- Start: `npm start`
- Health check: `/status`

Frontend (Vercel):

- Root dir: `frontend`
- Build: `npm run build`
- Output: `dist`
- Required env: `VITE_API_BASE_URL`

