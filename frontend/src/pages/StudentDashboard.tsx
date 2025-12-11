import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

interface Job {
    _id: string;
    title: string;
    description: string;
    location: string;
    skills: string[];
    company: {
        name: string;
        website?: string;
        description?: string;
    };
    matchScore: number;
    createdAt: string;
}

interface Application {
    _id: string;
    job: {
        title: string;
        company: { name: string };
    };
    status: string;
    appliedAt: string;
    aiScore: {
        fitScore: number;
    };
}

export default function StudentDashboard() {
    const { getToken } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [showApplicationForm, setShowApplicationForm] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(false);

    // Application form data
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        email: '',
        phone: '',
        resume: null as File | null,
        acceptTerms: false
    });

    const getHeaders = useCallback(async () => {
        const token = await getToken();
        return { Authorization: `Bearer ${token}` };
    }, [getToken]);

    const fetchJobs = useCallback(async () => {
        try {
            const headers = await getHeaders();
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/student/jobs`, { headers });
            setJobs(res.data || []);
        } catch (e) {
            console.error('Error fetching jobs:', e);
        }
    }, [getHeaders]);

    const fetchApplications = useCallback(async () => {
        try {
            const headers = await getHeaders();
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/student/applications`, { headers });
            setApplications(res.data || []);
        } catch (e) {
            console.error('Error fetching applications:', e);
        }
    }, [getHeaders]);

    useEffect(() => {
        fetchJobs();
        fetchApplications();
    }, [fetchJobs, fetchApplications]);

    const openApplicationForm = (job: Job) => {
        setSelectedJob(job);
        setShowApplicationForm(true);
        // Reset form
        setFormData({
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            email: '',
            phone: '',
            resume: null,
            acceptTerms: false
        });
    };

    const closeApplicationForm = () => {
        setShowApplicationForm(false);
        setSelectedJob(null);
    };

    const handleSubmitApplication = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.dateOfBirth) {
            alert('Please fill in all required fields');
            return;
        }

        if (!formData.resume) {
            alert('Please upload your resume');
            return;
        }

        if (formData.resume.size < 30 * 1024 || formData.resume.size > 50 * 1024) {
            alert(`Resume size must be between 30KB and 50KB.\\nCurrent size: ${(formData.resume.size / 1024).toFixed(2)}KB`);
            return;
        }

        if (!formData.acceptTerms) {
            alert('Please accept the terms and conditions');
            return;
        }

        try {
            setLoading(true);
            const token = await getToken();

            // First upload resume
            const resumeFormData = new FormData();
            resumeFormData.append('resume', formData.resume);
            resumeFormData.append('jobId', selectedJob!._id);

            await axios.post(`${import.meta.env.VITE_API_URL}/api/student/upload-resume`, resumeFormData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });

            // Then submit application with personal details
            const headers = await getHeaders();
            const applicationData = {
                jobId: selectedJob!._id,
                personalInfo: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    dateOfBirth: formData.dateOfBirth,
                    email: formData.email,
                    phone: formData.phone
                }
            };

            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/student/apply`, applicationData, { headers });

            alert(res.data.message || 'Application submitted successfully!');
            closeApplicationForm();
            await fetchApplications(); // Refresh application history
            await fetchJobs(); // Refresh jobs list
        } catch (error) {
            console.error('Application Error:', error);
            alert('Application Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const calculateAge = (dob: string) => {
        if (!dob) return '';
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-8">
                <h1 className="text-4xl font-bold mb-8 text-gray-900">Student Dashboard</h1>

                {/* Application History Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        My Applications ({applications.length})
                    </h2>

                    {applications.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>You haven't applied to any jobs yet. Browse available positions below!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {applications.map((app) => (
                                <div key={app._id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{app.job?.title || 'Job Position'}</h3>
                                        <p className="text-sm text-gray-600">{app.job?.company?.name || 'Company'}</p>
                                        <p className="text-xs text-gray-400 mt-1">Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${app.status === 'Shortlisted' ? 'bg-green-100 text-green-700' :
                                                app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                    app.status === 'Round1' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {app.status}
                                        </span>
                                        {app.aiScore?.fitScore > 0 && (
                                            <p className="text-sm text-gray-500 mt-1">Match: {app.aiScore.fitScore}%</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Available Jobs Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Available Jobs ({jobs.length})
                    </h2>

                    {jobs.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <h3 className="text-xl font-bold text-gray-700 mb-2">No Jobs Available</h3>
                            <p className="text-gray-500">Check back later for new opportunities!</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {jobs.map((job) => (
                                <div key={job._id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-green-400 hover:shadow-lg transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-1">{job.title}</h3>
                                            <div className="flex items-center gap-4 text-gray-600 mb-2">
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                    {job.company?.name || 'Company'}
                                                </span>
                                                {job.location && (
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        {job.location}
                                                    </span>
                                                )}
                                            </div>
                                            {job.company?.description && (
                                                <p className="text-sm text-gray-500 italic mb-3">{job.company.description}</p>
                                            )}
                                        </div>
                                        <div className="text-center ml-4">
                                            <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center">
                                                <div>
                                                    <div className="text-3xl font-bold text-green-700">{job.matchScore}</div>
                                                    <div className="text-xs text-green-600">% Match</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="font-bold text-gray-700 mb-2">Job Description:</h4>
                                        <p className="text-gray-700 leading-relaxed">{job.description}</p>
                                    </div>

                                    {job.skills && job.skills.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="font-bold text-gray-700 mb-2">Required Skills:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {job.skills.map((skill, i) => (
                                                    <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-4 border-t">
                                        <span className="text-sm text-gray-500">
                                            Posted: {new Date(job.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                        <button
                                            onClick={() => openApplicationForm(job)}
                                            className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition shadow-md hover:shadow-lg"
                                        >
                                            Apply Now →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Application Form Modal */}
            {showApplicationForm && selectedJob && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-2xl">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">Apply for {selectedJob.title}</h2>
                                    <p className="text-green-100">{selectedJob.company.name}</p>
                                </div>
                                <button
                                    onClick={closeApplicationForm}
                                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitApplication} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">First Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Last Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Date of Birth *</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.dateOfBirth}
                                    onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                />
                                {formData.dateOfBirth && (
                                    <p className="text-sm text-gray-600 mt-1">Age: {calculateAge(formData.dateOfBirth)} years</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                    placeholder="john.doe@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200"
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Upload Resume (PDF, 30-50KB) *</label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    required
                                    onChange={e => setFormData({ ...formData, resume: e.target.files?.[0] || null })}
                                    className="w-full border-2 border-gray-300 p-3 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 file:font-semibold hover:file:bg-green-100"
                                />
                                {formData.resume && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        Selected: {formData.resume.name} ({(formData.resume.size / 1024).toFixed(2)}KB)
                                    </p>
                                )}
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        required
                                        checked={formData.acceptTerms}
                                        onChange={e => setFormData({ ...formData, acceptTerms: e.target.checked })}
                                        className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    />
                                    <span className="text-sm text-gray-700">
                                        I accept the terms and conditions and confirm that all information provided is accurate. I understand that providing false information may result in disqualification. *
                                    </span>
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeApplicationForm}
                                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-300 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
