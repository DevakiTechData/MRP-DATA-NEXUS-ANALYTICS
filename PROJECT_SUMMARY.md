# DataNexus Dashboard - Project Summary

## ✅ Completed Features

### Project Setup
- ✅ Vite + React 18 project initialized
- ✅ TailwindCSS v3 configured with SLU brand colors
- ✅ All dependencies installed (PapaParse, Recharts, React Router, etc.)
- ✅ CSV files copied to public directory

### Data Loading
- ✅ PapaParse integration for CSV parsing
- ✅ All 6 CSV files loaded on app initialization:
  - dim_contact.csv
  - dim_date.csv
  - dim_employers.csv
  - dim_event.csv
  - Dim_Students.csv
  - fact_alumni_engagement.csv

### Components Created
- ✅ **Navbar**: Navigation with SLU branding
- ✅ **KPICard**: Reusable KPI display component with delta indicators
- ✅ **ChartCard**: Wrapper component for charts with consistent styling
- ✅ **FiltersPanel**: Date filtering (Year and Month)

### Alumni Dashboard 🎓
- ✅ **KPIs**:
  - Total Alumni (distinct student count)
  - % Engaged Alumni
  - Avg Feedback Score (using donations_amount as proxy)
  - Avg Engagement Minutes (from mentorship_hours)

- ✅ **Visualizations**:
  - Bar Chart: Engagement by Event Type
  - Line Chart: Engagement Trend over time
  - Pie Chart: Gender Split
  - Bar Chart: Engaged Alumni by Degree Level
  - Bar Chart: Top 10 Programs by Engagement (horizontal)
  - Area Chart: Feedback Score over Time
  - Donut Chart: Visa Status (F1, OPT, Citizen, etc.)
  - Table: Event Feedback Leaderboard

### Employer Dashboard 💼
- ✅ **KPIs**:
  - Active Employers (distinct employer count)
  - Total Hires
  - Avg Salary (placeholder - not in CSV data)
  - Top Industry by Hires

- ✅ **Visualizations**:
  - Bar Chart: Hires by Industry
  - Bar Chart: Hires by Employer (horizontal)
  - Line Chart: Hiring Trend by Year
  - Bar Chart: Hires by Degree Level
  - Pie Chart: Employment Type
  - Table: Top 10 Employers
  - Table: Employer Locations
  - Donut Chart: Visa Type of Hires
  - Composed Chart: Hiring vs Engagement Trend

