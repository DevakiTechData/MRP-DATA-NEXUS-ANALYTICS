/**
 * Alumni-SLU Relationship Predictions
 * Returns exactly 5 key predictions that build SLU-alumni relations
 */

/**
 * Get top 5 programs with highest engagement growth potential
 */
export const getTopProgramsForGrowth = (students, alumniEngagement) => {
  if (!students || !alumniEngagement) return [];
  
  const programStats = {};
  const studentLookup = {};
  students.forEach(s => {
    studentLookup[s.student_key] = s;
    const program = s.program_name || 'Unknown';
    if (!programStats[program]) {
      programStats[program] = { program, total: 0, engaged: 0, engagements: 0 };
    }
    programStats[program].total += 1;
  });
  
  const engagedSet = new Set();
  alumniEngagement.forEach(e => {
    const studentId = String(e.student_key);
    const student = studentLookup[studentId];
    if (student) {
      const program = student.program_name || 'Unknown';
      engagedSet.add(studentId);
      programStats[program].engagements += 1;
    }
  });
  
  engagedSet.forEach(id => {
    const student = studentLookup[id];
    if (student) {
      const program = student.program_name || 'Unknown';
      programStats[program].engaged += 1;
    }
  });
  
  return Object.values(programStats)
    .map(p => ({
      program: p.program,
      engagementRate: p.total > 0 ? ((p.engaged / p.total) * 100).toFixed(1) : 0,
      totalAlumni: p.total,
      engagedAlumni: p.engaged,
      avgEngagements: p.engaged > 0 ? (p.engagements / p.engaged).toFixed(1) : 0,
      growthPotential: p.total > 0 && p.engaged < p.total * 0.8 ? 'High' : 'Moderate',
    }))
    .sort((a, b) => parseFloat(b.engagementRate) - parseFloat(a.engagementRate))
    .slice(0, 5);
};

/**
 * Get top 5 geographic regions for event planning
 */
export const getTopRegionsForEvents = (students, alumniEngagement) => {
  if (!students || !alumniEngagement) return [];
  
  const locationStats = {};
  const studentLookup = {};
  students.forEach(s => {
    studentLookup[s.student_key] = s;
  });
  
  const engagedSet = new Set();
  alumniEngagement.forEach(e => {
    const studentId = String(e.student_key);
    engagedSet.add(studentId);
  });
  
  engagedSet.forEach(id => {
    const student = studentLookup[id];
    if (student) {
      const state = student.current_state || 'Unknown';
      if (!locationStats[state]) {
        locationStats[state] = { state, count: 0, totalEngagements: 0 };
      }
      locationStats[state].count += 1;
    }
  });
  
  // Count total engagements per state
  alumniEngagement.forEach(e => {
    const studentId = String(e.student_key);
    const student = studentLookup[studentId];
    if (student) {
      const state = student.current_state || 'Unknown';
      if (locationStats[state]) {
        locationStats[state].totalEngagements += 1;
      }
    }
  });
  
  return Object.values(locationStats)
    .map(l => ({
      state: l.state,
      engagedAlumni: l.count,
      totalEngagements: l.totalEngagements,
      avgEngagements: l.count > 0 ? (l.totalEngagements / l.count).toFixed(1) : 0,
    }))
    .sort((a, b) => b.engagedAlumni - a.engagedAlumni)
    .slice(0, 5);
};

/**
 * Get top 5 high-engagement alumni for mentorship opportunities
 */
export const getTopMentorshipAlumni = (students, alumniEngagement) => {
  if (!students || !alumniEngagement) return [];
  
  const studentLookup = {};
  students.forEach(s => {
    studentLookup[s.student_key] = s;
  });
  
  const alumniStats = {};
  alumniEngagement.forEach(e => {
    const studentId = String(e.student_key);
    const student = studentLookup[studentId];
    if (!student) return;
    
    if (!alumniStats[studentId]) {
      alumniStats[studentId] = {
        name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown',
        program: student.program_name || 'Unknown',
        engagementCount: 0,
        mentorshipHours: 0,
      };
    }
    alumniStats[studentId].engagementCount += 1;
    const hours = parseFloat(e.mentorship_hours || 0);
    alumniStats[studentId].mentorshipHours += hours;
  });
  
  return Object.values(alumniStats)
    .filter(a => a.engagementCount >= 3) // At least 3 engagements
    .sort((a, b) => b.engagementCount - a.engagementCount)
    .slice(0, 5);
};

