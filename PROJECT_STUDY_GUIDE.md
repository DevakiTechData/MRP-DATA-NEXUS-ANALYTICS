# DataNexus Dashboard – Study & Presentation Guide

Prepared for: **Shiva**  
Date: November 24, 2025

This guide converts the entire project into quick-reference notes, visual mental models, and question banks so you can confidently explain the system to a professor, interviewer, or stakeholder.

---

## 1. Project Structure – Text “Architecture Diagram”

```
root/
├── datanexus-dashboard/ (frontend)        <-- React 19 + Vite app
│   ├── src/
│   │   ├── pages/                         <-- Home, Dashboards, Portals, Admin, Gallery, Contact
│   │   ├── components/                    <-- KPICard, ChartCard, HeroSlider, ChatBot, etc.
│   │   ├── services/                      <-- API helper modules (adminApi, alumniApi, employerFeedbackApi, requestsApi)
│   │   ├── utils/                         <-- metrics.js, predictions helpers, constants
│   │   └── context/                       <-- AuthContext for JWT login + role gating
│   ├── public/                            <-- Static assets (images, data CSV copies for dashboards)
│   └── ...                                <-- package.json, vite.config.js, tailwind config
├── server/ (backend)                      <-- Express API with CSV persistence
│   ├── index.js                           <-- All REST routes + middleware
│   ├── data/                              <-- “Star schema” CSV tables (dim + fact + submissions)
│   └── package.json
├── *.md docs                              <-- README, CODESPACES_SETUP, DASHBOARD_DOCUMENTATION, TECHNOLOGY_DOCUMENTATION, PROJECT_FUNCTIONAL_DOCUMENTATION
└── .devcontainer/                         <-- Codespaces automation (Node 20 + port forwarding)
```

**Mental picture:** Frontend (React) ↔ REST API (Express) ↔ CSV data lake (dim/fact tables). Role-based AuthContext controls React routes; Express `authorizeRole()` protects server endpoints.

---

## 2. How files connect (verbal visual)

1. **React pages** import **services/\*.js** modules → each service calls Express endpoints (URLs from `.env`).
2. **Express** routes read/write CSV via helper functions in `server/index.js`.
3. **Dashboards** load CSV copies from `/public/data` via `src/data/loadData.js`, then run calculations from `src/utils/metrics.js`.
4. **Portals** (alumni/employer) submit forms to `/api/alumni/...` or `/api/employer/...` endpoints. Submissions land in CSV, then show up in Admin Console and dashboards.
5. **ChatBot** uses the same service helpers to answer role-based questions.

Pipeline view:
```
User Action (React) --> services/*.js --> fetch() --> Express route --> CSV storage
                                                  --> (admin table) --> React dashboards & portals
```

---

## 3. Coding standards “visual”

