import { loadAllData } from './loadData';

// Gallery slider images - using existing hero images
export const gallerySliderImages = [
  {
    src: '/assets/hero/alumni banner img1.jpg',
    alt: 'SLU Alumni Network',
    caption: 'Connecting SLU alumni across industries and generations.',
  },
  {
    src: '/assets/hero/event img2.jpeg',
    alt: 'Career Fair Event',
    caption: 'Career fairs bringing together employers and talented SLU graduates.',
  },
  {
    src: '/assets/hero/engagement img1.jpeg',
    alt: 'Alumni Engagement',
    caption: 'Building lifelong connections through mentorship and networking.',
  },
  {
    src: '/assets/hero/Alumni img1.jpg',
    alt: 'Alumni Success',
    caption: 'Celebrating the achievements of SLU alumni worldwide.',
  },
  {
    src: '/assets/hero/campus img1.jpg',
    alt: 'SLU Campus',
    caption: 'Inspiring spaces where partnerships and careers begin.',
  },
  {
    src: '/assets/hero/engagement img2.jpg',
    alt: 'Community Building',
    caption: 'Strengthening the SLU community through meaningful engagement.',
  },
];

// Available employer gallery images
const EMPLOYER_GALLERY_IMAGES = [
  '/assets/employers/Employers_Gallery/Accenture_Argentina.jpg',
  '/assets/employers/Employers_Gallery/raccentcare6.jpg',
  '/assets/employers/Employers_Gallery/1737451626291.jpeg',
  '/assets/employers/Employers_Gallery/image.webp',
  '/assets/employers/Employers_Gallery/images.png',
];

