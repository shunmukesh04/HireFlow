import { ParsedResume } from './parsingService';

export interface ScoreResult {
    baseScore: number;
    skillMatchScore: number;
    expScore: number;
    flags: string[];
    explanation: Record<string, any>;
    feedbackLinks: any[];
}

export function scoreResume(resume: ParsedResume, jobSkills: string[], requiredExp: number = 2): ScoreResult {
    const resumeSkills = new Set(resume.skills.map(s => s.toLowerCase()));
    const jobSkillsSet = new Set(jobSkills.map(s => s.toLowerCase()));

    let matchCount = 0;
    jobSkillsSet.forEach(s => {
        if (resumeSkills.has(s)) matchCount++;
    });

    const skillMatchScore = jobSkillsSet.size > 0 ? (matchCount / jobSkillsSet.size) * 100 : 0;

    // Experience score: 10 points per year up to 50
    const expScore = Math.min(resume.experienceYears * 10, 50);

    // Base weighted: 70% skills, 30% experience
    const baseScore = (skillMatchScore * 0.7) + (expScore * 0.3);

    const flags = [];
    if (!resume.email) flags.push('Missing Email');
    if (resume.skills.length === 0) flags.push('No Skills Detected');

    // Generate Learning Links for missing skills
    const missingSkills = Array.from(jobSkillsSet).filter(s => !resumeSkills.has(s));
    const feedbackLinks = missingSkills.map(skill => ({
        skill,
        url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(skill)}`
    }));

    return {
        baseScore: Math.round(baseScore),
        skillMatchScore: Math.round(skillMatchScore),
        expScore,
        flags,
        explanation: {
            matchedSkills: Array.from(jobSkillsSet).filter(s => resumeSkills.has(s)),
            missingSkills
        },
        feedbackLinks
    };
}
