import React, { useState } from 'react';
import { ScanSearch, FileDown, CheckCircle, Search, ExternalLink, Hash } from 'lucide-react';

const DoiScraperModule = () => {
  const [doiInput, setDoiInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleExtract = async (e) => {
    e.preventDefault();
    if (!doiInput) return;
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`http://localhost:5000/api/doi/extract?url=${encodeURIComponent(doiInput)}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('ssn_token')}` }
      });
      if (!res.ok) throw new Error('Failed to resolve DOI or URL on Crossref/OpenAlex databases.');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--ssn-navy), var(--ssn-orange))', padding: '1rem', borderRadius: '16px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(0,31,103,0.2)' }}>
          <ScanSearch size={32} />
        </div>
        <div>
          <h2 style={{ fontSize: '2.4rem', fontWeight: '900', color: 'var(--ssn-navy)', letterSpacing: '-1px' }}>Universal DOI Scraper</h2>
          <p style={{ color: '#666', fontSize: '1.1rem', marginTop: '0.2rem' }}>Instantly extract verified metadata from any Digital Object Identifier.</p>
        </div>
      </div>

      <div className="ssn-card" style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleExtract} style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={22} style={{ position: 'absolute', left: '16px', top: '18px', color: '#888' }} />
            <input 
              type="text" 
              placeholder="Paste DOI link (e.g. 10.1109/TNNLS.2023.32145) or regular URL..." 
              value={doiInput}
              onChange={(e) => setDoiInput(e.target.value)}
              style={{ width: '100%', padding: '1.25rem 1rem 1.25rem 3.5rem', borderRadius: '14px', border: '2px solid transparent', background: '#f5f7fa', fontSize: '1.1rem', transition: 'all 0.3s' }}
              className="doi-input-glow"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="ssn-button ssn-button-primary" style={{ padding: '0 2rem', borderRadius: '14px', fontSize: '1.1rem', fontWeight: '800' }}>
            {loading ? 'Scanning API...' : 'Extract Data'}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '12px', border: '1px solid #f87171' }}>
            <div style={{ fontWeight: 'bold' }}>Extraction Error</div>
            <div style={{ fontSize: '0.9rem' }}>{error}</div>
          </div>
        )}

        {result && (
          <div className="fade-in" style={{ marginTop: '3rem', borderTop: '2px dashed #eee', paddingTop: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', color: '#059669', padding: '0.5rem 1rem', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <CheckCircle size={16} /> Data Successfully Resolved
              </div>
              <a href={result.url || `https://doi.org/${result.doi}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ssn-navy)', fontWeight: 'bold', textDecoration: 'none' }}>
                View Original <ExternalLink size={16} />
              </a>
            </div>

            <h3 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--ssn-navy)', marginBottom: '1.5rem', lineHeight: '1.3' }}>{result.title}</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Authors</div>
                <div style={{ color: 'var(--ssn-navy)', fontWeight: '600', fontSize: '1.1rem' }}>{result.authors || 'Unknown'}</div>
                
                <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem', marginTop: '1.5rem' }}>Source / Journal</div>
                <div style={{ color: 'var(--ssn-navy)', fontWeight: '600', fontSize: '1.1rem' }}>{result.source || 'N/A'}</div>

                <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem', marginTop: '1.5rem' }}>Publisher</div>
                <div style={{ color: 'var(--ssn-navy)', fontWeight: '600', fontSize: '1.1rem' }}>{result.publisher || 'N/A'}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', alignItems: 'center' }}>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 'bold' }}>Date Published</div>
                  <div style={{ fontWeight: '700', color: 'var(--ssn-navy)' }}>{result.publication_date || '-'}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', alignItems: 'center' }}>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 'bold' }}>Volume & Issue</div>
                  <div style={{ fontWeight: '700', color: 'var(--ssn-navy)' }}>Vol {result.volume_number || '-'} / Issue {result.issue_number || '-'}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', alignItems: 'center' }}>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 'bold' }}>ISSN / ISBN</div>
                  <div style={{ fontWeight: '700', color: 'var(--ssn-navy)' }}>{result.issn_or_isbn || '-'}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: 'auto', background: 'rgba(243, 112, 33, 0.1)', color: 'var(--ssn-orange)', padding: '1rem', borderRadius: '12px', fontWeight: 'bold' }}>
                  <Hash size={18} /> {result.doi}
                </div>
              </div>
            </div>
            
            <p style={{ marginTop: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
              Note: When filing a new disclosure, providing this DOI will automatically populate the submission form.
            </p>
          </div>
        )}
      </div>
      
      {/* Dynamic CSS injection for input focus glow */}
      <style>{`
        .doi-input-glow:focus {
          outline: none;
          background: white !important;
          border-color: var(--ssn-orange) !important;
          box-shadow: 0 0 0 4px rgba(243, 112, 33, 0.15) !important;
        }
      `}</style>
    </div>
  );
};

export default DoiScraperModule;
