# DataNexus Dashboard – Technology Overview

**Version:** 1.0  
**Last Updated:** November 2025  
**Audience:** Engineering leads, DevOps, security reviewers

---

## 1. Architecture at a Glance

| Layer | Key Technologies | Notes |
|-------|------------------|-------|
| **Frontend** | React 19, Vite 7, React Router 7, TailwindCSS 3, Recharts/Plotly, react-simple-maps | SPA served from Vite dev server or static hosting. Uses context-based auth + role-aware routing. |
| **Backend API** | Node 20, Express 4, PapaParse, Multer, jsonwebtoken | CSV-backed REST API. Designed for easy migration to relational DB later. |
| **Data Layer** | CSV files under `server/data/` (dim/fact tables) | Acts as star schema (dim_students, dim_employers, fact_alumni_engagement, etc.). PapaParse handles read/write. |
| **Auth & Security** | JWT (HS256), role guards, CORS middleware, multer filename sanitization | Token stored client-side; refresh handled manually. |
| **Dev Experience** | GitHub Codespaces, devcontainers, ESLint 9, npm scripts, hero slider component | `.devcontainer` ensures Node 20 + port forwarding. |

---

## 2. Frontend Stack Details

- **Entry Point:** `src/main.jsx` bootstraps `App.jsx` within `<AuthProvider>`.
- **Routing:** `react-router-dom` nested routes; `ProtectedRoute` checks `user.role`.
- **State Management:** Context (`AuthContext`) + local component state. No Redux.
- **Styling:** Tailwind config tuned for SLU palette; gradients for dashboards and portals.
- **Charts & Maps:**  
  - `Recharts`: KPI trend lines, bar charts, composed charts.  
  - `react-simple-maps` + `d3-geo`: US map in Alumni dashboard.  
  - `Plotly.js` reserved for future 3D visuals (currently not active).
- **Shared Components:** `KPICard`, `ChartCard`, `HeroSlider`, `PageHero`, `InsightCard`, `GalleryHoverTooltip`, `ChatBot`.
- **Form Handling:** Native React forms; API helpers in `/services/*`.
- **Build Output:** `npm run build` → `dist/` for static hosting. Vite `base` auto-configures for GitHub Pages.

---

## 3. Backend Stack Details

### 3.1 Express Server (`server/index.js`)

- **Core Middleware:**  
  - JSON body parser  
  - Custom CORS handler (allows Codespaces origins; handles preflight)  
  - `multer` for image uploads (stored under `public/assets/`)  
  - JWT auth middleware (`authenticateToken`, `authorizeRole`)

- **Routing Groups:**  
  - `/api/auth` – Login, token issuance  
  - `/api/alumni/*` – Event applications, engagements, success stories, profile CRUD, network data  
  - `/api/employer/*` – Profile, events, technical feedback, alumni employees  
  - `/api/admin/*` – CRUD over tables, submissions management, connect requests, image library  
  - `/api/connect` – Contact form submissions  
  - `/api/success-stories/approved` – Public gallery feed

- **CSV Utilities:** `loadTableData`, `writeTableData`, `ensureDataDirectory` handle file IO. PapaParse used for robust parsing/unparsing.

- **Server Startup:** `npm run dev` uses nodemon; binds to `0.0.0.0:5002` for Codespaces support.

### 3.2 Data Files (Key)

| File | Description |
|------|-------------|
| `Dim_Students.csv` | Alumni master data (program, graduation_year, gender, visa_status, location) |
| `dim_employers.csv` | Employer records (industry, size, rating, SLU relationship fields) |
| `dim_event.csv` | Event metadata used by portals/dashboards |
| `fact_alumni_engagement.csv` | Core engagement fact table (type, minutes, flags) |
| `alumni_employment.csv` | Employment status per alumni (verified/pending, start_date, location) |
| `employer_alumni_feedback.csv` | Technical feedback (ratings, comments, technologies) |
| `event_applications.csv`, `success_stories.csv`, `engagement_feedback.csv` | Portal submission stores |
| `connect_requests.csv` | “Connect with SLU” form submissions |

