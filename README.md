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

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Build

```bash
npm run build
```

## Data Source

CSV files are located in the `public/` directory:
- `dim_contact.csv`
- `dim_date.csv`
- `dim_employers.csv`
- `dim_event.csv`
- `Dim_Students.csv`
- `fact_alumni_engagement.csv`

## Project Structure

```
src/
 ├── pages/
 │    ├── AlumniDashboard.jsx
 │    └── EmployerDashboard.jsx
 ├── components/
 │    ├── KPICard.jsx
 │    ├── ChartCard.jsx
 │    ├── FiltersPanel.jsx
 │    └── Navbar.jsx
 ├── data/
 │    └── loadData.js
 ├── App.jsx
 └── main.jsx
```

## SLU Branding

The application uses SLU brand colors:
- **SLU Blue**: `#002F6C`
- **SLU Gold**: `#FDB515`

## Features

- ✅ Responsive design with TailwindCSS
- ✅ Date filtering (Year and Month)
- ✅ Real-time data processing from CSV files
- ✅ Interactive charts with Recharts
- ✅ Navigation between dashboards
- ✅ SLU-branded UI

## Future Enhancements

- [ ] Export to CSV/PDF functionality
- [ ] Search/filter by college or program
- [ ] Map visualization for alumni/employer locations
- [ ] Additional filtering options
- [ ] Data refresh functionality