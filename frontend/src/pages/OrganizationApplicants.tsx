import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useParams } from 'react-router-dom';
import { User, Calendar, FileText, Check, X, Clock, Mail, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

const API = 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');

interface Skill { name: string; }
interface Cert { name: string; issuer: string; }
interface Doc { type: string; fileUrl: string; }
interface Application {
  id: string;
  status: string;
  coverLetter?: string;
  createdAt: string;
  student: {
    firstName: string;
    lastName: string;
    university: string;
    major: string;
    skills: Skill[];
    certifications: Cert[];
    documents: Doc[];
    user: { email: string };
  };
  events: { type: string; createdAt: string }[];
}

const OrganizationApplicants = () => {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aiSummaryId, setAiSummaryId] = useState<string | null>(null);
  const [aiSummaryText, setAiSummaryText] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API}/api/applications/org/${opportunityId}?status=${filter}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) setApplications(await res.json());
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApplications(); setSelectedIds(new Set()); }, [opportunityId, filter]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API}/api/applications/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchApplications();
    } catch (err) { alert('Failed to update status'); }
  };

  const handleBatchStatus = async (status: string) => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Update ${selectedIds.size} applications to ${status}?`)) return;
    
    try {
      const res = await fetch(`${API}/api/applications/batch/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ applicationIds: Array.from(selectedIds), status })
      });
      if (res.ok) {
        setSelectedIds(new Set());
        fetchApplications();
      }
    } catch (err) { alert('Failed to batch update'); }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === applications.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(applications.map(a => a.id)));
  };

  const handleGenerateSummary = async (appId: string) => {
    setAiSummaryId(appId);
    setAiSummaryText('');
    setLoadingSummary(true);
    try {
      const res = await fetch(`${API}/api/ai/candidate-summary/${appId}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummaryText(data.summary);
      } else {
        setAiSummaryText('Failed to generate summary.');
      }
    } catch (err) {
      setAiSummaryText('Error generating summary.');
    } finally {
      setLoadingSummary(false);
    }
  };

  if (loading) return <DashboardLayout role="ORGANIZATION"><p>Loading...</p></DashboardLayout>;

  return (
    <DashboardLayout role="ORGANIZATION">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Review Applicants</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage and evaluate candidates for your opportunity.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)' }}>
          {['ALL', 'PENDING', 'REVIEWING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'].map(status => (
            <button
              key={status} onClick={() => setFilter(status)}
              style={{
                background: 'none', border: 'none', padding: '0.75rem 0', cursor: 'pointer',
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

        {selectedIds.size > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, marginRight: '0.5rem' }}>{selectedIds.size} selected</span>
            <button className="btn btn-outline" onClick={() => handleBatchStatus('SHORTLISTED')}>Shortlist</button>
            <button className="btn btn-outline" onClick={() => handleBatchStatus('REJECTED')} style={{ color: '#DC2626', borderColor: '#FCA5A5' }}>Reject</button>
          </div>
        )}
      </div>

      {applications.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No applicants found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 1.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            <input type="checkbox" checked={selectedIds.size === applications.length && applications.length > 0} onChange={toggleSelectAll} style={{ marginRight: '1rem' }} />
            <div style={{ flex: 1 }}>Candidate</div>
            <div style={{ width: '100px', textAlign: 'center' }}>Match</div>
            <div style={{ width: '120px' }}>Applied</div>
            <div style={{ width: '150px' }}>Status</div>
            <div style={{ width: '250px', textAlign: 'right' }}>Actions</div>
          </div>

          {applications.map(app => {
            const isExpanded = expandedId === app.id;
            return (
              <div key={app.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.5rem', cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : app.id)}>
                  <input type="checkbox" checked={selectedIds.has(app.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(app.id); }} style={{ marginRight: '1rem' }} />
                  
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 600 }}>
                      {app.student.firstName[0]}{app.student.lastName[0]}
                    </div>
                    <div>
                      <h4 style={{ margin: 0 }}>{app.student.firstName} {app.student.lastName}</h4>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.student.university} • {app.student.major}</div>
                    </div>
                  </div>

                  <div style={{ width: '100px', textAlign: 'center' }}>
                    {app.matchScore != null ? (
                      <span style={{ 
                        padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, 
                        background: app.matchScore >= 80 ? '#D1FAE5' : app.matchScore >= 50 ? '#FEF3C7' : '#FEE2E2',
                        color: app.matchScore >= 80 ? '#059669' : app.matchScore >= 50 ? '#D97706' : '#DC2626'
                      }}>
                        {app.matchScore}%
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>N/A</span>
                    )}
                  </div>

                  <div style={{ width: '120px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(app.createdAt).toLocaleDateString()}
                  </div>

                  <div style={{ width: '150px' }}>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: 'var(--bg-light)' }}>
                      {app.status}
                    </span>
                  </div>

                  <div style={{ width: '250px', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    {app.status === 'PENDING' && (
                      <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#DBEAFE', color: '#1E40AF' }} onClick={(e) => { e.stopPropagation(); handleStatusChange(app.id, 'REVIEWING'); }}>Review</button>
                    )}
                    {(app.status === 'PENDING' || app.status === 'REVIEWING') && (
                      <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={(e) => { e.stopPropagation(); handleStatusChange(app.id, 'SHORTLISTED'); }}>Shortlist</button>
                    )}
                    {app.status === 'SHORTLISTED' && (
                      <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#059669', borderColor: '#059669' }} onClick={(e) => { e.stopPropagation(); handleStatusChange(app.id, 'ACCEPTED'); }}>Accept</button>
                    )}
                    {app.status !== 'ACCEPTED' && app.status !== 'REJECTED' && (
                      <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: '#DC2626', borderColor: '#FCA5A5' }} onClick={(e) => { e.stopPropagation(); handleStatusChange(app.id, 'REJECTED'); }}>Reject</button>
                    )}
                    {(app.status === 'ACCEPTED' || app.status === 'REJECTED') && (
                      <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderColor: 'var(--border)' }} title="Re-evaluate Candidate" onClick={(e) => { e.stopPropagation(); handleStatusChange(app.id, 'REVIEWING'); }}>Undo Decision</button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '1.5rem', background: 'var(--bg-light)', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                      
                      {/* Left Col: Details & Cover Letter */}
                      <div>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                          <a href={`mailto:${app.student.user.email}`} className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Mail size={14} /> Contact Candidate
                          </a>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)' }}
                            onClick={() => handleGenerateSummary(app.id)}
                            disabled={loadingSummary && aiSummaryId === app.id}
                          >
                            <User size={14} /> {loadingSummary && aiSummaryId === app.id ? 'Generating...' : 'AI Summary'}
                          </button>
                        </div>
                        
                        {aiSummaryId === app.id && (
                          <div style={{ marginBottom: '1.5rem', background: 'var(--bg-white)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <h5 style={{ marginBottom: '0.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <User size={16} /> AI Candidate Summary
                            </h5>
                            <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                              {aiSummaryText || (loadingSummary ? 'Analyzing profile and application...' : '')}
                            </div>
                          </div>
                        )}

                        {app.matchReason && (
                          <div style={{ marginBottom: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--primary-light)' }}>
                            <h5 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>✨ AI Match Analysis</h5>
                            <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                              {app.matchReason}
                            </div>
                          </div>
                        )}

                        {app.coverLetter && (
                          <div style={{ marginBottom: '1.5rem' }}>
                            <h5 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Cover Letter</h5>
                            <div style={{ background: 'var(--bg-white)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                              {app.coverLetter}
                            </div>
                          </div>
                        )}
                        
                        <h5 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Skills</h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                          {(app.student.skills || []).map(s => (
                            <span key={s.name} style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>{s.name}</span>
                          ))}
                          {!(app.student.skills?.length > 0) && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No skills listed</span>}
                        </div>
                      </div>

                      {/* Right Col: Documents & Certs */}
                      <div>
                        <h5 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Documents</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                          {(app.student.documents || []).map((doc, idx) => (
                            <a key={idx} href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', textDecoration: 'none', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 500 }}>
                              <FileText size={16} /> View {doc.type} <ExternalLink size={14} style={{ marginLeft: 'auto' }} />
                            </a>
                          ))}
                          {!(app.student.documents?.length > 0) && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No documents</span>}
                        </div>
                        
                        <h5 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Certifications</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {(app.student.certifications || []).map(c => (
                            <div key={c.name} style={{ padding: '0.75rem', background: 'var(--bg-white)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem' }}>
                              <div style={{ fontWeight: 500 }}>{c.name}</div>
                              <div style={{ color: 'var(--text-muted)' }}>{c.issuer}</div>
                            </div>
                          ))}
                          {!(app.student.certifications?.length > 0) && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No certifications</span>}
                        </div>
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

export default OrganizationApplicants;
