import { useState, useRef, useEffect } from 'react';

const GalleryHoverTooltip = ({ children, data, type }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (isHovered && cardRef.current) {
      const updatePosition = () => {
        if (!cardRef.current || !tooltipRef.current) return;
        
        const cardRect = cardRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let top = cardRect.bottom + 10;
        let left = cardRect.left + cardRect.width / 2 - tooltipRect.width / 2;

        // Adjust if tooltip goes off screen
        if (left < 10) left = 10;
        if (left + tooltipRect.width > viewportWidth - 10) {
          left = viewportWidth - tooltipRect.width - 10;
        }
        if (top + tooltipRect.height > viewportHeight - 10) {
          top = cardRect.top - tooltipRect.height - 10;
        }

        setPosition({ top, left });
      };

      // Initial position
      setTimeout(updatePosition, 0);
      
      // Update on scroll/resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isHovered]);

  const renderTooltipContent = () => {
    if (!data || !data.fullData) return null;

    if (type === 'employer') {
      const { employer, feedback, industry, location, website, companyType, sector, rating, techStrength, technologies, jobRole, graduationYear } = data.fullData;
      return (
        <div className="space-y-3">
          <div className="border-b border-slate-200 pb-2">
            <h4 className="font-bold text-slate-900 text-lg">{employer?.employer_name || 'Employer'}</h4>
            <p className="text-sm text-slate-600">{industry} • {sector}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-slate-500">Location:</span>
              <p className="font-medium text-slate-700">{location}</p>
            </div>
            <div>
              <span className="text-slate-500">Company Type:</span>
              <p className="font-medium text-slate-700">{companyType}</p>
            </div>
            <div>
              <span className="text-slate-500">Website:</span>
              <p className="font-medium text-slate-700 truncate">{website}</p>
            </div>
            <div>
              <span className="text-slate-500">Rating:</span>
              <p className="font-medium text-slate-700">{rating}/5</p>
            </div>
          </div>
          {technologies && technologies !== 'N/A' && (
            <div>
              <span className="text-slate-500 text-sm">Technologies:</span>
              <p className="font-medium text-slate-700 text-sm">{technologies}</p>
            </div>
          )}
          {techStrength && techStrength !== 'N/A' && (
            <div>
              <span className="text-slate-500 text-sm">Tech Strength:</span>
              <p className="font-medium text-slate-700 text-sm">{techStrength}</p>
            </div>
          )}
        </div>
      );
    }

    if (type === 'event') {
      const { event, eventCode, eventType, eventSubtype, organizer, venue, location, startDate, endDate, capacity, theme, department, participantCount } = data.fullData;
      return (
        <div className="space-y-3">
          <div className="border-b border-slate-200 pb-2">
            <h4 className="font-bold text-slate-900 text-lg">{event?.event_name || 'Event'}</h4>
            <p className="text-sm text-slate-600">{eventCode}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-slate-500">Type:</span>
              <p className="font-medium text-slate-700">{eventType} • {eventSubtype}</p>
            </div>
            <div>
              <span className="text-slate-500">Organizer:</span>
              <p className="font-medium text-slate-700">{organizer}</p>
            </div>
            <div>
              <span className="text-slate-500">Venue:</span>
              <p className="font-medium text-slate-700">{venue}</p>
            </div>
            <div>
              <span className="text-slate-500">Location:</span>
              <p className="font-medium text-slate-700">{location}</p>
            </div>
            <div>
              <span className="text-slate-500">Start Date:</span>
              <p className="font-medium text-slate-700">{startDate !== 'N/A' ? new Date(startDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-500">Capacity:</span>
              <p className="font-medium text-slate-700">{capacity}</p>
            </div>
            <div>
              <span className="text-slate-500">Participants:</span>
              <p className="font-medium text-slate-700">{participantCount}</p>
            </div>
            {theme && theme !== 'N/A' && (
              <div>
                <span className="text-slate-500">Theme:</span>
                <p className="font-medium text-slate-700">{theme}</p>
              </div>
            )}
          </div>
          {department && department !== 'N/A' && (
            <div>
              <span className="text-slate-500 text-sm">Department:</span>
              <p className="font-medium text-slate-700 text-sm">{department}</p>
            </div>
          )}
        </div>
      );
    }

    if (type === 'alumni') {
      const { student, employment, feedback, email, linkedin, startDate, techStrength, technologies, rating } = data.fullData;
      
      // Check if this is employer feedback (has feedback object with employer data)
      const isEmployerFeedback = feedback && feedback.employer_key;
      
      return (
        <div className="space-y-3">
          <div className="border-b border-slate-200 pb-2">
            <h4 className="font-bold text-slate-900 text-lg">
              {isEmployerFeedback 
                ? `Alumni from ${feedback.employer_name || 'Partner Company'}`
                : `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || 'SLU Alumni'}
            </h4>
            <p className="text-sm text-slate-600">
              {isEmployerFeedback 
                ? `Graduated ${feedback.graduation_year || 'N/A'} • ${employment?.job_title || feedback.job_role || 'Professional'}`
                : student?.program_name || 'SLU Graduate'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {!isEmployerFeedback && email && email !== 'N/A' && (
              <div>
                <span className="text-slate-500">Email:</span>
                <p className="font-medium text-slate-700 truncate">{email}</p>
              </div>
            )}
            {isEmployerFeedback && feedback.employer_name && (
              <div>
                <span className="text-slate-500">Employer:</span>
                <p className="font-medium text-slate-700">{feedback.employer_name}</p>
              </div>
            )}
            <div>
              <span className="text-slate-500">Start Date:</span>
              <p className="font-medium text-slate-700">{startDate !== 'N/A' ? new Date(startDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            {employment?.job_title && (
              <div>
                <span className="text-slate-500">Job Title:</span>
                <p className="font-medium text-slate-700">{employment.job_title}</p>
              </div>
            )}
            {employment?.location && (
              <div>
                <span className="text-slate-500">Location:</span>
                <p className="font-medium text-slate-700">{employment.location}</p>
              </div>
            )}
            {isEmployerFeedback && feedback.graduation_year && (
              <div>
                <span className="text-slate-500">Graduation Year:</span>
                <p className="font-medium text-slate-700">{feedback.graduation_year}</p>
              </div>
            )}
          </div>
          {technologies && technologies !== 'N/A' && (
            <div>
              <span className="text-slate-500 text-sm">Technologies:</span>
              <p className="font-medium text-slate-700 text-sm">{technologies}</p>
            </div>
          )}
          {techStrength && techStrength !== 'N/A' && (
            <div>
              <span className="text-slate-500 text-sm">Tech Strength:</span>
              <p className="font-medium text-slate-700 text-sm">{techStrength}</p>
            </div>
          )}
          {rating && rating !== 'N/A' && (
            <div>
              <span className="text-slate-500 text-sm">Employer Rating:</span>
              <p className="font-medium text-slate-700 text-sm">{rating}/5</p>
            </div>
          )}
          {isEmployerFeedback && feedback.comment_overall && (
            <div>
              <span className="text-slate-500 text-sm">Employer Feedback:</span>
              <p className="font-medium text-slate-700 text-sm italic">{feedback.comment_overall}</p>
            </div>
          )}
          {!isEmployerFeedback && linkedin && linkedin !== 'N/A' && (
            <div>
              <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-sluBlue hover:underline text-sm">
                View LinkedIn Profile →
              </a>
            </div>
          )}
        </div>
      );
    }

    if (type === 'feedback') {
      const { feedback, employer, industry, location } = data.fullData;
      return (
        <div className="space-y-3">
          <div className="border-b border-slate-200 pb-2">
            <h4 className="font-bold text-slate-900 text-lg">{employer?.employer_name || data.employer || 'Employer'}</h4>
            <p className="text-sm text-slate-600">{industry || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-slate-500">Job Role:</span>
              <p className="font-medium text-slate-700">{data.jobRole || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-500">Graduation Year:</span>
              <p className="font-medium text-slate-700">{data.graduationYear || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-500">Rating:</span>
              <p className="font-medium text-slate-700">{data.rating || 'N/A'}/5</p>
            </div>
            <div>
              <span className="text-slate-500">Tech Strength:</span>
              <p className="font-medium text-slate-700">{data.techStrength || 'N/A'}</p>
            </div>
            {location && location !== 'N/A' && (
              <div>
                <span className="text-slate-500">Location:</span>
                <p className="font-medium text-slate-700">{location}</p>
              </div>
            )}
          </div>
          {data.technologies && data.technologies !== 'N/A' && (
            <div>
              <span className="text-slate-500 text-sm">Technologies:</span>
              <p className="font-medium text-slate-700 text-sm">{data.technologies}</p>
            </div>
          )}
          {feedback?.comment_overall && (
            <div>
              <span className="text-slate-500 text-sm">Feedback:</span>
              <p className="font-medium text-slate-700 text-sm italic">{feedback.comment_overall}</p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      ref={cardRef}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered && data?.fullData && (
        <div
          ref={tooltipRef}
          className="fixed z-50 bg-white rounded-lg shadow-2xl border-2 border-slate-200 p-4 max-w-sm pointer-events-none"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-slate-200 rotate-45"></div>
          {renderTooltipContent()}
        </div>
      )}
    </div>
  );
};

export default GalleryHoverTooltip;

