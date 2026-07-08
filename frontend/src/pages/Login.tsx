import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, User } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Navigate based on role
      if (data.user.role === 'STUDENT') navigate('/student/dashboard');
      else if (data.user.role === 'ORGANIZATION') navigate('/org/dashboard');
      else if (data.user.role === 'ADMIN') navigate('/admin/dashboard');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: 'var(--bg-page)' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', position: 'relative', overflow: 'hidden' }}>
        
        {/* Glow Effects */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(168, 224, 99, 0.1)', filter: 'blur(50px)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '150px', height: '150px', background: 'rgba(184, 169, 247, 0.1)', filter: 'blur(50px)', borderRadius: '50%' }} />

        <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'var(--accent-bg)', color: 'var(--primary)', marginBottom: '1.25rem' }}>
            <User size={28} />
          </div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Welcome back</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Enter your details to access your account.</p>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 1 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</Link>
            </div>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }} disabled={loading}>
            {loading ? 'Signing in...' : <><LogIn size={18} style={{ marginRight: '8px' }} /> Sign in</>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)', position: 'relative', zIndex: 1 }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
