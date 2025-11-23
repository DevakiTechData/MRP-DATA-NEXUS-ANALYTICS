import { useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loadAllData } from '../data/loadData';
import {
  calculateTotalAlumni,
  calculateEngagedAlumni,
  calculateEngagementRate,
  calculateAvgTouchpoints,
  getEngagementTrendByMonth,
  getEngagementByProgram,
  getEngagementByType,
  getEngagedAlumniByLocation,
  getTopEngagedAlumni,
  getEngagementByGraduationCohort,
  calculateActiveEmployers,
  calculateAvgEmployerRating,
  calculateHiringConversionRate,
} from '../utils/metrics';
import {
  canViewGlobalAnalytics,
  requiresGlobalAnalytics,
  isSelfOnlyIntent,
  isFunctionalAction,
  getRestrictedMessage,
} from '../utils/chatPermissions';
import { fetchMyProfile, fetchMyColleagues } from '../services/alumniApi';
import { fetchMyAlumniEmployees, fetchEmployerProfile } from '../services/employerFeedbackApi';
import { getAllMyAlumniSubmissions } from '../services/requestsApi';

/**
 * Intent detection patterns
 */
const INTENT_PATTERNS = {
  // Global analytics (admin only)
  global_metrics: /\b(total|overall|all|entire|across all|aggregate|sum|count of all|alumni metrics|employer metrics|show me|tell me about|what are)\b.*\b(alumni|employer|engagement|hiring|conversion|rate|percentage|metrics|statistics)\b/i,
  dashboard_analytics: /\b(dashboard|analytics|metrics|statistics|kpi|key performance)\b/i,
  overall_engagement_rate: /\b(overall|total|entire).*engagement.*rate\b/i,
  total_alumni_count: /\b(how many|total|count of|number of|alumni count|alumni total)\b.*\b(alumni|students)\b/i,
  active_employers_count: /\b(how many|total|count of|number of|employer count|employer total|total employers|employers count|how many employers)\b.*\b(employer|companies|partners|active)\b/i,
  hiring_conversion_rate: /\b(hiring|conversion).*rate\b/i,
  program_comparison: /\b(which|what).*program.*(most|least|highest|lowest|best|worst|top|bottom)\b/i,
  cohort_comparison: /\b(which|what).*cohort.*(most|least|highest|lowest|best|worst|top|bottom)\b/i,
  event_metrics: /\b(how many|total|count of|number of|event count|total events|events total|upcoming events|past events)\b.*\b(event|events|fair|networking|career)\b/i,
  event_types: /\b(which|what).*event.*type.*(most|popular|common|frequent)\b/i,
  total_hires: /\b(total|how many|count of|number of).*(hire|hires|hired|hiring|placement|placements)\b.*(\d{4})?\b/i,
  hires_by_year: /\b(hire|hires|hired|hiring|placement|placements).*(in|during|for|year|2024|2023|2022|2021|2020)\b/i,
  contact_info: /\b(contact|address|phone|email|location|where|how to reach|reach out|get in touch|slu contact|university contact)\b/i,
  alumni_data: /\b(alumni data|alumni information|alumni details|alumni statistics|alumni info)\b/i,
  
  // Self-only intents
  my_events: /\b(my|I|me).*(event|attended|registered|upcoming|applied)\b/i,
  my_engagement: /\b(my|I|me).*(engagement|participated|mentorship|hours|minutes)\b/i,
  my_profile: /\b(my|I|me).*(profile|information|details|data)\b/i,
  my_colleagues: /\b(my|I|me).*(colleague|co-worker|same company|network)\b/i,
  my_applications: /\b(my|I|me).*(application|submission|request|status)\b/i,
  my_success_stories: /\b(my|I|me).*(success story|story|testimonial)\b/i,
  
  // Employer-specific
  my_company_alumni: /\b(how many|count|number).*(alumni|employees|slu).*(at|in|our|my).*(company|organization)\b/i,
  my_event_participation: /\b(my|I|we|our).*(event.*participation|participated|events)\b/i,
  my_feedback: /\b(my|I|we|our).*(feedback|submitted|given)\b/i,
  
  // Functional actions
  apply_event: /\b(apply|register|sign up|join).*(event|fair|networking)\b/i,
  submit_engagement: /\b(submit|log|record|add).*(engagement|participation|mentorship)\b/i,
  share_story: /\b(share|submit|post|write).*(success story|story|testimonial)\b/i,
  update_profile: /\b(update|edit|change|modify).*(profile|information|details)\b/i,
  request_event_participation: /\b(request|apply|participate|join).*(event|fair)\b/i,
  submit_feedback: /\b(submit|give|provide|send).*(feedback|review|rating)\b/i,
  
  // Navigation
  navigate: /\b(go to|navigate|open|show|take me to|visit).*(dashboard|portal|page|gallery|contact|events|home)\b/i,
  
  // Help
  help: /\b(help|what can|what do|how|guide|assist|support)\b/i,
  explain: /\b(what is|explain|tell me about|describe|define)\b/i,
};

