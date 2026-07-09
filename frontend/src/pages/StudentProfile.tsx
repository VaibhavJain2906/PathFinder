import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Upload, Plus, Trash2, Link as LinkIcon, FileText, User, Award, ExternalLink, GraduationCap } from 'lucide-react';

interface Skill { id: string; name: string; }
interface Cert { id: string; name: string; issuer: string; dateIssued?: string; }
interface PortLink { id: string; title: string; url: string; }
interface Doc { id: string; title: string; fileUrl: string; type: string; }

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

const StudentProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autofillInputRef = useRef<HTMLInputElement>(null);
  const [autofilling, setAutofilling] = useState(false);

  // New item states
  const [newSkill, setNewSkill] = useState('');
  const [newCert, setNewCert] = useState({ name: '', issuer: '', dateIssued: '' });
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [newDoc, setNewDoc] = useState({ name: '', type: 'RESUME', file: null as File | null });

  // Action feedback
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API}/api/student/profile`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) setProfile(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleAutofill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAutofilling(true);
    
    try {
      const formData = new FormData();
      formData.append('resume', file);
      
      const res = await fetch(`${API}/api/ai/parse-resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      });
      
      if (!res.ok) throw new Error('Failed to parse resume');
      const parsedData = await res.json();
      
      setProfile({
        ...profile,
        firstName: parsedData.firstName || profile.firstName,
        lastName: parsedData.lastName || profile.lastName,
        bio: parsedData.bio || profile.bio,
        major: parsedData.major || profile.major,
        university: parsedData.university || profile.university,
        graduationYear: parsedData.graduationYear || profile.graduationYear,
        skills: [...(profile.skills || []), ...(parsedData.skills || []).map((s: string, i: number) => ({ id: `temp-${i}`, name: s }))]
      });
      showToast('✨ Resume parsed successfully! Review and save your changes.');
    } catch (err) {
      showToast('✗ Error parsing resume. Please try again.');
    } finally {
      setAutofilling(false);
      if (autofillInputRef.current) autofillInputRef.current.value = '';
    }
  };

  // ----- Basic Info -----
  const handleUpdateBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`${API}/api/student/profile`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ 
          firstName: profile.firstName, lastName: profile.lastName, 
          bio: profile.bio, major: profile.major, university: profile.university, 
          graduationYear: profile.graduationYear 
        })
      });
      showToast('✓ Profile saved successfully');
    } catch (err) {
      showToast('✗ Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // ----- Skills -----
  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    try {
      await fetch(`${API}/api/student/skills`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name: newSkill.trim() })
      });
      setNewSkill('');
      fetchProfile();
      showToast('✓ Skill added');
    } catch (err) {
      showToast('✗ Failed to add skill');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      await fetch(`${API}/api/student/skills/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      fetchProfile();
    } catch (err) {
      showToast('✗ Failed to delete skill');
    }
  };

  // ----- Certifications -----
  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCert.name || !newCert.issuer) return;
    try {
      await fetch(`${API}/api/student/certifications`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newCert)
      });
      setNewCert({ name: '', issuer: '', dateIssued: '' });
      fetchProfile();
      showToast('✓ Certification added');
    } catch (err) {
      showToast('✗ Failed to add certification');
    }
  };

  const handleDeleteCert = async (id: string) => {
    try {
      await fetch(`${API}/api/student/certifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      fetchProfile();
    } catch (err) {
      showToast('✗ Failed to delete certification');
    }
  };

  // ----- Portfolio Links -----
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink.title || !newLink.url) return;
    try {
      await fetch(`${API}/api/student/portfolio-links`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newLink)
      });
      setNewLink({ title: '', url: '' });
      fetchProfile();
      showToast('✓ Link added');
    } catch (err) {
      showToast('✗ Failed to add link');
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await fetch(`${API}/api/student/portfolio-links/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      fetchProfile();
    } catch (err) {
      showToast('✗ Failed to delete link');
    }
  };

  // ----- Documents -----
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.file || !newDoc.name) return;
    
    try {
      const formData = new FormData();
      formData.append('file', newDoc.file);
      
      const uploadRes = await fetch(`${API}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { url } = await uploadRes.json();
      
      await fetch(`${API}/api/student/documents`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name: newDoc.name, type: newDoc.type, url })
      });
      
      setNewDoc({ name: '', type: 'RESUME', file: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchProfile();
      showToast('✓ Document uploaded');
    } catch (err) {
      showToast('✗ Error uploading document');
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await fetch(`${API}/api/student/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      fetchProfile();
      showToast('✓ Document removed');
    } catch (err) {
      showToast('✗ Failed to delete document');
    }
  };

  if (loading) return <DashboardLayout role="STUDENT"><p>Loading...</p></DashboardLayout>;

  return (
    <DashboardLayout role="STUDENT">
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 999,
          padding: '0.75rem 1.25rem', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 500,
          background: toast.startsWith('✓') ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #EF4444, #DC2626)',
          color: 'white', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GraduationCap size={28} color="var(--primary)" /> My Profile
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your academic details, skills, and documents to get better AI matches.</p>
      </div>

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 1fr' }}>
        
        {/* ===== Basic Info ===== */}
        <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <User size={20} /> Basic Information
            </h2>
            <div>
              <input type="file" accept="application/pdf" ref={autofillInputRef} style={{ display: 'none' }} onChange={handleAutofill} />
              <button 
                className="btn" 
                style={{ background: 'linear-gradient(90deg, #8B5CF6, #6366F1)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', border: 'none', fontWeight: 600 }}
                onClick={() => autofillInputRef.current?.click()}
                disabled={autofilling}
              >
                {autofilling ? 'Parsing...' : '✨ Autofill with Resume'}
              </button>
            </div>
          </div>
          <form onSubmit={handleUpdateBasicInfo} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input type="text" className="form-input" value={profile.firstName || ''} onChange={e => setProfile({...profile, firstName: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input type="text" className="form-input" value={profile.lastName || ''} onChange={e => setProfile({...profile, lastName: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">University</label>
              <input type="text" className="form-input" value={profile.university || ''} onChange={e => setProfile({...profile, university: e.target.value})} placeholder="e.g. Stanford University" />
            </div>
            <div className="form-group">
              <label className="form-label">Major</label>
              <input type="text" className="form-input" value={profile.major || ''} onChange={e => setProfile({...profile, major: e.target.value})} placeholder="e.g. Computer Science" />
            </div>
            <div className="form-group">
              <label className="form-label">Graduation Year</label>
              <input type="number" className="form-input" value={profile.graduationYear || ''} onChange={e => setProfile({...profile, graduationYear: parseInt(e.target.value) || null})} placeholder="e.g. 2027" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows={3} value={profile.bio || ''} onChange={e => setProfile({...profile, bio: e.target.value})} placeholder="Tell organizations about yourself, your interests, and career goals..." />
            </div>
            <button type="submit" className="btn btn-primary" style={{ justifySelf: 'start' }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* ===== Skills ===== */}
        <div className="glass-card">
          <h2 style={{ marginBottom: '1.5rem' }}>🛠️ Skills</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {profile.skills?.map((skill: Skill) => (
              <span key={skill.id} style={{
                padding: '0.3rem 0.75rem', background: 'var(--accent-bg)', color: 'var(--primary)',
                borderRadius: '999px', fontSize: '0.875rem', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                transition: 'var(--transition)'
              }}>
                {skill.name}
                <button
                  onClick={() => handleDeleteSkill(skill.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem',
                    color: 'var(--primary)', opacity: 0.6, display: 'flex', alignItems: 'center'
                  }}
                  title="Remove skill"
                >
                  <Trash2 size={13} />
                </button>
              </span>
            ))}
            {(!profile.skills || profile.skills.length === 0) && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No skills added yet.</p>
            )}
          </div>
          <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="text" className="form-input" placeholder="Add a skill (e.g. React, Python)" value={newSkill} onChange={e => setNewSkill(e.target.value)} />
            <button type="submit" className="btn btn-outline" style={{ flexShrink: 0 }}><Plus size={18} /></button>
          </form>
        </div>

        {/* ===== Certifications ===== */}
        <div className="glass-card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Award size={20} /> Certifications
          </h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            {profile.certifications?.map((cert: Cert) => (
              <div key={cert.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '10px',
                marginBottom: '0.5rem', transition: 'var(--transition)'
              }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{cert.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {cert.issuer}{cert.dateIssued ? ` · ${cert.dateIssued}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCert(cert.id)}
                  className="btn"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', padding: '0.4rem', borderRadius: '8px' }}
                  title="Remove certification"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {(!profile.certifications || profile.certifications.length === 0) && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No certifications added yet.</p>
            )}
          </div>

          <form onSubmit={handleAddCert} style={{
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
            padding: '1rem', background: 'var(--bg-light)', borderRadius: '10px', border: '1px dashed var(--border)'
          }}>
            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Add Certification</div>
            <input type="text" className="form-input" placeholder="Certification name (e.g. AWS Cloud Practitioner)" value={newCert.name} onChange={e => setNewCert({...newCert, name: e.target.value})} required />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" className="form-input" placeholder="Issuer (e.g. Amazon)" value={newCert.issuer} onChange={e => setNewCert({...newCert, issuer: e.target.value})} required />
              <input type="text" className="form-input" placeholder="Date (e.g. Jan 2026)" value={newCert.dateIssued} onChange={e => setNewCert({...newCert, dateIssued: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', gap: '0.5rem' }}>
              <Plus size={16} /> Add Certification
            </button>
          </form>
        </div>

        {/* ===== Portfolio Links ===== */}
        <div className="glass-card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <LinkIcon size={20} /> Portfolio & Links
          </h2>

          <div style={{ marginBottom: '1.5rem' }}>
            {profile.portfolioLinks?.map((link: PortLink) => (
              <div key={link.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '10px',
                marginBottom: '0.5rem', transition: 'var(--transition)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                  <ExternalLink size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>{link.title}</div>
                    <a href={link.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', wordBreak: 'break-all' }}>
                      {link.url}
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteLink(link.id)}
                  className="btn"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', padding: '0.4rem', borderRadius: '8px', flexShrink: 0 }}
                  title="Remove link"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {(!profile.portfolioLinks || profile.portfolioLinks.length === 0) && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No links added yet.</p>
            )}
          </div>

          <form onSubmit={handleAddLink} style={{
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
            padding: '1rem', background: 'var(--bg-light)', borderRadius: '10px', border: '1px dashed var(--border)'
          }}>
            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>Add Link</div>
            <input type="text" className="form-input" placeholder="Label (e.g. GitHub, LinkedIn, Portfolio)" value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})} required />
            <input type="url" className="form-input" placeholder="URL (e.g. https://github.com/username)" value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} required />
            <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', gap: '0.5rem' }}>
              <Plus size={16} /> Add Link
            </button>
          </form>
        </div>

        {/* ===== Documents & Resumes ===== */}
        <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <FileText size={20} /> Documents & Resumes
          </h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            {profile.documents?.map((doc: Doc) => (
              <div key={doc.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '10px',
                marginBottom: '0.5rem', transition: 'var(--transition)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    background: 'var(--accent-bg)', color: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{doc.title || 'Document'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.type}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', textDecoration: 'none' }}>
                    View
                  </a>
                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="btn"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', padding: '0.4rem', borderRadius: '8px' }}
                    title="Delete document"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
            {(!profile.documents || profile.documents.length === 0) && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>No documents uploaded yet.</p>
            )}
          </div>

          <form onSubmit={handleUploadDocument} style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem',
            padding: '1.25rem', background: 'var(--bg-light)', borderRadius: '10px', border: '1px dashed var(--border)'
          }}>
            <div style={{ gridColumn: '1 / -1', fontWeight: 500, fontSize: '0.875rem' }}>Upload New Document</div>
            <input type="text" className="form-input" placeholder="Document Name (e.g. 2026 Resume)" value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value})} required />
            <select className="form-input" value={newDoc.type} onChange={e => setNewDoc({...newDoc, type: e.target.value})}>
              <option value="RESUME">Resume</option>
              <option value="TRANSCRIPT">Transcript</option>
              <option value="SOP">Statement of Purpose</option>
              <option value="OTHER">Other</option>
            </select>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={e => setNewDoc({...newDoc, file: e.target.files ? e.target.files[0] : null})}
              style={{ fontSize: '0.875rem', gridColumn: '1 / -1' }}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
              <Upload size={16} /> Upload Document
            </button>
          </form>
        </div>

      </div>

      {/* Toast animation CSS */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default StudentProfile;
