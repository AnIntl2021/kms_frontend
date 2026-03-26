import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { 
  Truck, 
  Wallet, 
  Trash2, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Layers,
  ChevronRight,
  Search,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import './DashboardPage.css';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const DashboardPage = () => {
  const { admin } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    inventoryValue: 0,
    activeOrders: 0,
    dailyRevenue: 0,
    wastePercentage: 0,
    lowStockItems: [] as any[]
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetching multiple stats in parallel
      const [invRes, salesRes, wasteRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/sales'),
        api.get('/wastage')
      ]);

      const inventory = invRes.data.data || [];
      const sales = salesRes.data.data || [];
      const wastage = wasteRes.data.data || [];

      const totalInvValue = inventory.reduce((acc: number, curr: any) => acc + (Number(curr.current_stock) * Number(curr.cost_price)), 0);
      const todaySales = sales.filter((s: any) => s.order_date.includes(new Date().toISOString().split('T')[0]));
      const revenueToday = todaySales.reduce((acc: number, curr: any) => acc + Number(curr.total_amount), 0);
      const activeOrders = sales.filter((s: any) => s.dispatch_status === 'pending' || s.dispatch_status === 'dispatched').length;
      
      const totalWasteValue = wastage.reduce((acc: number, curr: any) => acc + Number(curr.total_wasted_value), 0);
      const lowStock = inventory.filter((i: any) => Number(i.current_stock) <= Number(i.min_stock_level)).slice(0, 4);

      setData({
        inventoryValue: totalInvValue,
        activeOrders: activeOrders,
        dailyRevenue: revenueToday,
        wastePercentage: totalInvValue > 0 ? (totalWasteValue / totalInvValue) * 100 : 0,
        lowStockItems: lowStock
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    { 
      label: 'Inventory Value', 
      value: data.inventoryValue.toFixed(3), 
      unit: 'KWD', 
      icon: <Layers size={24} />, 
      color: '#004d40', 
      trend: 'Real-time', 
      isUp: true 
    },
    { 
      label: 'Active Orders', 
      value: String(data.activeOrders), 
      unit: 'Dispatch', 
      icon: <Truck size={24} />, 
      color: '#1565c0', 
      trend: 'Live', 
      isUp: true 
    },
    { 
      label: 'Daily Revenue', 
      value: data.dailyRevenue.toFixed(3), 
      unit: 'KWD', 
      icon: <Wallet size={24} />, 
      color: '#6a1b9a', 
      trend: 'Today', 
      isUp: true 
    },
    { 
      label: 'System Waste', 
      value: data.wastePercentage.toFixed(2), 
      unit: '%', 
      icon: <Trash2 size={24} />, 
      color: '#d32f2f', 
      trend: 'Audit', 
      isUp: false 
    },
  ];

  return (
    <Layout title="Operations Hub">
      <div className="dashboard-wrapper">
        
        <div className="dashboard-header-section">
          <div className="welcome-msg">
            <h2>مرحبا, {admin?.firstName || admin?.username}</h2>
            <p>Your real-time operations overview at a glance.</p>
          </div>
          <div className="quick-actions">
            <button className="btn-action primary" onClick={() => navigate('/inventory')}>
              <Plus size={18} />
              Stock In
            </button>
          </div>
        </div>

        <div className="metrics-grid">
          {metrics.map((m, i) => (
            <div key={i} className="metric-card" style={{ '--metric-color': m.color, '--metric-color-alpha': `${m.color}15` } as any}>
              <div className="metric-icon-box">
                {m.icon}
              </div>
              <div className="metric-info">
                <h4>{m.label}</h4>
                <div className="metric-main">
                  <span className="metric-value">{loading ? '...' : m.value}</span>
                  <span className="metric-unit">{m.unit}</span>
                </div>
              </div>
              <div className={`metric-trend ${m.isUp ? 'trend-up' : 'trend-down'}`}>
                {m.trend}
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-content-grid">
          <div className="card-panel">
            <div className="panel-header">
              <h3>Low Stock Alerts</h3>
              <button className="btn-action" onClick={() => navigate('/inventory')}>View Full Inventory <ChevronRight size={14} /></button>
            </div>
            
            <div className="product-card-grid">
              {data.lowStockItems.length > 0 ? data.lowStockItems.map((item, i) => (
                <div key={i} className="product-card" style={{borderLeft: '4px solid #ef4444'}}>
                  <div className="product-card-header">
                    <div className="product-icon" style={{background: '#fee2e2', color: '#dc2626'}}>{item.name_en[0]}</div>
                    <div className="product-status-dot dot-critical" style={{background: '#ef4444'}}></div>
                  </div>
                  <div className="product-card-body">
                    <h5>{item.name_en}</h5>
                    <p>SKU: {item.sku}</p>
                  </div>
                  <div className="product-card-footer">
                    <div>
                      <span className="stock-label">Stock Level</span>
                      <span className="stock-pill" style={{background: '#fee2e2', color: '#991b1b'}}>{item.current_stock} {item.unit_en}</span>
                    </div>
                    <ArrowRight size={16} color="#dc2626" />
                  </div>
                </div>
              )) : (
                <div className="empty-state-text" style={{padding: '2rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <CheckCircle size={20} /> All stock levels are healthy!
                </div>
              )}
            </div>
          </div>

          <div className="alerts-panel">
            <div className="card-panel" style={{height: '100%', background: '#f8fafc'}}>
              <div className="panel-header">
                <h3>Operational Pulse</h3>
                <span className="badge" style={{position: 'static', background: 'var(--primary)', color: 'white'}}>{data.activeOrders} Orders Live</span>
              </div>
              
              <div className="alert-card-grid" style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
                 {data.activeOrders > 0 ? (
                    <div style={{background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '1rem', alignItems: 'center'}}>
                       <Truck color="var(--primary)" />
                       <div>
                          <p style={{fontSize: '13px', margin: 0, fontWeight: 700}}>Dispatch Required</p>
                          <p style={{fontSize: '11px', margin: 0, color: '#64748b'}}>{data.activeOrders} orders are currently in the dispatch queue.</p>
                       </div>
                    </div>
                 ) : (
                    <div className="empty-state-text" style={{padding: '1rem', color: '#64748b', fontSize: '0.9rem'}}>
                       No pending dispatches at this moment.
                    </div>
                 )}
                 
                 {data.wastePercentage > 5 && (
                    <div style={{background: '#fff7ed', padding: '1rem', borderRadius: '12px', border: '1px solid #ffedd5', display: 'flex', gap: '1rem', alignItems: 'center'}}>
                       <AlertCircle color="#ea580c" />
                       <div>
                          <p style={{fontSize: '13px', margin: 0, fontWeight: 700, color: '#9a3412'}}>High Waste Warning</p>
                          <p style={{fontSize: '11px', margin: 0, color: '#c2410c'}}>Wastage is currently {data.wastePercentage.toFixed(1)}% of inventory value.</p>
                       </div>
                    </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Simple inline component for the check icon since I removed it from lucide-react imports earlier but I can just use it here
const CheckCircle = ({size}: {size: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

export default DashboardPage;
