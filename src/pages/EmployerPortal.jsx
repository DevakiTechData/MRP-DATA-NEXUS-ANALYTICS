import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHero from '../components/PageHero';
import HeroSlider from '../components/HeroSlider';
import GalleryFooter from '../components/GalleryFooter';
import {
  submitAlumniFeedback,
  fetchMyAlumniEmployees,
  fetchAvailableEvents,
  requestEventParticipation,
  fetchMyEventParticipation,
  fetchEmployerProfile,
  updateEmployerProfile,
  fetchMyFeedback,
  reportEmploymentIssue,
} from '../services/employerFeedbackApi';
import { getAllMyEmployerSubmissions, deleteSubmission } from '../services/requestsApi';

const EMPLOYER_PORTAL_HERO_IMAGES = [
  {
    src: '/assets/hero/engagement img1.jpeg',
    alt: 'Corporate visit and employer engagement',
    caption: 'Building strong partnerships with leading employers through corporate visits and networking.',
  },
  {
    src: '/assets/hero/event img2.jpeg',
    alt: 'Career fair and employer participation',
    caption: 'Connect with SLU talent at career fairs, networking events, and professional gatherings.',
  },
  {
    src: '/assets/hero/engagement img2.jpg',
    alt: 'Employer collaboration and feedback',
    caption: 'Your insights help shape the future of SLU education and strengthen our partnership.',
  },
];

const EMPLOYER_BENEFITS_IMAGES = [
  {
    src: '/assets/hero/engagement img1.jpeg',
    alt: 'Employer networking and partnership',
    caption: 'Building lasting partnerships with SLU through networking and collaboration.',
  },
  {
    src: '/assets/hero/event img2.jpeg',
    alt: 'Career fair participation',
    caption: 'Connect with top talent at SLU career fairs and recruitment events.',
  },
  {
    src: '/assets/employers/Comp img1.jpeg',
    alt: 'Corporate partnership',
    caption: 'Leading employers trust SLU to deliver exceptional talent.',
  },
  {
    src: '/assets/employers/Comp img4.jpg',
    alt: 'Employer collaboration',
    caption: 'Join a network of innovative companies partnering with SLU.',
  },
];

