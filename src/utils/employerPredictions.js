/**
 * Employer-SLU Relationship Predictions
 * Returns exactly 5 key predictions that build SLU-employer relations
 */

/**
 * Get top 5 strongest employer partnerships
 */
export const getTopPartnerships = (employers, alumniEmployment, alumniEngagement) => {
  if (!employers || !alumniEmployment) return [];
  
  const employerStats = {};
  employers.forEach(e => {
    employerStats[e.employer_key] = {
      name: e.employer_name || 'Unknown',
      industry: e.industry || 'Unknown',
      hires: 0,
      events: 0,
      score: 0,
    };
  });
  
  // Count verified hires
  alumniEmployment.forEach(emp => {
    if (emp.status === 'Verified') {
      const key = String(emp.employer_key);
      if (employerStats[key]) {
        employerStats[key].hires += 1;
      }
    }
  });
  
  // Count event participations
  if (alumniEngagement) {
    const eventEmployers = new Set();
    alumniEngagement.forEach(e => {
      if (e.participated_university_event_flag === '1' && e.employer_key) {
        eventEmployers.add(String(e.employer_key));
      }
    });
    eventEmployers.forEach(key => {
      if (employerStats[key]) {
        employerStats[key].events += 1;
      }
    });
  }
  
  // Calculate partnership score (hires * 2 + events)
  Object.values(employerStats).forEach(stat => {
    stat.score = (stat.hires * 2) + stat.events;
  });
  
  return Object.values(employerStats)
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};

/**
 * Get top 5 industries with expansion potential
 */
export const getExpansionIndustries = (employers, alumniEmployment) => {
  if (!employers || !alumniEmployment) return [];
  
  const industryStats = {};
  employers.forEach(e => {
    const industry = e.industry || 'Unknown';
    if (!industryStats[industry]) {
      industryStats[industry] = { industry, employers: 0, hires: 0 };
    }
    industryStats[industry].employers += 1;
  });
  
  alumniEmployment.forEach(emp => {
    if (emp.status === 'Verified') {
      const employer = employers.find(e => String(e.employer_key) === String(emp.employer_key));
      if (employer) {
        const industry = employer.industry || 'Unknown';
        if (industryStats[industry]) {
          industryStats[industry].hires += 1;
        }
      }
    }
  });
  
  return Object.values(industryStats)
    .map(s => ({
      industry: s.industry,
      employerCount: s.employers,
      totalHires: s.hires,
      avgHiresPerEmployer: s.employers > 0 ? (s.hires / s.employers).toFixed(1) : 0,
      expansionPotential: s.hires > 0 && s.employers < 10 ? 'High' : s.hires > 0 ? 'Moderate' : 'Low',
    }))
    .filter(s => s.expansionPotential !== 'Low')
    .sort((a, b) => b.totalHires - a.totalHires)
    .slice(0, 5);
};

/**
 * Get top 5 employers ready for more SLU hires
 */
export const getEmployersReadyForHires = (employers, alumniEmployment, alumniEngagement) => {
  if (!employers || !alumniEmployment) return [];
  
  const employerStats = {};
  employers.forEach(e => {
    employerStats[e.employer_key] = {
      name: e.employer_name || 'Unknown',
      industry: e.industry || 'Unknown',
      currentHires: 0,
      recentEngagements: 0,
      readinessScore: 0,
    };
  });
  
  // Count current verified hires
  alumniEmployment.forEach(emp => {
    if (emp.status === 'Verified') {
      const key = String(emp.employer_key);
      if (employerStats[key]) {
        employerStats[key].currentHires += 1;
      }
    }
  });
  
  // Count recent engagements (last 6 months)
  if (alumniEngagement) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    alumniEngagement.forEach(e => {
      if (e.engagement_date) {
        const date = new Date(e.engagement_date);
        if (date >= sixMonthsAgo && e.employer_key) {
          const key = String(e.employer_key);
          if (employerStats[key]) {
            employerStats[key].recentEngagements += 1;
          }
        }
      }
    });
  }
  
  // Calculate readiness (has hires + recent activity = ready for more)
  Object.values(employerStats).forEach(stat => {
    stat.readinessScore = stat.currentHires + (stat.recentEngagements * 0.5);
  });
  
  return Object.values(employerStats)
    .filter(s => s.currentHires > 0 && s.recentEngagements > 0)
    .sort((a, b) => b.readinessScore - a.readinessScore)
    .slice(0, 5);
};

