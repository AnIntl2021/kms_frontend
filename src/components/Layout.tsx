import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  LayoutDashboard, 
  Package, 
  Utensils, 
  AlertTriangle, 
  Truck, 
  Wallet, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X, 
  Search, 
  Bell,
  Settings,
  FolderTree,
  Store,
  ShoppingCart,
  Zap,
  BarChart2,
  FileText,
  Users
} from 'lucide-react';
import './Layout.css';
import logo from '../assets/logo.jpeg';
import api from '../api/axios';
import { useLanguage } from '../hooks/useLanguage';
import AIAssistant from './AIAssistant';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { admin, logout } = useAuthStore();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) setNotifications(res.data.data);
    } catch (e) {
      console.warn("Silent notification fetch fail - likely unauthorized or network dip.");
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.filter(n => n.notification_id !== id));
    } catch (e) {
      console.error("Failed to mark as read");
    }
  };

  const clearAllNotifs = async () => {
    try {
      await api.post('/notifications/clear-all');
      setNotifications([]);
      setNotifOpen(false);
    } catch (e) {
      console.error("Failed to clear all");
    }
  };

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, [logout]);

  const navItems = [
    { name: t('dashboard'), path: '/dashboard', icon: <LayoutDashboard size={20} />, section: 'Main' },
    { name: t('inventory_stock'), path: '/inventory', icon: <Package size={20} />, section: 'Main' },
    { name: t('categories'), path: '/categories', icon: <FolderTree size={20} />, section: 'Main' },
    { name: t('menu_premix'), path: '/menu', icon: <Utensils size={20} />, section: 'Main' },
    { name: t('wastage_expiry'), path: '/wastage', icon: <AlertTriangle size={20} />, section: 'Main' },
    { name: t('vendors_clients'), path: '/vendors', icon: <Store size={20} />, section: 'Operations' },
    { name: t('purchase_orders'), path: '/purchases', icon: <ShoppingCart size={20} />, section: 'Operations' },
    { name: t('production_distribution'), path: '/factory-dispatch', icon: <Zap size={20} />, section: 'Operations' },
    { name: t('direct_sales'), path: '/sales', icon: <Truck size={20} />, section: 'Operations' },
    { name: t('analytics_forecasts'), path: '/analytics', icon: <BarChart2 size={20} />, section: 'Operations' },
    { name: t('reports_bi'), path: '/reports', icon: <FileText size={20} />, section: 'Operations' },
    { name: t('accounts'), path: '/accounts', icon: <Wallet size={20} />, section: 'Operations' },
    { name: t('sales_team'), path: '/salesmen', icon: <Users size={20} />, section: 'Operations' },
    { name: t('administration'), path: '/administration', icon: <ShieldCheck size={20} />, section: 'Admin' },
    { name: t('settings'), path: '/settings', icon: <Settings size={20} />, section: 'Admin' },
  ];

  const getRoleDisplayName = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className={`app-container ${collapsed ? 'sidebar-collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-logo-small">
            <img src={logo} alt="L" />
          </div>
          <div className="brand-info">
            <span className="brand-name">Fresh 'n' Fast</span>
            <span className="brand-sub">ERP ELITE</span>
          </div>
          <button className="mobile-close" onClick={() => setMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {['Main', 'Operations', 'Admin'].map((section) => (
            <div key={section} className="nav-section">
              <div className="section-label">{t(section.toLowerCase())}</div>
              {navItems.filter(item => item.section === section).map((item) => (
                <Link 
                  key={item.name} 
                  to={item.path}
                  className={`nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.name}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-meta">
            <div className="user-avatar">{(admin?.username?.[0] || 'A').toUpperCase()}</div>
            <div className="user-details">
              <div className="user-name">{admin?.firstName || admin?.username || 'Admin'}</div>
              <div className="user-role">{getRoleDisplayName(admin?.role || 'staff')}</div>
            </div>
            <button className="logout-btn" onClick={logout} title={t('logout')}>
              <LogOut size={18} />
            </button>
          </div>
          <div className="powered-by">
            {t('powered_by')} <b>An International</b>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
              <Menu size={24} />
            </button>
            <button className="mobile-toggle" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <h1 className="page-title">{title}</h1>
          </div>

          <div className="topbar-right">
            <button 
              className="lang-toggle" 
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              style={{
                background: 'rgba(1, 86, 44, 0.1)',
                color: 'var(--primary)',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                marginRight: isRTL ? '0' : '15px',
                marginLeft: isRTL ? '15px' : '0'
              }}
            >
              {language === 'en' ? 'العربية' : 'English'}
            </button>

            <div className="search-bar">
              <Search size={18} />
              <input type="text" placeholder={t('search_operations')} />
            </div>
            
            {/* 🔔 DYNAMIC NOTIFICATION HUB */}
            <div className="notification-wrapper" style={{ position: 'relative' }}>
              <div 
                className="icon-btn notification" 
                onClick={() => setNotifOpen(!notifOpen)}
                style={{ cursor: 'pointer' }}
              >
                <Bell size={20} />
                {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
              </div>

              {notifOpen && (
                <div className="notif-dropdown" style={{ position: 'absolute', top: '100%', right: 0, width: '300px', background: 'white', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1000, marginTop: '10px', padding: '10px', border: '1px solid #eee' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee', marginBottom: '10px' }}>
                      <strong style={{ fontSize: '14px' }}>{t('notifications')}</strong>
                      <button onClick={clearAllNotifs} style={{ border: 'none', background: 'none', color: 'var(--primary)', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}>{t('clear_all')}</button>
                   </div>
                   <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>{t('no_new_alerts')}</div>
                      ) : notifications.map((n: any) => (
                        <div 
                          key={n.notification_id} 
                          onClick={() => markAsRead(n.notification_id)}
                          style={{ padding: '12px', borderBottom: '1px solid #f8fafc', fontSize: '12px', cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                           <div style={{ fontWeight: 600, marginBottom: '4px', color: n.type === 'danger' || n.type === 'warning' ? '#ef4444' : '#334155' }}>
                              {n.message}
                           </div>
                           <div style={{ fontSize: '10px', color: '#94a3b8' }}>{new Date(n.created_at).toLocaleString()}</div>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>

            <div className="user-initial" onClick={logout} title={t('logout')}>
              {(admin?.username?.[0] || 'A').toUpperCase()}
            </div>
          </div>
        </header>

        <section className="page-body">
          {children}
        </section>
      </main>
      <AIAssistant />
    </div>
  );
};

export default Layout;
