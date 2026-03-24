import Layout from '../components/Layout';
import { 
  Package, 
  AlertTriangle, 
  Truck, 
  Wallet, 
  Trash2, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers,
  Clock,
  ChevronRight,
  Search,
  ArrowRight
} from 'lucide-react';
import './DashboardPage.css';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const DashboardPage = () => {
  const { admin } = useAuthStore();
  const navigate = useNavigate();

  const metrics = [
    { 
      label: 'Inventory Value', 
      value: '42,450.850', 
      unit: 'KWD', 
      icon: <Layers size={24} />, 
      color: '#004d40', 
      trend: '+2.4%', 
      isUp: true 
    },
    { 
      label: 'Active Orders', 
      value: '142', 
      unit: 'Today', 
      icon: <Truck size={24} />, 
      color: '#1565c0', 
      trend: '+12%', 
      isUp: true 
    },
    { 
      label: 'Daily Revenue', 
      value: '3,120.400', 
      unit: 'KWD', 
      icon: <Wallet size={24} />, 
      color: '#6a1b9a', 
      trend: '+18.2%', 
      isUp: true 
    },
    { 
      label: 'System Waste', 
      value: '1.24', 
      unit: '%', 
      icon: <Trash2 size={24} />, 
      color: '#d32f2f', 
      trend: '-0.5%', 
      isUp: false 
    },
  ];

  const topItems = [
    { name: 'Fresh Tomato (Local)', sku: 'VEG-001', stock: '840.000', unit: 'kg', status: 'In Stock', type: 'high' },
    { name: 'Chicken Breast', sku: 'MET-042', stock: '12.250', unit: 'kg', status: 'Low Stock', type: 'low' },
    { name: 'Vegetable Oil', sku: 'GRC-088', stock: '45.000', unit: 'L', status: 'In Stock', type: 'high' },
    { name: 'Arabic Bread', sku: 'BAK-009', stock: '5.000', unit: 'pkt', status: 'Critical', type: 'low' },
  ];

  return (
    <Layout title="Operations Hub">
      <div className="dashboard-wrapper">
        
        {/* Modern Header */}
        <div className="dashboard-header-section">
          <div className="welcome-msg">
            <h2>Marhaba, {admin?.firstName || admin?.username}</h2>
            <p>Your inventory ecosystem is performing optimally.</p>
          </div>
          <div className="quick-actions">
            <div className="search-bar" style={{marginRight: '1rem'}}>
              <Search size={18} />
              <input type="text" placeholder="Quick SKU search..." />
            </div>
            <button className="btn-action primary">
              <Plus size={18} />
              Stock In
            </button>
          </div>
        </div>

        {/* Glossy Metric Cards */}
        <div className="metrics-grid">
          {metrics.map((m, i) => (
            <div key={i} className="metric-card" style={{ '--metric-color': m.color, '--metric-color-alpha': `${m.color}15` } as any}>
              <div className="metric-icon-box">
                {m.icon}
              </div>
              <div className="metric-info">
                <h4>{m.label}</h4>
                <div className="metric-main">
                  <span className="metric-value">{m.value}</span>
                  <span className="metric-unit">{m.unit}</span>
                </div>
              </div>
              <div className={`metric-trend ${m.isUp ? 'trend-up' : 'trend-down'}`}>
                {m.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {m.trend}
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Card Layout */}
        <div className="dashboard-content-grid">
          
          {/* Product Tiles Section */}
          <div className="card-panel">
            <div className="panel-header">
              <h3>Priority Inventory Tiles</h3>
              <button className="btn-action" onClick={() => navigate('/inventory')}>View Full Inventory <ChevronRight size={14} /></button>
            </div>
            
            <div className="product-card-grid">
              {topItems.map((item, i) => (
                <div key={i} className="product-card">
                  <div className="product-card-header">
                    <div className="product-icon">{item.name[0]}</div>
                    <div className={`product-status-dot dot-${item.type}`}></div>
                  </div>
                  <div className="product-card-body">
                    <h5>{item.name}</h5>
                    <p>SKU: {item.sku}</p>
                  </div>
                  <div className="product-card-footer">
                    <div>
                      <span className="stock-label">Current Stock</span>
                      <span className="stock-pill">{item.stock} {item.unit}</span>
                    </div>
                    <ArrowRight size={16} color="var(--gray-500)" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts & Notifications Section */}
          <div className="alerts-panel">
            <div className="card-panel" style={{height: '100%'}}>
              <div className="panel-header">
                <h3>System Pulse</h3>
                <span className="badge" style={{position: 'static', background: 'var(--accent)', color: 'var(--primary)'}}>3 Alerts</span>
              </div>
              
              <div className="alert-card-grid">
                <div className="notification-card" style={{borderLeft: '5px solid #f43f5e'}}>
                  <div className="alert-icon" style={{color: '#f43f5e'}}><AlertTriangle size={20} /></div>
                  <div className="alert-info">
                    <h6>Stock Out Imminent</h6>
                    <p>SKU BAK-009 is below safe buffer. Reorder now.</p>
                  </div>
                </div>

                <div className="notification-card" style={{borderLeft: '5px solid #fbbf24'}}>
                  <div className="alert-icon" style={{color: '#fbbf24'}}><Clock size={20} /></div>
                  <div className="alert-info">
                    <h6>Expiry Warning</h6>
                    <p>Batch #MET-42 Poultry nearing end of life.</p>
                  </div>
                </div>

                <div className="notification-card" style={{borderLeft: '5px solid var(--primary-light)'}}>
                  <div className="alert-icon" style={{color: 'var(--primary-light)'}}><Package size={20} /></div>
                  <div className="alert-info">
                    <h6>New Batch Inbound</h6>
                    <p>Supplier "Agro-Fresh" is 20m away from Basement A.</p>
                  </div>
                </div>
              </div>

              <button className="btn-action" style={{width: '100%', marginTop: '1.5rem', justifyContent: 'center'}}>
                Clear All Notifications
              </button>
            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
};

export default DashboardPage;
