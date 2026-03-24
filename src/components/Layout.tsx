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
  ShoppingCart
} from 'lucide-react';
import './Layout.css';
import logo from '../assets/logo.jpg';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { admin, logout } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, [logout]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, section: 'Main' },
    { name: 'Inventory & Stock', path: '/inventory', icon: <Package size={20} />, section: 'Main' },
    { name: 'Categories', path: '/categories', icon: <FolderTree size={20} />, section: 'Main' },
    { name: 'Menu & Premix', path: '/menu', icon: <Utensils size={20} />, section: 'Main' },
    { name: 'Wastage & Expiry', path: '/wastage', icon: <AlertTriangle size={20} />, section: 'Main' },
    { name: 'Vendors', path: '/vendors', icon: <Store size={20} />, section: 'Operations' },
    { name: 'Purchase Orders', path: '/purchases', icon: <ShoppingCart size={20} />, section: 'Operations' },
    { name: 'Sales & Dispatch', path: '/sales', icon: <Truck size={20} />, section: 'Operations' },
    { name: 'Accounts', path: '/accounts', icon: <Wallet size={20} />, section: 'Operations' },
    { name: 'Administration', path: '/administration', icon: <ShieldCheck size={20} />, section: 'Admin' },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} />, section: 'Admin' },
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
              <div className="section-label">{section}</div>
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
            <div className="user-avatar">{admin?.username?.[0].toUpperCase()}</div>
            <div className="user-details">
              <div className="user-name">{admin?.firstName || admin?.username}</div>
              <div className="user-role">{getRoleDisplayName(admin?.role || '')}</div>
            </div>
            <button className="logout-btn" onClick={logout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
          <div className="powered-by">
            Powered by <b>An International</b>
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
            <div className="search-bar">
              <Search size={18} />
              <input type="text" placeholder="Search operations..." />
            </div>
            <div className="icon-btn notification">
              <Bell size={20} />
              <span className="badge">3</span>
            </div>
            <div className="user-initial" onClick={logout} title="Logout">
              {admin?.username?.[0].toUpperCase()}
            </div>
          </div>
        </header>

        <section className="page-body">
          {children}
        </section>
      </main>
    </div>
  );
};

export default Layout;
