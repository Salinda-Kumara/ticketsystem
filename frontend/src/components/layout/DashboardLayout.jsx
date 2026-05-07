import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { notificationsAPI } from '../../services/api';
import {
  HiOutlineTicket, HiOutlineViewGrid, HiOutlineUsers, HiOutlinePlus,
  HiOutlineBell, HiOutlineLogout, HiOutlineCog, HiOutlineFolder,
  HiOutlineChartBar, HiOutlineBookOpen, HiOutlineDesktopComputer,
  HiOutlineShieldCheck, HiOutlineClipboardList, HiOutlineMenu,
  HiOutlineX, HiOutlineClock, HiOutlineUser
} from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function DashboardLayout() {
  const { user, logout, isAdmin, isStaff, isTeamLeader } = useAuth();
  const socket = useSocket();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Fetch unread count
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      fetchUnreadCount();
      toast('New notification!', { icon: '🔔' });
    };
    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, [socket]);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      setUnreadCount(res.data.data.count);
    } catch (e) {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll({ limit: 8 });
      setNotifications(res.data.data.notifications);
    } catch (e) {}
  };

  const toggleNotif = () => {
    if (!showNotifDropdown) fetchNotifications();
    setShowNotifDropdown(!showNotifDropdown);
    setShowUserMenu(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  const navItems = [
    { path: '/', icon: HiOutlineViewGrid, label: 'Dashboard', show: true },
    { path: '/tickets', icon: HiOutlineTicket, label: 'Tickets', show: true },
    { path: '/tickets/create', icon: HiOutlinePlus, label: 'New Ticket', show: true },
    { type: 'divider', show: isStaff },
    { path: '/knowledge', icon: HiOutlineBookOpen, label: 'Knowledge Base', show: true },
    { path: '/assets', icon: HiOutlineDesktopComputer, label: 'Assets', show: isStaff },
    { type: 'divider', show: isAdmin || isTeamLeader },
    { path: '/reports', icon: HiOutlineChartBar, label: 'Reports', show: isAdmin || isTeamLeader },
    { path: '/users', icon: HiOutlineUsers, label: 'Users', show: isAdmin || isTeamLeader },
    { type: 'divider', show: isAdmin },
    { path: '/categories', icon: HiOutlineFolder, label: 'Categories', show: isAdmin },
    { path: '/departments', icon: HiOutlineClipboardList, label: 'Departments', show: isAdmin },
    { path: '/sla-rules', icon: HiOutlineClock, label: 'SLA Rules', show: isAdmin },
    { path: '/audit', icon: HiOutlineShieldCheck, label: 'Audit Logs', show: isAdmin },
  ];

  const getInitials = (u) => u ? `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase() : '?';

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed)', minWidth: sidebarOpen ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed)' }}>
        <div style={styles.sidebarHeader}>
          {sidebarOpen && (
            <div style={styles.brand}>
              <div style={styles.brandIcon}><HiOutlineTicket size={20} /></div>
              <span style={styles.brandText}>IT Tickets</span>
            </div>
          )}
          <button className="btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ marginLeft: sidebarOpen ? 'auto' : 0 }}>
            {sidebarOpen ? <HiOutlineX size={18} /> : <HiOutlineMenu size={18} />}
          </button>
        </div>

        <nav style={styles.nav}>
          {navItems.filter(i => i.show).map((item, i) => {
            if (item.type === 'divider') return <div key={`d-${i}`} style={styles.divider} />;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => isActive ? 'nav-active' : ''}
                style={({ isActive }) => ({
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  padding: sidebarOpen ? '10px 16px' : '10px',
                })}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Area */}
      <div style={styles.main}>
        {/* Top Bar */}
        <header style={styles.topbar}>
          <div style={styles.topbarLeft}>
            <h2 style={styles.greeting}>
              Welcome, {user?.firstName}
            </h2>
          </div>

          <div style={styles.topbarRight}>
            {/* Theme Toggle */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              <div className={`toggle-thumb ${isDark ? '' : 'light'}`}>
                {isDark ? '🌙' : '☀️'}
              </div>
            </button>

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button className="btn-icon" onClick={toggleNotif} style={{ position: 'relative' }}>
                <HiOutlineBell size={20} />
                {unreadCount > 0 && (
                  <span style={styles.notifBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>

              {showNotifDropdown && (
                <>
                  <div style={styles.overlay} onClick={() => setShowNotifDropdown(false)} />
                  <div style={styles.dropdown}>
                    <div style={styles.dropdownHeader}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} style={styles.markAllBtn}>Mark all read</button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div style={styles.emptyNotif}>No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          style={{ ...styles.notifItem, ...(n.isRead ? {} : styles.notifUnread) }}
                          onClick={() => { setShowNotifDropdown(false); if (n.link) navigate(n.link); }}
                        >
                          <div style={styles.notifTitle}>{n.title}</div>
                          <div style={styles.notifMsg}>{n.message}</div>
                          <div style={styles.notifTime}>{new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                    <div style={styles.dropdownFooter}>
                      <button onClick={() => { setShowNotifDropdown(false); navigate('/notifications'); }} style={styles.viewAllBtn}>
                        View All Notifications
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Menu */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifDropdown(false); }} style={styles.userBtn}>
                <div className="avatar avatar-sm">{getInitials(user)}</div>
                {<span style={styles.userName}>{user?.firstName}</span>}
              </button>

              {showUserMenu && (
                <>
                  <div style={styles.overlay} onClick={() => setShowUserMenu(false)} />
                  <div style={{ ...styles.dropdown, width: 200, right: 0 }}>
                    <div style={styles.userInfo}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user?.firstName} {user?.lastName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                      <span className="badge badge-role" style={{ marginTop: 6 }}>{user?.role?.replace('_', ' ')}</span>
                    </div>
                    <div style={styles.divider} />
                    <button onClick={() => { setShowUserMenu(false); navigate('/profile'); }} style={styles.menuItem}>
                      <HiOutlineUser size={16} /> Profile
                    </button>
                    <button onClick={handleLogout} style={{ ...styles.menuItem, color: 'var(--danger)' }}>
                      <HiOutlineLogout size={16} /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles = {
  layout: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    background: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-primary)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 250ms ease, min-width 250ms ease',
    overflow: 'hidden',
    position: 'sticky',
    top: 0,
    height: '100vh',
    zIndex: 50,
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    height: 'var(--topbar-height)',
    borderBottom: '1px solid var(--border-primary)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--accent-gradient)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  brandText: { fontWeight: 700, fontSize: '1rem', whiteSpace: 'nowrap' },
  nav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    borderRadius: 'var(--radius-md)',
    transition: 'all 150ms',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  navItemActive: {
    background: 'rgba(99, 102, 241, 0.12)',
    color: 'var(--accent-primary)',
  },
  divider: { height: 1, background: 'var(--border-primary)', margin: '8px 0' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  topbar: {
    height: 'var(--topbar-height)',
    borderBottom: '1px solid var(--border-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    background: 'var(--bg-sidebar)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 40,
  },
  topbarLeft: {},
  greeting: { fontSize: '0.95rem', fontWeight: 500 },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 8 },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    background: 'var(--danger)',
    color: 'white',
    fontSize: '0.65rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
  },
  overlay: { position: 'fixed', inset: 0, zIndex: 50 },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: 340,
    maxHeight: 420,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 100,
    overflow: 'hidden',
    animation: 'slideDown 0.2s ease',
  },
  dropdownHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid var(--border-primary)',
  },
  markAllBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-primary)',
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  notifItem: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border-primary)',
    cursor: 'pointer',
    transition: 'background 150ms',
  },
  notifUnread: { background: 'rgba(99, 102, 241, 0.05)', borderLeft: '3px solid var(--accent-primary)' },
  notifTitle: { fontSize: '0.82rem', fontWeight: 600, marginBottom: 2 },
  notifMsg: { fontSize: '0.78rem', color: 'var(--text-muted)' },
  notifTime: { fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 },
  emptyNotif: { padding: '30px 16px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' },
  dropdownFooter: { padding: '10px 16px', borderTop: '1px solid var(--border-primary)' },
  viewAllBtn: {
    width: '100%',
    background: 'none',
    border: 'none',
    color: 'var(--accent-primary)',
    fontSize: '0.82rem',
    fontWeight: 500,
    cursor: 'pointer',
    padding: '6px',
    fontFamily: 'inherit',
  },
  userBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 8px 4px 4px',
    background: 'var(--bg-glass)',
    border: '1px solid var(--border-primary)',
    borderRadius: 50,
    cursor: 'pointer',
    transition: 'all 150ms',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
  },
  userName: { fontSize: '0.82rem', fontWeight: 500, marginRight: 4 },
  userInfo: { padding: '14px 16px' },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '10px 16px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'background 150ms',
    fontFamily: 'inherit',
    textAlign: 'left',
  },
  content: { flex: 1, padding: '24px', overflowY: 'auto' },
};
