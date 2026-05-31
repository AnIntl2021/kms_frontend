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
  Sparkles,
  ChevronDown,
  ChevronUp,
  Package,
  FileText
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

  // Tab and UI states
  const [activeDetailsTab, setActiveDetailsTab] = useState<'trend' | 'products' | 'wastage' | 'purchases' | 'customer'>('trend');
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({});

  // Pagination states (5 items per page)
  const [productsPage, setProductsPage] = useState(1);
  const [wastagePage, setWastagePage] = useState(1);
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);

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

  // Reset pagination pages when filters or tab changes
  useEffect(() => {
    setProductsPage(1);
    setWastagePage(1);
    setPurchasesPage(1);
    setCustomerPage(1);
  }, [startDate, endDate, selectedVendor, selectedBranch, activeDetailsTab]);

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

  // Additional Details Calculations
  const totalOrders = pnlData.sales.length;
  const avgOrderValue = totalOrders > 0 ? (grossRevenue / totalOrders) : 0;
  const totalUnitsSold = pnlData.products.reduce((acc: any, curr: any) => acc + Number(curr.total_sold || 0), 0);
  const totalPurchasesValue = pnlData.purchases.reduce((acc: any, curr: any) => acc + Number(curr.final_amount || curr.total_amount || 0), 0);

  // Products list
  const sortedProducts = [...pnlData.products].sort((a: any, b: any) => Number(b.revenue || 0) - Number(a.revenue || 0));

  // Group Wastage by Product
  const wastageGrouped = pnlData.wastage.reduce((acc: any, curr: any) => {
    const key = curr.product_name || 'Unknown';
    if (!acc[key]) {
      acc[key] = {
        name: key,
        nameAr: curr.product_name_ar || key,
        qty: 0,
        costPrice: Number(curr.cost_price || 0),
        totalLoss: 0
      };
    }
    acc[key].qty += Number(curr.quantity || 0);
    acc[key].totalLoss += Number(curr.quantity || 0) * Number(curr.cost_price || 0);
    return acc;
  }, {});
  const wastageItems = Object.values(wastageGrouped).sort((a: any, b: any) => b.totalLoss - a.totalLoss);

  // Group P&L by Customer & Branch
  const customerPLMap: Record<string, any> = {};
  
  pnlData.sales.forEach((sale: any) => {
    const vId = sale.vendor_id || 'walkin';
    const vName = sale.vendor_name || 'Walk-in Customer';
    const vNameAr = sale.vendor_name_ar || 'زبون عابر';
    
    if (!customerPLMap[vId]) {
      customerPLMap[vId] = {
        vendor_id: vId,
        name: vName,
        nameAr: vNameAr,
        grossRevenue: 0,
        discounts: 0,
        returns: 0,
        cogs: 0,
        wastage: 0,
        branches: {}
      };
    }
    
    const customer = customerPLMap[vId];
    customer.grossRevenue += Number(sale.total_amount || 0);
    customer.discounts += Number(sale.discount_amount || 0);
    customer.returns += Number(sale.returns_amount || 0);
    customer.cogs += Number(sale.total_cost || 0);
    
    const bId = sale.branch_id || 'main';
    const bName = sale.branch_name || 'Main';
    const bNameAr = sale.branch_name_ar || 'الرئيسي';
    if (!customer.branches[bId]) {
      customer.branches[bId] = {
        branch_id: bId,
        name: bName,
        nameAr: bNameAr,
        grossRevenue: 0,
        discounts: 0,
        returns: 0,
        cogs: 0,
        wastage: 0
      };
    }
    const branch = customer.branches[bId];
    branch.grossRevenue += Number(sale.total_amount || 0);
    branch.discounts += Number(sale.discount_amount || 0);
    branch.returns += Number(sale.returns_amount || 0);
    branch.cogs += Number(sale.total_cost || 0);
  });
  
  pnlData.wastage.forEach((waste: any) => {
    const vId = waste.vendor_id || 'walkin';
    const vName = waste.vendor_name || 'Walk-in Customer';
    const vNameAr = waste.vendor_name_ar || 'زبون عابر';
    const loss = Number(waste.quantity || 0) * Number(waste.cost_price || 0);
    
    if (!customerPLMap[vId]) {
      customerPLMap[vId] = {
        vendor_id: vId,
        name: vName,
        nameAr: vNameAr,
        grossRevenue: 0,
        discounts: 0,
        returns: 0,
        cogs: 0,
        wastage: 0,
        branches: {}
      };
    }
    
    const customer = customerPLMap[vId];
    customer.wastage += loss;
    
    const bId = waste.branch_id || 'main';
    const bName = waste.branch_name || 'Main';
    const bNameAr = waste.branch_name_ar || 'الرئيسي';
    if (!customer.branches[bId]) {
      customer.branches[bId] = {
        branch_id: bId,
        name: bName,
        nameAr: bNameAr,
        grossRevenue: 0,
        discounts: 0,
        returns: 0,
        cogs: 0,
        wastage: 0
      };
    }
    customer.branches[bId].wastage += loss;
  });

  const customerPLRows = Object.values(customerPLMap).map((cust: any) => {
    const netRevenue = cust.grossRevenue - cust.discounts - cust.returns;
    const grossProfit = netRevenue - cust.cogs;
    const netProfit = grossProfit - cust.wastage;
    const margin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;
    
    const branchRows = Object.values(cust.branches).map((b: any) => {
      const bNetRevenue = b.grossRevenue - b.discounts - b.returns;
      const bGrossProfit = bNetRevenue - b.cogs;
      const bNetProfit = bGrossProfit - b.wastage;
      const bMargin = bNetRevenue > 0 ? (bNetProfit / bNetRevenue) * 100 : 0;
      return {
        ...b,
        netRevenue: bNetRevenue,
        grossProfit: bGrossProfit,
        netProfit: bNetProfit,
        margin: bMargin
      };
    }).sort((a: any, b: any) => b.netProfit - a.netProfit);
    
    return {
      ...cust,
      netRevenue,
      grossProfit,
      netProfit,
      margin,
      branchList: branchRows
    };
  }).sort((a: any, b: any) => b.netProfit - a.netProfit);

  const trendGrouped = pnlData.sales.reduce((acc: any, curr: any) => {
    const date = curr.report_date || 'N/A';
    if (date === 'N/A') return acc;
    if (!acc[date]) {
      acc[date] = { date, revenue: 0, cogs: 0 };
    }
    acc[date].revenue += Number(curr.final_amount || 0);
    acc[date].cogs += Number(curr.total_cost || 0);
    return acc;
  }, {});
  const trendData = Object.values(trendGrouped).sort((a: any, b: any) => a.date.localeCompare(b.date));

  const toggleCustomer = (vendorId: string) => {
    setExpandedCustomers(prev => ({
      ...prev,
      [vendorId]: !prev[vendorId]
    }));
  };

  const handleExportCSV = () => {
    if (!data) return toast.warning("No data to export.");
    
    let csvParts: string[] = [];

    csvParts.push("OFFICIAL PROFIT & LOSS STATEMENT");
    csvParts.push(`Period,${startDate} to ${endDate}`);
    csvParts.push("Financial Statement Line Item,Amount (KWD)");
    csvParts.push(`Gross Sales Revenue,${grossRevenue.toFixed(3)}`);
    csvParts.push(`Discounts Allowed,-${discounts.toFixed(3)}`);
    csvParts.push(`Sales Returns,-${salesReturns.toFixed(3)}`);
    csvParts.push(`Net Revenue,${netRevenue.toFixed(3)}`);
    csvParts.push(`Cost of Goods Sold (COGS),-${cogs.toFixed(3)}`);
    csvParts.push(`Gross Profit,${grossProfit.toFixed(3)}`);
    csvParts.push(`Wastage Loss,-${wastageLoss.toFixed(3)}`);
    csvParts.push(`Net Profit,${netProfit.toFixed(3)}`);
    csvParts.push("\n");

    csvParts.push("PRODUCT PERFORMANCE BREAKDOWN");
    csvParts.push("Product Name,Units Sold,Revenue (KD),Cost (COGS) (KD),Gross Margin %");
    sortedProducts.forEach(p => {
      const pRev = Number(p.revenue || 0);
      const pCogs = Number(p.total_cost || 0);
      const pMargin = pRev > 0 ? ((pRev - pCogs) / pRev * 100).toFixed(2) : "0.00";
      csvParts.push(`"${p.name_en || 'N/A'}",${p.total_sold || 0},${pRev.toFixed(3)},${pCogs.toFixed(3)},${pMargin}%`);
    });
    csvParts.push("\n");

    csvParts.push("WASTAGE BREAKDOWN BY ITEM");
    csvParts.push("Product Name,Qty Wasted,Cost/Unit (KD),Total Loss (KD),% of Gross Revenue");
    wastageItems.forEach((w: any) => {
      const pct = grossRevenue > 0 ? (w.totalLoss / grossRevenue * 100).toFixed(2) : "0.00";
      csvParts.push(`"${w.name}",${w.qty},${w.costPrice.toFixed(3)},${w.totalLoss.toFixed(3)},${pct}%`);
    });
    csvParts.push("\n");

    csvParts.push("PURCHASES BREAKDOWN");
    csvParts.push("Supplier/Vendor,PO Number,Total Amount (KD),Final Amount (KD),Date,Status");
    pnlData.purchases.forEach((po: any) => {
      csvParts.push(`"${po.vendor_name || 'N/A'}",${po.po_number || 'N/A'},${Number(po.total_amount || 0).toFixed(3)},${Number(po.final_amount || 0).toFixed(3)},${po.report_date || 'N/A'},${po.status || 'N/A'}`);
    });
    csvParts.push("\n");

    csvParts.push("PER-CUSTOMER PROFITABILITY SHEET");
    csvParts.push("Customer,Revenue (KD),COGS (KD),Gross Profit (KD),Wastage (KD),Net Profit (KD),Margin %");
    customerPLRows.forEach((cust: any) => {
      csvParts.push(`"${cust.name}",${cust.netRevenue.toFixed(3)},${cust.cogs.toFixed(3)},${cust.grossProfit.toFixed(3)},${cust.wastage.toFixed(3)},${cust.netProfit.toFixed(3)},${cust.margin.toFixed(2)}%`);
      if (cust.branchList && cust.branchList.length > 1) {
        cust.branchList.forEach((b: any) => {
          csvParts.push(`  ↳ Branch: "${b.name}",${b.netRevenue.toFixed(3)},${b.cogs.toFixed(3)},${b.grossProfit.toFixed(3)},${b.wastage.toFixed(3)},${b.netProfit.toFixed(3)},${b.margin.toFixed(2)}%`);
        });
      }
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvParts.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pnl_detailed_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeBranches = vendors.find(v => String(v.vendor_id) === String(selectedVendor))?.branches || [];

  // Pagination helper component
  const renderPagination = (currentPage: number, totalPages: number, onPageChange: (page: number) => void) => {
    if (totalPages <= 1) return null;
    return (
      <div className="pnl-pagination no-print">
        <span className="pnl-pagination-info">
          {language === 'ar' ? `الصفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
        </span>
        <div className="pnl-pagination-buttons">
          <button 
            className="pnl-page-btn" 
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            {language === 'ar' ? 'السابق' : 'Prev'}
          </button>
          <span className="pnl-page-indicator">{currentPage} / {totalPages}</span>
          <button 
            className="pnl-page-btn" 
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            {language === 'ar' ? 'التالي' : 'Next'}
          </button>
        </div>
      </div>
    );
  };

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
            
            <div className="pnl-action-buttons no-print">
              <button className="btn-pnl-action pnl-btn-secondary" onClick={handlePrint}>
                <Printer size={16} /> {t('print_report')}
              </button>
              <button className="btn-pnl-action pnl-btn-primary" onClick={handleExportCSV}>
                <Download size={16} /> {language === 'ar' ? 'تصدير الكشوفات' : 'Export Reports'}
              </button>
            </div>
          </div>

          {/* Quick Filters Area */}
          <div className="pnl-filter-strip no-print">
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
          <>
            {/* 1. Summary KPI Bar */}
            <div className="pnl-kpi-bar-strip animated fadeIn">
              <div className="kpi-strip-tile border-accent-blue">
                <div className="kpi-tile-header">
                  <div className="tile-icon-bg icon-blue"><ShoppingCart size={16} /></div>
                  <span className="tile-title">{language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</span>
                </div>
                <div className="kpi-tile-body">
                  <h3>{totalOrders}</h3>
                  <span className="tile-desc">{language === 'ar' ? 'الطلبات المكتملة والمستلمة' : 'Completed & live orders'}</span>
                </div>
              </div>

              <div className="kpi-strip-tile border-accent-blue">
                <div className="kpi-tile-header">
                  <div className="tile-icon-bg icon-blue"><BadgeCent size={16} /></div>
                  <span className="tile-title">{language === 'ar' ? 'إجمالي المبيعات' : 'Gross Sales'}</span>
                </div>
                <div className="kpi-tile-body">
                  <h3>{grossRevenue.toFixed(3)} <small className="kpi-unit">KD</small></h3>
                  <span className="tile-desc">{language === 'ar' ? 'القيمة الإجمالية للشحنات' : 'Total gross dispatched value'}</span>
                </div>
              </div>

              <div className="kpi-strip-tile border-accent-green">
                <div className="kpi-tile-header">
                  <div className="tile-icon-bg icon-green"><TrendingUp size={16} /></div>
                  <span className="tile-title">{language === 'ar' ? 'صافي الإيرادات' : 'Net Revenue'}</span>
                </div>
                <div className="kpi-tile-body">
                  <h3>{netRevenue.toFixed(3)} <small className="kpi-unit">KD</small></h3>
                  <span className="tile-desc">{language === 'ar' ? 'الصافي بعد الخصم والمرتجع' : 'Net sales value kept'}</span>
                </div>
              </div>

              <div className="kpi-strip-tile border-accent-orange">
                <div className="kpi-tile-header">
                  <div className="tile-icon-bg icon-orange"><Percent size={16} /></div>
                  <span className="tile-title">{language === 'ar' ? 'نسبة تكلفة البضاعة' : 'COGS % of Revenue'}</span>
                </div>
                <div className="kpi-tile-body">
                  <h3>{cogsPercent.toFixed(1)}%</h3>
                  <span className="tile-desc">{language === 'ar' ? `المواد: ${cogs.toFixed(3)} د.ك` : `Ingredients: ${cogs.toFixed(3)} KD`}</span>
                </div>
              </div>

              <div className="kpi-strip-tile border-accent-red">
                <div className="kpi-tile-header">
                  <div className="tile-icon-bg icon-red"><AlertTriangle size={16} /></div>
                  <span className="tile-title">{language === 'ar' ? 'خسائر الهدر' : 'Wastage Loss'}</span>
                </div>
                <div className="kpi-tile-body">
                  <h3>{wastageLoss.toFixed(3)} <small className="kpi-unit">KD</small></h3>
                  <span className="tile-desc">{language === 'ar' ? 'تكلفة المواد المهدورة والتالفة' : 'Spoilage & expired items cost'}</span>
                </div>
              </div>

              <div className="kpi-strip-tile border-accent-gold">
                <div className="kpi-tile-header">
                  <div className="tile-icon-bg icon-gold"><Store size={16} /></div>
                  <span className="tile-title">{language === 'ar' ? 'إجمالي المشتريات' : 'Total Purchases'}</span>
                </div>
                <div className="kpi-tile-body">
                  <h3>{totalPurchasesValue.toFixed(3)} <small className="kpi-unit">KD</small></h3>
                  <span className="tile-desc">{language === 'ar' ? 'مشتريات المخزون والمواد' : 'Inventory purchases value'}</span>
                </div>
              </div>

              {/* NET PROFIT BOTTOM LINE (Double width) */}
              <div className={`kpi-strip-tile kpi-double-width net-profit-bottom-line ${netProfit >= 0 ? 'positive-bottom-line' : 'negative-bottom-line'}`}>
                <div className="kpi-tile-header">
                  <div className="tile-icon-bg"><TrendingUp size={16} /></div>
                  <span className="tile-title font-bold">{language === 'ar' ? 'صافي الربح (الخلاصة)' : 'NET PROFIT (BOTTOM LINE)'}</span>
                </div>
                <div className="kpi-tile-body double-body">
                  <div className="double-main-value">
                    <h3>{netProfit.toFixed(3)} <small className="kpi-unit">KD</small></h3>
                  </div>
                  <div className="double-sub-values">
                    <span className="margin-pill">{language === 'ar' ? `الهامش: ${netProfitMargin.toFixed(1)}%` : `Margin: ${netProfitMargin.toFixed(1)}%`}</span>
                    <span className="cogs-wastage-info">
                      {language === 'ar' 
                        ? `بعد المواد (${cogs.toFixed(3)} د.ك) والهدر (${wastageLoss.toFixed(3)} د.ك)`
                        : `After COGS (${cogs.toFixed(3)} KD) & Wastage (${wastageLoss.toFixed(3)} KD)`
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* P&L Statement Grid */}

            {/* P&L Statement Grid */}
            <div className="pnl-content-grid animated fadeIn">
              
              {/* LEFT: Full P&L Table */}
              <div className="pnl-statement-column">
                <div className="premium-pnl-sheet">
                  <div className="sheet-header">
                    <div className="sheet-title">
                      <span className="dot"></span>
                      <span>{language === 'ar' ? 'بيان الأرباح والخسائر التفصيلي' : 'Detailed Profit & Loss Statement'}</span>
                    </div>
                    <span className="period-pill">{startDate} ➔ {endDate}</span>
                  </div>

                  <table className="pl-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50%', textAlign: 'left' }}>{language === 'ar' ? 'البيان' : 'Description'}</th>
                        <th>{language === 'ar' ? 'القيمة الحالية (د.ك)' : 'Current Period (KD)'}</th>
                        <th>{language === 'ar' ? 'نسبة الإيراد' : '% of Revenue'}</th>
                      </tr>
                    </thead>
                    <tbody>

                      {/* ── REVENUE ── */}
                      <tr className="group-header">
                        <td colSpan={3}>{language === 'ar' ? 'أولاً: الإيرادات التشغيلية' : 'I. Revenue'}</td>
                      </tr>
                      <tr>
                        <td>{language === 'ar' ? 'إجمالي قيمة المبيعات' : 'Gross Sales Revenue'}</td>
                        <td>{grossRevenue.toFixed(3)} KD</td>
                        <td>100.0%</td>
                      </tr>
                      <tr>
                        <td className="negative-val-text">{language === 'ar' ? '(-) الخصومات الممنوحة' : '(-) Discounts Allowed'}</td>
                        <td className="negative-val">-{discounts.toFixed(3)} KD</td>
                        <td className="negative-val">-{grossRevenue > 0 ? ((discounts / grossRevenue) * 100).toFixed(1) : '0.0'}%</td>
                      </tr>
                      <tr>
                        <td className="negative-val-text">{language === 'ar' ? '(-) مردودات المبيعات' : '(-) Sales Returns'}</td>
                        <td className="negative-val">-{salesReturns.toFixed(3)} KD</td>
                        <td className="negative-val">-{grossRevenue > 0 ? ((salesReturns / grossRevenue) * 100).toFixed(1) : '0.0'}%</td>
                      </tr>
                      <tr className="subtotal">
                        <td>{language === 'ar' ? 'صافي الإيرادات' : 'TOTAL NET REVENUE'}</td>
                        <td className="accent-val">{netRevenue.toFixed(3)} KD</td>
                        <td className="accent-val">{grossRevenue > 0 ? ((netRevenue / grossRevenue) * 100).toFixed(1) : '100.0'}%</td>
                      </tr>

                      <tr className="spacer"><td colSpan={3}></td></tr>

                      {/* ── COGS ── */}
                      <tr className="group-header">
                        <td colSpan={3}>{language === 'ar' ? 'ثانياً: تكلفة المبيعات (COGS)' : 'II. Cost of Goods Sold'}</td>
                      </tr>
                      <tr>
                        <td>{language === 'ar' ? 'تكلفة المواد والمكونات المباشرة' : 'Raw Materials & Ingredients'}</td>
                        <td className="negative-val">-{cogs.toFixed(3)} KD</td>
                        <td className="negative-val">-{cogsPercent.toFixed(1)}%</td>
                      </tr>
                      <tr className="subtotal">
                        <td>{language === 'ar' ? 'إجمالي تكلفة المبيعات' : 'TOTAL COGS'}</td>
                        <td className="negative-val">-{cogs.toFixed(3)} KD</td>
                        <td className="negative-val">-{cogsPercent.toFixed(1)}%</td>
                      </tr>
                      <tr className="subtotal">
                        <td>{language === 'ar' ? 'إجمالي الربح' : 'GROSS PROFIT'}</td>
                        <td className="positive-val">{grossProfit.toFixed(3)} KD</td>
                        <td className="positive-val">{grossProfitMargin.toFixed(1)}%</td>
                      </tr>

                      <tr className="spacer"><td colSpan={3}></td></tr>

                      {/* ── OPEX ── */}
                      <tr className="group-header">
                        <td colSpan={3}>{language === 'ar' ? 'ثالثاً: المصاريف التشغيلية (OPEX)' : 'III. Operating Expenses'}</td>
                      </tr>
                      <tr>
                        <td>{language === 'ar' ? 'خسائر الهدر والتلف والفاقد' : 'Wastage, Spoilage & Damages'}</td>
                        <td className="negative-val">-{wastageLoss.toFixed(3)} KD</td>
                        <td className="negative-val">-{wastagePercent.toFixed(1)}%</td>
                      </tr>
                      <tr className="subtotal">
                        <td>{language === 'ar' ? 'إجمالي المصاريف التشغيلية' : 'TOTAL OPERATING EXPENSES'}</td>
                        <td className="negative-val">-{wastageLoss.toFixed(3)} KD</td>
                        <td className="negative-val">-{wastagePercent.toFixed(1)}%</td>
                      </tr>

                      <tr className="spacer"><td colSpan={3}></td></tr>

                      {/* ── NET PROFIT ── */}
                      <tr className="grand-total">
                        <td>{language === 'ar' ? 'صافي الربح (الخلاصة)' : 'NET INCOME (NET PROFIT)'}</td>
                        <td className={netProfit >= 0 ? 'positive-val' : 'negative-val'}>{netProfit.toFixed(3)} KD</td>
                        <td className={netProfit >= 0 ? 'positive-val' : 'negative-val'}>{netProfitMargin.toFixed(1)}%</td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>

              {/* RIGHT: Sidebar Bento Cards */}
              <div className="pnl-analytics-column pnl-sidebar">

                {/* 1. Monthly net revenue trend */}
                <div className="sidebar-card">
                  <div className="card-title">{language === 'ar' ? 'منحنى صافي إيرادات المبيعات' : 'Monthly Net Revenue Trend'}</div>
                  <div className="trend-grid">
                    {trendData.length > 0 ? (
                      (() => {
                        const maxVal = Math.max(...trendData.map(d => d.revenue), 10);
                        return trendData.map((t: any, idx: number) => {
                          const height = Math.max(4, Math.round((t.revenue / maxVal) * 72));
                          return (
                            <div key={idx} className="trend-bar-wrap" title={`${t.date}: ${t.revenue.toFixed(3)} KD`}>
                              <div className="trend-bar" style={{ height: `${height}px`, background: 'var(--primary)' }}></div>
                              <span className="trend-label">{t.date.substring(5)}</span>
                            </div>
                          );
                        });
                      })()
                    ) : (
                      <div className="empty-trend-text">{language === 'ar' ? 'لا تتوفر بيانات كافية' : 'Insufficient trend logs'}</div>
                    )}
                  </div>
                </div>

                {/* 2. Revenue Sources (Top 5 Products) */}
                <div className="sidebar-card">
                  <div className="card-title">{language === 'ar' ? 'مصادر الإيرادات (أعلى المنتجات)' : 'Revenue Sources (Top Products)'}</div>
                  <div className="bar-chart">
                    {sortedProducts.slice(0, 5).map((p: any, idx: number) => {
                      const pRev = Number(p.revenue || 0);
                      const pct = grossRevenue > 0 ? (pRev / grossRevenue) * 100 : 0;
                      return (
                        <div className="bar-row" key={idx}>
                          <div className="bar-meta">
                            <span className="bar-label">{language === 'ar' ? (p.name_ar || p.name_en) : p.name_en}</span>
                            <span className="bar-amount">{pRev.toFixed(3)} KD</span>
                          </div>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ width: `${pct}%`, background: ['var(--primary)', 'var(--accent)', '#2e7d32', '#859b50', '#c62828'][idx % 5] }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Expense Breakdown (Top 5 Wastage Items) */}
                <div className="sidebar-card">
                  <div className="card-title">{language === 'ar' ? 'خسائر وتفاصيل الهدر والتلف' : 'OPEX / Spoilage Breakdown'}</div>
                  <div className="expense-list">
                    {wastageItems.length > 0 ? (
                      wastageItems.slice(0, 5).map((w: any, idx: number) => {
                        const totalW = wastageLoss || 1;
                        const pct = ((w.totalLoss / totalW) * 100).toFixed(0);
                        const colors = ['#01562c', '#f57f17', '#2e7d32', '#c62828', '#859b50'];
                        return (
                          <div className="expense-item" key={idx}>
                            <div className="expense-dot" style={{ background: colors[idx % colors.length] }}></div>
                            <div className="expense-name">{language === 'ar' ? (w.nameAr || w.name) : w.name}</div>
                            <div className="expense-pct">{pct}%</div>
                            <div className="expense-amt">{w.totalLoss.toFixed(3)} KD</div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-trend-text">{language === 'ar' ? 'لم يتم رصد تالف' : 'No wastage items recorded'}</div>
                    )}
                  </div>
                </div>

                {/* 4. Key Financial Ratios */}
                <div className="sidebar-card">
                  <div className="card-title">{language === 'ar' ? 'المؤشرات المالية الرئيسية' : 'Key Financial Ratios'}</div>
                  <table className="ratio-table">
                    <tbody>
                      <tr>
                        <td>{language === 'ar' ? 'هامش الربح الإجمالي' : 'Gross Margin'}</td>
                        <td className="positive-val font-semibold">{grossProfitMargin.toFixed(1)}%</td>
                      </tr>
                      <tr>
                        <td>{language === 'ar' ? 'هامش صافي الربح' : 'Net Margin'}</td>
                        <td className="positive-val font-semibold">{netProfitMargin.toFixed(1)}%</td>
                      </tr>
                      <tr>
                        <td>{language === 'ar' ? 'نسبة تكلفة البضاعة' : 'COGS % of Revenue'}</td>
                        <td>{cogsPercent.toFixed(1)}%</td>
                      </tr>
                      <tr>
                        <td>{language === 'ar' ? 'نسبة الهدر للإيرادات' : 'Wastage % of Revenue'}</td>
                        <td className="negative-val">{wastagePercent.toFixed(1)}%</td>
                      </tr>
                      <tr>
                        <td>{language === 'ar' ? 'متوسط قيمة الطلب' : 'Avg Order Value'}</td>
                        <td className="font-semibold">{avgOrderValue.toFixed(3)} KD</td>
                      </tr>
                      <tr>
                        <td>{language === 'ar' ? 'إجمالي الشحنات' : 'Total Deliveries'}</td>
                        <td>{totalOrders}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
            </div>

            {/* TABBED DETAILS HUB */}
            <div className="pnl-details-hub-card animated slideInUp no-print">
              <div className="pnl-tabs-nav">
                <button 
                  className={`pnl-tab-link ${activeDetailsTab === 'trend' ? 'active' : ''}`} 
                  onClick={() => setActiveDetailsTab('trend')}
                >
                  <TrendingUp size={16} /> 
                  <span>{language === 'ar' ? 'تحليل المنحنى والاتجاه' : 'Revenue vs COGS'}</span>
                </button>
                <button 
                  className={`pnl-tab-link ${activeDetailsTab === 'products' ? 'active' : ''}`} 
                  onClick={() => setActiveDetailsTab('products')}
                >
                  <Package size={16} /> 
                  <span>{language === 'ar' ? 'أداء المنتجات' : 'Top Products'}</span>
                </button>
                <button 
                  className={`pnl-tab-link ${activeDetailsTab === 'wastage' ? 'active' : ''}`} 
                  onClick={() => setActiveDetailsTab('wastage')}
                >
                  <AlertTriangle size={16} /> 
                  <span>{language === 'ar' ? 'تفاصيل الهدر' : 'Wastage Items'}</span>
                </button>
                <button 
                  className={`pnl-tab-link ${activeDetailsTab === 'purchases' ? 'active' : ''}`} 
                  onClick={() => setActiveDetailsTab('purchases')}
                >
                  <ShoppingCart size={16} /> 
                  <span>{language === 'ar' ? 'سجل المشتريات' : 'Purchases Detail'}</span>
                </button>
                <button 
                  className={`pnl-tab-link ${activeDetailsTab === 'customer' ? 'active' : ''}`} 
                  onClick={() => setActiveDetailsTab('customer')}
                >
                  <Store size={16} /> 
                  <span>{language === 'ar' ? 'ربحية العملاء' : 'Customer P&L'}</span>
                </button>
              </div>

              <div className="pnl-tab-content-container">
                
                {/* 1. Trend Tab */}
                {activeDetailsTab === 'trend' && (
                  <div className="tab-pane animated fadeIn">
                    <div className="tab-pane-header">
                      <h4>
                        <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                        {trendData.length >= 2 
                          ? (language === 'ar' ? 'حجم المبيعات اليومية مقابل تكلفة البضاعة المباعة' : 'Daily Sales Revenue vs COGS Analysis')
                          : (language === 'ar' ? 'إجمالي المبيعات حسب العميل' : 'Sales Distribution per Customer')}
                      </h4>
                    </div>

                    <div className="pnl-chart-container">
                      {trendData.length >= 2 ? (
                        <div className="svg-chart-wrapper">
                          <svg viewBox="0 0 1000 280" className="pnl-svg-chart">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <line key={i} x1="60" y1={40 + i * 45} x2="960" y2="40 + i * 45" stroke="#f1f5f9" strokeWidth="1.5" />
                            ))}
                            {(() => {
                              const maxVal = Math.max(...trendData.map(d => Math.max(d.revenue, d.cogs)), 10);
                              const pointsCount = trendData.length;
                              const spacing = 900 / pointsCount;
                              return trendData.map((d, index) => {
                                const xOffset = 60 + index * spacing + spacing / 4;
                                const revHeight = (d.revenue / maxVal) * 180;
                                const cogsHeight = (d.cogs / maxVal) * 180;
                                const revY = 220 - revHeight;
                                const cogsY = 220 - cogsHeight;
                                const barWidth = Math.max(8, spacing / 3.5);

                                return (
                                  <g key={index} className="svg-group-hover">
                                    <title>{`${d.date}\nRevenue: ${d.revenue.toFixed(3)} KD\nCOGS: ${d.cogs.toFixed(3)} KD`}</title>
                                    <rect x={xOffset} y={revY} width={barWidth} height={revHeight} fill="url(#blue-grad)" rx="4" />
                                    <rect x={xOffset + barWidth + 4} y={cogsY} width={barWidth} height={cogsHeight} fill="url(#orange-grad)" rx="4" />
                                    <text x={xOffset + barWidth} y="245" textAnchor="middle" fontSize="10" fontWeight="700" fill="#64748b">
                                      {d.date.substring(5)}
                                    </text>
                                  </g>
                                );
                              });
                            })()}
                            <defs>
                              <linearGradient id="blue-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="var(--primary-light)" />
                                <stop offset="100%" stopColor="var(--primary)" />
                              </linearGradient>
                              <linearGradient id="orange-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#ffb03a" />
                                <stop offset="100%" stopColor="var(--accent)" />
                              </linearGradient>
                            </defs>
                            <line x1="60" y1="220" x2="960" y2="220" stroke="#cbd5e1" strokeWidth="2" />
                          </svg>
                          <div className="chart-legend">
                            <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: 'var(--primary)' }}></span> {language === 'ar' ? 'صافي الإيرادات' : 'Sales Revenue'}</span>
                            <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: 'var(--accent)' }}></span> {language === 'ar' ? 'تكلفة المواد' : 'Ingredients COGS'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="svg-chart-wrapper">
                          {customerPLRows.length > 0 ? (
                            <svg viewBox="0 0 1000 280" className="pnl-svg-chart">
                              {[0, 1, 2, 3, 4].map((i) => (
                                <line key={i} x1="60" y1={40 + i * 45} x2="960" y2="40 + i * 45" stroke="#f1f5f9" strokeWidth="1.5" />
                              ))}
                              {(() => {
                                const maxVal = Math.max(...customerPLRows.map(c => c.netRevenue), 10);
                                const count = Math.min(6, customerPLRows.length);
                                const spacing = 900 / count;
                                return customerPLRows.slice(0, 6).map((c, index) => {
                                  const xOffset = 60 + index * spacing + spacing / 4;
                                  const barHeight = (c.netRevenue / maxVal) * 180;
                                  const barY = 220 - barHeight;
                                  const barWidth = Math.max(18, spacing / 3.2);

                                  return (
                                    <g key={index} className="svg-group-hover">
                                      <title>{`${c.name}\nRevenue: ${c.netRevenue.toFixed(3)} KD`}</title>
                                      <rect x={xOffset} y={barY} width={barWidth} height={barHeight} fill="url(#green-grad)" rx="6" />
                                      <text x={xOffset + barWidth / 2} y="245" textAnchor="middle" fontSize="10" fontWeight="700" fill="#64748b">
                                        {c.name.length > 12 ? c.name.substring(0, 10) + '..' : c.name}
                                      </text>
                                      <text x={xOffset + barWidth / 2} y={barY - 8} textAnchor="middle" fontSize="10" fontWeight="800" fill="#0f172a">
                                        {c.netRevenue.toFixed(1)} KD
                                      </text>
                                    </g>
                                  );
                                });
                              })()}
                              <defs>
                                <linearGradient id="green-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="var(--primary-light)" />
                                  <stop offset="100%" stopColor="var(--primary)" />
                                </linearGradient>
                              </defs>
                              <line x1="60" y1="220" x2="960" y2="220" stroke="#cbd5e1" strokeWidth="2" />
                            </svg>
                          ) : (
                            <div className="no-chart-data">{language === 'ar' ? 'لا توجد بيانات كافية لعرض الرسم البياني' : 'No transactional data available for charting'}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Products Tab */}
                {activeDetailsTab === 'products' && (
                  <div className="tab-pane animated fadeIn">
                    <div className="tab-pane-header">
                      <h4>{language === 'ar' ? 'المنتجات الأكثر مبيعاً وتحقيقاً للإيرادات' : 'Menu Sales & Itemized COGS'}</h4>
                    </div>
                    <div className="table-responsive">
                      <table className="premium-pnl-table">
                        <thead>
                          <tr>
                            <th>{language === 'ar' ? 'اسم الصنف' : 'Product Name'}</th>
                            <th className="text-center">{language === 'ar' ? 'الكمية المباعة' : 'Units Sold'}</th>
                            <th className="text-right">{language === 'ar' ? 'الإيرادات (د.ك)' : 'Revenue (KD)'}</th>
                            <th className="text-right">{language === 'ar' ? 'التكلفة (COGS)' : 'Ingredients Cost (KD)'}</th>
                            <th className="text-right">{language === 'ar' ? 'هامش الربح' : 'Margin %'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedProducts.length > 0 ? sortedProducts.slice((productsPage - 1) * 5, productsPage * 5).map((p: any, idx: number) => {
                            const pRev = Number(p.revenue || 0);
                            const pCogs = Number(p.total_cost || 0);
                            const margin = pRev > 0 ? ((pRev - pCogs) / pRev * 100) : 0;
                            return (
                              <tr key={idx} className="hover-highlight-row">
                                <td><strong>{language === 'ar' ? (p.name_ar || p.name_en) : p.name_en}</strong></td>
                                <td className="text-center font-semibold">{Number(p.total_sold || 0).toLocaleString()}</td>
                                <td className="text-right font-bold text-slate-800">{pRev.toFixed(3)} KD</td>
                                <td className="text-right text-orange-600">-{pCogs.toFixed(3)} KD</td>
                                <td className="text-right">
                                  <span className={`pnl-margin-badge ${margin >= 40 ? 'badge-high' : margin >= 20 ? 'badge-medium' : 'badge-low'}`}>
                                    {margin.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          }) : (
                            <tr>
                              <td colSpan={5} className="empty-table-cell">{language === 'ar' ? 'لا توجد بيانات أصناف' : 'No menu item logs found.'}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {renderPagination(productsPage, Math.ceil(sortedProducts.length / 5), setProductsPage)}
                  </div>
                )}

                {/* 3. Wastage Tab */}
                {activeDetailsTab === 'wastage' && (
                  <div className="tab-pane animated fadeIn">
                    <div className="tab-pane-header">
                      <h4>{language === 'ar' ? 'تحليل أصناف التلف والهدر' : 'Inventory Damage & Wastage Loss'}</h4>
                    </div>
                    <div className="table-responsive">
                      <table className="premium-pnl-table">
                        <thead>
                          <tr>
                            <th>{language === 'ar' ? 'اسم الصنف' : 'Product Name'}</th>
                            <th className="text-center">{language === 'ar' ? 'الكمية التالفة' : 'Qty Wasted'}</th>
                            <th className="text-right">{language === 'ar' ? 'سعر التكلفة للوحدة' : 'Cost/Unit (KD)'}</th>
                            <th className="text-right">{language === 'ar' ? 'الخسارة الكلية' : 'Total Loss (KD)'}</th>
                            <th className="text-right">{language === 'ar' ? 'نسبة الهدر للإيرادات' : '% of Revenue'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {wastageItems.length > 0 ? wastageItems.slice((wastagePage - 1) * 5, wastagePage * 5).map((w: any, idx: number) => {
                            const pct = grossRevenue > 0 ? (w.totalLoss / grossRevenue * 100) : 0;
                            const globalIndex = (wastagePage - 1) * 5 + idx;
                            const isTopWaster = globalIndex < 3 && w.totalLoss > 5;
                            return (
                              <tr key={idx} className={isTopWaster ? 'waster-alert-row' : 'hover-highlight-row'}>
                                <td>
                                  <span className="flex items-center gap-2">
                                    {isTopWaster && <span className="pulse-danger-indicator"></span>}
                                    <strong>{language === 'ar' ? (w.nameAr || w.name) : w.name}</strong>
                                  </span>
                                </td>
                                <td className="text-center font-semibold">{w.qty}</td>
                                <td className="text-right">{w.costPrice.toFixed(3)} KD</td>
                                <td className={`text-right font-bold ${isTopWaster ? 'text-red-600' : 'text-slate-800'}`}>
                                  -{w.totalLoss.toFixed(3)} KD
                                </td>
                                <td className="text-right text-slate-500 font-semibold">{pct.toFixed(2)}%</td>
                              </tr>
                            );
                          }) : (
                            <tr>
                              <td colSpan={5} className="empty-table-cell">{language === 'ar' ? 'لم يتم رصد هدر' : 'No wastage logs recorded.'}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {renderPagination(wastagePage, Math.ceil(wastageItems.length / 5), setWastagePage)}
                  </div>
                )}

                {/* 4. Purchases Tab */}
                {activeDetailsTab === 'purchases' && (
                  <div className="tab-pane animated fadeIn">
                    <div className="tab-pane-header">
                      <h4>{language === 'ar' ? 'تفاصيل فواتير التوريد والمشتريات' : 'Purchase Orders & Raw Inventory Receipts'}</h4>
                    </div>
                    {pnlData.purchases.length > 0 ? (
                      <>
                        <div className="table-responsive">
                          <table className="premium-pnl-table">
                            <thead>
                              <tr>
                                <th>{language === 'ar' ? 'المورد' : 'Supplier'}</th>
                                <th>{language === 'ar' ? 'رقم PO' : 'PO Number'}</th>
                                <th className="text-right">{language === 'ar' ? 'المبلغ الكلي' : 'Total Amount'}</th>
                                <th className="text-right">{language === 'ar' ? 'الصافي النهائي' : 'Final Value (KD)'}</th>
                                <th className="text-center">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                                <th className="text-center">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pnlData.purchases.slice((purchasesPage - 1) * 5, purchasesPage * 5).map((po: any, idx: number) => (
                                <tr key={idx} className="hover-highlight-row">
                                  <td><strong>{language === 'ar' ? (po.vendor_name_ar || po.vendor_name) : po.vendor_name}</strong></td>
                                  <td><span className="po-pill">{po.po_number}</span></td>
                                  <td className="text-right font-semibold">{Number(po.total_amount || 0).toFixed(3)} KD</td>
                                  <td className="text-right font-bold text-slate-800">{Number(po.final_amount || 0).toFixed(3)} KD</td>
                                  <td className="text-center text-slate-500">{po.report_date}</td>
                                  <td className="text-center">
                                    <span className={`status-pill ${po.status || 'draft'}`}>{po.status}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {renderPagination(purchasesPage, Math.ceil(pnlData.purchases.length / 5), setPurchasesPage)}
                      </>
                    ) : (
                      <div className="pnl-purchases-summary-card">
                        <div className="summary-icon-wrapper"><ShoppingCart size={24} /></div>
                        <div className="summary-text">
                          <h4>{language === 'ar' ? 'مجموع المشتريات للفترة' : 'Summary Period Purchases'}</h4>
                          <p>{language === 'ar' ? 'لا توجد مستندات شراء تفصيلية.' : 'No items matched. Total sum shown below:'}</p>
                          <h2>{totalPurchasesValue.toFixed(3)} KD</h2>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Customer P&L Tab */}
                {activeDetailsTab === 'customer' && (
                  <div className="tab-pane animated fadeIn">
                    <div className="tab-pane-header">
                      <h4>{language === 'ar' ? 'ربحية العملاء وتفاصيل حسابات الفروع' : 'Customer Account Profitability'}</h4>
                    </div>
                    <div className="table-responsive">
                      <table className="premium-pnl-table customer-pl-table">
                        <thead>
                          <tr>
                            <th style={{ width: '40px' }}></th>
                            <th>{language === 'ar' ? 'اسم العميل / الفرع' : 'Client / Branch'}</th>
                            <th className="text-right">{language === 'ar' ? 'الإيرادات' : 'Revenue'}</th>
                            <th className="text-right">{language === 'ar' ? 'التكلفة COGS' : 'COGS'}</th>
                            <th className="text-right">{language === 'ar' ? 'إجمالي الربح' : 'Gross Profit'}</th>
                            <th className="text-right">{language === 'ar' ? 'التلف والفاقد' : 'Wastage'}</th>
                            <th className="text-right">{language === 'ar' ? 'صافي الأرباح' : 'Net Profit'}</th>
                            <th className="text-right">{language === 'ar' ? 'هامش الربح' : 'Margin %'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerPLRows.length > 0 ? customerPLRows.slice((customerPage - 1) * 5, customerPage * 5).map((cust: any) => {
                            const isExpanded = !!expandedCustomers[cust.vendor_id];
                            const hasBranches = cust.branchList && cust.branchList.length > 1;
                            return (
                              <React.Fragment key={cust.vendor_id}>
                                <tr 
                                  className={`customer-parent-row ${hasBranches ? 'clickable-row' : ''}`}
                                  onClick={() => hasBranches && toggleCustomer(cust.vendor_id)}
                                >
                                  <td className="text-center">
                                    {hasBranches && (
                                      <button className="accordion-toggle-btn">
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                      </button>
                                    )}
                                  </td>
                                  <td>
                                    <div className="customer-cell-name">
                                      <span className="cust-bullet"></span>
                                      <strong>{language === 'ar' ? (cust.nameAr || cust.name) : cust.name}</strong>
                                      {hasBranches && <span className="branch-count-pill">{cust.branchList.length} {language === 'ar' ? 'فروع' : 'branches'}</span>}
                                    </div>
                                  </td>
                                  <td className="text-right font-bold">{cust.netRevenue.toFixed(3)} KD</td>
                                  <td className="text-right text-orange-600">-{cust.cogs.toFixed(3)} KD</td>
                                  <td className="text-right text-green-600 font-semibold">{cust.grossProfit.toFixed(3)} KD</td>
                                  <td className="text-right text-red-500">-{cust.wastage.toFixed(3)} KD</td>
                                  <td className={`text-right font-extrabold ${cust.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {cust.netProfit.toFixed(3)} KD
                                  </td>
                                  <td className="text-right">
                                    <span className={`pnl-margin-badge ${cust.margin >= 25 ? 'badge-high' : cust.margin >= 10 ? 'badge-medium' : 'badge-low'}`}>
                                      {cust.margin.toFixed(1)}%
                                    </span>
                                  </td>
                                </tr>

                                {hasBranches && isExpanded && cust.branchList.map((branch: any, bIdx: number) => (
                                  <tr key={`${cust.vendor_id}_${branch.branch_id || bIdx}`} className="branch-child-row animated fadeIn">
                                    <td></td>
                                    <td style={{ paddingLeft: '2.5rem' }}>
                                      <div className="branch-cell-name">
                                        <span className="branch-bullet"></span>
                                        <span>{language === 'ar' ? (branch.nameAr || branch.name) : branch.name}</span>
                                      </div>
                                    </td>
                                    <td className="text-right font-semibold">{branch.netRevenue.toFixed(3)} KD</td>
                                    <td className="text-right text-orange-600">-{branch.cogs.toFixed(3)} KD</td>
                                    <td className="text-right text-green-600">{branch.grossProfit.toFixed(3)} KD</td>
                                    <td className="text-right text-red-500">-{branch.wastage.toFixed(3)} KD</td>
                                    <td className={`text-right font-bold ${branch.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {branch.netProfit.toFixed(3)} KD
                                    </td>
                                    <td className="text-right">
                                      <span className={`pnl-margin-badge mini-badge ${branch.margin >= 25 ? 'badge-high' : branch.margin >= 10 ? 'badge-medium' : 'badge-low'}`}>
                                        {branch.margin.toFixed(1)}%
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          }) : (
                            <tr>
                              <td colSpan={8} className="empty-table-cell">{language === 'ar' ? 'لا تتوفر حسابات عملاء' : 'No customer records mapped.'}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {renderPagination(customerPage, Math.ceil(customerPLRows.length / 5), setCustomerPage)}
                  </div>
                )}

              </div>
            </div>
          </>
        )}

        {/* Print Only View */}
        <div className="print-view only-print">
          <div className="print-header">
            <div className="print-header-top">
              <div className="print-logo">
                <span className="logo-main">Fresh 'n' Fast</span>
                <span className="logo-sub">FOOD DISTRIBUTION CENTER</span>
              </div>
              <div className="print-title-meta">
                <h1>{language === 'ar' ? 'تقرير الأرباح والخسائر التفصيلي' : 'DETAILED PROFIT & LOSS REPORT'}</h1>
                <p className="print-period">{language === 'ar' ? `الفترة: من ${startDate} إلى ${endDate}` : `STATEMENT PERIOD: ${startDate} ➔ ${endDate}`}</p>
              </div>
            </div>
            <div className="print-divider"></div>
          </div>
          
          <h2>1. Official Profit & Loss Statement</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>Line Item</th>
                <th style={{ textAlign: 'right' }}>Amount (KWD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Gross Sales Revenue</td>
                <td style={{ textAlign: 'right' }}>{grossRevenue.toFixed(3)}</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: '20px' }}>(-) Discounts Allowed</td>
                <td style={{ textAlign: 'right' }}>-{discounts.toFixed(3)}</td>
              </tr>
              <tr>
                <td style={{ paddingLeft: '20px' }}>(-) Sales Returns</td>
                <td style={{ textAlign: 'right' }}>-{salesReturns.toFixed(3)}</td>
              </tr>
              <tr style={{ fontWeight: 'bold' }}>
                <td>Net Revenue</td>
                <td style={{ textAlign: 'right' }}>{netRevenue.toFixed(3)}</td>
              </tr>
              <tr>
                <td>Cost of Goods Sold (Ingredients)</td>
                <td style={{ textAlign: 'right' }}>-{cogs.toFixed(3)}</td>
              </tr>
              <tr style={{ fontWeight: 'bold' }}>
                <td>Gross Profit</td>
                <td style={{ textAlign: 'right' }}>{grossProfit.toFixed(3)}</td>
              </tr>
              <tr>
                <td>Wastage & Spoilage Loss</td>
                <td style={{ textAlign: 'right' }}>-{wastageLoss.toFixed(3)}</td>
              </tr>
              <tr style={{ fontWeight: 'bold', fontSize: '1.2rem', borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
                <td>Net Profit</td>
                <td style={{ textAlign: 'right' }}>{netProfit.toFixed(3)}</td>
              </tr>
            </tbody>
          </table>

          <div className="print-page-break"></div>

          <h2>2. Top Products by Revenue</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th style={{ textAlign: 'center' }}>Units Sold</th>
                <th style={{ textAlign: 'right' }}>Revenue (KD)</th>
                <th style={{ textAlign: 'right' }}>COGS (KD)</th>
                <th style={{ textAlign: 'right' }}>Margin %</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.slice(0, 15).map((p: any, idx: number) => {
                const pRev = Number(p.revenue || 0);
                const pCogs = Number(p.total_cost || 0);
                const margin = pRev > 0 ? ((pRev - pCogs) / pRev * 100) : 0;
                return (
                  <tr key={idx}>
                    <td>{p.name_en}</td>
                    <td style={{ textAlign: 'center' }}>{p.total_sold}</td>
                    <td style={{ textAlign: 'right' }}>{pRev.toFixed(3)}</td>
                    <td style={{ textAlign: 'right' }}>-{pCogs.toFixed(3)}</td>
                    <td style={{ textAlign: 'right' }}>{margin.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h2>3. Wastage Breakdown by Item</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th style={{ textAlign: 'center' }}>Qty Wasted</th>
                <th style={{ textAlign: 'right' }}>Cost/Unit (KD)</th>
                <th style={{ textAlign: 'right' }}>Total Loss (KD)</th>
                <th style={{ textAlign: 'right' }}>% of Gross Revenue</th>
              </tr>
            </thead>
            <tbody>
              {wastageItems.slice(0, 15).map((w: any, idx: number) => {
                const pct = grossRevenue > 0 ? (w.totalLoss / grossRevenue * 100) : 0;
                return (
                  <tr key={idx}>
                    <td>{w.name}</td>
                    <td style={{ textAlign: 'center' }}>{w.qty}</td>
                    <td style={{ textAlign: 'right' }}>{w.costPrice.toFixed(3)}</td>
                    <td style={{ textAlign: 'right' }}>-{w.totalLoss.toFixed(3)}</td>
                    <td style={{ textAlign: 'right' }}>{pct.toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="print-page-break"></div>

          <h2>4. Per-Customer P&L Breakdown</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>Customer / Branch</th>
                <th style={{ textAlign: 'right' }}>Revenue</th>
                <th style={{ textAlign: 'right' }}>COGS</th>
                <th style={{ textAlign: 'right' }}>Wastage</th>
                <th style={{ textAlign: 'right' }}>Net Profit</th>
                <th style={{ textAlign: 'right' }}>Margin %</th>
              </tr>
            </thead>
            <tbody>
              {customerPLRows.map((cust: any) => (
                <React.Fragment key={cust.vendor_id}>
                  <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                    <td>{cust.name}</td>
                    <td style={{ textAlign: 'right' }}>{cust.netRevenue.toFixed(3)}</td>
                    <td style={{ textAlign: 'right' }}>-{cust.cogs.toFixed(3)}</td>
                    <td style={{ textAlign: 'right' }}>-{cust.wastage.toFixed(3)}</td>
                    <td style={{ textAlign: 'right' }}>{cust.netProfit.toFixed(3)}</td>
                    <td style={{ textAlign: 'right' }}>{cust.margin.toFixed(1)}%</td>
                  </tr>
                  {cust.branchList && cust.branchList.length > 1 && cust.branchList.map((branch: any, bIdx: number) => (
                    <tr key={`${cust.vendor_id}_${branch.branch_id || bIdx}`} style={{ fontSize: '0.9rem', color: '#475569' }}>
                      <td style={{ paddingLeft: '20px' }}>↳ {branch.name}</td>
                      <td style={{ textAlign: 'right' }}>{branch.netRevenue.toFixed(3)}</td>
                      <td style={{ textAlign: 'right' }}>-{branch.cogs.toFixed(3)}</td>
                      <td style={{ textAlign: 'right' }}>-{branch.wastage.toFixed(3)}</td>
                      <td style={{ textAlign: 'right' }}>{branch.netProfit.toFixed(3)}</td>
                      <td style={{ textAlign: 'right' }}>{branch.margin.toFixed(1)}%</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .pnl-premium-container {
          padding: 2.5rem;
          max-width: 1400px;
          margin: 0 auto;
          font-family: 'DM Sans', -apple-system, sans-serif;
          background-color: var(--gray-50);
          min-height: 100vh;
        }

        /* Professional Premium Header with Brand Primary Colors (Forest Green) */
        .pnl-glass-header {
          background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%);
          border-radius: 16px;
          padding: 2.2rem 2.8rem;
          box-shadow: var(--shadow-md);
          margin-bottom: 2.2rem;
          position: relative;
          overflow: hidden;
          color: white;
          border: 1px solid var(--primary-dark);
        }

        .pnl-glass-header::before {
          content: '';
          position: absolute;
          top: -80px;
          right: -80px;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(245, 127, 23, 0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .pnl-glass-header::after {
          content: '';
          position: absolute;
          bottom: -40px;
          left: 200px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(13, 124, 67, 0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .pnl-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1.5rem;
          position: relative;
          z-index: 2;
        }

        .pnl-header-text h2 {
          font-family: 'Playfair Display', serif;
          font-size: 2.2rem;
          font-weight: 800;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          letter-spacing: -0.01em;
          color: white;
        }

        .pnl-sparkle-icon {
          color: var(--accent);
          animation: pulse 2.5s infinite ease-in-out;
        }

        .pnl-header-text p {
          color: var(--secondary-dim);
          font-size: 1rem;
          margin: 8px 0 0;
          font-weight: 500;
        }

        /* Styled Filter Strip */
        .pnl-filter-strip {
          display: flex;
          align-items: center;
          gap: 1.8rem;
          background: rgba(255, 255, 255, 0.07);
          padding: 1.2rem 1.8rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          flex-wrap: wrap;
          position: relative;
          z-index: 2;
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
          background: var(--white);
          border-radius: 8px;
          padding: 4px 10px;
          border: 1px solid var(--gray-200);
        }

        .pnl-date-picker-group input {
          border: none;
          background: transparent;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--gray-800);
          padding: 6px;
          outline: none;
        }

        .pnl-arrow-separator {
          color: var(--gray-500);
          display: flex;
          align-items: center;
          padding: 0 4px;
        }

        .pnl-select {
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--gray-800);
          outline: none;
          min-width: 190px;
          cursor: pointer;
        }

        .pnl-clear-btn {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: white;
          padding: 10px 18px;
          font-size: 0.82rem;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          align-self: flex-end;
        }

        .pnl-clear-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .pnl-action-buttons {
          display: flex;
          gap: 12px;
        }

        .btn-pnl-action {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0.85rem 1.6rem;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .pnl-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
        }

        .pnl-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .pnl-btn-primary {
          background: var(--accent);
          border: none;
          color: white;
          box-shadow: 0 4px 12px rgba(245, 127, 23, 0.3);
        }

        .pnl-btn-primary:hover {
          background: #d86f13;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(245, 127, 23, 0.4);
        }

        /* Summary KPI Bar Strip - Premium Minimal Cards */
        .pnl-kpi-bar-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(215px, 1fr));
          gap: 1.25rem;
          margin-bottom: 2.2rem;
        }

        @media (min-width: 1200px) {
          .pnl-kpi-bar-strip {
            grid-template-columns: repeat(6, 1fr);
          }
          .kpi-double-width {
            grid-column: span 2;
          }
        }

        .kpi-strip-tile {
          background: var(--white);
          padding: 1.1rem 1.25rem;
          border-radius: 14px;
          border: 1.5px solid var(--gray-200);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: var(--shadow-sm);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 125px;
        }

        .kpi-strip-tile:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }

        /* Top Accent Bars matching the client's screenshot */
        .border-accent-blue { border-top: 3.5px solid #3b82f6; }
        .border-accent-green { border-top: 3.5px solid var(--primary-light); }
        .border-accent-orange { border-top: 3.5px solid var(--accent); }
        .border-accent-gold { border-top: 3.5px solid #b89047; }
        .border-accent-red { border-top: 3.5px solid var(--danger); }

        .kpi-tile-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 0.6rem;
        }

        .tile-icon-bg {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .icon-blue { background: #eff6ff; color: #3b82f6; }
        .icon-green { background: #ecfdf5; color: var(--primary-light); }
        .icon-orange { background: #fff7ed; color: var(--accent); }
        .icon-gold { background: #fdfaf2; color: #b89047; }
        .icon-red { background: #fef2f2; color: var(--danger); }

        .tile-title {
          font-size: 0.72rem;
          color: var(--gray-500);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .kpi-tile-body h3 {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--gray-800);
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .tile-desc {
          font-size: 0.72rem;
          color: var(--gray-500);
          font-weight: 600;
          display: block;
          margin-top: 4px;
        }

        /* NET PROFIT BOTTOM LINE CARD SPECIAL STYLE */
        .net-profit-bottom-line {
          background: #f0fdf4;
          border: 2.5px solid #10b981;
          position: relative;
        }
        
        .net-profit-bottom-line.negative-bottom-line {
          background: #fef2f2;
          border: 2.5px solid var(--danger);
        }

        .net-profit-bottom-line .tile-icon-bg {
          background: #10b981;
          color: white;
        }
        .net-profit-bottom-line.negative-bottom-line .tile-icon-bg {
          background: var(--danger);
          color: white;
        }

        .net-profit-bottom-line .tile-title {
          color: #15803d;
        }
        .net-profit-bottom-line.negative-bottom-line .tile-title {
          color: #b91c1c;
        }

        .double-body {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 0.2rem;
        }

        .net-profit-bottom-line h3 {
          color: #15803d;
          font-size: 1.6rem;
        }
        .net-profit-bottom-line.negative-bottom-line h3 {
          color: #b91c1c;
          font-size: 1.6rem;
        }

        .double-sub-values {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .margin-pill {
          background: #dcfce7;
          color: #15803d;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 8px;
          display: inline-block;
        }
        .net-profit-bottom-line.negative-bottom-line .margin-pill {
          background: #fee2e2;
          color: #b91c1c;
        }

        .cogs-wastage-info {
          font-size: 0.68rem;
          color: #166534;
          font-weight: 600;
        }
        .net-profit-bottom-line.negative-bottom-line .cogs-wastage-info {
          color: #991b1b;
        }

        /* Grid Layout */
        .pnl-content-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 2.5rem;
          align-items: start;
          margin-bottom: 2.5rem;
        }

        /* Premium Financial Sheet Styling */
        .premium-pnl-sheet {
          background: var(--white);
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--gray-200);
        }

        .sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid var(--gray-100);
          padding-bottom: 1.5rem;
          margin-bottom: 2rem;
        }

        .sheet-title {
          font-family: 'Playfair Display', serif;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          color: var(--gray-800);
          font-size: 1.3rem;
        }

        .sheet-icon {
          color: var(--primary);
        }

        .period-pill {
          background: var(--gray-100);
          color: var(--gray-800);
          font-size: 0.8rem;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 20px;
        }

        /* ── SECTION TITLES & DOTS ── */
        .premium-pnl-sheet .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--primary);
          flex-shrink: 0;
          display: inline-block;
        }

        /* ── P&L TABLE ── */
        .pl-table {
          width: 100%;
          border-collapse: collapse;
          font-family: 'DM Mono', monospace;
          font-size: 0.88rem;
        }
        
        .pl-table th {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--gray-500);
          padding: 10px 14px;
          text-align: right;
          border-bottom: 2px solid var(--gray-200);
          font-weight: 700;
        }
        
        .pl-table th:first-child { text-align: left; }
        
        .pl-table td {
          padding: 11px 14px;
          text-align: right;
          border-bottom: 1px solid var(--gray-200);
          color: var(--gray-800);
          transition: background 0.15s;
        }
        
        .pl-table td:first-child {
          text-align: left;
          color: var(--gray-800);
          padding-left: 28px;
          font-weight: 500;
        }
        
        .pl-table tr:hover td { background: rgba(0,0,0,0.015); }
        
        .pl-table .group-header td {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--primary-dark);
          background: var(--gray-50);
          padding: 14px 14px 8px;
          border-top: 1.5px solid var(--gray-200);
          font-weight: 800;
        }
        
        .pl-table .group-header td:first-child { padding-left: 14px; }
        
        .pl-table .subtotal td {
          font-weight: 700;
          color: var(--gray-800);
          font-family: 'DM Mono', monospace;
          border-top: 1.5px solid var(--gray-200);
          background: rgba(0, 0, 0, 0.01);
        }
        
        .pl-table .subtotal td:first-child {
          color: var(--gray-800);
          padding-left: 14px;
        }
        
        .pl-table .grand-total td {
          font-family: 'Playfair Display', serif;
          font-size: 1.05rem;
          font-weight: 800;
          border-top: 2.5px solid var(--primary);
          border-bottom: 2.5px solid var(--primary);
          padding: 14px;
          background: rgba(1, 86, 44, 0.05);
        }
        
        .pl-table .grand-total td:first-child {
          color: var(--primary-dark);
          padding-left: 14px;
          font-family: 'Playfair Display', serif;
        }
        
        .pl-table .spacer td { height: 8px; border: none; background: transparent; }

        .positive-val { color: var(--success) !important; font-weight: 700; }
        .negative-val { color: var(--danger) !important; font-weight: 700; }
        .accent-val   { color: var(--primary) !important; font-weight: 700; }
        
        .negative-val-text {
          color: var(--gray-500) !important;
        }

        /* ── SIDEBAR CARDS & BENTO HUD ── */
        .pnl-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .sidebar-card {
          background: var(--white);
          border: 1.5px solid var(--gray-200);
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: var(--shadow-sm);
        }
        
        .sidebar-card .card-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--gray-500);
          margin-bottom: 1.25rem;
          font-weight: 800;
        }

        /* Mini vertical bar chart for trends */
        .trend-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 6px;
          align-items: flex-end;
          height: 80px;
          margin-top: 4px;
        }
        
        .trend-bar-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        
        .trend-bar {
          width: 100%;
          border-radius: 3px 3px 0 0;
          min-height: 4px;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .trend-bar:hover {
          filter: brightness(0.9);
          transform: scaleY(1.05);
        }
        
        .trend-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          color: var(--gray-500);
          font-weight: 700;
        }
        
        .empty-trend-text {
          font-size: 0.8rem;
          color: var(--gray-500);
          text-align: center;
          padding: 1.5rem 0;
        }

        /* Mini bar chart for top products */
        .bar-chart {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .bar-row {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .bar-meta {
          display: flex;
          justify-content: space-between;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
        }
        
        .bar-label {
          color: var(--gray-800);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }
        
        .bar-amount {
          font-family: 'DM Mono', monospace;
          color: var(--primary-light);
        }
        
        .bar-track {
          height: 6px;
          background: var(--gray-100);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* OPEX / Spoilage list */
        .expense-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .expense-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .expense-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .expense-name {
          flex: 1;
          font-size: 0.82rem;
          color: var(--gray-800);
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .expense-pct {
          font-family: 'DM Mono', monospace;
          font-size: 0.78rem;
          color: var(--gray-500);
          font-weight: 700;
        }
        
        .expense-amt {
          font-family: 'DM Mono', monospace;
          font-size: 0.78rem;
          color: var(--gray-800);
          font-weight: 700;
          min-width: 70px;
          text-align: right;
        }

        /* Ratios Table styling */
        .ratio-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .ratio-table td {
          padding: 8px 0;
          font-size: 0.82rem;
          border-bottom: 1px solid var(--gray-100);
          color: var(--gray-800);
          font-weight: 500;
        }
        
        .ratio-table td:first-child {
          color: var(--gray-500);
        }
        
        .ratio-table td:last-child {
          text-align: right;
          font-family: 'DM Mono', monospace;
        }

        /* KPI / Analytics Cards (Right Column) */
        .pnl-analytics-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* ------------------ PREMIUM TAB DETAILS HUB ------------------ */
        .pnl-details-hub-card {
          background: var(--white);
          border-radius: 16px;
          border: 1px solid var(--gray-200);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          margin-bottom: 3rem;
          transition: var(--transition);
        }

        .pnl-tabs-nav {
          display: flex;
          background: var(--gray-50);
          border-bottom: 1.5px solid var(--gray-200);
          padding: 10px 20px;
          gap: 8px;
          overflow-x: auto;
        }

        .pnl-tab-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border: none;
          background: transparent;
          color: var(--gray-500);
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          border-radius: 8px;
          white-space: nowrap;
          transition: var(--transition);
        }

        .pnl-tab-link:hover {
          color: var(--gray-800);
          background: var(--gray-100);
        }

        .pnl-tab-link.active {
          color: var(--white);
          background: var(--primary);
          box-shadow: var(--shadow-sm);
        }

        .pnl-tab-content-container {
          padding: 2.5rem;
        }

        .tab-pane-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.8rem;
        }

        .tab-pane-header h4 {
          font-family: 'Playfair Display', serif;
          margin: 0;
          font-size: 1.20rem;
          font-weight: 800;
          color: var(--gray-800);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* SVG Chart Styles */
        .pnl-chart-container {
          padding: 0.5rem 0;
        }

        .svg-chart-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .pnl-svg-chart {
          width: 100%;
          height: auto;
          max-height: 280px;
          background: var(--white);
          border-radius: 12px;
          border: 1px solid var(--gray-200);
          padding: 14px;
        }

        .svg-group-hover {
          cursor: pointer;
        }

        .svg-group-hover:hover rect {
          opacity: 0.9;
          filter: brightness(0.95);
        }

        .chart-legend {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-top: 0.5rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--gray-800);
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        /* Tables & Accents */
        .premium-pnl-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .premium-pnl-table th {
          padding: 1.1rem;
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--gray-800);
          border-bottom: 2px solid var(--gray-200);
          background: var(--gray-50);
        }

        .premium-pnl-table td {
          padding: 1.2rem 1.1rem;
          font-size: 0.9rem;
          color: var(--gray-800);
          border-bottom: 1px solid var(--gray-100);
        }

        .hover-highlight-row {
          transition: var(--transition);
        }

        .hover-highlight-row:hover {
          background-color: var(--gray-50);
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }

        .empty-table-cell {
          text-align: center;
          padding: 3rem !important;
          color: var(--gray-500);
          font-weight: 500;
        }

        .pnl-margin-badge {
          display: inline-block;
          padding: 5px 12px;
          border-radius: 12px;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .badge-high { background: #e8f5e9; color: var(--success); }
        .badge-medium { background: #fff3e0; color: var(--accent); }
        .badge-low { background: #ffebee; color: var(--danger); }
        .mini-badge { padding: 3px 9px; font-size: 0.72rem; }

        .waster-alert-row {
          background: #ffebee;
        }
        .waster-alert-row:hover {
          background: #ffcdd2;
        }

        .pulse-danger-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--danger);
          display: inline-block;
          animation: pulse-red 1.6s infinite;
        }

        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(198, 40, 40, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(198, 40, 40, 0); }
          100% { box-shadow: 0 0 0 0 rgba(198, 40, 40, 0); }
        }

        .pnl-purchases-summary-card {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: var(--gray-50);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid var(--gray-200);
        }

        .summary-icon-wrapper {
          width: 50px;
          height: 50px;
          border-radius: 10px;
          background: #fdfaf2;
          color: #b89047;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .summary-text h4 {
          margin: 0 0 4px 0;
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--gray-800);
        }

        .summary-text p {
          margin: 0;
          font-size: 0.78rem;
          color: var(--gray-500);
        }

        .summary-text h2 {
          margin: 8px 0 0 0;
          font-size: 1.45rem;
          font-weight: 800;
          color: #b89047;
        }

        /* Customer Accordion and Hierarchy */
        .customer-parent-row {
          background: var(--white);
          transition: var(--transition);
        }

        .customer-parent-row:hover {
          background: var(--gray-50);
        }

        .clickable-row {
          cursor: pointer;
        }

        .accordion-toggle-btn {
          border: none;
          background: transparent;
          color: var(--gray-500);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .customer-cell-name {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cust-bullet {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--primary);
        }

        .branch-count-pill {
          background: var(--gray-100);
          color: var(--gray-800);
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 8px;
        }

        .branch-child-row {
          background: var(--gray-50);
          border-left: 3px solid var(--primary);
        }

        .branch-cell-name {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
          color: var(--gray-800);
        }

        .branch-bullet {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--gray-500);
        }

        .po-pill {
          background: var(--gray-100);
          color: var(--primary-dark);
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          border: 1px solid var(--gray-200);
        }

        /* Pagination Styling */
        .pnl-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.5rem;
          padding-top: 1.2rem;
          border-top: 1.5px solid var(--gray-200);
        }

        .pnl-pagination-info {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--gray-500);
        }

        .pnl-pagination-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pnl-page-btn {
          background: var(--white);
          border: 1px solid var(--gray-200);
          color: var(--gray-800);
          padding: 7px 15px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
        }

        .pnl-page-btn:hover:not(:disabled) {
          background: var(--gray-50);
          border-color: var(--gray-500);
          color: var(--gray-800);
        }

        .pnl-page-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .pnl-page-indicator {
          font-size: 0.88rem;
          font-weight: 800;
          color: var(--gray-800);
        }

        /* Loading Card */
        .pnl-loading-card {
          background: var(--white);
          border-radius: 16px;
          padding: 5rem 2rem;
          text-align: center;
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--gray-200);
        }

        .spinner-glow {
          width: 44px;
          height: 44px;
          border: 3.5px solid var(--gray-100);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1.5rem;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
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
          
          .print-page-break {
            page-break-after: always;
          }

          .print-header {
            margin-bottom: 35px;
            font-family: 'DM Sans', -apple-system, sans-serif;
          }

          .print-header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 3px solid var(--primary);
            padding-bottom: 12px;
          }

          .print-logo {
            display: flex;
            flex-direction: column;
            text-align: left;
          }

          .print-logo .logo-main {
            font-family: 'Playfair Display', serif;
            font-size: 24px;
            font-weight: 900;
            color: var(--primary);
            letter-spacing: -0.5px;
          }

          .print-logo .logo-sub {
            font-size: 9px;
            font-weight: 800;
            color: var(--gray-500);
            letter-spacing: 2px;
            margin-top: -2px;
          }

          .print-title-meta {
            text-align: right;
          }

          .print-title-meta h1 {
            font-family: 'Playfair Display', serif;
            font-size: 20px;
            font-weight: 900;
            color: var(--gray-800);
            margin: 0;
          }

          .print-period {
            font-size: 10px;
            color: var(--gray-500);
            font-weight: 700;
            margin: 4px 0 0 0;
            letter-spacing: 0.5px;
          }

          .print-divider {
            height: 1px;
            background: var(--gray-200);
            margin-top: 4px;
          }

          .print-view h2 {
            font-family: 'Playfair Display', serif;
            font-size: 13px;
            font-weight: 800;
            color: var(--primary);
            margin: 25px 0 12px 0;
            border-bottom: 1.5px solid var(--gray-200);
            padding-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }

          .print-table th {
            background-color: var(--gray-50) !important;
            color: var(--gray-800) !important;
            font-family: 'DM Sans', sans-serif;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 12px;
            border-bottom: 2px solid var(--gray-200);
            text-align: left;
          }

          .print-table td {
            font-family: 'DM Sans', sans-serif;
            font-size: 10px;
            color: var(--gray-800);
            padding: 8px 12px;
            border-bottom: 1px solid var(--gray-100);
          }

          .print-table tr:nth-child(even) {
            background-color: rgba(245, 245, 220, 0.2);
          }
        }
      `}</style>
    </Layout>
  );
};

export default PNLReportPage;
