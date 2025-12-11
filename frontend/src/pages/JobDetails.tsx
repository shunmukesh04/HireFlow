import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Upload, FileText, Mail } from 'lucide-react';

interface Candidate {
    id: string;
    name: string;
    email?: string;
    skills?: string[];
    resumeUrl?: string;
    matchScore?: number;
    status?: string;
    parsed_content?: {
        name?: string;
        email?: string;
        skills?: string[];
        education?: string[];
        experience?: string[];
    };
    flags?: string[];
    base_score?: number;
    resume_id?: string;
}

export default function JobDetails() {
    const { jobId } = useParams();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [uploading, setUploading] = useState(false);
    const [jobTitle, setJobTitle] = useState('');

    const fetchCandidates = useCallback(async () => {
        try {
            const res = await axios.get(`http://localhost:3000/api/hr/candidates?jobId=${jobId}`);
            setCandidates(res.data);
            // Fetch job details separately if needed, simplified here
            setJobTitle('Job Candidates');
        } catch (error) {
            console.error('Error fetching candidates:', error);
        }
    }, [jobId]);

    useEffect(() => {
        if (jobId) {
            fetchCandidates();
        }
    }, [jobId, fetchCandidates]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('resume', e.target.files[0]);
        formData.append('jobId', jobId as string);

        try {
            await axios.post('http://localhost:3000/api/hr/upload-resumes', formData);
            await fetchCandidates();
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const createTest = async (resumeId: string) => {
        try {
            const res = await axios.post('http://localhost:3000/api/tests/create', { resumeId, type: 'coding' });
            alert(`Test Link Created: http://localhost:5173${res.data.link}\n(Ideally sent via email)`);
        } catch (error) {
            console.error('Failed to create test:', error);
            alert('Failed to create test');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{jobTitle || 'Job Candidates'}</h1>
                <div className="relative">
                    <input
                        type="file"
                        id="resume-upload"
                        className="hidden"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileUpload}
                        disabled={uploading}
                    />
                    <label htmlFor="resume-upload" className={`flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors ${uploading ? 'opacity-50' : ''}`}>
                        <Upload className="w-5 h-5" />
                        {uploading ? 'Parsing...' : 'Upload Resume'}
                    </label>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Rank</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Candidate</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Match Score</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {candidates.map((c: Candidate, index) => (
                            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${index < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {index + 1}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{c.parsed_content?.name || 'Unknown'}</div>
                                    <div className="text-sm text-gray-500">{c.parsed_content?.email || 'N/A'}</div>
                                    <div className="flex gap-1 mt-1">
                                        {c.parsed_content?.skills?.slice(0, 3).map((skill, i) => (
                                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{skill}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px]">
                                            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${c.base_score || 0}%` }}></div>
                                        </div>
                                        <span className="font-bold text-gray-700">{Math.round(c.base_score || 0)}%</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Exp: {c.parsed_content?.experience?.length || 0}y
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                        <FileText className="w-3 h-3" />
                                        Screened
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => c.resume_id && createTest(c.resume_id)}
                                        className="flex items-center gap-1 text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-all font-medium"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Send Test
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {candidates.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No candidates yet. Upload resumes to see ranking.
                    </div>
                )}
            </div>
        </div>
    );
}
