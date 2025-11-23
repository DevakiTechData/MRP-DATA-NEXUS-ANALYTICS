/**
 * Metrics Calculation Utilities
 * 
 * This file contains all metric calculation functions for the Alumni and Employer dashboards.
 * All functions are pure and reusable, accepting raw data arrays and returning calculated metrics.
 */

/**
 * Helper function to create a lookup map from an array by key
 * @param {Array} array - Array of objects
 * @param {string} keyField - Field name to use as key (e.g., 'student_key', 'date_key')
 * @returns {Object} Lookup object mapping key to item
 */
const createLookup = (array, keyField) => {
  if (!array || array.length === 0) return {};
  return array.reduce((acc, item) => {
    const key = String(item[keyField] || item[`${keyField}_id`] || item[keyField.replace('_key', '_id')]);
    if (key && key !== 'undefined' && key !== 'null') {
      acc[key] = item;
    }
    return acc;
  }, {});
};

/**
 * Helper function to safely get student ID from engagement record
 * @param {Object} engagement - Engagement record
 * @returns {string|null} Student ID or null
 */
const getStudentId = (engagement) => {
  const id = String(engagement.student_key || engagement.student_id);
  return (id && id !== 'undefined' && id !== 'null') ? id : null;
};

/**
 * Helper map of common US cities (as stored in Dim_Students) to state codes
 */
const CITY_TO_STATE_MAP = {
  'atlanta': 'GA',
  'austin': 'TX',
  'boston': 'MA',
  'chicago': 'IL',
  'dallas': 'TX',
  'new york': 'NY',
  'phoenix': 'AZ',
  'san jose': 'CA',
  'seattle': 'WA',
  'st louis': 'MO',
};

const STATE_CODE_TO_NAME = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia',
};

const normalizeCityName = (city = '') =>
  city
    .toLowerCase()
    .replace(/\./g, '')
    .trim();

/**
 * ALUMNI DASHBOARD METRICS
 */

/**
 * Calculate total number of unique alumni
 * @param {Array} students - Array of student records from dim_students
 * @returns {number} Total count of unique alumni
 */
export const calculateTotalAlumni = (students) => {
  if (!students || students.length === 0) return 0;
  const distinctStudents = new Set(students.map(s => String(s.student_key || s.student_id)));
  return distinctStudents.size;
};

/**
 * Calculate engaged alumni count
 * An alumnus is considered engaged if they appear at least once in fact_alumni_engagement
 * 
 * @param {Array} students - Array of student records (not used, but kept for consistency)
 * @param {Array} alumniEngagement - Array of engagement records from fact_alumni_engagement
 * @returns {number} Distinct count of engaged alumni
 */
export const calculateEngagedAlumni = (students, alumniEngagement) => {
  if (!alumniEngagement || alumniEngagement.length === 0) return 0;

  const engagedStudentIds = new Set();
  
  alumniEngagement.forEach(engagement => {
    const studentId = String(engagement.student_key || engagement.student_id);
    if (studentId && studentId !== 'undefined' && studentId !== 'null') {
      engagedStudentIds.add(studentId);
    }
  });

  return engagedStudentIds.size;
};

/**
 * Calculate engagement rate
 * @param {number} engagedAlumni - Number of engaged alumni
 * @param {number} totalAlumni - Total number of alumni
 * @returns {number} Engagement rate as percentage (0-100), capped at 100%, rounded to whole number
 */
export const calculateEngagementRate = (engagedAlumni, totalAlumni) => {
  if (!totalAlumni || totalAlumni === 0) return 0;
  const rate = (engagedAlumni / totalAlumni) * 100;
  // Cap at 100% maximum and round to whole number
  return Math.round(Math.min(100, rate));
};

/**
 * Calculate total touchpoints (total engagement records)
 * @param {Array} alumniEngagement - Array of engagement records from fact_alumni_engagement
 * @returns {number} Total number of engagement records
 */
export const calculateTotalTouchpoints = (alumniEngagement) => {
  if (!alumniEngagement || alumniEngagement.length === 0) return 0;
  return alumniEngagement.length;
};

/**
 * Calculate total engagement minutes
 * Sum of mentorship_hours converted to minutes
 * @param {Array} alumniEngagement - Array of engagement records
 * @returns {number} Total engagement minutes
 */
export const calculateTotalEngagementMinutes = (alumniEngagement) => {
  if (!alumniEngagement || alumniEngagement.length === 0) return 0;
  
  const totalMinutes = alumniEngagement.reduce((sum, engagement) => {
    const hours = parseFloat(engagement.mentorship_hours || 0);
    return sum + (hours * 60);
  }, 0);
  
  return Math.round(totalMinutes);
};

/**
 * Calculate average engagement touchpoints per engaged alumnus
 * @param {Array} alumniEngagement - Array of engagement records from fact_alumni_engagement
 * @param {number} engagedAlumniCount - Number of engaged alumni
 * @returns {number} Average touchpoints per engaged alumnus
 */
export const calculateAvgTouchpoints = (alumniEngagement, engagedAlumniCount) => {
  if (!alumniEngagement || alumniEngagement.length === 0 || !engagedAlumniCount || engagedAlumniCount === 0) {
    return 0;
  }

  const totalRecords = alumniEngagement.length;
  return Number((totalRecords / engagedAlumniCount).toFixed(1));
};

/**
 * Calculate average engagement minutes per engaged alumnus
 * @param {Array} alumniEngagement - Array of engagement records
 * @param {number} engagedCount - Number of engaged alumni
 * @returns {number} Average engagement minutes
 */
export const calculateAvgEngagementMinutes = (alumniEngagement, engagedCount) => {
  if (!alumniEngagement || engagedCount === 0) return 0;

  const totalMinutes = alumniEngagement.reduce((sum, engagement) => {
    // Convert mentorship_hours to minutes (1 hour = 60 minutes)
    const hours = parseFloat(engagement.mentorship_hours || 0);
    return sum + (hours * 60);
  }, 0);

  return engagedCount > 0 ? Number((totalMinutes / engagedCount).toFixed(2)) : 0;
};

/**
 * Get highest visa status by alumni count
 * @param {Array} students - Array of student records
 * @returns {Object} Object with visaStatus, count, and label
 */
