import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useLocation } from 'react-router-dom';
import { Users, Briefcase, FileText, CheckCircle, Clock, ShieldAlert, Download, Server, HardDrive, Cpu, Activity, Trash2, Search } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');

const AdminDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [usersData, setUsersData] = useState<any>(null);
  const [opportunitiesData, setOpportunitiesData] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'OPPORTUNITIES' | 'SYSTEM'>(
    location.pathname.includes('/users') ? 'USERS' : 'OVERVIEW'
  );
  const [userSearch, setUserSearch] = useState('');
  const [oppSearch, setOppSearch] = useState('');

  useEffect(() => {
    if (location.pathname.includes('/users')) setActiveTab('USERS');
    else if (location.pathname.includes('/dashboard')) setActiveTab('OVERVIEW');
  }, [location.pathname]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API}/api/admin/analytics`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (res.ok) setData(await res.json());
    } catch (err) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API}/api/admin/users?search=${userSearch}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (res.ok) setUsersData(await res.json());
    } catch (err) {}
  };

  const fetchOpportunities = async () => {
    try {
      const res = await fetch(`${API}/api/admin/opportunities?search=${oppSearch}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (res.ok) {
        const d = await res.json();
        setOpportunitiesData(d.opportunities);
      }
    } catch (err) {}
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API}/api/admin/system-health`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
      if (res.ok) setHealthData(await res.json());
    } catch (err) {}
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchDashboardData(), fetchUsers(), fetchOpportunities(), fetchHealth()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  useEffect(() => {
    if (activeTab === 'USERS') {
      const timer = setTimeout(fetchUsers, 500);
      return () => clearTimeout(timer);
    }
  }, [userSearch, activeTab]);

  useEffect(() => {
    if (activeTab === 'OPPORTUNITIES') {
      const timer = setTimeout(fetchOpportunities, 500);
      return () => clearTimeout(timer);
    }
  }, [oppSearch, activeTab]);

  const handleChangeRole = async (id: string, role: string) => {
    if (!window.confirm(`Change role to ${role}?`)) return;
    try {
      const res = await fetch(`${API}/api/admin/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ role })
      });
      if (res.ok) fetchUsers();
    } catch (err) { alert('Failed to change role'); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone and will delete all their associated data.')) return;
    try {
      const res = await fetch(`${API}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        fetchUsers();
        fetchDashboardData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete');
      }
    } catch (err) { alert('Error deleting user'); }
  };

  const handleDeleteOpportunity = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this opportunity? This will also delete all applications for it.')) return;
    try {
      const res = await fetch(`${API}/api/admin/opportunities/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        fetchOpportunities();
        fetchDashboardData();
      } else {
        alert('Failed to delete');
      }
    } catch (err) { alert('Error deleting opportunity'); }
  };

  const handleExport = () => {
    window.open(`${API}/api/admin/analytics/export?token=${getToken()}`, '_blank');
  };

  if (loading) return <DashboardLayout role="ADMIN"><p>Loading...</p></DashboardLayout>;

  return (
    <DashboardLayout role="ADMIN">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Admin Command Center</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Platform analytics, user management, and system health.</p>
        </div>
        <button className="btn btn-outline" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Download size={18} /> Export Analytics (CSV)
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'rgba(255, 255, 255, 0.5)', padding: '0.5rem', borderRadius: '99px', width: 'fit-content', border: '1px solid rgba(0,0,0,0.05)' }}>
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: <Activity size={18} /> },
          { id: 'USERS', label: 'Users', icon: <Users size={18} /> },
          { id: 'OPPORTUNITIES', label: 'Opportunities', icon: <Briefcase size={18} /> },
          { id: 'SYSTEM', label: 'System Health', icon: <Server size={18} /> },
        ].map(tab => (
          <button
            key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            style={{
              background: activeTab === tab.id ? 'var(--bg-surface)' : 'transparent', border: 'none', padding: '0.6rem 1.25rem', cursor: 'pointer',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-primary)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              borderRadius: '99px',
              transition: 'var(--transition)', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'OVERVIEW' && data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={24} /></div>
              <div><p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>Total Users</p><h2 style={{ margin: 0, fontSize: '1.8rem' }}>{data.metrics.totalUsers}</h2></div>
            </div>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-bg)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Briefcase size={24} /></div>
              <div><p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>Opportunities</p><h2 style={{ margin: 0, fontSize: '1.8rem' }}>{data.metrics.totalOpportunities}</h2></div>
            </div>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={24} /></div>
              <div><p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>Applications</p><h2 style={{ margin: 0, fontSize: '1.8rem' }}>{data.metrics.totalApplications}</h2></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="glass-card">
              <h3 style={{ marginBottom: '1.5rem' }}>Application Status Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#D1FAE5', color: '#065F46', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}><CheckCircle size={18} /> Accepted</div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{data.metrics.applicationBreakdown.accepted}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}><ShieldAlert size={18} /> Rejected</div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{data.metrics.applicationBreakdown.rejected}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#FEF3C7', color: '#92400E', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}><Clock size={18} /> Pending / Review</div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{data.metrics.applicationBreakdown.pending + data.metrics.applicationBreakdown.shortlisted}</span>
                </div>
              </div>
            </div>

            <div className="glass-card">
              <h3 style={{ marginBottom: '1.5rem' }}>Recent Platform Activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {data.recentActivity.map((app: any) => (
                  <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        <strong>{app.student.firstName} {app.student.lastName}</strong> applied to <strong>{app.opportunity.title}</strong> at <strong>{app.opportunity.organization.companyName}</strong>
                      </p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(app.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'USERS' && usersData && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>All Users ({usersData.total})</h3>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem 1rem' }}>
              <Search size={18} color="var(--text-secondary)" style={{ marginRight: '0.5rem' }} />
              <input 
                type="text" placeholder="Search emails..." 
                value={userSearch} onChange={e => setUserSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '250px' }}
              />
            </div>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem' }}>Email</th>
                <th style={{ padding: '1rem' }}>Role</th>
                <th style={{ padding: '1rem' }}>Joined</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersData.users.map((user: any) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{user.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: 'var(--accent-bg)', color: 'var(--secondary)' }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <select 
                      className="form-input" style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                      value={user.role} onChange={(e) => handleChangeRole(user.id, e.target.value)}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="ORGANIZATION">Organization</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <button className="btn" style={{ padding: '0.4rem', color: '#DC2626' }} onClick={() => handleDeleteUser(user.id)} title="Delete User">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'OPPORTUNITIES' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>All Published Opportunities</h3>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem 1rem' }}>
              <Search size={18} color="var(--text-secondary)" style={{ marginRight: '0.5rem' }} />
              <input 
                type="text" placeholder="Search opportunities..." 
                value={oppSearch} onChange={e => setOppSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '250px' }}
              />
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem' }}>Title</th>
                <th style={{ padding: '1rem' }}>Organization</th>
                <th style={{ padding: '1rem' }}>Category</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {opportunitiesData.map((opp: any) => (
                <tr key={opp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{opp.title}</td>
                  <td style={{ padding: '1rem' }}>{opp.organization.companyName}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: 'var(--bg-light)' }}>
                      {opp.category}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button className="btn btn-outline" style={{ padding: '0.4rem', color: '#DC2626', borderColor: '#FCA5A5' }} onClick={() => handleDeleteOpportunity(opp.id)} title="Delete Opportunity">
                      <Trash2 size={16} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {opportunitiesData.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No opportunities found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'SYSTEM' && healthData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="glass-card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={20} /> Server Status
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Status</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></div>
                  {healthData.status.toUpperCase()}
                </div>
              </div>
              <div style={{ background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Uptime</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{Math.floor(healthData.uptime / 3600)}h {Math.floor((healthData.uptime % 3600) / 60)}m</div>
              </div>
              <div style={{ background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Node Version</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{healthData.nodeVersion}</div>
              </div>
            </div>
          </div>
          
          <div className="glass-card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HardDrive size={20} /> Database Metrics
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Total Users', value: healthData.database.users },
                { label: 'Total Opportunities', value: healthData.database.opportunities },
                { label: 'Total Applications', value: healthData.database.applications },
                { label: 'Notifications Processed', value: healthData.database.notifications },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-surface-hover)', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