/**
 * Detect intent from user message
 */
const detectIntent = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Check patterns in order of specificity (more specific first)
  const orderedPatterns = [
    'overall_engagement_rate',
    'total_alumni_count',
    'active_employers_count',
    'hiring_conversion_rate',
    'total_hires',
    'hires_by_year',
    'contact_info',
    'alumni_data',
    'event_metrics',
    'event_types',
    'program_comparison',
    'cohort_comparison',
    'my_events',
    'my_engagement',
    'my_profile',
    'my_colleagues',
    'my_applications',
    'my_success_stories',
    'my_company_alumni',
    'my_event_participation',
    'my_feedback',
    'apply_event',
    'submit_engagement',
    'share_story',
    'update_profile',
    'request_event_participation',
    'submit_feedback',
    'navigate',
    'help',
    'explain',
    'global_metrics',
    'dashboard_analytics',
  ];
  
  for (const intent of orderedPatterns) {
    if (INTENT_PATTERNS[intent] && INTENT_PATTERNS[intent].test(message)) {
      return intent;
    }
  }
  
  // If message contains "alumni" and "metric" or similar, treat as global_metrics
  if ((lowerMessage.includes('alumni') || lowerMessage.includes('employer')) && 
      (lowerMessage.includes('metric') || lowerMessage.includes('stat') || lowerMessage.includes('data'))) {
    return 'global_metrics';
  }
  
  return 'general';
};

/**
 * Chat bot hook
 */
