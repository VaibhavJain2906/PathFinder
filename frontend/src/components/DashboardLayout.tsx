import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, PlusCircle, User, Briefcase, Sparkles, PieChart, Search, Bell, Bookmark, Users } from 'lucide-react';

const DashboardLayout = ({ children, role }: { children: React.ReactNode, role: 'STUDENT' | 'ORGANIZATION' | 'ADMIN' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/notifications/unread-count', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count);
        }
      } catch (err) { /* ignore */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = role === 'ORGANIZATION' 
    ? [
        { label: 'Dashboard', path: '/org/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'Post Opportunity', path: '/org/post-opportunity', icon: <PlusCircle size={20} /> },
        { label: 'Organization Profile', path: '/org/profile', icon: <Briefcase size={20} /> },
      ]
    : role === 'STUDENT'
    ? [
        { label: 'Discover', path: '/student/dashboard', icon: <Briefcase size={20} /> },
        { label: 'My Applications', path: '/student/applications', icon: <LayoutDashboard size={20} /> },
        { label: 'Saved', path: '/student/bookmarks', icon: <Bookmark size={20} /> },
        { label: 'My Profile', path: '/student/profile', icon: <User size={20} /> },
        { label: 'AI Assistant', path: '/student/ai-assistant', icon: <Sparkles size={20} /> },
      ]
    : role === 'ADMIN'
    ? [
        { label: 'Analytics', path: '/admin/dashboard', icon: <PieChart size={20} /> },
        { label: 'Users', path: '/admin/users', icon: <Users size={20} /> },
      ]
    : [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-light)' }}>
      {/* Sidebar */}
      <div style={{ width: '260px', background: 'var(--bg-white)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '1.5rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', color: 'var(--primary)' }}>
          <Briefcase size={28} />
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>PathFinder</h2>
        </div>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.75rem', 
                  padding: '0.75rem 1rem', borderRadius: '10px',
                  background: isActive ? 'var(--accent-bg)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  textDecoration: 'none', fontWeight: 500,
                  transition: 'var(--transition)',
                  fontSize: '0.925rem',
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}

          {/* Shared items */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '0.75rem 0', paddingTop: '0.75rem' }}>
            <Link to="/search" style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1rem', borderRadius: '10px',
              background: location.pathname === '/search' ? 'var(--accent-bg)' : 'transparent',
              color: location.pathname === '/search' ? 'var(--primary)' : 'var(--text-muted)',
              textDecoration: 'none', fontWeight: 500, fontSize: '0.925rem',
              transition: 'var(--transition)',
            }}>
              <Search size={20} /> Search
            </Link>
            <Link to="/notifications" style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1rem', borderRadius: '10px',
              background: location.pathname === '/notifications' ? 'var(--accent-bg)' : 'transparent',
              color: location.pathname === '/notifications' ? 'var(--primary)' : 'var(--text-muted)',
              textDecoration: 'none', fontWeight: 500, fontSize: '0.925rem',
              transition: 'var(--transition)',
            }}>
              <Bell size={20} /> 
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: 'auto', background: '#EF4444', color: 'white',
                  borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 700,
                  minWidth: '20px', textAlign: 'center',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
