import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { AlertOctagon, CheckCircle } from 'lucide-react';

interface Test {
    id: string;
    title: string;
    description: string;
    duration: number;
    type: string;
}

export default function TestPage() {
    const { token } = useParams();
    const [test, setTest] = useState<Test | null>(null);
    const [started, setStarted] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [code, setCode] = useState('// Write your solution here\nfunction solve(input) {\n  return input;\n}');
    const [blurCount, setBlurCount] = useState(0);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL}/api/tests/${token}`).then(res => setTest(res.data));
    }, [token]);

    // Anti-cheat: Blur detection
    useEffect(() => {
        if (!started || submitted) return;
        const handleBlur = () => {
            setBlurCount(c => c + 1);
            console.warn('Focus lost!');
        };
        window.addEventListener('blur', handleBlur);
        return () => window.removeEventListener('blur', handleBlur);
    }, [started, submitted]);

    const handleSubmit = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/tests/${token}/submit`, {
                answers: { code },
                antiCheatLog: { blurCount }
            });
            setSubmitted(true);
        } catch (error) {
            console.error('Submission failed:', error);
            alert('Submission failed');
        }
    };

    if (!test) return <div>Loading...</div>;

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                    <div className="flex justify-center mb-4">
                        <CheckCircle className="w-16 h-16 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Submitted!</h2>
                    <p className="text-gray-500">Thank you for completing the assessment. The recruiting team will review your results.</p>
                </div>
            </div>
        );
    }

    if (!started) {
        return (
            <div className="max-w-3xl mx-auto py-20 px-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Candidate Assessment</h1>
                    <div className="bg-blue-50 p-4 rounded-lg mb-6 text-blue-800 text-sm">
                        <strong>Important:</strong> This test is monitored.
                        Please utilize full-screen mode and do not switch tabs.
                        Focus loss will be recorded.
                    </div>
                    <button
                        onClick={() => setStarted(true)}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Start Assessment
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
                <h2 className="font-bold">Coding Challenge: Array Sum</h2>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-yellow-400">
                        <AlertOctagon className="w-4 h-4" />
                        <span>Focus Lost: {blurCount} times</span>
                    </div>
                    <button onClick={handleSubmit} className="bg-green-600 px-4 py-2 rounded font-bold hover:bg-green-700 transition-colors">
                        Submit Solution
                    </button>
                </div>
            </div>
            <div className="flex-1 flex gap-4 p-4">
                <div className="w-1/3 bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-4">Problem Description</h3>
                    <p className="text-gray-300 leading-relaxed mb-4">
                        Write a function that takes an array of integers and returns the sum of all positive numbers.
                        If the array is empty or contains no positive numbers, return 0.
                    </p>
                    <div className="bg-gray-900 p-3 rounded text-sm font-mono text-gray-400">
                        Input: [1, -4, 7, 12] <br />
                        Output: 20
                    </div>
                </div>
                <div className="flex-1 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                    <textarea
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono p-4 outline-none resize-none"
                        spellCheck="false"
                    />
                </div>
            </div>
        </div>
    );
}
