import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { LayoutDashboard, BookOpen, Users, Newspaper, FolderTree } from 'lucide-react';

const COLORS = ['var(--ssn-navy)', 'var(--ssn-orange)', '#059669', '#3b82f6', '#8b5cf6'];
const Q_COLORS = { 'Q1': '#22c55e', 'Q2': '#eab308', 'Q3': '#f97316', 'Q4': '#ef4444', 'NA': '#94a3b8' };

const ResearchAnalytics = () => {
  const [data, setData] = useState({
    journals: [], conferences: [], articles: [], inproceedings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('ssn_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      try {
        const [j, c, a, i] = await Promise.all([
          fetch('http://localhost:5000/api/journals', { headers }).then(res => res.json()),
          fetch('http://localhost:5000/api/conferences', { headers }).then(res => res.json()),
          fetch('http://localhost:5000/api/articles', { headers }).then(res => res.json()),
          fetch('http://localhost:5000/api/inproceedings', { headers }).then(res => res.json()),
        ]);
        
        setData({
          journals: Array.isArray(j) ? j : [],
          conferences: Array.isArray(c) ? c : [],
          articles: Array.isArray(a) ? a : [],
          inproceedings: Array.isArray(i) ? i : []
        });
      } catch (err) {
        console.error("Failed to load analytics data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Institutional Analytics...</div>;

  const total = data.journals.length + data.conferences.length + data.articles.length + data.inproceedings.length;

  // Pie Chart Data: Distribution by Type
  const typeData = [
    { name: 'Journals', value: data.journals.length },
    { name: 'Conferences', value: data.conferences.length },
    { name: 'Articles', value: data.articles.length },
    { name: 'In-proceedings', value: data.inproceedings.length }
  ].filter(d => d.value > 0);

  // Bar Chart Data: Journals by Indexing
  const indexMap = { 'Scopus': 0, 'Web of Science': 0, 'None': 0 };
  data.journals.forEach(j => { if (indexMap[j.indexing] !== undefined) indexMap[j.indexing]++; });
  const indexData = Object.keys(indexMap).map(k => ({ name: k, count: indexMap[k] }));

  // Pie Chart Data: Quartile Distribution
  const qMap = { 'Q1': 0, 'Q2': 0, 'Q3': 0, 'Q4': 0, 'NA': 0 };
  [...data.journals, ...data.conferences, ...data.articles, ...data.inproceedings].forEach(item => {
    const q = item.quartile || 'NA';
    if (qMap[q] !== undefined) qMap[q]++;
  });
  const quartileData = Object.keys(qMap).map(k => ({ name: k, count: qMap[k] })).filter(d => d.count > 0);

  return (
    <div className="fade-in">
      {/* Command Banner */}
      <div style={{ background: 'linear-gradient(135deg, var(--ssn-navy) 0%, #001540 100%)', borderRadius: '24px', padding: '3rem', position: 'relative', overflow: 'hidden', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', boxShadow: '0 20px 40px rgba(0,31,103,0.3)' }}>
        <div style={{ position: 'absolute', right: '-20px', bottom: '-40px', opacity: 0.1 }}>
          <LayoutDashboard size={250} />
        </div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', letterSpacing: '-1px', marginBottom: '0.5rem' }}>Research Output Analytics</h1>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', maxWidth: '600px' }}>Comprehensive institutional mapping of all academic publishing activity, indexing, and quartile impact.</p>
        </div>
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'right', background: 'rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '16px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Lifetime Outputs</div>
          <div style={{ fontSize: '3rem', fontWeight: '900', color: '#fb923c', lineHeight: '1', marginTop: '0.2rem' }}>{total}</div>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Journals', value: data.journals.length, icon: <BookOpen />, color: '#3b82f6' },
          { label: 'Conferences', value: data.conferences.length, icon: <Users />, color: '#10b981' },
          { label: 'Articles', value: data.articles.length, icon: <Newspaper />, color: '#f59e0b' },
          { label: 'In-proceedings', value: data.inproceedings.length, icon: <FolderTree />, color: '#8b5cf6' }
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

          {/* Chart 3: Journal Indexing */}
          <div className="ssn-card" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--ssn-navy)', marginBottom: '2rem' }}>Journal Indexing Metrics</h3>
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
