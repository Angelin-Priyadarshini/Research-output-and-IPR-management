const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'ssn_research_secret_key_2026';

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Helper function to create notification
function createNotification(userId, message, link) {
    db.run("INSERT INTO notifications (user_id, message, link) VALUES (?, ?, ?)", [userId, message, link]);
}

// --- Auth Routes ---

app.post('/api/auth/register', async (req, res) => {
    const { email, username, password, role, name } = req.body;

    if (!email.endsWith('@ssn.edu.in')) {
        return res.status(400).json({ message: 'Only @ssn.edu.in emails are allowed.' });
    }

    try {
        const hashedPw = await bcrypt.hash(password, 10);
        const verificationToken = Math.random().toString(36).substring(2, 12);

        db.run(
            "INSERT INTO users (email, username, password, role, name, verification_token) VALUES (?, ?, ?, ?, ?, ?)",
            [email, username, hashedPw, role, name, verificationToken],
            function (err) {
                if (err) return res.status(400).json({ message: 'Email or Username already exists' });
                console.log(`[MOCK EMAIL] Verification link for ${email}: http://localhost:5173/verify?token=${verificationToken}`);
                res.status(201).json({ message: 'Registration successful. Please verify your email.', token: verificationToken });
            }
        );
    } catch (err) {
        res.status(500).json({ message: 'Error hashing password' });
    }
});

app.post('/api/auth/verify', (req, res) => {
    const { token } = req.body;
    db.run("UPDATE users SET verified = 1, verification_token = NULL WHERE verification_token = ?", [token], function (err) {
        if (err || this.changes === 0) return res.status(400).json({ message: 'Invalid token' });
        res.json({ message: 'Account verified successfully!' });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ? OR email = ?", [username, username], async (err, user) => {
        if (err || !user) return res.status(401).json({ message: 'Invalid credentials' });
        if (!user.verified) return res.status(403).json({ message: 'Please verify your email.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, name: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name, email: user.email } });
    });
});

// --- Public Routes ---

app.get('/api/public/stats', (req, res) => {
    const stats = { publications: 2450, patents: 185, citations: 12400, copyrights: 42, trademarks: 12 };
    res.json(stats);
});

app.get('/api/public/recent-publications', (req, res) => {
    db.all("SELECT * FROM projects WHERE type = 'Publication' AND status = 'Published' ORDER BY year DESC, created_at DESC LIMIT 10", [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows);
    });
});

// --- Notifications Route ---
app.get('/api/notifications', authenticateToken, (req, res) => {
    db.all("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows);
    });
});
app.post('/api/notifications/mark-read', authenticateToken, (req, res) => {
    db.run("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [req.user.id], function (err) {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: 'Marked as read' });
    });
});

// --- Research/IPR Routes ---

