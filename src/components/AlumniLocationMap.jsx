import { useMemo, useState } from 'react';
import { geoCentroid } from 'd3-geo';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

const STATE_ABBREVIATIONS = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
  'District of Columbia': 'DC',
};

/**
 * AlumniLocationMap Component
 * Displays a US choropleth map of engaged alumni by location
 *
 * @param {Array} data - Array of { code: string, name: string, engagedCount: number }
 */
const AlumniLocationMap = ({ data = [] }) => {
  const [tooltip, setTooltip] = useState(null);

  const { stateStats, maxValue, unknownTotal } = useMemo(() => {
    if (!data || data.length === 0) {
      return { stateStats: {}, maxValue: 0, unknownTotal: 0 };
    }

    const stats = {};
    let unknown = 0;

    data.forEach((item) => {
      const code = (item.code || '').toUpperCase();
      const count = Number(item.engagedCount || 0);
      if (!code || code === 'UNKNOWN' || !count) {
        unknown += count || 0;
        return;
      }
      stats[code] = (stats[code] || 0) + count;
    });

    const max = Object.values(stats).length > 0 ? Math.max(...Object.values(stats)) : 0;

    return { stateStats: stats, maxValue: max, unknownTotal: unknown };
  }, [data]);

  const hasUSData = Object.keys(stateStats).length > 0;

  const getFill = (code) => {
    const value = stateStats[code];
    if (!value || maxValue === 0) return '#E5E7EB';
    const intensity = value / maxValue;
    if (intensity > 0.75) return '#002F6C';
    if (intensity > 0.5) return '#0A5AA1';
    if (intensity > 0.25) return '#4A90E2';
    return '#BFD7EF';
  };

  const getLabelColor = (code) => {
    const value = stateStats[code];
    if (!value || maxValue === 0) return '#0F172A';
    const intensity = value / maxValue;
    return intensity > 0.6 ? '#FFFFFF' : '#0F172A';
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[560px] text-slate-500">
        <p>No location data available for engaged alumni.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[560px]">
      <ComposableMap projection="geoAlbersUsa" className="w-full h-[420px]">
        <Geographies geography={geoUrl}>
          {({ geographies, projection }) =>
            geographies.map((geo) => {
              const stateName = geo.properties.name;
              const stateCode = STATE_ABBREVIATIONS[stateName];
              const value = stateCode ? stateStats[stateCode] || 0 : 0;
              const centroid = projection(geoCentroid(geo));

              return (
                <g key={geo.rsmKey}>
                  <Geography
                    geography={geo}
                    fill={getFill(stateCode)}
                    stroke="#FFFFFF"
                    strokeWidth={0.5}
                    onMouseEnter={() => {
                      if (stateCode) {
                        setTooltip({
                          name: stateName,
                          code: stateCode,
                          count: value,
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: '#FDB515', outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                  {stateCode && centroid && (
                    <text
                      x={centroid[0]}
                      y={centroid[1]}
                      textAnchor="middle"
                      style={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fill: value > 0 ? getLabelColor(stateCode) : '#475569',
                        fontWeight: 600,
                        fontSize: 10,
                        pointerEvents: 'none',
                      }}
                    >
                      <tspan x={centroid[0]} dy={value > 0 ? '-0.3em' : '0'}>
                        {stateCode}
                      </tspan>
                      {value > 0 && (
                        <tspan
                          x={centroid[0]}
                          dy="1.2em"
                          style={{
                            fontSize: 11,
                            fill: getLabelColor(stateCode),
                            fontWeight: 600,
                          }}
                        >
                          {value.toLocaleString()}
                        </tspan>
                      )}
                    </text>
                  )}
                </g>
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip && (
        <div className="absolute top-4 right-4 bg-white shadow-xl border border-slate-200 rounded-lg px-4 py-3 text-sm">
          <p className="font-semibold text-sluBlue">{tooltip.name}</p>
          <p className="text-slate-600">
            <span className="font-medium">{tooltip.count.toLocaleString()}</span> engaged alumni
          </p>
        </div>
      )}

      {!hasUSData && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-medium">
          No US-based location data available.
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded" style={{ backgroundColor: '#BFD7EF' }}></span>
          <span>Low (1-25%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded" style={{ backgroundColor: '#4A90E2' }}></span>
          <span>Moderate (25-50%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded" style={{ backgroundColor: '#0A5AA1' }}></span>
          <span>High (50-75%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded" style={{ backgroundColor: '#002F6C' }}></span>
          <span>Very High (75%+)</span>
        </div>
        {unknownTotal > 0 && (
          <span className="text-amber-600">
            {unknownTotal.toLocaleString()} engaged alumni have unspecified locations.
          </span>
        )}
      </div>
    </div>
  );
};

export default AlumniLocationMap;

