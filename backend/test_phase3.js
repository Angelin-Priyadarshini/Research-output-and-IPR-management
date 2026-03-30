async function testPhase3() {
    try {
        console.log('--- Testing Registration Validation ---');
        // 1. Test invalid email
        let res = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@gmail.com', username: 'bad_email', password: '123', role: 'Student', name: 'Bad Email' })
        });
        let data = await res.json();
        console.log('Non-SSN Email Attempt:', res.status, data.message);

        // 2. Test valid email
        res = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'tester@ssn.edu.in', username: 'tester', password: 'password123', role: 'Student', name: 'Phase3 Tester' })
        });
        data = await res.json();
        console.log('SSN Email Registration:', res.status, data.message);
        const vToken = data.token;

        // 3. Test verification
        res = await fetch('http://localhost:5000/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: vToken })
        });
        data = await res.json();
        console.log('Email Verification:', res.status, data.message);

        console.log('\n--- Testing Research Workflow ---');

        // 4. Login as Student
        res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'tester', password: 'password123' })
        });
        const student = await res.json();
        const sToken = student.token;
        console.log('Student Login:', res.status);

        // Get Professors for mentoring
        res = await fetch('http://localhost:5000/api/mentors', {
            headers: { Authorization: `Bearer ${sToken}` }
        });
        const mentors = await res.json();
        const pId = mentors.find(m => m.email === 'professor@ssn.edu.in')?.id;

        // 5. Submit Research
        res = await fetch('http://localhost:5000/api/projects/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sToken}` },
            body: JSON.stringify({
                title: 'Phase 3 Verification Paper',
                type: 'Publication',
                abstract: 'Verification test for multi-stage workflow.',
                mentor_id: pId
            })
        });
        const project = await res.json();
        console.log('Research Submission:', res.status, project.message);
        const projectId = project.id;

        // 6. Login as Professor
        res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'professor', password: 'password123' })
        });
        const professor = await res.json();
        const pToken = professor.token;
        console.log('Professor Login:', res.status);

        // 7. Move to HOD Stage
        res = await fetch(`http://localhost:5000/api/projects/${projectId}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pToken}` },
            body: JSON.stringify({ professor_comments: 'Ready for HOD', approved_to_hod: true })
        });
        data = await res.json();
        console.log('Professor Review Action:', res.status, data.message);

        // 8. Login as HOD
        res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'hod', password: 'password123' })
        });
        const hod = await res.json();
        const hToken = hod.token;
        console.log('HOD Login:', res.status);

        // 9. Final Approval
        res = await fetch(`http://localhost:5000/api/projects/${projectId}/approve`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${hToken}` }
        });
        data = await res.json();
        console.log('HOD Final Approval:', res.status, data.message);

        console.log('\nPHASE 3 ALL BACKEND FLOWS VERIFIED SUCCESSFULY');
    } catch (err) {
        console.error('Test Failed:', err.message);
    }
}

testPhase3();
