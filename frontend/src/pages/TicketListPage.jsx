import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsAPI, reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HiOutlinePlus, HiOutlineSearch, HiOutlineFilter, HiOutlineRefresh, HiOutlineDownload } from 'react-icons/hi';
import { format } from 'date-fns';

export default function TicketListPage() {
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', page: 1 });
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const { isStaff } = useAuth();

  const [stats, setStats] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTickets();
    }, 400);
    return () => clearTimeout(timer);
  }, [filters.search, filters.status, filters.priority, filters.page]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { dashboardAPI } = await import('../services/api');
      const res = await dashboardAPI.getStats();
      setStats(res.data.data.overview);
    } catch (e) {}
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, limit: 15 };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      const res = await ticketsAPI.getAll(params);
      setTickets(res.data.data.tickets);
      setPagination(res.data.data.pagination);
    } catch (e) {}
    setLoading(false);
  };

  const handleDownloadReport = async () => {
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      
      const res = await reportsAPI.exportTickets(params);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tickets_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed', error);
      alert('Failed to download report');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const statusOptions = ['', 'OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'REOPENED'];
  const priorityOptions = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  const getSLAStatus = (ticket) => {
    if (ticket.slaBreached) return 'breached';
    if (!ticket.slaDeadline) return null;
    const remaining = new Date(ticket.slaDeadline) - new Date();
    if (remaining <= 0) return 'breached';
    if (remaining <= 30 * 60 * 1000) return 'warning';
    return 'ok';
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1>Tickets</h1>
          <p className="page-subtitle">{pagination.total} total tickets</p>
        </div>
        <div className="page-actions">
          {isStaff && (
            <button className="btn btn-secondary" onClick={handleDownloadReport}>
              <HiOutlineDownload size={16} /> Download Report
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)}>
            <HiOutlineFilter size={16} /> Filters
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/tickets/create')}>
            <HiOutlinePlus size={16} /> New Ticket
          </button>
        </div>
      </div>

      {/* Status Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 20 }}>
          <div 
            className="glass-card" 
            style={{ padding: 16, cursor: 'pointer', border: filters.status === '' ? '2px solid var(--accent-primary)' : '1px solid var(--border-primary)' }}
            onClick={() => setFilters(f => ({ ...f, status: '', page: 1 }))}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 4 }}>{stats.totalTickets}</div>
          </div>
          <div 
            className="glass-card" 
            style={{ padding: 16, cursor: 'pointer', border: filters.status === 'OPEN' ? '2px solid var(--primary)' : '1px solid var(--border-primary)' }}
            onClick={() => setFilters(f => ({ ...f, status: 'OPEN', page: 1 }))}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Open</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 4, color: 'var(--primary)' }}>{stats.openTickets}</div>
          </div>
          <div 
            className="glass-card" 
            style={{ padding: 16, cursor: 'pointer', border: filters.status === 'IN_PROGRESS' ? '2px solid var(--warning)' : '1px solid var(--border-primary)' }}
            onClick={() => setFilters(f => ({ ...f, status: 'IN_PROGRESS', page: 1 }))}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>In Progress</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 4, color: 'var(--warning)' }}>{stats.inProgressTickets}</div>
          </div>
          <div 
            className="glass-card" 
            style={{ padding: 16, cursor: 'pointer', border: filters.status === 'PENDING' ? '2px solid var(--text-muted)' : '1px solid var(--border-primary)' }}
            onClick={() => setFilters(f => ({ ...f, status: 'PENDING', page: 1 }))}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Pending</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 4, color: 'var(--text-muted)' }}>{stats.pendingTickets}</div>
          </div>
          <div 
            className="glass-card" 
            style={{ padding: 16, cursor: 'pointer', border: filters.status === 'RESOLVED' ? '2px solid var(--success)' : '1px solid var(--border-primary)' }}
            onClick={() => setFilters(f => ({ ...f, status: 'RESOLVED', page: 1 }))}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Resolved</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 4, color: 'var(--success)' }}>{stats.resolvedTickets}</div>
          </div>
          <div 
            className="glass-card" 
            style={{ padding: 16, cursor: 'pointer', border: filters.status === 'CLOSED' ? '2px solid var(--text-secondary)' : '1px solid var(--border-primary)' }}
            onClick={() => setFilters(f => ({ ...f, status: 'CLOSED', page: 1 }))}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Closed</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 4, color: 'var(--text-secondary)' }}>{stats.closedTickets}</div>
          </div>
          <div 
            className="glass-card" 
            style={{ padding: 16, cursor: 'pointer', border: filters.status === 'REOPENED' ? '2px solid var(--danger)' : '1px solid var(--border-primary)' }}
            onClick={() => setFilters(f => ({ ...f, status: 'REOPENED', page: 1 }))}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Reopened</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 4, color: 'var(--danger)' }}>{stats.reopenedTickets}</div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: 200 }}>
            <HiOutlineSearch className="search-icon" />
            <input
              className="form-input"
              placeholder="Search tickets..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
            />
          </div>
          {showFilters && (
            <>
              <select className="form-select" style={{ width: 160 }} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}>
                <option value="">All Status</option>
                {statusOptions.filter(Boolean).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
              <select className="form-select" style={{ width: 140 }} value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value, page: 1 }))}>
                <option value="">All Priority</option>
                {priorityOptions.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </>
          )}
          <button type="submit" className="btn btn-secondary"><HiOutlineSearch size={16} /></button>
          <button type="button" className="btn-icon" onClick={() => { setFilters({ search: '', status: '', priority: '', page: 1 }); }}>
            <HiOutlineRefresh size={18} />
          </button>
        </form>
      </div>

      {/* Tickets Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎫</div>
            <h3>No tickets found</h3>
            <p>Try adjusting your filters or create a new ticket</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Category</th>
                <th>Created By</th>
                <th>Assignee</th>
                <th>SLA</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => {
                const slaStatus = getSLAStatus(t);
                return (
                  <tr key={t.id} onClick={() => navigate(`/tickets/${t.id}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.82rem' }}>{t.ticketNumber}</td>
                    <td>
                      <div style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    </td>
                    <td><span className={`badge badge-${t.status.toLowerCase().replace('_', '-')}`}>{t.status.replace('_', ' ')}</span></td>
                    <td><span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{t.category?.icon} {t.category?.name}</td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {t.creator ? `${t.creator.firstName} ${t.creator.lastName}` : <span style={{ color: 'var(--text-muted)' }}>System</span>}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                    </td>
                    <td>
                      {slaStatus && (
                        <span className={`sla-timer sla-${slaStatus}`}>
                          {slaStatus === 'breached' ? '⚠️ Breached' : slaStatus === 'warning' ? '⏰ Warning' : '✅ OK'}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {format(new Date(t.createdAt), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} tickets)
          </span>
          <div className="pagination-buttons">
            <button className="pagination-btn" disabled={pagination.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>Prev</button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`pagination-btn ${p === pagination.page ? 'active' : ''}`} onClick={() => setFilters(f => ({ ...f, page: p }))}>{p}</button>
            ))}
            <button className="pagination-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
