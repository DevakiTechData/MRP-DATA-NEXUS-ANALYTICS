# DataNexus Dashboard - Functional Documentation

**Version:** 1.0  
**Last Updated:** November 2024  
**Project:** Saint Louis University (SLU) Alumni & Employer Engagement Analytics Platform

---

## Page 1: Overview & Purpose

### 1.1 What is DataNexus Dashboard?

DataNexus Dashboard is a comprehensive web-based analytics and engagement platform designed for Saint Louis University (SLU) to manage, track, and analyze relationships with alumni and employer partners. The platform provides real-time insights, predictive analytics, and interactive tools for fostering stronger connections between SLU, its alumni network, and corporate partners.

### 1.2 Core Objectives

- **Alumni Engagement Tracking**: Monitor and measure alumni participation in events, mentorship programs, and community activities
- **Employer Partnership Management**: Track employer relationships, hiring outcomes, and partnership strength
- **Data-Driven Decision Making**: Provide SLU administrators with actionable insights through visual dashboards and predictive analytics
- **Self-Service Portals**: Enable alumni and employers to manage their own profiles, submit feedback, and participate in SLU programs
- **Community Building**: Facilitate networking, success story sharing, and relationship building through interactive portals

### 1.3 Key Stakeholders

| Stakeholder | Role | Primary Use Cases |
|------------|------|-------------------|
| **SLU Administrators** | Platform managers | View dashboards, manage data, approve submissions, analyze trends |
| **Alumni** | Former students | Apply for events, share success stories, network with colleagues, update profiles |
| **Employers** | Corporate partners | Manage company profiles, provide feedback, participate in events, view SLU alumni at their company |

### 1.4 Technology Stack

- **Frontend**: React 19, Vite, TailwindCSS, Recharts, React Router
- **Backend**: Node.js, Express.js, JWT Authentication
- **Data Storage**: CSV files (star schema: fact and dimension tables)
- **Visualization**: Recharts, Plotly.js, React Simple Maps
- **Deployment**: GitHub Codespaces, Local Development

---

## Page 2: User Roles & Access Control

### 2.1 Authentication System

The platform uses JWT (JSON Web Tokens) for secure, role-based access control. Users must log in with credentials stored in `server/data/users.json`.

### 2.2 Role Definitions

#### **Admin Role**
**Purpose**: Full system access for SLU administrators

**Capabilities**:
- Access all dashboards (Alumni Engagement, Employer Engagement)
- View and manage all data tables through Admin Console
- Approve/reject alumni submissions (event applications, success stories, engagement feedback)
- Approve/reject employer submissions (event participation, alumni feedback)
- Manage image library (Events, Engagements, Alumni, Employers, Success Stories)
- Edit, update, and delete any record in the system
- View all analytics and predictive insights
- Access all portals (for testing/verification)

**Default Credentials**: `admin` / `admin123`

#### **Alumni Role**
**Purpose**: Self-service portal for SLU alumni

**Capabilities**:
- View personal profile and engagement statistics
- Apply for SLU events (career fairs, networking events, panels)
- Participate in engagement activities (mentorship, workshops, seminars)
- Share success stories (with admin approval)
- View network of colleagues at same company
- Update personal profile information
- View gallery of alumni achievements and employer partnerships
- Submit contact requests

**Restrictions**:
- Cannot view global dashboards or analytics
- Cannot see other alumni's personal data
- Cannot access admin functions

**Default Credentials**: `alumni` / `alumni123`

#### **Employer Role**
**Purpose**: Self-service portal for employer partners

**Capabilities**:
- Manage company profile (industry, headquarters, products, SLU relationship)
- View SLU alumni employed at their company
- Request participation in SLU events (career fairs, panels, mentorship)
- Submit technical feedback about SLU alumni (strengths, weaknesses, technologies)
- View event participation history
- View gallery of employer partnerships
- Submit contact requests

**Restrictions**:
- Cannot view global dashboards or analytics
- Cannot see other employers' data
- Cannot access admin functions

**Default Credentials**: `employer` / `employer123`

### 2.3 Navigation & Route Protection

Routes are protected based on user roles:
- `/dashboard/alumni` - Admin only
- `/dashboard/employer` - Admin only
- `/alumni-portal` - Alumni and Admin
- `/employer-portal` - Employer and Admin
- `/admin` - Admin only
- `/gallery` - All authenticated users
- `/contact` - All users (including guests)
- `/` (Home) - All users

---

## Page 3: Core Features & Functionality

### 3.1 Alumni Engagement Dashboard

**Access**: Admin only  
**Purpose**: Comprehensive analytics on alumni engagement with SLU

