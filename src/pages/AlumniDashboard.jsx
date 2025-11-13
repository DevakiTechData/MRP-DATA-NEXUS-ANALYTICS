import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import FiltersPanel from '../components/FiltersPanel';
import InsightsPanel from '../components/InsightsPanel';
import USChoropleth from '../components/USChoropleth';
import { loadAllData } from '../data/loadData';
import PageHero from '../components/PageHero';

const COLORS = ['#002F6C', '#FDB515', '#4A90E2', '#7ED321', '#F5A623', '#BD10E0', '#50E3C2', '#B8E986', '#9013FE', '#417505'];

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

    const { students, alumniEngagement, events, dates, employers } = data;

    // Filter data based on selected filters
    let filteredEngagement = [...alumniEngagement];
    let filteredDates = [...dates];

    if (filters.year) {
      filteredDates = filteredDates.filter(d => String(d.year) === String(filters.year));
      const dateKeys = new Set(filteredDates.map(d => String(d.date_key)));
      filteredEngagement = filteredEngagement.filter(e => dateKeys.has(String(e.event_date_key)));
    }

    if (filters.month) {
      filteredDates = filteredDates.filter(d => String(d.month_name) === String(filters.month));
      const dateKeys = new Set(filteredDates.map(d => String(d.date_key)));
      filteredEngagement = filteredEngagement.filter(e => dateKeys.has(String(e.event_date_key)));
    }

    // Calculate KPIs
    const distinctStudents = new Set(students.map(s => s.student_key));
    const totalAlumni = distinctStudents.size;

    const engagedStudents = new Set(
      filteredEngagement
        .filter(e => e.engagement_score && parseFloat(e.engagement_score) > 0)
        .map(e => e.student_key)
    );
    const engagedCount = engagedStudents.size;
    const engagedPercent = totalAlumni > 0 ? ((engagedCount / totalAlumni) * 100).toFixed(1) : 0;

    const feedbackScores = filteredEngagement
      .map(e => parseFloat(e.donations_amount || e.engagement_score || 0))
      .filter(score => !isNaN(score) && score > 0);
    const avgFeedbackScore = feedbackScores.length > 0
      ? (feedbackScores.reduce((a, b) => a + b, 0) / feedbackScores.length).toFixed(2)
      : '0.00';

    const engagementMinutes = filteredEngagement
      .map(e => parseFloat(e.engagement_minutes || e.mentorship_hours || 0) * 60)
      .filter(min => !isNaN(min) && min > 0);
    const avgEngagementMinutes = engagementMinutes.length > 0
      ? Math.round(engagementMinutes.reduce((a, b) => a + b, 0) / engagementMinutes.length)
      : 0;

    // Engagement by Event Type
    const engagementByEventType = {};
    filteredEngagement.forEach(e => {
      const event = events.find(ev => ev.event_key === e.event_key);
      if (event) {
        const type = event.event_type || 'Unknown';
        engagementByEventType[type] = (engagementByEventType[type] || 0) + 1;
      }
    });
    const engagementByEventTypeData = Object.entries(engagementByEventType).map(([name, value]) => ({
      name,
      value
    }));

    // Engagement Trend
    const engagementTrend = {};
    filteredEngagement.forEach(e => {
      const date = dates.find(d => String(d.date_key) === String(e.event_date_key));
      if (date) {
        const key = `${date.year}-${date.month}`;
        if (!engagementTrend[key]) {
          engagementTrend[key] = { date: key, engagement: 0, count: 0 };
        }
        engagementTrend[key].engagement += parseFloat(e.engagement_score || 0);
        engagementTrend[key].count += 1;
      }
    });
    const engagementTrendData = Object.values(engagementTrend)
      .map(item => ({
        date: item.date,
        engagement: item.count > 0 ? (item.engagement / item.count).toFixed(2) : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-12); // Last 12 months

    // Gender Split
    const genderSplit = {};
    students.forEach(s => {
      const gender = s.gender || 'Unknown';
      genderSplit[gender] = (genderSplit[gender] || 0) + 1;
    });
    const genderSplitData = Object.entries(genderSplit).map(([name, value]) => ({
      name,
      value
    }));

    // Engaged Alumni by Degree Level
    const engagedByDegree = {};
    filteredEngagement.forEach(e => {
      const student = students.find(s => s.student_key === e.student_key);
      if (student && student.program_name) {
        const degreeLevel = student.program_name.includes('MS') ? 'Master\'s' : 
                          student.program_name.includes('PhD') ? 'PhD' : 
                          student.program_name.includes('BS') ? 'Bachelor\'s' : 'Other';
        engagedByDegree[degreeLevel] = (engagedByDegree[degreeLevel] || 0) + 1;
      }
    });
    const engagedByDegreeData = Object.entries(engagedByDegree).map(([name, value]) => ({
      name,
      value
    }));

    // Top 10 Programs by Engagement
    const programEngagement = {};
    filteredEngagement.forEach(e => {
      const student = students.find(s => s.student_key === e.student_key);
      if (student && student.program_name) {
        programEngagement[student.program_name] = (programEngagement[student.program_name] || 0) + 
          parseFloat(e.engagement_score || 0);
      }
    });
    const topProgramsData = Object.entries(programEngagement)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Feedback Score over Time
    const feedbackOverTime = {};
    filteredEngagement.forEach(e => {
      const date = dates.find(d => String(d.date_key) === String(e.event_date_key));
      if (date && e.donations_amount) {
        const key = `${date.year}-${String(date.month).padStart(2, '0')}`;
        if (!feedbackOverTime[key]) {
          feedbackOverTime[key] = { date: key, score: 0, count: 0 };
        }
        feedbackOverTime[key].score += parseFloat(e.donations_amount);
        feedbackOverTime[key].count += 1;
      }
    });
    const feedbackOverTimeData = Object.values(feedbackOverTime)
      .map(item => ({
        date: item.date,
        score: item.count > 0 ? (item.score / item.count).toFixed(2) : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Visa Status
    const visaStatus = {};
    students.forEach(s => {
      const visa = s.visa_status || 'Unknown';
      visaStatus[visa] = (visaStatus[visa] || 0) + 1;
    });
    const visaStatusData = Object.entries(visaStatus).map(([name, value]) => ({
      name,
      value
    }));

    // Alumni distribution by employer state
    const employersByKey = {};
    employers.forEach(emp => {
      employersByKey[emp.employer_key] = emp;
    });

    const alumniByState = {};
    filteredEngagement.forEach(e => {
      const employer = employersByKey[e.employer_key];
      if (!employer) return;
      const stateCode = (employer.hq_state || '').trim().toUpperCase();
      if (stateCode.length === 2) {
        alumniByState[stateCode] = (alumniByState[stateCode] || 0) + 1;
      }
    });

    // Event Feedback Leaderboard
    const eventFeedback = {};
    filteredEngagement.forEach(e => {
      const event = events.find(ev => ev.event_key === e.event_key);
      if (event && e.donations_amount) {
        const eventName = event.event_name || 'Unknown';
        if (!eventFeedback[eventName]) {
          eventFeedback[eventName] = { score: 0, count: 0 };
        }
        eventFeedback[eventName].score += parseFloat(e.donations_amount);
        eventFeedback[eventName].count += 1;
      }
    });
    const eventFeedbackData = Object.entries(eventFeedback)
      .map(([name, data]) => ({
        name,
        avgScore: (data.score / data.count).toFixed(2),
        count: data.count
      }))
      .sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore))
      .slice(0, 10);

    return {
      totalAlumni,
      engagedPercent,
      avgFeedbackScore,
      avgEngagementMinutes,
      engagementByEventTypeData,
      engagementTrendData,
      genderSplitData,
      engagedByDegreeData,
      topProgramsData,
      feedbackOverTimeData,
      visaStatusData,
      eventFeedbackData,
      alumniByState
    };
  }, [data, filters]);

  // Calculate insights based on processed data
  const insights = useMemo(() => {
    if (!processedData) return [];

    const insightsList = [];

    // Engagement Rate Insight
    const engagementRate = parseFloat(processedData.engagedPercent);
    if (engagementRate < 30) {
      insightsList.push({
        title: "Low Engagement Rate",
        description: `Only ${engagementRate}% of alumni are actively engaged. This is below the industry benchmark of 40-50% engagement rate.`,
        recommendation: "Implement targeted outreach campaigns, create more networking opportunities, and establish mentorship programs to increase alumni participation."
      });
    } else if (engagementRate >= 30 && engagementRate < 50) {
      insightsList.push({
        title: "Moderate Engagement Rate",
        description: `${engagementRate}% of alumni are engaged, which is approaching industry standards. There's room for improvement to reach the 50%+ target.`,
        recommendation: "Focus on personalized communication, expand event offerings, and create value-added programs to boost engagement further."
      });
    } else {
      insightsList.push({
        title: "Strong Engagement Rate",
        description: `${engagementRate}% engagement rate demonstrates excellent alumni relations. This exceeds industry benchmarks and shows strong community connection.`,
        recommendation: "Maintain this momentum by continuing successful programs and exploring new engagement channels to sustain high participation."
      });
    }

    // Feedback Score Insight
    const avgFeedback = parseFloat(processedData.avgFeedbackScore);
    if (avgFeedback >= 8.5) {
      insightsList.push({
        title: "Excellent Feedback Scores",
        description: `Average feedback score of ${avgFeedback} indicates high satisfaction with events and programs. Alumni value the quality of engagement opportunities.`,
        recommendation: "Continue delivering high-quality programs. Consider scaling successful event formats and sharing best practices across departments."
      });
    } else if (avgFeedback >= 7.0) {
      insightsList.push({
        title: "Good Feedback Scores",
        description: `Average feedback score of ${avgFeedback} shows positive reception. There's opportunity to enhance program quality to reach excellence.`,
        recommendation: "Gather detailed feedback to identify areas for improvement. Focus on event content quality, venue selection, and networking opportunities."
      });
    } else {
      insightsList.push({
        title: "Feedback Scores Need Improvement",
        description: `Average feedback score of ${avgFeedback} suggests areas for enhancement in event quality and alumni experience.`,
        recommendation: "Conduct comprehensive feedback surveys, review event planning processes, and invest in program development to improve satisfaction."
      });
    }

    // Event Type Insight
    if (processedData.engagementByEventTypeData.length > 0) {
      const topEventType = processedData.engagementByEventTypeData.reduce((prev, current) => 
        (prev.value > current.value) ? prev : current
      );
      insightsList.push({
        title: "Most Popular Event Type",
        description: `${topEventType.name} events have the highest engagement with ${topEventType.value} participants. This event format resonates well with alumni.`,
        recommendation: `Increase frequency of ${topEventType.name} events and use this format as a model for other event types to boost overall engagement.`
      });
    }

    // Degree Level Insight
    if (processedData.engagedByDegreeData.length > 0) {
      const topDegree = processedData.engagedByDegreeData.reduce((prev, current) => 
        (prev.value > current.value) ? prev : current
      );
      insightsList.push({
        title: "Degree Level Engagement",
        description: `${topDegree.name} degree holders show the highest engagement levels (${topDegree.value} participants), indicating strong program alignment.`,
        recommendation: `Leverage ${topDegree.name} alumni success to mentor other degree programs and create cross-program networking opportunities.`
      });
    }

    // Program Performance Insight
    if (processedData.topProgramsData.length > 0) {
      const topProgram = processedData.topProgramsData[0];
      insightsList.push({
        title: "Top Performing Program",
        description: `${topProgram.name} leads in engagement with a score of ${topProgram.value}, demonstrating strong alumni connection and program quality.`,
        recommendation: "Study this program's engagement strategies and replicate successful practices across other programs to elevate overall alumni relations."
      });
    }

    // Visa Status Insight
    if (processedData.visaStatusData.length > 0) {
      const visaDistribution = processedData.visaStatusData.map(v => `${v.name}: ${v.value}`).join(', ');
      insightsList.push({
        title: "Alumni Diversity",
        description: `The alumni base includes diverse visa statuses: ${visaDistribution}. This reflects a global community with varied career paths.`,
        recommendation: "Create visa-specific support programs, offer international networking opportunities, and provide resources tailored to different immigration statuses."
      });
    }

    // Engagement Trend Insight
    if (processedData.engagementTrendData.length >= 2) {
      const recent = processedData.engagementTrendData.slice(-3);
      const older = processedData.engagementTrendData.slice(0, 3);
      const recentAvg = recent.reduce((sum, d) => sum + parseFloat(d.engagement), 0) / recent.length;
      const olderAvg = older.reduce((sum, d) => sum + parseFloat(d.engagement), 0) / older.length;
      const trend = recentAvg > olderAvg ? 'increasing' : 'decreasing';
      const changePercent = Math.abs(((recentAvg - olderAvg) / olderAvg) * 100).toFixed(1);
      
      insightsList.push({
        title: `Engagement Trend: ${trend.charAt(0).toUpperCase() + trend.slice(1)}`,
        description: `Engagement is ${trend} with a ${changePercent}% change compared to earlier periods. ${trend === 'increasing' ? 'This positive trend indicates successful engagement strategies.' : 'This decline requires attention to reverse the trend.'}`,
        recommendation: trend === 'increasing' 
          ? "Maintain current strategies and scale successful initiatives to continue the positive momentum."
          : "Review recent changes, gather alumni feedback, and implement targeted interventions to reverse the declining trend."
      });
    }

    // Gender Distribution Insight
    if (processedData.genderSplitData.length > 0) {
      const total = processedData.genderSplitData.reduce((sum, g) => sum + g.value, 0);
      const genderBreakdown = processedData.genderSplitData.map(g => 
        `${g.name}: ${((g.value / total) * 100).toFixed(1)}%`
      ).join(', ');
      insightsList.push({
        title: "Gender Representation",
        description: `Alumni gender distribution: ${genderBreakdown}. This reflects the diversity of the alumni community.`,
        recommendation: "Ensure engagement programs are inclusive and accessible to all gender identities. Consider gender-specific networking opportunities where appropriate."
      });
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
    <div className="min-h-screen bg-gray-100 pb-16">
      <PageHero
        images={ALUMNI_HERO_IMAGES}
        eyebrow="Alumni Insights"
        title="Amplifying Alumni Impact"
        subtitle="Measure engagement, growth, and global reach"
        description="Track the KPIs that matter most to our alumni community. Visualize engagement trends, geographic reach, hiring outcomes, and program-level momentum to power strategic decisions."
        actions={[
          { to: '/', label: 'Back to Home', variant: 'secondary' },
          { href: '#alumni-kpis', label: 'Explore KPIs' },
        ]}
      />

      <div className="container mx-auto px-4 py-6">
        <h2 id="alumni-kpis" className="text-3xl font-bold text-sluBlue mb-6">
          🎓 Alumni Dashboard
        </h2>

        <FiltersPanel dates={data.dates} onFilterChange={setFilters} />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            title="Total Alumni"
            value={processedData.totalAlumni.toLocaleString()}
            icon="👥"
          />
          <KPICard
            title="% Engaged Alumni"
            value={`${processedData.engagedPercent}%`}
            icon="📊"
          />
          <KPICard
            title="Avg Feedback Score"
            value={processedData.avgFeedbackScore}
            icon="⭐"
          />
          <KPICard
            title="Avg Engagement Minutes"
            value={`${processedData.avgEngagementMinutes} min`}
            icon="⏱️"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" style={{ gridAutoRows: 'minmax(300px, auto)' }}>
          <ChartCard title="Engagement by Event Type">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData.engagementByEventTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#002F6C" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Engagement Trend">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData.engagementTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="engagement" stroke="#FDB515" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Gender Split">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData.genderSplitData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {processedData.genderSplitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Engaged Alumni by Degree Level">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData.engagedByDegreeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#4A90E2" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top 10 Programs by Engagement">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData.topProgramsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#FDB515" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Feedback Score over Time">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={processedData.feedbackOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="score" stroke="#002F6C" fill="#4A90E2" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Visa Status">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData.visaStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {processedData.visaStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Event Feedback Leaderboard" isTable={true}>
            <div className="overflow-auto h-full">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processedData.eventFeedbackData.map((event, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{event.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{event.avgScore}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{event.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          <ChartCard title="Alumni by State" className="lg:col-span-2" fullHeight={true}>
            <USChoropleth 
              data={processedData.alumniByState} 
              title="Alumni Distribution Across US States"
            />
          </ChartCard>
        </div>

        {/* Analysis Insights Section */}
        <InsightsPanel 
          insights={insights} 
          title="📊 Alumni Engagement Analysis & Insights"
        />
      </div>
    </div>
  );
};

export default AlumniDashboard;
