import React from 'react';
import {
    LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Target, ShieldCheck, Zap } from 'lucide-react';

const StrategicDashboard = () => {
    const patentData = [
        { name: 'Disclosures', count: 280, fill: '#0d47a1' },
        { name: 'Filed', count: 185, fill: '#003366' },
        { name: 'Published', count: 120, fill: '#f57c00' },
        { name: 'Examination', count: 65, fill: '#ff9800' },
        { name: 'Granted', count: 42, fill: '#4ade80' },
    ];

    const trademarkTrend = [
        { year: '2021', count: 12 },
        { year: '2022', count: 25 },
        { year: '2023', count: 38 },
        { year: '2024', count: 52 },
        { year: '2025', count: 74 },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* HOD Command Banner */}
            <div style={{
                background: 'linear-gradient(135deg, #001f40 0%, #003366 50%, #0d47a1 100%)',
                borderRadius: '20px',
                padding: '2.5rem 3rem',
                position: 'relative',
                overflow: 'hidden',
                color: 'white',
                boxShadow: '0 20px 60px rgba(0, 31, 64, 0.4)'
            }}>
                <div style={{ position: 'absolute', right: '-20px', top: '-40px', opacity: 0.06 }}>
                    <Zap size={250} />
                </div>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #f57c00, #ffb74d, #f57c00)' }} />

                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'inline-block', padding: '0.35rem 1rem', background: 'rgba(245,124,0,0.3)', border: '1px solid rgba(245,124,0,0.5)', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '2px', color: '#ffb74d', marginBottom: '1rem' }}>
                        STRATEGIC INTELLIGENCE CENTRE
                    </div>
                    <h2 style={{ color: 'white', fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-0.5px', marginBottom: '0.5rem' }}>
                        HOD Command Overview
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', maxWidth: '500px' }}>
                        Live analytics for the institutional IP pipeline — from disclosure to commercialization.
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                        {[
                            { label: 'Total Disclosures', value: '280', color: '#60a5fa' },
                            { label: 'Patents Granted', value: '42', color: '#4ade80' },
                            { label: 'Trademarks Active', value: '74', color: '#f97316' },
                            { label: 'Conversion Rate', value: '15%', color: '#c084fc' },
                        ].map(s => (
                            <div key={s.label} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '12px', padding: '0.75rem 1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: '0.72rem', opacity: 0.65, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

                {/* IP Funnel Chart */}
                <div className="ssn-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <ShieldCheck size={20} color="var(--ssn-orange)" />
                        <h3 style={{ fontSize: '1.1rem' }}>IP Pipeline Funnel</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {patentData.map((stage) => {
                            const width = (stage.count / patentData[0].count) * 100;
                            return (
                                <div key={stage.name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                                        <span style={{ color: '#444' }}>{stage.name}</span>
                                        <span style={{ color: stage.fill, fontWeight: '900' }}>{stage.count}</span>
                                    </div>
                                    <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '12px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${width}%`, height: '100%',
                                            background: `linear-gradient(90deg, ${stage.fill}, ${stage.fill}99)`,
                                            borderRadius: '6px',
                                            transition: 'width 0.6s ease-in-out'
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                        <div style={{ color: '#059669', fontWeight: '900', fontSize: '1.6rem' }}>15%</div>
                        <div style={{ color: '#065f46', fontSize: '0.8rem', fontWeight: '700' }}>Disclosure → Grant Conversion</div>
                    </div>
                </div>

                {/* Trademark Trend Chart */}
                <div className="ssn-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <TrendingUp size={20} color="var(--ssn-navy)" />
                        <h3 style={{ fontSize: '1.1rem' }}>Trademark Registrations Trend</h3>
                    </div>
                    <div style={{ height: '280px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trademarkTrend}>
                                <defs>
                                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#003366" />
                                        <stop offset="100%" stopColor="#f57c00" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                                <Line type="monotone" dataKey="count" stroke="url(#lineGrad)" strokeWidth={4} dot={{ r: 7, fill: '#f57c00', stroke: 'white', strokeWidth: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Strategic Priorities */}
            <div className="ssn-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
                    <Target size={20} color="var(--ssn-orange)" />
                    <h3 style={{ fontSize: '1.1rem' }}>Strategic Priorities — Annual Targets</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    <PriorityItem label="International Patents" target={15} current={6} color="var(--ssn-navy)" />
                    <PriorityItem label="Registered Trademarks" target={100} current={74} color="var(--ssn-orange)" />
                    <PriorityItem label="Industry Licensing Deals" target={40} current={32} color="#059669" />
                </div>
            </div>
        </div>
    );
};

const PriorityItem = ({ label, target, current, color }) => {
    const percent = Math.min((current / target) * 100, 100);
    return (
        <div style={{ background: 'var(--ssn-gray)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--ssn-border)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--ssn-text-light)', fontWeight: '600', marginBottom: '0.75rem' }}>{label}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: '900', color }}>{current}</span>
                <span style={{ fontSize: '0.85rem', color: '#aaa', fontWeight: '600' }}>/ {target}</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${percent}%`, height: '100%', background: `linear-gradient(90deg, ${color}, ${color}90)`, borderRadius: '4px', transition: 'width 0.8s ease-in-out' }} />
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.75rem', fontWeight: '800', color, marginTop: '0.5rem' }}>{Math.round(percent)}%</div>
        </div>
    );
};

export default StrategicDashboard;
