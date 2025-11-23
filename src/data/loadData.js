import Papa from "papaparse";

/**
 * Load a CSV file with proper error handling and timeout
 * Returns empty array if file fails to load
 */
export const loadCSV = async (path, timeoutMs = 30000) => {
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(path, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`Failed to load CSV: ${path} - Status: ${response.status}`);
        return [];
      }
      const text = await response.text();
      if (!text || text.trim().length === 0) {
        console.warn(`CSV file is empty: ${path}`);
        return [];
      }
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      return parsed.data || [];
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error(`Timeout loading CSV file ${path} (exceeded ${timeoutMs}ms)`);
      } else {
        throw fetchError;
      }
      return [];
    }
  } catch (error) {
    console.error(`Error loading CSV file ${path}:`, error);
    return [];
  }
};

/**
 * Load all data from CSV tables
 * Uses Promise.allSettled to ensure all files load independently
 * Each file that fails will return an empty array
 */
export const loadAllData = async () => {
  try {
    const results = await Promise.allSettled([
      loadCSV("/dim_contact.csv"),
      loadCSV("/dim_date.csv"),
      loadCSV("/dim_employers.csv"),
      loadCSV("/dim_event.csv"),
      loadCSV("/Dim_Students.csv"),
      loadCSV("/fact_alumni_engagement.csv"),
      loadCSV("/alumni_employment.csv"),
      loadCSV("/employer_alumni_feedback.csv"),
    ]);

    // Extract data from results, defaulting to empty array if any failed
    const [contacts, dates, employers, events, students, alumniEngagement, alumniEmployment, employerFeedback] = results.map(
      (result) => (result.status === 'fulfilled' ? result.value : [])
    );

    // Log any failures and success counts
    const fileNames = [
      'dim_contact.csv',
      'dim_date.csv',
      'dim_employers.csv',
      'dim_event.csv',
      'Dim_Students.csv',
      'fact_alumni_engagement.csv',
      'alumni_employment.csv',
      'employer_alumni_feedback.csv'
    ];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const count = result.value?.length || 0;
        console.log(`[loadAllData] ✓ ${fileNames[index]}: ${count} records`);
      } else {
        console.error(`[loadAllData] ✗ Failed to load ${fileNames[index]}:`, result.reason);
      }
    });

    return {
      contacts: contacts || [],
      dates: dates || [],
      employers: employers || [],
      events: events || [],
      students: students || [],
      alumniEngagement: alumniEngagement || [],
      alumniEmployment: alumniEmployment || [],
      employerFeedback: employerFeedback || [],
    };
  } catch (error) {
    console.error("Error loading data:", error);
    return {
      contacts: [],
      dates: [],
      employers: [],
      events: [],
      students: [],
      alumniEngagement: [],
      alumniEmployment: [],
      employerFeedback: [],
    };
  }
};
