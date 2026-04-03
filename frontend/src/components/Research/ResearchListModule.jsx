import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit, Plus, Search, Trash2, X } from 'lucide-react';

const tableConfigs = {
  '/api/journals': {
    titleField: 'article_title',
    sourceField: 'journal_title',
    dateField: 'publication_date',
    formFields: ['article_title', 'authors', 'affiliations', 'journal_title', 'volume_number', 'issue_number', 'page_or_article_id', 'publication_date', 'doi', 'quartile', 'indexing', 'publisher', 'url']
  },
  '/api/conferences': {
    titleField: 'paper_title',
    sourceField: 'conference_title',
    dateField: 'created_at',
    formFields: ['conference_title', 'conference_scope', 'paper_title', 'authors', 'affiliations', 'indexing', 'doi', 'volume_issue_series', 'page_or_article_id', 'issn_or_isbn', 'quartile', 'publisher', 'url']
  },
  '/api/articles': {
    titleField: 'article_title',
    sourceField: 'publication_source',
    dateField: 'publication_date',
    formFields: ['article_title', 'authors', 'affiliations', 'publication_source', 'publication_date', 'doi', 'indexing', 'quartile', 'publisher', 'url', 'abstract', 'keywords']
  },
  '/api/inproceedings': {
    titleField: 'paper_title',
    sourceField: 'conference_name',
    dateField: 'conference_date',
    formFields: ['paper_title', 'authors', 'affiliations', 'conference_name', 'conference_scope', 'conference_location', 'conference_date', 'proceedings_title', 'indexing', 'doi', 'volume_or_series_number', 'page_or_article_id', 'isbn_or_issn', 'quartile', 'publisher', 'url']
  }
};

const fieldLabels = {
  article_title: 'Article Title',
  conference_title: 'Conference Title',
  paper_title: 'Paper Title',
  authors: 'Authors',
  affiliations: 'Affiliations',
  journal_title: 'Journal Title',
  publication_source: 'Publication Source',
  publication_date: 'Publication Date',
  conference_name: 'Conference Name',
  conference_scope: 'Conference Scope',
  conference_location: 'Conference Location',
  conference_date: 'Conference Date',
  proceedings_title: 'Proceedings Title',
  volume_number: 'Volume Number',
  issue_number: 'Issue Number',
  page_or_article_id: 'Page / Article ID',
  volume_issue_series: 'Volume / Issue / Series',
  issn_or_isbn: 'ISSN / ISBN',
  volume_or_series_number: 'Volume / Series Number',
  isbn_or_issn: 'ISBN / ISSN',
  doi: 'DOI',
  quartile: 'Quartile',
  indexing: 'Indexing',
  publisher: 'Publisher',
  url: 'URL',
  abstract: 'Abstract',
  keywords: 'Keywords'
};

const defaultForm = {
  article_title: '',
  conference_title: '',
  paper_title: '',
  authors: '',
  affiliations: '',
  journal_title: '',
  publication_source: '',
  publication_date: '',
  conference_name: '',
  conference_scope: 'Normal',
  conference_location: '',
  conference_date: '',
  proceedings_title: '',
  volume_number: '',
  issue_number: '',
  page_or_article_id: '',
  volume_issue_series: '',
  issn_or_isbn: '',
  volume_or_series_number: '',
  isbn_or_issn: '',
  doi: '',
  quartile: 'NA',
  indexing: 'None',
  publisher: '',
  url: '',
  abstract: '',
  keywords: ''
};

