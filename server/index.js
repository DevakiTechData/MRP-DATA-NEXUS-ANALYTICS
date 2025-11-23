import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

// Default to 5002 to avoid conflicts with macOS Control Center (uses 5000/5001).
const PORT = process.env.PORT || 5002;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-to-a-secure-random-string';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '2h';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CSV_ROOT = path.join(PROJECT_ROOT, 'public');
const CSV_PATH = path.join(DATA_DIR, 'event_inquiries.csv');
const CONNECT_CSV_PATH = path.join(DATA_DIR, 'connect_requests.csv');

const HEADER_CONFIG = [
  { key: 'submittedAt', heading: 'Submitted At' },
  { key: 'firstName', heading: 'First Name' },
  { key: 'lastName', heading: 'Last Name' },
  { key: 'email', heading: 'Email' },
  { key: 'phone', heading: 'Phone Number' },
  { key: 'audienceType', heading: 'Audience Type' },
  { key: 'companyName', heading: 'Company Name' },
  { key: 'studentId', heading: 'Student ID' },
  { key: 'currentCompany', heading: 'Current Company' },
  { key: 'relationshipInterest', heading: 'Relationship Interest' },
  { key: 'applicationsSubmitted', heading: 'Applications Submitted' },
  { key: 'upcomingEventId', heading: 'Upcoming Event' },
  { key: 'notes', heading: 'Notes' },
];

const ensureDataDirectory = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

// Initialize connect_requests.csv if it doesn't exist
const initializeConnectCSV = () => {
  ensureDataDirectory();
  if (!fs.existsSync(CONNECT_CSV_PATH)) {
    const header = 'submittedAt,name,email,role,organization,subject,message\n';
    fs.writeFileSync(CONNECT_CSV_PATH, header, 'utf8');
  }
};

const CSV_COLUMNS = HEADER_CONFIG.map((col) => col.key);

const loadExistingRows = () => {
  if (!fs.existsSync(CSV_PATH)) {
    return [];
  }

  const fileContents = fs.readFileSync(CSV_PATH, 'utf8');
  const parsed = Papa.parse(fileContents, { header: true, skipEmptyLines: true });

  if (parsed.errors.length > 0) {
    const errorMessages = parsed.errors.map((error) => error.message).join('; ');
    throw new Error(`Failed to parse inquiries CSV: ${errorMessages}`);
  }

  return parsed.data.map((row) => {
    const normalized = {};
    CSV_COLUMNS.forEach((column) => {
      normalized[column] = row[column] ?? '';
    });
    return normalized;
  });
};

const writeRowsToCsv = (rows) => {
  const csv = Papa.unparse(rows, {
    columns: CSV_COLUMNS,
    header: true,
    skipEmptyLines: true,
  });

  fs.writeFileSync(CSV_PATH, `${csv}\n`, 'utf8');
};

const appendInquiryToCsv = (inquiry) => {
  ensureDataDirectory();
  const rows = loadExistingRows();
  rows.push(inquiry);
  writeRowsToCsv(rows);
};

const ADMIN_TABLES = {
  students: {
    label: 'Students',
    description: 'Core student roster and program details.',
    filePath: path.join(CSV_ROOT, 'Dim_Students.csv'),
    primaryKey: 'student_key',
  },
  employers: {
    label: 'Employers',
    description: 'Employer directory with industry and location details.',
    filePath: path.join(CSV_ROOT, 'dim_employers.csv'),
    primaryKey: 'employer_key',
  },
  contacts: {
    label: 'Contacts',
    description: 'Primary employer contacts engaged with SLU.',
    filePath: path.join(CSV_ROOT, 'dim_contact.csv'),
    primaryKey: 'contact_key',
  },
  events: {
    label: 'Events',
    description: 'Engagement events and experiential opportunities.',
    filePath: path.join(CSV_ROOT, 'dim_event.csv'),
    primaryKey: 'event_key',
  },
  dates: {
    label: 'Dates',
    description: 'Date dimension used for analytics across dashboards.',
    filePath: path.join(CSV_ROOT, 'dim_date.csv'),
    primaryKey: 'date_key',
  },
  alumniEngagement: {
    label: 'Alumni Engagement Facts',
    description: 'Fact table tracking alumni interactions and hiring outcomes.',
    filePath: path.join(CSV_ROOT, 'fact_alumni_engagement.csv'),
    primaryKey: 'fact_id',
  },
};

const createImageCategory = (relativePath, label, description) => ({
  label,
  description,
  relativePath,
  absolutePath: path.join(CSV_ROOT, relativePath),
  publicPath: `/${relativePath.replace(/\\/g, '/')}`,
});

const IMAGE_CATEGORIES = {
  events: createImageCategory(
    path.join('assets', 'events'),
    'Events',
    'Images from SLU events, career fairs, networking events, and professional gatherings.',
  ),
  engagement: createImageCategory(
    path.join('assets', 'engagement'),
    'Engagements',
    'Images of alumni engagement activities, mentorship sessions, and community interactions.',
  ),
  alumni: createImageCategory(
    path.join('assets', 'alumni'),
    'Alumni',
    'Images of SLU alumni, student spotlights, and alumni profiles.',
  ),
  employers: createImageCategory(
    path.join('assets', 'employers'),
    'Employers',
    'Employer logos, company photos, and corporate partner imagery.',
  ),
  'success-stories': createImageCategory(
    path.join('assets', 'success-stories'),
    'Success Stories',
    'Images related to alumni success stories, career achievements, and testimonials.',
  ),
  'employer-feedback': createImageCategory(
    path.join('assets', 'employer-feedback'),
    'Employer Feedback',
    'Images showcasing alumni work, achievements, or team collaboration submitted by employers.',
  ),
};

const ensureImageDirectories = () => {
  Object.values(IMAGE_CATEGORIES).forEach((category) => {
    if (!fs.existsSync(category.absolutePath)) {
      fs.mkdirSync(category.absolutePath, { recursive: true });
    }
  });
};

ensureImageDirectories();
initializeConnectCSV();

const getTableConfig = (tableId) => {
  const config = ADMIN_TABLES[tableId];
  if (!config) {
    const error = new Error(`Table "${tableId}" not found.`);
    error.status = 404;
    throw error;
  }
  if (!fs.existsSync(config.filePath)) {
    const error = new Error(`Source file for "${tableId}" does not exist.`);
    error.status = 404;
    throw error;
  }
  return config;
};

const loadTableData = (tableId) => {
  const config = getTableConfig(tableId);
  const csvString = fs.readFileSync(config.filePath, 'utf-8');
  const parsed = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    transform: (value) => (value ?? '').toString(),
  });

  const columns = parsed.meta.fields || [];
  const rows = parsed.data.map((row) => {
    const normalized = {};
    columns.forEach((column) => {
      normalized[column] = row[column] ?? '';
    });
    return normalized;
  });

  return {
    config,
    columns,
    rows,
  };
};

const writeTableData = (tableId, columns, rows) => {
  const config = getTableConfig(tableId);
  const csv = Papa.unparse(rows, { columns });
  fs.writeFileSync(config.filePath, csv, 'utf-8');
};

const sanitizeRecord = (columns, record) => {
  const sanitized = {};
  columns.forEach((column) => {
    const value = record[column];
    sanitized[column] =
      value === undefined || value === null ? '' : value.toString().trim();
  });
  return sanitized;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const stripQuotes = (value) => {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/^"|"$/g, '');
};

const assistantCache = {};

const parseCsvClean = (filePath) => {
  const csvString = fs.readFileSync(filePath, 'utf-8');
  const parsed = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data.map((row) => {
    const clean = {};
    Object.entries(row).forEach(([key, value]) => {
      const cleanKey = stripQuotes(key);
      clean[cleanKey] = stripQuotes(value);
    });
    return clean;
  });
};

const loadAssistantTable = (tableId) => {
  if (!assistantCache[tableId]) {
    const config = ADMIN_TABLES[tableId];
    if (!config) throw new Error(`Assistant table ${tableId} not found`);
    assistantCache[tableId] = parseCsvClean(config.filePath);
  }
  return assistantCache[tableId];
};

const titleCase = (text = '') =>
  text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const buildProgramStatsResponse = (programTerm, role) => {
  const students = loadAssistantTable('students');
  const engagements = loadAssistantTable('alumniEngagement');

  const term = programTerm.toLowerCase();
  const matchedStudents = students.filter((student) =>
    (student.program_name || '').toLowerCase().includes(term),
  );
  const matchedStudentKeys = new Set(matchedStudents.map((student) => stripQuotes(student.student_key)));

  const engaged = new Set();
  engagements.forEach((row) => {
    const studentKey = stripQuotes(row.student_key);
    if (matchedStudentKeys.has(studentKey) && Number(row.engagement_score || 0) > 0) {
      engaged.add(studentKey);
    }
  });

  const total = matchedStudents.length;
  const engagedCount = engaged.size;

  if (total === 0) {
    return {
      message: `I couldn't find alumni records for ${programTerm}. Try another program or check the latest roster upload.`,
    };
  }

  const base = `We track ${total} alumni in ${titleCase(programTerm)} with ${engagedCount} showing active engagement recently.`;

  if (role === 'admin') {
    const sample = matchedStudents
      .slice(0, 5)
      .map((student) => `${student.first_name} ${student.last_name} (${student.graduation_year})`)
      .join(', ');
    return {
      message: `${base}\nSample alumni: ${sample}.`,
    };
  }

  return { message: `${base}\nAsk an administrator for named lists if you need direct outreach.` };
};

const buildRoleLocationEmployerResponse = ({ jobTerm, locationTerm, employerTerm, role }) => {
  const engagements = loadAssistantTable('alumniEngagement');
  const students = loadAssistantTable('students');
  const employers = loadAssistantTable('employers');

  const employersByKey = new Map(
    employers.map((employer) => [stripQuotes(employer.employer_key), employer]),
  );
  const studentsByKey = new Map(
    students.map((student) => [stripQuotes(student.student_key), student]),
  );

  const jobLower = jobTerm.toLowerCase();
  const locationLower = locationTerm.toLowerCase();
  const employerLower = employerTerm.toLowerCase();

  const matches = engagements.filter((engagement) => {
    const employer = employersByKey.get(stripQuotes(engagement.employer_key));
    if (!employer) return false;

    const jobMatch = (engagement.job_role || '').toLowerCase().includes(jobLower);
    const employerMatch = (employer.employer_name || '').toLowerCase().includes(employerLower);
    const locationMatches =
      (employer.hq_state || '').toLowerCase().includes(locationLower) ||
      (employer.hq_city || '').toLowerCase().includes(locationLower);

    return jobMatch && employerMatch && locationMatches;
  });

  if (matches.length === 0) {
    return {
      message: `No alumni matched ${jobTerm} at ${employerTerm} in ${locationTerm}. Try broadening the role or location filters.`,
    };
  }

  const studentEntries = matches
    .map((match) => studentsByKey.get(stripQuotes(match.student_key)))
    .filter(Boolean);

  if (role !== 'admin') {
    return {
      message: `Found ${studentEntries.length} alumni matching ${jobTerm} at ${employerTerm} in ${locationTerm}. Contact an administrator for individual details.`,
    };
  }

  const list = studentEntries
    .slice(0, 5)
    .map((student) => `${student.first_name} ${student.last_name} (${student.graduation_year}, ${student.program_name})`)
    .join('\n• ');

  return {
    message: `Found ${studentEntries.length} alumni in ${titleCase(locationTerm)} at ${employerTerm}.\n• ${list}`,
  };
};

const buildEmployerPatternResponse = (role) => {
  const employers = loadAssistantTable('employers');
  const engagements = loadAssistantTable('alumniEngagement');
  const students = loadAssistantTable('students');

  const amazonEmployers = employers.filter((employer) =>
    (employer.employer_name || '').toLowerCase().includes('amazon'),
  );

  const employersByKey = new Map(
    employers.map((employer) => [stripQuotes(employer.employer_key), employer]),
  );
  const studentsByKey = new Map(
    students.map((student) => [stripQuotes(student.student_key), student]),
  );

  const targetEmployers = amazonEmployers.length > 0 ? amazonEmployers : employers.filter((employer) => (employer.sector || '').toLowerCase().includes('technology'));

  const targetKeys = new Set(targetEmployers.map((employer) => stripQuotes(employer.employer_key)));

  const relevantEngagements = engagements.filter((engagement) =>
    targetKeys.has(stripQuotes(engagement.employer_key)),
  );

  if (relevantEngagements.length === 0) {
    return {
      message: 'No matching hiring pattern found for Amazon. Train the model with the latest employer engagement data or upload Amazon-specific cohorts.',
    };
  }

  const studentScores = new Map();
  relevantEngagements.forEach((engagement) => {
    const studentKey = stripQuotes(engagement.student_key);
    const currentScore = studentScores.get(studentKey) || 0;
    studentScores.set(studentKey, currentScore + Number(engagement.engagement_score || 0));
  });

  const rankedStudents = Array.from(studentScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, role === 'admin' ? 5 : 3)
    .map(([studentKey, score]) => {
      const student = studentsByKey.get(studentKey);
      if (!student) return null;
      return {
        name: `${student.first_name} ${student.last_name}`,
        program: student.program_name,
        graduation: student.graduation_year,
        confidence: Math.min(0.95, 0.7 + score / 20),
      };
    })
    .filter(Boolean);

  if (rankedStudents.length === 0) {
    return {
      message: 'No students matched the Amazon hiring pattern. Encourage cloud-focused cohorts to boost alignment.',
    };
  }

  const list = rankedStudents
    .map(
      (student) =>
        `${student.name} – ${student.program} (${student.graduation}) • ${(student.confidence * 100).toFixed(0)}% alignment`,
    )
    .join('\n');

  return {
    message: `Based on recent tech-sector hires, these students align with Amazon's pattern:\n${list}\n\nRecommendation: invite them to the Amazon interview prep track and emphasize AWS/data engineering skills.`,
  };
};

const buildFallbackResponse = () => ({
  message:
    "I'm still learning that query. Try asking about alumni counts, employer trends, or predictive outlook data—or email insights@datanexus.ai for a detailed report.",
});

const buildAssistantResponse = (question, role) => {
  const lower = question.toLowerCase();

  if (lower.includes('full stack') && lower.includes('california') && lower.includes('mckinsey')) {
    return buildRoleLocationEmployerResponse({ jobTerm: 'Full Stack', locationTerm: 'California', employerTerm: 'McKinsey', role });
  }

  if (lower.includes('data analytics') && lower.includes('alumni')) {
    return buildProgramStatsResponse('Data Analytics', role);
  }

  if (lower.includes('predict') && lower.includes('amazon')) {
    return buildEmployerPatternResponse(role);
  }

  return buildFallbackResponse();
};

const getImageCategory = (categoryId) => {
  const category = IMAGE_CATEGORIES[categoryId];
  if (!category) {
    const error = new Error(`Image category "${categoryId}" not found.`);
    error.status = 404;
    throw error;
  }
  return category;
};

const listImageFiles = (categoryId) => {
  const category = getImageCategory(categoryId);
  if (!fs.existsSync(category.absolutePath)) {
    return [];
  }

  const entries = fs.readdirSync(category.absolutePath);
  const files = entries.filter((name) => {
    // Filter out hidden files (starting with .)
    if (name.startsWith('.')) {
      return false;
    }
    
    // Filter out directories - only return actual files
    const entryPath = path.join(category.absolutePath, name);
    try {
      const stats = fs.statSync(entryPath);
      return stats.isFile();
    } catch (error) {
      // If we can't stat the entry, skip it
      console.warn(`Skipping entry "${name}": ${error.message}`);
      return false;
    }
  });

  return files.map((filename) => {
    const filePath = path.join(category.absolutePath, filename);
    const stats = fs.statSync(filePath);
    return {
      filename,
      size: stats.size,
      updatedAt: stats.mtime.toISOString(),
      url: `${category.publicPath}/${encodeURIComponent(filename)}`,
    };
  });
};

// Load users from JSON file
const loadUsers = () => {
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  try {
    const fileContents = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Failed to load users', error);
    return [];
  }
};

// JWT authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
};

const app = express();