// Transform employer feedback into testimonials - focusing on SLU partnership employers
export const transformEmployerWords = (employerFeedback, employers) => {
  if (!employers || employers.length === 0) return [];
  
  // Filter employers who have accepted SLU partnerships
  // Check for partnership indicators: talent_partner_flag, sponsor_f1_flag, or other partnership flags
  const partnerEmployers = employers.filter((emp) => {
    return (
      emp.talent_partner_flag === '1' ||
      emp.sponsor_f1_flag === '1' ||
      emp.talent_partner_flag === 1 ||
      emp.sponsor_f1_flag === 1 ||
      emp.partnership_status === 'Active' ||
      emp.partnership_status === 'active' ||
      emp.slu_relation?.toLowerCase().includes('partner') ||
      emp.slu_relation?.toLowerCase().includes('sponsor')
    );
  });

  if (partnerEmployers.length === 0) {
    // Fallback: if no partnership flags, use all employers with feedback
    const employerMap = new Map();
    employers.forEach((emp) => {
      employerMap.set(String(emp.employer_key), emp);
    });

    if (!employerFeedback || employerFeedback.length === 0) return [];

    const topFeedback = employerFeedback
      .filter((fb) => parseFloat(fb.rating_overall) >= 4 && fb.comment_overall)
      .slice(0, 8);

    return topFeedback.map((fb, idx) => {
      const employer = employerMap.get(String(fb.employer_key)) || {};
      const logo = employer.logo_url || EMPLOYER_GALLERY_IMAGES[idx % EMPLOYER_GALLERY_IMAGES.length];
      
      return {
        id: idx + 1,
        quote: fb.comment_overall || 'SLU alumni demonstrate strong technical skills and professional excellence.',
        name: employer.employer_name || fb.employer_name || 'Employer Partner',
        role: 'Talent Partner',
        company: employer.employer_name || fb.employer_name || 'Partner Company',
        logo: logo,
        fullData: {
          employer: employer,
          feedback: fb,
          industry: employer.industry || 'N/A',
          location: employer.hq_city && employer.hq_state 
            ? `${employer.hq_city}, ${employer.hq_state}` 
            : employer.hq_country || 'N/A',
          website: employer.website || 'N/A',
          companyType: employer.company_type || 'N/A',
          sector: employer.sector || 'N/A',
          rating: fb.rating_overall || 'N/A',
          techStrength: fb.tech_strength_level || 'N/A',
          technologies: fb.technologies || 'N/A',
          jobRole: fb.job_role || 'N/A',
          graduationYear: fb.graduation_year || 'N/A',
        },
      };
    });
  }

  // Create employer map for quick lookup
  const employerMap = new Map();
  partnerEmployers.forEach((emp) => {
    employerMap.set(String(emp.employer_key), emp);
  });

  // Get feedback from partner employers, prioritizing high ratings
  const partnerFeedback = employerFeedback
    ? employerFeedback
        .filter((fb) => {
          const employer = employerMap.get(String(fb.employer_key));
          return employer && parseFloat(fb.rating_overall) >= 4 && fb.comment_overall;
        })
        .sort((a, b) => parseFloat(b.rating_overall) - parseFloat(a.rating_overall))
        .slice(0, 8)
    : [];

  // If we have partner employers but no feedback, create testimonials from employer data
  if (partnerFeedback.length === 0 && partnerEmployers.length > 0) {
    return partnerEmployers.slice(0, 8).map((employer, idx) => {
      const logo = employer.logo_url || EMPLOYER_GALLERY_IMAGES[idx % EMPLOYER_GALLERY_IMAGES.length];
      
      // Generate a testimonial based on partnership type
      let quote = 'SLU alumni demonstrate strong technical skills and professional excellence.';
      let role = 'Talent Partner';
      
      if (employer.sponsor_f1_flag === '1' || employer.sponsor_f1_flag === 1) {
        role = 'Sponsor & Partner';
        quote = 'Our partnership with SLU has been instrumental in finding top talent. The university\'s commitment to excellence aligns perfectly with our values.';
      } else if (employer.talent_partner_flag === '1' || employer.talent_partner_flag === 1) {
        role = 'Talent Partner';
        quote = 'SLU graduates bring exceptional technical depth and professional readiness. We value our ongoing partnership with the university.';
      }

      return {
        id: idx + 1,
        quote: employer.slu_relation || quote,
        name: employer.employer_name || 'Employer Partner',
        role: role,
        company: employer.employer_name || 'Partner Company',
        logo: logo,
        fullData: {
          employer: employer,
          feedback: null,
          industry: employer.industry || 'N/A',
          location: employer.hq_city && employer.hq_state 
            ? `${employer.hq_city}, ${employer.hq_state}` 
            : employer.hq_country || 'N/A',
          website: employer.website || 'N/A',
          companyType: employer.company_type || 'N/A',
          sector: employer.sector || 'N/A',
          rating: 'N/A',
          techStrength: 'N/A',
          technologies: 'N/A',
          jobRole: 'N/A',
          graduationYear: 'N/A',
        },
      };
    });
  }

  // Map feedback to testimonials for partner employers
  return partnerFeedback.map((fb, idx) => {
    const employer = employerMap.get(String(fb.employer_key)) || {};
    const logo = employer.logo_url || EMPLOYER_GALLERY_IMAGES[idx % EMPLOYER_GALLERY_IMAGES.length];
    
    // Determine role based on partnership type
    let role = 'Talent Partner';
    if (employer.sponsor_f1_flag === '1' || employer.sponsor_f1_flag === 1) {
      role = 'Sponsor & Partner';
    }
    
    return {
      id: idx + 1,
      quote: fb.comment_overall || 'SLU alumni demonstrate strong technical skills and professional excellence.',
      name: employer.employer_name || fb.employer_name || 'Employer Partner',
      role: role,
      company: employer.employer_name || fb.employer_name || 'Partner Company',
      logo: logo,
      fullData: {
        employer: employer,
        feedback: fb,
        industry: employer.industry || 'N/A',
        location: employer.hq_city && employer.hq_state 
          ? `${employer.hq_city}, ${employer.hq_state}` 
          : employer.hq_country || 'N/A',
        website: employer.website || 'N/A',
        companyType: employer.company_type || 'N/A',
        sector: employer.sector || 'N/A',
        rating: fb.rating_overall || 'N/A',
        techStrength: fb.tech_strength_level || 'N/A',
        technologies: fb.technologies || 'N/A',
        jobRole: fb.job_role || 'N/A',
        graduationYear: fb.graduation_year || 'N/A',
      },
    };
  });
};

