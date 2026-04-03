import React, { useState, useEffect } from 'react';
import {
  Search, Bell, User as UserIcon, LayoutDashboard, BookOpen,
  ScrollText, ShieldCheck, BarChart3, ChevronRight,
  FileText, Award, LogOut, CheckCircle, Clock, MessageSquare,
  Users, Upload, Edit, Send, Check, Hash, Activity, Download, RefreshCcw, ArrowRight,
  ScanSearch, Newspaper, FolderTree
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import NotificationCenter from './components/NotificationCenter';
import StrategicDashboard from './components/StrategicDashboard';
import PatentModule from './components/Patents/PatentModule';
import PublicLanding from './components/PublicLanding';
import Login from './components/Login';
import DoiScraperModule from './components/Research/DoiScraperModule';
import ResearchListModule from './components/Research/ResearchListModule';
import ResearchAnalytics from './components/Research/ResearchAnalytics';
import { exportToPDF, exportToWord } from './utils/ExportUtils';
import './index.css';

// --- Sub-components ---

const SidebarItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.6rem 1rem', borderRadius: '10px', cursor: 'pointer',
    backgroundColor: active ? 'var(--ssn-navy)' : 'transparent',
    color: active ? 'white' : 'var(--ssn-text-light)',
    fontWeight: active ? '600' : '500',
    transition: 'all 0.2s', marginBottom: '0.2rem',
    boxShadow: active ? '0 4px 10px rgba(0, 31, 103, 0.15)' : 'none'
  }} className="sidebar-item-hover">
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {React.cloneElement(icon, { size: 18 })}
      <span style={{ fontSize: '0.85rem' }}>{label}</span>
    </div>
    {active && <ChevronRight size={14} />}
  </div>
);

const SidebarSection = ({ title, children }) => (
  <div style={{ marginBottom: '2rem' }}>
    <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--ssn-text-light)', marginBottom: '1rem', paddingLeft: '1.25rem', letterSpacing: '1.5px', opacity: 0.6 }}>{title}</div>
    {children}
  </div>
);

// --- Generic Module for IPR types (Trademarks, Copyrights) ---
const IPRListModule = ({ type, title, icon }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/projects', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('ssn_token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setItems(Array.isArray(data) ? data.filter(p => p.type === type) : []);
        setLoading(false);
      })
      .catch(() => { setItems([]); setLoading(false); });
  }, [type]);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
        <div style={{ padding: '0.75rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: 'var(--ssn-navy)' }}>
          {icon}
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--ssn-navy)' }}>{title}</h2>
      </div>

      <div className="ssn-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', color: '#666', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <th style={{ padding: '1.25rem' }}>S.No</th>
              <th style={{ padding: '1.25rem' }}>{type === 'Publication' ? 'Paper Title' : 'Title / Asset'}</th>
              <th style={{ padding: '1.25rem' }}>Status</th>
              <th style={{ padding: '1.25rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? items.map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee' }} className="table-row-hover">
                <td style={{ padding: '1.25rem', fontSize: '0.95rem' }}>{idx + 1}</td>
                <td style={{ padding: '1.25rem', fontWeight: '600' }}>{item.title}</td>
                <td style={{ padding: '1.25rem' }}>
                  <span style={{
                    padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                    background: item.status === 'Approved' || item.status === 'Granted' || item.status === 'Published' ? '#dcfce7' : '#fef9c3',
                    color: item.status === 'Approved' || item.status === 'Granted' || item.status === 'Published' ? '#166534' : '#854d0e'
                  }}>
                    {item.status || 'Pending'}
                  </span>
                </td>
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    {item.paper_link && <a href={item.paper_link} target="_blank" rel="noreferrer" className="ssn-button" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: '#f1f5f9', color: 'var(--ssn-navy)' }}>Link</a>}
                    <button onClick={() => exportToPDF(item)} className="ssn-button" style={{ padding: '0.4rem', background: 'none' }} title="Export PDF"><Download size={16} color="var(--ssn-navy)" /></button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>No {type} assets found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Specialized Patent Module ---
