import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, LifeBuoy, AlertCircle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

export default function Tickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New ticket state
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('REPORT');
  const [priority, setPriority] = useState('MEDIUM');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const endpoint = isAdmin ? '/api/tickets/admin' : '/api/tickets/mine';
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ subject, description, type, priority })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setSubject('');
        setDescription('');
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'var(--danger)';
      case 'IN_PROGRESS': return 'var(--warning)';
      case 'RESOLVED': return 'var(--success)';
      default: return 'var(--text-secondary)';
    }
  };

  if (loading) return <DashboardLayout role={user.role as any}><div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading tickets...</div></DashboardLayout>;

  return (
    <DashboardLayout role={user.role as any}>
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LifeBuoy size={28} color="var(--primary)" />
            Support Tickets
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {isAdmin ? 'Manage user reports and feature requests.' : 'Report an issue or request a feature.'}
          </p>
        </div>
        
        {!isAdmin && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> New Ticket
          </button>
        )}
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        {tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
            <AlertCircle size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <p>No tickets found.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontWeight: 500 }}>Subject</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontWeight: 500 }}>Type</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontWeight: 500 }}>Priority</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontWeight: 500 }}>Status</th>
                {isAdmin && <th style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontWeight: 500 }}>User</th>}
                <th style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontWeight: 500 }}>Date</th>
                <th style={{ padding: '1rem 0' }}></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 0', fontWeight: 500, color: 'var(--text-primary)' }}>{ticket.subject}</td>
                  <td style={{ padding: '1rem 0' }}>
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'var(--bg-page)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                      {ticket.type}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0' }}>
                     <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'var(--bg-page)', borderRadius: '4px', color: ticket.priority === 'HIGH' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: getStatusColor(ticket.status) }}>
                      {ticket.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {ticket.creator?.email} ({ticket.creator?.role})
                    </td>
                  )}
                  <td style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                    <Link to={`/tickets/${ticket.id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                      View Details &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card animate-fade-in-up" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Create New Ticket</h2>
            <form onSubmit={handleCreateTicket}>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input type="text" className="form-input" value={subject} onChange={e => setSubject(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Type</label>
                  <select className="form-input" value={type} onChange={e => setType(e.target.value)}>
                    <option value="BUG">Bug Report</option>
                    <option value="FEATURE_REQUEST">Feature Request</option>
                    <option value="REPORT">Report Content</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={priority} onChange={e => setPriority(e.target.value)}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={4} value={description} onChange={e => setDescription(e.target.value)} required></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)' }} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
