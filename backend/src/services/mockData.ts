export const MOCK_JOBS = [
    {
        id: 'job-1',
        title: 'Senior Full Stack Engineer',
        description: 'We are looking for a senior full stack engineer with React and Node.js experience.',
        positions: 2,
        requiredSkills: ['React', 'Node.js', 'TypeScript', 'System Design'],
        createdAt: new Date().toISOString()
    },
    {
        id: 'job-2',
        title: 'Frontend Developer',
        description: 'Looking for a pixel-perfect frontend developer.',
        positions: 1,
        requiredSkills: ['React', 'CSS', 'Tailwind', 'Figma'],
        createdAt: new Date().toISOString()
    }
];

export const MOCK_RESUMES = [
    {
        id: 'resume-1',
        originalFileUrl: '/uploads/alice_resume.pdf',
        parsedContent: {
            name: 'Alice Johnson',
            email: 'alice@example.com',
            phone: '123-456-7890',
            skills: ['React', 'Node.js', 'Python', 'AWS'],
            experienceYears: 5,
            education: ['BS CS']
        },
        candidateName: 'Alice Johnson',
        candidateEmail: 'alice@example.com'
    },
    {
        id: 'resume-2',
        originalFileUrl: '/uploads/bob_resume.pdf',
        parsedContent: {
            name: 'Bob Smith',
            email: 'bob@example.com',
            phone: '987-654-3210',
            skills: ['Java', 'Spring', 'MySQL'],
            experienceYears: 3,
            education: ['MS CS']
        },
        candidateName: 'Bob Smith',
        candidateEmail: 'bob@example.com'
    }
];