app.post('/api/projects/submit', authenticateToken, (req, res) => {
    const {
        title, type, category, abstract, mentor_id,
        year, journal, paper_link, // Pub fields
        patent_no, inventors, date_filed, date_published, date_granted, proof_link // Patent fields
    } = req.body;

    const owner_id = req.user.id;
    const role = req.user.role;

    // Logic: If Professor, bypass "Professor" stage and go to "HOD" stage (or Approved if they self-publish, but HOD is final chain of command)
    let reviewStage = role === 'Professor' || role === 'HOD' ? 'HOD' : 'Professor';
    let status = 'Pending';

    // Determine patent specific status logic
    if (type === 'Patent') {
        if (date_granted) status = 'Granted';
        else if (date_published) status = 'Published';
        else if (date_filed) status = 'Filed';
    }

    const query = `
        INSERT INTO projects (
            title, type, category, abstract, review_stage, status, owner_id, mentor_id,
            year, journal, paper_link,
            patent_no, inventors, date_filed, date_published, date_granted, proof_link
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        title, type, category || 'Paper', abstract, reviewStage, status, owner_id, mentor_id || null,
        year, journal, paper_link,
        patent_no, inventors, date_filed, date_published, date_granted, proof_link
    ];

    db.run(query, params, function (err) {
        if (err) return res.status(500).json({ message: 'Failed to submit work', error: err.message });

        // Notifications
        if (mentor_id && reviewStage === 'Professor') {
            createNotification(mentor_id, `New submission from ${req.user.name} requires your review: ${title}`, 'approvals');
        } else if (reviewStage === 'HOD') {
            // Find HOD id (assuming ID 1 for brevity in this mock, or query it)
            db.get("SELECT id FROM users WHERE role = 'HOD'", [], (err, hod) => {
                if (hod) createNotification(hod.id, `New direct submission requires HOD approval: ${title}`, 'approvals');
            });
        }

        res.status(201).json({ id: this.lastID, message: 'Submission successful.' });
    }
    );
});

app.put('/api/projects/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { title, abstract, paper_link } = req.body;
    const owner_id = req.user.id;

    // Reset to Professor stage if student edits
    const nextStage = req.user.role === 'Student' || req.user.role === 'Scholar' ? 'Professor' : 'HOD';

    db.run(
        "UPDATE projects SET title = ?, abstract = ?, paper_link = ?, review_stage = ? WHERE id = ? AND owner_id = ?",
        [title, abstract, paper_link, nextStage, id, owner_id],
        function (err) {
            if (err) return res.status(500).json({ message: 'Resubmission failed' });

            db.get("SELECT mentor_id FROM projects WHERE id = ?", [id], (err, proj) => {
                if (proj && proj.mentor_id) {
                    createNotification(proj.mentor_id, `${req.user.name} has updated their submission: ${title}`, 'approvals');
                }
            });

            res.json({ message: 'Submission updated.' });
        }
    );
});

app.post('/api/projects/:id/review', authenticateToken, (req, res) => {
    if (req.user.role !== 'Professor') return res.status(403).json({ message: 'Access denied' });
    const { id } = req.params;
    const { professor_comments, approved_to_hod } = req.body;

    const nextStage = approved_to_hod ? 'HOD' : 'Professor';

    db.run(
        "UPDATE projects SET professor_comments = ?, review_stage = ? WHERE id = ?",
        [professor_comments, nextStage, id],
        function (err) {
            if (err) return res.status(500).json({ message: 'Review update failed' });

            db.get("SELECT owner_id, title FROM projects WHERE id = ?", [id], (err, proj) => {
                if (proj) {
                    if (approved_to_hod) {
                        db.get("SELECT id FROM users WHERE role = 'HOD'", [], (err, hod) => {
                            if (hod) createNotification(hod.id, `Professor approved ${proj.title} to HOD queue.`, 'approvals');
                        });
                        createNotification(proj.owner_id, `Your submission "${proj.title}" was endorsed and sent to HOD.`, 'overview');
                    } else {
                        createNotification(proj.owner_id, `Mentor requested changes on "${proj.title}".`, 'overview');
                    }
                }
            });

            res.json({ message: approved_to_hod ? 'Moved to HOD queue.' : 'Comments sent.' });
        }
    );
});

app.post('/api/projects/:id/approve', authenticateToken, (req, res) => {
    if (req.user.role !== 'HOD') return res.status(403).json({ message: 'Only HOD can give final approval' });
    const { id } = req.params;

    db.run(
        "UPDATE projects SET review_stage = 'Approved', status = 'Published' WHERE id = ?",
        [id],
        function (err) {
            if (err) return res.status(500).json({ message: 'Approval failed' });

            // If it's a patent that was just approved but lacked specific state, mark it as Filed
            db.run("UPDATE projects SET status = 'Filed' WHERE id = ? AND type = 'Patent' AND date_filed IS NULL", [id]);

            db.get("SELECT * FROM projects WHERE id = ?", [id], (err, proj) => {
                if (proj) {
                    createNotification(proj.owner_id, `HOD gave final approval for "${proj.title}"!`, 'overview');
                    
                    // Automigrate to Institutional Table if it's Research
                    if (['Journal Publication', 'Conference', 'Article', 'In-proceeding'].includes(proj.type)) {
                        let targetTable = '';
                        if (proj.type === 'Journal Publication') targetTable = 'journal_publications';
                        else if (proj.type === 'Conference') targetTable = 'conference_publications';
                        else if (proj.type === 'Article') targetTable = 'articles';
                        else if (proj.type === 'In-proceeding') targetTable = 'inproceedings';
                        
                        const titleField = targetTable === 'journal_publications' || targetTable === 'articles' ? 'article_title' : 'paper_title';
                        const sourceField = targetTable === 'journal_publications' ? 'journal_title' : 
                                             targetTable === 'articles' ? 'publication_source' : 
                                             targetTable === 'conference_publications' ? 'conference_title' : 'conference_name';

                        const targetSql = `INSERT INTO ${targetTable} (${titleField}, authors, affiliations, ${sourceField}, publication_date, doi, added_by) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                        
                        db.run(targetSql, [
                            proj.title,
                            proj.inventors || '', // Authors mapped to inventors field
                            'SSN College of Engineering',
                            proj.journal || '',
                            proj.date_published || '2026',
                            proj.paper_link || '',
                            proj.owner_id
                        ], function(insertErr) {
                            if (insertErr) console.error("Auto-Migration Bridge Failed:", insertErr);
                            else console.log(`Auto-Migrated ${proj.title} to ${targetTable}`);
                        });
                    }
                }
            });

            res.json({ message: 'FINAL APPROVAL GRANTED.' });
        }
    );
});

// --- ROMS Portal Routes (Phase 11 Integration) ---

