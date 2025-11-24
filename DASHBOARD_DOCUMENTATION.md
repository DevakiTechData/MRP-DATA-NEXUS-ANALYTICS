# DataNexus Dashboards – Functional & Analytics Reference

**Last Updated:** November 2025  
**Primary Audience:** SLU analytics leads, dashboard maintainers, stakeholders preparing business reviews

---

## 1. Purpose & Access

| Dashboard | Route | Primary Roles | Mission |
|-----------|-------|---------------|---------|
| Alumni Engagement Dashboard | `/dashboard/alumni` | Admin (full), Alumni (view-only) | Provide a 360° view of alumni participation, cohort health, geography, and predictive guidance for engagement teams. |
| Employer Engagement Dashboard | `/dashboard/employer` | Admin (full), Employer (view-only) | Reveal hiring outcomes, partnership depth, and employer pipeline performance to guide corporate relations strategy. |

Both dashboards enforce JWT-based role authorization via `ProtectedRoute` and use shared data utilities in `src/utils/metrics.js`.

---

## 2. Alumni Engagement Dashboard

### 2.1 KPI Cards (Top Row)

| KPI | Data Source(s) | Calculation | Why it matters |
|-----|----------------|-------------|----------------|
| **Total Alumni** | `Dim_Students.csv` | `COUNT(DISTINCT student_key)` | Baseline population for engagement rate and cohort analysis. |
| **Engaged Alumni** | `fact_alumni_engagement.csv` + students | `COUNT(DISTINCT student_key IN engagement fact)` | Measures actual participation volume. |
| **Engagement Rate** | Derived | `(Engaged / Total) × 100`, capped at 100% | Single health metric tracked by SLU leadership. |
| **Avg Engagement Touchpoints** | Engagement fact | `total_engagement_records / engaged_alumni_count` | Indicates depth/quality of participation. |
| **Avg Engagement Minutes** | Engagement fact | `SUM(engagement_minutes) / engaged_alumni_count` | Shows time commitment per engaged alumnus. |
| **Highest Visa Status KPI** | `Dim_Students.csv` | Mode of `visa_status` + count | Used for compliance & international outreach planning. |

> Tooltip on each card explains formula, data files, and admin interpretation.

### 2.2 Visual Layout

| Row | Visualization | Key Metrics | Decision Impact |
|-----|---------------|-------------|-----------------|
| **Row 1** | Alumni Engagement Trend (dual line) | Monthly engaged count, touchpoints | Seasonality, campaign effectiveness |
| | Engaged Alumni by Program (horizontal bars) | Distinct engaged per program | Resource prioritization for low-performing programs |
| **Row 2** | Engagement by Type (stacked bars) | Participation + unique alumni per type | Channel preference; informs event mix |
| | Alumni Engagement by Location (US map) | State-level engaged counts | Regional event planning, alumni chapters |
| **Row 3** | Cohort Engagement (vertical bars) | Engagement by graduation year | Retention, alumni life-cycle tracking |
| | Top Engaged Alumni (table) | Touchpoints, minutes, program | Identify champions for ambassador roles |

All visuals reuse `ChartCard` with hover-to-reveal calculation panels for auditability.

### 2.3 Predictive Insights (Hover-revealed)

1. **Top Programs for Engagement Growth** – Program-level engagement rate gaps.
2. **Alumni Job Roles** – Most common verified job titles.
3. **Technology Insights** – Frequency + average rating per technology from employer feedback.
4. **Gender Engagement Insights** – Engagement rate by gender.
5. **Engagement Trend Forecast** – 90-day projection using last 6 months momentum.

Each tile includes:
- Data sources
- Calculation method (e.g., moving average + growth delta)
- Admin recommendation phrased in plain language.

### 2.4 Analysis Summary Block

Concludes page with:
- Narrative on engagement momentum, program mix, geographic reach
- Action bullet points for outreach, content, or partnership teams
- Link back to admin submission queues for immediate follow-up

---

## 3. Employer Engagement Dashboard

### 3.1 KPI Cards

