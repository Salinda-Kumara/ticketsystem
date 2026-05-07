import { useState, useEffect } from 'react';
import { categoriesAPI, departmentsAPI, slaAPI, auditAPI, authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { format } from 'date-fns';

// ─── Categories Page ─────────────────────
export function CategoriesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', icon: '' });

  useEffect(() => { fetch(); }, []);
  const fetch = async () => { setLoading(true); try { const r = await categoriesAPI.getAll(); setItems(r.data.data); } catch (e) {} setLoading(false); };
  const openCreate = () => { setEditItem(null); setForm({ name: '', description: '', icon: '' }); setShowModal(true); };
  const openEdit = (i) => { setEditItem(i); setForm({ name: i.name, description: i.description || '', icon: i.icon || '' }); setShowModal(true); };
  const handleSubmit = async (e) => { e.preventDefault(); try { if (editItem) { await categoriesAPI.update(editItem.id, form); } else { await categoriesAPI.create(form); } toast.success(editItem ? 'Updated' : 'Created'); setShowModal(false); fetch(); } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } };

  return (
    <div className="animate-in">
      <div className="page-header"><div><h1>Categories</h1></div><button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus size={16} /> Add</button></div>
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
          <table className="data-table">
            <thead><tr><th>Icon</th><th>Name</th><th>Description</th><th>Tickets</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{items.map(i => (<tr key={i.id}><td style={{ fontSize: '1.2rem' }}>{i.icon}</td><td style={{ fontWeight: 600 }}>{i.name}</td><td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{i.description || '-'}</td><td>{i._count?.tickets || 0}</td><td><span className={`badge ${i.isActive ? 'badge-resolved' : 'badge-closed'}`}>{i.isActive ? 'Active' : 'Inactive'}</span></td><td><div style={{ display: 'flex', gap: 4 }}><button className="btn-icon" onClick={() => openEdit(i)}><HiOutlinePencil size={16} /></button></div></td></tr>))}</tbody>
          </table>
        )}
      </div>
      {showModal && <CRUDModal title={editItem ? 'Edit Category' : 'New Category'} onClose={() => setShowModal(false)} onSubmit={handleSubmit} isEdit={!!editItem}>
        <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
        <div className="form-group"><label className="form-label">Icon (emoji)</label><input className="form-input" value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} placeholder="🌐" /></div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} /></div>
      </CRUDModal>}
    </div>
  );
}

// ─── Departments Page ────────────────────
export function DepartmentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', code: '' });

  useEffect(() => { fetch(); }, []);
  const fetch = async () => { setLoading(true); try { const r = await departmentsAPI.getAll(); setItems(r.data.data); } catch (e) {} setLoading(false); };
  const openCreate = () => { setEditItem(null); setForm({ name: '', code: '' }); setShowModal(true); };
  const openEdit = (i) => { setEditItem(i); setForm({ name: i.name, code: i.code }); setShowModal(true); };
  const handleSubmit = async (e) => { e.preventDefault(); try { if (editItem) { await departmentsAPI.update(editItem.id, form); } else { await departmentsAPI.create(form); } toast.success(editItem ? 'Updated' : 'Created'); setShowModal(false); fetch(); } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } };

  return (
    <div className="animate-in">
      <div className="page-header"><div><h1>Departments</h1></div><button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus size={16} /> Add</button></div>
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Code</th><th>Users</th><th>Tickets</th><th>Actions</th></tr></thead>
            <tbody>{items.map(i => (<tr key={i.id}><td style={{ fontWeight: 600 }}>{i.name}</td><td><span className="badge badge-role">{i.code}</span></td><td>{i._count?.users || 0}</td><td>{i._count?.tickets || 0}</td><td><button className="btn-icon" onClick={() => openEdit(i)}><HiOutlinePencil size={16} /></button></td></tr>))}</tbody>
          </table>
        )}
      </div>
      {showModal && <CRUDModal title={editItem ? 'Edit Department' : 'New Department'} onClose={() => setShowModal(false)} onSubmit={handleSubmit} isEdit={!!editItem}>
        <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
        <div className="form-group"><label className="form-label">Code</label><input className="form-input" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required placeholder="e.g. IT, HR" /></div>
      </CRUDModal>}
    </div>
  );
}

