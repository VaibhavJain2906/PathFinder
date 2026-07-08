import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { PlusCircle, Users, Edit3, Trash2, Calendar, Copy, Archive, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');

interface Opportunity {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
  deadline: string;
  _count: { applications: number };
}

const OrganizationDashboard = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const navigate = useNavigate();

  const fetchOpportunities = async () => {
    try {
      const res = await fetch(`${API}/api/opportunities/org/mine`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) setOpportunities(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOpportunities(); }, []);

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/opportunities/${id}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        alert('Opportunity duplicated as Draft');
        fetchOpportunities();
      }
    } catch (err) { alert('Failed to duplicate'); }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      // In a real app we'd have a specific endpoint, but for now we'll do a PUT with the new status
      // We'll need to fetch the existing opp first to keep other fields intact, 
      // or assume the backend accepts partial updates (our backend expects all fields or they get null'd if not careful).
      // Wait, our PUT /:id expects full body. For simplicity, we'll implement a dedicated status route if we had one.
      // Since we don't, I will just alert for now, or we can add it to the backend.
      // Let's assume we can fetch and PUT.
      const opp = opportunities.find(o => o.id === id);
      if (!opp) return;

      const fullRes = await fetch(`${API}/api/opportunities/${id}`);
      if (!fullRes.ok) return;
      const fullOpp = await fullRes.json();

      const updateRes = await fetch(`${API}/api/opportunities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ ...fullOpp, status: newStatus })
      });
      if (updateRes.ok) {
        fetchOpportunities();
      }
    } catch (err) { alert('Failed to update status'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this opportunity? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API}/api/opportunities/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        fetchOpportunities();
      } else {
        alert('Failed to delete opportunity');
      }
    } catch (err) { alert('Error deleting opportunity'); }
  };

  const filtered = filter === 'ALL' ? opportunities : opportunities.filter(o => o.status === filter);

  return (
    <DashboardLayout role="ORGANIZATION">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your opportunities and applicants.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/org/post-opportunity')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusCircle size={18} /> Post New Opportunity
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'rgba(255, 255, 255, 0.5)', padding: '0.5rem', borderRadius: '99px', width: 'fit-content', border: '1px solid rgba(0,0,0,0.05)' }}>
        {['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              background: filter === status ? 'var(--bg-surface)' : 'transparent', border: 'none', padding: '0.6rem 1.25rem', cursor: 'pointer',
              color: filter === status ? 'var(--primary)' : 'var(--text-primary)',
              fontWeight: filter === status ? 700 : 500,
              borderRadius: '99px',
              transition: 'var(--transition)'
            }}
          >
            {status === 'ALL' ? 'All Opportunities' : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No opportunities found in this category.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filtered.map(opp => (
            <div key={opp.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{opp.title}</h3>
                  <span style={{ 
                    padding: '0.35rem 0.85rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase',
                    background: opp.status === 'PUBLISHED' ? 'var(--accent-bg)' : opp.status === 'DRAFT' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                    color: opp.status === 'PUBLISHED' ? 'var(--primary)' : opp.status === 'DRAFT' ? '#D97706' : 'var(--text-secondary)'
                  }}>
                    {opp.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} /> Created: {new Date(opp.createdAt).toLocaleDateString()}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={14} /> {opp._count.applications} Applicants
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-outline" 
                  onClick={() => navigate(`/org/applicants/${opp.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Users size={16} /> View Applicants
                </button>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-outline" style={{ padding: '0.5rem' }} title="Edit">
                    <Edit3 size={18} />
                  </button>
                  <button className="btn btn-outline" style={{ padding: '0.5rem' }} title="Duplicate" onClick={() => handleDuplicate(opp.id)}>
                    <Copy size={18} />
                  </button>
                  {opp.status === 'PUBLISHED' && (
                    <button className="btn btn-outline" style={{ padding: '0.5rem', color: '#DC2626', borderColor: '#FCA5A5' }} title="Archive" onClick={() => handleStatusChange(opp.id, 'ARCHIVED')}>
                      <Archive size={18} />
                    </button>
                  )}
                  {opp.status === 'DRAFT' && (
                    <button className="btn btn-outline" style={{ padding: '0.5rem', color: '#059669', borderColor: '#A7F3D0' }} title="Publish" onClick={() => handleStatusChange(opp.id, 'PUBLISHED')}>
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button className="btn btn-outline" style={{ padding: '0.5rem', color: '#DC2626', borderColor: '#FCA5A5' }} title="Delete" onClick={() => handleDelete(opp.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default OrganizationDashboard;
