"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreResume = scoreResume;
function scoreResume(resume, jobSkills, requiredExp = 2) {
    const resumeSkills = new Set(resume.skills.map(s => s.toLowerCase()));
    const jobSkillsSet = new Set(jobSkills.map(s => s.toLowerCase()));
    let matchCount = 0;
    jobSkillsSet.forEach(s => {
        if (resumeSkills.has(s))
            matchCount++;
    });
    const skillMatchScore = jobSkillsSet.size > 0 ? (matchCount / jobSkillsSet.size) * 100 : 0;
    // Experience score: 10 points per year up to 50
    const expScore = Math.min(resume.experienceYears * 10, 50);
    // Base weighted: 70% skills, 30% experience
    const baseScore = (skillMatchScore * 0.7) + (expScore * 0.3);
    const flags = [];
    if (!resume.email)
        flags.push('Missing Email');
    if (resume.skills.length === 0)
        flags.push('No Skills Detected');
    return {
        baseScore: Math.round(baseScore),
        skillMatchScore: Math.round(skillMatchScore),
        expScore,
        flags,
        explanation: {
            matchedSkills: Array.from(jobSkillsSet).filter(s => resumeSkills.has(s)),
            missingSkills: Array.from(jobSkillsSet).filter(s => !resumeSkills.has(s))
        }
    };
}
