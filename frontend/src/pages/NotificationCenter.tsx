import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Bell, CheckCircle, ExternalLink, Calendar, Building, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const getRole = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role;
};

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const role = getRole();

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API}/api/notifications?limit=50`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch (err) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`${API}/api/notifications/${id}/read`, { method: 'PUT', headers: { 'Authorization': `Bearer ${getToken()}` } });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch(`${API}/api/notifications/read-all`, { method: 'PUT', headers: { 'Authorization': `Bearer ${getToken()}` } });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {}
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'STATUS_CHANGE': return <CheckCircle size={20} color="#059669" />;
      case 'NEW_APPLICATION': return <Briefcase size={20} color="#2563EB" />;
      case 'DEADLINE': return <Calendar size={20} color="#DC2626" />;
      case 'SYSTEM':
      default: return <Bell size={20} color="#6B7280" />;
    }
  };

  return (
    <DashboardLayout role={role}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Notifications</h1>
          <p style={{ color: 'var(--text-muted)' }}>Stay updated on your applications and platform activity.</p>
        </div>
        {notifications.some(n => !n.read) && (
          <button className="btn btn-outline" onClick={handleMarkAllRead}>Mark All as Read</button>
        )}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : notifications.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Bell size={48} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>You're all caught up! No notifications.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map(notif => (
            <div 
              key={notif.id} 
              className="glass-card" 
              style={{ 
                padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start',
                borderLeft: notif.read ? 'none' : '4px solid var(--primary)',
                opacity: notif.read ? 0.7 : 1,
                cursor: notif.read ? 'default' : 'pointer'
              }}
              onClick={() => !notif.read && handleMarkAsRead(notif.id)}
            >
              <div style={{ padding: '0.5rem', background: 'var(--bg-light)', borderRadius: '50%' }}>
                {getIcon(notif.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>{notif.title}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(notif.createdAt).toLocaleString()}</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: notif.link ? '0.75rem' : 0 }}>{notif.message}</p>
                {notif.link && (
                  <Link to={notif.link} style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    View details <ExternalLink size={14} />
                  </Link>
                )}
              </div>
              {!notif.read && (
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', marginTop: '0.5rem' }}></div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default NotificationCenter;
