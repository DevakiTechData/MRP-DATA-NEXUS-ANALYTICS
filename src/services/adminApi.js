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

const authHeaders = (token, extra) => ({
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...(extra || {}),
});

export const fetchAdminTables = (token) =>
  fetch(`${API_BASE_URL}/api/admin/tables`, {
    headers: jsonHeaders(token),
  }).then(handleResponse);

export const fetchTableData = (tableId, token) =>
  fetch(`${API_BASE_URL}/api/admin/tables/${tableId}`, {
    headers: jsonHeaders(token),
  }).then(handleResponse);

export const createRecord = (tableId, record, token) =>
  fetch(`${API_BASE_URL}/api/admin/tables/${tableId}`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({ record }),
  }).then(handleResponse);

export const updateRecord = (tableId, recordId, record, token) =>
  fetch(`${API_BASE_URL}/api/admin/tables/${tableId}/${recordId}`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify({ record }),
  }).then(handleResponse);

export const deleteRecord = (tableId, recordId, token) =>
  fetch(`${API_BASE_URL}/api/admin/tables/${tableId}/${recordId}`, {
    method: 'DELETE',
    headers: jsonHeaders(token),
  }).then(handleResponse);

export const fetchImageCategories = (token) =>
  fetch(`${API_BASE_URL}/api/admin/images`, {
    headers: jsonHeaders(token),
  }).then(handleResponse);

export const fetchImages = (categoryId, token) =>
  fetch(`${API_BASE_URL}/api/admin/images?category=${encodeURIComponent(categoryId)}`, {
    headers: jsonHeaders(token),
  }).then(handleResponse);

export const uploadImage = (categoryId, file, token) => {
  const formData = new FormData();
  formData.append('category', categoryId);
  formData.append('image', file);

  return fetch(`${API_BASE_URL}/api/admin/images`, {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  }).then(handleResponse);
};

export const deleteImageFile = (categoryId, filename, token) =>
  fetch(
    `${API_BASE_URL}/api/admin/images/${encodeURIComponent(categoryId)}/${encodeURIComponent(filename)}`,
    {
      method: 'DELETE',
      headers: jsonHeaders(token),
    },
  ).then(handleResponse);

export const fetchAlumniSubmissions = (type, token) =>
  fetch(`${API_BASE_URL}/api/admin/alumni-submissions?type=${encodeURIComponent(type || 'all')}`, {
    headers: jsonHeaders(token),
  }).then(handleResponse);

export const updateSubmissionStatus = (type, id, status, token) =>
  fetch(`${API_BASE_URL}/api/admin/alumni-submissions/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify({ status }),
  }).then(handleResponse);

export const fetchEmployerSubmissions = (type, token) =>
  fetch(`${API_BASE_URL}/api/admin/employer-portal-data?type=${encodeURIComponent(type)}`, {
    headers: jsonHeaders(token),
  }).then(handleResponse);

export const updateEmployerEventParticipation = (id, status, token) =>
  fetch(`${API_BASE_URL}/api/admin/employer-event-participation/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: jsonHeaders(token),
    body: JSON.stringify({ participation_status: status }),
  }).then(handleResponse);

export const approveAlumniFeedback = (id, approved, token) =>
  fetch(`${API_BASE_URL}/api/admin/alumni-feedback/${encodeURIComponent(id)}/approve`, {
    method: 'PATCH',
    headers: jsonHeaders(token),
    body: JSON.stringify({ approved }),
  }).then(handleResponse);

export const deleteAlumniFeedback = (id, token) =>
  fetch(`${API_BASE_URL}/api/admin/alumni-feedback/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: jsonHeaders(token),
  }).then(handleResponse);

export const fetchConnectRequests = (token) =>
  fetch(`${API_BASE_URL}/api/admin/connect-requests`, {
    headers: jsonHeaders(token),
  }).then(handleResponse);

export const updateConnectRequest = (id, updates, token) =>
  fetch(`${API_BASE_URL}/api/admin/connect-requests/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify(updates),
  }).then(handleResponse);

export const deleteConnectRequest = (id, token) =>
  fetch(`${API_BASE_URL}/api/admin/connect-requests/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: jsonHeaders(token),
  }).then(handleResponse);

export const updateAlumniSubmission = (type, id, updates, token) =>
  fetch(`${API_BASE_URL}/api/admin/alumni-submissions/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: jsonHeaders(token),
    body: JSON.stringify(updates),
  }).then(handleResponse);

export const updateEmployerFeedback = (id, updates, token) =>
  fetch(`${API_BASE_URL}/api/admin/alumni-feedback/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify(updates),
  }).then(handleResponse);

export const updateEmployerEventParticipationFull = (id, updates, token) =>
  fetch(`${API_BASE_URL}/api/admin/employer-event-participation/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify(updates),
  }).then(handleResponse);