export const getHighestVisaStatusAlumni = (students) => {
  if (!students || students.length === 0) {
    return { visaStatus: 'N/A', count: 0, label: 'N/A' };
  }

  const visaCounts = {};
  
  students.forEach(student => {
    const visaStatus = (student.visa_status || '').trim();
    if (visaStatus && visaStatus !== '' && visaStatus !== 'visa_status') {
      visaCounts[visaStatus] = (visaCounts[visaStatus] || 0) + 1;
    }
  });

  if (Object.keys(visaCounts).length === 0) {
    return { visaStatus: 'N/A', count: 0, label: 'N/A' };
  }

  // Find the visa status with the highest count
  const entries = Object.entries(visaCounts);
  const highest = entries.reduce((max, [status, count]) => {
    return count > max.count ? { visaStatus: status, count } : max;
  }, { visaStatus: '', count: 0 });

  // Create a readable label
  const labelMap = {
    'F1': 'F1 Visa',
    'GreenCard': 'Green Card',
    'Citizen': 'US Citizen',
    'H1B': 'H1B Visa',
    'OPT': 'OPT',
  };

  return {
    visaStatus: highest.visaStatus,
    count: highest.count,
    label: labelMap[highest.visaStatus] || highest.visaStatus,
  };
};

/**
 * Calculate average feedback score
 * @param {Array} alumniEngagement - Array of engagement records
 * @returns {number} Average feedback score (1-5 scale)
 */
export const calculateAvgFeedbackScore = (alumniEngagement) => {
  if (!alumniEngagement || alumniEngagement.length === 0) return 0;

  const scores = alumniEngagement
    .map(e => parseFloat(e.engagement_score))
    .filter(score => !isNaN(score) && score > 0);

  if (scores.length === 0) return 0;

  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Number((sum / scores.length).toFixed(2));
};

/**
 * Get engagement trend by month
 * Returns array with monthLabel, engagedAlumni (distinct), and totalTouchpoints (row count)
 * @param {Array} alumniEngagement - Array of engagement records
 * @param {Array} dates - Array of date records from dim_date
 * @returns {Array} Array of { monthLabel: string, engagedAlumni: number, totalTouchpoints: number }
 */
export const getEngagementTrendByMonth = (alumniEngagement, dates) => {
  if (!alumniEngagement || !dates || alumniEngagement.length === 0) return [];

  const dateLookup = createLookup(dates, 'date_key');

  const monthlyData = {};

  alumniEngagement.forEach(engagement => {
    const dateKey = String(engagement.event_date_key || engagement.event_date);
    const dateInfo = dateLookup[dateKey];
    
    if (!dateInfo) return;

    const monthKey = `${dateInfo.year || 'Unknown'}-${String(dateInfo.month || '01').padStart(2, '0')}`;
    const monthLabel = dateInfo.month_name 
      ? `${dateInfo.month_name.substring(0, 3)} ${dateInfo.year || ''}`.trim()
      : monthKey;
    const studentId = String(engagement.student_key || engagement.student_id);

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        monthLabel,
        engagedAlumni: new Set(),
        totalTouchpoints: 0
      };
    }

    monthlyData[monthKey].engagedAlumni.add(studentId);
    monthlyData[monthKey].totalTouchpoints += 1;
  });

  return Object.values(monthlyData)
    .map(data => ({
      monthLabel: data.monthLabel,
      engagedAlumni: data.engagedAlumni.size,
      totalTouchpoints: data.totalTouchpoints
    }))
    .sort((a, b) => a.monthLabel.localeCompare(b.monthLabel));
};

/**
 * Get engagement by program/degree
 * Returns top programs by engaged alumni count
 * @param {Array} students - Array of student records
 * @param {Array} alumniEngagement - Array of engagement records
 * @returns {Array} Array of { program: string, engagedAlumni: number }
 */
export const getEngagementByProgram = (students, alumniEngagement) => {
  if (!students || !alumniEngagement || alumniEngagement.length === 0) return [];

  const studentLookup = createLookup(students, 'student_key');

  const programStats = {};

  alumniEngagement.forEach(engagement => {
    const studentId = getStudentId(engagement);
    if (!studentId) return;
    const student = studentLookup[studentId];
    if (!student) return;

    const program = student.program_name || student.major || 'Unknown';
    if (!programStats[program]) {
      programStats[program] = new Set();
    }
    programStats[program].add(studentId);
  });

  return Object.entries(programStats)
    .map(([program, engagedSet]) => ({
      program,
      engagedAlumni: engagedSet.size
    }))
    .sort((a, b) => b.engagedAlumni - a.engagedAlumni)
    .slice(0, 10);
};

/**
 * Get engagement by type
 * Groups by engagement_type field and counts total engagements and engaged alumni
 * @param {Array} alumniEngagement - Array of engagement records
 * @returns {Array} Array of { type: string, totalEngagements: number, engagedAlumni: number }
 */
export const getEngagementByType = (alumniEngagement) => {
  if (!alumniEngagement || alumniEngagement.length === 0) return [];

  const typeStats = {};

  alumniEngagement.forEach(engagement => {
    // Try multiple possible field names for engagement type
    const engagementType = engagement.engagement_type || 
                          engagement.event_type || 
                          (engagement.participated_university_event_flag === '1' ? 'University Event' : 
                           engagement.participated_outside_event_flag === '1' ? 'Outside Event' :
                           engagement.alumni_event_flag === '1' ? 'Alumni Event' : 'Other');
    
    const type = engagementType || 'Other';
    const studentId = String(engagement.student_key || engagement.student_id);

    if (!typeStats[type]) {
      typeStats[type] = {
        totalEngagements: 0,
        engagedAlumni: new Set()
      };
    }

    typeStats[type].totalEngagements += 1;
    typeStats[type].engagedAlumni.add(studentId);
  });

  return Object.entries(typeStats)
    .map(([type, stats]) => ({
      type,
      totalEngagements: stats.totalEngagements,
      engagedAlumni: stats.engagedAlumni.size
    }))
    .sort((a, b) => b.totalEngagements - a.totalEngagements);
};

/**
 * Get engaged alumni by location
 * Groups engaged alumni by their location (state or country)
 * @param {Array} students - Array of student records
 * @param {Array} alumniEngagement - Array of engagement records
 * @returns {Array} Array of { code: string, name: string, engagedCount: number }
 */
export const getEngagedAlumniByLocation = (students, alumniEngagement) => {
  if (!students || !alumniEngagement || alumniEngagement.length === 0) return [];

  const studentLookup = createLookup(students, 'student_key');

  // Get distinct engaged student IDs
  const engagedStudentIds = new Set();
  alumniEngagement.forEach(engagement => {
    const studentId = getStudentId(engagement);
    if (studentId) {
      engagedStudentIds.add(studentId);
    }
  });

  // Group by location (state)
  const locationStats = {};
  engagedStudentIds.forEach(studentId => {
    const student = studentLookup[studentId];
    if (!student) return;

    let code = '';
    let name = '';

    const normalizedCity = normalizeCityName(student.current_city || '');
    if (normalizedCity && CITY_TO_STATE_MAP[normalizedCity]) {
      code = CITY_TO_STATE_MAP[normalizedCity];
      name = STATE_CODE_TO_NAME[code] || code;
    } else {
      const possibleState = (student.state || student.state_code || '').toString().toUpperCase().trim();
      if (possibleState && STATE_CODE_TO_NAME[possibleState]) {
        code = possibleState;
        name = STATE_CODE_TO_NAME[possibleState];
      }
    }

    if (!code) {
      // Skip entries we can't map to a US state
      return;
    }

    if (!locationStats[code]) {
      locationStats[code] = {
        code,
        name,
        engagedAlumni: new Set()
      };
    }
    locationStats[code].engagedAlumni.add(studentId);
  });

  return Object.values(locationStats)
    .map(stats => ({
      code: stats.code,
      name: stats.name,
      engagedCount: stats.engagedAlumni.size
    }))
    .sort((a, b) => b.engagedCount - a.engagedCount);
};

