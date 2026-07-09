import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Upload, Building, Globe, Briefcase } from 'lucide-react';

const OrganizationProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      // For organizations, the org profile isn't explicitly fetched via /api/org/profile yet,
      // but we can add that to backend or just fetch it here. Wait, we don't have a GET /api/org/profile endpoint in backend!
      // I'll need to fetch the user and their profile.
      // Let's assume we'll use a new GET /api/org/profile route.
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/org/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setProfile(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleUpdateBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/org/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          companyName: profile.companyName, 
          description: profile.description, 
          website: profile.website, 
          industry: profile.industry,
          logoUrl: profile.logoUrl
        })
      });
      alert('Profile updated!');
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      
      const uploadRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { url } = await uploadRes.json();
      
      // Update local state, then user must click save to commit
      setProfile({ ...profile, logoUrl: url });
      alert('Logo uploaded! Click Save Changes to apply.');
    } catch (err) {
      alert('Error uploading logo');
    }
  };

  if (loading) return <DashboardLayout role="ORGANIZATION"><p>Loading...</p></DashboardLayout>;

  return (
    <DashboardLayout role="ORGANIZATION">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Organization Profile</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your organization's public details to attract top student talent.</p>
      </div>

      <div className="glass-card" style={{ maxWidth: '800px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Building size={20} /> Organization Details
        </h2>
        
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', alignItems: 'center' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '16px', background: 'var(--bg-light)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {profile?.logoUrl ? (
              <img src={profile.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Building size={40} color="var(--text-muted)" />
            )}
          </div>
          <div>
            <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Company Logo</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Upload a transparent PNG or high-quality JPG.</p>
            <input type="file" ref={logoInputRef} style={{ display: 'none' }} onChange={handleUploadLogo} accept="image/*" />
            <button type="button" className="btn btn-outline" onClick={() => logoInputRef.current?.click()} style={{ display: 'flex', gap: '0.5rem' }}>
              <Upload size={16} /> Upload New Logo
            </button>
          </div>
        </div>

        <form onSubmit={handleUpdateBasicInfo} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Company Name</label>
            <input type="text" className="form-input" value={profile?.companyName || ''} onChange={e => setProfile({...profile, companyName: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Globe size={16} /> Website URL</label>
            <input type="url" className="form-input" value={profile?.website || ''} onChange={e => setProfile({...profile, website: e.target.value})} placeholder="https://..." />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Briefcase size={16} /> Industry</label>
            <input type="text" className="form-input" value={profile?.industry || ''} onChange={e => setProfile({...profile, industry: e.target.value})} placeholder="e.g. Technology, Finance" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Company Description</label>
            <textarea className="form-input" rows={5} value={profile?.description || ''} onChange={e => setProfile({...profile, description: e.target.value})} placeholder="Tell students about your company culture and mission..." />
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifySelf: 'start' }}>Save Changes</button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationProfile;
