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
  Eye, 
  BadgeCent,
  Package,
  MoreVertical,
  ShoppingCart,
  X,
  RotateCcw,
  Printer,
  Receipt,
  Edit,
  Settings,
  Zap
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import FullInvoicePrint from '../components/FullInvoicePrint';
import PrePrintedInvoice from '../components/PrePrintedInvoice';
import './InventoryPage.css';
import { toast } from 'react-toastify';
import SearchableSelect from '../components/SearchableSelect';

interface SaleOrder {
  sale_id: number;
  customer_name: string;
  order_date: string;
  total_amount: number;
  payment_status: 'paid' | 'pending' | 'failed';
  dispatch_status: 'pending' | 'dispatched' | 'delivered' | 'cancelled';
  items_count: number;
  dispatch_date?: string;
}

const SalesPage = () => {
  const [sales, setSales] = useState<SaleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 🛡️ DYNAMIC SEGREGATION HUD
  const [vendors, setVendors] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    vendor_id: '',
    branch_id: '',
    batch_number: '',
    expiry_date: '',
    payment_status: 'paid',
    dispatch_status: 'pending'
  });
  const [productionLogs, setProductionLogs] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  // Print State
  const printRef = useRef<HTMLDivElement>(null);
  const dotMatrixPrintRef = useRef<HTMLDivElement>(null);
  const [printOrder, setPrintOrder] = useState<any>(null);
  const [printItems, setPrintItems] = useState<any[]>([]);
  const [isPrePrintedMode, setIsPrePrintedMode] = useState(false);

  // Detail Modal State
  const [detailOrder, setDetailOrder] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Edit State
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Menu State
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  useEffect(() => {
    fetchSales();
    fetchMenuItems();
    fetchCategories();
    fetchVendors();
    fetchProductionHistory();

    // Close menu when clicking outside
    const handleClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await api.get('/vendors');
      setVendors(res.data.data || []);
    } catch (e) {
      console.error('Failed to fetch vendors for sales segregation:', e);
    }
  };

  const fetchProductionHistory = async () => {
    try {
      const res = await api.get('/factory/production/logs');
      setProductionLogs((res.data.data || []).filter((p: any) => p.batch_number));
    } catch (e) {
      console.error('Failed to fetch production history:', e);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/business/categories');
      if (response.data.success) {
        // Categories fetched but set state removed if not used in primary UI flow
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
        // 🛡️ FILTER TO ONLY SHOW 'SELLING' ITEMS IN SALES DASHBOARD
        const items = response.data.data;
        setMenuItems(Array.isArray(items) ? items.filter((i: any) => i.type === 'selling') : []);
      }
    } catch (e) {
      console.error('Failed to fetch menu:', e);
    }
  };

  const handleEditOrder = async (order: any) => {
    try {
      const response = await api.get(`/factory/sales/${order.sale_id}/items`);
      const items = response.data.data;
      
      setEditingOrder({
        sale_id: order.sale_id,
        vendor_id: order.vendor_id,
        branch_id: order.branch_id || 'main',
        customer_name: order.customer_name,
        discount_percentage: Number(((Number(order.discount_amount || 0) / Number(order.total_amount)) * 100).toFixed(2)) || 0,
        total_amount: Number(order.total_amount),
        batch_number: order.batch_number,
        expiry_date: order.expiry_date,
        items: items
      });
      setIsEditModalOpen(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load order items for editing.");
    }
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;
    try {
      await api.put(`/factory/sales/${editingOrder.sale_id}`, editingOrder);
      toast.success("Order fully updated and stock reconciled!");
      setIsEditModalOpen(false);
      fetchSales();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update order");
    }
  };

  const addItemToEditOrder = (item: any) => {
    if (!editingOrder) return;
    const existing = editingOrder.items.find((i: any) => i.menu_item_id === item.menu_item_id);
    if (existing) {
       const updated = editingOrder.items.map((i: any) => i.menu_item_id === item.menu_item_id ? {...i, quantity: i.quantity + 1} : i);
       setEditingOrder({...editingOrder, items: updated});
    } else {
       setEditingOrder({...editingOrder, items: [...editingOrder.items, {...item, quantity: 1, price: item.price}]});
    }
  };

  const handleUpdateStatus = async (saleId: number, nextStatus: string) => {
    try {
      await api.put(`/sales/${saleId}/status`, { dispatch_status: nextStatus });
      toast.success(`Order FNFI-${100000 + saleId} is now ${nextStatus.toUpperCase()}! 📦`);
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
      
      toast.info(`Order FNFI-${100000 + saleId} has been returned. Stock levels restored! 🔄`);
      fetchSales();
    } catch (error: any) {
      console.error('❌ RETURN ERROR TRACE:', error);
      toast.error('Failed to process order return: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCreateOrder = async () => {
    if (selectedItems.length === 0) return toast.warning('Cart is empty.');
    if (formData.vendor_id && !formData.branch_id) return toast.warning('Please select a target branch.');
    if (formData.vendor_id && !formData.batch_number) return toast.warning('Please select a production batch for distribution.');

    try {
      setLoading(true);
      const res = await api.post('/sales', {
        ...formData,
        items: selectedItems.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity, price: i.price }))
      });
      setIsModalOpen(false);
      setFormData({ customer_name: '', vendor_id: '', branch_id: '', batch_number: '', expiry_date: '', payment_status: 'paid', dispatch_status: 'pending' });
      setSelectedItems([]);
      fetchSales();
      toast.success('Sale & Branch Segregation Recorded! 💹');
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
    documentTitle: `Invoice-FNFI-${100000 + (printOrder?.sale_id || 0)}`
  });

  const handleDotMatrixPrint = useReactToPrint({
    contentRef: dotMatrixPrintRef,
    documentTitle: `LQ350-Invoice-FNFI-${100000 + (printOrder?.sale_id || 0)}`
  });

  const preparePrint = async (sale: any, isPrePrinted: boolean = false) => {
     try {
        const res = await api.get(`/sales/${sale.sale_id}`);
        if (res.data.success) {
           setPrintOrder(res.data.data);
           setPrintItems(res.data.data.items || []);
           setIsPrePrintedMode(isPrePrinted);
           
           setTimeout(() => {
              if (isPrePrinted) handleDotMatrixPrint();
              else handlePrint();
           }, 500); 
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
    const orderNum = 100000 + (s.sale_id || 0);
    const idMatch = String(s.sale_id || '').includes(searchTerm) || 
                    String(orderNum).includes(searchTerm) ||
                    `FNFI-${orderNum}`.toLowerCase().includes(searchTerm.toLowerCase());
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
                  <th>Dispatch Date</th>
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
                        <strong>FNFI-{100000 + (sale.sale_id || 0)}</strong>
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
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                           <span style={{ fontWeight: 700 }}>{sale.customer_name}</span>
                           {(sale as any).branch_name && (
                             <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                               { (sale as any).branch_name } Branch
                             </span>
                           )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>{sale.dispatch_date || sale.order_date}</div>
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
                      <div className="row-actions" style={{ position: 'relative', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                         {/* Core Quick Actions (Visible) */}
                         <button className="btn-icon-sm" style={{color: '#64748b'}} title="View Details" onClick={(e) => { e.stopPropagation(); handleViewOrder(sale); }}><Eye size={16} /></button>
                         
                         {sale.dispatch_status === 'pending' && (
                            <button className="btn-icon-sm" style={{color: '#f59e0b'}} title="Dispatch Order" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(sale.sale_id, 'dispatched'); }}><Truck size={16} /></button>
                         )}
                         {sale.dispatch_status === 'dispatched' && (
                            <button className="btn-icon-sm" style={{color: '#10b981'}} title="Confirm Delivery" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(sale.sale_id, 'delivered'); }}><CheckCircle2 size={16} /></button>
                         )}

                         {/* More Options Dropdown */}
                         <div style={{ position: 'relative' }}>
                            <button 
                              className="btn-more" 
                              onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === sale.sale_id ? null : sale.sale_id); }}
                              style={{ background: activeMenuId === sale.sale_id ? '#f1f5f9' : 'transparent', borderRadius: '8px', padding: '5px' }}
                            >
                              <MoreVertical size={18} />
                            </button>

                            {activeMenuId === sale.sale_id && (
                              <div className="dropdown-menu-custom" style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                width: '180px',
                                background: 'white',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                                border: '1px solid #e2e8f0',
                                zIndex: 1000,
                                overflow: 'hidden',
                                marginTop: '5px'
                              }}>
                                <button className="dropdown-item" onClick={() => preparePrint(sale, false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 15px', border: 'none', background: 'none', textAlign: 'left', fontSize: '13px', cursor: 'pointer' }}>
                                  <Printer size={14} color="#054c2d" /> Standard PDF Print
                                </button>
                                <button className="dropdown-item" onClick={() => preparePrint(sale, true)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 15px', border: 'none', background: 'none', textAlign: 'left', fontSize: '13px', cursor: 'pointer' }}>
                                  <Receipt size={14} color="#f59e0b" /> Dot Matrix (LQ350)
                                </button>
                                {(sale.dispatch_status || '').toLowerCase() !== 'delivered' && (
                                  <button className="dropdown-item" onClick={() => handleEditOrder(sale)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 15px', border: 'none', background: 'none', textAlign: 'left', fontSize: '13px', cursor: 'pointer' }}>
                                    <Edit size={14} color="#0369a1" /> Edit Order
                                  </button>
                                )}
                                <div style={{ height: '1px', background: '#f1f5f9' }} />
                                <button className="dropdown-item" onClick={() => handleReturnOrder(sale.sale_id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 15px', border: 'none', background: 'none', textAlign: 'left', fontSize: '13px', cursor: 'pointer', color: '#ef4444' }}>
                                  <RotateCcw size={14} /> Return Order
                                </button>
                              </div>
                            )}
                         </div>
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
                  <h3 style={{ margin: 0 }}>Order Details FNFI-{100000 + (detailOrder.sale_id || 0)}</h3>
                </div>
                <button className="btn-close" onClick={() => setIsDetailModalOpen(false)}><X size={20} /></button>
              </div>
              <div className="modal-body" style={{ padding: '2rem' }}>
                 <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Customer: <b>{detailOrder.customer_name}</b></p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Dispatch Batch: <b style={{ color: 'var(--primary)' }}>{detailOrder.batch_number || 'N/A'}</b></p>
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

      {/* 🛡️ DYNAMIC DISTRIBUTION MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', borderRadius: '24px' }}>
             <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ShoppingCart size={24} color="var(--primary)" />
                  <h3 style={{ margin: 0 }}>Record Distribution Sale</h3>
                </div>
                <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
             </div>
             <div className="modal-body" style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                       <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                         <label style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>DISTRIBUTION PARTNER *</label>
                         <SearchableSelect
                           options={vendors
                             .filter(v => v.type === 'client' || v.type === 'supplier')
                             .map(v => ({ value: v.vendor_id, label: v.name_en }))}
                           value={formData.vendor_id}
                           onChange={(val) => {
                             const v = vendors.find(v => String(v.vendor_id) === String(val));
                             setFormData({...formData, vendor_id: String(val), branch_id: '', customer_name: v?.name_en || ''});
                           }}
                           placeholder="Choose Client..."
                         />
                       </div>
  
                       <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                         <label style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>DELIVERY BRANCH NODE *</label>
                         <SearchableSelect
                           options={[
                             { value: 'main', label: 'Main Corporate Hub' },
                             ...(vendors.find(v => String(v.vendor_id) === String(formData.vendor_id))?.branches?.map((br: any) => ({
                               value: br.branch_id,
                               label: br.name_en
                             })) || [])
                           ]}
                           value={formData.branch_id}
                           onChange={(val) => setFormData({...formData, branch_id: String(val)})}
                           placeholder="Select Destination..."
                         />
                       </div>
  
                       <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                         <label style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>PRODUCTION BATCH *</label>
                         <SearchableSelect
                           options={productionLogs.map(p => ({
                             value: p.batch_number,
                             label: `${p.batch_number} (Exp: ${new Date(p.expiry_date).toLocaleDateString()})`
                           }))}
                           value={formData.batch_number}
                           onChange={(val) => {
                             const b = productionLogs.find(p => p.batch_number === val);
                             setFormData({...formData, batch_number: String(val), expiry_date: b?.expiry_date || ''});
                           }}
                           placeholder="Choose Batch..."
                         />
                       </div>

                       <h5 style={{ margin: '1rem 0 0.5rem 0' }}>Cart: {selectedItems.length} Products</h5>
                       <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {selectedItems.map(item => (<div key={item.menu_item_id} style={{ fontSize: '11px', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>{item.name_en} x {item.quantity}</div>))}
                       </div>
                    </div>
                    <div>
                       <h5 style={{ fontSize: '13px', color: '#64748b', marginBottom: '1rem' }}>Selection Menu</h5>
                       <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         {menuItems.map(item => (
                           <div key={item.menu_item_id} onClick={() => addItemToOrder(item)} style={{ cursor: 'pointer', padding: '10px 15px', background: 'white', border: '1px solid #eee', borderRadius: '10px', fontSize: '13px', fontWeight: 600 }}>
                             {item.name_en}
                           </div>
                         ))}
                       </div>
                    </div>
                 </div>
                 <button onClick={() => handleCreateOrder()} style={{ marginTop: '2rem', width: '100%', padding: '1rem', background: '#054c2d', color: 'white', borderRadius: '14px', fontWeight: 800, fontSize: '15px' }}>
                   FINALIZE DISTRIBUTION & RECORD SALE
                 </button>
              </div>
           </div>
        </div>
      )}
      {isEditModalOpen && editingOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px', borderRadius: '24px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Edit size={24} color="var(--primary)" />
                <h3 style={{ margin: 0 }}>Modify Order FNFI-{100000 + (editingOrder.sale_id || 0)}</h3>
              </div>
              <button className="btn-close" onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '2rem' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                       <label style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>DISTRIBUTION PARTNER</label>
                       <SearchableSelect
                         options={vendors
                           .filter(v => v.type === 'client' || v.type === 'supplier')
                           .map(v => ({ value: v.vendor_id, label: v.name_en }))}
                         value={editingOrder.vendor_id}
                         onChange={(val) => {
                           const v = vendors.find(v => String(v.vendor_id) === String(val));
                           setEditingOrder({...editingOrder, vendor_id: String(val), customer_name: v?.name_en || ''});
                         }}
                         placeholder="Choose Client..."
                       />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                       <label style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>DELIVERY BRANCH NODE</label>
                       <SearchableSelect
                         options={[
                           { value: 'main', label: 'Main Corporate Hub' },
                           ...(vendors.find(v => String(v.vendor_id) === String(editingOrder.vendor_id))?.branches?.map((br: any) => ({
                             value: br.branch_id,
                             label: br.name_en
                           })) || [])
                         ]}
                         value={editingOrder.branch_id}
                         onChange={(val) => setEditingOrder({...editingOrder, branch_id: String(val)})}
                         placeholder="Select Destination..."
                       />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                       <label style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>PRODUCTION BATCH</label>
                       <SearchableSelect
                         options={productionLogs.map(p => ({
                           value: p.batch_number,
                           label: `${p.batch_number} (Exp: ${new Date(p.expiry_date).toLocaleDateString()})`
                         }))}
                         value={editingOrder.batch_number}
                         onChange={(val) => {
                           const b = productionLogs.find(p => p.batch_number === val);
                           setEditingOrder({...editingOrder, batch_number: String(val), expiry_date: b?.expiry_date || ''});
                         }}
                         placeholder="Choose Batch..."
                       />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                       <label style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>DISCOUNT PERCENTAGE (%)</label>
                       <input 
                         type="number" 
                         style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%', marginTop: '5px', fontWeight: 700 }}
                         value={editingOrder.discount_percentage}
                         onChange={(e) => setEditingOrder({...editingOrder, discount_percentage: Number(e.target.value)})}
                       />
                    </div>

                    <h5 style={{ margin: '1rem 0 0.5rem 0' }}>Current Cart: {editingOrder.items.length} Products</h5>
                    <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'white', borderRadius: '10px', padding: '10px', border: '1px solid #eef2f6' }}>
                       {editingOrder.items.map(item => (
                         <div key={item.menu_item_id} style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                           <span><b>{item.name_en}</b> x {item.quantity}</span>
                           <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                             <button onClick={() => {
                               const updated = editingOrder.items.map(i => i.menu_item_id === item.menu_item_id ? {...i, quantity: Math.max(1, i.quantity - 1)} : i);
                               setEditingOrder({...editingOrder, items: updated});
                             }} style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>-</button>
                             <button onClick={() => {
                               const updated = editingOrder.items.map(i => i.menu_item_id === item.menu_item_id ? {...i, quantity: i.quantity + 1} : i);
                               setEditingOrder({...editingOrder, items: updated});
                             }} style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>+</button>
                             <button onClick={() => setEditingOrder({...editingOrder, items: editingOrder.items.filter(i => i.menu_item_id !== item.menu_item_id)})} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '10px', cursor: 'pointer', fontWeight: 800, marginLeft: '5px' }}>REMOVE</button>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div>
                    <h5 style={{ fontSize: '13px', color: '#64748b', marginBottom: '1rem' }}>Add More Products</h5>
                    <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {menuItems.map(item => (
                        <div key={item.menu_item_id} onClick={() => addItemToEditOrder(item)} style={{ cursor: 'pointer', padding: '12px 15px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s ease', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{item.name_en}</span>
                          <span style={{ fontSize: '11px', color: 'var(--primary)' }}>{Number(item.price).toFixed(3)} KWD</span>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
               
               <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button onClick={() => setIsEditModalOpen(false)} style={{ flex: 1, padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', fontWeight: 700 }}>Cancel Changes</button>
                  <button onClick={() => handleUpdateOrder()} style={{ flex: 2, padding: '1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 800, boxShadow: '0 4px 15px rgba(1, 86, 44, 0.2)' }}>SAVE & SYNC ORDER</button>
               </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'none' }}>
        <FullInvoicePrint ref={printRef} order={printOrder} items={printItems} />
        <PrePrintedInvoice ref={dotMatrixPrintRef} order={printOrder} items={printItems} />
      </div>
    </Layout>
  );
};

export default SalesPage;