// CORS configuration - allow all origins (including Codespaces)
// Handle preflight OPTIONS requests explicitly
app.options('*', cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Apply CORS to all routes
app.use(cors({
  origin: true, // Allow all origins (including Codespaces subdomains)
  credentials: true, // Allow credentials (cookies, authorization headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Authentication endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body ?? {};

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const users = loadUsers();
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // For employer role, try to find employer_key from employers table
    let employer_key = null;
    if (user.role === 'employer') {
      try {
        const { rows: employers } = loadTableData('employers');
        if (employers && employers.length > 0) {
          // Try to match by username, employer_code, or use first employer as default for demo
          const employer = employers.find(emp => 
            emp.employer_code?.toLowerCase() === username.toLowerCase() ||
            emp.employer_name?.toLowerCase().includes(username.toLowerCase()) ||
            String(emp.employer_key) === username
          ) || employers[0]; // Default to first employer for demo
          employer_key = employer?.employer_key;
          console.log(`Employer login: username=${username}, found employer_key=${employer_key}, employer_name=${employer?.employer_name}`);
        } else {
          console.warn('No employers found in database');
        }
      } catch (error) {
        console.warn('Could not load employer key for employer user:', error);
      }
    }

    // For alumni role, try to find student_key
    let student_key = null;
    if (user.role === 'alumni') {
      try {
        const { rows: students } = loadTableData('students');
        console.log(`Alumni login: username=${username}, searching for student_key`);
        const student = students.find(s => 
          s.student_slu_id?.toLowerCase() === username.toLowerCase() ||
          s.email?.toLowerCase() === username.toLowerCase() ||
          (s.first_name && s.last_name && `${s.first_name} ${s.last_name}`.toLowerCase() === username.toLowerCase())
        ) || students[0]; // Default to first student for demo
        student_key = student?.student_key;
        console.log(`Alumni login: found student_key=${student_key} for username=${username}, student=${student?.first_name} ${student?.last_name}, email=${student?.email}`);
      } catch (error) {
        console.warn('Could not load student key for alumni user:', error);
      }
    }

    const tokenPayload = { 
      username: user.username, 
      role: user.role 
    };
    if (employer_key) tokenPayload.employer_key = employer_key;
    if (student_key) tokenPayload.student_key = student_key;

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    res.json({
      token,
      user: {
        username: user.username,
        role: user.role,
        ...(employer_key && { employer_key }),
        ...(student_key && { student_key }),
      },
    });
  } catch (error) {
    console.error('Login failed', error);
    res.status(500).json({ error: 'Login failed.' });
  }
});

app.post('/api/inquiries', (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone = '',
      audienceType,
      companyName = '',
      studentId = '',
      currentCompany = '',
      relationshipInterest = false,
      applicationsSubmitted = 0,
      upcomingEventId = '',
      notes = '',
    } = req.body ?? {};

    if (!firstName || !lastName || !email || !audienceType) {
      return res
        .status(400)
        .json({ error: 'firstName, lastName, email and audienceType are required.' });
    }

    const formattedRow = {
      submittedAt: new Date().toISOString(),
      firstName,
      lastName,
      email,
      phone,
      audienceType,
      companyName: audienceType === 'employer' ? companyName : '',
      studentId: audienceType === 'alumni' ? studentId : '',
      currentCompany: audienceType === 'alumni' ? currentCompany : '',
      relationshipInterest: relationshipInterest ? 'Yes' : 'No',
      applicationsSubmitted: Number(applicationsSubmitted || 0),
      upcomingEventId,
      notes,
    };

    appendInquiryToCsv(formattedRow);
    res.status(201).json({ message: 'Inquiry stored successfully.' });
  } catch (error) {
    console.error('Failed to store inquiry', error);
    res.status(500).json({ error: error.message || 'Failed to store inquiry.' });
  }
});

// Alumni Record Update endpoint
app.post('/api/connect', (req, res) => {
  const { name, email, role, organization, subject, message } = req.body || {};

  // Validate required fields
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const submittedAt = new Date().toISOString();

  // CSV-safe escaping function
  const safe = (value = '') => {
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  // Build CSV row
  const row = [
    safe(submittedAt),
    safe(name),
    safe(email),
    safe(role || ''),
    safe(organization || ''),
    safe(subject),
    safe(message),
  ].join(',') + '\n';

  // Append to CSV file
  fs.appendFile(CONNECT_CSV_PATH, row, (err) => {
    if (err) {
      console.error('Error writing to connect_requests.csv:', err);
      return res.status(500).json({ error: 'Failed to store request' });
    }
    res.status(201).json({ message: 'Request stored successfully' });
  });
});

// Admin endpoint to fetch connect requests
app.get('/api/admin/connect-requests', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    if (!fs.existsSync(CONNECT_CSV_PATH)) {
      return res.json({ requests: [] });
    }

    const csvContent = fs.readFileSync(CONNECT_CSV_PATH, 'utf8');
    
    // Parse CSV with PapaParse - handle quoted values properly
    const parsed = Papa.parse(csvContent, { 
      header: true, 
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });
    
    // Filter out header row and empty rows, then reverse to show newest first
    const requests = parsed.data
      .filter(row => {
        // Filter out rows that are just headers or completely empty
        const hasName = row.name && row.name.trim() && row.name.trim() !== 'name';
        const hasEmail = row.email && row.email.trim() && row.email.trim() !== 'email';
        return hasName && hasEmail;
      })
      .map((row) => {
        // Clean up values - remove quotes if present
        const cleanValue = (val) => {
          if (!val) return '';
          let cleaned = String(val).trim();
          // Remove surrounding quotes
          if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.slice(1, -1).replace(/""/g, '"');
          }
          return cleaned;
        };

        return {
          submittedAt: cleanValue(row.submittedAt),
          name: cleanValue(row.name),
          email: cleanValue(row.email),
          role: cleanValue(row.role),
          organization: cleanValue(row.organization),
          subject: cleanValue(row.subject),
          message: cleanValue(row.message),
        };
      })
      .reverse() // Show newest first
      .map((row, index) => ({
        ...row,
        id: index + 1,
      }));

    console.log(`Loaded ${requests.length} connect requests from CSV`);
    res.json({ requests });
  } catch (error) {
    console.error('Error reading connect requests:', error);
    res.status(500).json({ error: 'Failed to read connect requests', details: error.message });
  }
});

// Update Connect Request
app.put('/api/admin/connect-requests/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, organization, subject, message } = req.body ?? {};

    if (!fs.existsSync(CONNECT_CSV_PATH)) {
      return res.status(404).json({ error: 'Connect requests file not found.' });
    }

    const csvContent = fs.readFileSync(CONNECT_CSV_PATH, 'utf8');
    const parsed = Papa.parse(csvContent, { 
      header: true, 
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    const requests = parsed.data
      .filter(row => {
        const hasName = row.name && row.name.trim() && row.name.trim() !== 'name';
        const hasEmail = row.email && row.email.trim() && row.email.trim() !== 'email';
        return hasName && hasEmail;
      })
      .map((row) => {
        const cleanValue = (val) => {
          if (!val) return '';
          let cleaned = String(val).trim();
          if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.slice(1, -1).replace(/""/g, '"');
          }
          return cleaned;
        };
        return {
          submittedAt: cleanValue(row.submittedAt),
          name: cleanValue(row.name),
          email: cleanValue(row.email),
          role: cleanValue(row.role),
          organization: cleanValue(row.organization),
          subject: cleanValue(row.subject),
          message: cleanValue(row.message),
        };
      })
      .reverse()
      .map((row, index) => ({
        ...row,
        id: index + 1,
      }));

    const requestIndex = requests.findIndex(r => String(r.id) === String(id));
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    // Update fields if provided
    if (name !== undefined) requests[requestIndex].name = name;
    if (email !== undefined) requests[requestIndex].email = email;
    if (role !== undefined) requests[requestIndex].role = role;
    if (organization !== undefined) requests[requestIndex].organization = organization;
    if (subject !== undefined) requests[requestIndex].subject = subject;
    if (message !== undefined) requests[requestIndex].message = message;

    // Reverse back and write to CSV
    const requestsToWrite = requests.reverse();
    const safe = (value = '') => {
      const str = String(value).replace(/"/g, '""');
      return `"${str}"`;
    };

    const header = 'submittedAt,name,email,role,organization,subject,message\n';
    const rows = requestsToWrite.map(r => [
      safe(r.submittedAt),
      safe(r.name),
      safe(r.email),
      safe(r.role || ''),
      safe(r.organization || ''),
      safe(r.subject),
      safe(r.message),
    ].join(',')).join('\n');

    fs.writeFileSync(CONNECT_CSV_PATH, header + rows + '\n', 'utf8');
    res.json({ message: 'Request updated successfully.', request: requests[requestIndex] });
  } catch (error) {
    console.error('Error updating connect request:', error);
    res.status(500).json({ error: 'Failed to update connect request', details: error.message });
  }
});

// Delete Connect Request
app.delete('/api/admin/connect-requests/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { id } = req.params;

    if (!fs.existsSync(CONNECT_CSV_PATH)) {
      return res.status(404).json({ error: 'Connect requests file not found.' });
    }

    const csvContent = fs.readFileSync(CONNECT_CSV_PATH, 'utf8');
    const parsed = Papa.parse(csvContent, { 
      header: true, 
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    const requests = parsed.data
      .filter(row => {
        const hasName = row.name && row.name.trim() && row.name.trim() !== 'name';
        const hasEmail = row.email && row.email.trim() && row.email.trim() !== 'email';
        return hasName && hasEmail;
      })
      .map((row) => {
        const cleanValue = (val) => {
          if (!val) return '';
          let cleaned = String(val).trim();
          if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.slice(1, -1).replace(/""/g, '"');
          }
          return cleaned;
        };
        return {
          submittedAt: cleanValue(row.submittedAt),
          name: cleanValue(row.name),
          email: cleanValue(row.email),
          role: cleanValue(row.role),
          organization: cleanValue(row.organization),
          subject: cleanValue(row.subject),
          message: cleanValue(row.message),
        };
      })
      .reverse()
      .map((row, index) => ({
        ...row,
        id: index + 1,
      }));

    const filtered = requests.filter(r => String(r.id) !== String(id));
    if (filtered.length === requests.length) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    // Reverse back and write to CSV
    const requestsToWrite = filtered.reverse();
    const safe = (value = '') => {
      const str = String(value).replace(/"/g, '""');
      return `"${str}"`;
    };

    const header = 'submittedAt,name,email,role,organization,subject,message\n';
    const rows = requestsToWrite.map(r => [
      safe(r.submittedAt),
      safe(r.name),
      safe(r.email),
      safe(r.role || ''),
      safe(r.organization || ''),
      safe(r.subject),
      safe(r.message),
    ].join(',')).join('\n');

    fs.writeFileSync(CONNECT_CSV_PATH, header + rows + '\n', 'utf8');
    res.json({ message: 'Request deleted successfully.' });
  } catch (error) {
    console.error('Error deleting connect request:', error);
    res.status(500).json({ error: 'Failed to delete connect request', details: error.message });
  }
});

app.post('/api/contact/alumni-record-update', (req, res) => {
  try {
    const {
      legalFirstName,
      middleName,
      lastName,
      preferredFirstName,
      suffix,
      maidenName,
      email,
      mobilePhone,
      optInText,
      optInEmail,
      birthdate,
      schoolCollege,
      graduationYear,
      studiedAbroad,
      companyName,
      jobTitle,
      businessEmail,
      businessPhone,
      businessAddress,
      mailingAddress,
      country,
      street,
      city,
      state,
      postalCode,
      seasonalAddress,
      spouseFirstName,
      spouseLastName,
      spouseIsSLUGraduate,
      hasChildAtSLU,
    } = req.body ?? {};

    if (!legalFirstName || !lastName || !email || !mobilePhone || !birthdate) {
      return res
        .status(400)
        .json({ error: 'Legal first name, last name, email, mobile phone, and birthdate are required.' });
    }

    const recordPath = path.join(DATA_DIR, 'alumni_record_updates.csv');
    ensureDataDirectory();

    let records = [];
    if (fs.existsSync(recordPath)) {
      const csvContent = fs.readFileSync(recordPath, 'utf8');
      records = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    }

    const updateRecord = {
      update_id: records.length + 1,
      submitted_at: new Date().toISOString(),
      legal_first_name: legalFirstName.trim(),
      middle_name: (middleName || '').trim(),
      last_name: lastName.trim(),
      preferred_first_name: (preferredFirstName || '').trim(),
      suffix: (suffix || '').trim(),
      maiden_name: (maidenName || '').trim(),
      email: email.trim(),
      mobile_phone: mobilePhone.trim(),
      opt_in_text: optInText ? '1' : '0',
      opt_in_email: optInEmail ? '1' : '0',
      birthdate: birthdate,
      school_college: (schoolCollege || '').trim(),
      graduation_year: (graduationYear || '').trim(),
      studied_abroad: studiedAbroad ? '1' : '0',
      company_name: (companyName || '').trim(),
      job_title: (jobTitle || '').trim(),
      business_email: (businessEmail || '').trim(),
      business_phone: (businessPhone || '').trim(),
      business_address: (businessAddress || '').trim(),
      mailing_address: mailingAddress.trim(),
      country: country || 'United States',
      street: street.trim(),
      city: city.trim(),
      state: (state || '').trim(),
      postal_code: postalCode.trim(),
      seasonal_address: (seasonalAddress || '').trim(),
      spouse_first_name: (spouseFirstName || '').trim(),
      spouse_last_name: (spouseLastName || '').trim(),
      spouse_is_slu_graduate: (spouseIsSLUGraduate || '').trim(),
      has_child_at_slu: hasChildAtSLU ? '1' : '0',
      status: 'pending',
    };

    records.push(updateRecord);
    const csv = Papa.unparse(records, { header: true });
    fs.writeFileSync(recordPath, csv, 'utf8');

    res.status(201).json({ message: 'Alumni record update submitted successfully.' });
  } catch (error) {
    console.error('Failed to store alumni record update', error);
    res.status(500).json({ error: error.message || 'Failed to store alumni record update.' });
  }
});

// Alumni Event Application endpoint
app.post('/api/alumni/event-application', authenticateToken, authorizeRole('alumni', 'admin'), (req, res) => {
  try {
    const { event_key, full_name, email, phone, program, graduation_year, interest_reason, previous_attendance, student_key } = req.body ?? {};
    const { student_key: tokenStudentKey, role } = req.user || {};

    // Use student_key from body, token, or require it
    const targetStudentKey = student_key || tokenStudentKey;

    if (!event_key || !full_name || !email) {
      return res.status(400).json({ error: 'Event, full name, and email are required.' });
    }

    // Store in event_applications.csv
    const applicationsPath = path.join(DATA_DIR, 'event_applications.csv');
    ensureDataDirectory();
    
    let applications = [];
    let needsHeaderUpdate = false;
    if (fs.existsSync(applicationsPath)) {
      const csvContent = fs.readFileSync(applicationsPath, 'utf8');
      applications = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      
      // Check if student_key column exists in existing data
      if (applications.length > 0 && !applications[0].hasOwnProperty('student_key')) {
        needsHeaderUpdate = true;
        // Add student_key to existing records (empty for now, can be updated manually if needed)
        applications = applications.map(app => ({
          ...app,
          student_key: app.student_key || '',
        }));
      }
    } else {
      // File doesn't exist, will be created with proper header
      needsHeaderUpdate = true;
    }

    const application = {
      application_id: applications.length + 1,
      student_key: targetStudentKey ? targetStudentKey.toString() : '',
      event_key: event_key.toString(),
      full_name: full_name.trim(),
      email: email.trim(),
      phone: (phone || '').trim(),
      program: (program || '').trim(),
      graduation_year: (graduation_year || '').trim(),
      interest_reason: (interest_reason || '').trim(),
      previous_attendance: previous_attendance ? '1' : '0',
      submitted_at: new Date().toISOString(),
      status: 'pending',
    };

    console.log('Saving event application with student_key:', targetStudentKey);

    applications.push(application);
    
    // Ensure all required columns are present
    const requiredColumns = ['application_id', 'student_key', 'event_key', 'full_name', 'email', 'phone', 'program', 'graduation_year', 'interest_reason', 'previous_attendance', 'submitted_at', 'status'];
    const csv = Papa.unparse(applications, { 
      header: true,
      columns: requiredColumns
    });
    fs.writeFileSync(applicationsPath, csv, 'utf8');
    
    if (needsHeaderUpdate) {
      console.log('Updated event_applications.csv header to include student_key');
    }

    res.json({ message: 'Event application submitted successfully.' });
  } catch (error) {
    console.error('Failed to submit event application', error);
    res.status(500).json({ error: 'Failed to submit event application.' });
  }
});

