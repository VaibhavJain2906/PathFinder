import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-bg)', color: 'var(--primary)', marginBottom: '1rem' }}>
            <Mail size={24} />
          </div>
          <h2>Reset password</h2>
          <p style={{ color: 'var(--text-muted)' }}>Enter your email to receive a password reset link.</p>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#D1FAE5', color: '#065F46', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              We've sent a password reset link to <strong>{email}</strong>. Please check your inbox.
            </div>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', width: '100%', textDecoration: 'none' }}>
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
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
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Sending link...' : 'Send reset link'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <Link to="/login" style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