**Key Metrics (KPI Cards)**:
1. **Total Alumni**: Count of all alumni in the system
2. **Engaged Alumni**: Alumni who have participated in at least one engagement activity
3. **Engagement Rate**: Percentage of alumni who are engaged (capped at 100%)
4. **Average Touchpoints**: Average number of engagement interactions per engaged alumni
5. **Average Engagement Minutes**: Average time spent in engagement activities
6. **Highest Visa Status**: Most common visa status among alumni

**Visualizations**:
1. **Alumni Engagement Trend**: Line chart showing engagement over time (monthly)
2. **Engagement by Program/Degree**: Horizontal bar chart showing which programs are most engaged
3. **Engagement by Type**: Stacked bar chart showing distribution of engagement types (Events, Mentorship, Workshops, etc.)
4. **Alumni Engagement by Location**: US map showing geographic distribution of engaged alumni
5. **Top Engaged Alumni**: Table listing most active alumni with engagement scores
6. **Engagement by Graduation Cohort**: Bar chart showing engagement levels by graduation year

**Filters**: Program, Graduation Cohort, Location, Engagement Type, Year

**Predictive Insights**: 5 relationship-focused predictions including:
- Top Programs for Engagement Growth
- Alumni Job Roles Trends
- Technology Insights
- Gender Engagement Insights
- Engagement Trend Forecast

### 3.2 Employer Engagement Dashboard

**Access**: Admin only  
**Purpose**: Analytics on employer partnerships and hiring outcomes

**Key Metrics (KPI Cards)**:
1. **Active Employers**: Employers with recent engagement or hiring activity
2. **Average Employer Rating**: Average feedback rating from employers (1-5 scale)
3. **Hiring Conversion Rate**: Percentage of job opportunities that result in hires
4. **Average Engagement Score**: Composite score based on events, feedback, and hiring
5. **Alumni Employed at Partner Orgs**: Count of verified alumni at partner organizations
6. **Employers with Recent Feedback**: Employers who submitted feedback in last 6 months

**Visualizations**:
1. **Employer Participation Trend**: Line chart showing active employers and events over time
2. **Job Opportunities vs Hires**: Grouped bar chart comparing opportunities to actual hires
3. **Industry Distribution**: Pie chart showing distribution of employers by industry
4. **Employer Engagement Scorecard**: Bar chart ranking top employers by engagement score
5. **SLU Alumni Employed by Employer**: Horizontal bar chart showing top 10 employers by alumni count
6. **Technical Strength by Graduation Year**: Composed chart showing feedback ratings by year
7. **Overall Hiring Funnel**: Horizontal bars showing Opportunities → Applications → Hires conversion

**Filters**: Year, Industry, Location, Employer Size, Program/Cohort

**Predictive Insights**: 5 relationship-focused predictions including:
- Strongest Employer Partnerships
- Industries with Expansion Potential
- Employers Ready for More Hires
- Event Participation Opportunities
- Partnership Growth Forecast

### 3.3 Admin Console

**Access**: Admin only  
**Purpose**: Centralized data management interface

**Features**:
- **Data Tables Management**: View, edit, update, and delete records in all CSV data tables
- **Alumni Submissions**: Review and approve/reject:
  - Event applications
  - Success stories
  - Engagement feedback
- **Employer Submissions**: Review and approve/reject:
  - Event participation requests
  - Alumni technical feedback
- **Connect Requests**: Manage contact form submissions from all users
- **Image Library**: Upload and manage images by category (Events, Engagements, Alumni, Employers, Success Stories)
- **Real-time Updates**: Auto-refresh functionality to catch new submissions

**Actions Available**:
- Approve/Reject submissions
- Edit any field in any record
- Delete records (with confirmation)
- Filter and search across all tables

---

## Page 4: Portals & User Interactions

### 4.1 Alumni Portal

**Access**: Alumni and Admin  
**URL**: `/alumni-portal`

**Tab Structure**:

#### Tab 1: Alumni Profile
- View personal information (name, email, program, graduation year, current role, company)
- Edit profile fields (name, email, phone, location, program, graduation year)
- View engagement snapshot KPIs:
  - Events Attended
  - Upcoming Events
  - Events Registered
  - Colleagues (at same company)

#### Tab 2: Apply for Events
- Browse available SLU events (career fairs, networking events, panels)
- View event details (date, venue, location, description)
- Submit event application with:
  - Interest reason
  - Previous attendance history
  - Contact information
- View application status (Pending, Approved, Rejected)
- View approved event applications