// Alumni Engagement participation endpoint
app.post('/api/alumni/engagement', (req, res) => {
  try {
    const { student_key, event_key, employer_key, engagement_type, mentorship_hours, feedback_score, feedback_notes, referrals_made, participated_university_event_flag } = req.body ?? {};

    if (!engagement_type) {
      return res.status(400).json({ error: 'Engagement type is required.' });
    }

    // Load existing alumni engagement data
    const { columns, rows } = loadTableData('alumniEngagement');

    // Generate new fact_id
    const maxFactId = rows.length > 0 
      ? Math.max(...rows.map(r => parseInt(r.fact_id || 0)))
      : 0;
    const newFactId = maxFactId + 1;

    // Get current date for event_date_key and hire_date_key
    const today = new Date();
    const dateKey = parseInt(`${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`);

    // Create engagement record
    const engagement = {
      fact_id: newFactId.toString(),
      student_key: (student_key || '').toString(),
      employer_key: (employer_key || '').toString(),
      contact_key: '',
      event_key: (event_key || '').toString(),
      event_date_key: dateKey.toString(),
      hire_date_key: dateKey.toString(),
      alumni_employee_id_at_employer: '',
      participated_university_event_flag: participated_university_event_flag ? '1' : '0',
      participated_outside_event_flag: '0',
      alumni_event_flag: '0',
      applications_submitted: '0',
      interviews_count: '0',
      job_offers_count: '0',
      hired_flag: '0',
      donations_amount: '0',
      mentorship_hours: (mentorship_hours || '0').toString(),
      referrals_made: (referrals_made || '0').toString(),
      engagement_score: (feedback_score || '0').toString(),
      job_role: '',
    };

    // Sanitize and add to rows
    const sanitized = sanitizeRecord(columns, engagement);
    rows.push(sanitized);
    writeTableData('alumniEngagement', columns, rows);

    // Store feedback notes separately if provided
    if (feedback_notes) {
      const feedbackPath = path.join(DATA_DIR, 'engagement_feedback.csv');
      let feedbacks = [];
      if (fs.existsSync(feedbackPath)) {
        const csvContent = fs.readFileSync(feedbackPath, 'utf8');
        feedbacks = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      }

      feedbacks.push({
        fact_id: newFactId.toString(),
        feedback_notes: feedback_notes.trim(),
        engagement_type: engagement_type.trim(),
        submitted_at: new Date().toISOString(),
      });

      const csv = Papa.unparse(feedbacks, { header: true });
      fs.writeFileSync(feedbackPath, csv, 'utf8');
    }

    res.json({ message: 'Engagement participation recorded successfully.' });
  } catch (error) {
    console.error('Failed to submit engagement', error);
    res.status(500).json({ error: 'Failed to submit engagement.' });
  }
});

// Get My Alumni Profile and Stats
app.get('/api/alumni/my-profile', authenticateToken, authorizeRole('alumni', 'admin'), (req, res) => {
  try {
    const { student_key, role } = req.user || {};

    // For alumni role, require student_key
    if (role === 'alumni' && !student_key) {
      return res.status(400).json({ error: 'Student key not found in token. Please log out and log back in.' });
    }

    // For admin, allow them to specify student_key in query, or use token's student_key
    let targetStudentKey = req.query.student_key || student_key;
    if (role === 'admin' && !targetStudentKey) {
      const { rows: students } = loadTableData('students');
      if (students && students.length > 0) {
        targetStudentKey = students[0].student_key;
      }
    }

    if (!targetStudentKey) {
      return res.status(400).json({ error: 'Student key is required.' });
    }

    // Get student profile
    const { rows: students } = loadTableData('students');
    const student = students.find(s => String(s.student_key) === String(targetStudentKey));

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    // Get employment info
    const employmentPath = path.join(DATA_DIR, 'alumni_employment.csv');
    let employment = null;
    let colleaguesCount = 0;
    if (fs.existsSync(employmentPath)) {
      const csvContent = fs.readFileSync(employmentPath, 'utf8');
      const employments = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      employment = employments.find(emp => String(emp.alumni_id) === String(targetStudentKey) && emp.status === 'Verified');
      
      // Debug logging
      if (!employment) {
        console.log(`No verified employment found for student_key=${targetStudentKey}`);
        const allForStudent = employments.filter(emp => String(emp.alumni_id) === String(targetStudentKey));
        if (allForStudent.length > 0) {
          console.log(`Found ${allForStudent.length} employment record(s) for this student, but none are Verified:`, allForStudent.map(e => ({ status: e.status, start_date: e.start_date })));
        }
      } else {
        console.log(`Found employment for student_key=${targetStudentKey}:`, { job_title: employment.job_title, start_date: employment.start_date, location: employment.location });
      }
      
      if (employment) {
        const myEmployerKey = String(employment.employer_key);
        colleaguesCount = employments.filter(emp => 
          String(emp.employer_key) === myEmployerKey && 
          String(emp.alumni_id) !== String(targetStudentKey) &&
          emp.status === 'Verified'
        ).length;
      }
    }

    // Get event applications
    const applicationsPath = path.join(DATA_DIR, 'event_applications.csv');
    let eventApplications = [];
    let eventsRegistered = 0;
    let upcomingEventsCount = 0;
    if (fs.existsSync(applicationsPath)) {
      const csvContent = fs.readFileSync(applicationsPath, 'utf8');
      const allApplications = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      eventApplications = allApplications.filter(app => 
        app.email?.toLowerCase() === student.email?.toLowerCase() ||
        app.full_name?.toLowerCase() === `${student.first_name} ${student.last_name}`.toLowerCase() ||
        String(app.student_key) === String(targetStudentKey)
      );
      eventsRegistered = eventApplications.length;
      
      // Count upcoming events from applications (only approved/pending applications for future events)
      const { rows: events } = loadTableData('events');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      upcomingEventsCount = eventApplications.filter(app => {
        // Only count approved or pending applications
        const status = (app.status || 'pending').toLowerCase();
        if (status !== 'approved' && status !== 'pending') return false;
        
        const event = events.find(e => String(e.event_key) === String(app.event_key));
        if (!event || !event.start_date) return false;
        
        const eventDate = new Date(event.start_date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      }).length;
    }

    // Get engagement data (events attended)
    const { rows: engagements } = loadTableData('alumniEngagement');
    const myEngagements = engagements.filter(eng => String(eng.student_key) === String(targetStudentKey));
    const eventsAttended = myEngagements.filter(eng => 
      eng.participated_university_event_flag === '1' || eng.engagement_type === 'event'
    ).length;

    // Get technologies from employment or engagement
    let technologies = 'N/A';
    if (employment?.technologies) {
      technologies = employment.technologies;
    } else if (myEngagements.length > 0) {
      // Try to get from recent engagement
      const recentEngagement = myEngagements[myEngagements.length - 1];
      if (recentEngagement.job_role) {
        technologies = recentEngagement.job_role;
      }
    }

    // Get company name from employment - try employer_name first, then lookup from employers table
    let companyName = 'Not Employed';
    if (employment) {
      if (employment.employer_name) {
        companyName = employment.employer_name;
      } else if (employment.employer_key) {
        // Lookup from employers table
        const { rows: employers } = loadTableData('employers');
        const employer = employers.find(emp => String(emp.employer_key) === String(employment.employer_key));
        if (employer && employer.employer_name) {
          companyName = employer.employer_name;
        }
      }
    }

    res.json({
      profile: {
        student_key: student.student_key,
        name: `${student.first_name} ${student.last_name}`,
        email: student.email,
        phone: student.phone || '',
        graduation_year: student.graduation_year,
        program: student.program_name,
        current_city: student.current_city || '',
        current_state: student.current_state || '',
        current_country: student.current_country || '',
        first_name: student.first_name || '',
        last_name: student.last_name || '',
      },
      employment: employment ? {
        company_name: companyName,
        job_title: (employment.job_title || '').trim() || 'N/A',
        location: (employment.location || '').trim() || 'N/A',
        start_date: employment.start_date ? String(employment.start_date).trim() : 'N/A',
        technologies: technologies,
      } : null,
      stats: {
        graduation_year: student.graduation_year || 'N/A',
        role: employment?.job_title || 'N/A',
        technologies: technologies,
        company_name: companyName,
        events_attended: eventsAttended,
        events_registered: eventsRegistered,
        upcoming_events: upcomingEventsCount,
        colleagues_count: colleaguesCount,
      },
    });
  } catch (error) {
    console.error('Failed to load alumni profile', error);
    res.status(500).json({ error: 'Failed to load alumni profile.' });
  }
});

// Update Alumni Profile
app.put('/api/alumni/profile', authenticateToken, authorizeRole('alumni', 'admin'), (req, res) => {
  try {
    const { student_key, role } = req.user || {};
    const updates = req.body ?? {};

    // For alumni role, require student_key
    if (role === 'alumni' && !student_key) {
      return res.status(400).json({ error: 'Student key not found in token. Please log out and log back in.' });
    }

    // For admin, use student_key from updates if provided, or default to first student
    let targetStudentKey = student_key;
    if (role === 'admin' && !student_key) {
      const { rows: students } = loadTableData('students');
      if (students && students.length > 0) {
        targetStudentKey = students[0].student_key;
      }
    }

    if (!targetStudentKey) {
      return res.status(400).json({ error: 'Student key is required.' });
    }

    const { columns, rows } = loadTableData('students');
    const index = rows.findIndex(s => String(s.student_key) === String(targetStudentKey));
    
    if (index === -1) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    // Update allowed fields (only basic profile fields, not sensitive data)
    const allowedFields = ['first_name', 'last_name', 'email', 'phone', 'current_city', 'current_state', 'current_country', 'program_name', 'graduation_year'];
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && columns.includes(key)) {
        rows[index][key] = updates[key] || '';
      }
    });

    writeTableData('students', columns, rows);
    res.json({ message: 'Profile updated successfully.', profile: rows[index] });
  } catch (error) {
    console.error('Failed to update alumni profile', error);
    res.status(500).json({ error: 'Failed to update alumni profile.' });
  }
});

// Get My Alumni Colleagues (alumni at same company)
app.get('/api/alumni/my-colleagues', authenticateToken, authorizeRole('alumni', 'admin'), (req, res) => {
  try {
    const { student_key, role } = req.user || {};

    // For alumni role, require student_key
    if (role === 'alumni' && !student_key) {
      return res.status(400).json({ error: 'Student key not found in token. Please log out and log back in.' });
    }

    // For admin, allow them to specify student_key in query, or use token's student_key
    let targetStudentKey = req.query.student_key || student_key;
    if (role === 'admin' && !targetStudentKey) {
      const { rows: students } = loadTableData('students');
      if (students && students.length > 0) {
        targetStudentKey = students[0].student_key;
      }
    }

    if (!targetStudentKey) {
      return res.status(400).json({ error: 'Student key is required.' });
    }

    const employmentPath = path.join(DATA_DIR, 'alumni_employment.csv');
    if (!fs.existsSync(employmentPath)) {
      return res.json({ colleagues: [], myCompany: null });
    }

    const csvContent = fs.readFileSync(employmentPath, 'utf8');
    const employments = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    
    // Find the logged-in alumni's employment record
    const myEmployment = employments.find(emp => String(emp.alumni_id) === String(targetStudentKey) && emp.status === 'Verified');
    
    if (!myEmployment) {
      return res.json({ colleagues: [], myCompany: null, message: 'You are not currently listed as employed at any company.' });
    }

    const myEmployerKey = String(myEmployment.employer_key);
    
    // Find all other alumni at the same company (excluding self)
    const colleagues = employments.filter(emp => 
      String(emp.employer_key) === myEmployerKey && 
      String(emp.alumni_id) !== String(targetStudentKey) &&
      emp.status === 'Verified'
    );

    // Join with student/alumni data and employer data
    const { rows: students } = loadTableData('students');
    const { rows: employers } = loadTableData('employers');
    const myEmployer = employers.find(emp => String(emp.employer_key) === myEmployerKey);
    const myStudent = students.find(s => String(s.student_key) === String(targetStudentKey));

    // Get logged-in alumni's own employment info
    const myPhotoIndex = (parseInt(targetStudentKey) % 12) + 1;
    const myPhotoPath = `/assets/alumni/student${myPhotoIndex}.${myPhotoIndex <= 6 ? 'jpeg' : 'jpg'}`;
    
    const myEmploymentInfo = {
      alumniId: targetStudentKey,
      alumniName: myStudent ? `${myStudent.first_name} ${myStudent.last_name}` : myEmployment.alumni_name || 'You',
      email: myStudent?.email || '',
      graduationYear: myEmployment.graduation_year || myStudent?.graduation_year || 'N/A',
      program: myEmployment.program || myStudent?.program_name || 'N/A',
      jobTitle: myEmployment.job_title || 'N/A',
      startDate: myEmployment.start_date || 'N/A',
      location: myEmployment.location || 'N/A',
      status: myEmployment.status || 'Verified',
      photoPath: myPhotoPath,
    };

    const enriched = colleagues.map(employment => {
      const student = students.find(s => String(s.student_key) === String(employment.alumni_id));
      // Generate photo path based on student_key (using modulo to map to available photos)
      const photoIndex = (parseInt(employment.alumni_id) % 12) + 1;
      const photoPath = `/assets/alumni/student${photoIndex}.${photoIndex <= 6 ? 'jpeg' : 'jpg'}`;
      
      return {
        id: employment.id,
        alumniId: employment.alumni_id,
        alumniName: student ? `${student.first_name} ${student.last_name}` : employment.alumni_name || 'Unknown',
        email: student?.email || '',
        graduationYear: employment.graduation_year || student?.graduation_year || 'N/A',
        program: employment.program || student?.program_name || 'N/A',
        jobTitle: employment.job_title || 'N/A',
        startDate: employment.start_date || 'N/A',
        location: employment.location || 'N/A',
        photoPath: photoPath,
      };
    });

    res.json({ 
      myEmployment: myEmploymentInfo,
      colleagues: enriched,
      myCompany: {
        employerKey: myEmployerKey,
        employerName: myEmployer?.employer_name || myEmployment.employer_name || 'Unknown',
        industry: myEmployer?.industry || 'N/A',
        location: myEmployment.location || 'N/A',
        logoUrl: myEmployer?.logo_url || `/assets/employers/Comp img${(parseInt(myEmployerKey) % 5) + 1}.${parseInt(myEmployerKey) % 2 === 0 ? 'jpg' : 'webp'}`,
        hqCity: myEmployer?.hq_city || '',
        hqState: myEmployer?.hq_state || '',
        hqCountry: myEmployer?.hq_country || '',
        website: myEmployer?.website || '',
      }
    });
  } catch (error) {
    console.error('Failed to load alumni colleagues', error);
    res.status(500).json({ error: 'Failed to load alumni colleagues.' });
  }
});

// Alumni Success Story endpoint
app.post('/api/alumni/success-story', authenticateToken, authorizeRole('alumni', 'admin'), (req, res) => {
  try {
    const { full_name, program, graduation_year, current_role, employer_name, story_title, story_content, achievements, photo_url, student_key } = req.body ?? {};
    const { student_key: tokenStudentKey, role } = req.user || {};

    // Use student_key from body, token, or require it
    const targetStudentKey = student_key || tokenStudentKey;
    
    if (!full_name || !story_title || !story_content) {
      return res.status(400).json({ error: 'Full name, story title, and story content are required.' });
    }

    // Store in success_stories.csv
    const storiesPath = path.join(DATA_DIR, 'success_stories.csv');
    ensureDataDirectory();
    
    let stories = [];
    if (fs.existsSync(storiesPath)) {
      const csvContent = fs.readFileSync(storiesPath, 'utf8');
      stories = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    }

    const story = {
      story_id: stories.length + 1,
      student_key: targetStudentKey ? targetStudentKey.toString() : '',
      full_name: full_name.trim(),
      program: (program || '').trim(),
      graduation_year: (graduation_year || '').trim(),
      current_role: (current_role || '').trim(),
      employer_name: (employer_name || '').trim(),
      story_title: story_title.trim(),
      story_content: story_content.trim(),
      achievements: (achievements || '').trim(),
      photo_url: (photo_url || '').trim(),
      submitted_at: new Date().toISOString(),
      status: 'pending',
    };

    stories.push(story);
    const csv = Papa.unparse(stories, { header: true });
    fs.writeFileSync(storiesPath, csv, 'utf8');

    res.json({ message: 'Success story submitted successfully. Admin will review and approve it.' });
  } catch (error) {
    console.error('Failed to submit success story', error);
    res.status(500).json({ error: 'Failed to submit success story.' });
  }
});

// ============================================
// EMPLOYER PORTAL ENDPOINTS
// ============================================

