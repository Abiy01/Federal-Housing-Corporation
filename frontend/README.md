# Frontend (BuildEstate)

User-facing React + TypeScript + Vite application.

## Run

```bash
npm install
npm run dev
```

Default URL: `http://localhost:5173`

## Environment

Create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:4000

# Contact page — get a free access key at https://web3forms.com
VITE_WEB3FORMS_ACCESS_KEY=your_access_key_here
```

## Notes

- AI pages/components were removed.
- The app now focuses on core property browsing, auth, and appointment flows.
