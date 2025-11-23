/**
 * Permission utilities for DataNexus Assistant chatbot
 * Ensures role-based access control matches the UI permissions
 */

/**
 * Check if a user can view global analytics
 * @param {string} role - User role ('admin', 'alumni', 'employer')
 * @returns {boolean}
 */
export const canViewGlobalAnalytics = (role) => {
  return role === 'admin';
};

/**
 * Check if a user can view their own metrics
 * @param {string} role - User role
 * @returns {boolean}
 */
export const canViewSelfMetrics = (role) => {
  return ['admin', 'alumni', 'employer'].includes(role);
};

/**
 * Check if a user can perform functional actions
 * @param {string} role - User role
 * @returns {boolean}
 */
export const canPerformActions = (role) => {
  return ['admin', 'alumni', 'employer'].includes(role);
};

/**
 * Check if an intent requires global analytics access
 * @param {string} intent - Detected intent
 * @returns {boolean}
 */
export const requiresGlobalAnalytics = (intent) => {
  const globalIntents = [
    'global_metrics',
    'dashboard_analytics',
    'cross_user_comparison',
    'aggregate_statistics',
    'industry_distribution',
    'overall_engagement_rate',
    'total_alumni_count',
    'active_employers_count',
    'hiring_conversion_rate',
    'program_comparison',
    'cohort_comparison',
  ];
  return globalIntents.includes(intent);
};

/**
 * Check if an intent is about self-only data
 * @param {string} intent - Detected intent
 * @returns {boolean}
 */
export const isSelfOnlyIntent = (intent) => {
  const selfIntents = [
    'my_events',
    'my_engagement',
    'my_profile',
    'my_colleagues',
    'my_applications',
    'my_success_stories',
    'my_company_alumni',
    'my_event_participation',
    'my_feedback',
  ];
  return selfIntents.includes(intent);
};

/**
 * Check if an intent is a functional action
 * @param {string} intent - Detected intent
 * @returns {boolean}
 */
export const isFunctionalAction = (intent) => {
  const actionIntents = [
    'apply_event',
    'submit_engagement',
    'share_story',
    'update_profile',
    'request_event_participation',
    'submit_feedback',
    'navigate',
  ];
  return actionIntents.includes(intent);
};

/**
 * Get allowed actions for a role
 * @param {string} role - User role
 * @returns {Array<string>}
 */
export const getAllowedActions = (role) => {
  const baseActions = ['navigate', 'help', 'explain'];
  
  if (role === 'admin') {
    return [
      ...baseActions,
      'view_analytics',
      'view_all_data',
      'navigate_all_pages',
    ];
  }
  
  if (role === 'alumni') {
    return [
      ...baseActions,
      'apply_event',
      'submit_engagement',
      'share_story',
      'view_my_profile',
      'view_my_events',
      'view_my_colleagues',
      'navigate_alumni_pages',
    ];
  }
  
  if (role === 'employer') {
    return [
      ...baseActions,
      'view_company_profile',
      'view_company_alumni',
      'request_event_participation',
      'submit_feedback',
      'navigate_employer_pages',
    ];
  }
  
  return baseActions;
};

/**
 * Get restricted message for non-admin users asking about global metrics
 * @param {string} role - User role
 * @returns {string}
 */
export const getRestrictedMessage = (role) => {
  if (role === 'alumni') {
    return "For privacy and data governance reasons, I can't share overall dashboard numbers or other alumni's data. I can help you with your own events, engagement, and profile, and help you navigate to Alumni Portal, Events, Gallery, or Contact pages.";
  }
  
  if (role === 'employer') {
    return "I can share information about your company's relationship with SLU (your alumni employees, events you've joined, and feedback you've given). Overall SLU analytics and comparisons between employers are only visible to SLU administrators.";
  }
  
  return "You don't have permission to access this information.";
};

