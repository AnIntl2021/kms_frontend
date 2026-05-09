import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  Search, 
  TrendingUp,
  AlertTriangle,
  Package,
  ShoppingCart,
  User,
  Users,
  Truck,
  X
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Chart from 'react-apexcharts';
import { useLanguage } from '../hooks/useLanguage';

const ReportsPage = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'sales' | 'production' | 'wastage' | 'purchase' | 'products'>('sales');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSalesman, setSelectedSalesman] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVendors();
    fetchSalesmen();
  }, []);

  useEffect(() => {
    fetchReportData();
    fetchAnalytics();
  }, [activeTab, startDate, endDate, selectedVendor, selectedBranch, selectedSalesman]);

  const fetchVendors = async () => {
    try {
      const res = await api.get('/vendors');
      setVendors(res.data.data || []);
    } catch (e) {
      console.error("Failed to fetch vendors for filtering");
    }
  };

  const fetchSalesmen = async () => {
    try {
      const res = await api.get('/salesmen');
      setSalesmen(res.data.data || []);
    } catch (e) {
      console.error("Failed to fetch salesmen for filtering");
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/reports/analytics', {
        params: { 
          startDate, 
          endDate, 
          vendor_id: selectedVendor || undefined,
          branch_id: selectedBranch || undefined,
          branch: selectedBranch || undefined, // Dual-key safety
          salesman_id: selectedSalesman || undefined
        }
      });
      if (res.data && res.data.data) {
        setAnalytics(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics summary');
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/${activeTab}`, {
        params: { 
          startDate, 
          endDate, 
          vendor_id: selectedVendor || undefined,
          branch_id: selectedBranch || undefined,
          branch: selectedBranch || undefined,
          salesman_id: selectedSalesman || undefined
        }
      });
      setData(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch report data.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (data.length === 0) return toast.warning("No data to export.");
    
    let headers: string[] = [];
    let rows: any[][] = [];

    if (activeTab === 'sales') {
      headers = ["Order ID", "Customer", "Branch", "Salesman", "Date", "Total (KWD)", "Discount", "Final", "Returns", "Status"];
      rows = data.map(d => [
        `FNFI-${100000 + d.sale_id}`,
        d.vendor_name,
        d.branch_name || 'Main',
        d.salesman_name || 'N/A',
        d.report_date,
        d.total_amount,
        d.discount_percentage + '%',
        d.final_amount,
        d.returns_amount || 0,
        d.dispatch_status
      ]);
    } else if (activeTab === 'production') {
      headers = ["Batch #", "Date", "Product", "Qty Produced", "Cost Price", "Total Cost"];
      rows = data.map(d => [
        d.batch_number,
        d.report_date,
        d.product_name,
        d.quantity_produced,
        d.cost_price,
        (d.quantity_produced * d.cost_price).toFixed(3)
      ]);
    } else if (activeTab === 'purchase') {
      headers = ["PO Number", "Supplier", "Branch", "Date", "Total", "Tax", "Discount", "Final", "Status"];
      rows = data.map(d => [
        d.po_number,
        d.vendor_name,
        d.branch_name || 'Main',
        d.report_date,
        d.total_amount,
        d.tax_amount,
        d.discount_amount,
        d.final_amount,
        d.status
      ]);
    } else if (activeTab === 'products') {
      headers = ["Item Name", "Category", "Total Qty Sold", "Revenue (KWD)", "Total Cost", "Net Profit"];
      rows = data.map(d => [
        d.product_name || 'N/A',
        d.product_category || 'General',
        d.total_quantity || 0,
        Number(d.total_revenue || 0).toFixed(3),
        Number(d.total_cost || 0).toFixed(3),
        Number(d.total_profit || 0).toFixed(3)
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `FNF_${activeTab}_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = data.filter(d => {
    // 🔍 1. API REINFORCEMENT: FILTER BY VENDOR, BRANCH, SALESMAN
    // Skip these for 'products' tab as data is aggregated and already filtered by backend
    if (activeTab !== 'products') {
      const vendorMatch = !selectedVendor || String(d.vendor_id) === String(selectedVendor);
      const branchMatch = !selectedBranch || String(d.branch_id) === String(selectedBranch);
      const salesmanMatch = !selectedSalesman || String(d.salesman_id) === String(selectedSalesman);

      if (!vendorMatch || !branchMatch || !salesmanMatch) return false;
    }

    // 🔍 2. SEARCH TERM FILTER
    const searchStr = searchTerm.toLowerCase();
    if (activeTab === 'sales') {
      return (d.vendor_name?.toLowerCase().includes(searchStr) || 
              String(d.sale_id).includes(searchStr) ||
              d.order_number?.toLowerCase().includes(searchStr));
    } else if (activeTab === 'production') {
      return (d.product_name?.toLowerCase().includes(searchStr) || 
              d.batch_number?.toLowerCase().includes(searchStr));
    } else if (activeTab === 'purchase') {
      return (d.vendor_name?.toLowerCase().includes(searchStr) || 
              d.po_number?.toLowerCase().includes(searchStr));
    } else if (activeTab === 'products') {
      const pName = (d.product_name || '').toLowerCase();
      const pCat = (d.product_category || '').toLowerCase();
      return pName.includes(searchStr) || pCat.includes(searchStr);
    } else {
      const pName = (d.product_name || '').toLowerCase();
      const reasonEn = (d.reason_en || '').toLowerCase();
      const reason = (d.reason || '').toLowerCase();
      return pName.includes(searchStr) || reasonEn.includes(searchStr) || reason.includes(searchStr);
    }
  });

  // Chart Configurations
  const trendOptions: any = {
    chart: { id: 'revenue-profit-trend', toolbar: { show: false }, zoom: { enabled: false } },
    colors: ['#3b82f6', '#10b981'],
    stroke: { curve: 'smooth', width: 3 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [20, 100] } },
    xaxis: { 
      categories: analytics?.dailyTrend?.map((d: any) => d.date) || [],
      axisBorder: { show: false }, axisTicks: { show: false }
    },
    yaxis: { labels: { formatter: (val: number) => val.toFixed(2) } },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    tooltip: { x: { format: 'dd MMM' } }
  };

  const customerOptions: any = {
    chart: { toolbar: { show: false } },
    colors: ['#3b82f6'],
    plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: '40%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: analytics?.topCustomers?.map((c: any) => c.name) || [] },
    grid: { borderColor: '#f1f5f9' }
  };

  const wastageOptions: any = {
    labels: analytics?.wastageReasons?.map((r: any) => r.name) || [],
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    legend: { position: 'bottom' },
    stroke: { show: false },
    plotOptions: { pie: { donut: { size: '70%' } } }
  };

  return (
    <Layout title={t('bi_reports')}>
      <div className="reports-container">
        {/* Report Controls */}
        <div className="reports-header-card">
          <div className="filter-grid">
            <div className="filter-group">
              <label><Calendar size={14} /> {t('date_range')}</label>
              <div className="date-inputs">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <span>{t('to')}</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            {(activeTab === 'sales' || activeTab === 'wastage' || activeTab === 'purchase') && (
              <div className="filter-group">
                <label><User size={14} /> {t('filter_by_customer')}</label>
                <select 
                  className="dropdown-input" 
                  value={selectedVendor} 
                  onChange={(e) => {
                    setSelectedVendor(e.target.value);
                    setSelectedBranch(''); // Reset branch when vendor changes
                  }}
                >
                  <option value="">{activeTab === 'purchase' ? t('all_suppliers') : t('all_customers')}</option>
                  {vendors.map(v => (
                    <option key={v.vendor_id} value={v.vendor_id}>{language === 'ar' ? (v.name_ar || v.name_en) : v.name_en}</option>
                  ))}
                </select>
              </div>
            )}

            {(activeTab === 'sales' || activeTab === 'wastage' || activeTab === 'purchase') && (
              <div className="filter-group">
                <label><Truck size={14} /> {t('filter_by_branch')}</label>
                <select 
                  className="dropdown-input" 
                  value={selectedBranch} 
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  disabled={!selectedVendor}
                >
                  <option value="">{selectedVendor ? t('all_branches') : t('select_customer_first')}</option>
                  {selectedVendor && vendors.find(v => String(v.vendor_id) === String(selectedVendor))?.branches?.map((b: any) => (
                    <option key={b.branch_id || b.id} value={b.branch_id || b.id}>{language === 'ar' ? (b.name_ar || b.name_en || b.name) : (b.name_en || b.name)}</option>
                  ))}
                </select>
              </div>
            )}

            {(activeTab === 'sales' || activeTab === 'wastage' || activeTab === 'purchase') && (
              <div className="filter-group">
                <label><Users size={14} /> {t('filter_by_salesman')}</label>
                <select 
                  className="dropdown-input" 
                  value={selectedSalesman} 
                  onChange={(e) => setSelectedSalesman(e.target.value)}
                >
                  <option value="">{t('all_salesmen')}</option>
                  {salesmen.map(s => (
                    <option key={s.salesman_id} value={s.salesman_id}>{language === 'ar' ? (s.name_ar || s.name_en) : s.name_en}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="filter-group">
              <label><Search size={14} /> {t('quick_search')}</label>
              <div className="search-input-wrapper" style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder={t('filter_results_hint')} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ flex: 1 }}
                />
                {(selectedVendor || selectedBranch || selectedSalesman || searchTerm) && (
                  <button 
                    onClick={() => {
                      setSelectedVendor('');
                      setSelectedBranch('');
                      setSelectedSalesman('');
                      setSearchTerm('');
                    }}
                    style={{
                      background: '#f1f5f9',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0 15px',
                      color: '#64748b',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {t('clear_all')}
                  </button>
                )}
              </div>
            </div>

          </div>

          <div className="report-tabs-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
            <div className="report-tabs" style={{ border: 'none', padding: 0 }}>
              <button className={activeTab === 'sales' ? 'active' : ''} onClick={() => setActiveTab('sales')}>
                <TrendingUp size={18} /> {t('sales_revenue_tab')}
              </button>
              <button className={activeTab === 'production' ? 'active' : ''} onClick={() => setActiveTab('production')}>
                <Package size={18} /> {t('production_logs_tab')}
              </button>
              <button className={activeTab === 'wastage' ? 'active' : ''} onClick={() => setActiveTab('wastage')}>
                <AlertTriangle size={18} /> {t('wastage_loss_tab')}
              </button>
              <button className={activeTab === 'purchase' ? 'active' : ''} onClick={() => setActiveTab('purchase')}>
                <ShoppingCart size={18} /> {t('purchase_reports_tab')}
              </button>
              <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
                <Package size={18} /> {t('product_performance_tab')}
              </button>
            </div>

            <div className="report-actions">
              <button className="btn-report-action printer" onClick={handlePrint}>
                <Printer size={18} /> {t('print_report')}
              </button>
              <button className="btn-report-action export" onClick={handleExportCSV}>
                <Download size={18} /> {t('export_csv')}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Dashboard */}
        {!loading && activeTab === 'sales' && data.length > 0 && (
          <div className="report-summary-grid animated fadeIn">
            <div className="summary-card revenue">
              <div className="summary-icon"><TrendingUp size={24} /></div>
              <div className="summary-data">
                <span className="summary-label">{t('total_revenue')}</span>
                <span className="summary-value">{filteredData.reduce((acc, curr) => acc + Number(curr.final_amount || 0), 0).toFixed(3)} {t('kd_currency')}</span>
              </div>
            </div>
            <div className="summary-card loss">
              <div className="summary-icon"><AlertTriangle size={24} /></div>
              <div className="summary-data">
                <span className="summary-label">{t('total_returns_loss')}</span>
                <span className="summary-value">{filteredData.reduce((acc, curr) => acc + Number(curr.returns_amount || 0), 0).toFixed(3)} {t('kd_currency')}</span>
              </div>
            </div>
            <div className="summary-card profit">
              <div className="summary-icon"><ShoppingCart size={24} /></div>
              <div className="summary-data">
                <span className="summary-label">{t('net_profit')}</span>
                <span className="summary-value">
                  {(filteredData.reduce((acc, curr) => acc + Number(curr.final_amount || 0), 0) - 
                    filteredData.reduce((acc, curr) => acc + Number(curr.total_cost || 0), 0) -
                    filteredData.reduce((acc, curr) => acc + Number(curr.returns_amount || 0), 0)).toFixed(3)} {t('kd_currency')}
                </span>
                <span className="summary-sublabel">After Production Costs & Returns</span>
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'products' && filteredData.length > 0 && (
          <div className="report-summary-grid animated fadeIn">
            <div className="summary-card revenue">
              <div className="summary-icon"><Package size={24} /></div>
              <div className="summary-data">
                <span className="summary-label">{t('top_selling_hero')}</span>
                <span className="summary-value" style={{ fontSize: '1.2rem' }}>
                  {(language === 'ar' ? (filteredData[0]?.product_name_ar || filteredData[0]?.product_name) : filteredData[0]?.product_name) || t('unknown_item')}
                </span>
                <span className="summary-sublabel">{filteredData[0]?.total_quantity || 0} {t('dispatch_unit')} Sold</span>
              </div>
            </div>
            <div className="summary-card profit">
              <div className="summary-icon"><TrendingUp size={24} /></div>
              <div className="summary-data">
                <span className="summary-label">{t('revenue_generated')}</span>
                <span className="summary-value">
                  {Number(filteredData[0]?.total_revenue || 0).toFixed(3)} {t('kd_currency')}
                </span>
                <span className="summary-sublabel">From Hero Product</span>
              </div>
            </div>
            <div className="summary-card profit" style={{ background: '#f0fdf4', borderColor: '#dcfce7' }}>
              <div className="summary-icon" style={{ background: '#dcfce7', color: '#166534' }}><ShoppingCart size={24} /></div>
              <div className="summary-data">
                <span className="summary-label" style={{ color: '#166534' }}>{t('most_profitable')}</span>
                <span className="summary-value" style={{ color: '#166534', fontSize: '1.2rem' }}>
                  {(() => {
                    const sorted = [...filteredData].sort((a, b) => (Number(b.total_profit) || 0) - (Number(a.total_profit) || 0));
                    return (language === 'ar' ? (sorted[0]?.product_name_ar || sorted[0]?.product_name) : sorted[0]?.product_name) || t('unknown_item');
                  })()}
                </span>
                <span className="summary-sublabel">Highest Margin Item</span>
              </div>
            </div>
          </div>
        )}

        {/* Visual Analytics Dashboard */}
        {!loading && analytics && analytics.dailyTrend && (
          <div className="analytics-dashboard no-print animated slideUp">
            <div className="chart-card large">
              <div className="chart-header">
                <h3><TrendingUp size={18} /> {t('revenue_profit_trend')}</h3>
                <div className="legend-pills">
                   <span className="pill revenue">{t('revenue')}</span>
                   <span className="pill profit">{t('net_profit')}</span>
                </div>
              </div>
              <div className="chart-container">
                <Chart 
                  options={trendOptions} 
                  series={[
                    { name: t('revenue'), data: analytics.dailyTrend.map((d: any) => Number(d.revenue || 0).toFixed(2)) },
                    { name: t('net_profit'), data: analytics.dailyTrend.map((d: any) => Number(d.profit || 0).toFixed(2)) }
                  ]} 
                  type="area" 
                  height={300} 
                />
              </div>
            </div>

            <div className="charts-row">
              <div className="chart-card">
                <h3><User size={18} /> {t('top_customers_revenue')}</h3>
                <div className="chart-container">
                  <Chart 
                    options={customerOptions} 
                    series={[{ name: t('revenue'), data: analytics.topCustomers.map((c: any) => Number(c.revenue || 0).toFixed(2)) }]} 
                    type="bar" 
                    height={250} 
                  />
                </div>
              </div>

              <div className="chart-card">
                <h3><AlertTriangle size={18} /> {t('wastage_breakdown')}</h3>
                <div className="chart-container">
                  <Chart 
                    options={wastageOptions} 
                    series={analytics.wastageReasons.map((r: any) => r.count)} 
                    type="donut" 
                    height={250} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="report-table-card no-print">
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 15px', width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ color: '#64748b', fontWeight: 500 }}>{t('refreshing_report_data')}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  {activeTab === 'sales' && (
                    <tr>
                      <th>{t('order_id')}</th>
                      <th>{t('customer')}</th>
                       <th>{t('branch')}</th>
                      <th>{t('salesman')}</th>
                      <th>{t('date')}</th>
                      <th>{t('total_amt')}</th>
                      <th>{t('disc')}</th>
                      <th>{t('final_amt')}</th>
                      <th>{t('returns')}</th>
                      <th>{t('net_profit')}</th>
                      <th>{t('status')}</th>
                    </tr>
                  )}
                  {activeTab === 'production' && (
                    <tr>
                      <th>{t('batch_number_caps')}</th>
                      <th>{t('date')}</th>
                      <th>{t('product')}</th>
                      <th>{t('qty_produced')}</th>
                      <th>{t('cost_price')}</th>
                      <th>{t('total_cost')}</th>
                    </tr>
                  )}
                  {activeTab === 'wastage' && (
                    <tr>
                      <th>{t('date')}</th>
                      <th>{t('product')}</th>
                      <th>{t('vendor')}</th>
                       <th>{t('branch')}</th>
                      <th>{t('qty_wasted_caps')}</th>
                      <th>{t('loss_value')}</th>
                      <th>{t('reason')}</th>
                    </tr>
                  )}
                  {activeTab === 'purchase' && (
                    <tr>
                      <th>{t('po_number')}</th>
                      <th>{t('supplier')}</th>
                      <th>{t('branch')}</th>
                      <th>{t('date')}</th>
                      <th>{t('total_amt')}</th>
                      <th>{t('tax')}</th>
                      <th>{t('disc')}</th>
                      <th>{t('final_amt')}</th>
                      <th>{t('status')}</th>
                    </tr>
                  )}
                  {activeTab === 'products' && (
                    <tr>
                      <th>{t('item_name')}</th>
                      <th>{t('category')}</th>
                      <th>{t('total_sold')}</th>
                      <th>{t('revenue')}</th>
                      <th>{t('total_cost')}</th>
                      <th>{t('net_profit')}</th>
                      <th>{t('profit_contribution')}</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {filteredData.length > 0 ? filteredData.map((item, idx) => (
                    <tr key={idx}>
                      {activeTab === 'sales' && (
                        <>
                          <td><strong>FNFI-{100000 + item.sale_id}</strong></td>
                          <td>{language === 'ar' ? (item.vendor_name_ar || item.vendor_name) : item.vendor_name}</td>
                           <td>{language === 'ar' ? (item.branch_name_ar || item.branch_name || 'الرئيسي') : (item.branch_name || 'Main')}</td>
                          <td><span className="salesman-badge">{language === 'ar' ? (item.salesman_name_ar || item.salesman_name || 'N/A') : (item.salesman_name || 'N/A')}</span></td>
                          <td>{item.report_date}</td>
                          <td>{Number(item.total_amount || 0).toFixed(3)}</td>
                          <td><span className="discount-tag">-{item.discount_percentage || 0}%</span></td>
                          <td><span className="profit-text">{Number(item.final_amount || 0).toFixed(3)}</span></td>
                          <td><span className="loss-text">{Number(item.returns_amount || 0).toFixed(3)}</span></td>
                          <td>
                            <span className="profit-badge">
                              {(Number(item.final_amount || 0) - Number(item.total_cost || 0) - Number(item.returns_amount || 0)).toFixed(3)}
                            </span>
                          </td>
                          <td><span className={`status-pill ${item.dispatch_status}`}>{t(item.dispatch_status)}</span></td>
                        </>
                      )}
                      {activeTab === 'production' && (
                        <>
                          <td><strong>{item.batch_number}</strong></td>
                          <td>{item.report_date}</td>
                          <td>{language === 'ar' ? (item.product_name_ar || item.product_name) : item.product_name}</td>
                          <td>{item.quantity_produced || 0} {t('dispatch_unit')}</td>
                          <td>{Number(item.cost_price || 0).toFixed(3)}</td>
                          <td>{Number((item.quantity_produced || 0) * (item.cost_price || 0)).toFixed(3)}</td>
                        </>
                      )}
                      {activeTab === 'wastage' && (
                        <>
                          <td>{item.report_date}</td>
                          <td><strong>{language === 'ar' ? (item.product_name_ar || item.product_name) : item.product_name}</strong></td>
                          <td>{language === 'ar' ? (item.vendor_name_ar || item.vendor_name || 'المصنع') : (item.vendor_name || 'Factory')}</td>
                           <td>{language === 'ar' ? (item.branch_name_ar || item.branch_name || 'الرئيسي') : (item.branch_name || 'Main')}</td>
                          <td>{item.quantity || 0}</td>
                          <td><span className="loss-text">{Number((item.quantity || 0) * (item.price || 0)).toFixed(3)}</span></td>
                          <td>{language === 'ar' ? (item.reason_ar || item.reason_en) : item.reason_en}</td>
                        </>
                      )}
                      {activeTab === 'purchase' && (
                        <>
                          <td><strong>{item.po_number}</strong></td>
                          <td>{language === 'ar' ? (item.vendor_name_ar || item.vendor_name) : item.vendor_name}</td>
                          <td>{language === 'ar' ? (item.branch_name_ar || item.branch_name || 'الرئيسي') : (item.branch_name || 'Main')}</td>
                          <td>{item.report_date}</td>
                          <td>{Number(item.total_amount || 0).toFixed(3)}</td>
                          <td>{Number(item.tax_amount || 0).toFixed(3)}</td>
                          <td><span className="discount-tag">-{Number(item.discount_amount || 0).toFixed(3)}</span></td>
                          <td><span className="profit-text">{Number(item.final_amount || 0).toFixed(3)}</span></td>
                          <td><span className={`status-pill ${item.status}`}>{t(item.status)}</span></td>
                        </>
                      )}
                      {activeTab === 'products' && (
                        <>
                          <td><strong>{(language === 'ar' ? (item.product_name_ar || item.product_name) : item.product_name) || t('unknown_item')}</strong></td>
                          <td><span className="salesman-badge">{item.product_category || 'General'}</span></td>
                          <td>{item.total_quantity || 0}</td>
                          <td>{Number(item.total_revenue || 0).toFixed(3)}</td>
                          <td>{Number(item.total_cost || 0).toFixed(3)}</td>
                          <td><span className="profit-text">{Number(item.total_profit || 0).toFixed(3)}</span></td>
                          <td>
                            <div style={{ width: '100%', background: '#f1f5f9', height: '8px', borderRadius: '4px', overflow: 'hidden', marginTop: '5px' }}>
                               <div style={{ 
                                 width: `${Math.min(100, (Number(item.total_revenue || 0) / (data.reduce((s:any,i:any)=>s+Number(i.total_revenue || 0),0) || 1)) * 100)}%`, 
                                 background: 'var(--primary)', 
                                 height: '100%' 
                               }}></div>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={11} className="empty-row">{t('no_records_period')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Print Only View */}
        <div className="print-view only-print">
          <h1>Fresh 'n' Fast - {activeTab.toUpperCase()} REPORT</h1>
          <p>Period: {startDate} to {endDate}</p>
          <hr />
          <table className="print-table">
             <thead>
                <tr>
                   {activeTab === 'sales' ? <><th>ID</th><th>Customer</th><th>Date</th><th>Final</th><th>Returns</th><th>Profit</th></> : null}
                   {activeTab === 'production' ? <><th>Batch</th><th>Date</th><th>Product</th><th>Qty</th><th>Cost</th></> : null}
                   {activeTab === 'wastage' ? <><th>Date</th><th>Product</th><th>Qty</th><th>Loss</th><th>Reason</th></> : null}
                   {activeTab === 'purchase' ? <><th>PO #</th><th>Supplier</th><th>Date</th><th>Total</th><th>Status</th></> : null}
                </tr>
             </thead>
             <tbody>
                {filteredData.map((item, idx) => (
                   <tr key={idx}>
                      {activeTab === 'sales' && <><td>{item.sale_id}</td><td>{item.vendor_name}</td><td>{item.report_date}</td><td>{item.final_amount}</td><td>{item.returns_amount || 0}</td><td>{(Number(item.final_amount || 0) - Number(item.total_cost || 0) - Number(item.returns_amount || 0)).toFixed(3)}</td></>}
                      {activeTab === 'production' && <><td>{item.batch_number}</td><td>{item.report_date}</td><td>{item.product_name}</td><td>{item.quantity_produced}</td><td>{(item.quantity_produced * item.cost_price).toFixed(3)}</td></>}
                      {activeTab === 'wastage' && <><td>{item.report_date}</td><td>{item.product_name}</td><td>{item.quantity}</td><td>{(item.quantity * item.price).toFixed(3)}</td><td>{item.reason_en}</td></>}
                      {activeTab === 'purchase' && <><td>{item.po_number}</td><td>{item.vendor_name}</td><td>{item.report_date}</td><td>{item.final_amount}</td><td>{item.status}</td></>}
                   </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .reports-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
        
        .reports-header-card { 
          background: white; 
          border-radius: 16px; 
          padding: 1.5rem; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          margin-bottom: 2rem;
          border: 1px solid #f1f5f9;
        }

        .report-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .summary-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
          border: 1px solid #f1f5f9;
        }

        .summary-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .revenue .summary-icon { background: #ecfdf5; color: #10b981; }
        .loss .summary-icon { background: #fef2f2; color: #ef4444; }
        .profit .summary-icon { background: #eff6ff; color: #3b82f6; }

        .summary-data { display: flex; flex-direction: column; }
        .summary-label { font-size: 0.85rem; font-weight: 700; color: #64748b; margin-bottom: 4px; }
        .summary-value { font-size: 1.5rem; font-weight: 800; color: #1e293b; }
        .summary-sublabel { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }

        .analytics-dashboard { margin-bottom: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
        .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .chart-card {
          background: white;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 4px 25px rgba(0,0,0,0.05);
          border: 1px solid #f1f5f9;
        }
        .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .chart-card h3 { 
          display: flex; 
          align-items: center; 
          gap: 10px; 
          font-size: 1rem; 
          font-weight: 800; 
          color: #1e293b; 
        }
        .legend-pills { display: flex; gap: 10px; }
        .pill { padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
        .pill.revenue { background: #eff6ff; color: #3b82f6; }
        .pill.profit { background: #f0fdf4; color: #10b981; }

        .filter-grid { 
          display: grid; 
          grid-template-columns: 1.2fr 1fr 1fr; 
          gap: 1.5rem; 
          align-items: flex-end;
          margin-bottom: 2rem;
        }

        .filter-group label { 
          display: flex; 
          align-items: center; 
          gap: 6px; 
          font-size: 0.85rem; 
          font-weight: 700; 
          color: #64748b; 
          margin-bottom: 8px;
        }

        .date-inputs { display: flex; align-items: center; gap: 8px; }
        .date-inputs input { 
          padding: 0.6rem 0.8rem; 
          border: 1px solid #e2e8f0; 
          border-radius: 8px; 
          font-size: 0.85rem;
          color: #1e293b;
        }

        .dropdown-input {
          width: 100%;
          padding: 0.6rem 1rem; 
          border: 1px solid #e2e8f0; 
          border-radius: 8px; 
          font-size: 0.9rem;
          background: white;
          color: #1e293b;
          cursor: pointer;
        }

        .search-input-wrapper input {
          width: 100%;
          padding: 0.6rem 1rem; 
          border: 1px solid #e2e8f0; 
          border-radius: 8px; 
          font-size: 0.9rem;
        }

        .report-actions { display: flex; gap: 10px; }
        .btn-report-action { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          padding: 0.6rem 1rem; 
          border-radius: 10px; 
          font-weight: 600; 
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .btn-report-action.printer { background: #f8fafc; color: #1e293b; border: 1px solid #e2e8f0; }
        .btn-report-action.export { background: var(--primary); color: white; }
        .btn-report-action:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

        .report-tabs { display: flex; gap: 1rem; border-top: 1px solid #f1f5f9; padding-top: 1.5rem; }
        .report-tabs button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0.8rem 1.5rem;
          border-radius: 12px;
          border: none;
          background: #f1f5f9;
          color: #64748b;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .report-tabs button.active { background: var(--primary); color: white; }

        .report-table-card { 
          background: white; 
          border-radius: 16px; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          overflow: hidden;
          border: 1px solid #f1f5f9;
        }

        .premium-table { width: 100%; border-collapse: collapse; }
        .premium-table th { 
          background: #f8fafc; 
          padding: 1.2rem; 
          text-align: start; 
          font-size: 0.75rem; 
          text-transform: uppercase; 
          color: #64748b; 
          letter-spacing: 0.05em;
          border-bottom: 2px solid #f1f5f9;
        }
        .premium-table td { padding: 1.2rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
        
        .discount-tag { background: #fee2e2; color: #dc2626; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.75rem; }
        .profit-text { color: #059669; font-weight: 700; }
        .loss-text { color: #dc2626; font-weight: 700; }
        .profit-badge { background: #f0fdf4; color: #166534; padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 0.85rem; border: 1px solid #dcfce7; }
        .status-pill { padding: 4px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
        .status-pill.delivered { background: #dcfce7; color: #166534; }
        .status-pill.pending { background: #fef9c3; color: #854d0e; }
        .salesman-badge { background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; border: 1px solid #e2e8f0; }

        .loading-state { padding: 4rem; text-align: center; color: #64748b; }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        .only-print { display: none; }
        @media print {
          .no-print { display: none; }
          .only-print { display: block; padding: 2rem; }
          .print-table { width: 100%; border-collapse: collapse; margin-top: 2rem; }
          .print-table th, .print-table td { border: 1px solid #ddd; padding: 10px; text-align: start; font-size: 12px; }
        }

        .animated { animation-duration: 0.6s; animation-fill-mode: both; }
        .slideUp { animation-name: slideUp; }
        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Layout>
  );
};

export default ReportsPage;
