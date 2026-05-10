import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { kbAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlinePlus, HiOutlineEye, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editArticle, setEditArticle] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', categoryTag: '', tags: '', isPublished: true });
  const { isStaff } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchArticles();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await kbAPI.getAll({ search, limit: 50 });
      setArticles(res.data.data.articles);
    } catch (e) {}
    setLoading(false);
  };

  const openCreate = () => { setEditArticle(null); setForm({ title: '', content: '', categoryTag: '', tags: '', isPublished: true }); setShowEditor(true); };
  const openEdit = (a) => { setEditArticle(a); setForm({ title: a.title, content: a.content, categoryTag: a.categoryTag || '', tags: a.tags?.join(', ') || '', isPublished: a.isPublished }); setShowEditor(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (editArticle) { await kbAPI.update(editArticle.id, data); toast.success('Updated'); }
      else { await kbAPI.create(data); toast.success('Created'); }
      setShowEditor(false);
      fetchArticles();
    } catch (err) { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this article?')) return;
    try { await kbAPI.delete(id); toast.success('Deleted'); fetchArticles(); } catch (e) { toast.error('Failed'); }
  };

  const [viewArticle, setViewArticle] = useState(null);

  return (
    <div className="animate-in">
      <div className="page-header">
        <div><h1>Knowledge Base</h1><p className="page-subtitle">Troubleshooting guides & FAQs</p></div>
        {isStaff && <button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus size={16} /> New Article</button>}
      </div>

      <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
        <form onSubmit={(e) => { e.preventDefault(); }} style={{ display: 'flex', gap: 12 }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <HiOutlineSearch className="search-icon" />
            <input className="form-input" placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-secondary"><HiOutlineSearch size={16} /></button>
        </form>
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /></div> : articles.length === 0 ? (
        <div className="glass-card"><div className="empty-state"><div className="empty-icon">📚</div><h3>No articles found</h3></div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {articles.map(a => (
            <div key={a.id} className="glass-card" style={{ padding: 24, cursor: 'pointer' }} onClick={() => setViewArticle(a)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                {a.categoryTag && <span className="badge badge-role">{a.categoryTag}</span>}
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}><HiOutlineEye size={12} /> {a.viewCount}</span>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>{a.title}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {a.content.replace(/[#*]/g, '').slice(0, 150)}...
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>By {a.author?.firstName} {a.author?.lastName}</span>
                {isStaff && (
                  <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                    <button className="btn-icon" onClick={() => openEdit(a)}><HiOutlinePencil size={14} /></button>
                    <button className="btn-icon" onClick={() => handleDelete(a.id)} style={{ color: 'var(--danger)' }}><HiOutlineTrash size={14} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Article Modal */}
      {viewArticle && (
        <div className="modal-overlay" onClick={() => setViewArticle(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: '85vh', overflow: 'auto' }}>
            <div className="modal-header"><h2>{viewArticle.title}</h2><button className="btn-icon" onClick={() => setViewArticle(null)}>✕</button></div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {viewArticle.tags?.map((t, i) => <span key={i} className="badge badge-role">{t}</span>)}
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{viewArticle.content}</div>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="modal-overlay" onClick={() => setShowEditor(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header"><h2>{editArticle ? 'Edit Article' : 'New Article'}</h2><button className="btn-icon" onClick={() => setShowEditor(false)}>✕</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Content (Markdown)</label><textarea className="form-textarea" value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={10} required /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Category Tag</label><input className="form-input" value={form.categoryTag} onChange={e => setForm({...form, categoryTag: e.target.value})} placeholder="e.g. Network, VPN" /></div>
                  <div className="form-group"><label className="form-label">Tags (comma separated)</label><input className="form-input" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="wifi, network" /></div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.isPublished} onChange={e => setForm({...form, isPublished: e.target.checked})} /> Published
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditor(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editArticle ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
