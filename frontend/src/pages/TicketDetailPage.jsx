import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketsAPI, commentsAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  HiOutlineArrowLeft, HiOutlineClock, HiOutlineUser, HiOutlineTag,
  HiOutlinePaperClip, HiOutlineChatAlt2, HiOutlineLockClosed
} from 'react-icons/hi';

const STATUS_FLOW = ['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'REOPENED'];

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isStaff, isAdmin, isTeamLeader } = useAuth();
  const socket = useSocket();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agents, setAgents] = useState([]);
  const [showAssign, setShowAssign] = useState(false);

  useEffect(() => {
    fetchTicket();
    if (isAdmin || isTeamLeader) usersAPI.getAgents().then(r => setAgents(r.data.data));
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('join:ticket', id);
    socket.on('comment:new', (newComment) => {
      setTicket(prev => prev ? { ...prev, comments: [...prev.comments, newComment] } : prev);
    });
    socket.on('ticket:updated', (updated) => {
      setTicket(prev => prev ? { ...prev, ...updated } : prev);
    });
    return () => {
      socket.emit('leave:ticket', id);
      socket.off('comment:new');
      socket.off('ticket:updated');
    };
  }, [socket, id]);

  const fetchTicket = async () => {
    try {
      const res = await ticketsAPI.getById(id);
      setTicket(res.data.data);
    } catch (e) {
      toast.error('Ticket not found');
      navigate('/tickets');
    }
    setLoading(false);
  };

  const handleStatusChange = async (status) => {
    try {
      await ticketsAPI.updateStatus(id, status);
      fetchTicket();
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const handleAssign = async (assigneeId) => {
    try {
      await ticketsAPI.assign(id, assigneeId);
      fetchTicket();
      setShowAssign(false);
      toast.success('Ticket assigned');
    } catch (e) {
      toast.error('Failed to assign');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await commentsAPI.create(id, { content: comment, isInternal });
      setComment('');
      fetchTicket();
    } catch (e) {
      toast.error('Failed to add comment');
    }
    setSubmitting(false);
  };

  const getSLAInfo = () => {
    if (!ticket?.slaDeadline) return null;
    const deadline = new Date(ticket.slaDeadline);
    const now = new Date();
    const remaining = deadline - now;
    if (ticket.slaBreached || remaining <= 0) return { status: 'breached', text: 'SLA Breached' };
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    if (remaining <= 30 * 60 * 1000) return { status: 'warning', text: `${mins}m remaining` };
    return { status: 'ok', text: `${hours}h ${mins}m remaining` };
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!ticket) return null;

  const sla = getSLAInfo();

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn-icon" onClick={() => navigate('/tickets')}><HiOutlineArrowLeft size={20} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{ticket.ticketNumber}</span>
            <span className={`badge badge-${ticket.status.toLowerCase().replace('_', '-')}`}>{ticket.status.replace('_', ' ')}</span>
            <span className={`badge badge-${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
            {sla && <span className={`sla-timer sla-${sla.status}`}><HiOutlineClock size={12} /> {sla.text}</span>}
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: 6 }}>{ticket.title}</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Description */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={styles.sectionTitle}>Description</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
          </div>

          {/* Attachments */}
          {ticket.attachments?.length > 0 && (
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={styles.sectionTitle}><HiOutlinePaperClip size={16} /> Attachments ({ticket.attachments.length})</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                {ticket.attachments.map(a => (
                  <a key={a.id} href={`http://localhost:3002${a.filePath}`} target="_blank" rel="noreferrer" style={styles.attachItem}>
                    <HiOutlinePaperClip size={14} />
                    <span>{a.fileName}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({(a.fileSize / 1024).toFixed(0)} KB)</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={styles.sectionTitle}><HiOutlineChatAlt2 size={16} /> Comments ({ticket.comments?.length || 0})</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
              {ticket.comments?.map(c => (
                <div key={c.id} style={{ ...styles.commentItem, ...(c.isInternal ? styles.internalComment : {}) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div className="avatar avatar-sm">
                      {c.author?.firstName?.[0]}{c.author?.lastName?.[0]}
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.author?.firstName} {c.author?.lastName}</span>
                      <span className="badge badge-role" style={{ marginLeft: 8, fontSize: '0.65rem' }}>{c.author?.role}</span>
                      {c.isInternal && <span style={styles.internalBadge}><HiOutlineLockClosed size={10} /> Internal</span>}
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {format(new Date(c.createdAt), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{c.content}</p>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            {!['CLOSED'].includes(ticket.status) && (
              <form onSubmit={handleComment} style={{ marginTop: 20 }}>
                <textarea
                  className="form-textarea"
                  placeholder="Write a comment..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                  {isStaff && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                      <HiOutlineLockClosed size={14} /> Internal note
                    </label>
                  )}
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submitting} style={{ marginLeft: 'auto' }}>
                    {submitting ? '...' : 'Add Comment'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* History */}
          {ticket.history?.length > 0 && (
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={styles.sectionTitle}>History</h3>
              <div style={{ marginTop: 12 }}>
                {ticket.history.map(h => (
                  <div key={h.id} style={styles.historyItem}>
                    <div style={styles.historyDot} />
                    <div>
                      <span style={{ fontSize: '0.82rem' }}>
                        <strong>{h.field.charAt(0).toUpperCase() + h.field.slice(1)}</strong> changed from <span style={styles.oldValue}>{h.oldValue || 'none'}</span> to <span style={styles.newValue}>{h.newValue}</span>
                        {h.changedByName && <span> by <strong>{h.changedByName}</strong></span>}
                      </span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {format(new Date(h.createdAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Details */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={styles.sectionTitle}>Details</h3>
            <div style={styles.detailGrid}>
              <DetailRow label="Created by" value={`${ticket.creator?.firstName} ${ticket.creator?.lastName}`} />
              <DetailRow label="Category" value={`${ticket.category?.icon || ''} ${ticket.category?.name}`} />
              <DetailRow label="Department" value={ticket.department?.name || '-'} />
              <DetailRow label="Assignee" value={ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : 'Unassigned'} />
              <DetailRow label="Created" value={format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')} />
              {ticket.resolvedAt && <DetailRow label="Resolved" value={format(new Date(ticket.resolvedAt), 'MMM dd, yyyy HH:mm')} />}
              {ticket.slaDeadline && <DetailRow label="SLA Deadline" value={format(new Date(ticket.slaDeadline), 'MMM dd, yyyy HH:mm')} />}
            </div>
          </div>

          {/* Actions */}
          {(isStaff || ticket.status === 'RESOLVED') && (
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={styles.sectionTitle}>Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                
                {/* Employee Resolution buttons */}
                {ticket.status === 'RESOLVED' && !isStaff && (
                  <>
                    <button className="btn btn-success btn-sm" onClick={() => handleStatusChange('CLOSED')} style={{ width: '100%' }}>Accept Resolution (Close Ticket)</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange('REOPENED')} style={{ width: '100%' }}>Reject Resolution (Reopen)</button>
                  </>
                )}

                {/* Status buttons for staff */}
                {ticket.status !== 'CLOSED' && isStaff && (
                  <>
                    {ticket.status === 'OPEN' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange('IN_PROGRESS')} style={{ width: '100%' }}>Start Working</button>
                    )}
                    {['IN_PROGRESS', 'OPEN'].includes(ticket.status) && (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange('PENDING')} style={{ width: '100%' }}>Set Pending</button>
                    )}
                    {['IN_PROGRESS', 'PENDING', 'OPEN'].includes(ticket.status) && (
                      <button className="btn btn-success btn-sm" onClick={() => handleStatusChange('RESOLVED')} style={{ width: '100%' }}>Mark Resolved</button>
                    )}
                    {ticket.status === 'RESOLVED' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange('CLOSED')} style={{ width: '100%' }}>Close Ticket</button>
                    )}
                  </>
                )}
                {['RESOLVED', 'CLOSED'].includes(ticket.status) && isStaff && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange('REOPENED')} style={{ width: '100%' }}>Reopen Ticket</button>
                )}

                {/* Assign */}
                {(isAdmin || isTeamLeader) && (
                  <>
                    <div style={{ height: 1, background: 'var(--border-primary)', margin: '4px 0' }} />
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowAssign(!showAssign)} style={{ width: '100%' }}>
                      <HiOutlineUser size={14} /> Assign Ticket
                    </button>
                    {showAssign && (
                      <div style={styles.assignList}>
                        {agents.map(a => (
                          <button key={a.id} onClick={() => handleAssign(a.id)} style={styles.assignItem}>
                            <div className="avatar avatar-sm">{a.firstName[0]}{a.lastName[0]}</div>
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{a.firstName} {a.lastName}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{a._count?.assignedTickets || 0} active tickets</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={styles.detailValue}>{value}</span>
    </div>
  );
}

const styles = {
  sectionTitle: { fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 },
  commentItem: {
    padding: 16, borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)',
    border: '1px solid var(--border-primary)',
  },
  internalComment: { borderColor: 'rgba(245, 158, 11, 0.2)', background: 'rgba(245, 158, 11, 0.03)' },
  internalBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8,
    padding: '2px 8px', borderRadius: 50, fontSize: '0.65rem', fontWeight: 600,
    background: 'rgba(245, 158, 11, 0.12)', color: 'var(--warning)',
  },
  historyItem: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--table-row-border)' },
  historyDot: { width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)', marginTop: 6, flexShrink: 0 },
  oldValue: { textDecoration: 'line-through', color: 'var(--danger)', fontSize: '0.82rem' },
  newValue: { color: 'var(--success)', fontWeight: 600, fontSize: '0.82rem' },
  detailGrid: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 },
  detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' },
  detailValue: { fontSize: '0.85rem', fontWeight: 500, textAlign: 'right' },
  attachItem: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
    background: 'var(--bg-glass)', border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--accent-primary)',
    textDecoration: 'none', transition: 'all 150ms',
  },
  assignList: { display: 'flex', flexDirection: 'column', gap: 4 },
  assignItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
    background: 'var(--bg-glass)', border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 150ms',
    color: 'var(--text-primary)', fontFamily: 'inherit', textAlign: 'left', width: '100%',
  },
};