// Get Employer Profile
app.get('/api/employer/profile', authenticateToken, authorizeRole('employer', 'admin'), (req, res) => {
  try {
    const { employer_key, role } = req.user || {};
    
    // For employer role, require employer_key
    if (role === 'employer' && !employer_key) {
      return res.status(400).json({ error: 'Employer key not found in token. Please log out and log back in.' });
    }

    // For admin role without employer_key, return first employer as default (or allow them to specify)
    let targetEmployerKey = employer_key;
    if (role === 'admin' && !employer_key) {
      const { rows: employers } = loadTableData('employers');
      if (employers && employers.length > 0) {
        targetEmployerKey = employers[0].employer_key;
      }
    }

    if (!targetEmployerKey) {
      return res.status(404).json({ error: 'No employer found. Please ensure employer data exists.' });
    }

    const { rows } = loadTableData('employers');
    const employer = rows.find(emp => String(emp.employer_key) === String(targetEmployerKey));
    
    if (!employer) {
      return res.status(404).json({ error: 'Employer not found.' });
    }

    // Add logo URL if not present (fallback to default logo)
    const employerWithLogo = {
      ...employer,
      logo_url: employer.logo_url || `/assets/employers/Comp img${(parseInt(targetEmployerKey) % 5) + 1}.${parseInt(targetEmployerKey) % 2 === 0 ? 'jpg' : 'webp'}`,
    };

    res.json({ employer: employerWithLogo });
  } catch (error) {
    console.error('Failed to load employer profile', error);
    res.status(500).json({ error: 'Failed to load employer profile.' });
  }
});

// Update Employer Profile
app.put('/api/employer/profile', authenticateToken, authorizeRole('employer', 'admin'), (req, res) => {
  try {
    const { employer_key, role } = req.user || {};
    const updates = req.body ?? {};

    // For employer role, require employer_key
    if (role === 'employer' && !employer_key) {
      return res.status(400).json({ error: 'Employer key not found in token. Please log out and log back in.' });
    }

    // For admin, use employer_key from updates if provided, or default to first employer
    let targetEmployerKey = employer_key;
    if (role === 'admin' && !employer_key) {
      const { rows: employers } = loadTableData('employers');
      if (employers && employers.length > 0) {
        targetEmployerKey = employers[0].employer_key;
      }
    }

    if (!targetEmployerKey) {
      return res.status(400).json({ error: 'Employer key is required.' });
    }

    const { columns, rows } = loadTableData('employers');
    const index = rows.findIndex(emp => String(emp.employer_key) === String(targetEmployerKey));
    
    if (index === -1) {
      return res.status(404).json({ error: 'Employer not found.' });
    }

    // Add new columns if they don't exist (for products, slu_relation, logo_url)
    const newColumns = ['products', 'slu_relation', 'logo_url'];
    let updatedColumns = [...columns];
    newColumns.forEach(col => {
      if (!updatedColumns.includes(col)) {
        updatedColumns.push(col);
        // Initialize the field for all existing rows
        rows.forEach(row => {
          if (!row[col]) {
            row[col] = '';
          }
        });
      }
    });

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updatedColumns.includes(key)) {
        rows[index][key] = updates[key] || '';
      }
    });

    // Update updated_at timestamp
    if (updatedColumns.includes('updated_at')) {
      rows[index].updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    }

    writeTableData('employers', updatedColumns, rows);
    res.json({ message: 'Profile updated successfully.', employer: rows[index] });
  } catch (error) {
    console.error('Failed to update employer profile', error);
    res.status(500).json({ error: 'Failed to update employer profile.' });
  }
});

// Get Available Events for Employers
app.get('/api/employer/events', authenticateToken, authorizeRole('employer', 'admin'), (req, res) => {
  try {
    const { rows: events } = loadTableData('events');
    const today = new Date();
    const todayKey = parseInt(`${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`);
    
    // Calculate date 1 year ago for fallback
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoKey = parseInt(`${oneYearAgo.getFullYear()}${String(oneYearAgo.getMonth() + 1).padStart(2, '0')}${String(oneYearAgo.getDate()).padStart(2, '0')}`);

    // Filter upcoming events relevant to employers, or recent events if no upcoming ones
    let availableEvents = events.filter(event => {
      const eventDate = parseInt(event.start_date?.replace(/-/g, '') || '0');
      return eventDate >= todayKey;
    });

    // If no upcoming events, show recent events from the past year
    if (availableEvents.length === 0) {
      availableEvents = events.filter(event => {
        const eventDate = parseInt(event.start_date?.replace(/-/g, '') || '0');
        return eventDate >= oneYearAgoKey;
      }).sort((a, b) => {
        const dateA = parseInt(a.start_date?.replace(/-/g, '') || '0');
        const dateB = parseInt(b.start_date?.replace(/-/g, '') || '0');
        return dateB - dateA; // Most recent first
      });
    }

    // Limit to 20 events
    availableEvents = availableEvents.slice(0, 20);

    res.json({ events: availableEvents });
  } catch (error) {
    console.error('Failed to load events', error);
    res.status(500).json({ error: 'Failed to load events.' });
  }
});

// Request Event Participation
app.post('/api/employer/event-participation', authenticateToken, authorizeRole('employer', 'admin'), (req, res) => {
  try {
    const { employer_key, role } = req.user || {};
    const { event_key, notes } = req.body ?? {};

    // For employer role, require employer_key
    if (role === 'employer' && !employer_key) {
      return res.status(400).json({ error: 'Employer key not found in token. Please log out and log back in.' });
    }

    // For admin, allow them to specify employer_key in body, or use token's employer_key
    let targetEmployerKey = req.body.employer_key || employer_key;
    if (role === 'admin' && !targetEmployerKey) {
      const { rows: employers } = loadTableData('employers');
      if (employers && employers.length > 0) {
        targetEmployerKey = employers[0].employer_key;
      }
    }

    if (!targetEmployerKey || !event_key) {
      return res.status(400).json({ error: 'Employer key and event ID are required.' });
    }

    const participationPath = path.join(DATA_DIR, 'employer_event_participation.csv');
    ensureDataDirectory();

    let participations = [];
    if (fs.existsSync(participationPath)) {
      const csvContent = fs.readFileSync(participationPath, 'utf8');
      participations = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    }

    const participation = {
      id: participations.length + 1,
      employer_key: targetEmployerKey.toString(),
      event_key: event_key.toString(),
      participation_status: 'Requested',
      notes: (notes || '').trim(),
      requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    participations.push(participation);
    const csv = Papa.unparse(participations, { header: true });
    fs.writeFileSync(participationPath, csv, 'utf8');

    res.json({ message: 'Event participation requested successfully.' });
  } catch (error) {
    console.error('Failed to request event participation', error);
    res.status(500).json({ error: 'Failed to request event participation.' });
  }
});

// Get My Event Participation
app.get('/api/employer/my-events', authenticateToken, authorizeRole('employer', 'admin'), (req, res) => {
  try {
    const { employer_key, role } = req.user || {};

    // For employer role, require employer_key
    if (role === 'employer' && !employer_key) {
      return res.status(400).json({ error: 'Employer key not found in token. Please log out and log back in.' });
    }

    // For admin, return all participations or filter by query param
    let targetEmployerKey = employer_key;
    if (role === 'admin' && !employer_key) {
      // Admin can see all, or filter by query param
      targetEmployerKey = req.query.employer_key;
    }

    const participationPath = path.join(DATA_DIR, 'employer_event_participation.csv');
    if (!fs.existsSync(participationPath)) {
      return res.json({ participations: [] });
    }

    const csvContent = fs.readFileSync(participationPath, 'utf8');
    const participations = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    
    // Filter by employer_key if provided, otherwise return all for admin
    const myParticipations = targetEmployerKey 
      ? participations.filter(p => String(p.employer_key) === String(targetEmployerKey))
      : participations;

    // Join with events data
    const { rows: events } = loadTableData('events');
    const enriched = myParticipations.map(part => {
      const event = events.find(e => String(e.event_key) === String(part.event_key));
      return {
        ...part,
        event_name: event?.event_name || 'Unknown',
        event_type: event?.event_type || 'Unknown',
        event_date: event?.start_date || 'Unknown',
        venue: event?.venue || 'Unknown',
      };
    });

    res.json({ participations: enriched });
  } catch (error) {
    console.error('Failed to load event participation', error);
    res.status(500).json({ error: 'Failed to load event participation.' });
  }
});

// Create Job Posting
app.post('/api/employer/job-postings', authenticateToken, authorizeRole('employer', 'admin'), (req, res) => {
  try {
    const { employer_key, role } = req.user || {};
    const { job_title, job_type, job_location, mode, salary_range, description, skills_required, closing_date } = req.body ?? {};

    // For employer role, require employer_key
    if (role === 'employer' && !employer_key) {
      return res.status(400).json({ error: 'Employer key not found in token. Please log out and log back in.' });
    }

    // For admin, allow them to specify employer_key in body, or use token's employer_key
    let targetEmployerKey = req.body.employer_key || employer_key;
    if (role === 'admin' && !targetEmployerKey) {
      const { rows: employers } = loadTableData('employers');
      if (employers && employers.length > 0) {
        targetEmployerKey = employers[0].employer_key;
      }
    }

    if (!targetEmployerKey || !job_title || !job_type) {
      return res.status(400).json({ error: 'Employer key, job title, and job type are required.' });
    }

    const postingsPath = path.join(DATA_DIR, 'employer_job_postings.csv');
    ensureDataDirectory();

    let postings = [];
    if (fs.existsSync(postingsPath)) {
      const csvContent = fs.readFileSync(postingsPath, 'utf8');
      postings = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    }

    const jobPosting = {
      job_id: postings.length + 1,
      employer_key: targetEmployerKey.toString(),
      job_title: job_title.trim(),
      job_type: job_type.trim(),
      job_location: (job_location || '').trim(),
      mode: (mode || 'Onsite').trim(),
      salary_range: (salary_range || '').trim(),
      description: (description || '').trim(),
      skills_required: (skills_required || '').trim(),
      posted_at: new Date().toISOString(),
      closing_date: (closing_date || '').trim(),
      is_active: '1',
    };

    postings.push(jobPosting);
    const csv = Papa.unparse(postings, { header: true });
    fs.writeFileSync(postingsPath, csv, 'utf8');

    res.json({ message: 'Job posting created successfully.', job: jobPosting });
  } catch (error) {
    console.error('Failed to create job posting', error);
    res.status(500).json({ error: 'Failed to create job posting.' });
  }
});

// Get My Job Postings
app.get('/api/employer/job-postings', authenticateToken, authorizeRole('employer', 'admin'), (req, res) => {
  try {
    const { employer_key, role } = req.user || {};

    // For employer role, require employer_key
    if (role === 'employer' && !employer_key) {
      return res.status(400).json({ error: 'Employer key not found in token. Please log out and log back in.' });
    }

    // For admin, return all postings or filter by query param
    let targetEmployerKey = employer_key;
    if (role === 'admin' && !employer_key) {
      targetEmployerKey = req.query.employer_key;
    }

    const postingsPath = path.join(DATA_DIR, 'employer_job_postings.csv');
    if (!fs.existsSync(postingsPath)) {
      return res.json({ postings: [] });
    }

    const csvContent = fs.readFileSync(postingsPath, 'utf8');
    const postings = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    
    // Filter by employer_key if provided, otherwise return all for admin
    const myPostings = targetEmployerKey 
      ? postings.filter(p => String(p.employer_key) === String(targetEmployerKey))
      : postings;

    res.json({ postings: myPostings });
  } catch (error) {
    console.error('Failed to load job postings', error);
    res.status(500).json({ error: 'Failed to load job postings.' });
  }
});

// Update Job Posting Status
app.patch('/api/employer/job-postings/:job_id/status', authenticateToken, authorizeRole('employer', 'admin'), (req, res) => {
  try {
    const { employer_key } = req.user || {};
    const { job_id } = req.params;
    const { is_active } = req.body ?? {};

    if (!employer_key) {
      return res.status(400).json({ error: 'Employer key not found in token.' });
    }

    const postingsPath = path.join(DATA_DIR, 'employer_job_postings.csv');
    if (!fs.existsSync(postingsPath)) {
      return res.status(404).json({ error: 'Job postings file not found.' });
    }

    const csvContent = fs.readFileSync(postingsPath, 'utf8');
    const postings = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    
    const posting = postings.find(p => String(p.job_id) === String(job_id) && String(p.employer_key) === String(employer_key));
    
    if (!posting) {
      return res.status(404).json({ error: 'Job posting not found.' });
    }

    posting.is_active = is_active ? '1' : '0';
    const csv = Papa.unparse(postings, { header: true });
    fs.writeFileSync(postingsPath, csv, 'utf8');

    res.json({ message: 'Job posting status updated successfully.' });
  } catch (error) {
    console.error('Failed to update job posting status', error);
    res.status(500).json({ error: 'Failed to update job posting status.' });
  }
});

// Get Job Applications for My Postings
app.get('/api/employer/job-applications', authenticateToken, authorizeRole('employer', 'admin'), (req, res) => {
  try {
    const { employer_key, role } = req.user || {};

    // For employer role, require employer_key
    if (role === 'employer' && !employer_key) {
      return res.status(400).json({ error: 'Employer key not found in token. Please log out and log back in.' });
    }

    // For admin, return all applications or filter by query param
    let targetEmployerKey = employer_key;
    if (role === 'admin' && !employer_key) {
      targetEmployerKey = req.query.employer_key;
    }

    // Get my job postings
    const postingsPath = path.join(DATA_DIR, 'employer_job_postings.csv');
    let myJobIds = [];
    if (fs.existsSync(postingsPath)) {
      const csvContent = fs.readFileSync(postingsPath, 'utf8');
      const postings = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      myJobIds = targetEmployerKey
        ? postings
            .filter(p => String(p.employer_key) === String(targetEmployerKey))
            .map(p => String(p.job_id))
        : postings.map(p => String(p.job_id)); // All jobs for admin
    }

    // Get applications for my jobs
    const applicationsPath = path.join(DATA_DIR, 'employer_job_applications.csv');
    if (!fs.existsSync(applicationsPath)) {
      return res.json({ applications: [] });
    }

    const csvContent = fs.readFileSync(applicationsPath, 'utf8');
    const applications = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    
    // Filter by job IDs if provided, otherwise return all for admin
    const myApplications = myJobIds.length > 0
      ? applications.filter(app => myJobIds.includes(String(app.job_id)))
      : applications;

    // Join with student/alumni data
    const { rows: students } = loadTableData('students');
    const enriched = myApplications.map(app => {
      const candidate = students.find(s => String(s.student_key) === String(app.candidate_id));
      return {
        ...app,
        candidate_name: candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Unknown',
        candidate_email: candidate?.email || 'N/A',
        candidate_program: candidate?.program_name || 'N/A',
      };
    });

    res.json({ applications: enriched });
  } catch (error) {
    console.error('Failed to load job applications', error);
    res.status(500).json({ error: 'Failed to load job applications.' });
  }
});

// Update Application Status
app.patch('/api/employer/job-applications/:application_id', authenticateToken, authorizeRole('employer', 'admin'), (req, res) => {
  try {
    const { employer_key } = req.user || {};
    const { application_id } = req.params;
    const { application_status, notes } = req.body ?? {};

    if (!employer_key || !application_status) {
      return res.status(400).json({ error: 'Employer key and application status are required.' });
    }

    const applicationsPath = path.join(DATA_DIR, 'employer_job_applications.csv');
    if (!fs.existsSync(applicationsPath)) {
      return res.status(404).json({ error: 'Applications file not found.' });
    }

    const csvContent = fs.readFileSync(applicationsPath, 'utf8');
    const applications = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    
    const application = applications.find(app => String(app.application_id) === String(application_id));
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    // Verify employer owns the job
    const postingsPath = path.join(DATA_DIR, 'employer_job_postings.csv');
    if (fs.existsSync(postingsPath)) {
      const postingsContent = fs.readFileSync(postingsPath, 'utf8');
      const postings = Papa.parse(postingsContent, { header: true, skipEmptyLines: true }).data;
      const job = postings.find(p => String(p.job_id) === String(application.job_id));
      if (!job || String(job.employer_key) !== String(employer_key)) {
        return res.status(403).json({ error: 'Not authorized to update this application.' });
      }
    }

    application.application_status = application_status;
    if (notes) application.notes = notes;
    application.updated_at = new Date().toISOString();

    const csv = Papa.unparse(applications, { header: true });
    fs.writeFileSync(applicationsPath, csv, 'utf8');

    res.json({ message: 'Application status updated successfully.' });
  } catch (error) {
    console.error('Failed to update application status', error);
    res.status(500).json({ error: 'Failed to update application status.' });
  }
});

// Submit Employer Success Story
app.post('/api/employer/success-stories', authenticateToken, authorizeRole('employer', 'admin'), (req, res) => {
  try {
    const { employer_key, role } = req.user || {};
    const { title, story_text, focus_area } = req.body ?? {};

    // For employer role, require employer_key
    if (role === 'employer' && !employer_key) {
      return res.status(400).json({ error: 'Employer key not found in token. Please log out and log back in.' });
    }

    // For admin, allow them to specify employer_key in body, or use token's employer_key
    let targetEmployerKey = req.body.employer_key || employer_key;
    if (role === 'admin' && !targetEmployerKey) {
      const { rows: employers } = loadTableData('employers');
      if (employers && employers.length > 0) {
        targetEmployerKey = employers[0].employer_key;
      }
    }

    if (!targetEmployerKey || !title || !story_text) {
      return res.status(400).json({ error: 'Employer key, title, and story text are required.' });
    }

    const storiesPath = path.join(DATA_DIR, 'employer_success_stories.csv');
    ensureDataDirectory();

    let stories = [];
    if (fs.existsSync(storiesPath)) {
      const csvContent = fs.readFileSync(storiesPath, 'utf8');
      stories = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    }

    // Get employer name
    const { rows: employers } = loadTableData('employers');
    const employer = employers.find(emp => String(emp.employer_key) === String(targetEmployerKey));

    const story = {
      story_id: stories.length + 1,
      employer_key: targetEmployerKey.toString(),
      employer_name: employer?.employer_name || 'Unknown',
      title: title.trim(),
      story_text: story_text.trim(),
      focus_area: (focus_area || 'General').trim(),
      approved_by_admin: '0',
      created_at: new Date().toISOString(),
      published_at: '',
    };

    stories.push(story);
    const csv = Papa.unparse(stories, { header: true });
    fs.writeFileSync(storiesPath, csv, 'utf8');

    res.json({ message: 'Success story submitted successfully.' });
  } catch (error) {
    console.error('Failed to submit success story', error);
    res.status(500).json({ error: 'Failed to submit success story.' });
  }
});

// Get My SLU Alumni Employees
app.get('/api/employer/my-alumni-employees', authenticateToken, authorizeRole('employer', 'admin'), (req, res) => {
  try {
    const { employer_key, role } = req.user || {};

    // For employer role, require employer_key
    if (role === 'employer' && !employer_key) {
      return res.status(400).json({ error: 'Employer key not found in token. Please log out and log back in.' });
    }

    // For admin, allow them to specify employer_key in query, or use token's employer_key
    let targetEmployerKey = req.query.employer_key || employer_key;
    if (role === 'admin' && !targetEmployerKey) {
      const { rows: employers } = loadTableData('employers');
      if (employers && employers.length > 0) {
        targetEmployerKey = employers[0].employer_key;
      }
    }

    if (!targetEmployerKey) {
      return res.status(400).json({ error: 'Employer key is required.' });
    }

    const employmentPath = path.join(DATA_DIR, 'alumni_employment.csv');
    if (!fs.existsSync(employmentPath)) {
      return res.json({ employees: [] });
    }

    const csvContent = fs.readFileSync(employmentPath, 'utf8');
    const employments = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    
    // Filter by employer_key
    const myEmployments = employments.filter(emp => String(emp.employer_key) === String(targetEmployerKey));

    // Join with student/alumni data
    const { rows: students } = loadTableData('students');
    const enriched = myEmployments.map(employment => {
      const student = students.find(s => String(s.student_key) === String(employment.alumni_id));
      // Generate photo path based on student_key (using modulo to map to available photos)
      const photoIndex = (parseInt(employment.alumni_id) % 12) + 1;
      const photoPath = `/assets/alumni/student${photoIndex}.${photoIndex <= 6 ? 'jpeg' : 'jpg'}`;
      
      return {
        id: employment.id,
        alumniId: employment.alumni_id,
        alumniName: student ? `${student.first_name} ${student.last_name}` : employment.alumni_name || 'Unknown',
        email: student?.email || '',
        graduationYear: employment.graduation_year || student?.graduation_year || 'N/A',
        program: employment.program || student?.program_name || 'N/A',
        jobTitle: employment.job_title || 'N/A',
        startDate: employment.start_date || 'N/A',
        location: employment.location || 'N/A',
        status: employment.status || 'Pending',
        photoPath: photoPath,
      };
    });

    res.json({ employees: enriched });
  } catch (error) {
    console.error('Failed to load alumni employees', error);
    res.status(500).json({ error: 'Failed to load alumni employees.' });
  }
});

// Submit Employer Alumni Feedback
app.post('/api/employer/alumni-feedback', authenticateToken, authorizeRole('employer', 'admin'), (req, res) => {
  try {
    const { employer_key, role } = req.user || {};
    const { rating_overall, comment_overall, tech_strength_level, technologies, job_role, graduation_year, image_url } = req.body ?? {};

    // For employer role, require employer_key
    if (role === 'employer' && !employer_key) {
      return res.status(400).json({ error: 'Employer key not found in token. Please log out and log back in.' });
    }

    // For admin, allow them to specify employer_key in body, or use token's employer_key
    let targetEmployerKey = req.body.employer_key || employer_key;
    if (role === 'admin' && !targetEmployerKey) {
      const { rows: employers } = loadTableData('employers');
      if (employers && employers.length > 0) {
        targetEmployerKey = employers[0].employer_key;
      }
    }

    if (!targetEmployerKey || !rating_overall || !tech_strength_level || !technologies || !job_role || !graduation_year) {
      return res.status(400).json({ error: 'Employer key, rating, tech strength level, technologies, job role, and graduation year are required.' });
    }

    const feedbackPath = path.join(DATA_DIR, 'employer_alumni_feedback.csv');
    ensureDataDirectory();

    let feedbacks = [];
    const requiredColumns = ['feedback_id', 'employer_key', 'employer_name', 'rating_overall', 'comment_overall', 'tech_strength_level', 'technologies', 'job_role', 'graduation_year', 'image_url', 'created_at', 'approved_by_admin', 'submitted_via_portal'];
    
    if (fs.existsSync(feedbackPath)) {
      const csvContent = fs.readFileSync(feedbackPath, 'utf8');
      const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
      feedbacks = parsed.data;
      
      // Ensure all existing entries have image_url field (for backward compatibility)
      feedbacks = feedbacks.map(fb => ({
        ...fb,
        image_url: fb.image_url || '',
      }));
    }

    // Get employer name
    const { rows: employers } = loadTableData('employers');
    const employer = employers.find(emp => String(emp.employer_key) === String(targetEmployerKey));

    const feedback = {
      feedback_id: feedbacks.length + 1,
      employer_key: targetEmployerKey.toString(),
      employer_name: employer?.employer_name || 'Unknown',
      rating_overall: rating_overall.toString(),
      comment_overall: (comment_overall || '').trim(),
      tech_strength_level: tech_strength_level.trim(),
      technologies: (technologies || '').trim(),
      job_role: job_role.trim(),
      graduation_year: graduation_year.toString(),
      image_url: (image_url || '').trim(), // Store image URL if provided
      created_at: new Date().toISOString(),
      approved_by_admin: '0',
      submitted_via_portal: '1', // Mark as submitted through employer portal
    };

    feedbacks.push(feedback);
    
    // Ensure all columns are included in the CSV, even if some entries don't have them
    // Also ensure all existing entries have submitted_via_portal field set if missing
    feedbacks = feedbacks.map(fb => ({
      ...fb,
      submitted_via_portal: fb.submitted_via_portal || (fb.approved_by_admin === '0' ? '1' : '0'), // Set to '1' if pending, otherwise preserve or set to '0'
    }));
    
    const csv = Papa.unparse(feedbacks, { 
      header: true,
      columns: requiredColumns // Explicitly specify columns to ensure all fields are included
    });
    fs.writeFileSync(feedbackPath, csv, 'utf8');

    res.json({ message: 'Alumni feedback submitted successfully.' });
  } catch (error) {
    console.error('Failed to submit alumni feedback', error);
    res.status(500).json({ error: 'Failed to submit alumni feedback.' });
  }
});

// Get My Employer Alumni Feedback
app.get('/api/employer/my-feedback', authenticateToken, authorizeRole('employer', 'admin'), (req, res) => {
  try {
    const { employer_key, role } = req.user || {};

    // For employer role, require employer_key
    if (role === 'employer' && !employer_key) {
      return res.status(400).json({ error: 'Employer key not found in token. Please log out and log back in.' });
    }

    // For admin, allow them to specify employer_key in query, or use token's employer_key
    let targetEmployerKey = req.query.employer_key || employer_key;
    if (role === 'admin' && !targetEmployerKey) {
      const { rows: employers } = loadTableData('employers');
      if (employers && employers.length > 0) {
        targetEmployerKey = employers[0].employer_key;
      }
    }

    if (!targetEmployerKey) {
      return res.status(400).json({ error: 'Employer key is required.' });
    }

    const feedbackPath = path.join(DATA_DIR, 'employer_alumni_feedback.csv');
    if (!fs.existsSync(feedbackPath)) {
      return res.json({ feedbacks: [] });
    }

    const csvContent = fs.readFileSync(feedbackPath, 'utf8');
    const feedbacks = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;

    // Filter by employer_key
    const myFeedbacks = feedbacks.filter(fb => String(fb.employer_key) === String(targetEmployerKey));

    // Sort by created_at descending (newest first)
    myFeedbacks.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });

    res.json({ feedbacks: myFeedbacks });
  } catch (error) {
    console.error('Failed to load my feedback', error);
    res.status(500).json({ error: 'Failed to load my feedback.' });
  }
});

