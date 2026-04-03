import React, { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BookOpen, FolderTree, LayoutDashboard, Newspaper, Users } from 'lucide-react';

const COLORS = ['var(--ssn-navy)', 'var(--ssn-orange)', '#059669', '#3b82f6', '#8b5cf6'];
const Q_COLORS = { 'Q1': '#22c55e', 'Q2': '#eab308', 'Q3': '#f97316', 'Q4': '#ef4444', 'NA': '#94a3b8' };
const TYPE_OPTIONS = ['journals', 'conferences', 'articles', 'inproceedings'];
const TYPE_LABELS = {
  journals: 'Journals',
  conferences: 'Conferences',
  articles: 'Articles',
  inproceedings: 'In-proceedings'
};

const ResearchAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mineOnly, setMineOnly] = useState(false);
  const [fromYear, setFromYear] = useState('');
  const [toYear, setToYear] = useState('');
  const [quartile, setQuartile] = useState('');
  const [indexing, setIndexing] = useState('');
  const [conferenceScope, setConferenceScope] = useState('');
  const [source, setSource] = useState('');
  const [publisher, setPublisher] = useState('');
  const [author, setAuthor] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [addedByRole, setAddedByRole] = useState('');
  const [addedBy, setAddedBy] = useState('');
  const [hasDoi, setHasDoi] = useState('');
  const [hasAbstract, setHasAbstract] = useState('');
  const [hasKeywords, setHasKeywords] = useState('');
  const [selectedTypes, setSelectedTypes] = useState({
    journals: true,
    conferences: true,
    articles: true,
    inproceedings: true
  });
  const [error, setError] = useState('');

  const selectedTypeValues = useMemo(
    () => TYPE_OPTIONS.filter((type) => selectedTypes[type]),
    [selectedTypes]
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('ssn_token');
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const params = new URLSearchParams();
        if (mineOnly) params.set('mineOnly', 'true');
        if (fromYear) params.set('fromYear', fromYear);
        if (toYear) params.set('toYear', toYear);
        if (quartile) params.set('quartile', quartile);
        if (indexing) params.set('indexing', indexing);
        if (conferenceScope) params.set('conferenceScope', conferenceScope);
        if (source.trim()) params.set('source', source.trim());
        if (publisher.trim()) params.set('publisher', publisher.trim());
        if (author.trim()) params.set('author', author.trim());
        if (affiliation.trim()) params.set('affiliation', affiliation.trim());
        if (addedByRole) params.set('addedByRole', addedByRole);
        if (addedBy) params.set('addedBy', addedBy);
        if (hasDoi) params.set('hasDoi', hasDoi);
        if (hasAbstract) params.set('hasAbstract', hasAbstract);
        if (hasKeywords) params.set('hasKeywords', hasKeywords);
        if (selectedTypeValues.length > 0 && selectedTypeValues.length < TYPE_OPTIONS.length) {
          params.set('types', selectedTypeValues.join(','));
        }

        const res = await fetch(`http://localhost:5000/api/research/analytics?${params.toString()}`, { headers });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.message || 'Failed to load analytics');
        setData(payload);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mineOnly, fromYear, toYear, quartile, indexing, conferenceScope, source, publisher, author, affiliation, addedByRole, addedBy, hasDoi, hasAbstract, hasKeywords, selectedTypeValues]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Institutional Analytics...</div>;
  if (error) return <div style={{ padding: '3rem', textAlign: 'center', color: '#b91c1c' }}>{error}</div>;
  if (!data) return null;

  const total = data.totals?.overall || 0;
  const typeData = (data.byType || []).filter((entry) => entry.value > 0);
  const quartileData = (data.quartileDistribution || []).filter((entry) => entry.count > 0);
  const indexData = data.indexingDistribution || [];
  const yearlyTrend = data.yearlyTrend || [];
  const topContributors = data.topContributors || [];
  const conferenceScopeDistribution = data.conferenceScopeDistribution || [];
  const topSources = data.topSources || [];
  const roleDistribution = data.roleDistribution || [];
  const quality = data.qualityMetrics || {};
  const filterOptions = data.filterOptions || {};
  const years = filterOptions.years || yearlyTrend.map((r) => r.year);

  const resetFilters = () => {
    setQuartile('');
    setFromYear('');
    setToYear('');
    setMineOnly(false);
    setIndexing('');
    setConferenceScope('');
    setSource('');
    setPublisher('');
    setAuthor('');
    setAffiliation('');
    setAddedByRole('');
    setAddedBy('');
    setHasDoi('');
    setHasAbstract('');
    setHasKeywords('');
    setSelectedTypes({ journals: true, conferences: true, articles: true, inproceedings: true });
  };

  return (
    <div className="fade-in">
      {/* Command Banner */}
      <div style={{ background: 'linear-gradient(135deg, var(--ssn-navy) 0%, #001540 100%)', borderRadius: '24px', padding: '3rem', position: 'relative', overflow: 'hidden', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', boxShadow: '0 20px 40px rgba(0,31,103,0.3)' }}>
        <div style={{ position: 'absolute', right: '-20px', bottom: '-40px', opacity: 0.1 }}>
          <LayoutDashboard size={250} />
        </div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', letterSpacing: '-1px', marginBottom: '0.5rem' }}>Research Output Analytics</h1>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', maxWidth: '600px' }}>Dashboard summary of research outputs with role-safe analytics filters and institutional trends.</p>
        </div>
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'right', background: 'rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '16px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Lifetime Outputs</div>
          <div style={{ fontSize: '3rem', fontWeight: '900', color: '#fb923c', lineHeight: '1', marginTop: '0.2rem' }}>{total}</div>
        </div>
      </div>

      <div className="ssn-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '900', marginBottom: '1rem', color: 'var(--ssn-navy)' }}>Advanced NAAC Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.8rem', alignItems: 'center' }}>
          <select value={quartile} onChange={(e) => setQuartile(e.target.value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <option value="">All Quartiles</option>
            {(filterOptions.quartiles || ['Q1', 'Q2', 'Q3', 'Q4', 'NA']).map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
          <select value={indexing} onChange={(e) => setIndexing(e.target.value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <option value="">All Indexing</option>
            {(filterOptions.indexing || ['Scopus', 'Web of Science', 'None']).map((idx) => <option key={idx} value={idx}>{idx}</option>)}
          </select>
          <select value={conferenceScope} onChange={(e) => setConferenceScope(e.target.value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <option value="">All Conference Scope</option>
            {(filterOptions.conferenceScopes || ['International', 'National', 'Normal']).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={fromYear} onChange={(e) => setFromYear(e.target.value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <option value="">From Year</option>
            {years.map((y) => <option key={`from-${y}`} value={y}>{y}</option>)}
          </select>
          <select value={toYear} onChange={(e) => setToYear(e.target.value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <option value="">To Year</option>
            {years.map((y) => <option key={`to-${y}`} value={y}>{y}</option>)}
          </select>
          <input value={source} list="source-options" onChange={(e) => setSource(e.target.value)} placeholder="Source / Journal / Conference" style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          <input value={publisher} list="publisher-options" onChange={(e) => setPublisher(e.target.value)} placeholder="Publisher" style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author name" style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          <input value={affiliation} onChange={(e) => setAffiliation(e.target.value)} placeholder="Affiliation" style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          <select value={addedByRole} onChange={(e) => setAddedByRole(e.target.value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <option value="">All Roles</option>
            {(filterOptions.roles || ['HOD', 'Professor', 'Scholar', 'Student']).map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <select value={addedBy} onChange={(e) => setAddedBy(e.target.value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <option value="">All Contributors</option>
            {(filterOptions.contributors || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={hasDoi} onChange={(e) => setHasDoi(e.target.value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <option value="">DOI: Any</option>
            <option value="true">With DOI</option>
            <option value="false">Without DOI</option>
          </select>
          <select value={hasAbstract} onChange={(e) => setHasAbstract(e.target.value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <option value="">Abstract: Any</option>
            <option value="true">With Abstract</option>
            <option value="false">Without Abstract</option>
          </select>
          <select value={hasKeywords} onChange={(e) => setHasKeywords(e.target.value)} style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <option value="">Keywords: Any</option>
            <option value="true">With Keywords</option>
            <option value="false">Without Keywords</option>
          </select>
          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontWeight: '700', fontSize: '0.85rem' }}>
            <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
            My uploads only
          </label>
          <button className="ssn-button" onClick={resetFilters} style={{ background: '#e2e8f0', color: '#334155', padding: '0.55rem 1rem' }}>
            Clear All
          </button>
        </div>
        <datalist id="publisher-options">
          {(filterOptions.publishers || []).map((p) => <option key={p} value={p} />)}
        </datalist>
        <datalist id="source-options">
          {(topSources || []).map((s) => <option key={s.name} value={s.name} />)}
        </datalist>
        <div style={{ marginTop: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {TYPE_OPTIONS.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedTypes((prev) => {
                const activeCount = Object.values(prev).filter(Boolean).length;
                if (prev[type] && activeCount === 1) return prev;
                return { ...prev, [type]: !prev[type] };
              })}
              style={{
                border: 'none',
                borderRadius: '999px',
                padding: '0.45rem 0.8rem',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.78rem',
                background: selectedTypes[type] ? 'var(--ssn-navy)' : '#e2e8f0',
                color: selectedTypes[type] ? 'white' : '#334155'
              }}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Journals', value: data.totals?.journals || 0, icon: <BookOpen />, color: '#3b82f6' },
          { label: 'Conferences', value: data.totals?.conferences || 0, icon: <Users />, color: '#10b981' },
          { label: 'Articles', value: data.totals?.articles || 0, icon: <Newspaper />, color: '#f59e0b' },
          { label: 'In-proceedings', value: data.totals?.inproceedings || 0, icon: <FolderTree />, color: '#8b5cf6' }
        ].map((stat, idx) => (
          <div key={idx} className="ssn-card clickable-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ background: `${stat.color}15`, color: stat.color, padding: '1rem', borderRadius: '14px' }}>
              {React.cloneElement(stat.icon, { size: 28 })}
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.9rem', marginBottom: '2rem' }}>
        {[
          { label: 'DOI Coverage', value: `${quality.doiCoverage || 0}%`, color: '#1d4ed8' },
          { label: 'Indexed Share', value: `${quality.indexedShare || 0}%`, color: '#0f766e' },
          { label: 'Q1 + Q2 Share', value: `${quality.q1q2Share || 0}%`, color: '#b45309' },
          { label: 'Abstract Coverage', value: `${quality.abstractCoverage || 0}%`, color: '#7c3aed' },
          { label: 'Keyword Coverage', value: `${quality.keywordCoverage || 0}%`, color: '#be123c' },
          { label: 'URL Coverage', value: `${quality.urlCoverage || 0}%`, color: '#334155' }
        ].map((kpi) => (
          <div key={kpi.label} className="ssn-card" style={{ padding: '1rem 1.1rem' }}>
            <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800' }}>{kpi.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: kpi.color, marginTop: '0.25rem' }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Array */}
      {total > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* Chart 1: Output Type Distribution */}
          <div className="ssn-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--ssn-navy)', marginBottom: '2rem' }}>Output Composition</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={typeData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none">
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 'bold', fontSize: '0.85rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Quartile Impact Focus */}
          <div className="ssn-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--ssn-navy)', marginBottom: '2rem' }}>Quartile Impact (All Sources)</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={quartileData} cx="50%" cy="50%" innerRadius={0} outerRadius={110} dataKey="count" stroke="#fff" strokeWidth={3}>
                    {quartileData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Q_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 'bold', fontSize: '0.85rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Research Indexing */}
          <div className="ssn-card" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--ssn-navy)', marginBottom: '2rem' }}>Indexing Metrics (All Outputs)</h3>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <BarChart data={indexData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 'bold' }} />
                  <Tooltip cursor={{ fill: 'rgba(0,31,103,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                  <Bar dataKey="count" fill="var(--ssn-navy)" radius={[8, 8, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Yearly Trend */}
          <div className="ssn-card" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--ssn-navy)', marginBottom: '2rem' }}>Year-wise Output Trend</h3>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={yearlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="var(--ssn-navy)" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 5: Top Contributors */}
          <div className="ssn-card" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--ssn-navy)', marginBottom: '1.2rem' }}>Top Contributors</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={topContributors}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="added_by_name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--ssn-orange)" radius={[8, 8, 0, 0]} maxBarSize={75} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 6: Conference Scope */}
          <div className="ssn-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--ssn-navy)', marginBottom: '1.2rem' }}>Conference Scope Split</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={conferenceScopeDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="count">
                    {conferenceScopeDistribution.map((entry, idx) => (
                      <Cell key={`scope-${entry.name}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 7: Contribution by Role */}
          <div className="ssn-card" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--ssn-navy)', marginBottom: '1.2rem' }}>Contribution by Role</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={roleDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 8: Top Sources */}
          <div className="ssn-card" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--ssn-navy)', marginBottom: '1.2rem' }}>Top Publication Sources</h3>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={topSources}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={90} tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f57c00" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      ) : (
        <div style={{ padding: '4rem', textAlign: 'center', background: 'white', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
          <FolderTree size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 'bold' }}>No Research Data Available</h3>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Import journals or extract a DOI to generate analytics.</p>
        </div>
      )}
    </div>
  );
};

export default ResearchAnalytics;
