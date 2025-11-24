# DataNexus Dashboard

DataNexus is Saint Louis University's analytics command center for alumni engagement and employer partnerships. It bundles a modern React experience, a secure Express API, and curated CSV data sources to deliver descriptive, diagnostic, and predictive insights with role-based access.

---

## Table of Contents
- [1. Application Architecture](#1-application-architecture)
  - [1.1 High-Level Stack](#11-high-level-stack)
  - [1.2 Runtime Flow](#12-runtime-flow)
  - [1.3 Authentication & Authorization](#13-authentication--authorization)
  - [1.4 Data Refresh & Storage](#14-data-refresh--storage)
  - [1.5 Security & Hardening](#15-security--hardening)
- [2. Functional Walkthrough](#2-functional-walkthrough)
  - [2.1 Entry & Shared UI](#21-entry--shared-ui)
  - [2.2 Dashboards](#22-dashboards)
  - [2.3 Alumni Portal](#23-alumni-portal)
  - [2.4 Employer Portal](#24-employer-portal)
  - [2.5 Admin Console](#25-admin-console)
  - [2.6 Community & Support Pages](#26-community--support-pages)
  - [2.7 Navigation & Role Visibility](#27-navigation--role-visibility)
- [3. Analytics & Calculations](#3-analytics--calculations)
  - [3.1 Data Sources](#31-data-sources)
  - [3.2 Alumni Dashboard - Complete Analytics Breakdown](#32-alumni-dashboard---complete-analytics-breakdown)
  - [3.3 Employer Dashboard - Complete Analytics Breakdown](#33-employer-dashboard---complete-analytics-breakdown)
  - [3.4 Metrics Calculation Utilities](#34-metrics-calculation-utilities)
  - [3.5 Visualizations & Libraries](#35-visualizations--libraries)
  - [3.6 Star Schema & ERD](#36-star-schema--erd)
- [4. Repository & Folder Structure](#4-repository--folder-structure)
- [5. Local Development](#5-local-development)
- [6. Deployment Notes](#6-deployment-notes)
- [7. Security, Roles & Credentials](#7-security-roles--credentials)
- [8. Update History](#8-update-history)
- [9. Troubleshooting & FAQ](#9-troubleshooting--faq)
- [10. Future Feature Roadmap (AI & ML)](#10-future-feature-roadmap-ai--ml)

---

## 1. Application Architecture

> For stack-level details (framework versions, security posture, dev workflows), see [TECHNOLOGY_DOCUMENTATION.md](TECHNOLOGY_DOCUMENTATION.md).

### 1.1 High-Level Stack
| Layer | Description |
| ----- | ----------- |
| **Frontend** | React 18 + Vite build pipeline, TailwindCSS for theming, Recharts for charts, React Router for navigation, and a context-driven auth client. |
| **Backend API** | Express 4 server providing JWT authentication, CSV persistence (admin tables + inquiries), image uploads via Multer, and assistant query logic. |
| **Data Layer** | Source-of-truth CSVs (dimension & fact tables) under `datanexus-dashboard/public/`, uploaded imagery in `public/assets`, event inquiries and alumni submissions captured in `server/data/*.csv` files. |
| **Assistant Layer** | Currently a curated Q&A knowledge base in the React app (previous RAG hooks remain ready for future integration with vector search). |

### 1.2 Runtime Flow
1. User hits the React client served from Vite (dev) or static hosting (prod).
2. Authenticated routes request JWT-protected data from the Express API using `fetch` helpers in `src/services/adminApi.js`.
3. Analytics pages load CSVs directly from `public/` and parse them with PapaParse before transforming metrics using shared utility functions in `src/utils/metrics.js`.
4. Predictive insights are calculated asynchronously using `src/utils/alumniPredictions.js` (Alumni Dashboard) or `src/utils/employerPredictions.js` (Employer Dashboard) to avoid blocking main render.
5. Alumni submissions (event applications, engagement participation, success stories) POST to `/api/alumni/*` routes which persist to CSV files in `server/data/`.
6. Admin uploads or CRUD actions hit `/api/admin/*` routes which persist to CSV files or image directories.
7. Admin can view and manage alumni submissions via `/api/admin/alumni-submissions` endpoint.
8. Calculation details are hidden by default; users hover over visualization titles to view detailed calculation methods.
9. The Assistant references the in-memory knowledge base to respond instantly with curated analysis.

### 1.3 Authentication & Authorization
- Login POST `/api/auth/login` verifies credentials stored in `server/data/users.json` and issues an HMAC-signed JWT (`role`, `username`, `employer_key` for employers, `student_key` for alumni).
- `AuthContext` persists the token in `localStorage` and exposes `role` to `ProtectedRoute` wrappers.
- Roles (`admin`, `alumni`, `employer`) gate routes, navigation groups, and admin mutations.
- `Authorization: Bearer <token>` headers are required for `/api/admin/*` and `/api/alumni/*` endpoints.

### 1.4 Data Refresh & Storage
- CSVs: Updated via admin table CRUD or by replacing files in `public/`. PapaParse keeps type fidelity when reading/writing.
- Event inquiries append rows to `server/data/event_inquiries.csv`; the file is auto-created with headers.
- Alumni submissions:
  - Event applications → `server/data/event_applications.csv`
  - Success stories → `server/data/success_stories.csv`
  - Engagement feedback → `server/data/engagement_feedback.csv`
  - Engagement participation → `fact_alumni_engagement.csv` (main admin table)
- Employer submissions:
  - Alumni feedback → `server/data/employer_alumni_feedback.csv`
  - Event participation requests → `server/data/employer_event_participation.csv`
  - Employment issue reports → `server/data/employer_alumni_employment_issues.csv`
- Images: Uploads stored under `public/assets/<category>/` with auto-generated safe filenames.

### 1.5 Security & Hardening
- HTTPS recommended end-to-end; all tokens transmitted over TLS.
- JWTs are signed with `HS256` using `JWT_SECRET`; rotation supported through env vars.
- Tokens expire per `JWT_EXPIRY` (default 2h); frontend auto-clears on invalid token.
- Protected API routes validate bearer token before touching the filesystem.
- Multer upload pipeline sanitizes filenames, enforces category-level directories, and prevents path traversal.
- CORS defaults to open in dev; restrict origins for production.
- No passwords are stored in plaintext beyond the seeded demo data—replace `users.json` with hashed entries before production.

---

## 2. Functional Walkthrough

### 2.1 Entry & Shared UI
- **Login** (`/login`) – Authenticates users and redirects based on role; errors surface inline.
- **Navbar** – Dynamic link groups (Dashboards, Alumni, Employer, Admin). Navigation items are role-aware and hide automatically for unauthorized users.
- **Global styling** – Tailwind utility classes tuned to SLU blue/gold color palette with responsive design baked into every page.
- **Home** (`/`) – Landing hero, mission statement, quick links to dashboards and community pages.

### 2.2 Dashboards

> For an expanded, standalone reference of dashboard KPIs, visual layouts, and upkeep workflows, read [DASHBOARD_DOCUMENTATION.md](DASHBOARD_DOCUMENTATION.md).

#### 2.2.1 Alumni Dashboard (`/alumni`)
**Access:** Admin, Alumni roles

**Purpose:** Provides SLU administrators with a comprehensive view of alumni engagement patterns, helping them understand which alumni are most active, which programs produce the most engaged graduates, and how engagement trends change over time.

**Functional Flow:**
1. Page loads → `loadAllData()` fetches all CSV files from `public/`
2. `useMemo` hook calculates all metrics using utility functions from `src/utils/metrics.js`
3. Metrics are displayed in KPI cards, charts, and tables
4. Predictive insights calculated asynchronously using `src/utils/alumniPredictions.js` to avoid blocking main render
5. All calculations happen client-side for fast rendering
6. Calculation details hidden by default; hover over visualization titles to view detailed methods

**Page Structure:**

**A. Hero Section**
- Image slider with rotating SLU alumni photos
- Title: "Alumni Engagement Dashboard"
- Subtitle: "Track engagement, participation, and alumni relationships"

**B. KPI Cards Section (Top Row)**
Four key performance indicators displayed as cards:

1. **Total Alumni**
   - **Calculation:** `calculateTotalAlumni(students)` - Counts distinct `student_key` values from `Dim_Students.csv`
   - **Formula:** `COUNT(DISTINCT student_key)`
   - **Why Important:** Provides the baseline denominator for all engagement rate calculations. SLU admins need to know the total alumni population to understand engagement percentages and plan outreach efforts.
   - **Admin Use Case:** "We have 1,000 total alumni, so if 400 are engaged, that's a 40% engagement rate."

2. **Engaged Alumni**
   - **Calculation:** `calculateEngagedAlumni(students, alumniEngagement)` - Counts distinct alumni who appear at least once in `fact_alumni_engagement.csv`
   - **Formula:** `COUNT(DISTINCT student_key WHERE student_key IN fact_alumni_engagement)`
   - **Why Important:** Shows the actual number of alumni who have participated in at least one SLU activity. This is the numerator for engagement rate calculations.
   - **Admin Use Case:** "400 out of 1,000 alumni are engaged - we need to reach out to the other 600."

3. **Engagement Rate**
   - **Calculation:** `calculateEngagementRate(engagedAlumniCount, totalAlumni)` - Percentage of alumni who are engaged
   - **Formula:** `(engagedAlumni / totalAlumni) × 100`, capped at 100%
   - **Why Important:** Provides a single metric to track overall alumni engagement health. SLU admins can set targets (e.g., "We want 50% engagement rate by end of year") and measure progress.
   - **Admin Use Case:** "Our engagement rate is 40%. Our goal is 50%, so we need to engage 100 more alumni."

4. **Avg Engagement Touchpoints**
   - **Calculation:** `calculateAvgTouchpoints(alumniEngagement, engagedAlumniCount)` - Average number of interactions per engaged alumnus
   - **Formula:** `total_engagement_records / engaged_alumni_count`
   - **Why Important:** Measures engagement depth. A high average means engaged alumni are highly active (multiple interactions), while a low average might indicate one-time participants.
   - **Admin Use Case:** "Average touchpoints is 1.9, meaning most engaged alumni interact twice. We should encourage repeat engagement."

**C. Visualization Section (6 Major Visuals)**

**Row 1: Engagement Trend & Program Analysis**

1. **Alumni Engagement Trend (Line Chart)**
   - **Title:** "Alumni Engagement Trend"
   - **Subtitle:** "Month-over-month view of engaged alumni and interactions."
   - **Calculation:** `getEngagementTrendByMonth(alumniEngagement, dates)`
   - **Data Points:**
     - `monthLabel`: Formatted month/year (e.g., "Jan 2024")
     - `engagedAlumni`: Distinct count of alumni who engaged in that month
     - `totalTouchpoints`: Total number of engagement records in that month
   - **Visualization:** Dual-line chart showing both metrics over time
   - **Why Important:** Reveals seasonal patterns, growth trends, and identifies months with peak/low engagement. SLU admins can plan events around high-engagement periods and investigate drops.
   - **Admin Use Case:** "Engagement peaks in September (back-to-school) and March (spring events). We should schedule major events during these months."

2. **Engaged Alumni by Program (Horizontal Bar Chart)**
   - **Title:** "Engaged Alumni by Program"
   - **Subtitle:** "Which academic programs have the most engaged alumni."
   - **Calculation:** `getEngagementByProgram(students, alumniEngagement)`
   - **Data Points:**
     - `program`: Program name (e.g., "MS Information Systems")
     - `engagedAlumni`: Count of distinct engaged alumni per program
   - **Visualization:** Horizontal bar chart, top 10 programs sorted by engaged alumni count
   - **Why Important:** Identifies which programs produce the most engaged alumni. SLU admins can:
     - Focus outreach on programs with low engagement
     - Learn from highly-engaged programs to replicate success
     - Allocate resources based on program engagement levels
   - **Admin Use Case:** "MS Information Systems has 150 engaged alumni, while MS Statistics has only 20. We should investigate why Statistics alumni are less engaged and create targeted outreach."

**Row 2: Engagement Types & Geographic Distribution**

3. **Engagement by Type (Grouped Bar Chart)**
   - **Title:** "Engagement by Type"
   - **Subtitle:** "How alumni prefer to engage with SLU."
   - **Calculation:** `getEngagementByType(alumniEngagement)`
   - **Data Points:**
     - `type`: Engagement type (Event, Mentorship, Networking, etc.)
     - `totalEngagements`: Total number of engagement records per type
     - `engagedAlumni`: Distinct count of alumni per type
   - **Visualization:** Grouped bar chart showing both metrics side-by-side
   - **Why Important:** Shows which engagement channels are most popular. SLU admins can:
     - Invest more in popular engagement types
     - Promote underutilized engagement opportunities
     - Understand alumni preferences for event planning
   - **Admin Use Case:** "Events have 500 total engagements with 200 unique alumni, while mentorship has only 50 engagements. We should promote mentorship programs more."

4. **Alumni Engagement by Location (Map Visualization)**
   - **Title:** "Alumni Engagement by Location"
   - **Subtitle:** "Where engaged alumni are located."
   - **Calculation:** `getEngagedAlumniByLocation(students, alumniEngagement)`
   - **Data Points:**
     - `code`: Location code (state code for US, country code otherwise)
     - `name`: Location name
     - `engagedCount`: Count of engaged alumni per location
   - **Visualization:** Interactive map/grid showing location-based engagement with color-coded intensity
   - **Why Important:** Helps SLU admins:
     - Plan regional events in high-engagement areas
     - Identify geographic gaps in engagement
     - Understand alumni distribution for networking events
     - Target outreach to underrepresented regions
   - **Admin Use Case:** "Missouri has 200 engaged alumni, while California has 150. We should host a West Coast event to engage California alumni."

**Row 3: Cohort Analysis & Top Performers**

5. **Engagement by Graduation Cohort (Bar Chart)**
   - **Title:** "Engagement by Graduation Cohort"
   - **Subtitle:** "How engagement varies across graduating classes."
   - **Calculation:** `getEngagementByGraduationCohort(students, alumniEngagement)`
   - **Data Points:**
     - `year`: Graduation year (e.g., "2020", "2021")
     - `engagedAlumni`: Count of distinct engaged alumni per graduation year
   - **Visualization:** Vertical bar chart sorted by year (ascending)
   - **Why Important:** Reveals which graduating classes are most/least engaged. SLU admins can:
     - Identify cohorts that need re-engagement
     - Understand if recent graduates are more engaged (recency effect)
     - Plan cohort-specific outreach campaigns
     - Track long-term engagement retention
   - **Admin Use Case:** "2024 graduates have 80 engaged alumni, while 2020 graduates have only 30. Recent graduates are more engaged - we should create programs to maintain this engagement as they age."

6. **Top Engaged Alumni (Table)**
   - **Title:** "Top Engaged Alumni"
   - **Subtitle:** "Alumni with the highest number of engagement touchpoints."
   - **Calculation:** `getTopEngagedAlumni(students, alumniEngagement, 10)`
   - **Data Points:**
     - `name`: Alumni full name
     - `program`: Academic program
     - `engagementCount`: Total number of engagement records
     - `totalMinutes`: Total mentorship/engagement minutes (if available)
   - **Visualization:** Sortable table showing top 10 alumni
   - **Why Important:** Identifies alumni champions who can:
     - Serve as ambassadors for SLU
     - Mentor other alumni
     - Provide testimonials
     - Help with fundraising
   - **Admin Use Case:** "John Doe has 25 engagement touchpoints. We should invite him to be an alumni ambassador and speak at events."

**D. Predictive Insights Section - Alumni-SLU Relationship Predictions**
- **Purpose:** Data-driven insights to strengthen SLU-alumni relationships and engagement
- **Access:** Calculations hidden by default; hover over titles to view detailed calculation methods
- **5 Key Predictions:**

  1. **Top Programs for Engagement Growth**
     - **Function:** `getTopProgramsForGrowth(students, alumniEngagement)`
     - **Data Sources:** `Dim_Students.csv`, `fact_alumni_engagement.csv`
     - **Method:** Calculate engagement rate per program (engaged alumni / total alumni × 100). Identify programs with engagement rate < 80% as having growth potential.
     - **Formula:** `(Engaged Alumni / Total Alumni) × 100`
     - **Why Important:** Identifies which academic programs need more engagement outreach. SLU admins can prioritize programs with high growth potential.
     - **Admin Use Case:** "MS Data Analytics has 60% engagement rate. We should create program-specific events to increase this to 80%."

  2. **Alumni Job Roles**
     - **Function:** `getTopJobRoles(alumniEmployment, students)`
     - **Data Sources:** `alumni_employment.csv`
     - **Method:** Count verified employment records by job_title, group by role and count alumni.
     - **Formula:** `COUNT(*) WHERE status = 'Verified' GROUP BY job_title`
     - **Why Important:** Identifies the most common job roles among SLU alumni, helping understand career outcomes and program alignment.
     - **Admin Use Case:** "Data Analyst is the most common role with 50 alumni. We should highlight this in our program marketing."

  3. **Technology Insights**
     - **Function:** `getTopTechnologies(employerFeedback)`
     - **Data Sources:** `employer_alumni_feedback.csv`
     - **Method:** Extract technologies from approved feedback, count occurrences, calculate average rating per technology.
     - **Formula:** `COUNT(*) GROUP BY technology, AVG(rating_overall) per technology`
     - **Why Important:** Identifies which technologies SLU alumni excel in, helping inform curriculum decisions and career guidance.
     - **Admin Use Case:** "React is mentioned 30 times with 4.5/5 average rating. Our curriculum is preparing students well for React roles."

  4. **Gender Engagement Insights**
     - **Function:** `getGenderInsights(students, alumniEngagement)`
     - **Data Sources:** `Dim_Students.csv`, `fact_alumni_engagement.csv`
     - **Method:** Group alumni by gender, calculate engagement rate and average engagements per gender.
     - **Formula:** `(Engaged Alumni / Total Alumni) × 100 per gender`
     - **Why Important:** Reveals engagement patterns by gender, helping ensure equitable outreach and identify potential gaps.
     - **Admin Use Case:** "Female alumni have 65% engagement rate vs 60% for male. Both are strong, but we should maintain this balance."

  5. **Engagement Trend Forecast**
     - **Function:** `getEngagementForecast(alumniEngagement)`
     - **Data Sources:** `fact_alumni_engagement.csv`
     - **Method:** Group engagement records by month, calculate average engaged alumni from last 3 months, apply growth rate from last 6 months trend.
     - **Formula:** `AVG(last 3 months engaged) × (1 + growth_rate/100)`
     - **Why Important:** Projects future engagement levels to help SLU plan resource allocation and outreach strategies.
     - **Admin Use Case:** "Current engagement is 400 alumni. Forecast shows 420 in 3 months. We should prepare for increased engagement activities."

**E. Calculation Display System**
- **Hover-Based Details:** All calculation boxes are hidden by default to reduce visual clutter
- **How to View:** Hover over the "📊 Calculation & Data Source" title in any visualization to see:
  - Data sources used
  - Calculation method
  - Formula breakdown
  - Display logic
- **Why This Design:** Keeps dashboards clean while providing detailed technical information on demand

**F. Analysis Summary Section**
- **Purpose:** Provides admin-friendly explanations of all insights
- **Content:** 
  - Overview of dashboard purpose
  - Explanation of key metrics
  - Strategic recommendations
  - Overall outcomes for SLU

---

#### 2.2.2 Employer Dashboard (`/employer`)
**Access:** Admin, Employer roles

**Purpose:** Provides SLU administrators with insights into employer partnerships, hiring patterns, and engagement levels. Helps identify top employer partners, understand hiring conversion rates, and track employer participation trends.

**Functional Flow:**
1. Page loads → `loadAllData()` fetches all CSV files
2. `useMemo` hook calculates all employer-related metrics using `src/utils/metrics.js`
3. Metrics displayed in KPI cards and visualizations
4. Predictive insights calculated asynchronously using `src/utils/employerPredictions.js`
5. All calculations use shared utility functions
6. Calculation details hidden by default; hover over titles to view

**Page Structure:**

**A. Hero Section**
- Image slider with employer partnership photos
- Title: "Employer Engagement Dashboard"
- Subtitle: "Track partnerships, hiring, and employer relationships"

**B. KPI Cards Section (Top Row)**
Four key performance indicators:

1. **Active Employers**
   - **Calculation:** `calculateActiveEmployers(employers, alumniEngagement)` - Counts distinct employers with at least one engagement record
   - **Formula:** `COUNT(DISTINCT employer_key WHERE employer_key IN fact_alumni_engagement)`
   - **Why Important:** Shows the number of employers actively engaging with SLU. SLU admins need this to measure partnership breadth and identify opportunities for expansion.
   - **Admin Use Case:** "We have 50 active employers. Our goal is 75, so we need to engage 25 more companies."

2. **Avg Employer Rating**
   - **Calculation:** `calculateAvgEmployerRating(employers)` - Average of `employer_rating` field from `dim_employers.csv`
   - **Formula:** `AVG(employer_rating WHERE employer_rating IS NOT NULL)`
   - **Why Important:** Measures employer satisfaction with SLU partnership. High ratings indicate strong relationships, while low ratings may signal issues needing attention.
   - **Admin Use Case:** "Average rating is 4.2/5.0, which is good. We should maintain this level and address any employers with ratings below 3.0."

3. **Hiring Conversion Rate**
   - **Calculation:** `calculateHiringConversionRate(alumniEngagement)` - Percentage of opportunities that result in hires
   - **Formula:** `(total_hires / total_opportunities) × 100`
   - **Why Important:** Measures how effectively job opportunities convert to actual hires. Low conversion rates may indicate issues with candidate quality or employer expectations.
   - **Admin Use Case:** "Conversion rate is 35%. This means 35 out of 100 opportunities result in hires. We should work with employers to improve this rate."

4. **Avg Engagement Score**
   - **Calculation:** `calculateEmployerEngagementScores(employers, alumniEngagement)` - Composite score based on events, interactions, and hires
   - **Formula:** `(eventsCount × 1) + (studentsInteracted × 0.5) + (hires × 2)`, then averaged across all employers
   - **Why Important:** Provides a single metric to measure overall employer engagement quality. Higher scores indicate more active, valuable partnerships.
   - **Admin Use Case:** "Average engagement score is 12.5. Employers with scores above 15 are our top partners - we should prioritize maintaining these relationships."

**C. Visualization Section (8 Major Visuals)**

**Row 1: Trends & Opportunities**

1. **Employer Participation Trend (Line Chart)**
   - **Title:** "Employer Participation Trend"
   - **Subtitle:** "Shows how employer engagement changes over time and whether outreach is improving."
   - **Calculation:** `calculateEmployerParticipationTrend(alumniEngagement, dates)`
   - **Data Points:**
     - `month`: Month/year label
     - `activeEmployers`: Distinct count of employers active in that month
     - `totalEvents`: Total number of events in that month
   - **Visualization:** Dual-line chart
   - **Why Important:** Tracks employer engagement trends over time. SLU admins can see if outreach efforts are working and identify seasonal patterns.
   - **Admin Use Case:** "Active employers increased from 30 to 50 over the past year. Our outreach is working, but we should maintain momentum."

2. **Job Opportunities vs Hires (Bar Chart)**
   - **Title:** "Job Opportunities vs Hires"
   - **Subtitle:** "Shows how many job opportunities employers provide and how many convert to alumni hires."
   - **Calculation:** `calculateOpportunitiesVsHires(alumniEngagement, dates)`
   - **Data Points:**
     - `month`: Month/year
     - `opportunities`: Count of job opportunities (job_offers_count)
     - `hires`: Count of actual hires (hired_flag = '1')
   - **Visualization:** Grouped bar chart
   - **Why Important:** Shows the hiring funnel efficiency. Large gaps between opportunities and hires may indicate issues with candidate matching or employer requirements.
   - **Admin Use Case:** "In March, we had 100 opportunities but only 30 hires. We need to improve candidate-employer matching to increase conversion."

**Row 2: Distribution & Employment**

3. **SLU Alumni Employed by Employer (Horizontal Bar Chart)**
   - **Title:** "SLU Alumni Employed by Employer"
   - **Subtitle:** "Shows how many verified SLU alumni are currently employed at each organization."
   - **Calculation:** `calculateAlumniEmployedPerEmployer(alumniEmployment, employers)`
   - **Data Points:**
     - `employerName`: Employer name
     - `alumniCount`: Count of verified alumni employees (status = 'Verified')
   - **Visualization:** Horizontal bar chart, top 10 employers
   - **Why Important:** Identifies employers who are major SLU talent destinations. SLU admins can:
     - Strengthen relationships with high-employment employers
     - Use this data for student career guidance
     - Identify potential partnership opportunities
   - **Admin Use Case:** "Company X employs 25 SLU alumni. We should invite them to be a premier partner and feature them in career fairs."

4. **Industry Distribution (Pie Chart)**
   - **Title:** "Industry Distribution of Active Employers"
   - **Subtitle:** "Shows which industries (Tech, Healthcare, Finance, Education, Engineering) are most active with SLU."
   - **Calculation:** `calculateIndustryDistribution(employers, alumniEngagement)`
   - **Data Points:**
     - `industry`: Industry name
     - `count`: Number of active employers in that industry
     - `percent`: Percentage of total
   - **Visualization:** Pie chart with top 8 industries
   - **Why Important:** Reveals industry concentration. SLU admins can:
     - Identify underrepresented industries for targeted outreach
     - Understand if partnerships align with program offerings
     - Plan industry-specific events
   - **Admin Use Case:** "Tech industry has 40% of our employers, while Healthcare has only 10%. We should reach out to more healthcare companies to diversify partnerships."

**Row 3: Engagement Scores & Technical Feedback**

5. **Employer Engagement Scorecard (Horizontal Bar Chart)**
   - **Title:** "Employer Engagement Scorecard"
   - **Subtitle:** "Combined score showing how actively each employer participates in events, student interactions, and hiring."
   - **Calculation:** `calculateEmployerEngagementScores(employers, alumniEngagement)`
   - **Data Points:**
     - `employerName`: Employer name
     - `engagementScore`: Composite score (events × 1 + interactions × 0.5 + hires × 2)
     - `eventsCount`: Number of events participated
     - `studentsInteracted`: Number of students interacted with
     - `hires`: Number of hires made
   - **Visualization:** Horizontal bar chart, top 10 employers
   - **Why Important:** Ranks employers by overall engagement value. SLU admins can:
     - Prioritize relationship management for top-scoring employers
     - Identify employers who need re-engagement
     - Allocate resources based on engagement value
   - **Admin Use Case:** "Company Y has an engagement score of 25 (highest). We should invite them to exclusive partnership events and feature them as a top partner."

6. **Technical Strength by Graduation Year (Composed Chart)**
   - **Title:** "Technical Strength by Graduation Year"
   - **Subtitle:** "Based on employer feedback about SLU alumni technical skills."
   - **Calculation:** `calculateTechnicalStrengthByYear(employerFeedback)`
   - **Data Points:**
     - `graduationYear`: Graduation year
     - `avgRating`: Average rating (1-5) from employer feedback
   - **Visualization:** Composed chart (bar + line) showing average ratings and trend
   - **Why Important:** Provides insights into curriculum effectiveness over time. SLU admins can:
     - Identify cohorts with lower technical ratings (may need curriculum updates)
     - Track if recent graduates are better prepared (curriculum improvements working)
     - Use data for program accreditation and improvement
   - **Admin Use Case:** "2023 graduates have an average rating of 4.2/5, while 2020 graduates have 3.5/5. Our recent curriculum improvements are working - we should continue this direction."

**Row 4: Hiring Funnel & Top Employers**

7. **Overall Hiring Funnel (Horizontal Bar Chart)**
   - **Title:** "Overall Hiring Funnel"
   - **Subtitle:** "Shows how job opportunities from employers convert into applications and final hires."
   - **Calculation:** `calculateHiringFunnel(alumniEngagement)`
   - **Data Points:**
     - `opportunitiesCount`: Total job opportunities (job_offers_count > 0)
     - `applicationsCount`: Total applications submitted
     - `hiresCount`: Total hires (hired_flag = '1')
   - **Visualization:** Horizontal bar chart with conversion metrics
   - **Why Important:** Shows the complete hiring pipeline efficiency. SLU admins can:
     - Identify bottlenecks (e.g., low application rates or low hire conversion)
     - Measure overall system effectiveness
     - Set targets for each funnel stage
   - **Admin Use Case:** "We have 500 opportunities, 300 applications (60% application rate), and 100 hires (33% hire rate). We should work on increasing both application and hire conversion rates."

8. **Top Hiring Employers (Table)**
   - **Title:** "Top Hiring Employers"
   - **Subtitle:** "Employers who provide the highest number of offers to SLU students and alumni."
   - **Calculation:** `calculateTopHiringEmployers(employers, alumniEngagement)`
   - **Data Points:**
     - `employerName`: Employer name
     - `industry`: Industry
     - `totalHires`: Total number of hires
     - `eventsAttended`: Number of events attended
     - `engagementScore`: Overall engagement score
   - **Visualization:** Sortable table
   - **Why Important:** Identifies top hiring partners. SLU admins can:
     - Prioritize relationship management
     - Feature these employers in career fairs
     - Use for student career guidance
   - **Admin Use Case:** "Company Z has made 50 hires. We should invite them to exclusive events and ensure they have priority access to top students."

**D. Predictive Insights Section - Employer-SLU Relationship Predictions**
- **Purpose:** Data-driven insights to strengthen SLU-employer partnerships and hiring relationships
- **Access:** Calculations hidden by default; hover over titles to view detailed calculation methods
- **5 Key Predictions:**

  1. **Strongest Employer Partnerships**
     - **Function:** `getTopPartnerships(employers, alumniEmployment, alumniEngagement)`
     - **Data Sources:** `dim_employers.csv`, `alumni_employment.csv`, `fact_alumni_engagement.csv`
     - **Method:** Count verified hires per employer, count event participations, calculate partnership score (hires × 2 + events).
     - **Formula:** `(Verified Hires × 2) + Event Participations`
     - **Why Important:** Identifies top employer partners who contribute most to SLU's hiring success. SLU admins can prioritize these relationships.
     - **Admin Use Case:** "Company X has a partnership score of 45 (20 hires, 5 events). This is our strongest partner - we should maintain this relationship."

  2. **Industries with Expansion Potential**
     - **Function:** `getExpansionIndustries(employers, alumniEmployment)`
     - **Data Sources:** `dim_employers.csv`, `alumni_employment.csv`
     - **Method:** Group employers by industry, count total hires per industry, calculate average hires per employer.
     - **Formula:** `Total Hires / Employer Count per industry`
     - **Why Important:** Reveals which industries have room for growth in SLU partnerships. Helps identify expansion opportunities.
     - **Admin Use Case:** "Healthcare has 50 hires but only 5 employers. We should recruit more healthcare companies to expand this industry."

  3. **Employers Ready for More Hires**
     - **Function:** `getEmployersReadyForHires(employers, alumniEmployment, alumniEngagement)`
     - **Data Sources:** `dim_employers.csv`, `alumni_employment.csv`, `fact_alumni_engagement.csv`
     - **Method:** Count current verified hires, count recent engagements (last 6 months), calculate readiness score (hires + engagements × 0.5).
     - **Formula:** `Current Hires + (Recent Engagements × 0.5)`
     - **Why Important:** Identifies employers who are actively engaged and likely to hire more SLU alumni in the near future.
     - **Admin Use Case:** "Company Y has 10 current hires and 8 recent engagements. They're ready to hire more - we should send them qualified candidates."

  4. **Event Participation Opportunities**
     - **Function:** `getEventParticipationOpportunities(employers, alumniEngagement, events)`
     - **Data Sources:** `dim_employers.csv`, `fact_alumni_engagement.csv`, `dim_event.csv`
     - **Method:** Count past event participations per employer, count upcoming events, calculate opportunity score (past + potential × 2).
     - **Formula:** `Past Events + (Potential Events × 2)`
     - **Why Important:** Identifies employers who could participate in more SLU events, strengthening relationships.
     - **Admin Use Case:** "Company Z has participated in 3 events. There are 5 upcoming events - we should invite them to participate."

  5. **Partnership Growth Forecast**
     - **Function:** `getPartnershipGrowthForecast(employers, alumniEmployment, alumniEngagement)`
     - **Data Sources:** `alumni_employment.csv`, `fact_alumni_engagement.csv`
     - **Method:** Count current verified hires, count recent hires (last 6 months), calculate growth rate, forecast future hires.
     - **Formula:** `Growth Rate = (Recent Hires / Total Hires) × 100`, `Forecast = Current Hires × (1 + Growth Rate / 100)`
     - **Why Important:** Projects future partnership strength to help SLU plan employer engagement strategies.
     - **Admin Use Case:** "Current hires: 200. Growth rate: 10%. Forecast: 220 hires in next period. We should prepare for increased partnership activity."

**E. Calculation Display System**
- **Hover-Based Details:** All calculation boxes are hidden by default to reduce visual clutter
- **How to View:** Hover over the "📊 Calculation & Data Source" title in any visualization to see:
  - Data sources used
  - Calculation method
  - Formula breakdown
  - Display logic
- **Why This Design:** Keeps dashboards clean while providing detailed technical information on demand

**F. Analysis Summary Section**
- **Purpose:** Provides admin-friendly explanations of employer insights
- **Content:**
  - Overview of employer partnership health
  - Key metrics explanations
  - Strategic recommendations for partnership development
  - Overall outcomes for SLU

---

### 2.3 Alumni Portal (`/alumni-portal`)
**Access:** Admin, Alumni roles

**Purpose:** Allows individual alumni to interact with SLU by applying for events, recording engagement participation, sharing success stories, and connecting with colleagues at their company.

**Functional Flow:**
1. User logs in with alumni role → JWT contains `student_key`
2. Portal loads → Fetches alumni profile via `GET /api/alumni/my-profile`
3. User selects tab → Loads relevant data (events, colleagues, etc.)
4. User submits forms → POST to `/api/alumni/*` endpoints
5. Data stored in CSV files → Admin can review in Admin Console

**Page Structure:**

**A. Profile Section (Top)**
- **Data Source:** `GET /api/alumni/my-profile`
- **Displays:**
  - Alumni photo, name, email, program, graduation year
  - Current role, company, start date, location
- **KPI Cards:**
  1. **Events Attended:** Count from `fact_alumni_engagement.csv` where `participated_university_event_flag = '1'`
  2. **Upcoming Events:** Count of approved/pending event applications for future events
  3. **Events Registered:** Total count of event applications
  4. **Colleagues:** Count of other SLU alumni at the same company (from `alumni_employment.csv`)
- **Why Important:** Gives alumni a personalized view of their engagement and helps them understand their connection to SLU.

**B. Tab Navigation**
Four main tabs:

**Tab 1: Apply for Events**
- **Functionality:** Alumni can apply to participate in upcoming SLU events
- **Form Fields:** Event selection, contact info, interest reason, previous attendance
- **Data Storage:** `server/data/event_applications.csv`
- **Admin Review:** Admin can approve/reject applications in Admin Console
- **Why Important:** Streamlines event registration and allows admin to manage event capacity and participant quality.

**Tab 2: Participate in Engagements**
- **Functionality:** Alumni can record their engagement participation (events, mentorship, networking)
- **Form Fields:** Engagement type, mentorship hours, feedback score (1-5), feedback notes, referrals made
- **Data Storage:** 
  - Engagement record → `fact_alumni_engagement.csv`
  - Feedback notes → `server/data/engagement_feedback.csv`
- **Why Important:** Captures real-time engagement data that feeds into dashboards. Allows alumni to self-report their activities.

**Tab 3: Share Success Story**
- **Functionality:** Alumni can submit career success stories
- **Form Fields:** Story title, content, achievements, current role, employer, photo URL
- **Data Storage:** `server/data/success_stories.csv`
- **Admin Review:** Admin can approve/reject stories for publication
- **Why Important:** Collects testimonials and success stories for marketing, student inspiration, and fundraising.

**Tab 4: My Network**
- **Functionality:** Shows alumni colleagues at the same company
- **Data Source:** `GET /api/alumni/my-colleagues`
- **Displays:**
  - Company information (logo, name, industry, headquarters)
  - Grid of SLU alumni colleagues with photos, job titles, programs, contact info
- **Why Important:** Facilitates networking among SLU alumni at the same company, strengthening the alumni community.

---

### 2.4 Employer Portal (`/employer-portal`)
**Access:** Admin, Employer roles

**Purpose:** Allows employers to manage their profile, view SLU alumni employees, participate in events, and provide feedback on alumni technical skills.

**Functional Flow:**
1. User logs in with employer role → JWT contains `employer_key`
2. Portal loads → Fetches employer profile via `GET /api/employer/profile`
3. User selects tab → Loads relevant data (employees, events, feedback)
4. User submits forms → POST to `/api/employer/*` endpoints
5. Data stored in CSV files → Admin can review

**Page Structure:**

**A. Relationship Snapshot (Top)**
- **KPIs:**
  1. **SLU Alumni Employed:** Count from `alumni_employment.csv` (status = 'Verified')
  2. **Events Participated:** Count of approved/completed events from `employer_event_participation.csv`
  3. **Pending Requests:** Count of requested events (status = 'requested')
  4. **Feedback Submitted:** Count from `employer_alumni_feedback.csv`
- **Why Important:** Gives employers a quick overview of their relationship with SLU.

**B. Tab Navigation**
Four main tabs:

**Tab 1: Company Profile**
- **Functionality:** View and edit company information
- **Fields:** Company name, industry, headquarters (city/state/country), website, products/services, relationship with SLU, logo URL
- **Data Storage:** `dim_employers.csv` (updated via `PUT /api/employer/profile`)
- **Why Important:** Ensures accurate employer data and allows employers to maintain their own information.

**Tab 2: SLU Alumni at Your Company**
- **Functionality:** View verified SLU alumni employees
- **Data Source:** `GET /api/employer/my-alumni-employees`
- **Displays:**
  - Summary KPIs: Verified count, programs represented, locations represented
  - Grid of alumni cards with photos, job titles, programs, graduation years, locations
  - Filters: Graduation year, program, status
  - "Report Issue" button on each card for data corrections
- **Why Important:** 
  - Helps employers understand their SLU talent pool
  - Facilitates internal networking among SLU alumni
  - Allows employers to report data issues

**Tab 3: SLU Hiring & Engagement Events**
- **Functionality:** View available events and request participation
- **Sections:**
  - **Available Events:** Table of upcoming events with "Request to Participate" button
  - **My Event Participation:** Table of employer's event participations with status (requested/approved/completed)
  - **Filters:** All/Upcoming/Past events
- **Data Storage:** `employer_event_participation.csv`
- **Why Important:** Streamlines event participation requests and allows employers to track their SLU event involvement.

**Tab 4: Alumni Technical Feedback**
- **Functionality:** Submit feedback on SLU alumni technical skills
- **Form Fields:** Overall rating (1-5), comment, technical strength level, technologies, job role, graduation year
- **Data Storage:** `employer_alumni_feedback.csv`
- **Feedback History:** Table showing previously submitted feedback
- **Why Important:** 
  - Provides valuable curriculum feedback to SLU
  - Helps identify strengths and weaknesses in alumni technical preparation
  - Feeds into "Technical Strength by Graduation Year" visualization on Employer Dashboard

---

### 2.5 Admin Console (`/admin`)
**Access:** Admin role only

**Purpose:** Centralized data management interface for SLU administrators to manage all data tables, review submissions, and upload images.

**Functional Flow:**
1. Admin logs in → JWT contains `role: 'admin'`
2. Console loads → Fetches all admin tables via `GET /api/admin/tables`
3. Admin performs CRUD operations → POST/PUT/DELETE to `/api/admin/tables/*`
4. Data persists to CSV files in `public/` or `server/data/`

**Page Structure:**

**A. Data Tables Tab**
- **Functionality:** CRUD interface for all dimension and fact tables
- **Tables:**
  - Students (`Dim_Students.csv`)
  - Employers (`dim_employers.csv`)
  - Contacts (`dim_contact.csv`)
  - Events (`dim_event.csv`)
  - Dates (`dim_date.csv`)
  - Alumni Engagement Facts (`fact_alumni_engagement.csv`)
- **Features:**
  - Create, Read, Update, Delete operations
  - Primary key validation
  - Schema validation
  - CSV persistence
- **Why Important:** Allows admins to maintain data quality and update information as needed.

**B. Image Library Tab**
- **Functionality:** Upload and manage images by category
- **Categories:** Alumni, Employers, Hero, Gallery, Events
- **Features:**
  - Upload images with category selection
  - Delete images
  - View uploaded images with URLs
- **Data Storage:** `public/assets/<category>/`
- **Why Important:** Centralized image management for use across the application.

**C. Alumni Submissions Tab**
- **Functionality:** Review and manage alumni submissions
- **Sections:**
  1. **Event Applications:** Review and approve/reject event applications
  2. **Success Stories:** Review and approve/reject success stories for publication
  3. **Engagement Feedback:** View feedback notes from engagement participation
- **Data Sources:**
  - `server/data/event_applications.csv`
  - `server/data/success_stories.csv`
  - `server/data/engagement_feedback.csv`
- **Features:**
  - Filter by status (pending/approved/rejected)
  - Update status via `PUT /api/admin/alumni-submissions/:type/:id`
  - View submission details
- **Why Important:** Ensures quality control for alumni-submitted content and manages event capacity.

---

### 2.6 Community & Support Pages

#### 2.6.1 Gallery (`/gallery`)
- **Purpose:** Showcase SLU alumni, employer partnerships, and events through images
- **Functionality:** Filterable image grid with categories
- **Data Source:** `GALLERY_ITEMS` array in component
- **Why Important:** Visual storytelling that strengthens SLU brand and community connection.

#### 2.6.2 Events (`/events`)
- **Purpose:** Display upcoming SLU events
- **Functionality:** Lists events from `dim_event.csv` with filters (audience type, event type)
- **Features:** Event inquiry form for non-authenticated users
- **Why Important:** Promotes events and captures interest from potential participants.

#### 2.6.3 Contact (`/contact`)
- **Purpose:** General inquiry submission
- **Functionality:** Contact form that stores inquiries in `server/data/event_inquiries.csv`
- **Why Important:** Captures general inquiries and provides a contact channel.

---

### 2.7 Navigation & Role Visibility
| Nav Group | Route | Visible To | Description |
| --------- | ----- | ---------- | ----------- |
| **Home** | `/` | Public | Landing page with hero, mission, quick links |
| **Dashboards → Alumni Dashboard** | `/alumni` | Admin, Alumni | Complete alumni engagement analytics |
| **Dashboards → Employer Dashboard** | `/employer` | Admin, Employer | Complete employer partnership analytics |
| **Alumni → Alumni Portal** | `/alumni-portal` | Admin, Alumni | Event applications, engagement participation, success stories, network |
| **Employer → Employer Portal** | `/employer-portal` | Admin, Employer | Company profile, alumni employees, events, feedback |
| **Admin** | `/admin` | Admin | Data tables CRUD, image library, alumni submissions |

> Navigation items hide automatically when the signed-in role is not authorized. Attempting to hit a restricted route redirects to `/login`.

---

## 3. Analytics & Calculations

### 3.1 Data Sources
All CSVs reside under `datanexus-dashboard/public/`:
- `Dim_Students.csv` – Individual program data (degree, cohort, demographics, location)
- `dim_employers.csv` – Employer profiles with industry, location, size, ratings
- `dim_event.csv` – Events with categories, audiences, dates, locations
- `fact_alumni_engagement.csv` – Engagement facts (touchpoints, scores, conversions, hiring outcomes)
- `dim_date.csv` – Date dimension enabling time-series aggregation
- `dim_contact.csv` – Primary employer contacts
- `alumni_employment.csv` – Alumni employment records (employer, job title, location, status)
- `employer_alumni_feedback.csv` – Employer feedback on alumni technical skills

### 3.2 Alumni Dashboard - Complete Analytics Breakdown

#### 3.2.1 KPI Cards - Detailed Calculations

**1. Total Alumni**
- **Function:** `calculateTotalAlumni(students)`
- **Formula:** `COUNT(DISTINCT student_key) FROM Dim_Students.csv`
- **Data Source:** `Dim_Students.csv`
- **Calculation Logic:**
  ```javascript
  const distinctStudents = new Set(students.map(s => String(s.student_key || s.student_id)));
  return distinctStudents.size;
  ```
- **Why Displayed:** Provides the baseline population for all engagement calculations. Without knowing total alumni, engagement rates are meaningless.
- **Importance to SLU Admins:**
  - **Strategic Planning:** "We have 1,000 alumni, so we need to engage at least 500 to reach 50% engagement rate."
  - **Resource Allocation:** "With 1,000 alumni, we need X staff members to maintain relationships."
  - **Growth Tracking:** "Total alumni grew from 800 to 1,000 this year - we're expanding our network."

**2. Engaged Alumni**
- **Function:** `calculateEngagedAlumni(students, alumniEngagement)`
- **Formula:** `COUNT(DISTINCT student_key) FROM fact_alumni_engagement.csv WHERE student_key IS NOT NULL`
- **Data Source:** `fact_alumni_engagement.csv`
- **Calculation Logic:**
  ```javascript
  const engagedStudentIds = new Set();
  alumniEngagement.forEach(engagement => {
    const studentId = String(engagement.student_key || engagement.student_id);
    if (studentId && studentId !== 'undefined' && studentId !== 'null') {
      engagedStudentIds.add(studentId);
    }
  });
  return engagedStudentIds.size;
  ```
- **Why Displayed:** Shows the actual number of alumni who have participated in at least one SLU activity. This is the numerator for engagement rate.
- **Importance to SLU Admins:**
  - **Engagement Health:** "400 out of 1,000 alumni are engaged - we have 600 alumni to reach out to."
  - **Outreach Planning:** "We need to engage 100 more alumni to reach our 50% target."
  - **Success Measurement:** "Engaged alumni increased from 350 to 400 this quarter - our outreach is working."

**3. Engagement Rate**
- **Function:** `calculateEngagementRate(engagedAlumniCount, totalAlumni)`
- **Formula:** `(engagedAlumni / totalAlumni) × 100`, capped at 100%, rounded to whole number
- **Data Sources:** Results from `calculateEngagedAlumni()` and `calculateTotalAlumni()`
- **Calculation Logic:**
  ```javascript
  if (!totalAlumni || totalAlumni === 0) return 0;
  const rate = (engagedAlumni / totalAlumni) * 100;
  return Math.round(Math.min(100, rate));
  ```
- **Why Displayed:** Provides a single percentage metric that summarizes overall engagement health. Easy to communicate to stakeholders.
- **Importance to SLU Admins:**
  - **Goal Setting:** "Our engagement rate is 40%. Our goal is 50%, so we need to engage 100 more alumni."
  - **Benchmarking:** "Industry average is 35%, so we're above average at 40%."
  - **Progress Tracking:** "Engagement rate improved from 35% to 40% this year - we're on track."

**4. Avg Engagement Touchpoints**
- **Function:** `calculateAvgTouchpoints(alumniEngagement, engagedAlumniCount)`
- **Formula:** `total_engagement_records / engaged_alumni_count`
- **Data Source:** `fact_alumni_engagement.csv`
- **Calculation Logic:**
  ```javascript
  const totalRecords = alumniEngagement.length;
  return Number((totalRecords / engagedAlumniCount).toFixed(1));
  ```
- **Why Displayed:** Measures engagement depth. High average = highly active alumni, low average = one-time participants.
- **Importance to SLU Admins:**
  - **Engagement Quality:** "Average touchpoints is 1.9, meaning most engaged alumni interact twice. We should encourage repeat engagement."
  - **Program Effectiveness:** "If average touchpoints increases, our programs are creating repeat engagement."
  - **Resource Planning:** "Alumni with 5+ touchpoints are our champions - we should invest more in them."

#### 3.2.2 Visualizations - Detailed Calculations

**1. Alumni Engagement Trend (Line Chart)**
- **Function:** `getEngagementTrendByMonth(alumniEngagement, dates)`
- **Formula:**
  - Group `fact_alumni_engagement.csv` by month using `event_date_key` joined with `dim_date.csv`
  - For each month:
    - `engagedAlumni` = `COUNT(DISTINCT student_key)`
    - `totalTouchpoints` = `COUNT(*)` (total engagement records)
- **Data Sources:** `fact_alumni_engagement.csv`, `dim_date.csv`
- **Calculation Logic:**
  ```javascript
  // Create date lookup
  const dateLookup = createLookup(dates, 'date_key');
  
  // Group by month
  const monthlyData = {};
  alumniEngagement.forEach(engagement => {
    const dateKey = String(engagement.event_date_key);
    const dateInfo = dateLookup[dateKey];
    const monthKey = `${dateInfo.year}-${dateInfo.month.padStart(2, '0')}`;
    const monthLabel = `${dateInfo.month_name.substring(0, 3)} ${dateInfo.year}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        monthLabel,
        engagedAlumni: new Set(),
        totalTouchpoints: 0
      };
    }
    monthlyData[monthKey].engagedAlumni.add(engagement.student_key);
    monthlyData[monthKey].totalTouchpoints += 1;
  });
  ```
- **Why Displayed:** Reveals seasonal patterns, growth trends, and identifies peak/low engagement months.
- **Importance to SLU Admins:**
  - **Event Planning:** "Engagement peaks in September and March. We should schedule major events during these months."
  - **Trend Analysis:** "Engagement is trending upward - our programs are working."
  - **Anomaly Detection:** "Engagement dropped in June - we should investigate why."

**2. Engaged Alumni by Program (Horizontal Bar Chart)**
- **Function:** `getEngagementByProgram(students, alumniEngagement)`
- **Formula:**
  - Join `fact_alumni_engagement.csv` with `Dim_Students.csv` on `student_key`
  - Group by `program_name`
  - Count distinct `student_key` per program
- **Data Sources:** `fact_alumni_engagement.csv`, `Dim_Students.csv`
- **Calculation Logic:**
  ```javascript
  const studentLookup = createLookup(students, 'student_key');
  const programStats = {};
  
  alumniEngagement.forEach(engagement => {
    const studentId = getStudentId(engagement);
    const student = studentLookup[studentId];
    const program = student.program_name || student.major || 'Unknown';
    
    if (!programStats[program]) {
      programStats[program] = new Set();
    }
    programStats[program].add(studentId);
  });
  
  // Return top 10 programs by engaged alumni count
  ```
- **Why Displayed:** Identifies which programs produce the most engaged alumni.
- **Importance to SLU Admins:**
  - **Program Assessment:** "MS Information Systems has 150 engaged alumni, while MS Statistics has only 20. We should investigate why Statistics alumni are less engaged."
  - **Resource Allocation:** "Programs with high engagement may need more support for events and networking."
  - **Best Practices:** "We can learn from highly-engaged programs and apply those strategies to others."

**3. Engagement by Type (Grouped Bar Chart)**
- **Function:** `getEngagementByType(alumniEngagement)`
- **Formula:**
  - Group `fact_alumni_engagement.csv` by `engagement_type` (or derived from flags)
  - For each type:
    - `totalEngagements` = `COUNT(*)`
    - `engagedAlumni` = `COUNT(DISTINCT student_key)`
- **Data Source:** `fact_alumni_engagement.csv`
- **Calculation Logic:**
  ```javascript
  const typeStats = {};
  alumniEngagement.forEach(engagement => {
    const engagementType = engagement.engagement_type || 
                          (engagement.participated_university_event_flag === '1' ? 'University Event' : 'Other');
    const type = engagementType || 'Other';
    const studentId = getStudentId(engagement);
    
    if (!typeStats[type]) {
      typeStats[type] = {
        totalEngagements: 0,
        engagedAlumni: new Set()
      };
    }
    typeStats[type].totalEngagements += 1;
    typeStats[type].engagedAlumni.add(studentId);
  });
  ```
- **Why Displayed:** Shows which engagement channels are most popular.
- **Importance to SLU Admins:**
  - **Channel Optimization:** "Events have 500 engagements, while mentorship has only 50. We should promote mentorship programs more."
  - **Resource Allocation:** "Invest more in popular engagement types."
  - **Program Development:** "Alumni prefer events over other types - we should expand our event offerings."

**4. Alumni Engagement by Location (Map Visualization)**
- **Function:** `getEngagedAlumniByLocation(students, alumniEngagement)`
- **Formula:**
  - Get distinct engaged `student_key` values from `fact_alumni_engagement.csv`
  - Join with `Dim_Students.csv` to get location (`current_city`, `country_of_origin`, or `state`)
  - Group by location and count distinct alumni
- **Data Sources:** `fact_alumni_engagement.csv`, `Dim_Students.csv`
- **Calculation Logic:**
  ```javascript
  // Get distinct engaged student IDs
  const engagedStudentIds = new Set();
  alumniEngagement.forEach(engagement => {
    const studentId = getStudentId(engagement);
    if (studentId) engagedStudentIds.add(studentId);
  });
  
  // Group by location
  const locationStats = {};
  engagedStudentIds.forEach(studentId => {
    const student = studentLookup[studentId];
    const location = student.current_city || student.country_of_origin || student.state || 'Unknown';
    // Normalize and count...
  });
  ```
- **Why Displayed:** Shows geographic distribution of engaged alumni.
- **Importance to SLU Admins:**
  - **Regional Planning:** "Missouri has 200 engaged alumni, California has 150. We should host a West Coast event."
  - **Outreach Strategy:** "Identify geographic gaps and target outreach to underrepresented regions."
  - **Networking:** "Plan regional networking events in high-engagement areas."

**5. Engagement by Graduation Cohort (Bar Chart)**
- **Function:** `getEngagementByGraduationCohort(students, alumniEngagement)`
- **Formula:**
  - Get distinct engaged `student_key` values
  - Join with `Dim_Students.csv` to get `graduation_year`
  - Group by `graduation_year` and count distinct alumni
- **Data Sources:** `fact_alumni_engagement.csv`, `Dim_Students.csv`
- **Calculation Logic:**
  ```javascript
  const cohortStats = {};
  engagedStudentIds.forEach(studentId => {
    const student = studentLookup[studentId];
    const year = String(student.graduation_year || 'Unknown');
    if (!cohortStats[year]) {
      cohortStats[year] = new Set();
    }
    cohortStats[year].add(studentId);
  });
  ```
- **Why Displayed:** Reveals which graduating classes are most/least engaged.
- **Importance to SLU Admins:**
  - **Cohort Analysis:** "2024 graduates have 80 engaged alumni, while 2020 graduates have only 30. Recent graduates are more engaged."
  - **Retention Strategy:** "Create programs to maintain engagement as alumni age."
  - **Re-engagement:** "Identify cohorts that need re-engagement campaigns."

**6. Top Engaged Alumni (Table)**
- **Function:** `getTopEngagedAlumni(students, alumniEngagement, 10)`
- **Formula:**
  - Group `fact_alumni_engagement.csv` by `student_key`
  - For each alumni:
    - `engagementCount` = `COUNT(*)`
    - `totalMinutes` = `SUM(mentorship_hours × 60)`
  - Join with `Dim_Students.csv` for name and program
  - Sort by `engagementCount` descending, take top 10
- **Data Sources:** `fact_alumni_engagement.csv`, `Dim_Students.csv`
- **Calculation Logic:**
  ```javascript
  const alumniStats = {};
  alumniEngagement.forEach(engagement => {
    const studentId = getStudentId(engagement);
    const student = studentLookup[studentId];
    
    if (!alumniStats[studentId]) {
      alumniStats[studentId] = {
        studentId,
        name: `${student.first_name} ${student.last_name}`,
        program: student.program_name,
        engagementCount: 0,
        totalMinutes: 0
      };
    }
    alumniStats[studentId].engagementCount += 1;
    alumniStats[studentId].totalMinutes += parseFloat(engagement.mentorship_hours || 0) * 60;
  });
  
  return Object.values(alumniStats)
    .sort((a, b) => b.engagementCount - a.engagementCount)
    .slice(0, 10);
  ```
- **Why Displayed:** Identifies alumni champions who can serve as ambassadors.
- **Importance to SLU Admins:**
  - **Ambassador Program:** "John Doe has 25 engagement touchpoints. We should invite him to be an alumni ambassador."
  - **Mentorship:** "Top engaged alumni can mentor others and help with outreach."
  - **Fundraising:** "Highly engaged alumni are more likely to donate - we should prioritize relationship building with them."

---

### 3.3 Employer Dashboard - Complete Analytics Breakdown

#### 3.3.1 KPI Cards - Detailed Calculations

**1. Active Employers**
- **Function:** `calculateActiveEmployers(employers, alumniEngagement)`
- **Data Sources:** `fact_alumni_engagement.csv`
- **Formula:** `COUNT(DISTINCT employer_key) WHERE employer_key IS NOT NULL AND employer_key IN fact_alumni_engagement`
- **Calculation Method:** Distinct count of `employer_key` from engagement records where employer has at least one engagement record
- **Why Displayed:** Shows the number of employers actively engaging with SLU.
- **Importance to SLU Admins:**
  - **Partnership Breadth:** "We have 50 active employers. Our goal is 75, so we need to engage 25 more companies."
  - **Growth Tracking:** "Active employers increased from 40 to 50 this year - our outreach is working."

**2. Avg Employer Rating**
- **Function:** `calculateAvgEmployerRating(employers)`
- **Data Sources:** `dim_employers.csv`
- **Formula:** `AVG(employer_rating) WHERE employer_rating IS NOT NULL AND employer_rating > 0`
- **Calculation Method:** Mean of `employer_rating` field, filtered for valid ratings (> 0)
- **Why Displayed:** Measures employer satisfaction with SLU partnership.
- **Importance to SLU Admins:**
  - **Relationship Health:** "Average rating is 4.2/5.0, which is good. We should maintain this level."
  - **Issue Identification:** "Employers with ratings below 3.0 may have issues - we should address them."

**3. Hiring Conversion Rate**
- **Function:** `calculateHiringConversionRate(alumniEngagement)`
- **Data Sources:** `fact_alumni_engagement.csv`
- **Formula:** `(total_hires / total_opportunities) × 100`
  - `total_hires` = `COUNT(*) WHERE hired_flag = '1'`
  - `total_opportunities` = `COUNT(*) WHERE job_offers_count > 0 OR applications_submitted > 0`
- **Calculation Method:** Count engagement records where `hired_flag = '1'` divided by count where `job_offers_count > 0` OR `applications_submitted > 0`, multiplied by 100
- **Why Displayed:** Measures how effectively job opportunities convert to actual hires.
- **Importance to SLU Admins:**
  - **Pipeline Efficiency:** "Conversion rate is 35%. This means 35 out of 100 opportunities result in hires."
  - **Improvement Areas:** "Low conversion rates may indicate issues with candidate quality or employer expectations."

**4. Avg Engagement Score**
- **Function:** `calculateEmployerEngagementScores(employers, alumniEngagement)` then averaged
- **Data Sources:** `fact_alumni_engagement.csv`, `dim_employers.csv`
- **Formula:** `AVG((eventsCount × 1) + (studentsInteracted × 0.5) + (hires × 2))`
  - `eventsCount` = Distinct count of `event_key` per employer
  - `studentsInteracted` = Distinct count of `student_key` per employer
  - `hires` = Count where `hired_flag = '1'` per employer
- **Calculation Method:** Calculate composite score per employer using the formula, then average across all active employers
- **Why Displayed:** Provides a single metric to measure overall employer engagement quality.
- **Importance to SLU Admins:**
  - **Partnership Quality:** "Average engagement score is 12.5. Employers with scores above 15 are our top partners."
  - **Resource Allocation:** "Prioritize maintaining relationships with high-scoring employers."

**5. Alumni Employed at Partners**
- **Function:** `getAlumniEmployedAtPartners(alumniEmployment)`
- **Data Sources:** `alumni_employment.csv`
- **Formula:** `COUNT(DISTINCT student_key) WHERE status = 'Verified'`
- **Calculation Method:** Distinct count of `student_key` from employment records where `status = 'Verified'`
- **Why Displayed:** Total number of verified SLU alumni currently employed at partner organizations.
- **Importance to SLU Admins:**
  - **Employment Outcomes:** "We have 150 alumni employed at partner organizations, demonstrating real-world career success."
  - **Partnership Value:** "High employment counts validate the value of our employer partnerships."

**6. Employers with Recent Feedback**
- **Function:** `getEmployersWithRecentFeedback(employerFeedback)`
- **Data Sources:** `employer_alumni_feedback.csv`
- **Formula:** `COUNT(DISTINCT employer_key) WHERE approved_by_admin = '1' OR created_at >= (NOW() - 6 months)`
- **Calculation Method:** Distinct count of `employer_key` where feedback is approved OR created within last 6 months
- **Why Displayed:** Number of employers providing feedback in the last 6 months, indicating active communication.
- **Importance to SLU Admins:**
  - **Communication Health:** "25 employers provided feedback recently, showing active engagement."
  - **Relationship Maintenance:** "Employers with recent feedback are actively communicating with SLU."

#### 3.3.2 Visualizations - Detailed Calculations

**1. Employer Participation Trend (Line Chart)**
- **Function:** `calculateEmployerParticipationTrend(alumniEngagement, dates)`
- **Data Sources:** `fact_alumni_engagement.csv`, `dim_date.csv`
- **Calculation Method:**
  - Group engagement records by month using `event_date_key` joined with `dim_date` to extract year and month
  - **Active Employers:** Distinct count of `employer_key` per month
  - **Total Events:** Distinct count of `event_key` per month
- **Formula:**
  - `activeEmployers` = `COUNT(DISTINCT employer_key) GROUP BY month`
  - `totalEvents` = `COUNT(DISTINCT event_key) GROUP BY month`
- **Why Displayed:** Tracks employer engagement trends over time, showing both breadth (active employers) and depth (total events).
- **Importance to SLU Admins:**
  - **Trend Analysis:** "Active employers increased from 30 to 50 over the past year - our outreach is working."
  - **Seasonal Patterns:** "Participation peaks in spring and fall - we should plan major events during these periods."

**2. Job Opportunities vs Hires (Bar Chart)**
- **Function:** `calculateOpportunitiesVsHires(alumniEngagement, dates)`
- **Data Sources:** `fact_alumni_engagement.csv`, `dim_date.csv`
- **Calculation Method:**
  - Monthly aggregation using `hire_date_key` or `event_date_key` joined with `dim_date`
  - **Opportunities:** Count of engagement records where `job_offers_count > 0` OR `applications_submitted > 0`, grouped by month
  - **Hires:** Count of engagement records where `hired_flag = '1'`, grouped by month
- **Formula:**
  - `opportunities` = `COUNT(*) WHERE (job_offers_count > 0 OR applications_submitted > 0) GROUP BY month`
  - `hires` = `COUNT(*) WHERE hired_flag = '1' GROUP BY month`
- **Why Displayed:** Shows the hiring funnel efficiency month-over-month, revealing conversion patterns.
- **Importance to SLU Admins:**
  - **Conversion Tracking:** "In March, we had 100 opportunities but only 30 hires. We need to improve candidate-employer matching."
  - **Bottleneck Identification:** "Large gaps between opportunities and hires may indicate issues with candidate quality or employer requirements."

**3. Industry Distribution (Pie Chart)**
- **Function:** `calculateIndustryDistribution(employers, alumniEngagement)`
- **Data Sources:** `dim_employers.csv`, `fact_alumni_engagement.csv`
- **Calculation Method:**
  - Filter active employers (those with engagement records), group by `industry` field from `dim_employers`
  - Count distinct `employer_key` per industry
  - Calculate percentage: (Industry Count / Total Active Employers) × 100
- **Formula:**
  - `count` = `COUNT(DISTINCT employer_key) GROUP BY industry`
  - `percent` = `(count / SUM(count)) × 100`
- **Why Displayed:** Reveals industry concentration, showing which sectors have the strongest SLU partnerships.
- **Importance to SLU Admins:**
  - **Sector Analysis:** "Technology leads with 25 active employers (40% of total). We should maintain and expand partnerships in this sector."
  - **Diversification:** "Healthcare has only 5 employers (8%). We should target healthcare companies for partnership development."

**4. Employer Engagement Scorecard (Horizontal Bar Chart)**
- **Function:** `getEngagementScorecardByEmployer(employerEngagementScores, 10)`
- **Data Sources:** `dim_employers.csv`, `fact_alumni_engagement.csv`
- **Calculation Method:**
  - Calculate engagement score per employer: `(eventsCount × 1) + (studentsInteracted × 0.5) + (hires × 2)`
  - **Events Count:** Distinct `event_key` per employer
  - **Students Interacted:** Distinct `student_key` per employer
  - **Hires:** Count where `hired_flag = '1'` per employer
  - Sort by engagement score descending, take top 10
- **Formula:** `engagementScore = (eventsCount × 1) + (studentsInteracted × 0.5) + (hires × 2)`
- **Why Displayed:** Ranks employers by overall engagement value, identifying top-performing partners.
- **Importance to SLU Admins:**
  - **Partnership Prioritization:** "Employer X has an engagement score of 25.5 - they're our top partner. We should prioritize maintaining this relationship."
  - **Resource Allocation:** "Top 10 employers by score warrant dedicated relationship management and expanded partnership opportunities."

**5. SLU Alumni Employed by Employer (Horizontal Bar Chart)**
- **Function:** `calculateAlumniEmployedPerEmployer(alumniEmployment, employers)`
- **Data Sources:** `alumni_employment.csv`, `dim_employers.csv`
- **Calculation Method:**
  - Filter employment records where `status = 'Verified'`
  - Join with `dim_employers` on `employer_key` to get employer name
  - Count distinct `student_key` per `employer_key`
  - Sort by count descending, take top 10
- **Formula:** `alumniCount = COUNT(DISTINCT student_key) WHERE status = 'Verified' GROUP BY employer_key`
- **Why Displayed:** Identifies employers who are major SLU talent destinations, showing real-world employment outcomes.
- **Importance to SLU Admins:**
  - **Partnership Value:** "Company X employs 25 SLU alumni. We should invite them to be a premier partner and feature them in career fairs."
  - **Career Guidance:** "These employers are proven destinations for SLU talent - we can use this data for student career guidance."

**6. Technical Strength by Graduation Year (Composed Chart)**
- **Function:** `calculateTechnicalStrengthByYear(employerFeedback)`
- **Data Sources:** `employer_alumni_feedback.csv`
- **Calculation Method:**
  - Filter valid ratings (1-5 scale) from `rating_overall` field
  - Group by `graduation_year`
  - Calculate average rating per year: `AVG(rating_overall) GROUP BY graduation_year`
  - Sort years chronologically
- **Formula:** `avgRating = AVG(rating_overall) WHERE rating_overall IS NOT NULL AND rating_overall > 0 GROUP BY graduation_year`
- **Why Displayed:** Provides insights into curriculum effectiveness over time, showing how employer perceptions of SLU talent have evolved.
- **Importance to SLU Admins:**
  - **Curriculum Validation:** "2024 graduates have an average rating of 4.5/5, while 2020 graduates have 3.8/5. Our curriculum improvements are working."
  - **Targeted Support:** "Cohorts with lower ratings may need additional support or curriculum adjustments."

**7. Overall Hiring Funnel (Horizontal Bar Chart)**
- **Function:** `calculateHiringFunnel(alumniEngagement)`
- **Data Sources:** `fact_alumni_engagement.csv`
- **Calculation Method:**
  - **Opportunities:** Count where `job_offers_count > 0` OR `applications_submitted > 0`
  - **Applications:** Sum of `applications_submitted` values
  - **Hires:** Count where `hired_flag = '1'`
  - **Application Rate:** (Applications / Opportunities) × 100
  - **Hire Rate:** (Hires / Applications) × 100
- **Formula:**
  - `opportunitiesCount` = `COUNT(*) WHERE job_offers_count > 0 OR applications_submitted > 0`
  - `applicationsCount` = `SUM(applications_submitted)`
  - `hiresCount` = `COUNT(*) WHERE hired_flag = '1'`
  - `applicationRate` = `(applicationsCount / opportunitiesCount) × 100`
  - `hireRate` = `(hiresCount / applicationsCount) × 100`
- **Why Displayed:** Shows the complete hiring pipeline efficiency from opportunities to applications to hires, with conversion metrics.
- **Importance to SLU Admins:**
  - **Pipeline Analysis:** "We have 500 opportunities, 300 applications (60% application rate), and 100 hires (33% hire rate)."
  - **Bottleneck Identification:** "Large gaps between stages reveal where the hiring process may need improvement (e.g., better job descriptions, candidate preparation, interview skills)."

**8. Top Hiring Employers (Table)**
- **Function:** `calculateTopHiringEmployers(employers, alumniEngagement)`
- **Data Sources:** `dim_employers.csv`, `fact_alumni_engagement.csv`
- **Calculation Method:**
  - Group engagement records by `employer_key`
  - Join with `dim_employers` to get employer name and industry
  - **Total Hires:** Count where `hired_flag = '1'` per employer
  - **Events Attended:** Distinct count of `event_key` per employer
  - **Engagement Score:** `(Events × 1) + (Students Interacted × 0.5) + (Hires × 2)`
  - Sort by `totalHires` descending, take top 10
- **Formula:**
  - `totalHires` = `COUNT(*) WHERE hired_flag = '1' GROUP BY employer_key`
  - `eventsAttended` = `COUNT(DISTINCT event_key) GROUP BY employer_key`
  - `engagementScore` = `(eventsAttended × 1) + (studentsInteracted × 0.5) + (totalHires × 2)`
- **Why Displayed:** Identifies top hiring partners with comprehensive metrics (hires, events, engagement score).
- **Importance to SLU Admins:**
  - **Partnership Management:** "Employer X has hired 15 alumni and attended 8 events. They're a top partner - we should prioritize relationship management."
  - **Career Fair Planning:** "These employers should be featured prominently in career fairs and networking events."

---

### 3.4 Metrics Calculation Utilities
- **Shared Utility File** (`src/utils/metrics.js`) – Centralized calculation functions for all dashboard metrics
  - Pure, reusable functions that accept raw data arrays and return calculated metrics
  - Helper functions: `createLookup()`, `getStudentId()` to reduce code duplication
  - All functions include clear documentation and admin-friendly explanations
  - Functions are optimized for performance using `useMemo` hooks in dashboard components

- **Alumni Prediction Utilities** (`src/utils/alumniPredictions.js`) – Relationship-focused predictions for SLU-alumni engagement
  - `getTopProgramsForGrowth()` – Identifies programs with engagement growth potential
  - `getTopRegionsForEvents()` – Finds geographic regions for strategic event planning
  - `getTopMentorshipAlumni()` – Identifies high-engagement alumni for mentorship opportunities
  - `getAtRiskCohorts()` – Finds cohorts needing outreach campaigns
  - `getEngagementForecast()` – Projects future engagement trends
  - `getAlumniSLUPredictions()` – Returns all 5 predictions in a single call

- **Employer Prediction Utilities** (`src/utils/employerPredictions.js`) – Relationship-focused predictions for SLU-employer partnerships
  - `getTopPartnerships()` – Identifies strongest employer partnerships
  - `getExpansionIndustries()` – Finds industries with expansion potential
  - `getEmployersReadyForHires()` – Identifies employers ready for more SLU hires
  - `getEventParticipationOpportunities()` – Finds event participation opportunities
  - `getPartnershipGrowthForecast()` – Projects future partnership growth
  - `getEmployerSLUPredictions()` – Returns all 5 predictions in a single call

- **Calculation Display System**
  - All calculation details are hidden by default to reduce visual clutter
  - Hover over "📊 Calculation & Data Source" titles to view detailed methods
  - Each visualization includes hover tooltips with:
    - Data sources (CSV files used)
    - Calculation method (step-by-step logic)
    - Formula (mathematical expression)
    - Display logic (how data is visualized)

### 3.5 Visualizations & Libraries
- **Recharts** – Primary charting library for all dashboards (line charts, bar charts, pie charts, composed charts)
- **Custom Components** – `ChartCard` standardizes layout, titles, heights, and caption areas
- **AlumniLocationMap** – Custom component for geographic visualization with color-coded intensity
- **Responsive Design** – All visualizations are responsive and work on mobile, tablet, and desktop

### 3.6 Star Schema & ERD
- DataNexus analytics follow a classic **star schema**:
  - **Fact Table:** `fact_alumni_engagement` capturing `student_key`, `employer_key`, `event_key`, `date_key`, `engagement_score`, `mentorship_hours`, `hired_flag`, `applications_submitted`, etc.
  - **Dimension Tables:**
    - `Dim_Students` (student demographics, program, degree level, cohort year, location)
    - `dim_employers` (industry, size, headquarters, hiring preferences, ratings)
    - `dim_event` (event category, audience type, location, modality)
    - `dim_date` (date attributes: day, week, month, quarter, academic term)
    - `dim_contact` (primary employer contacts, titles, relationship stage)
- **Relationships:** all dimensions connect to the fact table via surrogate keys (`*_key`)

---

## 4. Repository & Folder Structure
```
.
├── datanexus-dashboard/
│   ├── public/
│   │   ├── assets/
│   │   │   ├── alumni/          # Alumni photos
│   │   │   ├── employers/       # Employer logos and photos
│   │   │   ├── engagement/      # Engagement activity images
│   │   │   ├── events/          # Event photos
│   │   │   ├── hero/            # Hero slider images
│   │   │   ├── success-stories/  # Success story images
│   │   │   └── uploads/         # Admin-uploaded imagery
│   │   └── *.csv                # Dimensional + fact tables consumed by dashboards
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── AlumniLocationMap.jsx    # US map visualization
│   │   │   ├── ChartCard.jsx            # Standardized chart wrapper
│   │   │   ├── ChatBot.jsx              # Global AI assistant
│   │   │   ├── GalleryFooter.jsx        # Gallery page footer
│   │   │   ├── GalleryHoverTooltip.jsx  # Tooltip for gallery items
│   │   │   ├── HeroSlider.jsx           # Image carousel component
│   │   │   ├── InfoTooltip.jsx          # Hover tooltip for predictions
│   │   │   ├── InsightCard.jsx          # Small insight tiles
│   │   │   ├── KPICard.jsx              # KPI card component
│   │   │   ├── Navbar.jsx               # Navigation bar
│   │   │   ├── PageHero.jsx             # Hero section with slider
│   │   │   ├── ProtectedRoute.jsx       # Route protection wrapper
│   │   │   └── ReadyToExploreFooter.jsx # Home page footer
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # JWT storage and auth hooks
│   │   ├── pages/               # Main application pages
│   │   │   ├── Admin.jsx                # Admin console
│   │   │   ├── AlumniDashboard.jsx      # Alumni engagement analytics
│   │   │   ├── AlumniPortal.jsx         # Alumni portal
│   │   │   ├── Contact.jsx              # Contact/Connect page
│   │   │   ├── EmployerDashboard.jsx    # Employer engagement analytics
│   │   │   ├── EmployerPortal.jsx       # Employer portal
│   │   │   ├── GalleryPage.jsx          # Gallery showcase
│   │   │   ├── Home.jsx                 # Landing page
│   │   │   ├── Login.jsx                # Login page
│   │   │   └── Unauthorized.jsx         # Unauthorized access page
│   │   ├── services/            # API service helpers
│   │   │   ├── adminApi.js              # Admin API calls
│   │   │   ├── alumniApi.js             # Alumni API calls
│   │   │   ├── employerFeedbackApi.js   # Employer feedback API calls
│   │   │   └── requestsApi.js           # Submission management API calls
│   │   ├── utils/               # Utility functions
│   │   │   ├── alumniPredictions.js     # Alumni prediction calculations
│   │   │   ├── chatPermissions.js       # Chatbot permission logic
│   │   │   ├── constants.js             # Shared constants (CHART_COLORS, etc.)
│   │   │   ├── employerPredictions.js   # Employer prediction calculations
│   │   │   └── metrics.js               # Shared metric calculation functions
│   │   ├── data/
│   │   │   ├── galleryData.js           # Gallery data transformation
│   │   │   └── loadData.js              # CSV loading utilities
│   │   ├── hooks/
│   │   │   └── useChatBot.js            # Chatbot hook
│   │   ├── App.jsx              # Main app component with routing
│   │   └── main.jsx             # React entry point
│   ├── scripts/                 # Data generation utilities
│   │   ├── extendAllData.js     # Extend all CSV data
│   │   ├── extendData.js        # Extend specific CSV data
│   │   └── updateStudentGender.js # Update student gender distribution
│   ├── package.json             # Frontend dependencies
│   ├── vite.config.js           # Vite configuration
│   └── tailwind.config.js       # Tailwind CSS configuration
├── server/
│   ├── data/
│   │   ├── event_applications.csv       # Alumni event applications
│   │   ├── success_stories.csv          # Alumni success story submissions
│   │   ├── engagement_feedback.csv      # Engagement feedback notes
│   │   ├── employer_alumni_feedback.csv # Employer feedback on alumni
│   │   ├── employer_event_participation.csv # Employer event participation
│   │   ├── employer_job_postings.csv    # Employer job postings
│   │   ├── employer_success_stories.csv # Employer success stories
│   │   ├── alumni_employment.csv        # Alumni employment records
│   │   ├── connect_requests.csv         # Contact form submissions
│   │   └── users.json                   # Demo accounts with roles
│   ├── index.js                 # Express API, JWT auth, CSV CRUD, endpoints
│   └── package.json             # Backend dependencies
└── README.md                    # Project documentation
```

### 4.1 Removed/Unused Files
The following files have been removed during cleanup:
- `src/components/USChoropleth.jsx` - Unused map component
- `src/components/EmployerUSMap.jsx` - Unused map component
- `src/components/WorldMap.jsx` - Unused map component
- `src/components/InsightsPanel.jsx` - Unused insights component
- `src/components/FiltersPanel.jsx` - Unused filters component
- `src/components/AssistantChat.jsx` - Unused assistant component (replaced by ChatBot)
- `src/pages/Predictions/` - Unused prediction pages (not in routes)
- `src/utils/alumniImages.js` - Unused image utility
- `src/utils/employerImages.js` - Unused image utility
- `src/App.css` - Empty CSS file (using Tailwind only)
- `server/data/employer_alumni_feedback.xlsx` - Duplicate Excel file (using CSV)

---

## 5. Local Development

### Prerequisites
- Node.js 20+
- npm 10+
- Git

### 1. Install Dependencies
```bash
# Root tooling
npm install

# Backend API
cd server
npm install

# Frontend
cd ../datanexus-dashboard
npm install
```

### 2. Configure Environment Variables

**For GitHub Codespaces:**
1. **Install dependencies with legacy peer deps:**
   ```bash
   npm install --legacy-peer-deps
   cd server && npm install && cd ..
   ```
   > **Note:** `--legacy-peer-deps` is required because `react-simple-maps@3.0.0` doesn't officially support React 19 yet.

2. **Start the backend server first** (see Step 3 below)
3. **Make port 5002 Public:**
   - Go to "Ports" tab in Codespaces
   - Right-click port 5002 → "Change Port Visibility" → "Public"
   - This is **critical** for CORS to work
4. **Check the "Ports" tab** to see the forwarded backend URL
5. **Create `datanexus-dashboard/.env`** with the forwarded URL:
   ```
   VITE_API_BASE_URL=https://your-codespace-XXXX-5002.app.github.dev
   ```
   (Replace `your-codespace-XXXX-5002` with the actual URL shown in Codespaces Ports tab)
   
   **Example:**
   ```
   VITE_API_BASE_URL=https://zany-space-adventure-7vpjv4qvj7972wq5q-5002.app.github.dev
   ```

**For Local Development:**
Create `.env` files if you need to override defaults:
```
# server/.env (optional - defaults to 5002)
PORT=5002
JWT_SECRET=change-me
JWT_EXPIRY=4h

# datanexus-dashboard/.env
VITE_API_BASE_URL=http://localhost:5002
```
> Ports 5000/5001 can be occupied by macOS Control Center. The server defaults to 5002 if PORT is not set.

### 3. Start Servers

**For Local Development:**
```bash
# Terminal 1 – Express API
cd datanexus-dashboard/server
npm run dev  # Uses process.env.PORT or defaults to 5002

# Terminal 2 – Vite frontend
cd datanexus-dashboard
npm run dev  # Uses default port 5173
```

Visit the URL shown in your terminal or Codespaces "Ports" tab. The frontend reads `VITE_API_BASE_URL` for API calls.

### 4. Linting
```bash
cd datanexus-dashboard
npm run lint
```

---

## 6. Deployment Notes

### Frontend (Vite)
```bash
cd datanexus-dashboard
npm run build   # outputs to dist/
```
- Host on Netlify, Vercel, Azure Static Web Apps, etc.
- Build command: `npm run build`
- Publish directory: `datanexus-dashboard/dist`
- Environment: `VITE_API_BASE_URL=https://your-api-domain`

### Backend (Express API)
```bash
cd server
npm run start   # production start (node index.js)
```
- Render/Railway/Fly.io/Heroku friendly.
- Configure environment variables (`PORT`, `JWT_SECRET`, `JWT_EXPIRY`).
- Ensure persistent storage or migrate CSV persistence to a managed database if scaling beyond single instance.

### CORS
Limit allowed origins before going live:
```js
app.use(cors({ origin: ['https://app.datanexus.ai'] }));
```

---

## 8. Security, Roles & Credentials

### 7.1 Role Matrix
| Role | Description | Key Permissions |
| ---- | ----------- | ---------------- |
| **Admin** | DataNexus operations team | Access to all dashboards, admin console, image uploads, CSV CRUD, alumni/employer submissions management. |
| **Alumni** | Engaged alumni users | Alumni dashboard, alumni portal (event applications, engagement participation, success stories, network), gallery, events, contact. |
| **Employer** | Employer partners | Employer dashboard, employer portal (company profile, alumni employees, events, feedback), gallery, events, contact. |

### 7.2 Demo Login Accounts
Seeded credentials live in `server/data/users.json` for local testing:
| Role | Username | Password |
| ---- | -------- | -------- |
| Admin | `admin` | `admin123` |
| Alumni | `alumni` | `alumni123` |
| Employer | `employer` | `employer123` |

> Replace demo accounts and enable password hashing before deploying beyond sandbox environments.

---

## 9. Update History
| Date | Area | Summary |
| ---- | ---- | ------- |
| Week 1 | Project recovery | Restored React app styling, re-linked assets, fixed login errors. |
| Week 2 | Auth & API | Added JWT auth, protected routes, role-aware navigation, and initial inquiry persistence. |
| Week 9 | Security hardening | Replaced Excel persistence with CSV to remove the `xlsx` dependency flagged for high-severity vulnerabilities. |
| Week 13 | Dashboard Enhancement | Added 6 comprehensive visualizations to Alumni Dashboard: Engagement Trend, Program Analysis, Engagement Types, Location Map, Cohort Analysis, Top Alumni Table. |
| Week 13 | Employer Dashboard Enhancement | Added 8 visualizations: Participation Trend, Opportunities vs Hires, Alumni Employment, Industry Distribution, Engagement Scorecard, Technical Strength, Hiring Funnel, Top Employers. |
| Week 13 | Alumni Portal | Added new Alumni Portal (`/alumni-portal`) with event applications, engagement participation forms, success story submissions, and network features. |
| Week 13 | Employer Portal | Added new Employer Portal (`/employer-portal`) with company profile management, alumni employee viewing, event participation, and technical feedback submission. |
| Week 13 | Admin Submissions Management | Added "Alumni Submissions" tab in Admin Console to review, approve, and reject event applications and success stories. |
| Week 13 | Code Cleanup | Removed duplicate functions, consolidated helper patterns, improved code maintainability. |
| Week 13 | Documentation | Comprehensive README update with detailed analytics breakdown, functional flows, and admin use cases for every visual and card. |
| Week 13 | Final Cleanup | Removed unused components (USChoropleth, EmployerUSMap, WorldMap, InsightsPanel, FiltersPanel, AssistantChat), unused Predictions pages, unused utility files (alumniImages.js, employerImages.js), and duplicate/unnecessary files. Cleaned up unused imports and optimized code structure. |

---

## 10. Troubleshooting & FAQ
| Issue | Resolution |
| ----- | ---------- |
| `EADDRINUSE` on port 5000/5001 | Stop macOS Control Center (`lsof -i :5000`) or let the server use a different port (it defaults to 5002). |
| Application not running in Codespaces | Ensure both backend and frontend are started. Check the "Ports" tab for forwarded URLs. Set `VITE_API_BASE_URL` in `.env` to match the backend forwarded URL. |
| Images not appearing in gallery | Ensure the uploaded file sits in the correct `public/assets/<category>` folder and the gallery item references the `/assets/...` path. |
| CSV edits not persisting | Run the backend with write permissions; confirm the process user can modify files under `datanexus-dashboard/public`. |
| Login loop | Clear localStorage or delete the `datanexus-auth` key; verify the API host matches `VITE_API_BASE_URL`. |
| Alumni submissions not appearing in Admin Console | Ensure the backend server is running and has write permissions to `server/data/` directory. Check that CSV files are being created (event_applications.csv, success_stories.csv, engagement_feedback.csv). |
| Engagement participation not showing in dashboards | Engagement data is stored in `fact_alumni_engagement.csv`. View it in Admin Console under "Alumni Engagement Facts" table. The dashboard metrics are calculated from this table. |
| Location map showing "Unknown" | Check that `Dim_Students.csv` has `current_city` or `country_of_origin` fields populated. The location extraction tries multiple field names. |
| Metrics not calculating correctly | Verify that CSV files are properly formatted and contain the expected columns. Check browser console for errors. Ensure `src/utils/metrics.js` functions are receiving data correctly. |

---

## 11. Future Feature Roadmap (AI & ML)

| Theme | Description | Value to SLU |
| ----- | ----------- | ------------ |
| **AI Relationship Insights** | Extend the DataNexus Assistant with retrieval-augmented generation (RAG) so admins can ask conversational questions (e.g., 'Which employer cohorts show declining conversions?') and receive cited answers drawn from CSV data. | Gives leadership natural-language access to analytics, speeding up board briefings and operational triage. |
| **Predictive Engagement Modeling** | Replace heuristic predictions with lightweight regression/gradient-boosted models that forecast alumni engagement scores, employer participation probability, and event attendance. | Helps prioritize outreach to at-risk cohorts and quantify partnership impact with confidence intervals. |
| **Automated Success Signal Detection** | Use NLP + sentiment analysis on feedback and success stories to auto-tag technologies, competencies, and relationship strengths. Pair with CV tagging on gallery assets for a searchable 'relationship library.' | Accelerates marketing collateral creation and improves matching between employer needs and alumni skill sets. |
| **Adaptive Engagement Journeys** | Explore reinforcement learning / bandit approaches that recommend next-best actions (invite to mentor, highlight program, schedule check-in) based on longitudinal response data. | Delivers personalized experiences that increase retention while capturing new learning signals for SLU. |

> All AI/ML features will include governance guardrails: anonymization of personal data, opt-in consent, monitoring dashboards for model drift, and clear communication of prediction confidence.

---

## License
Private project. Distribution requires approval from Saint Louis University project stakeholders.