// Report Alumni Employment Issue
app.post('/api/employer/alumni-employment-issues', authenticateToken, authorizeRole('employer', 'admin'), (req, res) => {
  try {
    const { employer_key, role } = req.user || {};
    const { alumni_id, issue_type, comments } = req.body ?? {};

    // For employer role, require employer_key
    if (role === 'employer' && !employer_key) {
      return res.status(400).json({ error: 'Employer key not found in token. Please log out and log back in.' });
    }

    // For admin, allow them to specify employer_key in body, or use token's employer_key
    let targetEmployerKey = req.body.employer_key || employer_key;
    if (role === 'admin' && !targetEmployerKey) {
      const { rows: employers } = loadTableData('employers');
      if (employers && employers.length > 0) {
        targetEmployerKey = employers[0].employer_key;
      }
    }

    if (!targetEmployerKey || !alumni_id || !issue_type) {
      return res.status(400).json({ error: 'Employer key, alumni ID, and issue type are required.' });
    }

    const issuesPath = path.join(DATA_DIR, 'employer_alumni_employment_issues.csv');
    ensureDataDirectory();

    let issues = [];
    if (fs.existsSync(issuesPath)) {
      const csvContent = fs.readFileSync(issuesPath, 'utf8');
      issues = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    }

    // Get employer name
    const { rows: employers } = loadTableData('employers');
    const employer = employers.find(emp => String(emp.employer_key) === String(targetEmployerKey));

    const issue = {
      issue_id: issues.length + 1,
      employer_key: targetEmployerKey.toString(),
      employer_name: employer?.employer_name || 'Unknown',
      alumni_id: alumni_id.toString(),
      issue_type: issue_type.trim(),
      comments: (comments || '').trim(),
      status: 'Pending',
      created_at: new Date().toISOString(),
      resolved_at: '',
    };

    issues.push(issue);
    const csv = Papa.unparse(issues, { header: true });
    fs.writeFileSync(issuesPath, csv, 'utf8');

    res.json({ message: 'Issue reported successfully. SLU administrators will review it.' });
  } catch (error) {
    console.error('Failed to report issue', error);
    res.status(500).json({ error: 'Failed to report issue.' });
  }
});

// ============================================
// ADMIN ENDPOINTS FOR EMPLOYER DATA
// ============================================

// Get alumni submissions (event applications, success stories, engagement feedback)
app.get('/api/admin/alumni-submissions', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { type } = req.query ?? {};
    
    if (type === 'event-applications') {
      const applicationsPath = path.join(DATA_DIR, 'event_applications.csv');
      if (!fs.existsSync(applicationsPath)) {
        return res.json({ submissions: [] });
      }
      const csvContent = fs.readFileSync(applicationsPath, 'utf8');
      const applications = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      return res.json({ submissions: applications });
    }
    
    if (type === 'success-stories') {
      const storiesPath = path.join(DATA_DIR, 'success_stories.csv');
      if (!fs.existsSync(storiesPath)) {
        return res.json({ submissions: [] });
      }
      const csvContent = fs.readFileSync(storiesPath, 'utf8');
      const stories = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      return res.json({ submissions: stories });
    }
    
    if (type === 'engagement-feedback') {
      const feedbackPath = path.join(DATA_DIR, 'engagement_feedback.csv');
      if (!fs.existsSync(feedbackPath)) {
        return res.json({ submissions: [] });
      }
      const csvContent = fs.readFileSync(feedbackPath, 'utf8');
      const feedbacks = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      
      // Join with fact_alumni_engagement to get student_key
      const { rows } = loadTableData('alumniEngagement');
      const enrichedFeedbacks = feedbacks.map(fb => {
        const engagement = rows.find(e => String(e.fact_id) === String(fb.fact_id));
        return {
          ...fb,
          student_key: engagement?.student_key || '',
        };
      });
      
      return res.json({ 
        submissions: enrichedFeedbacks,
        engagements: rows.slice(-50) // Last 50 engagements for context
      });
    }
    
    // Return all types
    const applicationsPath = path.join(DATA_DIR, 'event_applications.csv');
    const storiesPath = path.join(DATA_DIR, 'success_stories.csv');
    const feedbackPath = path.join(DATA_DIR, 'engagement_feedback.csv');
    
    const result = {
      eventApplications: [],
      successStories: [],
      engagementFeedback: [],
    };
    
    if (fs.existsSync(applicationsPath)) {
      const csvContent = fs.readFileSync(applicationsPath, 'utf8');
      result.eventApplications = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    }
    
    if (fs.existsSync(storiesPath)) {
      const csvContent = fs.readFileSync(storiesPath, 'utf8');
      result.successStories = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    }
    
    if (fs.existsSync(feedbackPath)) {
      const csvContent = fs.readFileSync(feedbackPath, 'utf8');
      result.engagementFeedback = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    }
    
    res.json(result);
  } catch (error) {
    console.error('Failed to load alumni submissions', error);
    res.status(500).json({ error: 'Failed to load alumni submissions.' });
  }
});

