import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  Search,
  CheckCircle,
  Users,
  Building,
  Briefcase,
  BookOpen,
  Award,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import './Landing.css';
import { useTheme } from '../context/ThemeContext';

const Landing = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [stats, setStats] = useState({
    activeStudents: 10000,
    opportunities: 5000,
    organizations: 500,
    matchAccuracy: 98,
    internships: 2300,
    scholarships: 1100,
    grants: 450,
    hackathons: 89
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="landing-container">
      {/* HEADER */}
      <header className="landing-header">
        <div className="header-content">
          <div className="logo-container" onClick={() => navigate('/')}>
            <div className="logo-icon">
              <Compass color="white" size={24} />
            </div>
            <span className="logo-text">PathFinder</span>
          </div>

          <nav className="desktop-nav">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How it Works</a>
            <a href="#categories" className="nav-link">Categories</a>

            <div className="auth-buttons">
              <button 
                onClick={toggleTheme} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}
                title="Toggle Theme"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button onClick={() => navigate('/login')} className="btn-login">
                Log in
              </button>
              <button onClick={() => navigate('/register')} className="btn-get-started">
                Get Started
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-bg-glow-1"></div>
        <div className="hero-bg-glow-2"></div>

        <div className="hero-content animate-fade-in-up">
          <div className="hero-badge">
            <span className="pulse-dot"></span>
            The Ultimate AI-Powered Opportunity Platform
          </div>

          <h1 className="hero-title">
            Find Your Path to <br />
            <span className="text-gradient">Success & Growth</span>
          </h1>

          <p className="hero-description">
            Discover internships, scholarships, grants, and hackathons. Build your profile, manage applications, and leverage AI to craft the perfect pitch.
          </p>

          <div className="hero-cta-group animate-fade-in-up stagger-1">
            <Link to="/register" className="hero-btn-primary">
              Start for Free <ChevronRight size={20} />
            </Link>
            <Link to="/login" className="hero-btn-secondary">
              Organization Login
            </Link>
          </div>

          <div className="stats-grid animate-fade-in-up stagger-2">
            <div className="stat-item">
              <div className="stat-value">{stats.activeStudents > 1000 ? `${(stats.activeStudents/1000).toFixed(1).replace('.0', '')}k+` : stats.activeStudents}</div>
              <div className="stat-label">Active Students</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.opportunities > 1000 ? `${(stats.opportunities/1000).toFixed(1).replace('.0', '')}k+` : stats.opportunities}</div>
              <div className="stat-label">Opportunities</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.organizations > 100 ? `${stats.organizations}+` : stats.organizations}</div>
              <div className="stat-label">Top Organizations</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.matchAccuracy}%</div>
              <div className="stat-label">Match Accuracy</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="section section-dark">
        <div className="section-header animate-fade-in-up">
          <h2 className="section-title">Everything you need to succeed</h2>
          <p className="section-subtitle">PathFinder centralizes the entire lifecycle of discovering and applying to opportunities, powered by advanced AI.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper blue">
              <Search size={28} />
            </div>
            <h3 className="feature-title">Smart Discovery</h3>
            <p className="feature-desc">Find exactly what you're looking for with advanced filtering and AI-driven recommendations based on your profile.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper purple">
              <Compass size={28} />
            </div>
            <h3 className="feature-title">AI Assistant</h3>
            <p className="feature-desc">Stuck on an essay? Let our AI draft Statements of Purpose, Cover Letters, and provide Resume analysis.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper cyan">
              <CheckCircle size={28} />
            </div>
            <h3 className="feature-title">Centralized Tracking</h3>
            <p className="feature-desc">Manage all your applications across different categories in one unified, real-time dashboard.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="section">
        <div className="section-header animate-fade-in-up">
          <h2 className="section-title">How it works</h2>
          <p className="section-subtitle">A streamlined process whether you're a student seeking opportunities or an organization looking for talent.</p>
        </div>

        <div className="how-it-works-container animate-fade-in-up stagger-1">
          {/* Student Flow */}
          <div>
            <div className="step-group-title student">
              <Users size={32} />
              For Students
            </div>

            <div className="step">
              <div className="step-indicator">
                <div className="step-number student">1</div>
                <div className="step-line"></div>
              </div>
              <div className="step-content">
                <h4 className="step-title">Build your Profile</h4>
                <p className="step-desc">Upload your resume, add skills, and let our system understand your academic background.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-indicator">
                <div className="step-number student">2</div>
                <div className="step-line"></div>
              </div>
              <div className="step-content">
                <h4 className="step-title">Discover Matches</h4>
                <p className="step-desc">Get AI-driven recommendations for internships and scholarships with high match probability.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-indicator">
                <div className="step-number student">3</div>
              </div>
              <div className="step-content">
                <h4 className="step-title">Apply & Track</h4>
                <p className="step-desc">Use Easy Apply, generate AI essays, and track your application status in real-time.</p>
              </div>
            </div>
          </div>

          {/* Org Flow */}
          <div className="org-card">
            <div className="org-glow"></div>
            <div className="step-group-title org">
              <Building size={32} />
              For Organizations
            </div>

            <div className="step">
              <div className="step-indicator">
                <div className="step-number org">1</div>
                <div className="step-line"></div>
              </div>
              <div className="step-content">
                <h4 className="step-title">Post Opportunities</h4>
                <p className="step-desc">Create listings for internships, grants, or hackathons and reach thousands of verified students.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-indicator">
                <div className="step-number org">2</div>
                <div className="step-line"></div>
              </div>
              <div className="step-content">
                <h4 className="step-title">Manage Applicants</h4>
                <p className="step-desc">Review candidate profiles, parse resumes automatically, and filter by skills.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-indicator">
                <div className="step-number org">3</div>
              </div>
              <div className="step-content">
                <h4 className="step-title">Hire the Best</h4>
                <p className="step-desc">Shortlist candidates, update their statuses, and find the perfect match for your organization.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="section section-dark">
        <div className="section-header animate-fade-in-up">
          <h2 className="section-title">Explore Categories</h2>
          <p className="section-subtitle">One platform for every type of opportunity you need to build your career.</p>
        </div>

        <div className="categories-grid animate-fade-in-up stagger-1">
          <div className="category-card">
            <Briefcase className="category-icon blue" />
            <h3 className="category-title">Internships</h3>
            <p className="category-count">{stats.internships} open</p>
          </div>

          <div className="category-card">
            <BookOpen className="category-icon green" />
            <h3 className="category-title">Scholarships</h3>
            <p className="category-count">{stats.scholarships} open</p>
          </div>

          <div className="category-card">
            <Award className="category-icon yellow" />
            <h3 className="category-title">Grants</h3>
            <p className="category-count">{stats.grants} open</p>
          </div>

          <div className="category-card">
            <Compass className="category-icon pink" />
            <h3 className="category-title">Hackathons</h3>
            <p className="category-count">{stats.hackathons} open</p>
          </div>
        </div>
      </section>

      {/* FOOTER & CTA */}
      <footer className="landing-footer">
        <div className="footer-cta">
          <div className="cta-texture"></div>
          <div className="footer-cta-content">
            <h2>Ready to accelerate your career?</h2>
            <p>Join thousands of students who have found their perfect opportunity through PathFinder.</p>
          </div>
          <Link to="/register" className="footer-btn">
            Create Free Account
          </Link>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <div className="logo-container" style={{ marginBottom: '1rem', cursor: 'default' }}>
              <div className="logo-icon" style={{ padding: '0.2rem' }}>
                <Compass color="white" size={18} />
              </div>
              <span style={{ fontSize: '1rem', fontWeight: '700', color: 'white' }}>PathFinder</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              The enterprise AI opportunity management platform built for modern students and organizations.
            </p>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><a href="#">Students</a></li>
              <li><a href="#">Organizations</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">AI Features</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Resume Tips</a></li>
              <li><a href="#">Success Stories</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Cookie Policy</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} PathFinder Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