| KPI | Data Source(s) | Calculation | Business Signal |
|-----|----------------|-------------|-----------------|
| **Active Employers** | `fact_alumni_engagement.csv` | Distinct `employer_key` with recent engagement | Partnership breadth |
| **Avg Employer Rating** | `dim_employers.csv` | Mean of `employer_rating` | Satisfaction with SLU |
| **Hiring Conversion Rate** | Engagement fact | `(total_hires / total_opportunities) × 100` | Hiring funnel efficiency |
| **Avg Engagement Score** | Derived composite | `(events ×1) + (students ×0.5) + (hires ×2)` | Depth of relationship |
| **Alumni Employed at Partner Orgs** | `alumni_employment.csv` | Count of verified alumni by employer | Talent footprint |
| **Employers with Recent Feedback** | `employer_alumni_feedback.csv` | Count in last 6 months | Feedback freshness, relationship health |

### 3.2 Visual Layout

| Row | Visualization | Highlights |
|-----|---------------|-----------|
| **Row 1 – Trend & Pipeline** | Employer Participation Trend (line) | Tracks active employers + total events per month. |
| | Job Opportunities vs Hires (grouped bars) | Compares pipeline to actual hires monthly. |
| **Row 2 – Distribution & Scorecard** | Alumni Employed per Employer (horizontal bars) | Top 10 employers by alumni count. |
| | Industry Distribution (pie) | Share of active employers per industry. |
| **Row 3 – Engagement & Skills** | Employer Engagement Scorecard (bars) | Weighted score per employer. |
| | Technical Strength by Graduation Year (composed) | Feedback trend on alumni quality. |
| **Row 4 – Funnel & Detail** | Overall Hiring Funnel (horizontal bars) | Opportunities → Applications → Hires + conversion rates. |
| | Top Hiring Employers (table) | Rank, hires, industry, engagement score. |

### 3.3 Predictive Insights

1. **Strongest Employer Partnerships** – Composite of hires, events, feedback.
2. **Industries with Expansion Potential** – High growth vs low representation.
3. **Employers Ready for More Hires** – Based on high engagement + capacity.
4. **Event Participation Opportunities** – Employers with pending approvals or low participation.
5. **Employer-SLU Relationship Predictions** – Summary text ready for executive briefings (hover reveals method).

### 3.4 Analysis Summary

Includes:
- Key wins (e.g., industries growing fastest)
- Risks (declining engagement, low conversion segments)
- Recommended next steps (targeted outreach, new event formats)

---

## 4. Shared Design & Technical Considerations

- **Data Pipeline:** Frontend loads CSVs via `loadData.js`. All calculations happen client-side to keep deployments static-friendly.
- **Utility Layer:** `src/utils/metrics.js` houses pure functions for reuse across dashboards, chat assistant, and admin reports.
- **Theming:** Tailwind gradient theme (SLU blues) with consistent card sizes, value labels on charts, and dark tooltips.
- **Accessibility:** High-contrast colors, descriptive titles/subtitles, keyboard navigable cards.
- **Explainability:** “📊 Calculation & Data Source” hover containers beneath every visual detail fields, formulas, and CSV references.
- **Predictive Modules:** `src/utils/alumniPredictions.js` and `src/utils/employerPredictions.js` encapsulate current heuristic models; roadmap (README §11) covers future ML upgrades.

---

## 5. Usage Patterns

| Persona | Typical Actions | Dashboard Elements Used |
|---------|-----------------|-------------------------|
| **VP Alumni Relations** | Prepare board decks, monitor engagement KPIs, plan campaigns | Alumni KPI row, trend chart, program bars, predictive insights |
| **Corporate Relations Director** | Track employer health, prioritize visits, monitor hiring pipeline | Employer KPI row, participation trend, hiring funnel, top employers table |
| **Program Chairs** | Compare program performance, justify resource requests | Alumni program analysis, cohort chart, gender/technology insights |
| **Career Services** | Identify high-demand skills, success stories for marketing | Employer technical strength, alumni job roles, top engaged alumni table |

---

## 6. Maintenance Checklist

- [ ] Verify CSV data refresh schedule (weekly recommended).
- [ ] Run `npm run lint` before shipping layout changes.
- [ ] Update `metrics.js` when new KPIs or data columns are introduced.
- [ ] Ensure predictive insight descriptions stay synced with formulas.
- [ ] Cross-reference README and this file after major dashboard changes.

---

**Document Owner:** DataNexus Engineering Team  
**Related Docs:** `README.md`, `PROJECT_FUNCTIONAL_DOCUMENTATION.md`, `CODESPACES_SETUP.md`

