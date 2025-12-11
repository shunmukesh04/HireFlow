"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResume = parseResume;
// Simple heuristic parser for the prototype
async function parseResume(fileBuffer, fileName) {
    const content = fileBuffer.toString('utf-8'); // Assume text/plain or extract text
    // In real app, use pdf-parse or textract here.
    // For Hackathon Demo: simple regex + mock if it looks like a binary PDF
    // Heuristics
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const phoneRegex = /(\+?[\d\s-]{10,})/;
    const emailMatch = content.match(emailRegex);
    const phoneMatch = content.match(phoneRegex);
    const skillsList = ['Javascript', 'Typescript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'AWS', 'Docker', 'Kubernetes', 'SQL', 'NoSQL', 'MongoDB'];
    const foundSkills = skillsList.filter(s => content.toLowerCase().includes(s.toLowerCase()));
    // Heuristic for experience: look for years like "2018-2021" or "3 years"
    // Default to 2 for demo if not found
    let experienceYears = 2;
    if (content.includes('Senior') || content.includes('Lead'))
        experienceYears = 5;
    // If content is too short (likely binary PDF read as text), return mock data based on filename
    if (content.length < 50 || content.includes('%PDF')) {
        return {
            name: 'Demo Candidate ' + Math.floor(Math.random() * 100),
            email: emailMatch ? emailMatch[0] : `candidate${Date.now()}@example.com`,
            phone: phoneMatch ? phoneMatch[0] : '123-456-7890',
            skills: ['React', 'Node.js', 'TypeScript'],
            experienceYears: 3,
            education: ['B.S. Computer Science']
        };
    }
    return {
        name: 'Candidate', // Hard to extract name without NER
        email: emailMatch ? emailMatch[0] : '',
        phone: phoneMatch ? phoneMatch[0] : '',
        skills: foundSkills,
        experienceYears,
        education: []
    };
}