// Transform events into networking activities
export const transformAlumniNetworking = (events, alumniEngagement) => {
  if (!events || events.length === 0) return [];

  // Calculate date thresholds
  // Show events from last 2 years but only up to October 2025 (before November 2025)
  const today = new Date();
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(today.getFullYear() - 2);
  
  // November 1, 2025 - events must be before this date
  const november2025 = new Date('2025-11-01');

  // Helper function to parse event date
  const parseEventDate = (dateStr) => {
    if (!dateStr) return null;
    // Handle YYYY-MM-DD format
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(dateStr);
    }
    // Handle YYYYMMDD format
    if (dateStr.match(/^\d{8}$/)) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return new Date(`${year}-${month}-${day}`);
    }
    // Try standard Date parsing
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  // Filter for relevant event types and recent dates (before November 2025)
  const networkingEvents = events
    .filter((evt) => {
      // Check event type
      const isRelevantType = 
        evt.event_type === 'Alumni' || 
        evt.event_subtype?.toLowerCase().includes('networking') ||
        evt.event_subtype?.toLowerCase().includes('mentor') ||
        evt.event_subtype?.toLowerCase().includes('panel') ||
        evt.event_subtype?.toLowerCase().includes('hackathon') ||
        evt.event_subtype?.toLowerCase().includes('workshop') ||
        evt.event_subtype?.toLowerCase().includes('meetup') ||
        evt.event_subtype?.toLowerCase().includes('chapter');
      
      if (!isRelevantType) return false;

      // Check if event is recent (within last 2 years) and before November 2025
      const eventDate = parseEventDate(evt.start_date);
      if (!eventDate) return false; // Exclude events without valid dates
      
      // Event must be within last 2 years AND before November 2025
      return eventDate >= twoYearsAgo && eventDate < november2025;
    })
    .sort((a, b) => {
      // Sort by date descending (most recent first)
      const dateA = parseEventDate(a.start_date);
      const dateB = parseEventDate(b.start_date);
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB - dateA;
    })
    .slice(0, 9); // Show up to 9 most recent events

  // Count participants from engagement data
  const getParticipantCount = (eventKey) => {
    if (!alumniEngagement) return '50+';
    const participants = alumniEngagement.filter(
      (eng) => String(eng.event_key) === String(eventKey)
    );
    return `${participants.length || 50}+`;
  };

  const eventTypes = {
    'Alumni': 'Networking',
    'Workshop': 'Mentorship',
    'Panel': 'Panel',
    'Hackathon': 'Hackathon',
    'Meetup': 'Chapter',
  };

  // Available event images from events folder
  const eventImages = [
    '/assets/events/event 1.jpeg',
    '/assets/events/event 2.jpeg',
    '/assets/events/event 3.jpeg',
    '/assets/events/event 4.jpeg',
  ];

  return networkingEvents.map((evt, idx) => {
    const eventDate = evt.start_date ? parseEventDate(evt.start_date) : null;
    const dateStr = eventDate 
      ? eventDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : 'Ongoing';
    
    // Cycle through event images based on index
    const imageIndex = idx % eventImages.length;
    const selectedImage = eventImages[imageIndex];

    return {
      id: idx + 1,
      title: evt.event_name || `Event ${evt.event_code}`,
      date: dateStr,
      description: evt.theme 
        ? `${evt.theme} event at ${evt.venue || evt.city || 'SLU'}. ${evt.event_subtype || 'Networking'} bringing together alumni and students.`
        : `Alumni networking event connecting graduates across programs and industries.`,
      image: selectedImage,
      participants: `${getParticipantCount(evt.event_key)} Participants`,
      type: eventTypes[evt.event_subtype] || evt.event_type || 'Networking',
      // Full data for hover tooltip
      fullData: {
        event: evt,
        eventCode: evt.event_code || 'N/A',
        eventType: evt.event_type || 'N/A',
        eventSubtype: evt.event_subtype || 'N/A',
        organizer: evt.organizer_name || 'N/A',
        venue: evt.venue || 'N/A',
        location: evt.city && evt.state 
          ? `${evt.city}, ${evt.state}` 
          : evt.city || evt.country || 'N/A',
        startDate: evt.start_date || 'N/A',
        endDate: evt.end_date || 'N/A',
        capacity: evt.capacity || 'N/A',
        theme: evt.theme || 'N/A',
        department: evt.department_host || 'N/A',
        participantCount: getParticipantCount(evt.event_key),
      },
    };
  });
};

