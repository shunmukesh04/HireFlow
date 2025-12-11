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
    name?: string;
    jobTitle?: string;
    skills?: string[];
    matchScore?: number;
    resume?: string;
    _id?: string;
}

export default function HRDashboard() {
    const { getToken } = useAuth();
    const API_URL = useMemo(() => {
        const base = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '').replace(/\/api$/, '');
        return `${base}/api`;
    }, []);
    const [tab, setTab] = useState<'company' | 'job' | 'view'>('job');
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
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10">
                {tab === 'company' && (
                    <div className="max-w-3xl">
                        <h2 className="text-2xl font-bold mb-6">Company Profile</h2>
                        <form onSubmit={handleCompanySubmit} className="space-y-4 bg-white p-8 rounded-xl shadow-sm border">
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
                                {loading ? 'Saving...' : 'Save Company'}
                            </button>
                        </form>
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
                                    <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border">
                                        <div className="flex justify-between items-start pb-4 border-b">
                                            <div>
                                                <h3 className="font-bold text-lg">{candidate.name || 'Student ' + (idx + 1)}</h3>
                                                <p className="text-gray-500">Applied for: {candidate.jobTitle || 'Job Position'}</p>
                                                <div className="flex gap-2 mt-2">
                                                    {candidate.skills?.map((skill: string, i: number) => (
                                                        <span key={i} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{skill}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-green-600">{candidate.matchScore || 85}%</div>
                                                <p className="text-xs text-gray-400">Match Score</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 mt-4">
                                            <button className="text-gray-500 hover:text-gray-700 font-medium text-sm">View Resume</button>
                                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">Assign Test</button>
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
