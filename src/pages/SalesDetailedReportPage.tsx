import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useLanguage } from '../hooks/useLanguage';
import SearchableSelect from '../components/SearchableSelect';
import { FileText, Package, RotateCcw, CheckCircle2, TrendingUp, BarChart3, Filter } from 'lucide-react';
import { toast } from 'react-toastify';

const SalesDetailedReportPage = () => {
  const { t, language } = useLanguage();
  const [sales, setSales] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [clientFilter, setClientFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchSales();
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await api.get('/vendors');
      setVendors(res.data.data || []);
    } catch (e) {
      console.error('Failed to fetch vendors:', e);
    }
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sales');
      if (response.data.success) {
        setSales(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      toast.error('Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(s => {
    const clientMatch = (clientFilter === 'all' || String(s.vendor_id) === clientFilter || s.customer_name === clientFilter);
    let dateMatch = true;
    const saleDate = new Date(s.dispatch_date || s.order_date || s.created_at);
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (saleDate < start) dateMatch = false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (saleDate > end) dateMatch = false;
    }
    return clientMatch && dateMatch;
  });

  const productBreakdown = (Object.values(filteredSales.reduce((acc: any, order: any) => {
    let items = [];
    if (typeof order.items_json === 'string') {
      try { items = JSON.parse(order.items_json); } catch (e) {}
    } else if (Array.isArray(order.items_json)) {
      items = order.items_json;
    }

    items.forEach((item: any) => {
      if (!item || !item.menu_item_id) return;
      if (!acc[item.menu_item_id]) {
        acc[item.menu_item_id] = { name_en: item.name_en, sent: 0, returnQty: 0 };
      }
      acc[item.menu_item_id].sent += Number(item.quantity || 0);
      acc[item.menu_item_id].returnQty += Number(item.returns_qty || 0);
    });
    return acc;
  }, {} as Record<number, { name_en: string, sent: number, returnQty: number }>)) as any[]).sort((a: any, b: any) => b.sent - a.sent);

  const totalSent = productBreakdown.reduce((sum: number, item: any) => sum + Number(item.sent), 0);
  const totalReturn = productBreakdown.reduce((sum: number, item: any) => sum + Number(item.returnQty), 0);
  const totalSold = totalSent - totalReturn;

  return (
    <Layout title="Detailed Sales Report">
      <div className="inventory-container">
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 900 }}>Sales Report</h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '0.5rem' }}>
              Period: {startDate ? new Date(startDate).toLocaleDateString() : 'All Time'} – {endDate ? new Date(endDate).toLocaleDateString() : 'Today'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, maxWidth: '250px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Client</label>
            <SearchableSelect
              options={[
                { value: 'all', label: 'All Clients' },
                ...vendors.filter(v => v.type === 'client' || v.type === 'supplier').map(v => ({
                  value: String(v.vendor_id),
                  label: language === 'ar' ? (v.name_ar || v.name_en) : v.name_en
                }))
              ]}
              value={clientFilter}
              onChange={(val) => setClientFilter(val || 'all')}
              placeholder="Search Client..."
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>End Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '14px' }}
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="inventory-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="metric-card">
            <div className="metric-icon bg-blue"><Package size={24} /></div>
            <div className="metric-details">
               <span>Total Dispatched</span>
               <h3>{totalSent.toLocaleString()}</h3>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-orange"><RotateCcw size={24} /></div>
            <div className="metric-details">
               <span>Total Returns</span>
               <h3>{totalReturn.toLocaleString()}</h3>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-green"><CheckCircle2 size={24} /></div>
            <div className="metric-details">
               <span>Net Sold Items</span>
               <h3>{totalSold.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <div className="stock-table-card" style={{ padding: '2rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading report data...</div>
          ) : (
            <div className="table-wrapper">
              <table style={{ border: '1px solid #334155' }}>
                <thead>
                  <tr>
                    <th style={{ background: '#334155', color: 'white', textAlign: 'center', borderRight: '1px solid #475569' }}>#</th>
                    <th style={{ background: '#334155', color: 'white', borderRight: '1px solid #475569' }}>Product</th>
                    <th style={{ background: '#334155', color: 'white', textAlign: 'center', borderRight: '1px solid #475569' }}>Sent</th>
                    <th style={{ background: '#334155', color: 'white', textAlign: 'center', borderRight: '1px solid #475569' }}>Return</th>
                    <th style={{ background: '#334155', color: 'white', textAlign: 'center' }}>Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {productBreakdown.map((item: any, index: number) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', width: '60px' }}>{index + 1}</td>
                      <td style={{ borderRight: '1px solid #e2e8f0' }}>{item.name_en}</td>
                      <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{item.sent}</td>
                      <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>{item.returnQty}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.sent - item.returnQty}</td>
                    </tr>
                  ))}
                  {productBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No records found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#cbd5e1', fontWeight: 800 }}>
                    <td colSpan={2} style={{ textAlign: 'center', borderRight: '1px solid #94a3b8', padding: '1rem' }}>Total</td>
                    <td style={{ textAlign: 'center', borderRight: '1px solid #94a3b8' }}>{totalSent}</td>
                    <td style={{ textAlign: 'center', borderRight: '1px solid #94a3b8' }}>{totalReturn}</td>
                    <td style={{ textAlign: 'center' }}>{totalSold}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SalesDetailedReportPage;