const EmployerPortal = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });
  const [activeTab, setActiveTab] = useState('profile');
  
  // Feedback form state
  const [formData, setFormData] = useState({
    rating_overall: '',
    comment_overall: '',
    tech_strength_level: '',
    technologies: '',
    job_role: '',
    graduation_year: '',
    image: null, // File object for image upload
    imagePreview: null, // Preview URL for selected image
  });

  // Alumni employees state
  const [alumniEmployees, setAlumniEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeeFilters, setEmployeeFilters] = useState({
    graduation_year: '',
    program: '',
    status: '',
  });
  const [employerProfile, setEmployerProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    employer_name: '',
    hq_city: '',
    hq_state: '',
    hq_country: '',
    industry: '',
    website: '',
    products: '',
    slu_relation: '',
    logo_url: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Events state
  const [availableEvents, setAvailableEvents] = useState([]);
  const [myParticipations, setMyParticipations] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [participatingEvent, setParticipatingEvent] = useState(null);
  const [eventFilter, setEventFilter] = useState('all'); // 'all', 'upcoming', 'past'

  // Feedback history state
  const [myFeedbackHistory, setMyFeedbackHistory] = useState([]);
  const [feedbackHistoryLoading, setFeedbackHistoryLoading] = useState(false);
  
  // All submissions state
  const [allMySubmissions, setAllMySubmissions] = useState({
    eventParticipations: [],
    feedback: [],
    jobPostings: [],
  });
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Report Issue Modal state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedAlumniForIssue, setSelectedAlumniForIssue] = useState(null);
  const [issueFormData, setIssueFormData] = useState({
    issue_type: '',
    comments: '',
  });

  // Relationship Snapshot state
  const [relationshipSnapshot, setRelationshipSnapshot] = useState({
    alumniEmployed: 0,
    eventsParticipated: 0,
    pendingRequests: 0,
    feedbackSubmitted: 0,
  });

  // Graduation years: 2020-2025 (5 years of data)
  const graduationYears = [2025, 2024, 2023, 2022, 2021, 2020];
  
  // Unique programs from students data
  const uniquePrograms = [
    'MS Information Systems',
    'MS Artificial Intelligence',
    'MS Machine Learning',
    'MS Cyber Security',
    'MS Data Analytics',
    'MS Business Analytics',
    'MS Computer Science',
    'MS Statistics',
  ];

  // Load alumni employees and employer profile on mount
  useEffect(() => {
    if (token) {
      loadAlumniEmployees();
      loadEmployerProfile();
    }
  }, [token]);

  const loadEmployerProfile = async () => {
    if (!token) return;
    try {
      const data = await fetchEmployerProfile(token);
      const profile = data.employer || null;
      setEmployerProfile(profile);
      if (profile) {
        setProfileFormData({
          employer_name: profile.employer_name || '',
          hq_city: profile.hq_city || '',
          hq_state: profile.hq_state || '',
          hq_country: profile.hq_country || '',
          industry: profile.industry || '',
          website: profile.website || '',
          products: profile.products || '',
          slu_relation: profile.slu_relation || '',
          logo_url: profile.logo_url || '',
        });
      }
    } catch (error) {
      console.error('Failed to load employer profile:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!token) {
      setStatus({ type: 'error', message: 'Please log in to update profile.' });
      return;
    }

    try {
      setProfileLoading(true);
      const data = await updateEmployerProfile(profileFormData, token);
      setEmployerProfile(data.employer || profileFormData);
      setStatus({ type: 'success', message: 'Company profile updated successfully!' });
      setIsEditingProfile(false);
      loadEmployerProfile(); // Reload to get updated data
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  // Load events on mount
  useEffect(() => {
    if (token) {
      loadEvents();
      loadMyParticipations();
      loadMyFeedback();
    }
  }, [token]);

  // Calculate relationship snapshot when data changes
  useEffect(() => {
    if (token && alumniEmployees.length >= 0 && myParticipations.length >= 0 && myFeedbackHistory.length >= 0) {
      calculateRelationshipSnapshot();
    }
  }, [alumniEmployees, myParticipations, myFeedbackHistory, token]);

  // Load all submissions when requests tab is active
  useEffect(() => {
    if (activeTab === 'requests' && token) {
      loadAllMySubmissions();
    }
  }, [activeTab, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load event participations when events tab is active
  useEffect(() => {
    if (activeTab === 'events' && token) {
      loadMyParticipations();
      loadEvents();
    }
  }, [activeTab, token]);

  // Auto-refresh submissions when on requests tab to catch status updates from admin
  useEffect(() => {
    if (activeTab === 'requests' && token) {
      const interval = setInterval(() => {
        loadAllMySubmissions();
      }, 10000); // Refresh every 10 seconds to catch status updates
      return () => clearInterval(interval);
    }
  }, [activeTab, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh event participations when on events tab to catch status updates from admin
  useEffect(() => {
    if (activeTab === 'events' && token) {
      const interval = setInterval(() => {
        loadMyParticipations();
      }, 10000); // Refresh every 10 seconds to catch status updates
      return () => clearInterval(interval);
    }
  }, [activeTab, token]);

  const calculateRelationshipSnapshot = () => {
    const verifiedAlumni = alumniEmployees.filter(emp => emp.status === 'Verified').length;
    const approvedEvents = myParticipations.filter(p => 
      p.participation_status === 'Approved' || p.participation_status === 'Completed'
    ).length;
    const pendingEvents = myParticipations.filter(p => 
      p.participation_status === 'Requested' || p.participation_status === 'Pending'
    ).length;
    const feedbackCount = myFeedbackHistory.length;

    setRelationshipSnapshot({
      alumniEmployed: verifiedAlumni,
      eventsParticipated: approvedEvents,
      pendingRequests: pendingEvents,
      feedbackSubmitted: feedbackCount,
    });
  };

  const loadMyFeedback = async () => {
    if (!token) return;
    try {
      setFeedbackHistoryLoading(true);
      const data = await fetchMyFeedback(token);
      setMyFeedbackHistory(data.feedbacks || []);
    } catch (error) {
      console.error('Failed to load feedback history:', error);
    } finally {
      setFeedbackHistoryLoading(false);
    }
  };

  const loadAllMySubmissions = async () => {
    if (!token) {
      return;
    }
    try {
      setSubmissionsLoading(true);
      const submissions = await getAllMyEmployerSubmissions(token);
      
      // Ensure we have the correct field names - backend uses 'id' not 'participation_id'
      const normalizedParticipations = (submissions.eventParticipations || []).map(p => ({
        ...p,
        participation_id: p.id || p.participation_id, // Normalize to participation_id for consistency
        participation_status: p.participation_status || p.status || 'Requested', // Normalize status field
      }));
      
      setAllMySubmissions({
        eventParticipations: normalizedParticipations,
        feedback: submissions.feedback || [],
        jobPostings: submissions.jobPostings || [],
      });
    } catch (error) {
      console.error('Failed to load all submissions:', error);
      setAllMySubmissions({
        eventParticipations: [],
        feedback: [],
        jobPostings: [],
      });
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const loadAlumniEmployees = async () => {
    if (!token) {
      setStatus({ type: 'error', message: 'Please log in to view alumni employees.' });
      return;
    }
    try {
      setEmployeesLoading(true);
      setStatus({ type: null, message: '' }); // Clear previous errors
      const data = await fetchMyAlumniEmployees(token);
      setAlumniEmployees(data.employees || []);
    } catch (error) {
      if (error.message && (error.message.includes('token') || error.message.includes('expired') || error.message.includes('Invalid'))) {
        setStatus({ type: 'error', message: 'Your session has expired. Please log out and log back in.' });
      } else {
        // Only show error if it's not a token issue (to avoid duplicate messages)
        if (!status.type || !status.message.includes('expired')) {
          setStatus({ type: 'error', message: error.message || 'Failed to load alumni employees.' });
        }
      }
    } finally {
      setEmployeesLoading(false);
    }
  };

  const loadEvents = async () => {
    if (!token) {
      return;
    }
    try {
      setEventsLoading(true);
      const data = await fetchAvailableEvents(token);
      setAvailableEvents(data.events || []);
    } catch (error) {
      if (error.message && (error.message.includes('token') || error.message.includes('expired') || error.message.includes('Invalid'))) {
        setStatus({ type: 'error', message: 'Your session has expired. Please log out and log back in.' });
      } else {
        console.error('Failed to load events:', error);
      }
    } finally {
      setEventsLoading(false);
    }
  };

  const loadMyParticipations = async () => {
    if (!token) {
      return;
    }
    try {
      const data = await fetchMyEventParticipation(token);
      setMyParticipations(data.participations || []);
    } catch (error) {
      if (error.message && !error.message.includes('token')) {
        console.error('Failed to load participations:', error);
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setStatus({ type: 'error', message: 'Please select an image file.' });
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setStatus({ type: 'error', message: 'Image size must be less than 5MB.' });
        return;
      }
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleRemoveImage = () => {
    if (formData.imagePreview) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    setFormData((prev) => ({
      ...prev,
      image: null,
      imagePreview: null,
    }));
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setStatus({ type: 'error', message: 'Please log in to submit feedback.' });
      return;
    }
    
    if (!formData.rating_overall || !formData.tech_strength_level || !formData.technologies || !formData.job_role || !formData.graduation_year) {
      setStatus({ type: 'error', message: 'Please fill in all required fields (marked with *).' });
      return;
    }

    try {
      setLoading(true);
      setStatus({ type: 'loading', message: 'Uploading image and submitting feedback...' });
      
      let imageUrl = '';
      
      // Upload image if provided
      if (formData.image) {
        const imageFormData = new FormData();
        imageFormData.append('image', formData.image);
        
        const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002').replace(/\/+$/, '');
        const uploadResponse = await fetch(`${apiBase}/api/employer/feedback-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: imageFormData,
        });
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to upload image. Please try again.');
        }
        
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.file?.url || uploadData.imageUrl || uploadData.url || '';
      }
      
      // Submit feedback with image URL
      await submitAlumniFeedback({ ...formData, image_url: imageUrl }, token);
      setStatus({ type: 'success', message: 'Feedback submitted successfully! Admin will review and approve it.' });
      
      // Reset form
      if (formData.imagePreview) {
        URL.revokeObjectURL(formData.imagePreview);
      }
      setFormData({
        rating_overall: '',
        comment_overall: '',
        tech_strength_level: '',
        technologies: '',
        job_role: '',
        graduation_year: '',
        image: null,
        imagePreview: null,
      });
      
      // Reload feedback history
      await loadMyFeedback();
      // Reload all submissions to show the new feedback in My Requests tab
      await loadAllMySubmissions();
    } catch (error) {
      if (error.message && error.message.includes('token')) {
        setStatus({ type: 'error', message: 'Your session has expired. Please log out and log back in.' });
      } else {
        setStatus({ type: 'error', message: error.message || 'Failed to submit feedback.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReportIssue = async (e) => {
    e.preventDefault();
    if (!token || !selectedAlumniForIssue) {
      setStatus({ type: 'error', message: 'Please select an alumni and log in to report an issue.' });
      return;
    }

    if (!issueFormData.issue_type) {
      setStatus({ type: 'error', message: 'Please select an issue type.' });
      return;
    }

    try {
      setLoading(true);
      await reportEmploymentIssue({
        alumni_id: selectedAlumniForIssue.alumniId,
        issue_type: issueFormData.issue_type,
        comments: issueFormData.comments,
      }, token);
      setStatus({ type: 'success', message: 'Issue reported successfully! SLU administrators will review it.' });
      setShowIssueModal(false);
      setIssueFormData({ issue_type: '', comments: '' });
      setSelectedAlumniForIssue(null);
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to report issue.' });
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on date
  const filteredParticipations = myParticipations.filter(part => {
    if (eventFilter === 'all') return true;
    if (!part.event_date) return eventFilter === 'all';
    const eventDate = new Date(part.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventFilter === 'upcoming') return eventDate >= today;
    if (eventFilter === 'past') return eventDate < today;
    return true;
  });

  // Calculate alumni summary stats
  const verifiedEmployees = alumniEmployees.filter(emp => emp.status === 'Verified');

  const alumniSummary = {
    verifiedCount: verifiedEmployees.length,
    programsRepresented: [...new Set(verifiedEmployees.map(emp => emp.program).filter(Boolean))].length,
    locationsRepresented: [...new Set(verifiedEmployees.map(emp => emp.location).filter(Boolean))].length,
  };

  // Calculate event stats
  const eventStats = {
    requested: myParticipations.filter(p => p.participation_status === 'Requested' || p.participation_status === 'Pending').length,
    approved: myParticipations.filter(p => p.participation_status === 'Approved' || p.participation_status === 'Completed').length,
    upcoming: filteredParticipations.filter(p => {
      if (!p.event_date) return false;
      return new Date(p.event_date) >= new Date();
    }).length,
  };

  const handleRequestParticipation = async (event_key) => {
    if (!token) {
      setStatus({ type: 'error', message: 'Please log in to request event participation.' });
      return;
    }
    try {
      setParticipatingEvent(event_key);
      await requestEventParticipation(event_key, '', token);
      setStatus({ type: 'success', message: 'Event participation requested successfully! Admin will review and approve your request.' });
      // Always reload all data to ensure consistency
      await Promise.all([
        loadMyParticipations(),
        loadEvents(),
        loadAllMySubmissions(), // Always reload, not just when on requests tab
      ]);
    } catch (error) {
      if (error.message && error.message.includes('token')) {
        setStatus({ type: 'error', message: 'Your session has expired. Please log out and log back in.' });
      } else {
        setStatus({ type: 'error', message: error.message || 'Failed to request participation.' });
      }
    } finally {
      setParticipatingEvent(null);
    }
  };

  // Filter alumni employees
  const filteredEmployees = alumniEmployees.filter((emp) => {
    if (employeeFilters.graduation_year && String(emp.graduationYear) !== String(employeeFilters.graduation_year)) {
      return false;
    }
    if (employeeFilters.program && emp.program !== employeeFilters.program) {
      return false;
    }
    if (employeeFilters.status && emp.status !== employeeFilters.status) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <PageHero
        images={EMPLOYER_PORTAL_HERO_IMAGES}
        eyebrow="Employer Portal"
        title="Manage Your SLU Partnership"
        subtitle="View your alumni employees, participate in events, and provide feedback"
        description="Connect with SLU alumni at your organization, participate in career events, and help shape the future of SLU education through your feedback."
        actions={[
          { to: '/', label: 'Back to Home', variant: 'secondary' },
          { href: '#profile', label: 'Get Started' },
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Employer Profile Banner */}
        {profileLoading ? (
          <div className="mb-10 text-center py-12 text-slate-500">
            <div className="animate-pulse">Loading company profile...</div>
          </div>
        ) : employerProfile ? (
          <div className="mb-10 rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-sluBlue to-blue-700 p-8 text-white">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex-shrink-0">
                  {employerProfile.logo_url ? (
                    <img 
                      src={employerProfile.logo_url} 
                      alt={employerProfile.employer_name || 'Company Logo'}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg bg-white p-2"
                      onError={(e) => { 
                        e.target.src = '/assets/employers/Comp img1.jpeg';
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white shadow-lg flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {employerProfile.employer_name ? employerProfile.employer_name.charAt(0).toUpperCase() : 'C'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{employerProfile.employer_name || 'Company Name'}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    {employerProfile.industry && (
                      <div>
                        <span className="text-blue-200">Industry:</span>
                        <span className="ml-2 font-semibold">{employerProfile.industry}</span>
                      </div>
                    )}
                    {(employerProfile.hq_city || employerProfile.hq_state || employerProfile.hq_country) && (
                      <div>
                        <span className="text-blue-200">Headquarters:</span>
                        <span className="ml-2 font-semibold">
                          {[employerProfile.hq_city, employerProfile.hq_state, employerProfile.hq_country].filter(Boolean).join(', ') || 'N/A'}
                        </span>
                      </div>
                    )}
                    {employerProfile.website && (
                      <div>
                        <span className="text-blue-200">Website:</span>
                        <a 
                          href={employerProfile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 font-semibold hover:underline"
                        >
                          {employerProfile.website}
                        </a>
                      </div>
                    )}
                    {employerProfile.products && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <span className="text-blue-200">Products & Services:</span>
                        <span className="ml-2 font-semibold">
                          {employerProfile.products.length > 100 
                            ? `${employerProfile.products.substring(0, 100)}...` 
                            : employerProfile.products}
                        </span>
                      </div>
                    )}
                    {employerProfile.slu_relation && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <span className="text-blue-200">Relationship with SLU:</span>
                        <span className="ml-2 font-semibold">
                          {employerProfile.slu_relation.length > 100 
                            ? `${employerProfile.slu_relation.substring(0, 100)}...` 
                            : employerProfile.slu_relation}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Relationship Snapshot */}
        <div className="mb-10 bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-xl border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-sluBlue mb-6">Your Relationship Snapshot with SLU</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-sluBlue">
              <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">SLU Alumni Employed</div>
              <div className="text-4xl font-light text-sluBlue">{relationshipSnapshot.alumniEmployed}</div>
            </div>
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-blue-500">
              <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Events Participated</div>
              <div className="text-4xl font-light text-blue-600">{relationshipSnapshot.eventsParticipated}</div>
            </div>
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-amber-500">
              <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Pending Requests</div>
              <div className="text-4xl font-light text-amber-600">{relationshipSnapshot.pendingRequests}</div>
            </div>
            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-emerald-500">
              <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Feedback Submitted</div>
              <div className="text-4xl font-light text-emerald-600">{relationshipSnapshot.feedbackSubmitted}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-slate-200 p-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                activeTab === 'profile'
                  ? 'bg-sluBlue text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              🏢 Company Profile
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                activeTab === 'employees'
                  ? 'bg-sluBlue text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              👥 SLU Alumni at Your Company
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                activeTab === 'events'
                  ? 'bg-sluBlue text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              📅 SLU Hiring & Engagement Events
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                activeTab === 'feedback'
                  ? 'bg-sluBlue text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              💬 Alumni Technical Feedback
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                activeTab === 'requests'
                  ? 'bg-sluBlue text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              📋 My Requests
            </button>
          </div>
        </div>

        {/* Status Message */}
        {status.type && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              status.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : status.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {status.message}
          </div>
        )}

        {/* Tab 1: Company Profile */}
        {activeTab === 'profile' && (
          <div id="profile" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-sluBlue mb-3">Company Profile</h2>
                <p className="text-slate-600 text-lg leading-relaxed">
                  View and manage your organization's information and relationship with SLU.
                </p>
              </div>
              
              {/* Profile Summary */}
              {employerProfile && (
                <div className="mb-8 p-6 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">Quick Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {employerProfile.industry && (
                      <div className="flex items-start">
                        <span className="font-semibold text-slate-700 min-w-[100px]">Industry:</span>
                        <span className="ml-2 text-slate-600">{employerProfile.industry}</span>
                      </div>
                    )}
                    {(employerProfile.hq_city || employerProfile.hq_state || employerProfile.hq_country) && (
                      <div className="flex items-start">
                        <span className="font-semibold text-slate-700 min-w-[100px]">Headquarters:</span>
                        <span className="ml-2 text-slate-600">
                          {[employerProfile.hq_city, employerProfile.hq_state, employerProfile.hq_country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    {employerProfile.website && (
                      <div className="flex items-start">
                        <span className="font-semibold text-slate-700 min-w-[100px]">Website:</span>
                        <a href={employerProfile.website} target="_blank" rel="noopener noreferrer" className="ml-2 text-sluBlue hover:underline break-all">
                          {employerProfile.website}
                        </a>
                      </div>
                    )}
                    {employerProfile.products && (
                      <div className="md:col-span-2">
                        <span className="font-semibold text-slate-700 block mb-1">Products & Services:</span>
                        <span className="text-slate-600 leading-relaxed">{employerProfile.products.substring(0, 150)}{employerProfile.products.length > 150 ? '...' : ''}</span>
                      </div>
                    )}
                    {employerProfile.slu_relation && (
                      <div className="md:col-span-2">
                        <span className="font-semibold text-slate-700 block mb-1">Relationship with SLU:</span>
                        <span className="text-slate-600 leading-relaxed">{employerProfile.slu_relation.substring(0, 150)}{employerProfile.slu_relation.length > 150 ? '...' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full px-6 py-3 bg-sluBlue text-white rounded-lg font-semibold hover:bg-blue-800 transition-all shadow-md hover:shadow-lg"
                >
                  ✏️ Edit Profile
                </button>
              )}

          {isEditingProfile ? (
            <form onSubmit={handleProfileUpdate} className="space-y-6 bg-white rounded-xl shadow-lg border border-slate-200 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={profileFormData.employer_name}
                    onChange={(e) => setProfileFormData({ ...profileFormData, employer_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    required
                  />
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Industry *
                  </label>
                  <input
                    type="text"
                    value={profileFormData.industry}
                    onChange={(e) => setProfileFormData({ ...profileFormData, industry: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    required
                  />
                </div>

                {/* Headquarters City */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Headquarters City
                  </label>
                  <input
                    type="text"
                    value={profileFormData.hq_city}
                    onChange={(e) => setProfileFormData({ ...profileFormData, hq_city: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    placeholder="e.g., St. Louis"
                  />
                </div>

                {/* Headquarters State */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Headquarters State
                  </label>
                  <input
                    type="text"
                    value={profileFormData.hq_state}
                    onChange={(e) => setProfileFormData({ ...profileFormData, hq_state: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    placeholder="e.g., MO"
                  />
                </div>

                {/* Headquarters Country */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Headquarters Country
                  </label>
                  <input
                    type="text"
                    value={profileFormData.hq_country}
                    onChange={(e) => setProfileFormData({ ...profileFormData, hq_country: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    placeholder="e.g., USA"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={profileFormData.website}
                    onChange={(e) => setProfileFormData({ ...profileFormData, website: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    placeholder="https://www.company.com"
                  />
                </div>

                {/* Logo URL */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={profileFormData.logo_url}
                    onChange={(e) => setProfileFormData({ ...profileFormData, logo_url: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    placeholder="https://www.company.com/logo.png"
                  />
                  <p className="mt-1 text-xs text-slate-500">URL to your company logo image</p>
                </div>
              </div>

              {/* Products/Services */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Products & Services
                </label>
                <textarea
                  rows={3}
                  value={profileFormData.products}
                  onChange={(e) => setProfileFormData({ ...profileFormData, products: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                  placeholder="Describe your company's main products, services, or offerings..."
                />
              </div>

              {/* Relationship with SLU */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Relationship with SLU
                </label>
                <textarea
                  rows={4}
                  value={profileFormData.slu_relation}
                  onChange={(e) => setProfileFormData({ ...profileFormData, slu_relation: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                  placeholder="Describe your company's relationship with SLU: partnership history, hiring programs, events participation, mentorship programs, etc."
                />
                <p className="mt-1 text-xs text-slate-500">Help SLU understand your partnership and engagement history</p>
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex-1 px-6 py-3 bg-sluBlue text-white rounded-lg font-semibold hover:bg-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {profileLoading ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile(false);
                    loadEmployerProfile(); // Reset form
                  }}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              {employerProfile ? (
                <>
                  {/* Company Logo and Basic Info */}
                  <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 shadow-sm">
                    {employerProfile.logo_url && (
                      <img 
                        src={employerProfile.logo_url} 
                        alt={employerProfile.employer_name || 'Company Logo'}
                        className="w-28 h-28 object-contain rounded-xl border-2 border-slate-200 bg-white p-3 shadow-sm"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold text-sluBlue mb-3">{employerProfile.employer_name || 'N/A'}</h3>
                      <div className="space-y-2">
                        <p className="text-slate-700">
                          <span className="font-semibold text-slate-800">Industry:</span> <span className="text-slate-600">{employerProfile.industry || 'N/A'}</span>
                        </p>
                        {(employerProfile.hq_city || employerProfile.hq_state || employerProfile.hq_country) && (
                          <p className="text-slate-700">
                            <span className="font-semibold text-slate-800">Headquarters:</span>{' '}
                            <span className="text-slate-600">
                              {[
                                employerProfile.hq_city,
                                employerProfile.hq_state,
                                employerProfile.hq_country
                              ].filter(Boolean).join(', ') || 'N/A'}
                            </span>
                          </p>
                        )}
                        {employerProfile.website && (
                          <p className="text-slate-700">
                            <span className="font-semibold text-slate-800">Website:</span>{' '}
                            <a href={employerProfile.website} target="_blank" rel="noopener noreferrer" className="text-sluBlue hover:underline font-medium">
                              {employerProfile.website}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Products & Services */}
                  {employerProfile.products && (
                    <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="text-xl font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200">Products & Services</h4>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-line">{employerProfile.products}</p>
                    </div>
                  )}

                  {/* Relationship with SLU */}
                  {employerProfile.slu_relation && (
                    <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="text-xl font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200">Relationship with SLU</h4>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-line">{employerProfile.slu_relation}</p>
                    </div>
                  )}

                  {!employerProfile.products && !employerProfile.slu_relation && (
                    <div className="text-center py-12 p-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                      <p className="text-slate-600 font-medium mb-2">No additional company information available.</p>
                      <p className="text-sm text-slate-500">Click "Edit Profile" to add products, services, and SLU relationship details.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <div className="animate-pulse">
                    <p className="text-lg">Loading company information...</p>
                  </div>
                </div>
              )}
            </div>
          )}
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              {/* Image Slider Section */}
              <div className="relative h-64 md:h-72 overflow-hidden rounded-t-xl">
                <HeroSlider 
                  images={EMPLOYER_BENEFITS_IMAGES} 
                  interval={5000}
                >
                  <div className="text-center px-4">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                      Company Profile Benefits
                    </h3>
                    <p className="text-sm md:text-base text-white/90 drop-shadow-md">
                      Maximize your partnership with SLU
                    </p>
                  </div>
                </HeroSlider>
              </div>

              {/* Benefits Cards Section */}
              <div className="p-8 bg-gradient-to-br from-slate-50 to-white">
                <div className="space-y-6">
                  <div className="flex items-start p-6 bg-white rounded-xl hover:shadow-xl transition-all border-2 border-blue-100 hover:border-blue-300 group">
                    <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-6 shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sluBlue text-xl mb-3">Complete Profile</h4>
                      <p className="text-slate-600 leading-relaxed text-base">Showcase your company's products, services, and relationship with SLU. A comprehensive profile helps SLU better understand your organization and match you with the right opportunities.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start p-6 bg-white rounded-xl hover:shadow-xl transition-all border-2 border-amber-100 hover:border-amber-300 group">
                    <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mr-6 shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sluBlue text-xl mb-3">Strengthen Partnership</h4>
                      <p className="text-slate-600 leading-relaxed text-base">Help SLU understand your partnership history and engagement. Share your collaboration story to build stronger connections and unlock new opportunities for mutual growth.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start p-6 bg-white rounded-xl hover:shadow-xl transition-all border-2 border-emerald-100 hover:border-emerald-300 group">
                    <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mr-6 shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sluBlue text-xl mb-3">Better Visibility</h4>
                      <p className="text-slate-600 leading-relaxed text-base">Your complete profile helps SLU match you with the right opportunities. Increase your visibility among students, alumni, and faculty to attract top talent and expand your network.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: SLU Alumni at Your Company */}
        {activeTab === 'employees' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-sluBlue mb-6">SLU Alumni at Your Company</h2>
              <p className="text-slate-600 mb-6">
                View and coordinate with SLU alumni currently employed at your organization. Connect with your team, view their profiles, and build stronger relationships.
              </p>

              {/* Your Alumni Summary KPIs */}
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border-l-4 border-sluBlue">
                  <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Verified SLU Alumni Count</div>
                  <div className="text-4xl font-light text-[#002F6C]">{alumniSummary.verifiedCount}</div>
                </div>
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border-l-4 border-blue-500">
                  <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Programs Represented</div>
                  <div className="text-4xl font-light text-[#002F6C]">{alumniSummary.programsRepresented}</div>
                </div>
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border-l-4 border-emerald-500">
                  <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Locations Represented</div>
                  <div className="text-4xl font-light text-[#002F6C]">{alumniSummary.locationsRepresented}</div>
                </div>
              </div>
              {employerProfile && (
                <div className="flex items-center gap-4 mb-4">
                  {employerProfile.logo_url && (
                    <img 
                      src={employerProfile.logo_url} 
                      alt={employerProfile.employer_name || 'Company Logo'}
                      className="w-16 h-16 object-contain rounded-lg border border-slate-200 bg-white p-2"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div>
                    <p className="text-slate-600 text-sm font-semibold">{employerProfile.employer_name} • {employerProfile.industry || 'N/A'}</p>
                  </div>
                </div>
              )}
              <p className="text-sm text-slate-500 mb-4">
                <strong>Note:</strong> This data is maintained by SLU administrators. If you don't see any employees, it may be because your organization's alumni employment records haven't been added to the system yet, or the filters are too restrictive.
              </p>
              {alumniEmployees.length > 0 && (
                <p className="text-sm text-slate-600 mb-4">
                  <strong>Total employees:</strong> {alumniEmployees.length} | <strong>Filtered:</strong> {filteredEmployees.length}
                </p>
              )}
            </div>

            {/* Filters */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Year</label>
                  <select
                    value={employeeFilters.graduation_year}
                    onChange={(e) => setEmployeeFilters({ ...employeeFilters, graduation_year: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue"
                  >
                    <option value="">All Years</option>
                    {graduationYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Program</label>
                  <select
                    value={employeeFilters.program}
                    onChange={(e) => setEmployeeFilters({ ...employeeFilters, program: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue"
                  >
                    <option value="">All Programs</option>
                    {uniquePrograms.map((program) => (
                      <option key={program} value={program}>
                        {program}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={employeeFilters.status}
                    onChange={(e) => setEmployeeFilters({ ...employeeFilters, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue"
                  >
                    <option value="">All Statuses</option>
                    <option value="Verified">Verified</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
              {(employeeFilters.graduation_year || employeeFilters.program || employeeFilters.status) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEmployeeFilters({ graduation_year: '', program: '', status: '' })}
                    className="text-sm text-sluBlue hover:text-sluBlue/80 font-semibold"
                  >
                    Clear Filters
                  </button>
                  <span className="text-sm text-slate-500">
                    ({filteredEmployees.length} of {alumniEmployees.length} employees)
                  </span>
                </div>
              )}
            </div>

            {employeesLoading ? (
              <div className="text-center py-12 text-slate-500">Loading employees...</div>
            ) : (
              <div className="overflow-x-auto">
                {alumniEmployees.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 font-medium mb-2">No alumni employees found in the system.</p>
                    <p className="text-sm text-slate-500">
                      This could mean:
                    </p>
                    <ul className="text-sm text-slate-500 mt-2 list-disc list-inside space-y-1">
                      <li>Your organization's alumni employment records haven't been added yet</li>
                      <li>You're logged in with a different employer account</li>
                      <li>Contact SLU admin to add your organization's alumni employee data</li>
                    </ul>
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600 font-medium mb-2">No employees match the current filters.</p>
                    <p className="text-sm text-slate-500 mb-3">
                      Try adjusting your filter criteria or{' '}
                      <button
                        onClick={() => setEmployeeFilters({ graduation_year: '', program: '', status: '' })}
                        className="text-sluBlue hover:underline font-semibold"
                      >
                        clear all filters
                      </button>
                      {' '}to see all {alumniEmployees.length} employees.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEmployees.map((emp) => (
                      <div key={emp.id} className="bg-white rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-all p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <img 
                            src={emp.photoPath || '/assets/alumni/student1.jpeg'} 
                            alt={emp.alumniName}
                            className="w-20 h-20 rounded-full object-cover border-3 border-sluBlue shadow-md"
                            onError={(e) => { 
                              e.target.src = '/assets/alumni/student1.jpeg';
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-sluBlue mb-1">{emp.alumniName}</h4>
                            <p className="text-sm text-slate-600 font-medium mb-2">{emp.jobTitle}</p>
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                emp.status === 'Verified'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {emp.status}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Program:</span>
                            <span className="font-medium text-slate-700">{emp.program}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Graduated:</span>
                            <span className="font-medium text-slate-700">{emp.graduationYear}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Location:</span>
                            <span className="font-medium text-slate-700">{emp.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Start Date:</span>
                            <span className="font-medium text-slate-700">{emp.startDate}</span>
                          </div>
                          {emp.email && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">Email:</span>
                              <a 
                                href={`mailto:${emp.email}`}
                                className="text-sluBlue hover:underline font-medium truncate"
                                title={emp.email}
                              >
                                {emp.email}
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="pt-4 border-t border-slate-200 space-y-2">
                          <button className="w-full bg-sluBlue text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition-all shadow-md hover:shadow-lg text-sm">
                            🤝 Connect & Coordinate
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAlumniForIssue(emp);
                              setShowIssueModal(true);
                            }}
                            className="w-full bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg font-semibold hover:bg-slate-200 transition-all text-sm"
                          >
                            ⚠️ Report Issue
                          </button>
                          <p className="text-xs text-slate-400 text-center mt-3 italic">
                            Employment records managed by SLU administrators.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: SLU Hiring & Engagement Events */}
        {activeTab === 'events' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-sluBlue mb-6">SLU Hiring & Engagement Events</h2>
              <p className="text-slate-600 mb-6">
                Participate in SLU career fairs, panels, mentorship programs, and other engagement events.
              </p>

              {/* My Event Stats */}
              <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border-l-4 border-amber-500">
                  <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Events Requested</div>
                  <div className="text-4xl font-light text-amber-600">{eventStats.requested}</div>
                </div>
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border-l-4 border-emerald-500">
                  <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Events Approved</div>
                  <div className="text-4xl font-light text-emerald-600">{eventStats.approved}</div>
                </div>
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border-l-4 border-blue-500">
                  <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Upcoming Events</div>
                  <div className="text-4xl font-light text-blue-600">{eventStats.upcoming}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Available Events */}
              <div>
                <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Available Events</h3>
                      <p className="text-sm text-slate-600">Join SLU career fairs, networking sessions, and professional events</p>
                    </div>
                  </div>
                  {eventsLoading ? (
                    <div className="text-center py-8 text-slate-500">Loading events...</div>
                  ) : availableEvents.length === 0 ? (
                    <div className="text-center py-8 p-6 bg-white rounded-lg border-2 border-dashed border-slate-300">
                      <p className="text-slate-600 font-medium mb-2">No upcoming events available.</p>
                      <p className="text-sm text-slate-500">Check back soon for new opportunities to connect with SLU talent.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {availableEvents.map((event) => (
                        <div key={event.event_key} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border-l-4 border-sluBlue">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-sluBlue to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-sluBlue mb-2">{event.event_name || `Event ${event.event_key}`}</h4>
                              <div className="space-y-2">
                                <p className="text-slate-600">
                                  <span className="font-semibold text-slate-700">Type:</span> {event.event_type || 'N/A'}
                                </p>
                                <p className="text-slate-600">
                                  <span className="font-semibold text-slate-700">Date:</span> {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'TBD'}
                                </p>
                                {event.venue && (
                                  <p className="text-slate-600">
                                    <span className="font-semibold text-slate-700">Location:</span> {event.venue}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRequestParticipation(event.event_key)}
                            disabled={participatingEvent === event.event_key}
                            className="w-full px-4 py-2.5 bg-sluBlue text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {participatingEvent === event.event_key ? '⏳ Requesting...' : '📅 Request to Participate'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* My Event Participation */}
              <div>
                <div className="mb-6 p-6 bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">My Event Participation</h3>
                        <p className="text-sm text-slate-600">Track your event requests and participation history</p>
                      </div>
                    </div>
                    <select
                      value={eventFilter}
                      onChange={(e) => setEventFilter(e.target.value)}
                      className="px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue bg-white shadow-sm"
                    >
                      <option value="all">All Events</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="past">Past</option>
                    </select>
                  </div>
                  {filteredParticipations.length === 0 ? (
                    <div className="text-center py-8 p-6 bg-white rounded-lg border-2 border-dashed border-slate-300">
                      <p className="text-slate-600 font-medium mb-2">No event participations {eventFilter !== 'all' ? `(${eventFilter})` : ''} yet.</p>
                      <p className="text-sm text-slate-500">Request to participate in available events to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredParticipations.map((part) => (
                        <div key={part.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border-l-4 border-sluBlue">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-sluBlue to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-sluBlue mb-2">{part.event_name || `Event ${part.event_key}`}</h4>
                              <div className="space-y-2">
                                <p className="text-slate-600">
                                  <span className="font-semibold text-slate-700">Date:</span> {part.event_date || 'TBD'}
                                </p>
                                <p className="text-slate-600">
                                  <span className="font-semibold text-slate-700">Status:</span>{' '}
                                  <span
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                      part.participation_status === 'Approved'
                                        ? 'bg-green-100 text-green-800'
                                        : part.participation_status === 'Rejected'
                                        ? 'bg-red-100 text-red-800'
                                        : part.participation_status === 'Completed'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {part.participation_status}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Alumni Technical Feedback */}
        {activeTab === 'feedback' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-sluBlue mb-6">Alumni Technical Feedback</h2>
              <p className="text-slate-600 mb-6">
                Share your feedback about SLU alumni technical strengths and areas for improvement. Your honest feedback—both positive and negative—helps SLU enhance curriculum and better prepare future graduates. Please include specific concerns about technical skills, technologies, or job readiness.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
                <h3 className="text-xl font-bold text-sluBlue mb-6">Submit New Feedback</h3>
                <form onSubmit={handleFeedbackSubmit} className="space-y-6">
            {/* Overall Rating */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Overall Rating * <span className="text-xs text-slate-500">(1-5 scale)</span>
              </label>
              <select
                value={formData.rating_overall}
                onChange={(e) => setFormData({ ...formData, rating_overall: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                required
              >
                <option value="">Select rating...</option>
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Very Good</option>
                <option value="3">3 - Good</option>
                <option value="2">2 - Fair</option>
                <option value="1">1 - Needs Improvement</option>
              </select>
            </div>

            {/* Comment/Feedback */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Comment / Feedback <span className="text-xs text-slate-500">(Optional but recommended)</span>
              </label>
              <textarea
                value={formData.comment_overall}
                onChange={(e) => setFormData({ ...formData, comment_overall: e.target.value })}
                rows={4}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                placeholder="Share specific concerns, strengths, or areas for improvement. For example: 'Strong in data analysis but needs more backend development experience' or 'Excellent problem-solving skills but struggles with cloud technologies'..."
              />
              <p className="mt-1 text-xs text-slate-500">Please be specific about technical strengths and weaknesses</p>
            </div>

            {/* Technical Strength Level */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Technical Strength Level * <span className="text-xs text-slate-500">(Overall assessment)</span>
              </label>
              <select
                value={formData.tech_strength_level}
                onChange={(e) => setFormData({ ...formData, tech_strength_level: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                required
              >
                <option value="">Select level...</option>
                <option value="Strong">Strong - Alumni demonstrate excellent technical skills</option>
                <option value="Average">Average - Alumni have adequate technical skills with room for growth</option>
                <option value="Needs Improvement">Needs Improvement - Alumni require significant technical skill development</option>
              </select>
            </div>

            {/* Technologies */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Technologies * <span className="text-xs text-slate-500">(Where are strengths/weaknesses?)</span>
              </label>
              <input
                type="text"
                value={formData.technologies}
                onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                placeholder="e.g., Java, React, SQL, Power BI, Python, AWS"
                required
              />
              <p className="mt-1 text-xs text-slate-500">List technologies where alumni show strengths or need improvement (comma-separated). Required.</p>
            </div>

            {/* Job Role */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Job Role * <span className="text-xs text-slate-500">(Role context for this feedback)</span>
              </label>
              <input
                type="text"
                value={formData.job_role}
                onChange={(e) => setFormData({ ...formData, job_role: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                placeholder="e.g., Data Analyst, QA Engineer, Full Stack Developer"
                required
              />
            </div>

            {/* Graduation Year */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Graduation Year * <span className="text-xs text-slate-500">(Which cohort?)</span>
              </label>
              <select
                value={formData.graduation_year}
                onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                required
              >
                <option value="">Select graduation year...</option>
                {graduationYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Upload Image <span className="text-xs text-slate-500">(Optional - Showcase alumni work or achievements)</span>
              </label>
              {!formData.imagePreview ? (
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-sluBlue transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="feedback-image-upload"
                  />
                  <label
                    htmlFor="feedback-image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <svg className="w-12 h-12 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-slate-600 font-medium mb-1">Click to upload image</span>
                    <span className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB</span>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border-2 border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                    aria-label="Remove image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <p className="mt-2 text-xs text-slate-500 text-center">
                    Image selected: {formData.image?.name}
                  </p>
                </div>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Upload an image showcasing alumni work, achievements, or team collaboration. This will be displayed in the gallery after admin approval.
              </p>
            </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-sluBlue text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '⏳ Submitting...' : '📝 Submit Feedback'}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
                <h3 className="text-xl font-bold text-sluBlue mb-6">Why Your Feedback Matters</h3>
                <div className="space-y-5">
                  <div className="flex items-start p-5 bg-gradient-to-r from-blue-50 to-transparent rounded-xl hover:shadow-lg transition-all border border-blue-100">
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-5 shadow-md">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sluBlue text-lg mb-2">Improve Curriculum</h4>
                      <p className="text-slate-600 leading-relaxed">Your feedback helps SLU enhance programs and better prepare future graduates.</p>
                    </div>
                  </div>
                  <div className="flex items-start p-5 bg-gradient-to-r from-purple-50 to-transparent rounded-xl hover:shadow-lg transition-all border border-purple-100">
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-5 shadow-md">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sluBlue text-lg mb-2">Better Job Readiness</h4>
                      <p className="text-slate-600 leading-relaxed">Identify gaps in technical skills to help SLU align education with industry needs.</p>
                    </div>
                  </div>
                  <div className="flex items-start p-5 bg-gradient-to-r from-amber-50 to-transparent rounded-xl hover:shadow-lg transition-all border border-amber-100">
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mr-5 shadow-md">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sluBlue text-lg mb-2">Stronger Partnership</h4>
                      <p className="text-slate-600 leading-relaxed">Your insights strengthen the relationship between SLU and employers.</p>
                    </div>
                  </div>
                  <div className="flex items-start p-5 bg-gradient-to-r from-emerald-50 to-transparent rounded-xl hover:shadow-lg transition-all border border-emerald-100">
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mr-5 shadow-md">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sluBlue text-lg mb-2">Data-Driven Decisions</h4>
                      <p className="text-slate-600 leading-relaxed">Help SLU make informed decisions about curriculum and program development.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Previous Feedback Submitted Table */}
            <div className="mt-8 bg-white rounded-xl shadow-lg border border-slate-200 p-8">
              <h3 className="text-2xl font-bold text-sluBlue mb-6">Previous Feedback Submitted</h3>
              {feedbackHistoryLoading ? (
                <div className="text-center py-12 text-slate-500">
                  <div className="animate-pulse">Loading feedback history...</div>
                </div>
              ) : myFeedbackHistory.length === 0 ? (
                <div className="text-center py-12 p-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                  <p className="text-slate-600 font-medium">No feedback submitted yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Graduation Year</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Job Role</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Rating</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Strength Level</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Technologies</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {myFeedbackHistory.map((feedback) => (
                        <tr key={feedback.feedback_id} className="hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-slate-700">
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{feedback.graduation_year}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{feedback.job_role}</td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-sluBlue">{feedback.rating_overall}/5</span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                feedback.tech_strength_level === 'Strong'
                                  ? 'bg-green-100 text-green-800'
                                  : feedback.tech_strength_level === 'Average'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {feedback.tech_strength_level}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {feedback.technologies ? (feedback.technologies.length > 50 
                              ? feedback.technologies.substring(0, 50) + '...' 
                              : feedback.technologies) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report Issue Modal */}
        {showIssueModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-sluBlue">Report Employment Issue</h3>
                <button
                  onClick={() => {
                    setShowIssueModal(false);
                    setIssueFormData({ issue_type: '', comments: '' });
                    setSelectedAlumniForIssue(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              {selectedAlumniForIssue && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl border border-slate-200">
                  <p className="text-sm text-slate-700 mb-1">
                    <span className="font-semibold text-slate-800">Alumni:</span> <span className="text-slate-600">{selectedAlumniForIssue.alumniName}</span>
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-800">Job Title:</span> <span className="text-slate-600">{selectedAlumniForIssue.jobTitle}</span>
                  </p>
                </div>
              )}
              <form onSubmit={handleReportIssue} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Issue Type * <span className="text-xs text-slate-500 font-normal">(Required)</span>
                  </label>
                  <select
                    value={issueFormData.issue_type}
                    onChange={(e) => setIssueFormData({ ...issueFormData, issue_type: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    required
                  >
                    <option value="">Select issue type...</option>
                    <option value="Wrong title">Wrong title</option>
                    <option value="Wrong location">Wrong location</option>
                    <option value="Not an employee">Not an employee</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Comments <span className="text-xs text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={issueFormData.comments}
                    onChange={(e) => setIssueFormData({ ...issueFormData, comments: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    placeholder="Please provide additional details about the issue..."
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-sluBlue text-white rounded-lg font-semibold hover:bg-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '⏳ Submitting...' : '📤 Submit Issue'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowIssueModal(false);
                      setIssueFormData({ issue_type: '', comments: '' });
                      setSelectedAlumniForIssue(null);
                    }}
                    className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* My Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-sluBlue mb-6">My Requests & Submissions</h2>
              <p className="text-slate-600 mb-6">
                View all your submitted requests, event participations, and feedback. Track their status and manage your communication with SLU.
              </p>
            </div>

            {submissionsLoading ? (
              <div className="text-center py-12 text-slate-500">Loading your requests...</div>
            ) : (
              <div className="space-y-8">
                {/* Event Participations */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                  <h3 className="text-2xl font-bold text-sluBlue mb-4 flex items-center gap-2">
                    📅 Event Participation Requests ({allMySubmissions.eventParticipations.length})
                  </h3>
                  {allMySubmissions.eventParticipations.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No event participation requests submitted yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {allMySubmissions.eventParticipations.map((participation) => {
                        const participationId = participation.participation_id || participation.id;
                        return (
                        <div key={participationId || `participation-${participation.event_key}-${participation.employer_key}`} className={`border-2 rounded-lg p-4 hover:shadow-md transition ${
                          participation.participation_status === 'Approved'
                            ? 'border-green-300 bg-green-50/30'
                            : participation.participation_status === 'Rejected'
                            ? 'border-red-300 bg-red-50/30'
                            : participation.participation_status === 'Completed'
                            ? 'border-blue-300 bg-blue-50/30'
                            : 'border-slate-200 bg-white'
                        }`}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-bold text-slate-900 text-lg">{participation.event_name || `Event ${participation.event_key}`}</h4>
                                {participation.participation_status === 'Approved' && (
                                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              {participation.event_date && (
                                <p className="text-sm text-slate-600 mb-1">
                                  <span className="font-semibold">Event Date:</span>{' '}
                                  {new Date(participation.event_date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </p>
                              )}
                              <p className="text-sm text-slate-600 mb-1">Event ID: {participation.event_key}</p>
                              <p className="text-sm text-slate-500 mt-2">
                                Requested: {new Date(participation.requested_at || participation.created_at).toLocaleString()}
                              </p>
                              {participation.participation_status === 'Approved' && (
                                <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-300">
                                  <p className="text-sm font-semibold text-green-800">
                                    ✓ Your participation request has been approved! You're confirmed to participate in this event.
                                  </p>
                                </div>
                              )}
                              {participation.participation_status === 'Rejected' && (
                                <div className="mt-3 p-3 bg-red-100 rounded-lg border border-red-300">
                                  <p className="text-sm font-semibold text-red-800">
                                    ✗ Your participation request was not approved for this event.
                                  </p>
                                </div>
                              )}
                              {participation.participation_status === 'Completed' && (
                                <div className="mt-3 p-3 bg-blue-100 rounded-lg border border-blue-300">
                                  <p className="text-sm font-semibold text-blue-800">
                                    ✓ This event has been completed. Thank you for your participation!
                                  </p>
                                </div>
                              )}
                              {(!participation.participation_status || participation.participation_status === 'Requested') && (
                                <div className="mt-3 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                                  <p className="text-sm font-semibold text-yellow-800">
                                    ⏳ Your request is pending admin approval. You'll be notified once it's reviewed.
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  participation.participation_status === 'Approved'
                                    ? 'bg-green-100 text-green-800'
                                    : participation.participation_status === 'Rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : participation.participation_status === 'Completed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {participation.participation_status || 'Requested'}
                              </span>
                            </div>
                          </div>
                          {participation.notes && (
                            <div className="mt-3 p-3 bg-slate-50 rounded">
                              <p className="text-sm font-semibold text-slate-700 mb-1">Notes:</p>
                              <p className="text-sm text-slate-600">{participation.notes}</p>
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Feedback */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                  <h3 className="text-2xl font-bold text-sluBlue mb-4 flex items-center gap-2">
                    💬 Alumni Technical Feedback ({allMySubmissions.feedback.length})
                  </h3>
                  {allMySubmissions.feedback.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No feedback submitted yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {allMySubmissions.feedback.map((feedback) => (
                        <div key={feedback.feedback_id} className={`border-2 rounded-lg p-4 hover:shadow-md transition ${
                          feedback.approved_by_admin === '1'
                            ? 'border-green-300 bg-green-50/30'
                            : 'border-yellow-300 bg-yellow-50/30'
                        }`}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-bold text-slate-900">Rating: {feedback.rating_overall}/5</h4>
                                {feedback.approved_by_admin === '1' && (
                                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 mb-2">
                                {feedback.job_role && <p><span className="font-semibold">Job Role:</span> {feedback.job_role}</p>}
                                {feedback.graduation_year && <p><span className="font-semibold">Graduation Year:</span> {feedback.graduation_year}</p>}
                                {feedback.tech_strength_level && (
                                  <p><span className="font-semibold">Tech Strength:</span> {feedback.tech_strength_level}</p>
                                )}
                              </div>
                              {feedback.technologies && (
                                <p className="text-sm text-slate-600 mb-2">
                                  <span className="font-semibold">Technologies:</span> {feedback.technologies}
                                </p>
                              )}
                              <p className="text-sm text-slate-500 mt-2">
                                Submitted: {new Date(feedback.created_at).toLocaleString()}
                              </p>
                              {feedback.approved_by_admin === '1' && (
                                <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-300">
                                  <p className="text-sm font-semibold text-green-800">
                                    ✓ Your feedback has been approved and is now visible to SLU administrators.
                                  </p>
                                </div>
                              )}
                              {feedback.approved_by_admin === '0' && (
                                <div className="mt-3 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                                  <p className="text-sm font-semibold text-yellow-800">
                                    ⏳ Your feedback is pending admin approval. It will be reviewed shortly.
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  feedback.approved_by_admin === '1'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {feedback.approved_by_admin === '1' ? 'Approved' : 'Pending'}
                              </span>
                            </div>
                          </div>
                          {feedback.comment_overall && (
                            <div className="mt-3 p-3 bg-slate-50 rounded">
                              <p className="text-sm font-semibold text-slate-700 mb-1">Comment:</p>
                              <p className="text-sm text-slate-600 whitespace-pre-wrap">{feedback.comment_overall}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer Section */}
      <div className="container mx-auto px-4 py-8">
        <GalleryFooter />
      </div>
    </div>
  );
};

export default EmployerPortal;