function toDateStringFromParts(parts) {
    if (!Array.isArray(parts) || parts.length === 0) return '';
    const [year, month, day] = parts;
    if (!year) return '';
    if (!month) return `${year}`;
    if (!day) return `${String(year)}-${String(month).padStart(2, '0')}`;
    return `${String(year)}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function stripTags(text) {
    if (!text) return '';
    return String(text).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

app.get('/api/doi/extract', async (req, res) => {
    let { url } = req.query;
    if (!url) return res.status(400).json({ message: 'DOI or URL required.' });

    const doiMatch = url.match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
    const doi = doiMatch ? doiMatch[0] : url.trim();

    try {
        // Primary: Crossref
        const crossrefUrl = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
        // We use native node fetch (Node 18+)
        let response = await fetch(crossrefUrl);
        if (response.ok) {
            const data = await response.json();
            const msg = data.message || {};
            let authors = (msg.author || []).map(a => `${a.given || ''} ${a.family || ''}`.trim()).filter(Boolean).join(', ');
            let title = (msg.title || [])[0] || '';
            let source = (msg['container-title'] || [])[0] || '';
            const dateParts = msg['published-print']?.['date-parts']?.[0]
                || msg.published?.['date-parts']?.[0]
                || msg.issued?.['date-parts']?.[0]
                || [];
            const pubDate = toDateStringFromParts(dateParts);
            const keywords = (msg.subject || []).filter(Boolean).join(', ');
            const abstract = stripTags(msg.abstract || '');

            return res.json({
                doi: msg.DOI || doi, title, authors,
                affiliations: 'SSN College of Engineering', // Default affiliation from ROMS
                source, publisher: msg.publisher || '',
                publication_date: pubDate,
                abstract,
                keywords,
                url: msg.URL || '', volume_number: msg.volume || '', issue_number: msg.issue || '',
                page_or_article_id: msg.page || msg['article-number'] || '',
                issn_or_isbn: (msg.ISSN || []).join(', ') || (msg.ISBN || []).join(', '),
                conference_name: msg.event?.name || '',
                proceedings_title: source
            });
        }
        
        // Fallback: OpenAlex
        const openalexUrl = `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(doi)}`;
        response = await fetch(openalexUrl);
        if (response.ok) {
            const data = await response.json();
            let authors = (data.authorships || []).map(a => a.author?.display_name).filter(Boolean).join(', ');
            const keywords = (data.concepts || []).slice(0, 8).map(c => c.display_name).filter(Boolean).join(', ');
            const abstract = stripTags(data.abstract_inverted_index
                ? Object.entries(data.abstract_inverted_index)
                    .flatMap(([word, positions]) => (positions || []).map((pos) => ({ word, pos })))
                    .sort((a, b) => a.pos - b.pos)
                    .map((item) => item.word)
                    .join(' ')
                : ''
            );
            return res.json({
                doi: (data.doi || doi).replace('https://doi.org/', ''),
                title: data.display_name, authors,
                affiliations: 'OpenAlex Sourced',
                source: data.primary_location?.source?.display_name || '',
                publication_date: data.publication_date || '',
                abstract,
                keywords,
                url: data.primary_location?.landing_page_url || '',
                volume_number: data.biblio?.volume || '', issue_number: data.biblio?.issue || '',
                page_or_article_id: data.biblio?.first_page ? `${data.biblio.first_page}-${data.biblio.last_page || ''}` : '',
                conference_name: data.primary_location?.source?.display_name || '',
                proceedings_title: data.primary_location?.source?.display_name || ''
            });
        }
        res.status(404).json({ message: 'DOI metadata not found on Crossref or OpenAlex.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to extract DOI metadata', error: err.message });
    }
});

const allAsync = (query, params = []) => new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const getAsync = (query, params = []) => new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => (err ? reject(err) : resolve(row)));
});

const runAsync = (query, params = []) => new Promise((resolve, reject) => {
    db.run(query, params, function onRun(err) {
        if (err) return reject(err);
        resolve({ changes: this.changes, lastID: this.lastID });
    });
});

const researchTables = {
    journals: {
        table: 'journal_publications',
        hasIndexing: true,
        hasConferenceScope: false,
        titleField: 'article_title',
        sourceField: 'journal_title',
        dateField: 'publication_date',
        requiredFields: ['article_title', 'authors', 'affiliations', 'journal_title'],
        allowedFields: ['article_title', 'authors', 'affiliations', 'orcid_ids', 'journal_title', 'volume_number', 'issue_number', 'page_or_article_id', 'doi', 'publication_date', 'indexing', 'quartile', 'publisher', 'url']
    },
    conferences: {
        table: 'conference_publications',
        hasIndexing: true,
        hasConferenceScope: true,
        titleField: 'paper_title',
        sourceField: 'conference_title',
        dateField: 'created_at',
        requiredFields: ['conference_title', 'paper_title', 'authors', 'affiliations'],
        allowedFields: ['conference_title', 'paper_title', 'authors', 'affiliations', 'conference_scope', 'indexing', 'doi', 'volume_issue_series', 'page_or_article_id', 'issn_or_isbn', 'quartile', 'publisher', 'url']
    },
    articles: {
        table: 'articles',
        hasIndexing: true,
        hasConferenceScope: false,
        titleField: 'article_title',
        sourceField: 'publication_source',
        dateField: 'publication_date',
        requiredFields: ['article_title', 'authors', 'affiliations', 'publication_source'],
        allowedFields: ['article_title', 'authors', 'affiliations', 'doi', 'publication_source', 'publication_date', 'indexing', 'quartile', 'publisher', 'url', 'abstract', 'keywords']
    },
    inproceedings: {
        table: 'inproceedings',
        hasIndexing: true,
        hasConferenceScope: true,
        titleField: 'paper_title',
        sourceField: 'conference_name',
        dateField: 'conference_date',
        requiredFields: ['paper_title', 'authors', 'affiliations', 'conference_name', 'conference_location', 'proceedings_title'],
        allowedFields: ['paper_title', 'authors', 'affiliations', 'conference_name', 'conference_location', 'conference_scope', 'conference_date', 'proceedings_title', 'editors', 'volume_or_series_number', 'page_or_article_id', 'doi', 'isbn_or_issn', 'indexing', 'quartile', 'publisher', 'url']
    }
};

const isResearchAdmin = (role) => role === 'HOD' || role === 'Professor';

function getResearchFilters(config, req) {
    const where = [];
    const params = [];
    const q = (req.query.q || '').trim();
    const source = (req.query.source || '').trim();
    const author = (req.query.author || '').trim();
    const affiliation = (req.query.affiliation || '').trim();
    const publisher = (req.query.publisher || '').trim();
    const conferenceScope = (req.query.conferenceScope || '').trim();
    const addedByRole = (req.query.addedByRole || '').trim();
    const quartile = (req.query.quartile || '').trim();
    const indexing = (req.query.indexing || '').trim();
    const hasDoi = (req.query.hasDoi || '').trim().toLowerCase();
    const hasUrl = (req.query.hasUrl || '').trim().toLowerCase();
    const hasAbstract = (req.query.hasAbstract || '').trim().toLowerCase();
    const hasKeywords = (req.query.hasKeywords || '').trim().toLowerCase();
    const mineOnly = String(req.query.mineOnly || '').toLowerCase() === 'true';
    const fromYear = parseInt(req.query.fromYear, 10);
    const toYear = parseInt(req.query.toYear, 10);
    const addedBy = parseInt(req.query.addedBy, 10);

    if (q) {
        const like = `%${q}%`;
        where.push(`(
            t.${config.titleField} LIKE ?
            OR t.authors LIKE ?
            OR t.${config.sourceField} LIKE ?
            OR IFNULL(t.doi, '') LIKE ?
            OR IFNULL(t.affiliations, '') LIKE ?
        )`);
        params.push(like, like, like, like, like);
    }

    if (quartile) {
        where.push('t.quartile = ?');
        params.push(quartile);
    }

    if (source) {
        where.push(`t.${config.sourceField} LIKE ?`);
        params.push(`%${source}%`);
    }
    if (author) {
        where.push('t.authors LIKE ?');
        params.push(`%${author}%`);
    }
    if (affiliation) {
        where.push('IFNULL(t.affiliations, \'\') LIKE ?');
        params.push(`%${affiliation}%`);
    }
    if (publisher && config.allowedFields.includes('publisher')) {
        where.push('IFNULL(t.publisher, \'\') LIKE ?');
        params.push(`%${publisher}%`);
    }

    if (config.hasIndexing && indexing) {
        where.push('t.indexing = ?');
        params.push(indexing);
    }
    if (config.hasConferenceScope && conferenceScope) {
        where.push('t.conference_scope = ?');
        params.push(conferenceScope);
    }
    if (addedByRole) {
        where.push('u.role = ?');
        params.push(addedByRole);
    }

    if (hasDoi === 'true') where.push('IFNULL(t.doi, \'\') <> \'\'');
    if (hasDoi === 'false') where.push('IFNULL(t.doi, \'\') = \'\'');
    if (hasUrl === 'true' && config.allowedFields.includes('url')) where.push('IFNULL(t.url, \'\') <> \'\'');
    if (hasUrl === 'false' && config.allowedFields.includes('url')) where.push('IFNULL(t.url, \'\') = \'\'');
    if (hasAbstract === 'true' && config.allowedFields.includes('abstract')) where.push('IFNULL(t.abstract, \'\') <> \'\'');
    if (hasAbstract === 'false' && config.allowedFields.includes('abstract')) where.push('IFNULL(t.abstract, \'\') = \'\'');
    if (hasKeywords === 'true' && config.allowedFields.includes('keywords')) where.push('IFNULL(t.keywords, \'\') <> \'\'');
    if (hasKeywords === 'false' && config.allowedFields.includes('keywords')) where.push('IFNULL(t.keywords, \'\') = \'\'');

    if (!Number.isNaN(addedBy)) {
        where.push('t.added_by = ?');
        params.push(addedBy);
    }

    if (mineOnly) {
        where.push('t.added_by = ?');
        params.push(req.user.id);
    }

    const yearExpr = `CAST(substr(COALESCE(NULLIF(t.${config.dateField}, ''), t.created_at), 1, 4) AS INTEGER)`;
    if (!Number.isNaN(fromYear)) {
        where.push(`${yearExpr} >= ?`);
        params.push(fromYear);
    }
    if (!Number.isNaN(toYear)) {
        where.push(`${yearExpr} <= ?`);
        params.push(toYear);
    }

    return { where, params };
}

function sanitizeResearchPayload(payload, config) {
    const data = {};
    config.allowedFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(payload, field)) {
            data[field] = payload[field];
        }
    });
    return data;
}

async function fetchResearchRows(route, req) {
    const config = researchTables[route];
    const { where, params } = getResearchFilters(config, req);
    const sortDir = String(req.query.sortDir || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const allowedSort = new Set([config.titleField, config.sourceField, config.dateField, 'quartile', 'created_at']);
    const sortByCandidate = String(req.query.sortBy || 'created_at');
    const sortBy = allowedSort.has(sortByCandidate) ? sortByCandidate : 'created_at';

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = (page - 1) * limit;

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const baseFrom = `FROM ${config.table} t LEFT JOIN users u ON u.id = t.added_by ${whereSql}`;

    const countRow = await getAsync(`SELECT COUNT(*) as total ${baseFrom}`, params);
    const rows = await allAsync(
        `SELECT t.*, u.name AS added_by_name, u.role AS added_by_role ${baseFrom}
         ORDER BY t.${sortBy} ${sortDir}, t.id DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    const filterRows = await allAsync(
        `SELECT DISTINCT t.quartile, ${
            config.hasIndexing ? 't.indexing,' : ''
        } CAST(substr(COALESCE(NULLIF(t.${config.dateField}, ''), t.created_at), 1, 4) AS INTEGER) AS year
         FROM ${config.table} t
         WHERE 1 = 1`,
        []
    );

    return {
        data: rows.map((row) => ({
            ...row,
            can_edit: isResearchAdmin(req.user.role) || row.added_by === req.user.id,
            can_delete: isResearchAdmin(req.user.role) || row.added_by === req.user.id
        })),
        pagination: {
            total: countRow?.total || 0,
            page,
            limit,
            pages: Math.max(1, Math.ceil((countRow?.total || 0) / limit))
        },
        filters: {
            quartiles: [...new Set(filterRows.map((r) => r.quartile).filter(Boolean))].sort(),
            years: [...new Set(filterRows.map((r) => r.year).filter((y) => Number.isInteger(y)))].sort((a, b) => b - a),
            indexing: config.hasIndexing
                ? [...new Set(filterRows.map((r) => r.indexing).filter(Boolean))].sort()
                : []
        }
    };
}

