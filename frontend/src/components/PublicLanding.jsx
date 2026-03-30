import React, { useState, useEffect } from 'react';
import {
    BarChart3, BookOpen, ShieldCheck, Globe,
    ArrowRight, FileText, Award, Quote, TrendingUp
} from 'lucide-react';

const PublicLanding = ({ onLoginClick }) => {
    const [stats, setStats] = useState({ patents: 185, trademarks: 90, copyrights: 42, designs: 18 });

    useEffect(() => {
        fetch('http://localhost:5000/api/public/stats')
            .then(res => res.json())
            .then(data => {
                if (data) setStats({ patents: 185, trademarks: 90, copyrights: 42, designs: 18 }); // Mocking IPR stats overriding the generic ones
            });
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--ssn-gray)', position: 'relative', overflow: 'hidden' }}>
            {/* Hero Section */}
            <nav style={{ background: 'rgba(0, 51, 102, 0.8)', backdropFilter: 'blur(10px)', color: 'white', padding: '1.5rem 0', position: 'absolute', top: 0, width: '100%', zIndex: 10 }}>
                <div className="ssn-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: '900', fontSize: '1.6rem', letterSpacing: '-0.5px' }}>SSN <span style={{ color: 'var(--ssn-orange)' }}>PORTAL</span></div>
                    <button onClick={onLoginClick} className="ssn-button" style={{ background: 'var(--gradient-accent)', color: 'white' }}>
                        Institutional Login <ArrowRight size={18} />
                    </button>
                </div>
            </nav>

            <header className="mesh-bg" style={{ color: 'white', padding: '8rem 0 6rem 0', borderBottom: '4px solid var(--ssn-orange)', position: 'relative', overflow: 'hidden' }}>
                {/* Floating Abstract Elements */}
                <div className="floating-element" style={{ position: 'absolute', top: '20%', left: '10%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', filter: 'blur(20px)' }}></div>
                <div className="floating-element" style={{ position: 'absolute', bottom: '-10%', right: '5%', width: '400px', height: '400px', background: 'rgba(243, 129, 53, 0.1)', borderRadius: '50%', filter: 'blur(30px)', animationDelay: '2s' }}></div>
                <div className="floating-element" style={{ position: 'absolute', top: '40%', right: '20%', width: '100px', height: '100px', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '20px', transform: 'rotate(45deg)', animationDuration: '8s' }}></div>

                <div className="ssn-container" style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'inline-block', padding: '0.5rem 1.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '2rem', fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '1px' }}>ENTERPRISE IPR MANAGEMENT</div>
                    <h1 style={{ color: 'white', fontSize: '4.5rem', marginBottom: '1.5rem', fontWeight: '900', textShadow: '0 10px 30px rgba(0,0,0,0.3)', lineHeight: '1.1' }}>Institutional Innovation &<br /><span style={{ color: 'var(--ssn-orange)' }}>Intellectual Property</span></h1>
                    <p style={{ fontSize: '1.3rem', opacity: 0.9, maxWidth: '800px', margin: '0 auto', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                        Tracking the frontiers of institutional intellectual property, patents, and trademarks at SSN College of Engineering through a premium, centralized command center.
                    </p>
                </div>
            </header>

            <main className="ssn-container" style={{ padding: '4rem 0' }}>
                {/* Quick Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '4rem' }}>
                    <StatCard icon={<ShieldCheck size={28} />} value={stats.patents} label="Patents Filed" color="#0d47a1" />
                    <StatCard icon={<Award size={28} />} value={stats.trademarks} label="Registered Trademarks" color="var(--ssn-orange)" />
                    <StatCard icon={<FileText size={28} />} value={stats.copyrights} label="Copyrights" color="#7c3aed" />
                    <StatCard icon={<Globe size={28} />} value={stats.designs} label="Industrial Designs" color="#059669" />
                </div>

                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {/* IPR Highlights */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <Award size={24} color="var(--ssn-orange)" />
                        <h2 style={{ fontSize: '1.8rem', textAlign: 'center' }}>IPR Portfolio Highlights</h2>
                    </div>
                    <div className="ssn-card" style={{ background: 'var(--ssn-navy)', color: 'white', padding: '3rem' }}>
                        <h3 style={{ color: 'white', marginBottom: '2rem', textAlign: 'center', fontSize: '1.4rem' }}>Secured Intellectual Property</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <IPRItem label="Patents Granted" value="42" />
                            <IPRItem label="Trademarks Registered" value="90" />
                            <IPRItem label="Copyrights Applied" value="115" />
                            <IPRItem label="Industrial Designs" value="18" />
                        </div>
                        <button onClick={onLoginClick} style={{ marginTop: '3rem', width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            Secure Portal Login
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

const StatCard = ({ icon, value, label, color }) => (
    <div className="ssn-card" style={{ textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `linear-gradient(135deg, ${color || 'var(--ssn-navy)'}22, ${color || 'var(--ssn-navy)'}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: color || 'var(--ssn-navy)' }}>{icon}</div>
        <div style={{ fontSize: '2.5rem', fontWeight: '900', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.25rem' }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--ssn-text-light)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
    </div>
);

const IPRItem = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{label}</span>
        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{value}</span>
    </div>
);

export default PublicLanding;
