import { useMemo, useState } from 'react';

const CONTINENTS = [
  {
    id: 'north-america',
    name: 'North America',
    path: 'M75 70L210 60L235 105L210 190L135 205L70 135Z',
  },
  {
    id: 'south-america',
    name: 'South America',
    path: 'M190 215L250 225L290 295L250 355L190 315Z',
  },
  {
    id: 'europe',
    name: 'Europe',
    path: 'M320 65L420 70L430 115L375 130L340 105Z',
  },
  {
    id: 'africa',
    name: 'Africa',
    path: 'M345 135L430 145L470 225L430 295L350 250Z',
  },
  {
    id: 'asia',
    name: 'Asia',
    path: 'M420 90L620 100L670 165L600 270L470 240L440 150Z',
  },
  {
    id: 'oceania',
    name: 'Oceania',
    path: 'M600 265L680 275L725 330L640 340Z',
  },
];

const COUNTRIES = [
  { id: 'USA', name: 'United States', lat: 39.8283, lng: -98.5795, region: 'North America' },
  { id: 'CAN', name: 'Canada', lat: 56.1304, lng: -106.3468, region: 'North America' },
  { id: 'MEX', name: 'Mexico', lat: 23.6345, lng: -102.5528, region: 'North America' },
  { id: 'BRA', name: 'Brazil', lat: -14.235, lng: -51.9253, region: 'South America' },
  { id: 'ARG', name: 'Argentina', lat: -38.4161, lng: -63.6167, region: 'South America' },
  { id: 'NGA', name: 'Nigeria', lat: 9.082, lng: 8.6753, region: 'Africa' },
  { id: 'ZAF', name: 'South Africa', lat: -30.5595, lng: 22.9375, region: 'Africa' },
  { id: 'EGY', name: 'Egypt', lat: 26.8206, lng: 30.8025, region: 'Africa' },
  { id: 'GBR', name: 'United Kingdom', lat: 55.3781, lng: -3.436, region: 'Europe' },
  { id: 'DEU', name: 'Germany', lat: 51.1657, lng: 10.4515, region: 'Europe' },
  { id: 'FRA', name: 'France', lat: 46.2276, lng: 2.2137, region: 'Europe' },
  { id: 'ESP', name: 'Spain', lat: 40.4637, lng: -3.7492, region: 'Europe' },
  { id: 'IND', name: 'India', lat: 20.5937, lng: 78.9629, region: 'Asia' },
  { id: 'CHN', name: 'China', lat: 35.8617, lng: 104.1954, region: 'Asia' },
  { id: 'JPN', name: 'Japan', lat: 36.2048, lng: 138.2529, region: 'Asia' },
  { id: 'KOR', name: 'South Korea', lat: 35.9078, lng: 127.7669, region: 'Asia' },
  { id: 'AUS', name: 'Australia', lat: -25.2744, lng: 133.7751, region: 'Oceania' },
  { id: 'NZL', name: 'New Zealand', lat: -40.9006, lng: 174.886, region: 'Oceania' },
];

const COUNTRY_MAPPINGS = {
  USA: ['USA', 'United States', 'US', 'United States of America', 'America'],
  CAN: ['Canada'],
  MEX: ['Mexico'],
  BRA: ['Brazil'],
  ARG: ['Argentina'],
  NGA: ['Nigeria'],
  ZAF: ['South Africa'],
  EGY: ['Egypt'],
  GBR: ['United Kingdom', 'UK', 'England', 'Scotland', 'Wales', 'Great Britain'],
  DEU: ['Germany', 'Deutschland'],
  FRA: ['France'],
  ESP: ['Spain'],
  IND: ['India'],
  CHN: ['China'],
  JPN: ['Japan'],
  KOR: ['South Korea', 'Republic of Korea', 'Korea'],
  AUS: ['Australia'],
  NZL: ['New Zealand'],
};

