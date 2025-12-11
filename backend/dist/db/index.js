"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = initDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dbPath = process.env.DATABASE_URL?.replace('file:', '') || 'dev.db';
const db = new better_sqlite3_1.default(dbPath);
function initDb() {
    const schemaPath = path_1.default.join(__dirname, 'schema.sql');
    // For TS execution, we might be in src or dist. 
    // Let's assume src for dev.
    let schema = '';
    try {
        schema = fs_1.default.readFileSync(path_1.default.join(process.cwd(), 'src', 'db', 'schema.sql'), 'utf-8');
    }
    catch (e) {
        // Try relative to __dirname (dist)
        schema = fs_1.default.readFileSync(path_1.default.join(__dirname, 'schema.sql'), 'utf-8');
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
exports.default = db;
