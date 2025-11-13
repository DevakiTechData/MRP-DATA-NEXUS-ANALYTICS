# DataNexus Dashboard

A full-stack React 18 application for visualizing alumni and employer engagement data from CSV files.

## Features

### Alumni Dashboard 🎓
- **KPIs**: Total Alumni, % Engaged Alumni, Avg Feedback Score, Avg Engagement Minutes
- **Visualizations**:
  - Bar Chart: Engagement by Event Type
  - Line Chart: Engagement Trend
  - Pie Chart: Gender Split
  - Bar Chart: Engaged Alumni by Degree Level
  - Bar Chart: Top 10 Programs by Engagement
  - Area Chart: Feedback Score over Time
  - Donut Chart: Visa Status
  - Table: Event Feedback Leaderboard

### Employer Dashboard 💼
- **KPIs**: Active Employers, Total Hires, Avg Salary, Top Industry
- **Visualizations**:
  - Bar Chart: Hires by Industry
  - Bar Chart: Hires by Employer
  - Line Chart: Hiring Trend
  - Bar Chart: Hires by Degree Level
  - Pie Chart: Employment Type
  - Table: Top 10 Employers
  - Table: Employer Locations
  - Donut Chart: Visa Type of Hires
  - Composed Chart: Hiring vs Engagement Trend

## Tech Stack

- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **TailwindCSS**: Styling with SLU brand colors
- **Recharts**: Data visualization library
- **PapaParse**: CSV parsing
- **React Router**: Navigation
- **TanStack Table**: Table components (available but not heavily used)

## Installation

```bash
npm install
```

## Development

### Frontend

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Events Inquiry API (Excel storage)

A lightweight Express server in the `server/` directory appends `/events` enquiries to an Excel workbook.

1. From the repository root, install dependencies and start the API:

```bash
cd server
npm install
npm run dev
```

2. Submissions are written to `server/data/event_inquiries.xlsx`. The file is created automatically with the correct headers if it does not exist.

3. The frontend targets `http://localhost:5000` by default. If you host the API elsewhere, set `VITE_API_BASE_URL` in a root `.env` file and restart `npm run dev`.

When both the frontend and API are running locally, submitting the Events form will append a new row to the Excel workbook.

## Build

```bash
npm run build
```