import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Calendar, MapPin, Clock, BookmarkMinus } from 'lucide-react';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');

interface Opportunity {
  id: string;
  bookmarkId: string;
  title: string;
  organization: { companyName: string };
  deadline: string;
  location: string;
  category: string;
  stipend: string;
}

const BookmarkedOpportunities = () => {
  const [bookmarks, setBookmarks] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    try {
      const res = await fetch(`${API}/api/opportunities/user/bookmarks`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        setBookmarks(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleRemove = async (oppId: string) => {
    try {
      const res = await fetch(`${API}/api/opportunities/${oppId}/bookmark`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        setBookmarks(bookmarks.filter(b => b.id !== oppId));
      }
    } catch (err) {
      alert('Failed to remove bookmark');
    }
  };

  return (
    <DashboardLayout role="STUDENT">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Saved Opportunities</h1>
        <p style={{ color: 'var(--text-muted)' }}>Opportunities you have bookmarked for later.</p>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : bookmarks.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <BookmarkMinus size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)' }}>You haven't saved any opportunities yet.</p>
          <Link to="/student/dashboard" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}>
            Discover Opportunities
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {bookmarks.map(opp => (
            <div key={opp.bookmarkId} className="glass-card" style={{ padding: '1.5rem', position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'var(--accent-bg)', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 600 }}>
                  {opp?.category || 'Unknown'}
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{opp?.title || 'Untitled'}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500, marginBottom: '1rem' }}>
                {opp?.organization?.companyName || 'Unknown Organization'}
              </p>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                {opp.deadline && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={14} /> Deadline: {new Date(opp.deadline).toLocaleDateString()}
                  </span>
                )}
                {opp.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={14} /> {opp.location}
                  </span>
                )}
                {opp.stipend && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={14} /> {opp.stipend}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button 
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                  onClick={() => handleRemove(opp.id)}
                >
                  Remove
                </button>
                {/* Normally we'd navigate to details or apply directly, but for now we'll just link to dashboard to find it */}
                <Link to="/student/dashboard" className="btn btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', textDecoration: 'none', textAlign: 'center' }}>
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default BookmarkedOpportunities;