/**
 * Get top engaged alumni
 * Returns top alumni by engagement count with their details
 * @param {Array} students - Array of student records
 * @param {Array} alumniEngagement - Array of engagement records
 * @param {number} limit - Number of top alumni to return (default 10)
 * @returns {Array} Array of { studentId: string, name: string, program: string, engagementCount: number, totalMinutes: number }
 */
export const getTopEngagedAlumni = (students, alumniEngagement, limit = 10) => {
  if (!students || !alumniEngagement || alumniEngagement.length === 0) return [];

  const studentLookup = createLookup(students, 'student_key');

  const alumniStats = {};

  alumniEngagement.forEach(engagement => {
    const studentId = getStudentId(engagement);
    if (!studentId) return;
    const student = studentLookup[studentId];
    if (!student) return;

    if (!alumniStats[studentId]) {
      alumniStats[studentId] = {
        studentId,
        name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown',
        program: student.program_name || student.major || 'Unknown',
        engagementCount: 0,
        totalMinutes: 0
      };
    }

    alumniStats[studentId].engagementCount += 1;
    const hours = parseFloat(engagement.mentorship_hours || 0);
    alumniStats[studentId].totalMinutes += hours * 60;
  });

  return Object.values(alumniStats)
    .sort((a, b) => b.engagementCount - a.engagementCount)
    .slice(0, limit);
};

/**
 * Get engagement by graduation cohort
 * Groups engaged alumni by their graduation year
 * @param {Array} students - Array of student records
 * @param {Array} alumniEngagement - Array of engagement records
 * @returns {Array} Array of { year: string, engagedAlumni: number }
 */
export const getEngagementByGraduationCohort = (students, alumniEngagement) => {
  if (!students || !alumniEngagement || alumniEngagement.length === 0) return [];

  const studentLookup = createLookup(students, 'student_key');

  const cohortStats = {};

  // Get distinct engaged student IDs
  const engagedStudentIds = new Set();
  alumniEngagement.forEach(engagement => {
    const studentId = getStudentId(engagement);
    if (studentId) {
      engagedStudentIds.add(studentId);
    }
  });

  // Group by graduation year
  engagedStudentIds.forEach(studentId => {
    const student = studentLookup[studentId];
    if (!student) return;

    const year = String(student.graduation_year || 'Unknown');
    if (!cohortStats[year]) {
      cohortStats[year] = new Set();
    }
    cohortStats[year].add(studentId);
  });

  return Object.entries(cohortStats)
    .map(([year, engagedSet]) => ({
      year,
      engagedAlumni: engagedSet.size
    }))
    .sort((a, b) => {
      const yearA = parseInt(a.year);
      const yearB = parseInt(b.year);
      if (isNaN(yearA) || isNaN(yearB)) return a.year.localeCompare(b.year);
      return yearA - yearB; // Ascending order
    });
};

/**
 * INSIGHT CALCULATIONS - For insight tiles
 */

/**
 * Get most engaged program
 * @param {Array} students - Array of student records
 * @param {Array} alumniEngagement - Array of engagement records
 * @returns {Object} { program: string, engagedAlumni: number } or null
 */
export const getMostEngagedProgram = (students, alumniEngagement) => {
  const programData = getEngagementByProgram(students, alumniEngagement);
  if (!programData || programData.length === 0) return null;
  return {
    program: programData[0].program,
    engagedAlumni: programData[0].engagedAlumni
  };
};

/**
 * Get top engagement location
 * @param {Array} students - Array of student records
 * @param {Array} alumniEngagement - Array of engagement records
 * @returns {Object} { location: string, engagedAlumni: number } or null
 */
export const getTopEngagementLocation = (students, alumniEngagement) => {
  const locationData = getEngagedAlumniByLocation(students, alumniEngagement);
  if (!locationData || locationData.length === 0) return null;
  
  // Sort by engagedCount descending and get top
  const sorted = [...locationData].sort((a, b) => b.engagedCount - a.engagedCount);
  return {
    location: sorted[0].name || sorted[0].code || 'Unknown',
    engagedAlumni: sorted[0].engagedCount
  };
};

/**
 * Get most active cohort
 * @param {Array} students - Array of student records
 * @param {Array} alumniEngagement - Array of engagement records
 * @returns {Object} { year: string, engagedAlumni: number } or null
 */
export const getMostActiveCohort = (students, alumniEngagement) => {
  const cohortData = getEngagementByGraduationCohort(students, alumniEngagement);
  if (!cohortData || cohortData.length === 0) return null;
  
  // Sort by engagedAlumni descending and get top
  const sorted = [...cohortData].sort((a, b) => b.engagedAlumni - a.engagedAlumni);
  return {
    year: sorted[0].year,
    engagedAlumni: sorted[0].engagedAlumni
  };
};

/**
 * Get most popular engagement type
 * @param {Array} alumniEngagement - Array of engagement records
 * @returns {Object} { type: string, totalEngagements: number } or null
 */
export const getMostPopularEngagementType = (alumniEngagement) => {
  const typeData = getEngagementByType(alumniEngagement);
  if (!typeData || typeData.length === 0) return null;
  
  // Sort by totalEngagements descending and get top
  const sorted = [...typeData].sort((a, b) => b.totalEngagements - a.totalEngagements);
  return {
    type: sorted[0].type,
    totalEngagements: sorted[0].totalEngagements
  };
};

/**
 * EMPLOYER DASHBOARD METRICS
 */

/**
 * Calculate active employers count
 * An employer is considered active if they have at least one:
 * - event participation
 * - hire record
 * - engagement record
 * 
 * @param {Array} employers - Array of employer records
 * @param {Array} alumniEngagement - Array of engagement records
 * @returns {number} Count of active employers
 */
