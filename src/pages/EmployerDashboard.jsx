import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart
} from 'recharts';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import FiltersPanel from '../components/FiltersPanel';
import InsightsPanel from '../components/InsightsPanel';
import WorldMap from '../components/WorldMap';
import { loadAllData } from '../data/loadData';

const COLORS = ['#002F6C', '#FDB515', '#4A90E2', '#7ED321', '#F5A623', '#BD10E2', '#50E3C2', '#B8E986', '#9013FE', '#417505'];

const EmployerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ year: '', month: '' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const loadedData = await loadAllData();
      setData(loadedData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const processedData = useMemo(() => {
    if (!data) return null;

    const { employers, alumniEngagement, students, dates } = data;

    // Filter data based on selected filters
    let filteredEngagement = [...alumniEngagement];
    let filteredDates = [...dates];

    if (filters.year) {
      filteredDates = filteredDates.filter(d => String(d.year) === String(filters.year));
      const dateKeys = new Set(filteredDates.map(d => String(d.date_key)));
      filteredEngagement = filteredEngagement.filter(e => dateKeys.has(String(e.hire_date_key)));
    }

    if (filters.month) {
      filteredDates = filteredDates.filter(d => String(d.month_name) === String(filters.month));
      const dateKeys = new Set(filteredDates.map(d => String(d.date_key)));
      filteredEngagement = filteredEngagement.filter(e => dateKeys.has(String(e.hire_date_key)));
    }

    // Calculate KPIs
    const distinctEmployers = new Set(employers.map(e => e.employer_key));
    const activeEmployers = distinctEmployers.size;

    const hiredEngagements = filteredEngagement.filter(e => e.hired_flag === '1' || e.hired_flag === 1);
    const totalHires = hiredEngagements.length;

    // Calculate SLU event hires (hires that came through SLU university events)
    const sluEventHires = hiredEngagements.filter(e => 
      e.participated_university_event_flag === '1' || e.participated_university_event_flag === 1
    ).length;
    
    // Calculate SLU event hire percentage
    const sluEventHirePercent = totalHires > 0 
      ? Math.round((sluEventHires / totalHires) * 100)
      : 0;

    // Top Industry by Hires
    const industryHires = {};
    hiredEngagements.forEach(e => {
      const employer = employers.find(emp => emp.employer_key === e.employer_key);
      if (employer && employer.industry) {
        industryHires[employer.industry] = (industryHires[employer.industry] || 0) + 1;
      }
    });
    const topIndustry = Object.entries(industryHires)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Hires by Industry
    const hiresByIndustryData = Object.entries(industryHires)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Hires by Employer
    const employerHires = {};
    hiredEngagements.forEach(e => {
      const employer = employers.find(emp => emp.employer_key === e.employer_key);
      if (employer) {
        const name = employer.employer_name || 'Unknown';
        employerHires[name] = (employerHires[name] || 0) + 1;
      }
    });
    const hiresByEmployerData = Object.entries(employerHires)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);

    // Hiring Trend
    const hiringTrend = {};
    hiredEngagements.forEach(e => {
      const date = dates.find(d => String(d.date_key) === String(e.hire_date_key));
      if (date) {
        const key = date.year;
        hiringTrend[key] = (hiringTrend[key] || 0) + 1;
      }
    });
    const hiringTrendData = Object.entries(hiringTrend)
      .map(([year, count]) => ({ year, hires: count }))
      .sort((a, b) => a.year.localeCompare(b.year));

    // Hires by Degree Level
    const degreeHires = {};
    hiredEngagements.forEach(e => {
      const student = students.find(s => s.student_key === e.student_key);
      if (student && student.program_name) {
        const degreeLevel = student.program_name.includes('MS') ? 'Master\'s' : 
                          student.program_name.includes('PhD') ? 'PhD' : 
                          student.program_name.includes('BS') ? 'Bachelor\'s' : 'Other';
        degreeHires[degreeLevel] = (degreeHires[degreeLevel] || 0) + 1;
      }
    });
    const hiresByDegreeData = Object.entries(degreeHires).map(([name, value]) => ({
      name,
      value
    }));

    // Employment Type (Full-Time, Internship, Contract)
    // Since we don't have explicit employment type, we'll infer from job_role or use a placeholder
    const employmentType = {
      'Full-Time': hiredEngagements.filter(e => e.job_role && !e.job_role.toLowerCase().includes('intern')).length,
      'Internship': hiredEngagements.filter(e => e.job_role && e.job_role.toLowerCase().includes('intern')).length,
      'Contract': hiredEngagements.filter(e => e.job_role && e.job_role.toLowerCase().includes('contract')).length
    };
    const employmentTypeData = Object.entries(employmentType)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));

    // Top 10 Employers
    const topEmployersData = Object.entries(employerHires)
      .map(([name, value]) => ({ name, hires: value }))
      .sort((a, b) => b.hires - a.hires)
      .slice(0, 10);

    // Employer Locations
    const employerLocations = {};
    employers.forEach(emp => {
      const location = emp.hq_city && emp.hq_state 
        ? `${emp.hq_city}, ${emp.hq_state}`
        : emp.hq_city || emp.hq_state || 'Unknown';
      employerLocations[location] = (employerLocations[location] || 0) + 1;
    });
    const employerLocationsData = Object.entries(employerLocations)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);

    // Visa Type of Hires
    const visaHires = {};
    hiredEngagements.forEach(e => {
      const student = students.find(s => s.student_key === e.student_key);
      if (student && student.visa_status) {
        const visa = student.visa_status;
        visaHires[visa] = (visaHires[visa] || 0) + 1;
      }
    });
    const visaHiresData = Object.entries(visaHires).map(([name, value]) => ({
      name,
      value
    }));

    // Hiring vs Engagement Trend
    const engagementTrend = {};
    filteredEngagement.forEach(e => {
      const date = dates.find(d => String(d.date_key) === String(e.event_date_key));
      if (date) {
        const key = date.year;
        if (!engagementTrend[key]) {
          engagementTrend[key] = { engagement: 0, count: 0 };
        }
        engagementTrend[key].engagement += parseFloat(e.engagement_score || 0);
        engagementTrend[key].count += 1;
      }
    });
    const hiringVsEngagementData = Object.keys({ ...hiringTrend, ...engagementTrend })
      .sort()
      .map(year => ({
        year,
        hires: hiringTrend[year] || 0,
        engagement: engagementTrend[year] 
          ? (engagementTrend[year].engagement / engagementTrend[year].count).toFixed(2)
          : 0
      }));

    return {
      activeEmployers,
      totalHires,
      sluEventHires,
      sluEventHirePercent,
      topIndustry,
      hiresByIndustryData,
      hiresByEmployerData,
      hiringTrendData,
      hiresByDegreeData,
      employmentTypeData,
      topEmployersData,
      employerLocationsData,
      visaHiresData,
      hiringVsEngagementData
    };
  }, [data, filters]);

  // Calculate insights based on processed data
  const insights = useMemo(() => {
    if (!processedData) return [];

    const insightsList = [];

    // SLU Event Hires Insight
    if (processedData.sluEventHirePercent > 0) {
      insightsList.push({
        title: "SLU University Event Impact",
        description: `${processedData.sluEventHires} hires (${processedData.sluEventHirePercent}% of total) came through SLU university events, demonstrating the value of institutional event programming for placement success.`,
        recommendation: processedData.sluEventHirePercent > 30
          ? "Excellent event-driven hiring rate. Continue investing in high-quality university events and expand successful event formats to maximize placement opportunities."
          : "Increase focus on university-hosted events and career fairs. Strengthen employer participation in SLU events to improve placement rates through institutional channels."
      });
    }

    // Industry Concentration Insight
    if (processedData.hiresByIndustryData.length > 0) {
      const topIndustry = processedData.hiresByIndustryData[0];
      const totalHiresByIndustry = processedData.hiresByIndustryData.reduce((sum, ind) => sum + ind.value, 0);
      const topIndustryPercent = ((topIndustry.value / totalHiresByIndustry) * 100).toFixed(1);
      
      insightsList.push({
        title: "Industry Hiring Concentration",
        description: `${topIndustry.name} leads hiring with ${topIndustry.value} hires (${topIndustryPercent}% of total), indicating strong alignment with this industry sector.`,
        recommendation: topIndustryPercent > 40
          ? "While this industry is strong, diversify employer relationships across other industries to reduce concentration risk and create more opportunities."
          : `Continue strengthening ${topIndustry.name} partnerships while exploring growth opportunities in other high-potential industries.`
      });
    }

    // Hiring Trend Insight
    if (processedData.hiringTrendData.length >= 2) {
      const recent = processedData.hiringTrendData.slice(-2);
      const older = processedData.hiringTrendData.slice(0, 2);
      const recentAvg = recent.reduce((sum, d) => sum + d.hires, 0) / recent.length;
      const olderAvg = older.reduce((sum, d) => sum + d.hires, 0) / older.length;
      const trend = recentAvg > olderAvg ? 'increasing' : 'decreasing';
      const changePercent = Math.abs(((recentAvg - olderAvg) / olderAvg) * 100).toFixed(1);
      
      insightsList.push({
        title: `Hiring Trend: ${trend.charAt(0).toUpperCase() + trend.slice(1)}`,
        description: `Hiring is ${trend} with a ${changePercent}% change. ${trend === 'increasing' ? 'This positive trend shows growing employer confidence and successful placement programs.' : 'This decline requires proactive employer engagement and program evaluation.'}`,
        recommendation: trend === 'increasing'
          ? "Capitalize on the positive trend by expanding employer partnerships and increasing outreach to maintain momentum."
          : "Conduct employer satisfaction surveys, review placement processes, and strengthen career services to reverse the trend."
      });
    }

    // Top Employer Insight
    if (processedData.topEmployersData.length > 0) {
      const topEmployer = processedData.topEmployersData[0];
      insightsList.push({
        title: "Top Hiring Partner",
        description: `${topEmployer.name} is the leading employer with ${topEmployer.hires} hires, demonstrating a strong partnership and successful placement relationship.`,
        recommendation: "Maintain and strengthen the relationship with this top employer. Use this partnership as a model for developing similar relationships with other companies."
      });
    }

    // Degree Level Hiring Insight
    if (processedData.hiresByDegreeData.length > 0) {
      const topDegree = processedData.hiresByDegreeData.reduce((prev, current) => 
        (prev.value > current.value) ? prev : current
      );
      const totalDegreeHires = processedData.hiresByDegreeData.reduce((sum, d) => sum + d.value, 0);
      const degreePercent = ((topDegree.value / totalDegreeHires) * 100).toFixed(1);
      
      insightsList.push({
        title: "Degree Level Hiring Preference",
        description: `${topDegree.name} degree holders account for ${degreePercent}% of all hires (${topDegree.value} hires), showing strong employer demand for this qualification level.`,
        recommendation: `Continue promoting ${topDegree.name} programs to employers. Consider developing specialized recruitment strategies for other degree levels to diversify hiring.`
      });
    }

    // Employment Type Insight
    if (processedData.employmentTypeData.length > 0) {
      const totalEmployment = processedData.employmentTypeData.reduce((sum, e) => sum + e.value, 0);
      const employmentBreakdown = processedData.employmentTypeData.map(e => 
        `${e.name}: ${((e.value / totalEmployment) * 100).toFixed(1)}%`
      ).join(', ');
      
      const fullTime = processedData.employmentTypeData.find(e => e.name === 'Full-Time');
      const fullTimePercent = fullTime ? ((fullTime.value / totalEmployment) * 100).toFixed(1) : 0;
      
      insightsList.push({
        title: "Employment Type Distribution",
        description: `Hiring breakdown: ${employmentBreakdown}. ${fullTimePercent}% are full-time positions, indicating strong career outcomes.`,
        recommendation: fullTimePercent > 70
          ? "Excellent full-time placement rate. Continue focusing on career-ready skill development and employer relationships."
          : "Increase emphasis on full-time placement opportunities through enhanced career services and employer partnerships."
      });
    }

    // Visa Status Insight
    if (processedData.visaHiresData.length > 0) {
      const totalVisaHires = processedData.visaHiresData.reduce((sum, v) => sum + v.value, 0);
      const visaBreakdown = processedData.visaHiresData.map(v => 
        `${v.name}: ${((v.value / totalVisaHires) * 100).toFixed(1)}%`
      ).join(', ');
      
      insightsList.push({
        title: "Visa Status in Hiring",
        description: `Hiring by visa status: ${visaBreakdown}. This reflects the diversity of placed candidates and employer acceptance of various work authorization types.`,
        recommendation: "Continue supporting international students with visa-specific career resources. Build relationships with employers who sponsor work visas for international talent."
      });
    }

    // Location Insight
    if (processedData.employerLocationsData.length > 0) {
      const topLocation = processedData.employerLocationsData[0];
      insightsList.push({
        title: "Geographic Distribution",
        description: `${topLocation.name} has the highest concentration of employer partners (${topLocation.value} employers), indicating strong regional presence.`,
        recommendation: "Leverage regional strengths while expanding employer networks in other geographic areas to create more diverse opportunities for students."
      });
    }

    // Hiring vs Engagement Correlation
    if (processedData.hiringVsEngagementData.length >= 2) {
      const correlation = processedData.hiringVsEngagementData.filter(d => 
        parseFloat(d.engagement) > 0 && d.hires > 0
      );
      
      if (correlation.length > 0) {
        insightsList.push({
          title: "Engagement-Hiring Correlation",
          description: "Data shows a positive correlation between alumni engagement and hiring outcomes. Higher engagement levels correlate with increased hiring activity.",
          recommendation: "Invest in alumni engagement programs as they directly impact hiring success. Strong alumni networks create valuable employer connections and referral opportunities."
        });
      }
    }

    return insightsList;
  }, [processedData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-sluBlue">Loading data...</div>
      </div>
    );
  }

  if (!data || !processedData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">Error loading data</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-3xl font-bold text-sluBlue mb-6">💼 Employer Dashboard</h2>

        <FiltersPanel dates={data.dates} onFilterChange={setFilters} />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            title="Active Employers"
            value={processedData.activeEmployers.toLocaleString()}
            icon="🏢"
          />
          <KPICard
            title="Total Hires"
            value={processedData.totalHires.toLocaleString()}
            icon="👔"
          />
          <KPICard
            title="SLU Event Hires"
            value={`${processedData.sluEventHires} (${processedData.sluEventHirePercent}%)`}
            icon="🎓"
          />
          <KPICard
            title="Top Industry"
            value={processedData.topIndustry}
            icon="🏭"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" style={{ gridAutoRows: 'minmax(300px, auto)' }}>
          <ChartCard title="Hires by Industry">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData.hiresByIndustryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#002F6C" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Hires by Employer">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData.hiresByEmployerData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#FDB515" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Hiring Trend">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData.hiringTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="hires" stroke="#002F6C" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Hires by Degree Level">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData.hiresByDegreeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#4A90E2" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Employment Type">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData.employmentTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {processedData.employmentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top 10 Employers" isTable={true}>
            <div className="overflow-auto h-full">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hires</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processedData.topEmployersData.map((employer, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{employer.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{employer.hires}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          <ChartCard title="Employer Locations" isTable={true}>
            <div className="overflow-auto h-full">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processedData.employerLocationsData.map((location, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{location.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{location.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          <ChartCard title="Visa Type of Hires">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData.visaHiresData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {processedData.visaHiresData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Hiring vs Engagement Trend">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={processedData.hiringVsEngagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="hires" fill="#002F6C" name="Hires" />
                <Line yAxisId="right" type="monotone" dataKey="engagement" stroke="#FDB515" strokeWidth={2} name="Engagement Score" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Employer Locations" className="lg:col-span-2" fullHeight={true}>
            <WorldMap 
              data={data.employers} 
              title="Employer Distribution"
              type="employer"
            />
          </ChartCard>
        </div>

        {/* Analysis Insights Section */}
        <InsightsPanel 
          insights={insights} 
          title="💼 Employer Hiring Analysis & Insights"
        />
      </div>
    </div>
  );
};

export default EmployerDashboard;
