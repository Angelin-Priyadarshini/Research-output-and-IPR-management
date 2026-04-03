const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'research.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT,
            name TEXT,
            verified BOOLEAN DEFAULT FALSE,
            verification_token TEXT
        )`);

        // Projects table (Research Work)
        db.run(`CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            type TEXT, -- Publication, Patent, Trademark, Copyright
            category TEXT DEFAULT 'Paper', -- Proposal, Paper
            status TEXT, -- Pending, Approved, Granted, Published
            review_stage TEXT DEFAULT 'Draft', -- Draft, Professor, HOD, Approved
            owner_id INTEGER,
            mentor_id INTEGER,
            citations INTEGER DEFAULT 0,
            impact_factor REAL DEFAULT 0,
            year INTEGER,
            publication_date TEXT,
            journal TEXT,
            abstract TEXT,
            paper_content TEXT, -- Base64 or URL
            file_name TEXT,
            file_type TEXT,
            professor_comments TEXT,
            -- Phase 6 Fields
            patent_no TEXT,
            inventors TEXT,
            date_filed TEXT,
            date_published TEXT,
            date_granted TEXT,
            proof_link TEXT,
            paper_link TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(owner_id) REFERENCES users(id),
            FOREIGN KEY(mentor_id) REFERENCES users(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            message TEXT,
            link TEXT,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS mentor_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            mentor_id INTEGER,
            content TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(project_id) REFERENCES projects(id),
            FOREIGN KEY(mentor_id) REFERENCES users(id)
        )`);

        // Phase 11: ROMS Research Portal Tables
        db.run(`CREATE TABLE IF NOT EXISTS journal_publications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            article_title TEXT NOT NULL,
            authors TEXT NOT NULL,
            affiliations TEXT NOT NULL,
            orcid_ids TEXT,
            journal_title TEXT NOT NULL,
            volume_number TEXT,
            issue_number TEXT,
            page_or_article_id TEXT,
            doi TEXT UNIQUE,
            publication_date TEXT,
            indexing TEXT NOT NULL CHECK(indexing IN ('Scopus', 'Web of Science', 'None')) DEFAULT 'None',
            quartile TEXT NOT NULL CHECK(quartile IN ('Q1', 'Q2', 'Q3', 'Q4', 'NA')) DEFAULT 'NA',
            publisher TEXT,
            url TEXT,
            added_by INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS conference_publications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conference_title TEXT NOT NULL,
            paper_title TEXT NOT NULL,
            authors TEXT NOT NULL,
            affiliations TEXT NOT NULL,
            conference_scope TEXT NOT NULL CHECK(conference_scope IN ('International', 'National', 'Normal')) DEFAULT 'Normal',
            doi TEXT UNIQUE,
            volume_issue_series TEXT,
            page_or_article_id TEXT,
            issn_or_isbn TEXT,
            indexing TEXT NOT NULL CHECK(indexing IN ('Scopus', 'Web of Science', 'None')) DEFAULT 'None',
            quartile TEXT NOT NULL CHECK(quartile IN ('Q1', 'Q2', 'Q3', 'Q4', 'NA')) DEFAULT 'NA',
            publisher TEXT,
            url TEXT,
            added_by INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            article_title TEXT NOT NULL,
            authors TEXT NOT NULL,
            affiliations TEXT NOT NULL,
            doi TEXT UNIQUE,
            publication_source TEXT NOT NULL,
            publication_date TEXT,
            indexing TEXT NOT NULL CHECK(indexing IN ('Scopus', 'Web of Science', 'None')) DEFAULT 'None',
            quartile TEXT NOT NULL CHECK(quartile IN ('Q1', 'Q2', 'Q3', 'Q4', 'NA')) DEFAULT 'NA',
            publisher TEXT,
            url TEXT,
            abstract TEXT,
            keywords TEXT,
            added_by INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS inproceedings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            paper_title TEXT NOT NULL,
            authors TEXT NOT NULL,
            affiliations TEXT NOT NULL,
            conference_name TEXT NOT NULL,
            conference_location TEXT NOT NULL,
            conference_scope TEXT NOT NULL CHECK(conference_scope IN ('International', 'National', 'Normal')) DEFAULT 'Normal',
            conference_date TEXT,
            proceedings_title TEXT NOT NULL,
            editors TEXT,
            volume_or_series_number TEXT,
            page_or_article_id TEXT,
            doi TEXT UNIQUE,
            isbn_or_issn TEXT,
            indexing TEXT NOT NULL CHECK(indexing IN ('Scopus', 'Web of Science', 'None')) DEFAULT 'None',
            quartile TEXT NOT NULL CHECK(quartile IN ('Q1', 'Q2', 'Q3', 'Q4', 'NA')) DEFAULT 'NA',
            publisher TEXT,
            url TEXT,
            added_by INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE
        )`);

        // Backward-compatible migrations for existing DBs
        const safeAlter = (sql) => {
            db.run(sql, (err) => {
                if (err && !String(err.message).includes('duplicate column name')) {
                    console.error('Migration error:', err.message);
                }
            });
        };
        safeAlter(`ALTER TABLE conference_publications ADD COLUMN conference_scope TEXT NOT NULL DEFAULT 'Normal'`);
        safeAlter(`ALTER TABLE conference_publications ADD COLUMN indexing TEXT NOT NULL DEFAULT 'None'`);
        safeAlter(`ALTER TABLE articles ADD COLUMN indexing TEXT NOT NULL DEFAULT 'None'`);
        safeAlter(`ALTER TABLE inproceedings ADD COLUMN conference_scope TEXT NOT NULL DEFAULT 'Normal'`);
        safeAlter(`ALTER TABLE inproceedings ADD COLUMN indexing TEXT NOT NULL DEFAULT 'None'`);


        // Seed initial roles/users if empty (password is 'password123' hashed)
        // Note: In real app, we use bcrypt. Here we'll handle it in auth logic
        // But let's check if HOD exists
        db.get("SELECT * FROM users WHERE role = 'HOD'", (err, row) => {
            if (!row) {
                // Placeholder for HOD
                console.log('Seeding initial HOD user...');
                // We will hash this in the server.js but for now just a reminder
            }
        });
    });
}

module.exports = db;