> CSV headers auto-created if missing; server ensures files exist during boot.

---

## 4. Data Flows

1. **Portal Submission → CSV → Admin Console**  
   Alumni/employer forms POST to REST endpoints; server appends to CSV; Admin Console reads via `/api/admin/*` endpoints for review/approval.

2. **Dashboards (Client-Side)**  
   `loadData.js` fetches CSVs from `/public/data/...`, transforms to JS objects, caches in memory. `metrics.js` provides pure functions consumed by dashboards and chatbot analytics.

3. **Image Library**  
   Admin uploads images by category → stored under `public/assets/{events|engagement|alumni|employers|success-stories}`. Metadata stored via `images.json`.

4. **ChatBot**  
   Uses role-aware capabilities; fetches metrics via APIs or computed data; intent detection governed by custom heuristics (TODO: ML upgrade per roadmap).

---

## 5. Security & Compliance

- **JWT Security:**  
  - Secret from `process.env.JWT_SECRET` (fallback dev default)  
  - Token payload includes `role`, `student_key`/`employer_key`, `email` for filtering submissions  
  - Tokens expire based on `JWT_EXPIRY`

- **Authorization Controls:**  
  - Admin routes require `role = admin`  
  - Alumni/employer-specific routes verify `student_key` or `employer_key`

- **Data Privacy:**  
  - Phone numbers, GPA hidden in gallery tooltips  
  - Success stories require admin approval before public display  
  - Contact/portal submissions stored with timestamp for auditing

- **CORS:**  
  - Dynamic origin detection for Codespaces  
  - `Access-Control-Allow-Credentials: true` to support authenticated fetches

- **File Upload Safety:**  
  - Multer renames/sanitizes filenames  
  - Only whitelisted directories accessible

---

## 6. Deployment & Environments

| Environment | Scripts | Notes |
|-------------|---------|-------|
| **Local** | `npm install --legacy-peer-deps && npm run dev` (frontend), `cd server && npm run dev` | Proxy disabled when `VITE_API_BASE_URL` set. |
| **Codespaces** | Devcontainer auto-installs deps; `.env` requires API URL w/out trailing slash | Ports 5002/5173 must be Public. |
| **Static Hosting + API** | `npm run build` → deploy `dist/`. Backend can run on Render/Railway/etc. | `VITE_API_BASE_URL` must point to hosted API. |

**CI/CD:** GitHub Actions workflow (`.github/workflows/deploy.yml`) builds frontend for GitHub Pages. Environment variables injected via secrets.

---

## 7. Testing & Quality

- **Linting:** `npm run lint` (ESLint 9, React plugin, JS config).  
- **Manual Smoke Tests:**  
  - Dashboard metrics render with mock CSV data.  
  - Portals submit and appear in Admin Console.  
  - Image uploads validated.  
  - CORS verified via Codespaces curl commands.  
- **Known Gaps:** No automated unit/integration tests yet; to be addressed in future sprints.

---

## 8. Tech Debt & Future Enhancements

| Area | Current Limitation | Future Work |
|------|--------------------|-------------|
| Data Storage | CSV not ideal for concurrency/audit | Migrate to Postgres with Prisma or Supabase |
| ChatBot Intelligence | Heuristic intent detection | Introduce LLM-based intent + vector store |
| Predictive Analytics | Client-side heuristics | Move to server-side ML microservice (Python/FastAPI) |
| Testing | Minimal automated coverage | Add Jest/Testing Library + supertest for API |
| Secrets Management | `.env` files/manual setup | Use GitHub Secrets / environment-specific config service |

---

**Document Owner:** Platform Engineering  
**Related Docs:** `README.md`, `PROJECT_FUNCTIONAL_DOCUMENTATION.md`, `CODESPACES_SETUP.md`, `DASHBOARD_DOCUMENTATION.md`

