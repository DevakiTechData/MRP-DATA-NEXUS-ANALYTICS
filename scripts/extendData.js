import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to get day of week (1=Monday, 7=Sunday)
function getDayOfWeek(date) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

// Helper function to get week of year
function getWeekOfYear(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Helper function to get academic year and term
function getAcademicYearTerm(date) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  if (month >= 1 && month <= 5) {
    return {
      academicYear: `${year - 1}-${year}`,
      academicTerm: 'Spring'
    };
  } else if (month >= 6 && month <= 8) {
    return {
      academicYear: `${year - 1}-${year}`,
      academicTerm: 'Summer'
    };
  } else {
    return {
      academicYear: `${year}-${year + 1}`,
      academicTerm: 'Fall'
    };
  }
}

// Generate date dimension data
function generateDateDimension(startDate, endDate) {
  const dates = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const holidays = {
    '01-01': 'NewYear',
    '07-04': 'IndependenceDay',
    '12-25': 'Christmas',
    '11-26': 'Thanksgiving'
  };
  
  while (currentDate <= end) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    const dateKey = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
    const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = getDayOfWeek(currentDate);
    const isWeekend = dayOfWeek >= 6 ? 1 : 0;
    const quarter = Math.ceil(month / 3);
    const fiscalYear = month >= 10 ? year + 1 : year;
    const fiscalQuarter = month >= 10 ? Math.ceil((month - 9) / 3) : Math.ceil((month + 3) / 3);
    
    const { academicYear, academicTerm } = getAcademicYearTerm(currentDate);
    
    const monthDay = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isHoliday = holidays[monthDay] ? 1 : 0;
    const holidayName = holidays[monthDay] || '';
    
    // Semester start/end logic (approximate)
    const isSemesterStart = (month === 1 && day === 15) || (month === 8 && day === 15) || (month === 5 && day === 15) ? 1 : 0;
    const isSemesterEnd = (month === 5 && day === 15) || (month === 12 && day === 15) || (month === 8 && day === 15) ? 1 : 0;
    const isCurrent = 0;
    
    dates.push({
      date_key: dateKey,
      full_date: fullDate,
      day_of_month: day,
      day_of_week: dayOfWeek,
      day_name: dayNames[dayOfWeek - 1],
      week_of_year: getWeekOfYear(currentDate),
      month: month,
      month_name: monthNames[month - 1],
      quarter: quarter,
      year: year,
      is_weekend: isWeekend,
      fiscal_year: fiscalYear,
      fiscal_quarter: fiscalQuarter,
      academic_year: academicYear,
      academic_term: academicTerm,
      is_holiday: isHoliday,
      holiday_name: holidayName,
      is_semester_start: isSemesterStart,
      is_semester_end: isSemesterEnd,
      is_current: isCurrent
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

// Read existing CSV and extend it
function extendDateCSV() {
  const publicDir = path.join(__dirname, '..', 'public');
  const csvPath = path.join(publicDir, 'dim_date.csv');
  
  // Read existing data
  const existingData = fs.readFileSync(csvPath, 'utf-8');
  const lines = existingData.trim().split('\n');
  const header = lines[0];
  
  // Find the last date
  const lastLine = lines[lines.length - 1];
  const lastDateKey = lastLine.split(',')[0];
  const lastYear = parseInt(lastDateKey.substring(0, 4));
  const lastMonth = parseInt(lastDateKey.substring(4, 6));
  const lastDay = parseInt(lastDateKey.substring(6, 8));
  const lastDate = new Date(lastYear, lastMonth - 1, lastDay);
  
  // Generate dates from day after last date to 2025-12-31
  const startDate = new Date(lastDate);
  startDate.setDate(startDate.getDate() + 1);
  const endDate = new Date(2025, 11, 31); // December 31, 2025
  
  const newDates = generateDateDimension(startDate, endDate);
  
  // Convert to CSV format
  const newLines = newDates.map(d => 
    `${d.date_key},${d.full_date},${d.day_of_month},${d.day_of_week},${d.day_name},${d.week_of_year},${d.month},${d.month_name},${d.quarter},${d.year},${d.is_weekend},${d.fiscal_year},${d.fiscal_quarter},${d.academic_year},${d.academic_term},${d.is_holiday},${d.holiday_name},${d.is_semester_start},${d.is_semester_end},${d.is_current}`
  );
  
  // Append to existing file
  const newContent = existingData + '\n' + newLines.join('\n');
  fs.writeFileSync(csvPath, newContent);
  
  console.log(`Extended dim_date.csv: Added ${newDates.length} dates from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
}

// Extend fact_alumni_engagement with data for 2023-2025
function extendAlumniEngagement() {
  const publicDir = path.join(__dirname, '..', 'public');
  const csvPath = path.join(publicDir, 'fact_alumni_engagement.csv');
  
  // Read existing data
  const existingData = fs.readFileSync(csvPath, 'utf-8');
  const lines = existingData.trim().split('\n');
  const header = lines[0];
  
  // Get existing data to understand patterns
  const existingRecords = lines.slice(1).map(line => {
    const cols = line.split(',');
    return {
      fact_id: parseInt(cols[0]),
      student_key: cols[1],
      employer_key: cols[2],
      contact_key: cols[3],
      event_key: cols[4],
      event_date_key: cols[5],
      hire_date_key: cols[6]
    };
  });
  
  const maxFactId = Math.max(...existingRecords.map(r => r.fact_id));
  const maxStudentKey = Math.max(...existingRecords.map(r => parseInt(r.student_key)));
  const maxEmployerKey = Math.max(...existingRecords.map(r => parseInt(r.employer_key)));
  const maxContactKey = Math.max(...existingRecords.map(r => parseInt(r.contact_key)));
  const maxEventKey = Math.max(...existingRecords.map(r => parseInt(r.event_key)));
  
  // Read date dimension to get dates for 2023-2025
  const datePath = path.join(publicDir, 'dim_date.csv');
  const dateData = fs.readFileSync(datePath, 'utf-8');
  const dateLines = dateData.trim().split('\n').slice(1);
  const dates2023_2025 = dateLines
    .map(line => {
      const cols = line.split(',');
      return { date_key: cols[0], year: parseInt(cols[9]) };
    })
    .filter(d => d.year >= 2023 && d.year <= 2025)
    .map(d => d.date_key);
  
  // Generate new records
  const newRecords = [];
  let factId = maxFactId + 1;
  const recordsPerYear = 300; // Generate ~300 records per year
  
  for (let year = 2023; year <= 2025; year++) {
    const yearDates = dates2023_2025.filter(d => d.startsWith(year.toString()));
    
    for (let i = 0; i < recordsPerYear; i++) {
      const studentKey = Math.floor(Math.random() * maxStudentKey) + 1;
      const employerKey = Math.floor(Math.random() * maxEmployerKey) + 1;
      const contactKey = Math.floor(Math.random() * maxContactKey) + 1;
      const eventKey = Math.floor(Math.random() * maxEventKey) + 1;
      const eventDateKey = yearDates[Math.floor(Math.random() * yearDates.length)];
      const hireDateKey = yearDates[Math.floor(Math.random() * yearDates.length)];
      
      const alumniEmployeeId = `EMP-${String(employerKey).padStart(5, '0')}-${String(studentKey).padStart(5, '0')}`;
      const participatedUniversity = Math.random() > 0.7 ? 1 : 0;
      const participatedOutside = Math.random() > 0.6 ? 1 : 0;
      const alumniEvent = Math.random() > 0.8 ? 1 : 0;
      const applications = Math.floor(Math.random() * 5) + 1;
      const interviews = Math.floor(Math.random() * 4);
      const jobOffers = Math.floor(Math.random() * 3);
      const hired = jobOffers > 0 && Math.random() > 0.4 ? 1 : 0;
      const donationsAmount = (Math.random() * 3 + 7).toFixed(2); // 7-10 range
      const mentorshipHours = (Math.random() * 4).toFixed(1);
      const referrals = Math.floor(Math.random() * 3);
      const engagementScore = (Math.random() * 2 + 1.5).toFixed(2); // 1.5-3.5 range
      
      const jobRoles = ['Data Analyst', 'Data Engineer', 'AI Engineer', 'ML Engineer', 'Software Engineer', 'Data Scientist', 'Business Analyst'];
      const jobRole = jobRoles[Math.floor(Math.random() * jobRoles.length)];
      
      newRecords.push(
        `${factId},${studentKey},${employerKey},${contactKey},${eventKey},${eventDateKey},${hireDateKey},${alumniEmployeeId},${participatedUniversity},${participatedOutside},${alumniEvent},${applications},${interviews},${jobOffers},${hired},${donationsAmount},${mentorshipHours},${referrals},${engagementScore},"${jobRole}"`
      );
      
      factId++;
    }
  }
  
  // Append to existing file
  const newContent = existingData + '\n' + newRecords.join('\n');
  fs.writeFileSync(csvPath, newContent);
  
  console.log(`Extended fact_alumni_engagement.csv: Added ${newRecords.length} records for 2023-2025`);
}

// Main execution
console.log('Extending data from 2022 to 2025...\n');
extendDateCSV();
extendAlumniEngagement();
console.log('\nData extension complete!');