const latLngToSVG = (lat, lng, width = 760, height = 360) => {
  const x = ((lng + 180) / 360) * width + 20;
  const y = ((90 - lat) / 180) * height + 20;
  return { x, y };
};

const WorldMap = ({ data = [], title, type = 'alumni' }) => {
  const [hoverInfo, setHoverInfo] = useState(null);

  const { countryCounts, regionCounts, maxCountryCount, totalCount } = useMemo(() => {
    const countryCountsAcc = {};
    const regionCountsAcc = {};

    data.forEach(item => {
      let countryValue = null;

      if (type === 'alumni') {
        countryValue = item.country_of_origin || item.current_city?.split(', ').pop() || null;
      } else if (type === 'employer') {
        countryValue = item.hq_country || item.hq_state || null;
      }

      if (!countryValue) return;

      countryValue = countryValue.trim();
      let matchedCountry = null;

      for (const [code, names] of Object.entries(COUNTRY_MAPPINGS)) {
        if (names.some(name => countryValue.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(countryValue.toLowerCase()))) {
          matchedCountry = code;
          break;
        }
      }

      if (!matchedCountry) {
        const direct = COUNTRIES.find(c => c.id.toLowerCase() === countryValue.toLowerCase() || c.name.toLowerCase() === countryValue.toLowerCase());
        matchedCountry = direct?.id || null;
      }

      if (matchedCountry) {
        countryCountsAcc[matchedCountry] = (countryCountsAcc[matchedCountry] || 0) + 1;
        const region = COUNTRIES.find(c => c.id === matchedCountry)?.region;
        if (region) {
          regionCountsAcc[region] = (regionCountsAcc[region] || 0) + 1;
        }
      }
    });

    const maxCountryCountAcc = Math.max(...Object.values(countryCountsAcc), 0);
    const total = Object.values(countryCountsAcc).reduce((sum, count) => sum + count, 0);

    return {
      countryCounts: countryCountsAcc,
      regionCounts: regionCountsAcc,
      maxCountryCount: maxCountryCountAcc || 1,
      totalCount: total,
    };
  }, [data, type]);

  const getRegionColor = (region) => {
    const count = regionCounts[region] || 0;
    if (count === 0) return '#e2e8f0';
    const intensity = Math.min(count / totalCount, 1);
    if (intensity > 0.4) return 'rgba(0, 47, 108, 0.55)';
    if (intensity > 0.2) return 'rgba(74, 144, 226, 0.45)';
    return 'rgba(253, 181, 21, 0.35)';
  };

  const markers = useMemo(() => {
    return COUNTRIES.map(country => {
      const count = countryCounts[country.id] || 0;
      if (count === 0) return null;
      const { x, y } = latLngToSVG(country.lat, country.lng);
      const size = Math.max(6, Math.sqrt(count / maxCountryCount) * 24);
      let color = '#FDB515';
      if (count / maxCountryCount > 0.6) color = '#002F6C';
      else if (count / maxCountryCount > 0.3) color = '#4A90E2';
      else if (count / maxCountryCount > 0.15) color = '#7ED321';

      return {
        ...country,
        count,
        x,
        y,
        size,
        color,
      };
    }).filter(Boolean);
  }, [countryCounts, maxCountryCount]);

  const topCountries = markers
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const regionOrder = ['North America', 'South America', 'Europe', 'Africa', 'Asia', 'Oceania'];

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="relative flex-1 min-h-[420px]">
        <svg
          viewBox="0 0 800 400"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="mapBg" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbd5e1" strokeWidth="0.4" opacity="0.25" />
            </pattern>
            <filter id="shadow" x="-20" y="-20" width="200" height="200">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#94a3b8" floodOpacity="0.35" />
            </filter>
          </defs>

          <rect width="800" height="400" fill="url(#mapBg)" />
          <rect width="800" height="400" fill="url(#grid)" />

          {CONTINENTS.map(continent => (
            <path
              key={continent.id}
              d={continent.path}
              fill={getRegionColor(continent.name)}
              stroke="#94a3b8"
              strokeWidth="1.5"
              opacity={0.9}
              filter="url(#shadow)"
            />
          ))}

          {markers.map(marker => (
            <g
              key={marker.id}
              onMouseEnter={() => setHoverInfo(marker)}
              onMouseLeave={() => setHoverInfo(null)}
            >
              <circle cx={marker.x} cy={marker.y} r={marker.size + 3} fill={marker.color} opacity="0.25" />
              <circle
                cx={marker.x}
                cy={marker.y}
                r={marker.size}
                fill={marker.color}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer transition-transform hover:scale-110"
              />
              <text
                x={marker.x}
                y={marker.y + 4}
                textAnchor="middle"
                fontSize={marker.size > 12 ? '12' : '10'}
                fill="#fff"
                fontWeight="bold"
                stroke="#0f172a"
                strokeWidth="0.5"
              >
                {marker.count}
              </text>
            </g>
          ))}

          <g>
            <rect x="20" y="20" width="220" height="130" rx="12" fill="#ffffff" opacity="0.95" stroke="#002F6C" strokeWidth="1.5" />
            <text x="130" y="48" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#0f172a">
              {title}
            </text>
            <text x="130" y="68" textAnchor="middle" fontSize="12" fill="#475569">
              Total: {totalCount}
            </text>

            <g transform="translate(40,85)">
              <circle cx="0" cy="0" r="7" fill="#002F6C" />
              <text x="12" y="4" fontSize="11" fill="#1e293b">High density</text>
            </g>
            <g transform="translate(40,105)">
              <circle cx="0" cy="0" r="7" fill="#4A90E2" />
              <text x="12" y="4" fontSize="11" fill="#1e293b">Medium density</text>
            </g>
            <g transform="translate(40,125)">
              <circle cx="0" cy="0" r="7" fill="#FDB515" />
              <text x="12" y="4" fontSize="11" fill="#1e293b">Emerging regions</text>
            </g>
          </g>
        </svg>

        {hoverInfo && (
          <div
            className="absolute bg-white shadow-lg border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700"
            style={{
              left: Math.min(Math.max(hoverInfo.x / 800, 0.05), 0.8) * 100 + '%',
              top: Math.min(Math.max(hoverInfo.y / 400, 0.05), 0.85) * 100 + '%',
              transform: 'translate(-50%, -120%)',
            }}
          >
            <div className="font-semibold text-slate-900">{hoverInfo.name}</div>
            <div>{hoverInfo.count} {type === 'alumni' ? 'alumni' : 'employers'}</div>
            <div className="text-xs text-slate-500">Region: {hoverInfo.region}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-4 h-full flex flex-col">
          <h4 className="text-sluBlue font-semibold mb-3">Top Countries</h4>
          {topCountries.length > 0 ? (
            <ul className="space-y-2 text-sm flex-1">
              {topCountries.map(country => (
                <li key={country.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: country.color }}
                    />
                    <span className="font-medium text-slate-700">{country.name}</span>
                  </div>
                  <span className="text-sluBlue font-semibold">{country.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">No geographical data available.</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-4 h-full flex flex-col">
          <h4 className="text-sluBlue font-semibold mb-3">Regional Distribution</h4>
          <div className="grid grid-cols-2 gap-3 text-sm flex-1">
            {regionOrder.map(region => (
              <div key={region} className="bg-slate-50 rounded-lg p-3 flex flex-col gap-1 justify-between">
                <span className="text-xs uppercase tracking-wide text-slate-500">{region}</span>
                <span className="text-lg font-semibold text-sluBlue">{regionCounts[region] || 0}</span>
                {totalCount > 0 && (
                  <span className="text-xs text-slate-500">
                    {(((regionCounts[region] || 0) / totalCount) * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldMap;