import { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  LabelList,
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

    const studentLookup = students.reduce((acc, student) => {
      acc[String(student.student_key)] = student;
      return acc;
    }, {});

    const dateLookup = dates.reduce((acc, date) => {
      acc[String(date.date_key)] = date;
      return acc;
    }, {});

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

    // Engagement by Event Type (with average engagement score)
    const engagementByEventType = {};
    filteredEngagement.forEach((e) => {
      const event = events.find((ev) => ev.event_key === e.event_key);
      if (event) {
        const type = event.event_type || 'Unknown';
        if (!engagementByEventType[type]) {
          engagementByEventType[type] = { count: 0, totalScore: 0 };
        }
        engagementByEventType[type].count += 1;
        engagementByEventType[type].totalScore += parseFloat(e.engagement_score || 0);
      }
    });
    const engagementByEventTypeData = Object.entries(engagementByEventType)
      .map(([name, metrics]) => ({
        name,
        count: metrics.count,
        avgScore:
          metrics.count > 0 ? Number((metrics.totalScore / metrics.count).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

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

    let engagementTrendSummary = null;
    if (engagementTrendData.length >= 2) {
      const start = Number(engagementTrendData[0].engagement);
      const latest = Number(engagementTrendData[engagementTrendData.length - 1].engagement);
      const change = start !== 0 ? Number((((latest - start) / start) * 100).toFixed(1)) : 0;
      const peak = engagementTrendData.reduce((prev, current) =>
        Number(current.engagement) > Number(prev.engagement) ? current : prev,
      engagementTrendData[0]);
      engagementTrendSummary = {
        start,
        latest,
        change,
        peakMonth: peak.date,
        peakValue: Number(peak.engagement),
      };
    }

    // Gender Split
    const genderSplit = {};
    students.forEach(s => {
      const gender = s.gender || 'Unknown';
      genderSplit[gender] = (genderSplit[gender] || 0) + 1;
    });
    const totalGenderCount = Object.values(genderSplit).reduce((sum, count) => sum + count, 0);
    const genderSplitData = Object.entries(genderSplit).map(([name, value]) => {
      const percent = totalGenderCount > 0 ? (value / totalGenderCount) * 100 : 0;
      return {
        name,
        value,
        percent: Number(percent.toFixed(1)),
        label: `${name} ${percent.toFixed(1)}%`,
      };
    });
    const topGender = genderSplitData.reduce(
      (prev, current) => (current.value > prev.value ? current : prev),
      { name: 'N/A', value: 0, percent: 0 },
    );

    // Engaged Alumni by Degree Level
    const engagedByDegree = {};
    filteredEngagement.forEach(e => {
      const student = studentLookup[String(e.student_key)];
      if (student && student.program_name) {
        const degreeLevel = student.program_name.includes('MS') ? 'Master\'s' : 
                          student.program_name.includes('PhD') ? 'PhD' : 
                          student.program_name.includes('BS') ? 'Bachelor\'s' : 'Other';
        engagedByDegree[degreeLevel] = (engagedByDegree[degreeLevel] || 0) + 1;
      }
    });
    const totalDegreeCount = Object.values(engagedByDegree).reduce((sum, count) => sum + count, 0);
    const engagedByDegreeData = Object.entries(engagedByDegree)
      .map(([name, value]) => ({
        name,
        value,
        percent: totalDegreeCount > 0 ? Number(((value / totalDegreeCount) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.value - a.value);
    const topDegreeCategory = engagedByDegreeData[0] || { name: 'N/A', value: 0, percent: 0 };

    // Top 10 Programs by Engagement
    const programEngagement = {};
    filteredEngagement.forEach(e => {
      const student = studentLookup[String(e.student_key)];
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
    filteredEngagement.forEach(e => {
      const student = studentLookup[String(e.student_key)];
      if (student && student.visa_status) {
        const visa = student.visa_status;
        visaStatus[visa] = (visaStatus[visa] || 0) + 1;
      }
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

    // Engagement Funnel (unique alumni at each stage)
    const funnelStages = {
      reached: new Set(filteredEngagement.map(e => String(e.student_key))),
      event: new Set(
        filteredEngagement
          .filter((e) => ['1', 1].includes(e.participated_university_event_flag) || ['1', 1].includes(e.alumni_event_flag))
          .map((e) => String(e.student_key))
      ),
      mentor: new Set(
        filteredEngagement
          .filter((e) => parseFloat(e.mentorship_hours || 0) > 0)
          .map((e) => String(e.student_key))
      ),
      referral: new Set(
        filteredEngagement
          .filter((e) => parseFloat(e.referrals_made || 0) > 0)
          .map((e) => String(e.student_key))
      ),
      hired: new Set(
        filteredEngagement
          .filter((e) => ['1', 1].includes(e.hired_flag))
          .map((e) => String(e.student_key))
      ),
    };

    const funnelOrder = [
      { key: 'reached', label: 'Alumni Reached', count: funnelStages.reached.size },
      { key: 'event', label: 'Event Participants', count: funnelStages.event.size },
      { key: 'mentor', label: 'Mentored Alumni', count: funnelStages.mentor.size },
      { key: 'referral', label: 'Referrals Made', count: funnelStages.referral.size },
      { key: 'hired', label: 'Hired Alumni', count: funnelStages.hired.size },
    ];

    const firstStageCount = funnelOrder[0]?.count || 0;
    const engagementFunnelData = funnelOrder.map((stage, index) => {
      const previousCount = index === 0 ? stage.count : funnelOrder[index - 1].count || 1;
      const stageConversion = index === 0 ? 100 : previousCount > 0 ? (stage.count / previousCount) * 100 : 0;
      const cumulativeConversion = firstStageCount > 0 ? (stage.count / firstStageCount) * 100 : 0;

      return {
        stage: stage.label,
        count: stage.count,
        stageConversion: Number(stageConversion.toFixed(1)),
        cumulativeConversion: Number(cumulativeConversion.toFixed(1)),
        countLabel: stage.count.toLocaleString(),
        stageConversionLabel:
          index === 0
            ? 'Baseline'
            : `${Number(stageConversion.toFixed(1))}% of prior stage`,
        cumulativeConversionLabel: `${Number(cumulativeConversion.toFixed(1))}% overall`,
      };
    });

    const engagementFunnelDrop = engagementFunnelData.slice(1).reduce((prev, current) =>
      (current.stageConversion < prev.stageConversion ? current : prev),
      engagementFunnelData[1] || null,
    );
    const engagementFunnelFinal = engagementFunnelData[engagementFunnelData.length - 1] || null;

    // Cohort Retention (graduation year vs engaged years after graduation)
    const graduationYears = Array.from(
      new Set(
        students
          .map((student) => (student.graduation_year ? Number(student.graduation_year) : null))
          .filter((year) => !Number.isNaN(year))
      )
    ).sort((a, b) => a - b);

    const recentGraduationYears = graduationYears.slice(-4);
    const maxRetentionYears = 3;

    const retentionStructure = recentGraduationYears.reduce((acc, year) => {
      const cohortStudents = students.filter((student) => Number(student.graduation_year) === year);
      acc[year] = {
        cohortSize: cohortStudents.length,
        buckets: Array.from({ length: maxRetentionYears + 1 }, () => new Set()),
        cohortKeys: new Set(cohortStudents.map((student) => String(student.student_key))),
      };
      return acc;
    }, {});

    filteredEngagement.forEach((engagement) => {
      const student = studentLookup[String(engagement.student_key)];
      if (!student || !student.graduation_year) return;

      const gradYear = Number(student.graduation_year);
      if (!retentionStructure[gradYear]) return;

      const eventDate = dateLookup[String(engagement.event_date_key)];
      const eventYear = eventDate ? Number(eventDate.year) : null;
      if (eventYear === null) return;

      const delta = eventYear - gradYear;
      if (delta < 0 || delta > maxRetentionYears) return;

      retentionStructure[gradYear].buckets[delta].add(String(engagement.student_key));
    });

    const cohortRetentionData = Array.from({ length: maxRetentionYears + 1 }, (_, index) => {
      const label = index === 0 ? 'Year 0' : `Year +${index}`;
      const row = { period: label };
      recentGraduationYears.forEach((year) => {
        const structure = retentionStructure[year];
        if (!structure || structure.cohortSize === 0) {
          row[year] = 0;
          return;
        }
        const engagedCount = structure.buckets[index]?.size ?? 0;
        row[year] = Number(((engagedCount / structure.cohortSize) * 100).toFixed(1));
      });
      return row;
    });

    const retentionSummary = recentGraduationYears.map((year) => {
      const structure = retentionStructure[year];
      if (!structure || structure.cohortSize === 0) {
        return {
          cohort: year,
          cohortSize: 0,
          yearOneRetention: 0,
          yearTwoRetention: 0,
          note: 'No engagement recorded yet.',
        };
      }
      const yearOne = Number(((structure.buckets[1]?.size || 0) / structure.cohortSize * 100).toFixed(1));
      const yearTwo = Number(((structure.buckets[2]?.size || 0) / structure.cohortSize * 100).toFixed(1));
      const note = yearOne >= 25
        ? 'Healthy year-one engagement.'
        : 'Consider re-engagement outreach.';
      return {
        cohort: year,
        cohortSize: structure.cohortSize,
        yearOneRetention: yearOne,
        yearTwoRetention: yearTwo,
        note,
      };
    });

    // Program performance leaderboard
    const programStats = new Map();
    filteredEngagement.forEach((engagement) => {
      const student = studentLookup[String(engagement.student_key)];
      if (!student || !student.program_name) return;
      const program = student.program_name;
      if (!programStats.has(program)) {
        programStats.set(program, {
          studentIds: new Set(),
          totalScore: 0,
          engagementCount: 0,
          totalMentorship: 0,
          totalReferrals: 0,
          hiredStudentIds: new Set(),
        });
      }
      const stats = programStats.get(program);
      const studentKey = String(engagement.student_key);
      stats.studentIds.add(studentKey);
      stats.totalScore += parseFloat(engagement.engagement_score || 0);
      stats.engagementCount += 1;
      stats.totalMentorship += parseFloat(engagement.mentorship_hours || 0);
      stats.totalReferrals += parseFloat(engagement.referrals_made || 0);
      if (['1', 1].includes(engagement.hired_flag)) {
        stats.hiredStudentIds.add(studentKey);
      }
    });

    const programLeaderboard = Array.from(programStats.entries())
      .map(([program, stats]) => {
        const participantCount = stats.studentIds.size;
        const safeParticipantCount = participantCount === 0 ? 1 : participantCount;
        return {
          program,
          participants: participantCount,
          avgScore: stats.engagementCount > 0 ? Number((stats.totalScore / stats.engagementCount).toFixed(2)) : 0,
          avgMentorshipHours: participantCount > 0 ? Number((stats.totalMentorship / safeParticipantCount).toFixed(1)) : 0,
          avgReferrals: participantCount > 0 ? Number((stats.totalReferrals / safeParticipantCount).toFixed(1)) : 0,
          hireRate: participantCount > 0 ? Number(((stats.hiredStudentIds.size / safeParticipantCount) * 100).toFixed(1)) : 0,
        };
      })
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 8);

    // Mentorship impact matrix (bucketed analysis)
    const mentorshipByStudent = new Map();
    filteredEngagement.forEach((engagement) => {
      const studentKey = String(engagement.student_key);
      if (!mentorshipByStudent.has(studentKey)) {
        mentorshipByStudent.set(studentKey, {
          mentorshipHours: 0,
          referrals: 0,
          hired: false,
          engagementTotal: 0,
          engagementCount: 0,
        });
      }
      const entry = mentorshipByStudent.get(studentKey);
      entry.mentorshipHours += parseFloat(engagement.mentorship_hours || 0);
      entry.referrals += parseFloat(engagement.referrals_made || 0);
      entry.hired = entry.hired || ['1', 1].includes(engagement.hired_flag);
      if (engagement.engagement_score) {
        entry.engagementTotal += parseFloat(engagement.engagement_score || 0);
        entry.engagementCount += 1;
      }
    });

    const mentorshipBuckets = [
      { key: 'none', label: 'No Mentorship', matcher: (hours) => hours === 0 },
      { key: 'low', label: '1-4 Hours', matcher: (hours) => hours > 0 && hours < 5 },
      { key: 'mid', label: '5-9 Hours', matcher: (hours) => hours >= 5 && hours < 10 },
      { key: 'high', label: '10+ Hours', matcher: (hours) => hours >= 10 },
    ];

    const mentorshipAggregates = mentorshipBuckets.reduce((acc, bucket) => {
      acc[bucket.key] = {
        label: bucket.label,
        alumni: 0,
        hiredCount: 0,
        totalReferrals: 0,
        totalAvgScore: 0,
      };
      return acc;
    }, {});

    mentorshipByStudent.forEach((profile) => {
      const bucket = mentorshipBuckets.find((candidate) => candidate.matcher(profile.mentorshipHours)) || mentorshipBuckets[0];
      const aggregate = mentorshipAggregates[bucket.key];
      aggregate.alumni += 1;
      aggregate.hiredCount += profile.hired ? 1 : 0;
      aggregate.totalReferrals += profile.referrals;
      const avgScore = profile.engagementCount > 0 ? profile.engagementTotal / profile.engagementCount : 0;
      aggregate.totalAvgScore += avgScore;
    });

    const mentorshipImpactMatrix = mentorshipBuckets.map((bucket) => {
      const aggregate = mentorshipAggregates[bucket.key];
      const alumniCount = aggregate.alumni || 0;
      return {
        label: aggregate.label,
        alumni: alumniCount,
        hiredRate: alumniCount > 0 ? Number(((aggregate.hiredCount / alumniCount) * 100).toFixed(1)) : 0,
        avgReferrals: alumniCount > 0 ? Number((aggregate.totalReferrals / alumniCount).toFixed(1)) : 0,
        avgEngagementScore: alumniCount > 0 ? Number((aggregate.totalAvgScore / alumniCount).toFixed(2)) : 0,
      };
    });

    return {
      totalAlumni,
      engagedPercent,
      avgFeedbackScore,
      avgEngagementMinutes,
      engagementByEventTypeData,
      engagementTrendData,
      engagementTrendSummary,
      genderSplitData,
      topGender,
      engagedByDegreeData,
      topDegreeCategory,
      topProgramsData,
      feedbackOverTimeData,
      visaStatusData,
      eventFeedbackData,
      alumniByState,
      engagementFunnelData,
      engagementFunnelDrop,
      engagementFunnelFinal,
      cohortRetentionData,
      cohortRetentionYears: recentGraduationYears,
      programLeaderboard,
      mentorshipImpactMatrix,
      retentionSummary,
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
        (prev.count > current.count) ? prev : current
      );
      insightsList.push({
        title: "Most Popular Event Type",
        description: `${topEventType.name} events have the highest engagement with ${topEventType.count.toLocaleString()} participants and an average score of ${topEventType.avgScore}.`,
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
          <ChartCard
            title="Engagement by Event Type"
            subtitle="Headcount and average engagement score by event category"
            contentClassName="flex flex-col justify-between h-[280px]"
          >
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={processedData.engagementByEventTypeData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-20} textAnchor="end" height={70} interval={0} />
                  <YAxis yAxisId="left" allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => value.toFixed(1)} />
                  <Tooltip
                    formatter={(value, name) =>
                      name === 'Avg Engagement Score'
                        ? [value.toFixed(2), name]
                        : [`${value.toLocaleString()} attendees`, 'Attendees']
                    }
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="count"
                    name="Attendees"
                    fill="#002F6C"
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList
                      dataKey="count"
                      position="insideTop"
                      formatter={(value) => value.toLocaleString()}
                      fill="#ffffff"
                      fontSize={11}
                    />
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgScore"
                    name="Avg Engagement Score"
                    stroke="#FDB515"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[0.7rem] text-slate-600">
              {processedData.engagementByEventTypeData.length > 0
                ? `Top category: ${processedData.engagementByEventTypeData[0].name} with ${processedData.engagementByEventTypeData[0].count.toLocaleString()} attendees and an average engagement score of ${processedData.engagementByEventTypeData[0].avgScore}.`
                : 'No event data available.'}
            </div>
          </ChartCard>

          <ChartCard
            title="Engagement Trend"
            subtitle="Average engagement score by month (last 12 months)"
            contentClassName="flex flex-col justify-between h-[280px]"
          >
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedData.engagementTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => value.toFixed(1)} />
                  <Tooltip formatter={(value) => Number(value).toFixed(2)} />
                  <Legend />
                  <Line type="monotone" dataKey="engagement" stroke="#FDB515" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {processedData.engagementTrendSummary ? (
              <div className="mt-2 text-[0.7rem] text-slate-600">
                Engagement moved from {processedData.engagementTrendSummary.start.toFixed(2)} to
                {' '}
                {processedData.engagementTrendSummary.latest.toFixed(2)} over the past year
                ({processedData.engagementTrendSummary.change}% change). Peak engagement was
                {' '}
                {processedData.engagementTrendSummary.peakValue.toFixed(2)} in {processedData.engagementTrendSummary.peakMonth}.
              </div>
            ) : null}
          </ChartCard>

          <ChartCard
            title="Gender Split"
            subtitle="Share of active alumni by gender"
            contentClassName="flex flex-col justify-between h-[240px]"
          >
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processedData.genderSplitData}
                    cx="50%"
                    cy="55%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {processedData.genderSplitData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    <LabelList
                      dataKey="label"
                      position="outside"
                      offset={8}
                      fill="#1e293b"
                      fontSize={11}
                    />
                  </Pie>
                  <Tooltip formatter={(value, name, payload) => [`${value.toLocaleString()} alumni`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3 text-[0.68rem] text-slate-600">
              {processedData.genderSplitData.map((item) => (
                <div key={item.name} className="rounded-md bg-slate-100/70 px-2 py-2">
                  <p className="font-semibold text-slate-700">{item.name}</p>
                  <p>{item.value.toLocaleString()} alumni</p>
                  <p>{item.percent}% of active alumni</p>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard
            title="Engaged Alumni by Degree Level"
            subtitle="Number of actively engaged alumni and share of total"
            contentClassName="flex flex-col justify-between h-[260px]"
          >
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={processedData.engagedByDegreeData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(value) => value.toLocaleString()} />
                  <YAxis type="category" dataKey="name" width={130} />
                  <Tooltip formatter={(value, name, payload) => [`${value.toLocaleString()} alumni`, payload.name]} />
                  <Bar dataKey="value" fill="#4A90E2" radius={[4, 4, 4, 4]} maxBarSize={38}>
                    <LabelList
                      dataKey="value"
                      position="insideRight"
                      formatter={(value) => value.toLocaleString()}
                      fill="#ffffff"
                      fontSize={11}
                    />
                    <LabelList
                      dataKey="percent"
                      position="right"
                      formatter={(value) => `${value}%`}
                      fill="#1e293b"
                      fontSize={10}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[0.7rem] text-slate-600">
              Top concentration: <span className="font-semibold text-slate-700">{processedData.topDegreeCategory.name}</span>
              {' '}with {processedData.topDegreeCategory.value.toLocaleString()} engaged alumni ({processedData.topDegreeCategory.percent}% of total).
            </div>
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
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2 text-sm text-gray-900">{event.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{event.avgScore}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{event.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ChartCard>

          <ChartCard title="Alumni by State" className="lg:col-span-2" fullHeight={true}>
            <USChoropleth 
              data={processedData.alumniByState} 
              title="Alumni Distribution Across US States"
            />
          </ChartCard>
        </div>

        <h3 className="text-2xl font-semibold text-sluBlue mb-4">Advanced Engagement Analytics</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" style={{ gridAutoRows: 'minmax(320px, auto)' }}>
          <ChartCard
            title="Alumni Engagement Funnel"
            subtitle="Share of alumni progressing through each lifecycle stage"
            contentClassName="flex flex-col justify-between h-[260px]"
          >
            {processedData.engagementFunnelData.length > 0 ? (
              <>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      layout="vertical"
                      data={processedData.engagementFunnelData}
                      barCategoryGap="25%"
                      margin={{ top: 10, right: 32, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(value) => value.toLocaleString()} />
                      <YAxis type="category" dataKey="stage" width={150} />
                      <Tooltip
                        formatter={(value, name, payload) => {
                          if (name === 'Stage Conversion') {
                            return [`${payload.stageConversion}%`, 'Stage Conversion'];
                          }
                          if (name === 'Overall Conversion') {
                            return [`${payload.cumulativeConversion}%`, 'Overall Conversion'];
                          }
                          return [value.toLocaleString(), 'Alumni'];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" name="Alumni" fill="#002F6C" radius={[4, 4, 4, 4]} maxBarSize={36}>
                        <LabelList dataKey="countLabel" position="insideRight" fill="#ffffff" fontSize={11} />
                        <LabelList dataKey="stageConversionLabel" position="right" fill="#1e293b" fontSize={10} offset={6} />
                      </Bar>
                      <Line
                        dataKey="cumulativeConversion"
                        name="Overall Conversion"
                        stroke="#FDB515"
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 1, stroke: '#FDB515', fill: '#ffffff' }}
                        activeDot={{ r: 6 }}
                        yAxisId={1}
                      />
                      <YAxis hide yAxisId={1} type="number" domain={[0, 100]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 text-[0.7rem] text-slate-600">
                  {processedData.engagementFunnelFinal
                    ? `Final conversion: ${processedData.engagementFunnelFinal.stage} retains ${processedData.engagementFunnelFinal.cumulativeConversionLabel} (${processedData.engagementFunnelFinal.countLabel} alumni).`
                    : null}
                  {processedData.engagementFunnelDrop
                    ? ` Largest drop occurs between stages at ${processedData.engagementFunnelDrop.stage} with ${processedData.engagementFunnelDrop.stageConversion}% retention of the prior stage.`
                    : null}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">No funnel data available.</div>
            )}
          </ChartCard>

          <ChartCard
            title="Cohort Retention"
            subtitle="How many alumni stay engaged 12 and 24 months after graduation"
            isTable={true}
          >
            {processedData.retentionSummary.length > 0 ? (
              <table className="min-w-full text-xs text-slate-600">
                <thead className="bg-slate-100 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Graduation Cohort</th>
                    <th className="px-3 py-2 text-left">Cohort Size</th>
                    <th className="px-3 py-2 text-left">Year +1 Retention</th>
                    <th className="px-3 py-2 text-left">Year +2 Retention</th>
                    <th className="px-3 py-2 text-left">Insight</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {processedData.retentionSummary.map((summary) => (
                    <tr key={summary.cohort} className="odd:bg-slate-50 even:bg-white hover:bg-slate-100 transition-colors">
                      <td className="px-3 py-2 font-semibold text-slate-700">Class of {summary.cohort}</td>
                      <td className="px-3 py-2 text-slate-600">{summary.cohortSize.toLocaleString()}</td>
                      <td className="px-3 py-2 text-slate-600">{summary.yearOneRetention}%</td>
                      <td className="px-3 py-2 text-slate-600">{summary.yearTwoRetention}%</td>
                      <td className="px-3 py-2 text-slate-500">{summary.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">Retention data unavailable.</div>
            )}
          </ChartCard>
        </div>

        <h3 className="text-2xl font-semibold text-sluBlue mb-4">Program & Mentorship Insights</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10" style={{ gridAutoRows: 'minmax(320px, auto)' }}>
          <ChartCard title="Program Performance Leaderboard" subtitle="Ranked by average engagement score" isTable={true}>
            <table className="min-w-full text-xs text-slate-600">
              <thead className="bg-slate-100 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Program</th>
                  <th className="px-3 py-2 text-left">Participants</th>
                  <th className="px-3 py-2 text-left">Avg Score</th>
                  <th className="px-3 py-2 text-left">Avg Mentorship (hrs)</th>
                  <th className="px-3 py-2 text-left">Avg Referrals</th>
                  <th className="px-3 py-2 text-left">Hire Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {processedData.programLeaderboard.map((row, idx) => (
                  <tr key={row.program} className="odd:bg-slate-50 even:bg-white hover:bg-slate-100 transition-colors">
                    <td className="px-3 py-2 font-semibold text-slate-700">
                      {idx + 1}. {row.program}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{row.participants}</td>
                    <td className="px-3 py-2 text-slate-600">{row.avgScore}</td>
                    <td className="px-3 py-2 text-slate-600">{row.avgMentorshipHours}</td>
                    <td className="px-3 py-2 text-slate-600">{row.avgReferrals}</td>
                    <td className="px-3 py-2 text-slate-600">{row.hireRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ChartCard>

          <ChartCard title="Mentorship Impact Matrix" subtitle="How mentorship hours translate to career outcomes" isTable={true}>
            <table className="min-w-full text-xs text-slate-600">
              <thead className="bg-slate-100 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Mentorship Bucket</th>
                  <th className="px-3 py-2 text-left">Alumni</th>
                  <th className="px-3 py-2 text-left">Hire Rate</th>
                  <th className="px-3 py-2 text-left">Avg Referrals</th>
                  <th className="px-3 py-2 text-left">Avg Engagement</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {processedData.mentorshipImpactMatrix.map((row) => (
                  <tr key={row.label} className="odd:bg-slate-50 even:bg-white hover:bg-slate-100 transition-colors">
                    <td className="px-3 py-2 font-semibold text-slate-700">{row.label}</td>
                    <td className="px-3 py-2 text-slate-600">{row.alumni}</td>
                    <td className="px-3 py-2 text-slate-600">{row.hiredRate}%</td>
                    <td className="px-3 py-2 text-slate-600">{row.avgReferrals}</td>
                    <td className="px-3 py-2 text-slate-600">{row.avgEngagementScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
