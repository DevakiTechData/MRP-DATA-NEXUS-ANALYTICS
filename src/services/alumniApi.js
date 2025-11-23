// Normalize API base URL (remove trailing slash to prevent double slashes)
const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
  return url.replace(/\/+$/, ''); // Remove trailing slashes
};
const API_BASE_URL = getApiBaseUrl();

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

// Get My Alumni Profile and Stats
export const fetchMyProfile = (token) =>
  fetch(`${API_BASE_URL}/api/alumni/my-profile`, {
    headers: jsonHeaders(token),
  }).then(handleResponse);

// Get My Alumni Colleagues (alumni at same company)
export const fetchMyColleagues = (token) =>
  fetch(`${API_BASE_URL}/api/alumni/my-colleagues`, {
    headers: jsonHeaders(token),
  }).then(handleResponse);

// Update Alumni Profile
export const updateAlumniProfile = (profileData, token) =>
  fetch(`${API_BASE_URL}/api/alumni/profile`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify(profileData),
  }).then(handleResponse);

