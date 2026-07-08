import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Search as SearchIcon, Building, Briefcase, ChevronRight, BookmarkPlus, Save, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const getRole = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role;
};

interface SearchResults {
  opportunities: any[];
  organizations: any[];
}

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ opportunities: [], organizations: [] });
  const [loading, setLoading] = useState(false);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'OPP' | 'ORG'>('ALL');
  const role = getRole();
  const navigate = useNavigate();

  const loadSavedSearches = async () => {
    try {
      const res = await fetch(`${API}/api/search/saved`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (res.ok) setSavedSearches(await res.json());
    } catch (err) {}
  };

  useEffect(() => { loadSavedSearches(); }, []);

  const handleSearch = async (e?: React.FormEvent, q: string = query) => {
    if (e) e.preventDefault();
    if (!q.trim()) { setResults({ opportunities: [], organizations: [] }); return; }
    
    setLoading(true);
    setQuery(q);
    try {
      const res = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) setResults(await res.json());
    } catch (err) {} 
    finally { setLoading(false); }
  };

  const handleSaveSearch = async () => {
    if (!query.trim()) return;
    const name = prompt('Name this search:', query);
    if (!name) return;

    try {
      const res = await fetch(`${API}/api/search/saved`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ name, query: { q: query } })
      });
      if (res.ok) {
        alert('Search saved');
        loadSavedSearches();
      }
    } catch (err) {}
  };

  const handleDeleteSavedSearch = async (id: string) => {
    try {
      await fetch(`${API}/api/search/saved/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      loadSavedSearches();
    } catch (err) {}
  };

  return (
    <DashboardLayout role={role}>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Global Search</h1>
        <p style={{ color: 'var(--text-muted)' }}>Find opportunities and organizations across the platform.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        <div>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-white)', border: '2px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
              <SearchIcon size={20} color="var(--text-muted)" style={{ marginRight: '0.75rem' }} />
              <input 
                type="text" placeholder="Search internships, companies, skills..." 
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '1rem', color: 'var(--text-main)' }}
                value={query} onChange={e => setQuery(e.target.value)} autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0 1.5rem' }}>Search</button>
            <button type="button" className="btn btn-outline" onClick={handleSaveSearch} title="Save this search">
              <Save size={20} />
            </button>
          </form>

          {loading && <p>Searching...</p>}
          
          {!loading && (results.opportunities.length > 0 || results.organizations.length > 0) && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              {[
                { id: 'ALL', label: `All Results (${results.opportunities.length + results.organizations.length})` },
                { id: 'OPP', label: `Opportunities (${results.opportunities.length})` },
                { id: 'ORG', label: `Organizations (${results.organizations.length})` }
              ].map(tab => (
                <button
                  key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    background: 'none', border: 'none', padding: '0.75rem 0', cursor: 'pointer',
                    color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: activeTab === tab.id ? 600 : 500,
                    borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                    marginBottom: '-1px'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {!loading && results.opportunities.length === 0 && results.organizations.length === 0 && query && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>No results found for "{query}".</p>
            </div>
          )}

          {!loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(activeTab === 'ALL' || activeTab === 'OPP') && results.opportunities.map(opp => (
                <div key={opp.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--accent-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'var(--bg-light)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{opp.category}</span>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{opp.title}</h3>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{opp.organization.companyName}</p>
                  </div>
                  <button className="btn btn-outline" onClick={() => navigate('/student/dashboard')}>View</button>
                </div>
              ))}

              {(activeTab === 'ALL' || activeTab === 'ORG') && results.organizations.map(org => (
                <div key={org.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#F3F4F6', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{org.companyName}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{org.industry || 'Organization'}</p>
                  </div>
                  <button className="btn btn-outline" disabled>View Profile</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="glass-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <BookmarkPlus size={18} /> Saved Searches
            </h3>
            {savedSearches.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No saved searches yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {savedSearches.map(s => {
                  const q = JSON.parse(s.query).q;
                  return (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-light)', borderRadius: '8px' }}>
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', flex: 1, color: 'var(--text-main)', fontWeight: 500 }}
                        onClick={() => handleSearch(undefined, q)}
                      >
                        {s.name}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>"{q}"</div>
                      </button>
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '0.25rem' }}
                        onClick={() => handleDeleteSavedSearch(s.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SearchPage;
