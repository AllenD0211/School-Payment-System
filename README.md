  # 🎓Student Fee & records Management System 
-----------------------------------------
The Student Fee & Records Management System is a web-based application designed to help educational institutions efficiently manage student records, tuition fees, and payment tracking. The system provides administrators, parents, and students with a centralized platform to monitor financial records, academic information, and important announcements. This system aims to simplify the process of managing student data while improving transparency and accessibility for all stakeholder.

-------------------------------------------
## System Technologies

### Frontend
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" height="30"> React.js  
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" height="30"> TypeScript  
<img src="https://www.vectorlogo.zone/logos/tailwindcss/tailwindcss-icon.svg" height="30"> Tailwind CSS  
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vite/vite-original.svg" height="30"> Vite  

### Backend
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" height="30"> Node.js  
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" height="30"> Express.js  

### Database
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" height="30"> MongoDB Atlas  

### Other Tools
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/axios/axios-plain.svg" height="30"> Axios  
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" height="30"> Git & GitHub  

-------------------------------------------
## Vercel Deployment

Deploy this repository as 2 Vercel projects:

1. Backend project
- Root Directory: `backend`
- Framework Preset: `Other`
- Uses `backend/vercel.json` and `backend/api/index.js`
- Add environment variables:
  - `MONGO_URI`
  - `JWT_SECRET`
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
  - `ADMIN_SYNC_PASSWORD`
  - `EMAIL_USER`
  - `EMAIL_PASS`
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER` or `TWILIO_MESSAGING_SERVICE_SID`

2. Frontend project
- Root Directory: `frontend`
- Framework Preset: `Vite`
- Add environment variable:
  - `VITE_API_BASE_URL=https://<your-backend-vercel-domain>`
- Uses `frontend/vercel.json` for SPA route rewrites.

### Local + Production API behavior
- Frontend now uses a shared API helper.
- If `VITE_API_BASE_URL` is set, frontend calls that URL.
- If not set and running on localhost, it falls back to `http://localhost:5000`.

### Important security note
- If secrets were committed (MongoDB URI, JWT, Twilio token, Gmail app password), rotate them immediately in their provider dashboards before deploying.
