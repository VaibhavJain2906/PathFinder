import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Calendar, Building, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, AlertCircle, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');

interface ApplicationEvent {
  id: string;
  type: string;
  details: string;
  createdAt: string;
}

interface Application {
  id: string;
  status: string;
  createdAt: string;
  opportunity: {
    title: string;
    organization: { companyName: string };
  };
  events: ApplicationEvent[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING': return { bg: '#FEF3C7', text: '#D97706' };
    case 'REVIEWING': return { bg: '#DBEAFE', text: '#2563EB' };
    case 'SHORTLISTED': return { bg: '#E0E7FF', text: '#4F46E5' };
    case 'ACCEPTED': return { bg: '#D1FAE5', text: '#059669' };
    case 'REJECTED': return { bg: '#FEE2E2', text: '#DC2626' };
    case 'WITHDRAWN': return { bg: '#F3F4F6', text: '#6B7280' };
    default: return { bg: '#F3F4F6', text: '#6B7280' };
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ACCEPTED': return <CheckCircle size={16} />;
    case 'REJECTED':
    case 'WITHDRAWN': return <XCircle size={16} />;
    case 'PENDING':
    case 'REVIEWING':
    case 'SHORTLISTED':
    default: return <Clock size={16} />;
  }
};

const StudentApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API}/api/applications/student?status=${filter}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) setApplications(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const handleWithdraw = async (id: string) => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API}/api/applications/${id}/withdraw`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        alert('Application withdrawn');
        fetchApplications();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to withdraw');
      }
    } catch (err) {
      alert('Error withdrawing application');
    }
  };

  if (loading) return <DashboardLayout role="STUDENT"><p>Loading...</p></DashboardLayout>;

  return (
    <DashboardLayout role="STUDENT">
      <div style={{ marginBottom: '2rem' }}>
        <h1>My Applications</h1>
        <p style={{ color: 'var(--text-muted)' }}>Track the status of your applications and view timeline updates.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        {['ALL', 'PENDING', 'REVIEWING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              background: 'none', border: 'none',
              padding: '0.75rem 0',
              cursor: 'pointer',
              color: filter === status ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: filter === status ? 600 : 500,
              borderBottom: filter === status ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-1px'
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {applications.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No applications found in this category.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.map(app => {
            const colors = getStatusColor(app.status);
            const isExpanded = expandedId === app.id;

            return (
              <div key={app.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div 
                  style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                >
                  <div>
                    <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>{app.opportunity.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Building size={14} /> {app.opportunity.organization.companyName}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} /> Applied on {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      background: colors.bg, color: colors.text,
                      padding: '0.3rem 0.75rem', borderRadius: '999px',
                      fontSize: '0.75rem', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: '0.3rem'
                    }}>
                      {getStatusIcon(app.status)}
                      {app.status}
                    </div>
                    {isExpanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', background: 'var(--bg-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>Application Timeline</h4>
                        <div style={{ position: 'relative', paddingLeft: '1rem', borderLeft: '2px solid var(--border)', marginLeft: '0.5rem' }}>
                          {app.events.map((event, idx) => (
                            <div key={event.id} style={{ marginBottom: idx === app.events.length - 1 ? 0 : '1rem', position: 'relative' }}>
                              <div style={{
                                position: 'absolute', left: '-1.35rem', top: '0.2rem',
                                width: '10px', height: '10px', borderRadius: '50%',
                                background: 'var(--primary)', border: '2px solid var(--bg-white)'
                              }}></div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{event.details}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {new Date(event.createdAt).toLocaleString()}
                              </div>
                            </div>
                          ))}
                          {app.events.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No events recorded.</p>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', minWidth: '150px' }}>
                        {app.status !== 'WITHDRAWN' && app.status !== 'ACCEPTED' && app.status !== 'REJECTED' && (
                          <button 
                            className="btn"
                            style={{ background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                            onClick={(e) => { e.stopPropagation(); handleWithdraw(app.id); }}
                          >
                            <X size={16} /> Withdraw
                          </button>
                        )}
                        {app.status === 'WITHDRAWN' && (
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <AlertCircle size={14} /> Application withdrawn
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentApplications;