export const calculateActiveEmployers = (employers, alumniEngagement) => {
  if (!employers || !alumniEngagement) return 0;

  const activeEmployerIds = new Set();

  alumniEngagement.forEach(engagement => {
    const employerId = String(engagement.employer_key || engagement.employer_id);
    if (employerId && employerId !== 'undefined') {
      activeEmployerIds.add(employerId);
    }
  });

  return activeEmployerIds.size;
};

/**
 * Calculate average employer rating
 * @param {Array} employers - Array of employer records
 * @returns {number} Average employer rating
 */
export const calculateAvgEmployerRating = (employers) => {
  if (!employers || employers.length === 0) return 0;

  const ratings = employers
    .map(e => parseFloat(e.employer_rating))
    .filter(rating => !isNaN(rating) && rating > 0);

  if (ratings.length === 0) return 0;

  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Number((sum / ratings.length).toFixed(2));
};

/**
 * Calculate hiring conversion rate
 * @param {Array} alumniEngagement - Array of engagement records
 * @returns {Object} { totalOpportunities: number, totalHires: number, conversionRate: number }
 */
export const calculateHiringConversionRate = (alumniEngagement) => {
  if (!alumniEngagement || alumniEngagement.length === 0) {
    return { totalOpportunities: 0, totalHires: 0, conversionRate: 0 };
  }

  // Count opportunities (job offers or applications)
  const opportunities = alumniEngagement.filter(e => {
    const offers = parseFloat(e.job_offers_count || 0);
    const applications = parseFloat(e.applications_submitted || 0);
    return offers > 0 || applications > 0;
  });

  const totalOpportunities = opportunities.length;
  const totalHires = alumniEngagement.filter(e => 
    e.hired_flag === '1' || e.hired_flag === 1
  ).length;

  const conversionRate = totalOpportunities > 0
    ? (totalHires / totalOpportunities) * 100
    : 0;

  return {
    totalOpportunities,
    totalHires,
    conversionRate: Number(conversionRate.toFixed(2))
  };
};

/**
 * Calculate employer engagement score (composite)
 * Score = (eventsCount * 1) + (studentsInteracted * 0.5) + (hires * 2)
 * 
 * @param {Array} employers - Array of employer records
 * @param {Array} alumniEngagement - Array of engagement records
 * @returns {Array} Array of { employerName: string, industry: string, eventsCount: number, studentsInteracted: number, hires: number, engagementScore: number }
 */
export const calculateEmployerEngagementScores = (employers, alumniEngagement) => {
  if (!employers || !alumniEngagement) return [];

  const employerLookup = createLookup(employers, 'employer_key');

  const employerStats = {};

  alumniEngagement.forEach(engagement => {
    const employerId = String(engagement.employer_key || engagement.employer_id);
    const employer = employerLookup[employerId];
    if (!employer) return;

    if (!employerStats[employerId]) {
      employerStats[employerId] = {
        employerId,
        employerName: employer.employer_name || 'Unknown',
        industry: employer.industry || 'Unknown',
        eventIds: new Set(),
        studentIds: new Set(),
        hires: 0
      };
    }

    const eventKey = String(engagement.event_key || engagement.event_id);
    if (eventKey && eventKey !== 'undefined') {
      employerStats[employerId].eventIds.add(eventKey);
    }

    const studentId = String(engagement.student_key || engagement.student_id);
    if (studentId && studentId !== 'undefined') {
      employerStats[employerId].studentIds.add(studentId);
    }

    if (engagement.hired_flag === '1' || engagement.hired_flag === 1) {
      employerStats[employerId].hires += 1;
    }
  });

  return Object.values(employerStats)
    .map(stats => {
      const eventsCount = stats.eventIds.size;
      const studentsInteracted = stats.studentIds.size;
      const hires = stats.hires;
      const engagementScore = (eventsCount * 1) + (studentsInteracted * 0.5) + (hires * 2);

      return {
        employerName: stats.employerName,
        industry: stats.industry,
        eventsCount,
        studentsInteracted,
        hires,
        engagementScore: Number(engagementScore.toFixed(2))
      };
    })
    .sort((a, b) => b.engagementScore - a.engagementScore);
};

/**
 * Calculate employer participation trend
 * @param {Array} alumniEngagement - Array of engagement records
 * @param {Array} dates - Array of date records
 * @returns {Array} Array of { month: string, activeEmployers: number, totalEvents: number }
 */
