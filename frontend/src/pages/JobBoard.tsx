import { useEffect, useState } from 'react';
import axios from 'axios';
import { Upload, Briefcase, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Job {
    id: string;
    title: string;
    description: string;
    positions: number;
    required_skills: string[];
    created_at: string;
}

export default function JobBoard() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [email, setEmail] = useState('');
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:3000/api/public/jobs').then(res => setJobs(res.data));
    }, []);

    const handleApply = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !selectedJob || !email) {
            alert("Please enter email first");
            return;
        }
        setUploading(true);

        const formData = new FormData();
        formData.append('resume', e.target.files[0]);
        formData.append('jobId', selectedJob.id);
        formData.append('candidateEmail', email);

        try {
            // This endpoint now includes the "AI Decision Node" logic
            await axios.post('http://localhost:3000/api/public/apply', formData);
            // Redirect to Student Dashboard to see result
            navigate(`/student/dashboard?email=${email}`);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            // Try to get axios error response if available
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { error?: string } } };
                alert('Application failed: ' + (axiosError.response?.data?.error || errorMessage));
            } else {
                alert('Application failed: ' + errorMessage);
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-10 px-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    Open Positions
                </h1>
                <div className="flex gap-2">
                    <input
                        type="email"
                        placeholder="Your Email (Login)"
                        className="px-4 py-2 border rounded-full focus:ring-2 focus:ring-blue-500 outline-none"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                    <button
                        onClick={() => { if (email) navigate(`/student/dashboard?email=${email}`) }}
                        className="bg-gray-900 text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800"
                    >
                        My Dashboard
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    {jobs.map((job: Job) => (
                        <div
                            key={job.id}
                            onClick={() => setSelectedJob(job)}
                            className={`p-6 rounded-xl cursor-pointer transition-all border ${selectedJob?.id === job.id ? 'bg-blue-50 border-blue-500 shadow-md scale-[1.02]' : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'}`}
                        >
                            <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                            <p className="text-gray-500 text-sm mt-1 mb-3 line-clamp-2">{job.description}</p>
                            <div className="flex flex-wrap gap-2">
                                {job.required_skills.slice(0, 3).map((s: string) => (
                                    <span key={s} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600">{s}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 sticky top-24 h-fit">
                    {selectedJob ? (
                        <div>
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
                                    <p className="text-gray-500 text-sm mt-1">Posted on {new Date(selectedJob.created_at).toLocaleDateString()}</p>
                                </div>
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                    {selectedJob.positions} Openings
                                </span>
                            </div>

                            <div className="prose prose-sm text-gray-600 mb-8">
                                <h3 className="text-gray-900 font-bold mb-2">Description</h3>
                                <p>{selectedJob.description}</p>
                                <h3 className="text-gray-900 font-bold mt-4 mb-2">Required Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedJob.required_skills.map((s: string) => (
                                        <span key={s} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg">{s}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="font-bold text-gray-900 mb-4">Apply Now</h3>
                                {!email ? (
                                    <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> Please enter your email at the top right to apply.
                                    </div>
                                ) : (
                                    <div>
                                        <input
                                            type="file"
                                            id="resume-upload-public"
                                            className="hidden"
                                            accept=".pdf,.docx,.txt"
                                            onChange={handleApply}
                                            disabled={uploading}
                                        />
                                        <label
                                            htmlFor="resume-upload-public"
                                            className={`w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-4 rounded-xl cursor-pointer hover:bg-blue-700 transition-all ${uploading ? 'opacity-75 animate-pulse' : ''}`}
                                        >
                                            <Upload className="w-5 h-5" />
                                            {uploading ? 'Analyzing Resume...' : 'Upload Resume & Apply'}
                                        </label>
                                        <p className="text-xs text-center text-gray-400 mt-2">
                                            Your resume will be parsed and scored by AI instantly.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <Briefcase className="w-12 h-12 mb-2 opacity-20" />
                            <p>Select a job to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