// Load approved success stories from API
export const loadApprovedSuccessStories = async () => {
  try {
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002'}/api/success-stories/approved`;
    console.log('Loading approved success stories from:', apiUrl);
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.warn('Failed to load approved success stories:', response.status, response.statusText);
      return [];
    }
    const data = await response.json();
    console.log('Loaded approved success stories:', data.stories?.length || 0);
    return data.stories || [];
  } catch (error) {
    console.error('Failed to load approved success stories', error);
    return [];
  }
};

// Transform approved success stories for gallery
export const transformApprovedSuccessStories = (approvedStories) => {
  if (!approvedStories || approvedStories.length === 0) return [];

  // Available student photos
  const availablePhotos = [
    'student1.jpeg',
    'student2.jpg',
    'student3.jpg',
    'student4.jpg',
    'student5.jpg',
    'student6.jpeg',
    'student7.jpg',
    'student8.jpg',
    'student9.jpg',
    'student10.jpg',
    'student11.jpeg',
    'student12.jpeg',
    'IMG_4986.jpg',
  ];

  return approvedStories.slice(0, 6).map((story, idx) => {
    // Assign unique photo based on story_id
    const photoIndex = Math.abs(parseInt(story.story_id || idx)) % availablePhotos.length;
    const selectedPhoto = availablePhotos[photoIndex];

    return {
      id: idx + 1,
      name: story.full_name || 'SLU Alumni',
      program: story.program || 'SLU Graduate',
      year: story.graduation_year || 'N/A',
      previousRole: 'Student',
      currentRole: story.current_role || 'Professional',
      company: story.employer_name || 'Leading Company',
      location: 'USA',
      story: story.story_content || `Successfully transitioned to ${story.current_role || 'Professional'} at ${story.employer_name || 'Leading Company'} after completing SLU's ${story.program || 'SLU Graduate'} program.`,
      photo: story.photo_url || `/assets/alumni/${selectedPhoto}`,
      achievements: story.achievements ? story.achievements.split(',').map(a => a.trim()) : ['SLU Graduate', 'Career Success'],
      // Full data for hover tooltip
      fullData: {
        student: { student_key: story.student_key, first_name: story.full_name?.split(' ')[0], last_name: story.full_name?.split(' ').slice(1).join(' ') },
        employment: { job_title: story.current_role, location: 'USA', start_date: story.submitted_at },
        feedback: null,
        email: 'N/A',
        linkedin: 'N/A',
        startDate: story.submitted_at || 'N/A',
        techStrength: 'N/A',
        technologies: 'N/A',
        rating: 'N/A',
      },
    };
  });
};

