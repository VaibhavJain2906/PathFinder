import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, PlusCircle, User, Briefcase, Sparkles, PieChart, Search, Bell, Bookmark, Users, Compass, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DashboardLayout = ({ children, role }: { children: React.ReactNode, role: 'STUDENT' | 'ORGANIZATION' | 'ADMIN' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const { theme, toggleTheme } = useTheme();

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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Sidebar - Dark Charcoal theme for confidence/contrast */}
      <div style={{ width: '280px', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', padding: '2rem 1.5rem', flexShrink: 0 }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ background: 'var(--primary)', color: 'var(--bg-dark)', padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(168, 224, 99, 0.3)' }}>
            <Compass size={24} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#ffffff', letterSpacing: '-0.02em', fontWeight: 800 }}>PathFinder</h2>
        </div>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.85rem', 
                  padding: '0.85rem 1.25rem', borderRadius: '12px',
                  background: isActive ? 'rgba(168, 224, 99, 0.1)' : 'transparent',
                  color: isActive ? 'var(--primary)' : '#a0a0b0',
                  textDecoration: 'none', fontWeight: isActive ? 600 : 500,
                  transition: 'var(--transition)',
                  fontSize: '0.95rem',
                  border: isActive ? '1px solid rgba(168, 224, 99, 0.2)' : '1px solid transparent'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = 'var(--primary)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.03)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = '#a0a0b0';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}

          {/* Shared items */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '1rem 0', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Link to="/search" style={{
              display: 'flex', alignItems: 'center', gap: '0.85rem',
              padding: '0.85rem 1.25rem', borderRadius: '12px',
              background: location.pathname === '/search' ? 'rgba(168, 224, 99, 0.1)' : 'transparent',
              color: location.pathname === '/search' ? 'var(--primary)' : '#a0a0b0',
              textDecoration: 'none', fontWeight: location.pathname === '/search' ? 600 : 500, fontSize: '0.95rem',
              transition: 'var(--transition)',
              border: location.pathname === '/search' ? '1px solid rgba(168, 224, 99, 0.2)' : '1px solid transparent'
            }}
            onMouseEnter={e => {
              if (location.pathname !== '/search') {
                (e.currentTarget as HTMLElement).style.color = 'var(--primary)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.03)';
              }
            }}
            onMouseLeave={e => {
              if (location.pathname !== '/search') {
                (e.currentTarget as HTMLElement).style.color = '#a0a0b0';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }
            }}>
              <Search size={20} /> Search
            </Link>
            <Link to="/notifications" style={{
              display: 'flex', alignItems: 'center', gap: '0.85rem',
              padding: '0.85rem 1.25rem', borderRadius: '12px',
              background: location.pathname === '/notifications' ? 'rgba(168, 224, 99, 0.1)' : 'transparent',
              color: location.pathname === '/notifications' ? 'var(--primary)' : '#a0a0b0',
              textDecoration: 'none', fontWeight: location.pathname === '/notifications' ? 600 : 500, fontSize: '0.95rem',
              transition: 'var(--transition)',
              border: location.pathname === '/notifications' ? '1px solid rgba(168, 224, 99, 0.2)' : '1px solid transparent'
            }}
            onMouseEnter={e => {
              if (location.pathname !== '/notifications') {
                (e.currentTarget as HTMLElement).style.color = 'var(--primary)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.03)';
              }
            }}
            onMouseLeave={e => {
              if (location.pathname !== '/notifications') {
                (e.currentTarget as HTMLElement).style.color = '#a0a0b0';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }
            }}>
              <Bell size={20} /> 
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: 'auto', background: '#EF4444', color: 'white',
                  borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 700,
                  minWidth: '20px', textAlign: 'center', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </nav>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem' }}>
          <button 
            onClick={toggleTheme} 
            style={{ 
              width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center',
              padding: '0.85rem 1.25rem', borderRadius: '99px',
              background: 'rgba(255, 255, 255, 0.05)', color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'var(--transition)',
              marginBottom: '0.5rem'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />} 
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          
          <button 
            onClick={handleLogout} 
            style={{ 
              width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center',
              padding: '0.85rem 1.25rem', borderRadius: '99px',
              background: 'rgba(255, 255, 255, 0.05)', color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', transition: 'var(--transition)'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(248, 113, 113, 0.15)';
              (e.currentTarget as HTMLElement).style.color = '#f87171';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(248, 113, 113, 0.3)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)';
              (e.currentTarget as HTMLElement).style.color = '#ffffff';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '3rem 2rem', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