const ResearchListModule = ({ title, icon, endpoint, moduleKey, user }) => {
  const config = tableConfigs[endpoint];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [doiLoading, setDoiLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');

  const [search, setSearch] = useState('');
  const [quartile, setQuartile] = useState('');
  const [indexing, setIndexing] = useState('');
  const [fromYear, setFromYear] = useState('');
  const [toYear, setToYear] = useState('');
  const [mineOnly, setMineOnly] = useState(false);
  const [meta, setMeta] = useState({ filters: { quartiles: [], years: [], indexing: [] }, pagination: { total: 0 } });

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage('');
    setMessageType('error');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (quartile) params.set('quartile', quartile);
      if (indexing) params.set('indexing', indexing);
      if (fromYear) params.set('fromYear', fromYear);
      if (toYear) params.set('toYear', toYear);
      if (mineOnly) params.set('mineOnly', 'true');
      params.set('limit', '200');

      const url = `http://localhost:5000${endpoint}?${params.toString()}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('ssn_token')}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load records.');
      setItems(Array.isArray(data.data) ? data.data : []);
      setMeta({ filters: data.filters || { quartiles: [], years: [], indexing: [] }, pagination: data.pagination || { total: 0 } });
    } catch (err) {
      setItems([]);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, fromYear, indexing, mineOnly, quartile, search, toYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handler = (event) => {
      if (!event?.detail?.moduleKey || event.detail.moduleKey === moduleKey) {
        setEditing(null);
        setFormData(defaultForm);
        setShowForm(true);
      }
    };
    window.addEventListener('research-open-create', handler);
    return () => window.removeEventListener('research-open-create', handler);
  }, [moduleKey]);

  const openEdit = (item) => {
    setEditing(item);
    setFormData({ ...defaultForm, ...item });
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setFormData(defaultForm);
    setShowForm(false);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setMessageType('error');
    try {
      const payload = {};
      config.formFields.forEach((field) => {
        if (formData[field] !== undefined && formData[field] !== null && String(formData[field]).trim() !== '') {
          payload[field] = formData[field];
        }
      });

      const url = editing ? `http://localhost:5000${endpoint}/${editing.id}` : `http://localhost:5000${endpoint}`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('ssn_token')}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed.');
      closeForm();
      await loadData();
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  const normalizeDate = (value) => {
    if (!value) return '';
    const str = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    if (/^\d{4}-\d{2}$/.test(str)) return `${str}-01`;
    if (/^\d{4}$/.test(str)) return `${str}-01-01`;
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
      const [d, m, y] = str.split('/');
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return '';
  };

  const inferConferenceScope = (...values) => {
    const merged = values.filter(Boolean).join(' ').toLowerCase();
    if (merged.includes('international')) return 'International';
    if (merged.includes('national')) return 'National';
    return 'Normal';
  };

  const getAutofillPayload = (scraped) => {
    const common = {
      doi: scraped.doi || formData.doi || '',
      authors: scraped.authors || '',
      affiliations: scraped.affiliations || '',
      publisher: scraped.publisher || '',
      url: scraped.url || ''
    };

    if (endpoint === '/api/journals') {
      return {
        ...common,
        article_title: scraped.title || '',
        journal_title: scraped.source || '',
        volume_number: scraped.volume_number || '',
        issue_number: scraped.issue_number || '',
        page_or_article_id: scraped.page_or_article_id || '',
        publication_date: normalizeDate(scraped.publication_date)
      };
    }

    if (endpoint === '/api/conferences') {
      return {
        ...common,
        paper_title: scraped.title || '',
        conference_title: scraped.conference_name || scraped.source || '',
        conference_scope: inferConferenceScope(scraped.conference_name, scraped.source, scraped.title),
        volume_issue_series: [scraped.volume_number, scraped.issue_number].filter(Boolean).join(' / '),
        page_or_article_id: scraped.page_or_article_id || '',
        issn_or_isbn: scraped.issn_or_isbn || ''
      };
    }

    if (endpoint === '/api/articles') {
      return {
        ...common,
        article_title: scraped.title || '',
        publication_source: scraped.source || '',
        publication_date: normalizeDate(scraped.publication_date),
        abstract: scraped.abstract || '',
        keywords: scraped.keywords || ''
      };
    }

    return {
      ...common,
      paper_title: scraped.title || '',
      conference_name: scraped.conference_name || scraped.source || '',
      conference_scope: inferConferenceScope(scraped.conference_name, scraped.source, scraped.title),
      proceedings_title: scraped.proceedings_title || scraped.source || '',
      conference_date: normalizeDate(scraped.publication_date),
      conference_location: scraped.conference_location || '',
      volume_or_series_number: scraped.volume_number || '',
      page_or_article_id: scraped.page_or_article_id || '',
      isbn_or_issn: scraped.issn_or_isbn || ''
    };
  };

  const handleDoiAutofill = async () => {
    if (!formData.doi || !String(formData.doi).trim()) {
      setMessage('Enter DOI or DOI URL to autofill.');
      setMessageType('error');
      return;
    }

    setDoiLoading(true);
    setMessage('');
    setMessageType('error');
    try {
      const res = await fetch(`http://localhost:5000/api/doi/extract?url=${encodeURIComponent(formData.doi.trim())}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('ssn_token')}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'DOI extraction failed.');

      const auto = getAutofillPayload(data);
      setFormData((prev) => ({ ...prev, ...auto }));
      setMessage('DOI metadata loaded. You can still edit all fields manually before saving.');
      setMessageType('success');
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    } finally {
      setDoiLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this research entry?')) return;
    setMessage('');
    setMessageType('error');
    try {
      const res = await fetch(`http://localhost:5000${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('ssn_token')}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed.');
      await loadData();
    } catch (err) {
      setMessage(err.message);
      setMessageType('error');
    }
  };

  const visibleFields = useMemo(() => config.formFields, [config.formFields]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', fontSize: '1.2rem', color: '#666' }}>Loading {title}...</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--ssn-navy), var(--ssn-orange))', padding: '1rem', borderRadius: '16px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(0,31,103,0.2)' }}>
            {icon}
          </div>
          <div>
            <h2 style={{ fontSize: '2.1rem', fontWeight: '900', color: 'var(--ssn-navy)' }}>{title}</h2>
            <p style={{ color: '#666' }}>{meta.pagination.total || items.length} outputs available.</p>
          </div>
        </div>
        <button className="ssn-button ssn-button-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Add {title.split(' ')[0]}
        </button>
      </div>

      <div className="ssn-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: '0.8rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '11px', color: '#64748b' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, source, DOI, authors..." style={{ width: '100%', padding: '0.55rem 0.7rem 0.55rem 2rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          </div>
          <select value={quartile} onChange={(e) => setQuartile(e.target.value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <option value="">All Quartiles</option>
            {(meta.filters.quartiles || ['Q1', 'Q2', 'Q3', 'Q4', 'NA']).map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
          <select value={indexing} onChange={(e) => setIndexing(e.target.value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <option value="">All Indexing</option>
            {(meta.filters.indexing || ['Scopus', 'Web of Science', 'None']).map((idx) => <option key={idx} value={idx}>{idx}</option>)}
          </select>
          <select value={fromYear} onChange={(e) => setFromYear(e.target.value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <option value="">From Year</option>
            {(meta.filters.years || []).map((y) => <option key={`from-${y}`} value={y}>{y}</option>)}
          </select>
          <select value={toYear} onChange={(e) => setToYear(e.target.value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <option value="">To Year</option>
            {(meta.filters.years || []).map((y) => <option key={`to-${y}`} value={y}>{y}</option>)}
          </select>
          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', fontWeight: '700' }}>
            <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
            My uploads
          </label>
        </div>
      </div>

      {message && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            borderRadius: '8px',
            background: messageType === 'success' ? '#dcfce7' : '#fee2e2',
            color: messageType === 'success' ? '#166534' : '#991b1b'
          }}
        >
          {message}
        </div>
      )}

      <div className="ssn-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '1080px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', color: '#666', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.85rem' }}>S.No</th>
              <th style={{ padding: '0.85rem', textAlign: 'left' }}>Title</th>
              <th style={{ padding: '0.85rem' }}>Authors</th>
              <th style={{ padding: '0.85rem' }}>Source</th>
              <th style={{ padding: '0.85rem' }}>Date</th>
              <th style={{ padding: '0.85rem' }}>Quartile</th>
              <th style={{ padding: '0.85rem' }}>DOI</th>
              <th style={{ padding: '0.85rem' }}>Uploaded By</th>
              <th style={{ padding: '0.85rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? items.map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee' }} className="table-row-hover">
                <td style={{ padding: '0.85rem' }}>{idx + 1}</td>
                <td style={{ padding: '0.85rem', textAlign: 'left', fontWeight: '700', maxWidth: '280px' }}>{item[config.titleField]}</td>
                <td style={{ padding: '0.85rem', fontSize: '0.85rem', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.authors || '-'}</td>
                <td style={{ padding: '0.85rem', fontSize: '0.82rem' }}>
                  <div>{item[config.sourceField] || '-'}</div>
                  {(item.conference_scope || item.indexing) && (
                    <div style={{ marginTop: '0.2rem', color: '#64748b', fontSize: '0.72rem' }}>
                      {[item.conference_scope, item.indexing].filter(Boolean).join(' | ')}
                    </div>
                  )}
                </td>
                <td style={{ padding: '0.85rem', fontSize: '0.82rem' }}>{item[config.dateField] || (item.created_at ? String(item.created_at).slice(0, 10) : '-')}</td>
                <td style={{ padding: '0.85rem' }}><span style={{ padding: '0.2rem 0.55rem', borderRadius: '7px', fontWeight: '700', background: '#f1f5f9' }}>{item.quartile || 'NA'}</span></td>
                <td style={{ padding: '0.85rem', fontSize: '0.75rem' }}>{item.doi ? <a href={`https://doi.org/${item.doi}`} target="_blank" rel="noreferrer">{item.doi}</a> : '-'}</td>
                <td style={{ padding: '0.85rem', fontSize: '0.78rem' }}>{item.added_by_name || `User #${item.added_by}`}</td>
                <td style={{ padding: '0.85rem' }}>
                  {item.can_edit && <button onClick={() => openEdit(item)} style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', marginRight: '0.6rem' }} title="Edit"><Edit size={16} /></button>}
                  {item.can_delete && <button onClick={() => handleDelete(item.id)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer' }} title="Delete"><Trash2 size={16} /></button>}
                </td>
              </tr>
            )) : (
              <tr><td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>No records found in {title}.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="ssn-card" style={{ width: 'min(900px, 96vw)', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{editing ? 'Edit Research Output' : `Add New ${title}`}</h3>
              <button onClick={closeForm} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={submitForm}>
              <div style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #dbeafe', borderRadius: '10px', background: '#f8fbff' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.7rem', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.35rem', color: '#475569' }}>DOI / DOI URL Autofill</label>
                    <input
                      type="text"
                      value={formData.doi || ''}
                      placeholder="e.g. 10.1109/TNNLS.2023.32145 or full DOI URL"
                      onChange={(e) => setFormData((prev) => ({ ...prev, doi: e.target.value }))}
                      style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                    />
                  </div>
                  <button type="button" className="ssn-button" onClick={handleDoiAutofill} disabled={doiLoading} style={{ background: '#e0ecff', color: '#1e3a8a' }}>
                    {doiLoading ? 'Fetching...' : 'Auto-fill from DOI'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
                {visibleFields.map((field) => (
                  <div key={field} style={{ gridColumn: field === 'abstract' ? '1 / -1' : 'auto' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.35rem', color: '#475569' }}>{fieldLabels[field] || field}</label>
                    {field === 'quartile' ? (
                      <select value={formData[field] || 'NA'} onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                        {['Q1', 'Q2', 'Q3', 'Q4', 'NA'].map((q) => <option key={q} value={q}>{q}</option>)}
                      </select>
                    ) : field === 'conference_scope' ? (
                      <select value={formData[field] || 'Normal'} onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                        {['International', 'National', 'Normal'].map((q) => <option key={q} value={q}>{q}</option>)}
                      </select>
                    ) : field === 'indexing' ? (
                      <select value={formData[field] || 'None'} onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                        {['Scopus', 'Web of Science', 'None'].map((q) => <option key={q} value={q}>{q}</option>)}
                      </select>
                    ) : field === 'abstract' ? (
                      <textarea value={formData[field] || ''} onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))} style={{ width: '100%', minHeight: '110px', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
                    ) : (
                      <input
                        type={field.includes('date') ? 'date' : 'text'}
                        value={formData[field] || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))}
                        style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.2rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.84rem' }}>Signed in as {user?.name} ({user?.role}).</div>
                <button type="submit" className="ssn-button ssn-button-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editing ? 'Update Entry' : 'Create Entry')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchListModule;