app.get('/api/research/analytics', authenticateToken, async (req, res) => {
    try {
        const requestedTypes = String(req.query.types || '')
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
        const routes = requestedTypes.length
            ? Object.keys(researchTables).filter((route) => requestedTypes.includes(route))
            : Object.keys(researchTables);

        if (routes.length === 0) {
            return res.status(400).json({ message: 'Invalid type filter supplied.' });
        }

        const results = await Promise.all(routes.map(async (route) => {
            const config = researchTables[route];
            const { where, params } = getResearchFilters(config, req);
            const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
            const rows = await allAsync(
                `SELECT t.*, u.name AS added_by_name, u.role AS added_by_role FROM ${config.table} t
                 LEFT JOIN users u ON u.id = t.added_by
                 ${whereSql}`,
                params
            );
            return { route, rows, config };
        }));

        const dataByType = {};
        let allRows = [];
        results.forEach(({ route, rows }) => {
            dataByType[route] = rows;
            allRows = allRows.concat(rows.map((r) => ({ ...r, __type: route })));
        });

        const totals = {
            journals: (dataByType.journals || []).length,
            conferences: (dataByType.conferences || []).length,
            articles: (dataByType.articles || []).length,
            inproceedings: (dataByType.inproceedings || []).length
        };
        totals.overall = totals.journals + totals.conferences + totals.articles + totals.inproceedings;

        const quartileMap = { Q1: 0, Q2: 0, Q3: 0, Q4: 0, NA: 0 };
        allRows.forEach((row) => {
            const q = row.quartile || 'NA';
            if (!Object.prototype.hasOwnProperty.call(quartileMap, q)) quartileMap.NA += 1;
            else quartileMap[q] += 1;
        });
        const quartileDistribution = Object.keys(quartileMap).map((q) => ({ name: q, count: quartileMap[q] }));

        const indexingMap = { Scopus: 0, 'Web of Science': 0, None: 0 };
        allRows.forEach((row) => {
            const idx = row.indexing || 'None';
            indexingMap[idx] = (indexingMap[idx] || 0) + 1;
        });
        const indexingDistribution = Object.keys(indexingMap).map((name) => ({ name, count: indexingMap[name] }));

        const contributors = {};
        const roleMap = { HOD: 0, Professor: 0, Scholar: 0, Student: 0, Other: 0 };
        const sourceMap = {};
        const conferenceScopeMap = { International: 0, National: 0, Normal: 0 };
        allRows.forEach((row) => {
            const key = `${row.added_by || 0}`;
            if (!contributors[key]) {
                contributors[key] = { added_by: row.added_by, added_by_name: row.added_by_name || 'Unknown', count: 0 };
            }
            contributors[key].count += 1;

            const role = row.added_by_role || 'Other';
            if (!Object.prototype.hasOwnProperty.call(roleMap, role)) roleMap.Other += 1;
            else roleMap[role] += 1;

            const sourceName = row.journal_title || row.publication_source || row.conference_title || row.conference_name || '';
            if (sourceName) sourceMap[sourceName] = (sourceMap[sourceName] || 0) + 1;

            const scope = row.conference_scope || '';
            if (scope && Object.prototype.hasOwnProperty.call(conferenceScopeMap, scope)) {
                conferenceScopeMap[scope] += 1;
            }
        });
        const topContributors = Object.values(contributors).sort((a, b) => b.count - a.count).slice(0, 7);
        const roleDistribution = Object.keys(roleMap).map((name) => ({ name, count: roleMap[name] })).filter((r) => r.count > 0);
        const topSources = Object.entries(sourceMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
        const conferenceScopeDistribution = Object.keys(conferenceScopeMap).map((name) => ({ name, count: conferenceScopeMap[name] })).filter((r) => r.count > 0);

        const yearlyMap = {};
        results.forEach(({ route, rows, config }) => {
            rows.forEach((row) => {
                const rawDate = row[config.dateField] || row.created_at || '';
                const year = parseInt(String(rawDate).slice(0, 4), 10);
                if (Number.isNaN(year)) return;
                if (!yearlyMap[year]) {
                    yearlyMap[year] = { year, journals: 0, conferences: 0, articles: 0, inproceedings: 0, total: 0 };
                }
                yearlyMap[year][route] += 1;
                yearlyMap[year].total += 1;
            });
        });
        const yearlyTrend = Object.values(yearlyMap).sort((a, b) => a.year - b.year);

        const doiCount = allRows.filter((r) => String(r.doi || '').trim() !== '').length;
        const urlCount = allRows.filter((r) => String(r.url || '').trim() !== '').length;
        const abstractCount = allRows.filter((r) => String(r.abstract || '').trim() !== '').length;
        const keywordCount = allRows.filter((r) => String(r.keywords || '').trim() !== '').length;
        const q1q2Count = allRows.filter((r) => r.quartile === 'Q1' || r.quartile === 'Q2').length;
        const indexedCount = allRows.filter((r) => ['Scopus', 'Web of Science'].includes(r.indexing)).length;

        const pct = (value) => (totals.overall > 0 ? Number(((value / totals.overall) * 100).toFixed(1)) : 0);
        const qualityMetrics = {
            doiCoverage: pct(doiCount),
            urlCoverage: pct(urlCount),
            abstractCoverage: pct(abstractCount),
            keywordCoverage: pct(keywordCount),
            q1q2Share: pct(q1q2Count),
            indexedShare: pct(indexedCount)
        };

        const filterOptions = {
            quartiles: [...new Set(allRows.map((r) => r.quartile).filter(Boolean))].sort(),
            years: [...new Set(yearlyTrend.map((r) => r.year))].sort((a, b) => b - a),
            indexing: [...new Set(allRows.map((r) => r.indexing).filter(Boolean))].sort(),
            conferenceScopes: [...new Set(allRows.map((r) => r.conference_scope).filter(Boolean))].sort(),
            publishers: [...new Set(allRows.map((r) => r.publisher).filter(Boolean))].sort().slice(0, 80),
            contributors: topContributors.map((c) => ({ id: c.added_by, name: c.added_by_name })),
            roles: [...new Set(allRows.map((r) => r.added_by_role).filter(Boolean))].sort(),
            types: routes
        };

        res.json({
            totals,
            byType: [
                { name: 'Journals', value: totals.journals },
                { name: 'Conferences', value: totals.conferences },
                { name: 'Articles', value: totals.articles },
                { name: 'In-proceedings', value: totals.inproceedings }
            ],
            quartileDistribution,
            indexingDistribution,
            conferenceScopeDistribution,
            roleDistribution,
            topSources,
            yearlyTrend,
            topContributors,
            qualityMetrics,
            filterOptions
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to load research analytics', error: error.message });
    }
});

Object.keys(researchTables).forEach((route) => {
    const config = researchTables[route];

    app.get(`/api/${route}`, authenticateToken, async (req, res) => {
        try {
            const data = await fetchResearchRows(route, req);
            res.json(data);
        } catch (error) {
            res.status(500).json({ message: 'Database error', error: error.message });
        }
    });

    app.post(`/api/${route}`, authenticateToken, async (req, res) => {
        try {
            const data = sanitizeResearchPayload(req.body, config);
            for (const field of config.requiredFields) {
                if (!data[field] || !String(data[field]).trim()) {
                    return res.status(400).json({ message: `Field "${field}" is required.` });
                }
            }

            data.added_by = req.user.id;
            const keys = Object.keys(data);
            const placeholders = keys.map(() => '?').join(', ');
            const values = keys.map((k) => data[k]);
            const result = await runAsync(`INSERT INTO ${config.table} (${keys.join(', ')}) VALUES (${placeholders})`, values);
            res.status(201).json({ id: result.lastID, message: 'Research record created successfully.' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to add research record', error: error.message });
        }
    });

    app.put(`/api/${route}/:id`, authenticateToken, async (req, res) => {
        try {
            const record = await getAsync(`SELECT * FROM ${config.table} WHERE id = ?`, [req.params.id]);
            if (!record) return res.status(404).json({ message: 'Record not found.' });

            if (!isResearchAdmin(req.user.role) && record.added_by !== req.user.id) {
                return res.status(403).json({ message: 'You can edit only your own research entries.' });
            }

            const updates = sanitizeResearchPayload(req.body, config);
            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ message: 'No editable fields supplied.' });
            }

            const setClause = Object.keys(updates).map((key) => `${key} = ?`).join(', ');
            const values = [...Object.values(updates), req.params.id];
            await runAsync(`UPDATE ${config.table} SET ${setClause} WHERE id = ?`, values);
            res.json({ message: 'Research record updated successfully.' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to update research record', error: error.message });
        }
    });

    app.delete(`/api/${route}/:id`, authenticateToken, async (req, res) => {
        try {
            const record = await getAsync(`SELECT id, added_by FROM ${config.table} WHERE id = ?`, [req.params.id]);
            if (!record) return res.status(404).json({ message: 'Record not found.' });

            if (!isResearchAdmin(req.user.role) && record.added_by !== req.user.id) {
                return res.status(403).json({ message: 'You can delete only your own research entries.' });
            }

            await runAsync(`DELETE FROM ${config.table} WHERE id = ?`, [req.params.id]);
            res.json({ message: 'Research record deleted.' });
        } catch (error) {
            res.status(500).json({ message: 'Delete failed', error: error.message });
        }
    });
});

app.get('/api/projects', authenticateToken, (req, res) => {
    const { role, id } = req.user;

    // Professors and HODs should see ALL patents regardless of ownership to track institutional IP
    let query = "SELECT * FROM projects";
    let params = [];

    if (role === 'HOD') {
        // HOD sees everything in HOD stage or Approved, plus ALL patents
        query += " WHERE review_stage = 'HOD' OR review_stage = 'Approved' OR type = 'Patent'";
    } else if (role === 'Professor') {
        // Professor sees their own, their mentees, plus ALL patents (if approved/granted ideally, but showing all for visibility)
        query += " WHERE mentor_id = ? OR owner_id = ? OR type = 'Patent'";
        params = [id, id];
    } else {
        // Students only see their own
        query += " WHERE owner_id = ?";
        params = [id];
    }

    db.all(`${query} ORDER BY created_at DESC`, params, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        // deduplicate just in case the OR conditions overlap
        const unique = Array.from(new Set(rows.map(r => r.id)))
            .map(id => rows.find(r => r.id === id));
        res.json(unique);
    });
});

app.get('/api/mentors', authenticateToken, (req, res) => {
    db.all("SELECT id, name, email FROM users WHERE role = 'Professor'", [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows);
    });
});

// Seed function
async function seedData() {
    const roles = ['HOD', 'Professor', 'Scholar', 'Student'];
    const hashedPw = await bcrypt.hash('password123', 10);

    // Ensure users exist
    for (const role of roles) {
        const username = role.toLowerCase();
        await new Promise(resolve => {
            db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
                if (!row) {
                    db.run("INSERT INTO users (email, username, password, role, name, verified) VALUES (?, ?, ?, ?, ?, 1)",
                        [`${username}@ssn.edu.in`, username, hashedPw, role, `Dr. ${role} Instance`], () => resolve());
                } else resolve();
            });
        });
    }

    // Seed robust Phase 6 Examples mapping exactly to user request
    const examples = [
        // PATENTS
        { title: 'AI-Based Smart Grid Optimization', type: 'Patent', review_stage: 'Approved', status: 'Filed', owner_id: 2, patent_no: 'APP-2024-1192', inventors: 'Dr. Professor Instance, John Doe', date_filed: '2024-05-12', proof_link: 'http://example.com/proof1.pdf' },
        { title: 'Novel Polymer Synthesis Method', type: 'Patent', review_stage: 'Approved', status: 'Published', owner_id: 2, patent_no: 'PUB-2023-8841', inventors: 'Dr. Alan Turing Faculty', date_filed: '2023-01-15', date_published: '2024-06-20', proof_link: 'http://example.com/proof2.pdf' },
        { title: 'Quantum Encryption Hardware', type: 'Patent', review_stage: 'Approved', status: 'Granted', owner_id: 1, patent_no: 'GRT-2022-0051', inventors: 'Dr. HOD Instance, Alan Smith', date_filed: '2020-11-10', date_published: '2022-05-15', date_granted: '2025-01-10', proof_link: 'http://example.com/proof3.pdf' },

        // PUBLICATIONS (Professor own work, bypasses Student queue)
        { title: 'Deep Learning in Genomic Analysis', type: 'Publication', category: 'Paper', review_stage: 'Approved', status: 'Published', owner_id: 2, year: 2025, journal: 'IEEE Transactions on Neural Networks', paper_link: 'http://ieee.org/paper/123' },

        // PUBLICATIONS (Student work, pending)
        { title: 'Predictive Models for IoT Security', type: 'Publication', category: 'Proposal', review_stage: 'Professor', status: 'Pending', owner_id: 4, mentor_id: 2, year: 2026, abstract: 'Predictive models proposal.' },

        // TRADEMARKS & COPYRIGHTS
        { title: 'SSN Innovate Logo', type: 'Trademark', review_stage: 'Approved', status: 'Granted', owner_id: 1, year: 2024 },
        { title: 'Autonomous Vehicle Dataset', type: 'Copyright', review_stage: 'Approved', status: 'Published', owner_id: 2, year: 2025 }
    ];

    for (const exp of examples) {
        db.get("SELECT * FROM projects WHERE title = ?", [exp.title], (err, row) => {
            if (!row) {
                db.run(`
                    INSERT INTO projects (
                        title, type, category, review_stage, status, owner_id, mentor_id, year,
                        patent_no, inventors, date_filed, date_published, date_granted, proof_link,
                        journal, paper_link, abstract
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        exp.title, exp.type, exp.category || 'Paper', exp.review_stage, exp.status, exp.owner_id, exp.mentor_id || null, exp.year || 2026,
                        exp.patent_no || null, exp.inventors || null, exp.date_filed || null, exp.date_published || null, exp.date_granted || null, exp.proof_link || null,
                        exp.journal || null, exp.paper_link || null, exp.abstract || ''
                    ]
                );
            }
        });
    }

    // Seed initial notifications
    setTimeout(() => {
        db.get("SELECT count(*) as count FROM notifications", [], (err, res) => {
            if (res.count === 0) {
                createNotification(1, 'System update: Phase 6 Workflows deployed.', 'overview');
                createNotification(2, 'Welcome! You have new student proposals waiting in your queue.', 'approvals');
                createNotification(4, 'Reminder: Your mentor requires changes on your IoT Security proposal.', 'overview');
            }
        });
    }, 1000);

    // Seed ROMS Data for Analytical Density
    const seedRoms = (table, titleField, data) => {
        db.get(`SELECT count(*) as count FROM ${table}`, [], (err, res) => {
            if (res.count === 0) {
                const keys = Object.keys(data[0]);
                const placeholders = keys.map(() => '?').join(', ');
                const insertStmt = db.prepare(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`);
                data.forEach(item => {
                    const values = keys.map(k => item[k]);
                    insertStmt.run(values);
                });
                insertStmt.finalize();
            }
        });
    };

    seedRoms('journal_publications', 'article_title', [
        { article_title: 'Transformer Models in Quantum computing', authors: 'Turing A., Hopper G.', affiliations: 'Princeton', journal_title: 'Nature Physics', publication_date: '2025-10-12', doi: '10.1038/s41567-025-001', quartile: 'Q1', added_by: 2, indexing: 'Web of Science' },
        { article_title: 'Silicon Photonics for High-Speed Interconnects', authors: 'Noyce R., Moore G.', affiliations: 'Intel Labs', journal_title: 'IEEE Photonics Technology Letters', publication_date: '2024-03-22', doi: '10.1109/LPT.2024.12345', quartile: 'Q2', added_by: 2, indexing: 'Scopus' }
    ]);

    seedRoms('conference_publications', 'conference_title', [
        { conference_title: 'International Conference on Machine Learning (ICML)', conference_scope: 'International', paper_title: 'Scalable Graph Neural Networks', authors: 'Hinton G., LeCun Y.', affiliations: 'AI Labs', doi: '10.5555/icml.2025', indexing: 'Scopus', quartile: 'Q1', added_by: 1 },
        { conference_title: 'IEEE Virtual Reality 2024', conference_scope: 'International', paper_title: 'Haptic Feedback in Metaverse Architectures', authors: 'Carmack J.', affiliations: 'Oculus', doi: '10.1109/VR.2024.998', indexing: 'Web of Science', quartile: 'NA', added_by: 1 }
    ]);

    seedRoms('articles', 'article_title', [
        { article_title: 'Cybersecurity post-Quantum Era', authors: 'Rivest R., Shamir A.', affiliations: 'MIT', publication_source: 'Communications of the ACM', publication_date: '2026-01-05', doi: '10.1145/38291', indexing: 'Scopus', quartile: 'Q1', added_by: 2 }
    ]);

    seedRoms('inproceedings', 'paper_title', [
        { paper_title: 'Distributed Consensus Algorithms Optimization', authors: 'Lamport L.', affiliations: 'Microsoft Research', conference_name: 'Symposium on Principles of Distributed Computing', conference_scope: 'International', conference_location: 'NYC, USA', proceedings_title: 'PODC 2025', indexing: 'Web of Science', quartile: 'Q1', added_by: 2 }
    ]);
}

seedData();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
