import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { HiOutlineTicket, HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Floating Theme Toggle */}
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}
      >
        <div className={`toggle-thumb ${isDark ? '' : 'light'}`}>
          {isDark ? '🌙' : '☀️'}
        </div>
      </button>

      <div style={styles.leftPanel}>
        <div style={styles.brandSection}>
          <div style={styles.logo}>
            <HiOutlineTicket size={40} />
          </div>
          <h1 style={styles.brandTitle}>IT Ticketing System</h1>
          <p style={styles.brandDesc}>
            Streamline your IT support workflow. Report issues, track progress, and resolve problems faster.
          </p>
          <div style={styles.features}>
            {['Real-time tracking', 'SLA monitoring', 'Smart assignment', 'Knowledge base'].map((f, i) => (
              <div key={i} style={styles.featureItem}>
                <span style={styles.featureDot} />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Welcome Back</h2>
            <p style={styles.formSubtitle}>Sign in to your account</p>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={styles.inputWrapper}>
              <HiOutlineMail style={styles.inputIcon} />
              <input
                id="login-email"
                className="form-input"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: 40 }}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={styles.inputWrapper}>
              <HiOutlineLockClosed style={styles.inputIcon} />
              <input
                id="login-password"
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: 40, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%', marginTop: 8 }}
          >
            {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Sign In'}
          </button>

          <p style={styles.registerLink}>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>

          <div style={styles.demoSection}>
            <p style={styles.demoTitle}>Demo Accounts</p>
            <div style={styles.demoGrid}>
              {[
                { label: 'Admin', email: 'admin@ticketing.com', pass: 'admin123' },
                { label: 'Agent', email: 'agent1@ticketing.com', pass: 'admin123' },
                { label: 'Employee', email: 'employee@ticketing.com', pass: 'user123' },
              ].map((d, i) => (
                <button
                  key={i}
                  type="button"
                  style={styles.demoBtn}
                  onClick={() => { setEmail(d.email); setPassword(d.pass); }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
  },
  leftPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
    borderRight: '1px solid var(--border-primary)',
    padding: '40px',
  },
  brandSection: {
    maxWidth: 420,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 'var(--radius-lg)',
    background: 'var(--accent-gradient)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    marginBottom: 24,
    boxShadow: 'var(--accent-glow)',
  },
  brandTitle: {
    fontSize: '2rem',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    marginBottom: 12,
    background: 'var(--accent-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  brandDesc: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    marginBottom: 32,
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--accent-primary)',
    flexShrink: 0,
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  formHeader: {
    marginBottom: 8,
  },
  formTitle: {
    fontSize: '1.6rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  formSubtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    marginTop: 6,
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    color: 'var(--text-muted)',
    fontSize: '1.1rem',
    zIndex: 1,
  },
  eyeBtn: {
    position: 'absolute',
    right: 8,
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
  },
  registerLink: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  demoSection: {
    borderTop: '1px solid var(--border-primary)',
    paddingTop: 20,
    marginTop: 4,
  },
  demoTitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 10,
    textAlign: 'center',
  },
  demoGrid: {
    display: 'flex',
    gap: 8,
  },
  demoBtn: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '0.78rem',
    fontWeight: 500,
    background: 'var(--bg-glass)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 150ms',
    fontFamily: 'inherit',
  },
};
