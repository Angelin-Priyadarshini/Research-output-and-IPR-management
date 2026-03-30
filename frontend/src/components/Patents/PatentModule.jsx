import React, { useState } from 'react';
import { FileText, Users, Calendar, Link as LinkIcon, CheckCircle, Globe, Award, Download, ChevronDown, ChevronUp, Beaker, FileSignature, Landmark, FileSearch } from 'lucide-react';
import { exportToPDF, exportToWord } from '../../utils/ExportUtils';

const PatentModule = () => {
    const [activeTab, setActiveTab] = useState('filed');

    const patents = {
        filed: [
            { id: 1, title: 'Quantum Encryption Hardware', appNo: '202341001234', inventors: 'Dr. S. Kamal, Anirudh R.', date: '2023-11-12', status: 'Filed' }
        ],
        published: [
            { id: 2, title: 'Low-cost Smart Irrigation System', appNo: '202241056789', faculty: 'Dr. Meena', dateFiled: '2022-05-20', datePub: '2024-01-05', status: 'Published' }
        ],
        granted: [
            { id: 3, title: 'AI-driven Crop Disease Detection', appNo: '202141098765', inventors: 'Dr. Rajan, Sneha V.', dateFiled: '2021-03-15', datePub: '2022-09-10', dateGrant: '2025-02-10', patentNo: 'PAT-887766', status: 'Granted' }
        ]
    };

    const handleExportPDF = () => {
        const data = patents[activeTab];
        exportToPDF(data, `patents_${activeTab} _exported.pdf`);
    };

    const handleExportWord = () => {
        const data = patents[activeTab];
        exportToWord(data, `patents_${activeTab} _exported.docx`);
    };

    return (
        <div className="patent-module">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--ssn-border)' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <TabButton active={activeTab === 'filed'} onClick={() => setActiveTab('filed')} label="Patent Filed" />
                    <TabButton active={activeTab === 'published'} onClick={() => setActiveTab('published')} label="Patent Published" />
                    <TabButton active={activeTab === 'granted'} onClick={() => setActiveTab('granted')} label="Patent Grant" />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={handleExportPDF}
                        className="ssn-button"
                        style={{ background: 'var(--ssn-sky)', color: 'var(--ssn-navy)', marginBottom: '0.5rem' }}
                    >
                        <Download size={18} /> Export PDF
                    </button>
                    <button
                        onClick={handleExportWord}
                        className="ssn-button"
                        style={{ background: 'var(--ssn-sky)', color: 'var(--ssn-navy)', marginBottom: '0.5rem' }}
                    >
                        <Download size={18} /> Export Word
                    </button>
                </div>
            </div>

            <div className="tab-content">
                {activeTab === 'filed' && <PatentTable data={patents.filed} type="filed" />}
                {activeTab === 'published' && <PatentTable data={patents.published} type="published" />}
                {activeTab === 'granted' && <PatentTable data={patents.granted} type="granted" />}
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: 'none',
            color: active ? 'var(--ssn-navy)' : 'var(--ssn-text-light)',
            fontWeight: active ? 'bold' : 'normal',
            borderBottom: active ? '3px solid var(--ssn-navy)' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'var(--transition)'
        }}
    >
        {label}
    </button>
);

