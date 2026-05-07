import { useState, useEffect } from 'react';
import { assetsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineSearch, HiOutlinePencil } from 'react-icons/hi';
import { format } from 'date-fns';

const ASSET_TYPES = ['PC', 'Laptop', 'Printer', 'Router', 'Switch', 'Server', 'Monitor', 'Other'];
const STATUS_OPTIONS = ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED'];

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [form, setForm] = useState({ assetTag: '', name: '', type: 'PC', serialNumber: '', manufacturer: '', model: '', status: 'AVAILABLE', notes: '' });
  const [showDetail, setShowDetail] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { fetchAssets(); }, [typeFilter, debouncedSearch]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await assetsAPI.getAll({ search: debouncedSearch, type: typeFilter, limit: 50 });
      setAssets(res.data.data.assets);
    } catch (e) {}
    setLoading(false);
  };

  const openCreate = () => { setEditAsset(null); setForm({ assetTag: '', name: '', type: 'PC', serialNumber: '', manufacturer: '', model: '', status: 'AVAILABLE', notes: '' }); setShowModal(true); };
  const openEdit = (a) => { setEditAsset(a); setForm({ assetTag: a.assetTag, name: a.name, type: a.type, serialNumber: a.serialNumber || '', manufacturer: a.manufacturer || '', model: a.model || '', status: a.status, notes: a.notes || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editAsset) { await assetsAPI.update(editAsset.id, form); toast.success('Updated'); }
      else { await assetsAPI.create(form); toast.success('Created'); }
      setShowModal(false);
      fetchAssets();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(l => l.trim() !== '');
        if (lines.length < 2) return toast.error('CSV is empty or invalid');
        
        const headers = lines[0].split(',').map(h => h.trim());
        const expectedHeaders = ['assetTag', 'name', 'type'];
        if (!expectedHeaders.every(eh => headers.includes(eh))) {
          return toast.error('CSV must contain headers: assetTag, name, type');
        }

        const assetsToUpload = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const asset = {};
          headers.forEach((h, idx) => { asset[h] = values[idx]; });
          if (asset.assetTag && asset.name && asset.type) assetsToUpload.push(asset);
        }

        if (assetsToUpload.length === 0) return toast.error('No valid assets found in CSV');

        await assetsAPI.bulkUpload(assetsToUpload);
        toast.success(`Successfully uploaded ${assetsToUpload.length} assets`);
        fetchAssets();
      } catch (err) {
        toast.error('Failed to parse or upload CSV');
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const statusColor = { AVAILABLE: 'badge-resolved', ASSIGNED: 'badge-open', MAINTENANCE: 'badge-in-progress', RETIRED: 'badge-closed' };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div><h1>Asset Management</h1><p className="page-subtitle">Track company devices & equipment</p></div>
        <div style={{ display: 'flex', gap: 12 }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            Bulk Upload CSV
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
          <button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus size={16} /> Add Asset</button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
        <form onSubmit={e => { e.preventDefault(); fetchAssets(); }} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: 200 }}>
            <HiOutlineSearch className="search-icon" />
            <input className="form-input" placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 140 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button type="submit" className="btn btn-secondary"><HiOutlineSearch size={16} /></button>
        </form>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
          <table className="data-table">
            <thead><tr><th>Asset Tag</th><th>Name</th><th>Type</th><th>Manufacturer</th><th>Status</th><th>Assigned To</th><th>Warranty</th><th>Actions</th></tr></thead>
            <tbody>
              {assets.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{a.assetTag}</td>
                  <td>{a.name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{a.type}</td>
                  <td style={{ fontSize: '0.82rem' }}>{a.manufacturer || '-'}</td>
                  <td><span className={`badge ${statusColor[a.status] || ''}`}>{a.status}</span></td>
                  <td style={{ fontSize: '0.82rem' }}>{a.assignedTo ? `${a.assignedTo.firstName} ${a.assignedTo.lastName}` : '-'}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{a.warrantyEnd ? format(new Date(a.warrantyEnd), 'MMM yyyy') : '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon" onClick={() => openEdit(a)}><HiOutlinePencil size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editAsset ? 'Edit Asset' : 'Add Asset'}</h2><button className="btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Asset Tag</label><input className="form-input" value={form.assetTag} onChange={e => setForm({...form, assetTag: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>{ASSET_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                  <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>{STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}</select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Manufacturer</label><input className="form-input" value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Model</label><input className="form-input" value={form.model} onChange={e => setForm({...form, model: e.target.value})} /></div>
                </div>
                <div className="form-group"><label className="form-label">Serial Number</label><input className="form-input" value={form.serialNumber} onChange={e => setForm({...form, serialNumber: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editAsset ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