/**
 * Get top 5 at-risk cohorts needing outreach
 */
export const getAtRiskCohorts = (students, alumniEngagement) => {
  if (!students || !alumniEngagement) return [];
  
  const cohortStats = {};
  const studentLookup = {};
  students.forEach(s => {
    studentLookup[s.student_key] = s;
    const year = String(s.graduation_year || 'Unknown');
    if (!cohortStats[year]) {
      cohortStats[year] = { year, total: 0, engaged: 0 };
    }
    cohortStats[year].total += 1;
  });
  
  const engagedSet = new Set();
  alumniEngagement.forEach(e => {
    const studentId = String(e.student_key);
    engagedSet.add(studentId);
  });
  
  engagedSet.forEach(id => {
    const student = studentLookup[id];
    if (student) {
      const year = String(student.graduation_year || 'Unknown');
      if (cohortStats[year]) {
        cohortStats[year].engaged += 1;
      }
    }
  });
  
  return Object.values(cohortStats)
    .map(c => ({
      year: c.year,
      totalAlumni: c.total,
      engagedAlumni: c.engaged,
      engagementRate: c.total > 0 ? ((c.engaged / c.total) * 100).toFixed(1) : 0,
      riskLevel: c.total > 0 && (c.engaged / c.total) < 0.3 ? 'High' : (c.engaged / c.total) < 0.5 ? 'Medium' : 'Low',
    }))
    .filter(c => c.riskLevel !== 'Low')
    .sort((a, b) => parseFloat(a.engagementRate) - parseFloat(b.engagementRate))
    .slice(0, 5);
};

/**
 * Get engagement trend forecast for next 3 months
 */
export const getEngagementForecast = (alumniEngagement) => {
  if (!alumniEngagement || alumniEngagement.length === 0) return null;
  
  // Group by month
  const monthlyData = {};
  alumniEngagement.forEach(e => {
    if (!e.engagement_date) return;
    const date = new Date(e.engagement_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: monthKey, count: 0, engaged: new Set() };
    }
    monthlyData[monthKey].count += 1;
    if (e.student_key) {
      monthlyData[monthKey].engaged.add(String(e.student_key));
    }
  });
  
  const sortedMonths = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Last 6 months
  
  if (sortedMonths.length < 3) return null;
  
  const recentAvg = sortedMonths.slice(-3).reduce((sum, m) => sum + m.engaged.size, 0) / 3;
  const growthRate = sortedMonths.length >= 6 
    ? ((sortedMonths[sortedMonths.length - 1].engaged.size - sortedMonths[sortedMonths.length - 6].engaged.size) / sortedMonths[sortedMonths.length - 6].engaged.size) * 100
    : 5; // Default 5% growth
  
  return {
    currentEngaged: Math.round(sortedMonths[sortedMonths.length - 1]?.engaged.size || 0),
    forecast3Months: Math.round(recentAvg * (1 + (growthRate / 100))),
    growthRate: growthRate.toFixed(1),
    trend: growthRate > 0 ? 'Growing' : growthRate < 0 ? 'Declining' : 'Stable',
  };
};

/**
 * Get top 5 job roles by alumni count
 */
