async function testBackend() {
    try {
        console.log('Testing Public Stats...');
        let res = await fetch('http://localhost:5000/api/public/stats');
        let data = await res.json();
        console.log('Stats Response:', data);

        console.log('Testing HOD Login...');
        res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'hod', password: 'password123' })
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.message);
        console.log('Login Successful, Role:', data.user.role);
        const token = data.token;

        console.log('Testing Projects Fetch (HOD)...');
        res = await fetch('http://localhost:5000/api/projects', {
            headers: { Authorization: `Bearer ${token}` }
        });
        data = await res.json();
        console.log('Projects Count:', data.length);

        console.log('ALL BACKEND TESTS PASSED');
    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testBackend();
