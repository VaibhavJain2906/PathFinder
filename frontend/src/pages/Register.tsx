import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      email,
      password,
      role,
      ...(role === 'STUDENT' ? { firstName, lastName } : { companyName }),
    };

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'STUDENT') navigate('/student/dashboard');
      else if (data.user.role === 'ORGANIZATION') navigate('/org/dashboard');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: 'var(--gradient-dark)' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px', background: 'var(--surface-dark)', borderColor: 'rgba(255, 255, 255, 0.05)', position: 'relative', overflow: 'hidden' }}>
        
        {/* Glow Effects */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(168, 224, 99, 0.1)', filter: 'blur(50px)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '150px', height: '150px', background: 'rgba(184, 169, 247, 0.1)', filter: 'blur(50px)', borderRadius: '50%' }} />

        <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(168, 224, 99, 0.15)', color: 'var(--primary)', marginBottom: '1.25rem' }}>
            <UserPlus size={28} />
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Create an account</h2>
          <p style={{ color: '#a0a0b0' }}>Join PathFinder to discover or post opportunities.</p>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 1 }}>
          <div className="form-group" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#e2e8f0', background: role === 'STUDENT' ? 'rgba(168, 224, 99, 0.1)' : 'rgba(255, 255, 255, 0.05)', padding: '0.75rem 1rem', borderRadius: '12px', flex: 1, border: role === 'STUDENT' ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.1)', transition: 'var(--transition)' }}>
              <input type="radio" name="role" value="STUDENT" checked={role === 'STUDENT'} onChange={() => setRole('STUDENT')} style={{ accentColor: 'var(--primary)' }} />
              <span style={{ fontWeight: 500 }}>I'm a Student</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#e2e8f0', background: role === 'ORGANIZATION' ? 'rgba(168, 224, 99, 0.1)' : 'rgba(255, 255, 255, 0.05)', padding: '0.75rem 1rem', borderRadius: '12px', flex: 1, border: role === 'ORGANIZATION' ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.1)', transition: 'var(--transition)' }}>
              <input type="radio" name="role" value="ORGANIZATION" checked={role === 'ORGANIZATION'} onChange={() => setRole('ORGANIZATION')} style={{ accentColor: 'var(--primary)' }} />
              <span style={{ fontWeight: 500 }}>I represent an Org</span>
            </label>
          </div>

          {role === 'STUDENT' ? (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label" htmlFor="firstName" style={{ color: '#e2e8f0' }}>First Name</label>
                <input id="firstName" type="text" className="form-input form-input-light" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.1)' }} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label" htmlFor="lastName" style={{ color: '#e2e8f0' }}>Last Name</label>
                <input id="lastName" type="text" className="form-input form-input-light" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.1)' }} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label" htmlFor="companyName" style={{ color: '#e2e8f0' }}>Organization Name</label>
              <input id="companyName" type="text" className="form-input form-input-light" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.1)' }} value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email" style={{ color: '#e2e8f0' }}>Email</label>
            <input id="email" type="email" className="form-input form-input-light" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.1)' }} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="password" style={{ color: '#e2e8f0' }}>Password</label>
            <input id="password" type="password" className="form-input form-input-light" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.1)' }} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: '#a0a0b0', position: 'relative', zIndex: 1 }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