// Get my own submissions (for alumni users)
app.get('/api/alumni/my-submissions', authenticateToken, authorizeRole('alumni', 'admin'), (req, res) => {
  try {
    const { student_key, role } = req.user || {};
    const { type } = req.query ?? {};
    
    console.log('GET /api/alumni/my-submissions - user:', { role, student_key, type });
    
    // For alumni role, require student_key
    if (role === 'alumni' && !student_key) {
      console.log('Missing student_key for alumni user');
      return res.status(400).json({ error: 'Student key not found in token. Please log out and log back in.' });
    }
    
    // For admin, allow them to specify student_key in query, or use token's student_key
    let targetStudentKey = req.query.student_key || student_key;
    if (role === 'admin' && !targetStudentKey) {
      const { rows: students } = loadTableData('students');
      if (students && students.length > 0) {
        targetStudentKey = students[0].student_key;
      }
    }
    
    if (!targetStudentKey) {
      console.log('No targetStudentKey found');
      return res.status(400).json({ error: 'Student key is required.' });
    }
    
    console.log('Filtering submissions for student_key:', targetStudentKey);
    
    if (type === 'event-applications') {
      const applicationsPath = path.join(DATA_DIR, 'event_applications.csv');
      if (!fs.existsSync(applicationsPath)) {
        console.log('event_applications.csv not found');
        return res.json({ submissions: [] });
      }
      const csvContent = fs.readFileSync(applicationsPath, 'utf8');
      const applications = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      console.log(`Found ${applications.length} total event applications`);
      console.log('Sample application keys:', applications.slice(0, 3).map(app => ({ 
        application_id: app.application_id, 
        student_key: app.student_key,
        email: app.email 
      })));
      // Try to match by student_key first
      let myApplications = applications.filter(app => {
        const appStudentKey = (app.student_key || '').toString().trim();
        const targetKey = targetStudentKey.toString().trim();
        const match = appStudentKey === targetKey;
        if (match) {
          console.log(`Matched application ${app.application_id} by student_key: ${appStudentKey}`);
        }
        return match;
      });
      
      console.log(`Found ${myApplications.length} applications matching student_key ${targetStudentKey}`);
      
      // If no matches and we have student data, try to match by email for old records
      if (myApplications.length === 0) {
        try {
          const { rows: students } = loadTableData('students');
          const student = students.find(s => String(s.student_key) === String(targetStudentKey));
          if (student && student.email) {
            console.log(`Trying email fallback for student_key ${targetStudentKey}, email: ${student.email}`);
            const studentEmail = (student.email || '').toLowerCase().trim();
            myApplications = applications.filter(app => {
              const appEmail = (app.email || '').toLowerCase().trim();
              const appStudentKey = (app.student_key || '').toString().trim();
              const emailMatch = appEmail === studentEmail;
              const noStudentKey = !appStudentKey || appStudentKey === '';
              if (emailMatch && noStudentKey) {
                console.log(`Matched application ${app.application_id} by email: ${appEmail}`);
              }
              return emailMatch && noStudentKey;
            });
            // Update these records with student_key for future queries
            if (myApplications.length > 0) {
              console.log(`Found ${myApplications.length} applications by email, updating with student_key`);
              let updated = false;
              applications.forEach(app => {
                const appEmail = (app.email || '').toLowerCase().trim();
                const studentEmail = (student.email || '').toLowerCase().trim();
                const appStudentKey = (app.student_key || '').toString().trim();
                if (appEmail === studentEmail && (!appStudentKey || appStudentKey === '')) {
                  app.student_key = targetStudentKey.toString();
                  updated = true;
                }
              });
              // Save updated CSV
              if (updated) {
                const requiredColumns = ['application_id', 'student_key', 'event_key', 'full_name', 'email', 'phone', 'program', 'graduation_year', 'interest_reason', 'previous_attendance', 'submitted_at', 'status'];
                const updatedCsv = Papa.unparse(applications, { header: true, columns: requiredColumns });
                fs.writeFileSync(applicationsPath, updatedCsv, 'utf8');
                console.log('Updated event_applications.csv with student_key values');
              }
            }
          } else {
            console.log(`No student found with student_key ${targetStudentKey} for email fallback`);
          }
        } catch (error) {
          console.error('Error trying email fallback:', error);
        }
      }
      
      console.log(`Returning ${myApplications.length} applications for student_key ${targetStudentKey}`);
      return res.json({ submissions: myApplications });
    }
    
    if (type === 'success-stories') {
      const storiesPath = path.join(DATA_DIR, 'success_stories.csv');
      if (!fs.existsSync(storiesPath)) {
        return res.json({ submissions: [] });
      }
      const csvContent = fs.readFileSync(storiesPath, 'utf8');
      const stories = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      // Filter by student_key
      const myStories = stories.filter(story => String(story.student_key) === String(targetStudentKey));
      return res.json({ submissions: myStories });
    }
    
    if (type === 'engagement-feedback') {
      const feedbackPath = path.join(DATA_DIR, 'engagement_feedback.csv');
      if (!fs.existsSync(feedbackPath)) {
        return res.json({ submissions: [] });
      }
      const csvContent = fs.readFileSync(feedbackPath, 'utf8');
      const feedbacks = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      
      // Join with fact_alumni_engagement to get student_key and filter
      const { rows } = loadTableData('alumniEngagement');
      const enrichedFeedbacks = feedbacks.map(fb => {
        const engagement = rows.find(e => String(e.fact_id) === String(fb.fact_id));
        return {
          ...fb,
          student_key: engagement?.student_key || '',
        };
      }).filter(fb => String(fb.student_key) === String(targetStudentKey));
      
      return res.json({ submissions: enrichedFeedbacks });
    }
    
    // Return all types filtered by student_key
    const applicationsPath = path.join(DATA_DIR, 'event_applications.csv');
    const storiesPath = path.join(DATA_DIR, 'success_stories.csv');
    const feedbackPath = path.join(DATA_DIR, 'engagement_feedback.csv');
    
    const result = {
      eventApplications: [],
      successStories: [],
      engagementFeedback: [],
    };
    
    if (fs.existsSync(applicationsPath)) {
      const csvContent = fs.readFileSync(applicationsPath, 'utf8');
      const applications = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      console.log(`Found ${applications.length} total event applications`);
      console.log('Sample application keys:', applications.slice(0, 3).map(app => ({ 
        application_id: app.application_id, 
        student_key: app.student_key || '(missing)',
        email: app.email 
      })));
      
      // Try to match by student_key first
      let myApplications = applications.filter(app => {
        const appStudentKey = (app.student_key || '').toString().trim();
        const targetKey = targetStudentKey.toString().trim();
        const match = appStudentKey === targetKey;
        if (match) {
          console.log(`Matched application ${app.application_id} by student_key: ${appStudentKey}`);
        }
        return match;
      });
      
      console.log(`Found ${myApplications.length} applications matching student_key ${targetStudentKey}`);
      
      // If no matches and we have student data, try to match by email for old records
      if (myApplications.length === 0) {
        try {
          const { rows: students } = loadTableData('students');
          const student = students.find(s => String(s.student_key) === String(targetStudentKey));
          if (student && student.email) {
            console.log(`Trying email fallback for student_key ${targetStudentKey}, email: ${student.email}`);
            const studentEmail = (student.email || '').toLowerCase().trim();
            myApplications = applications.filter(app => {
              const appEmail = (app.email || '').toLowerCase().trim();
              const appStudentKey = (app.student_key || '').toString().trim();
              const emailMatch = appEmail === studentEmail;
              const noStudentKey = !appStudentKey || appStudentKey === '';
              if (emailMatch && noStudentKey) {
                console.log(`Matched application ${app.application_id} by email: ${appEmail}`);
              }
              return emailMatch && noStudentKey;
            });
            // Update these records with student_key for future queries
            if (myApplications.length > 0) {
              console.log(`Found ${myApplications.length} applications by email, updating with student_key`);
              let updated = false;
              applications.forEach(app => {
                const appEmail = (app.email || '').toLowerCase().trim();
                const studentEmail = (student.email || '').toLowerCase().trim();
                const appStudentKey = (app.student_key || '').toString().trim();
                if (appEmail === studentEmail && (!appStudentKey || appStudentKey === '')) {
                  app.student_key = targetStudentKey.toString();
                  updated = true;
                }
              });
              // Save updated CSV
              if (updated) {
                const requiredColumns = ['application_id', 'student_key', 'event_key', 'full_name', 'email', 'phone', 'program', 'graduation_year', 'interest_reason', 'previous_attendance', 'submitted_at', 'status'];
                const updatedCsv = Papa.unparse(applications, { header: true, columns: requiredColumns });
                fs.writeFileSync(applicationsPath, updatedCsv, 'utf8');
                console.log('Updated event_applications.csv with student_key values');
              }
            }
          } else {
            console.log(`No student found with student_key ${targetStudentKey} for email fallback`);
          }
        } catch (error) {
          console.error('Error trying email fallback:', error);
        }
      }
      
      result.eventApplications = myApplications;
      console.log(`Filtered to ${result.eventApplications.length} applications for student_key ${targetStudentKey}`);
    }
    
    if (fs.existsSync(storiesPath)) {
      const csvContent = fs.readFileSync(storiesPath, 'utf8');
      const stories = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      result.successStories = stories.filter(story => String(story.student_key) === String(targetStudentKey));
    }
    
    if (fs.existsSync(feedbackPath)) {
      const csvContent = fs.readFileSync(feedbackPath, 'utf8');
      const feedbacks = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      const { rows } = loadTableData('alumniEngagement');
      const enrichedFeedbacks = feedbacks.map(fb => {
        const engagement = rows.find(e => String(e.fact_id) === String(fb.fact_id));
        return {
          ...fb,
          student_key: engagement?.student_key || '',
        };
      }).filter(fb => String(fb.student_key) === String(targetStudentKey));
      result.engagementFeedback = enrichedFeedbacks;
    }
    
    res.json(result);
  } catch (error) {
    console.error('Failed to load my submissions', error);
    res.status(500).json({ error: 'Failed to load my submissions.' });
  }
});

// Get employer portal data (for admin)
app.get('/api/admin/employer-portal-data', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { type } = req.query ?? {};
    
    if (type === 'event-participation') {
      const participationPath = path.join(DATA_DIR, 'employer_event_participation.csv');
      if (!fs.existsSync(participationPath)) {
        return res.json({ participations: [] });
      }
      const csvContent = fs.readFileSync(participationPath, 'utf8');
      const participations = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      
      // Join with events and employers
      const { rows: events } = loadTableData('events');
      const { rows: employers } = loadTableData('employers');
      
      const enriched = participations.map(part => {
        const event = events.find(e => String(e.event_key) === String(part.event_key));
        const employer = employers.find(emp => String(emp.employer_key) === String(part.employer_key));
        return {
          ...part,
          event_name: event?.event_name || 'Unknown',
          employer_name: employer?.employer_name || 'Unknown',
        };
      });
      
      return res.json({ participations: enriched });
    }
    
    if (type === 'job-postings') {
      const postingsPath = path.join(DATA_DIR, 'employer_job_postings.csv');
      if (!fs.existsSync(postingsPath)) {
        return res.json({ postings: [] });
      }
      const csvContent = fs.readFileSync(postingsPath, 'utf8');
      const postings = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      
      // Join with employers
      const { rows: employers } = loadTableData('employers');
      const enriched = postings.map(posting => {
        const employer = employers.find(emp => String(emp.employer_key) === String(posting.employer_key));
        return {
          ...posting,
          employer_name: employer?.employer_name || 'Unknown',
        };
      });
      
      return res.json({ postings: enriched });
    }
    
    if (type === 'job-applications') {
      const applicationsPath = path.join(DATA_DIR, 'employer_job_applications.csv');
      if (!fs.existsSync(applicationsPath)) {
        return res.json({ applications: [] });
      }
      const csvContent = fs.readFileSync(applicationsPath, 'utf8');
      const applications = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      
      // Join with jobs, employers, and students
      const postingsPath = path.join(DATA_DIR, 'employer_job_postings.csv');
      let postings = [];
      if (fs.existsSync(postingsPath)) {
        const postingsContent = fs.readFileSync(postingsPath, 'utf8');
        postings = Papa.parse(postingsContent, { header: true, skipEmptyLines: true }).data;
      }
      
      const { rows: employers } = loadTableData('employers');
      const { rows: students } = loadTableData('students');
      
      const enriched = applications.map(app => {
        const job = postings.find(p => String(p.job_id) === String(app.job_id));
        const employer = employers.find(emp => String(emp.employer_key) === String(job?.employer_key));
        const candidate = students.find(s => String(s.student_key) === String(app.candidate_id));
        return {
          ...app,
          job_title: job?.job_title || 'Unknown',
          employer_name: employer?.employer_name || 'Unknown',
          candidate_name: candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Unknown',
        };
      });
      
      return res.json({ applications: enriched });
    }
    
    if (type === 'success-stories') {
      const storiesPath = path.join(DATA_DIR, 'employer_success_stories.csv');
      if (!fs.existsSync(storiesPath)) {
        return res.json({ stories: [] });
      }
      const csvContent = fs.readFileSync(storiesPath, 'utf8');
      const stories = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      return res.json({ stories });
    }
    
    // Return all types
    const participationPath = path.join(DATA_DIR, 'employer_event_participation.csv');
    const postingsPath = path.join(DATA_DIR, 'employer_job_postings.csv');
    const applicationsPath = path.join(DATA_DIR, 'employer_job_applications.csv');
    const storiesPath = path.join(DATA_DIR, 'employer_success_stories.csv');
    
    const result = {
      eventParticipations: [],
      jobPostings: [],
      jobApplications: [],
      successStories: [],
    };
    
    if (fs.existsSync(participationPath)) {
      const csvContent = fs.readFileSync(participationPath, 'utf8');
      result.eventParticipations = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    }
    
    if (fs.existsSync(postingsPath)) {
      const csvContent = fs.readFileSync(postingsPath, 'utf8');
      result.jobPostings = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    }
    
    if (fs.existsSync(applicationsPath)) {
      const csvContent = fs.readFileSync(applicationsPath, 'utf8');
      result.jobApplications = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    }
    
    if (fs.existsSync(storiesPath)) {
      const csvContent = fs.readFileSync(storiesPath, 'utf8');
      result.successStories = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    }
    
    res.json(result);
  } catch (error) {
    console.error('Failed to load employer portal data', error);
    res.status(500).json({ error: 'Failed to load employer portal data.' });
  }
});

// Update employer event participation status (admin)
app.patch('/api/admin/employer-event-participation/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { participation_status } = req.body ?? {};
    
    if (!participation_status || !['Requested', 'Approved', 'Rejected', 'Completed'].includes(participation_status)) {
      return res.status(400).json({ error: 'Valid participation status is required.' });
    }
    
    const participationPath = path.join(DATA_DIR, 'employer_event_participation.csv');
    if (!fs.existsSync(participationPath)) {
      return res.status(404).json({ error: 'Participations file not found.' });
    }
    
    const csvContent = fs.readFileSync(participationPath, 'utf8');
    const participations = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    
    const participation = participations.find(p => String(p.id) === String(id));
    if (!participation) {
      return res.status(404).json({ error: 'Participation not found.' });
    }
    
    participation.participation_status = participation_status;
    participation.updated_at = new Date().toISOString();
    
    const csv = Papa.unparse(participations, { header: true });
    fs.writeFileSync(participationPath, csv, 'utf8');
    
    res.json({ message: 'Participation status updated successfully.' });
  } catch (error) {
    console.error('Failed to update participation status', error);
    res.status(500).json({ error: 'Failed to update participation status.' });
  }
});

