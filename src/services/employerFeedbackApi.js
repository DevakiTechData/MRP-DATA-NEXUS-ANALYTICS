const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';

const handleResponse = async (response) => {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
};

const jsonHeaders = (token, extra) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...(extra || {}),
});

// Submit Employer Alumni Feedback
export const submitAlumniFeedback = (feedbackData, token) =>
  fetch(`${API_BASE_URL}/api/employer/alumni-feedback`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(feedbackData),
  }).then(handleResponse);

// Get Alumni Feedback (admin)
export const fetchAlumniFeedback = (filters, token, includePending = false) => {
  const params = new URLSearchParams();
  if (filters.graduation_year) params.append('graduation_year', filters.graduation_year);
  if (filters.technologies) params.append('technologies', filters.technologies);
  if (filters.job_role) params.append('job_role', filters.job_role);
  if (filters.tech_strength_level) params.append('tech_strength_level', filters.tech_strength_level);
  if (includePending) params.append('include_pending', 'true');
  
  return fetch(`${API_BASE_URL}/api/admin/alumni-feedback?${params.toString()}`, {
    headers: jsonHeaders(token),
  }).then(handleResponse);
};

// Get My Alumni Employees
export const fetchMyAlumniEmployees = (token) =>
  fetch(`${API_BASE_URL}/api/employer/my-alumni-employees`, {
    headers: jsonHeaders(token),
  }).then(handleResponse);

// Get Available Events
export const fetchAvailableEvents = (token) =>
  fetch(`${API_BASE_URL}/api/employer/events`, {
    headers: jsonHeaders(token),
  }).then(handleResponse);

// Request Event Participation
export const requestEventParticipation = (event_key, notes, token) =>
  fetch(`${API_BASE_URL}/api/employer/event-participation`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({ event_key, notes }),
  }).then(handleResponse);

// Get My Event Participation
export const fetchMyEventParticipation = (token) =>
  fetch(`${API_BASE_URL}/api/employer/my-events`, {
    headers: jsonHeaders(token),
  }).then(handleResponse);

// Get Employer Profile
export const fetchEmployerProfile = (token) =>
  fetch(`${API_BASE_URL}/api/employer/profile`, {
    headers: jsonHeaders(token),
  }).then(handleResponse);

// Update Employer Profile
export const updateEmployerProfile = (profileData, token) =>
  fetch(`${API_BASE_URL}/api/employer/profile`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify(profileData),
  }).then(handleResponse);

// Get My Employer Feedback
export const fetchMyFeedback = (token) =>
  fetch(`${API_BASE_URL}/api/employer/my-feedback`, {
    headers: jsonHeaders(token),
  }).then(handleResponse);

// Report Alumni Employment Issue
export const reportEmploymentIssue = (issueData, token) =>
  fetch(`${API_BASE_URL}/api/employer/alumni-employment-issues`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(issueData),
  }).then(handleResponse);