// Transform employment and student data into success stories (fallback)
export const transformCareerSuccessStories = (alumniEmployment, students, employerFeedback) => {
  if (!alumniEmployment || alumniEmployment.length === 0) return [];

  const studentMap = new Map();
  students.forEach((s) => {
    studentMap.set(String(s.student_key), s);
  });

  // Get verified employment records
  const verifiedEmployment = alumniEmployment
    .filter((emp) => emp.status === 'Verified')
    .slice(0, 6);

  // Available student photos - using all available photos
  const availablePhotos = [
    'student1.jpeg',
    'student2.jpg',
    'student3.jpg',
    'student4.jpg',
    'student5.jpg',
    'student6.jpeg',
    'student7.jpg',
    'student8.jpg',
    'student9.jpg',
    'student10.jpg',
    'student11.jpeg',
    'student12.jpeg',
    'IMG_4986.jpg',
  ];

  return verifiedEmployment.map((emp, idx) => {
    const student = studentMap.get(String(emp.alumni_id)) || {};
    const fullName = emp.alumni_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'SLU Alumni';
    const program = emp.program || student.program_name || 'SLU Graduate';
    const graduationYear = emp.graduation_year || student.graduation_year || '2023';
    const jobTitle = emp.job_title || 'Professional';
    const company = emp.employer_name || 'Leading Company';
    const location = emp.location || student.current_city || 'USA';

    // Find feedback for this alumni if available
    const feedback = employerFeedback?.find(
      (fb) => String(fb.employer_key) === String(emp.employer_key) && 
              String(fb.graduation_year) === String(graduationYear)
    );

    const story = feedback?.comment_overall 
      ? `Transitioned to ${jobTitle} at ${company} after completing SLU's ${program} program. ${feedback.comment_overall.substring(0, 100)}...`
      : `Successfully transitioned to ${jobTitle} at ${company} after completing SLU's ${program} program. The technical depth and real-world projects prepared for professional challenges.`;

    const achievements = [];
    if (feedback?.tech_strength_level === 'Strong') {
      achievements.push('Technical Excellence');
    }
    if (parseFloat(feedback?.rating_overall) >= 4) {
      achievements.push('High Performance');
    }
    achievements.push('SLU Graduate');

    // Assign unique photo based on alumni_id or student_key to ensure consistency
    // Use a hash-like approach to map each alumni to a specific photo
    const uniqueId = emp.alumni_id || emp.id || student.student_key || idx;
    const photoIndex = Math.abs(parseInt(String(uniqueId).replace(/\D/g, '')) || idx) % availablePhotos.length;
    const selectedPhoto = availablePhotos[photoIndex];

    return {
      id: idx + 1,
      name: fullName,
      program: program,
      year: graduationYear,
      previousRole: 'Student',
      currentRole: jobTitle,
      company: company,
      location: location,
      story: story,
      photo: `/assets/alumni/${selectedPhoto}`,
      achievements: achievements.length > 0 ? achievements : ['SLU Graduate', 'Career Success'],
      // Full data for hover tooltip
      fullData: {
        student: student,
        employment: emp,
        feedback: feedback,
        email: student.email || 'N/A',
        phone: student.phone || 'N/A',
        linkedin: student.linkedin_url || 'N/A',
        gpa: student.gpa || 'N/A',
        startDate: emp.start_date || 'N/A',
        employerKey: emp.employer_key || 'N/A',
        techStrength: feedback?.tech_strength_level || 'N/A',
        technologies: feedback?.technologies || 'N/A',
        rating: feedback?.rating_overall || 'N/A',
      },
    };
  });
};


/**
 * Load approved employer feedback from API
 * 
 * CRITICAL: This is the ONLY source of data for the "Employer Feedback Showcase" section in the gallery.
 * 
 * Data Flow:
 * 1. Admin approves feedback in "Employer Submissions" → "Alumni Technical Feedback"
 * 2. Sets approved_by_admin = '1' in employer_alumni_feedback.csv
 * 3. API endpoint /api/employer-feedback/approved filters for approved_by_admin = '1'
 * 4. This function calls that API and returns ONLY approved feedback
 * 5. Gallery displays ONLY what this function returns - no other data sources
 * 
 * @returns {Array} Array of approved feedback entries (should match admin console approved count)
 */
