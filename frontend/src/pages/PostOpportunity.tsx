import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { Save, CheckCircle } from 'lucide-react';

const API = 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');

const PostOpportunity = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'INTERNSHIP',
    deadline: '',
    eligibility: '',
    location: '',
    stipend: '',
    duration: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent, status: 'PUBLISHED' | 'DRAFT') => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`${API}/api/opportunities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ ...formData, status })
      });

      if (response.ok) {
        alert(`Opportunity ${status === 'PUBLISHED' ? 'published' : 'saved as draft'} successfully!`);
        navigate('/org/dashboard');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to post opportunity');
      }
    } catch (error) {
      alert('Network error. Failed to post opportunity.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="ORGANIZATION">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Post New Opportunity</h1>
        <p style={{ color: 'var(--text-muted)' }}>Create a listing to find the best talent.</p>
      </div>

      <div className="glass-card">
        <form style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Title</label>
            <input 
              type="text" 
              className="form-input" 
              required
              placeholder="e.g. Summer Software Engineering Intern"
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select 
              className="form-input" 
              value={formData.category} 
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              <option value="INTERNSHIP">Internship</option>
              <option value="SCHOLARSHIP">Scholarship</option>
              <option value="GRANT">Grant</option>
              <option value="RESEARCH">Research</option>
              <option value="HACKATHON">Hackathon</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Application Deadline</label>
            <input 
              type="date" 
              className="form-input" 
              value={formData.deadline} 
              onChange={e => setFormData({...formData, deadline: e.target.value})} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location (Optional)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. San Francisco, CA (Remote)"
              value={formData.location} 
              onChange={e => setFormData({...formData, location: e.target.value})} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Stipend/Salary (Optional)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. $50/hr or $10,000 grant"
              value={formData.stipend} 
              onChange={e => setFormData({...formData, stipend: e.target.value})} 
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Description</label>
            <textarea 
              className="form-input" 
              rows={5} 
              required
              placeholder="Describe the opportunity, responsibilities, and benefits..."
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
            ></textarea>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Eligibility Requirements</label>
            <textarea 
              className="form-input" 
              rows={3} 
              placeholder="e.g. Must be a junior or senior studying CS with a 3.5+ GPA."
              value={formData.eligibility} 
              onChange={e => setFormData({...formData, eligibility: e.target.value})} 
            ></textarea>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              disabled={saving}
              onClick={(e) => handleSubmit(e, 'DRAFT')}
              style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Save size={18} /> Save as Draft
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              disabled={saving}
              onClick={(e) => handleSubmit(e, 'PUBLISHED')}
              style={{ flex: 2, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
            >
              <CheckCircle size={18} /> Publish Opportunity
            </button>
          </div>

        </form>
      </div>
    </DashboardLayout>
  );
};

export default PostOpportunity;