export const getTopJobRoles = (alumniEmployment, students) => {
  if (!alumniEmployment || alumniEmployment.length === 0) return [];
  
  const roleStats = {};
  alumniEmployment.forEach(emp => {
    if (emp.status === 'Verified' && emp.job_title) {
      const role = emp.job_title.trim();
      if (role && role !== 'job_title') {
        if (!roleStats[role]) {
          roleStats[role] = { role, count: 0, programs: new Set() };
        }
        roleStats[role].count += 1;
        if (emp.program) {
          roleStats[role].programs.add(emp.program);
        }
      }
    }
  });
  
  return Object.values(roleStats)
    .map(r => ({
      role: r.role,
      count: r.count,
      programCount: r.programs.size,
      topProgram: Array.from(r.programs)[0] || 'Various',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

/**
 * Get top 5 technologies by alumni feedback
 */
export const getTopTechnologies = (employerFeedback) => {
  if (!employerFeedback || employerFeedback.length === 0) return [];
  
  const techStats = {};
  employerFeedback.forEach(fb => {
    if (fb.approved_by_admin === '1' || fb.approved_by_admin === 'approved') {
      const technologies = (fb.technologies || '').split(',').map(t => t.trim()).filter(t => t);
      technologies.forEach(tech => {
        if (tech && tech !== 'technologies') {
          if (!techStats[tech]) {
            techStats[tech] = { technology: tech, count: 0, avgRating: 0, ratings: [] };
          }
          techStats[tech].count += 1;
          const rating = parseFloat(fb.rating_overall || 0);
          if (rating > 0) {
            techStats[tech].ratings.push(rating);
          }
        }
      });
    }
  });
  
  return Object.values(techStats)
    .map(t => ({
      technology: t.technology,
      count: t.count,
      avgRating: t.ratings.length > 0 
        ? (t.ratings.reduce((sum, r) => sum + r, 0) / t.ratings.length).toFixed(1)
        : '0.0',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

/**
 * Get gender distribution insights
 */
export const getGenderInsights = (students, alumniEngagement) => {
  if (!students || students.length === 0) return null;
  
  const genderStats = {};
  const studentLookup = {};
  students.forEach(s => {
    studentLookup[s.student_key] = s;
    const gender = (s.gender || 'Unknown').trim();
    if (!genderStats[gender]) {
      genderStats[gender] = { gender, total: 0, engaged: 0, engagements: 0 };
    }
    genderStats[gender].total += 1;
  });
  
  const engagedSet = new Set();
  alumniEngagement.forEach(e => {
    const studentId = String(e.student_key);
    engagedSet.add(studentId);
  });
  
  engagedSet.forEach(id => {
    const student = studentLookup[id];
    if (student) {
      const gender = (student.gender || 'Unknown').trim();
      if (genderStats[gender]) {
        genderStats[gender].engaged += 1;
      }
    }
  });
  
  alumniEngagement.forEach(e => {
    const studentId = String(e.student_key);
    const student = studentLookup[studentId];
    if (student) {
      const gender = (student.gender || 'Unknown').trim();
      if (genderStats[gender]) {
        genderStats[gender].engagements += 1;
      }
    }
  });
  
  const results = Object.values(genderStats)
    .map(g => ({
      gender: g.gender,
      total: g.total,
      engaged: g.engaged,
      engagementRate: g.total > 0 ? ((g.engaged / g.total) * 100).toFixed(1) : 0,
      avgEngagements: g.engaged > 0 ? (g.engagements / g.engaged).toFixed(1) : 0,
    }))
    .filter(g => g.gender !== 'Unknown')
    .sort((a, b) => parseFloat(b.engagementRate) - parseFloat(a.engagementRate));
  
  return {
    distribution: results,
    topGender: results[0]?.gender || 'N/A',
    topEngagementRate: results[0]?.engagementRate || '0',
  };
};

/**
 * Get all 5 alumni-SLU relationship predictions
 */
export const getAlumniSLUPredictions = (students, alumniEngagement, alumniEmployment = [], employerFeedback = []) => {
  return {
    topPrograms: getTopProgramsForGrowth(students, alumniEngagement),
    jobRoles: getTopJobRoles(alumniEmployment, students),
    technologies: getTopTechnologies(employerFeedback),
    genderInsights: getGenderInsights(students, alumniEngagement),
    engagementForecast: getEngagementForecast(alumniEngagement),
  };
};

