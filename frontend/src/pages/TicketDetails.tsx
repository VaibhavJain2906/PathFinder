import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Send, User } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

export default function TicketDetails() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/tickets/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTicket(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await fetch(`http://localhost:5000/api/tickets/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: newMessage })
      });
      
      if (res.ok) {
        setNewMessage('');
        fetchTicket(); // Reload ticket to get new message
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    try {
      const res = await fetch(`http://localhost:5000/api/tickets/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setTicket({ ...ticket, status: newStatus });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <DashboardLayout role={user.role as any}><div style={{ padding: '2rem' }}>Loading ticket...</div></DashboardLayout>;
  if (!ticket) return <DashboardLayout role={user.role as any}><div style={{ padding: '2rem' }}>Ticket not found or access denied.</div></DashboardLayout>;

  return (
    <DashboardLayout role={user.role as any}>
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/tickets" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back to Tickets
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{ticket.subject}</h1>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Ticket #{ticket.id.slice(0, 8)}</span>
              <span style={{ padding: '0.25rem 0.5rem', background: 'var(--bg-page)', borderRadius: '4px', color: 'var(--text-secondary)' }}>{ticket.type}</span>
              <span style={{ padding: '0.25rem 0.5rem', background: 'var(--bg-page)', borderRadius: '4px', color: ticket.priority === 'HIGH' ? 'var(--danger)' : 'var(--text-secondary)' }}>{ticket.priority} Priority</span>
            </div>
          </div>

          {isAdmin ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Status:</span>
              <select className="form-input" value={ticket.status} onChange={handleStatusChange} style={{ padding: '0.5rem', minWidth: '150px' }}>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          ) : (
            <div style={{ padding: '0.5rem 1rem', borderRadius: '4px', background: 'var(--bg-page)', fontWeight: 600 }}>
              Status: {ticket.status}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ticket.creator?.email} ({ticket.creator?.role})</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(ticket.createdAt).toLocaleString()}</div>
          </div>
        </div>
        <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{ticket.description}</p>
      </div>

      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
        <MessageSquare size={20} /> Conversation
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
        {ticket.messages.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No replies yet.</p>
        ) : (
          ticket.messages.map((msg: any) => {
            const isMe = msg.senderId === user.id;
            const isAdminReply = msg.sender.role === 'ADMIN';
            
            return (
              <div key={msg.id} style={{ display: 'flex', gap: '1rem', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isAdminReply ? 'var(--primary)' : 'var(--bg-page)', color: isAdminReply ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={18} />
                </div>
                <div style={{ maxWidth: '70%', background: isMe ? 'var(--accent-bg)' : 'var(--bg-page)', padding: '1rem', borderRadius: '12px', borderTopLeftRadius: !isMe ? 0 : '12px', borderTopRightRadius: isMe ? 0 : '12px' }}>
                  <div style={{ fontSize: '0.8rem', color: isMe ? 'var(--primary)' : 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                    {msg.sender.email} {isAdminReply && <span style={{ padding: '2px 6px', background: 'var(--primary)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem', marginLeft: '0.5rem' }}>Admin</span>}
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{msg.message}</p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'right' }}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' ? (
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '1rem' }}>
          <textarea 
            className="form-input" 
            style={{ flex: 1 }} 
            rows={2} 
            placeholder="Type your reply here..." 
            value={newMessage} 
            onChange={e => setNewMessage(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={18} /> Reply
          </button>
        </form>
      ) : (
        <div style={{ padding: '1rem', background: 'var(--bg-page)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          This ticket has been {ticket.status.toLowerCase()}. You cannot add new replies.
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