const PatentTable = ({ data, type }) => {
    const [expandedRow, setExpandedRow] = useState(null);

    const stages = [
        { key: 'Disclosure', icon: <Beaker size={18} />, label: 'Invention Disclosure' },
        { key: 'Drafting', icon: <FileSignature size={18} />, label: 'Patent Drafting' },
        { key: 'Filed', icon: <Landmark size={18} />, label: 'Patent Filed' },
        { key: 'Published', icon: <Globe size={18} />, label: 'Patent Published' },
        { key: 'Examination', icon: <FileSearch size={18} />, label: 'FER / Examination' },
        { key: 'Granted', icon: <Award size={18} />, label: 'Patent Granted' }
    ];

    const getActiveIndex = (status) => {
        const mapping = { 'Drafting': 1, 'Filed': 2, 'Published': 3, 'Examination': 4, 'Granted': 5 };
        return mapping[status] || 0; // Default to Disclosure
    };

    return (
        <div className="ssn-card" style={{ padding: '0', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead style={{ background: 'var(--ssn-gray)' }}>
                    <tr style={{ textAlign: 'left' }}>
                        <th style={{ ...thStyle, width: '40px' }}></th>
                        <th style={thStyle}>S.No</th>
                        <th style={thStyle}>Title of Invention</th>
                        <th style={thStyle}>Patent/App No.</th>
                        <th style={thStyle}>{type === 'published' ? 'Name of Faculty' : 'Name of Inventors'}</th>
                        <th style={thStyle}>Date of Filing</th>
                        {type !== 'filed' && <th style={thStyle}>Date of Publication</th>}
                        {type === 'granted' && <th style={thStyle}>Date of Grant</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => {
                        const isExpanded = expandedRow === item.id;
                        const activeIndex = getActiveIndex(item.status);

                        return (
                            <React.Fragment key={item.id}>
                                <tr onClick={() => setExpandedRow(isExpanded ? null : item.id)} style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--ssn-border)', cursor: 'pointer', background: isExpanded ? 'var(--ssn-sky)' : 'white', transition: 'var(--transition)' }}>
                                    <td style={{ ...tdStyle, color: 'var(--ssn-navy)' }}>{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</td>
                                    <td style={tdStyle}>{index + 1}</td>
                                    <td style={{ ...tdStyle, fontWeight: '700', color: 'var(--ssn-navy)' }}>{item.title}</td>
                                    <td style={{ ...tdStyle, fontWeight: '600', color: '#555' }}>{item.patentNo || item.appNo}</td>
                                    <td style={tdStyle}>{item.faculty || item.inventors}</td>
                                    <td style={tdStyle}>{item.date || item.dateFiled}</td>
                                    {type !== 'filed' && <td style={tdStyle}>{item.datePub}</td>}
                                    {type === 'granted' && <td style={{ ...tdStyle, fontWeight: '900', color: '#059669' }}>{item.dateGrant}</td>}
                                </tr>
                                {isExpanded && (
                                    <tr>
                                        <td colSpan="8" style={{ padding: '0 2rem 2rem 2rem', background: 'var(--ssn-sky)', borderBottom: '1px solid var(--ssn-border)' }}>
                                            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: 'var(--shadow-sm)' }}>
                                                <h4 style={{ marginBottom: '2rem', color: 'var(--ssn-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    Visual Patent Lifecycle
                                                </h4>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                                                    {/* Progress Line */}
                                                    <div style={{ position: 'absolute', top: '24px', left: '40px', right: '40px', height: '4px', background: 'var(--ssn-gray)', zIndex: 0, borderRadius: '2px' }}>
                                                        <div style={{ width: `${(activeIndex / (stages.length - 1)) * 100}%`, height: '100%', background: 'var(--gradient-primary)', borderRadius: '2px', transition: 'width 0.5s ease-in-out' }}></div>
                                                    </div>

                                                    {/* Stepper Dots */}
                                                    {stages.map((stage, i) => {
                                                        const isCompleted = i <= activeIndex;
                                                        const isCurrent = i === activeIndex;
                                                        return (
                                                            <div key={stage.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, position: 'relative', width: '120px' }}>
                                                                <div style={{
                                                                    width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    background: isCompleted ? (isCurrent ? 'var(--ssn-orange)' : 'var(--ssn-navy)') : 'white',
                                                                    color: isCompleted ? 'white' : '#aaa',
                                                                    border: isCompleted ? 'border 2px solid white' : '2px solid var(--ssn-border)',
                                                                    boxShadow: isCurrent ? '0 0 0 4px rgba(243, 129, 53, 0.2)' : 'none',
                                                                    transition: 'all 0.3s ease'
                                                                }}>
                                                                    {stage.icon}
                                                                </div>
                                                                <div style={{
                                                                    marginTop: '1rem', fontSize: '0.8rem', fontWeight: isCurrent ? '800' : '600',
                                                                    color: isCurrent ? 'var(--ssn-navy)' : (isCompleted ? '#444' : '#aaa'),
                                                                    textAlign: 'center'
                                                                }}>
                                                                    {stage.label}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const thStyle = { padding: '1rem', borderBottom: '1px solid var(--ssn-border)', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--ssn-text-light)' };
const tdStyle = { padding: '1rem', fontSize: '0.9rem' };

export default PatentModule;