// Get Employer Alumni Feedback (admin)
app.get('/api/admin/alumni-feedback', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { graduation_year, technologies, job_role, tech_strength_level, include_pending } = req.query ?? {};
    
    const feedbackPath = path.join(DATA_DIR, 'employer_alumni_feedback.csv');
    if (!fs.existsSync(feedbackPath)) {
      return res.json({ feedbacks: [] });
    }
    
    const csvContent = fs.readFileSync(feedbackPath, 'utf8');
    let feedbacks = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    
    // Clean up data - remove quotes if present
    feedbacks = feedbacks.map(f => {
      const clean = (val) => {
        if (!val) return '';
        let str = String(val).trim();
        if (str.startsWith('"') && str.endsWith('"')) {
          str = str.slice(1, -1).replace(/""/g, '"');
        }
        return str;
      };
      return {
        feedback_id: clean(f.feedback_id),
        employer_key: clean(f.employer_key),
        employer_name: clean(f.employer_name),
        rating_overall: clean(f.rating_overall),
        comment_overall: clean(f.comment_overall),
        tech_strength_level: clean(f.tech_strength_level),
        technologies: clean(f.technologies),
        job_role: clean(f.job_role),
        graduation_year: clean(f.graduation_year),
        created_at: clean(f.created_at),
        approved_by_admin: clean(f.approved_by_admin),
        submitted_via_portal: clean(f.submitted_via_portal || '0'), // Default to '0' for backward compatibility
      };
    });
    
    // Filter to only show feedback submitted through employer portal (for both tabs)
    // This ensures all data comes from the employer portal, not pre-loaded CSV data
    feedbacks = feedbacks.filter(f => {
      const viaPortal = String(f.submitted_via_portal || '').trim();
      const createdAt = String(f.created_at || '').trim();
      const approvedStatus = String(f.approved_by_admin || '').trim();
      
      // Show feedback that was explicitly marked as portal submission
      if (viaPortal === '1' || viaPortal === 'true') {
        return true;
      }
      
      // If it's pending (approved_by_admin = '0'), it's definitely from portal
      if (approvedStatus === '0' || approvedStatus === 'false') {
        return true; // Pending submissions are definitely from portal
      }
      
      // Check if created_at has ISO format with milliseconds (portal submissions have this)
      // Portal submissions use new Date().toISOString() which includes milliseconds like "2025-11-19T23:40:56.657Z"
      // Pre-loaded data typically has simpler date formats like "2024-01-15T10:00:00Z" (no milliseconds)
      if (createdAt.includes('T') && createdAt.includes('Z')) {
        // If it has milliseconds (contains '.' before 'Z'), it's from portal
        if (createdAt.includes('.') && createdAt.indexOf('.') < createdAt.indexOf('Z')) {
          return true;
        }
        
        // If it's a recent submission (after Oct 2024), it's likely from portal
        // This catches entries that were submitted via portal but submitted_via_portal field wasn't saved correctly
        try {
          const createdDate = new Date(createdAt);
          const portalStartDate = new Date('2024-10-01T00:00:00Z');
          if (createdDate >= portalStartDate && !isNaN(createdDate.getTime())) {
            return true; // Likely a portal submission (recent date format suggests portal)
          }
        } catch (e) {
          // Invalid date, skip
        }
      }
      
      return false; // Not a portal submission
    });
    
    console.log(`After portal filter: ${feedbacks.length} portal submissions found`);
    
    // If include_pending is true, show all feedback (for admin review in Employer Submissions tab)
    // This includes both pending (approved_by_admin = '0') and approved (approved_by_admin = '1') portal submissions
    // Otherwise, show only approved feedback (for the Employer Feedback tab)
    if (include_pending !== 'true' && include_pending !== '1') {
      // Filter to show only approved feedback (approved_by_admin = '1' or 1)
      feedbacks = feedbacks.filter(f => {
        const approved = String(f.approved_by_admin || '').trim();
        return approved === '1' || approved === 'true';
      });
    }
    // When include_pending=true, we show ALL portal submissions (both pending and approved)
    // This allows admins to see and manage all employer-submitted feedback
    
    // Portal filtering is now done above for both tabs
    // When include_pending=true (Employer Submissions tab), show all portal submissions (approved + pending)
    // When include_pending=false (Employer Feedback tab), show only approved portal submissions
    
    // Filter out test/dummy entries - only show real employer feedback
    // Note: We only filter obvious test patterns, but keep "Company 1" entries since they're legitimate portal submissions
    // When include_pending=true (Employer Submissions tab), we DON'T filter test data
    // so admins can review and reject test submissions. Test data filters apply to approved feedback view but are lenient.
    if (include_pending !== 'true' && include_pending !== '1') {
      // Filter obvious test data when viewing approved feedback (Employer Feedback tab)
      // But keep entries from "Company 1" as they're legitimate portal submissions
      feedbacks = feedbacks.filter(f => {
        const jobRole = (f.job_role || '').toLowerCase().trim();
        const technologies = (f.technologies || '').toLowerCase().trim();
        const employerName = (f.employer_name || '').toLowerCase().trim();
        const comment = (f.comment_overall || '').toLowerCase().trim();
        
        // Exclude entries with test patterns in job role
        const testJobRolePatterns = [
          /^fsd\d+$/i,           // FSD12344, FSD123, etc.
          /^java\s*deve$/i,      // java deve (incomplete)
          /java\s*deve/i,         // java deve anywhere
          /^java\d+$/i,          // java123, java456, etc.
          /^\d+$/i,               // Just numbers like 12344
          /^test/i,              // test, testing, etc.
          /^dummy/i,              // dummy, dummy data, etc.
          /^sample/i,             // sample, sample data, etc.
          /^123/i,                // 123, 12344, etc.
          /^abc/i,                // abc, abc123, etc.
        ];
        
        // Exclude entries with test patterns in technologies
        const testTechPatterns = [
          /^java\d+$/i,          // java123, java456, etc.
          /^123/i,                // 123, 12344, etc.
          /^test/i,              // test, testing, etc.
        ];
        
        // Check if job role contains test patterns
        const hasTestJobRole = testJobRolePatterns.some(pattern => pattern.test(jobRole));
        
        // Check if technologies contain test patterns
        const hasTestTechnologies = testTechPatterns.some(pattern => pattern.test(technologies));
        
      // Don't exclude "Company 1" - it's a legitimate employer with portal submissions
      // Only exclude obviously fake employer names
      const isTestEmployer = (employerName.length < 2) || 
                            (/^test/i.test(employerName) && employerName !== 'Company 1') ||
                            (/^dummy/i.test(employerName));
        
        // Exclude entries with suspicious comments (like just numbers)
        const isTestComment = /^\d+$/.test(comment) || (comment.length > 0 && comment.length < 5);
        
        // Exclude entries with very short technologies (like "AI" alone, "java" alone)
        const techWords = technologies.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
        const hasOnlySingleWordTech = techWords.length === 1 && (techWords[0] === 'ai' || techWords[0] === 'java' || techWords[0].length < 3);
        
        // Exception: Don't filter out "Company 1" entries - they're legitimate portal submissions
        const isCompany1 = employerName.toLowerCase() === 'company 1';
        
        // Exclude if any test pattern matches, but allow "Company 1" entries
        if (!isCompany1 && (hasTestJobRole || hasTestTechnologies || isTestEmployer || isTestComment || hasOnlySingleWordTech)) {
          return false;
        }
        
        // Exclude entries with very short job roles (less than 3 characters), but allow "Company 1"
        if (!isCompany1 && jobRole.length < 3) {
          return false;
        }
        
        // Exclude entries with incomplete job roles (like "java deve" instead of "java developer"), but allow "Company 1"
        if (!isCompany1 && jobRole.includes('deve') && !jobRole.includes('developer') && !jobRole.includes('development')) {
          return false;
        }
        
        return true;
      });
      
      console.log(`Found ${feedbacks.length} approved and valid feedback entries after filtering test data`);
      
      // Additional validation: Ensure all entries have valid employer names (not test patterns)
      // But keep "Company 1" as it's a legitimate employer with portal submissions
      feedbacks = feedbacks.filter(f => {
        const employerName = (f.employer_name || '').trim();
        // Only show entries from real companies
        // Keep "Company 1" as it's a legitimate employer with portal submissions
        const isRealCompany = employerName.length >= 3 && 
                              (employerName.toLowerCase() === 'company 1' || 
                               (!/^test/i.test(employerName) && !/^dummy/i.test(employerName)));
        return isRealCompany;
      });
      
      console.log(`Final count after company validation: ${feedbacks.length} feedback entries`);
    } else {
      // For Employer Submissions tab (include_pending=true), don't filter test data
      // so admins can see and review all portal submissions, including test entries
      console.log(`Found ${feedbacks.length} portal feedback entries (including pending for admin review)`);
    }
    
    // Apply filters
    if (graduation_year) {
      feedbacks = feedbacks.filter(f => String(f.graduation_year) === String(graduation_year));
    }
    
    if (technologies) {
      const techLower = technologies.toLowerCase();
      feedbacks = feedbacks.filter(f => 
        (f.technologies || '').toLowerCase().includes(techLower)
      );
    }
    
    if (job_role) {
      const roleLower = job_role.toLowerCase();
      feedbacks = feedbacks.filter(f => 
        (f.job_role || '').toLowerCase().includes(roleLower)
      );
    }
    
    if (tech_strength_level) {
      feedbacks = feedbacks.filter(f => 
        String(f.tech_strength_level).toLowerCase() === String(tech_strength_level).toLowerCase()
      );
    }
    
    // Sort by created_at descending (newest first)
    feedbacks.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });
    
    console.log(`Returning ${feedbacks.length} feedback entries after filtering`);
    res.json({ feedbacks });
  } catch (error) {
    console.error('Failed to load alumni feedback', error);
    res.status(500).json({ error: 'Failed to load alumni feedback.' });
  }
});

// Approve employer success story (admin)
app.patch('/api/admin/employer-success-stories/:id/approve', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    
    const storiesPath = path.join(DATA_DIR, 'employer_success_stories.csv');
    if (!fs.existsSync(storiesPath)) {
      return res.status(404).json({ error: 'Stories file not found.' });
    }
    
    const csvContent = fs.readFileSync(storiesPath, 'utf8');
    const stories = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    
    const story = stories.find(s => String(s.story_id) === String(id));
    if (!story) {
      return res.status(404).json({ error: 'Story not found.' });
    }
    
    story.approved_by_admin = '1';
    story.published_at = new Date().toISOString();
    
    const csv = Papa.unparse(stories, { header: true });
    fs.writeFileSync(storiesPath, csv, 'utf8');
    
    res.json({ message: 'Story approved successfully.' });
  } catch (error) {
    console.error('Failed to approve story', error);
    res.status(500).json({ error: 'Failed to approve story.' });
  }
});

// Approve/Reject employer alumni feedback (admin)
app.patch('/api/admin/alumni-feedback/:id/approve', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body ?? {};
    
    const feedbackPath = path.join(DATA_DIR, 'employer_alumni_feedback.csv');
    if (!fs.existsSync(feedbackPath)) {
      return res.status(404).json({ error: 'Feedback file not found.' });
    }
    
    const csvContent = fs.readFileSync(feedbackPath, 'utf8');
    const feedbacks = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    
    const feedback = feedbacks.find(f => String(f.feedback_id) === String(id));
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found.' });
    }
    
    feedback.approved_by_admin = approved ? '1' : '0';
    const csv = Papa.unparse(feedbacks, { header: true });
    fs.writeFileSync(feedbackPath, csv, 'utf8');
    
    res.json({ message: `Feedback ${approved ? 'approved' : 'rejected'} successfully.` });
  } catch (error) {
    console.error('Failed to update feedback approval', error);
    res.status(500).json({ error: 'Failed to update feedback approval.' });
  }
});

// Update Employer Alumni Feedback (full record update)
app.put('/api/admin/alumni-feedback/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body ?? {};
    
    const feedbackPath = path.join(DATA_DIR, 'employer_alumni_feedback.csv');
    if (!fs.existsSync(feedbackPath)) {
      return res.status(404).json({ error: 'Feedback file not found.' });
    }
    
    const csvContent = fs.readFileSync(feedbackPath, 'utf8');
    let feedbacks = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    
    // Ensure image_url field exists for all entries
    feedbacks = feedbacks.map(fb => ({
      ...fb,
      image_url: fb.image_url || '',
    }));
    
    const feedback = feedbacks.find(f => String(f.feedback_id) === String(id));
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found.' });
    }
    
    // Update allowed fields
    const allowedFields = ['rating_overall', 'comment_overall', 'tech_strength_level', 'technologies', 'job_role', 'graduation_year', 'image_url', 'approved_by_admin'];
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        feedback[key] = updates[key] !== undefined ? String(updates[key]).trim() : '';
      }
    });
    
    // Ensure required columns are present
    const requiredColumns = ['feedback_id', 'employer_key', 'employer_name', 'rating_overall', 'comment_overall', 'tech_strength_level', 'technologies', 'job_role', 'graduation_year', 'image_url', 'created_at', 'approved_by_admin', 'submitted_via_portal'];
    const csv = Papa.unparse(feedbacks, { 
      header: true,
      columns: requiredColumns
    });
    fs.writeFileSync(feedbackPath, csv, 'utf8');
    
    res.json({ message: 'Feedback updated successfully.', feedback });
  } catch (error) {
    console.error('Failed to update feedback', error);
    res.status(500).json({ error: 'Failed to update feedback.' });
  }
});

// Delete employer feedback (admin only)
app.delete('/api/admin/alumni-feedback/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { id } = req.params;
    
    const feedbackPath = path.join(DATA_DIR, 'employer_alumni_feedback.csv');
    if (!fs.existsSync(feedbackPath)) {
      return res.status(404).json({ error: 'Feedback file not found.' });
    }
    
    const csvContent = fs.readFileSync(feedbackPath, 'utf8');
    const feedbacks = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    
    const feedback = feedbacks.find(fb => String(fb.feedback_id) === String(id));
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found.' });
    }
    
    // Delete associated image if exists
    if (feedback.image_url && feedback.image_url.trim() !== '') {
      try {
        const imagePath = path.join(__dirname, '..', 'public', feedback.image_url);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`Deleted image: ${imagePath}`);
        }
      } catch (imageError) {
        console.warn('Failed to delete associated image:', imageError);
        // Continue with feedback deletion even if image deletion fails
      }
    }
    
    const filtered = feedbacks.filter(fb => String(fb.feedback_id) !== String(id));
    const csv = Papa.unparse(filtered, { header: true });
    fs.writeFileSync(feedbackPath, csv, 'utf8');
    
    res.json({ message: 'Feedback deleted successfully.' });
  } catch (error) {
    console.error('Failed to delete feedback', error);
    res.status(500).json({ error: 'Failed to delete feedback.' });
  }
});

// Update submission status (approve/reject)
app.put('/api/admin/alumni-submissions/:type/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { type, id } = req.params;
    const { status } = req.body ?? {};
    
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (pending, approved, rejected).' });
    }
    
    if (type === 'event-applications') {
      const applicationsPath = path.join(DATA_DIR, 'event_applications.csv');
      if (!fs.existsSync(applicationsPath)) {
        return res.status(404).json({ error: 'Applications file not found.' });
      }
      const csvContent = fs.readFileSync(applicationsPath, 'utf8');
      const applications = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      
      const application = applications.find(app => app.application_id === id);
      if (!application) {
        return res.status(404).json({ error: 'Application not found.' });
      }
      
      application.status = status;
      const csv = Papa.unparse(applications, { header: true });
      fs.writeFileSync(applicationsPath, csv, 'utf8');
      
      return res.json({ message: 'Application status updated successfully.' });
    }
    
    if (type === 'success-stories') {
      const storiesPath = path.join(DATA_DIR, 'success_stories.csv');
      if (!fs.existsSync(storiesPath)) {
        return res.status(404).json({ error: 'Stories file not found.' });
      }
      const csvContent = fs.readFileSync(storiesPath, 'utf8');
      const stories = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      
      const story = stories.find(s => s.story_id === id);
      if (!story) {
        return res.status(404).json({ error: 'Story not found.' });
      }
      
      story.status = status;
      const csv = Papa.unparse(stories, { header: true });
      fs.writeFileSync(storiesPath, csv, 'utf8');
      
      return res.json({ message: 'Story status updated successfully.' });
    }
    
    res.status(400).json({ error: 'Invalid submission type.' });
  } catch (error) {
    console.error('Failed to update submission status', error);
    res.status(500).json({ error: 'Failed to update submission status.' });
  }
});

// Update Alumni Submission (full record update, not just status)
app.patch('/api/admin/alumni-submissions/:type/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { type, id } = req.params;
    const updates = req.body ?? {};
    
    if (type === 'event-applications') {
      const applicationsPath = path.join(DATA_DIR, 'event_applications.csv');
      if (!fs.existsSync(applicationsPath)) {
        return res.status(404).json({ error: 'Applications file not found.' });
      }
      const csvContent = fs.readFileSync(applicationsPath, 'utf8');
      const applications = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      
      const application = applications.find(app => String(app.application_id) === String(id));
      if (!application) {
        return res.status(404).json({ error: 'Application not found.' });
      }
      
      // Update allowed fields
      const allowedFields = ['full_name', 'email', 'phone', 'program', 'graduation_year', 'interest_reason', 'previous_attendance', 'status'];
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          application[key] = updates[key] !== undefined ? String(updates[key]).trim() : '';
        }
      });
      
      const csv = Papa.unparse(applications, { header: true });
      fs.writeFileSync(applicationsPath, csv, 'utf8');
      
      return res.json({ message: 'Application updated successfully.', application });
    }
    
    if (type === 'success-stories') {
      const storiesPath = path.join(DATA_DIR, 'success_stories.csv');
      if (!fs.existsSync(storiesPath)) {
        return res.status(404).json({ error: 'Stories file not found.' });
      }
      const csvContent = fs.readFileSync(storiesPath, 'utf8');
      const stories = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      
      const story = stories.find(s => String(s.story_id) === String(id));
      if (!story) {
        return res.status(404).json({ error: 'Story not found.' });
      }
      
      // Update allowed fields
      const allowedFields = ['full_name', 'program', 'graduation_year', 'current_role', 'employer_name', 'story_title', 'story_content', 'achievements', 'photo_url', 'status'];
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          story[key] = updates[key] !== undefined ? String(updates[key]).trim() : '';
        }
      });
      
      const csv = Papa.unparse(stories, { header: true });
      fs.writeFileSync(storiesPath, csv, 'utf8');
      
      return res.json({ message: 'Story updated successfully.', story });
    }
    
    if (type === 'engagement-feedback') {
      const feedbackPath = path.join(DATA_DIR, 'engagement_feedback.csv');
      if (!fs.existsSync(feedbackPath)) {
        return res.status(404).json({ error: 'Feedback file not found.' });
      }
      const csvContent = fs.readFileSync(feedbackPath, 'utf8');
      const feedbacks = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      
      const feedback = feedbacks.find(fb => String(fb.fact_id) === String(id) || String(fb.feedback_id) === String(id));
      if (!feedback) {
        return res.status(404).json({ error: 'Feedback not found.' });
      }
      
      // Update allowed fields
      const allowedFields = ['feedback_notes'];
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          feedback[key] = updates[key] !== undefined ? String(updates[key]).trim() : '';
        }
      });
      
      const csv = Papa.unparse(feedbacks, { header: true });
      fs.writeFileSync(feedbackPath, csv, 'utf8');
      
      return res.json({ message: 'Feedback updated successfully.', feedback });
    }
    
    res.status(400).json({ error: 'Invalid submission type.' });
  } catch (error) {
    console.error('Failed to update submission', error);
    res.status(500).json({ error: 'Failed to update submission.' });
  }
});

