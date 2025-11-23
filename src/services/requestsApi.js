// API service for managing requests (event applications, success stories, engagements)

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Delete a submission
export const deleteSubmission = async (type, id) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/api/submissions/${type}/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete submission');
  }

  return await response.json();
};

// Get approved success stories
export const getApprovedSuccessStories = async () => {
  const response = await fetch(`${API_BASE}/api/success-stories/approved`);
  
  if (!response.ok) {
    throw new Error('Failed to load approved success stories');
  }

  return await response.json();
};

// Get my submissions (for alumni/employer)
export const getMySubmissions = async (type, token = null) => {
  const authToken = token || getAuthToken();
  if (!authToken) {
    throw new Error('Authentication required');
  }

  // Try alumni endpoint first (for alumni users), fallback to admin endpoint (for admin users)
  let response = await fetch(`${API_BASE}/api/alumni/my-submissions?type=${type}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  // If alumni endpoint fails (e.g., user is admin), try admin endpoint
  if (!response.ok && response.status === 403) {
    response = await fetch(`${API_BASE}/api/admin/alumni-submissions?type=${type}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
  }

  if (!response.ok) {
    throw new Error('Failed to load submissions');
  }

  const data = await response.json();
  return data.submissions || [];
};

// Get all my submissions (alumni - event applications, success stories, engagement feedback)
export const getAllMyAlumniSubmissions = async (token = null) => {
  const authToken = token || getAuthToken();
  if (!authToken) {
    throw new Error('Authentication required');
  }

  try {
    // Try to fetch all types at once from the alumni endpoint
    let response = await fetch(`${API_BASE}/api/alumni/my-submissions`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    // If alumni endpoint fails (e.g., user is admin), fetch each type separately
    if (!response.ok && response.status === 403) {
      const [eventApps, successStories, engagementFeedback] = await Promise.all([
        getMySubmissions('event-applications', authToken),
        getMySubmissions('success-stories', authToken),
        getMySubmissions('engagement-feedback', authToken),
      ]);

      return {
        eventApplications: eventApps || [],
        successStories: successStories || [],
        engagementFeedback: engagementFeedback || [],
      };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to load submissions:', response.status, errorText);
      throw new Error(`Failed to load submissions: ${response.status}`);
    }

    const data = await response.json();
    return {
      eventApplications: data.eventApplications || [],
      successStories: data.successStories || [],
      engagementFeedback: data.engagementFeedback || [],
    };
  } catch (error) {
    console.error('Failed to load all submissions:', error);
    return {
      eventApplications: [],
      successStories: [],
      engagementFeedback: [],
    };
  }
};

// Get all my employer submissions (event participation, feedback, job postings)
export const getAllMyEmployerSubmissions = async (token = null) => {
  const authToken = token || getAuthToken();
  if (!authToken) {
    throw new Error('Authentication required');
  }

  try {
    // Fetch event participations
    const participationsResponse = await fetch(`${API_BASE}/api/employer/my-events`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    const participationsData = participationsResponse.ok ? await participationsResponse.json() : { participations: [] };

    // Fetch feedback
    const feedbackResponse = await fetch(`${API_BASE}/api/employer/my-feedback`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    const feedbackData = feedbackResponse.ok ? await feedbackResponse.json() : { feedbacks: [] };

    // Fetch job postings
    const postingsResponse = await fetch(`${API_BASE}/api/employer/job-postings`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    const postingsData = postingsResponse.ok ? await postingsResponse.json() : { postings: [] };

    return {
      eventParticipations: participationsData.participations || [],
      feedback: feedbackData.feedbacks || [],
      jobPostings: postingsData.postings || [],
    };
  } catch (error) {
    console.error('Failed to load employer submissions:', error);
    return {
      eventParticipations: [],
      feedback: [],
      jobPostings: [],
    };
  }
};

