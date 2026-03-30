import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, Info } from 'lucide-react';

const NotificationCenter = ({ isOpen, onClose, onNavigate }) => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetch('http://localhost:5000/api/notifications', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('ssn_token')}` }
            })
                .then(res => res.json())
                .then(data => setNotifications(Array.isArray(data) ? data : []))
                .catch(() => setNotifications([]));
        }
    }, [isOpen]);

    const handleNotifClick = (notif) => {
        if (notif.link) {
            onNavigate(notif.link);
            onClose();
            // Mark as read in a fully developed app
            fetch('http://localhost:5000/api/notifications/mark-read', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('ssn_token')}` }
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'absolute',
            top: '60px',
            right: '20px',
            width: '320px',
            background: 'white',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            borderRadius: '12px',
            overflow: 'hidden',
            zIndex: 1000,
            border: '1px solid var(--ssn-border)'
        }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--ssn-border)', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Notifications</span>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No new notifications</div>
                ) : notifications.map(notif => (
                    <div
                        key={notif.id}
                        onClick={() => handleNotifClick(notif)}
                        style={{ padding: '1rem', borderBottom: '1px solid var(--ssn-border)', display: 'flex', gap: '0.75rem', transition: 'background 0.2s', cursor: 'pointer', background: notif.is_read ? 'white' : '#f0f4ff' }}
                        className="notif-item hover:bg-gray-50"
                    >
                        <Info size={18} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--ssn-text)', fontWeight: notif.is_read ? 'normal' : 'bold' }}>{notif.message}</div>
                            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.2rem' }}>{new Date(notif.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ padding: '0.75rem', textAlign: 'center', background: 'var(--ssn-gray)' }}>
                <button style={{ background: 'none', border: 'none', fontSize: '0.85rem', color: 'var(--ssn-navy)', cursor: 'pointer', fontWeight: '600' }}>Mark all as read</button>
            </div>
        </div>
    );
};

export default NotificationCenter;
