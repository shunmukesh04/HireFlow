import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Job } from '../models/index';

// Catalogue
const TEST_CATALOGUE = [
    { type: 'Aptitude', questions: [{ q: '1+1?', a: '2', options: ['1', '2', '3', '4'] }] },
    { type: 'English', questions: [{ q: 'Past tense of run?', a: 'ran', options: ['run', 'ran', 'running'] }] },
    { type: 'Coding', questions: [{ q: 'Write a function to sum array', a: 'code' }] }
];

export const getAssignedTests = async (req: AuthRequest, res: Response) => {
    try {
        // Find jobs user has applied to (via Resumes) - simplified: Find all tests for Demo
        // In real app: Look up applied jobs -> get their test config -> return tests
        // Hackathon Demo: Return all tests available in catalogue mock
        res.json(TEST_CATALOGUE);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tests' });
    }
};

export const submitTest = async (req: AuthRequest, res: Response) => {
    try {
        const { jobId, testType, score } = req.body;

        // TODO: Store test results in Application.round1 or TestRound model
        // For now, return success response
        res.status(201).json({
            message: 'Test submitted successfully',
            testType,
            score,
            status: score > 70 ? 'Passed' : 'Failed',
            completedAt: new Date()
        });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting test' });
    }
}