export const calculateEmployerParticipationTrend = (alumniEngagement, dates) => {
  if (!alumniEngagement || !dates || alumniEngagement.length === 0) return [];

  const dateLookup = createLookup(dates, 'date_key');

  const monthlyData = {};

  alumniEngagement.forEach(engagement => {
    const dateKey = String(engagement.event_date_key || engagement.event_date);
    const dateInfo = dateLookup[dateKey];
    
    if (!dateInfo) return;

    const monthKey = `${dateInfo.year || 'Unknown'}-${String(dateInfo.month || '01').padStart(2, '0')}`;
    const employerId = String(engagement.employer_key || engagement.employer_id);
    const eventKey = String(engagement.event_key || engagement.event_id);

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        activeEmployers: new Set(),
        eventIds: new Set()
      };
    }

    if (employerId && employerId !== 'undefined') {
      monthlyData[monthKey].activeEmployers.add(employerId);
    }
    if (eventKey && eventKey !== 'undefined') {
      monthlyData[monthKey].eventIds.add(eventKey);
    }
  });

  return Object.values(monthlyData)
    .map(data => ({
      month: data.month,
      activeEmployers: data.activeEmployers.size,
      totalEvents: data.eventIds.size
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

/**
 * Calculate industry distribution
 * @param {Array} employers - Array of employer records
 * @param {Array} alumniEngagement - Array of engagement records
 * @returns {Array} Array of { industry: string, count: number, percent: number }
 */
export const calculateIndustryDistribution = (employers, alumniEngagement) => {
  if (!employers || !alumniEngagement) return [];

  const employerLookup = createLookup(employers, 'employer_key');

  const activeEmployerIds = new Set();
  alumniEngagement.forEach(engagement => {
    const employerId = String(engagement.employer_key || engagement.employer_id);
    if (employerId && employerId !== 'undefined') {
      activeEmployerIds.add(employerId);
    }
  });

  const industryCounts = {};

  activeEmployerIds.forEach(employerId => {
    const employer = employerLookup[employerId];
    if (!employer) return;

    const industry = employer.industry || 'Unknown';
    industryCounts[industry] = (industryCounts[industry] || 0) + 1;
  });

  const total = Object.values(industryCounts).reduce((sum, count) => sum + count, 0);

  return Object.entries(industryCounts)
    .map(([industry, count]) => ({
      industry,
      count,
      percent: total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0
    }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Calculate top hiring employers
 * @param {Array} employers - Array of employer records
 * @param {Array} alumniEngagement - Array of engagement records
 * @returns {Array} Array of top 10 employers with { employerName: string, industry: string, totalHires: number, eventsAttended: number, engagementScore: number }
 */
export const calculateTopHiringEmployers = (employers, alumniEngagement) => {
  if (!employers || !alumniEngagement) return [];

  const employerLookup = createLookup(employers, 'employer_key');

  const employerStats = {};

  alumniEngagement.forEach(engagement => {
    const employerId = String(engagement.employer_key || engagement.employer_id);
    const employer = employerLookup[employerId];
    if (!employer) return;

    if (!employerStats[employerId]) {
      employerStats[employerId] = {
        employerName: employer.employer_name || 'Unknown',
        industry: employer.industry || 'Unknown',
        totalHires: 0,
        eventIds: new Set(),
        studentIds: new Set()
      };
    }

    if (engagement.hired_flag === '1' || engagement.hired_flag === 1) {
      employerStats[employerId].totalHires += 1;
    }

    const eventKey = String(engagement.event_key || engagement.event_id);
    if (eventKey && eventKey !== 'undefined') {
      employerStats[employerId].eventIds.add(eventKey);
    }

    const studentId = String(engagement.student_key || engagement.student_id);
    if (studentId && studentId !== 'undefined') {
      employerStats[employerId].studentIds.add(studentId);
    }
  });

  return Object.values(employerStats)
    .map(stats => {
      const eventsAttended = stats.eventIds.size;
      const studentsInteracted = stats.studentIds.size;
      const engagementScore = (eventsAttended * 1) + (studentsInteracted * 0.5) + (stats.totalHires * 2);

      return {
        employerName: stats.employerName,
        industry: stats.industry,
        totalHires: stats.totalHires,
        eventsAttended,
        engagementScore: Number(engagementScore.toFixed(2))
      };
    })
    .sort((a, b) => b.totalHires - a.totalHires)
    .slice(0, 10);
};

/**
 * Calculate job opportunities vs hires per month
 * @param {Array} alumniEngagement - Array of engagement records
 * @param {Array} dates - Array of date records
 * @returns {Array} Array of { month: string, opportunities: number, hires: number }
 */
export const calculateOpportunitiesVsHires = (alumniEngagement, dates) => {
  if (!alumniEngagement || !dates || alumniEngagement.length === 0) return [];

  const dateLookup = createLookup(dates, 'date_key');

  const monthlyData = {};

  alumniEngagement.forEach(engagement => {
    const dateKey = String(engagement.hire_date_key || engagement.event_date_key || engagement.event_date);
    const dateInfo = dateLookup[dateKey];
    
    if (!dateInfo) return;

    const monthKey = `${dateInfo.year || 'Unknown'}-${String(dateInfo.month || '01').padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        opportunities: 0,
        hires: 0
      };
    }

    const offers = parseFloat(engagement.job_offers_count || 0);
    const applications = parseFloat(engagement.applications_submitted || 0);
    if (offers > 0 || applications > 0) {
      monthlyData[monthKey].opportunities += 1;
    }

    if (engagement.hired_flag === '1' || engagement.hired_flag === 1) {
      monthlyData[monthKey].hires += 1;
    }
  });

  return Object.values(monthlyData)
    .map(data => ({
      month: data.month,
      opportunities: data.opportunities,
      hires: data.hires
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

/**
 * Calculate alumni employed per employer
 * @param {Array} alumniEmployment - Array of alumni employment records
 * @param {Array} employers - Array of employer records
 * @returns {Array} Array of { employerName: string, alumniCount: number } sorted by count DESC, top 10
 */
export const calculateAlumniEmployedPerEmployer = (alumniEmployment, employers) => {
  if (!alumniEmployment || !employers || alumniEmployment.length === 0) return [];

  const employerLookup = createLookup(employers, 'employer_key');

  const employerCounts = {};

  alumniEmployment.forEach(employment => {
    // Only count verified employment
    if (employment.status !== 'Verified') return;

    const employerKey = String(employment.employer_key || employment.employer_id);
    const employer = employerLookup[employerKey];
    
    if (!employer) {
      // Fallback to alumni_name if employer lookup fails
      const employerName = employment.employer_name || `Employer ${employerKey}`;
      if (!employerCounts[employerName]) {
        employerCounts[employerName] = { employerName, count: 0 };
      }
      employerCounts[employerName].count += 1;
      return;
    }

    const employerName = employer.employer_name || 'Unknown';
    if (!employerCounts[employerKey]) {
      employerCounts[employerKey] = { employerName, count: 0 };
    }
    employerCounts[employerKey].count += 1;
  });

  return Object.values(employerCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(item => ({
      employerName: item.employerName,
      alumniCount: item.count
    }));
};

/**
 * Get alumni employed at partner organizations
 * @param {Array} alumniEmployment - Array of alumni employment records
 * @returns {number} Distinct count of alumni employed at verified partner organizations
 */
export const getAlumniEmployedAtPartners = (alumniEmployment) => {
  if (!alumniEmployment || alumniEmployment.length === 0) return 0;
  
  const verifiedEmployments = alumniEmployment.filter(emp => emp.status === 'Verified');
  const distinctAlumni = new Set(verifiedEmployments.map(emp => String(emp.student_key || emp.student_id)));
  
  return distinctAlumni.size;
};

/**
 * Get employers with recent feedback (within last 6 months or recent submissions)
 * @param {Array} employerFeedback - Array of employer feedback records
 * @returns {number} Count of distinct employers who have submitted feedback recently
 */
export const getEmployersWithRecentFeedback = (employerFeedback) => {
  if (!employerFeedback || employerFeedback.length === 0) return 0;
  
  // Consider feedback from last 6 months or approved feedback
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentFeedback = employerFeedback.filter(feedback => {
    // Check if approved or recent
    if (feedback.approved_by_admin === '1' || feedback.approved_by_admin === 1) return true;
    
    // Check creation date
    if (feedback.created_at) {
      const createdDate = new Date(feedback.created_at);
      if (!isNaN(createdDate.getTime()) && createdDate >= sixMonthsAgo) return true;
    }
    
    return false;
  });
  
  const distinctEmployers = new Set(recentFeedback.map(f => String(f.employer_key || f.employer_id)));
  return distinctEmployers.size;
};

/**
 * Get engagement scorecard by employer (top N)
 * @param {Array} employerEngagementScores - Array from calculateEmployerEngagementScores
 * @param {number} limit - Number of top employers to return
 * @returns {Array} Top N employers by engagement score
 */
export const getEngagementScorecardByEmployer = (employerEngagementScores, limit = 10) => {
  if (!employerEngagementScores || employerEngagementScores.length === 0) return [];
  
  return employerEngagementScores
    .slice(0, limit)
    .map((emp, index) => ({
      ...emp,
      rank: index + 1
    }));
};

/**
 * Calculate technical strength by graduation year
 * Option A: Average rating per year
 * Option B: Stacked counts by strength level (if data available)
 * 
 * @param {Array} employerFeedback - Array of employer feedback records
 * @returns {Object} { averageRatings: Array, strengthLevels: Array }
 */
export const calculateTechnicalStrengthByYear = (employerFeedback) => {
  if (!employerFeedback || employerFeedback.length === 0) {
    return {
      averageRatings: [],
      strengthLevels: []
    };
  }

  // Option A: Average rating per graduation year
  const yearRatings = {};
  employerFeedback.forEach(feedback => {
    const year = String(feedback.graduation_year);
    const rating = parseFloat(feedback.rating_overall);
    
    if (!year || isNaN(rating) || rating <= 0) return;

    if (!yearRatings[year]) {
      yearRatings[year] = { year, ratings: [], counts: { Strong: 0, Average: 0, 'Needs Improvement': 0 } };
    }
    
    yearRatings[year].ratings.push(rating);
    
    const strengthLevel = feedback.tech_strength_level;
    if (strengthLevel && yearRatings[year].counts.hasOwnProperty(strengthLevel)) {
      yearRatings[year].counts[strengthLevel] += 1;
    }
  });

  // Calculate average ratings
  const averageRatings = Object.values(yearRatings)
    .map(data => ({
      graduationYear: data.year,
      avgRating: data.ratings.length > 0
        ? Number((data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length).toFixed(2))
        : 0
    }))
    .sort((a, b) => a.graduationYear.localeCompare(b.graduationYear));

  // Option B: Stacked counts by strength level
  const strengthLevels = Object.values(yearRatings)
    .map(data => ({
      graduationYear: data.year,
      Strong: data.counts.Strong,
      Average: data.counts.Average,
      'Needs Improvement': data.counts['Needs Improvement']
    }))
    .sort((a, b) => a.graduationYear.localeCompare(b.graduationYear));

  return {
    averageRatings,
    strengthLevels
  };
};

/**
 * Calculate overall hiring funnel (Opportunities → Applications → Hires)
 * @param {Array} alumniEngagement - Array of engagement records
 * @returns {Object} { opportunitiesCount: number, applicationsCount: number, hiresCount: number }
 */
export const calculateHiringFunnel = (alumniEngagement) => {
  if (!alumniEngagement || alumniEngagement.length === 0) {
    return {
      opportunitiesCount: 0,
      applicationsCount: 0,
      hiresCount: 0
    };
  }

  let opportunitiesCount = 0;
  let applicationsCount = 0;
  let hiresCount = 0;

  alumniEngagement.forEach(engagement => {
    const offers = parseFloat(engagement.job_offers_count || 0);
    const applications = parseFloat(engagement.applications_submitted || 0);
    const hired = engagement.hired_flag === '1' || engagement.hired_flag === 1;

    if (offers > 0 || applications > 0) {
      opportunitiesCount += 1;
    }

    if (applications > 0) {
      applicationsCount += applications; // Sum all applications
    }

    if (hired) {
      hiresCount += 1;
    }
  });

  const applicationRate = opportunitiesCount > 0 
    ? Number(((applicationsCount / opportunitiesCount) * 100).toFixed(2))
    : 0;
  
  const hireRate = applicationsCount > 0
    ? Number(((hiresCount / applicationsCount) * 100).toFixed(2))
    : 0;

  return {
    opportunitiesCount,
    applicationsCount,
    hiresCount,
    applicationRate,
    hireRate
  };
};

/**
 * PREDICTIVE INSIGHTS FOR BUILDING EMPLOYER-ALUMNI BONDS
 * 
 * IMPORTANT: ALL calculations use ONLY data from tables (CSV files):
 * - Dim_Students.csv: Student/alumni data
 * - dim_employers.csv: Employer data  
 * - fact_alumni_engagement.csv: Engagement and hiring records
 * - No random numbers, no mock data, no hardcoded values
 */

/**
 * Predict high-potential alumni-employer matches based on program, location, and engagement history
 * Uses ONLY actual data from tables - no random or mock data
 * @param {Array} students - Array of student records from Dim_Students.csv
 * @param {Array} employers - Array of employer records from dim_employers.csv
 * @param {Array} alumniEngagement - Array of engagement records from fact_alumni_engagement.csv
 * @param {number} limit - Maximum number of matches to return
 * @returns {Array} Array of { alumni: object, employer: object, matchScore: number, reasons: Array<string> }
 */
export const predictAlumniEmployerMatches = (students, employers, alumniEngagement, limit = 10) => {
  if (!students || !employers || !alumniEngagement || students.length === 0 || employers.length === 0) return [];

  // Optimize: Pre-calculate employer hiring counts to avoid repeated filtering
  const employerHiresMap = {};
  const engagementMap = {}; // Map of student_key-employer_key pairs for quick lookup
  
  alumniEngagement.forEach(e => {
    const employerKey = String(e.employer_key || '');
    const studentKey = String(e.student_key || '');
    
    // Count hires per employer
    if (e.hired_flag === '1' || e.hired_flag === 1) {
      employerHiresMap[employerKey] = (employerHiresMap[employerKey] || 0) + 1;
    }
    
    // Build engagement map for quick lookup
    if (studentKey && employerKey) {
      const key = `${studentKey}-${employerKey}`;
      engagementMap[key] = true;
    }
  });

  const studentLookup = createLookup(students, 'student_key');
  const employerLookup = createLookup(employers, 'employer_key');
  
  // Optimize: Sample students and employers to avoid O(n*m) complexity
  // Focus on engaged alumni and active employers
  const engagedStudentIds = new Set();
  alumniEngagement.forEach(e => {
    const studentId = String(e.student_key || '');
    if (studentId) engagedStudentIds.add(studentId);
  });
  
  const relevantStudents = students.filter(s => {
    const studentId = String(s.student_key || '');
    return engagedStudentIds.has(studentId);
  }).slice(0, 200); // Limit to first 200 engaged students
  
  const activeEmployers = employers.filter(e => {
    const employerKey = String(e.employer_key || '');
    return employerHiresMap[employerKey] > 0 || Object.keys(employerHiresMap).includes(employerKey);
  }).slice(0, 100); // Limit to first 100 active employers

  // Calculate match scores for potential new connections
  const matches = [];
  
  relevantStudents.forEach(student => {
    if (!student) return;
    
    activeEmployers.forEach(employer => {
      if (!employer) return;
      
      const studentKey = String(student.student_key || '');
      const employerKey = String(employer.employer_key || '');
      
      let matchScore = 0;
      const reasons = [];
      
      // Program-Industry alignment (40% weight)
      const program = (student.program_name || '').toLowerCase();
      const industry = (employer.industry || '').toLowerCase();
      
      if (program.includes('data') && (industry.includes('technology') || industry.includes('consulting'))) {
        matchScore += 40;
        reasons.push('Program aligns with employer industry');
      } else if (program.includes('information') && industry.includes('technology')) {
        matchScore += 40;
        reasons.push('Program aligns with employer industry');
      } else if (program.includes('business') && (industry.includes('finance') || industry.includes('consulting'))) {
        matchScore += 40;
        reasons.push('Program aligns with employer industry');
      }
      
      // Location match (30% weight)
      const studentLocation = (student.current_city || student.current_state || '').toLowerCase();
      const employerLocation = ((employer.hq_city || '') + ' ' + (employer.hq_state || '')).toLowerCase();
      
      if (studentLocation && employerLocation && 
          (studentLocation.includes(employerLocation.split(' ')[0]) || 
           employerLocation.includes(studentLocation.split(' ')[0]))) {
        matchScore += 30;
        reasons.push('Geographic proximity');
      }
      
      // Existing engagement history (20% weight) - use pre-built map
      const engagementKey = `${studentKey}-${employerKey}`;
      if (engagementMap[engagementKey]) {
        matchScore += 20;
        reasons.push('Previous engagement history');
      }
      
      // Employer hiring activity (10% weight) - use pre-calculated map
      const employerHires = employerHiresMap[employerKey] || 0;
      
      if (employerHires > 5) {
        matchScore += 10;
        reasons.push('Active hiring employer');
      }
      
      if (matchScore >= 50) {
        matches.push({
          alumni: {
            name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
            program: student.program_name || 'Unknown',
            location: `${student.current_city || ''}, ${student.current_state || ''}`.trim(),
            graduationYear: student.graduation_year
          },
          employer: {
            name: employer.employer_name || 'Unknown',
            industry: employer.industry || 'Unknown',
            location: `${employer.hq_city || ''}, ${employer.hq_state || ''}`.trim(),
            hires: employerHires
          },
          matchScore,
          reasons
        });
      }
    });
  });
  
  return matches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
};

/**
 * Predict which employers are likely to hire from specific programs
 * Uses ONLY actual data from tables - calculates predictions from historical hiring patterns
 * @param {Array} students - Array of student records from Dim_Students.csv
 * @param {Array} employers - Array of employer records from dim_employers.csv
 * @param {Array} alumniEngagement - Array of engagement records from fact_alumni_engagement.csv
 * @returns {Array} Array of { program: string, employer: object, predictedHires: number, confidence: string }
 */
export const predictProgramEmployerHiring = (students, employers, alumniEngagement) => {
  if (!students || !employers || !alumniEngagement) return [];

  const employerLookup = createLookup(employers, 'employer_key');
  const studentLookup = createLookup(students, 'student_key');
  
  // Group hires by program and employer
  const programEmployerStats = {};
  
  alumniEngagement.forEach(engagement => {
    if (engagement.hired_flag !== '1' && engagement.hired_flag !== 1) return;
    
    const student = studentLookup[String(engagement.student_key)];
    const employer = employerLookup[String(engagement.employer_key)];
    
    if (!student || !employer) return;
    
    const program = student.program_name || 'Unknown';
    const employerKey = String(engagement.employer_key);
    
    if (!programEmployerStats[program]) {
      programEmployerStats[program] = {};
    }
    
    if (!programEmployerStats[program][employerKey]) {
      programEmployerStats[program][employerKey] = {
        employer,
        hires: 0,
        programs: new Set()
      };
    }
    
    programEmployerStats[program][employerKey].hires += 1;
    programEmployerStats[program][employerKey].programs.add(program);
  });
  
  // Generate predictions
  const predictions = [];
  
  // Calculate average quarterly hiring growth rate from historical data
  // Group hires by date to calculate quarterly trends
  const quarterlyTrends = {};
  alumniEngagement.forEach(engagement => {
    if (engagement.hired_flag !== '1' && engagement.hired_flag !== 1) return;
    // Use event_date_key to determine quarter/year
    const dateKey = String(engagement.event_date_key || '');
    if (dateKey) {
      const quarter = Math.floor((parseInt(dateKey) % 10000) / 3) || 1; // Approximate quarter
      const year = Math.floor(parseInt(dateKey) / 10000) || new Date().getFullYear();
      const quarterKey = `${year}-Q${quarter}`;
      
      if (!quarterlyTrends[quarterKey]) {
        quarterlyTrends[quarterKey] = 0;
      }
      quarterlyTrends[quarterKey] += 1;
    }
  });
  
  // Calculate average growth rate from historical quarterly data
  const quarters = Object.keys(quarterlyTrends).sort();
  let avgGrowthRate = 1.0; // Default to no growth if no historical data
  if (quarters.length >= 2) {
    const recentQuarters = quarters.slice(-4); // Last 4 quarters
    if (recentQuarters.length >= 2) {
      const totalHires = recentQuarters.reduce((sum, q) => sum + (quarterlyTrends[q] || 0), 0);
      const avgHiresPerQuarter = totalHires / recentQuarters.length;
      const prevAvg = recentQuarters.slice(0, -1).reduce((sum, q) => sum + (quarterlyTrends[q] || 0), 0) / Math.max(1, recentQuarters.length - 1);
      avgGrowthRate = prevAvg > 0 ? Math.max(1.0, Math.min(1.2, avgHiresPerQuarter / prevAvg)) : 1.0; // Cap at 20% growth
    }
  }
  
  Object.entries(programEmployerStats).forEach(([program, employerData]) => {
    Object.entries(employerData).forEach(([employerKey, stats]) => {
      const historicalHires = stats.hires;
      
      // Calculate prediction based on actual historical data and trends
      // If employer has historical hires, use growth rate; otherwise, use average for similar employers
      let predictedHires = 0;
      
      if (historicalHires > 0) {
        // Calculate prediction based on actual historical average growth
        predictedHires = Math.round(historicalHires * avgGrowthRate);
        // Ensure prediction is at least equal to historical average
        predictedHires = Math.max(historicalHires, predictedHires);
      } else {
        // For new relationships, calculate average hires from similar programs in same industry
        const similarProgramHires = Object.entries(programEmployerStats)
          .filter(([p, empData]) => {
            const studentInProgram = students.find(s => s.program_name === program);
            const studentInSimilar = students.find(s => s.program_name === p);
            return p !== program && studentInProgram && studentInSimilar;
          })
          .flatMap(([p, empData]) => Object.values(empData))
          .map(stats => stats.hires)
          .filter(h => h > 0);
        
        const avgSimilarHires = similarProgramHires.length > 0
          ? Math.round(similarProgramHires.reduce((sum, h) => sum + h, 0) / similarProgramHires.length)
          : 0;
        
        predictedHires = avgSimilarHires > 0 ? Math.round(avgSimilarHires * 0.5) : 0; // Conservative estimate for new relationships
      }
      
      // Only include predictions with actual data or similar program averages
      if (predictedHires > 0) {
        const confidence = historicalHires > 3 ? 'High' : historicalHires > 1 ? 'Medium' : historicalHires > 0 ? 'Low' : 'Low';
        
        predictions.push({
          program,
          employer: {
            name: stats.employer.employer_name || 'Unknown',
            industry: stats.employer.industry || 'Unknown',
            historicalHires
          },
          predictedHires,
          confidence
        });
      }
    });
  });
  
  return predictions
    .sort((a, b) => b.predictedHires - a.predictedHires)
    .slice(0, 20);
};

/**
 * Predict networking opportunities between alumni and employers
 * Uses ONLY actual data from tables - analyzes engagement history and program/industry alignment
 * @param {Array} students - Array of student records from Dim_Students.csv
 * @param {Array} employers - Array of employer records from dim_employers.csv
 * @param {Array} alumniEngagement - Array of engagement records from fact_alumni_engagement.csv
 * @returns {Array} Array of { alumni: object, employer: object, opportunityType: string, score: number }
 */
export const predictNetworkingOpportunities = (students, employers, alumniEngagement) => {
  if (!students || !employers || !alumniEngagement) return [];

  const studentLookup = createLookup(students, 'student_key');
  const employerLookup = createLookup(employers, 'employer_key');
  
  const opportunities = [];
  
  // Find alumni with high engagement who could connect with employers
  const highlyEngagedAlumni = alumniEngagement
    .reduce((acc, e) => {
      const studentId = String(e.student_key);
      if (!acc[studentId]) {
        acc[studentId] = {
          student: studentLookup[studentId],
          engagementCount: 0,
          employers: new Set()
        };
      }
      acc[studentId].engagementCount += 1;
      if (e.employer_key) {
        acc[studentId].employers.add(String(e.employer_key));
      }
      return acc;
    }, {});
  
  Object.values(highlyEngagedAlumni)
    .filter(item => item.student && item.engagementCount >= 3)
    .forEach(item => {
      employers.forEach(employer => {
        const employerKey = String(employer.employer_key);
        
        // Skip if already connected
        if (item.employers.has(employerKey)) return;
        
        const program = (item.student.program_name || '').toLowerCase();
        const industry = (employer.industry || '').toLowerCase();
        
        let score = 0;
        let opportunityType = '';
        
        // Mentorship opportunity
        if (item.engagementCount >= 5 && program.includes('data')) {
          score = 85;
          opportunityType = 'Mentorship';
        }
        // Event participation
        else if (program.includes(industry.split(' ')[0]) || industry.includes(program.split(' ')[0])) {
          score = 75;
          opportunityType = 'Event Participation';
        }
        // Referral opportunity
        else if (item.student.current_city && employer.hq_city && 
                 item.student.current_city.toLowerCase().includes(employer.hq_city.toLowerCase().split(' ')[0])) {
          score = 70;
          opportunityType = 'Referral Network';
        }
        
        if (score > 0) {
          opportunities.push({
            alumni: {
              name: `${item.student.first_name || ''} ${item.student.last_name || ''}`.trim(),
              program: item.student.program_name || 'Unknown',
              engagementScore: item.engagementCount
            },
            employer: {
              name: employer.employer_name || 'Unknown',
              industry: employer.industry || 'Unknown'
            },
            opportunityType,
            score
          });
        }
      });
    });
  
  return opportunities
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);
};

/**
 * Predict partnership strength between employers and SLU based on multiple factors
 * Uses ONLY actual data from tables - calculates scores from hiring, events, and feedback data
 * @param {Array} employers - Array of employer records from dim_employers.csv
 * @param {Array} alumniEngagement - Array of engagement records from fact_alumni_engagement.csv
 * @returns {Array} Array of { employer: object, partnershipScore: number, trend: string, recommendations: Array<string> }
 */
export const predictPartnershipStrength = (employers, alumniEngagement) => {
  if (!employers || !alumniEngagement) return [];

  const employerStats = {};
  
  // Calculate stats per employer
  employers.forEach(employer => {
    const employerKey = String(employer.employer_key);
    const engagements = alumniEngagement.filter(e => String(e.employer_key) === employerKey);
    
    const hires = engagements.filter(e => e.hired_flag === '1' || e.hired_flag === 1).length;
    const events = engagements.filter(e => 
      e.participated_university_event_flag === '1' || 
      e.participated_outside_event_flag === '1'
    ).length;
    const feedback = engagements.filter(e => e.feedback_notes).length;
    
    let partnershipScore = 0;
    const recommendations = [];
    
    // Hiring activity (40% weight)
    if (hires > 10) {
      partnershipScore += 40;
      recommendations.push('Strong hiring partner - consider expanding relationship');
    } else if (hires > 5) {
      partnershipScore += 30;
      recommendations.push('Active hiring partner - maintain engagement');
    } else if (hires > 0) {
      partnershipScore += 20;
      recommendations.push('Emerging partner - increase outreach');
    } else {
      recommendations.push('Potential partner - initiate hiring conversations');
    }
    
    // Event participation (30% weight)
    if (events > 5) {
      partnershipScore += 30;
      recommendations.push('High event participation - leverage for networking');
    } else if (events > 2) {
      partnershipScore += 20;
      recommendations.push('Moderate participation - invite to more events');
    } else if (events > 0) {
      partnershipScore += 10;
      recommendations.push('Low participation - increase event invitations');
    }
    
    // Feedback engagement (20% weight)
    if (feedback > 3) {
      partnershipScore += 20;
      recommendations.push('Engaged in feedback - valuable partnership');
    } else if (feedback > 0) {
      partnershipScore += 10;
      recommendations.push('Some feedback - encourage more input');
    }
    
    // Rating (10% weight)
    const rating = parseFloat(employer.employer_rating || 0);
    if (rating >= 4.5) {
      partnershipScore += 10;
    } else if (rating >= 4.0) {
      partnershipScore += 7;
    } else if (rating >= 3.5) {
      partnershipScore += 5;
    }
    
    const trend = hires > 5 && events > 3 ? 'Strengthening' : 
                  hires > 0 || events > 0 ? 'Stable' : 'Emerging';
    
    employerStats[employerKey] = {
      employer,
      partnershipScore,
      trend,
      recommendations,
      hires,
      events,
      feedback
    };
  });
  
  return Object.values(employerStats)
    .sort((a, b) => b.partnershipScore - a.partnershipScore)
    .slice(0, 15);
};

