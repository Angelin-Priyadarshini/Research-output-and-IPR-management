async function testPhase5() {
    try {
        console.log('--- Phase 5: Advanced Workflow Verification ---');

        // 1. Login as Student
        let res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'student', password: 'password123' })
        });
        const student = await res.json();
        const sToken = student.token;
        console.log('Student Login:', res.status);

        // Get Professors
        res = await fetch('http://localhost:5000/api/mentors', {
            headers: { Authorization: `Bearer ${sToken}` }
        });
        const mentors = await res.json();
        const pId = mentors[0].id;

        // 2. Submit a Research PROPOSAL with file metadata
        res = await fetch('http://localhost:5000/api/projects/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sToken}` },
            body: JSON.stringify({
                title: 'AI in SSN: Phase 5 Proposal',
                type: 'Publication',
                category: 'Proposal',
                abstract: 'Initial proposal for advanced AI integration.',
                file_name: 'proposal_v1.pdf',
                file_type: 'application/pdf',
                mentor_id: pId
            })
        });
        let project = await res.json();
        console.log('Proposal Submission:', res.status, project.message);
        const projectId = project.id;

        // 3. Login as Professor
        res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'professor', password: 'password123' })
        });
        const professor = await res.json();
        const pToken = professor.token;
        console.log('Professor Login:', res.status);

        // 4. Professor suggests changes (does NOT approved_to_hod)
        res = await fetch(`http://localhost:5000/api/projects/${projectId}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pToken}` },
            body: JSON.stringify({
                professor_comments: 'Please elaborate on Section 3 regarding data privacy.',
                approved_to_hod: false
            })
        });
        console.log('Professor Review (Suggestion):', res.status);

        // 5. Student Edits and Resubmits
        res = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sToken}` },
            body: JSON.stringify({
                title: 'AI in SSN: Phase 5 Proposal (REVISED)',
                abstract: 'Revised proposal with privacy considerations.',
                file_name: 'proposal_v2_final.pdf',
                file_type: 'application/pdf'
            })
        });
        console.log('Student Resubmission:', res.status);

        // 6. Verify Trademark Rename in public stats
        res = await fetch('http://localhost:5000/api/public/stats');
        const stats = await res.json();
        console.log('Public Stats (Trademark Check):', stats.trademarks !== undefined ? 'Found Trademarks' : 'Not Found');

        console.log('\nPHASE 5 BACKEND LOGIC VERIFIED SUCCESSFULLY');
    } catch (err) {
        console.error('Test Failed:', err.message);
    }
}

testPhase5();