/**
 * Get top 5 event participation opportunities
 */
export const getEventParticipationOpportunities = (employers, alumniEngagement, events) => {
  if (!employers || !events) return [];
  
  const employerEventMap = {};
  employers.forEach(e => {
    employerEventMap[e.employer_key] = {
      name: e.employer_name || 'Unknown',
      industry: e.industry || 'Unknown',
      pastEvents: 0,
      potentialEvents: 0,
    };
  });
  
  // Count past event participations
  if (alumniEngagement) {
    const eventEmployers = new Set();
    alumniEngagement.forEach(e => {
      if (e.participated_university_event_flag === '1' && e.employer_key) {
        eventEmployers.add(String(e.employer_key));
      }
    });
    eventEmployers.forEach(key => {
      if (employerEventMap[key]) {
        employerEventMap[key].pastEvents += 1;
      }
    });
  }
  
  // Count upcoming events (potential participation)
  const now = new Date();
  const upcomingEvents = events.filter(e => {
    const eventDate = new Date(e.event_date || e.date || '');
    return eventDate >= now;
  });
  
  // Estimate potential based on industry alignment
  Object.values(employerEventMap).forEach(stat => {
    stat.potentialEvents = upcomingEvents.length > 0 ? Math.min(upcomingEvents.length, 3) : 0;
  });
  
  return Object.values(employerEventMap)
    .filter(s => s.pastEvents > 0 || s.potentialEvents > 0)
    .map(s => ({
      name: s.name,
      industry: s.industry,
      pastEvents: s.pastEvents,
      potentialEvents: s.potentialEvents,
      opportunityScore: s.pastEvents + (s.potentialEvents * 2),
    }))
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 5);
};

/**
 * Get partnership growth forecast
 */
export const getPartnershipGrowthForecast = (employers, alumniEmployment, alumniEngagement) => {
  if (!employers || !alumniEmployment) return null;
  
  // Calculate current partnership metrics
  const verifiedHires = alumniEmployment.filter(e => e.status === 'Verified').length;
  const activeEmployers = new Set(alumniEmployment.filter(e => e.status === 'Verified').map(e => e.employer_key)).size;
  
  // Calculate growth trend from last 6 months
  let recentHires = 0;
  if (alumniEmployment.length > 0) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    recentHires = alumniEmployment.filter(emp => {
      if (emp.status !== 'Verified' || !emp.start_date) return false;
      const date = new Date(emp.start_date);
      return date >= sixMonthsAgo;
    }).length;
  }
  
  const growthRate = verifiedHires > 0 ? ((recentHires / verifiedHires) * 100).toFixed(1) : 0;
  const forecastHires = Math.round(verifiedHires * (1 + (parseFloat(growthRate) / 100)));
  
  return {
    currentHires: verifiedHires,
    activePartners: activeEmployers,
    recentHires,
    growthRate: parseFloat(growthRate),
    forecastHires,
    trend: parseFloat(growthRate) > 5 ? 'Growing' : parseFloat(growthRate) > 0 ? 'Stable' : 'Declining',
  };
};

/**
 * Get all 5 employer-SLU relationship predictions
 */
export const getEmployerSLUPredictions = (employers, alumniEmployment, alumniEngagement, events) => {
  return {
    topPartnerships: getTopPartnerships(employers, alumniEmployment, alumniEngagement),
    expansionIndustries: getExpansionIndustries(employers, alumniEmployment),
    readyForHires: getEmployersReadyForHires(employers, alumniEmployment, alumniEngagement),
    eventOpportunities: getEventParticipationOpportunities(employers, alumniEngagement, events),
    growthForecast: getPartnershipGrowthForecast(employers, alumniEmployment, alumniEngagement),
  };
};

