import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Search, Briefcase, Calendar, CheckCircle, Bookmark, BookmarkCheck, Star, MapPin, Clock, Filter } from 'lucide-react';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline: string;
  isFeatured: boolean;
  location?: string;
  stipend?: string;
  duration?: string;
  organization: { companyName: string; logoUrl?: string };
  _count?: { applications: number };
}

const API = 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');

const StudentDashboard = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const fetchOpportunities = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (sortBy === 'deadline') params.set('sort', 'deadline');
      if (sortBy === 'title') params.set('sort', 'title');

      const response = await fetch(`${API}/api/opportunities?${params}`);
      if (response.ok) setOpportunities(await response.json());
    } catch (error) {
      console.error('Failed to fetch opportunities', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const res = await fetch(`${API}/api/opportunities/user/bookmark-ids`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) setBookmarkedIds(await res.json());
    } catch (err) { /* ignore */ }
  };

  useEffect(() => { fetchOpportunities(); fetchBookmarks(); }, []);
  useEffect(() => { const timer = setTimeout(fetchOpportunities, 300); return () => clearTimeout(timer); }, [search, categoryFilter, sortBy]);

  const handleApply = async (oppId: string) => {
    setApplying(oppId);
    try {
      const response = await fetch(`${API}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ opportunityId: oppId }),
      });
      if (!response.ok) { const d = await response.json(); alert(d.error || 'Failed'); }
      else alert('Successfully applied!');
    } catch (error) {
      alert('Error submitting application');
    } finally {
      setApplying(null);
    }
  };

  const toggleBookmark = async (oppId: string) => {
    try {
      const res = await fetch(`${API}/api/opportunities/${oppId}/bookmark`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookmarkedIds(prev => data.bookmarked ? [...prev, oppId] : prev.filter(id => id !== oppId));
      }
    } catch (err) { /* ignore */ }
  };

  const getDeadlineBadge = (deadline: string) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return <span style={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: 600 }}>Expired</span>;
    if (days <= 3) return <span style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 600 }}>🔥 {days}d left</span>;
    if (days <= 7) return <span style={{ color: '#F59E0B', fontSize: '0.75rem', fontWeight: 600 }}>{days}d left</span>;
    return null;
  };

  return (
    <DashboardLayout role="STUDENT">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Discover Opportunities</h1>
        <p style={{ color: 'var(--text-muted)' }}>Find scholarships, internships, and programs that match your profile.</p>
      </div>

      {/* Search & Filters */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.5rem 1rem' }}>
            <Search size={20} style={{ color: 'var(--text-muted)', marginRight: '0.5rem', flexShrink: 0 }} />
            <input 
              type="text" placeholder="Search by title or description..." 
              style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '0.95rem', color: 'var(--text-main)' }}
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="form-input" style={{ flex: '0 0 170px' }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            <option value="SCHOLARSHIP">Scholarships</option>
            <option value="INTERNSHIP">Internships</option>
            <option value="GRANT">Grants</option>
            <option value="RESEARCH">Research</option>
            <option value="HACKATHON">Hackathons</option>
            <option value="FELLOWSHIP">Fellowships</option>
          </select>
          <select className="form-input" style={{ flex: '0 0 140px' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="deadline">Deadline</option>
            <option value="title">A–Z</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : opportunities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No opportunities found matching your criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.5rem' }}>
          {opportunities.map(opp => (
            <div key={opp.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {/* Bookmark */}
              <button onClick={() => toggleBookmark(opp.id)} style={{
                position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem',
                color: bookmarkedIds.includes(opp.id) ? 'var(--primary)' : 'var(--text-muted)'
              }}>
                {bookmarkedIds.includes(opp.id) ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
              </button>

              {/* Category + Featured */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', background: 'var(--accent-bg)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>
                  {opp.category}
                </span>
                {opp.isFeatured && (
                  <span style={{ padding: '0.25rem 0.5rem', borderRadius: '999px', background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Star size={12} /> Featured
                  </span>
                )}
                {getDeadlineBadge(opp.deadline)}
              </div>

              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>{opp.title}</h3>
              <p style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                {opp.organization.companyName}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {opp.description}
              </p>
              
              {/* Meta */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={14} /> {opp.deadline ? new Date(opp.deadline).toLocaleDateString() : 'No deadline'}
                </span>
                {opp.location && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={14} /> {opp.location}</span>}
                {opp.stipend && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>💰 {opp.stipend}</span>}
                {opp.duration && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14} /> {opp.duration}</span>}
              </div>
              
              <button 
                className="btn btn-primary" style={{ width: '100%' }}
                onClick={() => handleApply(opp.id)} disabled={applying === opp.id}
              >
                {applying === opp.id ? 'Applying...' : <><CheckCircle size={18} style={{ marginRight: '8px' }} /> Easy Apply</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentDashboard;
