import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Legend, Line } from 'recharts';
import ChartCard from '../../components/ChartCard';

const mockEngagementForecast = [
  { month: '2025-01', actual: 2.4, forecast: 2.5, lower: 2.3, upper: 2.7 },
  { month: '2025-02', actual: 2.5, forecast: 2.55, lower: 2.35, upper: 2.75 },
  { month: '2025-03', actual: 2.3, forecast: 2.52, lower: 2.32, upper: 2.72 },
  { month: '2025-04', actual: 2.4, forecast: 2.58, lower: 2.38, upper: 2.78 },
  { month: '2025-05', actual: 2.45, forecast: 2.6, lower: 2.4, upper: 2.8 },
  { month: '2025-06', actual: 2.5, forecast: 2.62, lower: 2.42, upper: 2.82 },
  { month: '2025-07', actual: null, forecast: 2.68, lower: 2.48, upper: 2.88 },
  { month: '2025-08', actual: null, forecast: 2.71, lower: 2.51, upper: 2.91 },
  { month: '2025-09', actual: null, forecast: 2.74, lower: 2.54, upper: 2.94 },
];

const mockRetentionForecast = [
  { cohort: '2022', year0: 100, year1: 28, year2: 18, forecastYear3: 12 },
  { cohort: '2023', year0: 100, year1: 29, year2: 21, forecastYear3: 15 },
  { cohort: '2024', year0: 100, year1: 26, year2: 0, forecastYear3: 8 },
];

const mockProgramMomentum = [
  { program: 'MS Data Analytics', current: 320, forecast: 360 },
  { program: 'MS Information Systems', current: 305, forecast: 340 },
  { program: 'MBA', current: 210, forecast: 250 },
  { program: 'MS Artificial Intelligence', current: 198, forecast: 250 },
];

const AlumniPredictions = () => {
  const headlineMetrics = useMemo(() => ({
    nextQuarterEngagement: 2.74,
    projectedEngagedAlumni: 1820,
    atRiskCohorts: ['Class of 2024', 'Class of 2025'],
  }), []);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold text-sluBlue">Alumni Forecasts</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl">
          Forecasts blend recent engagement KPIs, retention funnels, and program performance to highlight where alumni relations teams should focus.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-gradient-to-br from-sluBlue to-sluBlue/60 text-white p-5 shadow">
          <p className="text-xs uppercase tracking-wide">Next Quarter Engagement Score</p>
          <p className="text-3xl font-semibold">{headlineMetrics.nextQuarterEngagement.toFixed(2)}</p>
          <p className="mt-2 text-sm text-slate-100">Projected average engagement score (within ±0.18 band).</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-5 shadow">
          <p className="text-xs uppercase tracking-wide text-slate-500">Projected Engaged Alumni</p>
          <p className="text-3xl font-semibold text-sluBlue">{headlineMetrics.projectedEngagedAlumni.toLocaleString()}</p>
          <p className="mt-2 text-sm text-slate-600">Based on engagement conversion &amp; retention outlook.</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-5 shadow">
          <p className="text-xs uppercase tracking-wide text-slate-500">Cohorts Requiring Outreach</p>
          <ul className="mt-2 text-sm text-slate-600 list-disc list-inside">
            {headlineMetrics.atRiskCohorts.map((cohort) => (
              <li key={cohort}>{cohort}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Engagement Score Forecast"
          subtitle="Actual vs forecast with confidence interval"
          contentClassName="flex flex-col justify-between h-[320px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockEngagementForecast} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="confidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FDB515" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#FDB515" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[2.0, 3.0]} tickFormatter={(value) => value.toFixed(1)} />
              <Tooltip formatter={(value) => Number(value).toFixed(2)} />
              <Legend />
              <Area type="monotone" dataKey="upper" stroke={false} fill="url(#confidence)" activeDot={false} />
              <Area type="monotone" dataKey="lower" stroke={false} fill="#fff" activeDot={false} />
              <Line type="monotone" dataKey="forecast" stroke="#FDB515" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="actual" stroke="#002F6C" strokeWidth={2} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
          <p className="mt-2 text-[0.7rem] text-slate-600">
            Score expected to climb to {mockEngagementForecast[mockEngagementForecast.length - 1].forecast.toFixed(2)} by Q3. Confidence interval ±0.2.
          </p>
        </ChartCard>

        <ChartCard
          title="Cohort Retention Forecast"
          subtitle="Forecasted retention level at Year +3"
          contentClassName="flex flex-col justify-between h-[320px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mockRetentionForecast} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <YAxis type="category" dataKey="cohort" width={120} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Bar dataKey="year1" name="Year +1" fill="#002F6C" radius={[4, 4, 4, 4]} maxBarSize={36} />
              <Bar dataKey="year2" name="Year +2" fill="#4A90E2" radius={[4, 4, 4, 4]} maxBarSize={36} />
              <Line dataKey="forecastYear3" name="Forecast Year +3" stroke="#FDB515" strokeWidth={2} dot />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="mt-2 text-[0.7rem] text-slate-600">
            Year +3 retention expected to stabilize around 12–15%. Plan re-engagement campaigns for cohorts below this threshold.
          </p>
        </ChartCard>
      </div>

      <ChartCard
        title="Program Momentum Forecast"
        subtitle="Projected growth in actively engaged alumni by program"
        contentClassName="flex flex-col justify-between h-[320px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mockProgramMomentum} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="program" interval={0} angle={-20} textAnchor="end" height={80} />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(value) => `${value.toLocaleString()} alumni`} />
            <Legend />
            <Bar dataKey="current" name="Current" fill="#4A90E2" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="forecast" name="Forecast" fill="#FDB515" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="mt-2 text-[0.7rem] text-slate-600">
          Programs with momentum (Data Analytics, Information Systems) are projected to add 12–15% more engaged alumni—prime candidates for mentorship and giving campaigns.
        </p>
      </ChartCard>
    </div>
  );
};

export default AlumniPredictions;
