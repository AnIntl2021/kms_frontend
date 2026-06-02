import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart2, 
  Activity,
  BadgeCent,
  Zap,
  Download,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ShieldAlert,
  Flame,
  Clock,
  X
} from 'lucide-react';
import api from '../api/axios';
import { useLanguage } from '../hooks/useLanguage';

const AnalyticsPage = () => {
  const { t, language } = useLanguage();
  const [forecasting, setForecasting] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5;

  // Opportunity Details Modal States
  const [selectedOpp, setSelectedOpp] = useState<any | null>(null);
  const [oppItemsLoading, setOppItemsLoading] = useState(false);
  const [oppSoldItems, setOppSoldItems] = useState<any[]>([]);
  const [oppReturnedItems, setOppReturnedItems] = useState<any[]>([]);
  const [oppProductBreakdown, setOppProductBreakdown] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);


  
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [foreRow, healthRow, vendorsRow] = await Promise.all([
        api.get('/analytics/forecasting'),
        api.get('/analytics/health'),
        api.get('/vendors').catch(() => ({ data: { data: [] } }))
      ]);
      
      const clientVendors = (vendorsRow.data.data || []).filter((v: any) => v.type === 'client');
      const clientIds = new Set(clientVendors.map((v: any) => String(v.vendor_id)));
      
      // Filter out non-client vendors (such as suppliers)
      const filteredForecasting = (foreRow.data.data.forecasting || []).filter((f: any) => 
        clientIds.has(String(f.vendor_id))
      );
      
      setForecasting(filteredForecasting);
      setHealth(healthRow.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Generate a detailed CSV export for the user
    const headers = [
      t('partner_name'), 
      t('sales_velocity'), 
      t('forecasted_return_rate'), 
      t('optimal_next_dispatch'), 
      t('expected_savings') + ' (KD)', 
      t('priority'), 
      t('adjustment_recommendation')
    ];
    const rows = forecasting.map(f => {
      const vName = language === 'ar' ? (f.vendor_name_ar || f.vendor_name) : f.vendor_name;
      const displayName = f.branch_name ? `${vName} - ${f.branch_name}` : vName;
      return [
      displayName,
      f.sales_velocity + ' ' + t('units') + '/day',
      f.return_rate + '%',
      f.optimal_dispatch + ' ' + t('units'),
      parseFloat(f.expected_savings || '0').toFixed(3),
      f.priority,
      t(f.recommendation.toLowerCase().replace(' ', '_'))
      ];
    });
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF" // Add UTF-8 BOM for Excel
      + headers.join(",") + "\n"
      + rows.map(e => e.map(val => `"${val}"`).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FNF_Predictive_Forecasting_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEfficiencyScore = () => {
      if (!health || !health.total_produced) return 0;
      const efficiency = ((health.total_produced - (health.total_wasted || 0)) / health.total_produced) * 100;
      return Math.round(efficiency);
  };

  const handleOpenOpportunityDetails = async (opp: any) => {
    setSelectedOpp(opp);
    setOppItemsLoading(true);
    setOppSoldItems([]);
    setOppReturnedItems([]);
    setOppProductBreakdown([]);
    try {
      const [perfRes, wastageRes] = await Promise.all([
        api.get(`/reports/products?vendor_id=${opp.vendor_id}`).catch(() => ({ data: { data: [] } })),
        api.get(`/reports/wastage?vendor_id=${opp.vendor_id}`).catch(() => ({ data: { data: [] } }))
      ]);
      
      const perfData = perfRes.data?.data || perfRes.data || [];
      const wastageData = wastageRes.data?.data || wastageRes.data || [];
      
      // Calculate the optimization ratio: how much to scale each product's dispatch
      // optimal_dispatch is per day; sales_velocity is actual daily avg sold
      const currentDailyVelocity = parseFloat(opp.sales_velocity || '1') || 1;
      const optimalDaily = parseFloat(opp.optimal_dispatch || '0') || currentDailyVelocity;
      const optimizationRatio = optimalDaily / currentDailyVelocity;

      // Build wastage lookup by product name
      const wastageByProduct: any = {};
      wastageData.forEach((item: any) => {
        const key = language === 'ar' ? (item.product_name_ar || item.product_name) : item.product_name;
        if (!wastageByProduct[key]) {
          wastageByProduct[key] = { qty: 0, loss: 0, costPrice: Number(item.cost_price || 0) };
        }
        wastageByProduct[key].qty += Number(item.quantity || 0);
        wastageByProduct[key].loss += Number(item.quantity || 0) * Number(item.cost_price || 0);
      });

      // Process sold items
      const soldMap: any = {};
      perfData.forEach((item: any) => {
        const key = language === 'ar' ? (item.name_ar || item.name_en) : item.name_en;
        if (!soldMap[key]) {
          soldMap[key] = { name: key, qty: 0, revenue: 0, returnsQty: Number(item.returns_qty || 0) };
        }
        soldMap[key].qty += Number(item.total_sold || 0);
        soldMap[key].revenue += Number(item.revenue || 0);
        soldMap[key].returnsQty += Number(item.returns_qty || 0);
      });

      // Build unified per-product breakdown: current dispatched qty vs suggested qty
      const productBreakdown: any[] = perfData
        .filter((item: any) => Number(item.total_sold || 0) > 0 || Number(item.returns_qty || 0) > 0)
        .map((item: any) => {
          const name = language === 'ar' ? (item.name_ar || item.name_en) : item.name_en;
          const soldQty = Number(item.total_sold || 0);
          const returnedQty = Number(item.returns_qty || 0);
          // Total dispatched = sold + returned (what was actually sent out)
          const totalDispatched = soldQty + returnedQty;
          // Suggested qty = apply optimization ratio to total dispatched
          const suggestedQty = Math.round(totalDispatched * optimizationRatio);
          const wastageInfo = wastageByProduct[name] || { qty: 0, loss: 0, costPrice: 0 };
          const potentialSaving = wastageInfo.costPrice > 0 
            ? (wastageInfo.qty - Math.round(wastageInfo.qty * optimizationRatio)) * wastageInfo.costPrice
            : 0;
          return {
            name,
            totalDispatched,
            soldQty,
            returnedQty: returnedQty + wastageInfo.qty,
            suggestedQty,
            potentialSaving: Math.max(0, potentialSaving),
            revenue: Number(item.revenue || 0),
          };
        })
        .sort((a: any, b: any) => b.totalDispatched - a.totalDispatched)
        .slice(0, 8);

      setOppProductBreakdown(productBreakdown);

      // Legacy lists for the bottom section
      setOppSoldItems(Object.values(soldMap).sort((a: any, b: any) => b.qty - a.qty).slice(0, 5));
      const returnedMap: any = {};
      wastageData.forEach((item: any) => {
        const key = language === 'ar' ? (item.product_name_ar || item.product_name) : item.product_name;
        if (!returnedMap[key]) {
          returnedMap[key] = { name: key, qty: 0, loss: 0 };
        }
        returnedMap[key].qty += Number(item.quantity || 0);
        returnedMap[key].loss += Number(item.quantity || 0) * Number(item.cost_price || 0);
      });
      setOppReturnedItems(Object.values(returnedMap).sort((a: any, b: any) => b.qty - a.qty).slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch opportunity items:', error);
    } finally {
      setOppItemsLoading(false);
    }
  };

  // Helper to render bars for SVG Chart with modern gradient and tooltips
  const renderProfitBars = () => {
      // Get top 6 stores by sales
      const sorted = [...forecasting].sort((a, b) => parseFloat(b.recent_sales || '0') - parseFloat(a.recent_sales || '0')).slice(0, 6);
      if (sorted.length === 0) return null;

      const maxSales = Math.max(...sorted.map(s => parseFloat(s.recent_sales || '0')), 1);
      
      return sorted.map((s, idx) => {
          const height = (parseFloat(s.recent_sales || '0') / maxSales) * 100;
          const salesVal = parseFloat(s.recent_sales || '0').toFixed(3);
          let name = language === 'ar' ? (s.vendor_name_ar || s.vendor_name) : s.vendor_name;
          if (s.branch_name) name = `${name} (${s.branch_name})`;
          const displayName = name.length > 12 ? name.substring(0, 10) + '..' : name;
          return (
              <div key={idx} className="chart-bar-v group" onClick={() => handleOpenOpportunityDetails(s)}>
                  <div className="bar-tooltip">
                    <span className="tooltip-store">{name}</span>
                    <span className="tooltip-val">{salesVal} KD</span>
                  </div>
                  <div className="bar-label">{parseFloat(s.recent_sales || '0').toFixed(1)}</div>
                  <div className="bar-fill-container">
                    <div className="bar-fill" style={{ height: `${height}%` }}></div>
                  </div>
                  <div className="bar-title" title={name}>{displayName}</div>
              </div>
          );
      });
  };

  const totalExpectedSavings = forecasting.reduce((acc, curr) => acc + parseFloat(curr.expected_savings || '0'), 0);

  // Pagination bounds
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = forecasting.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(forecasting.length / entriesPerPage);

  return (
    <Layout title={t('analytics_bi')}>
      <div className="dispatch-dashboard-hud animated fadeIn">
        {loading ? (
            <div className="analytics-loading">
               <Activity className="spin" size={48} />
               <p>{t('calculating_profits_loss')}</p>
            </div>
        ) : (
          <>
            {/* 🩺 DYNAMIC BENTO GAUGE GRID */}
            <div className="bento-grid animated slideInUp">
                {/* 1. Manufacturing Health Score Gauge */}
                <div className="hud-card glass-glow-green">
                    <div className="hud-header">
                      <div className="icon-wrapper bg-green">
                        <Activity size={14} />
                      </div>
                      <span className="hud-title">{t('mfg_health_score')}</span>
                    </div>
                    <div className="hud-body-radial">
                      <div className="radial-content">
                        <span className="radial-number">{getEfficiencyScore()}%</span>
                        <span className="radial-desc">{t('system_efficiency_index')}</span>
                      </div>
                      <div 
                        className="radial-bar" 
                        style={{ background: `conic-gradient(#10b981 ${getEfficiencyScore()}%, #f1f5f9 ${getEfficiencyScore()}%)` }}
                      ></div>
                    </div>
                </div>

                {/* 2. Total Settled Revenue */}
                <div className="hud-card glass-glow-blue">
                    <div className="hud-header">
                      <div className="icon-wrapper bg-blue">
                        <ShoppingBag size={14} />
                      </div>
                      <span className="hud-title">{t('total_settled_revenue')}</span>
                    </div>
                    <div className="hud-body">
                      <div className="big-value">
                        {parseFloat(health?.total_revenue_7d || '0').toFixed(3)}
                        <span className="currency">{t('kd_currency')}</span>
                      </div>
                      <div className="hud-sub">
                        <span className="indicator active-pulse"></span>
                        <span>7D Performance</span>
                      </div>
                    </div>
                </div>

                {/* 3. Total Production Cost */}
                <div className="hud-card glass-glow-blue">
                    <div className="hud-header">
                      <div className="icon-wrapper bg-blue">
                        <Activity size={14} />
                      </div>
                      <span className="hud-title">{t('total_production_cost')}</span>
                    </div>
                    <div className="hud-body">
                      <div className="big-value">
                        {parseFloat(health?.total_production_cost_7d || '0').toFixed(3)}
                        <span className="currency">{t('kd_currency')}</span>
                      </div>
                      <div className="hud-sub">
                        <span>7D Mfg Cost</span>
                      </div>
                    </div>
                </div>

                {/* 4. Total Returns Loss */}
                <div className="hud-card glass-glow-rose">
                    <div className="hud-header">
                      <div className="icon-wrapper bg-rose">
                        <TrendingDown size={14} />
                      </div>
                      <span className="hud-title">{t('total_returns_loss')}</span>
                    </div>
                    <div className="hud-body">
                      <div className="big-value text-rose">
                        {parseFloat(health?.total_returns_7d || '0').toFixed(3)}
                        <span className="currency">{t('kd_currency')}</span>
                      </div>
                      <div className="hud-sub">
                        <span>7D Returns Deficit</span>
                      </div>
                    </div>
                </div>

                {/* 5. Net Profit (Cyan Glow highlight) */}
                <div className="hud-card glass-glow-cyan bg-glow-card">
                    <div className="hud-header">
                      <div className="icon-wrapper bg-cyan">
                        <TrendingUp size={14} />
                      </div>
                      <span className="hud-title">{t('net_profit')}</span>
                    </div>
                    <div className="hud-body">
                      <div className="big-value text-cyan">
                        {parseFloat(health?.total_profit_7d || '0').toFixed(3)}
                        <span className="currency">{t('kd_currency')}</span>
                      </div>
                      <div className="hud-sub">
                        <span>Net Post Returns</span>
                      </div>
                    </div>
                </div>

                {/* 6. Expired Wastage (Loss Value) */}
                <div className="hud-card glass-glow-rose">
                    <div className="hud-header">
                      <div className="icon-wrapper bg-rose">
                        <ShieldAlert size={14} />
                      </div>
                      <span className="hud-title">{t('expired_wastage_potential')}</span>
                    </div>
                    <div className="hud-body">
                      <div className="big-value text-rose">
                        {parseFloat(health?.total_loss_kwd || '0').toFixed(3)}
                        <span className="currency">{t('kd_currency')}</span>
                      </div>
                      <div className="hud-sub">
                        <span>{health?.total_wasted || 0} {t('units')} lost</span>
                      </div>
                    </div>
                </div>

                {/* 7. Expected Savings (AI Forecast) */}
                <div className="hud-card glass-glow-green">
                    <div className="hud-header">
                      <div className="icon-wrapper bg-green">
                        <Sparkles size={14} />
                      </div>
                      <span className="hud-title">{t('expected_savings')}</span>
                    </div>
                    <div className="hud-body">
                      <div className="big-value text-green">
                        {totalExpectedSavings.toFixed(3)}
                        <span className="currency">{t('kd_currency')}</span>
                      </div>
                      <div className="hud-sub">
                        <span>AI Recovery Potential</span>
                      </div>
                    </div>
                </div>
            </div>

            {/* 📊 SPLIT SCREEN LAYOUT */}
            <div className="main-content-layout animated slideInUp delay-100">
              
              {/* LEFT COLUMN: forecasting table + strategy deck */}
              <div className="left-column-layout">
                
                <div className="dispatch-stream-card">
                  <div className="stream-header-horizontal">
                    <div className="header-left">
                      <Sparkles className="pulse-text" size={16} />
                      <h3>{t('leak_growth_forecast')}</h3>
                    </div>
                    <button className="btn-export-premium" onClick={handleExport}>
                      <Download size={12} />
                      <span>{t('export_bi_report')}</span>
                    </button>
                  </div>
                  
                  <div className="stream-table-wrapper">
                    <table className="analytics-table-premium">
                      <thead>
                        <tr>
                          <th>{t('store_name')}</th>
                          <th>{t('sales_velocity')}</th>
                          <th>{t('forecasted_return_rate')}</th>
                          <th>{t('optimal_next_dispatch')}</th>
                          <th>{t('expected_savings')}</th>
                          <th>{t('adjustment_recommendation')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentEntries.length > 0 ? currentEntries.map((store) => {
                          const name = language === 'ar' ? (store.vendor_name_ar || store.vendor_name) : store.vendor_name;
                          
                          // Set colors based on return rate safety margins
                          let returnRateColor = 'rate-healthy';
                          if (store.return_rate > 15) returnRateColor = 'rate-critical';
                          else if (store.return_rate > 5) returnRateColor = 'rate-medium';

                          return (
                            <tr key={store.vendor_id} className="clickable-row" onClick={() => handleOpenOpportunityDetails(store)} title="Click to view detailed Actionable Optimization recommendations">
                              <td className="store-cell">
                                <div className="store-name-container">
                                  <span className="store-avatar">{name.charAt(0).toUpperCase()}</span>
                                  <div className="store-details">
                                    <div className="store-info">
                                      <strong>{name}</strong>
                                      {store.branch_name ? (
                                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>
                                          <MapPin size={10} style={{ display: 'inline', marginRight: '2px' }} /> {store.branch_name}
                                        </span>
                                      ) : (
                                        <span className={`status-badge-premium ${store.priority === 'Stable' ? 'delivered' : 'returned'}`}>
                                          {store.priority.toUpperCase()}
                                        </span>
                                      )}
                                      {!store.branch_name && (
                                        <div style={{ marginTop: '4px' }}></div>
                                      )}
                                      {store.branch_name && (
                                        <span className={`status-badge-premium ${store.priority === 'Stable' ? 'delivered' : 'returned'}`} style={{ marginTop: '4px' }}>
                                          {store.priority.toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              
                              {/* Sales Velocity */}
                              <td className="sales-velocity-cell">
                                <span className="velocity-badge">
                                  {store.sales_velocity} <small>{t('units')}/{t('today')}</small>
                                </span>
                              </td>

                              {/* Return Rate Progress Pills */}
                              <td className="return-rate-cell">
                                <div className="rate-flex">
                                  <div className="rate-progress-bar">
                                    <div className={`rate-progress-fill ${returnRateColor}`} style={{ width: `${Math.min(100, store.return_rate)}%` }}></div>
                                  </div>
                                  <span className={`rate-text ${returnRateColor}`}>
                                    {store.return_rate}%
                                  </span>
                                </div>
                              </td>

                              {/* Optimal Next Dispatch */}
                              <td className="optimal-dispatch-cell">
                                <div className="optimal-units">
                                  <span className="units-value">{store.optimal_dispatch}</span>
                                  <span className="units-label">{t('units')}</span>
                                </div>
                              </td>

                              {/* Expected Cost Savings */}
                              <td className="savings-cell">
                                {parseFloat(store.expected_savings || '0') > 0 ? (
                                  <span className="savings-badge">
                                    <Sparkles size={11} className="sparkle-gold" />
                                    {parseFloat(store.expected_savings).toFixed(3)} {t('kd_currency')}
                                  </span>
                                ) : (
                                  <span className="no-savings">{t('no_loss')}</span>
                                )}
                              </td>

                              {/* Adjustment Recommendation */}
                              <td>
                                <div className={`recommendation-badge-premium ${store.actionColor}`}>
                                   {store.recommendation === 'EXPAND SUPPLY' ? <TrendingUp size={12} /> : 
                                    store.recommendation === 'REDUCE DISPATCH' ? <TrendingDown size={12} /> : 
                                    <Activity size={12} />}
                                   <span>{t(store.recommendation.toLowerCase().replace(' ', '_'))} ({store.adjustmentScore > 0 ? '+' : ''}{store.adjustmentScore}%)</span>
                                </div>
                              </td>
                            </tr>
                          );
                        }) : (
                          <tr><td colSpan={6} style={{textAlign:'center', padding:'3rem'}}>{t('no_data_analytical_msg')}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* 📊 Premium Pagination Controls */}
                  {forecasting.length > entriesPerPage && (
                    <div className="pagination-wrapper">
                      <span className="pagination-info">
                        Showing <b>{indexOfFirstEntry + 1}</b> to <b>{Math.min(indexOfLastEntry, forecasting.length)}</b> of <b>{forecasting.length}</b> locations
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

                {/* Strategy Deck */}
                <div className="strategy-grid">
                  {/* GROWTH STRATEGY */}
                  <div className="strategy-card-premium green-gradient" onClick={() => {
                    const topStore = forecasting.find(f => f.adjustmentScore > 0);
                    if (topStore) handleOpenOpportunityDetails(topStore);
                  }}>
                     <div className="strat-header">
                       <div className="icon-badge bg-green-glow"><Flame size={18} /></div>
                       <h4>{t('earn_everything_back')}</h4>
                     </div>
                     <p>
                       Increase supply allocation for <b>{(() => {
                          const topStore = forecasting.find(f => f.adjustmentScore > 0);
                          if (!topStore) return 'Top Stores';
                          return language === 'ar' ? (topStore.vendor_name_ar || topStore.vendor_name) : topStore.vendor_name;
                       })()}</b> by 25% today. 
                       Their ongoing sales velocity is higher than current delivery volumes.
                     </p>
                     <div className="card-arrow-indicator"><ArrowRight size={16} /></div>
                  </div>

                  {/* LOSS PREVENTION */}
                  <div className="strategy-card-premium red-gradient" onClick={() => {
                    const topLeak = forecasting.find(f => f.priority.toLowerCase() === 'critical');
                    if (topLeak) handleOpenOpportunityDetails(topLeak);
                  }}>
                     <div className="strat-header">
                       <div className="icon-badge bg-red-glow"><ShieldAlert size={18} /></div>
                       <h4>{t('stop_the_leak')}</h4>
                     </div>
                     <p>
                       {forecasting.some(f => f.priority.toLowerCase() === 'critical') ? (
                         <>
                           Reduce dispatch orders for <b>{forecasting.filter(f => f.priority.toLowerCase() === 'critical').map(f => {
                             const n = language === 'ar' ? (f.vendor_name_ar || f.vendor_name) : f.vendor_name;
                             return f.branch_name ? `${n} (${f.branch_name})` : n;
                           }).slice(0, 1).join(', ')}</b> immediately.
                         </>
                       ) : (
                         <>Reduce delivery for stores with <b>Critical Priority</b> immediately.</>
                       )}{' '}
                       You can save approx. <b>{parseFloat(health?.total_returns_7d || '0').toFixed(1)} {t('kd_currency')}</b> this week by adjusting limits.
                     </p>
                     <div className="card-arrow-indicator"><ArrowRight size={16} /></div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: charts + optimization opportunities */}
              <div className="right-column-layout">
                
                {/* SVG Revenue Chart */}
                <div className="dispatch-stream-card">
                  <div className="stream-header">
                    <div className="header-left">
                      <BarChart2 className="text-blue" size={16} />
                      <h3>{t('top_revenue_stores_7d')}</h3>
                    </div>
                  </div>
                  <div className="main-chart-area">
                     {renderProfitBars()}
                  </div>
                </div>

                {/* AI Optimization Opportunities */}
                <div className="dispatch-stream-card">
                  <div className="stream-header">
                    <div className="header-left">
                      <Zap className="text-amber animate-pulse" size={16} />
                      <h3>{t('optimization_opportunities')}</h3>
                    </div>
                  </div>
                  <div className="opportunity-list">
                      {forecasting
                        .filter(f => f.return_rate > 10 || f.recommendation === 'EXPAND SUPPLY')
                        .sort((a, b) => b.return_rate - a.return_rate)
                        .slice(0, 3)
                        .map((f, i) => {
                           const name = language === 'ar' ? (f.vendor_name_ar || f.vendor_name) : f.vendor_name;
                           return (
                             <div key={i} className={`opp-item-premium ${f.return_rate > 15 ? 'leak' : 'growth'} clickable-opp`} onClick={() => handleOpenOpportunityDetails(f)} title="Click to view Actionable Optimization details">
                                 <div className="opp-meta">
                                     <div className="opp-store">{name}</div>
                                     <div className="opp-subtitle">
                                       {f.return_rate > 15 ? (
                                         <>
                                           {t('forecasted_return_rate')}: <span className="text-rose font-bold">{f.return_rate}%</span>
                                         </>
                                       ) : (
                                         <>
                                           {t('daily_sales_velocity')}: <span className="text-emerald font-bold">{f.sales_velocity} {t('units')}</span>
                                         </>
                                       )}
                                     </div>
                                 </div>
                                 <div className="opp-action-pill">
                                   {f.return_rate > 15 ? (
                                     <span className="pill-loss">Save {parseFloat(f.expected_savings).toFixed(1)} KD</span>
                                   ) : (
                                     <span className="pill-gain">Growth Option</span>
                                   )}
                                 </div>
                             </div>
                           );
                        })}
                      {forecasting.length === 0 && (
                        <div className="no-opportunities">{t('gathering_sales_data')}</div>
                      )}
                  </div>
                </div>

              </div>

            </div>
          </>
        )}
      </div>

      {/* 🔮 INTERACTIVE DETAILED RECOMMENDER MODAL */}
      {selectedOpp && (
        <div className="modal-overlay" onClick={() => setSelectedOpp(null)}>
          <div className="modal-card wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {language === 'ar' ? 'توصيات التحسين لـ ' : 'Optimization Recommendations for '}
                {language === 'ar' ? (selectedOpp.vendor_name_ar || selectedOpp.vendor_name) : selectedOpp.vendor_name}
              </h3>
              <button className="btn-close" onClick={() => setSelectedOpp(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              {/* Action Banner */}
              {selectedOpp.recommendation === 'REDUCE DISPATCH' ? (
                <div className="recommendation-box-glow leak">
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem', fontWeight: 900 }}>
                    <ShieldAlert size={18} />
                    <span>RECOMMENDED ACTION: REDUCE NEXT DISPATCH</span>
                  </div>
                  This location has a forecasted returned wastage rate of <b>{selectedOpp.return_rate}%</b> (<b>{selectedOpp.recent_wastage_units} units</b> over the last 7 days), leading to a financial loss of <b>{parseFloat(selectedOpp.loss_kwd || '0').toFixed(3)} KD</b>. 
                  We recommend reducing next dispatch sizes to <b>{selectedOpp.optimal_dispatch} units/day</b>. 
                  Applying this optimization will save you approximately <span style={{ textDecoration: 'underline', fontWeight: 800 }}>{parseFloat(selectedOpp.expected_savings).toFixed(3)} KD</span> every week in returns loss!
                </div>
              ) : selectedOpp.recommendation === 'EXPAND SUPPLY' ? (
                <div className="recommendation-box-glow growth">
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem', fontWeight: 900 }}>
                    <Flame size={18} />
                    <span>RECOMMENDED ACTION: EXPAND SUPPLY BY 25%</span>
                  </div>
                  This store has a healthy daily sales run-rate of <b>{selectedOpp.sales_velocity} units/day</b> with minimal returned wastage (only <b>{selectedOpp.return_rate}%</b>). 
                  This indicates strong unmet demand. We recommend expanding supply size to <b>{selectedOpp.optimal_dispatch} units/day</b> for the next run. 
                  This supply change will capture more sales and maximize net profit yield!
                </div>
              ) : (
                <div className="recommendation-box-glow stable" style={{ background: '#eff6ff', border: '1px solid #dbeafe', color: '#1e40af' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem', fontWeight: 900 }}>
                    <Activity size={18} />
                    <span>RECOMMENDED ACTION: MAINTAIN CURRENT SUPPLY</span>
                  </div>
                  This store performance is highly optimized. Wastage rate is <b>{selectedOpp.return_rate}%</b> and daily sales run-rate is <b>{selectedOpp.sales_velocity} units/day</b>. 
                  We suggest maintaining the current dispatch run size of <b>{selectedOpp.optimal_dispatch} units/day</b>.
                </div>
              )}

              {/* 📦 DISPATCH QUANTITY COMPARISON — Current vs Forecasted */}
              <div className="dispatch-compare-panel">
                <div className="dispatch-compare-title">
                  <BarChart2 size={14} />
                  <span>Dispatch Quantity: Current vs AI Forecast</span>
                </div>
                <div className="dispatch-compare-grid">
                  {/* Current Dispatch */}
                  <div className="dispatch-compare-box current">
                    <div className="dispatch-box-label">📦 Current (Last 7 Days)</div>
                    <div className="dispatch-box-value">{selectedOpp.recent_sold_units ?? Math.round((selectedOpp.sales_velocity || 0) * 7)}</div>
                    <div className="dispatch-box-sub">total units dispatched</div>
                    <div className="dispatch-box-daily">{selectedOpp.sales_velocity}/day avg</div>
                    {selectedOpp.recent_wastage_units > 0 && (
                      <div className="dispatch-box-waste">⚠️ {selectedOpp.recent_wastage_units} units returned ({selectedOpp.return_rate}% waste)</div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="dispatch-compare-arrow">
                    <ArrowRight size={20} />
                    <span className="arrow-label">AI Suggest</span>
                  </div>

                  {/* Forecasted Optimal Dispatch */}
                  <div className={`dispatch-compare-box forecast ${selectedOpp.recommendation === 'REDUCE DISPATCH' ? 'reduce' : selectedOpp.recommendation === 'EXPAND SUPPLY' ? 'expand' : 'stable'}`}>
                    <div className="dispatch-box-label">
                      {selectedOpp.recommendation === 'REDUCE DISPATCH' ? '⬇️ Forecasted (Optimized)' :
                       selectedOpp.recommendation === 'EXPAND SUPPLY' ? '⬆️ Forecasted (Growth)' :
                       '✅ Forecasted (Stable)'}
                    </div>
                    <div className="dispatch-box-value">{Math.round((selectedOpp.optimal_dispatch || 0) * 7)}</div>
                    <div className="dispatch-box-sub">recommended units/week</div>
                    <div className="dispatch-box-daily">{selectedOpp.optimal_dispatch}/day optimal</div>
                    {selectedOpp.recommendation === 'REDUCE DISPATCH' && selectedOpp.expected_savings > 0 && (
                      <div className="dispatch-box-saving">💰 Save {parseFloat(selectedOpp.expected_savings).toFixed(3)} KD/week</div>
                    )}
                    {selectedOpp.recommendation === 'EXPAND SUPPLY' && (
                      <div className="dispatch-box-gain">📈 Capture more sales revenue</div>
                    )}
                  </div>
                </div>

                {/* Impact Summary Row */}
                <div className="dispatch-impact-row">
                  {selectedOpp.recommendation === 'REDUCE DISPATCH' ? (
                    <>
                      <span className="impact-badge loss">🔴 Loss: {parseFloat(selectedOpp.loss_kwd || '0').toFixed(3)} KD this week</span>
                      <span className="impact-badge save">🟢 Potential Save: {parseFloat(selectedOpp.expected_savings || '0').toFixed(3)} KD if optimized</span>
                    </>
                  ) : selectedOpp.recommendation === 'EXPAND SUPPLY' ? (
                    <>
                      <span className="impact-badge gain">🟢 High demand detected — {selectedOpp.sales_velocity} units/day selling fast</span>
                      <span className="impact-badge neutral">📦 Increase to {selectedOpp.optimal_dispatch} units/day for max revenue</span>
                    </>
                  ) : (
                    <span className="impact-badge neutral">✅ This store is well-optimized — no action needed</span>
                  )}
                </div>

                {/* 📋 PER-PRODUCT BREAKDOWN TABLE */}
                {!oppItemsLoading && oppProductBreakdown.length > 0 && (
                  <div className="product-breakdown-section">
                    <div className="product-breakdown-header">
                      <Sparkles size={12} />
                      <span>Per-Product: Sent vs Suggested Quantities</span>
                    </div>
                    <table className="product-breakdown-table">
                      <thead>
                        <tr>
                          <th>Menu Product</th>
                          <th className="text-center">📤 Sent (7d)</th>
                          <th className="text-center">↩ Returned</th>
                          <th className={`text-center ${selectedOpp.recommendation === 'REDUCE DISPATCH' ? 'col-reduce' : 'col-expand'}`}>
                            {selectedOpp.recommendation === 'REDUCE DISPATCH' ? '⬇ AI Suggest' : selectedOpp.recommendation === 'EXPAND SUPPLY' ? '⬆ AI Suggest' : '✓ AI Suggest'}
                          </th>
                          {selectedOpp.recommendation === 'REDUCE DISPATCH' && <th className="text-center col-save">💰 Est. Save</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {oppProductBreakdown.map((p, i) => {
                          const diff = p.suggestedQty - p.totalDispatched;
                          const isReduce = diff < 0;
                          const isExpand = diff > 0;
                          return (
                            <tr key={i} className="product-breakdown-row">
                              <td className="pb-product-name">
                                <span className="pb-name-dot" style={{ background: isReduce ? '#ef4444' : isExpand ? '#10b981' : '#94a3b8' }}></span>
                                {p.name}
                              </td>
                              <td className="text-center pb-sent">{p.totalDispatched}</td>
                              <td className="text-center pb-returned">
                                {p.returnedQty > 0 ? (
                                  <span className="pb-return-badge">{p.returnedQty}</span>
                                ) : (
                                  <span className="pb-no-return">—</span>
                                )}
                              </td>
                              <td className={`text-center pb-suggest ${isReduce ? 'suggest-down' : isExpand ? 'suggest-up' : 'suggest-same'}`}>
                                {p.suggestedQty}
                                {isReduce && <span className="diff-pill red"> {diff}</span>}
                                {isExpand && <span className="diff-pill green"> +{diff}</span>}
                              </td>
                              {selectedOpp.recommendation === 'REDUCE DISPATCH' && (
                                <td className="text-center pb-saving">
                                  {p.potentialSaving > 0 ? (
                                    <span className="saving-chip">{p.potentialSaving.toFixed(3)} KD</span>
                                  ) : (
                                    <span className="pb-no-return">—</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {oppItemsLoading && (
                  <div className="pb-loading">
                    <Clock className="spin" size={16} />
                    <span>Loading product breakdown...</span>
                  </div>
                )}
              </div>

              {/* Item Telemetry Columns */}
              {oppItemsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '150px', color: 'var(--primary)', gap: '0.5rem' }}>
                  <Clock className="spin" size={24} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Analyzing store product sales telemetry...</span>
                </div>
              ) : (
                <div className="opp-details-columns">
                  
                  {/* Returned / Wasted Items Column */}
                  <div className="opp-details-column">
                    <h4>Returned items (Loss Risk)</h4>
                    {oppReturnedItems.length > 0 ? oppReturnedItems.map((item, index) => (
                      <div key={index} className="opp-details-item-row wasted">
                        <span className="opp-details-item-name">{item.name}</span>
                        <div className="opp-details-item-meta">
                          <span className="qty text-rose">{item.qty} units</span>
                          <span className="val">{parseFloat(item.loss).toFixed(3)} KD Loss</span>
                        </div>
                      </div>
                    )) : (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px' }}>
                        🎉 No returned menu products recorded!
                      </div>
                    )}
                  </div>

                  {/* Sold Items Column */}
                  <div className="opp-details-column">
                    <h4>Top selling products (Wins)</h4>
                    {oppSoldItems.length > 0 ? oppSoldItems.map((item, index) => (
                      <div key={index} className="opp-details-item-row sold">
                        <span className="opp-details-item-name">{item.name}</span>
                        <div className="opp-details-item-meta">
                          <span className="qty text-emerald">{item.qty} units</span>
                          <span className="val">{parseFloat(item.revenue).toFixed(3)} KD Sales</span>
                        </div>
                      </div>
                    )) : (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px' }}>
                        No product sales recorded yet.
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
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
          min-height: 90px;
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
        .glass-glow-cyan::after { background: linear-gradient(90deg, #06b6d4, #22d3ee); }
        .glass-glow-gold::after { background: linear-gradient(90deg, #eab308, #facc15); }

        .bg-glow-card {
          background: linear-gradient(135deg, #ecfeff 0%, rgba(255, 255, 255, 0.85) 100%) !important;
        }

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
        .icon-wrapper.bg-cyan { background: rgba(6, 180, 210, 0.08); color: #0891b2; }
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
        .big-value.text-rose { color: #e11d48; }
        .big-value.text-cyan { color: #0891b2; }

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
          grid-template-columns: 1.6fr 1fr;
          gap: 0.5rem;
          flex: 1;
          min-height: 0;
        }

        @media (max-width: 1024px) {
          .main-content-layout {
            grid-template-columns: 1fr;
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

        /* Glassmorphism Cards */
        .dispatch-stream-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 10px 25px -10px rgba(51, 65, 85, 0.05);
          padding: 0.5rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .stream-header-horizontal {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
          padding: 0.4rem 0.5rem;
        }

        .stream-header {
          border-bottom: 1px solid #f1f5f9;
          padding: 0.4rem 0.5rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .header-left h3 {
          font-size: 0.9rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
        }

        .pulse-text {
          color: #3b82f6;
          animation: text-pulse 2s infinite;
        }
        @keyframes text-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        .btn-export-premium {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          background: #0f172a;
          color: white;
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          border: none;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-export-premium:hover {
          background: #1e293b;
          transform: translateY(-1px);
        }

        /* 🔮 PREMIUM TABLE */
        .stream-table-wrapper {
          overflow-x: auto;
          margin-top: 0.25rem;
        }
        .analytics-table-premium {
          width: 100%;
          border-collapse: collapse;
          text-align: start;
        }
        .analytics-table-premium th {
          padding: 0.6rem 0.8rem;
          background: rgba(15, 23, 42, 0.02);
          color: #64748b;
          font-weight: 800;
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #f1f5f9;
        }
        .analytics-table-premium td {
          padding: 0.75rem 0.8rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
          font-size: 0.8rem;
        }
        .analytics-table-premium tbody tr:hover td {
          background: rgba(15, 23, 42, 0.015);
        }
        
        .clickable-row {
          cursor: pointer;
          transition: background 0.15s;
        }
        .clickable-row:hover td {
          background: rgba(59, 130, 246, 0.03) !important;
        }

        /* Store details avatar layout */
        .store-name-container {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .store-avatar {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #ede9d0;
          color: var(--primary);
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          border: 1px solid #e8e8c8;
        }
        .store-details {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }
        .store-details strong {
          color: #0f172a;
          font-size: 0.82rem;
          font-weight: 800;
        }
        .priority-indicator {
          font-size: 0.6rem;
          font-weight: 800;
          text-transform: uppercase;
          padding: 0.05rem 0.35rem;
          border-radius: 4px;
          width: fit-content;
        }
        .priority-indicator.critical { background: #fff1f2; color: #ef4444; border: 1px solid #ffe4e6; }
        .priority-indicator.growth-option { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }
        .priority-indicator.stable { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }

        /* Velocity Badge */
        .velocity-badge {
          background: #eff6ff;
          color: #1e40af;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          border: 1px solid #dbeafe;
          display: inline-block;
        }
        .velocity-badge small {
          font-weight: 500;
          font-size: 0.65rem;
          opacity: 0.8;
        }

        /* Return Rate Progress */
        .rate-flex {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 130px;
        }
        .rate-progress-bar {
          flex-grow: 1;
          height: 6px;
          background: #e2e8f0;
          border-radius: 99px;
          overflow: hidden;
        }
        .rate-progress-fill {
          height: 100%;
          border-radius: 99px;
        }
        .rate-progress-fill.rate-healthy { background: #10b981; }
        .rate-progress-fill.rate-medium { background: #f59e0b; }
        .rate-progress-fill.rate-critical { background: #ef4444; }

        .rate-text {
          font-size: 0.75rem;
          font-weight: 800;
          width: 32px;
          text-align: end;
        }
        .rate-text.rate-healthy { color: #10b981; }
        .rate-text.rate-medium { color: #d97706; }
        .rate-text.rate-critical { color: #ef4444; }

        /* Optimal Units */
        .optimal-units {
          display: flex;
          flex-direction: column;
        }
        .units-value {
          font-size: 0.95rem;
          font-weight: 900;
          color: #0f172a;
        }
        .units-label {
          font-size: 0.6rem;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
        }

        /* Expected savings */
        .savings-badge {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .sparkle-gold {
          color: #eab308;
        }
        .no-savings {
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 600;
        }

        /* Action Badges */
        .recommendation-badge-premium {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-weight: 800;
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          width: fit-content;
          font-size: 0.68rem;
          text-transform: uppercase;
          border: 1px solid;
        }
        .recommendation-badge-premium.emerald { background: #ecfeff; color: #0891b2; border-color: #cffafe; }
        .recommendation-badge-premium.rose { background: #fff1f2; color: #e11d48; border-color: #ffe4e6; }
        .recommendation-badge-premium.blue { background: #f0fdf4; color: #16a34a; border-color: #dcfce7; }

        /* Pagination Styles */
        .pagination-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.8rem;
          border-top: 1px solid #f1f5f9;
        }
        .pagination-info {
          font-size: 0.72rem;
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

        /* 📊 CHARTS */
        .main-chart-area { 
            height: 180px; 
            display: flex; 
            align-items: flex-end; 
            justify-content: space-between; 
            padding: 1rem 0.5rem 0.25rem 0.5rem; 
            border-bottom: 2px solid #f1f5f9;
            gap: 0.5rem;
        }
        .chart-bar-v { display: flex; flex-direction: column; align-items: center; width: 14%; gap: 0.4rem; position: relative; cursor: pointer; }
        .bar-fill-container { width: 100%; height: 110px; display: flex; align-items: flex-end; background: rgba(15, 23, 42, 0.02); border-radius: 8px; overflow: hidden; border: 1px solid #f1f5f9; }
        .bar-fill { width: 100%; background: linear-gradient(to top, var(--primary), var(--primary-light)); border-radius: 6px; transition: height 1.2s cubic-bezier(0.16, 1, 0.3, 1); min-height: 4px; box-shadow: 0 4px 10px rgba(1, 86, 44, 0.15); }
        .chart-bar-v:hover .bar-fill { background: linear-gradient(to top, var(--primary-light), #10b981); transform: scaleX(1.05); }
        .bar-label { font-size: 0.7rem; font-weight: 800; color: var(--primary); margin-bottom: 0.1rem; }
        .chart-bar-v:hover .bar-label { color: #10b981; }
        .bar-title { font-size: 0.65rem; color: #64748b; font-weight: 700; white-space: nowrap; text-align: center; width: 100%; text-overflow: ellipsis; overflow: hidden; }

        .bar-tooltip { 
          position: absolute; 
          bottom: 100%; 
          background: #0f172a; 
          color: white; 
          border-radius: 8px; 
          padding: 0.4rem 0.6rem; 
          font-size: 0.7rem; 
          display: flex; 
          flex-direction: column; 
          gap: 0.1rem; 
          opacity: 0; 
          pointer-events: none; 
          transition: all 0.2s ease;
          transform: translateY(5px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          z-index: 10;
          white-space: nowrap;
        }
        .bar-tooltip::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border-width: 4px; border-style: solid; border-color: #0f172a transparent transparent transparent; }
        .chart-bar-v:hover .bar-tooltip { opacity: 1; transform: translateY(-8px); }
        .tooltip-store { font-weight: 700; color: #f1f5f9; }
        .tooltip-val { font-weight: 800; color: #38bdf8; }

        /* OPPORTUNITIES */
        .opportunity-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .opp-item-premium { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; transition: all 0.2s; position: relative; overflow: hidden; }
        .opp-item-premium:hover { transform: translateX(4px); background: #f1f5f9; border-color: #cbd5e1; }
        
        .opp-item-premium.leak { border-left: 4px solid #ef4444; }
        .opp-item-premium.growth { border-left: 4px solid #10b981; }
        
        .opp-meta { display: flex; flex-direction: column; gap: 0.1rem; }
        .opp-store { font-weight: 800; font-size: 0.85rem; color: #0f172a; }
        .opp-subtitle { font-size: 0.7rem; color: #64748b; }
        
        .opp-action-pill { font-size: 0.68rem; font-weight: 900; padding: 0.25rem 0.5rem; border-radius: 99px; text-transform: uppercase; }
        .opp-item-premium.leak .opp-action-pill { background: rgba(239, 68, 68, 0.15); color: #f87171; }
        .opp-item-premium.growth .opp-action-pill { background: rgba(16, 185, 129, 0.15); color: #34d399; }
        
        .clickable-opp {
          cursor: pointer;
        }

        .no-opportunities { text-align: center; color: #94a3b8; font-size: 0.75rem; padding: 1.5rem; }

        /* 💡 STRATEGY DECK */
        .strategy-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        .strategy-card-premium { padding: 1.25rem; border-radius: 16px; position: relative; border: 1px solid transparent; transition: all 0.3s; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; }
        .strategy-card-premium:hover { transform: translateY(-2px); }
        .strategy-card-premium h4 { margin: 0; font-size: 0.95rem; font-weight: 900; }
        .strategy-card-premium p { margin: 0.5rem 0 0 0; font-size: 0.78rem; line-height: 1.5; }
        
        .strat-header { display: flex; align-items: center; gap: 0.6rem; }
        .icon-badge { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        
        .green-gradient { background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%); border-color: #dcfce7; color: #14532d; }
        .green-gradient:hover { box-shadow: 0 8px 20px -5px rgba(22, 163, 74, 0.08); }
        .green-gradient h4 { color: #166534; }
        .green-gradient p { color: #166534; opacity: 0.95; }
        .bg-green-glow { background: #dcfce7; color: #166534; }
        .green-gradient .card-arrow-indicator { color: #166534; }

        .red-gradient { background: linear-gradient(135deg, #fff1f2 0%, #ffffff 100%); border-color: #ffe4e6; color: #4c0519; }
        .red-gradient:hover { box-shadow: 0 8px 20px -5px rgba(225, 29, 72, 0.08); }
        .red-gradient h4 { color: #9f1239; }
        .red-gradient p { color: #9f1239; opacity: 0.95; }
        .bg-red-glow { background: #ffe4e6; color: #9f1239; }
        .red-gradient .card-arrow-indicator { color: #9f1239; }
        
        .card-arrow-indicator { margin-top: 0.75rem; display: flex; justify-content: flex-end; transition: transform 0.2s; }
        .strategy-card-premium:hover .card-arrow-indicator { transform: translateX(4px); }

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
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .modal-card.wide {
          max-width: 680px;
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
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-close:hover {
          color: #0f172a;
        }

        .modal-body {
          padding: 1.25rem;
          overflow-y: auto;
          flex: 1;
          background: #fcfcfd;
        }

        /* Recommender Modal Specs */
        .recommendation-box-glow {
          padding: 0.9rem 1.2rem;
          border-radius: 12px;
          margin-bottom: 1rem;
          font-size: 0.82rem;
          line-height: 1.6;
        }
        .recommendation-box-glow.leak {
          background: #fff1f2;
          border: 1px solid #ffe4e6;
          color: #9f1239;
        }
        .recommendation-box-glow.growth {
          background: #f0fdf4;
          border: 1px solid #dcfce7;
          color: #166534;
        }

        /* 📦 DISPATCH QUANTITY COMPARISON PANEL */
        .dispatch-compare-panel {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.9rem 1rem;
          margin-bottom: 1.25rem;
        }
        .dispatch-compare-title {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.72rem;
          font-weight: 900;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px dashed #e2e8f0;
        }
        .dispatch-compare-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 0.75rem;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .dispatch-compare-box {
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.75rem 0.9rem;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .dispatch-compare-box.current {
          border-color: #cbd5e1;
        }
        .dispatch-compare-box.forecast.reduce {
          border-color: #fca5a5;
          background: #fff8f8;
        }
        .dispatch-compare-box.forecast.expand {
          border-color: #86efac;
          background: #f0fff4;
        }
        .dispatch-compare-box.forecast.stable {
          border-color: #93c5fd;
          background: #f0f8ff;
        }
        .dispatch-box-label {
          font-size: 0.65rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 0.25rem;
        }
        .dispatch-box-value {
          font-size: 1.6rem;
          font-weight: 900;
          color: #0f172a;
          line-height: 1;
          letter-spacing: -1px;
        }
        .dispatch-box-sub {
          font-size: 0.65rem;
          color: #94a3b8;
          font-weight: 600;
        }
        .dispatch-box-daily {
          font-size: 0.7rem;
          color: #475569;
          font-weight: 700;
          margin-top: 0.2rem;
          padding: 0.2rem 0.4rem;
          background: rgba(15, 23, 42, 0.04);
          border-radius: 4px;
          width: fit-content;
        }
        .dispatch-box-waste {
          font-size: 0.65rem;
          color: #ef4444;
          font-weight: 700;
          margin-top: 0.15rem;
        }
        .dispatch-box-saving {
          font-size: 0.68rem;
          color: #16a34a;
          font-weight: 800;
          margin-top: 0.15rem;
          background: #f0fdf4;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          border: 1px solid #bbf7d0;
          width: fit-content;
        }
        .dispatch-box-gain {
          font-size: 0.68rem;
          color: #16a34a;
          font-weight: 800;
          margin-top: 0.15rem;
        }
        .dispatch-compare-arrow {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
          color: #94a3b8;
        }
        .arrow-label {
          font-size: 0.6rem;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .dispatch-impact-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid #f1f5f9;
        }
        .impact-badge {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.25rem 0.6rem;
          border-radius: 99px;
        }
        .impact-badge.loss { background: #fff1f2; color: #e11d48; border: 1px solid #ffe4e6; }
        .impact-badge.save { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .impact-badge.gain { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .impact-badge.neutral { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

        /* 📋 PER-PRODUCT BREAKDOWN TABLE */
        .product-breakdown-section {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px dashed #e2e8f0;
        }
        .product-breakdown-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.68rem;
          font-weight: 900;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 0.5rem;
        }
        .product-breakdown-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.76rem;
        }
        .product-breakdown-table th {
          background: rgba(15, 23, 42, 0.03);
          padding: 0.4rem 0.6rem;
          font-size: 0.63rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          border-bottom: 1px solid #f1f5f9;
        }
        .product-breakdown-table th.col-reduce { color: #e11d48; }
        .product-breakdown-table th.col-expand { color: #16a34a; }
        .product-breakdown-table th.col-save { color: #ca8a04; }
        .product-breakdown-table .text-center { text-align: center; }
        .product-breakdown-row td {
          padding: 0.45rem 0.6rem;
          border-bottom: 1px solid #f8fafc;
          vertical-align: middle;
        }
        .product-breakdown-row:hover td {
          background: rgba(15, 23, 42, 0.015);
        }
        .pb-product-name {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 700;
          color: #1e293b;
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pb-name-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .pb-sent {
          font-weight: 800;
          color: #0f172a;
        }
        .pb-returned .pb-return-badge {
          background: #fff1f2;
          color: #e11d48;
          border: 1px solid #ffe4e6;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 0.1rem 0.4rem;
          border-radius: 99px;
        }
        .pb-no-return {
          color: #cbd5e1;
          font-size: 0.8rem;
        }
        .pb-suggest {
          font-weight: 900;
        }
        .pb-suggest.suggest-down { color: #e11d48; }
        .pb-suggest.suggest-up { color: #16a34a; }
        .pb-suggest.suggest-same { color: #64748b; }
        .diff-pill {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.05rem 0.3rem;
          border-radius: 4px;
          margin-left: 0.2rem;
        }
        .diff-pill.red { background: #fff1f2; color: #e11d48; }
        .diff-pill.green { background: #f0fdf4; color: #16a34a; }
        .saving-chip {
          background: #fefce8;
          color: #ca8a04;
          border: 1px solid #fde68a;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 0.1rem 0.4rem;
          border-radius: 6px;
          white-space: nowrap;
        }
        .pb-loading {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.72rem;
          color: #94a3b8;
          font-weight: 600;
          padding: 0.5rem 0;
        }

        .opp-details-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-top: 1rem;
        }
        @media (max-width: 580px) {
          .opp-details-columns {
            grid-template-columns: 1fr;
          }
        }
        .opp-details-column {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .opp-details-column h4 {
          font-size: 0.72rem;
          font-weight: 900;
          color: #64748b;
          margin: 0 0 0.25rem 0;
          border-bottom: 1px dashed #e2e8f0;
          padding-bottom: 0.4rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .opp-details-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          border: 1px solid #e2e8f0;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          font-size: 0.78rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.01);
        }
        .opp-details-item-row.wasted {
          border-left: 3px solid #ef4444;
        }
        .opp-details-item-row.sold {
          border-left: 3px solid #10b981;
        }
        .opp-details-item-name {
          font-weight: 800;
          color: #334155;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .opp-details-item-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.05rem;
        }
        .opp-details-item-meta .qty {
          font-weight: 900;
        }
        .opp-details-item-meta .qty.text-rose { color: #e11d48; }
        .opp-details-item-meta .qty.text-emerald { color: #059669; }
        .opp-details-item-meta .val {
          font-size: 0.65rem;
          color: #94a3b8;
          font-weight: 700;
        }

        .analytics-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 500px; color: var(--primary); }
        .spin { animation: spin 2.5s linear infinite; margin-bottom: 1.25rem; }
        
        @keyframes spin { from {transform: rotate(0deg)} to {transform: rotate(360deg)}}
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInUp { from { transform: translateY(15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        
        .animated { animation-duration: 0.5s; animation-fill-mode: both; }
        .fadeIn { animation-name: fadeIn; }
        .slideInUp { animation-name: slideInUp; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }

        /* RTL Specifics overrides */
        [dir="rtl"] .opp-item-premium:hover { transform: translateX(-4px); }
        [dir="rtl"] .strategy-card-premium:hover .card-arrow-indicator { transform: translateX(-4px); }
        [dir="rtl"] .card-arrow-indicator { justify-content: flex-start; transform: scaleX(-1); }
      `}</style>
    </Layout>
  );
};

export default AnalyticsPage;