```
├─ React
│  ├─ Functional components + hooks
│  ├─ Tailwind utility classes
│  ├─ ChartCard/KPICard wrappers ensure consistent padding, gradients
│  └─ AuthContext ensures single source of truth for JWT+role
├─ CSS/Design
│  ├─ Blue gradients, rounded cards, whitespace
│  └─ Value labels shown directly on charts for accessibility
├─ Express
│  ├─ Every route uses try/catch + descriptive HTTP status codes
│  ├─ `authenticateToken` + `authorizeRole` wrappers
│  └─ CSV helper functions for deterministic IO
└─ Data
   ├─ Star schema naming (`Dim_*`, `fact_*`)
   └─ Predictive helpers isolated in `src/utils/*Predictions.js`
```

Think of it as a “triangle” of **Consistency (components)**, **Security (JWT + role)**, and **Explainability (hover calculation boxes)**.

---

## 4. Visual memory cues for project flow

1. **Login → Role → Dynamic Navbar**
2. **Dashboards**  
   - Filters → KPIs → Charts → Predictions → Analysis Summary  
   - Alumni: People-focused (programs, cohorts)  
   - Employer: Partnership-focused (hiring funnel, industry mix)
3. **Portals**  
   - Alumni tabs: Profile, Events, Engagements, Success Story, Network, My Requests  
   - Employer tabs: Company, Alumni, Events, Feedback, Requests  
   - Both portals feed Admin Console submissions.
4. **Admin Console**  
   - Tabs: Data Tables, Alumni Submissions, Employer Submissions, Connect Requests, Image Library  
   - Approvals drive what surfaces publicly (Gallery, dashboards, portals).

Mnemonic: **“D-P-A Loop”** → Dashboards inspire action → Portals collect submissions → Admin approves → Dashboards update.

---

## 5. Expected professor questions (defense-style)

| Topic | Likely Questions |
|-------|-----------------|
| Architecture | “Why React + Express?” “How does the data flow from frontend to backend?” “What is the star schema?” |
| Authentication | “How do you enforce roles?” “Where are JWTs stored?” “How do you handle token expiry?” |
| Dashboards | “Explain how Total Alumni is calculated.” “What predictive method do you use?” “How do you display calculation details?” |
| Portals | “What happens after an alumni submits a success story?” “How do employers submit technical feedback securely?” |
| Admin Console | “How can an admin approve or reject submissions?” “What happens to the data once approved?” |
| Data | “Why use CSV instead of a database?” “How would you migrate to Postgres?” |
| DevOps | “How do you run this in Codespaces?” “What ports need to be public?” |
| Security | “How do you protect file uploads?” “What about CORS in Codespaces?” |
| Accessibility/UX | “How do you ensure the dashboards are understandable for SLU admins?” |
| Predictive Insights | “Are the forecasts ML-based? What’s the roadmap for AI/ML?” |

**Tip:** Tie answers back to docs (README, DASHBOARD_DOCUMENTATION, TECHNOLOGY_DOCUMENTATION).

---

## 6. Potential industry interview questions

1. **Architecture & Design**
   - “Explain the end-to-end flow when an employer submits technical feedback.”
   - “If you had to containerize this stack, how would you split services?”
2. **Data Modeling**
   - “Why is a fact/dimension approach useful here?”
   - “How would you handle concurrency if multiple admins edit the same CSV?”
3. **Security**
   - “Describe how you sanitized image uploads.”
   - “What vulnerabilities remain when using CSV for persistence?”
4. **Frontend Engineering**
   - “How do you avoid prop drilling for auth state?”
   - “Why use Recharts over other libraries?”
5. **Performance**
   - “What optimizations keep dashboards responsive?” (answer: `useMemo`, data pre-processing, client-side filtering)
6. **Predictive Features**
   - “How would you replace heuristic forecasts with ML models?”
7. **Teamwork**
   - “How would you onboard a new developer using your documentation set?”
8. **Deployment**
   - “Describe the steps to get this running in GitHub Codespaces.”
9. **Testing**
   - “What’s your manual QA checklist? How would you automate it?”
10. **Future Improvements**
    - “What’s next on the roadmap for AI integration?” (reference README §11)

---

## 7. Suggested study & memory aids

- **Create a one-liner per page:**  
  - Alumni Portal → “Empower graduates: apply, engage, share, track.”  
  - Employer Portal → “Manage partnership + feedback loop.”  
  - Dashboards → “Six KPIs + six visuals + predictions + summary.”
- **Associate colors with personas:**  
  - Dark Blue = Admin dashboards  
  - Light Blue/White = Alumni/Employer portals  
  - Gradient backgrounds = sections needing attention
- **Run through the workflows** before presenting:  
  1. Login as Admin → view dashboards → open Admin Console → approve a submission  
  2. Login as Alumni → submit event + success story → verify in My Requests  
  3. Login as Employer → submit technical feedback + new event participation → verify statuses
- **Keep docs handy:**  
  - Architecture? → `TECHNOLOGY_DOCUMENTATION.md`  
  - Dashboards deep dive? → `DASHBOARD_DOCUMENTATION.md`  
  - Full walkthrough? → `PROJECT_FUNCTIONAL_DOCUMENTATION.md`

---

Use this guide as your “cheat sheet” so no question catches you off guard. Practice explaining each section aloud and walking through the UI; that combination locks in both theory and execution. Good luck! ✨

