import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadAllData } from '../data/loadData';
import { useAuth } from '../context/AuthContext';
import HeroSlider from '../components/HeroSlider';
import GalleryFooter from '../components/GalleryFooter';
import { fetchMyColleagues, fetchMyProfile, updateAlumniProfile } from '../services/alumniApi';
import { deleteSubmission, getApprovedSuccessStories, getMySubmissions, getAllMyAlumniSubmissions } from '../services/requestsApi';

const ALUMNI_PORTAL_HERO_IMAGES = [
  {
    src: '/assets/hero/alumni banner img1.jpg',
    alt: 'Alumni networking and engagement',
    caption: 'Connect, engage, and grow with the SLU alumni community.',
  },
  {
    src: '/assets/hero/Alumni img5.jpg',
    alt: 'Mentorship and career development',
    caption: 'Mentorship opportunities that shape careers and build futures.',
  },
  {
    src: '/assets/hero/engagement img1.jpeg',
    alt: 'Alumni events and networking',
    caption: 'Join events that strengthen your professional network.',
  },
];

const AlumniPortal = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    eventApplication: {
      event_key: '',
      student_key: '',
      full_name: '',
      email: '',
      phone: '',
      program: '',
      graduation_year: '',
      interest_reason: '',
      previous_attendance: false,
    },
    engagement: {
      student_key: '',
      event_key: '',
      employer_key: '',
      engagement_type: 'event',
      mentorship_hours: '',
      feedback_score: '',
      feedback_notes: '',
      referrals_made: '',
      participated_university_event_flag: false,
    },
    successStory: {
      student_key: '',
      full_name: '',
      program: '',
      graduation_year: '',
      current_role: '',
      employer_name: '',
      story_title: '',
      story_content: '',
      achievements: '',
      photo_url: '',
    },
  });
  const [submissionStatus, setSubmissionStatus] = useState({ type: null, message: '' });
  const [colleagues, setColleagues] = useState([]);
  const [myCompany, setMyCompany] = useState(null);
  const [myEmployment, setMyEmployment] = useState(null);
  const [colleaguesLoading, setColleaguesLoading] = useState(false);
  const [alumniProfile, setAlumniProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileStats, setProfileStats] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    current_city: '',
    current_state: '',
    current_country: '',
    program_name: '',
    graduation_year: '',
  });
  const [mySuccessStories, setMySuccessStories] = useState([]);
  const [approvedStories, setApprovedStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [allMySubmissions, setAllMySubmissions] = useState({
    eventApplications: [],
    successStories: [],
    engagementFeedback: [],
  });
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [eventFilter, setEventFilter] = useState('all'); // 'all', 'upcoming', 'past'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const loadedData = await loadAllData();
      setData(loadedData);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Load alumni profile and stats
  useEffect(() => {
    if (token) {
      loadAlumniProfile();
    }
  }, [token]);

  // Load colleagues when network tab is active
  useEffect(() => {
    if (activeTab === 'network' && token) {
      loadColleagues();
    }
  }, [activeTab, token]);

  // Load my success stories and approved stories
  useEffect(() => {
    if (token && user?.student_key) {
      loadMyStories();
      loadApprovedStories();
    }
  }, [token, user, activeTab]);

  // Load all my submissions when requests tab is active or when switching to events tab
  useEffect(() => {
    if ((activeTab === 'requests' || activeTab === 'events') && token) {
      // For alumni, require student_key. For admin, allow (backend handles it)
      if (user?.role === 'alumni' && !user?.student_key) {
        return;
      }
      loadAllMySubmissions();
    }
  }, [activeTab, token, user]);

  // Auto-refresh submissions when on requests tab to catch status updates from admin
  useEffect(() => {
    if (activeTab === 'requests' && token) {
      // For alumni, require student_key. For admin, allow (backend handles it)
      if (user?.role === 'alumni' && !user?.student_key) {
        return;
      }
      const interval = setInterval(() => {
        loadAllMySubmissions();
      }, 10000); // Refresh every 10 seconds to catch status updates
      return () => clearInterval(interval);
    }
  }, [activeTab, token, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAlumniProfile = async () => {
    if (!token) return;
    try {
      setProfileLoading(true);
      const data = await fetchMyProfile(token);
      setAlumniProfile(data.profile || null);
      setProfileStats(data.stats || null);
      setMyEmployment(data.employment || null);
      
      // Populate form data for editing
      if (data.profile) {
        setProfileFormData({
          first_name: data.profile.first_name || '',
          last_name: data.profile.last_name || '',
          email: data.profile.email || '',
          phone: data.profile.phone || '',
          current_city: data.profile.current_city || '',
          current_state: data.profile.current_state || '',
          current_country: data.profile.current_country || '',
          program_name: data.profile.program || '',
          graduation_year: data.profile.graduation_year || '',
        });
      }
    } catch (error) {
      console.error('Failed to load alumni profile:', error);
      setAlumniProfile(null);
      setProfileStats(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!token) {
      setSubmissionStatus({ type: 'error', message: 'Please log in to update profile.' });
      return;
    }

    try {
      setProfileLoading(true);
      const data = await updateAlumniProfile(profileFormData, token);
      setAlumniProfile({ ...alumniProfile, ...data.profile });
      setSubmissionStatus({ type: 'success', message: 'Profile updated successfully!' });
      setIsEditingProfile(false);
      loadAlumniProfile(); // Reload to get updated data
    } catch (error) {
      setSubmissionStatus({ type: 'error', message: error.message || 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const loadColleagues = async () => {
    if (!token) return;
    try {
      setColleaguesLoading(true);
      const data = await fetchMyColleagues(token);
      setColleagues(data.colleagues || []);
      setMyCompany(data.myCompany || null);
      setMyEmployment(data.myEmployment || null);
    } catch (error) {
      console.error('Failed to load colleagues:', error);
      setColleagues([]);
      setMyCompany(null);
      setMyEmployment(null);
    } finally {
      setColleaguesLoading(false);
    }
  };

  const upcomingEvents = data?.events
    ? data.events
        .filter((event) => {
          const eventDate = new Date(event.start_date);
          return eventDate >= new Date();
        })
        .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
        .slice(0, 10)
    : [];

  // Calculate event stats
  const eventStats = {
    submitted: allMySubmissions.eventApplications.length,
    approved: allMySubmissions.eventApplications.filter(app => app.status === 'approved').length,
    upcoming: allMySubmissions.eventApplications.filter(app => {
      if (!app.event_key || app.status !== 'approved') return false;
      const event = data?.events?.find(e => String(e.event_key) === String(app.event_key));
      if (!event || !event.start_date) return false;
      return new Date(event.start_date) >= new Date();
    }).length,
  };

  // Filter event applications
  const filteredApplications = allMySubmissions.eventApplications.filter(app => {
    if (eventFilter === 'all') return true;
    if (!app.event_key) return eventFilter === 'all';
    const event = data?.events?.find(e => String(e.event_key) === String(app.event_key));
    if (!event || !event.start_date) return eventFilter === 'all';
    const eventDate = new Date(event.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventFilter === 'upcoming') return eventDate >= today;
    if (eventFilter === 'past') return eventDate < today;
    return true;
  });

  const handleEventApplication = async (e) => {
    e.preventDefault();
    setSubmissionStatus({ type: 'loading', message: 'Submitting application...' });

    try {
      // Include student_key from user token
      const applicationData = {
        ...formData.eventApplication,
        student_key: user?.student_key || formData.eventApplication.student_key,
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002'}/api/alumni/event-application`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(applicationData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmissionStatus({ type: 'success', message: 'Event application submitted successfully! Admin will review and confirm your registration.' });
        setFormData((prev) => ({
          ...prev,
          eventApplication: {
            event_key: '',
            student_key: '',
            full_name: '',
            email: '',
            phone: '',
            program: '',
            graduation_year: '',
            interest_reason: '',
            previous_attendance: false,
          },
        }));
        // Reload submissions to show the new application
        if (activeTab === 'requests' || activeTab === 'events') {
          loadAllMySubmissions();
        }
      } else {
        setSubmissionStatus({ type: 'error', message: result.error || 'Failed to submit application' });
      }
    } catch (error) {
      setSubmissionStatus({ type: 'error', message: 'Network error. Please try again.' });
    }
  };

  const handleEngagementSubmission = async (e) => {
    e.preventDefault();
    setSubmissionStatus({ type: 'loading', message: 'Submitting engagement...' });

    try {
      // Include student_key from user token
      const engagementData = {
        ...formData.engagement,
        student_key: user?.student_key || formData.engagement.student_key,
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002'}/api/alumni/engagement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(engagementData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmissionStatus({ type: 'success', message: 'Engagement participation recorded successfully! Thank you for your contribution.' });
        setFormData((prev) => ({
          ...prev,
          engagement: {
            student_key: '',
            event_key: '',
            employer_key: '',
            engagement_type: 'event',
            mentorship_hours: '',
            feedback_score: '',
            feedback_notes: '',
            referrals_made: '',
            participated_university_event_flag: false,
          },
        }));
        // Reload submissions to show the new engagement
        if (activeTab === 'requests') {
          loadAllMySubmissions();
        }
      } else {
        setSubmissionStatus({ type: 'error', message: result.error || 'Failed to submit engagement' });
      }
    } catch (error) {
      setSubmissionStatus({ type: 'error', message: 'Network error. Please try again.' });
    }
  };

  const loadMyStories = async () => {
    if (!token || !user?.student_key) return;
    try {
      setStoriesLoading(true);
      const stories = await getMySubmissions('success-stories');
      // Filter to only my stories
      const myStories = stories.filter(s => String(s.student_key) === String(user.student_key));
      setMySuccessStories(myStories);
    } catch (error) {
      console.error('Failed to load my stories:', error);
      setMySuccessStories([]);
    } finally {
      setStoriesLoading(false);
    }
  };

  const loadApprovedStories = async () => {
    try {
      const data = await getApprovedSuccessStories();
      // Filter to only my approved stories
      if (user?.student_key) {
        const myApproved = data.stories.filter(s => String(s.student_key) === String(user.student_key));
        setApprovedStories(myApproved);
      } else {
        setApprovedStories(data.stories || []);
      }
    } catch (error) {
      console.error('Failed to load approved stories:', error);
      setApprovedStories([]);
    }
  };

  const loadAllMySubmissions = async () => {
    if (!token) {
      return;
    }
    
    // For alumni role, require student_key. For admin, allow (backend will handle it)
    if (user?.role === 'alumni' && !user?.student_key) {
      return;
    }
    
    try {
      setSubmissionsLoading(true);
      const submissions = await getAllMyAlumniSubmissions(token);
      
      // Backend now filters by student_key, so we can use the data directly
      const finalSubmissions = {
        eventApplications: submissions.eventApplications || [],
        successStories: submissions.successStories || [],
        engagementFeedback: submissions.engagementFeedback || [],
      };
      
      setAllMySubmissions(finalSubmissions);
    } catch (error) {
      console.error('Failed to load all submissions:', error);
      setAllMySubmissions({
        eventApplications: [],
        successStories: [],
        engagementFeedback: [],
      });
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this success story? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteSubmission('success-stories', storyId);
      setSubmissionStatus({ type: 'success', message: 'Success story deleted successfully.' });
      loadMyStories();
      loadApprovedStories();
    } catch (error) {
      setSubmissionStatus({ type: 'error', message: error.message || 'Failed to delete story' });
    }
  };

  const handleSuccessStorySubmission = async (e) => {
    e.preventDefault();
    setSubmissionStatus({ type: 'loading', message: 'Submitting success story...' });

    try {
      // Include student_key from user token
      const submissionData = {
        ...formData.successStory,
        student_key: user?.student_key || formData.successStory.student_key,
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002'}/api/alumni/success-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmissionStatus({ type: 'success', message: 'Success story submitted successfully! Admin will review and publish it.' });
        setFormData((prev) => ({
          ...prev,
          successStory: {
            student_key: '',
            full_name: '',
            program: '',
            graduation_year: '',
            current_role: '',
            employer_name: '',
            story_title: '',
            story_content: '',
            achievements: '',
            photo_url: '',
          },
        }));
        // Reload stories and submissions
        loadMyStories();
        if (activeTab === 'requests' || activeTab === 'stories') {
          loadAllMySubmissions();
        }
      } else {
        setSubmissionStatus({ type: 'error', message: result.error || 'Failed to submit success story' });
      }
    } catch (error) {
      setSubmissionStatus({ type: 'error', message: 'Network error. Please try again.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-sluBlue">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Hero Slider Section */}
      <div className="container mx-auto px-4 pt-6">
        <div className="h-[450px] md:h-[550px]">
          <HeroSlider images={ALUMNI_PORTAL_HERO_IMAGES} interval={5000}>
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-2xl">
                Alumni Portal
              </h1>
              <p className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto drop-shadow-lg">
                Connect, engage, and grow with the SLU alumni community
              </p>
            </div>
          </HeroSlider>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Alumni Profile Section */}
        {profileLoading ? (
          <div className="mb-10 text-center py-12 text-slate-500">
            <div className="animate-pulse">Loading your profile...</div>
          </div>
        ) : alumniProfile && profileStats ? (
          <div className="mb-10 rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Blue Banner Section */}
            <div className="bg-gradient-to-r from-sluBlue to-blue-700 p-8 text-white">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="flex-shrink-0">
                  {alumniProfile.student_key && (
                    <img 
                      src={`/assets/alumni/student${(parseInt(alumniProfile.student_key) % 12) + 1}.${(parseInt(alumniProfile.student_key) % 12) + 1 <= 6 ? 'jpeg' : 'jpg'}`}
                      alt={alumniProfile.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      onError={(e) => { 
                        e.target.src = '/assets/alumni/student1.jpeg';
                      }}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{alumniProfile.name}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-blue-200">Email:</span>
                      <span className="ml-2 font-semibold">{alumniProfile.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-blue-200">Program:</span>
                      <span className="ml-2 font-semibold">{alumniProfile.program || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-blue-200">Graduated:</span>
                      <span className="ml-2 font-semibold">{alumniProfile.graduation_year || profileStats?.graduation_year || 'N/A'}</span>
                    </div>
                    {(myEmployment || profileStats) && (
                      <>
                        <div>
                          <span className="text-blue-200">Current Role:</span>
                          <span className="ml-2 font-semibold">{myEmployment?.job_title || profileStats?.role || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-blue-200">Company:</span>
                          <span className="ml-2 font-semibold">{myEmployment?.company_name || profileStats?.company_name || 'Not Employed'}</span>
                        </div>
                        {myEmployment && (
                          <>
                            <div>
                              <span className="text-blue-200">Start Date:</span>
                              <span className="ml-2 font-semibold">{myEmployment.start_date || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-blue-200">Location:</span>
                              <span className="ml-2 font-semibold">{myEmployment.location || 'N/A'}</span>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        ) : null}

        {/* Engagement Snapshot */}
        {profileStats && (
          <div className="mb-10 bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-xl border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-sluBlue mb-6">Your Engagement Snapshot with SLU</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-sluBlue">
                <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Events Attended</div>
                <div className="text-4xl font-light text-sluBlue">{profileStats.events_attended}</div>
              </div>
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-blue-500">
                <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Upcoming Events</div>
                <div className="text-4xl font-light text-blue-600">{profileStats.upcoming_events}</div>
              </div>
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-amber-500">
                <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Events Registered</div>
                <div className="text-4xl font-light text-amber-600">{profileStats.events_registered}</div>
              </div>
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 border-emerald-500">
                <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Colleagues</div>
                <div className="text-4xl font-light text-emerald-600">{profileStats.colleagues_count}</div>
              </div>
            </div>
          </div>
        )}

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
              👤 Alumni Profile
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                activeTab === 'events'
                  ? 'bg-sluBlue text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              📅 Apply for Events
            </button>
            <button
              onClick={() => setActiveTab('engagement')}
              className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                activeTab === 'engagement'
                  ? 'bg-sluBlue text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              🤝 Participate in Engagements
            </button>
            <button
              onClick={() => setActiveTab('stories')}
              className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                activeTab === 'stories'
                  ? 'bg-sluBlue text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ✨ Share Success Story
            </button>
            <button
              onClick={() => setActiveTab('network')}
              className={`px-6 py-3 font-semibold rounded-lg transition-all ${
                activeTab === 'network'
                  ? 'bg-sluBlue text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              👥 My Network
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-3 font-semibold rounded-lg transition-all relative ${
                activeTab === 'requests'
                  ? 'bg-sluBlue text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              📋 My Requests
              {(() => {
                const pendingCount = 
                  allMySubmissions.eventApplications.filter(app => !app.status || app.status === 'pending').length +
                  allMySubmissions.successStories.filter(story => !story.status || story.status === 'pending').length +
                  allMySubmissions.engagementFeedback.filter(fb => (!fb.status || fb.status === 'pending') && fb.approved_by_admin !== '1').length;
                if (pendingCount > 0) {
                  return (
                    <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingCount}
                    </span>
                  );
                }
                return null;
              })()}
            </button>
          </div>
        </div>

        {/* Status Message */}
        {submissionStatus.type && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              submissionStatus.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : submissionStatus.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {submissionStatus.message}
          </div>
        )}

        {/* Tab 1: Alumni Profile */}
        {activeTab === 'profile' && (
          <div id="profile" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-sluBlue mb-3">Alumni Profile</h2>
                <p className="text-slate-600 text-lg leading-relaxed">
                  View and manage your alumni information and engagement with SLU.
                </p>
              </div>
              
              {/* Profile Summary */}
              {alumniProfile && profileStats && (
                <div className="mb-8 p-6 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">Quick Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {alumniProfile.email && (
                      <div className="flex items-start">
                        <span className="font-semibold text-slate-700 min-w-[100px]">Email:</span>
                        <span className="ml-2 text-slate-600">{alumniProfile.email}</span>
                      </div>
                    )}
                    {alumniProfile.program && (
                      <div className="flex items-start">
                        <span className="font-semibold text-slate-700 min-w-[100px]">Program:</span>
                        <span className="ml-2 text-slate-600">{alumniProfile.program}</span>
                      </div>
                    )}
                    {(alumniProfile.graduation_year || profileStats?.graduation_year) && (
                      <div className="flex items-start">
                        <span className="font-semibold text-slate-700 min-w-[100px]">Graduated:</span>
                        <span className="ml-2 text-slate-600">{alumniProfile.graduation_year || profileStats?.graduation_year}</span>
                      </div>
                    )}
                    {(myEmployment?.job_title || profileStats?.role) && (
                      <div className="flex items-start">
                        <span className="font-semibold text-slate-700 min-w-[100px]">Current Role:</span>
                        <span className="ml-2 text-slate-600">{myEmployment?.job_title || profileStats?.role || 'N/A'}</span>
                      </div>
                    )}
                    {(myEmployment?.company_name || profileStats?.company_name) && (
                      <div className="md:col-span-2">
                        <span className="font-semibold text-slate-700 block mb-1">Company:</span>
                        <span className="text-slate-600">{myEmployment?.company_name || profileStats?.company_name || 'Not Employed'}</span>
                      </div>
                    )}
                    {myEmployment?.location && (
                      <div className="flex items-start">
                        <span className="font-semibold text-slate-700 min-w-[100px]">Location:</span>
                        <span className="ml-2 text-slate-600">{myEmployment.location}</span>
                      </div>
                    )}
                    {myEmployment?.start_date && (
                      <div className="flex items-start">
                        <span className="font-semibold text-slate-700 min-w-[100px]">Start Date:</span>
                        <span className="ml-2 text-slate-600">{myEmployment.start_date}</span>
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
                {/* First Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={profileFormData.first_name}
                    onChange={(e) => setProfileFormData({ ...profileFormData, first_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    required
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={profileFormData.last_name}
                    onChange={(e) => setProfileFormData({ ...profileFormData, last_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={profileFormData.email}
                    onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profileFormData.phone}
                    onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    placeholder="e.g., (314) 555-1234"
                  />
                </div>

                {/* Current City */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Current City
                  </label>
                  <input
                    type="text"
                    value={profileFormData.current_city}
                    onChange={(e) => setProfileFormData({ ...profileFormData, current_city: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    placeholder="e.g., St. Louis"
                  />
                </div>

                {/* Current State */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Current State
                  </label>
                  <input
                    type="text"
                    value={profileFormData.current_state}
                    onChange={(e) => setProfileFormData({ ...profileFormData, current_state: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    placeholder="e.g., MO"
                  />
                </div>

                {/* Current Country */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Current Country
                  </label>
                  <input
                    type="text"
                    value={profileFormData.current_country}
                    onChange={(e) => setProfileFormData({ ...profileFormData, current_country: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    placeholder="e.g., USA"
                  />
                </div>

                {/* Program Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Program *
                  </label>
                  <input
                    type="text"
                    value={profileFormData.program_name}
                    onChange={(e) => setProfileFormData({ ...profileFormData, program_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    required
                  />
                </div>

                {/* Graduation Year */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Graduation Year *
                  </label>
                  <input
                    type="text"
                    value={profileFormData.graduation_year}
                    onChange={(e) => setProfileFormData({ ...profileFormData, graduation_year: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    required
                  />
                </div>
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
                    loadAlumniProfile(); // Reset form
                  }}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              {alumniProfile ? (
                <>
                  {/* Alumni Photo and Basic Info */}
                  <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 shadow-sm">
                    {alumniProfile.student_key && (
                      <img 
                        src={`/assets/alumni/student${(parseInt(alumniProfile.student_key) % 12) + 1}.${(parseInt(alumniProfile.student_key) % 12) + 1 <= 6 ? 'jpeg' : 'jpg'}`}
                        alt={alumniProfile.name}
                        className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
                        onError={(e) => { 
                          e.target.src = '/assets/alumni/student1.jpeg';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold text-sluBlue mb-3">{alumniProfile.name || 'N/A'}</h3>
                      <div className="space-y-2">
                        <p className="text-slate-700">
                          <span className="font-semibold text-slate-800">Program:</span> <span className="text-slate-600">{alumniProfile.program || 'N/A'}</span>
                        </p>
                        <p className="text-slate-700">
                          <span className="font-semibold text-slate-800">Graduation Year:</span> <span className="text-slate-600">{alumniProfile.graduation_year || profileStats?.graduation_year || 'N/A'}</span>
                        </p>
                        {(myEmployment?.job_title || profileStats?.role) && (
                          <p className="text-slate-700">
                            <span className="font-semibold text-slate-800">Current Role:</span> <span className="text-slate-600">{myEmployment?.job_title || profileStats?.role || 'N/A'}</span>
                          </p>
                        )}
                        {(myEmployment?.company_name || profileStats?.company_name) && (
                          <p className="text-slate-700">
                            <span className="font-semibold text-slate-800">Company:</span> <span className="text-slate-600">{myEmployment?.company_name || profileStats?.company_name || 'Not Employed'}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Employment Information */}
                  {myEmployment && (
                    <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="text-xl font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200">Employment Information</h4>
                      <div className="space-y-2 text-slate-600">
                        {myEmployment.job_title && (
                          <p><span className="font-semibold text-slate-800">Job Title:</span> {myEmployment.job_title}</p>
                        )}
                        {myEmployment.location && (
                          <p><span className="font-semibold text-slate-800">Location:</span> {myEmployment.location}</p>
                        )}
                        {myEmployment.start_date && (
                          <p><span className="font-semibold text-slate-800">Start Date:</span> {myEmployment.start_date}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {!myEmployment && (
                    <div className="text-center py-12 p-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                      <p className="text-slate-600 font-medium mb-2">No employment information available.</p>
                      <p className="text-sm text-slate-500">Update your alumni record through the Contact page to add employment details.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <div className="animate-pulse">
                    <p className="text-lg">Loading alumni information...</p>
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
                  images={ALUMNI_PORTAL_HERO_IMAGES} 
                  interval={5000}
                >
                  <div className="text-center px-4">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                      Alumni Portal Benefits
                    </h3>
                    <p className="text-sm md:text-base text-white/90 drop-shadow-md">
                      Connect, engage, and grow with SLU
                    </p>
                  </div>
                </HeroSlider>
              </div>

              {/* Benefits Cards Section */}
              <div className="p-8 bg-gradient-to-br from-slate-50 to-white">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Why Stay Connected?</h3>
                <div className="space-y-4">
                  <div className="p-5 bg-gradient-to-r from-blue-50 to-transparent rounded-xl hover:shadow-lg transition-all border border-blue-100">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-md flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-sluBlue text-lg mb-2">Professional Network</h4>
                        <p className="text-slate-600 leading-relaxed">Connect with fellow alumni, employers, and expand your professional network.</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 bg-gradient-to-r from-blue-50 to-transparent rounded-xl hover:shadow-lg transition-all border border-blue-100">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-md flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-sluBlue text-lg mb-2">Career Opportunities</h4>
                        <p className="text-slate-600 leading-relaxed">Access exclusive events, job opportunities, and mentorship programs.</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 bg-gradient-to-r from-blue-50 to-transparent rounded-xl hover:shadow-lg transition-all border border-blue-100">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-md flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-sluBlue text-lg mb-2">Alumni Community</h4>
                        <p className="text-slate-600 leading-relaxed">Stay connected with your SLU community and give back through mentorship and engagement.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Apply for Events */}
        {activeTab === 'events' && (
          <div id="apply" className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-sluBlue mb-6">Apply for Events</h2>
              <p className="text-slate-600 mb-6">
                Apply to attend upcoming SLU events. Your application will be reviewed by the admin team, and you'll receive confirmation once approved.
              </p>

              {/* My Event Stats */}
              <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border-l-4 border-amber-500">
                  <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Applications Submitted</div>
                  <div className="text-4xl font-light text-amber-600">{eventStats.submitted}</div>
                </div>
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border-l-4 border-emerald-500">
                  <div className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Applications Approved</div>
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
                      <p className="text-sm text-slate-600">Browse and apply to upcoming SLU events</p>
                    </div>
                  </div>
                  {upcomingEvents.length === 0 ? (
                    <div className="text-center py-8 p-6 bg-white rounded-lg border-2 border-dashed border-slate-300">
                      <p className="text-slate-600 font-medium mb-2">No upcoming events available.</p>
                      <p className="text-sm text-slate-500">Check back soon for new opportunities to connect with SLU.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingEvents.map((event) => {
                        const existingApp = allMySubmissions.eventApplications.find(
                          app => String(app.event_key) === String(event.event_key)
                        );
                        return (
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
                                  {existingApp && (
                                    <p className={`text-sm font-semibold mt-2 ${
                                      existingApp.status === 'approved' ? 'text-green-700' :
                                      existingApp.status === 'rejected' ? 'text-red-700' :
                                      'text-yellow-700'
                                    }`}>
                                      {existingApp.status === 'approved' && '✓ Approved'}
                                      {existingApp.status === 'rejected' && '✗ Rejected'}
                                      {(!existingApp.status || existingApp.status === 'pending') && '⏳ Pending'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  eventApplication: { ...prev.eventApplication, event_key: event.event_key },
                                }));
                                // Scroll to form
                                document.getElementById('event-application-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }}
                              disabled={existingApp && (existingApp.status === 'approved' || existingApp.status === 'pending')}
                              className="w-full px-4 py-2.5 bg-sluBlue text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {existingApp?.status === 'approved' ? '✓ Already Approved' :
                               existingApp?.status === 'pending' ? '⏳ Application Pending' :
                               '📅 Apply to Event'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Application Form */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8" id="event-application-form">
                  <div className="mb-6 p-6 bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">Event Application Form</h3>
                        <p className="text-sm text-slate-600">Complete the form below to apply for an event</p>
                      </div>
                    </div>
                  </div>
                  <form onSubmit={handleEventApplication} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Select Event <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.eventApplication.event_key}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        eventApplication: { ...prev.eventApplication, event_key: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                  >
                    <option value="">Choose an event...</option>
                    {upcomingEvents.map((event) => {
                      const existingApp = allMySubmissions.eventApplications.find(
                        app => String(app.event_key) === String(event.event_key)
                      );
                      const statusLabel = existingApp 
                        ? existingApp.status === 'approved' 
                          ? ' (✓ Approved)' 
                          : existingApp.status === 'rejected'
                          ? ' (✗ Rejected)'
                          : ' (⏳ Pending)'
                        : '';
                      return (
                        <option key={event.event_key} value={event.event_key}>
                          {event.event_name} - {new Date(event.start_date).toLocaleDateString()}{statusLabel}
                        </option>
                      );
                    })}
                  </select>
                  {/* Show status if event already has an application */}
                  {formData.eventApplication.event_key && (() => {
                    const existingApp = allMySubmissions.eventApplications.find(
                      app => String(app.event_key) === String(formData.eventApplication.event_key)
                    );
                    if (existingApp) {
                      return (
                        <div className={`mt-2 p-3 rounded-lg border-2 ${
                          existingApp.status === 'approved'
                            ? 'bg-green-50 border-green-300'
                            : existingApp.status === 'rejected'
                            ? 'bg-red-50 border-red-300'
                            : 'bg-yellow-50 border-yellow-300'
                        }`}>
                          <p className={`text-sm font-semibold ${
                            existingApp.status === 'approved'
                              ? 'text-green-800'
                              : existingApp.status === 'rejected'
                              ? 'text-red-800'
                              : 'text-yellow-800'
                          }`}>
                            {existingApp.status === 'approved' && '✓ You have already applied and been approved for this event!'}
                            {existingApp.status === 'rejected' && '✗ Your previous application for this event was rejected.'}
                            {(!existingApp.status || existingApp.status === 'pending') && '⏳ You have a pending application for this event. Check "My Requests" for updates.'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.eventApplication.full_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        eventApplication: { ...prev.eventApplication, full_name: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.eventApplication.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          eventApplication: { ...prev.eventApplication, email: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.eventApplication.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          eventApplication: { ...prev.eventApplication, phone: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Program</label>
                    <input
                      type="text"
                      value={formData.eventApplication.program}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          eventApplication: { ...prev.eventApplication, program: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Graduation Year</label>
                    <input
                      type="number"
                      value={formData.eventApplication.graduation_year}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          eventApplication: { ...prev.eventApplication, graduation_year: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Why are you interested in this event? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.eventApplication.interest_reason}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        eventApplication: { ...prev.eventApplication, interest_reason: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="previous_attendance"
                    checked={formData.eventApplication.previous_attendance}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        eventApplication: { ...prev.eventApplication, previous_attendance: e.target.checked },
                      }))
                    }
                    className="mr-2"
                  />
                  <label htmlFor="previous_attendance" className="text-sm text-slate-700">
                    I have attended SLU events before
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-sluBlue text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✉️ Submit Application
                </button>
              </form>
            </div>

              </div>

              {/* My Event Applications */}
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
                        <h3 className="text-xl font-bold text-slate-800">My Event Applications</h3>
                        <p className="text-sm text-slate-600">Track your event applications and status</p>
                      </div>
                    </div>
                    <select
                      value={eventFilter}
                      onChange={(e) => setEventFilter(e.target.value)}
                      className="px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue bg-white shadow-sm"
                    >
                      <option value="all">All Applications</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="past">Past</option>
                    </select>
                  </div>
                  {filteredApplications.length === 0 ? (
                    <div className="text-center py-8 p-6 bg-white rounded-lg border-2 border-dashed border-slate-300">
                      <p className="text-slate-600 font-medium mb-2">No event applications {eventFilter !== 'all' ? `(${eventFilter})` : ''} yet.</p>
                      <p className="text-sm text-slate-500">Apply to available events to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredApplications.map((app) => {
                        const event = data?.events?.find(e => String(e.event_key) === String(app.event_key));
                        return (
                          <div key={app.application_id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border-l-4 border-sluBlue">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-sluBlue to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-xl font-bold text-sluBlue mb-2">{event?.event_name || `Event ${app.event_key}`}</h4>
                                <div className="space-y-2">
                                  {event?.start_date && (
                                    <p className="text-slate-600">
                                      <span className="font-semibold text-slate-700">Date:</span> {new Date(event.start_date).toLocaleDateString()}
                                    </p>
                                  )}
                                  {event?.venue && (
                                    <p className="text-slate-600">
                                      <span className="font-semibold text-slate-700">Venue:</span> {event.venue}
                                    </p>
                                  )}
                                  <p className="text-slate-600">
                                    <span className="font-semibold text-slate-700">Status:</span>{' '}
                                    <span
                                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                        app.status === 'approved'
                                          ? 'bg-green-100 text-green-800'
                                          : app.status === 'rejected'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}
                                    >
                                      {app.status === 'approved' ? 'Approved' :
                                       app.status === 'rejected' ? 'Rejected' :
                                       app.status || 'Pending'}
                                    </span>
                                  </p>
                                  {app.submitted_at && (
                                    <p className="text-xs text-slate-500 mt-2">
                                      Submitted on {new Date(app.submitted_at).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Participate in Engagements */}
        {activeTab === 'engagement' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-sluBlue mb-6">Participate in Engagements</h2>
              <p className="text-slate-600 mb-6">
                Record your participation in events, mentorship activities, and other engagements. This helps us track alumni involvement and impact.
              </p>
            </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
              <form onSubmit={handleEngagementSubmission} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Engagement Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.engagement.engagement_type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        engagement: { ...prev.engagement, engagement_type: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                  >
                    <option value="event">Event Participation</option>
                    <option value="mentorship">Mentorship</option>
                    <option value="networking">Networking</option>
                    <option value="volunteer">Volunteer Work</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Event (if applicable)</label>
                  <select
                    value={formData.engagement.event_key}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        engagement: { ...prev.engagement, event_key: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                  >
                    <option value="">Select an event...</option>
                    {data?.events?.map((event) => (
                      <option key={event.event_key} value={event.event_key}>
                        {event.event_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mentorship Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.engagement.mentorship_hours}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        engagement: { ...prev.engagement, mentorship_hours: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Feedback Score (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.engagement.feedback_score}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        engagement: { ...prev.engagement, feedback_score: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Feedback Notes</label>
                  <textarea
                    rows={4}
                    value={formData.engagement.feedback_notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        engagement: { ...prev.engagement, feedback_notes: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Referrals Made</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.engagement.referrals_made}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        engagement: { ...prev.engagement, referrals_made: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="university_event"
                    checked={formData.engagement.participated_university_event_flag}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        engagement: { ...prev.engagement, participated_university_event_flag: e.target.checked },
                      }))
                    }
                    className="mr-2"
                  />
                  <label htmlFor="university_event" className="text-sm text-slate-700">
                    Participated in a SLU university event
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-sluBlue text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✨ Submit Engagement
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
              <div className="mb-6 p-6 bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Engagement Benefits</h3>
                    <p className="text-sm text-slate-600">Why your participation matters</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-5 bg-gradient-to-r from-blue-50 to-transparent rounded-xl hover:shadow-lg transition-all border border-blue-100">
                  <div className="flex items-start">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-5 shadow-md flex-shrink-0">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-sluBlue text-lg mb-2">Track Your Impact</h4>
                      <p className="text-slate-600 leading-relaxed">Your engagement helps us measure the success of SLU programs and improve future initiatives.</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-r from-blue-50 to-transparent rounded-xl hover:shadow-lg transition-all border border-blue-100">
                  <div className="flex items-start">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-5 shadow-md flex-shrink-0">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-sluBlue text-lg mb-2">Build Your Network</h4>
                      <p className="text-slate-600 leading-relaxed">Connect with other alumni and expand your professional network through meaningful interactions.</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-r from-blue-50 to-transparent rounded-xl hover:shadow-lg transition-all border border-blue-100">
                  <div className="flex items-start">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-5 shadow-md flex-shrink-0">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-sluBlue text-lg mb-2">Recognition</h4>
                      <p className="text-slate-600 leading-relaxed">Top engaged alumni are recognized in our community highlights and featured in SLU publications.</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-r from-blue-50 to-transparent rounded-xl hover:shadow-lg transition-all border border-blue-100">
                  <div className="flex items-start">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-5 shadow-md flex-shrink-0">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-sluBlue text-lg mb-2">Career Opportunities</h4>
                      <p className="text-slate-600 leading-relaxed">Engagement opens doors to mentorship, career opportunities, and exclusive professional development resources.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Tab 4: Share Success Story */}
        {activeTab === 'stories' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-sluBlue mb-6">Share Your Success Story</h2>
              <p className="text-slate-600 mb-6">
                Inspire others by sharing your career journey and achievements. Your story will be reviewed by admin and may be featured on our alumni success stories page.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
              <form onSubmit={handleSuccessStorySubmission} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.successStory.full_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        successStory: { ...prev.successStory, full_name: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Program</label>
                    <input
                      type="text"
                      value={formData.successStory.program}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          successStory: { ...prev.successStory, program: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Graduation Year</label>
                    <input
                      type="number"
                      value={formData.successStory.graduation_year}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          successStory: { ...prev.successStory, graduation_year: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Current Role</label>
                    <input
                      type="text"
                      value={formData.successStory.current_role}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          successStory: { ...prev.successStory, current_role: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Employer Name</label>
                    <input
                      type="text"
                      value={formData.successStory.employer_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          successStory: { ...prev.successStory, employer_name: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Story Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.successStory.story_title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        successStory: { ...prev.successStory, story_title: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    placeholder="e.g., From SLU to Senior Data Scientist"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Your Story <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.successStory.story_content}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        successStory: { ...prev.successStory, story_content: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    placeholder="Share your journey, achievements, and how SLU helped shape your career..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Key Achievements</label>
                  <textarea
                    rows={3}
                    value={formData.successStory.achievements}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        successStory: { ...prev.successStory, achievements: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    placeholder="List your key achievements, awards, or milestones..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Photo URL (optional)</label>
                  <input
                    type="url"
                    value={formData.successStory.photo_url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        successStory: { ...prev.successStory, photo_url: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue transition-all"
                    placeholder="https://..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-sluBlue text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✨ Submit Success Story
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
              <div className="mb-6 p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Why Share Your Story?</h3>
                    <p className="text-sm text-slate-600">Inspire the next generation of Billikens</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-5 bg-gradient-to-r from-purple-50 to-transparent rounded-xl hover:shadow-lg transition-all border border-purple-100">
                  <div className="flex items-start">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-5 shadow-md flex-shrink-0">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-sluBlue text-lg mb-2">Inspire Others</h4>
                      <p className="text-slate-600 leading-relaxed">Your journey can motivate current students and recent graduates to pursue their dreams and overcome challenges.</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-r from-purple-50 to-transparent rounded-xl hover:shadow-lg transition-all border border-purple-100">
                  <div className="flex items-start">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-5 shadow-md flex-shrink-0">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-sluBlue text-lg mb-2">Build Your Brand</h4>
                      <p className="text-slate-600 leading-relaxed">Share your achievements and expertise to enhance your professional reputation within the SLU community.</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-r from-purple-50 to-transparent rounded-xl hover:shadow-lg transition-all border border-purple-100">
                  <div className="flex items-start">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-5 shadow-md flex-shrink-0">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-sluBlue text-lg mb-2">Featured Recognition</h4>
                      <p className="text-slate-600 leading-relaxed">Selected stories may be featured on SLU's website, newsletters, and social media, reaching thousands of alumni and students.</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-r from-purple-50 to-transparent rounded-xl hover:shadow-lg transition-all border border-purple-100">
                  <div className="flex items-start">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-5 shadow-md flex-shrink-0">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-sluBlue text-lg mb-2">Network Expansion</h4>
                      <p className="text-slate-600 leading-relaxed">Connect with other successful alumni and create opportunities for collaboration, mentorship, and professional growth.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* My Success Stories Section */}
            <div className="mt-8 bg-white rounded-xl shadow-lg border border-slate-200 p-8">
              <h3 className="text-2xl font-bold text-sluBlue mb-6">My Success Stories</h3>
              
              {storiesLoading ? (
                <div className="text-center py-8 text-slate-500">Loading your stories...</div>
              ) : (
                <div className="space-y-6">
                  {/* Approved Stories */}
                  {approvedStories.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Approved Stories ({approvedStories.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {approvedStories.map((story) => (
                          <div key={story.story_id} className="border border-green-200 rounded-lg p-4 bg-green-50/50 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-bold text-slate-900">{story.story_title}</h5>
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">Approved</span>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{story.full_name} • {story.program}</p>
                            <p className="text-sm text-slate-700 line-clamp-3 mb-3">{story.story_content}</p>
                            <button
                              onClick={() => handleDeleteStory(story.story_id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pending Stories */}
                  {mySuccessStories.filter(s => s.status === 'pending').length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-yellow-700 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        Pending Approval ({mySuccessStories.filter(s => s.status === 'pending').length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mySuccessStories.filter(s => s.status === 'pending').map((story) => (
                          <div key={story.story_id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50/50 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-bold text-slate-900">{story.story_title}</h5>
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">Pending</span>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{story.full_name} • {story.program}</p>
                            <p className="text-sm text-slate-700 line-clamp-3 mb-3">{story.story_content}</p>
                            <button
                              onClick={() => handleDeleteStory(story.story_id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rejected Stories */}
                  {mySuccessStories.filter(s => s.status === 'rejected').length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        Rejected ({mySuccessStories.filter(s => s.status === 'rejected').length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mySuccessStories.filter(s => s.status === 'rejected').map((story) => (
                          <div key={story.story_id} className="border border-red-200 rounded-lg p-4 bg-red-50/50 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-bold text-slate-900">{story.story_title}</h5>
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">Rejected</span>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{story.full_name} • {story.program}</p>
                            <p className="text-sm text-slate-700 line-clamp-3 mb-3">{story.story_content}</p>
                            <button
                              onClick={() => handleDeleteStory(story.story_id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {mySuccessStories.length === 0 && approvedStories.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <p>You haven't submitted any success stories yet.</p>
                      <p className="text-sm mt-2">Submit your story above to get started!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
          </div>
        )}

        {/* Tab 5: My Network */}
        {activeTab === 'network' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-sluBlue mb-6">My Network - SLU Alumni Colleagues</h2>
              <p className="text-slate-600 mb-6">
                Connect with other SLU alumni who work at the same company. Build your professional network and coordinate with fellow Billikens.
                {user?.student_key && (
                  <span className="block mt-2 text-sm text-slate-500">
                    <strong>Your Student ID:</strong> {user.student_key}
                  </span>
                )}
              </p>
            </div>

            {colleaguesLoading ? (
              <div className="text-center py-12 text-slate-500">Loading your network...</div>
            ) : myCompany && myEmployment ? (
              <>
                {/* Company Info */}
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-sluBlue">
                  <div className="flex items-center gap-4 mb-4">
                    {myCompany.logoUrl && (
                      <img 
                        src={myCompany.logoUrl} 
                        alt={myCompany.employerName}
                        className="w-16 h-16 object-contain rounded-lg border border-slate-200"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-sluBlue">{myCompany.employerName}</h3>
                      <p className="text-slate-600 mb-1">
                        <span className="font-semibold">Industry:</span> {myCompany.industry}
                      </p>
                      {(myCompany.hqCity || myCompany.hqState || myCompany.hqCountry) && (
                        <p className="text-slate-600 mb-1">
                          <span className="font-semibold">Headquarters:</span>{' '}
                          {[myCompany.hqCity, myCompany.hqState, myCompany.hqCountry].filter(Boolean).join(', ') || 'N/A'}
                        </p>
                      )}
                      {myCompany.website && (
                        <p className="text-slate-600">
                          <span className="font-semibold">Website:</span>{' '}
                          <a href={myCompany.website} target="_blank" rel="noopener noreferrer" className="text-sluBlue hover:underline">
                            {myCompany.website}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">
                    You have <strong className="text-sluBlue">{colleagues.length}</strong> SLU alumni colleague{colleagues.length !== 1 ? 's' : ''} at this company.
                  </p>
                </div>

                {/* Colleagues Grid */}
                {colleagues.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {colleagues.map((colleague) => (
                      <div key={colleague.id} className="bg-white rounded-lg shadow-md p-6 border border-slate-200 hover:shadow-lg transition">
                        <div className="flex items-start gap-4 mb-4">
                          <img 
                            src={colleague.photoPath} 
                            alt={colleague.alumniName}
                            className="w-16 h-16 rounded-full object-cover border-2 border-sluBlue"
                            onError={(e) => { 
                              e.target.src = '/assets/alumni/student1.jpeg';
                            }}
                          />
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-sluBlue">{colleague.alumniName}</h4>
                            <p className="text-sm text-slate-600">{colleague.jobTitle}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Program:</span>
                            <span className="font-medium">{colleague.program}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Graduated:</span>
                            <span className="font-medium">{colleague.graduationYear}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Location:</span>
                            <span className="font-medium">{colleague.location}</span>
                          </div>
                          {colleague.email && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">Email:</span>
                              <a 
                                href={`mailto:${colleague.email}`}
                                className="text-sluBlue hover:underline font-medium"
                              >
                                {colleague.email}
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <button className="w-full bg-sluBlue text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition-colors text-sm">
                            Connect & Network
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <p className="text-slate-600 text-lg">You're the only SLU alumni at {myCompany.employerName}.</p>
                    <p className="text-slate-500 text-sm mt-2">Check back later as more alumni join the company!</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-slate-600 text-lg mb-2">No employment information found.</p>
                <p className="text-slate-500 text-sm">You need to be listed as employed at a company to see your network.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: My Requests */}
        {activeTab === 'requests' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-sluBlue mb-6">My Requests & Submissions</h2>
              <p className="text-slate-600 mb-6">
                View all your submitted requests, applications, and feedback. Track their status and manage your submissions.
              </p>
            </div>

            {submissionsLoading ? (
              <div className="text-center py-12 text-slate-500">Loading your requests...</div>
            ) : user?.role === 'alumni' && !user?.student_key ? (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 text-center">
                <p className="text-yellow-800 font-semibold mb-2">⚠️ Student Key Not Found</p>
                <p className="text-yellow-700 text-sm">
                  Your account doesn't have a student key assigned. Please log out and log back in, or contact an administrator.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Request Status Summary */}
                {(() => {
                  const eventApps = allMySubmissions.eventApplications;
                  const stories = allMySubmissions.successStories;
                  const feedback = allMySubmissions.engagementFeedback;
                  
                  const totalPending = 
                    eventApps.filter(app => !app.status || app.status === 'pending').length +
                    stories.filter(story => !story.status || story.status === 'pending').length +
                    feedback.filter(fb => (!fb.status || fb.status === 'pending') && fb.approved_by_admin !== '1').length;
                  
                  const totalApproved = 
                    eventApps.filter(app => app.status === 'approved').length +
                    stories.filter(story => story.status === 'approved').length +
                    feedback.filter(fb => fb.status === 'approved' || fb.approved_by_admin === '1').length;
                  
                  const totalRejected = 
                    eventApps.filter(app => app.status === 'rejected').length +
                    stories.filter(story => story.status === 'rejected').length +
                    feedback.filter(fb => fb.status === 'rejected').length;
                  
                  const totalSubmissions = eventApps.length + stories.length + feedback.length;
                  
                  if (totalSubmissions > 0) {
                    return (
                      <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-blue-50 rounded-xl shadow-lg border-2 border-blue-200 p-6">
                        <h3 className="text-xl font-bold text-sluBlue mb-4 flex items-center gap-2">
                          📊 Request Status Summary
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-white rounded-lg p-4 border-2 border-slate-200 shadow-sm">
                            <div className="text-sm font-semibold text-slate-600 mb-1">Total Submissions</div>
                            <div className="text-3xl font-bold text-slate-800">{totalSubmissions}</div>
                          </div>
                          <div className="bg-white rounded-lg p-4 border-2 border-yellow-300 shadow-sm">
                            <div className="text-sm font-semibold text-yellow-700 mb-1">Pending Review</div>
                            <div className="text-3xl font-bold text-yellow-700">{totalPending}</div>
                            {totalPending > 0 && (
                              <div className="text-xs text-yellow-600 mt-1">Awaiting admin action</div>
                            )}
                          </div>
                          <div className="bg-white rounded-lg p-4 border-2 border-green-300 shadow-sm">
                            <div className="text-sm font-semibold text-green-700 mb-1">Approved</div>
                            <div className="text-3xl font-bold text-green-700">{totalApproved}</div>
                            {totalApproved > 0 && (
                              <div className="text-xs text-green-600 mt-1">✓ Confirmed</div>
                            )}
                          </div>
                          <div className="bg-white rounded-lg p-4 border-2 border-red-300 shadow-sm">
                            <div className="text-sm font-semibold text-red-700 mb-1">Rejected</div>
                            <div className="text-3xl font-bold text-red-700">{totalRejected}</div>
                            {totalRejected > 0 && (
                              <div className="text-xs text-red-600 mt-1">Not approved</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                {/* Event Applications */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                  <h3 className="text-2xl font-bold text-sluBlue mb-4 flex items-center gap-2">
                    📅 Event Applications ({allMySubmissions.eventApplications.length})
                  </h3>
                  {allMySubmissions.eventApplications.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No event applications submitted yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {allMySubmissions.eventApplications.map((app) => {
                        const event = data?.events?.find(e => String(e.event_key) === String(app.event_key));
                        return (
                        <div key={app.application_id} className={`border-2 rounded-lg p-4 hover:shadow-md transition ${
                          app.status === 'approved'
                            ? 'border-green-300 bg-green-50/30'
                            : app.status === 'rejected'
                            ? 'border-red-300 bg-red-50/30'
                            : 'border-yellow-300 bg-yellow-50/30'
                        }`}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-bold text-slate-900 text-lg">
                                  {event?.event_name || `Event ${app.event_key}`}
                                </h4>
                                {app.status === 'approved' && (
                                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              {event?.event_date && (
                                <p className="text-sm text-slate-600 mb-1">
                                  <span className="font-semibold">Event Date:</span>{' '}
                                  {new Date(event.event_date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </p>
                              )}
                              {event?.venue && (
                                <p className="text-sm text-slate-600 mb-1">
                                  <span className="font-semibold">Venue:</span> {event.venue}
                                </p>
                              )}
                              {event?.event_type && (
                                <p className="text-sm text-slate-600 mb-1">
                                  <span className="font-semibold">Type:</span> {event.event_type}
                                </p>
                              )}
                              <p className="text-sm text-slate-600 mb-1">Event ID: {app.event_key}</p>
                              {app.program && <p className="text-sm text-slate-600 mb-1">Program: {app.program}</p>}
                              <p className="text-sm text-slate-500 mt-2">
                                Submitted: {new Date(app.submitted_at || app.created_at).toLocaleString()}
                              </p>
                              {app.status === 'approved' && (
                                <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-300">
                                  <p className="text-sm font-semibold text-green-800">
                                    ✓ Your event application has been approved! You're confirmed to attend this event.
                                  </p>
                                </div>
                              )}
                              {app.status === 'rejected' && (
                                <div className="mt-3 p-3 bg-red-100 rounded-lg border border-red-300">
                                  <p className="text-sm font-semibold text-red-800">
                                    ✗ Your event application was not approved for this event.
                                  </p>
                                </div>
                              )}
                              {(!app.status || app.status === 'pending') && (
                                <div className="mt-3 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                                  <p className="text-sm font-semibold text-yellow-800">
                                    ⏳ Your application is pending admin approval. You'll be notified once it's reviewed.
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  app.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : app.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {app.status || 'Pending'}
                              </span>
                              <button
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to delete this application?')) {
                                    try {
                                      await deleteSubmission('event-applications', app.application_id);
                                      setSubmissionStatus({ type: 'success', message: 'Application deleted successfully.' });
                                      loadAllMySubmissions();
                                    } catch (error) {
                                      setSubmissionStatus({ type: 'error', message: error.message });
                                    }
                                  }
                                }}
                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          {app.interest_reason && (
                            <div className="mt-3 p-3 bg-slate-50 rounded">
                              <p className="text-sm font-semibold text-slate-700 mb-1">Your Interest Reason:</p>
                              <p className="text-sm text-slate-600">{app.interest_reason}</p>
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Success Stories */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                  <h3 className="text-2xl font-bold text-sluBlue mb-4 flex items-center gap-2">
                    ✨ Success Stories ({allMySubmissions.successStories.length})
                  </h3>
                  {allMySubmissions.successStories.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No success stories submitted yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {allMySubmissions.successStories.map((story) => (
                        <div key={story.story_id} className={`border-2 rounded-lg p-4 hover:shadow-md transition ${
                          story.status === 'approved'
                            ? 'border-green-300 bg-green-50/30'
                            : story.status === 'rejected'
                            ? 'border-red-300 bg-red-50/30'
                            : 'border-yellow-300 bg-yellow-50/30'
                        }`}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-bold text-slate-900 text-lg">{story.story_title}</h4>
                                {story.status === 'approved' && (
                                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 mb-2">
                                {story.full_name && <p><span className="font-semibold">Name:</span> {story.full_name}</p>}
                                {story.program && <p><span className="font-semibold">Program:</span> {story.program}</p>}
                                {story.graduation_year && <p><span className="font-semibold">Graduation Year:</span> {story.graduation_year}</p>}
                                {story.current_role && <p><span className="font-semibold">Current Role:</span> {story.current_role}</p>}
                                {story.employer_name && <p><span className="font-semibold">Company:</span> {story.employer_name}</p>}
                              </div>
                              <p className="text-sm text-slate-500 mt-2">
                                Submitted: {new Date(story.submitted_at || story.created_at).toLocaleString()}
                              </p>
                              {story.status === 'approved' && (
                                <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-300">
                                  <p className="text-sm font-semibold text-green-800">
                                    ✓ Your success story has been approved and is now visible in the Gallery page!
                                  </p>
                                </div>
                              )}
                              {story.status === 'rejected' && (
                                <div className="mt-3 p-3 bg-red-100 rounded-lg border border-red-300">
                                  <p className="text-sm font-semibold text-red-800">
                                    ✗ Your success story was not approved for publication.
                                  </p>
                                </div>
                              )}
                              {(!story.status || story.status === 'pending') && (
                                <div className="mt-3 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                                  <p className="text-sm font-semibold text-yellow-800">
                                    ⏳ Your success story is pending admin approval. It will be reviewed shortly.
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  story.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : story.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {story.status || 'Pending'}
                              </span>
                              <button
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to delete this success story?')) {
                                    try {
                                      await deleteSubmission('success-stories', story.story_id);
                                      setSubmissionStatus({ type: 'success', message: 'Success story deleted successfully.' });
                                      loadAllMySubmissions();
                                    } catch (error) {
                                      setSubmissionStatus({ type: 'error', message: error.message });
                                    }
                                  }
                                }}
                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          {story.story_content && (
                            <div className="mt-3 p-3 bg-slate-50 rounded">
                              <p className="text-sm font-semibold text-slate-700 mb-1">Your Story:</p>
                              <p className="text-sm text-slate-600 line-clamp-3">{story.story_content}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Engagement Feedback */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                  <h3 className="text-2xl font-bold text-sluBlue mb-4 flex items-center gap-2">
                    🤝 Engagement Feedback ({allMySubmissions.engagementFeedback.length})
                  </h3>
                  {allMySubmissions.engagementFeedback.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No engagement feedback submitted yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {allMySubmissions.engagementFeedback.map((feedback) => {
                        const event = data?.events?.find(e => String(e.event_key) === String(feedback.event_key));
                        return (
                        <div key={feedback.fact_id || feedback.feedback_id} className={`border-2 rounded-lg p-4 hover:shadow-md transition ${
                          feedback.status === 'approved' || feedback.approved_by_admin === '1'
                            ? 'border-green-300 bg-green-50/30'
                            : feedback.status === 'rejected'
                            ? 'border-red-300 bg-red-50/30'
                            : 'border-yellow-300 bg-yellow-50/30'
                        }`}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-bold text-slate-900">
                                  Engagement Type: {feedback.engagement_type || 'N/A'}
                                </h4>
                                {(feedback.status === 'approved' || feedback.approved_by_admin === '1') && (
                                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              {event && (
                                <p className="text-sm text-slate-600 mb-1">
                                  <span className="font-semibold">Event:</span> {event.event_name || `Event ${feedback.event_key}`}
                                </p>
                              )}
                              {feedback.mentorship_hours && (
                                <p className="text-sm text-slate-600 mb-1">
                                  <span className="font-semibold">Mentorship Hours:</span> {feedback.mentorship_hours}
                                </p>
                              )}
                              {feedback.feedback_score && (
                                <p className="text-sm text-slate-600 mb-1">
                                  <span className="font-semibold">Feedback Score:</span> {feedback.feedback_score}
                                </p>
                              )}
                              {feedback.referrals_made && (
                                <p className="text-sm text-slate-600 mb-1">
                                  <span className="font-semibold">Referrals Made:</span> {feedback.referrals_made}
                                </p>
                              )}
                              <p className="text-sm text-slate-500 mt-2">
                                Submitted: {new Date(feedback.submitted_at || feedback.created_at).toLocaleString()}
                              </p>
                              {(feedback.status === 'approved' || feedback.approved_by_admin === '1') && (
                                <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-300">
                                  <p className="text-sm font-semibold text-green-800">
                                    ✓ Your engagement feedback has been received and recorded. Thank you for your participation!
                                  </p>
                                </div>
                              )}
                              {feedback.status === 'rejected' && (
                                <div className="mt-3 p-3 bg-red-100 rounded-lg border border-red-300">
                                  <p className="text-sm font-semibold text-red-800">
                                    ✗ Your engagement feedback was not accepted.
                                  </p>
                                </div>
                              )}
                              {(!feedback.status || feedback.status === 'pending') && feedback.approved_by_admin !== '1' && (
                                <div className="mt-3 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                                  <p className="text-sm font-semibold text-yellow-800">
                                    ⏳ Your engagement feedback is being processed. Thank you for your submission!
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  feedback.status === 'approved' || feedback.approved_by_admin === '1'
                                    ? 'bg-green-100 text-green-800'
                                    : feedback.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {feedback.status === 'approved' || feedback.approved_by_admin === '1' ? 'Received' : feedback.status || 'Pending'}
                              </span>
                              <button
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to delete this feedback?')) {
                                    try {
                                      await deleteSubmission('engagement-feedback', feedback.fact_id || feedback.feedback_id);
                                      setSubmissionStatus({ type: 'success', message: 'Feedback deleted successfully.' });
                                      loadAllMySubmissions();
                                    } catch (error) {
                                      setSubmissionStatus({ type: 'error', message: error.message });
                                    }
                                  }
                                }}
                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          {feedback.feedback_notes && (
                            <div className="mt-3 p-3 bg-slate-50 rounded">
                              <p className="text-sm font-semibold text-slate-700 mb-1">Your Feedback Notes:</p>
                              <p className="text-sm text-slate-600 whitespace-pre-wrap">{feedback.feedback_notes}</p>
                            </div>
                          )}
                        </div>
                        );
                      })}
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

export default AlumniPortal;

