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
  ArrowLeft,
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
  vendor_id?: number;
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
  total_credit_amount?: number;
  client_name: string;
  branch_name?: string;
  reason: string;
  created_at: string;
  wastage_loss: number;
  salesman_name?: string;
}

const DispatchDashboardPage = () => {
  const { t, language } = useLanguage();
  const [rawDispatches, setRawDispatches] = useState<Dispatch[]>([]);
  const [rawReturns, setRawReturns] = useState<ReturnLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);
  const [dispatchItems, setDispatchItems] = useState<DispatchItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerSoldItems, setPartnerSoldItems] = useState<any[]>([]);
  const [partnerReturnedItems, setPartnerReturnedItems] = useState<any[]>([]);
  const [activeOrdersModalBranch, setActiveOrdersModalBranch] = useState<string | null>(null);

  // Date range filters (default to last 30 days)
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const formatDate = (dateInput: any) => {
    if (!dateInput) return '';
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  };

  // Derived filtered arrays by date range
  const dispatches = rawDispatches.filter(d => {
    const dDate = formatDate(d.dispatch_date || d.created_at);
    return (!startDate || dDate >= startDate) && (!endDate || dDate <= endDate);
  });

  const returns = rawReturns.filter(r => {
    const rDate = formatDate(r.created_at);
    return (!startDate || rDate >= startDate) && (!endDate || rDate <= endDate);
  });

  // Calculate dispatches and returns values dynamically based on filtered data
  const totalDeliveredValue = dispatches
    .filter(d => d.dispatch_status === 'delivered')
    .reduce((acc, d) => acc + Number(d.total_amount || 0), 0);

  const totalInTransitValue = dispatches
    .filter(d => d.dispatch_status === 'in_transit' || d.dispatch_status === 'dispatched')
    .reduce((acc, d) => acc + Number(d.total_amount || 0), 0);

  const totalPreparedValue = dispatches
    .filter(d => d.dispatch_status === 'pending')
    .reduce((acc, d) => acc + Number(d.total_amount || 0), 0);

  const totalReturnsValue = returns.reduce((acc, r) => acc + Number(r.total_credit_amount || 0), 0);
  const totalWastageValue = returns.reduce((acc, r) => acc + Number(r.wastage_loss || 0), 0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Reset pagination to first page when search, status, or date filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, startDate, endDate]);

  // Auto-select logic when filters change
  useEffect(() => {
    if (dispatches.length > 0) {
      const exists = dispatches.some(d => d.sale_id === selectedDispatch?.sale_id);
      if (!exists) {
        handleSelectDispatch(dispatches[0]);
      }
    } else {
      setSelectedDispatch(null);
      setDispatchItems([]);
    }
  }, [startDate, endDate, searchTerm, statusFilter, rawDispatches]);

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

      setRawDispatches(sortedDispatches);
      setRawReturns(rData);
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

  const handleSelectPartner = async (partnerName: string) => {
    setSelectedPartner(partnerName);
    setPartnerLoading(true);
    try {
      const pDispatches = dispatches.filter(d => d.client_name === partnerName);
      const firstMatch = pDispatches.find(d => d.vendor_id !== undefined && d.vendor_id !== null);
      const vendorId = firstMatch ? firstMatch.vendor_id : null;

      if (!vendorId) {
        console.warn(`No vendor_id found for partner: ${partnerName}`);
        setPartnerSoldItems([]);
        setPartnerReturnedItems([]);
        return;
      }

      const [perfRes, wastageRes] = await Promise.all([
        api.get(`/reports/products?vendor_id=${vendorId}`).catch(() => ({ data: { data: [] } })),
        api.get(`/reports/wastage?vendor_id=${vendorId}`).catch(() => ({ data: { data: [] } }))
      ]);

      const perfData = perfRes.data?.data || perfRes.data || [];
      const wastageData = wastageRes.data?.data || wastageRes.data || [];

      const soldMap: { [key: string]: { name: string, qty: number, totalVal: number, returnsQty: number, returnsLoss: number, netVal: number, totalCost: number, grossProfit: number } } = {};
      perfData.forEach((item: any) => {
        const key = language === 'ar' ? (item.name_ar || item.name_en) : item.name_en;
        const qty = Number(item.total_sold || 0);
        const val = Number(item.revenue || 0);
        const rQty = Number(item.returns_qty || 0);
        const rLoss = Number(item.returns_loss || 0);
        const cost = Number(item.total_cost || 0);
        if (!soldMap[key]) {
          soldMap[key] = { name: key, qty: 0, totalVal: 0, returnsQty: 0, returnsLoss: 0, netVal: 0, totalCost: 0, grossProfit: 0 };
        }
        soldMap[key].qty += qty;
        soldMap[key].totalVal += val;
        soldMap[key].returnsQty += rQty;
        soldMap[key].returnsLoss += rLoss;
        soldMap[key].totalCost += cost;
        
        // Calculate derived values
        const netRev = soldMap[key].totalVal - soldMap[key].returnsLoss;
        soldMap[key].netVal = netRev;
        soldMap[key].grossProfit = netRev - soldMap[key].totalCost;
      });

      const returnedMap: { [key: string]: { name: string, qty: number, totalLoss: number, branches: { [branch: string]: number } } } = {};
      wastageData.forEach((item: any) => {
        const key = language === 'ar' ? (item.product_name_ar || item.product_name) : item.product_name;
        const qty = Number(item.quantity || 0);
        const cost = Number(item.cost_price || 0);
        const loss = qty * cost;
        const branch = item.branch_name || 'Main Office';

        if (!returnedMap[key]) {
          returnedMap[key] = { name: key, qty: 0, totalLoss: 0, branches: {} };
        }
        returnedMap[key].qty += qty;
        returnedMap[key].totalLoss += loss;
        returnedMap[key].branches[branch] = (returnedMap[key].branches[branch] || 0) + qty;
      });

      setPartnerSoldItems(Object.values(soldMap).sort((a, b) => b.qty - a.qty));
      setPartnerReturnedItems(Object.values(returnedMap).sort((a, b) => b.qty - a.qty));
    } catch (e) {
      console.error("Failed to load partner analytics:", e);
      setPartnerSoldItems([]);
      setPartnerReturnedItems([]);
    } finally {
      setPartnerLoading(false);
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
      try {
        const dateObj = new Date(d.created_at);
        if (isNaN(dateObj.getTime())) return;
        const dateStr = dateObj.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
          month: 'short',
          day: 'numeric'
        });
        groups[dateStr] = (groups[dateStr] || 0) + Number(d.total_amount || 0);
      } catch (e) {
        console.error("Failed to parse timeline date:", d.created_at, e);
      }
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
    const formattedOrderNo = `FNFI-${100000 + d.sale_id}`.toLowerCase();
    const client = (d.client_name || '').toLowerCase();
    const salesman = (d.salesman_name || '').toLowerCase();
    const batch = (d.batch_number || '').toLowerCase();

    const matchesSearch = formattedOrderNo.includes(term) || orderNo.includes(term) || client.includes(term) || salesman.includes(term) || batch.includes(term);

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'in_transit') return matchesSearch && (d.dispatch_status === 'in_transit' || d.dispatch_status === 'dispatched');
    if (statusFilter === 'pending') return matchesSearch && d.dispatch_status === 'pending';
    if (statusFilter === 'delivered') return matchesSearch && d.dispatch_status === 'delivered';
    
    return matchesSearch;
  });

  // Pagination Calculations
  const indexOfLastEntry = currentPage * 5;
  const indexOfFirstEntry = indexOfLastEntry - 5;
  const currentEntries = filteredDispatches.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredDispatches.length / 5);

  if (selectedPartner) {
    const partnerDispatches = dispatches.filter(d => d.client_name === selectedPartner);
    const partnerReturns = returns.filter(r => r.client_name === selectedPartner);

    const pActiveCount = partnerDispatches.filter(d => d.dispatch_status === 'in_transit' || d.dispatch_status === 'dispatched' || d.dispatch_status === 'pending').length;
    const pDeliveredCount = partnerDispatches.filter(d => d.dispatch_status === 'delivered').length;

    const pGrossValue = partnerDispatches.reduce((sum, d) => sum + Number(d.total_amount || 0), 0);
    const pSoldValue = partnerDispatches.filter(d => d.dispatch_status === 'delivered').reduce((sum, d) => sum + Number(d.total_amount || 0), 0);
    const pReturnedValue = partnerReturns.reduce((sum, r) => sum + Number(r.total_credit_amount || 0), 0);
    const pNetRevenue = pSoldValue - pReturnedValue;

    const partnerCOGS = partnerSoldItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
    const partnerGrossProfit = pNetRevenue - partnerCOGS;
    const partnerMargin = pNetRevenue > 0 ? (partnerGrossProfit / pNetRevenue) * 100 : 0;

    const partnerWastageLoss = partnerReturnedItems.reduce((sum, item) => sum + (item.totalLoss || 0), 0);
    const partnerNetProfit = partnerGrossProfit - partnerWastageLoss;
    const partnerNetMargin = pNetRevenue > 0 ? (partnerNetProfit / pNetRevenue) * 100 : 0;

    const pReturnRate = pSoldValue > 0 ? Math.round((pReturnedValue / pSoldValue) * 100) : 0;

    const pBranchesSet = new Set<string>();
    partnerDispatches.forEach(d => pBranchesSet.add(d.branch_name || 'Main Office'));
    partnerReturns.forEach(r => pBranchesSet.add(r.branch_name || 'Main Office'));
    const pBranches = Array.from(pBranchesSet);

    const branchData = pBranches.map(branchName => {
      const bDispatches = partnerDispatches.filter(d => (d.branch_name || 'Main Office') === branchName);
      const bReturns = partnerReturns.filter(r => (r.branch_name || 'Main Office') === branchName);

      const bActiveCount = bDispatches.filter(d => d.dispatch_status === 'in_transit' || d.dispatch_status === 'dispatched' || d.dispatch_status === 'pending').length;
      const bSoldValue = bDispatches.filter(d => d.dispatch_status === 'delivered').reduce((sum, d) => sum + Number(d.total_amount || 0), 0);
      const bReturnedValue = bReturns.reduce((sum, r) => sum + Number(r.total_credit_amount || 0), 0);
      const bNetRevenue = bSoldValue - bReturnedValue;

      return {
        name: branchName,
        activeCount: bActiveCount,
        soldValue: bSoldValue,
        returnedValue: bReturnedValue,
        netRevenue: bNetRevenue
      };
    }).sort((a, b) => b.netRevenue - a.netRevenue);

    return (
      <Layout title={`Partner Analytics • ${selectedPartner}`}>
        <div className="partner-analytics-portal animated fadeIn">
          {/* Header */}
          <div className="portal-header">
            <button className="btn-back" onClick={() => setSelectedPartner(null)}>
              <ArrowLeft size={16} /> Back to Overview
            </button>
            <div className="partner-title-area">
              <div className="partner-avatar">
                <Building2 size={24} />
              </div>
              <div>
                <h2>{selectedPartner}</h2>
                <span className="partner-badge">Corporate Partner Ledger</span>
              </div>
            </div>
            {/* Date Range Filter */}
            <div className="partner-date-filter">
              <Calendar size={14} />
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={e => setStartDate(e.target.value)}
                className="partner-date-input"
              />
              <span className="partner-date-sep">→</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={e => setEndDate(e.target.value)}
                className="partner-date-input"
              />
              {(startDate || endDate) && (
                <button
                  className="partner-date-clear"
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  title="Clear date filter"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          {partnerLoading ? (
            <div className="portal-loading">
              <Clock className="spin-icon text-green" size={32} />
              <p>Analyzing partner telemetry and aggregating ledger items...</p>
            </div>
          ) : (
            <div className="portal-content">
              {/* KPIs Bento Grid */}
              <div className="bento-grid partner-bento">
                
                {/* Active Dispatches */}
                <div className="hud-card glass-glow-blue">
                  <div className="hud-header">
                    <div className="icon-wrapper bg-blue">
                      <Truck size={24} />
                    </div>
                    <span className="hud-title">ACTIVE SHIPMENTS</span>
                  </div>
                  <div className="hud-body">
                    <div className="big-value">{pActiveCount}</div>
                    <div className="hud-sub">Currently en-route/prepared</div>
                  </div>
                </div>

                {/* Total Gross Dispatched */}
                <div className="hud-card glass-glow-blue">
                  <div className="hud-header">
                    <div className="icon-wrapper bg-blue">
                      <TrendingUp size={24} />
                    </div>
                    <span className="hud-title">GROSS DISPATCHED</span>
                  </div>
                  <div className="hud-body">
                    <div className="big-value">{pGrossValue.toFixed(3)} <span className="currency">KD</span></div>
                    <div className="hud-sub">All shipped load value</div>
                  </div>
                </div>

                {/* Delivered / Sold */}
                <div className="hud-card glass-glow-green">
                  <div className="hud-header">
                    <div className="icon-wrapper bg-green">
                      <CheckCircle2 size={24} />
                    </div>
                    <span className="hud-title">DELIVERED REVENUE</span>
                  </div>
                  <div className="hud-body">
                    <div className="big-value text-green">{pSoldValue.toFixed(3)} <span className="currency">KD</span></div>
                    <div className="hud-sub">{pDeliveredCount} completed sales</div>
                  </div>
                </div>

                {/* Returns Received */}
                <div className="hud-card glass-glow-rose">
                  <div className="hud-header">
                    <div className="icon-wrapper bg-rose">
                      <RotateCcw size={24} />
                    </div>
                    <span className="hud-title">TOTAL RETURNS</span>
                  </div>
                  <div className="hud-body">
                    <div className="big-value text-rose">{pReturnedValue.toFixed(3)} <span className="currency">KD</span></div>
                    <div className="hud-sub">{partnerReturns.length} return claims received</div>
                  </div>
                </div>

                {/* Return Rate */}
                <div className="hud-card glass-glow-rose">
                  <div className="hud-header">
                    <div className="icon-wrapper bg-rose">
                      <AlertOctagon size={24} />
                    </div>
                    <span className="hud-title">RETURN VALUE RATE</span>
                  </div>
                  <div className="hud-body">
                    <div className="big-value text-rose">{pReturnRate}%</div>
                    <div className="hud-sub">Percentage of revenue returned</div>
                  </div>
                </div>

                {/* Net Revenue */}
                <div className="hud-card glass-glow-blue">
                  <div className="hud-header">
                    <div className="icon-wrapper bg-blue">
                      <TrendingUp size={24} />
                    </div>
                    <span className="hud-title">NET REVENUE</span>
                  </div>
                  <div className="hud-body">
                    <div className="big-value text-blue">{pNetRevenue.toFixed(3)} <span className="currency">KD</span></div>
                    <div className="hud-sub">Net sales value kept</div>
                  </div>
                </div>

                {/* Gross Profit */}
                <div className="hud-card glass-glow-green">
                  <div className="hud-header">
                    <div className="icon-wrapper bg-green">
                      <CheckCircle2 size={24} />
                    </div>
                    <span className="hud-title">GROSS PROFIT</span>
                  </div>
                  <div className="hud-body">
                    <div className="big-value text-green">{partnerGrossProfit.toFixed(3)} <span className="currency">KD</span></div>
                    <div className="hud-sub">Margin: <b className="text-green">{partnerMargin.toFixed(1)}%</b></div>
                  </div>
                </div>

                {/* Wastage Loss */}
                <div className="hud-card glass-glow-rose">
                  <div className="hud-header">
                    <div className="icon-wrapper bg-rose">
                      <TrendingDown size={24} />
                    </div>
                    <span className="hud-title">WASTAGE LOSS</span>
                  </div>
                  <div className="hud-body">
                    <div className="big-value text-rose">{partnerWastageLoss.toFixed(3)} <span className="currency">KD</span></div>
                    <div className="hud-sub">Spoilage &amp; expired items cost</div>
                  </div>
                </div>

                {/* Net Profit — Full Bottom Line */}
                <div className={`hud-card ${partnerNetProfit >= 0 ? 'glass-glow-green' : 'glass-glow-rose'}`}
                  style={{ gridColumn: 'span 2', background: partnerNetProfit >= 0 ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'linear-gradient(135deg, #fff1f2, #ffe4e6)', border: `2px solid ${partnerNetProfit >= 0 ? '#22c55e' : '#f43f5e'}` }}>
                  <div className="hud-header">
                    <div className="icon-wrapper" style={{ background: partnerNetProfit >= 0 ? '#dcfce7' : '#ffe4e6', color: partnerNetProfit >= 0 ? '#16a34a' : '#e11d48' }}>
                      {partnerNetProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                    </div>
                    <span className="hud-title" style={{ color: partnerNetProfit >= 0 ? '#15803d' : '#be123c', fontSize: '0.9rem' }}>NET PROFIT (BOTTOM LINE)</span>
                  </div>
                  <div className="hud-body">
                    <div className="big-value" style={{ color: partnerNetProfit >= 0 ? '#16a34a' : '#e11d48', fontSize: '2rem' }}>
                      {partnerNetProfit.toFixed(3)} <span className="currency">KD</span>
                    </div>
                    <div className="hud-sub">
                      Net Margin: <b style={{ color: partnerNetProfit >= 0 ? '#16a34a' : '#e11d48' }}>{partnerNetMargin.toFixed(1)}%</b>
                      &nbsp;•&nbsp; After COGS ({partnerCOGS.toFixed(3)} KD) &amp; Wastage ({partnerWastageLoss.toFixed(3)} KD)
                    </div>
                  </div>
                </div>

              </div>



              {/* Grid Layout for branches & products */}
              <div className="main-content-layout">
                
                {/* LEFT COLUMN: BRANCHES & SALES */}
                <div className="left-column-layout">
                  
                  {/* Branch Performance Card */}
                  <div className="dispatch-stream-card">
                    <div className="stream-header">
                      <div className="header-left">
                        <Building2 size={18} className="text-green" />
                        <h3>Branch Performance Ledger</h3>
                      </div>
                    </div>
                    <div className="stream-table-wrapper" style={{ maxHeight: '250px' }}>
                      <table className="dispatch-table">
                        <thead>
                          <tr>
                            <th>BRANCH NAME</th>
                            <th className="text-center">ACTIVE DISPATCHES</th>
                            <th>REVENUE SOLD</th>
                            <th>RETURNS VALUE</th>
                            <th>NET REVENUE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {branchData.map((branch, idx) => (
                            <tr key={idx} className="dispatch-row">
                              <td><strong>{branch.name}</strong></td>
                              <td className="text-center">
                                <span 
                                  className={`status-badge-premium ${branch.activeCount > 0 ? 'in_transit' : 'delivered'}`}
                                  onClick={() => branch.activeCount > 0 && setActiveOrdersModalBranch(branch.name)}
                                  style={branch.activeCount > 0 ? { cursor: 'pointer' } : undefined}
                                  title={branch.activeCount > 0 ? "Click to view active dispatches" : undefined}
                                >
                                  {branch.activeCount} Active
                                </span>
                              </td>
                              <td>{branch.soldValue.toFixed(3)} KD</td>
                              <td className="text-rose">{branch.returnedValue.toFixed(3)} KD</td>
                              <td className={branch.netRevenue >= 0 ? 'text-green font-bold' : 'text-rose font-bold'}>
                                {branch.netRevenue.toFixed(3)} KD
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Top Selling Products Card */}
                  <div className="dispatch-stream-card">
                    <div className="stream-header">
                      <div className="header-left">
                        <TrendingUp size={18} className="text-green" />
                        <h3>Top Selling Products (Wins & Returns)</h3>
                      </div>
                    </div>
                    <div className="stream-table-wrapper" style={{ maxHeight: '220px' }}>
                      {partnerSoldItems.length === 0 ? (
                        <div className="no-records-area">
                          <p>No completed sales item data found.</p>
                        </div>
                      ) : (
                        <table className="dispatch-table">
                          <thead>
                            <tr>
                              <th>PRODUCT NAME</th>
                              <th className="text-center">QTY SOLD</th>
                              <th>GROSS REVENUE</th>
                              <th className="text-center text-rose">RETURNS</th>
                              <th>NET REVENUE</th>
                              <th>GROSS PROFIT</th>
                              <th className="text-center">MARGIN</th>
                            </tr>
                          </thead>
                          <tbody>
                            {partnerSoldItems.map((item, idx) => {
                              const marginPercent = item.netVal > 0 ? (item.grossProfit / item.netVal) * 100 : 0;
                              return (
                                <tr key={idx}>
                                  <td><strong>{item.name}</strong></td>
                                  <td className="text-center"><span className="loaded-qty">{item.qty}</span></td>
                                  <td>{item.totalVal.toFixed(3)} KD</td>
                                  <td className="text-center">
                                    {item.returnsQty > 0 ? (
                                      <span className="returns-tag-highlight">
                                        {item.returnsQty} u ({item.returnsLoss.toFixed(3)} KD)
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 font-normal">0</span>
                                    )}
                                  </td>
                                  <td className="text-blue font-bold">
                                    {item.netVal.toFixed(3)} KD
                                  </td>
                                  <td className={item.grossProfit >= 0 ? "text-green font-bold" : "text-rose font-bold"}>
                                    {item.grossProfit.toFixed(3)} KD
                                  </td>
                                  <td className="text-center">
                                    <span className={`status-badge-premium ${item.grossProfit >= 0 ? "delivered" : "returned"}`} style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem' }}>
                                      {marginPercent.toFixed(1)}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: RETURNS & LOGS */}
                <div className="right-column-layout">
                  
                  {/* Returned Products Card */}
                  <div className="dispatch-stream-card">
                    <div className="stream-header">
                      <div className="header-left">
                        <RotateCcw size={18} className="text-rose" />
                        <h3>Returned Menu Products (Loss Control)</h3>
                      </div>
                    </div>
                    <div className="stream-table-wrapper" style={{ maxHeight: '220px' }}>
                      {partnerReturnedItems.length === 0 ? (
                        <div className="no-records-area">
                          <p>No returns recorded for this client. Clean record!</p>
                        </div>
                      ) : (
                        <table className="dispatch-table">
                          <thead>
                            <tr>
                              <th>PRODUCT NAME</th>
                              <th className="text-center">QTY RETURNED</th>
                              <th>LOSS VALUE</th>
                              <th>BRANCH IMPACT</th>
                            </tr>
                          </thead>
                          <tbody>
                            {partnerReturnedItems.map((item, idx) => (
                              <tr key={idx}>
                                <td><strong className="text-rose">{item.name}</strong></td>
                                <td className="text-center">
                                  <span className="loaded-qty" style={{ backgroundColor: 'rgba(244, 63, 94, 0.08)', color: '#e11d48' }}>
                                    {item.qty}
                                  </span>
                                </td>
                                <td className="text-rose font-bold">{item.totalLoss.toFixed(3)} KD</td>
                                <td>
                                  <div className="branch-badges-list">
                                    {Object.entries(item.branches || {}).map(([branch, qty]) => (
                                      <span key={branch} className="branch-qty-badge">
                                        <span className="b-name">{branch}</span>
                                        <span className="b-val">{qty as number}</span>
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* Dispatches Card */}
                  <div className="dispatch-pulse-card">
                    <div className="section-title">
                      <Truck size={16} className="text-blue" />
                      <h3>Active & Recent Shipments</h3>
                    </div>
                    <div className="small-items-list" style={{ maxHeight: '250px' }}>
                      {partnerDispatches.slice(0, 10).map((d, idx) => (
                        <div key={idx} className="dispatch-item-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="item-name" style={{ fontWeight: 800 }}>FNFI-{100000 + d.sale_id}</span>
                            <span className={`status-badge-premium ${d.dispatch_status}`}>{d.dispatch_status.toUpperCase()}</span>
                          </div>
                          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b' }}>
                            <span>Branch: <b>{d.branch_name || 'Main Office'}</b></span>
                            <span>Salesman: <b>{d.salesman_name || 'Unassigned'}</b></span>
                          </div>
                          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', fontSize: '0.68rem', color: '#64748b' }}>
                            <span>Dispatched: <b>{d.dispatch_date}</b></span>
                            <span>Value: <b>{Number(d.total_amount).toFixed(3)} KD</b></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}
        </div>

        {/* Active Orders Modal */}
        {activeOrdersModalBranch && (
          <div className="modal-overlay animated fadeIn" onClick={() => setActiveOrdersModalBranch(null)}>
            <div className="modal-card animated scaleIn" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Truck size={18} className="text-blue" />
                  <h3 style={{ margin: 0 }}>Active Shipments • {activeOrdersModalBranch}</h3>
                </div>
                <button className="btn-close" onClick={() => setActiveOrdersModalBranch(null)}>&times;</button>
              </div>
              <div className="modal-body">
                {(() => {
                  const activeDispatches = partnerDispatches.filter(
                    d => (d.branch_name || 'Main Office') === activeOrdersModalBranch &&
                    (d.dispatch_status === 'in_transit' || d.dispatch_status === 'dispatched' || d.dispatch_status === 'pending')
                  );
                  
                  if (activeDispatches.length === 0) {
                    return (
                      <div className="no-active-orders">
                        <AlertOctagon size={28} />
                        <p>No active shipments found for this branch.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="active-orders-list">
                      {activeDispatches.map((d, index) => (
                        <div key={index} className="modal-order-row">
                          <div className="order-main-info">
                            <span className="order-id" style={{ fontWeight: 900 }}>FNFI-{100000 + d.sale_id}</span>
                            <span className={`status-badge-premium ${d.dispatch_status}`}>
                              {d.dispatch_status.toUpperCase()}
                            </span>
                          </div>
                          <div className="order-sub-details">
                            <div className="detail-item">
                              <span className="label">Salesman</span>
                              <span className="val">{d.salesman_name || 'Unassigned'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="label">Dispatched</span>
                              <span className="val">{d.dispatch_date}</span>
                            </div>
                            <div className="detail-item" style={{ gridColumn: 'span 2', marginTop: '0.2rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.2rem' }}>
                              <span className="label">Value</span>
                              <span className="val bold text-green" style={{ fontSize: '0.8rem' }}>{Number(d.total_amount).toFixed(3)} KD</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        <DashboardStyles />
      </Layout>
    );
  }

  return (
    <Layout title={t('dispatch_dashboard') || 'Dispatch Dashboard & Pulse'}>
      <div className="dispatch-dashboard-hud animated fadeIn">

        {/* Top Control Bar with Premium Date Range Filter */}
        <div className="premium-filter-card animated fadeIn">
          <div className="filter-inner">
            <div className="date-picker-lux">
              <span className="lux-label"><Calendar size={14} /> {t('date_range') || 'Date Range'}</span>
              <div className="lux-date-inputs">
                <input 
                  type="date" 
                  value={startDate} 
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)} 
                />
                <span className="lux-connector">{t('to') || 'to'}</span>
                <input 
                  type="date" 
                  value={endDate} 
                  min={startDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setEndDate(e.target.value)} 
                />
              </div>
            </div>
          </div>
        </div>
        
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

        {/* 📊 MAIN CONTENT SPLIT LAYOUT (FITTING 1 PAGE) */}
        <div className="main-content-layout">
          
          {/* LEFT COLUMN: CHARTS + STREAMS */}
          <div className="left-column-layout">
            
            {/* 📊 NEXT-GEN CHARTS & LOGISTICS RADAR */}
            <div className="analytics-charts-grid">
              
              {/* Chart 1: Sales / Dispatch Value Timeline */}
              <div className="analytics-chart-card glass-glow-blue">
                <div className="chart-header">
                  <div className="header-icon-title">
                    <div className="icon-wrapper bg-blue small">
                      <TrendingUp size={16} />
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
                      <Activity size={20} className="spin-icon text-blue" />
                      <p>Awaiting dispatch stream telemetry...</p>
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: 110 }}>
                      <ResponsiveContainer>
                        <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              background: 'rgba(255, 255, 255, 0.95)', 
                              border: '1px solid #e2e8f0', 
                              borderRadius: 12, 
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' 
                            }} 
                          />
                          <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAmount)" name="Value (KD)" />
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
                      <Activity size={16} />
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
                      <Clock size={20} className="spin-icon text-green" />
                      <p>Awaiting status telemetry...</p>
                    </div>
                  ) : (
                    <div className="pie-container-layout">
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: '100%', height: 110 }}>
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={28}
                                outerRadius={45}
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
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="custom-pie-legend">
                          {pieData.map((item, index) => (
                            <div key={index} className="legend-item">
                              <span className="legend-dot" style={{ backgroundColor: item.color }} />
                              <span className="legend-label">{item.name}</span>
                              <span className="legend-val">({item.value})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* 🚚 LIVE INTERACTIVE CONTROL DECK (TABLE) */}
            <div className="dispatch-stream-card">
              
              <div className="stream-header">
                <div className="header-left">
                  <Activity size={18} className="pulse-text" />
                  <h3>Live Logistics Streams</h3>
                </div>
                <div className="search-and-filter">
                  <div className="search-box-wrapper">
                    <Search size={14} />
                    <input 
                      type="text" 
                      placeholder="Search Order #, Client, Salesman..." 
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
                    <Clock className="spin-icon" size={24} />
                    <p>Streaming logistics feed...</p>
                  </div>
                ) : filteredDispatches.length === 0 ? (
                  <div className="no-records-area">
                    <AlertOctagon size={36} />
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
                      {currentEntries.map((d) => {
                        const isSelected = selectedDispatch?.sale_id === d.sale_id;
                        return (
                          <tr 
                            key={d.sale_id} 
                            className={`dispatch-row ${isSelected ? 'row-selected' : ''}`}
                            onClick={() => handleSelectDispatch(d)}
                          >
                            <td>
                              <div className="order-no">FNFI-{100000 + d.sale_id}</div>
                              <span className="batch-tag">{t('batch')}: {d.batch_number || 'N/A'}</span>
                            </td>
                            <td>
                              <div 
                                className="client-name link-style" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectPartner(d.client_name);
                                }}
                                title="Click to view Partner Analytics Portal"
                              >
                                {language === 'ar' ? (d.client_name_ar || d.client_name) : d.client_name}
                              </div>
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
                                <Calendar size={12} />
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

              {/* 📊 Premium Pagination Controls */}
              {filteredDispatches.length > 5 && (
                <div className="pagination-wrapper">
                  <span className="pagination-info">
                    Showing <b>{indexOfFirstEntry + 1}</b> to <b>{Math.min(indexOfLastEntry, filteredDispatches.length)}</b> of <b>{filteredDispatches.length}</b> dispatches
                  </span>
                  <div className="pagination-controls">
                    <button 
                      className="pagination-arrow"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                      title="First Page"
                    >
                      &laquo;
                    </button>
                    <button 
                      className="pagination-arrow"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      title="Previous Page"
                    >
                      &lsaquo;
                    </button>
                    <span className="page-indicator">
                      Page <b>{currentPage}</b> of <b>{totalPages || 1}</b>
                    </span>
                    <button 
                      className="pagination-arrow"
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      title="Next Page"
                    >
                      &rsaquo;
                    </button>
                    <button 
                      className="pagination-arrow"
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage(totalPages)}
                      title="Last Page"
                    >
                      &raquo;
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* RIGHT COLUMN: PULSE DETAILS + ROUTE CHECKPOINTS */}
          <div className="right-column-layout">
            
            {/* RIGHT: Selected Order Pulse (Logistics Chain Details) */}
            <div className="dispatch-pulse-card">
              
              {selectedDispatch ? (
                <div className="pulse-detail-container">
                  
                  {/* Visual horizontal flow trace */}
                  <div className="logistics-chain-header">
                    <h4>LOGISTICS CHAIN TRACE</h4>
                    <div className="chain-visual">
                      
                      <div className="chain-node active">
                        <div className="node-icon bg-green"><CheckCircle2 size={12} /></div>
                        <span className="node-label">Central Prep</span>
                      </div>
                      
                      <div className="chain-line bg-green"></div>
                      
                      <div className={`chain-node ${(selectedDispatch.dispatch_status !== 'pending') ? 'active' : ''}`}>
                        <div className={`node-icon ${(selectedDispatch.dispatch_status !== 'pending') ? 'bg-blue' : 'bg-slate'}`}>
                          <Truck size={12} />
                        </div>
                        <span className="node-label">In Transit</span>
                      </div>

                      <div className={`chain-line ${(selectedDispatch.dispatch_status === 'delivered' || selectedDispatch.dispatch_status === 'returned') ? 'bg-green' : 'bg-slate'}`}></div>

                      <div className={`chain-node ${(selectedDispatch.dispatch_status === 'delivered' || selectedDispatch.dispatch_status === 'returned') ? 'active' : ''}`}>
                        <div className={`node-icon ${(selectedDispatch.dispatch_status === 'delivered' || selectedDispatch.dispatch_status === 'returned') ? 'bg-green' : 'bg-slate'}`}>
                          <MapPin size={12} />
                        </div>
                        <span className="node-label">Delivered</span>
                      </div>

                      <div className="chain-line bg-slate"></div>

                      <div className="chain-node">
                        <div className="node-icon bg-slate"><RotateCcw size={12} /></div>
                        <span className="node-label">Returns Recvd</span>
                      </div>

                    </div>
                  </div>

                  {/* Core Specs Panel */}
                  <div className="specs-grid">
                    
                    <div className="spec-item">
                      <span className="spec-label">Order Number</span>
                      <strong className="spec-val text-green">FNFI-{100000 + selectedDispatch.sale_id}</strong>
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
                            <Truck size={12} /> Mark In Transit
                          </button>
                        )}
                        {(selectedDispatch.dispatch_status === 'in_transit' || selectedDispatch.dispatch_status === 'dispatched') && (
                          <button 
                            className="btn-action deliver-btn"
                            onClick={() => updateDispatchStatus(selectedDispatch.sale_id, 'delivered')}
                          >
                            <CheckCircle2 size={12} /> Confirm Delivered
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
                        <Clock className="spin-icon" size={16} />
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
                  <Navigation size={36} className="placeholder-icon" />
                  <h4>Select a Dispatch Order</h4>
                  <p>Select any dispatch order from the stream on the left to inspect its real-time logistics trace, assigned loaded inventory, and salesman timeline.</p>
                </div>
              )}

            </div>

            {/* 🔮 PREDICITIVE RETURNS PULSE TRACKER */}
            <div className="returns-pulse-card">
              <div className="section-title">
                <Clock size={16} className="pulse-text" />
                <h3>Predictive Returns & Route Checkpoints</h3>
              </div>
              
              <div className="returns-tracker-list">
                
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
                      <span className="dot" style={{ left: '70%' }}><Truck size={10} /></span>
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
                      <span className="dot" style={{ left: '45%' }}><Truck size={10} /></span>
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

        </div>

      </div>

      <DashboardStyles />
    </Layout>
  );
};

const DashboardStyles = () => (
  <style>{`
        .page-body {
          padding: 0.5rem !important;
        }

        /* 💎 Premium Filter Card Glassmorphism */
        .premium-filter-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.7);
          border-radius: 14px;
          padding: 0.5rem 0.75rem;
          box-shadow: 0 4px 15px -5px rgba(51, 65, 85, 0.05);
          margin-bottom: 0.1rem;
          transition: all 0.3s ease;
        }

        .premium-filter-card:hover {
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 10px 20px -5px rgba(51, 65, 85, 0.08);
        }

        .filter-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .lux-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.62rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .lux-date-inputs {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 2px 6px;
          transition: all 0.3s ease;
        }

        .lux-date-inputs:focus-within {
          border-color: var(--primary, #01562c);
          box-shadow: 0 0 0 3px rgba(1, 86, 44, 0.1);
          background: #fff;
        }

        .lux-date-inputs input {
          border: none;
          background: transparent;
          padding: 4px 6px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #0f172a;
          outline: none;
        }

        .lux-connector {
          font-size: 0.75rem;
          font-weight: 700;
          color: #94a3b8;
          padding: 0 4px;
        }

        /* 💎 NEXT-GEN LOSS ORACLE & PRODUCTS RETURNS WIDGETS */
        .returns-tag-highlight {
          background: rgba(244, 63, 94, 0.08);
          color: #e11d48;
          font-weight: 800;
          padding: 0.15rem 0.4rem;
          border-radius: 6px;
          font-size: 0.68rem;
          display: inline-block;
          border: 1px solid rgba(244, 63, 94, 0.15);
        }

        /* 🔮 MODERN MODAL BOX OVERLAY & CARDS */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .modal-card {
          background: white;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          width: 90%;
          max-width: 480px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.8rem 1.2rem;
          border-bottom: 1px solid #f1f5f9;
          background: #f8fafc;
        }
        .modal-header h3 {
          font-size: 0.95rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
        }
        .btn-close {
          border: none;
          background: transparent;
          font-size: 1.5rem;
          color: #94a3b8;
          cursor: pointer;
          line-height: 1;
          padding: 0;
          transition: color 0.2s ease;
        }
        .btn-close:hover {
          color: #0f172a;
        }

        .modal-body {
          padding: 1rem;
          overflow-y: auto;
          flex: 1;
          background: #fcfcfd;
        }

        .no-active-orders {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 150px;
          color: #94a3b8;
          text-align: center;
          gap: 0.5rem;
        }
        .no-active-orders p {
          font-size: 0.8rem;
          font-weight: 600;
        }

        .active-orders-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .modal-order-row {
          background: white;
          border: 1px solid #eef2f6;
          border-radius: 10px;
          padding: 0.6rem 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          transition: all 0.2s ease;
        }
        .modal-order-row:hover {
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }

        .order-main-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .order-id {
          font-size: 0.85rem;
          font-weight: 900;
          color: #0f172a;
        }

        .order-sub-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.3rem 0.6rem;
          font-size: 0.72rem;
          border-top: 1px dashed #f1f5f9;
          padding-top: 0.4rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .detail-item .label {
          color: #94a3b8;
          font-weight: 700;
        }
        .detail-item .val {
          color: #334155;
          font-weight: 800;
        }
        .detail-item .val.bold {
          font-weight: 900;
        }

        .loss-tracker-card {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 244, 245, 0.95) 100%);
          border-radius: 12px;
          border: 1px solid rgba(244, 63, 94, 0.12);
          padding: 0.6rem 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          box-shadow: 0 4px 12px -5px rgba(244, 63, 94, 0.08);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .loss-tracker-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -8px rgba(244, 63, 94, 0.15);
          border-color: rgba(244, 63, 94, 0.25);
        }

        .loss-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .product-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .product-name-highlight {
          font-size: 0.85rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
        }

        .units-returned-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.7rem;
          font-weight: 700;
          color: #e11d48;
          background: rgba(244, 63, 94, 0.06);
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          width: fit-content;
        }

        .loss-value-pill {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          background: rgba(244, 63, 94, 0.08);
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          border: 1px solid rgba(244, 63, 94, 0.1);
          min-width: 80px;
        }

        .loss-label {
          font-size: 0.55rem;
          font-weight: 800;
          color: #f43f5e;
          text-transform: uppercase;
          letter-spacing: 0.25px;
        }

        .loss-amount {
          font-size: 0.82rem;
          font-weight: 900;
          color: #e11d48;
        }

        .branch-breakdown-container {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          border-top: 1px dashed rgba(244, 63, 94, 0.15);
          padding-top: 0.4rem;
        }

        .breakdown-title {
          font-size: 0.6rem;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.25px;
        }

        .branch-badges-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
        }

        .branch-qty-badge {
          background: rgba(15, 23, 42, 0.03);
          border: 1px solid rgba(226, 232, 240, 0.8);
          padding: 0.15rem 0.4rem;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: #475569;
          transition: all 0.2s ease;
        }
        .branch-qty-badge:hover {
          background: rgba(15, 23, 42, 0.05);
          border-color: #cbd5e1;
        }
        .branch-qty-badge .b-name {
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .branch-qty-badge .b-val {
          background: #f43f5e;
          color: white;
          padding: 0.02rem 0.25rem;
          border-radius: 4px;
          font-size: 0.6rem;
          font-weight: 800;
        }
        .dispatch-dashboard-hud {
          padding: 0.4rem 0.6rem;
          background: linear-gradient(135deg, #f6f8fb 0%, #edf2f7 100%);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-height: calc(100vh - 90px);
          font-family: 'Inter', -apple-system, sans-serif;
          box-sizing: border-box;
        }

        /* 🌟 DYNAMIC FUTURISTIC BENTO GRID */
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 0.4rem;
          flex-shrink: 0;
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
          border-radius: 14px;
          padding: 0.5rem 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 4px 15px -5px rgba(51, 65, 85, 0.05);
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
          height: 3px;
          opacity: 0.85;
        }

        /* Neon gradient headers for each card type */
        .glass-glow-blue::after { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
        .glass-glow-green::after { background: linear-gradient(90deg, #10b981, #34d399); }
        .glass-glow-rose::after { background: linear-gradient(90deg, #f43f5e, #fb7185); }
        .glass-glow-gold::after { background: linear-gradient(90deg, #eab308, #facc15); }

        .hud-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 10px 20px -5px rgba(51, 65, 85, 0.08);
        }

        .hud-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.25rem;
        }

        .icon-wrapper {
          width: 28px;
          height: 28px;
          border-radius: 8px;
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
          transform: scale(1.05) rotate(3deg);
        }

        .hud-title {
          font-size: 0.58rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .big-value {
          font-size: 1.15rem;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.1;
          letter-spacing: -0.5px;
          margin-bottom: 0.15rem;
        }
        .big-value.text-green { color: #059669; }
        .big-value.text-blue { color: #2563eb; }
        .big-value.text-amber { color: #d97706; }
        .big-value.text-rose { color: #e11d48; }

        .currency {
          font-size: 0.7rem;
          font-weight: 800;
          color: #94a3b8;
          margin-left: 0.1rem;
        }

        .hud-sub {
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .indicator {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }
        .indicator.active-pulse {
          background: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }

        .progress-bar-container {
          background: #f1f5f9;
          height: 4px;
          border-radius: 99px;
          overflow: hidden;
          margin-top: 0.4rem;
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
          font-size: 1.15rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        .radial-desc {
          font-size: 0.58rem;
          color: #64748b;
          font-weight: 600;
        }

        .radial-bar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          transition: transform 0.4s ease;
        }
        .hud-card:hover .radial-bar {
          transform: scale(1.04) rotate(15deg);
        }
        .radial-bar::after {
          content: '';
          position: absolute;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
        }

        /* 📊 SPLIT SCREEN LAYOUT */
        .main-content-layout {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 0.5rem;
          flex: 1;
          min-height: 0;
        }

        @media (max-width: 768px) {
          .main-content-layout {
            grid-template-columns: 1fr;
            overflow-y: auto;
          }
        }

        .left-column-layout {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-height: 0;
        }

        .right-column-layout {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-height: 0;
        }

        /* 🚚 LIVE INTERACTIVE CONTROL DECK Layout */
        .dispatch-stream-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 10px 25px -10px rgba(51, 65, 85, 0.05);
          padding: 0.5rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          flex: 1;
        }

        .stream-header {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .header-left h3 {
          font-size: 1.05rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.3px;
        }

        .pulse-text {
          color: #3b82f6;
          animation: text-pulse 2s infinite;
        }
        @keyframes text-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }

        .search-and-filter {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .search-box-wrapper {
          background: rgba(248, 250, 252, 0.8);
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.4rem 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          min-width: 200px;
          transition: all 0.3s ease;
        }
        .search-box-wrapper:focus-within {
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
        }
        .search-box-wrapper input {
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          font-size: 0.82rem;
          color: #0f172a;
          font-weight: 600;
        }

        .status-toggles {
          display: flex;
          gap: 0.25rem;
          background: #f1f5f9;
          padding: 0.25rem;
          border-radius: 10px;
        }
        .toggle-btn {
          border: none;
          background: transparent;
          font-size: 0.75rem;
          font-weight: 800;
          color: #64748b;
          padding: 0.3rem 0.6rem;
          border-radius: 7px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .toggle-btn.active {
          background: white;
          color: #01562c;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }

        .stream-table-wrapper {
          flex: 1;
          overflow-y: auto;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
        }

        .dispatch-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .dispatch-table th {
          font-size: 0.65rem;
          font-weight: 900;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 0.4rem 0.5rem;
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .dispatch-table td {
          padding: 0.4rem 0.5rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
          font-size: 0.78rem;
        }

        .dispatch-row {
          cursor: pointer;
          transition: all 0.2s ease;
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
          font-size: 0.85rem;
          margin-bottom: 0.1rem;
        }
        .batch-tag {
          font-size: 0.62rem;
          font-weight: 800;
          color: #475569;
          background: #f1f5f9;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
        }

        .client-name {
          font-weight: 800;
          color: #1e293b;
        }
        .branch-tag {
          font-size: 0.65rem;
          font-weight: 800;
          color: #01562c;
        }

        .salesman-tag {
          font-size: 0.68rem;
          font-weight: 800;
          color: #2563eb;
          background: rgba(37, 99, 235, 0.08);
          padding: 0.2rem 0.5rem;
          border-radius: 8px;
          width: fit-content;
        }

        .status-badge-premium {
          font-size: 0.65rem;
          font-weight: 900;
          padding: 0.2rem 0.6rem;
          border-radius: 99px;
          display: inline-block;
          letter-spacing: 0.25px;
        }
        .status-badge-premium.pending { background: rgba(234, 88, 12, 0.08); color: #ea580c; }
        .status-badge-premium.in_transit, .status-badge-premium.dispatched { background: rgba(37, 99, 235, 0.08); color: #2563eb; }
        .status-badge-premium.delivered { background: rgba(16, 185, 129, 0.08); color: #059669; }
        .status-badge-premium.returned { background: rgba(244, 63, 94, 0.08); color: #e11d48; }

        .dispatch-date-cell {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .load-value {
          font-size: 0.9rem;
          font-weight: 900;
          color: #0f172a;
        }
        .load-value .unit {
          font-size: 0.68rem;
          color: #94a3b8;
        }

        /* RIGHT PANEL: Selected Order Pulse */
        .dispatch-pulse-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 10px 25px -10px rgba(51, 65, 85, 0.05);
          padding: 0.5rem 0.75rem;
          display: flex;
          flex-direction: column;
          flex: 1.2;
          gap: 0.4rem;
        }

        .no-selected-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          text-align: center;
          color: #64748b;
          padding: 1.5rem;
        }
        .placeholder-icon {
          color: #cbd5e1;
          margin-bottom: 0.75rem;
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .no-selected-placeholder h4 {
          font-size: 1rem;
          font-weight: 900;
          color: #1e293b;
          margin: 0 0 0.4rem 0;
          letter-spacing: -0.3px;
        }
        .no-selected-placeholder p {
          font-size: 0.78rem;
          line-height: 1.5;
          max-width: 260px;
        }

        .pulse-detail-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          height: 100%;
          min-height: 0;
        }

        .logistics-chain-header {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .logistics-chain-header h4 {
          font-size: 0.72rem;
          font-weight: 900;
          color: #475569;
          letter-spacing: 0.5px;
          margin: 0;
        }

        .chain-visual {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          padding: 0 0.25rem;
        }

        .chain-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          z-index: 2;
        }

        .node-icon {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        }
        .node-icon.bg-green { background: #10b981; }
        .node-icon.bg-blue { background: #3b82f6; }
        .node-icon.bg-slate { background: #94a3b8; }

        .node-label {
          font-size: 0.62rem;
          font-weight: 800;
          color: #475569;
        }

        .chain-line {
          height: 3px;
          flex: 1;
          margin: 0 -4px;
          margin-bottom: 0.85rem;
          z-index: 1;
        }
        .chain-line.bg-green { background: #10b981; }
        .chain-line.bg-slate { background: #cbd5e1; }

        .specs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.3rem;
          background: #f8fafc;
          padding: 0.4rem 0.6rem;
          border-radius: 10px;
          border: 1px solid #f1f5f9;
        }

        .spec-item {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }
        .spec-label {
          font-size: 0.62rem;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.25px;
        }
        .spec-val {
          font-size: 0.82rem;
          font-weight: 900;
          color: #1e293b;
        }
        .spec-val.text-green {
          color: #01562c;
        }

        .status-pill {
          font-size: 0.68rem;
          font-weight: 900;
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          width: fit-content;
          letter-spacing: 0.15px;
        }
        .status-pill.pending { background: rgba(234, 88, 12, 0.08); color: #ea580c; }
        .status-pill.in_transit, .status-pill.dispatched { background: rgba(37, 99, 235, 0.08); color: #2563eb; }
        .status-pill.delivered { background: rgba(16, 185, 129, 0.08); color: #059669; }
        .status-pill.returned { background: rgba(244, 63, 94, 0.08); color: #e11d48; }

        .action-buttons-wrapper {
          margin-top: 0.2rem;
        }

        .btn-action {
          border: none;
          padding: 0.35rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 800;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-action.dispatch-btn { background: #3b82f6; }
        .btn-action.dispatch-btn:hover { background: #2563eb; transform: translateY(-1px); }
        .btn-action.deliver-btn { background: #10b981; }
        .btn-action.deliver-btn:hover { background: #059669; transform: translateY(-1px); }

        .completed-log-tag {
          font-size: 0.75rem;
          font-weight: 800;
          color: #10b981;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .dispatch-items-list-container {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          flex: 1;
          min-height: 0;
        }
        .dispatch-items-list-container h5 {
          font-size: 0.68rem;
          font-weight: 900;
          color: #475569;
          letter-spacing: 0.5px;
          margin: 0;
        }

        .small-items-list {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          max-height: 180px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .dispatch-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.3rem 0.5rem;
          background: rgba(248, 250, 252, 0.8);
          border-radius: 8px;
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
          font-size: 0.78rem;
          font-weight: 800;
          color: #1e293b;
        }
        .unit-price-tag {
          font-size: 0.65rem;
          font-weight: 600;
          color: #94a3b8;
        }
        .item-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .loaded-qty {
          font-size: 0.68rem;
          font-weight: 800;
          color: #475569;
          background: #e2e8f0;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
        }
        .item-total-price {
          font-size: 0.78rem;
          font-weight: 900;
          color: #1e293b;
        }

        /* 🔮 PREDICTIVE RETURNS TRACKER CARD */
        .returns-pulse-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 10px 25px -10px rgba(51, 65, 85, 0.05);
          padding: 0.5rem 0.75rem;
          display: flex;
          flex-direction: column;
          flex: 0.8;
          gap: 0.3rem;
        }

        .returns-pulse-card h3 {
          font-size: 0.85rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.3px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .returns-tracker-list {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          max-height: 220px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .tracker-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.7);
          padding: 0.35rem 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .tracker-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 15px -5px rgba(51, 65, 85, 0.08);
        }

        .tracker-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .salesman-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .salesman-avatar {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: rgba(1, 86, 44, 0.08);
          color: #01562c;
          font-weight: 900;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 -2px 4px rgba(0,0,0,0.03);
        }

        .salesman-meta .name {
          font-size: 0.85rem;
          font-weight: 900;
          color: #1e293b;
          display: block;
        }
        .salesman-meta .destination {
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 700;
          display: block;
        }

        .timer-badge {
          font-size: 0.65rem;
          font-weight: 900;
          padding: 0.15rem 0.45rem;
          border-radius: 6px;
          letter-spacing: 0.15px;
        }
        .timer-badge.active { background: rgba(16, 185, 129, 0.08); color: #10b981; }
        .timer-badge.scheduled { background: #f8fafc; color: #64748b; border: 1px dashed #cbd5e1; }

        .route-bar {
          background: #f1f5f9;
          height: 6px;
          border-radius: 99px;
          position: relative;
          margin-bottom: 0.25rem;
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
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .time-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.68rem;
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
          height: 120px;
          color: #3b82f6;
        }
        .loading-spinner-area p {
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }
        .loading-spinner-area-small {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: #64748b;
          padding: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .no-records-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 120px;
          color: #94a3b8;
          text-align: center;
        }
        .no-records-area p {
          font-size: 0.8rem;
          margin-top: 0.5rem;
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
          grid-template-columns: 1.5fr 1fr;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .analytics-charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .analytics-chart-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 14px;
          padding: 0.4rem 0.6rem;
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 6px 15px -10px rgba(51, 65, 85, 0.05);
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
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
          height: 3px;
          opacity: 0.85;
        }

        .analytics-chart-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 10px 20px -8px rgba(51, 65, 85, 0.08);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-icon-title {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .header-icon-title h4 {
          font-size: 0.85rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.3px;
        }

        .chart-sub {
          font-size: 0.62rem;
          color: #64748b;
          font-weight: 600;
          margin: 0.02rem 0 0 0;
        }

        .icon-wrapper.small {
          width: 22px;
          height: 22px;
          border-radius: 6px;
        }

        .chart-body {
          position: relative;
        }

        .empty-chart-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 140px;
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 600;
          gap: 0.25rem;
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

        .custom-pie-legend {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.3rem 0.5rem;
          margin-top: 0.3rem;
          width: 100%;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.68rem;
          font-weight: 800;
          color: #475569;
          white-space: nowrap;
        }
        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .legend-label {
          color: #475569;
        }
        .legend-val {
          color: #94a3b8;
        }

        .pagination-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.8rem 0.25rem 0.2rem 0.25rem;
          border-top: 1px solid #e2e8f0;
          margin-top: 0.5rem;
          flex-shrink: 0;
        }
        .pagination-info {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 600;
        }
        .pagination-info b {
          color: #0f172a;
        }
        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .pagination-arrow {
          border: 1px solid #cbd5e1;
          background: white;
          color: #475569;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.15rem;
          cursor: pointer;
          font-weight: 700;
          transition: all 0.2s ease;
        }
        .pagination-arrow:hover:not(:disabled) {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .pagination-arrow:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .page-indicator {
          font-size: 0.8rem;
          color: #475569;
          font-weight: 600;
          margin: 0 0.6rem;
        }
        .page-indicator b {
          color: #0f172a;
        }

        /* 🏢 PARTNER PORTAL SPECIFIC STYLING */
        .partner-analytics-portal {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .portal-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: white;
          padding: 0.75rem 1.25rem;
          border-radius: 14px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 4px 15px -5px rgba(51, 65, 85, 0.05);
          flex-wrap: wrap;
        }
        .partner-date-filter {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-left: auto;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.4rem 0.75rem;
          color: #64748b;
        }
        .partner-date-input {
          border: 1px solid #e2e8f0;
          border-radius: 7px;
          padding: 0.3rem 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: #1e293b;
          background: white;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .partner-date-input:focus {
          border-color: #01562c;
        }
        .partner-date-sep {
          font-size: 0.8rem;
          color: #94a3b8;
          font-weight: 700;
        }
        .partner-date-clear {
          background: #fee2e2;
          color: #e11d48;
          border: none;
          border-radius: 6px;
          padding: 0.25rem 0.6rem;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .partner-date-clear:hover {
          background: #fecdd3;
        }
        .btn-back {
          border: 1px solid #cbd5e1;
          background: white;
          color: #475569;
          font-weight: 700;
          font-size: 0.78rem;
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          transition: all 0.2s ease;
        }
        .btn-back:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #94a3b8;
        }
        .partner-title-area {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .partner-avatar {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(1, 86, 44, 0.08);
          color: #01562c;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .partner-title-area h2 {
          font-size: 1.2rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.3px;
        }
        .partner-badge {
          font-size: 0.68rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .portal-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #01562c;
          gap: 0.5rem;
        }
        .portal-loading p {
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;
        }
        .portal-content {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .partner-bento {
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        }
        @media (min-width: 1200px) {
          .partner-bento {
            grid-template-columns: repeat(7, 1fr);
          }
        }
        .font-bold {
          font-weight: 800;
        }
        .link-style {
          cursor: pointer;
          color: #01562c;
          text-decoration: underline;
          text-underline-offset: 2px;
          font-weight: 800;
        }
        .link-style:hover {
          color: #0369a1;
        }
      `}</style>
);

export default DispatchDashboardPage;
