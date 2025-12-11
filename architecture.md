# Architecture & Design

## system Overview

Hireflow is designed as a modular monolith for the hackathon context, splitting clear responsibilities between the React frontend and Node.js backend.

### Backend (`/backend`)
- **Express.js**: Simple, robust REST API.
- **SQLite**: Zero-config, file-based database. Perfect for ensuring the demo works on any machine without Docker/Cloud setup.
- **Services**:
  - `parsingService`: Handles file extraction. Uses Regex/Heuristics for reliability during the demo, but abstracted to allow switching to NLP models.
  - `scoringService`: Implements the matching algorithm.
    - Score = (SkillMatch * 0.7) + (Experience * 0.3).
    - Jaccard Similarity / Set Overlap used for skill matching in demo mode.

### Frontend (`/frontend`)
- **Vite + React**: High-performance, low-latency UI.
- **Tailwind CSS**: Rapid styling with a clean, modern aesthetic.
- **Anti-Cheat**: Uses browser `visibilitychange` and `blur` events to track if a candidate leaves the tab.

## Design Decisions

1. **Privacy/Bias**:
   - The Scoring Service explicitly ignores Name, Gender, Email from the score calculation.
   - Future improvement: "Blind" mode where names are hidden from HR until interview.

2. **Performance**:
   - Resume parsing is async.
   - Database queries use optimized indexes (SQLite) for fast dashboard loading.

3. **Security**:
   - Test links are tokenized (UUID) and expire in 24 hours.
   - No PII is sent to the AI scoring engine (if external API is used).

## Scalability
For production:
- Replace SQLite with PostgreSQL.
- Move Parsing/Scoring to a background worker queue (BullMQ + Redis).
- Store files in S3/GCS instead of passing buffers.