#### Tab 3: Participate in Engagements
- Record engagement participation:
  - Engagement type (Mentorship, Workshop, Seminar, etc.)
  - Duration (minutes)
  - Mentorship hours
  - Feedback score (1-5)
  - Feedback notes
- View engagement benefits and impact

#### Tab 4: Share Success Story
- Submit success story with:
  - Story title and content
  - Current role and employer
  - Achievements
  - Photo upload
- View submitted stories and their approval status
- Delete own stories (if not approved)

#### Tab 5: My Network
- View own employment information
- See company details (logo, name, industry, headquarters)
- Browse colleagues at same company (other SLU alumni)
- View colleague profiles (name, role, program, graduation year, location)
- Connect with colleagues

#### Tab 6: My Requests
- View all submissions (event applications, success stories, engagement feedback)
- See status of each submission (Pending, Approved, Rejected)
- Delete own submissions

### 4.2 Employer Portal

**Access**: Employer and Admin  
**URL**: `/employer-portal`

**Tab Structure**:

#### Tab 1: Company Profile
- View company information (name, industry, headquarters, website, products, SLU relationship)
- Edit company profile fields
- View relationship snapshot KPIs:
  - SLU Alumni Employed
  - Events Participated
  - Pending Requests
  - Feedback Submitted

#### Tab 2: SLU Alumni at Your Company
- View verified SLU alumni employed at company
- See alumni summary statistics:
  - Verified SLU Alumni Count
  - Programs Represented
  - Locations Represented
- Browse alumni cards with:
  - Photo, name, job title
  - Program, graduation year
  - Mentor/Speaker badges
  - Report Issue button (for data corrections)

#### Tab 3: SLU Hiring & Engagement Events
- **Available Events**: Browse and request participation in upcoming events
- **My Event Participation**: View participation history with status (Requested, Approved, Rejected, Completed)
- Filter events by status (All, Upcoming, Past)
- View event statistics (Requested, Approved, Upcoming)

#### Tab 4: Alumni Technical Feedback
- Submit feedback form with:
  - Overall rating (1-5)
  - Comment/feedback
  - Technical strength level (Strong, Average, Needs Improvement)
  - Technologies (comma-separated)
  - Job role
  - Graduation year
- View previous feedback submissions in table format

#### Tab 5: My Requests
- View all employer submissions:
  - Event participation requests
  - Alumni technical feedback
- See status of each submission
- Delete own submissions

### 4.3 Gallery Page

**Access**: All authenticated users  
**URL**: `/gallery`

**Purpose**: Visual showcase of SLU community achievements and partnerships

**Sections**:
1. **SLU Partnership Employers**: Display approved employer feedback with company logos and testimonials
2. **Alumni Networking**: Showcase recent events (last 2 years, before Nov 2025) with event images
3. **Career Success Stories**: Display approved alumni success stories with photos and achievements

**Features**:
- Hover tooltips showing detailed information
- Image carousels and sliders
- Responsive grid layouts
- Privacy protection (no phone numbers or GPA displayed)

### 4.4 Contact Page

**Access**: All users (including guests)  
**URL**: `/contact`

**Purpose**: Unified contact form for all user types

**Features**:
- Left column: SLU information (address, phone, website, historical information)
- Right column: Contact form with:
  - Name, Email, Role (dropdown)
  - Organization, Subject, Message
- Form submissions stored in `connect_requests.csv`
- Admin can view and manage all contact requests

---

## Page 5: Data Flow & System Architecture

### 5.1 Data Storage Model

The platform uses a **star schema** data model with CSV files:

**Dimension Tables**:
- `Dim_Students.csv` - Alumni/student master data
- `dim_employers.csv` - Employer master data
- `dim_event.csv` - Event master data
- `dim_date.csv` - Date dimension for time-based analysis

**Fact Tables**:
- `fact_alumni_engagement.csv` - Alumni engagement transactions
- `alumni_employment.csv` - Employment records linking alumni to employers
- `employer_alumni_feedback.csv` - Employer feedback on alumni
- `event_applications.csv` - Alumni event applications
- `success_stories.csv` - Alumni success stories
- `engagement_feedback.csv` - Feedback on engagement activities
- `employer_event_participation.csv` - Employer event participation requests

**Supporting Tables**:
- `users.json` - User authentication credentials
- `connect_requests.csv` - Contact form submissions

### 5.2 Data Flow Patterns

#### Alumni Submission Flow:
1. Alumni submits form (event application, success story, engagement)
2. Data saved to respective CSV with `status: 'pending'`
3. Admin reviews submission in Admin Console
4. Admin approves/rejects (updates `status` field)
5. Approved submissions appear in:
   - Alumni Portal (for own submissions)
   - Gallery (for success stories)
   - Dashboards (for analytics)

