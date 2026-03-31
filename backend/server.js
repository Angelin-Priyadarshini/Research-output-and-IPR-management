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

                    // --- Phase 6 Extension: Auto-Migration to Institutional Directory ---
                    if (proj.type === 'Journal Publication') {
                        db.run("INSERT INTO journal_publications (article_title, authors, affiliations, journal_title, doi, publication_date, quartile, added_by) VALUES (?, ?, 'SSN College of Engineering', ?, ?, ?, 'NA', ?)",
                            [proj.title, proj.inventors || 'Unknown', proj.journal || 'Unknown', proj.paper_link || '', proj.date_published || new Date().toISOString().split('T')[0], proj.owner_id]);
                    } else if (proj.type === 'Conference') {
                        db.run("INSERT INTO conference_publications (conference_title, paper_title, authors, affiliations, doi, quartile, added_by) VALUES (?, ?, ?, 'SSN College of Engineering', ?, 'NA', ?)",
                            [proj.journal || 'Unknown', proj.title, proj.inventors || 'Unknown', proj.paper_link || '', proj.owner_id]);
                    } else if (proj.type === 'Article') {
                        db.run("INSERT INTO articles (article_title, authors, affiliations, publication_source, publication_date, doi, quartile, added_by) VALUES (?, ?, 'SSN College of Engineering', ?, ?, ?, 'NA', ?)",
                            [proj.title, proj.inventors || 'Unknown', proj.journal || 'Unknown', proj.date_published || new Date().toISOString().split('T')[0], proj.paper_link || '', proj.owner_id]);
                    } else if (proj.type === 'In-proceeding') {
                        db.run("INSERT INTO inproceedings (paper_title, authors, affiliations, proceedings_title, quartile, added_by) VALUES (?, ?, 'SSN College of Engineering', ?, 'NA', ?)",
                            [proj.title, proj.inventors || 'Unknown', proj.journal || 'Unknown', proj.owner_id]);
                    }
                }
            });

            res.json({ message: 'FINAL APPROVAL GRANTED.' });
        }
    );
});

// --- ROMS Portal Routes (Phase 11 Integration) ---

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
            let pub_date = msg['published-print']?.['date-parts']?.[0]?.[0] || msg.issued?.['date-parts']?.[0]?.[0] || '';

            return res.json({
                doi: msg.DOI || doi, title, authors,
                affiliations: 'SSN College of Engineering', // Default affiliation from ROMS
                source, publisher: msg.publisher || '',
                publication_date: pub_date ? String(pub_date) : '',
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
            return res.json({
                doi: (data.doi || doi).replace('https://doi.org/', ''),
                title: data.display_name, authors,
                affiliations: 'OpenAlex Sourced',
                source: data.primary_location?.source?.display_name || '',
                publication_date: data.publication_date || '',
                url: data.primary_location?.landing_page_url || '',
                volume_number: data.biblio?.volume || '', issue_number: data.biblio?.issue || '',
                page_or_article_id: data.biblio?.first_page ? `${data.biblio.first_page}-${data.biblio.last_page}` : ''
            });
        }
        res.status(404).json({ message: 'DOI metadata not found on Crossref or OpenAlex.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to extract DOI metadata', error: err.message });
    }
});

// Dynamic CRUD for ROMS Tables: journals, conferences, articles, inproceedings
const romsTables = [
    { route: 'journals', table: 'journal_publications' },
    { route: 'conferences', table: 'conference_publications' },
    { route: 'articles', table: 'articles' },
    { route: 'inproceedings', table: 'inproceedings' }
];

romsTables.forEach(({ route, table }) => {
    // GET ALL
    app.get(`/api/${route}`, authenticateToken, (req, res) => {
        let query = `SELECT * FROM ${table} ORDER BY created_at DESC`;
        let params = [];
        if (req.user.role === 'Student' || req.user.role === 'Faculty' || req.user.role === 'Professor') {
            // Usually Faculty/Student see their own or all? Let's show all for portal transparency, 
            // but ROMS restricts. We'll show all to match our Strategic Dashboard requirements.
        }
        db.all(query, params, (err, rows) => {
            if (err) return res.status(500).json({ message: 'Database error', error: err.message });
            res.json(rows);
        });
    });

    // POST / CREATE
    app.post(`/api/${route}`, authenticateToken, (req, res) => {
        const data = { ...req.body, added_by: req.user.id };
        const keys = Object.keys(data);
        const placeholders = keys.map(() => '?').join(', ');
        const values = Object.values(data);
        const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
        
        db.run(query, values, function(err) {
            if (err) return res.status(500).json({ message: 'Failed to add record', error: err.message });
            res.status(201).json({ id: this.lastID, message: 'Record added successfully' });
        });
    });

    // DELETE
    app.delete(`/api/${route}/:id`, authenticateToken, (req, res) => {
        db.run(`DELETE FROM ${table} WHERE id = ?`, [req.params.id], function(err) {
            if (err) return res.status(500).json({ message: 'Delete failed' });
            res.json({ message: 'Record deleted.' });
        });
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
        { conference_title: 'International Conference on Machine Learning (ICML)', paper_title: 'Scalable Graph Neural Networks', authors: 'Hinton G., LeCun Y.', affiliations: 'AI Labs', doi: '10.5555/icml.2025', quartile: 'Q1', added_by: 1 },
        { conference_title: 'IEEE Virtual Reality 2024', paper_title: 'Haptic Feedback in Metaverse Architectures', authors: 'Carmack J.', affiliations: 'Oculus', doi: '10.1109/VR.2024.998', quartile: 'NA', added_by: 1 }
    ]);

    seedRoms('articles', 'article_title', [
        { article_title: 'Cybersecurity post-Quantum Era', authors: 'Rivest R., Shamir A.', affiliations: 'MIT', publication_source: 'Communications of the ACM', publication_date: '2026-01-05', doi: '10.1145/38291', quartile: 'Q1', added_by: 2 }
    ]);

    seedRoms('inproceedings', 'paper_title', [
        { paper_title: 'Distributed Consensus Algorithms Optimization', authors: 'Lamport L.', affiliations: 'Microsoft Research', conference_name: 'Symposium on Principles of Distributed Computing', conference_location: 'NYC, USA', proceedings_title: 'PODC 2025', quartile: 'Q1', added_by: 2 }
    ]);
}

seedData();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
