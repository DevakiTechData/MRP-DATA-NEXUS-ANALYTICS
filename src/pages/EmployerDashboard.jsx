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
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  LabelList,
} from 'recharts';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import PageHero from '../components/PageHero';
import InfoTooltip from '../components/InfoTooltip';
import { loadAllData } from '../data/loadData';
import {
  calculateActiveEmployers,
  calculateAvgEmployerRating,
  calculateHiringConversionRate,
  calculateEmployerEngagementScores,
  calculateEmployerParticipationTrend,
  calculateIndustryDistribution,
  calculateTopHiringEmployers,
  calculateOpportunitiesVsHires,
  calculateAlumniEmployedPerEmployer,
  calculateTechnicalStrengthByYear,
  calculateHiringFunnel,
  getAlumniEmployedAtPartners,
  getEmployersWithRecentFeedback,
  getEngagementScorecardByEmployer,
} from '../utils/metrics';
import { getEmployerSLUPredictions } from '../utils/employerPredictions';
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

const EMPLOYER_HERO_IMAGES = [
  {
    src: '/assets/hero/engagement img1.jpeg',
    alt: 'Employers collaborating with SLU students',
    caption: 'Strong partnerships delivering experiential learning and meaningful hires.',
  },
  {
    src: '/assets/hero/event img2.jpeg',
    alt: 'Innovation lab with corporate partners',
    caption: 'Innovation labs co-designed with employers across the Midwest.',
  },
  {
    src: '/assets/employers/Comp img4.jpg',
    alt: 'Corporate office representing SLU partners',
    caption: 'National employers investing in SLU talent pipelines.',
  },
];

const EmployerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnalysisSummary, setShowAnalysisSummary] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    year: '',
    industry: '',
    location: '',
    employerSize: '',
    program: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Data loading timeout after 30 seconds')), 30000);
        });
        
        const loadedData = await Promise.race([
          loadAllData(),
          timeoutPromise
        ]);
        
        setData(loadedData);
      } catch (error) {
        console.error('Error loading data:', error);
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
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter data based on active filters
  const filteredData = useMemo(() => {
    if (!data) return null;

    let { employers, alumniEngagement, dates, alumniEmployment, employerFeedback, students } = data;
    let filteredEmployers = [...employers];
    let filteredEngagement = [...alumniEngagement];
    let filteredEmployment = [...(alumniEmployment || [])];
    let filteredFeedback = [...(employerFeedback || [])];

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
        const dateKey = String(e.event_date_key || e.hire_date_key || '');
        return validDateKeys.has(dateKey);
      });
    }

    // Filter by industry
    if (filters.industry) {
      filteredEmployers = filteredEmployers.filter(e => 
        (e.industry || '').toLowerCase().includes(filters.industry.toLowerCase())
      );
      const industryEmployerIds = new Set(filteredEmployers.map(e => String(e.employer_key || e.employer_id)));
      filteredEngagement = filteredEngagement.filter(e => {
        const employerId = String(e.employer_key || e.employer_id);
        return industryEmployerIds.has(employerId);
      });
      filteredEmployment = filteredEmployment.filter(e => {
        const employerId = String(e.employer_key || e.employer_id);
        return industryEmployerIds.has(employerId);
      });
    }

    // Filter by location
    if (filters.location) {
      filteredEmployers = filteredEmployers.filter(e => {
        const city = (e.city || '').toLowerCase();
        const state = (e.state || '').toLowerCase();
        const locationFilter = filters.location.toLowerCase();
        return city.includes(locationFilter) || state.includes(locationFilter);
      });
      const locationEmployerIds = new Set(filteredEmployers.map(e => String(e.employer_key || e.employer_id)));
      filteredEngagement = filteredEngagement.filter(e => {
        const employerId = String(e.employer_key || e.employer_id);
        return locationEmployerIds.has(employerId);
      });
      filteredEmployment = filteredEmployment.filter(e => {
        const employerId = String(e.employer_key || e.employer_id);
        return locationEmployerIds.has(employerId);
      });
    }

    // Filter by program (through students)
    if (filters.program && students) {
      const programStudents = students.filter(s => 
        (s.program_name || s.major || '').toLowerCase().includes(filters.program.toLowerCase())
      );
      const programStudentIds = new Set(programStudents.map(s => String(s.student_key || s.student_id)));
      filteredEngagement = filteredEngagement.filter(e => {
        const studentId = String(e.student_key || e.student_id);
        return programStudentIds.has(studentId);
      });
      filteredEmployment = filteredEmployment.filter(e => {
        const studentId = String(e.student_key || e.student_id);
        return programStudentIds.has(studentId);
      });
    }

    return {
      employers: filteredEmployers,
      alumniEngagement: filteredEngagement,
      dates,
      alumniEmployment: filteredEmployment,
      employerFeedback: filteredFeedback,
      students,
    };
  }, [data, filters]);

  // Get unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    if (!data) return { years: [], industries: [], locations: [], programs: [] };

    const { employers, dates, students } = data;
    
    const years = [...new Set(dates.map(d => d.year).filter(Boolean))].sort((a, b) => b - a);
    const industries = [...new Set(employers.map(e => e.industry).filter(Boolean))].sort();
    const locations = [...new Set(employers.map(e => e.city || e.state).filter(Boolean))].sort();
    const programs = [...new Set(students.map(s => s.program_name || s.major).filter(Boolean))].sort();

    return { years, industries, locations, programs };
  }, [data]);

  const metrics = useMemo(() => {
    if (!filteredData) return null;

    const { employers, alumniEngagement, dates, alumniEmployment, employerFeedback } = filteredData;

    // Calculate all metrics using utility functions
    const activeEmployers = calculateActiveEmployers(employers, alumniEngagement);
    const avgEmployerRating = calculateAvgEmployerRating(employers);
    const hiringConversion = calculateHiringConversionRate(alumniEngagement);
    const employerEngagementScores = calculateEmployerEngagementScores(employers, alumniEngagement);
    const participationTrend = calculateEmployerParticipationTrend(alumniEngagement, dates);
    const industryDistribution = calculateIndustryDistribution(employers, alumniEngagement);
    const topHiringEmployers = calculateTopHiringEmployers(employers, alumniEngagement);
    const opportunitiesVsHires = calculateOpportunitiesVsHires(alumniEngagement, dates);
    
    // Additional metrics
    const alumniEmployedPerEmployer = calculateAlumniEmployedPerEmployer(alumniEmployment || [], employers);
    const technicalStrengthByYear = calculateTechnicalStrengthByYear(employerFeedback || []);
    const hiringFunnel = calculateHiringFunnel(alumniEngagement);
    const alumniEmployedAtPartners = getAlumniEmployedAtPartners(alumniEmployment || []);
    const employersWithRecentFeedback = getEmployersWithRecentFeedback(employerFeedback || []);
    const engagementScorecard = getEngagementScorecardByEmployer(employerEngagementScores, 10);

    // Calculate average engagement score
    const avgEngagementScore = employerEngagementScores.length > 0
      ? employerEngagementScores.reduce((sum, emp) => sum + emp.engagementScore, 0) / employerEngagementScores.length
      : 0;

    return {
      activeEmployers,
      avgEmployerRating,
      hiringConversion,
      avgEngagementScore,
      alumniEmployedAtPartners,
      employersWithRecentFeedback,
      employerEngagementScores,
      participationTrend,
      industryDistribution,
      topHiringEmployers,
      opportunitiesVsHires,
      alumniEmployedPerEmployer,
      technicalStrengthByYear,
      hiringFunnel,
      engagementScorecard,
    };
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
        const { employers, alumniEmployment, alumniEngagement, events } = data;
        
        // Use setTimeout to defer calculation and allow main UI to render first
        setTimeout(() => {
          try {
            const predictions = getEmployerSLUPredictions(employers, alumniEmployment, alumniEngagement, events);
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

  if (!data || !metrics) {
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
            <li>• Browser console for detailed error messages</li>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 pb-16">
      <PageHero
        images={EMPLOYER_HERO_IMAGES}
        eyebrow="Employer Insights"
        title="Employer Engagement Dashboard"
        subtitle="Track partnerships, hiring, and employer relationships"
        description="Measure employer engagement, hiring trends, and partnership strength. Visualize industry distribution, participation trends, and top hiring partners to strengthen career services."
        actions={[
          { to: '/', label: 'Back to Home', variant: 'secondary' },
          { href: '#employer-kpis', label: 'Explore KPIs' },
        ]}
      />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 id="employer-kpis" className="text-2xl font-bold text-slate-800 mb-2">
            Employer Engagement Dashboard
        </h2>
          <p className="text-sm text-slate-600">Comprehensive analytics and insights into employer partnerships and hiring outcomes</p>
        </div>

        {/* FILTERS ROW */}
        <div className="bg-gradient-to-br from-white via-blue-50/60 to-blue-50/40 rounded-xl shadow-md border border-blue-300/60 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Industry</label>
              <select
                value={filters.industry}
                onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sluBlue focus:ring focus:ring-sluBlue/20"
              >
                <option value="">All Industries</option>
                {filterOptions.industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Program / Cohort</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Employer Size</label>
              <select
                value={filters.employerSize}
                onChange={(e) => setFilters({ ...filters, employerSize: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sluBlue focus:ring focus:ring-sluBlue/20"
              >
                <option value="">All Sizes</option>
                <option value="small">Small (1-50)</option>
                <option value="medium">Medium (51-500)</option>
                <option value="large">Large (500+)</option>
              </select>
            </div>
          </div>
          {(filters.year || filters.industry || filters.location || filters.program || filters.employerSize) && (
            <button
              onClick={() => setFilters({ year: '', industry: '', location: '', program: '', employerSize: '' })}
              className="mt-4 text-sm text-sluBlue hover:text-blue-700 font-medium"
            >
              Clear All Filters
            </button>
          )}
        </div>

        {/* KPI TILES ROW - 6 KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6 w-full">
          <KPICard
            title="Active Employers"
            value={metrics.activeEmployers.toLocaleString()}
            tooltip="Employers who have participated in events, hired alumni, or engaged with SLU."
            calculation={{
              dataSources: ['fact_alumni_engagement.csv'],
              method: 'Distinct count of employer_key from engagement records where employer has at least one engagement record',
              formula: 'COUNT(DISTINCT employer_key) WHERE employer_key IS NOT NULL'
            }}
          />
          <KPICard
            title="Avg Employer Rating"
            value={metrics.avgEmployerRating.toFixed(2)}
            tooltip="Average rating of employers based on their partnership quality and engagement."
            calculation={{
              dataSources: ['dim_employers.csv'],
              method: 'Mean of employer_rating field, filtered for valid ratings (> 0)',
              formula: 'AVG(employer_rating) WHERE employer_rating IS NOT NULL AND employer_rating > 0'
            }}
          />
          <KPICard
            title="Hiring Conversion Rate"
            value={`${metrics.hiringConversion.conversionRate.toFixed(1)}%`}
            tooltip="Percentage of job opportunities that convert to actual hires."
            calculation={{
              dataSources: ['fact_alumni_engagement.csv'],
              method: 'Count engagement records where hired_flag = \'1\' divided by count where job_offers_count > 0 OR applications_submitted > 0, multiplied by 100',
              formula: '(COUNT(*) WHERE hired_flag = \'1\') / (COUNT(*) WHERE job_offers_count > 0 OR applications_submitted > 0) × 100'
            }}
          />
          <KPICard
            title="Avg Engagement Score"
            value={metrics.avgEngagementScore.toFixed(2)}
            tooltip="Average composite engagement score across all active employers."
            calculation={{
              dataSources: ['fact_alumni_engagement.csv', 'dim_employers.csv'],
              method: 'Calculate composite score per employer: (Events × 1) + (Students × 0.5) + (Hires × 2), then average across all active employers',
              formula: 'AVG((eventsCount × 1) + (studentsInteracted × 0.5) + (hires × 2))'
            }}
          />
          <KPICard
            title="Alumni Employed at Partners"
            value={metrics.alumniEmployedAtPartners.toLocaleString()}
            tooltip="Total number of verified SLU alumni currently employed at partner organizations."
            calculation={{
              dataSources: ['alumni_employment.csv'],
              method: 'Distinct count of student_key from employment records where status = \'Verified\'',
              formula: 'COUNT(DISTINCT student_key) WHERE status = \'Verified\''
            }}
          />
          <KPICard
            title="Employers with Recent Feedback"
            value={metrics.employersWithRecentFeedback.toLocaleString()}
            tooltip="Number of employers who have provided feedback in the last 6 months."
            calculation={{
              dataSources: ['employer_alumni_feedback.csv'],
              method: 'Distinct count of employer_key where feedback is approved OR created within last 6 months',
              formula: 'COUNT(DISTINCT employer_key) WHERE approved_by_admin = \'1\' OR created_at >= (NOW() - 6 months)'
            }}
          />
        </div>

        {/* KPI Calculations Explanation */}
        <div className="mb-6 bg-gradient-to-br from-blue-50/50 to-slate-50 rounded-xl border border-blue-200/60 p-4">
          <details className="group">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700 hover:text-sluBlue flex items-center gap-2">
              <span>📊</span>
              <span>View KPI Calculation Details</span>
              <span className="text-xs text-slate-500 group-open:hidden">(Click to expand)</span>
            </summary>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-800 mb-2">Active Employers</p>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Source:</strong> <code className="text-xs bg-slate-100 px-1 rounded">fact_alumni_engagement.csv</code><br/>
                  <strong>Method:</strong> Distinct count of <code className="text-xs bg-slate-100 px-1 rounded">employer_key</code> where employer has at least one engagement record
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-800 mb-2">Avg Employer Rating</p>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Source:</strong> <code className="text-xs bg-slate-100 px-1 rounded">dim_employers.csv</code><br/>
                  <strong>Method:</strong> Mean of <code className="text-xs bg-slate-100 px-1 rounded">employer_rating</code> field (filtered for valid ratings &gt; 0)
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-800 mb-2">Hiring Conversion Rate</p>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Source:</strong> <code className="text-xs bg-slate-100 px-1 rounded">fact_alumni_engagement.csv</code><br/>
                  <strong>Method:</strong> (Total Hires / Total Opportunities) × 100<br/>
                  <strong>Hires:</strong> Count where <code className="text-xs bg-slate-100 px-1 rounded">hired_flag = '1'</code><br/>
                  <strong>Opportunities:</strong> Count where <code className="text-xs bg-slate-100 px-1 rounded">job_offers_count</code> &gt; 0 OR <code className="text-xs bg-slate-100 px-1 rounded">applications_submitted</code> &gt; 0
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-800 mb-2">Avg Engagement Score</p>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Source:</strong> <code className="text-xs bg-slate-100 px-1 rounded">dim_employers.csv</code>, <code className="text-xs bg-slate-100 px-1 rounded">fact_alumni_engagement.csv</code><br/>
                  <strong>Formula:</strong> (Events × 1) + (Students × 0.5) + (Hires × 2)<br/>
                  <strong>Method:</strong> Calculate score per employer, then average across all active employers
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-800 mb-2">Alumni Employed at Partners</p>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Source:</strong> <code className="text-xs bg-slate-100 px-1 rounded">alumni_employment.csv</code><br/>
                  <strong>Method:</strong> Distinct count of <code className="text-xs bg-slate-100 px-1 rounded">student_key</code> where <code className="text-xs bg-slate-100 px-1 rounded">status = 'Verified'</code>
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-800 mb-2">Employers with Recent Feedback</p>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Source:</strong> <code className="text-xs bg-slate-100 px-1 rounded">employer_alumni_feedback.csv</code><br/>
                  <strong>Method:</strong> Distinct count of <code className="text-xs bg-slate-100 px-1 rounded">employer_key</code> where feedback is approved OR created within last 6 months
                </p>
              </div>
            </div>
          </details>
        </div>

        {/* ROW 4 - Industry & Scorecard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Industry Distribution */}
          <ChartCard
            title="Industry Distribution of Active Employers"
            subtitle="Breakdown of employers by industry sector"
          >
            {metrics.industryDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[560px] text-slate-500">
                No industry data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={500}>
              <PieChart>
                <Pie
                    data={metrics.industryDistribution.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                    label={({ industry, percent }) => `${industry} ${(percent).toFixed(0)}%`}
                    outerRadius={120}
                  fill="#8884d8"
                    dataKey="count"
                >
                    {metrics.industryDistribution.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} employers (${props.payload.percent.toFixed(2)}%)`,
                      'Count'
                    ]} 
                  />
                  <Legend 
                    wrapperStyle={{ color: '#475569', fontSize: '12px' }}
                  />
              </PieChart>
            </ResponsiveContainer>
            )}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 group relative">
              <h4 className="text-xs font-semibold text-slate-700 mb-1 cursor-help flex items-center gap-1">
                📊 Calculation & Data Source
                <span className="text-slate-400 group-hover:text-slate-600">(Hover for details)</span>
              </h4>
              <div className="hidden group-hover:block">
                <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Data Sources:</strong> <code className="text-xs bg-slate-200 px-1 rounded">dim_employers.csv</code>, <code className="text-xs bg-slate-200 px-1 rounded">fact_alumni_engagement.csv</code><br/>
                <strong>Method:</strong> Filter active employers (those with engagement records), group by <code className="text-xs bg-slate-200 px-1 rounded">industry</code> field from <code className="text-xs bg-slate-200 px-1 rounded">dim_employers</code><br/>
                <strong>Count:</strong> Distinct count of <code className="text-xs bg-slate-200 px-1 rounded">employer_key</code> per industry<br/>
                <strong>Percentage:</strong> (Industry Count / Total Active Employers) × 100, sorted by count descending
              </p>
              </div>
            </div>
          </ChartCard>

          {/* Employer Engagement Scorecard */}
          <ChartCard
            title="Employer Engagement Scorecard"
            subtitle="Top employers by composite engagement score"
          >
            {metrics.engagementScorecard.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[560px] text-slate-500">
                No engagement score data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={500}>
                <BarChart
                  data={metrics.engagementScorecard}
                  layout="vertical"
                  margin={{ top: 5, right: 80, left: 120, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="scorecardGradient" x1="0" y1="0" x2="1" y2="0">
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
                    dataKey="employerName" 
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
                    dataKey="engagementScore" 
                    name="Engagement Score" 
                    fill="url(#scorecardGradient)" 
                    radius={[0, 4, 4, 0]}
                  >
                    <LabelList
                      dataKey="engagementScore" 
                      position="right" 
                      formatter={(value) => value.toFixed(1)}
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
                <strong>Data Sources:</strong> <code className="text-xs bg-slate-200 px-1 rounded">dim_employers.csv</code>, <code className="text-xs bg-slate-200 px-1 rounded">fact_alumni_engagement.csv</code><br/>
                <strong>Engagement Score Formula:</strong> (Events Count × 1) + (Students Interacted × 0.5) + (Hires × 2)<br/>
                <strong>Events Count:</strong> Distinct <code className="text-xs bg-slate-200 px-1 rounded">event_key</code> per employer<br/>
                <strong>Students Interacted:</strong> Distinct <code className="text-xs bg-slate-200 px-1 rounded">student_key</code> per employer<br/>
                <strong>Hires:</strong> Count where <code className="text-xs bg-slate-200 px-1 rounded">hired_flag = '1'</code> per employer<br/>
                <strong>Display:</strong> Top 10 employers sorted by engagement score descending
              </p>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* ROW 5 - Alumni & Skills Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* SLU Alumni Employed by Employer */}
          <ChartCard
            title="SLU Alumni Employed by Employer"
            subtitle="Top 10 employers by verified alumni count"
          >
            {metrics.alumniEmployedPerEmployer.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[560px] text-slate-500">
                No employment data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={500}>
                <BarChart
                  data={metrics.alumniEmployedPerEmployer}
                  layout="vertical"
                  margin={{ top: 5, right: 80, left: 120, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="alumniEmployedGradient" x1="0" y1="0" x2="1" y2="0">
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
                    dataKey="employerName" 
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
                    dataKey="alumniCount" 
                    name="SLU Alumni" 
                    fill="url(#alumniEmployedGradient)" 
                    radius={[0, 4, 4, 0]}
                  >
                    <LabelList
                      dataKey="alumniCount" 
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
                <strong>Data Sources:</strong> <code className="text-xs bg-slate-200 px-1 rounded">alumni_employment.csv</code>, <code className="text-xs bg-slate-200 px-1 rounded">dim_employers.csv</code><br/>
                <strong>Method:</strong> Filter employment records where <code className="text-xs bg-slate-200 px-1 rounded">status = 'Verified'</code>, join with <code className="text-xs bg-slate-200 px-1 rounded">dim_employers</code> on <code className="text-xs bg-slate-200 px-1 rounded">employer_key</code><br/>
                <strong>Count:</strong> Count of distinct <code className="text-xs bg-slate-200 px-1 rounded">student_key</code> per <code className="text-xs bg-slate-200 px-1 rounded">employer_key</code><br/>
                <strong>Display:</strong> Top 10 employers sorted by verified alumni count descending
              </p>
              </div>
            </div>
          </ChartCard>

          {/* Technical Strength by Graduation Year */}
          <ChartCard
            title="Technical Strength by Graduation Year"
            subtitle="Employer feedback on alumni technical skills by cohort"
          >
            {metrics.technicalStrengthByYear.averageRatings.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[560px] text-slate-500">
                No feedback data available
        </div>
            ) : (
              <ResponsiveContainer width="100%" height={500}>
                <ComposedChart 
                  data={metrics.technicalStrengthByYear.averageRatings}
                  margin={{ top: 30, right: 30, left: 0, bottom: 60 }}
                >
                  <defs>
                    <linearGradient id="techRatingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#002F6C" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#4A90E2" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="graduationYear" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 5]}
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                      <Tooltip
                    formatter={(value) => [`${value}/5`, 'Average Rating']} 
                  />
                  <Legend 
                    wrapperStyle={{ color: '#475569', fontSize: '14px' }}
                  />
                  <Bar 
                    dataKey="avgRating" 
                    name="Average Rating (1-5)" 
                    fill="url(#techRatingGradient)" 
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList
                      dataKey="avgRating" 
                      position="top" 
                      formatter={(value) => value.toFixed(2)}
                      style={{ fill: '#1e293b', fontSize: '11px', fontWeight: '600' }}
                    />
                  </Bar>
                  <Line 
                    type="monotone" 
                    dataKey="avgRating" 
                    name="Trend" 
                    stroke="#FDB515" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#FDB515' }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
                  </ResponsiveContainer>
            )}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 group relative">
              <h4 className="text-xs font-semibold text-slate-700 mb-1 cursor-help flex items-center gap-1">
                📊 Calculation & Data Source
                <span className="text-slate-400 group-hover:text-slate-600">(Hover for details)</span>
              </h4>
              <div className="hidden group-hover:block">
                <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Data Sources:</strong> <code className="text-xs bg-slate-200 px-1 rounded">employer_alumni_feedback.csv</code><br/>
                <strong>Average Rating:</strong> Mean of <code className="text-xs bg-slate-200 px-1 rounded">rating_overall</code> grouped by <code className="text-xs bg-slate-200 px-1 rounded">graduation_year</code><br/>
                <strong>Method:</strong> Filter valid ratings (1-5 scale), group by <code className="text-xs bg-slate-200 px-1 rounded">graduation_year</code>, calculate average per year<br/>
                <strong>Trend Line:</strong> Shows rating progression across graduation cohorts<br/>
                <strong>Display:</strong> Years with feedback data, sorted chronologically
              </p>
              </div>
            </div>
          </ChartCard>

          {/* Overall Hiring Funnel */}
          <ChartCard
            title="Overall Hiring Funnel"
            subtitle="End-to-end hiring process metrics"
          >
            {metrics.hiringFunnel.opportunitiesCount === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[560px] text-slate-500">
                No hiring funnel data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={500}>
                <BarChart
                  data={[
                    { stage: 'Opportunities', count: metrics.hiringFunnel.opportunitiesCount },
                    { stage: 'Applications', count: metrics.hiringFunnel.applicationsCount },
                    { stage: 'Hires', count: metrics.hiringFunnel.hiresCount },
                  ]}
                  layout="vertical"
                  margin={{ top: 20, right: 80, left: 20, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="funnelGradient1" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4A90E2" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#002F6C" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="funnelGradient2" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#FDB515" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#FFD700" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="funnelGradient3" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7ED321" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#50E3C2" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    type="number" 
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis 
                    dataKey="stage" 
                    type="category" 
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
                    dataKey="count" 
                    name="Count"
                    radius={[0, 4, 4, 0]}
                  >
                    {[
                      { stage: 'Opportunities', fill: 'url(#funnelGradient1)' },
                      { stage: 'Applications', fill: 'url(#funnelGradient2)' },
                      { stage: 'Hires', fill: 'url(#funnelGradient3)' },
                    ].map((item, index) => (
                      <Cell key={`cell-${index}`} fill={item.fill} />
                    ))}
                    <LabelList
                      dataKey="count" 
                      position="right" 
                      formatter={(value) => value.toLocaleString()}
                      style={{ fill: '#1e293b', fontSize: '11px', fontWeight: '600' }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            {metrics.hiringFunnel.opportunitiesCount > 0 && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
                <p className="font-semibold mb-2">Conversion Metrics:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">Application Rate:</span> {metrics.hiringFunnel.applicationRate.toFixed(1)}%
            </div>
                  <div>
                    <span className="font-medium">Hire Rate:</span> {metrics.hiringFunnel.hireRate.toFixed(1)}%
            </div>
                </div>
              </div>
            )}
            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 group relative">
              <h4 className="text-xs font-semibold text-slate-700 mb-1 cursor-help flex items-center gap-1">
                📊 Calculation & Data Source
                <span className="text-slate-400 group-hover:text-slate-600">(Hover for details)</span>
              </h4>
              <div className="hidden group-hover:block">
                <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Data Sources:</strong> <code className="text-xs bg-slate-200 px-1 rounded">fact_alumni_engagement.csv</code><br/>
                <strong>Opportunities:</strong> Count where <code className="text-xs bg-slate-200 px-1 rounded">job_offers_count</code> &gt; 0 OR <code className="text-xs bg-slate-200 px-1 rounded">applications_submitted</code> &gt; 0<br/>
                <strong>Applications:</strong> Sum of <code className="text-xs bg-slate-200 px-1 rounded">applications_submitted</code> values<br/>
                <strong>Hires:</strong> Count where <code className="text-xs bg-slate-200 px-1 rounded">hired_flag = '1'</code><br/>
                <strong>Application Rate:</strong> (Applications / Opportunities) × 100<br/>
                <strong>Hire Rate:</strong> (Hires / Applications) × 100
              </p>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* ROW 6 - Detail & Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          {/* Top Hiring Employers Table - 60% width */}
          <div className="lg:col-span-3">
            <ChartCard
              title="Top Hiring Employers – Detailed View"
              subtitle="Comprehensive view of top performing employer partners"
              isTable={true}
            >
              {metrics.topHiringEmployers.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[400px] text-slate-500">
                  No employer data available for the selected filters
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm table-auto">
                    <thead className="bg-gradient-to-r from-slate-200 to-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-800">Rank</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-800">Employer</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-800">Industry</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-800">Hires</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-800">Events Attended</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-800">Engagement Score</th>
                  </tr>
                </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {metrics.topHiringEmployers.map((employer, index) => (
                        <tr key={index} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-800 font-medium">#{index + 1}</td>
                          <td className="px-4 py-3 text-slate-800 font-medium">{employer.employerName}</td>
                          <td className="px-4 py-3 text-slate-700">{employer.industry}</td>
                          <td className="px-4 py-3 text-slate-700">{employer.totalHires}</td>
                          <td className="px-4 py-3 text-slate-700">{employer.eventsAttended}</td>
                          <td className="px-4 py-3 text-slate-700">{employer.engagementScore.toFixed(2)}</td>
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
                <strong>Data Sources:</strong> <code className="text-xs bg-slate-200 px-1 rounded">dim_employers.csv</code>, <code className="text-xs bg-slate-200 px-1 rounded">fact_alumni_engagement.csv</code><br/>
                <strong>Ranking:</strong> Sorted by <code className="text-xs bg-slate-200 px-1 rounded">totalHires</code> descending (top 10)<br/>
                <strong>Total Hires:</strong> Count of records where <code className="text-xs bg-slate-200 px-1 rounded">hired_flag = '1'</code> per employer<br/>
                <strong>Events Attended:</strong> Distinct count of <code className="text-xs bg-slate-200 px-1 rounded">event_key</code> per employer<br/>
                <strong>Engagement Score:</strong> (Events × 1) + (Students Interacted × 0.5) + (Hires × 2)<br/>
                <strong>Industry:</strong> From <code className="text-xs bg-slate-200 px-1 rounded">dim_employers.industry</code> field
              </p>
              </div>
            </div>
          </ChartCard>
        </div>
 
          {/* Analysis Summary - 40% width */}
          <div className="lg:col-span-2">
            <ChartCard
              title="Analysis Summary"
              subtitle="Key insights and strategic recommendations"
            >
              <div className="prose prose-slate max-w-none text-sm">
                <p className="text-slate-600 mb-3">
                  This dashboard analyzes historic employer engagement data to reveal partnership strength, hiring effectiveness, and industry trends.
                </p>
                
                <h5 className="font-semibold text-slate-800 mb-2 mt-4">Strong Industries</h5>
                <p className="text-slate-600 mb-3">
                  {metrics.industryDistribution.length > 0 
                    ? `${metrics.industryDistribution[0]?.industry || 'Technology'} leads with ${metrics.industryDistribution[0]?.count || 0} active employers. Focus on maintaining and expanding partnerships in top-performing industries.`
                    : 'Industry data shows which sectors have the strongest SLU partnerships.'}
                </p>

                <h5 className="font-semibold text-slate-800 mb-2">Hiring Efficiency</h5>
                <p className="text-slate-600 mb-3">
                  The hiring funnel shows {metrics.hiringFunnel.applicationRate.toFixed(1)}% application rate and {metrics.hiringFunnel.hireRate.toFixed(1)}% hire rate. 
                  {metrics.hiringFunnel.hireRate > 20 
                    ? ' Strong conversion indicates effective employer-student matching.' 
                    : ' Opportunities exist to improve conversion through better candidate preparation and employer alignment.'}
                </p>

                <h5 className="font-semibold text-slate-800 mb-2">Cohort Performance</h5>
                <p className="text-slate-600">
                  Technical strength ratings by graduation year help identify which cohorts excel and which may need additional curriculum support or career preparation.
                </p>
              </div>
            </ChartCard>
          </div>
        </div>

        {/* ROW 2 - Employer Participation Trend (Full Width) - Moved Before Predictions */}
        <div className="mb-6">
          <ChartCard
            title="Employer Participation Trend"
            subtitle="Month-over-month view of active employers and total events"
          >
            {metrics.participationTrend.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[560px] text-slate-500">
                No participation data available for the selected filters
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={500}>
                <ComposedChart
                  data={metrics.participationTrend}
                  margin={{ top: 30, right: 30, left: 20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="activeEmployersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#002F6C" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#002F6C" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="totalEventsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FDB515" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FDB515" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="month" 
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
                  <Line 
                    type="monotone" 
                    dataKey="activeEmployers" 
                    name="Active Employers"
                    stroke="#002F6C" 
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#002F6C' }}
                    activeDot={{ r: 7 }}
                  >
                    <LabelList
                      dataKey="activeEmployers" 
                      position="top" 
                      formatter={(value) => value.toLocaleString()}
                      style={{ fill: '#002F6C', fontSize: '11px', fontWeight: '600' }}
                    />
                  </Line>
                  <Line
                    type="monotone"
                    dataKey="totalEvents" 
                    name="Total Events"
                    stroke="#FDB515"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#FDB515' }}
                    activeDot={{ r: 7 }}
                  >
                    <LabelList 
                      dataKey="totalEvents" 
                      position="top" 
                      formatter={(value) => value.toLocaleString()}
                      style={{ fill: '#FDB515', fontSize: '11px', fontWeight: '600' }}
                    />
                  </Line>
                </ComposedChart>
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
                <strong>Active Employers:</strong> Distinct count of <code className="text-xs bg-slate-200 px-1 rounded">employer_key</code> per month from engagement records<br/>
                <strong>Total Events:</strong> Distinct count of <code className="text-xs bg-slate-200 px-1 rounded">event_key</code> per month from engagement records<br/>
                <strong>Method:</strong> Grouped by month using <code className="text-xs bg-slate-200 px-1 rounded">event_date_key</code> joined with <code className="text-xs bg-slate-200 px-1 rounded">dim_date</code> to extract year and month
              </p>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* ROW 3 - Job Opportunities vs Hires (Full Width) - Moved Before Predictions */}
        <div className="mb-6">
          <ChartCard
            title="Job Opportunities vs Hires"
            subtitle="Monthly comparison of opportunities created and actual hires"
          >
            {metrics.opportunitiesVsHires.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[560px] text-slate-500">
                No opportunities data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={500}>
                <BarChart
                  data={metrics.opportunitiesVsHires}
                  margin={{ top: 30, right: 30, left: 0, bottom: 60 }}
                >
                  <defs>
                    <linearGradient id="opportunitiesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4A90E2" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#4A90E2" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="hiresGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FDB515" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#FFD700" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="month" 
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
                    dataKey="opportunities" 
                    name="Opportunities" 
                    fill="url(#opportunitiesGradient)" 
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList
                      dataKey="opportunities" 
                      position="top" 
                      formatter={(value) => value.toLocaleString()}
                      style={{ fill: '#1e293b', fontSize: '11px', fontWeight: '600' }}
                    />
                  </Bar>
                  <Bar 
                    dataKey="hires" 
                    name="Hires" 
                    fill="url(#hiresGradient)" 
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList
                      dataKey="hires" 
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
                <strong>Data Sources:</strong> <code className="text-xs bg-slate-200 px-1 rounded">fact_alumni_engagement.csv</code>, <code className="text-xs bg-slate-200 px-1 rounded">dim_date.csv</code><br/>
                <strong>Opportunities:</strong> Count of engagement records where <code className="text-xs bg-slate-200 px-1 rounded">job_offers_count</code> &gt; 0 OR <code className="text-xs bg-slate-200 px-1 rounded">applications_submitted</code> &gt; 0, grouped by month<br/>
                <strong>Hires:</strong> Count of engagement records where <code className="text-xs bg-slate-200 px-1 rounded">hired_flag = '1'</code>, grouped by month<br/>
                <strong>Method:</strong> Monthly aggregation using <code className="text-xs bg-slate-200 px-1 rounded">hire_date_key</code> or <code className="text-xs bg-slate-200 px-1 rounded">event_date_key</code> joined with <code className="text-xs bg-slate-200 px-1 rounded">dim_date</code>
              </p>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* PREDICTIVE INSIGHTS SECTION - 5 Employer-SLU Relationship Predictions */}
        {predictiveInsights && (
          <div className="mb-6">
            <div className="bg-gradient-to-br from-sluBlue via-blue-700 to-blue-800 rounded-2xl shadow-xl p-8 text-white">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">🔮 Employer-SLU Relationship Predictions</h2>
                <p className="text-blue-100 text-lg">
                  Data-driven insights to strengthen SLU-employer partnerships and hiring relationships
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* 1. Top Partnerships */}
                {predictiveInsights.topPartnerships && predictiveInsights.topPartnerships.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <span>💼</span> Strongest Employer Partnerships
                      <InfoTooltip
                        title="Calculation Method"
                        content={`Data Sources: dim_employers.csv, alumni_employment.csv, fact_alumni_engagement.csv\nMethod: Count verified hires per employer, count event participations, calculate partnership score (hires × 2 + events).\nFormula: (Verified Hires × 2) + Event Participations\nSorted by: Partnership score (descending)`}
                      />
                    </h3>
                    <div className="space-y-2">
                      {predictiveInsights.topPartnerships.map((partner, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-white text-sm">{partner.name}</p>
                              <p className="text-xs text-blue-200">{partner.industry}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-sluGold">{partner.score}</p>
                              <p className="text-xs text-blue-200">{partner.hires} hires, {partner.events} events</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Expansion Industries */}
                {predictiveInsights.expansionIndustries && predictiveInsights.expansionIndustries.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <span>📈</span> Industries with Expansion Potential
                      <InfoTooltip
                        title="Calculation Method"
                        content={`Data Sources: dim_employers.csv, alumni_employment.csv\nMethod: Group employers by industry, count total hires per industry, calculate average hires per employer.\nFormula: Total Hires / Employer Count per industry\nExpansion Potential: High = < 10 employers with hires, Moderate = 10+ employers with hires`}
                      />
                    </h3>
                    <div className="space-y-2">
                      {predictiveInsights.expansionIndustries.map((industry, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-white text-sm">{industry.industry}</p>
                              <p className="text-xs text-blue-200">{industry.employerCount} employers</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-sluGold">{industry.totalHires}</p>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                industry.expansionPotential === 'High' ? 'bg-green-500/30 text-green-200' : 'bg-yellow-500/30 text-yellow-200'
                              }`}>
                                {industry.expansionPotential}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Employers Ready for Hires */}
                {predictiveInsights.readyForHires && predictiveInsights.readyForHires.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <span>🎯</span> Employers Ready for More Hires
                      <InfoTooltip
                        title="Calculation Method"
                        content={`Data Sources: dim_employers.csv, alumni_employment.csv, fact_alumni_engagement.csv\nMethod: Count current verified hires, count recent engagements (last 6 months), calculate readiness score (hires + engagements × 0.5).\nFormula: Current Hires + (Recent Engagements × 0.5)\nFilter: Employers with hires > 0 AND recent engagements > 0`}
                      />
                    </h3>
                    <div className="space-y-2">
                      {predictiveInsights.readyForHires.map((employer, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-white text-sm">{employer.name}</p>
                              <p className="text-xs text-blue-200">{employer.industry}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-sluGold">{employer.currentHires}</p>
                              <p className="text-xs text-blue-200">{employer.recentEngagements} recent</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Event Participation Opportunities */}
                {predictiveInsights.eventOpportunities && predictiveInsights.eventOpportunities.length > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                      <span>📅</span> Event Participation Opportunities
                      <InfoTooltip
                        title="Calculation Method"
                        content={`Data Sources: dim_employers.csv, fact_alumni_engagement.csv, dim_event.csv\nMethod: Count past event participations per employer, count upcoming events, calculate opportunity score (past + potential × 2).\nFormula: Past Events + (Potential Events × 2)\nPotential Events: Estimated from upcoming events count`}
                      />
                    </h3>
                    <div className="space-y-2">
                      {predictiveInsights.eventOpportunities.map((opp, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-white text-sm">{opp.name}</p>
                              <p className="text-xs text-blue-200">{opp.industry}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-sluGold">{opp.opportunityScore}</p>
                              <p className="text-xs text-blue-200">{opp.pastEvents} past, {opp.potentialEvents} potential</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comprehensive Analysis Summary Section - Collapsible */}
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
                <h5 className="font-semibold text-slate-800 mb-1 text-sm">📊 KPIs</h5>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 ml-3">
                  <li><strong>Active Employers:</strong> Employers who participated in events or hired alumni</li>
                  <li><strong>Avg Employer Rating:</strong> Average partnership quality rating</li>
                  <li><strong>Hiring Conversion Rate:</strong> Percentage of opportunities that become hires</li>
                  <li><strong>Avg Engagement Score:</strong> Composite score of events, interactions, and hires</li>
                  <li><strong>Alumni Employed at Partners:</strong> Total SLU alumni working at partner companies</li>
                  <li><strong>Employers with Recent Feedback:</strong> Employers providing feedback in last 6 months</li>
                </ul>
              </div>

              <div>
                <h5 className="font-semibold text-slate-800 mb-1 text-sm">📈 Employer Participation Trend</h5>
                <p className="text-xs text-slate-600">Line chart showing month-over-month employer participation. Tracks active employers and total events over time.</p>
              </div>

              <div>
                <h5 className="font-semibold text-slate-800 mb-1 text-sm">💼 Job Opportunities vs Hires</h5>
                <p className="text-xs text-slate-600">Grouped bar chart comparing job opportunities posted vs actual hires. Shows conversion efficiency.</p>
              </div>

              <div>
                <h5 className="font-semibold text-slate-800 mb-1 text-sm">🏭 Industry Distribution</h5>
                <p className="text-xs text-slate-600">Pie chart showing which industries (Technology, Healthcare, Finance, etc.) have the strongest SLU partnerships.</p>
              </div>

              <div>
                <h5 className="font-semibold text-slate-800 mb-1 text-sm">⭐ Employer Engagement Scorecard</h5>
                <p className="text-xs text-slate-600">Horizontal bar chart ranking employers by engagement score. Combines events, interactions, and hires.</p>
              </div>

              <div>
                <h5 className="font-semibold text-slate-800 mb-1 text-sm">👥 SLU Alumni Employed by Employer</h5>
                <p className="text-xs text-slate-600">Shows which employers have the most SLU alumni. Indicates strong hiring relationships.</p>
              </div>

              <div>
                <h5 className="font-semibold text-slate-800 mb-1 text-sm">🎓 Technical Strength by Graduation Year</h5>
                <p className="text-xs text-slate-600">Composed chart showing employer feedback on technical skills by graduation year. Reveals curriculum effectiveness.</p>
              </div>

              <div>
                <h5 className="font-semibold text-slate-800 mb-1 text-sm">🔄 Overall Hiring Funnel</h5>
                <p className="text-xs text-slate-600">Shows the hiring journey: Opportunities → Applications → Hires. Reveals conversion rates at each stage.</p>
              </div>

              <div>
                <h5 className="font-semibold text-slate-800 mb-1 text-sm">📋 Top Hiring Employers</h5>
                <p className="text-xs text-slate-600">Table ranking employers by hires, events, and engagement score. Identifies top partnership leaders.</p>
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
                  <li>Technology, Healthcare, and Finance show highest engagement</li>
                  <li>Employer participation patterns are stable across years</li>
                  <li>Hiring conversion rates show improvement over time</li>
                  <li>Top employers maintain multiple touchpoints (events, hires, feedback)</li>
                </ul>
              </div>

              <div>
                <h5 className="font-semibold text-slate-800 mb-2 text-sm">📈 Forecasts</h5>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 ml-3">
                  <li>Partnership engagement projected to continue growing</li>
                  <li>Peak hiring periods typically in spring and fall</li>
                  <li>High-engagement industries likely to maintain momentum</li>
                  <li>Hiring conversion rates expected to improve with better alignment</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-sluBlue to-blue-700 rounded-lg p-4 text-white">
                <h5 className="text-sm font-bold mb-2">💡 Recommendations</h5>
                <ul className="list-disc list-inside space-y-1 text-xs text-blue-50">
                  <li>Focus partnership development in high-engagement industries</li>
                  <li>Recognize and expand relationships with top hiring employers</li>
                  <li>Schedule career fairs during peak hiring seasons</li>
                  <li>Use technical strength trends to refine curriculum</li>
                  <li>Leverage employers with many SLU alumni for networking</li>
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

export default EmployerDashboard;
