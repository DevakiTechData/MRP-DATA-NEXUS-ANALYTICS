import { useEffect, useMemo, useState } from 'react';
import {
  fetchAdminTables,
  fetchTableData,
  createRecord,
  updateRecord,
  deleteRecord,
  fetchImageCategories,
  fetchImages,
  uploadImage,
  deleteImageFile,
  fetchAlumniSubmissions,
  updateSubmissionStatus,
  fetchEmployerSubmissions,
  updateEmployerEventParticipation,
  approveAlumniFeedback,
  deleteAlumniFeedback,
  fetchConnectRequests,
  updateConnectRequest,
  deleteConnectRequest,
  updateAlumniSubmission,
  updateEmployerFeedback,
  updateEmployerEventParticipationFull,
} from '../services/adminApi';
import { deleteSubmission } from '../services/requestsApi';
import { fetchAlumniFeedback } from '../services/employerFeedbackApi';
import { useAuth } from '../context/AuthContext';
import ReadyToExploreFooter from '../components/ReadyToExploreFooter';

const initialStatus = { type: null, message: '' };

const Admin = () => {
  const { token } = useAuth();
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [tableMeta, setTableMeta] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [formMode, setFormMode] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('tables');
  const [imageCategories, setImageCategories] = useState([]);
  const [selectedImageCategory, setSelectedImageCategory] = useState('');
  const [imageItems, setImageItems] = useState([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageStatus, setImageStatus] = useState(initialStatus);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submissions, setSubmissions] = useState({ eventApplications: [], successStories: [], engagementFeedback: [] });
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [selectedSubmissionType, setSelectedSubmissionType] = useState('event-applications');
  const [employerFeedback, setEmployerFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackFilters, setFeedbackFilters] = useState({
    graduation_year: '',
    technologies: '',
    job_role: '',
    tech_strength_level: '',
  });
  const [employerSubmissions, setEmployerSubmissions] = useState({
    eventParticipations: [],
    jobPostings: [],
    jobApplications: [],
    alumniFeedback: [],
  });
  const [employerSubmissionsLoading, setEmployerSubmissionsLoading] = useState(false);
  const [selectedEmployerSubmissionType, setSelectedEmployerSubmissionType] = useState('event-participation');
  const [connectRequests, setConnectRequests] = useState([]);
  const [connectRequestsLoading, setConnectRequestsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const loadImagesForCategory = async (categoryId) => {
    if (!categoryId || !token) {
      setImageItems([]);
      return;
    }
    setImageLoading(true);
    setImageStatus(initialStatus);
    try {
      const data = await fetchImages(categoryId, token);
      setImageItems(data.files ?? []);
    } catch (error) {
      setImageStatus({ type: 'error', message: error.message });
    } finally {
      setImageLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }
    const loadTables = async () => {
      try {
        const list = await fetchAdminTables(token);
        setTables(list);
        if (list.length > 0) {
          setSelectedTableId((current) => current || list[0].id);
        }
      } catch (error) {
        setStatus({ type: 'error', message: error.message });
      }
    };
    loadTables();
  }, [token]);

  useEffect(() => {
    const loadTableData = async () => {
      if (!selectedTableId || !token) return;
      setLoading(true);
      setStatus(initialStatus);
      try {
        const data = await fetchTableData(selectedTableId, token);
        setTableMeta(data);
        setRows(data.rows);
      } catch (error) {
        setStatus({ type: 'error', message: error.message });
      } finally {
        setLoading(false);
      }
    };
    loadTableData();
  }, [selectedTableId, token]);

  useEffect(() => {
    if (activeTab !== 'images' || !token) return undefined;

    let ignore = false;
    const loadCategories = async () => {
      setImageStatus(initialStatus);
      try {
        const categories = await fetchImageCategories(token);
        if (ignore) return;
        setImageCategories(categories);
        setSelectedImageCategory((current) => {
          if (current && categories.some((cat) => cat.id === current)) {
            return current;
          }
          return categories[0]?.id ?? '';
        });
        if (categories.length === 0) {
          setImageItems([]);
        }
      } catch (error) {
        if (!ignore) {
          setImageStatus({ type: 'error', message: error.message });
        }
      }
    };

    loadCategories();

    return () => {
      ignore = true;
    };
  }, [activeTab, token]);

  useEffect(() => {
    if (activeTab !== 'images' || !token) return;
    if (!selectedImageCategory) {
      setImageItems([]);
      return;
    }
    loadImagesForCategory(selectedImageCategory);
  }, [activeTab, selectedImageCategory, token]);

  useEffect(() => {
    if (activeTab !== 'submissions' || !token) return;
    const loadSubmissions = async () => {
      setSubmissionsLoading(true);
      try {
        const data = await fetchAlumniSubmissions('all', token);
        setSubmissions({
          eventApplications: data.eventApplications || [],
          successStories: data.successStories || [],
          engagementFeedback: data.engagementFeedback || [],
        });
      } catch (error) {
        setStatus({ type: 'error', message: error.message });
      } finally {
        setSubmissionsLoading(false);
      }
    };
    loadSubmissions();
  }, [activeTab, token]);

  useEffect(() => {
    if (activeTab !== 'feedback' || !token) return;
    const loadFeedback = async () => {
      setFeedbackLoading(true);
      try {
        const data = await fetchAlumniFeedback(feedbackFilters, token);
        setEmployerFeedback(data.feedbacks || []);
      } catch (error) {
        console.error('Error loading feedback:', error);
        setStatus({ type: 'error', message: error.message });
        setEmployerFeedback([]);
      } finally {
        setFeedbackLoading(false);
      }
    };
    loadFeedback();
  }, [activeTab, token, feedbackFilters]);

  useEffect(() => {
    if (activeTab === 'employer-submissions' && token) {
      const loadEmployerSubmissions = async () => {
        setEmployerSubmissionsLoading(true);
        try {
          const [participations, postings, applications, feedback] = await Promise.all([
            fetchEmployerSubmissions('event-participation', token).catch(() => ({ participations: [] })),
            fetchEmployerSubmissions('job-postings', token).catch(() => ({ postings: [] })),
            fetchEmployerSubmissions('job-applications', token).catch(() => ({ applications: [] })),
            fetchAlumniFeedback({}, token, true).catch(() => ({ feedbacks: [] })), // includePending=true for admin review
          ]);
          setEmployerSubmissions({
            eventParticipations: participations.participations || [],
            jobPostings: postings.postings || [],
            jobApplications: applications.applications || [],
            alumniFeedback: feedback.feedbacks || [],
          });
        } catch (error) {
          console.error('Failed to load employer submissions', error);
          setEmployerSubmissions({
            eventParticipations: [],
            jobPostings: [],
            jobApplications: [],
            alumniFeedback: [],
          });
        } finally {
          setEmployerSubmissionsLoading(false);
        }
      };
      loadEmployerSubmissions();
    }

    // Load connect requests when tab is active
    if (activeTab === 'connect-requests' && token) {
      const loadConnectRequests = async () => {
        setConnectRequestsLoading(true);
        try {
          const data = await fetchConnectRequests(token);
          setConnectRequests(data.requests || []);
        } catch (error) {
          console.error('Failed to load connect requests', error);
          setConnectRequests([]);
        } finally {
          setConnectRequestsLoading(false);
        }
      };
      loadConnectRequests();
    }
  }, [activeTab, token]);

  const handleUpdateStatus = async (type, id, newStatus) => {
    try {
      await updateSubmissionStatus(type, id, newStatus, token);
      setStatus({ type: 'success', message: 'Status updated successfully.' });
      // Reload submissions
      const data = await fetchAlumniSubmissions('all', token);
      setSubmissions({
        eventApplications: data.eventApplications || [],
        successStories: data.successStories || [],
        engagementFeedback: data.engagementFeedback || [],
      });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  const handleDeleteSubmission = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteSubmission(type, id);
      setStatus({ type: 'success', message: 'Submission deleted successfully.' });
      // Reload submissions
      const data = await fetchAlumniSubmissions('all', token);
      setSubmissions({
        eventApplications: data.eventApplications || [],
        successStories: data.successStories || [],
        engagementFeedback: data.engagementFeedback || [],
      });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  const handleUpdateEmployerEventParticipation = async (id, status) => {
    try {
      await updateEmployerEventParticipation(id, status, token);
      setStatus({ type: 'success', message: 'Event participation status updated successfully.' });
      // Reload employer submissions
      const [participations, feedback] = await Promise.all([
        fetchEmployerSubmissions('event-participation', token).catch(() => ({ participations: [] })),
        fetchAlumniFeedback({}, token).catch(() => ({ feedbacks: [] })),
      ]);
      setEmployerSubmissions(prev => ({
        ...prev,
        eventParticipations: participations.participations || [],
        alumniFeedback: feedback.feedbacks || [],
      }));
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  const handleApproveAlumniFeedback = async (id, approved) => {
    try {
      await approveAlumniFeedback(id, approved, token);
      setStatus({ type: 'success', message: `Feedback ${approved ? 'approved' : 'rejected'} successfully.` });
      // Reload employer submissions
      const [participations, postings, applications, feedback] = await Promise.all([
        fetchEmployerSubmissions('event-participation', token).catch(() => ({ participations: [] })),
        fetchEmployerSubmissions('job-postings', token).catch(() => ({ postings: [] })),
        fetchEmployerSubmissions('job-applications', token).catch(() => ({ applications: [] })),
        fetchAlumniFeedback({}, token, true).catch(() => ({ feedbacks: [] })), // includePending=true for admin review
      ]);
      setEmployerSubmissions({
        eventParticipations: participations.participations || [],
        jobPostings: postings.postings || [],
        jobApplications: applications.applications || [],
        alumniFeedback: feedback.feedbacks || [],
      });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  const handleDeleteAlumniFeedback = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteAlumniFeedback(id, token);
      setStatus({ type: 'success', message: 'Feedback deleted successfully.' });
      // Reload employer submissions
      const [participations, postings, applications, feedback] = await Promise.all([
        fetchEmployerSubmissions('event-participation', token).catch(() => ({ participations: [] })),
        fetchEmployerSubmissions('job-postings', token).catch(() => ({ postings: [] })),
        fetchEmployerSubmissions('job-applications', token).catch(() => ({ applications: [] })),
        fetchAlumniFeedback({}, token, true).catch(() => ({ feedbacks: [] })), // includePending=true for admin review
      ]);
      setEmployerSubmissions({
        eventParticipations: participations.participations || [],
        jobPostings: postings.postings || [],
        jobApplications: applications.applications || [],
        alumniFeedback: feedback.feedbacks || [],
      });
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !token) return;
    
    try {
      setStatus({ type: 'loading', message: 'Saving changes...' });
      
      if (editingItem.type === 'connect-request') {
        await updateConnectRequest(editingItem.data.id, editFormData, token);
        const data = await fetchConnectRequests(token);
        setConnectRequests(data.requests || []);
        setStatus({ type: 'success', message: 'Request updated successfully.' });
      } else if (editingItem.type === 'alumni-submission') {
        await updateAlumniSubmission(editingItem.submissionType, editingItem.data.id || editingItem.data.application_id || editingItem.data.story_id || editingItem.data.fact_id, editFormData, token);
        const data = await fetchAlumniSubmissions('all', token);
        setSubmissions({
          eventApplications: data.eventApplications || [],
          successStories: data.successStories || [],
          engagementFeedback: data.engagementFeedback || [],
        });
        setStatus({ type: 'success', message: 'Submission updated successfully.' });
      } else if (editingItem.type === 'employer-feedback') {
        await updateEmployerFeedback(editingItem.data.feedback_id, editFormData, token);
        const data = await fetchAlumniFeedback(feedbackFilters, token);
        setEmployerFeedback(data.feedbacks || []);
        setStatus({ type: 'success', message: 'Feedback updated successfully.' });
      } else if (editingItem.type === 'employer-event-participation') {
        await updateEmployerEventParticipationFull(editingItem.data.id || editingItem.data.participation_id, editFormData, token);
        const [participations] = await Promise.all([
          fetchEmployerSubmissions('event-participation', token).catch(() => ({ participations: [] })),
        ]);
        setEmployerSubmissions(prev => ({
          ...prev,
          eventParticipations: participations.participations || [],
        }));
        setStatus({ type: 'success', message: 'Event participation updated successfully.' });
      }
      
      setEditingItem(null);
      setEditFormData({});
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    }
  };

  const activeTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId),
    [tables, selectedTableId],
  );

  const columns = tableMeta?.columns ?? [];
  const primaryKey = tableMeta?.primaryKey ?? '';

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((row) =>
      columns.some((column) => (row[column] ?? '').toLowerCase().includes(term)),
    );
  }, [rows, columns, searchTerm]);

  const resetFormState = () => {
    setFormMode(null);
    setFormValues({});
  };

  const handleOpenForm = (mode, row = null) => {
    setFormMode(mode);
    if (mode === 'edit' && row) {
      setFormValues(row);
    } else {
      const emptyRecord = columns.reduce((acc, column) => {
        acc[column] = '';
        return acc;
      }, {});
      setFormValues(emptyRecord);
    }
  };

  const handleFormChange = (column, value) => {
    setFormValues((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formMode || !tableMeta) return;
    if (!token) {
      setStatus({ type: 'error', message: 'Authentication token missing. Please sign in again.' });
      return;
    }

    const trimmedRecord = columns.reduce((acc, column) => {
      const value = formValues[column];
      acc[column] = value === undefined || value === null ? '' : value;
      return acc;
    }, {});

    const keyValue = trimmedRecord[primaryKey];
    if (!keyValue) {
      setStatus({
        type: 'error',
        message: `Field "${primaryKey}" is required.`,
      });
      return;
    }

    setStatus(initialStatus);
    setLoading(true);
    try {
      if (formMode === 'add') {
        await createRecord(selectedTableId, trimmedRecord, token);
        setStatus({ type: 'success', message: 'Record added successfully.' });
      } else if (formMode === 'edit') {
        await updateRecord(selectedTableId, keyValue, trimmedRecord, token);
        setStatus({ type: 'success', message: 'Record updated successfully.' });
      }
      const data = await fetchTableData(selectedTableId, token);
      setTableMeta(data);
      setRows(data.rows);
      resetFormState();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row) => {
    if (!tableMeta) return;
    if (!token) {
      setStatus({ type: 'error', message: 'Authentication token missing. Please sign in again.' });
      return;
    }
    const keyValue = row[primaryKey];
    const confirmed = window.confirm(
      `Are you sure you want to delete record with ${primaryKey}="${keyValue}"?`,
    );
    if (!confirmed) return;
    setLoading(true);
    setStatus(initialStatus);
    try {
      await deleteRecord(selectedTableId, keyValue, token);
      setStatus({ type: 'success', message: 'Record deleted successfully.' });
      setRows((prev) => prev.filter((item) => item[primaryKey] !== keyValue));
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleUploadSubmit = async (event) => {
    event.preventDefault();
    if (!selectedImageCategory) {
      setImageStatus({ type: 'error', message: 'Select an image category first.' });
      return;
    }
    if (!selectedFile) {
      setImageStatus({ type: 'error', message: 'Choose an image file to upload.' });
      return;
    }
    if (!token) {
      setImageStatus({ type: 'error', message: 'Authentication token missing. Please sign in again.' });
      return;
    }
    const form = event.target;
    setUploading(true);
    try {
      await uploadImage(selectedImageCategory, selectedFile, token);
      await loadImagesForCategory(selectedImageCategory);
      const categories = await fetchImageCategories(token);
      setImageCategories(categories);
      setSelectedImageCategory((current) => {
        if (current && categories.some((cat) => cat.id === current)) {
          return current;
        }
        return categories[0]?.id ?? '';
      });
      setImageStatus({ type: 'success', message: 'Image uploaded successfully.' });
      setSelectedFile(null);
      form.reset();
    } catch (error) {
      setImageStatus({ type: 'error', message: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (filename) => {
    if (!selectedImageCategory) return;
    const confirmed = window.confirm(`Delete "${filename}" from ${selectedImageCategory}?`);
    if (!confirmed) return;
    if (!token) {
      setImageStatus({ type: 'error', message: 'Authentication token missing. Please sign in again.' });
      return;
    }
    setImageStatus(initialStatus);
    try {
      await deleteImageFile(selectedImageCategory, filename, token);
      await loadImagesForCategory(selectedImageCategory);
      const categories = await fetchImageCategories(token);
      setImageCategories(categories);
      setSelectedImageCategory((current) => {
        if (current && categories.some((cat) => cat.id === current)) {
          return current;
        }
        return categories[0]?.id ?? '';
      });
      setImageStatus({ type: 'success', message: 'Image deleted successfully.' });
    } catch (error) {
      setImageStatus({ type: 'error', message: error.message });
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 text-sm">Authenticating session…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-sluGold font-semibold">
              Admin Console
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-sluBlue">
              Manage DataNexus Assets
            </h1>
            <p className="text-slate-600 max-w-3xl">
              Maintain the data tables and media library that power the dashboards. Updates made here
              are saved directly into the project files for immediate use across the experience.
            </p>
          </div>
          {activeTab === 'tables' && tables.length > 0 && (
            <div className="flex flex-col gap-2 w-full md:w-72">
              <label className="text-sm font-medium text-slate-600">Select a data table</label>
              <select
                value={selectedTableId}
                onChange={(event) => setSelectedTableId(event.target.value)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 focus:border-sluBlue focus:ring focus:ring-sluBlue/20 transition"
              >
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </header>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('tables')}
            className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'tables'
                ? 'bg-sluBlue text-white shadow'
                : 'bg-white text-sluBlue border border-sluBlue/40 hover:bg-sluBlue/10'
            }`}
          >
            Data Tables
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'images'
                ? 'bg-sluBlue text-white shadow'
                : 'bg-white text-sluBlue border border-sluBlue/40 hover:bg-sluBlue/10'
            }`}
          >
            Image Library
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('submissions')}
            className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'submissions'
                ? 'bg-sluBlue text-white shadow'
                : 'bg-white text-sluBlue border border-sluBlue/40 hover:bg-sluBlue/10'
            }`}
          >
            📋 Alumni Submissions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'feedback'
                ? 'bg-sluBlue text-white shadow'
                : 'bg-white text-sluBlue border border-sluBlue/40 hover:bg-sluBlue/10'
            }`}
          >
            💬 Employer Feedback
          </button>
            <button
              type="button"
              onClick={() => setActiveTab('employer-submissions')}
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'employer-submissions'
                  ? 'bg-sluBlue text-white shadow'
                  : 'bg-white text-sluBlue border border-sluBlue/40 hover:bg-sluBlue/10'
              }`}
            >
              🏢 Employer Submissions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('connect-requests')}
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'connect-requests'
                  ? 'bg-sluBlue text-white shadow'
                  : 'bg-white text-sluBlue border border-sluBlue/40 hover:bg-sluBlue/10'
              }`}
            >
              📧 Connect with SLU Requests
            </button>
        </div>

        {activeTab === 'tables' && activeTable && (
          <section className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">{activeTable.label}</h2>
                <p className="text-sm text-slate-500 max-w-3xl">
                  {tableMeta?.description || activeTable.description}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400">
                  Primary Key: {tableMeta?.primaryKey}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Quick search…"
                  className="w-full sm:w-64 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-sluBlue focus:ring focus:ring-sluBlue/20 transition"
                />
                <button
                  type="button"
                  onClick={() => handleOpenForm('add')}
                  className="inline-flex items-center justify-center rounded-lg bg-sluBlue text-white px-4 py-2 text-sm font-semibold shadow hover:bg-sluBlue/90 transition"
                >
                  + Add Record
                </button>
              </div>
            </div>

            {status.type && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  status.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {status.message}
              </div>
            )}

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column}
                        scope="col"
                        className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs text-slate-600"
                      >
                        {column}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right font-semibold uppercase tracking-wide text-xs text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {loading && rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length + 1}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        Loading data…
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length + 1}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr key={row[primaryKey] ?? Math.random()}>
                        {columns.map((column) => (
                          <td key={`${row[primaryKey]}-${column}`} className="px-4 py-3 text-slate-700">
                            <span className="whitespace-pre-wrap break-words">
                              {row[column] ?? ''}
                            </span>
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right text-sm">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenForm('edit', row)}
                              className="text-sluBlue hover:text-sluBlue/80 font-semibold"
                            >
                              Edit
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(row)}
                              className="text-red-500 hover:text-red-400 font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'images' && (
          <section className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-800">Image Library</h2>
                <p className="text-sm text-slate-500 max-w-3xl">
                  Organize hero banners, alumni spotlights, employer imagery, and custom uploads.
                  Assets stored here are available immediately for dashboards and pages.
                </p>
              </div>
              {imageCategories.length > 0 && (
                <div className="flex flex-col gap-2 w-full md:w-72">
                  <label className="text-sm font-medium text-slate-600">Image category</label>
                  <select
                    value={selectedImageCategory}
                    onChange={(event) => setSelectedImageCategory(event.target.value)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 focus:border-sluBlue focus:ring focus:ring-sluBlue/20 transition"
                  >
                    {imageCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label} ({category.count})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <form
              onSubmit={handleUploadSubmit}
              className="flex flex-col md:flex-row md:items-center gap-4 border border-slate-200 rounded-xl px-4 py-4 bg-slate-50"
            >
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-600 mb-1 block">
                  Upload new image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-sluBlue hover:file:bg-sluBlue/10"
                />
                <p className="mt-2 text-xs text-slate-400">
                  Supported formats: JPG, PNG, WebP. Max file size 10 MB.
                </p>
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center justify-center rounded-lg bg-sluBlue text-white px-5 py-2 text-sm font-semibold shadow hover:bg-sluBlue/90 transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? 'Uploading…' : 'Upload Image'}
              </button>
            </form>

            {imageStatus.type && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  imageStatus.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {imageStatus.message}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">
                  {imageCategories.find((cat) => cat.id === selectedImageCategory)?.label ??
                    'Images'}
                </h3>
                {selectedImageCategory && (
                  <span className="text-sm text-slate-500">
                    {imageItems.length} file{imageItems.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>

              {imageLoading ? (
                <div className="py-12 text-center text-slate-500">Loading images…</div>
              ) : imageItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 border border-dashed border-slate-300 rounded-xl">
                  No images in this category yet. Upload a new asset to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {imageItems.map((image) => (
                    <article
                      key={image.filename}
                      className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition"
                    >
                      <div className="aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
                        <img
                          src={image.url}
                          alt={image.filename}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4 space-y-2 text-sm text-slate-600">
                        <p className="font-semibold text-slate-800 break-words">{image.filename}</p>
                        <p className="text-xs text-slate-400">
                          {(image.size / 1024).toFixed(1)} KB · Updated{' '}
                          {new Date(image.updatedAt).toLocaleString()}
                        </p>
                        <div className="flex justify-between items-center">
                          <a
                            href={image.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sluBlue hover:text-sluBlue/80 font-semibold"
                          >
                            View
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(image.filename)}
                            className="text-red-500 hover:text-red-400 font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'submissions' && (
          <section className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Alumni Submissions</h2>
                <p className="text-sm text-slate-500 max-w-3xl">
                  Review and manage event applications, engagement participation, and success stories submitted by alumni.
                </p>
              </div>
              <div className="flex gap-3">
                <select
                  value={selectedSubmissionType}
                  onChange={(e) => setSelectedSubmissionType(e.target.value)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 focus:border-sluBlue focus:ring focus:ring-sluBlue/20 transition"
                >
                  <option value="event-applications">Event Applications</option>
                  <option value="success-stories">Success Stories</option>
                  <option value="engagement-feedback">Engagement Feedback</option>
                </select>
              </div>
            </div>

            {status.type && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  status.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {status.message}
              </div>
            )}

            {submissionsLoading ? (
              <div className="text-center py-12 text-slate-500">Loading submissions...</div>
            ) : (
              <div className="space-y-4">
                {selectedSubmissionType === 'event-applications' && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">
                      Event Applications ({submissions.eventApplications.length})
                    </h3>
                    {submissions.eventApplications.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No event applications submitted yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {submissions.eventApplications.map((app) => (
                          <div key={app.application_id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-semibold text-slate-800">{app.full_name}</h4>
                                <p className="text-sm text-slate-600">{app.email}</p>
                                {app.phone && <p className="text-sm text-slate-600">Phone: {app.phone}</p>}
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  app.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : app.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {app.status || 'pending'}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                              <p><strong>Event ID:</strong> {app.event_key}</p>
                              {app.program && <p><strong>Program:</strong> {app.program}</p>}
                              {app.graduation_year && <p><strong>Graduation Year:</strong> {app.graduation_year}</p>}
                              <p><strong>Submitted:</strong> {new Date(app.submitted_at).toLocaleString()}</p>
                            </div>
                            {app.interest_reason && (
                              <div className="mb-3">
                                <p className="text-sm font-semibold text-slate-700 mb-1">Interest Reason:</p>
                                <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">{app.interest_reason}</p>
                              </div>
                            )}
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => {
                                  setEditingItem({ type: 'alumni-submission', submissionType: 'event-applications', data: app });
                                  setEditFormData({ ...app });
                                }}
                                className="px-3 py-1 bg-sluBlue text-white rounded text-sm hover:bg-blue-800 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleUpdateStatus('event-applications', app.application_id, 'approved')}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus('event-applications', app.application_id, 'rejected')}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleDeleteSubmission('event-applications', app.application_id)}
                                className="px-3 py-1 bg-slate-600 text-white rounded text-sm hover:bg-slate-700 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedSubmissionType === 'success-stories' && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">
                      Success Stories ({submissions.successStories.length})
                    </h3>
                    {submissions.successStories.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No success stories submitted yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {submissions.successStories.map((story) => (
                          <div key={story.story_id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-semibold text-slate-800 text-lg">{story.story_title}</h4>
                                <p className="text-sm text-slate-600">{story.full_name}</p>
                                {story.current_role && story.employer_name && (
                                  <p className="text-sm text-slate-600">
                                    {story.current_role} at {story.employer_name}
                                  </p>
                                )}
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  story.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : story.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {story.status || 'pending'}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                              {story.program && <p><strong>Program:</strong> {story.program}</p>}
                              {story.graduation_year && <p><strong>Graduation Year:</strong> {story.graduation_year}</p>}
                              <p><strong>Submitted:</strong> {new Date(story.submitted_at).toLocaleString()}</p>
                            </div>
                            <div className="mb-3">
                              <p className="text-sm font-semibold text-slate-700 mb-1">Story:</p>
                              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded whitespace-pre-wrap">{story.story_content}</p>
                            </div>
                            {story.achievements && (
                              <div className="mb-3">
                                <p className="text-sm font-semibold text-slate-700 mb-1">Achievements:</p>
                                <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">{story.achievements}</p>
                              </div>
                            )}
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => {
                                  setEditingItem({ type: 'alumni-submission', submissionType: 'success-stories', data: story });
                                  setEditFormData({ ...story });
                                }}
                                className="px-3 py-1 bg-sluBlue text-white rounded text-sm hover:bg-blue-800 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleUpdateStatus('success-stories', story.story_id, 'approved')}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus('success-stories', story.story_id, 'rejected')}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleDeleteSubmission('success-stories', story.story_id)}
                                className="px-3 py-1 bg-slate-600 text-white rounded text-sm hover:bg-slate-700 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedSubmissionType === 'engagement-feedback' && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">
                      Engagement Feedback ({submissions.engagementFeedback.length})
                    </h3>
                    {submissions.engagementFeedback.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No engagement feedback submitted yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {submissions.engagementFeedback.map((feedback) => (
                          <div key={feedback.fact_id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                            <div className="mb-3">
                              <h4 className="font-semibold text-slate-800">Engagement Type: {feedback.engagement_type}</h4>
                              <p className="text-sm text-slate-600">Fact ID: {feedback.fact_id}</p>
                              <p className="text-sm text-slate-600">Submitted: {new Date(feedback.submitted_at).toLocaleString()}</p>
                            </div>
                            {feedback.feedback_notes && (
                              <div className="mb-3">
                                <p className="text-sm font-semibold text-slate-700 mb-1">Feedback Notes:</p>
                                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded whitespace-pre-wrap">{feedback.feedback_notes}</p>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingItem({ type: 'alumni-submission', submissionType: 'engagement-feedback', data: feedback });
                                  setEditFormData({ ...feedback });
                                }}
                                className="px-3 py-1 bg-sluBlue text-white rounded text-sm hover:bg-blue-800 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSubmission('engagement-feedback', feedback.fact_id || feedback.feedback_id)}
                                className="px-3 py-1 bg-slate-600 text-white rounded text-sm hover:bg-slate-700 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === 'feedback' && (
          <section className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Employer Alumni Feedback</h2>
                <p className="text-sm text-slate-500 max-w-3xl">
                  View and filter feedback from employers about SLU alumni technical strengths and areas for improvement.
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Year</label>
                  <select
                    value={feedbackFilters.graduation_year}
                    onChange={(e) => setFeedbackFilters({ ...feedbackFilters, graduation_year: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue"
                  >
                    <option value="">All Years</option>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Technologies</label>
                  <input
                    type="text"
                    value={feedbackFilters.technologies}
                    onChange={(e) => setFeedbackFilters({ ...feedbackFilters, technologies: e.target.value })}
                    placeholder="e.g., Java, React"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Role</label>
                  <input
                    type="text"
                    value={feedbackFilters.job_role}
                    onChange={(e) => setFeedbackFilters({ ...feedbackFilters, job_role: e.target.value })}
                    placeholder="e.g., Data Analyst"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tech Strength</label>
                  <select
                    value={feedbackFilters.tech_strength_level}
                    onChange={(e) => setFeedbackFilters({ ...feedbackFilters, tech_strength_level: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sluBlue focus:border-sluBlue"
                  >
                    <option value="">All Levels</option>
                    <option value="Strong">Strong</option>
                    <option value="Average">Average</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                  </select>
                </div>
              </div>
              {(feedbackFilters.graduation_year || feedbackFilters.technologies || feedbackFilters.job_role || feedbackFilters.tech_strength_level) && (
                <button
                  onClick={() => setFeedbackFilters({ graduation_year: '', technologies: '', job_role: '', tech_strength_level: '' })}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {status.type && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  status.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {status.message}
              </div>
            )}

            {feedbackLoading ? (
              <div className="text-center py-12 text-slate-500">Loading feedback...</div>
            ) : (
              <div className="overflow-x-auto">
                {employerFeedback.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500 mb-4">No feedback found matching the filters.</p>
                    {(feedbackFilters.graduation_year || feedbackFilters.technologies || feedbackFilters.job_role || feedbackFilters.tech_strength_level) && (
                      <button
                        onClick={() => setFeedbackFilters({ graduation_year: '', technologies: '', job_role: '', tech_strength_level: '' })}
                        className="px-4 py-2 text-sm font-semibold text-white bg-sluBlue rounded-lg hover:bg-blue-800 transition"
                      >
                        Clear All Filters to Show All Feedback
                      </button>
                    )}
                  </div>
                ) : (
                  <table className="w-full border border-slate-200 rounded-lg">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Employer</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Graduation Year</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Job Role</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Technologies</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Tech Strength</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Rating</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Feedback</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {employerFeedback.map((feedback) => (
                        <tr key={feedback.feedback_id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-800 font-medium">{feedback.employer_name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{feedback.graduation_year}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{feedback.job_role}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{feedback.technologies || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
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
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold text-slate-700">
                              {feedback.rating_overall}/5
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 max-w-xs">
                            <p className="truncate" title={feedback.comment_overall}>
                              {feedback.comment_overall || 'N/A'}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === 'employer-submissions' && (
          <section className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Employer Submissions</h2>
                <p className="text-sm text-slate-500 max-w-3xl">
                  Review and manage event participation requests, job postings, and other submissions from employers.
                </p>
              </div>
              <div className="flex gap-3">
                <select
                  value={selectedEmployerSubmissionType}
                  onChange={(e) => setSelectedEmployerSubmissionType(e.target.value)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 focus:border-sluBlue focus:ring focus:ring-sluBlue/20 transition"
                >
                  <option value="event-participation">Event Participation Requests</option>
                  <option value="alumni-feedback">Alumni Technical Feedback</option>
                </select>
              </div>
            </div>

            {status.type && (
              <div
                className={`rounded-lg px-4 py-3 text-sm ${
                  status.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {status.message}
              </div>
            )}

            {employerSubmissionsLoading ? (
              <div className="text-center py-12 text-slate-500">Loading employer submissions...</div>
            ) : (
              <div className="space-y-4">
                {selectedEmployerSubmissionType === 'event-participation' && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">
                      Event Participation Requests ({employerSubmissions.eventParticipations.length})
                    </h3>
                    {employerSubmissions.eventParticipations.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No event participation requests submitted yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {employerSubmissions.eventParticipations.map((participation) => {
                          const participationId = participation.id || participation.participation_id;
                          return (
                            <div key={participationId || `participation-${participation.event_key}-${participation.employer_key}`} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-slate-800 text-lg">{participation.event_name || `Event ${participation.event_key}`}</h4>
                                  <p className="text-sm text-slate-600">Employer: {participation.employer_name || 'Unknown'}</p>
                                  <p className="text-sm text-slate-600">Event ID: {participation.event_key}</p>
                                  {participation.event_date && (
                                    <p className="text-sm text-slate-600">Event Date: {new Date(participation.event_date).toLocaleDateString()}</p>
                                  )}
                                  {participation.requested_at && (
                                    <p className="text-sm text-slate-500 mt-2">
                                      Requested: {new Date(participation.requested_at).toLocaleString()}
                                    </p>
                                  )}
                                  {participation.notes && (
                                    <div className="mt-2">
                                      <p className="text-sm font-semibold text-slate-700 mb-1">Notes:</p>
                                      <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">{participation.notes}</p>
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
                              {participationId && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdateEmployerEventParticipation(participationId, 'Approved')}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleUpdateEmployerEventParticipation(participationId, 'Rejected')}
                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                                  >
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => handleUpdateEmployerEventParticipation(participationId, 'Completed')}
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                                  >
                                    Mark Completed
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {selectedEmployerSubmissionType === 'alumni-feedback' && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">
                      Alumni Technical Feedback ({employerSubmissions.alumniFeedback.length})
                    </h3>
                    {employerSubmissions.alumniFeedback.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No alumni feedback submitted yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {employerSubmissions.alumniFeedback.map((feedback) => (
                          <div key={feedback.feedback_id} className={`border-2 rounded-lg p-4 hover:shadow-md transition ${
                            feedback.approved_by_admin === '0' 
                              ? 'border-yellow-300 bg-yellow-50/30' 
                              : 'border-slate-200 bg-white'
                          }`}>
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-bold text-slate-900 text-lg">
                                    {feedback.employer_name || 'Unknown Employer'}
                                  </h4>
                                  {feedback.approved_by_admin === '0' && (
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                                      Pending Approval
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-600 mb-2">
                                  <p><span className="font-semibold">Rating:</span> {feedback.rating_overall}/5</p>
                                  <p><span className="font-semibold">Graduation Year:</span> {feedback.graduation_year}</p>
                                  <p><span className="font-semibold">Job Role:</span> {feedback.job_role}</p>
                                  <p><span className="font-semibold">Tech Strength:</span> {feedback.tech_strength_level}</p>
                                </div>
                                {feedback.technologies && (
                                  <p className="text-sm text-slate-600 mb-2">
                                    <span className="font-semibold">Technologies:</span> {feedback.technologies}
                                  </p>
                                )}
                                {feedback.comment_overall && (
                                  <div className="mt-2 p-3 bg-slate-50 rounded">
                                    <p className="text-sm font-semibold text-slate-700 mb-1">Feedback Comment:</p>
                                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{feedback.comment_overall}</p>
                                  </div>
                                )}
                                <p className="text-sm text-slate-500 mt-2">
                                  Submitted: {new Date(feedback.created_at).toLocaleString()}
                                </p>
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
                            <div className="flex gap-2 mt-3">
                              {feedback.approved_by_admin === '0' && (
                                <>
                                  <button
                                    onClick={() => handleApproveAlumniFeedback(feedback.feedback_id, true)}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleApproveAlumniFeedback(feedback.feedback_id, false)}
                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteAlumniFeedback(feedback.feedback_id)}
                                className="px-3 py-1 bg-slate-600 text-white rounded text-sm hover:bg-slate-700 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </section>
        )}

        {formMode && activeTab === 'tables' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[85vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {formMode === 'add' ? 'Add New Record' : 'Edit Record'}
                  </h3>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    {activeTable?.label}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetFormState}
                  className="text-slate-500 hover:text-slate-700 text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 max-h-[70vh] space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {columns.map((column) => (
                    <div key={column} className="flex flex-col gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {column}
                      </label>
                      <textarea
                        value={formValues[column] ?? ''}
                        onChange={(event) => handleFormChange(column, event.target.value)}
                        disabled={formMode === 'edit' && column === primaryKey}
                        className="min-h-[44px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sluBlue focus:ring focus:ring-sluBlue/20 transition"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={resetFormState}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-lg bg-sluBlue text-white px-5 py-2 text-sm font-semibold shadow hover:bg-sluBlue/90 transition"
                  >
                    {formMode === 'add' ? 'Add Record' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Connect with SLU Requests Tab */}
        {activeTab === 'connect-requests' && (
          <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Connect with SLU Requests</h2>
            
            {connectRequestsLoading ? (
              <div className="text-center py-8">
                <p className="text-slate-500">Loading requests...</p>
              </div>
            ) : connectRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No connect requests found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {connectRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                          {request.submittedAt ? new Date(request.submittedAt).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                          {request.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                          <a href={`mailto:${request.email}`} className="text-sluBlue hover:underline">
                            {request.email || 'N/A'}
                          </a>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {request.role || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                          {request.organization || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                          {request.subject || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 max-w-xs">
                          <div className="truncate" title={request.message}>
                            {request.message || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingItem({ type: 'connect-request', data: request });
                                setEditFormData({ ...request });
                              }}
                              className="text-sluBlue hover:text-sluBlue/80 font-semibold"
                            >
                              Edit
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              onClick={async () => {
                                if (!window.confirm('Are you sure you want to delete this request?')) return;
                                try {
                                  await deleteConnectRequest(request.id, token);
                                  setStatus({ type: 'success', message: 'Request deleted successfully.' });
                                  const data = await fetchConnectRequests(token);
                                  setConnectRequests(data.requests || []);
                                } catch (error) {
                                  setStatus({ type: 'error', message: error.message });
                                }
                              }}
                              className="text-red-500 hover:text-red-400 font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Universal Edit Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[85vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Edit {editingItem.type === 'connect-request' ? 'Connect Request' : editingItem.type === 'alumni-submission' ? 'Alumni Submission' : editingItem.type === 'employer-feedback' ? 'Employer Feedback' : 'Event Participation'}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setEditFormData({});
                  }}
                  className="text-slate-500 hover:text-slate-700 text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="overflow-y-auto px-6 py-5 max-h-[70vh] space-y-5">
                {editingItem.type === 'connect-request' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Name</label><input type="text" value={editFormData.name || ''} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Email</label><input type="email" value={editFormData.email || ''} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Role</label><input type="text" value={editFormData.role || ''} onChange={(e) => setEditFormData({...editFormData, role: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Organization</label><input type="text" value={editFormData.organization || ''} onChange={(e) => setEditFormData({...editFormData, organization: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label><input type="text" value={editFormData.subject || ''} onChange={(e) => setEditFormData({...editFormData, subject: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Message</label><textarea value={editFormData.message || ''} onChange={(e) => setEditFormData({...editFormData, message: e.target.value})} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                    </div>
                  </>
                )}
                {editingItem.type === 'alumni-submission' && editingItem.submissionType === 'event-applications' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label><input type="text" value={editFormData.full_name || ''} onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Email</label><input type="email" value={editFormData.email || ''} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label><input type="text" value={editFormData.phone || ''} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Program</label><input type="text" value={editFormData.program || ''} onChange={(e) => setEditFormData({...editFormData, program: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Year</label><input type="text" value={editFormData.graduation_year || ''} onChange={(e) => setEditFormData({...editFormData, graduation_year: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Status</label><select value={editFormData.status || 'pending'} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg"><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
                      <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Interest Reason</label><textarea value={editFormData.interest_reason || ''} onChange={(e) => setEditFormData({...editFormData, interest_reason: e.target.value})} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                    </div>
                  </>
                )}
                {editingItem.type === 'alumni-submission' && editingItem.submissionType === 'success-stories' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label><input type="text" value={editFormData.full_name || ''} onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Program</label><input type="text" value={editFormData.program || ''} onChange={(e) => setEditFormData({...editFormData, program: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Year</label><input type="text" value={editFormData.graduation_year || ''} onChange={(e) => setEditFormData({...editFormData, graduation_year: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Current Role</label><input type="text" value={editFormData.current_role || ''} onChange={(e) => setEditFormData({...editFormData, current_role: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Employer Name</label><input type="text" value={editFormData.employer_name || ''} onChange={(e) => setEditFormData({...editFormData, employer_name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Status</label><select value={editFormData.status || 'pending'} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg"><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
                      <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Story Title</label><input type="text" value={editFormData.story_title || ''} onChange={(e) => setEditFormData({...editFormData, story_title: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Story Content</label><textarea value={editFormData.story_content || ''} onChange={(e) => setEditFormData({...editFormData, story_content: e.target.value})} rows={5} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Achievements</label><textarea value={editFormData.achievements || ''} onChange={(e) => setEditFormData({...editFormData, achievements: e.target.value})} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                    </div>
                  </>
                )}
                {editingItem.type === 'alumni-submission' && editingItem.submissionType === 'engagement-feedback' && (
                  <>
                    <div className="grid grid-cols-1 gap-4">
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Feedback Notes</label><textarea value={editFormData.feedback_notes || ''} onChange={(e) => setEditFormData({...editFormData, feedback_notes: e.target.value})} rows={6} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                    </div>
                  </>
                )}
                {editingItem.type === 'employer-feedback' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Rating (1-5)</label><input type="number" min="1" max="5" value={editFormData.rating_overall || ''} onChange={(e) => setEditFormData({...editFormData, rating_overall: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Tech Strength Level</label><select value={editFormData.tech_strength_level || ''} onChange={(e) => setEditFormData({...editFormData, tech_strength_level: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg"><option value="">Select</option><option value="Strong">Strong</option><option value="Average">Average</option><option value="Needs Improvement">Needs Improvement</option></select></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Job Role</label><input type="text" value={editFormData.job_role || ''} onChange={(e) => setEditFormData({...editFormData, job_role: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Year</label><input type="text" value={editFormData.graduation_year || ''} onChange={(e) => setEditFormData({...editFormData, graduation_year: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Technologies</label><input type="text" value={editFormData.technologies || ''} onChange={(e) => setEditFormData({...editFormData, technologies: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="e.g., Java, React, Python" /></div>
                      <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Comment</label><textarea value={editFormData.comment_overall || ''} onChange={(e) => setEditFormData({...editFormData, comment_overall: e.target.value})} rows={5} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Approved</label><select value={editFormData.approved_by_admin || '0'} onChange={(e) => setEditFormData({...editFormData, approved_by_admin: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg"><option value="0">Pending</option><option value="1">Approved</option></select></div>
                    </div>
                  </>
                )}
                {editingItem.type === 'employer-event-participation' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Event Key</label><input type="text" value={editFormData.event_key || ''} onChange={(e) => setEditFormData({...editFormData, event_key: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Employer Key</label><input type="text" value={editFormData.employer_key || ''} onChange={(e) => setEditFormData({...editFormData, employer_key: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                      <div><label className="block text-xs font-semibold text-slate-700 mb-1">Status</label><select value={editFormData.participation_status || 'Requested'} onChange={(e) => setEditFormData({...editFormData, participation_status: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg"><option value="Requested">Requested</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option><option value="Completed">Completed</option></select></div>
                      <div className="md:col-span-2"><label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label><textarea value={editFormData.notes || ''} onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg" /></div>
                    </div>
                  </>
                )}
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setEditFormData({});
                    }}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-lg bg-sluBlue text-white px-5 py-2 text-sm font-semibold shadow hover:bg-sluBlue/90 transition"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Footer Section */}
        <ReadyToExploreFooter />
      </div>
    </div>
  );
};

export default Admin;

