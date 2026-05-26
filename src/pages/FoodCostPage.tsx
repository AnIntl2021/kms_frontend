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
  Settings,
  ChevronLeft,
  ChevronRight,
  Package,
  ShoppingCart,
  ArrowRightLeft
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Chart from 'react-apexcharts';
import { useLanguage } from '../hooks/useLanguage';

interface FoodCostItem {
  inventory_item_id: number;
  name_en: string;
  name_ar: string;
  sku: string;
  unit_en: string;
  unit_ar: string;
  cost_price: number;
  category_name: string;
  opening_stock: number;
  receiving_stock: number;
  wastage: number;
  production_used: number;
  current_stock: number;
}

const FoodCostPage = () => {
  const { t, language, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<FoodCostItem[]>([]);
  const [salesRevenue, setSalesRevenue] = useState(0);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Local state for user overrides (keyed by inventory_item_id)
  const [transfersIn, setTransfersIn] = useState<Record<number, number>>({});
  const [transfersOut, setTransfersOut] = useState<Record<number, number>>({});
  const [closingStocks, setClosingStocks] = useState<Record<number, number>>({});

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate]);

  useEffect(() => {
    fetchFoodCostData();
  }, [startDate, endDate]);

  const fetchFoodCostData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/food-cost', {
        params: { startDate, endDate }
      });
      if (res.data.success) {
        const fetchedItems = res.data.data.items || [];
        setItems(fetchedItems);
        setSalesRevenue(Number(res.data.data.sales_revenue || 0));

        // Initialize closing stocks to current_stock from API
        const initialClosing: Record<number, number> = {};
        fetchedItems.forEach((item: FoodCostItem) => {
          initialClosing[item.inventory_item_id] = item.current_stock;
        });
        setClosingStocks(initialClosing);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load food cost report.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (items.length === 0) return toast.warning("No data to export.");

    const headers = [
      "SKU", 
      "Item Name", 
      "Opening Stock", 
      "Receiving", 
      "Transfer In", 
      "Transfer Out", 
      "Wastage", 
      "Closing Stock (EOM)", 
      "Food Cost Qty", 
      "Cost Price", 
      "Total Cost (KWD)"
    ];

    const rows = items.map(item => {
      const id = item.inventory_item_id;
      const tIn = transfersIn[id] || 0;
      const tOut = transfersOut[id] || 0;
      const closing = closingStocks[id] !== undefined ? closingStocks[id] : item.current_stock;
      
      const foodCostQty = item.opening_stock + item.receiving_stock + tIn - tOut + item.wastage - closing;
      const totalCostValue = foodCostQty * item.cost_price;

      return [
        item.sku,
        language === 'ar' ? (item.name_ar || item.name_en) : item.name_en,
        item.opening_stock,
        item.receiving_stock,
        tIn,
        tOut,
        item.wastage,
        closing,
        foodCostQty.toFixed(3),
        item.cost_price.toFixed(3),
        totalCostValue.toFixed(3)
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + headers.join(",") + "\n"
      + rows.map(e => e.map(val => `"${val}"`).join(",")).join("\n");
      
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Food_Cost_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculatedItems = items.map(item => {
    const id = item.inventory_item_id;
    const tIn = transfersIn[id] || 0;
    const tOut = transfersOut[id] || 0;
    const closing = closingStocks[id] !== undefined ? closingStocks[id] : item.current_stock;
    
    const foodCostQty = item.opening_stock + item.receiving_stock + tIn - tOut + item.wastage - closing;
    const totalCostValue = Math.max(0, foodCostQty * item.cost_price);

    return {
      ...item,
      transfersIn: tIn,
      transfersOut: tOut,
      closingStock: closing,
      foodCostQty,
      totalCostValue
    };
  });

  const filteredItems = calculatedItems.filter(item => {
    const searchStr = searchTerm.toLowerCase();
    if (!searchStr) return true;
    return (
      item.name_en.toLowerCase().includes(searchStr) ||
      (item.name_ar && item.name_ar.toLowerCase().includes(searchStr)) ||
      item.sku.toLowerCase().includes(searchStr) ||
      (item.category_name && item.category_name.toLowerCase().includes(searchStr))
    );
  });

  const itemsPerPage = 20;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalFoodCost = filteredItems.reduce((acc, curr) => acc + curr.totalCostValue, 0);
  const totalReceivingValue = filteredItems.reduce((acc, curr) => acc + (curr.receiving_stock * curr.cost_price), 0);
  const totalWastageValue = filteredItems.reduce((acc, curr) => acc + (curr.wastage * curr.cost_price), 0);
  const foodCostPercentage = salesRevenue > 0 ? ((totalFoodCost / salesRevenue) * 100).toFixed(1) : '0.0';

  const barOptions: any = {
    chart: { 
      type: 'bar',
      toolbar: { show: false }
    },
    plotOptions: { 
      bar: { 
        borderRadius: 8,
        columnWidth: '45%',
        distributed: true,
        dataLabels: {
          position: 'top'
        }
      } 
    },
    colors: ['#2563eb', '#10b981', '#ef4444', '#f59e0b', '#0d9488'],
    legend: { show: false },
    dataLabels: { 
      enabled: true,
      formatter: (val: number) => `${val.toFixed(3)} د.ك`,
      style: {
        fontSize: '11px',
        fontFamily: 'Outfit, sans-serif',
        fontWeight: 700,
        colors: ['#0f172a']
      },
      offsetY: -22
    },
    xaxis: {
      categories: ['Opening Stock', 'Receiving Stock', 'Wastage (Expired)', 'Closing Stock', 'Food Cost'],
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '12px',
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 600
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `${val.toFixed(3)} د.ك`,
        style: {
          colors: '#64748b',
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 600
        }
      }
    },
    grid: { 
      borderColor: '#f1f5f9', 
      strokeDashArray: 4 
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val.toFixed(3)} د.ك`
      }
    }
  };

  const barSeries = [{
    name: 'Value',
    data: [
      filteredItems.reduce((acc, curr) => acc + (curr.opening_stock * curr.cost_price), 0),
      totalReceivingValue,
      totalWastageValue,
      filteredItems.reduce((acc, curr) => acc + (curr.closingStock * curr.cost_price), 0),
      totalFoodCost
    ]
  }];

  return (
    <Layout title={t('food_cost_report')}>
      <div className="reports-container">

        {/* Top Control Bar with Neon Styling */}
        <div className="premium-filter-card animated fadeIn">
          <div className="filter-inner">
            <div className="date-picker-lux">
              <span className="lux-label"><Calendar size={16} /> {t('date_range')}</span>
              <div className="lux-date-inputs">
                <input 
                  type="date" 
                  value={startDate} 
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)} 
                />
                <span className="lux-connector">{t('to')}</span>
                <input 
                  type="date" 
                  value={endDate} 
                  min={startDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setEndDate(e.target.value)} 
                />
              </div>
            </div>

            <div className="search-lux">
              <span className="lux-label"><Search size={16} /> {t('quick_search')}</span>
              <div className="search-input-lux-wrapper">
                <input 
                  type="text" 
                  placeholder={t('search_sku_name')} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="action-lux-buttons">
              <button className="btn-lux printer" onClick={handlePrint}>
                <Printer size={16} /> {t('print_report')}
              </button>
              <button className="btn-lux export" onClick={handleExportCSV}>
                <Download size={16} /> {t('export_csv')}
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Metric Display Panels */}
        {!loading && filteredItems.length > 0 && (
          <div className="premium-metric-panels animated fadeIn">
            <div className="metric-panel food-cost-glow">
              <div className="panel-header">
                <div className="panel-badge-icon blue"><TrendingUp size={20} /></div>
                <span className="panel-title">{t('food_cost')}</span>
              </div>
              <div className="panel-body">
                <h3>{totalFoodCost.toFixed(3)} <span className="currency-span">{t('kd_currency')}</span></h3>
                <span className="panel-subtext">Aggregated from active filtered items</span>
              </div>
            </div>

            <div className="metric-panel percentage-glow">
              <div className="panel-header">
                <div className="panel-badge-icon green"><ShoppingCart size={20} /></div>
                <span className="panel-title">{t('food_cost_percentage')}</span>
              </div>
              <div className="panel-body">
                <h3>{foodCostPercentage}%</h3>
                <span className="panel-subtext">Sales Rev: {salesRevenue.toFixed(3)} {t('kd_currency')}</span>
              </div>
            </div>

            <div className="metric-panel wastage-glow">
              <div className="panel-header">
                <div className="panel-badge-icon red"><AlertTriangle size={20} /></div>
                <span className="panel-title">{t('total_returns_loss') || 'Wastage (Expired)'}</span>
              </div>
              <div className="panel-body">
                <h3>{totalWastageValue.toFixed(3)} <span className="currency-span">{t('kd_currency')}</span></h3>
                <span className="panel-subtext">Direct write-off value</span>
              </div>
            </div>
          </div>
        )}

        {/* High-End Analytics Dashboard */}
        {!loading && filteredItems.length > 0 && (
          <div className="premium-charts-section animated slideUp">
            <div className="chart-card-lux">
              <div className="chart-header-lux">
                <Package size={18} className="text-primary" />
                <h4>Food Cost Value Breakdown</h4>
              </div>
              <div className="chart-wrapper-lux">
                <Chart 
                  options={barOptions} 
                  series={barSeries} 
                  type="bar" 
                  height={320} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Modern Data Grid Container */}
        <div className="premium-data-grid no-print">
          {loading ? (
            <div className="lux-loader">
              <div className="lux-spinner"></div>
              <p>{t('refreshing_report_data')}</p>
            </div>
          ) : (
            <>
              <div className="lux-table-wrapper">
                <table className="lux-premium-table">
                  <thead>
                    <tr>
                      <th>{t('item_details')}</th>
                      <th>{t('sku')}</th>
                      <th className="text-center">{t('opening_stock')}</th>
                      <th className="text-center">{t('receiving')}</th>
                      <th className="text-center">{t('transfers_in')}</th>
                      <th className="text-center">{t('transfers_out')}</th>
                      <th className="text-center">{t('wastage_title')}</th>
                      <th className="text-center">{t('closing_stock')}</th>
                      <th className="text-center">{t('food_cost')}</th>
                      <th className="text-center">{t('cost_price')}</th>
                      <th className="text-end">{t('total_cost')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.length > 0 ? paginatedItems.map((item) => {
                      const id = item.inventory_item_id;
                      return (
                        <tr key={id} className="lux-table-row">
                          <td className="item-name-cell">
                            <div className="item-name-box">
                              <span className="en-name">{language === 'ar' ? (item.name_ar || item.name_en) : item.name_en}</span>
                              <span className="category-tag">{item.category_name || 'General'}</span>
                            </div>
                          </td>
                          <td><span className="lux-sku-pill">{item.sku}</span></td>
                          <td className="text-center text-secondary font-semibold">{item.opening_stock.toFixed(3)}</td>
                          <td className="text-center text-secondary font-semibold">{item.receiving_stock.toFixed(3)}</td>
                          
                          {/* Premium interactive inputs */}
                          <td className="text-center">
                            <input 
                              type="number" 
                              className="lux-clean-input"
                              value={transfersIn[id] || ''} 
                              placeholder="0"
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setTransfersIn(prev => ({ ...prev, [id]: val }));
                              }}
                            />
                          </td>

                          <td className="text-center">
                            <input 
                              type="number" 
                              className="lux-clean-input"
                              value={transfersOut[id] || ''} 
                              placeholder="0"
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setTransfersOut(prev => ({ ...prev, [id]: val }));
                              }}
                            />
                          </td>

                          <td className="text-center"><span className="loss-pill-val">{item.wastage.toFixed(3)}</span></td>

                          <td className="text-center">
                            <input 
                              type="number" 
                              className="lux-clean-input highlight"
                              value={closingStocks[id] !== undefined ? closingStocks[id] : item.current_stock} 
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setClosingStocks(prev => ({ ...prev, [id]: val }));
                              }}
                            />
                          </td>

                          <td className="text-center font-bold text-dark">
                            {item.foodCostQty.toFixed(3)}
                          </td>
                          <td className="text-center text-secondary">{item.cost_price.toFixed(3)}</td>
                          <td className="text-end">
                            <span className="lux-value-badge">
                              {item.totalCostValue.toFixed(3)} <span className="small-currency">د.ك</span>
                            </span>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={11} className="lux-empty-state">
                          <Package size={32} />
                          <p>{t('no_records_period')}</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Luxury Pagination Footer */}
              {totalPages > 1 && (
                <div className="lux-pagination-footer">
                  <span className="lux-pagination-info">
                    {language === 'ar' 
                      ? `الصفحة ${currentPage} من ${totalPages}` 
                      : `Showing Page ${currentPage} of ${totalPages}`}
                  </span>
                  <div className="lux-pagination-controls">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="lux-pagination-btn"
                    >
                      {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                    <div className="lux-pagination-pills">
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        // Show current page and neighbors
                        if (pageNum === 1 || pageNum === totalPages || Math.abs(currentPage - pageNum) <= 1) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`lux-page-pill ${currentPage === pageNum ? 'active' : ''}`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (pageNum === 2 || pageNum === totalPages - 1) {
                          return <span key={pageNum} className="lux-dots">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="lux-pagination-btn"
                    >
                      {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Print Only View */}
        <div className="print-view only-print">
          <h1>{t('food_cost_report')}</h1>
          <p>Period: {startDate} to {endDate}</p>
          <p>Sales Revenue: {salesRevenue.toFixed(3)} د.ك | Total Food Cost: {totalFoodCost.toFixed(3)} د.ك ({foodCostPercentage}%)</p>
          <hr />
          <table className="print-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Opening</th>
                <th>Receiving</th>
                <th>Trans. In</th>
                <th>Trans. Out</th>
                <th>Wastage</th>
                <th>Closing</th>
                <th>Cost Qty</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.inventory_item_id}>
                  <td>{item.name_en}</td>
                  <td>{item.sku}</td>
                  <td>{item.opening_stock.toFixed(3)}</td>
                  <td>{item.receiving_stock.toFixed(3)}</td>
                  <td>{item.transfersIn.toFixed(3)}</td>
                  <td>{item.transfersOut.toFixed(3)}</td>
                  <td>{item.wastage.toFixed(3)}</td>
                  <td>{item.closingStock.toFixed(3)}</td>
                  <td>{item.foodCostQty.toFixed(3)}</td>
                  <td>{item.totalCostValue.toFixed(3)} د.ك</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

        .reports-container { 
          padding: 1rem; 
          max-width: 100%; 
          margin: 0 auto; 
          font-family: 'Outfit', 'Inter', sans-serif;
          color: #0f172a;
        }

        /* 💎 Premium Filter Card Glassmorphism */
        .premium-filter-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
          margin-bottom: 2rem;
          transition: all 0.3s ease;
        }

        .filter-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .lux-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        .lux-date-inputs {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 4px 8px;
          transition: all 0.3s ease;
        }

        .lux-date-inputs:focus-within {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(1, 86, 44, 0.1);
          background: #fff;
        }

        .lux-date-inputs input {
          border: none;
          background: transparent;
          padding: 8px 12px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #0f172a;
          outline: none;
        }

        .lux-connector {
          font-size: 0.8rem;
          font-weight: 700;
          color: #94a3b8;
          padding: 0 4px;
        }

        .search-lux {
          flex: 1;
          min-width: 250px;
        }

        .search-input-lux-wrapper input {
          width: 100%;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #0f172a;
          outline: none;
          transition: all 0.3s ease;
        }

        .search-input-lux-wrapper input:focus {
          border-color: var(--primary);
          background: #fff;
          box-shadow: 0 0 0 3px rgba(1, 86, 44, 0.1);
        }

        .action-lux-buttons {
          display: flex;
          gap: 12px;
        }

        .btn-lux {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
        }

        .btn-lux.printer {
          background: #f1f5f9;
          color: #334155;
        }

        .btn-lux.printer:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        .btn-lux.export {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 12px rgba(1, 86, 44, 0.15);
        }

        .btn-lux.export:hover {
          opacity: 0.95;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(1, 86, 44, 0.25);
        }

        /* 🔋 Luxury Dashboard Metrics */
        .premium-metric-panels {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .metric-panel {
          background: #fff;
          border-radius: 24px;
          padding: 1.75rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 25px -15px rgba(0, 0, 0, 0.05);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .metric-panel:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 35px -15px rgba(0, 0, 0, 0.08);
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1.25rem;
        }

        .panel-badge-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .panel-badge-icon.blue { background: #eff6ff; color: #2563eb; }
        .panel-badge-icon.green { background: #ecfdf5; color: #059669; }
        .panel-badge-icon.red { background: #fef2f2; color: #dc2626; }

        .panel-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .panel-body h3 {
          font-size: 2.25rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 4px 0;
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .currency-span {
          font-size: 1.25rem;
          font-weight: 600;
          color: #64748b;
        }

        .panel-subtext {
          font-size: 0.75rem;
          font-weight: 600;
          color: #94a3b8;
        }

        /* 📈 Premium Chart Section */
        .premium-charts-section {
          margin-bottom: 2rem;
        }

        .chart-card-lux {
          background: #fff;
          border-radius: 24px;
          padding: 1.75rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 25px -15px rgba(0, 0, 0, 0.05);
        }

        .chart-header-lux {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 1.5rem;
        }

        .chart-header-lux h4 {
          margin: 0;
          font-weight: 800;
          font-size: 1.125rem;
          color: #0f172a;
        }

        /* 📊 Premium Table layout */
        .premium-data-grid {
          background: #fff;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.03);
          overflow: hidden;
          padding: 1rem;
        }

        .lux-table-wrapper {
          overflow-x: auto;
        }

        .lux-premium-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .lux-premium-table th {
          background: #f8fafc;
          padding: 0.6rem 0.4rem;
          color: #475569;
          font-weight: 700;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          border-bottom: 2px solid #e2e8f0;
        }

        .lux-premium-table td {
          padding: 0.5rem 0.4rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
          font-size: 0.8rem;
        }

        .lux-table-row {
          transition: background 0.2s ease;
        }

        .lux-table-row:hover {
          background: #f8fafc;
        }

        .item-name-cell {
          font-family: 'Outfit', sans-serif;
        }

        .item-name-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-name-box .en-name {
          font-weight: 700;
          color: #0f172a;
          font-size: 0.82rem;
        }

        .category-tag {
          font-size: 0.7rem;
          color: var(--primary);
          font-weight: 700;
          background: rgba(1, 86, 44, 0.05);
          padding: 2px 6px;
          border-radius: 4px;
          align-self: flex-start;
          text-transform: uppercase;
        }

        .lux-sku-pill {
          background: #e2e8f0;
          color: #475569;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        /* Clean Luxury Inline Inputs */
        .lux-clean-input {
          width: 52px;
          border: 1.5px solid #cbd5e1;
          border-radius: 6px;
          padding: 4px 6px;
          font-size: 0.78rem;
          font-weight: 700;
          text-align: center;
          background: #fff;
          color: #0f172a;
          transition: all 0.2s ease;
          outline: none;
        }

        .lux-clean-input:focus {
          border-color: var(--primary);
          background: #fff;
          box-shadow: 0 0 0 3px rgba(1, 86, 44, 0.1);
        }

        .lux-clean-input.highlight {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .lux-clean-input.highlight:focus {
          border-color: var(--primary);
          background: #fff;
        }

        .loss-pill-val {
          color: #ef4444;
          font-weight: 700;
          background: #fef2f2;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 0.75rem;
        }

        .lux-value-badge {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #dcfce7;
          padding: 4px 8px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.78rem;
          display: inline-block;
        }

        .small-currency {
          font-size: 0.7rem;
          font-weight: 600;
          color: #86efac;
        }

        .text-center { text-align: center; }
        .text-end { text-align: right; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .text-secondary { color: #475569; }
        .text-dark { color: #0f172a; }

        /* 💎 Pagination Footer Styling */
        .lux-pagination-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.5rem;
          padding: 0.75rem 0.5rem 0 0.5rem;
          border-top: 1px solid #f1f5f9;
        }

        .lux-pagination-info {
          font-size: 0.875rem;
          font-weight: 700;
          color: #64748b;
        }

        .lux-pagination-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .lux-pagination-btn {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 8px;
          background: #fff;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lux-pagination-btn:hover:not(:disabled) {
          border-color: var(--primary);
          color: var(--primary);
          background: rgba(1, 86, 44, 0.03);
        }

        .lux-pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .lux-pagination-pills {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .lux-page-pill {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #475569;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lux-page-pill:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .lux-page-pill.active {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
          box-shadow: 0 4px 10px rgba(1, 86, 44, 0.2);
        }

        .lux-dots {
          color: #94a3b8;
          font-weight: 700;
          padding: 0 4px;
        }

        /* Loader & Empty states */
        .lux-loader {
          padding: 60px;
          text-align: center;
        }

        .lux-spinner {
          margin: 0 auto 15px;
          width: 44px;
          height: 44px;
          border: 3.5px solid #f1f5f9;
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .lux-empty-state {
          text-align: center;
          padding: 5rem 2rem;
          color: #94a3b8;
        }

        .lux-empty-state svg {
          margin-bottom: 1rem;
          color: #cbd5e1;
        }

        .lux-empty-state p {
          font-size: 0.95rem;
          font-weight: 600;
        }

        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }

        .only-print { display: none; }
        @media print {
          .no-print { display: none; }
          .only-print { display: block; padding: 2rem; }
          .print-table { width: 100%; border-collapse: collapse; margin-top: 2rem; }
          .print-table th, .print-table td { border: 1px solid #ddd; padding: 10px; text-align: start; font-size: 12px; }
        }

        .animated { animation-duration: 0.5s; animation-fill-mode: both; }
        .fadeIn { animation-name: fadeIn; }
        .slideUp { animation-name: slideUp; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 992px) {
          .premium-metric-panels {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
};

export default FoodCostPage;