### UI/UX
- ✅ Responsive grid layout
- ✅ SLU brand colors (Blue: #002F6C, Gold: #FDB515)
- ✅ Gold highlight bars on cards
- ✅ Navigation between dashboards
- ✅ Loading states
- ✅ Error handling

### Routing
- ✅ React Router setup
- ✅ Routes: `/alumni`, `/employer`
- ✅ Default redirect to `/alumni`

## 📁 Project Structure

```
datanexus-dashboard/
├── public/
│   ├── dim_contact.csv
│   ├── dim_date.csv
│   ├── dim_employers.csv
│   ├── dim_event.csv
│   ├── Dim_Students.csv
│   └── fact_alumni_engagement.csv
├── src/
│   ├── components/
│   │   ├── ChartCard.jsx
│   │   ├── FiltersPanel.jsx
│   │   ├── KPICard.jsx
│   │   └── Navbar.jsx
│   ├── data/
│   │   └── loadData.js
│   ├── pages/
│   │   ├── AlumniDashboard.jsx
│   │   └── EmployerDashboard.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md
```

## 🚀 How to Run

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```

## 📊 Data Processing Notes

- Data is loaded asynchronously on component mount
- All date filtering uses string conversion for consistency
- Feedback score uses `donations_amount` field (as `feedback_score` doesn't exist in CSV)
- Engagement minutes calculated from `mentorship_hours * 60`
- Hired flag checked as string '1' or number 1 for compatibility

## 🎨 Styling

- TailwindCSS with custom SLU colors
- Responsive design (mobile, tablet, desktop)
- Consistent card-based layout
- SLU blue header with gold accent bars

## 🔄 Future Enhancements (Optional)

- [ ] Export to CSV/PDF functionality
- [ ] Search/filter by college or program
- [ ] Interactive map visualization
- [ ] Additional date range filters
- [ ] Data refresh functionality
- [ ] Real-time data updates
- [ ] User authentication
- [ ] Dashboard customization

## 📝 Notes

- The application successfully builds and runs
- All CSV files are loaded from the public directory
- Charts are interactive and responsive
- Filtering works for both Year and Month
- Data processing handles edge cases and missing values

## Submission Package (Copy to PDF)

### 1) Prototype Links
- **Frontend (React)**: https://<your-forwarded-frontend-url>.app.github.dev
- **Backend (API)**: https://<your-forwarded-backend-url>.app.github.dev
- **Test Credentials**: 
  - Admin: `admin` / `admin123`
  - Alumni: `alumni` / `alumni123`
  - Employer: `employer` / `employer123`

---

### 2) Screen-by-Screen User Interaction & Solution Support

#### **Screen 1: Landing Page (`/`)**
**User Interaction:**
- User arrives at the landing page and sees a hero carousel showcasing DataNexus mission and key visuals.
- Navigation bar displays role-appropriate links (Dashboards, Community, Insights, Connect, Admin).
- User clicks CTAs (Call-to-Action buttons) to navigate to dashboards, gallery, or events.
- Scroll reveals mission statement, quick stats, and feature highlights.

**How It Supports the Solution:**
- **Entry Point**: Provides a unified gateway for all user roles, establishing DataNexus as the central analytics hub.
- **Role-Based Navigation**: Automatically adapts menu items based on authentication, ensuring users only see relevant features.
- **Brand Consistency**: Reinforces SLU branding (blue/gold) and positions DataNexus as a professional analytics platform.
- **Quick Access**: CTAs reduce navigation friction, enabling users to jump directly to their primary workflows.

**Architecture Section**: `1.1 High-Level Stack` (Frontend Layer), `2.1 Entry & Shared UI`

---

#### **Screen 2: Alumni Dashboard (`/dashboards/alumni`)**
**User Interaction:**
- User views KPI ribbon at top: Total Alumni, % Engaged, Avg Satisfaction, Mentorship Impact.
- User hovers over charts (Engagement Funnel, Cohort Retention, Program Performance) to see tooltips with exact values.
- User reads "What it means" analysis blocks below each visual to understand insights.
- User filters by Year/Month using FiltersPanel to drill into specific time periods.
- User clicks on program names in leaderboards to focus on specific programs.

**How It Supports the Solution:**
- **Descriptive Analytics**: Answers "What happened?" by showing engagement metrics, retention rates, and program performance.
- **Diagnostic Insights**: Analysis blocks explain "Why" trends occurred (e.g., "Program X shows 12% growth due to increased mentorship participation").
- **Actionable Intelligence**: Highlights top-performing programs and identifies areas needing attention, enabling data-driven decision-making.
- **Accessibility**: Narrative summaries make complex analytics understandable to non-technical stakeholders.

**Architecture Section**: `2.2 Dashboards`, `3.2 Alumni Dashboard Metrics`, `3.5 Visualizations & Libraries`

---

#### **Screen 3: Employer Dashboard (`/dashboards/employers`)**
**User Interaction:**
- User scans KPI cards: Active Employers, Total Hires, Offer Rate, Pipeline Health.
- User hovers over Pipeline Conversion Waterfall to see stage-by-stage conversion percentages.
- User examines Employer Health Scorecard (bubble chart) to identify high-value partners.
- User reviews Diversity Hiring Mix charts (gender, visa, employment type) to assess inclusion metrics.
- User reads "Data Scientist Predictions" panel for forward-looking recommendations.
- User clicks on employer names in tables to view detailed engagement history.

**How It Supports the Solution:**
- **Pipeline Visibility**: Funnel visualization reveals bottlenecks in the hiring process, enabling targeted interventions.
- **Partnership Management**: Health scorecard helps prioritize relationship-building efforts with high-potential employers.
- **Diversity Tracking**: Mix charts support DEI goals by highlighting representation gaps and successes.
- **Predictive Guidance**: Predictions panel surfaces proactive recommendations (e.g., "Focus retention efforts on Employer X due to declining touchpoints").

**Architecture Section**: `2.2 Dashboards`, `3.3 Employer Dashboard Metrics`, `3.4 Predictive Outlook Models`

---

#### **Screen 4: Predictive Outlook – Alumni (`/predictions/alumni`, Admin Only)**
**User Interaction:**
- Admin navigates to "Insights → Predictive Outlook" (visible only to admin role).
- Admin selects "Alumni" tab to view engagement score projections, cohort retention outlook, and program momentum forecasts.
- Admin hovers over forecast lines to see projected values for future months.
- Admin reads narrative analysis explaining confidence levels and recommended actions.
- Admin uses insights to plan resource allocation and program investments.

**How It Supports the Solution:**
- **Predictive Analytics**: Answers "What's next?" by forecasting engagement trends, retention rates, and program growth.
- **Strategic Planning**: Enables administrators to allocate resources proactively (e.g., invest in high-momentum programs).
- **Risk Mitigation**: Identifies programs at risk of declining engagement, allowing early intervention.
- **Confidence Communication**: Narrative blocks explain forecast uncertainty, ensuring informed decision-making.

**Architecture Section**: `2.3 Predictions Hub`, `3.4 Predictive Outlook Models`, `3.6 Machine Learning & Python Tooling`

---

#### **Screen 5: Predictive Outlook – Employers (`/predictions/employers`, Admin Only)**
**User Interaction:**
- Admin selects "Employers" tab to view quarterly hiring projections, growth potential matrix, and risk watchlists.
- Admin examines growth potential tiers (Low/Medium/High) to prioritize partnership development.
- Admin reviews risk watchlist for employers showing declining engagement or shrinking requisitions.
- Admin reads recommended actions (e.g., "Schedule check-in with Employer Y to address churn risk").
- Admin uses projections to forecast hiring needs and plan recruitment events.

**How It Supports the Solution:**
- **Hiring Forecasts**: Predicts future hiring volumes by employer, enabling capacity planning and resource allocation.
- **Partnership Strategy**: Growth potential matrix guides relationship management efforts toward high-value opportunities.
- **Early Warning System**: Risk watchlist flags at-risk partnerships before they churn, enabling proactive intervention.
- **Prescriptive Guidance**: Recommended actions translate predictions into concrete next steps.

**Architecture Section**: `2.3 Predictions Hub`, `3.4 Predictive Outlook Models`, `3.6 Machine Learning & Python Tooling`

---

#### **Screen 6: Admin Console (`/admin`, Admin Only)**
**User Interaction:**
- Admin accesses admin-only route (protected by JWT authorization).
- Admin views data tables (Students, Employers, Contacts, Events, Dates, Alumni Engagement) with CRUD operations.
- Admin clicks "Edit" on a row to modify data (e.g., update student program, add employer contact).
- Admin clicks "Add New" to insert rows, with validation for primary keys and required fields.
- Admin uploads images via Image Library, selecting category (alumni/employers/hero/uploads).
- Admin views system overview showing dataset freshness, row counts, and quick links.

**How It Supports the Solution:**
- **Data Management**: Enables administrators to maintain data quality without database access, using CSV persistence.
- **Operational Flexibility**: CRUD interface allows real-time updates to student records, employer profiles, and event data.
- **Asset Management**: Image Library centralizes visual content, ensuring consistent branding across dashboards and gallery.
- **System Health**: Overview provides visibility into data freshness and completeness, supporting data governance.

**Architecture Section**: `2.5 Admin Console`, `1.4 Data Refresh & Storage`, `1.3 Authentication & Authorization`

---

#### **Screen 7: Gallery (`/gallery`)**
**User Interaction:**
- User views hero carousel at top showcasing featured alumni and employer imagery.
- User scrolls to filterable grid displaying alumni photos, employer logos, and event spotlights.
- User filters by program, year, or category using dropdown filters.
- User clicks on images to view full-size versions (if modal enabled).
- User browses curated content to see community engagement and success stories.

**How It Supports the Solution:**
- **Community Building**: Showcases alumni success stories and employer partnerships, fostering engagement and pride.
- **Visual Storytelling**: Images humanize data, making analytics more relatable and memorable.
- **Brand Reinforcement**: Curated imagery reinforces SLU brand identity and program quality.
- **Engagement Driver**: Visual content encourages users to explore dashboards and participate in events.

**Architecture Section**: `2.4 Community & Support Pages`, `1.4 Data Refresh & Storage` (Image Library)

---

#### **Screen 8: Events & Contact (`/events`, `/contact`)**
**User Interaction:**
- User navigates to Events page to view upcoming programming with filters (audience type, event category, date range).
- User clicks "Learn More" or "RSVP" buttons to access event details or submit inquiries.
- User navigates to Contact page and fills inquiry form (name, email, event interest, message).
- User submits form and receives confirmation message.
- Admin views submitted inquiries in `event_inquiries.csv` via Admin Console.

**How It Supports the Solution:**
- **Event Discovery**: Filters help users find relevant programming (alumni networking, employer info sessions, mentorship events).
- **Lead Capture**: Inquiry form captures interest and enables follow-up communication.
- **Data Collection**: CSV-backed inquiry log provides audit trail and supports relationship management.
- **Engagement Funnel**: Events page drives attendance, which feeds into engagement metrics tracked in dashboards.

**Architecture Section**: `2.4 Community & Support Pages`, `1.4 Data Refresh & Storage` (CSV persistence)

---

#### **Screen 9: DataNexus Assistant (Chatbot)**
**User Interaction:**
- User clicks floating assistant button (visible on authenticated pages).
- User types questions like "What does engagement score mean?" or "How is retention calculated?"
- Assistant responds with curated answers from knowledge base (no backend call required).
- User asks follow-up questions to deepen understanding of analytics.
- Assistant provides explanations of metrics, calculations, and recommended actions.

**How It Supports the Solution:**
- **Self-Service Analytics**: Enables users to understand metrics without consulting data analysts.
- **Knowledge Democratization**: Makes complex analytics accessible to non-technical stakeholders.
- **Reduced Support Burden**: Answers common questions instantly, freeing up staff time.
- **Future-Ready**: Architecture supports RAG pipeline integration for dynamic querying of CSV data.

**Architecture Section**: `2.6 DataNexus Assistant (Chatbot)`, `1.1 High-Level Stack` (Assistant Layer)

---

### 3) Data Mapping & Architecture Section References

#### **Comprehensive Data Mapping Table**

| Screen | Primary Data Sources | Key Data Fields/Columns | Data Flow | Architecture Section | Solution Component |
|--------|---------------------|------------------------|-----------|---------------------|-------------------|
| **Landing Page (`/`)** | `public/assets/hero/*.jpg`, `public/assets/alumni/*.jpg`, static HTML/text | Image files, hero carousel data, mission text | Static assets loaded from `public/` directory | `1.1 High-Level Stack` (Frontend Layer), `2.1 Entry & Shared UI` | **UI Layer** - Branding & Navigation |
| **Alumni Dashboard (`/dashboards/alumni`)** | `Dim_Students.csv`<br>`fact_alumni_engagement.csv`<br>`dim_event.csv`<br>`dim_date.csv` | **Dim_Students**: `student_key`, `program`, `degree_level`, `cohort_year`, `gender`, `visa_status`<br>**fact_alumni_engagement**: `student_key`, `event_key`, `date_key`, `engagement_score`, `mentorship_hours`, `applications_submitted`, `hired`, `donations_amount`<br>**dim_event**: `event_key`, `event_type`, `event_category`, `audience_type`<br>**dim_date**: `date_key`, `year`, `month`, `quarter` | CSV files parsed via PapaParse → joined on surrogate keys (`student_key`, `event_key`, `date_key`) → aggregated by program/cohort/event type → rendered in Recharts | `3.1 Data Sources`, `3.2 Alumni Dashboard Metrics`, `2.2 Dashboards`, `3.8 Star Schema & ERD` | **Data Layer** - Star Schema (Fact + Dimension Tables) |
| **Employer Dashboard (`/dashboards/employers`)** | `dim_employers.csv`<br>`fact_alumni_engagement.csv`<br>`dim_event.csv`<br>`dim_contact.csv` | **dim_employers**: `employer_key`, `employer_name`, `industry`, `location`, `size`, `headquarters`<br>**fact_alumni_engagement**: `employer_key`, `student_key`, `hired`, `applications_submitted`, `engagement_score`, `offer_made`<br>**dim_contact**: `contact_key`, `employer_key`, `contact_name`, `title`, `relationship_stage` | CSV files parsed → joined on `employer_key` → aggregated by industry/location/employer → pipeline stages calculated (outreach → interview → offer → hire) → rendered in charts | `3.1 Data Sources`, `3.3 Employer Dashboard Metrics`, `2.2 Dashboards`, `3.8 Star Schema & ERD` | **Data Layer** - Star Schema (Fact + Dimension Tables) |
| **Predictive Outlook – Alumni (`/predictions/alumni`)** | Derived from:<br>`fact_alumni_engagement.csv` (time-series)<br>`Dim_Students.csv` (cohort data) | **Time-Series**: `date_key`, `engagement_score` (last 6-12 months) → exponential smoothing forecast<br>**Cohort Data**: `cohort_year`, retention rates (Year+1, Year+2, Year+3) → weighted projections<br>**Program Momentum**: `program`, `engagement_score` growth rate → forecast vs current | Historical data extracted → time-series models applied (exponential smoothing, moving averages) → projections generated → confidence intervals calculated → narrative analysis generated | `3.4 Predictive Outlook Models`, `3.6 Machine Learning & Python Tooling`, `2.3 Predictions Hub` | **Modeling Layer** - Frontend JavaScript + Python Prototypes |
| **Predictive Outlook – Employers (`/predictions/employers`)** | Derived from:<br>`dim_employers.csv`<br>`fact_alumni_engagement.csv` (hiring trends) | **Hiring Trends**: `date_key`, `hired` count per employer → quarterly projections<br>**Pipeline Data**: `applications_submitted`, `offer_made`, `hired` → conversion forecasts<br>**Growth Potential**: Historic hiring velocity + pipeline volume + requisitions → Low/Medium/High tiers<br>**Risk Indicators**: `engagement_score` decline, `applications_submitted` drop → churn risk flags | Historical hiring data aggregated → trend analysis → growth potential calculated (clustering-based tiers) → risk scores computed → watchlist generated → recommended actions surfaced | `3.4 Predictive Outlook Models`, `3.6 Machine Learning & Python Tooling`, `2.3 Predictions Hub` | **Modeling Layer** - Frontend JavaScript + Python Prototypes |
| **Admin Console (`/admin`)** | All CSV tables via `/api/admin/*` endpoints:<br>`Dim_Students.csv`<br>`dim_employers.csv`<br>`dim_contact.csv`<br>`dim_event.csv`<br>`dim_date.csv`<br>`fact_alumni_engagement.csv`<br>+ `public/assets/uploads/*` (images) | **CRUD Operations**: Full table schemas with primary keys (`student_key`, `employer_key`, etc.)<br>**Image Uploads**: Filename, category (alumni/employers/hero/uploads), upload timestamp<br>**System Stats**: Row counts per table, last modified dates | JWT-authenticated API calls → PapaParse reads CSV → CRUD operations (create/read/update/delete) → PapaParse writes CSV → file system updated → frontend refreshes | `2.5 Admin Console`, `1.4 Data Refresh & Storage`, `1.3 Authentication & Authorization`, `1.5 Security & Hardening` | **Backend API** - Express.js + CSV Persistence (PapaParse) |
| **Gallery (`/gallery`)** | `public/assets/alumni/*.jpg`<br>`public/assets/employers/*.jpg`<br>`public/assets/hero/*.jpg`<br>Curated list in `Gallery.jsx` (metadata) | Image file paths, program associations, year tags, category labels | Static image files loaded from `public/assets/` → filtered by program/year/category → displayed in grid/carousel | `2.4 Community & Support Pages`, `1.4 Data Refresh & Storage` (Image Library) | **UI Layer** - Static Assets + Admin Uploads |
| **Events (`/events`)** | `dim_event.csv` | `event_key`, `event_name`, `event_type`, `event_category`, `audience_type`, `event_date`, `location`, `modality`, `description` | CSV parsed → filtered by audience type, category, date range → displayed in list with filters | `2.4 Community & Support Pages`, `3.1 Data Sources`, `3.8 Star Schema & ERD` | **Data Layer** - Dimension Table |
| **Contact (`/contact`)** | `server/data/event_inquiries.csv` (write-only via API) | Form fields: `name`, `email`, `event_interest`, `message`, `submission_date`, `status` | Form submission → POST `/api/inquiries` → PapaParse appends row to CSV → confirmation message displayed | `2.4 Community & Support Pages`, `1.4 Data Refresh & Storage` (CSV Write), `1.5 Security & Hardening` | **Backend API** - CSV Write (PapaParse) |
| **Chatbot (Assistant)** | Curated knowledge base in `AssistantChat.jsx` (static Q&A pairs) | Pre-defined Q&A pairs covering:<br>- Engagement score definitions<br>- Retention calculations<br>- Pipeline conversion explanations<br>- Employer health metrics<br>- Program momentum forecasts | User query → pattern matching against knowledge base → curated answer returned (no backend call) | `2.6 DataNexus Assistant (Chatbot)`, `1.1 High-Level Stack` (Assistant Layer) | **Assistant Layer** - Built-in Knowledge Base (RAG-ready) |
| **Login (`/login`)** | `server/data/users.json` (via `/api/auth/login`) | `username`, `password` (hashed in production), `role` (admin/alumni/employer) | Credentials submitted → POST `/api/auth/login` → JWT issued with `role` and `username` → stored in `localStorage` → redirect based on role | `1.3 Authentication & Authorization`, `2.1 Entry & Shared UI`, `1.5 Security & Hardening` | **Backend API** - JWT Authentication |

---

#### **Star Schema Data Architecture Details**

**Fact Table:**
- **`fact_alumni_engagement.csv`**: Central table containing engagement metrics
  - **Surrogate Keys**: `student_key`, `employer_key`, `event_key`, `date_key`, `contact_key`
  - **Measures**: `engagement_score`, `mentorship_hours`, `applications_submitted`, `hired` (0/1), `offer_made`, `donations_amount`
  - **Relationships**: Links to all dimension tables via surrogate keys
  - **Architecture Section**: `3.8 Star Schema & ERD`

**Dimension Tables:**
- **`Dim_Students.csv`**: Student demographics and program data
  - **Key**: `student_key` (primary key)
  - **Attributes**: `program`, `degree_level`, `cohort_year`, `gender`, `visa_status`, `college`
  - **Usage**: Joined with fact table to show engagement by program, cohort, degree level

- **`dim_employers.csv`**: Employer profiles and characteristics
  - **Key**: `employer_key` (primary key)
  - **Attributes**: `employer_name`, `industry`, `location`, `size`, `headquarters`
  - **Usage**: Joined with fact table to show hiring by industry, location, employer

- **`dim_event.csv`**: Event catalog and metadata
  - **Key**: `event_key` (primary key)
  - **Attributes**: `event_name`, `event_type`, `event_category`, `audience_type`, `event_date`, `location`, `modality`
  - **Usage**: Joined with fact table to show engagement by event type, category

- **`dim_date.csv`**: Date dimension for time-series analysis
  - **Key**: `date_key` (primary key)
  - **Attributes**: `date`, `year`, `month`, `quarter`, `academic_term`, `day_of_week`
  - **Usage**: Joined with fact table to enable time-based filtering and aggregation

- **`dim_contact.csv`**: Employer contact information
  - **Key**: `contact_key` (primary key)
  - **Attributes**: `employer_key` (foreign key), `contact_name`, `title`, `email`, `relationship_stage`
  - **Usage**: Joined with employer dimension to show contact details and relationship status

**Data Flow Architecture:**
1. **Data Loading**: CSV files in `public/` directory loaded via PapaParse on component mount
2. **Data Joining**: Frontend JavaScript joins fact table with dimension tables using surrogate keys
3. **Data Aggregation**: Metrics calculated by grouping and summing/averaging measures
4. **Data Visualization**: Aggregated data passed to Recharts components for rendering
5. **Data Updates**: Admin Console writes changes back to CSV via Express API using PapaParse

**Architecture Section References:**
- **Data Sources**: `3.1 Data Sources` (README.md)
- **Star Schema Design**: `3.8 Star Schema & ERD` (README.md)
- **Data Refresh**: `1.4 Data Refresh & Storage` (README.md)
- **ERD Diagram**: Located at `docs/erd-star-schema.drawio` (if available)

---

#### **Data Transformation & Calculation Details**

**Alumni Dashboard Calculations:**
- **Engagement Funnel**: Counts by stage (awareness → events → mentorship → hiring) with conversion percentages
- **Cohort Retention**: Aggregates retained alumni per cohort year, calculates Year+1 to Year+3 retention rates
- **Program Performance**: Weighted composite index (engagement uplift + mentor participation + hiring outcomes) normalized 0-100
- **Mentorship Impact**: Compares placement success between mentored vs non-mentored alumni
- **Architecture Section**: `3.2 Alumni Dashboard Metrics`

**Employer Dashboard Calculations:**
- **Pipeline Conversion**: Stage outputs from outreach → talent pipeline → interview → offer, with cumulative conversion line
- **Employer Health Scorecard**: Weighted blend of hires, satisfaction, engagement touches, and future requisitions
- **Diversity Mix**: Gender, visa, and employment type distributions with share percentages
- **Hires by Industry**: Absolute hires + share of total, with leading industry highlight
- **Churn Risk Alert**: Flags employers trending down in touchpoints and open requisitions
- **Architecture Section**: `3.3 Employer Dashboard Metrics`

**Predictive Model Calculations:**
- **Time-Series Forecasts**: Exponential smoothing / moving average projections using 6-12 month windows
- **Retention Projections**: Weighted by most recent cohorts, sensitivity to event participation scoring
- **Program Momentum**: Growth rate = (forecast engagement – current engagement) / current, flags >=12% as high momentum
- **Employer Growth Potential**: Combines historic hiring velocity, pipeline volume, and expressed demand → Low/Medium/High tiers
- **Risk Watchlists**: Score drop triggers when touches fall >15% quarter-over-quarter and requisitions shrink
- **Architecture Section**: `3.4 Predictive Outlook Models`, `3.6 Machine Learning & Python Tooling`

---

### 4) Demo Video Script (2–4 minutes per member)

**Member A: Predictive Analytics & Admin Access**
1. Login as admin (`admin` / `admin123`)
2. Navigate to "Insights → Predictive Outlook"
3. Show Alumni tab: engagement score projections, retention outlook, program momentum
4. Hover over forecast lines, read narrative analysis
5. Switch to Employers tab: quarterly hiring projections, growth potential matrix, risk watchlist
6. Explain how predictions support strategic planning

**Member B: Employer Dashboard & Chatbot**
1. Login as employer (`employer` / `employer123`)
2. Navigate to Employer Dashboard
3. Show Pipeline Conversion Waterfall, Employer Health Scorecard, Diversity Hiring Mix
4. Read "Data Scientist Predictions" panel
5. Open Chatbot, ask: "What does pipeline conversion mean?" and "How is employer health calculated?"
6. Explain how dashboard supports partnership management

**Member C: Alumni Dashboard & Community Pages**
1. Login as alumni (`alumni` / `alumni123`)
2. Navigate to Alumni Dashboard
3. Show Engagement Funnel, Cohort Retention, Program Performance Leaderboard
4. Hover over charts, read "What it means" analysis blocks
5. Navigate to Gallery, filter by program, browse imagery
6. Navigate to Events, filter by audience, submit inquiry via Contact form
7. Explain how analytics support alumni engagement

**Member D: Admin Console & Data Management**
1. Login as admin (`admin` / `admin123`)
2. Navigate to Admin Console
3. Show data tables (Students, Employers, Contacts, Events)
4. Edit a row (e.g., update student program), add a new row
5. Upload an image via Image Library (category: alumni)
6. View system overview (row counts, dataset freshness)
7. Show `server/data/event_inquiries.csv` to demonstrate inquiry persistence
8. Explain how admin console enables data management without database access

---

### 5) Local Development Setup

**For GitHub Codespaces or Any Cloud Environment:**

**Step 1: Start Backend**
```bash
cd datanexus-dashboard/server
npm install
npm run dev
```
- Codespaces will automatically forward the port (check the "Ports" tab)
- Note the forwarded URL (e.g., `https://your-codespace-5000.app.github.dev`)

**Step 2: Start Frontend**
```bash
cd datanexus-dashboard
npm install
# Replace with your actual backend forwarded URL from Step 1
echo "VITE_API_BASE_URL=https://your-codespace-5000.app.github.dev" > .env
npm run dev
```
- Codespaces will automatically forward the frontend port
- Access the app via the forwarded URL shown in the "Ports" tab

**For Local Development (macOS/Windows/Linux):**
```bash
# Backend
cd datanexus-dashboard/server
npm install
npm run dev  # Uses process.env.PORT or defaults to 5002

# Frontend (in a new terminal)
cd datanexus-dashboard
npm install
echo "VITE_API_BASE_URL=http://localhost:5002" > .env
npm run dev  # Uses default port 5173
```

**Access:**
- Frontend: Check the terminal output or Codespaces "Ports" tab for the URL
- Backend API: Check the terminal output or Codespaces "Ports" tab for the URL

---

### 6) Security & Compliance Notes

- **Vulnerability Fix**: Migrated event inquiries from Excel (`xlsx`) to CSV (`papaparse`) to address high-severity vulnerabilities (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9). `npm audit` now reports 0 vulnerabilities.
- **Authentication**: JWT-based authentication with role-based access control (admin, alumni, employer). Tokens expire after 2 hours.
- **Data Persistence**: CSV-backed storage enables version control and audit trails without database dependencies.
- **File Upload Security**: Multer sanitizes filenames and enforces category-level directories to prevent path traversal.

**Architecture Section**: `1.5 Security & Hardening`

---

### 7) Key Features & Screenshots Guide

This section identifies the key features of DataNexus and which screens demonstrate them. Capture screenshots of these screens to showcase the solution's capabilities.

#### **Feature 1: Role-Based Authentication & Access Control**
**Demonstrated By:**
- **Login Screen** (`/login`): Shows credential input form with role selection
- **Landing Page** (`/`) after login: Navigation bar adapts based on user role (admin sees "Insights → Predictive Outlook", alumni/employer do not)
- **Unauthorized Access Attempt**: Try accessing `/admin` as alumni → redirects to `/unauthorized`

**Screenshot Focus:**
- Login form with test credentials
- Navigation bar showing role-appropriate menu items
- Unauthorized access message

**Why It Matters**: Demonstrates secure, role-based access ensuring users only see relevant features.

---

#### **Feature 2: Descriptive Analytics (What Happened)**
**Demonstrated By:**
- **Alumni Dashboard** (`/dashboards/alumni`): 
  - KPI ribbon (Total Alumni, % Engaged, Avg Satisfaction, Mentorship Impact)
  - Engagement Funnel chart showing conversion rates
  - Cohort Retention table with retention percentages
  - Program Performance Leaderboard
- **Employer Dashboard** (`/dashboards/employers`):
  - KPI cards (Active Employers, Total Hires, Offer Rate, Pipeline Health)
  - Pipeline Conversion Waterfall
  - Hires by Industry bar chart
  - Hiring Trend line chart

**Screenshot Focus:**
- KPI cards/ribbon at top of each dashboard
- At least 2-3 key visualizations with hover tooltips visible
- "What it means" analysis blocks below charts

**Why It Matters**: Shows how DataNexus answers "What happened?" with clear metrics and visualizations.

---

#### **Feature 3: Diagnostic Analytics (Why It Happened)**
**Demonstrated By:**
- **Alumni Dashboard**: 
  - "What it means" analysis blocks explaining trends (e.g., "Program X shows 12% growth due to increased mentorship participation")
  - Event Type Effectiveness chart with textual highlights
  - Engagement Trend summary with min/max detection
- **Employer Dashboard**:
  - Analysis text explaining pipeline bottlenecks
  - Diversity Hiring Mix with summary insights
  - Churn Risk Early Warning with recommended actions

**Screenshot Focus:**
- Analysis text blocks directly below visualizations
- Charts with narrative explanations visible
- Highlighted insights (e.g., "Top degree demand: Master's")

**Why It Matters**: Demonstrates how DataNexus explains "Why" trends occurred, making analytics actionable.

---

#### **Feature 4: Predictive Analytics (What's Next)**
**Demonstrated By:**
- **Predictive Outlook – Alumni** (`/predictions/alumni`, Admin only):
  - Engagement Score Projections line chart with forecast trend
  - Cohort Retention Outlook with confidence intervals
  - Program Momentum forecasts with growth percentages
  - Narrative analysis explaining predictions
- **Predictive Outlook – Employers** (`/predictions/employers`, Admin only):
  - Quarterly Hiring Projections bar chart
  - Employer Growth Potential matrix (Low/Medium/High tiers)
  - Risk Watchlist with flagged employers
  - Recommended Actions panel

**Screenshot Focus:**
- Forecast charts with projected values visible
- Growth potential matrix or risk watchlist
- Narrative analysis blocks explaining confidence levels
- Recommended actions cards

**Why It Matters**: Shows forward-looking capabilities that enable strategic planning and proactive decision-making.

---

#### **Feature 5: Interactive Data Visualizations**
**Demonstrated By:**
- **Alumni Dashboard**:
  - Hover over Engagement Funnel to see exact counts and conversion percentages
  - Hover over Cohort Retention table to see retention rates
  - Hover over Program Performance Leaderboard to see scores
- **Employer Dashboard**:
  - Hover over Pipeline Conversion Waterfall to see stage-by-stage conversions
  - Hover over Employer Health Scorecard (bubble chart) to see health scores
  - Hover over Hires by Industry to see exact hire counts

**Screenshot Focus:**
- Charts with tooltips visible (hover state captured)
- Multiple chart types (bar, line, donut, funnel, scatter)
- Responsive layout showing charts adapt to screen size

**Why It Matters**: Demonstrates rich, interactive visualizations that enable users to explore data dynamically.

---

#### **Feature 6: Data Management Without Database**
**Demonstrated By:**
- **Admin Console** (`/admin`, Admin only):
  - Data Tables tab showing CSV-backed tables (Students, Employers, Contacts, Events, Dates, Alumni Engagement)
  - Edit row functionality (click "Edit" → modify data → save)
  - Add new row functionality (click "Add New" → fill form → save)
  - Delete row functionality (click "Delete" → confirm)
  - System Overview showing row counts and dataset freshness

**Screenshot Focus:**
- Data table with CRUD buttons visible
- Edit form modal with data populated
- System Overview panel showing statistics
- Success message after save/delete operation

**Why It Matters**: Shows how DataNexus enables full data management using CSV persistence, eliminating database dependencies.

---

#### **Feature 7: Image Asset Management**
**Demonstrated By:**
- **Admin Console → Image Library** (`/admin`, Admin only):
  - Upload interface with category selection (alumni/employers/hero/uploads)
  - Image grid showing uploaded assets
  - Delete functionality for images
  - Generated URLs ready for use
- **Gallery** (`/gallery`):
  - Hero carousel displaying featured images
  - Filterable grid showing uploaded alumni/employer imagery
  - Filters by program, year, category

**Screenshot Focus:**
- Image Library upload interface
- Gallery with filtered results
- Image grid showing multiple categories

**Why It Matters**: Demonstrates centralized asset management and visual content curation.

---

#### **Feature 8: Event Discovery & Lead Capture**
**Demonstrated By:**
- **Events Page** (`/events`):
  - Event listings with filters (audience type, event category, date range)
  - "Learn More" and "RSVP" buttons
  - Event details with audience and category tags
- **Contact Page** (`/contact`):
  - Inquiry form (name, email, event interest, message)
  - Form submission with validation
  - Success confirmation message
- **Admin Console → View Inquiries**:
  - Show `server/data/event_inquiries.csv` with submitted inquiries

**Screenshot Focus:**
- Events page with filters applied
- Contact form filled out (before submission)
- Success message after submission
- CSV file showing inquiry entries

**Why It Matters**: Shows how DataNexus drives engagement through event discovery and captures leads for follow-up.

---

#### **Feature 9: Self-Service Analytics Assistant**
**Demonstrated By:**
- **Chatbot** (floating button on authenticated pages):
  - Open assistant window
  - Ask: "What does engagement score mean?"
  - Ask: "How is retention calculated?"
  - Ask: "What does pipeline conversion mean?"
  - Ask: "How is employer health calculated?"
  - View curated answers from knowledge base

**Screenshot Focus:**
- Chatbot window open with question typed
- Response visible with explanation
- Multiple Q&A exchanges showing different topics

**Why It Matters**: Demonstrates knowledge democratization, making analytics accessible to non-technical users.

---

#### **Feature 10: Star Schema Data Architecture**
**Demonstrated By:**
- **Admin Console → Data Tables**:
  - View `fact_alumni_engagement.csv` (fact table with surrogate keys)
  - View dimension tables: `Dim_Students.csv`, `dim_employers.csv`, `dim_event.csv`, `dim_date.csv`, `dim_contact.csv`
  - Show relationships via key columns (student_key, employer_key, event_key, date_key)
- **Alumni Dashboard**:
  - Show how metrics join fact table with dimension tables (e.g., engagement by program requires joining fact_alumni_engagement with Dim_Students)

**Screenshot Focus:**
- Fact table with key columns visible
- Dimension tables showing descriptive attributes
- Dashboard showing joined data (e.g., program names from Dim_Students displayed in charts)

**Why It Matters**: Demonstrates proper data modeling using star schema, enabling efficient analytics and drill-downs.

---

#### **Feature 11: Responsive Design & Brand Consistency**
**Demonstrated By:**
- **All Screens**:
  - Desktop view (full width, multi-column layouts)
  - Tablet view (responsive grid adjustments)
  - Mobile view (stacked layouts, collapsible navigation)
  - SLU brand colors (Blue: #002F6C, Gold: #FDB515) throughout
  - Consistent card-based layouts with gold accent bars

**Screenshot Focus:**
- Same screen at different viewport sizes (desktop, tablet, mobile)
  - Navigation bar showing responsive behavior
  - Dashboard grid showing column adjustments
  - Charts showing responsive sizing

**Why It Matters**: Shows professional, accessible design that works across all devices while maintaining brand identity.

---

#### **Feature 12: Real-Time Data Updates**
**Demonstrated By:**
- **Admin Console**:
  - Edit a student record (e.g., change program)
  - Save changes
  - Navigate to Alumni Dashboard
  - Verify updated data appears in charts (e.g., program distribution reflects change)
- **Image Library**:
  - Upload new image
  - Navigate to Gallery
  - Verify new image appears in gallery grid

**Screenshot Focus:**
- Before/after screenshots showing data change
- Dashboard reflecting updated data
- Gallery showing newly uploaded image

**Why It Matters**: Demonstrates that DataNexus provides real-time updates without requiring database restarts or manual data refresh.

---

### 8) Recommended Screenshot Sequence for Submission

**Sequence 1: Authentication & Role-Based Access (2-3 screenshots)**
1. Login screen with credentials
2. Landing page showing role-appropriate navigation
3. Unauthorized access attempt (optional)

**Sequence 2: Descriptive Analytics (4-5 screenshots)**
1. Alumni Dashboard KPI ribbon
2. Alumni Dashboard with 2-3 key visualizations (Funnel, Retention, Program Performance)
3. Employer Dashboard KPI cards
4. Employer Dashboard with 2-3 key visualizations (Pipeline, Health Scorecard, Diversity Mix)

**Sequence 3: Diagnostic Analytics (2-3 screenshots)**
1. Alumni Dashboard showing "What it means" analysis blocks
2. Employer Dashboard showing analysis text and insights
3. Close-up of analysis text explaining a specific trend

**Sequence 4: Predictive Analytics (3-4 screenshots)**
1. Predictive Outlook – Alumni with forecast charts
2. Predictive Outlook – Employers with growth potential matrix
3. Risk watchlist with recommended actions
4. Narrative analysis explaining predictions

**Sequence 5: Data Management (3-4 screenshots)**
1. Admin Console data tables view
2. Edit row form with data populated
3. System Overview showing statistics
4. CSV file showing inquiry persistence (optional)

**Sequence 6: Interactive Features (2-3 screenshots)**
1. Chart with hover tooltip visible
2. Gallery with filters applied
3. Events page with filtered results

**Sequence 7: Assistant & Community (2-3 screenshots)**
1. Chatbot window with Q&A exchange
2. Gallery hero carousel
3. Contact form submission success

**Sequence 8: Responsive Design (2-3 screenshots)**
1. Dashboard on desktop view
2. Same dashboard on tablet view
3. Same dashboard on mobile view

---

### 9) Solution Architecture Summary

**Proposed Solution**: DataNexus Dashboard provides a unified analytics platform for Saint Louis University to track alumni engagement and employer partnerships through descriptive, diagnostic, and predictive analytics.

**How Each Screen Supports the Solution:**
- **Landing Page**: Establishes DataNexus as the central hub and provides role-based navigation.
- **Dashboards (Alumni/Employer)**: Deliver descriptive and diagnostic analytics with actionable insights.
- **Predictive Outlook**: Provides forward-looking forecasts to support strategic planning.
- **Admin Console**: Enables data management and system maintenance without database access.
- **Community Pages (Gallery/Events/Contact)**: Drive engagement and capture leads.
- **Chatbot**: Democratizes analytics knowledge through self-service Q&A.

**Data Architecture**: Star schema (fact table + dimension tables) exported from SQL to CSV, enabling static hosting while maintaining relational integrity.

**Technology Stack**: React 18 (frontend), Express.js (backend API), PapaParse (CSV I/O), Recharts (visualizations), JWT (authentication), Multer (file uploads).

**Architecture Reference**: See `README.md` sections 1-3 for complete architecture, analytics, and data schema documentation.

