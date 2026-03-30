/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('ssn_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed');

        localStorage.setItem('ssn_token', data.token);
        localStorage.setItem('ssn_user', JSON.stringify(data.user));
        setUser(data.user);
        return data.user;
    };

    const register = async (userData) => {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Registration failed');
        return data;
    };

    const verify = async (token) => {
        const response = await fetch('http://localhost:5000/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Verification failed');
        return data;
    };

    const logout = () => {
        localStorage.removeItem('ssn_token');
        localStorage.removeItem('ssn_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, verify, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
