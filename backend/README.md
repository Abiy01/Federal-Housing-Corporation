# Backend (FHC)

Express API for the **Federal Housing Corporation (FHC)** platform.

## Run

```bash
npm install
npm run dev
```

Default port: `4000`

## Required Environment Variables

- `MONGO_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `FRONTEND_URL`
- `ADMIN_URL`

Optional:

- SMTP/Brevo values for emails
- Cloudinary values for media uploads

## Route Groups

- `/api/users`
- `/api/products`
- `/api/user/properties`
- `/api/appointments`
- `/api/admin`
- `/api/forms`
- `/api/news`
- `/health`
- `/status`

## Notes

- AI endpoints and related services were removed.
