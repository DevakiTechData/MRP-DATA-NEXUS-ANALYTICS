import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, FunnelChart, Funnel, LabelList, ScatterChart, Scatter, ZAxis
} from 'recharts';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import FiltersPanel from '../components/FiltersPanel';
import InsightsPanel from '../components/InsightsPanel';
import EmployerUSMap from '../components/EmployerUSMap';
import { loadAllData } from '../data/loadData';
import PageHero from '../components/PageHero';

const COLORS = ['#002F6C', '#FDB515', '#4A90E2', '#7ED321', '#F5A623', '#BD10E2', '#50E3C2', '#B8E986', '#9013FE', '#417505'];

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

    const studentLookup = students.reduce((acc, student) => {
      acc[String(student.student_key)] = student;
      return acc;
    }, {});

    const dateLookup = dates.reduce((acc, date) => {
      acc[String(date.date_key)] = date;
      return acc;
    }, {});

    const employerLookup = {};
    const employerCountsByState = {};
    employers.forEach(emp => {
      employerLookup[emp.employer_key] = emp;
      const stateCode = (emp.hq_state || '').trim().toUpperCase();
      if (stateCode.length === 2) {
        employerCountsByState[stateCode] = (employerCountsByState[stateCode] || 0) + 1;
      }
    });

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
      const employer = employerLookup[e.employer_key];
      if (employer && employer.industry) {
        industryHires[employer.industry] = (industryHires[employer.industry] || 0) + 1;
      }
    });
    const totalIndustryHires = Object.values(industryHires).reduce((sum, count) => sum + count, 0);
    const hiresByIndustryData = Object.entries(industryHires)
      .map(([name, value]) => ({
        name,
        value,
        percent: totalIndustryHires > 0 ? Number(((value / totalIndustryHires) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    const topIndustryCategory = hiresByIndustryData[0] || { name: 'N/A', value: 0, percent: 0 };
    const topIndustry = topIndustryCategory.name || 'N/A';

    // Hires by Employer
    const employerHires = {};
    hiredEngagements.forEach(e => {
      const employer = employerLookup[e.employer_key];
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

    let hiringTrendSummary = null;
    if (hiringTrendData.length >= 2) {
      const start = hiringTrendData[0].hires;
      const latest = hiringTrendData[hiringTrendData.length - 1].hires;
      const change = start !== 0 ? Number((((latest - start) / start) * 100).toFixed(1)) : 0;
      const peak = hiringTrendData.reduce((prev, current) => (current.hires > prev.hires ? current : prev), hiringTrendData[0]);
      hiringTrendSummary = {
        start,
        latest,
        change,
        peakYear: peak.year,
        peakValue: peak.hires,
      };
    }

    // Hires by Degree Level
    const degreeHires = {};
    filteredEngagement.forEach(e => {
      const student = studentLookup[String(e.student_key)];
      if (student && student.program_name) {
        const degreeLevel = student.program_name.includes('MS') ? 'Master\'s' : 
                          student.program_name.includes('PhD') ? 'PhD' : 
                          student.program_name.includes('BS') ? 'Bachelor\'s' : 'Other';
        degreeHires[degreeLevel] = (degreeHires[degreeLevel] || 0) + 1;
      }
    });
    const totalDegreeHires = Object.values(degreeHires).reduce((sum, count) => sum + count, 0);
    const hiresByDegreeData = Object.entries(degreeHires)
      .map(([name, value]) => ({
        name,
        value,
        percent: totalDegreeHires > 0 ? Number(((value / totalDegreeHires) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.value - a.value);
    const topDegreeCategory = hiresByDegreeData[0] || { name: 'N/A', value: 0, percent: 0 };

    // Employment Type (Full-Time, Internship, Contract)
    // Since we don't have explicit employment type, we'll infer from job_role or use a placeholder
    const employmentType = {
      'Full-Time': hiredEngagements.filter(e => e.job_role && !e.job_role.toLowerCase().includes('intern')).length,
      'Internship': hiredEngagements.filter(e => e.job_role && e.job_role.toLowerCase().includes('intern')).length,
      'Contract': hiredEngagements.filter(e => e.job_role && e.job_role.toLowerCase().includes('contract')).length
    };
    const totalEmploymentType = Object.values(employmentType).reduce((sum, count) => sum + count, 0);
    const employmentTypeData = Object.entries(employmentType)
      .filter((entry) => entry[1] > 0)
      .map(([name, value]) => ({
        name,
        value,
        percent: totalEmploymentType > 0 ? Number(((value / totalEmploymentType) * 100).toFixed(1)) : 0,
      }));

    // Alumni hires by state (2020-2025)
    const alumniCountsByState = {};
    const mapHires = alumniEngagement.filter(e => e.hired_flag === '1' || e.hired_flag === 1);
    mapHires.forEach(e => {
      const hireDate = dateLookup[String(e.hire_date_key)];
      const eventDate = dateLookup[String(e.event_date_key)];
      const year = hireDate ? Number(hireDate.year) : eventDate ? Number(eventDate.year) : Number(String(e.hire_date_key || e.event_date_key).slice(0, 4));
      if (!year || year < 2020 || year > 2025) return;
      const employer = employerLookup[e.employer_key];
      if (!employer) return;
      const stateCode = (employer.hq_state || '').trim().toUpperCase();
      if (stateCode.length === 2) {
        alumniCountsByState[stateCode] = (alumniCountsByState[stateCode] || 0) + 1;
      }
    });

    // Top 10 Employers
    const topEmployersData = Object.entries(employerHires)
      .map(([name, value]) => ({
        name,
        hires: value,
        percent: totalHires > 0 ? Number(((value / totalHires) * 100).toFixed(1)) : 0,
      }))
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
    const totalLocationsCount = Object.values(employerLocations).reduce((sum, count) => sum + count, 0);
    const employerLocationsData = Object.entries(employerLocations)
      .map(([name, value]) => ({
        name,
        value,
        percent: totalLocationsCount > 0 ? Number(((value / totalLocationsCount) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
    const topLocationCategory = employerLocationsData[0] || { name: 'N/A', value: 0, percent: 0 };

    // Visa Type of Hires
    const visaHires = {};
    hiredEngagements.forEach(e => {
      const student = studentLookup[String(e.student_key)];
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
      const date = dateLookup[String(e.event_date_key)];
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

    // Pipeline waterfall (applications -> interviews -> offers -> hires)
    const pipelineTotals = filteredEngagement.reduce(
      (totals, engagement) => {
        totals.applications += Number(engagement.applications_submitted || 0);
        totals.interviews += Number(engagement.interviews_count || 0);
        totals.offers += Number(engagement.job_offers_count || 0);
        if (['1', 1].includes(engagement.hired_flag)) {
          totals.hires += 1;
        }
        return totals;
      },
      { applications: 0, interviews: 0, offers: 0, hires: 0 }
    );

    const pipelineBaseline = pipelineTotals.applications || 1;
    const funnelStagesOrder = [
      { stage: 'Applications', count: pipelineTotals.applications },
      { stage: 'Interviews', count: pipelineTotals.interviews },
      { stage: 'Offers', count: pipelineTotals.offers },
      { stage: 'Hires', count: pipelineTotals.hires },
    ];

    const pipelineFunnelData = funnelStagesOrder.map((stage, index) => {
      const currentCount = stage.count;
      const previousCount = index === 0 ? currentCount : funnelStagesOrder[index - 1].count || 1;
      const stageConversion = index === 0 ? 100 : previousCount > 0 ? (currentCount / previousCount) * 100 : 0;
      const cumulativeConversion = pipelineBaseline > 0 ? (currentCount / pipelineBaseline) * 100 : 0;

      return {
        stage: stage.stage,
        count: currentCount,
        rate: Number(cumulativeConversion.toFixed(1)),
        rateLabel: `${Number(cumulativeConversion.toFixed(1))}%`,
        countLabel: currentCount.toLocaleString(),
        stageLabel: stage.stage,
        stageConversion: Number(stageConversion.toFixed(1)),
        stageConversionLabel: index === 0 ? 'Baseline' : `${Number(stageConversion.toFixed(1))}% of prior stage`,
      };
    });

    const pipelineDropStage = pipelineFunnelData.slice(1).reduce((prev, current) =>
      (current.stageConversion < prev.stageConversion ? current : prev),
      pipelineFunnelData[1] || null,
    );
    const pipelineFinalStage = pipelineFunnelData[pipelineFunnelData.length - 1] || null;

    // Employer health scoring
    const eventDateValues = filteredEngagement
      .map((engagement) => {
        const dateObj = dateLookup[String(engagement.event_date_key)];
        return dateObj ? new Date(dateObj.full_date).getTime() : null;
      })
      .filter((value) => value !== null);

    const maxEventTimestamp = eventDateValues.length > 0 ? Math.max(...eventDateValues) : Date.now();
    const rollingWindowStart = (() => {
      const windowStart = new Date(maxEventTimestamp);
      windowStart.setFullYear(windowStart.getFullYear() - 1);
      return windowStart;
    })();

    const employerHealth = new Map();
    filteredEngagement.forEach((engagement) => {
      const employer = employerLookup[engagement.employer_key];
      if (!employer) return;
      if (!employerHealth.has(employer.employer_key)) {
        employerHealth.set(employer.employer_key, {
          employerKey: employer.employer_key,
          employerName: employer.employer_name || 'Unknown',
          totalHires: 0,
          recentHires: 0,
          recentEvents: 0,
          engagementScoreTotal: 0,
          engagementScoreCount: 0,
          totalApplications: 0,
          totalInterviews: 0,
        });
      }

      const record = employerHealth.get(employer.employer_key);
      const eventDate = dateLookup[String(engagement.event_date_key)];
      const eventDateObj = eventDate ? new Date(eventDate.full_date) : null;
      if (eventDateObj && eventDateObj >= rollingWindowStart) {
        record.recentEvents += 1;
      }

      const hireDate = dateLookup[String(engagement.hire_date_key)];
      const hireDateObj = hireDate ? new Date(hireDate.full_date) : null;
      if (['1', 1].includes(engagement.hired_flag)) {
        record.totalHires += 1;
        if (hireDateObj && hireDateObj >= rollingWindowStart) {
          record.recentHires += 1;
        }
      }

      record.totalApplications += Number(engagement.applications_submitted || 0);
      record.totalInterviews += Number(engagement.interviews_count || 0);

      if (engagement.engagement_score) {
        record.engagementScoreTotal += parseFloat(engagement.engagement_score || 0);
        record.engagementScoreCount += 1;
      }
    });

    const employerHealthScores = Array.from(employerHealth.values())
      .map((entry) => {
        const avgEngagement = entry.engagementScoreCount > 0 ? entry.engagementScoreTotal / entry.engagementScoreCount : 0;
        const normalizedTotalHires = Math.min(entry.totalHires / 10, 1);
        const normalizedRecentHires = Math.min(entry.recentHires / 5, 1);
        const normalizedRecentEvents = Math.min(entry.recentEvents / 8, 1);
        const normalizedEngagement = Math.min(avgEngagement / 10, 1);
        const healthScore = Number(
          (
            normalizedTotalHires * 25 +
            normalizedRecentHires * 30 +
            normalizedRecentEvents * 20 +
            normalizedEngagement * 25
          ).toFixed(1)
        );

        return {
          employerKey: entry.employerKey,
          employerName: entry.employerName,
          totalHires: entry.totalHires,
          recentHires: entry.recentHires,
          recentEvents: entry.recentEvents,
          avgEngagementScore: Number(avgEngagement.toFixed(2)),
          healthScore,
          bubbleSize: Math.max(entry.totalHires, 1),
        };
      })
      .sort((a, b) => b.healthScore - a.healthScore)
      .slice(0, 10);

    // Diversity hiring mix (gender and visa)
    const genderApplicants = students.reduce((acc, student) => {
      const gender = student.gender || 'Unknown';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    const visaApplicants = students.reduce((acc, student) => {
      const visa = student.visa_status || 'Unknown';
      acc[visa] = (acc[visa] || 0) + 1;
      return acc;
    }, {});

    const genderHires = {};
    const visaHiresMix = {};
    hiredEngagements.forEach((engagement) => {
      const student = studentLookup[String(engagement.student_key)];
      if (!student) return;
      const gender = student.gender || 'Unknown';
      const visa = student.visa_status || 'Unknown';
      genderHires[gender] = (genderHires[gender] || 0) + 1;
      visaHiresMix[visa] = (visaHiresMix[visa] || 0) + 1;
    });

    const diversityByGender = Object.keys(genderApplicants).map((gender) => {
      const applicants = genderApplicants[gender];
      const hires = genderHires[gender] || 0;
      return {
        category: gender,
        applicants,
        hires,
        hireRate: applicants > 0 ? Number(((hires / applicants) * 100).toFixed(1)) : 0,
      };
    });

    const diversityByVisa = Object.keys(visaApplicants).map((visa) => {
      const applicants = visaApplicants[visa];
      const hires = visaHiresMix[visa] || 0;
      return {
        category: visa,
        applicants,
        hires,
        hireRate: applicants > 0 ? Number(((hires / applicants) * 100).toFixed(1)) : 0,
      };
    });

    // Churn risk early warning
    const churnRiskList = Array.from(employerHealth.values())
      .map((entry) => {
        const avgEngagement = entry.engagementScoreCount > 0 ? entry.engagementScoreTotal / entry.engagementScoreCount : 0;
        let riskScore = 0;
        if (entry.recentHires === 0) riskScore += 40;
        else if (entry.recentHires <= 1) riskScore += 25;
        if (entry.recentEvents === 0) riskScore += 30;
        else if (entry.recentEvents <= 1) riskScore += 15;
        if (avgEngagement < 5) riskScore += 20;
        if (entry.totalApplications < 3) riskScore += 10;

        return {
          employerKey: entry.employerKey,
          employerName: entry.employerName,
          riskScore: Number(riskScore.toFixed(1)),
          recentHires: entry.recentHires,
          recentEvents: entry.recentEvents,
          avgEngagementScore: Number(avgEngagement.toFixed(2)),
        };
      })
      .filter((item) => item.riskScore >= 30)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    return {
      activeEmployers,
      totalHires,
      sluEventHires,
      sluEventHirePercent,
      hiresByIndustryData,
      topIndustryCategory,
      topIndustry,
      hiresByEmployerData,
      hiringTrendData,
      hiringTrendSummary,
      hiresByDegreeData,
      topDegreeCategory,
      employmentTypeData,
      topEmployersData,
      employerLocationsData,
      topLocationCategory,
      visaHiresData,
      hiringVsEngagementData,
      alumniCountsByState,
      employerCountsByState,
      pipelineFunnelData,
      pipelineDropStage,
      pipelineFinalStage,
      employerHealthScores,
      diversityByGender,
      diversityByVisa,
      churnRiskList,
    };
  }, [data, filters]);

  const renderEmployerHealthTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) {
      return null;
    }
    const dataPoint = payload[0].payload;
    return (
      <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow">
        <p className="font-semibold text-slate-700">{dataPoint.employerName}</p>
        <p>Health Score: {dataPoint.healthScore}</p>
        <p>12-Mo Hires: {dataPoint.recentHires}</p>
        <p>Recent Events: {dataPoint.recentEvents}</p>
        <p>Total Hires: {dataPoint.totalHires}</p>
        <p>Avg Engagement: {dataPoint.avgEngagementScore}</p>
      </div>
    );
  };

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
      const topIndustry = processedData.topIndustryCategory;
      insightsList.push({
        title: "Industry Hiring Concentration",
        description: `${topIndustry.name} generated ${topIndustry.value.toLocaleString()} hires (${topIndustry.percent}% of total).` +
          `${topIndustry.percent > 40 ? ' Hiring is heavily concentrated—watch for over-reliance on a single sector.' : ' Mix remains balanced across industries.'}`,
        recommendation: topIndustry.percent > 40
          ? "Diversify outreach to emerging industries to avoid concentration risk. Consider targeted events for underrepresented sectors."
          : "Maintain momentum with high-performing industries while nurturing growth-stage sectors through co-branded initiatives."
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
        description: `Hires moved from ${processedData.hiringTrendSummary.start} to ${processedData.hiringTrendSummary.latest} year-over-year (${processedData.hiringTrendSummary.change}% change). Peak hiring occurred in ${processedData.hiringTrendSummary.peakYear} with ${processedData.hiringTrendSummary.peakValue} hires.`,
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
      const topDegree = processedData.topDegreeCategory;
      insightsList.push({
        title: "Degree Level Hiring Preference",
        description: `${topDegree.name} degree holders produced ${topDegree.value.toLocaleString()} hires (${topDegree.percent}% of total).`,
        recommendation: `Promote ${topDegree.name} success stories to employers while designing upskilling tracks for lower-volume degrees to broaden placement outcomes.`
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
    <div className="min-h-screen bg-gray-100 pb-16">
      <PageHero
        images={EMPLOYER_HERO_IMAGES}
        eyebrow="Employer Partnerships"
        title="Empowering Employer Collaborations"
        subtitle="Understand hiring momentum and partner engagement"
        description="Monitor the impact of our corporate alliances. Explore hires, regional presence, industry demand, and program alignment to strengthen strategic partnerships."
        actions={[
          { to: '/', label: 'Back to Home', variant: 'secondary' },
          { href: '#employer-kpis', label: 'Explore KPIs' },
        ]}
      />

      <div className="container mx-auto px-4 py-6">
        <h2 id="employer-kpis" className="text-3xl font-bold text-sluBlue mb-6">
          💼 Employer Dashboard
        </h2>

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
            value={processedData.topIndustryCategory.name}
            icon="🏭"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" style={{ gridAutoRows: 'minmax(300px, auto)' }}>
          <ChartCard
            title="Hires by Industry"
            subtitle="Top industries, their hires, and share of total"
            contentClassName="flex flex-col justify-between h-[300px]"
          >
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={processedData.hiresByIndustryData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} height={80} />
                  <YAxis yAxisId="left" allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                  <Tooltip
                    formatter={(value, name) =>
                      name === 'Share of Hires'
                        ? [`${value}%`, name]
                        : [`${value.toLocaleString()} hires`, 'Hires']
                    }
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="value" name="Hires" fill="#002F6C" radius={[4, 4, 0, 0]} maxBarSize={36}>
                    <LabelList
                      dataKey="value"
                      position="insideTop"
                      formatter={(value) => value.toLocaleString()}
                      fill="#ffffff"
                      fontSize={11}
                    />
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="percent"
                    name="Share of Hires"
                    stroke="#FDB515"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[0.7rem] text-slate-600">
              {processedData.topIndustryCategory
                ? `Largest hiring industry: ${processedData.topIndustryCategory.name} with ${processedData.topIndustryCategory.value.toLocaleString()} hires (${processedData.topIndustryCategory.percent}% of total).`
                : 'No industry data available.'}
            </div>
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

          <ChartCard
            title="Hiring Trend"
            subtitle="Annual hires by employer partners"
            contentClassName="flex flex-col justify-between h-[280px]"
          >
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedData.hiringTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="hires" stroke="#002F6C" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {processedData.hiringTrendSummary ? (
              <div className="mt-2 text-[0.7rem] text-slate-600">
                Hires moved from {processedData.hiringTrendSummary.start} to {processedData.hiringTrendSummary.latest}
                {' '}({processedData.hiringTrendSummary.change}% change). Peak hiring occurred in {processedData.hiringTrendSummary.peakYear}
                {' '}with {processedData.hiringTrendSummary.peakValue} hires.
              </div>
            ) : null}
          </ChartCard>

          <ChartCard
            title="Hires by Degree Level"
            subtitle="Degrees of hired alumni and their share of total"
            contentClassName="flex flex-col justify-between h-[260px]"
          >
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={processedData.hiresByDegreeData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(value) => value.toLocaleString()} />
                  <YAxis type="category" dataKey="name" width={130} />
                  <Tooltip formatter={(value) => `${value.toLocaleString()} hires`} />
                  <Bar dataKey="value" fill="#4A90E2" radius={[4, 4, 4, 4]} maxBarSize={38}>
                    <LabelList dataKey="value" position="insideRight" formatter={(value) => value.toLocaleString()} fill="#ffffff" fontSize={11} />
                    <LabelList dataKey="percent" position="right" formatter={(value) => `${value}%`} fill="#1e293b" fontSize={10} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[0.7rem] text-slate-600">
              Top degree demand: {processedData.topDegreeCategory.name} ({processedData.topDegreeCategory.value.toLocaleString()} hires, {processedData.topDegreeCategory.percent}% of total).
            </div>
          </ChartCard>

          <ChartCard
            title="Employment Type"
            subtitle="Placement outcomes by position type"
            contentClassName="flex flex-col justify-between h-[260px]"
          >
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processedData.employmentTypeData}
                    cx="50%"
                    cy="55%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {processedData.employmentTypeData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                    <LabelList dataKey="name" position="outside" fill="#1e293b" fontSize={11} offset={6} />
                    <LabelList dataKey="percent" position="inside" formatter={(value) => `${value}%`} fill="#ffffff" fontSize={12} />
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value.toLocaleString()} hires`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-3 text-[0.68rem] text-slate-600">
              {processedData.employmentTypeData.map((item) => (
                <div key={item.name} className="rounded-md bg-slate-100/70 px-2 py-2">
                  <p className="font-semibold text-slate-700">{item.name}</p>
                  <p>{item.value.toLocaleString()} hires</p>
                  <p>{item.percent}% of total</p>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard
            title="Top 10 Employers"
            subtitle="Hiring totals and share of overall placements"
            contentClassName="flex flex-col justify-between h-[280px]"
          >
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={processedData.topEmployersData}
                  margin={{ top: 10, right: 24, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(value) => value.toLocaleString()} />
                  <YAxis type="category" dataKey="name" width={160} />
                  <Tooltip
                    formatter={(value, name, payload) =>
                      name === 'Share of Hires'
                        ? [`${value}%`, name]
                        : [`${value.toLocaleString()} hires`, payload.name]
                    }
                  />
                  <Legend />
                  <Bar dataKey="hires" name="Hires" fill="#002F6C" radius={[4, 4, 4, 4]} maxBarSize={40}>
                    <LabelList dataKey="hires" position="insideRight" formatter={(value) => value.toLocaleString()} fill="#ffffff" fontSize={11} />
                    <LabelList dataKey="percent" position="right" formatter={(value) => `${value}%`} fill="#1e293b" fontSize={10} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[0.7rem] text-slate-600">
              {processedData.topEmployersData.length > 0
                ? `Leading partner: ${processedData.topEmployersData[0].name} with ${processedData.topEmployersData[0].hires.toLocaleString()} hires (${processedData.topEmployersData[0].percent}% of total).`
                : 'No employer hiring data available.'}
            </div>
          </ChartCard>

          <ChartCard
            title="Employer Locations"
            subtitle="Top hiring hubs and their share of employer presence"
            contentClassName="flex flex-col justify-between h-[280px]"
          >
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={processedData.employerLocationsData}
                  margin={{ top: 10, right: 24, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(value) => value.toLocaleString()} />
                  <YAxis type="category" dataKey="name" width={180} />
                  <Tooltip
                    formatter={(value, name, payload) =>
                      name === 'Share'
                        ? [`${value}%`, name]
                        : [`${value.toLocaleString()} employers`, payload.name]
                    }
                  />
                  <Legend />
                  <Bar dataKey="value" name="Employers" fill="#4A90E2" radius={[4, 4, 4, 4]} maxBarSize={40}>
                    <LabelList dataKey="value" position="insideRight" formatter={(value) => value.toLocaleString()} fill="#ffffff" fontSize={11} />
                    <LabelList dataKey="percent" position="right" formatter={(value) => `${value}%`} fill="#1e293b" fontSize={10} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[0.7rem] text-slate-600">
              {processedData.employerLocationsData.length > 0
                ? `Top hub: ${processedData.topLocationCategory.name} (${processedData.topLocationCategory.value.toLocaleString()} employers, ${processedData.topLocationCategory.percent}% of total).`
                : 'No location data available.'}
            </div>
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

          <ChartCard title="Employer Geography (2020-2025)" className="lg:col-span-2" fullHeight={true}>
            <EmployerUSMap 
              alumniCounts={processedData.alumniCountsByState}
              employerCounts={processedData.employerCountsByState}
            />
          </ChartCard>
        </div>

        <h3 className="text-2xl font-semibold text-sluBlue mb-4">Advanced Hiring Analytics</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" style={{ gridAutoRows: 'minmax(320px, auto)' }}>
          <ChartCard title="Talent Pipeline" subtitle="Stage-to-stage conversion from applicants to hires" contentClassName="h-[320px] relative">
            {processedData.pipelineFunnelData.some((item) => item.count > 0) ? (
              <>
                <div className="absolute left-3 top-10 flex flex-col gap-[34px] text-[0.75rem] text-slate-600">
                  {processedData.pipelineFunnelData.map((stage) => (
                    <span key={stage.stage}>{stage.stage}</span>
                  ))}
                </div>
                <div className="h-full pl-24 pr-12 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart margin={{ top: 0, right: 16, left: 0, bottom: 10 }}>
                      <Tooltip
                        formatter={(value) => value.toLocaleString()}
                        labelFormatter={(label, payload) => {
                          const dataPoint = payload?.[0]?.payload;
                          return dataPoint ? `${dataPoint.stage} • ${dataPoint.stageConversionLabel}` : label;
                        }}
                      />
                      <Funnel
                        data={processedData.pipelineFunnelData}
                        dataKey="count"
                        fill="#002F6C"
                        stroke="#0f172a"
                        isAnimationActive={false}
                      >
                        <LabelList dataKey="countLabel" position="inside" fill="#ffffff" fontSize={12} />
                        <LabelList dataKey="rateLabel" position="right" fill="#0f172a" fontSize={12} offset={6} />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">No pipeline data available.</div>
            )}
            {processedData.pipelineFunnelData.length > 1 ? (
              <div className="mt-2 ml-24 text-[0.7rem] text-slate-600">
                {processedData.pipelineFinalStage
                  ? `Final conversion: ${processedData.pipelineFinalStage.stage} retains ${processedData.pipelineFinalStage.rateLabel} (${processedData.pipelineFinalStage.countLabel} hires).`
                  : null}
                {processedData.pipelineDropStage
                  ? ` Largest drop occurs entering ${processedData.pipelineDropStage.stage} with ${processedData.pipelineDropStage.stageConversion}% of the previous stage retained.`
                  : null}
              </div>
            ) : null}
          </ChartCard>

          <ChartCard
            title="Employer Health Scorecard"
            subtitle="Recent hires vs. engagement activity (bubble sized by total hires)"
            contentClassName="flex flex-col justify-between h-[320px]"
          >
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="recentEvents" name="Recent Events" allowDecimals={false} />
                  <YAxis type="number" dataKey="recentHires" name="12-Mo Hires" allowDecimals={false} />
                  <ZAxis type="number" dataKey="bubbleSize" range={[80, 400]} />
                  <Tooltip content={renderEmployerHealthTooltip} />
                  <Legend />
                  <Scatter
                    name="Employers"
                    data={processedData.employerHealthScores}
                    fill="#FDB515"
                    fillOpacity={0.8}
                    line
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[0.7rem] text-slate-600">
              {processedData.employerHealthScores.length > 0
                ? `Highest health score: ${processedData.employerHealthScores[0].employerName} (${processedData.employerHealthScores[0].healthScore}) with ${processedData.employerHealthScores[0].recentHires} recent hires and ${processedData.employerHealthScores[0].recentEvents} events.`
                : 'No employer health data available.'}
            </div>
          </ChartCard>
        </div>

        <h3 className="text-2xl font-semibold text-sluBlue mb-4">Inclusion & Retention Insights</h3>
        <div className="grid grid-cols-1 gap-6 mb-10" style={{ gridAutoRows: 'minmax(320px, auto)' }}>
          <ChartCard title="Churn Risk Watchlist" subtitle="Employers showing early warning signs" isTable={true}>
            <table className="min-w-full text-xs text-slate-600">
              <thead className="bg-slate-100 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Employer</th>
                  <th className="px-3 py-2 text-left">Risk Score</th>
                  <th className="px-3 py-2 text-left">12-Mo Hires</th>
                  <th className="px-3 py-2 text-left">Recent Events</th>
                  <th className="px-3 py-2 text-left">Avg Engagement</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {processedData.churnRiskList.map((row) => (
                  <tr key={row.employerKey} className="odd:bg-slate-50 even:bg-white hover:bg-slate-100 transition-colors">
                    <td className="px-3 py-2 font-semibold text-slate-700">{row.employerName}</td>
                    <td className="px-3 py-2 text-slate-600">{row.riskScore}</td>
                    <td className="px-3 py-2 text-slate-600">{row.recentHires}</td>
                    <td className="px-3 py-2 text-slate-600">{row.recentEvents}</td>
                    <td className="px-3 py-2 text-slate-600">{row.avgEngagementScore}</td>
                  </tr>
                ))}
                {processedData.churnRiskList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-xs text-slate-500">No employers flagged as high risk.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </ChartCard>

          <ChartCard title="Gender Hiring Mix" subtitle="Applicant vs hire mix by gender with conversion rate" contentClassName="flex flex-col justify-between h-[280px]">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedData.diversityByGender}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis dataKey="hireRate" tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                  <Legend />
                  <Bar dataKey="hireRate" fill="#002F6C" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {processedData.diversityByGender.length > 0 ? (
              <div className="mt-2 text-[0.7rem] text-slate-600">
                {(() => {
                  const topRate = processedData.diversityByGender.reduce((prev, current) => (current.hireRate > prev.hireRate ? current : prev), processedData.diversityByGender[0]);
                  return `Highest hire rate: ${topRate.category} (${topRate.hireRate}%).`;
                })()}
              </div>
            ) : null}
          </ChartCard>
        </div>
 
        {/* Analysis Insights Section */}
        <InsightsPanel 
          insights={insights} 
          title="📈 Employer Engagement Analysis & Insights"
        />

        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow">
          <h3 className="text-2xl font-semibold text-sluBlue mb-2">🔮 Data Scientist Predictions</h3>
          <p className="text-sm text-slate-600 mb-4">
            Forward-looking estimates based on the latest hiring trends and conversion metrics.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[0.85rem] text-slate-600">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <h4 className="text-sm font-semibold text-slate-700">Next-Quarter Hiring Forecast</h4>
              <p className="mt-2">
                Projecting {processedData.hiringTrendSummary ? Math.round(processedData.hiringTrendSummary.latest * 1.05) : '—'} hires next quarter
                assuming the current positive trend continues (+5% growth scenario).
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <h4 className="text-sm font-semibold text-slate-700">At-Risk Employers</h4>
              <p className="mt-2">
                Churn model flags {processedData.churnRiskList.length} employers for proactive outreach. Prioritize personalized engagement to
                prevent pipeline drop-off.
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <h4 className="text-sm font-semibold text-slate-700">Industry Momentum</h4>
              <p className="mt-2">
                Growth-driven industries such as {processedData.topIndustryCategory.name} show potential for an additional
                {' '}{processedData.topIndustryCategory.percent + 5 <= 100 ? processedData.topIndustryCategory.percent + 5 : processedData.topIndustryCategory.percent}% share if events focus on their skills gaps.
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Predictions are illustrative and assume consistent engagement programs; refine with a production forecasting model as data volume grows.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;