// Delete submission (admin, alumni, or employer can delete their own)
app.delete('/api/submissions/:type/:id', authenticateToken, (req, res) => {
  try {
    const { type, id } = req.params;
    const { role, student_key, employer_key } = req.user || {};

    if (!type || !id) {
      return res.status(400).json({ error: 'Type and ID are required.' });
    }

    if (type === 'event-applications') {
      const applicationsPath = path.join(DATA_DIR, 'event_applications.csv');
      if (!fs.existsSync(applicationsPath)) {
        return res.status(404).json({ error: 'Applications file not found.' });
      }
      const csvContent = fs.readFileSync(applicationsPath, 'utf8');
      const applications = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      
      const application = applications.find(a => String(a.application_id) === String(id));
      if (!application) {
        return res.status(404).json({ error: 'Application not found.' });
      }

      // Check permissions: admin can delete any, alumni can delete their own
      if (role !== 'admin') {
        if (role === 'alumni' && String(application.student_key) !== String(student_key)) {
          return res.status(403).json({ error: 'You can only delete your own submissions.' });
        } else if (role !== 'alumni') {
          return res.status(403).json({ error: 'Unauthorized.' });
        }
      }

      const filtered = applications.filter(a => String(a.application_id) !== String(id));
      const csv = Papa.unparse(filtered, { header: true });
      fs.writeFileSync(applicationsPath, csv, 'utf8');
      
      return res.json({ message: 'Application deleted successfully.' });
    }
    
    if (type === 'success-stories') {
      const storiesPath = path.join(DATA_DIR, 'success_stories.csv');
      if (!fs.existsSync(storiesPath)) {
        return res.status(404).json({ error: 'Stories file not found.' });
      }
      const csvContent = fs.readFileSync(storiesPath, 'utf8');
      const stories = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      
      const story = stories.find(s => String(s.story_id) === String(id));
      if (!story) {
        return res.status(404).json({ error: 'Story not found.' });
      }

      // Check permissions: admin can delete any, alumni can delete their own
      if (role !== 'admin') {
        if (role === 'alumni' && String(story.student_key) !== String(student_key)) {
          return res.status(403).json({ error: 'You can only delete your own submissions.' });
        } else if (role !== 'alumni') {
          return res.status(403).json({ error: 'Unauthorized.' });
        }
      }

      const filtered = stories.filter(s => String(s.story_id) !== String(id));
      const csv = Papa.unparse(filtered, { header: true });
      fs.writeFileSync(storiesPath, csv, 'utf8');
      
      return res.json({ message: 'Story deleted successfully.' });
    }
    
    if (type === 'engagement-feedback') {
      const feedbackPath = path.join(DATA_DIR, 'engagement_feedback.csv');
      if (!fs.existsSync(feedbackPath)) {
        return res.status(404).json({ error: 'Feedback file not found.' });
      }
      const csvContent = fs.readFileSync(feedbackPath, 'utf8');
      const feedbacks = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
      
      // Try to find by feedback_id first, then fact_id
      const feedback = feedbacks.find(f => 
        String(f.feedback_id) === String(id) || String(f.fact_id) === String(id)
      );
      if (!feedback) {
        return res.status(404).json({ error: 'Feedback not found.' });
      }

      // Check permissions: admin can delete any, alumni can delete their own
      // For engagement feedback, we need to check the fact_alumni_engagement table for student_key
      if (role !== 'admin') {
        if (role === 'alumni') {
          // Check if this feedback belongs to the student
          const { rows: engagements } = loadTableData('alumniEngagement');
          const engagement = engagements.find(e => String(e.fact_id) === String(feedback.fact_id || feedback.feedback_id));
          if (engagement && String(engagement.student_key) !== String(student_key)) {
            return res.status(403).json({ error: 'You can only delete your own submissions.' });
          }
        } else {
          return res.status(403).json({ error: 'Unauthorized.' });
        }
      }

      const filtered = feedbacks.filter(f => 
        String(f.feedback_id) !== String(id) && String(f.fact_id) !== String(id)
      );
      const csv = Papa.unparse(filtered, { header: true });
      fs.writeFileSync(feedbackPath, csv, 'utf8');
      
      return res.json({ message: 'Feedback deleted successfully.' });
    }
    
    res.status(400).json({ error: 'Invalid submission type.' });
  } catch (error) {
    console.error('Failed to delete submission', error);
    res.status(500).json({ error: 'Failed to delete submission.' });
  }
});

// Get approved success stories (for Gallery and Alumni Portal)
app.get('/api/success-stories/approved', (req, res) => {
  try {
    const storiesPath = path.join(DATA_DIR, 'success_stories.csv');
    if (!fs.existsSync(storiesPath)) {
      return res.json({ stories: [] });
    }
    const csvContent = fs.readFileSync(storiesPath, 'utf8');
    const stories = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    
    // Filter only approved stories
    const approved = stories.filter(s => s.status === 'approved');
    
    res.json({ stories: approved });
  } catch (error) {
    console.error('Failed to load approved success stories', error);
    res.status(500).json({ error: 'Failed to load success stories.' });
  }
});

/**
 * Get approved employer feedback for Gallery
 * 
 * CRITICAL: This is the SINGLE SOURCE OF TRUTH for the "Employer Feedback Showcase" section in the gallery.
 * 
 * Data Flow:
 * 1. Admin approves feedback in "Employer Submissions" → "Alumni Technical Feedback"
 * 2. Sets approved_by_admin = '1' in employer_alumni_feedback.csv
 * 3. This endpoint filters for approved_by_admin = '1' ONLY
 * 4. Returns ONLY approved feedback - no other data sources
 * 5. Gallery displays EXACTLY what this endpoint returns
 * 
 * @returns {Array} Array of approved feedback entries (should match admin console approved count)
 */
app.get('/api/employer-feedback/approved', (req, res) => {
  try {
    const feedbackPath = path.join(DATA_DIR, 'employer_alumni_feedback.csv');
    if (!fs.existsSync(feedbackPath)) {
      console.log('Employer feedback CSV file not found');
      return res.json({ feedbacks: [] });
    }
    const csvContent = fs.readFileSync(feedbackPath, 'utf8');
    let feedbacks = Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data;
    
    // Ensure image_url field exists for all entries (backward compatibility)
    feedbacks = feedbacks.map(fb => ({
      ...fb,
      image_url: fb.image_url || '',
    }));
    
    console.log(`\n📋 Reading employer_alumni_feedback.csv: ${feedbacks.length} total entries`);
    
    // STRICT filter: Only return feedback where approved_by_admin is exactly '1' or 1
    // This ensures ONLY admin-approved feedback flows to gallery
    // CRITICAL: This count should match the number of approved entries visible in admin console
    const approved = feedbacks.filter(fb => {
      const approvalValue = String(fb.approved_by_admin || '').trim().toLowerCase();
      // Only accept '1' or 'true' - nothing else
      const isApproved = approvalValue === '1' || approvalValue === 'true';
      
      if (!isApproved) {
        console.log(`  [SKIPPED] Unapproved feedback_id: ${fb.feedback_id}, approved_by_admin: "${fb.approved_by_admin}"`);
      } else {
        console.log(`  [APPROVED] feedback_id: ${fb.feedback_id}, employer: ${fb.employer_name || 'Unknown'}`);
      }
      
      return isApproved;
    });
    
    console.log(`\n✅ === APPROVED FEEDBACK FOR GALLERY ===`);
    console.log(`📊 Total APPROVED feedback entries: ${approved.length}`);
    console.log(`   ⚠️  This MUST match the number of approved entries in admin console`);
    console.log(`   ⚠️  If admin shows 1 approved, this should be 1\n`);
    
    if (approved.length === 0) {
      console.log('  ℹ️  No approved feedback found. Gallery will show empty section.');
    } else {
      console.log(`  📝 Approved Feedback Details:`);
      approved.forEach((fb, idx) => {
        console.log(`     [${idx + 1}] ID: ${fb.feedback_id}, Employer: ${fb.employer_name || 'Unknown'}, Role: ${fb.job_role || 'N/A'}, Year: ${fb.graduation_year || 'N/A'}`);
      });
    }
    console.log(`==========================================\n`);
    
    // Return ONLY approved feedback - this is what flows to gallery
    // CRITICAL: This array length MUST match the number of approved entries in admin console
    // If admin console shows 1 approved entry, this array should have exactly 1 element
    res.json({ feedbacks: approved });
  } catch (error) {
    console.error('Failed to load approved employer feedback', error);
    res.status(500).json({ error: 'Failed to load employer feedback.' });
  }
});

// Protected admin routes - require authentication
app.get('/api/admin/images', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { category } = req.query ?? {};

    if (category) {
      const categoryInfo = getImageCategory(category);
      const files = listImageFiles(category);
      return res.json({
        category: {
          id: category,
          label: categoryInfo.label,
          description: categoryInfo.description,
          primaryPath: categoryInfo.publicPath,
        },
        files,
      });
    }

    const categories = Object.entries(IMAGE_CATEGORIES).map(([id, categoryInfo]) => {
      const files = listImageFiles(id);
      return {
        id,
        label: categoryInfo.label,
        description: categoryInfo.description,
        count: files.length,
        publicPath: categoryInfo.publicPath,
      };
    });

    res.json(categories);
  } catch (error) {
    console.error('Failed to load image categories', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to load images.' });
  }
});

app.post('/api/admin/images', authenticateToken, authorizeRole('admin'), upload.single('image'), (req, res) => {
  try {
    const { category } = req.body ?? {};
    if (!category) {
      return res.status(400).json({ error: 'Category is required.' });
    }
    const categoryInfo = getImageCategory(category);
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Image file is required.' });
    }

    const originalName = file.originalname || 'upload';
    const parsed = path.parse(originalName);
    const safeBase = parsed.name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'image';
    const extension = parsed.ext || '.png';

    let filename = `${safeBase}${extension}`;
    const targetDir = categoryInfo.absolutePath;
    let counter = 1;
    while (fs.existsSync(path.join(targetDir, filename))) {
      filename = `${safeBase}_${Date.now()}_${counter}${extension}`;
      counter += 1;
    }

    fs.writeFileSync(path.join(targetDir, filename), file.buffer);

    const fileInfo = listImageFiles(category).find((item) => item.filename === filename);
    res.status(201).json({ message: 'Image uploaded successfully.', file: fileInfo });
  } catch (error) {
    console.error('Failed to upload image', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to upload image.' });
  }
});

app.delete('/api/admin/images/:category/:filename', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { category, filename } = req.params;
    const categoryInfo = getImageCategory(category);
    const decodedFilename = decodeURIComponent(filename);
    
    // Security: Validate filename to prevent directory traversal
    if (decodedFilename.includes('..') || decodedFilename.includes('/') || decodedFilename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename.' });
    }
    
    const filePath = path.join(categoryInfo.absolutePath, decodedFilename);

    // Security: Ensure the resolved path is within the category directory
    const resolvedPath = path.resolve(filePath);
    const resolvedCategoryPath = path.resolve(categoryInfo.absolutePath);
    if (!resolvedPath.startsWith(resolvedCategoryPath)) {
      return res.status(403).json({ error: 'Access denied: Invalid file path.' });
    }

    // Check if file/directory exists
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ error: `Image "${decodedFilename}" not found in category "${category}".` });
    }

    // Check if it's a directory or file
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      // Directories should not appear in the image list, but handle it gracefully
      return res.status(400).json({ 
        error: `"${decodedFilename}" is a directory and cannot be deleted through the image management interface. Please remove it manually from the file system.` 
      });
    }

    // Verify it's a file before attempting deletion
    if (!stats.isFile()) {
      return res.status(400).json({ 
        error: `"${decodedFilename}" is not a regular file and cannot be deleted.` 
      });
    }

    // Check file permissions before deletion
    try {
      fs.accessSync(filePath, fs.constants.W_OK);
    } catch (accessError) {
      console.error('File access check failed:', accessError);
      return res.status(403).json({ 
        error: `Permission denied: Cannot delete "${decodedFilename}". The file may be locked or you may not have write permissions.` 
      });
    }

    // Use async unlink with better error handling
    try {
      await fs.promises.unlink(filePath);
    res.json({ message: 'Image deleted successfully.' });
    } catch (unlinkError) {
      console.error('File deletion error:', unlinkError);
      
      // Provide more specific error messages
      if (unlinkError.code === 'EPERM') {
        return res.status(403).json({ 
          error: `Permission denied: Cannot delete "${decodedFilename}". The file may be in use or locked by another process.` 
        });
      } else if (unlinkError.code === 'ENOENT') {
        return res.status(404).json({ 
          error: `File "${decodedFilename}" not found.` 
        });
      } else {
        return res.status(500).json({ 
          error: `Failed to delete image: ${unlinkError.message}` 
        });
      }
    }
  } catch (error) {
    console.error('Failed to delete image', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to delete image.' });
  }
});

const ASSISTANT_ROLES = new Set(['admin', 'alumni', 'employer']);

app.post('/api/assistant/query', (req, res) => {
  try {
    const { question, role } = req.body ?? {};

    if (!question || !role) {
      return res.status(400).json({ error: 'Question and role are required.' });
    }

    if (!ASSISTANT_ROLES.has(role)) {
      return res.status(403).json({ error: 'Role not permitted for assistant access.' });
    }

    const response = buildAssistantResponse(question, role);
    res.json(response);
  } catch (error) {
    console.error('Assistant query failed', error);
    res.status(500).json({ error: 'Assistant query failed.' });
  }
});

app.get('/api/admin/tables', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const tables = Object.entries(ADMIN_TABLES).map(([id, tableConfig]) => {
      const { columns } = loadTableData(id);
      return {
        id,
        label: tableConfig.label,
        description: tableConfig.description,
        primaryKey: tableConfig.primaryKey,
        columns,
      };
    });
    res.json(tables);
  } catch (error) {
    console.error('Failed to load admin tables', error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to load tables.' });
  }
});

app.get('/api/admin/tables/:tableId', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { tableId } = req.params;
    const { config, columns, rows } = loadTableData(tableId);
    res.json({
      label: config.label,
      description: config.description,
      primaryKey: config.primaryKey,
      columns,
      rows,
    });
  } catch (error) {
    console.error(`Failed to load table ${req.params.tableId}`, error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to load table.' });
  }
});

app.post('/api/admin/tables/:tableId', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { tableId } = req.params;
    const { record } = req.body ?? {};
    if (!record || typeof record !== 'object') {
      return res.status(400).json({ error: 'Record payload is required.' });
    }
    const { config, columns, rows } = loadTableData(tableId);
    const key = record[config.primaryKey];
    if (!key) {
      return res
        .status(400)
        .json({ error: `Field "${config.primaryKey}" is required for new records.` });
    }
    if (rows.some((row) => row[config.primaryKey] === key.toString())) {
      return res
        .status(409)
        .json({ error: `A record with ${config.primaryKey}="${key}" already exists.` });
    }
    const sanitized = sanitizeRecord(columns, record);
    rows.push(sanitized);
    writeTableData(tableId, columns, rows);
    res.status(201).json({ message: 'Record added successfully.', row: sanitized });
  } catch (error) {
    console.error(`Failed to add record to table ${req.params.tableId}`, error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to add record.' });
  }
});

app.put('/api/admin/tables/:tableId/:recordId', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { tableId, recordId } = req.params;
    const { record } = req.body ?? {};
    if (!record || typeof record !== 'object') {
      return res.status(400).json({ error: 'Record payload is required.' });
    }

    const { config, columns, rows } = loadTableData(tableId);
    const primaryKey = config.primaryKey;
    const matchIndex = rows.findIndex((row) => row[primaryKey] === recordId);

    if (matchIndex === -1) {
      return res
        .status(404)
        .json({ error: `Record with ${primaryKey}="${recordId}" not found.` });
    }

    const updatedRecord = {
      ...rows[matchIndex],
      ...sanitizeRecord(columns, record),
    };

    // Ensure primary key remains unchanged
    updatedRecord[primaryKey] = rows[matchIndex][primaryKey];

    rows[matchIndex] = updatedRecord;
    writeTableData(tableId, columns, rows);

    res.json({ message: 'Record updated successfully.', row: updatedRecord });
  } catch (error) {
    console.error(`Failed to update record in table ${req.params.tableId}`, error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to update record.' });
  }
});

app.delete('/api/admin/tables/:tableId/:recordId', authenticateToken, authorizeRole('admin'), (req, res) => {
  try {
    const { tableId, recordId } = req.params;
    const { config, columns, rows } = loadTableData(tableId);
    const primaryKey = config.primaryKey;
    const filtered = rows.filter((row) => row[primaryKey] !== recordId);

    if (filtered.length === rows.length) {
      return res
        .status(404)
        .json({ error: `Record with ${primaryKey}="${recordId}" not found.` });
    }

    writeTableData(tableId, columns, filtered);
    res.json({ message: 'Record deleted successfully.' });
  } catch (error) {
    console.error(`Failed to delete record from table ${req.params.tableId}`, error);
    res.status(error.status || 500).json({ error: error.message || 'Failed to delete record.' });
  }
});

// Global error handler - must be last middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  console.error('Stack:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  console.warn(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Events inquiry API running on http://0.0.0.0:${PORT}`);
  console.log(`Server accessible on http://localhost:${PORT}`);
  console.log(`CORS enabled for all origins`);
});

