# Fresh 'n' Fast - Enterprise ERP

A premium full-stack ERP system built with modern technologies.

## Tech Stack
- **Frontend:** React JS, TypeScript, Vite, Zustand, Axios, Lucide Icons, Vanilla CSS (Premium Design).
- **Backend:** Node.js, Express, TypeScript, MySQL.
- **Database:** MySQL (XAMPP).

## Multi-Stage Workflow
The system is divided into three key stages, each with its own configuration:
1. **Development (`npm run dev`)**:
   - Environment: `.env.development`
   - DB: `fresh_n_fast_dev`
   - Features: Detailed error logging, CORS open to localhost.
2. **Staging (`npm run dev:staging` / `npm run build:staging`)**:
   - Environment: `.env.staging`
   - DB: `fresh_n_fast_staging`
   - Purpose: Pre-production testing on a staging server.
3. **Production (`npm run dev:prod` / `npm run build:prod`)**:
   - Environment: `.env.production`
   - DB: `fresh_n_fast_prod`
   - Features: Secure CORS, combined logging, minified bundles.

## Getting Started

### 1. Database Setup
1. Open XAMPP Control Panel and start **Apache** and **MySQL**.
2. Go to [http://localhost/phpmyadmin](http://localhost/phpmyadmin).
3. Create a new database named `fresh_n_fast_db`.
4. Import the `backend/schema.sql` file or copy-paste its contents into the SQL tab.

### 2. Backend Setup
1. Open your terminal in the `backend` folder.
2. Run `npm install`.
3. Run `npm run dev` (Ensure you have `ts-node-dev` installed, or use `npm start` after building).
   *Note: I have pre-configured the `.env` file for you.*

### 3. Frontend Setup
1. Open your terminal in the `frontend` folder.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the displayed URL (usually [http://localhost:5173](http://localhost:5173)).

## Security Features
- **JWT (JSON Web Tokens):** Secure session management with short-lived access tokens.
- **Bcrypt Password Hashing:** All passwords stored in the database are salted and hashed.
- **Auth Middleware:** Protected API routes using a custom `authMiddleware`.
- **Axios Interceptors:** Automatic token attachment to every request and auto-logout on token expiration.
- **Helmet**: Security headers on the backend to prevent common web vulnerabilities.
- **CORS**: Configured for secure cross-origin resource sharing.

---
Created with ❤️ by Antigravity
