import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper functions (same as before)
function getDayOfWeek(date) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function getWeekOfYear(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

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

// Clean and extend date CSV
function cleanAndExtendDateCSV() {
  const publicDir = path.join(__dirname, '..', 'public');
  const csvPath = path.join(publicDir, 'dim_date.csv');
  
  // Read existing data and remove blank lines
  const existingData = fs.readFileSync(csvPath, 'utf-8');
  const lines = existingData.split('\n').filter(line => line.trim() !== '');
  const header = lines[0];
  
  // Find the last valid date
  let lastDateKey = null;
  for (let i = lines.length - 1; i >= 1; i--) {
    if (lines[i].trim()) {
      lastDateKey = lines[i].split(',')[0];
      break;
    }
  }
  
  if (!lastDateKey) {
    console.log('Could not find last date key');
    return;
  }
  
  const lastYear = parseInt(lastDateKey.substring(0, 4));
  const lastMonth = parseInt(lastDateKey.substring(4, 6));
  const lastDay = parseInt(lastDateKey.substring(6, 8));
  const lastDate = new Date(lastYear, lastMonth - 1, lastDay);
  
  // Check if we already have data up to 2025
  if (lastYear >= 2025 && lastMonth === 12 && lastDay === 31) {
    console.log('Date dimension already extends to 2025-12-31');
    // Still clean the file
    const cleanContent = lines.join('\n');
    fs.writeFileSync(csvPath, cleanContent);
    return;
  }
  
  // Generate dates from day after last date to 2025-12-31
  const startDate = new Date(lastDate);
  startDate.setDate(startDate.getDate() + 1);
  const endDate = new Date(2025, 11, 31);
  
  const newDates = generateDateDimension(startDate, endDate);
  
  // Convert to CSV format
  const newLines = newDates.map(d => 
    `${d.date_key},${d.full_date},${d.day_of_month},${d.day_of_week},${d.day_name},${d.week_of_year},${d.month},${d.month_name},${d.quarter},${d.year},${d.is_weekend},${d.fiscal_year},${d.fiscal_quarter},${d.academic_year},${d.academic_term},${d.is_holiday},${d.holiday_name},${d.is_semester_start},${d.is_semester_end},${d.is_current}`
  );
  
  // Rebuild file with clean data
  const cleanContent = lines.slice(0, -1).join('\n') + '\n' + newLines.join('\n');
  fs.writeFileSync(csvPath, cleanContent);
  
  console.log(`Extended dim_date.csv: Added ${newDates.length} dates from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
}

// Extend events for 2023-2025
function extendEvents() {
  const publicDir = path.join(__dirname, '..', 'public');
  const csvPath = path.join(publicDir, 'dim_event.csv');
  
  const existingData = fs.readFileSync(csvPath, 'utf-8');
  const lines = existingData.trim().split('\n').filter(line => line.trim() !== '');
  const header = lines[0];
  
  const existingRecords = lines.slice(1);
  const maxEventKey = Math.max(...existingRecords.map(line => parseInt(line.split(',')[0])));
  
  // Read date dimension to get dates for 2023-2025
  const datePath = path.join(publicDir, 'dim_date.csv');
  const dateData = fs.readFileSync(datePath, 'utf-8');
  const dateLines = dateData.trim().split('\n').filter(line => line.trim() !== '').slice(1);
  const dates2023_2025 = dateLines
    .map(line => {
      const cols = line.split(',');
      return { date_key: cols[0], year: parseInt(cols[9]), month: parseInt(cols[6]), day: parseInt(cols[2]) };
    })
    .filter(d => d.year >= 2023 && d.year <= 2025);
  
  const eventTypes = ['University', 'Alumni', 'Outside'];
  const eventSubtypes = ['Workshop', 'Hackathon', 'Info Session', 'Panel', 'Networking', 'Career Fair'];
  const themes = ['AI', 'Healthcare', 'Cybersecurity', 'Data', 'ML', 'Cloud Computing'];
  const departments = ['MIS', 'Analytics', 'Cyber', 'Career Services', 'Engineering'];
  const locations = ['St. Louis', 'Chicago', 'New York', 'San Francisco', 'Austin'];
  const states = ['MO', 'IL', 'NY', 'CA', 'TX'];
  const locationTypes = ['OnCampus', 'OffCampus', 'Virtual', 'Hybrid'];
  const venues = ['Busch Student Center', 'T-REX', 'Cortex', 'Online Zoom', 'Virtual Event'];
  
  const newEvents = [];
  let eventKey = maxEventKey + 1;
  const eventsPerYear = 50;
  
  for (let year = 2023; year <= 2025; year++) {
    const yearDates = dates2023_2025.filter(d => d.year === year);
    
    for (let i = 0; i < eventsPerYear; i++) {
      const date = yearDates[Math.floor(Math.random() * yearDates.length)];
      const eventCode = `EVT${String(eventKey).padStart(4, '0')}`;
      const eventName = `Event ${eventKey}`;
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const eventSubtype = eventSubtypes[Math.floor(Math.random() * eventSubtypes.length)];
      const organizerName = Math.random() > 0.5 ? 'Saint Louis University' : `Company ${Math.floor(Math.random() * 10) + 1}`;
      const organizerType = Math.random() > 0.6 ? 'SLU' : (Math.random() > 0.5 ? 'AlumniOrg' : 'Other');
      const locationType = locationTypes[Math.floor(Math.random() * locationTypes.length)];
      const venue = venues[Math.floor(Math.random() * venues.length)];
      const city = locations[Math.floor(Math.random() * locations.length)];
      const state = states[Math.floor(Math.random() * states.length)];
      const country = 'USA';
      const startDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
      const endDateObj = new Date(date.year, date.month - 1, date.day);
      endDateObj.setDate(endDateObj.getDate() + Math.floor(Math.random() * 3) + 1);
      const endDate = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`;
      const registrationRequired = Math.random() > 0.5 ? 1 : 0;
      const capacity = (Math.floor(Math.random() * 400) + 100) * 10;
      const theme = themes[Math.floor(Math.random() * themes.length)];
      const department = departments[Math.floor(Math.random() * departments.length)];
      const isRecurring = Math.random() > 0.8 ? 1 : 0;
      const createdAt = '2025-11-07 07:53:56';
      
      newEvents.push(
        `${eventKey},${eventCode},"${eventName}",${eventType},${eventSubtype},"${organizerName}",${organizerType},${locationType},"${venue}","${city}",${state},${country},${startDate},${endDate},${registrationRequired},${capacity},${theme},${department},${isRecurring},"${createdAt}"`
      );
      
      eventKey++;
    }
  }
  
  const newContent = existingData.trim() + '\n' + newEvents.join('\n');
  fs.writeFileSync(csvPath, newContent);
  
  console.log(`Extended dim_event.csv: Added ${newEvents.length} events for 2023-2025`);
}

// Main execution
console.log('Extending all data from 2022 to 2025...\n');
cleanAndExtendDateCSV();
extendEvents();
console.log('\nAll data extension complete!');
