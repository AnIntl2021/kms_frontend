/* 
   SALES & DISPATCH DASHBOARD - HARD RECOVERY VERSION 
   SYNC TIMESTAMP: 2026-04-01-1805 
*/
import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { 
  TrendingUp, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Eye, 
  FileText,
  BadgeCent,
  Package,
  Calendar,
  MoreVertical,
  ChevronRight,
  Plus,
  X,
  User,
  ShoppingCart,
  Trash2,
  AlertTriangle,
  Printer,
  RotateCcw
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import FullInvoicePrint from '../components/FullInvoicePrint';
import './InventoryPage.css';
import { toast } from 'react-toastify';

interface SaleOrder {
  sale_id: number;
  customer_name: string;
  order_date: string;
  total_amount: number;
  payment_status: 'paid' | 'pending' | 'failed';
  dispatch_status: 'pending' | 'dispatched' | 'delivered' | 'cancelled';
  items_count: number;
}

const SalesPage = () => {
  const [sales, setSales] = useState<SaleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Order Form State
  const [customerName, setCustomerName] = useState('');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [menuSearch, setMenuSearch] = useState('');

  // Print State
  const printRef = useRef<HTMLDivElement>(null);
  const [printOrder, setPrintOrder] = useState<any>(null);
  const [printItems, setPrintItems] = useState<any[]>([]);

  // Detail Modal State
  const [detailOrder, setDetailOrder] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchSales();
    fetchMenuItems();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/business/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    }
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sales');
      if (response.data.success) {
        const data = response.data.data;
        setSales(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await api.get('/menu');
      if (response.data.success) {
        setMenuItems(response.data.data);
      }
    } catch (e) {
      console.error('Failed to fetch menu:', e);
    }
  };

  const handleUpdateStatus = async (saleId: number, nextStatus: string) => {
    try {
      await api.put(`/sales/${saleId}/status`, { dispatch_status: nextStatus });
      toast.success(`Order #${saleId} is now ${nextStatus.toUpperCase()}! 📦`);
      fetchSales();
    } catch (error) {
      toast.error('Failed to update order status.');
    }
  };

  const handleReturnOrder = async (saleId: number) => {
    console.warn('--- 🔄 INITIATING RETURN FOR ORDER #:', saleId);
    if (!saleId) {
       toast.error('Invalid Sale ID detected.');
       return;
    }

    if (!window.confirm(`Are you sure you want to RETURN Order #${saleId}? This will RESTORE the ingredient stock to the inventory. 🔄`)) return;
    
    try {
      console.warn('📡 SENDING RETURN SIGNAL TO BACKEND...');
      const response = await api.post(`/sales/${saleId}/return`);
      console.warn('✅ BACKEND RESPONSE:', response.data);
      
      toast.info(`Order #${saleId} has been returned. Stock levels restored! 🔄`);
      fetchSales();
    } catch (error: any) {
      console.error('❌ RETURN ERROR TRACE:', error);
      toast.error('Failed to process order return: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCreateOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedItems.length === 0) return toast.warning('Your cart is empty! Please add items to the order. 🛒');

    try {
      const total = selectedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
      const orderPayload = {
        customer_name: customerName,
        items: selectedItems.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity, price: i.price })),
        total_amount: total,
        payment_status: 'paid',
        dispatch_status: 'pending'
      };

      await api.post('/sales', orderPayload);
      setIsModalOpen(false);
      setCustomerName('');
      setSelectedItems([]);
      fetchSales();
      toast.success('Sale Recorded Successfully! 💹');
    } catch (error) {
      toast.error('Failed to record sale.');
    }
  };

  const handleViewOrder = async (sale: any) => {
     try {
        const res = await api.get(`/sales/${sale.sale_id}`);
        if (res.data.success) {
           setDetailOrder(res.data.data);
           setIsDetailModalOpen(true);
        }
     } catch (e) {
        toast.error('Failed to fetch order details.');
     }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${printOrder?.sale_id || 'Order'}`
  });

  const preparePrint = async (sale: any) => {
     try {
        const res = await api.get(`/sales/${sale.sale_id}`);
        if (res.data.success) {
           setPrintOrder(res.data.data);
           setPrintItems(res.data.data.items || []);
           setTimeout(() => handlePrint(), 500); 
        }
     } catch (e) {
        toast.error('Failed to fetch invoice details.');
     }
  };

  const addItemToOrder = (item: any) => {
    if (!item || !item.menu_item_id) return;
    
    const existing = selectedItems.find(i => i.menu_item_id === item.menu_item_id);
    if (existing) {
      setSelectedItems(selectedItems.map(i => i.menu_item_id === item.menu_item_id ? { ...i, quantity: (i.quantity || 0) + 1 } : i));
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  const removeItemFromOrder = (id: number) => {
    setSelectedItems(selectedItems.filter(i => i.menu_item_id !== id));
  };

  const getStatusBadge = (status: string) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'delivered' || statusLower === 'paid') return 'status-badge healthy';
    if (statusLower === 'dispatched') return 'status-badge warning';
    if (statusLower === 'pending') return 'status-badge pending';
    if (statusLower === 'cancelled' || statusLower === 'failed') return 'status-badge critical';
    return 'status-badge';
  };

  const filteredSales = (sales || []).filter(s => {
    const nameMatch = (s.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = String(s.sale_id || '').includes(searchTerm);
    const statusMatch = (statusFilter === 'all' || s.dispatch_status === statusFilter);
    return (nameMatch || idMatch) && statusMatch;
  });

  const stats = {
    totalRevenue: (Array.isArray(sales) ? sales : []).reduce((acc, curr) => acc + (curr.payment_status === 'paid' ? Number(curr.total_amount || 0) : 0), 0),
    pendingDispatch: (Array.isArray(sales) ? sales : []).filter(s => (s.dispatch_status || '').toLowerCase() === 'pending').length,
    todayOrders: (Array.isArray(sales) ? sales : []).length,
    completed: (Array.isArray(sales) ? sales : []).filter(s => (s.dispatch_status || '').toLowerCase() === 'delivered').length
  };

  return (
    <Layout title="Sales & Dispatch Center">
      <div className="inventory-container">
        {/* Sales Performance Metrics */}
        <div className="inventory-metrics">
          <div className="metric-card">
            <div className="metric-icon bg-green"><BadgeCent size={24} /></div>
            <div className="metric-details">
               <span>Today's Revenue</span>
               <h3>{stats.totalRevenue.toFixed(3)} د.ك</h3>
              <p className="trend positive"><TrendingUp size={12} /> +12.5% vs yesterday</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-orange"><Clock size={24} /></div>
            <div className="metric-details">
              <span>Pending Dispatch</span>
              <h3>{stats.pendingDispatch}</h3>
              <p className="trend warning">Needs attention</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-blue"><Package size={24} /></div>
            <div className="metric-details">
              <span>Total Orders</span>
              <h3>{stats.todayOrders}</h3>
              <p className="trend neutral">Live tracking</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-purple"><CheckCircle2 size={24} /></div>
            <div className="metric-details">
              <span>Completed Transfers</span>
              <h3>{stats.completed}</h3>
              <p className="trend positive">High efficiency</p>
            </div>
          </div>
        </div>

        <div className="inventory-actions">
          <div className="search-group">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by Order ID or Customer Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="action-buttons">
            <select 
              className="btn-filter" 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0 1rem' }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
            </select>
            <button className="btn-add" onClick={() => setIsModalOpen(true)} style={{ background: 'var(--primary)', color: 'white' }}>
               <ShoppingCart size={18} /> NEW DIRECT SALE
            </button>
          </div>
        </div>

        <div className="stock-table-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order Info</th>
                  <th>Customer</th>
                  <th>Date & Time</th>
                  <th>Total Amount</th>
                  <th>Payment</th>
                  <th>Dispatch Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-5">Loading orders...</td></tr>
                ) : (Array.isArray(filteredSales) ? filteredSales : []).map(sale => (
                  <tr key={sale.sale_id || Math.random()}>
                    <td>
                      <div className="item-info">
                        <strong>Order #{sale.sale_id || 'N/A'}</strong>
                        <span>{sale.items_count || 0} items included</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          background: 'rgba(5, 76, 45, 0.1)', 
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}>
                          {sale.customer_name?.[0] || '?'}
                        </div>
                        <span>{sale.customer_name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>{sale.order_date}</div>
                    </td>
                    <td><strong>{Number(sale.total_amount).toFixed(3)} د.ك</strong></td>
                    <td><span className={getStatusBadge(sale.payment_status)}>{sale.payment_status}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={getStatusBadge(sale.dispatch_status)}>{sale.dispatch_status}</span>
                        {sale.dispatch_status === 'dispatched' && <Truck size={14} color="#f59e0b" />}
                        {sale.dispatch_status === 'delivered' && <CheckCircle2 size={14} color="#10b981" />}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="row-actions" style={{ position: 'relative', zIndex: 100, display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                         <button className="btn-icon-sm" style={{color: '#054c2d'}} title="Print 1:1 Invoice" onClick={(e) => { e.stopPropagation(); preparePrint(sale); }}><Printer size={16} /></button>
                        {sale.dispatch_status === 'pending' && (
                           <button className="btn-icon-sm" style={{color: '#f59e0b'}} title="Dispatch Order" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(sale.sale_id, 'dispatched'); }}><Truck size={16} /></button>
                        )}
                        {sale.dispatch_status === 'dispatched' && (
                           <button className="btn-icon-sm" style={{color: '#10b981'}} title="Confirm Delivery" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(sale.sale_id, 'delivered'); }}><CheckCircle2 size={16} /></button>
                        )}
                        <button className="btn-icon-sm" style={{color: '#ef4444', background: 'none', border: 'none', padding: '5px', cursor: 'pointer' }} title="Return Order & Restore Stock" onClick={(e) => { e.stopPropagation(); handleReturnOrder(sale.sale_id); }}><RotateCcw size={16} /></button>
                        <button className="btn-icon-sm" style={{color: '#64748b'}} title="View Details" onClick={(e) => { e.stopPropagation(); handleViewOrder(sale); }}><Eye size={16} /></button>
                        <button className="btn-more" onClick={(e) => e.stopPropagation()}><MoreVertical size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ORDER DETAIL MODAL */}
        {isDetailModalOpen && detailOrder && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px', borderRadius: '24px' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Eye size={24} color="var(--primary)" />
                  <h3 style={{ margin: 0 }}>Order Details #{detailOrder.sale_id}</h3>
                </div>
                <button className="btn-close" onClick={() => setIsDetailModalOpen(false)}><X size={20} /></button>
              </div>
              <div className="modal-body" style={{ padding: '2rem' }}>
                 <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Customer: <b>{detailOrder.customer_name}</b></p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Date: {detailOrder.order_date}</p>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {detailOrder.items?.map((item: any) => (
                       <div key={item.sale_item_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                          <div><p style={{ margin: 0, fontWeight: 700 }}>{item.name_en}</p><p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Quantity: {item.quantity}</p></div>
                          <p style={{ margin: 0, fontWeight: 800, color: 'var(--primary)' }}>{Number(item.price * item.quantity).toFixed(3)} د.ك</p>
                       </div>
                    ))}
                 </div>
                 <div style={{ marginTop: '2rem', borderTop: '2px dashed #e2e8f0', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Total Amount</h3>
                    <h2 style={{ margin: 0, color: 'var(--primary)', fontWeight: 900 }}>{Number(detailOrder.total_amount).toFixed(3)} د.ك</h2>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NEW ORDER MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', borderRadius: '24px' }}>
             <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><ShoppingCart size={24} color="var(--primary)" /><h3 style={{ margin: 0 }}>Record New Wholesale Sale</h3></div>
                <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
             </div>
             <div className="modal-body" style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                   <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>CUSTOMER NAME *</label>
                        <User size={16} />
                        <input style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%' }} placeholder="e.g. Dana Catering" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                      </div>
                      <h5 style={{ margin: '0 0 1rem 0' }}>Cart: {selectedItems.length} Items</h5>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                         {selectedItems.map(item => (<div key={item.menu_item_id}>{item.name_en} x {item.quantity}</div>))}
                      </div>
                   </div>
                   <div>
                      <h5>Menu Items</h5>
                      {menuItems.map(item => (<div key={item.menu_item_id} onClick={() => addItemToOrder(item)} style={{ cursor: 'pointer', padding: '0.5rem', border: '1px solid #eee' }}>{item.name_en}</div>))}
                   </div>
                </div>
                <button onClick={() => handleCreateOrder()} style={{ marginTop: '2rem', width: '100%', padding: '1rem', background: '#054c2d', color: 'white', borderRadius: '12px' }}>FINALIZE SALE</button>
             </div>
          </div>
        </div>
      )}

      <div style={{ display: 'none' }}><FullInvoicePrint ref={printRef} order={printOrder} items={printItems} /></div>
    </Layout>
  );
};

export default SalesPage;