export const loadApprovedEmployerFeedback = async () => {
  try {
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002'}/api/employer-feedback/approved`;
    console.log('🔍 Loading approved employer feedback from API:', apiUrl);
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.warn('❌ Failed to load approved employer feedback:', response.status, response.statusText);
      return [];
    }
    const data = await response.json();
    const feedbackCount = data.feedbacks?.length || 0;
    console.log(`✅ Loaded ${feedbackCount} approved employer feedback entries from API`);
    console.log(`   (This should match the number of approved entries in admin console)`);
    
    // Log each feedback to help debug
    if (data.feedbacks && data.feedbacks.length > 0) {
      data.feedbacks.forEach((fb, idx) => {
        console.log(`   [${idx + 1}] feedback_id: ${fb.feedback_id}, employer: ${fb.employer_name || 'Unknown'}, approved: ${fb.approved_by_admin}`);
      });
    } else {
      console.log('   ⚠️ No approved feedback found. Gallery will show empty section.');
    }
    
    // Return ONLY approved feedback from API - this is the single source of truth
    return data.feedbacks || [];
  } catch (error) {
    console.error('❌ Failed to load approved employer feedback', error);
    return [];
  }
};

// Transform approved employer feedback to match Career Success Stories format
// IMPORTANT: This ONLY processes approved feedback from the API (approved_by_admin = '1')
// No duplicates, no generated data - only what admin has approved
export const transformApprovedEmployerFeedback = (approvedFeedback, employers) => {
  if (!approvedFeedback || approvedFeedback.length === 0) {
    console.log('⚠️ No approved feedback to transform - gallery will show empty section');
    return [];
  }
  
  console.log(`\n🔄 Transforming ${approvedFeedback.length} approved feedback entry/entries from admin approval`);
  console.log(`   ⚠️  This count MUST match the number of approved entries in admin console`);
  
  // Remove any potential duplicates by feedback_id
  const uniqueFeedback = [];
  const seenIds = new Set();
  approvedFeedback.forEach(fb => {
    const id = fb.feedback_id || fb.id;
    if (id && !seenIds.has(String(id))) {
      seenIds.add(String(id));
      uniqueFeedback.push(fb);
    } else if (!id) {
      // If no ID, include it (shouldn't happen, but handle it)
      uniqueFeedback.push(fb);
    } else {
      console.warn(`⚠️ Duplicate feedback_id detected: ${id} - skipping duplicate`);
    }
  });
  
  if (uniqueFeedback.length !== approvedFeedback.length) {
    console.warn(`⚠️ Removed ${approvedFeedback.length - uniqueFeedback.length} duplicate entries`);
  }
  
  // Create employer map for lookup
  const employerMap = new Map();
  employers.forEach((emp) => {
    employerMap.set(String(emp.employer_key), emp);
  });
  
  // Transform each approved feedback entry - one-to-one mapping, no duplicates
  // CRITICAL: This should return EXACTLY the same number of entries as uniqueFeedback
  // Each approved feedback entry becomes ONE gallery card - no duplication
  const transformed = uniqueFeedback.map((fb, idx) => {
    // Log each feedback entry for debugging
    console.log(`Transforming Approved Feedback ${idx + 1}/${approvedFeedback.length}:`, {
      feedback_id: fb.feedback_id,
      employer_key: fb.employer_key,
      employer_name: fb.employer_name,
      job_role: fb.job_role,
      graduation_year: fb.graduation_year,
      approved_by_admin: fb.approved_by_admin,
      comment_length: fb.comment_overall?.length || 0,
      comment_preview: fb.comment_overall?.substring(0, 50) || 'no comment',
      technologies: fb.technologies,
      image_url: fb.image_url || 'NO IMAGE URL', // Log image URL to debug
    });
    const employer = employerMap.get(String(fb.employer_key)) || {};
    
    // Create achievements from feedback data
    const achievements = [];
    if (fb.tech_strength_level === 'Strong') {
      achievements.push('Technical Excellence');
    }
    if (parseFloat(fb.rating_overall) >= 4) {
      achievements.push('High Performance');
    }
    if (fb.technologies) {
      // Extract technologies from the feedback - handle both comma-separated and text formats
      let techList = [];
      if (fb.technologies.includes(',')) {
        techList = fb.technologies.split(',').map(t => t.trim()).filter(t => t.length > 0);
      } else {
        techList = [fb.technologies.trim()];
      }
      // Add up to 3 technologies to achievements
      achievements.push(...techList.slice(0, 3));
    }
    achievements.push('SLU Graduate');
    
    // Use the exact feedback data from admin approval
    const fullComment = fb.comment_overall || '';
    const jobRole = fb.job_role || 'Professional';
    const companyName = employer.employer_name || fb.employer_name || 'Partner Company';
    const graduationYear = fb.graduation_year || 'N/A';
    
    return {
      id: `feedback-${fb.feedback_id || idx}`,
      name: `Alumni from ${companyName}`,
      program: `Graduated ${graduationYear}`,
      year: graduationYear,
      previousRole: 'Student',
      currentRole: jobRole, // Use exact job_role from feedback
      company: companyName,
      location: employer.hq_city && employer.hq_state 
        ? `${employer.hq_city}, ${employer.hq_state}` 
        : employer.hq_country || 'USA',
      story: fullComment || `Successfully working as ${jobRole} at ${companyName}. ${fb.tech_strength_level === 'Strong' ? 'Demonstrates strong technical skills' : 'Continuing to develop technical expertise'}.`, // Use exact comment_overall
      photo: (fb.image_url && fb.image_url.trim() !== '' && fb.image_url !== 'undefined') 
        ? (fb.image_url.startsWith('/') ? fb.image_url : `/${fb.image_url.replace(/^\//, '')}`)
        : '/assets/hero/engagement img1.jpeg', // Use uploaded image if available, otherwise fallback
      achievements: achievements.length > 0 ? achievements : ['SLU Graduate', 'Career Success'],
      // Full data for hover tooltip
      fullData: {
        student: { 
          student_key: null, 
          first_name: 'Alumni', 
          last_name: `from ${employer.employer_name || 'Partner'}`,
          program_name: `Graduated ${fb.graduation_year || 'N/A'}`,
        },
        employment: { 
          job_title: fb.job_role, 
          location: employer.hq_city && employer.hq_state 
            ? `${employer.hq_city}, ${employer.hq_state}` 
            : employer.hq_country || 'USA', 
          start_date: fb.created_at 
        },
        feedback: {
          ...fb,
          employer_name: employer.employer_name || fb.employer_name || 'Partner Company',
          employer_key: fb.employer_key,
        },
        email: 'N/A',
        linkedin: 'N/A',
        startDate: fb.created_at || 'N/A',
        techStrength: fb.tech_strength_level || 'N/A',
        technologies: fb.technologies || 'N/A',
        rating: fb.rating_overall || 'N/A',
      },
    };
  });
  
  // CRITICAL: Return EXACTLY the same number of entries as uniqueFeedback
  // No duplicates, no additional entries - one approved feedback = one gallery card
  console.log(`\n✅ Transformation complete:`);
  console.log(`   📊 Input: ${uniqueFeedback.length} approved feedback entries`);
  console.log(`   📊 Output: ${transformed.length} gallery cards`);
  console.log(`   ⚠️  These counts MUST match - one approved feedback = one gallery card\n`);
  
  if (transformed.length !== uniqueFeedback.length) {
    console.error(`❌ ERROR: Transformation count mismatch! Expected ${uniqueFeedback.length}, got ${transformed.length}`);
  }
  
  // Final validation: Log each transformed entry
  transformed.forEach((entry, idx) => {
    console.log(`   [${idx + 1}] Gallery Card: ${entry.company} - ${entry.currentRole} (ID: ${entry.id})`);
  });
  
  return transformed;
};

