import { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { HiOutlineDownload } from 'react-icons/hi';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#f59e0b', '#f97316', '#10b981', '#6b7280', '#ef4444'];

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const { isDark } = useTheme();

  const chartTooltip = { background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 8, fontSize: 12, color: isDark ? '#f1f5f9' : '#1e293b' };
  const gridStroke = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const axisColor = isDark ? '#64748b' : '#94a3b8';
  const axisColorAlt = isDark ? '#94a3b8' : '#475569';

  useEffect(() => { fetchReport(); }, [month, year]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportsAPI.getMonthly({ month, year });
      setReport(res.data.data);
    } catch (e) {}
    setLoading(false);
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (month !== 'all') {
        const d = new Date(year, month - 1, 1);
        params.dateFrom = d.toISOString();
        params.dateTo = new Date(year, month, 0, 23, 59, 59).toISOString();
      } else {
        params.dateFrom = new Date(year, 0, 1).toISOString();
        params.dateTo = new Date(year, 11, 31, 23, 59, 59).toISOString();
      }
      const res = await reportsAPI.exportTickets(params);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tickets_report.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch (e) { toast.error('Export failed'); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div><h1>Reports</h1><p className="page-subtitle">Monthly ticket analysis</p></div>
        <div className="page-actions">
          <select className="form-select" style={{ width: 120 }} value={month} onChange={e => setMonth(e.target.value === 'all' ? 'all' : +e.target.value)}>
            <option value="all">All time</option>
            {Array.from({length: 12}, (_, i) => <option key={i} value={i+1}>{new Date(2000, i).toLocaleString('en', {month: 'long'})}</option>)}
          </select>
          <select className="form-select" style={{ width: 100 }} value={year} onChange={e => setYear(+e.target.value)}>
            {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={handleExport}><HiOutlineDownload size={16} /> Export Excel</button>
        </div>
      </div>

      {report && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <div className="glass-card stat-card"><span className="stat-label">Total Tickets</span><span className="stat-value text-blue">{report.total}</span></div>
            <div className="glass-card stat-card"><span className="stat-label">Resolved</span><span className="stat-value text-green">{report.resolved}</span></div>
            <div className="glass-card stat-card"><span className="stat-label">Avg Resolution</span><span className="stat-value text-amber">{report.avgResolutionHours}h</span></div>
            <div className="glass-card stat-card"><span className="stat-label">Resolution Rate</span><span className="stat-value text-purple">{report.total ? Math.round(report.resolved/report.total*100) : 0}%</span></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 20 }}>By Status</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={report.byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4}>
                    {report.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={chartTooltip} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                {report.byStatus.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length] }} />
                    {s.status.replace('_', ' ')} ({s.count})
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 20 }}>By Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={report.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="category" tick={{ fontSize: 10, fill: axisColorAlt }} angle={-30} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 11, fill: axisColor }} allowDecimals={false} />
                  <Tooltip contentStyle={chartTooltip} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
