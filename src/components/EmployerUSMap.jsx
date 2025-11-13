import Plot from 'react-plotly.js';

const STATE_CENTERS = {
  AL: { lat: 32.8, lon: -86.9 },
  AK: { lat: 63.6, lon: -152.5 },
  AZ: { lat: 34.0, lon: -111.6 },
  AR: { lat: 34.9, lon: -92.4 },
  CA: { lat: 37.2, lon: -119.5 },
  CO: { lat: 39.0, lon: -105.5 },
  CT: { lat: 41.6, lon: -72.7 },
  DE: { lat: 39.0, lon: -75.5 },
  FL: { lat: 27.8, lon: -81.6 },
  GA: { lat: 32.7, lon: -83.3 },
  HI: { lat: 19.9, lon: -155.5 },
  ID: { lat: 44.1, lon: -114.7 },
  IL: { lat: 40.0, lon: -89.0 },
  IN: { lat: 40.3, lon: -86.2 },
  IA: { lat: 42.1, lon: -93.6 },
  KS: { lat: 38.5, lon: -98.3 },
  KY: { lat: 37.6, lon: -85.3 },
  LA: { lat: 31.2, lon: -92.3 },
  ME: { lat: 45.3, lon: -69.2 },
  MD: { lat: 39.1, lon: -76.8 },
  MA: { lat: 42.4, lon: -71.5 },
  MI: { lat: 44.3, lon: -85.4 },
  MN: { lat: 46.3, lon: -94.2 },
  MS: { lat: 32.7, lon: -89.7 },
  MO: { lat: 38.6, lon: -92.5 },
  MT: { lat: 47.0, lon: -109.6 },
  NE: { lat: 41.5, lon: -99.7 },
  NV: { lat: 38.8, lon: -116.4 },
  NH: { lat: 43.7, lon: -71.6 },
  NJ: { lat: 40.1, lon: -74.5 },
  NM: { lat: 34.3, lon: -106.0 },
  NY: { lat: 42.9, lon: -75.5 },
  NC: { lat: 35.5, lon: -79.4 },
  ND: { lat: 47.5, lon: -100.5 },
  OH: { lat: 40.3, lon: -82.8 },
  OK: { lat: 35.6, lon: -97.5 },
  OR: { lat: 43.9, lon: -120.6 },
  PA: { lat: 41.2, lon: -77.2 },
  RI: { lat: 41.6, lon: -71.6 },
  SC: { lat: 33.8, lon: -80.9 },
  SD: { lat: 44.4, lon: -100.3 },
  TN: { lat: 35.8, lon: -86.4 },
  TX: { lat: 31.4, lon: -99.3 },
  UT: { lat: 39.5, lon: -111.5 },
  VT: { lat: 44.1, lon: -72.7 },
  VA: { lat: 37.5, lon: -78.8 },
  WA: { lat: 47.4, lon: -120.7 },
  WV: { lat: 38.6, lon: -80.6 },
  WI: { lat: 44.6, lon: -89.5 },
  WY: { lat: 43.0, lon: -107.5 },
  DC: { lat: 38.9, lon: -77.0 },
};

const STATE_NAMES = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia',
};

const colorScale = [
  [0, '#ede9fe'],
  [0.2, '#d8b4fe'],
  [0.4, '#c084fc'],
  [0.6, '#a855f7'],
  [0.8, '#9333ea'],
  [1, '#7e22ce'],
];

const getTopStates = (counts, limit = 5) =>
  Object.entries(counts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([code, value]) => ({
      code,
      value,
      name: STATE_NAMES[code] || code,
    }));

const EmployerUSMap = ({
  alumniCounts = {},
  employerCounts = {},
  title = 'Employer & Alumni Distribution (2020-2025)',
}) => {
  const states = Object.keys({ ...alumniCounts, ...employerCounts }).filter(Boolean);
  const alumniValues = states.map((code) => alumniCounts[code] || 0);
  const employerValues = states.map((code) => employerCounts[code] || 0);

  if (states.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500 h-full text-sm">
        No employer location data available.
      </div>
    );
  }

  const plotData = [
    {
      type: 'choropleth',
      locationmode: 'USA-states',
      locations: states,
      z: alumniValues,
      customdata: employerValues,
      colorscale: colorScale,
      marker: {
        line: {
          color: '#ffffff',
          width: 1.3,
        },
      },
      colorbar: {
        title: 'Alumni Hires',
        thickness: 14,
        len: 0.4,
        x: 0.95,
      },
      hovertemplate:
        '<b>%{location}</b><br>Alumni: %{z}<br>Employers: %{customdata}<extra></extra>',
    },
    {
      type: 'scattergeo',
      locationmode: 'USA-states',
      locations: states,
      mode: 'text',
      text: states,
      textfont: {
        family: 'Inter, system-ui, sans-serif',
        size: 11,
        color: '#1e1b4b',
      },
      hoverinfo: 'skip',
      lat: states.map((code) => STATE_CENTERS[code]?.lat ?? 0),
      lon: states.map((code) => STATE_CENTERS[code]?.lon ?? 0),
      showlegend: false,
    },
  ];

  const layout = {
    title: {
      text: title,
      font: { size: 18, family: 'Inter, system-ui, sans-serif', color: '#111827' },
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    geo: {
      scope: 'usa',
      projection: { type: 'albers usa' },
      showcoastlines: false,
      showlakes: true,
      lakecolor: '#DBEAFE',
      bgcolor: 'rgba(0,0,0,0)',
    },
    margin: { t: 40, l: 0, r: 0, b: 0 },
  };

  const config = {
    displayModeBar: false,
    responsive: true,
  };

  const topAlumni = getTopStates(alumniCounts);
  const topEmployers = getTopStates(employerCounts);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[2.5fr_1fr] gap-6 h-full">
      <div className="min-h-[360px] xl:min-h-[420px]">
        <Plot
          data={plotData}
          layout={layout}
          config={config}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>

      <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-inner p-4 flex flex-col gap-6">
        <section>
          <h4 className="text-sluBlue font-semibold text-sm uppercase tracking-wide mb-3">
            Top Alumni Placement States
          </h4>
          <ul className="space-y-2 text-sm">
            {topAlumni.map((state, idx) => (
              <li
                key={`alumni-${state.code}`}
                className="flex items-center justify-between bg-white rounded-lg px-3 py-2 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                  <span className="font-medium text-slate-700">
                    {idx + 1}. {state.name}
                  </span>
                </div>
                <span className="font-semibold text-violet-600">{state.value}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="text-sluBlue font-semibold text-sm uppercase tracking-wide mb-3">
            Top Employer Presence States
          </h4>
          <ul className="space-y-2 text-sm">
            {topEmployers.map((state, idx) => (
              <li
                key={`employer-${state.code}`}
                className="flex items-center justify-between bg-white rounded-lg px-3 py-2 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-medium text-slate-700">
                    {idx + 1}. {state.name}
                  </span>
                </div>
                <span className="font-semibold text-amber-600">{state.value}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default EmployerUSMap;

