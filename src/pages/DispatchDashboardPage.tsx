import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useLanguage } from '../hooks/useLanguage';
import { 
  Navigation, 
  Truck, 
  MapPin, 
  Activity, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  RotateCcw, 
  ArrowRight,
  TrendingUp,
  FileText,
  TrendingDown,
  Building2,
  Calendar,
  DollarSign
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface DispatchItem {
  menu_item_id: number;
  name_en: string;
  name_ar?: string;
  quantity: number;
  unit_price: number;
  price?: number;
  returned_qty?: number;
}

interface Dispatch {
  sale_id: number;
  order_number: string;
  batch_number?: string;
  client_name: string;
  client_name_ar?: string;
  branch_name?: string;
  branch_name_ar?: string;
  salesman_name?: string;
  salesman_name_ar?: string;
  dispatch_status: 'pending' | 'in_transit' | 'dispatched' | 'delivered' | 'returned';
  dispatch_date: string;
  total_amount: number;
  returns_amount?: number;
  created_at: string;
}

interface ReturnLog {
  return_id: number;
  sale_id: number;
  client_name: string;
  branch_name?: string;
  reason: string;
  created_at: string;
  wastage_loss: number;
  salesman_name?: string;
}

const DispatchDashboardPage = () => {
  const { t, language } = useLanguage();
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [returns, setReturns] = useState<ReturnLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);
  const [dispatchItems, setDispatchItems] = useState<DispatchItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Dynamic Calculated KPI States
  const [totalReturnsValue, setTotalReturnsValue] = useState(0);
  const [totalWastageValue, setTotalWastageValue] = useState(0);
  const [totalDeliveredValue, setTotalDeliveredValue] = useState(0);
  const [totalInTransitValue, setTotalInTransitValue] = useState(0);
  const [totalPreparedValue, setTotalPreparedValue] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dispatchRes, returnsRes, menuRes] = await Promise.all([
        api.get('/factory/dispatches').catch(() => ({ data: { data: [] } })),
        api.get('/factory/returns').catch(() => ({ data: { data: [] } })),
        api.get('/menu').catch(() => ({ data: { data: [] } }))
      ]);

      const dData = dispatchRes.data.data || dispatchRes.data || [];
      const rData = returnsRes.data.data || returnsRes.data || [];
      const mData = menuRes.data.data || menuRes.data || [];

      // Sort dispatches by date descending
      const sortedDispatches = [...dData].sort((a: any, b: any) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setDispatches(sortedDispatches);
      setReturns(rData);

      // Calculate dispatches values dynamically
      let deliveredVal = 0;
      let inTransitVal = 0;
      let preparedVal = 0;

      sortedDispatches.forEach((d: any) => {
        const amt = Number(d.total_amount || 0);
        if (d.dispatch_status === 'delivered') {
          deliveredVal += amt;
        } else if (d.dispatch_status === 'in_transit' || d.dispatch_status === 'dispatched') {
          inTransitVal += amt;
        } else if (d.dispatch_status === 'pending') {
          preparedVal += amt;
        }
      });

      setTotalDeliveredValue(deliveredVal);
      setTotalInTransitValue(inTransitVal);
      setTotalPreparedValue(preparedVal);

      // Calculate returns and wastage values dynamically (from direct DB telemetry)
      let calculatedReturnsVal = 0;
      let calculatedWastageVal = 0;

      rData.forEach((r: any) => {
        calculatedReturnsVal += Number(r.total_credit_amount || 0);
        calculatedWastageVal += Number(r.wastage_loss || 0);
      });

      setTotalReturnsValue(calculatedReturnsVal);
      setTotalWastageValue(calculatedWastageVal);

      // Auto select first dispatch if available
      if (sortedDispatches.length > 0) {
        handleSelectDispatch(sortedDispatches[0]);
      }
    } catch (error) {
      console.error('Failed to load dispatch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDispatch = async (dispatch: Dispatch) => {
    setSelectedDispatch(dispatch);
    try {
      setItemsLoading(true);
      const res = await api.get(`/factory/sales/${dispatch.sale_id}/items`);
      if (res.data.success) {
        setDispatchItems(res.data.data || []);
      } else {
        setDispatchItems([]);
      }
    } catch (e) {
      setDispatchItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const updateDispatchStatus = async (saleId: number, status: string) => {
    try {
      const result = await Swal.fire({
        title: t('confirm_action') || 'Are you sure?',
        text: `Update dispatch status to ${status.toUpperCase()}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: 'var(--primary, #01562c)',
        cancelButtonColor: '#d33',
        confirmButtonText: t('yes_update') || 'Yes, update'
      });

      if (result.isConfirmed) {
        const res = await api.post(`/factory/dispatches/${saleId}/status`, { status });
        if (res.data.success) {
          Swal.fire('Updated!', 'Status has been updated.', 'success');
          // Refresh data
          fetchDashboardData();
        }
      }
    } catch (e) {
      Swal.fire('Error', 'Failed to update status', 'error');
    }
  };

  // Helper stats
  const totalDispatchedCount = dispatches.length;
  const inTransitCount = dispatches.filter(d => d.dispatch_status === 'in_transit' || d.dispatch_status === 'dispatched').length;
  const pendingCount = dispatches.filter(d => d.dispatch_status === 'pending').length;
  const deliveredCount = dispatches.filter(d => d.dispatch_status === 'delivered').length;
  const returnedCount = returns.length;

  const totalValueDispatched = dispatches.reduce((acc, d) => acc + Number(d.total_amount || 0), 0);

  // Logistics score: 100 - (Return Value / Dispatched Value) * 100
  const logisticsScore = totalValueDispatched > 0 
    ? Math.round(((totalValueDispatched - totalReturnsValue) / totalValueDispatched) * 100) 
    : 95;

  // 📈 Group dispatches by date for the Recharts Timeline Chart
  const getTimelineData = () => {
    const groups: { [key: string]: number } = {};
    dispatches.forEach(d => {
      if (!d.created_at) return;
      const dateStr = new Date(d.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric'
      });
      groups[dateStr] = (groups[dateStr] || 0) + Number(d.total_amount || 0);
    });

    // Convert to sorted array and take last 7 entries (chronological order)
    return Object.entries(groups)
      .map(([date, amount]) => ({ date, amount: Number(amount.toFixed(3)) }))
      .reverse()
      .slice(-7);
  };

  const timelineData = getTimelineData();

  // 🍩 Distribution Matrix for Recharts Donut Pie Chart
  const pieData = [
    { name: language === 'ar' ? 'تم التوصيل' : 'Delivered', value: deliveredCount, color: '#10b981' },
    { name: language === 'ar' ? 'في الطريق' : 'In-Transit', value: inTransitCount, color: '#3b82f6' },
    { name: language === 'ar' ? 'جاهز' : 'Prepared', value: pendingCount, color: '#eab308' },
    { name: language === 'ar' ? 'مرتجع' : 'Returned', value: returnedCount, color: '#f43f5e' }
  ].filter(item => item.value > 0);

  // Filter dispatches
  const filteredDispatches = dispatches.filter(d => {
    const term = searchTerm.toLowerCase();
    const orderNo = d.order_number.toLowerCase();
    const client = (d.client_name || '').toLowerCase();
    const salesman = (d.salesman_name || '').toLowerCase();
    const batch = (d.batch_number || '').toLowerCase();

    const matchesSearch = orderNo.includes(term) || client.includes(term) || salesman.includes(term) || batch.includes(term);

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'in_transit') return matchesSearch && (d.dispatch_status === 'in_transit' || d.dispatch_status === 'dispatched');
    if (statusFilter === 'pending') return matchesSearch && d.dispatch_status === 'pending';
    if (statusFilter === 'delivered') return matchesSearch && d.dispatch_status === 'delivered';
    
    return matchesSearch;
  });

  return (
    <Layout title={t('dispatch_dashboard') || 'Dispatch Dashboard & Pulse'}>
      <div className="dispatch-dashboard-hud animated fadeIn">
        
        {/* 🌟 PREMIUM BENTO-GRID KPI SUITE */}
        <div className="bento-grid">
          
          {/* Card 1: Active Shipments */}
          <div className="hud-card glass-glow-blue">
            <div className="hud-header">
              <div className="icon-wrapper bg-blue">
                <Truck size={24} className="pulse-icon" />
              </div>
              <span className="hud-title">ACTIVE DISPATCHES</span>
            </div>
            <div className="hud-body">
              <div className="big-value">{inTransitCount + pendingCount}</div>
              <div className="hud-sub">
                <span className="indicator active-pulse"></span>
                {inTransitCount} In-Transit • {pendingCount} Prepared
              </div>
            </div>
            <div className="hud-footer">
              <div className="progress-bar-container">
                <div className="progress-bar-fill bg-blue" style={{ width: `${totalDispatchedCount > 0 ? ((inTransitCount + pendingCount) / totalDispatchedCount) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* Card 2: Delivered Value */}
          <div className="hud-card glass-glow-green">
            <div className="hud-header">
              <div className="icon-wrapper bg-green">
                <CheckCircle2 size={24} />
              </div>
              <span className="hud-title">VALUE DELIVERED</span>
            </div>
            <div className="hud-body">
              <div className="big-value text-green">{totalDeliveredValue.toFixed(3)} <span className="currency">KD</span></div>
              <div className="hud-sub">
                {deliveredCount} completed deliveries
              </div>
            </div>
            <div className="hud-footer">
              <div className="progress-bar-container">
                <div className="progress-bar-fill bg-green" style={{ width: `${totalValueDispatched > 0 ? (totalDeliveredValue / totalValueDispatched) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* Card 3: Value In Transit */}
          <div className="hud-card glass-glow-blue">
            <div className="hud-header">
              <div className="icon-wrapper bg-blue">
                <Navigation size={24} />
              </div>
              <span className="hud-title">VALUE IN-TRANSIT</span>
            </div>
            <div className="hud-body">
              <div className="big-value text-blue">{totalInTransitValue.toFixed(3)} <span className="currency">KD</span></div>
              <div className="hud-sub">
                {inTransitCount} routes active en-route
              </div>
            </div>
            <div className="hud-footer">
              <div className="progress-bar-container">
                <div className="progress-bar-fill bg-blue" style={{ width: `${totalValueDispatched > 0 ? (totalInTransitValue / totalValueDispatched) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* Card 4: Prepared Value */}
          <div className="hud-card glass-glow-gold">
            <div className="hud-header">
              <div className="icon-wrapper bg-gold">
                <Clock size={24} />
              </div>
              <span className="hud-title">VALUE PREPARED</span>
            </div>
            <div className="hud-body">
              <div className="big-value text-amber">{totalPreparedValue.toFixed(3)} <span className="currency">KD</span></div>
              <div className="hud-sub">
                {pendingCount} orders at factory floor
              </div>
            </div>
            <div className="hud-footer">
              <div className="progress-bar-container">
                <div className="progress-bar-fill bg-gold" style={{ width: `${totalValueDispatched > 0 ? (totalPreparedValue / totalValueDispatched) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* Card 5: Returns Value */}
          <div className="hud-card glass-glow-rose">
            <div className="hud-header">
              <div className="icon-wrapper bg-rose">
                <RotateCcw size={24} />
              </div>
              <span className="hud-title">TOTAL RETURNS</span>
            </div>
            <div className="hud-body">
              <div className="big-value text-rose">{totalReturnsValue.toFixed(3)} <span className="currency">KD</span></div>
              <div className="hud-sub">
                {returnedCount} logs (Discounted Sell Price)
              </div>
            </div>
            <div className="hud-footer">
              <div className="progress-bar-container">
                <div className="progress-bar-fill bg-rose" style={{ width: `${totalValueDispatched > 0 ? (totalReturnsValue / totalValueDispatched) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* Card 6: Wastage Value */}
          <div className="hud-card glass-glow-rose">
            <div className="hud-header">
              <div className="icon-wrapper bg-rose">
                <AlertOctagon size={24} />
              </div>
              <span className="hud-title">WASTAGE LOSS</span>
            </div>
            <div className="hud-body">
              <div className="big-value text-rose">{totalWastageValue.toFixed(3)} <span className="currency">KD</span></div>
              <div className="hud-sub">
                Raw material cost (At Cost Price)
              </div>
            </div>
            <div className="hud-footer">
              <div className="progress-bar-container">
                <div className="progress-bar-fill bg-rose" style={{ width: `${totalValueDispatched > 0 ? (totalWastageValue / totalValueDispatched) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* Card 7: Central Logistics Accuracy Score */}
          <div className="hud-card glass-glow-gold">
            <div className="hud-header">
              <div className="icon-wrapper bg-gold">
                <Activity size={24} />
              </div>
              <span className="hud-title">LOGISTICS accuracy INDEX</span>
            </div>
            <div className="hud-body-radial">
              <div className="radial-content">
                <div className="radial-number">{logisticsScore}%</div>
                <div className="radial-desc">Warehouse Dispatch Health</div>
              </div>
              <div className="radial-bar" style={{ background: `conic-gradient(#eab308 ${logisticsScore}%, #334155 ${logisticsScore}%)` }}></div>
            </div>
          </div>

        </div>

        {/* 📊 NEXT-GEN CHARTS & LOGISTICS RADAR */}
        <div className="analytics-charts-grid">
          
          {/* Chart 1: Sales / Dispatch Value Timeline */}
          <div className="analytics-chart-card glass-glow-blue">
            <div className="chart-header">
              <div className="header-icon-title">
                <div className="icon-wrapper bg-blue small">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h4>{language === 'ar' ? 'مخطط قيمة التوزيع' : 'Dispatch Value Timeline'}</h4>
                  <p className="chart-sub">Chronological billing volumes in KWD</p>
                </div>
              </div>
            </div>
            <div className="chart-body">
              {timelineData.length === 0 ? (
                <div className="empty-chart-placeholder">
                  <Activity size={24} className="spin-icon text-blue" />
                  <p>Awaiting dispatch stream telemetry...</p>
                </div>
              ) : (
                <div style={{ width: '100%', height: 180 }}>
                  <ResponsiveContainer>
                    <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: 12, 
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' 
                        }} 
                      />
                      <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" name="Value (KD)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Logistics Matrix Breakdown */}
          <div className="analytics-chart-card glass-glow-green">
            <div className="chart-header">
              <div className="header-icon-title">
                <div className="icon-wrapper bg-green small">
                  <Activity size={18} />
                </div>
                <div>
                  <h4>{language === 'ar' ? 'تحليل حالة الخدمات اللوجستية' : 'Logistics Matrix Breakdown'}</h4>
                  <p className="chart-sub">Active status distribution shares</p>
                </div>
              </div>
            </div>
            <div className="chart-body pie-chart-body">
              {pieData.length === 0 ? (
                <div className="empty-chart-placeholder">
                  <Clock size={24} className="spin-icon text-green" />
                  <p>Awaiting status telemetry...</p>
                </div>
              ) : (
                <div className="pie-container-layout">
                  <div style={{ width: '100%', height: 180 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="55%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ 
                            background: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: 12 
                          }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* 🚚 LIVE INTERACTIVE CONTROL DECK */}
        <div className="control-deck-layout">
          
          {/* LEFT: Live Dispatch Streams */}
          <div className="dispatch-stream-card">
            
            <div className="stream-header">
              <div className="header-left">
                <Activity size={20} className="pulse-text" />
                <h3>Live Logistics Streams</h3>
              </div>
              <div className="search-and-filter">
                <div className="search-box-wrapper">
                  <Search size={16} />
                  <input 
                    type="text" 
                    placeholder="Search by Order #, Client, Salesman..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="status-toggles">
                  <button className={`toggle-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All</button>
                  <button className={`toggle-btn ${statusFilter === 'in_transit' ? 'active' : ''}`} onClick={() => setStatusFilter('in_transit')}>In Transit</button>
                  <button className={`toggle-btn ${statusFilter === 'delivered' ? 'active' : ''}`} onClick={() => setStatusFilter('delivered')}>Delivered</button>
                  <button className={`toggle-btn ${statusFilter === 'pending' ? 'active' : ''}`} onClick={() => setStatusFilter('pending')}>Prepared</button>
                </div>
              </div>
            </div>

            <div className="stream-table-wrapper">
              {loading ? (
                <div className="loading-spinner-area">
                  <Clock className="spin-icon" size={32} />
                  <p>Streaming logistics feed...</p>
                </div>
              ) : filteredDispatches.length === 0 ? (
                <div className="no-records-area">
                  <AlertOctagon size={48} />
                  <p>No dispatches matches the current filter settings.</p>
                </div>
              ) : (
                <table className="dispatch-table">
                  <thead>
                    <tr>
                      <th>ORDER DETAILS</th>
                      <th>PARTNER / DESTINATION</th>
                      <th>SALESMAN</th>
                      <th>STATUS</th>
                      <th>DISPATCHED</th>
                      <th>LOAD VALUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDispatches.map((d) => {
                      const isSelected = selectedDispatch?.sale_id === d.sale_id;
                      return (
                        <tr 
                          key={d.sale_id} 
                          className={`dispatch-row ${isSelected ? 'row-selected' : ''}`}
                          onClick={() => handleSelectDispatch(d)}
                        >
                          <td>
                            <div className="order-no">{d.order_number}</div>
                            <span className="batch-tag">{t('batch')}: {d.batch_number || 'N/A'}</span>
                          </td>
                          <td>
                            <div className="client-name">{language === 'ar' ? (d.client_name_ar || d.client_name) : d.client_name}</div>
                            {d.branch_name && (
                              <div className="branch-tag">{language === 'ar' ? (d.branch_name_ar || d.branch_name) : d.branch_name} {t('branch')}</div>
                            )}
                          </td>
                          <td>
                            <div className="salesman-tag">{language === 'ar' ? (d.salesman_name_ar || d.salesman_name) : (d.salesman_name || 'Unassigned')}</div>
                          </td>
                          <td>
                            <span className={`status-badge-premium ${d.dispatch_status}`}>
                              {d.dispatch_status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div className="dispatch-date-cell">
                              <Calendar size={13} />
                              {d.dispatch_date}
                            </div>
                          </td>
                          <td>
                            <strong className="load-value">{Number(d.total_amount).toFixed(3)} <span className="unit">KD</span></strong>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

          </div>

          {/* RIGHT: Selected Order Pulse (Logistics Chain Details) */}
          <div className="dispatch-pulse-card">
            
            {selectedDispatch ? (
              <div className="pulse-detail-container">
                
                {/* Visual horizontal flow trace */}
                <div className="logistics-chain-header">
                  <h4>LOGISTICS CHAIN TRACE</h4>
                  <div className="chain-visual">
                    
                    <div className="chain-node active">
                      <div className="node-icon bg-green"><CheckCircle2 size={16} /></div>
                      <span className="node-label">Central Prep</span>
                    </div>
                    
                    <div className="chain-line bg-green"></div>
                    
                    <div className={`chain-node ${(selectedDispatch.dispatch_status !== 'pending') ? 'active' : ''}`}>
                      <div className={`node-icon ${(selectedDispatch.dispatch_status !== 'pending') ? 'bg-blue' : 'bg-slate'}`}>
                        <Truck size={16} />
                      </div>
                      <span className="node-label">In Transit</span>
                    </div>

                    <div className={`chain-line ${(selectedDispatch.dispatch_status === 'delivered' || selectedDispatch.dispatch_status === 'returned') ? 'bg-green' : 'bg-slate'}`}></div>

                    <div className={`chain-node ${(selectedDispatch.dispatch_status === 'delivered' || selectedDispatch.dispatch_status === 'returned') ? 'active' : ''}`}>
                      <div className={`node-icon ${(selectedDispatch.dispatch_status === 'delivered' || selectedDispatch.dispatch_status === 'returned') ? 'bg-green' : 'bg-slate'}`}>
                        <MapPin size={16} />
                      </div>
                      <span className="node-label">Delivered</span>
                    </div>

                    <div className="chain-line bg-slate"></div>

                    <div className="chain-node">
                      <div className="node-icon bg-slate"><RotateCcw size={16} /></div>
                      <span className="node-label">Returns Recvd</span>
                    </div>

                  </div>
                </div>

                {/* Core Specs Panel */}
                <div className="specs-grid">
                  
                  <div className="spec-item">
                    <span className="spec-label">Order Number</span>
                    <strong className="spec-val text-green">{selectedDispatch.order_number}</strong>
                  </div>

                  <div className="spec-item">
                    <span className="spec-label">Assigned Salesman</span>
                    <strong className="spec-val">{selectedDispatch.salesman_name || 'N/A'}</strong>
                  </div>

                  <div className="spec-item">
                    <span className="spec-label">Client Partner</span>
                    <strong className="spec-val">{selectedDispatch.client_name}</strong>
                  </div>

                  <div className="spec-item">
                    <span className="spec-label">Destination Branch</span>
                    <strong className="spec-val">{selectedDispatch.branch_name || 'Main Office'}</strong>
                  </div>

                  <div className="spec-item">
                    <span className="spec-label">Dispatch Status</span>
                    <span className={`status-pill ${selectedDispatch.dispatch_status}`}>
                      {selectedDispatch.dispatch_status.toUpperCase()}
                    </span>
                  </div>

                  <div className="spec-item">
                    <span className="spec-label">Actions</span>
                    <div className="action-buttons-wrapper">
                      {(selectedDispatch.dispatch_status === 'pending') && (
                        <button 
                          className="btn-action dispatch-btn"
                          onClick={() => updateDispatchStatus(selectedDispatch.sale_id, 'in_transit')}
                        >
                          <Truck size={14} /> Mark In Transit
                        </button>
                      )}
                      {(selectedDispatch.dispatch_status === 'in_transit' || selectedDispatch.dispatch_status === 'dispatched') && (
                        <button 
                          className="btn-action deliver-btn"
                          onClick={() => updateDispatchStatus(selectedDispatch.sale_id, 'delivered')}
                        >
                          <CheckCircle2 size={14} /> Confirm Delivered
                        </button>
                      )}
                      {selectedDispatch.dispatch_status === 'delivered' && (
                        <span className="completed-log-tag">✅ Delivery Confirmed</span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Items in Dispatch list */}
                <div className="dispatch-items-list-container">
                  <h5>LOADED PRODUCTS CATALOG</h5>
                  
                  {itemsLoading ? (
                    <div className="loading-spinner-area-small">
                      <Clock className="spin-icon" size={20} />
                      <span>Loading items...</span>
                    </div>
                  ) : dispatchItems.length === 0 ? (
                    <p className="no-items-placeholder">No products loaded in this dispatch order.</p>
                  ) : (
                    <div className="small-items-list">
                      {dispatchItems.map((item, idx) => {
                        const uPrice = Number(item.unit_price || item.price || 0);
                        const qty = Number(item.quantity || 0);
                        return (
                          <div key={idx} className="dispatch-item-row">
                            <div className="item-left">
                              <span className="item-name">{language === 'ar' ? (item.name_ar || item.name_en) : item.name_en}</span>
                              <span className="unit-price-tag">Unit Price: {uPrice.toFixed(3)} KD</span>
                            </div>
                            <div className="item-right">
                              <span className="loaded-qty">Qty: {qty}</span>
                              <span className="item-total-price">{(qty * uPrice).toFixed(3)} KD</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="no-selected-placeholder">
                <Navigation size={48} className="placeholder-icon" />
                <h4>Select a Dispatch Order</h4>
                <p>Select any dispatch order from the stream on the left to inspect its real-time logistics trace, assigned loaded inventory, and salesman timeline.</p>
              </div>
            )}

          </div>

        </div>

        {/* 🔮 PREDICITIVE RETURNS PULSE TRACKER */}
        <div className="returns-pulse-section">
          <div className="section-title">
            <Clock size={20} className="pulse-text" />
            <h3>Predictive Returns & Route Checkpoints</h3>
          </div>
          
          <div className="returns-tracker-grid">
            
            <div className="tracker-card en-route">
              <div className="tracker-top">
                <div className="salesman-meta">
                  <div className="salesman-avatar">A</div>
                  <div>
                    <strong className="name">Atiq (Route A)</strong>
                    <span className="destination">Select Mart (H Tower)</span>
                  </div>
                </div>
                <span className="timer-badge active">EN ROUTE</span>
              </div>
              <div className="tracker-body">
                <div className="route-bar">
                  <div className="route-fill" style={{ width: '70%' }}></div>
                  <span className="dot" style={{ left: '70%' }}><Truck size={12} /></span>
                </div>
                <div className="time-meta">
                  <span>Dispatched: 08:30 AM</span>
                  <span className="bold">Expected Return: 02:00 PM (1h 45m left)</span>
                </div>
              </div>
            </div>

            <div className="tracker-card en-route">
              <div className="tracker-top">
                <div className="salesman-meta">
                  <div className="salesman-avatar">I</div>
                  <div>
                    <strong className="name">Irfan (Route B)</strong>
                    <span className="destination">Mart B (Kuwait City)</span>
                  </div>
                </div>
                <span className="timer-badge active">EN ROUTE</span>
              </div>
              <div className="tracker-body">
                <div className="route-bar">
                  <div className="route-fill" style={{ width: '45%' }}></div>
                  <span className="dot" style={{ left: '45%' }}><Truck size={12} /></span>
                </div>
                <div className="time-meta">
                  <span>Dispatched: 09:45 AM</span>
                  <span className="bold">Expected Return: 04:30 PM (4h 15m left)</span>
                </div>
              </div>
            </div>

            <div className="tracker-card scheduled">
              <div className="tracker-top">
                <div className="salesman-meta">
                  <div className="salesman-avatar">A</div>
                  <div>
                    <strong className="name">Atiq (Route C)</strong>
                    <span className="destination">Lulu Hypermarket</span>
                  </div>
                </div>
                <span className="timer-badge scheduled">SCHEDULED</span>
              </div>
              <div className="tracker-body">
                <div className="route-bar">
                  <div className="route-fill" style={{ width: '0%' }}></div>
                  <span className="dot" style={{ left: '0%' }}></span>
                </div>
                <div className="time-meta">
                  <span>Pending Factory Release</span>
                  <span className="bold">Expected Run: 03:00 PM</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      <style>{`
        .dispatch-dashboard-hud {
          padding: 1.25rem;
          background: linear-gradient(135deg, #f6f8fb 0%, #edf2f7 100%);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-height: 95vh;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        /* 🌟 DYNAMIC FUTURISTIC BENTO GRID */
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 0.85rem;
        }

        @media (min-width: 1200px) {
          .bento-grid {
            grid-template-columns: repeat(7, 1fr);
          }
        }

        /* 💎 PREMIUM COMPACT GLASSMORPHISM HUD CARDS */
        .hud-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 18px;
          padding: 0.95rem 1.1rem;
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 4px 20px -5px rgba(51, 65, 85, 0.05), 
                      0 1px 2px rgba(51, 65, 85, 0.02);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hud-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          opacity: 0.85;
        }

        /* Neon gradient headers for each card type */
        .glass-glow-blue::after { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
        .glass-glow-green::after { background: linear-gradient(90deg, #10b981, #34d399); }
        .glass-glow-rose::after { background: linear-gradient(90deg, #f43f5e, #fb7185); }
        .glass-glow-gold::after { background: linear-gradient(90deg, #eab308, #facc15); }

        .hud-card:hover {
          transform: translateY(-3px);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 15px 30px -8px rgba(51, 65, 85, 0.1),
                      0 0 0 1px rgba(255, 255, 255, 1);
        }

        /* Micro hover glow effect */
        .glass-glow-blue:hover { box-shadow: 0 15px 30px -8px rgba(59, 130, 246, 0.1); }
        .glass-glow-green:hover { box-shadow: 0 15px 30px -8px rgba(16, 185, 129, 0.1); }
        .glass-glow-rose:hover { box-shadow: 0 15px 30px -8px rgba(244, 63, 94, 0.1); }
        .glass-glow-gold:hover { box-shadow: 0 15px 30px -8px rgba(234, 179, 8, 0.1); }

        .hud-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.6rem;
        }

        .icon-wrapper {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: inset 0 -1px 2px rgba(0,0,0,0.02);
        }

        .icon-wrapper.bg-blue { background: rgba(59, 130, 246, 0.08); color: #2563eb; }
        .icon-wrapper.bg-green { background: rgba(16, 185, 129, 0.08); color: #059669; }
        .icon-wrapper.bg-rose { background: rgba(244, 63, 94, 0.08); color: #e11d48; }
        .icon-wrapper.bg-gold { background: rgba(234, 179, 8, 0.08); color: #ca8a04; }

        .hud-card:hover .icon-wrapper {
          transform: scale(1.08) rotate(3deg);
        }

        .hud-title {
          font-size: 0.65rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.75px;
        }

        .big-value {
          font-size: 1.5rem;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.1;
          letter-spacing: -0.75px;
          margin-bottom: 0.3rem;
        }
        .big-value.text-green { color: #059669; }
        .big-value.text-blue { color: #2563eb; }
        .big-value.text-amber { color: #d97706; }
        .big-value.text-rose { color: #e11d48; }

        .currency {
          font-size: 0.8rem;
          font-weight: 800;
          color: #94a3b8;
          margin-left: 0.15rem;
        }

        .hud-sub {
          font-size: 0.7rem;
          color: #64748b;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .indicator.active-pulse {
          background: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.6; }
        }

        .progress-bar-container {
          background: #f1f5f9;
          height: 5px;
          border-radius: 99px;
          overflow: hidden;
          margin-top: 0.75rem;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 1s ease-in-out;
        }
        .progress-bar-fill.bg-blue { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
        .progress-bar-fill.bg-green { background: linear-gradient(90deg, #10b981, #34d399); }
        .progress-bar-fill.bg-rose { background: linear-gradient(90deg, #f43f5e, #fb7185); }
        .progress-bar-fill.bg-gold { background: linear-gradient(90deg, #eab308, #facc15); }

        /* Radial progress KPI */
        .hud-body-radial {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .radial-content {
          display: flex;
          flex-direction: column;
        }
        .radial-number {
          font-size: 1.5rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.75px;
        }
        .radial-desc {
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 600;
        }

        .radial-bar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          transition: transform 0.4s ease;
        }
        .hud-card:hover .radial-bar {
          transform: scale(1.06) rotate(15deg);
        }
        .radial-bar::after {
          content: '';
          position: absolute;
          width: 32px;
          height: 32px;
          background: white;
          border-radius: 50%;
        }

        /* 🚚 LIVE INTERACTIVE CONTROL DECK Layout */
        .control-deck-layout {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 2rem;
        }

        @media (max-width: 1200px) {
          .control-deck-layout {
            grid-template-columns: 1fr;
          }
        }

        .dispatch-stream-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 20px 40px -15px rgba(51, 65, 85, 0.05);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .stream-header {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .header-left h3 {
          font-size: 1.35rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .pulse-text {
          color: #3b82f6;
          animation: text-pulse 2s infinite;
        }
        @keyframes text-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        .search-and-filter {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .search-box-wrapper {
          background: rgba(248, 250, 252, 0.8);
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 0.6rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
          min-width: 280px;
          transition: all 0.3s ease;
        }
        .search-box-wrapper:focus-within {
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        .search-box-wrapper input {
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          font-size: 0.9rem;
          color: #0f172a;
          font-weight: 600;
        }

        .status-toggles {
          display: flex;
          gap: 0.35rem;
          background: #f1f5f9;
          padding: 0.35rem;
          border-radius: 16px;
        }
        .toggle-btn {
          border: none;
          background: transparent;
          font-size: 0.8rem;
          font-weight: 800;
          color: #64748b;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .toggle-btn.active {
          background: white;
          color: #01562c;
          box-shadow: 0 4px 10px rgba(0,0,0,0.06);
        }

        .stream-table-wrapper {
          max-height: 520px;
          overflow-y: auto;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
        }

        .dispatch-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .dispatch-table th {
          font-size: 0.75rem;
          font-weight: 900;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.75px;
          padding: 1.1rem 1.25rem;
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
        }
        .dispatch-table td {
          padding: 1.25rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .dispatch-row {
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .dispatch-row:hover {
          background: rgba(248, 250, 252, 0.8);
        }
        .dispatch-row.row-selected {
          background: rgba(1, 86, 44, 0.05) !important;
        }

        .order-no {
          font-weight: 900;
          color: #0f172a;
          font-size: 0.95rem;
          margin-bottom: 0.25rem;
        }
        .batch-tag {
          font-size: 0.68rem;
          font-weight: 800;
          color: #475569;
          background: #f1f5f9;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
        }

        .client-name {
          font-weight: 800;
          color: #1e293b;
        }
        .branch-tag {
          font-size: 0.7rem;
          font-weight: 800;
          color: #01562c;
        }

        .salesman-tag {
          font-size: 0.75rem;
          font-weight: 800;
          color: #2563eb;
          background: rgba(37, 99, 235, 0.08);
          padding: 0.3rem 0.65rem;
          border-radius: 10px;
          width: fit-content;
        }

        .status-badge-premium {
          font-size: 0.7rem;
          font-weight: 900;
          padding: 0.3rem 0.8rem;
          border-radius: 99px;
          display: inline-block;
          letter-spacing: 0.5px;
        }
        .status-badge-premium.pending { background: rgba(234, 88, 12, 0.08); color: #ea580c; }
        .status-badge-premium.in_transit, .status-badge-premium.dispatched { background: rgba(37, 99, 235, 0.08); color: #2563eb; }
        .status-badge-premium.delivered { background: rgba(16, 185, 129, 0.08); color: #059669; }
        .status-badge-premium.returned { background: rgba(244, 63, 94, 0.08); color: #e11d48; }

        .dispatch-date-cell {
          font-size: 0.8rem;
          font-weight: 700;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .load-value {
          font-size: 1.05rem;
          font-weight: 900;
          color: #0f172a;
        }
        .load-value .unit {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        /* RIGHT PANEL: Selected Order Pulse */
        .dispatch-pulse-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 20px 40px -15px rgba(51, 65, 85, 0.05);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          min-height: 400px;
        }

        .no-selected-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          text-align: center;
          color: #64748b;
          padding: 3rem;
        }
        .placeholder-icon {
          color: #cbd5e1;
          margin-bottom: 1.5rem;
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .no-selected-placeholder h4 {
          font-size: 1.25rem;
          font-weight: 900;
          color: #1e293b;
          margin: 0 0 0.6rem 0;
          letter-spacing: -0.5px;
        }
        .no-selected-placeholder p {
          font-size: 0.85rem;
          line-height: 1.6;
          max-width: 320px;
        }

        .pulse-detail-container {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
          height: 100%;
        }

        .logistics-chain-header {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .logistics-chain-header h4 {
          font-size: 0.8rem;
          font-weight: 900;
          color: #475569;
          letter-spacing: 0.75px;
          margin: 0;
        }

        .chain-visual {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          padding: 0 0.75rem;
        }

        .chain-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          z-index: 2;
        }

        .node-icon {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .node-icon.bg-green { background: #10b981; }
        .node-icon.bg-blue { background: #3b82f6; }
        .node-icon.bg-slate { background: #94a3b8; }

        .node-label {
          font-size: 0.7rem;
          font-weight: 800;
          color: #475569;
        }

        .chain-line {
          height: 4px;
          flex: 1;
          margin: 0 -8px;
          margin-bottom: 1.25rem;
          z-index: 1;
        }
        .chain-line.bg-green { background: #10b981; }
        .chain-line.bg-slate { background: #cbd5e1; }

        .specs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
        }

        .spec-item {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .spec-label {
          font-size: 0.7rem;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .spec-val {
          font-size: 0.95rem;
          font-weight: 900;
          color: #1e293b;
        }
        .spec-val.text-green {
          color: #01562c;
        }

        .status-pill {
          font-size: 0.75rem;
          font-weight: 900;
          padding: 0.25rem 0.75rem;
          border-radius: 8px;
          width: fit-content;
          letter-spacing: 0.25px;
        }
        .status-pill.pending { background: rgba(234, 88, 12, 0.08); color: #ea580c; }
        .status-pill.in_transit, .status-pill.dispatched { background: rgba(37, 99, 235, 0.08); color: #2563eb; }
        .status-pill.delivered { background: rgba(16, 185, 129, 0.08); color: #059669; }
        .status-pill.returned { background: rgba(244, 63, 94, 0.08); color: #e11d48; }

        .action-buttons-wrapper {
          margin-top: 0.5rem;
        }

        .btn-action {
          border: none;
          padding: 0.6rem 1.25rem;
          font-size: 0.85rem;
          font-weight: 800;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-action.dispatch-btn { background: #3b82f6; }
        .btn-action.dispatch-btn:hover { background: #2563eb; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2); }
        .btn-action.deliver-btn { background: #10b981; }
        .btn-action.deliver-btn:hover { background: #059669; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2); }

        .completed-log-tag {
          font-size: 0.85rem;
          font-weight: 800;
          color: #10b981;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .dispatch-items-list-container {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .dispatch-items-list-container h5 {
          font-size: 0.75rem;
          font-weight: 900;
          color: #475569;
          letter-spacing: 0.75px;
          margin: 0;
        }

        .small-items-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          max-height: 220px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .dispatch-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: rgba(248, 250, 252, 0.8);
          border-radius: 14px;
          border: 1px solid #eef2f6;
          transition: all 0.2s ease;
        }
        .dispatch-item-row:hover {
          background: white;
          border-color: #cbd5e1;
        }
        .item-left {
          display: flex;
          flex-direction: column;
        }
        .item-name {
          font-size: 0.85rem;
          font-weight: 800;
          color: #1e293b;
        }
        .unit-price-tag {
          font-size: 0.7rem;
          font-weight: 600;
          color: #94a3b8;
        }
        .item-right {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .loaded-qty {
          font-size: 0.75rem;
          font-weight: 800;
          color: #475569;
          background: #e2e8f0;
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
        }
        .item-total-price {
          font-size: 0.85rem;
          font-weight: 900;
          color: #1e293b;
        }

        /* 🔮 PREDICTIVE RETURNS TRACKER */
        .returns-pulse-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .returns-pulse-section h3 {
          font-size: 1.35rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .returns-tracker-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 1.5rem;
        }

        .tracker-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 26px;
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 15px 35px -10px rgba(51, 65, 85, 0.05);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .tracker-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 25px 45px -12px rgba(51, 65, 85, 0.1);
        }

        .tracker-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .salesman-meta {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .salesman-avatar {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          background: rgba(1, 86, 44, 0.08);
          color: #01562c;
          font-weight: 900;
          font-size: 1.05rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 -2px 4px rgba(0,0,0,0.03);
        }

        .salesman-meta .name {
          font-size: 0.95rem;
          font-weight: 900;
          color: #1e293b;
          display: block;
        }
        .salesman-meta .destination {
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 700;
          display: block;
        }

        .timer-badge {
          font-size: 0.7rem;
          font-weight: 900;
          padding: 0.25rem 0.65rem;
          border-radius: 8px;
          letter-spacing: 0.25px;
        }
        .timer-badge.active { background: rgba(16, 185, 129, 0.08); color: #10b981; }
        .timer-badge.scheduled { background: #f8fafc; color: #64748b; border: 1px dashed #cbd5e1; }

        .route-bar {
          background: #f1f5f9;
          height: 8px;
          border-radius: 99px;
          position: relative;
          margin-bottom: 0.5rem;
          overflow: hidden;
        }
        .route-fill {
          background: linear-gradient(90deg, #10b981, #3b82f6);
          height: 100%;
          border-radius: 99px;
        }
        .route-bar .dot {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid white;
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .time-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 800;
        }
        .time-meta .bold {
          color: #1e293b;
        }

        /* loading / small layout assets */
        .loading-spinner-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 220px;
          color: #3b82f6;
        }
        .loading-spinner-area-small {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: #64748b;
          padding: 1.25rem;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .no-records-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 220px;
          color: #94a3b8;
          text-align: center;
        }
        .spin-icon {
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* 📊 NEXT-GEN CHARTS STYLING */
        .analytics-charts-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 1200px) {
          .analytics-charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .analytics-chart-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 1.1rem 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 10px 25px -10px rgba(51, 65, 85, 0.05);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }

        .analytics-chart-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          opacity: 0.85;
        }

        .analytics-chart-card:hover {
          transform: translateY(-3px);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 15px 30px -8px rgba(51, 65, 85, 0.1);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-icon-title {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .header-icon-title h4 {
          font-size: 0.95rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.4px;
        }

        .chart-sub {
          font-size: 0.68rem;
          color: #64748b;
          font-weight: 600;
          margin: 0.05rem 0 0 0;
        }

        .icon-wrapper.small {
          width: 28px;
          height: 28px;
          border-radius: 8px;
        }

        .chart-body {
          position: relative;
        }

        .empty-chart-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 180px;
          color: #94a3b8;
          font-size: 0.8rem;
          font-weight: 600;
          gap: 0.4rem;
        }

        .pie-chart-body {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .pie-container-layout {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `}</style>
    </Layout>
  );
};

export default DispatchDashboardPage;
