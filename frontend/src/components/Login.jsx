import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight, ShieldCheck, GraduationCap, Briefcase, Users, Mail, CheckCircle } from 'lucide-react';

const Login = ({ onLoginSuccess, onGuestView }) => {
    const { login, register } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [role, setRole] = useState('Student');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const roles = [
        { id: 'HOD', icon: <ShieldCheck size={20} />, label: 'HOD' },
        { id: 'Professor', icon: <Briefcase size={20} />, label: 'Professor' },
        { id: 'Scholar', icon: <Users size={20} />, label: 'Scholar' },
        { id: 'Student', icon: <GraduationCap size={20} />, label: 'Student' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isRegister) {
                if (!email.endsWith('@ssn.edu.in')) {
                    throw new Error('Please use your institutional @ssn.edu.in email.');
                }
                await register({ email, username, password, role, name });
                setSuccess('Registration successful! Please check your email for the verification link.');
                setIsRegister(false);
            } else {
                await login(username || email, password);
                onLoginSuccess();
            }
        } catch (err) {
            setError(err.message || 'Action failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ssn-gray)' }}>
            <div className="ssn-card" style={{ width: '500px', padding: '3rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ width: '64px', height: '64px', background: 'var(--ssn-navy)', borderRadius: '16px', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        {isRegister ? <Mail size={32} /> : <Lock size={32} />}
                    </div>
                    <h2 style={{ fontSize: '1.8rem', color: 'var(--ssn-navy)' }}>{isRegister ? 'Create Account' : 'Institutional Login'}</h2>
                    <p style={{ color: 'var(--ssn-text-light)', marginTop: '0.5rem' }}>Research & IPR Management System</p>
                </div>

                <div style={{ display: 'flex', background: '#f0f0f0', padding: '4px', borderRadius: '8px', marginBottom: '2rem' }}>
                    <button
                        onClick={() => setIsRegister(false)}
                        style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '6px', background: !isRegister ? 'white' : 'transparent', fontWeight: 'bold', cursor: 'pointer' }}
                    >Login</button>
                    <button
                        onClick={() => setIsRegister(true)}
                        style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: '6px', background: isRegister ? 'white' : 'transparent', fontWeight: 'bold', cursor: 'pointer' }}
                    >Register</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '2rem' }}>
                    {roles.map(r => (
                        <div
                            key={r.id}
                            onClick={() => setRole(r.id)}
                            style={{
                                padding: '0.75rem', textAlign: 'center', borderRadius: '8px', cursor: 'pointer',
                                background: role === r.id ? 'var(--ssn-sky)' : 'white',
                                border: `2px solid ${role === r.id ? 'var(--ssn-navy)' : 'var(--ssn-border)'}`,
                                transition: 'var(--transition)'
                            }}
                        >
                            <div style={{ color: role === r.id ? 'var(--ssn-navy)' : '#666', marginBottom: '0.25rem', display: 'flex', justifyContent: 'center' }}>{r.icon}</div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{r.label}</div>
                        </div>
                    ))}
                </div>

                {success && (
                    <div style={{ background: '#d1fae5', color: '#065f46', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <CheckCircle size={18} /> {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <div style={{ marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid var(--ssn-border)' }}>
                                <User icon size={18} color="#666" />
                                <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} required />
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid var(--ssn-border)' }}>
                            <Mail size={18} color="#666" />
                            <input
                                type="email"
                                placeholder="College Email (@ssn.edu.in)"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                                required
                            />
                        </div>
                    </div>

                    {!isRegister && (
                        <div style={{ marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid var(--ssn-border)' }}>
                                <User size={18} color="#666" />
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                                />
                            </div>
                        </div>
                    )}

                    {isRegister && (
                        <div style={{ marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid var(--ssn-border)' }}>
                                <User size={18} color="#666" />
                                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} required />
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid var(--ssn-border)' }}>
                            <Lock size={18} color="#666" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                                required
                            />
                        </div>
                    </div>

                    {error && <div style={{ color: '#e63946', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="ssn-button ssn-button-primary"
                        style={{ width: '100%', padding: '1rem' }}
                    >
                        {loading ? 'Processing...' : (isRegister ? `Register as ${role}` : `Login as ${role}`)} <ArrowRight size={18} />
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button
                        onClick={onGuestView}
                        style={{ background: 'none', border: 'none', color: 'var(--ssn-navy)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', textDecoration: 'underline' }}
                    >
                        Continue as Guest (Public View)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
