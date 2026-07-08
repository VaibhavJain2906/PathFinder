import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Sparkles, FileText, Target, Clock, Upload, ChevronRight, CheckCircle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const API = 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');

interface HistoryItem {
  id: string; type: string; prompt: string; output: string; createdAt: string;
}

const AIAssistant = () => {
  const [activeTab, setActiveTab] = useState<'GENERATE' | 'RESUME' | 'MATCH' | 'HISTORY'>('GENERATE');
  
  // GENERATE STATE
  const [docType, setDocType] = useState('SOP');
  const [opportunityId, setOpportunityId] = useState('');
  const [context, setContext] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState('');
  const [opportunities, setOpportunities] = useState<any[]>([]);

  // RESUME STATE
  const [resumeScore, setResumeScore] = useState<any>(null);
  
  // MATCH STATE
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // HISTORY STATE
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    fetch(`${API}/api/opportunities`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
      .then(res => res.json())
      .then(data => setOpportunities(data))
      .catch(() => {});
  }, []);

  const loadProfileStrength = async () => {
    const res = await fetch(`${API}/api/ai/profile-strength`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
    if (res.ok) setResumeScore(await res.json());
  };

  const loadMatches = async () => {
    setLoadingMatches(true);
    const res = await fetch(`${API}/api/ai/recommendations`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
    if (res.ok) setMatches(await res.json());
    setLoadingMatches(false);
  };

  const loadHistory = async () => {
    const res = await fetch(`${API}/api/ai/history`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
    if (res.ok) setHistory(await res.json());
  };

  useEffect(() => {
    if (activeTab === 'RESUME' && !resumeScore) loadProfileStrength();
    if (activeTab === 'MATCH' && matches.length === 0) loadMatches();
    if (activeTab === 'HISTORY') loadHistory();
  }, [activeTab]);

  const handleGenerate = async () => {
    setGenerating(true);
    let endpoint = '';
    let body: any = { additionalContext: context };

    if (docType === 'SOP') { endpoint = '/generate-sop'; body.opportunityId = opportunityId; }
    else if (docType === 'COVER_LETTER') { endpoint = '/generate-cover-letter'; body.opportunityId = opportunityId; }
    else if (docType === 'ESSAY') { endpoint = '/generate-essay'; body.opportunityId = opportunityId; }
    else if (docType === 'PERSONAL_STATEMENT') { endpoint = '/generate-personal-statement'; }

    try {
      const res = await fetch(`${API}/api/ai${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedResult(data.sop || data.coverLetter || data.essay || data.personalStatement);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout role="STUDENT">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={28} color="var(--primary)" /> AI Assistant
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Leverage AI to write better applications and find the perfect opportunities.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        {[
          { id: 'GENERATE', label: 'Writer', icon: <FileText size={18} /> },
          { id: 'RESUME', label: 'Profile Analyzer', icon: <Search size={18} /> },
          { id: 'MATCH', label: 'Smart Matches', icon: <Target size={18} /> },
          { id: 'HISTORY', label: 'History', icon: <Clock size={18} /> },
        ].map(tab => (
          <button
            key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            style={{
              background: 'none', border: 'none', padding: '0.75rem 1rem', cursor: 'pointer',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 600 : 500,
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-1px', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'GENERATE' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="glass-card">
            <h3 style={{ marginBottom: '1.5rem' }}>Configuration</h3>
            <div className="form-group">
              <label className="form-label">Document Type</label>
              <select className="form-input" value={docType} onChange={e => setDocType(e.target.value)}>
                <option value="SOP">Statement of Purpose</option>
                <option value="COVER_LETTER">Cover Letter</option>
                <option value="ESSAY">Application Essay</option>
                <option value="PERSONAL_STATEMENT">Personal Statement</option>
              </select>
            </div>

            {docType !== 'PERSONAL_STATEMENT' && (
              <div className="form-group">
                <label className="form-label">Target Opportunity</label>
                <select className="form-input" value={opportunityId} onChange={e => setOpportunityId(e.target.value)}>
                  <option value="">Select an opportunity...</option>
                  {opportunities.map(opp => (
                    <option key={opp.id} value={opp.id}>{opp.title} ({opp.organization.companyName})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Additional Context / Tone</label>
              <textarea 
                className="form-input" rows={4} 
                placeholder="E.g., Focus on my leadership experience, keep the tone enthusiastic..."
                value={context} onChange={e => setContext(e.target.value)}
              ></textarea>
            </div>

            <button 
              className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
              onClick={handleGenerate} disabled={generating || (docType !== 'PERSONAL_STATEMENT' && !opportunityId)}
            >
              {generating ? 'Generating with AI...' : <><Sparkles size={18} /> Generate Document</>}
            </button>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Output Preview</h3>
            {generatedResult ? (
              <div style={{ flex: 1, background: 'var(--bg-white)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border)', whiteSpace: 'pre-wrap', overflowY: 'auto', maxHeight: '500px', lineHeight: 1.6, fontSize: '0.95rem' }}>
                {generatedResult}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '10px' }}>
                <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>Your generated document will appear here.</p>
              </div>
            )}
            {generatedResult && (
              <button 
                className="btn btn-outline" style={{ marginTop: '1rem' }}
                onClick={() => { navigator.clipboard.writeText(generatedResult); alert('Copied to clipboard'); }}
              >
                Copy to Clipboard
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'RESUME' && resumeScore && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{
              width: '120px', height: '120px', borderRadius: '50%',
              background: `conic-gradient(var(--primary) ${resumeScore.score}%, var(--border) 0)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--bg-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{resumeScore.score}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Score</span>
              </div>
            </div>
            <div>
              <h2 style={{ marginBottom: '0.5rem' }}>Profile Strength: {resumeScore.score >= 80 ? 'Excellent' : resumeScore.score >= 50 ? 'Good' : 'Needs Work'}</h2>
              <p style={{ color: 'var(--text-muted)' }}>A higher profile score improves your AI match recommendations and generation quality.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {resumeScore.checks.map((check: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'var(--bg-white)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                {check.done ? <CheckCircle size={20} color="#10B981" /> : <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--border)' }}></div>}
                <span style={{ color: check.done ? 'var(--text-main)' : 'var(--text-muted)', textDecoration: check.done ? 'none' : 'none' }}>{check.item}</span>
                {!check.done && (
                  <Link to="/student/profile" style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}>Fix &rarr;</Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'MATCH' && (
        <div>
          {loadingMatches ? (
            <p>Analyzing profile and matching opportunities...</p>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
              {matches.map(opp => (
                <div key={opp.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', background: 'var(--accent-bg)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>
                      {opp.category}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10B981', fontWeight: 700, fontSize: '0.9rem', background: '#D1FAE5', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                      <Target size={14} /> {opp.matchScore}% Match
                    </div>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{opp.title}</h3>
                  <p style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.85rem', marginBottom: '0.75rem' }}>{opp.organization.companyName}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flex: 1, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{opp.description}</p>
                  
                  <Link to="/student/dashboard" className="btn btn-outline" style={{ textAlign: 'center', textDecoration: 'none' }}>
                    View Opportunity
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem' }}>Recent Generations</h3>
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No generations yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {history.map(item => (
                <div key={item.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--accent-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{item.type.replace('_', ' ')}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}><strong>Prompt/Topic:</strong> {item.prompt}</p>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                      {item.output}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </DashboardLayout>
  );
};

export default AIAssistant;
