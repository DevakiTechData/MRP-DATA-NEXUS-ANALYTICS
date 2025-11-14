import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ScatterChart, Scatter, ZAxis, ComposedChart, Bar } from 'recharts';
import ChartCard from '../../components/ChartCard';

const mockHiringForecast = [
  { quarter: '2024 Q4', hires: 620 },
  { quarter: '2025 Q1', hires: 650 },
  { quarter: '2025 Q2', hires: 680 },
  { quarter: '2025 Q3', forecast: 710 },
  { quarter: '2025 Q4', forecast: 745 },
];

const mockEmployerGrowth = [
  { employer: 'TechCorp', recentEvents: 8, recentHires: 35, forecastHires: 40 },
  { employer: 'FinServ', recentEvents: 5, recentHires: 22, forecastHires: 25 },
  { employer: 'HealthPartners', recentEvents: 4, recentHires: 18, forecastHires: 21 },
  { employer: 'EduWorks', recentEvents: 3, recentHires: 10, forecastHires: 12 },
  { employer: 'GlobalConsult', recentEvents: 6, recentHires: 28, forecastHires: 32 },
];

const mockRiskWatch = [
  { employer: 'BuildIt', recentHires: 2, avgEngagement: 3.1, riskScore: 82 },
  { employer: 'GreenFutures', recentHires: 4, avgEngagement: 3.8, riskScore: 68 },
  { employer: 'Retail360', recentHires: 1, avgEngagement: 2.7, riskScore: 90 },
];

const EmployerPredictions = () => {
  const headline = useMemo(() => ({
    projectedQuarterHires: 710,
    expansionIndustries: ['Technology', 'Consulting'],
    riskCount: mockRiskWatch.length,
  }), []);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold text-sluBlue">Employer Forecasts</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-3xl">
          Predictive hiring outlook, employer expansion opportunities, and churn warnings derived from recent conversion flows and industry momentum.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-gradient-to-br from-sluBlue to-sluBlue/60 text-white p-5 shadow">
          <p className="text-xs uppercase tracking-wide">Projected Hires Next Quarter</p>
          <p className="text-3xl font-semibold">{headline.projectedQuarterHires}</p>
          <p className="mt-2 text-sm text-slate-100">Baseline forecast (±5%) based on pipeline conversion and headcount trends.</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-5 shadow">
          <p className="text-xs uppercase tracking-wide text-slate-500">Industries Expected to Expand</p>
          <ul className="mt-2 text-sm text-slate-600 list-disc list-inside">
            {headline.expansionIndustries.map((industry) => (
              <li key={industry}>{industry}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-5 shadow">
          <p className="text-xs uppercase tracking-wide text-slate-500">Employers on Watchlist</p>
          <p className="text-3xl font-semibold text-sluBlue">{headline.riskCount}</p>
          <p className="mt-2 text-sm text-slate-600">Recommend proactive outreach to at-risk partners during the next quarter.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Quarterly Hiring Forecast"
          subtitle="Historic hires vs projection"
          contentClassName="flex flex-col justify-between h-[320px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockHiringForecast} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="hires" stroke="#002F6C" strokeWidth={2} dot={{ r: 3 }} name="Actual" />
              <Line type="monotone" dataKey="forecast" stroke="#FDB515" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 3 }} name="Forecast" />
            </LineChart>
          </ResponsiveContainer>
          <p className="mt-2 text-[0.7rem] text-slate-600">
            Upper-bound scenario suggests {mockHiringForecast[mockHiringForecast.length - 1].forecast} hires by year end.
          </p>
        </ChartCard>

        <ChartCard
          title="Employer Growth Potential"
          subtitle="Event participation vs forecasted hires"
          contentClassName="flex flex-col justify-between h-[320px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="recentEvents" name="Recent Events" allowDecimals={false} />
              <YAxis type="number" dataKey="recentHires" name="Recent Hires" allowDecimals={false} />
              <ZAxis type="number" dataKey="forecastHires" range={[80, 300]} name="Forecast Hires" />
              <Tooltip formatter={(value, name, payload) => [`${value}`, name]} labelFormatter={(label, payload) => payload[0]?.payload?.employer} />
              <Scatter data={mockEmployerGrowth} fill="#FDB515" name="Employers" />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="mt-2 text-[0.7rem] text-slate-600">
            Employers above the diagonal are poised for growth—prioritize joint programming with TechCorp and GlobalConsult.
          </p>
        </ChartCard>
      </div>

      <ChartCard
        title="At-Risk Employer Watch"
        subtitle="Employers with declining momentum"
        contentClassName="flex flex-col justify-between h-[280px]"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[0.75rem] text-slate-600">
          {mockRiskWatch.map((employer) => (
            <div key={employer.employer} className="rounded-lg border border-red-200 bg-red-50 px-3 py-3">
              <h4 className="text-sm font-semibold text-red-700">{employer.employer}</h4>
              <p>Recent hires: {employer.recentHires}</p>
              <p>Avg engagement: {employer.avgEngagement.toFixed(1)}</p>
              <p>Risk score: {employer.riskScore}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[0.7rem] text-slate-600">
          Recommend personalized outreach with tailored events or executive briefings to reverse declining momentum within the next 60 days.
        </p>
      </ChartCard>
    </div>
  );
};

export default EmployerPredictions;
