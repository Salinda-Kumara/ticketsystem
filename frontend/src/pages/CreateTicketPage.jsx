import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsAPI, categoriesAPI, departmentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineUpload, HiOutlineX } from 'react-icons/hi';

export default function CreateTicketPage() {
  const [form, setForm] = useState({ title: '', description: '', categoryId: '', priority: 'MEDIUM', departmentId: '' });
  const [files, setFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    categoriesAPI.getAll().then(res => setCategories(res.data.data.filter(c => c.isActive)));
    departmentsAPI.getAll().then(res => setDepartments(res.data.data));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles].slice(0, 5));
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.categoryId) {
      return toast.error('Please fill in title, description, and category');
    }
    setLoading(true);
    try {
      const res = await ticketsAPI.create(form);
      const ticket = res.data.data;

      // Upload files if any
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));
        await ticketsAPI.uploadFiles(ticket.id, formData);
      }

      toast.success(`Ticket ${ticket.ticketNumber} created!`);
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create ticket');
    }
    setLoading(false);
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1>Create New Ticket</h1>
          <p className="page-subtitle">Report a new IT issue or request</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 32, maxWidth: 720 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" name="title" placeholder="Brief description of the issue" value={form.title} onChange={handleChange} autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-textarea" name="description" placeholder="Provide detailed information about the issue..." value={form.description} onChange={handleChange} rows={5} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" name="categoryId" value={form.categoryId} onChange={handleChange}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" name="priority" value={form.priority} onChange={handleChange}>
                <option value="LOW">🟢 Low</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="HIGH">🟠 High</option>
                <option value="CRITICAL">🔴 Critical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Department (optional)</label>
            <select className="form-select" name="departmentId" value={form.departmentId} onChange={handleChange}>
              <option value="">Select department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {/* File Upload */}
          <div className="form-group">
            <label className="form-label">Attachments (max 5 files, 10MB each)</label>
            <label style={styles.uploadArea}>
              <input type="file" multiple onChange={handleFiles} style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" />
              <HiOutlineUpload size={24} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Click to upload or drag files here</span>
            </label>
            {files.length > 0 && (
              <div style={styles.fileList}>
                {files.map((f, i) => (
                  <div key={i} style={styles.fileItem}>
                    <span style={{ fontSize: '0.82rem', flex: 1 }}>{f.name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{(f.size / 1024).toFixed(0)} KB</span>
                    <button type="button" className="btn-icon" onClick={() => removeFile(i)}><HiOutlineX size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/tickets')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><HiOutlinePlus size={16} /> Create Ticket</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  uploadArea: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    padding: 32, border: '2px dashed var(--border-primary)', borderRadius: 'var(--radius-md)',
    cursor: 'pointer', transition: 'all 150ms',
  },
  fileList: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 },
  fileItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
    background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-primary)',
  },
};
