import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useLanguage } from '../hooks/useLanguage';
import { toast } from 'react-toastify';
import { 
  TrendingUp, 
  AlertTriangle, 
  ShoppingCart, 
  Calendar, 
  Download, 
  Printer, 
  BadgeCent, 
  Store,
  MapPin,
  ArrowRight,
  TrendingDown,
  Percent,
  Layers,
  Sparkles
} from 'lucide-react';

const PNLReportPage = () => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    const startValid = !startDate || /^\d{4}-\d{2}-\d{2}$/.test(startDate);
    const endValid = !endDate || /^\d{4}-\d{2}-\d{2}$/.test(endDate);
    if (!startValid || !endValid) return;
    if (startDate && endDate && startDate > endDate) return;
    fetchPNLData();
  }, [startDate, endDate, selectedVendor, selectedBranch]);

  const fetchVendors = async () => {
    try {
      const res = await api.get('/vendors');
      const allVendors = res.data.data || [];
      setVendors(allVendors.filter((v: any) => v.type === 'client'));
    } catch (e) {
      console.error("Failed to fetch vendors for filtering");
    }
  };

  const fetchPNLData = async () => {
    try {
      setLoading(true);
      const [salesRes, returnsRes, purchaseRes, productsRes] = await Promise.all([
        api.get('/reports/sales', { params: { startDate, endDate, vendor_id: selectedVendor || undefined, branch_id: selectedBranch || undefined } }).catch(() => ({ data: { data: [] } })),
        api.get('/reports/wastage', { params: { startDate, endDate, vendor_id: selectedVendor || undefined, branch_id: selectedBranch || undefined } }).catch(() => ({ data: { data: [] } })),
        api.get('/reports/purchase', { params: { startDate, endDate, vendor_id: selectedVendor || undefined, branch_id: selectedBranch || undefined } }).catch(() => ({ data: { data: [] } })),
        api.get('/reports/products', { params: { startDate, endDate, vendor_id: selectedVendor || undefined, branch_id: selectedBranch || undefined } }).catch(() => ({ data: { data: [] } }))
      ]);
      
      setData({
        sales: salesRes.data.data || salesRes.data || [],
        wastage: returnsRes.data.data || returnsRes.data || [],
        purchases: purchaseRes.data.data || purchaseRes.data || [],
        products: productsRes.data.data || productsRes.data || []
      });
    } catch (error) {
      console.error('Failed to fetch PNL report data.');
      toast.error('Failed to load P&L statement data.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data) return toast.warning("No data to export.");
    
    const pnlData = data;
    const grossRevenue = pnlData.sales.reduce((acc: any, curr: any) => acc + Number(curr.total_amount || 0), 0);
    const discounts = pnlData.sales.reduce((acc: any, curr: any) => acc + Number(curr.discount_amount || 0), 0);
    const salesReturns = pnlData.sales.reduce((acc: any, curr: any) => acc + Number(curr.returns_amount || 0), 0);
    const netRevenue = grossRevenue - discounts - salesReturns;
    const cogs = pnlData.products.reduce((acc: any, curr: any) => acc + Number(curr.total_cost || 0), 0);
    const grossProfit = netRevenue - cogs;
    const wastageLoss = pnlData.wastage.reduce((acc: any, curr: any) => acc + (Number(curr.quantity || 0) * Number(curr.cost_price || 0)), 0);
    const netProfit = grossProfit - wastageLoss;

    const headers = ["Financial Statement Line Item", "Amount (KWD)"];
    const rows = [
      ["Gross Sales Revenue", grossRevenue.toFixed(3)],
      ["Discounts Allowed", `-${discounts.toFixed(3)}`],
      ["Sales Returns", `-${salesReturns.toFixed(3)}`],
      ["Net Revenue", netRevenue.toFixed(3)],
      ["Cost of Goods Sold (COGS)", `-${cogs.toFixed(3)}`],
      ["Gross Profit", grossProfit.toFixed(3)],
      ["Wastage Loss", `-${wastageLoss.toFixed(3)}`],
      ["Net Profit", netProfit.toFixed(3)]
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pnl_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeBranches = vendors.find(v => String(v.vendor_id) === String(selectedVendor))?.branches || [];

  // Calculate metrics
  const pnlData = data || { sales: [], wastage: [], purchases: [], products: [] };
  const grossRevenue = pnlData.sales.reduce((acc: any, curr: any) => acc + Number(curr.total_amount || 0), 0);
  const discounts = pnlData.sales.reduce((acc: any, curr: any) => acc + Number(curr.discount_amount || 0), 0);
  const salesReturns = pnlData.sales.reduce((acc: any, curr: any) => acc + Number(curr.returns_amount || 0), 0);
  const netRevenue = grossRevenue - discounts - salesReturns;
  const cogs = pnlData.products.reduce((acc: any, curr: any) => acc + Number(curr.total_cost || 0), 0);
  const grossProfit = netRevenue - cogs;
  const wastageLoss = pnlData.wastage.reduce((acc: any, curr: any) => acc + (Number(curr.quantity || 0) * Number(curr.cost_price || 0)), 0);
  const netProfit = grossProfit - wastageLoss;

  // Percentage calculations
  const grossProfitMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;
  const netProfitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;
  const cogsPercent = netRevenue > 0 ? (cogs / netRevenue) * 100 : 0;
  const wastagePercent = netRevenue > 0 ? (wastageLoss / netRevenue) * 100 : 0;

  return (
    <Layout title={t('profit_loss_report')}>
      <div className="pnl-premium-container">
        
        {/* Top Header Card with Gradient and Glow */}
        <div className="pnl-glass-header animated slideInDown">
          <div className="pnl-header-content">
            <div className="pnl-header-text">
              <h2>
                <Sparkles className="pnl-sparkle-icon" /> 
                {language === 'ar' ? 'ذكاء الأرباح والخسائر' : 'P&L Financial Intelligence'}
              </h2>
              <p>{language === 'ar' ? 'تحليل هيكل التكاليف والإيرادات والربحية التشغيلية' : 'Comprehensive margin breakdown, operating leakage, and final profitability analysis'}</p>
            </div>
            
            {/* Action Buttons with Interactive Styles */}
            <div className="pnl-action-buttons">
              <button className="btn-pnl-action pnl-btn-secondary" onClick={handlePrint}>
                <Printer size={16} /> {t('print_report')}
              </button>
              <button className="btn-pnl-action pnl-btn-primary" onClick={handleExportCSV}>
                <Download size={16} /> {t('export_csv')}
              </button>
            </div>
          </div>

          {/* Quick Filters Area */}
          <div className="pnl-filter-strip">
            <div className="pnl-filter-item">
              <span className="pnl-filter-label"><Calendar size={14} /> {language === 'ar' ? 'الفترة' : 'Date Range'}</span>
              <div className="pnl-date-picker-group">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <span className="pnl-arrow-separator"><ArrowRight size={14} /></span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="pnl-filter-item">
              <span className="pnl-filter-label"><Store size={14} /> {t('filter_by_customer')}</span>
              <select 
                className="pnl-select" 
                value={selectedVendor} 
                onChange={(e) => {
                  setSelectedVendor(e.target.value);
                  setSelectedBranch('');
                }}
              >
                <option value="">{t('all_customers')}</option>
                {vendors.map(v => (
                  <option key={v.vendor_id} value={v.vendor_id}>
                    {language === 'ar' ? (v.name_ar || v.name_en) : v.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div className="pnl-filter-item">
              <span className="pnl-filter-label"><MapPin size={14} /> {t('filter_by_branch')}</span>
              <select 
                className="pnl-select" 
                value={selectedBranch} 
                disabled={!selectedVendor}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="">{selectedVendor ? t('all_branches') : t('select_customer_first')}</option>
                {activeBranches.map((b: any) => (
                  <option key={b.branch_id || b.id} value={b.branch_id || b.id}>
                    {language === 'ar' ? (b.name_ar || b.name_en || b.name) : (b.name_en || b.name)}
                  </option>
                ))}
              </select>
            </div>

            {(selectedVendor || selectedBranch) && (
              <button 
                className="pnl-clear-btn" 
                onClick={() => {
                  setSelectedVendor('');
                  setSelectedBranch('');
                }}
              >
                {t('clear_all')}
              </button>
            )}
          </div>
        </div>

        {/* Content Display */}
        {loading ? (
          <div className="pnl-loading-card">
            <div className="spinner-glow"></div>
            <p>{language === 'ar' ? 'جاري تحضير التحليل المالي...' : 'Calculating financial intelligence metrics...'}</p>
          </div>
        ) : (
          <div className="pnl-content-grid animated fadeIn">
            
            {/* Left Side: Statement Card & Flows */}
            <div className="pnl-statement-column">
              <div className="premium-pnl-sheet">
                <div className="sheet-header">
                  <div className="sheet-title">
                    <Layers size={20} className="sheet-icon" />
                    <span>{language === 'ar' ? 'قائمة الأرباح والخسائر الرسمية' : 'Official Profit & Loss Statement'}</span>
                  </div>
                  <span className="period-pill">{startDate} ➔ {endDate}</span>
                </div>

                {/* 1. GROSS REVENUE ROW */}
                <div className="pnl-row-group parent-level">
                  <div className="pnl-row">
                    <span className="pnl-row-label">{language === 'ar' ? 'إجمالي إيرادات المبيعات' : 'Gross Sales Revenue'}</span>
                    <span className="pnl-row-value">{grossRevenue.toFixed(3)} KD</span>
                  </div>
                  
                  {/* Deductions Nested */}
                  <div className="pnl-sub-rows">
                    <div className="pnl-sub-row negative">
                      <span>(-) {language === 'ar' ? 'الخصومات الممنوحة' : 'Discounts Allowed'}</span>
                      <span>-{discounts.toFixed(3)} KD</span>
                    </div>
                    <div className="pnl-sub-row negative">
                      <span>(-) {language === 'ar' ? 'مردودات المبيعات' : 'Sales Returns'}</span>
                      <span>-{salesReturns.toFixed(3)} KD</span>
                    </div>
                  </div>
                </div>

                {/* 2. NET REVENUE ROW */}
                <div className="pnl-row-group highlighted primary-style">
                  <div className="pnl-row">
                    <span className="pnl-row-label">{language === 'ar' ? 'صافي الإيرادات' : 'NET REVENUE'}</span>
                    <span className="pnl-row-value">{netRevenue.toFixed(3)} KD</span>
                  </div>
                  <div className="pnl-progress-bar-container">
                    <div className="pnl-progress-bar primary-fill" style={{ width: '100%' }}></div>
                  </div>
                </div>

                {/* 3. COGS ROW */}
                <div className="pnl-row-group parent-level">
                  <div className="pnl-row cogs-style">
                    <span className="pnl-row-label">{language === 'ar' ? 'تكلفة البضاعة المباعة (المكونات)' : 'Cost of Goods Sold (Ingredients)'}</span>
                    <span className="pnl-row-value negative">-{cogs.toFixed(3)} KD</span>
                  </div>
                  <div className="pnl-progress-bar-container">
                    <div className="pnl-progress-bar orange-fill" style={{ width: `${cogsPercent}%` }}></div>
                    <span className="progress-percent-label">{cogsPercent.toFixed(1)}% {language === 'ar' ? 'من الإيرادات' : 'of revenue'}</span>
                  </div>
                </div>

                {/* 4. GROSS PROFIT ROW */}
                <div className="pnl-row-group highlighted success-style">
                  <div className="pnl-row">
                    <span className="pnl-row-label">{language === 'ar' ? 'إجمالي الربح' : 'GROSS PROFIT'}</span>
                    <span className="pnl-row-value">{grossProfit.toFixed(3)} KD</span>
                  </div>
                  <div className="pnl-progress-bar-container">
                    <div className="pnl-progress-bar green-fill" style={{ width: `${grossProfitMargin}%` }}></div>
                    <span className="progress-percent-label">{grossProfitMargin.toFixed(1)}% {language === 'ar' ? 'هامش الربح الإجمالي' : 'Gross Margin'}</span>
                  </div>
                </div>

                {/* 5. WASTAGE LOSS ROW */}
                <div className="pnl-row-group parent-level">
                  <div className="pnl-row wastage-style">
                    <span className="pnl-row-label">{language === 'ar' ? 'خسائر الهدر والتلف (المصاريف التشغيلية)' : 'Wastage & Spoilage Loss (Operating)'}</span>
                    <span className="pnl-row-value negative">-{wastageLoss.toFixed(3)} KD</span>
                  </div>
                  <div className="pnl-progress-bar-container">
                    <div className="pnl-progress-bar red-fill" style={{ width: `${wastagePercent}%` }}></div>
                    <span className="progress-percent-label">{wastagePercent.toFixed(1)}% {language === 'ar' ? 'تسريب تشغيلي' : 'operating leak'}</span>
                  </div>
                </div>

                {/* 6. NET PROFIT ROW */}
                <div className={`pnl-row-group highlighted final-profit-style ${netProfit >= 0 ? 'positive-net' : 'negative-net'}`}>
                  <div className="pnl-row">
                    <span className="pnl-row-label">{language === 'ar' ? 'صافي الربح النهائي' : 'NET PROFIT'}</span>
                    <span className="pnl-row-value">{netProfit.toFixed(3)} KD</span>
                  </div>
                  <div className="pnl-progress-bar-container">
                    <div className={`pnl-progress-bar ${netProfit >= 0 ? 'green-fill' : 'red-fill'}`} style={{ width: `${Math.min(100, Math.max(0, netProfitMargin))}%` }}></div>
                    <span className="progress-percent-label">{netProfitMargin.toFixed(1)}% {language === 'ar' ? 'هامش صافي الربح' : 'Net Margin'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Margin intelligence & Breakdowns */}
            <div className="pnl-analytics-column">
              
              {/* Gross Margin Card */}
              <div className="pnl-glass-card hover-glow">
                <div className="card-top-icon green-bg">
                  <Percent size={20} />
                </div>
                <div className="pnl-kpi-info">
                  <span className="kpi-label">{language === 'ar' ? 'نسبة هامش الربح الإجمالي' : 'Gross Profit Margin'}</span>
                  <h3>{grossProfitMargin.toFixed(2)}%</h3>
                  <div className="kpi-subtext">
                    <TrendingUp size={14} style={{ marginRight: '4px' }} />
                    <span>{language === 'ar' ? 'العائد المباشر بعد تكاليف Menu' : 'Direct yield on production inventory cost'}</span>
                  </div>
                </div>
              </div>

              {/* Net Margin Card */}
              <div className={`pnl-glass-card hover-glow ${netProfit >= 0 ? 'positive-border' : 'negative-border'}`}>
                <div className={`card-top-icon ${netProfit >= 0 ? 'green-bg' : 'red-bg'}`}>
                  {netProfit >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
                <div className="pnl-kpi-info">
                  <span className="kpi-label">{language === 'ar' ? 'نسبة هامش الربح الصافي' : 'Net Profit Margin'}</span>
                  <h3 style={{ color: netProfit >= 0 ? '#10b981' : '#f43f5e' }}>{netProfitMargin.toFixed(2)}%</h3>
                  <div className="kpi-subtext">
                    <span>{language === 'ar' ? 'العائد النهائي بعد الهدر والخسائر' : 'Final take-home yield after all leakage'}</span>
                  </div>
                </div>
              </div>

              {/* Cost Leakage Card */}
              <div className="pnl-glass-card hover-glow leakage-theme">
                <div className="card-top-icon red-bg">
                  <AlertTriangle size={20} />
                </div>
                <div className="pnl-kpi-info">
                  <span className="kpi-label">{language === 'ar' ? 'حجم الفاقد من الهدر والتلف' : 'Operational Cost Leakage'}</span>
                  <h3 style={{ color: '#ef4444' }}>{wastagePercent.toFixed(1)}%</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px', fontWeight: 600 }}>
                    {language === 'ar' 
                      ? `تم فقدان ${wastageLoss.toFixed(3)} KD بسبب الهدر غير المستفاد منه.`
                      : `${wastageLoss.toFixed(3)} KD of sales value dissolved in expired/wasted items.`}
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Print Only View */}
        <div className="print-view only-print">
          <h1>Fresh 'n' Fast - P&L STATEMENT REPORT</h1>
          <p>Period: {startDate} to {endDate}</p>
          <hr />
          <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Line Item</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Amount (KWD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px' }}>Gross Sales Revenue</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>{grossRevenue.toFixed(3)}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', paddingLeft: '20px' }}>(-) Discounts Allowed</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>-{discounts.toFixed(3)}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', paddingLeft: '20px' }}>(-) Sales Returns</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>-{salesReturns.toFixed(3)}</td>
              </tr>
              <tr style={{ fontWeight: 'bold', borderTop: '1px solid #ccc' }}>
                <td style={{ padding: '8px' }}>Net Revenue</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>{netRevenue.toFixed(3)}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px' }}>Cost of Goods Sold (Ingredients)</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>-{cogs.toFixed(3)}</td>
              </tr>
              <tr style={{ fontWeight: 'bold', borderTop: '1px solid #ccc' }}>
                <td style={{ padding: '8px' }}>Gross Profit</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>{grossProfit.toFixed(3)}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px' }}>Wastage & Spoilage Loss</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>-{wastageLoss.toFixed(3)}</td>
              </tr>
              <tr style={{ fontWeight: 'bold', borderTop: '2px solid #000', borderBottom: '2px solid #000', fontSize: '1.2rem' }}>
                <td style={{ padding: '8px' }}>Net Profit</td>
                <td style={{ padding: '8px', textAlign: 'right' }}>{netProfit.toFixed(3)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .pnl-premium-container {
          padding: 2.5rem;
          max-width: 1400px;
          margin: 0 auto;
          font-family: 'Outfit', 'Inter', sans-serif;
          background: #fafafc;
          min-height: 100vh;
        }

        /* Premium Header Banner with Glow */
        .pnl-glass-header {
          background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%);
          border-radius: 24px;
          padding: 2rem 2.5rem;
          box-shadow: 0 10px 30px rgba(1, 86, 44, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          margin-bottom: 2.5rem;
          position: relative;
          overflow: hidden;
          color: white;
        }

        .pnl-glass-header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(245, 127, 23, 0.15) 0%, transparent 60%);
          border-radius: 50%;
          pointer-events: none;
        }

        .pnl-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .pnl-header-text h2 {
          font-size: 1.8rem;
          font-weight: 800;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          letter-spacing: -0.02em;
        }

        .pnl-sparkle-icon {
          color: var(--accent);
          animation: pulse 2s infinite ease-in-out;
        }

        .pnl-header-text p {
          color: var(--secondary-dim);
          font-size: 0.95rem;
          margin: 6px 0 0;
          font-weight: 500;
        }

        /* Styled Filter Strip */
        .pnl-filter-strip {
          display: flex;
          align-items: center;
          gap: 1.8rem;
          background: rgba(255, 255, 255, 0.07);
          padding: 1.2rem 1.8rem;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          flex-wrap: wrap;
        }

        .pnl-filter-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .pnl-filter-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--secondary-dim);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pnl-date-picker-group {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 10px;
          padding: 4px 8px;
        }

        .pnl-date-picker-group input {
          border: none;
          background: transparent;
          font-size: 0.85rem;
          font-weight: 600;
          color: #1e1b4b;
          padding: 6px;
          outline: none;
        }

        .pnl-arrow-separator {
          color: #94a3b8;
          display: flex;
          align-items: center;
          padding: 0 4px;
        }

        .pnl-select {
          background: rgba(255, 255, 255, 0.95);
          border: none;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #1e1b4b;
          outline: none;
          min-width: 180px;
          cursor: pointer;
        }

        .pnl-clear-btn {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: white;
          padding: 10px 16px;
          font-size: 0.8rem;
          font-weight: 700;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          align-self: flex-end;
          margin-bottom: 2px;
        }

        .pnl-clear-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        /* Action buttons styling */
        .pnl-action-buttons {
          display: flex;
          gap: 10px;
        }

        .btn-pnl-action {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0.75rem 1.4rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .pnl-btn-secondary {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
        }

        .pnl-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .pnl-btn-primary {
          background: var(--accent);
          border: none;
          color: white;
          box-shadow: 0 4px 14px rgba(245, 127, 23, 0.3);
        }

        .pnl-btn-primary:hover {
          background: var(--primary-light);
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(13, 124, 67, 0.4);
        }

        /* Grid Layout */
        .pnl-content-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 2.5rem;
          align-items: start;
        }

        /* Premium Financial Sheet Styling */
        .premium-pnl-sheet {
          background: white;
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 10px 40px rgba(0,0,0,0.03);
          border: 1px solid #f1f5f9;
        }

        .sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #f8fafc;
          padding-bottom: 1.5rem;
          margin-bottom: 2rem;
        }

        .sheet-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 850;
          color: #0f172a;
          font-size: 1.25rem;
        }

        .sheet-icon {
          color: var(--primary);
        }

        .period-pill {
          background: #f1f5f9;
          color: #475569;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 20px;
        }

        /* Flow and Statement Rows */
        .pnl-row-group {
          margin-bottom: 1.8rem;
          padding: 1rem 1.4rem;
          border-radius: 16px;
          background: #fafafc;
          border: 1px solid #f1f5f9;
          transition: all 0.2s ease;
        }

        .pnl-row-group:hover {
          transform: translateX(4px);
        }

        .pnl-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 750;
          color: #334155;
          font-size: 0.95rem;
        }

        .pnl-row-value {
          font-size: 1.1rem;
          font-weight: 850;
          color: #0f172a;
        }

        .pnl-sub-rows {
          margin-top: 0.8rem;
          border-top: 1px dashed #e2e8f0;
          padding-top: 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pnl-sub-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 600;
          padding-left: 1.2rem;
        }

        .pnl-sub-row.negative span:last-child {
          color: #e11d48;
          font-weight: 700;
        }

        /* Progress Bars in P&L structure */
        .pnl-progress-bar-container {
          margin-top: 0.8rem;
          background: #e2e8f0;
          height: 6px;
          border-radius: 4px;
          position: relative;
          display: flex;
          align-items: center;
        }

        .pnl-progress-bar {
          height: 100%;
          border-radius: 4px;
        }

        .primary-fill { background: var(--primary); }
        .orange-fill { background: var(--accent); }
        .green-fill { background: var(--success); }
        .red-fill { background: var(--danger); }

        .progress-percent-label {
          position: absolute;
          right: 0;
          top: 10px;
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 700;
        }

        /* Highlighting Specific Sections */
        .pnl-row-group.highlighted {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .pnl-row-group.highlighted.primary-style {
          background: #f4f7f5;
          border-color: #e2ede6;
        }
        .pnl-row-group.highlighted.primary-style .pnl-row-label { color: var(--primary-dark); }
        .pnl-row-group.highlighted.primary-style .pnl-row-value { color: var(--primary-light); }

        .pnl-row-group.highlighted.success-style {
          background: #f0fdf4;
          border-color: #dcfce7;
        }
        .pnl-row-group.highlighted.success-style .pnl-row-label { color: #14532d; }
        .pnl-row-group.highlighted.success-style .pnl-row-value { color: #16a34a; }

        .pnl-row-group.highlighted.final-profit-style {
          padding: 1.4rem 1.6rem;
          border-width: 2px;
          margin-bottom: 0;
        }

        .positive-net {
          background: #f0fdf4 !important;
          border-color: #22c55e !important;
        }
        .positive-net .pnl-row-label { color: #14532d; font-size: 1.1rem; }
        .positive-net .pnl-row-value { color: #15803d; font-size: 1.4rem; }

        .negative-net {
          background: #fef2f2 !important;
          border-color: #f43f5e !important;
        }
        .negative-net .pnl-row-label { color: #7f1d1d; font-size: 1.1rem; }
        .negative-net .pnl-row-value { color: #b91c1c; font-size: 1.4rem; }

        .cogs-style .pnl-row-value { color: #c2410c; }
        .wastage-style .pnl-row-value { color: #b91c1c; }

        /* KPI / Analytics Cards (Right Column) */
        .pnl-analytics-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .pnl-glass-card {
          background: white;
          border-radius: 20px;
          padding: 1.8rem;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          display: flex;
          align-items: center;
          gap: 1.5rem;
          position: relative;
          transition: all 0.3s ease;
        }

        .pnl-glass-card.hover-glow:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.06);
        }

        .pnl-glass-card.positive-border { border-left: 5px solid #10b981; }
        .pnl-glass-card.negative-border { border-left: 5px solid #f43f5e; }
        .pnl-glass-card.leakage-theme { border-left: 5px solid #ef4444; background: #fffcfc; }

        .card-top-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .green-bg { background: #ecfdf5; color: #10b981; }
        .red-bg { background: #fef2f2; color: #ef4444; }

        .pnl-kpi-info {
          display: flex;
          flex-direction: column;
        }

        .kpi-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 6px;
        }

        .pnl-kpi-info h3 {
          font-size: 1.8rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.03em;
        }

        .kpi-subtext {
          font-size: 0.72rem;
          color: #94a3b8;
          margin-top: 6px;
          font-weight: 600;
          display: flex;
          align-items: center;
        }

        /* Loading Card */
        .pnl-loading-card {
          background: white;
          border-radius: 24px;
          padding: 5rem 2rem;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0,0,0,0.03);
          border: 1px solid #f1f5f9;
        }

        .spinner-glow {
          width: 44px;
          height: 44px;
          border: 3.5px solid #f1f5f9;
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1.5rem;
          box-shadow: 0 0 15px rgba(1, 86, 44, 0.2);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.92); }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .pnl-content-grid {
            grid-template-columns: 1fr;
          }
        }

        @media print {
          body * { visibility: hidden; }
          .print-view, .print-view * { visibility: visible; }
          .print-view { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
    </Layout>
  );
};

export default PNLReportPage;
