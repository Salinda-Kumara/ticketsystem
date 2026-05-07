import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineTicket, HiOutlineUser, HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password) return toast.error('Please fill all fields');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.logoRow}>
          <div style={styles.logo}><HiOutlineTicket size={28} /></div>
          <div>
            <h2 style={styles.title}>Create Account</h2>
            <p style={styles.subtitle}>Join the IT Ticketing System</p>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input className="form-input" name="firstName" placeholder="John" value={form.firstName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input className="form-input" name="lastName" placeholder="Doe" value={form.lastName} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" name="email" placeholder="john@company.com" value={form.email} onChange={handleChange} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" name="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className="form-input" type="password" name="confirmPassword" placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
          {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Create Account'}
        </button>

        <p style={styles.link}>Already have an account? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  );
}

const styles = {
  container: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 20 },
  form: { width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 20, background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', padding: 36, backdropFilter: 'blur(20px)' },
  logoRow: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 },
  logo: { width: 52, height: 52, borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
  title: { fontSize: '1.3rem', fontWeight: 700 },
  subtitle: { fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 },
  link: { textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' },
};
