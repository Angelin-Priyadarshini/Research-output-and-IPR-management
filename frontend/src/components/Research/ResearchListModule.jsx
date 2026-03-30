import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const ResearchListModule = ({ type, title, icon, endpoint }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000${endpoint}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('ssn_token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
            setItems(data);
        } else {
            console.error(data);
            setItems([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setItems([]);
        setLoading(false);
      });
  }, [endpoint]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', fontSize: '1.2rem', color: '#666' }}>Loading {title}...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--ssn-navy), var(--ssn-orange))', padding: '1rem', borderRadius: '16px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(0,31,103,0.2)' }}>
          {icon}
        </div>
        <div>
          <h2 style={{ fontSize: '2.4rem', fontWeight: '900', color: 'var(--ssn-navy)', letterSpacing: '-1px' }}>{title}</h2>
          <p style={{ color: '#666', fontSize: '1.1rem', marginTop: '0.2rem' }}>Total Institutional Directory of Verified {title}.</p>
        </div>
      </div>

      <div className="ssn-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '900px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <th style={{ padding: '0.85rem' }}>S.No</th>
              <th style={{ padding: '0.85rem', textAlign: 'left' }}>Title</th>
              <th style={{ padding: '0.85rem' }}>Authors</th>
              <th style={{ padding: '0.85rem' }}>Source / Journal</th>
              <th style={{ padding: '0.85rem' }}>Date</th>
              <th style={{ padding: '0.85rem' }}>Quartile</th>
              <th style={{ padding: '0.85rem' }}>DOI</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? items.map((p, idx) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }} className="table-row-hover">
                <td style={{ padding: '0.85rem', fontSize: '0.85rem' }}>{idx + 1}</td>
                <td style={{ padding: '0.85rem', fontWeight: '700', color: 'var(--ssn-navy)', textAlign: 'left', maxWidth: '300px' }}>
                    {p.article_title || p.conference_title || p.paper_title}
                </td>
                <td style={{ padding: '0.85rem', color: '#555', fontWeight: '600', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                    {p.authors || 'Unknown'}
                </td>
                <td style={{ padding: '0.85rem', fontSize: '0.8rem' }}>{p.journal_title || p.publication_source || p.conference_name || 'N/A'}</td>
                <td style={{ padding: '0.85rem', fontSize: '0.8rem', color: '#666' }}>
                  {p.publication_date || p.conference_date || new Date(p.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </td>
                <td style={{ padding: '0.85rem' }}>
                  <span style={{ 
                      background: p.quartile === 'Q1' ? '#dcfce7' : p.quartile === 'Q2' ? '#fef9c3' : p.quartile === 'NA' ? '#f1f5f9' : '#fee2e2',
                      color: p.quartile === 'Q1' ? '#166534' : p.quartile === 'Q2' ? '#854d0e' : p.quartile === 'NA' ? '#64748b' : '#991b1b',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '0.7rem'
                  }}>{p.quartile || 'NA'}</span>
                </td>
                <td style={{ padding: '0.85rem', fontSize: '0.75rem' }}>
                  {p.doi ? <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer" style={{ color: 'var(--ssn-orange)', fontWeight: 'bold' }}>{p.doi}</a> : '-'}
                </td>
              </tr>
            )) : (
              <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>No records found in {title} database.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResearchListModule;
