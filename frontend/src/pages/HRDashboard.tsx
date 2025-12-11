import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

interface Company {
    name: string;
    address: string;
    website: string;
    contactPerson: string;
    size: string;
    description: string;
}

interface Job {
    title: string;
    description: string;
    skills: string;
    tests: string;
    location: string;
}

interface Candidate {
    applicationId?: string;
    name?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    jobLocation?: string;
    skills?: string[];
    matchScore?: number;
    status?: string;
    appliedAt?: string;
    resume?: string;
    _id?: string;
}

interface JobHistory {
    _id: string;
    title: string;
    description: string;
    location: string;
    status: string;
    company: string;
    skills: string[];
    createdAt: string;
    stats: {
        totalApplications: number;
        pending: number;
        rejected: number;
        shortlisted: number;
        round1: number;
    };
}

export default function HRDashboard() {
    const { getToken } = useAuth();
    const API_URL = useMemo(() => {
        const base = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '').replace(/\/api$/, '');
        return `${base}/api`;
    }, []);
    const [tab, setTab] = useState<'company' | 'job' | 'view' | 'history'>('job');
    const [company, setCompany] = useState<Company>({
        name: '',
        address: '',
        website: '',
        contactPerson: '',
        size: '',
        description: ''
    });
    const [job, setJob] = useState<Job>({
        title: '',
        description: '',
        skills: '',
        tests: 'Aptitude,Coding',
        location: ''
    });
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [jobHistory, setJobHistory] = useState<JobHistory[]>([]);
    const [loading, setLoading] = useState(false);

    const getHeaders = useCallback(async () => {
        const token = await getToken();
        return { Authorization: `Bearer ${token}` };
    }, [getToken]);

    const loadCompanyData = useCallback(async () => {
        try {
            const headers = await getHeaders();
            const res = await axios.get(`${API_URL}/hr/company`, { headers });
            if (res.data) {
                setCompany({
                    name: res.data.name || '',
                    address: res.data.address || '',
                    website: res.data.website || '',
                    contactPerson: res.data.contactPerson || '',
                    size: res.data.size || '',
                    description: res.data.description || ''
                });
            }
        } catch {
            // No company yet - that's fine
            console.log('No company profile found yet');
        }
    }, [getHeaders]);

    // Load existing company data on mount
    useEffect(() => {
        loadCompanyData();
    }, [loadCompanyData]);

    const handleCompanySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const headers = await getHeaders();
            const res = await axios.post(`${API_URL}/hr/company`, company, { headers });
            alert(res.data.message || 'Company Saved Successfully!');
            await loadCompanyData(); // Reload to get updated data
        } catch (error) {
            console.error("Error saving company:", error);
            alert('Error saving company: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleJobSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const headers = await getHeaders();
            const jobData = {
                title: job.title,
                description: job.description,
                requiredSkills: job.skills.split(',').map(skill => skill.trim()),
                location: job.location
            };
            const res = await axios.post(`${API_URL}/hr/job`, jobData, { headers });
            alert(res.data.message || 'Job Posted Successfully!');
            
            // Reset form
            setJob({
                title: '',
                description: '',
                skills: '',
                tests: 'Aptitude,Coding',
                location: ''
            });
            
            // Switch to candidates view to see applications
            setTab('view');
            await fetchCandidates();
        } catch (error) {
            console.error('Error posting job:', error);
            alert('Error posting job: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const fetchCandidates = async () => {
        try {
            const headers = await getHeaders();
            const res = await axios.get(`${API_URL}/hr/candidates`, { headers });
            setCandidates(res.data || []);
        } catch (error) {
            console.error('Error fetching candidates:', error);
        }
    };

    const fetchJobHistory = async () => {
        try {
            const headers = await getHeaders();
            const res = await axios.get(`${API_URL}/hr/job-history`, { headers });
            setJobHistory(res.data || []);
        } catch (error) {
            console.error('Error fetching job history:', error);
        }
    };

    const handleDeleteApplication = async (applicationId: string) => {
        if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            const headers = await getHeaders();
            await axios.delete(`${API_URL}/hr/application/${applicationId}`, { headers });
            alert('Application deleted successfully');
            fetchCandidates(); // Refresh candidates list
        } catch (error: any) {
            console.error('Error deleting application:', error);
            alert(error.response?.data?.message || 'Failed to delete application');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignTest = async (applicationId: string, matchScore: number) => {
        if (matchScore < 60) {
            alert(`Cannot assign test. Match score is ${matchScore}%. Minimum 60% required.`);
            return;
        }

        if (!confirm(`Assign test to this candidate? (Match Score: ${matchScore}%)`)) {
            return;
        }

        setLoading(true);
        try {
            const headers = await getHeaders();
            const res = await axios.post(`${API_URL}/hr/assign-test`, { applicationId }, { headers });
            alert(res.data.message || 'Test assigned successfully!');
            await fetchCandidates(); // Refresh candidates list
        } catch (error: any) {
            console.error('Error assigning test:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to assign test';
            alert('Error: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-xl min-h-screen flex flex-col">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold text-blue-600">Hireflow HR</h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => setTab('company')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 font-medium transition ${tab === 'company' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                        1. Company Profile
                    </button>
                    <button onClick={() => setTab('job')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 font-medium transition ${tab === 'job' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                        2. Post Job
                    </button>
                    <button onClick={() => { setTab('view'); fetchCandidates(); }} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 font-medium transition ${tab === 'view' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                        3. View Applicants
                    </button>
                    <button onClick={() => { setTab('history'); fetchJobHistory(); }} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 font-medium transition ${tab === 'history' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                        4. Job History
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10">
                {tab === 'company' && (
                    <div className="max-w-4xl">
                        <h2 className="text-2xl font-bold mb-6">Company Profile</h2>
                        
                        {/* Company Details View */}
                        {company.name && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
                                <h3 className="text-xl font-bold mb-4 text-gray-800">Company Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm font-semibold text-gray-600">Company Name:</span>
                                        <p className="text-gray-900 font-medium">{company.name}</p>
                                    </div>
                                    {company.website && (
                                        <div>
                                            <span className="text-sm font-semibold text-gray-600">Website:</span>
                                            <p className="text-gray-900">
                                                <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                                                   target="_blank" 
                                                   rel="noopener noreferrer"
                                                   className="text-blue-600 hover:underline">
                                                    {company.website}
                                                </a>
                                            </p>
                                        </div>
                                    )}
                                    {company.contactPerson && (
                                        <div>
                                            <span className="text-sm font-semibold text-gray-600">Contact Person:</span>
                                            <p className="text-gray-900">{company.contactPerson}</p>
                                        </div>
                                    )}
                                    {company.size && (
                                        <div>
                                            <span className="text-sm font-semibold text-gray-600">Company Size:</span>
                                            <p className="text-gray-900">{company.size}</p>
                                        </div>
                                    )}
                                    {company.address && (
                                        <div className="md:col-span-2">
                                            <span className="text-sm font-semibold text-gray-600">Address:</span>
                                            <p className="text-gray-900">{company.address}</p>
                                        </div>
                                    )}
                                    {company.description && (
                                        <div className="md:col-span-2">
                                            <span className="text-sm font-semibold text-gray-600">Description:</span>
                                            <p className="text-gray-900 mt-1">{company.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Company Edit Form */}
                        <div className="bg-white p-8 rounded-xl shadow-sm border">
                            <h3 className="text-xl font-bold mb-4 text-gray-800">{company.name ? 'Edit Company Profile' : 'Create Company Profile'}</h3>
                            <form onSubmit={handleCompanySubmit} className="space-y-4">
                                <input
                                    placeholder="Company Name"
                                    value={company.name}
                                    className="w-full border p-3 rounded-lg"
                                    onChange={e => setCompany({ ...company, name: e.target.value })}
                                />
                                <input
                                    placeholder="Website"
                                    value={company.website}
                                    className="w-full border p-3 rounded-lg"
                                    onChange={e => setCompany({ ...company, website: e.target.value })}
                                />
                                <input
                                    placeholder="Contact Person"
                                    value={company.contactPerson}
                                    className="w-full border p-3 rounded-lg"
                                    onChange={e => setCompany({ ...company, contactPerson: e.target.value })}
                                />
                                <input
                                    placeholder="Address"
                                    value={company.address}
                                    className="w-full border p-3 rounded-lg"
                                    onChange={e => setCompany({ ...company, address: e.target.value })}
                                />
                                <input
                                    placeholder="Company Size (e.g., 50-100 employees)"
                                    value={company.size}
                                    className="w-full border p-3 rounded-lg"
                                    onChange={e => setCompany({ ...company, size: e.target.value })}
                                />
                                <textarea
                                    placeholder="Description"
                                    value={company.description}
                                    rows={4}
                                    className="w-full border p-3 rounded-lg"
                                    onChange={e => setCompany({ ...company, description: e.target.value })}
                                />
                                <button
                                    disabled={loading}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : company.name ? 'Update Company' : 'Create Company'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {tab === 'job' && (
                    <div className="max-w-3xl">
                        <h2 className="text-2xl font-bold mb-6">Post a New Job</h2>
                        <form onSubmit={handleJobSubmit} className="space-y-4 bg-white p-8 rounded-xl shadow-sm border">
                            <input placeholder="Job Title" className="w-full border p-3 rounded-lg" onChange={e => setJob({ ...job, title: e.target.value })} />
                            <textarea placeholder="Job Description" rows={4} className="w-full border p-3 rounded-lg" onChange={e => setJob({ ...job, description: e.target.value })} />
                            <input placeholder="Required Skills (comma separated)" className="w-full border p-3 rounded-lg" onChange={e => setJob({ ...job, skills: e.target.value })} />
                            <input placeholder="Location" className="w-full border p-3 rounded-lg" onChange={e => setJob({ ...job, location: e.target.value })} />
                            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">Publish Job</button>
                        </form>
                    </div>
                )}

                {tab === 'view' && (
                    <div className="max-w-4xl">
                        <h2 className="text-2xl font-bold mb-6">Applicants Who Applied</h2>
                        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                            <p className="text-blue-800 text-sm">Showing students who uploaded resumes and applied to your posted jobs.</p>
                        </div>

                        {candidates.length === 0 ? (
                            <div className="bg-white p-12 rounded-xl shadow-sm border text-center">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <h3 className="text-lg font-bold text-gray-700 mb-2">No Applicants Yet</h3>
                                <p className="text-gray-500">Post a job to start receiving applications from students.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {candidates.map((candidate: Candidate, idx: number) => (
                                    <div key={candidate.applicationId || idx} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start pb-4 border-b">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-bold text-lg">{candidate.name || 'Student ' + (idx + 1)}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        candidate.status === 'Shortlisted' ? 'bg-green-100 text-green-700' :
                                                        candidate.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                        candidate.status === 'Round1' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {candidate.status || 'Pending'}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 mb-1">Applied for: <span className="font-semibold">{candidate.jobTitle || 'Job Position'}</span></p>
                                                {candidate.jobLocation && (
                                                    <p className="text-sm text-gray-500 mb-2">📍 {candidate.jobLocation}</p>
                                                )}
                                                <div className="mb-2">
                                                    <p className="text-sm text-gray-600">📧 {candidate.email || 'N/A'}</p>
                                                    {candidate.phone && candidate.phone !== 'N/A' && (
                                                        <p className="text-sm text-gray-600">📞 {candidate.phone}</p>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 mb-2">
                                                    Applied: {candidate.appliedAt ? new Date(candidate.appliedAt).toLocaleDateString() : 'N/A'}
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {candidate.skills && candidate.skills.length > 0 ? (
                                                        candidate.skills.map((skill: string, i: number) => (
                                                            <span key={i} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{skill}</span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-400">No skills listed</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right ml-4">
                                                <div className={`text-3xl font-bold ${
                                                    (candidate.matchScore || 0) >= 60 ? 'text-green-600' : 
                                                    (candidate.matchScore || 0) >= 40 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                    {candidate.matchScore || 0}%
                                                </div>
                                                <p className="text-xs text-gray-400">Match Score</p>
                                                {(candidate.matchScore || 0) >= 60 && (
                                                    <p className="text-xs text-green-600 font-bold mt-1">✓ Test Eligible</p>
                                                )}
                                                {(candidate.matchScore || 0) < 60 && (
                                                    <p className="text-xs text-red-600 font-bold mt-1">✗ Need 60%+</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 mt-4">
                                            <button className="text-gray-500 hover:text-gray-700 font-medium text-sm">View Resume</button>
                                            <button 
                                                onClick={() => handleDeleteApplication(candidate.applicationId!)}
                                                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition"
                                            >
                                                Delete
                                            </button>
                                            <button 
                                                onClick={() => handleAssignTest(candidate.applicationId!, candidate.matchScore || 0)}
                                                disabled={loading || (candidate.matchScore || 0) < 60 || candidate.status === 'Round1'}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                                                    (candidate.matchScore || 0) >= 60 && candidate.status !== 'Round1'
                                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                }`}
                                            >
                                                {candidate.status === 'Round1' ? 'Test Assigned' : 'Assign Test'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'history' && (
                    <div className="max-w-6xl">
                        <h2 className="text-2xl font-bold mb-6">Job Posting History</h2>
                        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                            <p className="text-blue-800 text-sm">View all your posted jobs with application statistics.</p>
                        </div>

                        {jobHistory.length === 0 ? (
                            <div className="bg-white p-12 rounded-xl shadow-sm border text-center">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="text-lg font-bold text-gray-700 mb-2">No Jobs Posted Yet</h3>
                                <p className="text-gray-500">Post your first job to start receiving applications.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {jobHistory.map((job) => (
                                    <div key={job._id} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        job.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {job.status}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 mb-2">{job.description}</p>
                                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                                    <span>📍 {job.location}</span>
                                                    <span>🏢 {job.company}</span>
                                                    <span>📅 Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {job.skills.map((skill, i) => (
                                                        <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">{skill}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Statistics */}
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600">{job.stats.totalApplications}</div>
                                                <p className="text-xs text-gray-500">Total Applications</p>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-yellow-600">{job.stats.pending}</div>
                                                <p className="text-xs text-gray-500">Pending</p>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">{job.stats.shortlisted}</div>
                                                <p className="text-xs text-gray-500">Shortlisted</p>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600">{job.stats.round1}</div>
                                                <p className="text-xs text-gray-500">Round 1</p>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-red-600">{job.stats.rejected}</div>
                                                <p className="text-xs text-gray-500">Rejected</p>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 flex justify-end">
                                            <button 
                                                onClick={() => { 
                                                    setTab('view'); 
                                                    fetchCandidates(); 
                                                }} 
                                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                                            >
                                                View Applicants →
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

