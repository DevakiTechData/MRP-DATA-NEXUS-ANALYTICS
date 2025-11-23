import { useState, useEffect, useMemo } from 'react';
import GalleryFooter from '../components/GalleryFooter';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  LabelList,
} from 'recharts';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import PageHero from '../components/PageHero';
import InsightCard from '../components/InsightCard';
import InfoTooltip from '../components/InfoTooltip';
import { loadAllData } from '../data/loadData';
import {
  calculateTotalAlumni,
  calculateEngagedAlumni,
  calculateEngagementRate,
  calculateAvgTouchpoints,
  calculateTotalTouchpoints,
  calculateTotalEngagementMinutes,
  getEngagementTrendByMonth,
  getEngagementByProgram,
  getEngagementByType,
  getEngagedAlumniByLocation,
  getTopEngagedAlumni,
  getEngagementByGraduationCohort,
  getMostEngagedProgram,
  getTopEngagementLocation,
  getMostActiveCohort,
  getMostPopularEngagementType,
  getHighestVisaStatusAlumni,
} from '../utils/metrics';
import { getAlumniSLUPredictions } from '../utils/alumniPredictions';
import AlumniLocationMap from '../components/AlumniLocationMap';
import { CHART_COLORS } from '../utils/constants';

// Custom Tooltip Components
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-4 min-w-[180px]">
        <p className="text-white font-semibold mb-3 text-sm border-b border-slate-700 pb-2">
          {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry, index) => {
            const value = typeof entry.value === 'number' 
              ? entry.value.toLocaleString() 
              : entry.value;
            return (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-slate-300 text-xs">{entry.name}:</span>
                </div>
                <span className="text-white font-bold text-sm">
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-4 min-w-[180px]">
        <p className="text-white font-semibold mb-3 text-sm border-b border-slate-700 pb-2">
          {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry, index) => {
            const value = typeof entry.value === 'number' 
              ? entry.value.toLocaleString() 
              : entry.value;
            return (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-slate-300 text-xs">{entry.name}:</span>
                </div>
                <span className="text-white font-bold text-sm">
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const ALUMNI_HERO_IMAGES = [
  {
    src: '/assets/hero/alumni banner img1.jpg',
    alt: 'SLU alumni celebrating together outdoors',
    caption: 'Celebrating SLU alumni achievements around the globe.',
  },
  {
    src: '/assets/hero/Alumni img5.jpg',
    alt: 'Alumni mentoring current students',
    caption: 'Mentors guiding the next generation of Billiken leaders.',
  },
  {
    src: '/assets/hero/alumni img2.jpg',
    alt: 'Networking reception between SLU alumni',
    caption: 'Expanding professional networks with fellow alumni.',
  },
];

const AlumniDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnalysisSummary, setShowAnalysisSummary] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    program: '',
    graduationCohort: '',
    location: '',
    engagementType: '',
    year: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      console.log('[AlumniDashboard] Starting data load...');
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Data loading timeout after 30 seconds')), 30000);
        });
        
        console.log('[AlumniDashboard] Loading CSV files...');
        const loadedData = await Promise.race([
          loadAllData(),
          timeoutPromise
        ]);
        
        console.log('[AlumniDashboard] Data loaded successfully:', {
          students: loadedData?.students?.length || 0,
          alumniEngagement: loadedData?.alumniEngagement?.length || 0,
          employers: loadedData?.employers?.length || 0,
        });
        
      setData(loadedData);
      } catch (error) {
        console.error('[AlumniDashboard] Error loading data:', error);
        // Set empty data structure on error
        setData({
          students: [],
          alumniEngagement: [],
          dates: [],
          employers: [],
          events: [],
          contacts: [],
          alumniEmployment: [],
          employerFeedback: [],
        });
      } finally {
        console.log('[AlumniDashboard] Data loading completed');
      setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter data based on active filters
  const filteredData = useMemo(() => {
    if (!data) return null;

    let { students, alumniEngagement, dates } = data;
    let filteredStudents = [...students];
    let filteredEngagement = [...alumniEngagement];

    // Filter by program
    if (filters.program) {
      filteredStudents = filteredStudents.filter(s => 
        (s.program_name || s.major || '').toLowerCase().includes(filters.program.toLowerCase())
      );
      const programStudentIds = new Set(filteredStudents.map(s => String(s.student_key || s.student_id)));
      filteredEngagement = filteredEngagement.filter(e => {
        const studentId = String(e.student_key || e.student_id);
        return programStudentIds.has(studentId);
      });
    }

    // Filter by graduation cohort
    if (filters.graduationCohort) {
      filteredStudents = filteredStudents.filter(s => 
        String(s.graduation_year || '') === String(filters.graduationCohort)
      );
      const cohortStudentIds = new Set(filteredStudents.map(s => String(s.student_key || s.student_id)));
      filteredEngagement = filteredEngagement.filter(e => {
        const studentId = String(e.student_key || e.student_id);
        return cohortStudentIds.has(studentId);
      });
    }

    // Filter by location (city/state)
    if (filters.location) {
      filteredStudents = filteredStudents.filter(s => {
        const city = (s.current_city || '').toLowerCase();
        const state = (s.current_state || '').toLowerCase();
        const locationFilter = filters.location.toLowerCase();
        return city.includes(locationFilter) || state.includes(locationFilter);
      });
      const locationStudentIds = new Set(filteredStudents.map(s => String(s.student_key || s.student_id)));
      filteredEngagement = filteredEngagement.filter(e => {
        const studentId = String(e.student_key || e.student_id);
        return locationStudentIds.has(studentId);
      });
    }

    // Filter by engagement type
    if (filters.engagementType) {
      const typeFilter = filters.engagementType.toLowerCase();
      filteredEngagement = filteredEngagement.filter(e => {
        if (typeFilter === 'university event' && e.participated_university_event_flag === '1') return true;
        if (typeFilter === 'outside event' && e.participated_outside_event_flag === '1') return true;
        if (typeFilter === 'alumni event' && e.alumni_event_flag === '1') return true;
        if (typeFilter === 'mentorship' && parseFloat(e.mentorship_hours || 0) > 0) return true;
        if (typeFilter === 'giving' && parseFloat(e.donations_amount || 0) > 0) return true;
        if (typeFilter === 'applications' && parseFloat(e.applications_submitted || 0) > 0) return true;
        return false;
      });
    }

    // Filter by year
    if (filters.year) {
      const yearFilter = String(filters.year);
      const dateLookup = dates.reduce((acc, d) => {
        if (String(d.year) === yearFilter) {
          acc[String(d.date_key)] = d;
        }
      return acc;
    }, {});
      const validDateKeys = new Set(Object.keys(dateLookup));
      filteredEngagement = filteredEngagement.filter(e => {
        const dateKey = String(e.event_date_key || '');
        return validDateKeys.has(dateKey);
      });
    }

      return {
      students: filteredStudents,
      alumniEngagement: filteredEngagement,
      dates,
    };
  }, [data, filters]);

  // Get unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    if (!data) return { programs: [], cohorts: [], locations: [], engagementTypes: [], years: [] };

    const { students, alumniEngagement, dates } = data;
    
    const programs = [...new Set(students.map(s => s.program_name || s.major).filter(Boolean))].sort();
    const cohorts = [...new Set(students.map(s => s.graduation_year).filter(Boolean))].sort((a, b) => b - a);
    const locations = [...new Set(students.map(s => s.current_city || s.current_state).filter(Boolean))].sort();
    const years = [...new Set(dates.map(d => d.year).filter(Boolean))].sort((a, b) => b - a);
    
    const engagementTypes = [
      'University Event',
      'Outside Event',
      'Alumni Event',
      'Mentorship',
      'Giving',
      'Applications',
    ];

    return { programs, cohorts, locations, engagementTypes, years };
  }, [data]);

  const metrics = useMemo(() => {
    if (!filteredData) {
      console.log('[AlumniDashboard] metrics: filteredData is null');
      return null;
    }

    try {
      const { students, alumniEngagement, dates } = filteredData;
      
      console.log('[AlumniDashboard] Calculating metrics...', {
        studentsCount: students?.length || 0,
        engagementCount: alumniEngagement?.length || 0,
        datesCount: dates?.length || 0,
      });

    // Calculate the 7 main KPIs
    const totalAlumni = calculateTotalAlumni(students);
    const engagedAlumniCount = calculateEngagedAlumni(students, alumniEngagement);
    const engagementRate = calculateEngagementRate(engagedAlumniCount, totalAlumni);
    const avgTouchpoints = calculateAvgTouchpoints(alumniEngagement, engagedAlumniCount);
    // Calculate average engagement minutes per engaged alumni
    const totalEngagementMinutes = calculateTotalEngagementMinutes(alumniEngagement);
    const avgEngagementMinutes = engagedAlumniCount > 0 
      ? Math.round(totalEngagementMinutes / engagedAlumniCount)
      : 0;
    const highestVisaStatus = getHighestVisaStatusAlumni(students);

    // Calculate visualization metrics
    const engagementTrendByMonth = getEngagementTrendByMonth(alumniEngagement, dates);
    const engagementByProgram = getEngagementByProgram(students, alumniEngagement);
    const engagementByType = getEngagementByType(alumniEngagement);
    const engagedAlumniByLocation = getEngagedAlumniByLocation(students, alumniEngagement);
    const topEngagedAlumni = getTopEngagedAlumni(students, alumniEngagement, 10);
    const engagementByCohort = getEngagementByGraduationCohort(students, alumniEngagement);

    // Calculate insights
      const mostEngagedProgram = getMostEngagedProgram(students, alumniEngagement);
      const topLocation = getTopEngagementLocation(students, alumniEngagement);
      const mostActiveCohort = getMostActiveCohort(students, alumniEngagement);
      const mostPopularType = getMostPopularEngagementType(alumniEngagement);

      const result = {
      totalAlumni,
        engagedAlumniCount,
        engagementRate,
        avgTouchpoints,
      avgEngagementMinutes,
        highestVisaStatus,
        engagementTrendByMonth,
        engagementByProgram,
        engagementByType,
        engagedAlumniByLocation,
        topEngagedAlumni,
        engagementByCohort,
        mostEngagedProgram,
        topLocation,
        mostActiveCohort,
        mostPopularType,
      };
      
      console.log('[AlumniDashboard] Metrics calculated successfully:', {
        totalAlumni: result.totalAlumni,
        engagedAlumni: result.engagedAlumniCount,
      });
      
      return result;
    } catch (error) {
      console.error('[AlumniDashboard] Error calculating metrics:', error);
      return null;
    }
  }, [filteredData]);

  // Calculate predictive insights asynchronously after main data loads
  const [predictiveInsights, setPredictiveInsights] = useState(null);
  
  useEffect(() => {
    if (!data || !data.students || !data.employers || !data.alumniEngagement) {
      setPredictiveInsights(null);
      return;
    }
    if (data.students.length === 0 || data.employers.length === 0 || data.alumniEngagement.length === 0) {
      setPredictiveInsights(null);
      return;
    }

    // Calculate predictive insights asynchronously to avoid blocking main render
    const calculateInsights = async () => {
      try {
        const { students, alumniEngagement } = data;
        
        // Use setTimeout to defer calculation and allow main UI to render first
        setTimeout(() => {
          try {
            const { alumniEmployment, employerFeedback } = data;
            const predictions = getAlumniSLUPredictions(students, alumniEngagement, alumniEmployment || [], employerFeedback || []);
            setPredictiveInsights(predictions);
          } catch (error) {
            console.error('Error calculating predictive insights:', error);
            setPredictiveInsights(null);
          }
        }, 100); // Small delay to let main UI render first
      } catch (error) {
        console.error('Error in predictive insights calculation:', error);
        setPredictiveInsights(null);
      }
    };
    
    calculateInsights();
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sluBlue mb-4"></div>
          <div className="text-xl text-sluBlue font-semibold">Loading data...</div>
          <div className="text-sm text-slate-600 mt-2">Please wait while we fetch the latest analytics</div>
        </div>
      </div>
    );
  }

  // Show dashboard even if metrics are still calculating
  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50">
        <div className="text-center max-w-md px-6">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-xl text-red-600 font-semibold mb-2">Error loading data</div>
          <div className="text-sm text-slate-600 mb-4">
            Unable to load dashboard data. Please check:
          </div>
          <ul className="text-xs text-slate-600 text-left space-y-1 mb-4">
            <li>• CSV files are in the public folder</li>
            <li>• Files are named correctly (Dim_Students.csv, fact_alumni_engagement.csv, etc.)</li>
            <li>• Check browser developer tools (F12 or right-click → Inspect)</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="bg-sluBlue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show loading state for metrics if they're still calculating
  if (!metrics) {
  return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sluBlue mb-4"></div>
          <div className="text-xl text-sluBlue font-semibold">Calculating metrics...</div>
          <div className="text-sm text-slate-600 mt-2">Processing {data.students?.length || 0} students and {data.alumniEngagement?.length || 0} engagement records</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 pb-16">
      <PageHero
        images={ALUMNI_HERO_IMAGES}
        eyebrow="Alumni Insights"
        title="Alumni Engagement Dashboard"
        subtitle="Track engagement, participation, and alumni relationships"
        description="Measure engagement, growth, and global reach. Visualize engagement trends, program performance, and alumni participation to power strategic decisions."
        actions={[
          { to: '/', label: 'Back to Home', variant: 'secondary' },
          { href: '#alumni-kpis', label: 'Explore KPIs' },
        ]}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 id="alumni-kpis" className="text-2xl font-bold text-slate-800 mb-2">
            Alumni Engagement Dashboard
        </h2>
          <p className="text-sm text-slate-600">Comprehensive analytics and insights into alumni engagement patterns</p>
        </div>

        {/* FILTERS ROW */}
        <div className="bg-gradient-to-br from-white via-blue-50/60 to-blue-50/40 rounded-xl shadow-md border border-blue-300/60 p-5 mb-6 w-full">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Program</label>
              <select
                value={filters.program}
                onChange={(e) => setFilters({ ...filters, program: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sluBlue focus:ring focus:ring-sluBlue/20"
              >
                <option value="">All Programs</option>
                {filterOptions.programs.map(program => (
                  <option key={program} value={program}>{program}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Graduation Cohort</label>
              <select
                value={filters.graduationCohort}
                onChange={(e) => setFilters({ ...filters, graduationCohort: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sluBlue focus:ring focus:ring-sluBlue/20"
              >
                <option value="">All Years</option>
                {filterOptions.cohorts.map(cohort => (
                  <option key={cohort} value={cohort}>{cohort}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sluBlue focus:ring focus:ring-sluBlue/20"
              >
                <option value="">All Locations</option>
                {filterOptions.locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Engagement Type</label>
              <select
                value={filters.engagementType}
                onChange={(e) => setFilters({ ...filters, engagementType: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sluBlue focus:ring focus:ring-sluBlue/20"
              >
                <option value="">All Types</option>
                {filterOptions.engagementTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sluBlue focus:ring focus:ring-sluBlue/20"
              >
                <option value="">All Years</option>
                {filterOptions.years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          {(filters.program || filters.graduationCohort || filters.location || filters.engagementType || filters.year) && (
            <button
              onClick={() => setFilters({ program: '', graduationCohort: '', location: '', engagementType: '', year: '' })}
              className="mt-4 text-sm text-sluBlue hover:text-blue-700 font-medium"
            >
              Clear All Filters
            </button>
          )}
        </div>

        {/* KPI TILES ROW - 7 KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6 w-full">
          <KPICard
            title="Total Alumni"
            value={metrics.totalAlumni.toLocaleString()}
            tooltip="Total number of SLU alumni in our dataset."
            calculation={{
              dataSources: ['Dim_Students.csv'],
              method: 'Distinct count of student_id from dim_students table',
              formula: 'COUNT(DISTINCT student_id)'
            }}
          />
          <KPICard
            title="Engaged Alumni"
            value={metrics.engagedAlumniCount.toLocaleString()}
            tooltip="Alumni who participated in at least one SLU activity."
            calculation={{
              dataSources: ['Dim_Students.csv', 'fact_alumni_engagement.csv'],
              method: 'Distinct count of student_id who appear at least once in fact_alumni_engagement',
              formula: 'COUNT(DISTINCT student_id) WHERE student_id IN (SELECT DISTINCT student_id FROM fact_alumni_engagement)'
            }}
          />
          <KPICard
            title="Engagement Rate"
            value={`${metrics.engagementRate}%`}
            tooltip="Share of alumni who interacted with SLU at least once."
            calculation={{
              dataSources: ['Dim_Students.csv', 'fact_alumni_engagement.csv'],
              method: 'Calculate (engagedAlumni / totalAlumni) × 100, capped at 100%, rounded to whole number',
              formula: 'MIN((engagedAlumni / totalAlumni) × 100, 100)'
            }}
          />
          <KPICard
            title="Avg Touchpoints"
            value={Math.round(metrics.avgTouchpoints).toLocaleString()}
            tooltip="Average number of engagement interactions per engaged alumnus."
            calculation={{
              dataSources: ['fact_alumni_engagement.csv'],
              method: 'Total engagement records divided by distinct count of engaged alumni',
              formula: 'COUNT(*) / COUNT(DISTINCT student_id)'
            }}
          />
          <KPICard
            title="Avg Engagement Minutes"
            value={metrics.avgEngagementMinutes > 1000 
              ? `${Math.round(metrics.avgEngagementMinutes / 1000)}K`
              : Math.round(metrics.avgEngagementMinutes).toLocaleString()}
            tooltip="Average mentorship and engagement time in minutes per engaged alumnus."
            calculation={{
              dataSources: ['fact_alumni_engagement.csv'],
              method: 'Total engagement minutes divided by distinct count of engaged alumni',
              formula: 'SUM(engagement_minutes + mentorship_hours × 60) / COUNT(DISTINCT student_id)'
            }}
          />
          <KPICard
            title="Highest Visa Status"
            value={metrics.highestVisaStatus && metrics.highestVisaStatus.count > 0 
              ? Math.round(metrics.highestVisaStatus.count).toLocaleString()
              : '0'}
            tooltip={`Most common visa status among alumni: ${metrics.highestVisaStatus?.label || 'N/A'}`}
            calculation={{
              dataSources: ['Dim_Students.csv'],
              method: 'Count alumni by visa_status field, find the status with the highest count',
              formula: 'COUNT(*) GROUP BY visa_status ORDER BY COUNT(*) DESC LIMIT 1'
            }}
          />
        </div>

        {/* MIDDLE CHARTS ROW - Program, Type, Cohort (3 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Engagement by Program */}
          <ChartCard
            title="Engaged Alumni by Program"
            subtitle="Top programs by engaged alumni count"
          >
            {metrics.engagementByProgram.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[560px] text-slate-500">
                No program data available
            </div>
            ) : (
              <ResponsiveContainer width="100%" height={500}>
                <BarChart
                  data={metrics.engagementByProgram.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 5, right: 80, left: 120, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="programGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#002F6C" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#4A90E2" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    type="number" 
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis 
                    dataKey="program" 
                    type="category" 
                    width={110}
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <Tooltip
                    content={<CustomBarTooltip />}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#475569', fontSize: '14px' }}
                  />
                  <Bar 
                    dataKey="engagedAlumni" 
                    name="Engaged Alumni" 
                    fill="url(#programGradient)" 
                    radius={[0, 4, 4, 0]}
                  >
                    <LabelList
                      dataKey="engagedAlumni" 
                      position="right" 
                      formatter={(value) => value.toLocaleString()}
                      style={{ fill: '#475569', fontSize: '11px', fontWeight: '600' }}
                    />
                  </Bar>
              </BarChart>
              </ResponsiveContainer>
            )}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 group relative">
              <h4 className="text-xs font-semibold text-slate-700 mb-1 cursor-help flex items-center gap-1">
                📊 Calculation & Data Source
                <span className="text-slate-400 group-hover:text-slate-600">(Hover for details)</span>
              </h4>
              <div className="hidden group-hover:block">
                <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Data Sources:</strong> <code className="text-xs bg-slate-200 px-1 rounded">Dim_Students.csv</code>, <code className="text-xs bg-slate-200 px-1 rounded">fact_alumni_engagement.csv</code><br/>
                <strong>Method:</strong> Join fact_alumni_engagement with Dim_Students on student_id, group by program_name/major, count distinct student_id per program<br/>
                <strong>Count:</strong> Distinct count of student_id with at least one engagement per program<br/>
                <strong>Display:</strong> Top 8 programs sorted by engagedAlumni descending (horizontal bar chart)
              </p>
            </div>
            </div>
          </ChartCard>

          {/* Engagement by Type */}
          <ChartCard
            title="Engagement by Type"
            subtitle="Distribution of engagement activities"
          >
            {metrics.engagementByType.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[560px] text-slate-500">
                No engagement type data available
            </div>
            ) : (
              <ResponsiveContainer width="100%" height={500}>
                <BarChart
                  data={metrics.engagementByType}
                  margin={{ top: 30, right: 30, left: 0, bottom: 60 }}
                >
                  <defs>
                    <linearGradient id="engagementsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#002F6C" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#4A90E2" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="alumniGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FDB515" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#FFD700" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="type" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip 
                    content={<CustomBarTooltip />}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#475569', fontSize: '14px' }}
                  />
                  <Bar 
                    dataKey="totalEngagements" 
                    name="Total Engagements" 
                    fill="url(#engagementsGradient)" 
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList
                      dataKey="totalEngagements" 
                      position="top" 
                      formatter={(value) => value.toLocaleString()}
                      style={{ fill: '#1e293b', fontSize: '11px', fontWeight: '600' }}
                    />
                  </Bar>
                  <Bar 
                    dataKey="engagedAlumni" 
                    name="Engaged Alumni" 
                    fill="url(#alumniGradient)" 
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList
                      dataKey="engagedAlumni" 
                      position="top" 
                      formatter={(value) => value.toLocaleString()}
                      style={{ fill: '#92400e', fontSize: '11px', fontWeight: '600' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 group relative">
              <h4 className="text-xs font-semibold text-slate-700 mb-1 cursor-help flex items-center gap-1">
                📊 Calculation & Data Source
                <span className="text-slate-400 group-hover:text-slate-600">(Hover for details)</span>
              </h4>
              <div className="hidden group-hover:block">
                <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Data Sources:</strong> <code className="text-xs bg-slate-200 px-1 rounded">fact_alumni_engagement.csv</code><br/>
                <strong>Method:</strong> Group engagement records by engagement_type (Event, Mentorship, Giving, Applications), count total engagements and distinct alumni per type<br/>
                <strong>Total Engagements:</strong> Row count per engagement type<br/>
                <strong>Engaged Alumni:</strong> Distinct count of student_id per engagement type<br/>
                <strong>Display:</strong> Grouped bar chart showing both metrics side-by-side
              </p>
            </div>
            </div>
          </ChartCard>

          {/* Engagement by Cohort */}
          <ChartCard
            title="Engagement by Graduation Cohort"
            subtitle="Engagement patterns by graduation year"
          >
            {metrics.engagementByCohort.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[560px] text-slate-500">
                No cohort data available
        </div>
            ) : (
              <ResponsiveContainer width="100%" height={500}>
                <BarChart
                  data={metrics.engagementByCohort}
                  margin={{ top: 30, right: 30, left: 0, bottom: 60 }}
                >
                  <defs>
                    <linearGradient id="cohortGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#002F6C" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#4A90E2" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="year" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                      <Tooltip
                    content={<CustomBarTooltip />}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#475569', fontSize: '14px' }}
                  />
                  <Bar 
                    dataKey="engagedAlumni" 
                    name="Engaged Alumni" 
                    fill="url(#cohortGradient)" 
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList
                      dataKey="engagedAlumni" 
                      position="top" 
                      formatter={(value) => value.toLocaleString()}
                      style={{ fill: '#1e293b', fontSize: '11px', fontWeight: '600' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 group relative">
              <h4 className="text-xs font-semibold text-slate-700 mb-1 cursor-help flex items-center gap-1">
                📊 Calculation & Data Source
                <span className="text-slate-400 group-hover:text-slate-600">(Hover for details)</span>
              </h4>
              <div className="hidden group-hover:block">
                <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Data Sources:</strong> <code className="text-xs bg-slate-200 px-1 rounded">Dim_Students.csv</code>, <code className="text-xs bg-slate-200 px-1 rounded">fact_alumni_engagement.csv</code><br/>
                <strong>Method:</strong> Join alumni_engagement with Dim_Students on student_id, group by graduation_year, count distinct student_id per year<br/>
                <strong>Count:</strong> Distinct count of engaged student_id per graduation_year<br/>
                <strong>Display:</strong> Vertical bar chart sorted by year ascending (only shown if data has meaningful variation)
              </p>
            </div>
            </div>
          </ChartCard>
        </div>

        {/* DETAIL & INSIGHT ROW - Top Alumni Table (60%) + Insight Tiles (40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          {/* Top Engaged Alumni Table - 60% width (3 columns) */}
          <div className="lg:col-span-3">
          <ChartCard
              title="Top Engaged Alumni"
              subtitle="Most active alumni by engagement count"
            isTable={true}
          >
              {metrics.topEngagedAlumni.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[400px] text-slate-500">
                  No alumni data available for the selected filters
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm table-auto">
                    <thead className="bg-gradient-to-r from-slate-200 to-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-800">Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-800">Program</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-800">Engagement Count</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-800">Total Minutes</th>
                </tr>
              </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {metrics.topEngagedAlumni.map((alumnus, index) => (
                        <tr key={alumnus.studentId || index} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-800 font-medium">{alumnus.name}</td>
                          <td className="px-4 py-3 text-slate-700">{alumnus.program}</td>
                          <td className="px-4 py-3 text-slate-700">{alumnus.engagementCount}</td>
                          <td className="px-4 py-3 text-slate-700">
                            {alumnus.totalMinutes > 0 ? Math.round(alumnus.totalMinutes).toLocaleString() : 'N/A'}
                          </td>
                  </tr>
                ))}
              </tbody>
            </table>
                </div>
            )}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 group relative">
              <h4 className="text-xs font-semibold text-slate-700 mb-1 cursor-help flex items-center gap-1">
                📊 Calculation & Data Source
                <span className="text-slate-400 group-hover:text-slate-600">(Hover for details)</span>
              </h4>
              <div className="hidden group-hover:block">
                <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Data Sources:</strong> <code className="text-xs bg-slate-200 px-1 rounded">Dim_Students.csv</code>, <code className="text-xs bg-slate-200 px-1 rounded">fact_alumni_engagement.csv</code><br/>
                <strong>Method:</strong> Group fact_alumni_engagement by student_id, count engagement records and sum totalMinutes per alumni, join with Dim_Students for name and program<br/>
                <strong>Engagement Count:</strong> Row count per student_id<br/>
                <strong>Total Minutes:</strong> Sum of engagement_minutes + (mentorship_hours × 60) per student_id<br/>
                <strong>Display:</strong> Top 10 alumni sorted by engagementCount descending
              </p>
              </div>
            </div>
          </ChartCard>
        </div>

          {/* Insight Tiles - 40% width (2 columns) */}
          <div className="lg:col-span-2">
            <ChartCard
              title="Key Insights"
              subtitle="Top performers and engagement highlights"
            >
              <div className="grid grid-cols-1 gap-4">
                <InsightCard
                  label="Most Engaged Program"
                  value={metrics.mostEngagedProgram?.program || 'N/A'}
                  subtitle={metrics.mostEngagedProgram ? `${metrics.mostEngagedProgram.engagedAlumni} engaged alumni` : ''}
                />
                <InsightCard
                  label="Top Engagement Location"
                  value={metrics.topLocation?.location || 'N/A'}
                  subtitle={metrics.topLocation ? `${metrics.topLocation.engagedAlumni} engaged alumni` : ''}
                />
                <InsightCard
                  label="Most Active Cohort"
                  value={metrics.mostActiveCohort ? `Class of ${metrics.mostActiveCohort.year}` : 'N/A'}
                  subtitle={metrics.mostActiveCohort ? `${metrics.mostActiveCohort.engagedAlumni} engaged alumni` : ''}
                />
                <InsightCard
                  label="Most Popular Engagement Type"
                  value={metrics.mostPopularType?.type || 'N/A'}
                  subtitle={metrics.mostPopularType ? `${metrics.mostPopularType.totalEngagements} total engagements` : ''}
                />
            </div>
          </ChartCard>
          </div>
        </div>

        {/* ALUMNI ENGAGEMENT TREND - Before Location Map */}
        <div className="mb-6">
          <ChartCard
            title="Alumni Engagement Trend"
            subtitle="Month-over-month view of engaged alumni and interactions"
          >
            {metrics.engagementTrendByMonth.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[560px] text-slate-500">
                No engagement data available for the selected filters
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={500}>
                <AreaChart 
                  data={metrics.engagementTrendByMonth}
                  margin={{ top: 30, right: 30, left: 20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="engagedAlumniAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#002F6C" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#002F6C" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="touchpointsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FDB515" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#FDB515" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="monthLabel" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                      <Tooltip
                    content={<CustomTooltip />}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#475569', fontSize: '14px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="engagedAlumni" 
                    name="Engaged Alumni"
                    stroke="#002F6C" 
                    strokeWidth={3}
                    fill="url(#engagedAlumniAreaGradient)"
                    dot={{ r: 4, fill: '#002F6C' }}
                    activeDot={{ r: 6 }}
                  >
                    <LabelList
                      dataKey="engagedAlumni" 
                      position="top" 
                      formatter={(value) => value.toLocaleString()}
                      style={{ fill: '#002F6C', fontSize: '11px', fontWeight: '600' }}
                    />
                  </Area>
                  <Area
                    type="monotone"
                    dataKey="totalTouchpoints" 
                    name="Total Touchpoints"
                        stroke="#FDB515"
                    strokeWidth={3}
                    fill="url(#touchpointsAreaGradient)"
                    dot={{ r: 4, fill: '#FDB515' }}
                        activeDot={{ r: 6 }}
                  >
                    <LabelList 
                      dataKey="totalTouchpoints" 
                      position="top" 
                      formatter={(value) => value.toLocaleString()}
                      style={{ fill: '#FDB515', fontSize: '11px', fontWeight: '600' }}
                    />
                  </Area>
                </AreaChart>
                  </ResponsiveContainer>
            )}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 group relative">
              <h4 className="text-xs font-semibold text-slate-700 mb-1 cursor-help flex items-center gap-1">
                📊 Calculation & Data Source
                <span className="text-slate-400 group-hover:text-slate-600">(Hover for details)</span>
              </h4>
              <div className="hidden group-hover:block">
                <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Data Sources:</strong> <code className="text-xs bg-slate-200 px-1 rounded">fact_alumni_engagement.csv</code>, <code className="text-xs bg-slate-200 px-1 rounded">dim_date.csv</code><br/>
                <strong>Method:</strong> Group engagement records by month (from engagement_date), count distinct engaged alumni per month, count total touchpoints (engagement records) per month<br/>
                <strong>Engaged Alumni:</strong> Distinct count of student_id per month<br/>
                <strong>Total Touchpoints:</strong> Row count per month (total engagement records)<br/>
                <strong>Display:</strong> Area chart with two series: Engaged Alumni (blue) and Total Touchpoints (gold)
              </p>
                </div>
                </div>
          </ChartCard>
        </div>

        {/* LOCATION MAP ROW - Full Width (Before Predictive Insights) */}
        <div className="mb-6">
          <ChartCard
            title="Alumni Engagement by Location"
            subtitle="Geographic distribution of engaged alumni across regions"
          >
            <AlumniLocationMap data={metrics.engagedAlumniByLocation} />
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 group relative">
              <h4 className="text-xs font-semibold text-slate-700 mb-1 cursor-help flex items-center gap-1">
                📊 Calculation & Data Source
                <span className="text-slate-400 group-hover:text-slate-600">(Hover for details)</span>
              </h4>
              <div className="hidden group-hover:block">
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Data Sources:</strong> <code className="text-xs bg-slate-200 px-1 rounded">Dim_Students.csv</code>, <code className="text-xs bg-slate-200 px-1 rounded">fact_alumni_engagement.csv</code><br/>
                  <strong>Method:</strong> Get distinct engaged student_ids from fact_alumni_engagement, join with Dim_Students to fetch location (current_city/current_state), map city names to US state codes, group by state code<br/>
                  <strong>Count:</strong> Distinct count of student_id per location (state)<br/>
                  <strong>Display:</strong> US map with state abbreviations and engaged alumni counts, color-coded by engagement level
                </p>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* PREDICTIVE INSIGHTS SECTION - 5 Alumni-SLU Relationship Predictions */}
        {predictiveInsights && (
          <div className="mb-6">
            <div className="bg-gradient-to-br from-sluBlue via-blue-700 to-blue-800 rounded-2xl shadow-xl p-8 text-white">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">🔮 Alumni-SLU Relationship Predictions</h2>
                <p className="text-blue-100 text-lg">
                  Data-driven insights to strengthen SLU-alumni relationships and engagement
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* 1. Top Programs for Growth */}
                {predictiveInsights.topPrograms && predictiveInsights.topPrograms.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2 group relative">
                      <span>📈</span> Top Programs for Engagement Growth
                      <InfoTooltip
                        title="Calculation Method"
                        content={`Data Sources: Dim_Students.csv, fact_alumni_engagement.csv\nMethod: Calculate engagement rate per program (engaged alumni / total alumni × 100). Identify programs with engagement rate < 80% as having growth potential.\nFormula: (Engaged Alumni / Total Alumni) × 100\nGrowth Potential: High = < 50% engaged, Moderate = 50-80% engaged`}
                      />
                    </h3>
                    <div className="space-y-2">
                      {predictiveInsights.topPrograms.map((prog, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-white text-sm">{prog.program}</p>
                              <p className="text-xs text-blue-200">{prog.engagedAlumni} / {prog.totalAlumni} engaged</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-sluGold">{prog.engagementRate}%</p>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                prog.growthPotential === 'High' ? 'bg-green-500/30 text-green-200' : 'bg-yellow-500/30 text-yellow-200'
                              }`}>
                                {prog.growthPotential}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Alumni Job Roles */}
                {predictiveInsights.jobRoles && predictiveInsights.jobRoles.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <span>💼</span> Alumni Job Roles
                      <InfoTooltip
                        title="Calculation Method"
                        content={`Data Sources: alumni_employment.csv\nMethod: Count verified employment records by job_title, group by role and count alumni.\nFormula: COUNT(*) WHERE status = 'Verified' GROUP BY job_title\nSorted by: Alumni count (descending)`}
                      />
                    </h3>
                    <div className="space-y-2">
                      {predictiveInsights.jobRoles.map((role, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-white text-sm">{role.role}</p>
                              <p className="text-xs text-blue-200">{role.topProgram} program</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-sluGold">{role.count}</p>
                              <p className="text-xs text-blue-200">alumni</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Technology Insights */}
                {predictiveInsights.technologies && predictiveInsights.technologies.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <span>💻</span> Technology Insights
                      <InfoTooltip
                        title="Calculation Method"
                        content={`Data Sources: employer_alumni_feedback.csv\nMethod: Extract technologies from approved feedback, count occurrences, calculate average rating per technology.\nFormula: COUNT(*) GROUP BY technology, AVG(rating_overall) per technology\nSorted by: Feedback count (descending)`}
                      />
                    </h3>
                    <div className="space-y-2">
                      {predictiveInsights.technologies.map((tech, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-white text-sm">{tech.technology}</p>
                              <p className="text-xs text-blue-200">Avg rating: {tech.avgRating}/5</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-sluGold">{tech.count}</p>
                              <p className="text-xs text-blue-200">mentions</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Gender Insights */}
                {predictiveInsights.genderInsights && predictiveInsights.genderInsights.distribution && predictiveInsights.genderInsights.distribution.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <span>👥</span> Gender Engagement Insights
                      <InfoTooltip
                        title="Calculation Method"
                        content={`Data Sources: Dim_Students.csv, fact_alumni_engagement.csv\nMethod: Group alumni by gender, calculate engagement rate and average engagements per gender.\nFormula: (Engaged Alumni / Total Alumni) × 100 per gender\nSorted by: Engagement rate (descending)`}
                      />
                    </h3>
                    <div className="space-y-2">
                      {predictiveInsights.genderInsights.distribution.map((gender, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-white text-sm">{gender.gender}</p>
                              <p className="text-xs text-blue-200">{gender.engaged} / {gender.total} engaged</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-sluGold">{gender.engagementRate}%</p>
                              <p className="text-xs text-blue-200">{gender.avgEngagements} avg</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Engagement Forecast */}
                {predictiveInsights.engagementForecast && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 lg:col-span-2 xl:col-span-1">
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <span>📊</span> Engagement Trend Forecast
                      <InfoTooltip
                        title="Calculation Method"
                        content={`Data Sources: fact_alumni_engagement.csv\nMethod: Group engagement records by month, calculate average engaged alumni from last 3 months, apply growth rate from last 6 months trend.\nFormula: AVG(last 3 months engaged) × (1 + growth_rate/100)\nGrowth Rate: ((recent - older) / older) × 100 from 6-month trend`}
                      />
                    </h3>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-blue-200 mb-1">Current Engaged</p>
                          <p className="text-2xl font-bold text-white">{predictiveInsights.engagementForecast.currentEngaged}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-200 mb-1">3-Month Forecast</p>
                          <p className="text-2xl font-bold text-sluGold">{predictiveInsights.engagementForecast.forecast3Months}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-200 mb-1">Growth Rate</p>
                          <p className="text-lg font-bold text-white">{predictiveInsights.engagementForecast.growthRate}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-200 mb-1">Trend</p>
                          <span className={`text-sm px-2 py-1 rounded ${
                            predictiveInsights.engagementForecast.trend === 'Growing' 
                              ? 'bg-green-500/30 text-green-200'
                              : predictiveInsights.engagementForecast.trend === 'Stable'
                              ? 'bg-blue-500/30 text-blue-200'
                              : 'bg-red-500/30 text-red-200'
                          }`}>
                            {predictiveInsights.engagementForecast.trend}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analysis Summary Section - Collapsible */}
        <div className="mt-6 bg-gradient-to-br from-white via-blue-50/50 to-blue-50/30 rounded-xl shadow-md border border-blue-300/60 overflow-hidden">
          <button
            onClick={() => setShowAnalysisSummary(!showAnalysisSummary)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-slate-800">Analysis Summary</h3>
              <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded">
                Click to {showAnalysisSummary ? 'hide' : 'view'} details
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-slate-600 transition-transform ${showAnalysisSummary ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showAnalysisSummary && (
            <div className="px-6 pb-6">
              <p className="text-slate-600 mb-6 text-sm">
                Overview of visualizations and predictive insights to help understand the dashboard.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Visualizations */}
            <div className="space-y-4">
              <h4 className="text-base font-semibold text-slate-800 mb-3">Visualization Guide</h4>
              <div>
                <h5 className="font-semibold text-slate-800 mb-2 text-sm">📊 KPIs</h5>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 ml-3">
                  <li><strong>Total Alumni:</strong> Complete alumni base size</li>
                  <li><strong>Engaged Alumni:</strong> Alumni who participated in SLU activities</li>
                  <li><strong>Engagement Rate:</strong> Percentage of actively engaged alumni</li>
                  <li><strong>Total Touchpoints:</strong> Total engagement interactions</li>
                  <li><strong>Total Engagement Minutes:</strong> Time spent in activities</li>
                  <li><strong>Avg Touchpoints:</strong> Average interactions per engaged alumni</li>
                </ul>
        </div>

              <div>
                <h5 className="font-semibold text-slate-800 mb-1 text-sm">🗺️ Alumni Engagement by Location</h5>
                <p className="text-xs text-slate-600">Shows which states have the most engaged alumni. Helps identify where to focus regional events and outreach.</p>
              </div>

              <div>
                <h5 className="font-semibold text-slate-800 mb-1 text-sm">🎓 Engaged Alumni by Program</h5>
                <p className="text-xs text-slate-600">Displays which academic programs have the highest alumni engagement. Programs with higher bars have stronger alumni connections.</p>
              </div>

              <div>
                <h5 className="font-semibold text-slate-800 mb-1 text-sm">📈 Engagement by Type</h5>
                <p className="text-xs text-slate-600">Compares different engagement activities (Events, Mentorship, Giving, etc.). Shows which types alumni prefer most.</p>
              </div>

              <div>
                <h5 className="font-semibold text-slate-800 mb-1 text-sm">🎯 Engagement by Graduation Cohort</h5>
                <p className="text-xs text-slate-600">Shows engagement levels by graduation year. Helps identify which classes maintain strongest connections to SLU.</p>
              </div>

              <div>
                <h5 className="font-semibold text-slate-800 mb-1 text-sm">⭐ Top Engaged Alumni</h5>
                <p className="text-xs text-slate-600">Lists alumni with the highest engagement. These individuals are ideal candidates for mentorship and ambassador roles.</p>
              </div>

              <div>
                <h5 className="font-semibold text-slate-800 mb-1 text-sm">📊 Alumni Engagement Trend</h5>
                <p className="text-xs text-slate-600">Area chart showing month-over-month trends. Tracks both engaged alumni count and total interactions over time.</p>
              </div>
            </div>

            {/* Right Column - Predictions & Insights */}
            <div className="space-y-4">
              <h4 className="text-base font-semibold text-slate-800 mb-3">Predictions & Insights</h4>
              
              <div>
                <h5 className="font-semibold text-slate-800 mb-2 text-sm">🔮 Predictive Insights</h5>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 ml-3">
                  <li><strong>High-Potential Matches:</strong> Alumni-employer connections with strong alignment scores</li>
                  <li><strong>Hiring Forecast:</strong> Predicted hiring activity by program and employer for next quarter</li>
                  <li><strong>Networking Opportunities:</strong> Recommended connections for mentorship and events</li>
                  <li><strong>Partnership Strength:</strong> Forecasted partnership scores and trend indicators</li>
                </ul>
              </div>

              <div>
                <h5 className="font-semibold text-slate-800 mb-2 text-sm">📊 Key Insights</h5>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 ml-3">
                  <li>Technology and analytics programs show higher engagement rates</li>
                  <li>Events are the most common engagement type</li>
                  <li>Major cities (Chicago, Dallas, NYC, Seattle) have highest alumni concentration</li>
                  <li>Engagement patterns are stable across years, indicating sustainable connections</li>
                </ul>
              </div>

              <div>
                <h5 className="font-semibold text-slate-800 mb-2 text-sm">📈 Forecasts</h5>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 ml-3">
                  <li>Engagement projected to continue growing</li>
                  <li>Peak periods typically occur in spring and fall</li>
                  <li>High-performing programs likely to maintain momentum</li>
                  <li>Recent cohorts with strong engagement will likely remain engaged</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-sluBlue to-blue-700 rounded-lg p-4 text-white">
                <h5 className="text-sm font-bold mb-2">💡 Recommendations</h5>
                <ul className="list-disc list-inside space-y-1 text-xs text-blue-50">
                  <li>Focus regional events in high-engagement cities</li>
                  <li>Use top engaged alumni as mentors and ambassadors</li>
                  <li>Schedule major campaigns during peak seasons</li>
                  <li>Replicate successful strategies from high-performing programs</li>
                </ul>
              </div>
            </div>
              </div>
            </div>
            )}
        </div>
      </div>
      
      {/* Footer Section */}
      <div className="container mx-auto px-4 py-8">
        <GalleryFooter />
      </div>
    </div>
  );
};

export default AlumniDashboard;
