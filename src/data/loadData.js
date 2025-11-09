import Papa from "papaparse";

export const loadCSV = async (path) => {
  const response = await fetch(path);
  const text = await response.text();
  return Papa.parse(text, { header: true, skipEmptyLines: true }).data;
};

export const loadAllData = async () => {
  try {
    const [contacts, dates, employers, events, students, alumniEngagement] = await Promise.all([
      loadCSV("/dim_contact.csv"),
      loadCSV("/dim_date.csv"),
      loadCSV("/dim_employers.csv"),
      loadCSV("/dim_event.csv"),
      loadCSV("/Dim_Students.csv"),
      loadCSV("/fact_alumni_engagement.csv"),
    ]);

    return {
      contacts,
      dates,
      employers,
      events,
      students,
      alumniEngagement,
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
    };
  }
};