#### Employer Submission Flow:
1. Employer submits form (event participation, feedback)
2. Data saved to respective CSV with `status: 'Requested'` or `approved_by_admin: '0'`
3. Admin reviews submission in Admin Console
4. Admin approves/rejects (updates status)
5. Approved submissions appear in:
   - Employer Portal (for own submissions)
   - Gallery (for feedback)
   - Dashboards (for analytics)

### 5.3 Calculation & Analytics Engine

**Location**: `src/utils/metrics.js`

**Functions**:
- `calculateTotalAlumni()` - Count distinct alumni
- `calculateEngagedAlumni()` - Count alumni with engagement records
- `calculateEngagementRate()` - Percentage calculation (capped at 100%)
- `calculateAvgTouchpoints()` - Average engagement interactions
- `getEngagementTrendByMonth()` - Time series aggregation
- `getEngagementByProgram()` - Program-wise grouping
- `getEngagedAlumniByLocation()` - Geographic aggregation
- `getTopEngagedAlumni()` - Ranking and sorting
- And 20+ more calculation functions

**Predictive Analytics**: `src/utils/alumniPredictions.js` and `src/utils/employerPredictions.js`
- Exponential smoothing for trend forecasting
- Cohort analysis for retention projections
- Growth potential calculations
- Risk identification algorithms

### 5.4 API Endpoints

**Authentication**:
- `POST /api/auth/login` - User login, returns JWT token

**Alumni Endpoints**:
- `GET /api/alumni/my-profile` - Get alumni profile and stats
- `PUT /api/alumni/profile` - Update alumni profile
- `GET /api/alumni/my-colleagues` - Get colleagues at same company
- `GET /api/alumni/my-submissions` - Get all alumni submissions
- `POST /api/alumni/event-application` - Submit event application
- `POST /api/alumni/engagement` - Submit engagement participation
- `POST /api/alumni/success-story` - Submit success story
- `DELETE /api/submissions/:type/:id` - Delete own submission

**Employer Endpoints**:
- `GET /api/employer/profile` - Get employer profile
- `PUT /api/employer/profile` - Update employer profile
- `GET /api/employer/my-alumni-employees` - Get alumni at company
- `GET /api/employer/events` - Get available events
- `POST /api/employer/event-participation` - Request event participation
- `GET /api/employer/my-events` - Get participation history
- `POST /api/employer/alumni-feedback` - Submit technical feedback
- `GET /api/employer/my-feedback` - Get own feedback submissions

**Admin Endpoints**:
- `GET /api/admin/*` - All data table CRUD operations
- `PATCH /api/admin/alumni-submissions/:type/:id` - Approve/reject alumni submissions
- `PATCH /api/admin/employer-event-participation/:id` - Approve/reject event participation
- `PATCH /api/admin/alumni-feedback/:id/approve` - Approve/reject employer feedback
- `GET /api/admin/connect-requests` - Get all contact requests
- `PUT /api/admin/connect-requests/:id` - Update contact request
- `DELETE /api/admin/connect-requests/:id` - Delete contact request

**Public Endpoints**:
- `POST /api/connect` - Submit contact form
- `GET /api/success-stories/approved` - Get approved success stories

### 5.5 Security Features

- **JWT Authentication**: All protected routes require valid JWT token
- **Role-Based Access Control**: Routes and API endpoints check user roles
- **Token Expiry**: JWT tokens expire after configured time (default: 2 hours)
- **CORS Protection**: Configured for specific origins (Codespaces or localhost)
- **Input Validation**: Server-side validation for all form submissions
- **CSV Injection Prevention**: Proper escaping of CSV values
- **File Upload Security**: Multer with filename sanitization

### 5.6 System Requirements

**Development**:
- Node.js 20+
- npm or yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)

**Deployment**:
- GitHub Codespaces (recommended for cloud development)
- Local development environment
- Production: Any Node.js hosting (Render, Railway, Fly.io, Heroku)

**Data Requirements**:
- CSV files in `server/data/` directory
- Proper CSV formatting with headers
- Consistent date formats (YYYY-MM-DD or ISO 8601)

---

## Conclusion

The DataNexus Dashboard provides a comprehensive solution for SLU to manage alumni and employer relationships through data-driven insights, self-service portals, and automated workflows. The platform balances administrative control with user autonomy, enabling efficient relationship management while fostering community engagement.

**For Technical Details**: See [README.md](README.md)  
**For Codespaces Setup**: See [CODESPACES_SETUP.md](CODESPACES_SETUP.md)  
**For Support**: Contact SLU IT Administration

---

*Document Version 1.0 - November 2024*

