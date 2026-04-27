# Placement Portal

Placement Portal is a full-stack role-based placement management application with Student, Company, and Admin modules.

The backend serves APIs and static frontend pages from the same Node.js service.

## Stack

- Backend: Node.js, Express
- Database: MongoDB (Atlas recommended for deployment)
- Authentication: JWT
- Password hashing: bcryptjs
- Email provider: Brevo API (for OTP reset flow)
- Frontend: Static HTML/CSS/JS served from `public/`

## What This README Covers

This guide covers the complete process from local setup to production deployment on Render.

You will configure:

1. MongoDB Atlas
2. Brevo sender and API key
3. Render web service
4. Environment variables
5. Post-deploy verification

## Prerequisites

- Node.js 18+ (recommended)
- npm
- GitHub repository for this project
- MongoDB Atlas account
- Brevo account (for forgot-password OTP emails)
- Render account

## Local Setup (Before Deployment)

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root.

3. Add values similar to this:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/placement_system
JWT_SECRET=replace-with-a-long-random-secret
PORT=5000

# Admin bootstrap (strongly recommended to set explicitly)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=replace-with-strong-password
ADMIN_RESET_KEY=replace-with-admin-reset-key

# Brevo (required for student/company OTP reset)
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=your-verified-sender@example.com
BREVO_SENDER_NAME=Placement Portal

# Optional
ALLOWED_ORIGINS=http://localhost:5000
RESET_CODE_EXPIRY_MINUTES=10
RESET_CODE_SECRET=replace-with-random-secret
```

4. Start server:

```bash
npm start
```

5. Open local app:

- `http://localhost:5000/`

## Environment Variables Reference

Required in production:

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret used to sign JWTs
- `ADMIN_USERNAME`: Initial admin username
- `ADMIN_PASSWORD`: Initial admin password
- `ADMIN_RESET_KEY`: Required for admin forgot-password reset route
- `BREVO_API_KEY`: Brevo API key
- `BREVO_SENDER_EMAIL`: Verified sender email in Brevo

Recommended:

- `BREVO_SENDER_NAME`: Sender display name
- `ALLOWED_ORIGINS`: Comma-separated allowed origins for CORS
  - Example: `https://your-app.onrender.com,https://your-frontend-domain.com`
- `RESET_CODE_EXPIRY_MINUTES`: OTP expiry in minutes
- `RESET_CODE_SECRET`: Dedicated secret for OTP hashing
- `NODE_ENV`: `production`
- `PORT`: Set by Render automatically, but can be defined

## Complete Deployment Process (Render)

### 1. Push Code To GitHub

Make sure your latest code is committed and pushed to a GitHub repository.

Do not commit a real `.env` file.

### 2. Set Up MongoDB Atlas

1. Create a project and cluster in MongoDB Atlas.
2. Create a database user with password.
3. In Network Access, allow Render to connect:
   - Quick setup: allow `0.0.0.0/0`
   - Better: restrict to trusted IP ranges when possible.
4. Get connection string and replace placeholders:

```text
mongodb+srv://<dbUser>:<dbPassword>@<cluster-host>/placement_system?retryWrites=true&w=majority
```

Use this as `MONGODB_URI` in Render.

### 3. Set Up Brevo

1. Create or sign in to Brevo.
2. Verify sender email/domain.
3. Create an API key.
4. Keep these values ready:
   - `BREVO_API_KEY`
   - `BREVO_SENDER_EMAIL`
   - Optional: `BREVO_SENDER_NAME`

### 4. Create Render Web Service

You already have `render.yaml` in the repository. You can deploy in two ways.

Option A (recommended): Blueprint deploy using `render.yaml`

1. In Render dashboard, choose New + and select Blueprint.
2. Connect your GitHub repo.
3. Render reads `render.yaml` and creates service.

Option B: Manual web service deploy

1. New + -> Web Service
2. Connect repository
3. Use settings:
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`

### 5. Add Environment Variables In Render

In the Render service, open Environment and add:

- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_RESET_KEY`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME` (optional)
- `ALLOWED_ORIGINS` (include your Render URL)
- `RESET_CODE_EXPIRY_MINUTES` (optional)
- `RESET_CODE_SECRET` (recommended)
- `NODE_ENV=production`

Important:

- If `ALLOWED_ORIGINS` is used, include your deployed URL exactly.
- Multiple origins must be comma-separated with no trailing comma.

### 6. Deploy

1. Trigger deploy (or auto-deploy from main branch).
2. Wait until status becomes Live.
3. Open service URL, for example:
   - `https://your-service-name.onrender.com/`

### 7. Verify Production

Check these pages:

- `/` (landing page)
- `/student-login.html`
- `/company-signup.html`
- `/admin-login.html`

Check API behavior:

1. Signup/login should return JWT token.
2. Protected routes should require `Authorization: Bearer <token>`.
3. Forgot-password OTP should send email for Student/Company.

Check Render logs for:

- `MongoDB connected`
- `Server running on port ...`

## Troubleshooting

`JWT secret missing in .env`

- Add `JWT_SECRET` in Render environment settings.

`Could not send reset email` / Brevo send failed

- Verify `BREVO_API_KEY` and `BREVO_SENDER_EMAIL`.
- Ensure sender email/domain is verified in Brevo.

MongoDB connection errors

- Recheck `MONGODB_URI` format and credentials.
- Ensure Atlas network access allows Render.

CORS issues in browser

- Set `ALLOWED_ORIGINS` correctly.
- Include exact protocol and domain, comma-separated for multiple origins.

Admin login/reset issues

- Ensure `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_RESET_KEY` are set.
- This project seeds admin automatically when DB connects and admin is missing.

## Security Checklist For Submission

- Do not upload real `.env`.
- Do not hardcode API keys in code or README.
- Rotate any key if it was ever exposed.
- Use strong values for `JWT_SECRET`, `ADMIN_PASSWORD`, `ADMIN_RESET_KEY`, `RESET_CODE_SECRET`.

## Useful Commands

Install dependencies:

```bash
npm install
```

Run production server locally:

```bash
npm start
```

Run dev script:

```bash
npm run dev
```

## Core Routes Overview

Auth:

- `POST /api/auth/signup/student`
- `POST /api/auth/signup/company`
- `POST /api/auth/login/student`
- `POST /api/auth/login/company`
- `POST /api/auth/login/admin`
- `POST /api/auth/forgot-password/student/send-otp`
- `POST /api/auth/forgot-password/student/verify-otp`
- `POST /api/auth/forgot-password/company/send-otp`
- `POST /api/auth/forgot-password/company/verify-otp`
- `POST /api/auth/forgot-password/admin`

Protected modules:

- `/api/student/*`
- `/api/company/*`
- `/api/admin/*`

## License

ISC