// ─── SLA Rules Page ──────────────────────
export function SLARulesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', priority: 'MEDIUM', responseTimeMin: 60, resolveTimeMin: 480, escalateAfterMin: 240 });

  useEffect(() => { fetch(); }, []);
  const fetch = async () => { setLoading(true); try { const r = await slaAPI.getAll(); setRules(r.data.data); } catch (e) {} setLoading(false); };
  const openCreate = () => { setEditItem(null); setForm({ name: '', priority: 'MEDIUM', responseTimeMin: 60, resolveTimeMin: 480, escalateAfterMin: 240 }); setShowModal(true); };
  const openEdit = (i) => { setEditItem(i); setForm({ name: i.name, priority: i.priority, responseTimeMin: i.responseTimeMin, resolveTimeMin: i.resolveTimeMin, escalateAfterMin: i.escalateAfterMin || 0 }); setShowModal(true); };
  const handleSubmit = async (e) => { e.preventDefault(); try { const data = { ...form, responseTimeMin: +form.responseTimeMin, resolveTimeMin: +form.resolveTimeMin, escalateAfterMin: +form.escalateAfterMin }; if (editItem) { await slaAPI.update(editItem.id, data); } else { await slaAPI.create(data); } toast.success(editItem ? 'Updated' : 'Created'); setShowModal(false); fetch(); } catch (err) { toast.error('Failed'); } };
  const handleDelete = async (id) => { if (!confirm('Delete this rule?')) return; try { await slaAPI.delete(id); toast.success('Deleted'); fetch(); } catch (e) {} };

  const formatTime = (mins) => { if (mins < 60) return `${mins}m`; const h = Math.floor(mins / 60); const m = mins % 60; return m > 0 ? `${h}h ${m}m` : `${h}h`; };

  return (
    <div className="animate-in">
      <div className="page-header"><div><h1>SLA Rules</h1><p className="page-subtitle">Service Level Agreement configurations</p></div><button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus size={16} /> Add Rule</button></div>
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Priority</th><th>Response Time</th><th>Resolution Time</th><th>Escalate After</th><th>Actions</th></tr></thead>
            <tbody>{rules.map(r => (<tr key={r.id}><td style={{ fontWeight: 600 }}>{r.name}</td><td><span className={`badge badge-${r.priority.toLowerCase()}`}>{r.priority}</span></td><td>{formatTime(r.responseTimeMin)}</td><td>{formatTime(r.resolveTimeMin)}</td><td>{r.escalateAfterMin ? formatTime(r.escalateAfterMin) : '-'}</td><td><div style={{ display: 'flex', gap: 4 }}><button className="btn-icon" onClick={() => openEdit(r)}><HiOutlinePencil size={16} /></button><button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(r.id)}><HiOutlineTrash size={16} /></button></div></td></tr>))}</tbody>
          </table>
        )}
      </div>
      {showModal && <CRUDModal title={editItem ? 'Edit Rule' : 'New SLA Rule'} onClose={() => setShowModal(false)} onSubmit={handleSubmit} isEdit={!!editItem}>
        <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
        <div className="form-group"><label className="form-label">Priority</label><select className="form-select" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Response Time (min)</label><input className="form-input" type="number" value={form.responseTimeMin} onChange={e => setForm({...form, responseTimeMin: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Resolution Time (min)</label><input className="form-input" type="number" value={form.resolveTimeMin} onChange={e => setForm({...form, resolveTimeMin: e.target.value})} /></div>
        </div>
        <div className="form-group"><label className="form-label">Auto-Escalate After (min)</label><input className="form-input" type="number" value={form.escalateAfterMin} onChange={e => setForm({...form, escalateAfterMin: e.target.value})} /></div>
      </CRUDModal>}
    </div>
  );
}

// ─── Audit Logs Page ─────────────────────
export function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(); }, []);
  const fetch = async () => { setLoading(true); try { const r = await auditAPI.getLogs({ limit: 100 }); setLogs(r.data.data.logs); } catch (e) {} setLoading(false); };

  return (
    <div className="animate-in">
      <div className="page-header"><div><h1>Audit Logs</h1><p className="page-subtitle">System activity & security trail</p></div></div>
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
          <table className="data-table">
            <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>IP Address</th><th>Details</th></tr></thead>
            <tbody>{logs.map(l => (<tr key={l.id}><td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{format(new Date(l.createdAt), 'MMM dd HH:mm:ss')}</td><td style={{ fontWeight: 500 }}>{l.user?.firstName} {l.user?.lastName}</td><td><span className="badge badge-role">{l.action}</span></td><td style={{ fontSize: '0.82rem' }}>{l.entity}</td><td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{l.ipAddress || '-'}</td><td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{l.details || '-'}</td></tr>))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Profile Page ────────────────────────
export function ProfilePage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setForm({ firstName: u.firstName || '', lastName: u.lastName || '', phone: u.phone || '' });
  }, []);

  const handleProfile = async (e) => { e.preventDefault(); try { await authAPI.updateProfile(form); toast.success('Profile updated'); } catch (e) { toast.error('Failed'); } };
  const handlePassword = async (e) => { e.preventDefault(); if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match'); try { await authAPI.changePassword(pwForm); toast.success('Password changed'); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } };

  return (
    <div className="animate-in">
      <div className="page-header"><div><h1>Profile</h1><p className="page-subtitle">Manage your account settings</p></div></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 800 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 20 }}>Personal Info</h3>
          <form onSubmit={handleProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group"><label className="form-label">First Name</label><input className="form-input" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </form>
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 20 }}>Change Password</h3>
          <form onSubmit={handlePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group"><label className="form-label">Current Password</label><input className="form-input" type="password" value={pwForm.currentPassword} onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">New Password</label><input className="form-input" type="password" value={pwForm.newPassword} onChange={e => setPwForm({...pwForm, newPassword: e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Confirm Password</label><input className="form-input" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({...pwForm, confirmPassword: e.target.value})} /></div>
            <button type="submit" className="btn btn-primary">Change Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Shared CRUD Modal ───────────────────
function CRUDModal({ title, children, onClose, onSubmit, isEdit }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{title}</h2><button className="btn-icon" onClick={onClose}>✕</button></div>
        <form onSubmit={onSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{isEdit ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
