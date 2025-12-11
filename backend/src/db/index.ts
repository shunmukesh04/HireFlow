import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || 'dev.db';
const db = new Database(dbPath);

export function initDb() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    // For TS execution, we might be in src or dist. 
    // Let's assume src for dev.
    let schema = '';
    try {
        schema = fs.readFileSync(path.join(process.cwd(), 'src', 'db', 'schema.sql'), 'utf-8');
    } catch (e) {
        // Try relative to __dirname (dist)
        schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    }

    db.exec(schema);
    console.log('Database initialized');

    // Seed admin if not exists
    const admin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@hireflow.com');
    if (!admin) {
        db.prepare('INSERT INTO users (id, email, role) VALUES (?, ?, ?)').run('user-admin', 'admin@hireflow.com', 'ADMIN');
        console.log('Seeded admin user');
    }
}

export default db;
