import { useState, useEffect } from 'react';
import { usersAPI, departmentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineSearch, HiOutlinePencil, HiOutlineBan } from 'react-icons/hi';
import { format } from 'date-fns';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'EMPLOYEE', departmentId: '' });

  useEffect(() => { fetchUsers(); departmentsAPI.getAll().then(r => setDepartments(r.data.data)); }, []);

  const fetchUsers = async (params = {}) => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll({ limit: 20, search, ...params });
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch (e) {}
    setLoading(false);
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'EMPLOYEE', departmentId: '' });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ email: u.email, password: '', firstName: u.firstName, lastName: u.lastName, phone: u.phone || '', role: u.role, departmentId: u.departmentId || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        const { email, password, ...updateData } = form;
        await usersAPI.update(editUser.id, updateData);
        toast.success('User updated');
      } else {
        await usersAPI.create(form);
        toast.success('User created');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await usersAPI.delete(id);
      toast.success('User deactivated');
      fetchUsers();
    } catch (e) { toast.error('Failed'); }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div><h1>User Management</h1><p className="page-subtitle">{pagination.total || 0} users</p></div>
        <button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus size={16} /> Add User</button>
      </div>

      <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
        <form onSubmit={(e) => { e.preventDefault(); fetchUsers(); }} style={{ display: 'flex', gap: 12 }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <HiOutlineSearch className="search-icon" />
            <input className="form-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-secondary"><HiOutlineSearch size={16} /></button>
        </form>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Active Tickets</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{u.email}</td>
                  <td><span className="badge badge-role">{u.role.replace('_', ' ')}</span></td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{u.department?.name || '-'}</td>
                  <td>{u._count?.assignedTickets || 0}</td>
                  <td><span className={`badge ${u.isActive ? 'badge-resolved' : 'badge-closed'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon" onClick={() => openEdit(u)} title="Edit"><HiOutlinePencil size={16} /></button>
                      {u.isActive && <button className="btn-icon" onClick={() => handleDeactivate(u.id)} title="Deactivate" style={{ color: 'var(--danger)' }}><HiOutlineBan size={16} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editUser ? 'Edit User' : 'Create User'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">First Name</label><input className="form-input" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required /></div>
                </div>
                {!editUser && <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>}
                {!editUser && <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} /></div>}
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Role</label>
                    <select className="form-select" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                      <option value="EMPLOYEE">Employee</option><option value="AGENT">Agent</option><option value="TEAM_LEADER">Team Leader</option><option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Department</label>
                    <select className="form-select" value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})}>
                      <option value="">None</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editUser ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
