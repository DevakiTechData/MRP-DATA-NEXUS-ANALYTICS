import { useState, useEffect, useMemo } from 'react';
import { loadAllData } from '../data/loadData';
import { getAlumniImage, getAlumniImageByIndex } from '../utils/alumniImages';
import PageHero from '../components/PageHero';

const ENGAGEMENT_HERO_IMAGES = [
  {
    src: '/assets/hero/engagement img1.jpeg',
    alt: 'Alumni networking at SLU engagement event',
    caption: 'Alumni gatherings that build lifelong professional connections.',
  },
  {
    src: '/assets/hero/engagement img2.jpg',
    alt: 'Mentorship session between alumni and students',
    caption: 'Mentorship circles empowering the next generation of Billikens.',
  },
  {
    src: '/assets/hero/Alumni img1.jpg',
    alt: 'Celebrating alumni success stories',
    caption: 'Spotlighting alumni achievements across industries worldwide.',
  },
];

const AlumniEngagements = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlumni, setSelectedAlumni] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const loadedData = await loadAllData();
      setData(loadedData);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Process alumni data with engagement information
  const alumniProfiles = useMemo(() => {
    if (!data) return [];

    const { students, alumniEngagement, events, employers, dates } = data;

    // Get current date for filtering upcoming events
    const today = new Date();
    const todayKey = parseInt(`${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`);

    // Create alumni profiles with engagement data
    const profiles = students.map(student => {
      const engagements = alumniEngagement.filter(e => e.student_key === student.student_key);
      
      // Calculate engagement metrics
      const totalEngagements = engagements.length;
      const totalEvents = new Set(engagements.map(e => e.event_key)).size;
      const totalMentorshipHours = engagements.reduce((sum, e) => sum + parseFloat(e.mentorship_hours || 0), 0);
      const totalReferrals = engagements.reduce((sum, e) => sum + parseInt(e.referrals_made || 0), 0);
      const avgEngagementScore = engagements.length > 0
        ? (engagements.reduce((sum, e) => sum + parseFloat(e.engagement_score || 0), 0) / engagements.length).toFixed(2)
        : 0;
      
      // Get hired status and employer
      const hiredEngagement = engagements.find(e => e.hired_flag === '1' || e.hired_flag === 1);
      const employer = hiredEngagement 
        ? employers.find(emp => emp.employer_key === hiredEngagement.employer_key)
        : null;
      
      // Get events attended
      const eventDetails = engagements
        .map(e => {
          const event = events.find(ev => ev.event_key === e.event_key);
          const date = dates.find(d => String(d.date_key) === String(e.event_date_key));
          return event ? { ...event, date, engagement: e } : null;
        })
        .filter(Boolean);

      // Calculate achievements
      const achievements = [];
      if (totalEngagements >= 10) achievements.push('Highly Engaged Alumni');
      if (totalMentorshipHours >= 10) achievements.push('Mentorship Leader');
      if (totalReferrals >= 5) achievements.push('Network Builder');
      if (hiredEngagement) achievements.push('Career Success');
      if (parseFloat(avgEngagementScore) >= 2.5) achievements.push('Top Performer');

      return {
        ...student,
        totalEngagements,
        totalEvents,
        totalMentorshipHours: totalMentorshipHours.toFixed(1),
        totalReferrals,
        avgEngagementScore,
        employer,
        hiredEngagement,
        eventDetails,
        achievements,
        graduationYear: student.graduation_year || 'N/A',
        program: student.program_name || 'Graduate Program'
      };
    });

    // Sort by engagement score
    return profiles.sort((a, b) => parseFloat(b.avgEngagementScore) - parseFloat(a.avgEngagementScore));
  }, [data]);

  // Get upcoming events
  const upcomingEvents = useMemo(() => {
    if (!data) return [];

    const { events, dates } = data;
    const today = new Date();
    const todayKey = parseInt(`${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`);

    return events
      .map(event => {
        const date = dates.find(d => String(d.date_key) === String(event.start_date));
        if (date && parseInt(date.date_key) >= todayKey) {
          return { ...event, date };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => parseInt(a.date.date_key) - parseInt(b.date.date_key))
      .slice(0, 6);
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-sluBlue">Loading alumni data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">Error loading data</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <PageHero
        images={ENGAGEMENT_HERO_IMAGES}
        eyebrow="Community Stories"
        title="Celebrate Alumni Engagement"
        subtitle="Spotlights, mentorship, and lifetime connections"
        description="Explore the career journeys and engagement stories of our alumni community. See how Billikens mentor, lead, and partner with SLU to elevate the next wave of innovators."
        actions={[
          { to: '/', label: 'Back to Home', variant: 'secondary' },
          { href: '#alumni-stories', label: 'View Stories' },
        ]}
        align="center"
      />

      <div className="container mx-auto px-4 py-8">
        <h1 id="alumni-stories" className="text-4xl font-bold text-sluBlue mb-2">
          🎓 Alumni Engagements
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Discover our alumni community, their achievements, and their continued connection with SLU
        </p>

        {/* Statistics Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center border-l-4 border-sluGold">
            <div className="text-3xl font-bold text-sluBlue mb-2">{alumniProfiles.length}</div>
            <div className="text-gray-600 font-semibold">Total Alumni</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center border-l-4 border-sluBlue">
            <div className="text-3xl font-bold text-sluBlue mb-2">
              {alumniProfiles.filter(p => p.hiredEngagement).length}
            </div>
            <div className="text-gray-600 font-semibold">Placed Alumni</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center border-l-4 border-sluGold">
            <div className="text-3xl font-bold text-sluBlue mb-2">
              {alumniProfiles.reduce((sum, p) => sum + p.totalEvents, 0)}
            </div>
            <div className="text-gray-600 font-semibold">Total Events Attended</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center border-l-4 border-sluBlue">
            <div className="text-3xl font-bold text-sluBlue mb-2">
              {alumniProfiles.reduce((sum, p) => sum + parseFloat(p.totalMentorshipHours || 0), 0).toFixed(0)}
            </div>
            <div className="text-gray-600 font-semibold">Mentorship Hours</div>
          </div>
        </div>

        {/* Alumni Profiles Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-sluBlue mb-6">Alumni Profiles & Success Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alumniProfiles.slice(0, 12).map((alumni, index) => {
              const profileImage = getAlumniImageByIndex(index);
              return (
                <div
                  key={alumni.student_key}
                  className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-sluGold"
                  onClick={() => setSelectedAlumni({ ...alumni, image: profileImage })}
                >
                <div className="flex items-center mb-4">
                  <img
                    src={profileImage}
                    alt={alumni.first_name}
                    className="w-16 h-16 rounded-full mr-4 border-2 border-sluBlue object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-sluBlue">
                      {alumni.first_name} {alumni.last_name}
                    </h3>
                    <p className="text-gray-600 text-sm">{alumni.program}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Graduation:</span>
                    <span className="font-semibold">{alumni.graduationYear}</span>
                  </div>
                  {alumni.employer && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Employer:</span>
                      <span className="font-semibold text-sluBlue">{alumni.employer.employer_name}</span>
                    </div>
                  )}
                  {alumni.hiredEngagement && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Role:</span>
                      <span className="font-semibold">{alumni.hiredEngagement.job_role || 'Professional'}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Engagement Score</span>
                    <span className="text-lg font-bold text-sluGold">{alumni.avgEngagementScore}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{alumni.totalEvents} Events</span>
                    <span>{alumni.totalMentorshipHours}h Mentoring</span>
                    <span>{alumni.totalReferrals} Referrals</span>
                  </div>
                </div>

                {alumni.achievements.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex flex-wrap gap-2">
                      {alumni.achievements.slice(0, 2).map((ach, idx) => (
                        <span
                          key={idx}
                          className="bg-sluBlue text-white text-xs px-2 py-1 rounded-full"
                        >
                          {ach}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-sluBlue mb-6">📅 Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event, index) => (
              <div
                key={event.event_key}
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-sluBlue hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-sluBlue mb-2">{event.event_name}</h3>
                    <p className="text-gray-600 text-sm mb-2">
                      <span className="font-semibold">Type:</span> {event.event_type}
                    </p>
                    {event.date && (
                      <p className="text-gray-600 text-sm">
                        <span className="font-semibold">Date:</span> {event.date.full_date}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {event.venue && (
                    <p className="text-gray-600">
                      <span className="font-semibold">Venue:</span> {event.venue}
                    </p>
                  )}
                  {event.city && event.state && (
                    <p className="text-gray-600">
                      <span className="font-semibold">Location:</span> {event.city}, {event.state}
                    </p>
                  )}
                  {event.theme && (
                    <p className="text-gray-600">
                      <span className="font-semibold">Theme:</span> {event.theme}
                    </p>
                  )}
                  {event.capacity && (
                    <p className="text-gray-600">
                      <span className="font-semibold">Capacity:</span> {event.capacity}
                    </p>
                  )}
                </div>
                {event.registration_required_flag === '1' && (
                  <div className="mt-4">
                    <span className="bg-sluGold text-sluBlue px-3 py-1 rounded-full text-xs font-semibold">
                      Registration Required
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {upcomingEvents.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600 text-lg">No upcoming events scheduled at this time.</p>
            </div>
          )}
        </div>

        {/* Engagement Highlights */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-sluBlue mb-6">🌟 Engagement Highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-sluBlue to-blue-800 rounded-lg shadow-lg p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Top Engaged Alumni</h3>
              <div className="space-y-4">
                {alumniProfiles.slice(0, 5).map((alumni, idx) => (
                  <div key={alumni.student_key} className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{alumni.first_name} {alumni.last_name}</p>
                        <p className="text-sm text-gray-200">{alumni.program}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sluGold font-bold text-xl">{alumni.avgEngagementScore}</p>
                        <p className="text-xs text-gray-200">Score</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-sluGold to-yellow-400 rounded-lg shadow-lg p-8 text-sluBlue">
              <h3 className="text-2xl font-bold mb-4">Mentorship Leaders</h3>
              <div className="space-y-4">
                {alumniProfiles
                  .sort((a, b) => parseFloat(b.totalMentorshipHours) - parseFloat(a.totalMentorshipHours))
                  .slice(0, 5)
                  .map((alumni, idx) => (
                    <div key={alumni.student_key} className="bg-white bg-opacity-80 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{alumni.first_name} {alumni.last_name}</p>
                          <p className="text-sm text-gray-600">{alumni.program}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sluBlue font-bold text-xl">{alumni.totalMentorshipHours}h</p>
                          <p className="text-xs text-gray-600">Mentoring</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Success Stories Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-sluBlue mb-6">💼 Career Success Stories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {alumniProfiles
              .filter(p => p.hiredEngagement && p.employer)
              .slice(0, 6)
              .map((alumni) => (
                <div
                  key={alumni.student_key}
                  className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-sluGold"
                >
                  <div className="flex items-start mb-4">
                    <img
                      src={getAlumniImage(alumni.student_key)}
                      alt={alumni.first_name}
                      className="w-20 h-20 rounded-full mr-4 border-2 border-sluGold object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-sluBlue mb-1">
                        {alumni.first_name} {alumni.last_name}
                      </h3>
                      <p className="text-gray-600 mb-2">{alumni.program} • Class of {alumni.graduationYear}</p>
                      {alumni.hiredEngagement && (
                        <p className="text-lg font-semibold text-sluBlue">
                          {alumni.hiredEngagement.job_role} at {alumni.employer.employer_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 italic">
                      "Through SLU's comprehensive program and networking events, I was able to connect with 
                      {alumni.employer.employer_name} and secure my position as a {alumni.hiredEngagement?.job_role || 'professional'}. 
                      The mentorship opportunities and alumni network have been invaluable in my career growth."
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {alumni.achievements.map((ach, idx) => (
                        <span
                          key={idx}
                          className="bg-sluBlue text-white text-xs px-2 py-1 rounded-full"
                        >
                          {ach}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Alumni Detail Modal */}
      {selectedAlumni && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAlumni(null)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-sluBlue to-blue-800 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <img
                    src={selectedAlumni.image || getAlumniImage(selectedAlumni.student_key)}
                    alt={selectedAlumni.first_name}
                    className="w-24 h-24 rounded-full mr-4 border-4 border-sluGold object-cover"
                  />
                  <div>
                    <h2 className="text-3xl font-bold">
                      {selectedAlumni.first_name} {selectedAlumni.last_name}
                    </h2>
                    <p className="text-xl text-gray-200">{selectedAlumni.program}</p>
                    <p className="text-gray-300">Class of {selectedAlumni.graduationYear}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAlumni(null)}
                  className="text-white hover:text-sluGold text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-sluBlue mb-2">Engagement Metrics</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Engagements:</span>
                      <span className="font-semibold">{selectedAlumni.totalEngagements}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Events Attended:</span>
                      <span className="font-semibold">{selectedAlumni.totalEvents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mentorship Hours:</span>
                      <span className="font-semibold">{selectedAlumni.totalMentorshipHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Referrals Made:</span>
                      <span className="font-semibold">{selectedAlumni.totalReferrals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Engagement Score:</span>
                      <span className="font-semibold text-sluGold">{selectedAlumni.avgEngagementScore}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold text-sluBlue mb-2">Career Information</h3>
                  <div className="space-y-2 text-sm">
                    {selectedAlumni.employer && (
                      <>
                        <div className="flex justify-between">
                          <span>Current Employer:</span>
                          <span className="font-semibold">{selectedAlumni.employer.employer_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Industry:</span>
                          <span className="font-semibold">{selectedAlumni.employer.industry}</span>
                        </div>
                      </>
                    )}
                    {selectedAlumni.hiredEngagement && (
                      <div className="flex justify-between">
                        <span>Role:</span>
                        <span className="font-semibold">{selectedAlumni.hiredEngagement.job_role}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Visa Status:</span>
                      <span className="font-semibold">{selectedAlumni.visa_status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span className="font-semibold">{selectedAlumni.current_city || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedAlumni.achievements.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-sluBlue mb-3">Achievements</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAlumni.achievements.map((ach, idx) => (
                      <span
                        key={idx}
                        className="bg-sluBlue text-white px-4 py-2 rounded-full font-semibold"
                      >
                        {ach}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedAlumni.eventDetails.length > 0 && (
                <div>
                  <h3 className="font-bold text-sluBlue mb-3">Events Attended</h3>
                  <div className="space-y-2">
                    {selectedAlumni.eventDetails.slice(0, 5).map((event, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-sluBlue">{event.event_name}</p>
                          <p className="text-sm text-gray-600">
                            {event.event_type} • {event.date?.full_date || 'N/A'}
                          </p>
                        </div>
                        {event.engagement && (
                          <div className="text-right">
                            <p className="text-sluGold font-bold">{event.engagement.engagement_score}</p>
                            <p className="text-xs text-gray-600">Score</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlumniEngagements;
