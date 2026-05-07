import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { HiOutlineTicket, HiOutlineClock, HiOutlineExclamation, HiOutlineCheckCircle, HiOutlineTrendingUp, HiOutlineExclamationCircle } from 'react-icons/hi';

const STATUS_COLORS = ['#3b82f6', '#f59e0b', '#f97316', '#10b981', '#6b7280', '#ef4444'];
const PRIORITY_COLORS = { LOW: '#14b8a6', MEDIUM: '#eab308', HIGH: '#f97316', CRITICAL: '#ef4444' };

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, isEmployee } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const chartTooltip = { background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 8, fontSize: 12, color: isDark ? '#f1f5f9' : '#1e293b' };
  const gridStroke = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const axisColor = isDark ? '#64748b' : '#94a3b8';
  const axisColorAlt = isDark ? '#94a3b8' : '#475569';

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setStats(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!stats) return <div className="empty-state"><p>Failed to load dashboard</p></div>;

  const { overview, recentTickets, categoryData, priorityData, techWorkload, weeklyTrend } = stats;

  const statCards = [
    { label: 'Open Tickets', value: overview.openTickets, color: 'text-blue', icon: HiOutlineTicket },
    { label: 'In Progress', value: overview.inProgressTickets, color: 'text-amber', icon: HiOutlineClock },
    { label: 'Resolved', value: overview.resolvedTickets, color: 'text-green', icon: HiOutlineCheckCircle },
    { label: 'Critical', value: overview.criticalTickets, color: 'text-red', icon: HiOutlineExclamation },
    { label: 'SLA Compliance', value: `${overview.slaCompliance}%`, color: 'text-purple', icon: HiOutlineTrendingUp },
    { label: 'SLA Breached', value: overview.slaBreached, color: 'text-red', icon: HiOutlineExclamationCircle },
  ];

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Overview of your IT support operations</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-card stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="stat-label">{card.label}</span>
                <Icon size={20} style={{ color: 'var(--text-muted)' }} />
              </div>
              <span className={`stat-value ${card.color}`}>{card.value}</span>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div style={styles.chartsRow}>
        {/* Weekly Trend */}
        <div className="glass-card" style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Weekly Ticket Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: axisColor }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} allowDecimals={false} />
              <Tooltip contentStyle={chartTooltip} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="glass-card" style={styles.chartCard}>
          <h3 style={styles.chartTitle}>By Priority</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={priorityData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4}>
                {priorityData.map((entry, i) => (
                  <Cell key={i} fill={PRIORITY_COLORS[entry.name] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltip} />
            </PieChart>
          </ResponsiveContainer>
          <div style={styles.legend}>
            {priorityData.map((p, i) => (
              <div key={i} style={styles.legendItem}>
                <span style={{ ...styles.legendDot, background: PRIORITY_COLORS[p.name] || '#6b7280' }} />
                <span>{p.name}</span>
                <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={styles.chartsRow}>
        {/* Category Breakdown */}
        <div className="glass-card" style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Issues by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis type="number" tick={{ fontSize: 11, fill: axisColor }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: axisColorAlt }} width={120} />
              <Tooltip contentStyle={chartTooltip} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Tickets & Tech Workload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          {/* Recent Tickets */}
          <div className="glass-card" style={styles.listCard}>
            <h3 style={styles.chartTitle}>Recent Tickets</h3>
            {recentTickets.map(t => (
              <div key={t.id} style={styles.ticketRow} onClick={() => navigate(`/tickets/${t.id}`)}>
                <div>
                  <div style={styles.ticketNum}>{t.ticketNumber}</div>
                  <div style={styles.ticketTitle}>{t.title}</div>
                </div>
                <span className={`badge badge-${t.status.toLowerCase().replace('_', '-')}`}>{t.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>

          {/* Technician Workload */}
          {!isEmployee && techWorkload.length > 0 && (
            <div className="glass-card" style={styles.listCard}>
              <h3 style={styles.chartTitle}>Technician Workload</h3>
              {techWorkload.map(t => (
                <div key={t.id} style={styles.techRow}>
                  <div className="avatar avatar-sm">{t.name.split(' ').map(n => n[0]).join('')}</div>
                  <span style={{ flex: 1, fontSize: '0.85rem' }}>{t.name}</span>
                  <span style={styles.workloadBadge}>{t.activeTickets} active</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 },
  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 },
  chartCard: { padding: 24 },
  chartTitle: { fontSize: '0.95rem', fontWeight: 600, marginBottom: 20 },
  legend: { display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' },
  legendDot: { width: 10, height: 10, borderRadius: 3, flexShrink: 0 },
  listCard: { padding: 20 },
  ticketRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 0', borderBottom: '1px solid var(--table-row-border)',
    cursor: 'pointer', transition: 'opacity 150ms',
  },
  ticketNum: { fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 },
  ticketTitle: { fontSize: '0.85rem', marginTop: 2 },
  techRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--table-row-border)' },
  workloadBadge: {
    padding: '3px 10px', borderRadius: 50, fontSize: '0.72rem', fontWeight: 600,
    background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)',
  },
};