// Load all gallery data
export const loadGalleryData = async () => {
  try {
    const data = await loadAllData();
    
    // Load approved success stories from API - with error handling
    let approvedStories = [];
    try {
      approvedStories = await loadApprovedSuccessStories();
    } catch (error) {
      console.warn('Failed to load approved success stories, continuing without them:', error);
    }
    
    // ============================================================
    // CRITICAL: Employer Feedback Showcase Data Source
    // ============================================================
    // This is the ONLY place where employer feedback data comes from for the gallery.
    // Data flow: Admin Console → Approve Feedback → CSV (approved_by_admin = '1')
    //            → API /api/employer-feedback/approved → loadApprovedEmployerFeedback()
    //            → transformApprovedEmployerFeedback() → Gallery Display
    //
    // NO other data sources are used. NO fallback data. NO generated data.
    // ONLY approved feedback from admin console appears in gallery.
    // ============================================================
    let approvedFeedback = [];
    try {
      approvedFeedback = await loadApprovedEmployerFeedback();
    } catch (error) {
      console.warn('Failed to load approved employer feedback, continuing without them:', error);
    }
    
    console.log('📊 Gallery data loading summary:', {
      approvedStoriesFromAPI: approvedStories.length,
      approvedFeedbackFromAPI: approvedFeedback.length, // Should match admin console approved count
    });
    
    // Transform ONLY approved feedback from API - no other data sources
    // Each approved feedback entry becomes exactly ONE gallery card
    let feedbackStories = [];
    try {
      feedbackStories = transformApprovedEmployerFeedback(approvedFeedback, data.employers);
    } catch (error) {
      console.warn('Failed to transform employer feedback stories:', error);
    }
    
    console.log('📊 Gallery data transformation summary:', {
      approvedStoriesCount: approvedStories.length,
      approvedFeedbackCount: approvedFeedback.length, // Input count
      transformedFeedbackStoriesCount: feedbackStories.length, // Output count (should match input)
    });
    
    // Validation: Counts should match
    if (approvedFeedback.length !== feedbackStories.length) {
      console.error(`❌ ERROR: Feedback count mismatch! API returned ${approvedFeedback.length}, but transformation created ${feedbackStories.length}`);
    }
    
    // Only use approved success stories from admin (no random/generated data)
    let successStories = [];
    try {
      successStories = approvedStories.length > 0 
        ? transformApprovedSuccessStories(approvedStories)
        : []; // Return empty array if no approved stories - don't generate random data
    } catch (error) {
      console.warn('Failed to transform success stories:', error);
    }
    
    // Transform employer words - this should always work as it uses CSV data
    let employerWords = [];
    try {
      employerWords = transformEmployerWords(data.employerFeedback, data.employers);
    } catch (error) {
      console.warn('Failed to transform employer words:', error);
    }
    
    // Transform alumni networking - this should always work as it uses CSV data
    let alumniNetworking = [];
    try {
      alumniNetworking = transformAlumniNetworking(data.events, data.alumniEngagement);
    } catch (error) {
      console.warn('Failed to transform alumni networking:', error);
    }
    
    return {
      employerWords: employerWords,
      alumniNetworking: alumniNetworking,
      careerSuccessStories: successStories, // Alumni success stories only
      employerFeedbackStories: feedbackStories, // ONLY approved feedback from admin API - no duplicates, no generated data
      // Keep raw data for hover tooltips
      rawData: {
        employers: data.employers || [],
        events: data.events || [],
        students: data.students || [],
        alumniEmployment: data.alumniEmployment || [],
        employerFeedback: data.employerFeedback || [],
      },
    };
  } catch (error) {
    console.error('Error loading gallery data:', error);
    return {
      employerWords: [],
      alumniNetworking: [],
      careerSuccessStories: [],
      employerFeedbackStories: [],
      rawData: {
        employers: [],
        events: [],
        students: [],
        alumniEmployment: [],
        employerFeedback: [],
      },
    };
  }
};