const PatentModuleList = () => {
  const [patents, setPatents] = useState([]);
  const [filter, setFilter] = useState('All'); // All, Filed, Published, Granted

  useEffect(() => {
    fetch('http://localhost:5000/api/projects', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('ssn_token')}` }
    })
      .then(res => res.json())
      .then(data => setPatents(Array.isArray(data) ? data.filter(p => p.type === 'Patent') : []))
      .catch(() => setPatents([]));
  }, []);

  const filtered = filter === 'All' ? patents : patents.filter(p => p.status === filter);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div style={{ padding: '0.75rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(243, 112, 33, 0.2)', color: 'var(--ssn-orange)', marginBottom: '1rem' }}>
          <ShieldCheck size={32} />
        </div>
        <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--ssn-navy)' }}>Patent Portfolio</h2>
        <p style={{ color: '#666', marginTop: '0.5rem' }}>Tracking institutional inventions from filing to grant.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        {['All', 'Filed', 'Published', 'Granted'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '0.6rem 1.5rem', borderRadius: '30px', fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: filter === f ? 'var(--ssn-navy)' : '#e2e8f0',
              color: filter === f ? 'white' : '#64748b',
              boxShadow: filter === f ? '0 4px 10px rgba(0, 31, 103, 0.2)' : 'none'
            }}
          >
            {f} Patent{f !== 'All' ? 's' : ''}
          </button>
        ))}
      </div>

      <div className="ssn-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '900px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <th style={{ padding: '0.85rem' }}>S.No</th>
              <th style={{ padding: '0.85rem', textAlign: 'left' }}>Invention Title</th>
              <th style={{ padding: '0.85rem' }}>Patent / App No.</th>
              <th style={{ padding: '0.85rem' }}>Inventors</th>
              <th style={{ padding: '0.85rem' }}>Dates</th>
              <th style={{ padding: '0.85rem' }}>Proof</th>
              <th style={{ padding: '0.85rem' }}>Export</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((p, idx) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }} className="table-row-hover">
                <td style={{ padding: '0.85rem', fontSize: '0.85rem' }}>{idx + 1}</td>
                <td style={{ padding: '0.85rem', fontWeight: '700', color: 'var(--ssn-navy)', textAlign: 'left', maxWidth: '300px' }}>{p.title}</td>
                <td style={{ padding: '0.85rem', color: '#555', fontWeight: '600', fontSize: '0.85rem' }}>{p.patent_no || 'Pending'}</td>
                <td style={{ padding: '0.85rem', fontSize: '0.8rem' }}>{p.inventors || 'N/A'}</td>
                <td style={{ padding: '0.85rem', fontSize: '0.75rem', textAlign: 'left', lineHeight: '1.4' }}>
                  {p.date_filed && <div><span style={{ color: '#888' }}>Filed:</span> {p.date_filed}</div>}
                  {p.date_published && <div><span style={{ color: '#888' }}>Pub:</span> {p.date_published}</div>}
                  {p.date_granted && <div><span style={{ color: '#059669', fontWeight: 'bold' }}>Granted:</span> {p.date_granted}</div>}
                </td>
                <td style={{ padding: '0.85rem' }}>
                  {p.proof_link ? <a href={p.proof_link} target="_blank" rel="noreferrer" style={{ color: 'var(--ssn-orange)', fontWeight: 'bold', fontSize: '0.75rem', textDecoration: 'none' }}>View</a> : <span style={{ color: '#ccc' }}>-</span>}
                </td>
                <td style={{ padding: '0.85rem' }}>
                  <button onClick={() => exportToWord(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }} title="Export Word Doc"><Download size={16} /></button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>No {filter} patents to display.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Dashboard Layout ---

const DashboardLayout = ({ children, activeModule, setActiveModule, user, onLogout }) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f4f6f9' }}>
      {/* Navbar -- Renamed Trade Marks to Trademarks */}
      <nav style={{ backgroundColor: 'var(--ssn-navy)', color: 'white', padding: '1rem 0', position: 'sticky', top: 0, zIndex: 101, boxShadow: '0 4px 20px rgba(0, 31, 103, 0.15)' }}>
        <div className="ssn-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, var(--ssn-orange) 0%, #ff8c00 100%)', borderRadius: '10px', boxShadow: '0 4px 12px rgba(243, 112, 33, 0.3)' }}></div>
            <div style={{ fontWeight: '900', fontSize: '1.6rem', letterSpacing: '-0.5px' }}>SSN <span style={{ color: 'var(--ssn-orange)' }}>PORTAL</span></div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', color: 'rgba(255,255,255,0.5)' }} />
              <input type="text" placeholder="Global Search..." style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', width: '250px', fontSize: '0.85rem' }} />
            </div>
            <button onClick={() => setIsNotifOpen(!isNotifOpen)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.75rem', borderRadius: '12px', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}>
              <Bell size={20} />
              <div style={{ position: 'absolute', top: '8px', right: '8px', width: '10px', height: '10px', background: 'var(--ssn-orange)', borderRadius: '50%', border: '2px solid var(--ssn-navy)' }}></div>
            </button>
            <div style={{ height: '32px', width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>{user.name}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.6, fontWeight: '600' }}>{user.role} | {user.email}</div>
              </div>
              <button onClick={onLogout} style={{ background: 'var(--ssn-orange)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(243, 112, 33, 0.2)' }}>
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <NotificationCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} onNavigate={(module) => setActiveModule(module)} />

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar Dual-Domain Layout */}
        <aside style={{ width: '300px', background: 'white', padding: '2rem 1rem', height: 'calc(100vh - 72px)', position: 'sticky', top: '72px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          
          <SidebarSection title="Research Hub">
            <SidebarItem icon={<LayoutDashboard />} label="Research Analytics" active={activeModule === 'research_dashboard'} onClick={() => setActiveModule('research_dashboard')} />
            <SidebarItem icon={<ScanSearch />} label="DOI Scraper Tool" active={activeModule === 'doi_scraper'} onClick={() => setActiveModule('doi_scraper')} />
            <SidebarItem icon={<Upload />} label="File New Research" active={activeModule === 'submit_research'} onClick={() => setActiveModule('submit_research')} />
            <SidebarItem icon={<BookOpen />} label="Journals" active={activeModule === 'journals'} onClick={() => setActiveModule('journals')} />
            <SidebarItem icon={<Users />} label="Conferences" active={activeModule === 'conferences'} onClick={() => setActiveModule('conferences')} />
            <SidebarItem icon={<Newspaper />} label="Articles" active={activeModule === 'articles'} onClick={() => setActiveModule('articles')} />
            <SidebarItem icon={<FolderTree />} label="In-proceedings" active={activeModule === 'inproceedings'} onClick={() => setActiveModule('inproceedings')} />
          </SidebarSection>

          <SidebarSection title="IPR Command Center">
            <SidebarItem icon={<Activity />} label="Strategic Intelligence" active={activeModule === 'overview'} onClick={() => setActiveModule('overview')} />
            <SidebarItem icon={<Upload />} label="File New IPR" active={activeModule === 'submit'} onClick={() => setActiveModule('submit')} />
            <SidebarItem icon={<ShieldCheck />} label="Patents" active={activeModule === 'patents'} onClick={() => setActiveModule('patents')} />
            <SidebarItem icon={<Award />} label="Trademarks" active={activeModule === 'trademarks'} onClick={() => setActiveModule('trademarks')} />
            <SidebarItem icon={<FileText />} label="Copyrights" active={activeModule === 'copyrights'} onClick={() => setActiveModule('copyrights')} />
          </SidebarSection>

          {(user.role === 'HOD' || user.role === 'Professor') && (
            <SidebarSection title="Institutional Flow">
              {user.role === 'HOD' && <SidebarItem icon={<BarChart3 />} label="Strategic Insights" active={activeModule === 'strategic'} onClick={() => setActiveModule('strategic')} />}
              <SidebarItem icon={<CheckCircle />} label="Approval Queue" active={activeModule === 'approvals'} onClick={() => setActiveModule('approvals')} />
            </SidebarSection>
          )}

          <div style={{ marginTop: 'auto', padding: '1.25rem', background: 'var(--ssn-navy)', borderRadius: '16px', color: 'white' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.25rem' }}>Active Session</div>
            <div style={{ fontWeight: 'bold' }}>{user.role} Portal</div>
            <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '0.5rem' }}>v2.5.0-phase5</div>
          </div>
        </aside>

        {/* Dynamic Main Content */}
        <main style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
          <div className="ssn-container-wide">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// --- Stat Card ---
const InteractiveStatCard = ({ label, value, icon, color, onClick }) => (
  <div className="ssn-card clickable-card" onClick={onClick} style={{
    position: 'relative', overflow: 'hidden', padding: '2rem', border: '1px solid transparent', transition: 'all 0.3s'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
      <div style={{ padding: '0.75rem', background: '#f8f9fa', borderRadius: '12px', color: color || 'var(--ssn-navy)' }}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#059669', background: '#d1fae5', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>ACTIVE</div>
    </div>
    <div style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--ssn-text)', letterSpacing: '-1px' }}>{value}</div>
    <div style={{ fontSize: '0.85rem', color: 'var(--ssn-text-light)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.25rem' }}>{label}</div>

    <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', opacity: 0.05 }}>
      {React.cloneElement(icon, { size: 100 })}
    </div>
  </div>
);

// --- Advanced Submission Form ---
const SubmitResearchForm = ({ onSubmitted, editingProject = null, onCancelEdit = null, user, mode = 'ipr' }) => {
  const [title, setTitle] = useState(editingProject?.title || '');
  const [type, setType] = useState(editingProject?.type || (mode === 'research' ? 'Journal Publication' : 'Patent'));
  const [category, setCategory] = useState(editingProject?.category || (mode === 'research' ? 'Paper' : 'Invention'));
  const [abstract, setAbstract] = useState(editingProject?.abstract || '');
  const [mentorId, setMentorId] = useState(editingProject?.mentor_id || '');

  // Academic Meta Fields
  const [year, setYear] = useState(editingProject?.year || new Date().getFullYear());
  const [journal, setJournal] = useState(editingProject?.journal || '');
  const [paperLink, setPaperLink] = useState(editingProject?.paper_link || '');
  
  // Re-injected Detailed Research Fields
  const [authors, setAuthors] = useState(editingProject?.authors || '');
  const [affiliations, setAffiliations] = useState(editingProject?.affiliations || 'SSN College of Engineering');
  const [journalTitle, setJournalTitle] = useState(editingProject?.journal_title || '');
  const [doi, setDoi] = useState(editingProject?.doi || '');
  const [publicationDate, setPublicationDate] = useState(editingProject?.publication_date || '');

  // IPR Core Fields
  const [patentNo, setPatentNo] = useState(editingProject?.patent_no || '');
  const [inventors, setInventors] = useState(editingProject?.inventors || '');
  const [dateFiled, setDateFiled] = useState(editingProject?.date_filed || '');
  const [datePublished, setDatePublished] = useState(editingProject?.date_published || '');
  const [dateGranted, setDateGranted] = useState(editingProject?.date_granted || '');
  const [proofLink, setProofLink] = useState(editingProject?.proof_link || '');

  const [file, setFile] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/mentors', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('ssn_token')}` }
    })
      .then(res => res.json())
      .then(data => setMentors(data));
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile({
        name: selectedFile.name,
        type: selectedFile.type,
        size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const url = editingProject
      ? `http://localhost:5000/api/projects/${editingProject.id}`
      : 'http://localhost:5000/api/projects/submit';

    const method = editingProject ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ssn_token')}`
        },
        body: JSON.stringify({
          title, type, category, abstract, mentor_id: mentorId,
          file_name: file?.name || editingProject?.file_name || 'research_submission.pdf',
          file_type: file?.type || editingProject?.file_type || 'application/pdf',
          paper_content: 'MOCK_BASE64_DATA',
          patent_no: patentNo, 
          inventors: mode === 'research' ? authors : inventors, 
          date_filed: dateFiled, 
          date_published: mode === 'research' ? publicationDate : datePublished, 
          date_granted: dateGranted, 
          proof_link: proofLink,
          journal: mode === 'research' ? journalTitle : journal,
          paper_link: mode === 'research' ? doi : paperLink
        })
      });
      if (!res.ok) throw new Error('Submission failed');
      alert(editingProject ? 'Revision submitted successfully!' : 'Invention disclosure submitted for review!');
      onSubmitted();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--ssn-navy)' }}>
          {editingProject ? 'Edit & Resubmit Disclosure' : (mode === 'research' ? 'New Research Disclosure' : 'New IPR Disclosure')}
        </h2>
        {editingProject && (
          <button onClick={onCancelEdit} className="ssn-button" style={{ borderColor: '#666', color: '#666' }}>Cancel</button>
        )}
      </div>

      <div className="ssn-card" style={{ maxWidth: '900px', padding: '3rem' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.75rem', color: '#444' }}>{mode === 'research' ? 'Research Output Type' : 'IPR Asset Type'}</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', border: '1.5px solid var(--ssn-border)', fontSize: '1rem', background: 'white' }}>
              {mode === 'research' ? (
                <>
                  <option>Journal Publication</option>
                  <option>Conference</option>
                  <option>Article</option>
                  <option>In-proceeding</option>
                </>
              ) : (
                <>
                  <option>Patent</option>
                  <option>Trademark</option>
                  <option>Copyright</option>
                </>
              )}
            </select>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.75rem', color: '#444' }}>Institutional Title</label>
            <input type="text" placeholder="Enter full descriptive title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--ssn-border)', fontSize: '1rem' }} required />
          </div>

          {/* Conditional Fields based on Type */}
          {(type === 'Journal Publication' || type === 'Conference' || type === 'Article' || type === 'In-proceeding') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Authors</label>
                <input type="text" placeholder="e.g. John D., Alan T." value={authors} onChange={(e) => setAuthors(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Affiliations</label>
                <input type="text" value={affiliations} onChange={(e) => setAffiliations(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Source / Journal / Conference Title</label>
                <input type="text" placeholder="e.g. IEEE Access" value={journalTitle} onChange={(e) => setJournalTitle(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Date Published</label>
                <input type="date" value={publicationDate} onChange={(e) => setPublicationDate(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} required />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.5rem' }}>DOI Link / ID</label>
                <input type="text" placeholder="e.g. 10.1109/ACCESS..." value={doi} onChange={(e) => setDoi(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
              </div>
            </div>
          )}

          {type === 'Patent' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem', background: '#fff7ed', padding: '1.5rem', borderRadius: '12px', border: '1px solid #fed7aa' }}>
              <div style={{ fontWeight: 'bold', color: '#c2410c', fontSize: '0.85rem', textTransform: 'uppercase' }}>Patent Specific Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Patent / App Number</label>
                  <input type="text" placeholder="e.g. IND-2026-XYZ" value={patentNo} onChange={(e) => setPatentNo(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #f97316' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Inventors List</label>
                  <input type="text" placeholder="Dr. XYZ, John Doe" value={inventors} onChange={(e) => setInventors(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #f97316' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) 2fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Date Filed</label>
                  <input type="date" value={dateFiled} onChange={(e) => setDateFiled(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Date Published</label>
                  <input type="date" value={datePublished} onChange={(e) => setDatePublished(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Date Granted</label>
                  <input type="date" value={dateGranted} onChange={(e) => setDateGranted(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Link to Proof (URL)</label>
                  <input type="text" placeholder="URL to patent office listing" value={proofLink} onChange={(e) => setProofLink(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
                </div>
              </div>
            </div>
          )}

          {(!editingProject && (user?.role === 'Student' || user?.role === 'Scholar')) && (
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.75rem', color: '#444' }}>Select Mentor / Professor</label>
              <select value={mentorId} onChange={(e) => setMentorId(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--ssn-border)', fontSize: '1rem', background: 'white' }} required>
                <option value="">Assign a Professor to review your work</option>
                {mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.75rem', color: '#444' }}>{mode === 'research' ? 'Abstract / Key Findings' : 'Invention Description / Abstract'}</label>
            <textarea placeholder={mode === 'research' ? 'Enter the abstract or key findings...' : 'Provide the core claims or summary of the intellectual property...'} value={abstract} onChange={(e) => setAbstract(e.target.value)} rows="5" style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--ssn-border)', fontSize: '1rem', resize: 'vertical' }} required></textarea>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <label style={{ display: 'block', fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.75rem', color: '#444' }}>
              Attach Specification Document (PDF, Word) {!editingProject && <span style={{ color: 'red' }}>*</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} required={!editingProject} style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', cursor: 'pointer', zIndex: 1 }} />
              <div style={{ border: '2px dashed var(--ssn-navy)', padding: '2.5rem', textAlign: 'center', borderRadius: '16px', background: 'rgba(0, 31, 103, 0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: '#f0f4ff', color: 'var(--ssn-navy)', width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={28} />
                </div>
                <div>
                  <h4 style={{ color: 'var(--ssn-navy)', marginBottom: '0.25rem' }}>{file ? file.name : (editingProject?.file_name || 'Select Research Document')}</h4>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>{file ? `Size: ${file.size}` : 'Accepted formats: PDF, DOC, DOCX. Max 20MB'}</p>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="ssn-button ssn-button-primary" style={{ width: '100%', padding: '1.25rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '800' }}>
            {loading ? 'Processing Disclosure...' : (editingProject ? 'Submit Revised Version' : 'Submit Invention Disclosure')} <ArrowRight size={20} style={{ marginLeft: '1rem' }} />
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Approval Queue (Mentor View) ---
const ApprovalQueue = ({ role }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matrixScores, setMatrixScores] = useState({});
  const [commentMap, setCommentMap] = useState({}); // tracks textarea values per project id

  const getComment = (id) => commentMap[id] || '';
  const setComment = (id, val) => setCommentMap(prev => ({ ...prev, [id]: val }));

  const handleMatrixChange = (id, field, value) => {
    setMatrixScores(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { novelty: 5, commercial: 5, tech: 5 }), [field]: parseInt(value) }
    }));
  };

  const getIpScore = (id) => {
    const scores = matrixScores[id] || { novelty: 5, commercial: 5, tech: 5 };
    return Math.round((scores.novelty + scores.commercial + scores.tech) / 30 * 100);
  };

  const fetchQueue = () => {
    fetch('http://localhost:5000/api/projects', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('ssn_token')}` }
    })
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        if (role === 'Professor') {
          setProjects(arr.filter(p => p.review_stage === 'Professor'));
        } else if (role === 'HOD') {
          setProjects(arr.filter(p => p.review_stage === 'HOD'));
        }
        setLoading(false);
      })
      .catch(() => { setProjects([]); setLoading(false); });
  };

  useEffect(() => { fetchQueue(); }, [role]);

  const handleAction = async (id, actionType, comments = '', approvedToHod = true) => {
    const url = actionType === 'review'
      ? `http://localhost:5000/api/projects/${id}/review`
      : `http://localhost:5000/api/projects/${id}/approve`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ssn_token')}`
        },
        body: JSON.stringify({
          professor_comments: comments,
          approved_to_hod: approvedToHod
        })
      });
      if (!res.ok) throw new Error('Action failed');
      alert(approvedToHod ? 'Work endorsed to HOD' : 'Suggestions sent to Student');
      fetchQueue();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExportPDF = (project) => exportToPDF(project);
  const handleExportWord = (project) => exportToWord(project);

  if (loading) return <div>Initalizing workflow...</div>;

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--ssn-navy)', marginBottom: '2.5rem' }}>{role} Review Queue</h2>
      <div style={{ display: 'grid', gap: '2rem' }}>
        {projects.length === 0 ? (
          <div className="ssn-card" style={{ textAlign: 'center', padding: '5rem' }}>
            <div style={{ background: '#f0fdf4', color: '#15803d', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
              <CheckCircle size={40} />
            </div>
            <h3>Workflow Cleared</h3>
            <p style={{ color: '#666', marginTop: '0.5rem' }}>You have no pending approvals in your queue.</p>
          </div>
        ) : projects.map(p => (
          <div key={p.id} className="ssn-card" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '3rem', padding: '2.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                <span style={{ background: 'var(--ssn-navy)', color: 'white', padding: '0.35rem 1rem', borderRadius: '30px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>{p.category}</span>
                <span style={{ border: '1.5px solid #eee', color: '#444', padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold' }}>{p.type}</span>
                <span style={{ color: '#666', fontSize: '0.85rem' }}>{new Date(p.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--ssn-navy)', marginBottom: '1rem' }}>{p.title}</h3>
              <p style={{ fontSize: '1rem', color: '#444', marginBottom: '2rem', lineHeight: '1.8' }}>{p.abstract}</p>

              {role === 'Professor' && (
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontWeight: '800', marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--ssn-navy)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mentor Notes / Required Improvements</label>
                  <textarea
                    value={getComment(p.id)}
                    onChange={(e) => setComment(p.id, e.target.value)}
                    placeholder="Provide detailed feedback or suggest specific changes..."
                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', minHeight: '120px', background: 'white' }}
                  />
                </div>
              )}

              {role === 'HOD' && p.professor_comments && (
                <div style={{ background: '#fff9eb', padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid #f59e0b', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#92400e', marginBottom: '0.25rem' }}>MENTOR ENDORSEMENT</div>
                  <p style={{ fontSize: '0.9rem', color: '#92400e' }}>{p.professor_comments}</p>
                </div>
              )}
              {role === 'HOD' && (
                <div style={{ background: 'var(--gradient-glass)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--ssn-border)', marginTop: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h4 style={{ color: 'var(--ssn-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={18} /> Invention Evaluation Matrix</h4>
                    <div style={{ background: 'var(--ssn-sky)', color: 'var(--ssn-navy)', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: '900', fontSize: '1.2rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                      IP Potential: <span style={{ color: getIpScore(p.id) > 75 ? '#059669' : 'var(--ssn-orange)' }}>{getIpScore(p.id)}/100</span>
                    </div>
                  </div>

                  {[{ label: 'Novelty & Uniqueness', field: 'novelty' }, { label: 'Commercialization Potential', field: 'commercial' }, { label: 'Technical Feasibility', field: 'tech' }].map(metric => (
                    <div key={metric.field} style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#444' }}>
                        <span>{metric.label}</span>
                        <span>{(matrixScores[p.id] || { novelty: 5, commercial: 5, tech: 5 })[metric.field]} / 10</span>
                      </div>
                      <input type="range" min="1" max="10"
                        value={(matrixScores[p.id] || { novelty: 5, commercial: 5, tech: 5 })[metric.field]}
                        onChange={(e) => handleMatrixChange(p.id, metric.field, e.target.value)}
                        style={{ width: '100%', accentColor: 'var(--ssn-orange)', cursor: 'pointer' }}
                      />
                    </div>
                  ))}
                  <div style={{ marginTop: '1.5rem' }}>
                    <textarea
                      value={getComment(`hod-${p.id}`)}
                      onChange={(e) => setComment(`hod-${p.id}`, e.target.value)}
                      placeholder="Final IP committee remarks..."
                      style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', minHeight: '80px', background: 'white' }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#fff', border: '1px solid var(--ssn-border)', borderRadius: '20px', padding: '1.5rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ color: 'var(--ssn-navy)', marginBottom: '1.25rem' }}><FileText size={48} opacity={0.3} style={{ margin: '0 auto' }} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button onClick={() => handleExportPDF(p)} className="ssn-button" style={{ padding: '0.5rem', fontSize: '0.7rem', justifyContent: 'center', background: 'var(--ssn-gray)', color: 'var(--ssn-navy)', border: 'none' }}>
                    <Download size={14} /> PDF
                  </button>
                  <button onClick={() => handleExportWord(p)} className="ssn-button" style={{ padding: '0.5rem', fontSize: '0.7rem', justifyContent: 'center', background: 'var(--ssn-gray)', color: 'var(--ssn-navy)', border: 'none' }}>
                    <Download size={14} /> WORD
                  </button>
                </div>
              </div>

              {role === 'Professor' ? (
                <>
                  <button onClick={() => handleAction(p.id, 'review', getComment(p.id), true)} className="ssn-button ssn-button-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    <Send size={18} /> Push to HOD
                  </button>
                  <button onClick={() => handleAction(p.id, 'review', getComment(p.id), false)} className="ssn-button" style={{ width: '100%', justifyContent: 'center', color: '#f59e0b', background: '#fffbeb', border: '1.5px solid #fde68a' }}>
                    <RefreshCcw size={18} /> Suggest Changes
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handleAction(p.id, 'approve', `[IP Score: ${getIpScore(p.id)}/100] ` + getComment(`hod-${p.id}`), true)} className="ssn-button ssn-button-primary" style={{ width: '100%', justifyContent: 'center', background: '#059669', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)' }}>
                    <Check size={18} /> Approve IP Filing
                  </button>
                  <button onClick={() => handleAction(p.id, 'review', getComment(`hod-${p.id}`), false)} className="ssn-button" style={{ width: '100%', justifyContent: 'center', color: '#dc2626', background: '#fef2f2', border: '1.5px solid #fca5a5' }}>
                    <RefreshCcw size={18} /> Reject / Rework
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Application Core ---

function App() {
  const { user, logout, loading, verify } = useAuth();
  const [view, setView] = useState('landing');
  const [activeModule, setActiveModule] = useState('overview');
  const [editingProject, setEditingProject] = useState(null);
  const [myProjects, setMyProjects] = useState([]);

  const fetchMyProjects = () => {
    fetch('http://localhost:5000/api/projects', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('ssn_token')}` }
    })
      .then(res => res.json())
      .then(data => setMyProjects(Array.isArray(data) ? data : []))
      .catch(() => setMyProjects([]));
  };

  useEffect(() => {
    if (user) {
      setView('dashboard');
      fetchMyProjects();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      verify(token).then(() => {
        alert('Institutional email verified!');
        window.history.replaceState({}, document.title, "/");
        setView('login');
      });
    }
  }, [user]);

  if (loading) return null;

  if (view === 'landing') return <PublicLanding onLoginClick={() => setView('login')} />;
  if (view === 'login') return <Login onLoginSuccess={() => setView('dashboard')} onGuestView={() => setView('landing')} />;

  const handleEdit = (project) => {
    setEditingProject(project);
    setActiveModule('submit');
  };

  const researchModules = ['research_dashboard', 'doi_scraper', 'journals', 'conferences', 'articles', 'inproceedings'];
  const isResearchActive = researchModules.includes(activeModule);

  const handleFloatingAction = () => {
    if (isResearchActive) {
      const moduleKey = ['journals', 'conferences', 'articles', 'inproceedings'].includes(activeModule) ? activeModule : 'journals';
      window.dispatchEvent(new CustomEvent('research-open-create', { detail: { moduleKey } }));
      if (activeModule === 'research_dashboard' || activeModule === 'doi_scraper') {
        setActiveModule(moduleKey);
      }
      return;
    }
    setActiveModule('submit');
  };

  return (
    <>
      <DashboardLayout
        user={user}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        onLogout={() => { logout(); setView('landing'); }}
      >
        {activeModule === 'overview' && (
          <div className="fade-in">
            {/* Hero Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #001f40 0%, #003366 40%, #0d47a1 100%)',
              borderRadius: '24px',
              padding: '3rem 3.5rem',
              marginBottom: '2.5rem',
              position: 'relative',
              overflow: 'hidden',
              color: 'white',
              boxShadow: '0 20px 60px rgba(0, 31, 64, 0.3)'
            }}>
              {/* Decorative Background Elements */}
              <div style={{ position: 'absolute', right: '-40px', top: '-60px', opacity: 0.07 }}>
                <ShieldCheck size={300} />
              </div>
              <div className="floating-element" style={{ position: 'absolute', right: '200px', bottom: '-30px', opacity: 0.06 }}>
                <Award size={200} />
              </div>
              <div style={{ position: 'absolute', top: '0', left: '0', right: '0', height: '3px', background: 'linear-gradient(90deg, var(--ssn-orange), #ffb74d, var(--ssn-orange))' }}></div>

              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'inline-block', padding: '0.35rem 1rem', background: 'rgba(245,124,0,0.25)', border: '1px solid rgba(245,124,0,0.5)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1.5px', color: '#ffb74d', marginBottom: '1.5rem' }}>ENTERPRISE IPR COMMAND CENTER</div>
                <h2 style={{ color: 'white', fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-1px', lineHeight: 1.15, marginBottom: '0.75rem' }}>
                  Welcome back, <span style={{ color: 'var(--ssn-orange)' }}>{user.name}</span>
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', maxWidth: '600px', lineHeight: 1.6 }}>
                  You have <strong style={{ color: 'white' }}>{myProjects.length}</strong> active IPR assets in the system. Monitor, manage and grow your institutional IP portfolio.
                </p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.75rem 1.5rem', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--ssn-orange)' }}>{myProjects.filter(p => p.type === 'Patent').length}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Patents</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.75rem 1.5rem', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#4ade80' }}>{myProjects.filter(p => p.type === 'Trademark').length}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trademarks</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.75rem 1.5rem', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#c084fc' }}>{myProjects.filter(p => p.type === 'Copyright').length}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Copyrights</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.75rem 1.5rem', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#38bdf8' }}>{myProjects.filter(p => p.status === 'Approved').length}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Approved</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
              <InteractiveStatCard label="Patents" value={myProjects.filter(p => p.type === 'Patent').length} icon={<ShieldCheck />} color="var(--ssn-orange)" onClick={() => setActiveModule('patents')} />
              <InteractiveStatCard label="Trademarks" value={myProjects.filter(p => p.type === 'Trademark').length} icon={<Award />} color="#059669" onClick={() => setActiveModule('trademarks')} />
              <InteractiveStatCard label="Copyrights" value={myProjects.filter(p => p.type === 'Copyright').length} icon={<FileText />} color="#7c3aed" onClick={() => setActiveModule('copyrights')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
              <div className="ssn-card" style={{ padding: '2.5rem' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '2rem' }}>My IPR Activity</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {myProjects.length === 0 ? <p style={{ color: '#888' }}>No recent IPR disclosures.</p> : myProjects.slice(0, 5).map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ background: 'white', padding: '0.5rem', borderRadius: '8px', color: 'var(--ssn-navy)' }}><ShieldCheck size={18} /></div>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{p.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>{p.type} • {p.status || p.review_stage}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {p.professor_comments && p.review_stage === 'Professor' && (
                          <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Needs Revision</span>
                        )}
                        <button onClick={() => handleEdit(p)} style={{ background: 'none', border: 'none', color: 'var(--ssn-navy)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>View/Revise</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ssn-card" style={{ padding: '2.5rem', background: 'linear-gradient(135deg, var(--ssn-navy) 0%, #0033a0 100%)', color: 'white' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white', marginBottom: '1.5rem' }}>IPR Protection Insight</h3>
                <p style={{ fontSize: '0.9rem', opacity: 0.8, lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  Filing an early invention disclosure through the portal secures an institutional priority date before full patent drafting.
                </p>
              </div>
            </div>
          </div>
        )}
        {activeModule === 'submit_research' && (
          <SubmitResearchForm
            user={user}
            mode="research"
            onSubmitted={() => { setActiveModule('overview'); fetchMyProjects(); setEditingProject(null); }}
            editingProject={editingProject}
            onCancelEdit={() => setEditingProject(null)}
          />
        )}
        {activeModule === 'submit' && (
          <SubmitResearchForm
            user={user}
            mode="ipr"
            onSubmitted={() => { setActiveModule('overview'); fetchMyProjects(); setEditingProject(null); }}
            editingProject={editingProject}
            onCancelEdit={() => setEditingProject(null)}
          />
        )}
        {activeModule === 'research_dashboard' && <ResearchAnalytics />}
        {activeModule === 'doi_scraper' && <DoiScraperModule />}
        {activeModule === 'journals' && <ResearchListModule moduleKey="journals" user={user} endpoint="/api/journals" title="Journal Publications" icon={<BookOpen size={32} />} />}
        {activeModule === 'conferences' && <ResearchListModule moduleKey="conferences" user={user} endpoint="/api/conferences" title="Conference Proceedings" icon={<Users size={32} />} />}
        {activeModule === 'articles' && <ResearchListModule moduleKey="articles" user={user} endpoint="/api/articles" title="Research Articles" icon={<Newspaper size={32} />} />}
        {activeModule === 'inproceedings' && <ResearchListModule moduleKey="inproceedings" user={user} endpoint="/api/inproceedings" title="In-proceedings" icon={<FolderTree size={32} />} />}
        
        {activeModule === 'strategic' && user.role === 'HOD' && <StrategicDashboard />}
        {activeModule === 'patents' && <PatentModuleList />}
        {activeModule === 'trademarks' && <IPRListModule type="Trademark" title="Trademarks" icon={<Award size={32} />} />}
        {activeModule === 'copyrights' && <IPRListModule type="Copyright" title="Copyright Assets" icon={<FileText size={32} />} />}
        {activeModule === 'approvals' && <ApprovalQueue role={user.role} />}
      </DashboardLayout>

      {/* Floating Action Button - Quick File IPR */}
      {(activeModule !== 'submit' && activeModule !== 'submit_research') && (
        <button
          className="fab-btn"
          onClick={handleFloatingAction}
          title={isResearchActive ? 'Add New Research Output' : 'File New IPR Disclosure'}
        >
          <Upload size={26} />
        </button>
      )}
    </>
  );
}

export default App;