export const useChatBot = () => {
  const { user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataCache, setDataCache] = useState(null);

  const role = user?.role;
  const studentKey = user?.student_key;
  const employerKey = user?.employer_key;
  const currentRoute = location.pathname;

  // Load data cache for admin analytics
  const loadDataCache = useCallback(async () => {
    if (role === 'admin' && !dataCache) {
      setIsLoading(true);
      try {
        const data = await loadAllData();
        setDataCache(data);
      } catch (error) {
        console.error('Failed to load data for chatbot:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [role, dataCache]);

  // Process admin analytics queries
  const handleAdminQuery = useCallback(async (intent, message) => {
    if (!dataCache) {
      await loadDataCache();
      if (!dataCache) {
        return "I'm loading the data. Please try again in a moment.";
      }
    }

    const { students, alumniEngagement, employers, alumniEmployment, employerAlumniFeedback, events } = dataCache;

    switch (intent) {
      case 'total_alumni_count':
      case 'global_metrics': {
        const total = calculateTotalAlumni(students);
        const engaged = calculateEngagedAlumni(students, alumniEngagement);
        const rate = calculateEngagementRate(engaged, total);
        return `📊 **Alumni Overview:**\n- Total Alumni: ${total.toLocaleString()}\n- Engaged Alumni: ${engaged.toLocaleString()}\n- Engagement Rate: ${rate}%`;
      }

      case 'overall_engagement_rate': {
        const total = calculateTotalAlumni(students);
        const engaged = calculateEngagedAlumni(students, alumniEngagement);
        const rate = calculateEngagementRate(engaged, total);
        return `The overall engagement rate is **${rate}%** (${engaged.toLocaleString()} engaged out of ${total.toLocaleString()} total alumni).`;
      }

      case 'program_comparison': {
        const byProgram = getEngagementByProgram(students, alumniEngagement);
        const top = byProgram.slice(0, 5);
        return `📈 **Top 5 Programs by Engagement:**\n${top.map((p, i) => `${i + 1}. ${p.program}: ${p.engagedAlumni} engaged alumni`).join('\n')}`;
      }

      case 'cohort_comparison': {
        const byCohort = getEngagementByGraduationCohort(students, alumniEngagement);
        const sorted = byCohort.sort((a, b) => b.engagedAlumni - a.engagedAlumni);
        const top = sorted.slice(0, 5);
        return `📅 **Top 5 Cohorts by Engagement:**\n${top.map((c, i) => `${i + 1}. ${c.year}: ${c.engagedAlumni} engaged alumni`).join('\n')}`;
      }

      case 'active_employers_count': {
        // Count unique employers from multiple sources
        const employersFromEmployment = new Set((alumniEmployment || []).filter(e => e.status === 'Verified').map(e => e.employer_key));
        const employersFromEngagement = new Set((alumniEngagement || []).filter(e => e.employer_key).map(e => String(e.employer_key)));
        const allActiveEmployers = new Set([...employersFromEmployment, ...employersFromEngagement]);
        const totalEmployers = employers?.length || 0;
        const activeCount = allActiveEmployers.size;
        
        return `📊 **Employer Overview:**\n- **Total Employers in System:** ${totalEmployers.toLocaleString()}\n- **Active Employers (with engagements/hires):** ${activeCount.toLocaleString()}\n\nActive employers are those with verified SLU alumni employees or recent engagement records.`;
      }

      case 'event_metrics': {
        const totalEvents = events?.length || 0;
        const now = new Date();
        const upcomingEvents = (events || []).filter(e => {
          const eventDate = new Date(e.event_date || e.date || '');
          return eventDate >= now;
        });
        const pastEvents = totalEvents - upcomingEvents.length;
        
        // Count events by type
        const eventTypes = {};
        (events || []).forEach(e => {
          const type = e.event_type || e.type || 'Other';
          eventTypes[type] = (eventTypes[type] || 0) + 1;
        });
        const topEventTypes = Object.entries(eventTypes)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([type, count]) => `${type}: ${count}`)
          .join('\n');
        
        return `📅 **Event Metrics Summary:**\n\n- **Total Events:** ${totalEvents.toLocaleString()}\n- **Upcoming Events:** ${upcomingEvents.length.toLocaleString()}\n- **Past Events:** ${pastEvents.toLocaleString()}\n\n**Top 5 Event Types:**\n${topEventTypes || 'No event type data available'}\n\nI can also provide:\n- Event participation rates\n- Most popular event types\n- Event locations\n- Upcoming event details\n\nWhat would you like to know?`;
      }

      case 'event_types': {
        const eventTypes = {};
        (events || []).forEach(e => {
          const type = e.event_type || e.type || 'Other';
          eventTypes[type] = (eventTypes[type] || 0) + 1;
        });
        const sortedTypes = Object.entries(eventTypes)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        
        if (sortedTypes.length === 0) {
          return "No event type data available.";
        }
        
        return `📊 **Most Popular Event Types:**\n${sortedTypes.map(([type, count], idx) => `${idx + 1}. ${type}: ${count} events`).join('\n')}`;
      }

      case 'total_hires':
      case 'hires_by_year': {
        // Extract year from message if present
        const yearMatch = message.match(/\b(202[0-5]|202[0-9])\b/);
        const targetYear = yearMatch ? parseInt(yearMatch[1]) : null;
        
        let hires = (alumniEmployment || []).filter(e => e.status === 'Verified');
        
        if (targetYear) {
          // Filter by year if start_date exists
          hires = hires.filter(e => {
            if (!e.start_date) return false;
            const hireDate = new Date(e.start_date);
            return hireDate.getFullYear() === targetYear;
          });
        }
        
        const totalHires = hires.length;
        const uniqueAlumni = new Set(hires.map(h => h.student_key)).size;
        const uniqueEmployers = new Set(hires.map(h => h.employer_key)).size;
        
        const yearText = targetYear ? ` in ${targetYear}` : '';
        return `📊 **Total Hires${yearText}:**\n- **Total Hire Records:** ${totalHires.toLocaleString()}\n- **Unique Alumni Hired:** ${uniqueAlumni.toLocaleString()}\n- **Unique Employers:** ${uniqueEmployers.toLocaleString()}\n\n${targetYear ? `These are verified hires with start dates in ${targetYear}.` : 'These are all verified hires in the system.'}`;
      }

      case 'contact_info': {
        return `📞 **Saint Louis University Contact Information:**\n\n**Main Campus:**\n📍 1 N. Grand Blvd.\nSt. Louis, MO 63103 USA\n\n**Phone:**\n📱 (314) 977-2222\n\n**Website:**\n🌐 www.slu.edu\n\n**For Alumni Services:**\nVisit the Contact page (/contact) to:\n- Update your alumni record\n- Submit inquiries\n- Connect with SLU\n\n**For DataNexus Support:**\nContact the SLU Engagement Office through the Contact page.`;
      }

      case 'alumni_data': {
        const total = calculateTotalAlumni(students);
        const engaged = calculateEngagedAlumni(students, alumniEngagement);
        const rate = calculateEngagementRate(engaged, total);
        const totalHires = (alumniEmployment || []).filter(e => e.status === 'Verified').length;
        const uniqueEmployers = new Set((alumniEmployment || []).filter(e => e.status === 'Verified').map(e => e.employer_key)).size;
        
        // Program distribution
        const programCounts = {};
        (students || []).forEach(s => {
          const program = s.program_name || s.major || 'Unknown';
          programCounts[program] = (programCounts[program] || 0) + 1;
        });
        const topPrograms = Object.entries(programCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([prog, count]) => `${prog}: ${count}`)
          .join('\n');
        
        return `📊 **Comprehensive Alumni Data:**\n\n**Overview:**\n- **Total Alumni:** ${total.toLocaleString()}\n- **Engaged Alumni:** ${engaged.toLocaleString()}\n- **Engagement Rate:** ${rate}%\n- **Total Verified Hires:** ${totalHires.toLocaleString()}\n- **Employers with Hires:** ${uniqueEmployers.toLocaleString()}\n\n**Top 5 Programs by Alumni Count:**\n${topPrograms || 'No program data available'}\n\nI can provide more details on:\n- Engagement trends\n- Program comparisons\n- Location distribution\n- Cohort analysis\n\nWhat would you like to explore?`;
      }

      case 'dashboard_analytics':
      case 'global_metrics': {
        // Check if query is about employers, events, or alumni
        const lowerMsg = message.toLowerCase();
        const isEmployerQuery = lowerMsg.includes('employer') && !lowerMsg.includes('alumni') && !lowerMsg.includes('event');
        const isEventQuery = lowerMsg.includes('event') && !lowerMsg.includes('alumni') && !lowerMsg.includes('employer');
        
        if (isEventQuery) {
          // Event metrics summary
          const totalEvents = events?.length || 0;
          const now = new Date();
          const upcomingEvents = (events || []).filter(e => {
            const eventDate = new Date(e.event_date || e.date || '');
            return eventDate >= now;
          });
          const pastEvents = totalEvents - upcomingEvents.length;
          
          const eventTypes = {};
          (events || []).forEach(e => {
            const type = e.event_type || e.type || 'Other';
            eventTypes[type] = (eventTypes[type] || 0) + 1;
          });
          const topEventTypes = Object.entries(eventTypes)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([type, count]) => `${type} (${count})`)
            .join(', ');
          
          return `📅 **Event Metrics Summary:**\n\n- **Total Events:** ${totalEvents.toLocaleString()}\n- **Upcoming Events:** ${upcomingEvents.length.toLocaleString()}\n- **Past Events:** ${pastEvents.toLocaleString()}\n- **Top Event Types:** ${topEventTypes || 'N/A'}\n\nI can also provide:\n- Event participation rates\n- Most popular event types\n- Event locations\n- Upcoming event details\n\nWhat would you like to explore?`;
        } else if (isEmployerQuery) {
          // Employer metrics summary
          const employersFromEmployment = new Set((alumniEmployment || []).filter(e => e.status === 'Verified').map(e => e.employer_key));
          const employersFromEngagement = new Set((alumniEngagement || []).filter(e => e.employer_key).map(e => String(e.employer_key)));
          const allActiveEmployers = new Set([...employersFromEmployment, ...employersFromEngagement]);
          const totalEmployers = employers?.length || 0;
          const activeCount = allActiveEmployers.size;
          const avgRating = calculateAvgEmployerRating(employers);
          const hiringData = calculateHiringConversionRate(alumniEngagement);
          
          return `📊 **Employer Metrics Summary:**\n\n- **Total Employers:** ${totalEmployers.toLocaleString()}\n- **Active Employers:** ${activeCount.toLocaleString()}\n- **Avg Employer Rating:** ${avgRating.toFixed(1)}/5\n- **Hiring Conversion Rate:** ${hiringData.conversionRate.toFixed(1)}%\n- **Total Opportunities:** ${hiringData.totalOpportunities.toLocaleString()}\n- **Total Hires:** ${hiringData.totalHires.toLocaleString()}\n\nI can also provide:\n- Industry distribution\n- Top hiring employers\n- Employer engagement scores\n- Partnership analysis\n\nWhat would you like to explore?`;
        } else {
          // Alumni metrics summary
          const total = calculateTotalAlumni(students);
          const engaged = calculateEngagedAlumni(students, alumniEngagement);
          const rate = calculateEngagementRate(engaged, total);
          const avgTouchpoints = calculateAvgTouchpoints(alumniEngagement, engaged);
          const totalTouchpoints = alumniEngagement?.length || 0;
          
          return `📊 **Alumni Metrics Summary:**\n\n- **Total Alumni:** ${total.toLocaleString()}\n- **Engaged Alumni:** ${engaged.toLocaleString()}\n- **Engagement Rate:** ${rate}%\n- **Total Touchpoints:** ${totalTouchpoints.toLocaleString()}\n- **Avg Touchpoints per Engaged Alumni:** ${avgTouchpoints}\n\nI can also provide:\n- Program comparisons\n- Cohort analysis\n- Location breakdowns\n- Engagement trends\n- Top engaged alumni\n\nWhat would you like to explore?`;
        }
      }

      case 'general': {
        // If message contains "alumni metrics" or "employer metrics" or "event metrics" or similar, treat as global_metrics
        const lowerMsg = message.toLowerCase();
        if ((lowerMsg.includes('alumni') || lowerMsg.includes('employer') || lowerMsg.includes('event')) && 
            (lowerMsg.includes('metric') || lowerMsg.includes('stat') || lowerMsg.includes('data') || lowerMsg.includes('summary') || lowerMsg.includes('count'))) {
          
          const isEmployerQuery = lowerMsg.includes('employer') && !lowerMsg.includes('alumni') && !lowerMsg.includes('event');
          const isEventQuery = lowerMsg.includes('event') && !lowerMsg.includes('alumni') && !lowerMsg.includes('employer');
          
          if (isEventQuery) {
            // Event metrics
            const totalEvents = events?.length || 0;
            const now = new Date();
            const upcomingEvents = (events || []).filter(e => {
              const eventDate = new Date(e.event_date || e.date || '');
              return eventDate >= now;
            });
            const pastEvents = totalEvents - upcomingEvents.length;
            
            const eventTypes = {};
            (events || []).forEach(e => {
              const type = e.event_type || e.type || 'Other';
              eventTypes[type] = (eventTypes[type] || 0) + 1;
            });
            const topEventTypes = Object.entries(eventTypes)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([type, count]) => `${type} (${count})`)
              .join(', ');
            
            return `📅 **Event Metrics Summary:**\n\n- **Total Events:** ${totalEvents.toLocaleString()}\n- **Upcoming Events:** ${upcomingEvents.length.toLocaleString()}\n- **Past Events:** ${pastEvents.toLocaleString()}\n- **Top Event Types:** ${topEventTypes || 'N/A'}\n\nI can also provide:\n- Event participation rates\n- Most popular event types\n- Event locations\n- Upcoming event details\n\nWhat would you like to explore?`;
          } else if (isEmployerQuery) {
            // Employer metrics
            const employersFromEmployment = new Set((alumniEmployment || []).filter(e => e.status === 'Verified').map(e => e.employer_key));
            const employersFromEngagement = new Set((alumniEngagement || []).filter(e => e.employer_key).map(e => String(e.employer_key)));
            const allActiveEmployers = new Set([...employersFromEmployment, ...employersFromEngagement]);
            const totalEmployers = employers?.length || 0;
            const activeCount = allActiveEmployers.size;
            const avgRating = calculateAvgEmployerRating(employers);
            const hiringData = calculateHiringConversionRate(alumniEngagement);
            
            return `📊 **Employer Metrics Summary:**\n\n- **Total Employers:** ${totalEmployers.toLocaleString()}\n- **Active Employers:** ${activeCount.toLocaleString()}\n- **Avg Employer Rating:** ${avgRating.toFixed(1)}/5\n- **Hiring Conversion Rate:** ${hiringData.conversionRate.toFixed(1)}%\n- **Total Opportunities:** ${hiringData.totalOpportunities.toLocaleString()}\n- **Total Hires:** ${hiringData.totalHires.toLocaleString()}\n\nI can also provide:\n- Industry distribution\n- Top hiring employers\n- Employer engagement scores\n\nWhat would you like to explore?`;
          } else {
            // Alumni metrics
            const total = calculateTotalAlumni(students);
            const engaged = calculateEngagedAlumni(students, alumniEngagement);
            const rate = calculateEngagementRate(engaged, total);
            const avgTouchpoints = calculateAvgTouchpoints(alumniEngagement, engaged);
            const totalTouchpoints = alumniEngagement?.length || 0;
            
            return `📊 **Alumni Metrics Summary:**\n\n- **Total Alumni:** ${total.toLocaleString()}\n- **Engaged Alumni:** ${engaged.toLocaleString()}\n- **Engagement Rate:** ${rate}%\n- **Total Touchpoints:** ${totalTouchpoints.toLocaleString()}\n- **Avg Touchpoints per Engaged Alumni:** ${avgTouchpoints}\n\nI can also provide:\n- Program comparisons\n- Cohort analysis\n- Location breakdowns\n- Engagement trends\n- Top engaged alumni\n\nWhat would you like to explore?`;
          }
        }
        return "I can help you with alumni metrics, engagement rates, program comparisons, cohort analysis, and employer statistics. What would you like to know?";
      }

      default:
        return "I can help you with alumni metrics, engagement rates, program comparisons, cohort analysis, and employer statistics. What would you like to know?";
    }
  }, [dataCache, loadDataCache]);

  // Process alumni self-only queries
  const handleAlumniQuery = useCallback(async (intent, message) => {
    if (!token || !studentKey) {
      return "I need your authentication to access your data. Please log in.";
    }

    try {
      switch (intent) {
        case 'my_profile': {
          const profile = await fetchMyProfile(token);
          return `👤 **Your Profile:**\n- Name: ${profile.profile?.first_name || 'N/A'} ${profile.profile?.last_name || ''}\n- Program: ${profile.profile?.program_name || 'N/A'}\n- Graduation Year: ${profile.profile?.graduation_year || 'N/A'}\n- Events Attended: ${profile.stats?.eventsAttended || 0}\n- Upcoming Events: ${profile.stats?.upcomingEventsCount || 0}\n- Colleagues: ${profile.stats?.colleaguesCount || 0}`;
        }

        case 'my_events': {
          const profile = await fetchMyProfile(token);
          return `📅 **Your Events:**\n- Events Attended: ${profile.stats?.eventsAttended || 0}\n- Events Registered: ${profile.stats?.eventsRegistered || 0}\n- Upcoming Events: ${profile.stats?.upcomingEventsCount || 0}`;
        }

        case 'my_colleagues': {
          const colleagues = await fetchMyColleagues(token);
          if (!colleagues.colleagues || colleagues.colleagues.length === 0) {
            return "You don't have any SLU colleagues at your company yet.";
          }
          return `👥 **Your SLU Colleagues (${colleagues.colleagues.length}):**\n${colleagues.colleagues.slice(0, 5).map(c => `- ${c.name} (${c.program}, ${c.graduation_year})`).join('\n')}${colleagues.colleagues.length > 5 ? `\n... and ${colleagues.colleagues.length - 5} more` : ''}`;
        }

        case 'my_applications': {
          const submissions = await getAllMyAlumniSubmissions(token);
          const eventApps = submissions.eventApplications?.length || 0;
          const stories = submissions.successStories?.length || 0;
          const feedback = submissions.engagementFeedback?.length || 0;
          return `📋 **Your Submissions:**\n- Event Applications: ${eventApps}\n- Success Stories: ${stories}\n- Engagement Feedback: ${feedback}`;
        }

        case 'navigate': {
          if (message.includes('portal')) {
            navigate('/alumni-portal');
            return "Taking you to the Alumni Portal...";
          }
          if (message.includes('dashboard')) {
            navigate('/alumni');
            return "Taking you to the Alumni Dashboard...";
          }
          if (message.includes('gallery')) {
            navigate('/gallery');
            return "Taking you to the Gallery...";
          }
          if (message.includes('contact')) {
            navigate('/contact');
            return "Taking you to the Contact page...";
          }
          return "I can navigate you to: Alumni Portal, Alumni Dashboard, Gallery, or Contact. Where would you like to go?";
        }

        case 'help':
        case 'explain': {
          return `🤖 **I can help you with:**\n- View your profile and stats\n- Check your events and applications\n- See your SLU colleagues\n- Navigate to different pages\n- Apply for events\n- Share success stories\n\nWhat would you like to do?`;
        }

        default:
          return "I can help you view your profile, events, colleagues, and navigate to different pages. What would you like to do?";
      }
    } catch (error) {
      console.error('Error handling alumni query:', error);
      return "Sorry, I encountered an error. Please try again.";
    }
  }, [token, studentKey, navigate]);

  // Process employer queries
  const handleEmployerQuery = useCallback(async (intent, message) => {
    if (!token || !employerKey) {
      return "I need your authentication to access your data. Please log in.";
    }

    try {
      switch (intent) {
        case 'my_company_alumni': {
          const employees = await fetchMyAlumniEmployees(token);
          const count = employees.alumni?.length || 0;
          return `👥 **SLU Alumni at Your Company:** ${count} verified alumni${count > 0 ? `\n${employees.alumni.slice(0, 5).map(a => `- ${a.name} (${a.program}, ${a.graduation_year})`).join('\n')}${count > 5 ? `\n... and ${count - 5} more` : ''}` : ''}`;
        }

        case 'my_event_participation': {
          const profile = await fetchEmployerProfile(token);
          // This would need to be enhanced with actual event participation data
          return "I can help you view your event participation. You can see this in the Employer Portal under 'SLU Hiring & Engagement Events'.";
        }

        case 'navigate': {
          if (message.includes('portal')) {
            navigate('/employer-portal');
            return "Taking you to the Employer Portal...";
          }
          if (message.includes('dashboard')) {
            navigate('/employer');
            return "Taking you to the Employer Dashboard...";
          }
          return "I can navigate you to: Employer Portal, Employer Dashboard, Gallery, or Contact. Where would you like to go?";
        }

        case 'help':
        case 'explain': {
          return `🤖 **I can help you with:**\n- View your company profile\n- See SLU alumni at your company\n- Check event participation\n- Navigate to different pages\n\nWhat would you like to do?`;
        }

        default:
          return "I can help you view your company's relationship with SLU, see alumni at your company, and navigate to different pages. What would you like to do?";
      }
    } catch (error) {
      console.error('Error handling employer query:', error);
      return "Sorry, I encountered an error. Please try again.";
    }
  }, [token, employerKey, navigate]);

  // Main message handler
  const sendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim()) return;

    const userMsg = { role: 'user', content: userMessage, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const intent = detectIntent(userMessage);
      
      // Check permissions
      if (requiresGlobalAnalytics(intent) && !canViewGlobalAnalytics(role)) {
        const restrictedMsg = {
          role: 'assistant',
          content: getRestrictedMessage(role),
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, restrictedMsg]);
        setIsLoading(false);
        return;
      }

      let response = '';

      if (role === 'admin') {
        response = await handleAdminQuery(intent, userMessage);
      } else if (role === 'alumni') {
        response = await handleAlumniQuery(intent, userMessage);
      } else if (role === 'employer') {
        response = await handleEmployerQuery(intent, userMessage);
      } else {
        response = "Please log in to use the DataNexus Assistant.";
      }

      const assistantMsg = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMsg = {
        role: 'assistant',
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [role, handleAdminQuery, handleAlumniQuery, handleEmployerQuery]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
    role,
    currentRoute,
  };
};

