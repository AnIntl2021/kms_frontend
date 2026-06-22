import FoodLoader from '../components/FoodLoader';
/* 
   SALES & DISPATCH DASHBOARD - HARD RECOVERY VERSION 
   SYNC TIMESTAMP: 2026-04-01-1805 
*/
import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useSettings } from '../hooks/useSettings';
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
  Zap,
  Globe,
  ChevronDown,
  Trash2,
  LayoutGrid,
  List
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import FullInvoicePrint from '../components/FullInvoicePrint';
import PrePrintedInvoice from '../components/PrePrintedInvoice';
import { printReceipt } from '../utils/printUtils';
import './InventoryPage.css';
import { toast } from 'react-toastify';
import SearchableSelect from '../components/SearchableSelect';
import { useLanguage } from '../hooks/useLanguage';

interface SaleOrder {
  sale_id: number;
  customer_name: string;
  order_date: string;
  total_amount: number;
  payment_status: 'paid' | 'pending' | 'failed';
  dispatch_status: 'pending' | 'dispatched' | 'delivered' | 'cancelled';
  items_count: number;
  dispatch_date?: string;
  discount_amount?: number;
  discount_percentage?: number;
  final_amount?: number;
  returns_amount?: number;
  order_type?: string;
  table_number?: string;
}

const SalesPage = () => {
  const { t, language } = useLanguage();
  const { businessType, getOrderNumber, formatCurrencyValue, currencySymbol } = useSettings();
  const [sales, setSales] = useState<SaleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 🛡️ DYNAMIC SEGREGATION HUD
  const [vendors, setVendors] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    client_phone: '',
    client_address: '',
    reference_order_number: '',
    notes: '',
    vendor_id: '',
    branch_id: '',
    batch_number: '',
    expiry_date: '',
    payment_status: 'credit',
    dispatch_status: 'pending',
    salesman_id: ''
  });
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [productionLogs, setProductionLogs] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [showOnlineDetails, setShowOnlineDetails] = useState(false);
  const [menuViewMode, setMenuViewMode] = useState<'grid' | 'list'>('grid');
  const [menuSearchTerm, setMenuSearchTerm] = useState('');

  const getImageUrl = (url: string) => {
    if (!url) return '';
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${baseUrl}/${cleanUrl}`;
  };

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
    fetchSalesmen();
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

  const fetchSalesmen = async () => {
    try {
      const res = await api.get('/salesmen');
      setSalesmen(res.data.data || []);
    } catch (e) {
      console.error('Failed to fetch salesmen:', e);
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
        dispatch_status: order.dispatch_status,
        salesman_id: order.salesman_id,
        items: items
      });
      setIsEditModalOpen(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("failed_load_order_items"));
    }
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;
    try {
      await api.put(`/factory/sales/${editingOrder.sale_id}`, editingOrder);
      toast.success(t("order_updated_success"));
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
      toast.success(t("order_status_now").replace('{val}', nextStatus.toUpperCase()));
      fetchSales();
    } catch (error) {
      toast.error('Failed to update order status.');
    }
  };

  const handleUpdatePayment = async (saleId: number, nextPayment: string) => {
    try {
      await api.put(`/sales/${saleId}/payment-status`, { payment_status: nextPayment });
      toast.success(t("payment_status_marked").replace('{val}', nextPayment.toUpperCase()));
      fetchSales();
    } catch (error) {
      toast.error('Failed to update payment status.');
    }
  };

  const handleReturnOrder = async (saleId: number) => {
    console.warn('--- 🔄 INITIATING RETURN FOR ORDER #:', saleId);
    if (!saleId) {
       toast.error(t('invalid_sale_id'));
       return;
    }

    if (!window.confirm(t('return_confirm_q').replace('{val}', String(saleId)))) return;
    
    try {
      console.warn('📡 SENDING RETURN SIGNAL TO BACKEND...');
      const response = await api.post(`/sales/${saleId}/return`);
      console.warn('✅ BACKEND RESPONSE:', response.data);
      
      toast.info(t('order_returned_success').replace('{val}', String(100000 + saleId)));
      fetchSales();
    } catch (error: any) {
      console.error('❌ RETURN ERROR TRACE:', error);
      toast.error('Failed to process order return: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteOrder = async (saleId: number) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      await api.delete(`/factory/sales/${saleId}`);
      toast.success(t("order_deleted_success"));
      fetchSales();
    } catch (e) {
      toast.error("Failed to delete order.");
    }
  };

  const handleCreateOrder = async () => {
    if (selectedItems.length === 0) return toast.warning(t('cart_empty_warning'));
    if (formData.vendor_id && !formData.branch_id) return toast.warning(t('select_branch_warning'));
    if (formData.vendor_id && !formData.batch_number) return toast.warning(t('select_batch_warning'));

    try {
      setLoading(true);
      const res = await api.post('/sales', {
        ...formData,
        items: selectedItems.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity, price: i.price }))
      });
      setIsModalOpen(false);
      setShowOnlineDetails(false);
      setFormData({ customer_name: '', client_phone: '', client_address: '', reference_order_number: '', notes: '', vendor_id: '', branch_id: '', batch_number: '', expiry_date: '', payment_status: 'credit', dispatch_status: 'pending', salesman_id: '' });
      setSelectedItems([]);
      fetchSales();
      toast.success(t('sale_recorded_success'));
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
    documentTitle: `Invoice-${getOrderNumber(printOrder?.sale_id || 0)}`
  });

  const handleDotMatrixPrint = useReactToPrint({
    contentRef: dotMatrixPrintRef,
    documentTitle: `LQ350-Invoice-${getOrderNumber(printOrder?.sale_id || 0)}`
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

  const handleThermalPrint = async (sale: any) => {
     try {
        const res = await api.get(`/sales/${sale.sale_id}`);
        if (res.data.success) {
           const order = res.data.data;
           const itemsToPrint = (order.items || []).map((item: any) => ({
             name: (item.name_en && item.name_ar) ? `${item.name_en} / ${item.name_ar}` : (item.name_en || item.name_ar),
             price: Number(item.price || 0),
             quantity: Number(item.quantity || 0)
           }));
           printReceipt(
             itemsToPrint,
             Number(order.total_amount),
             'DIRECT SALE',
             (order.payment_method || 'CASH').toUpperCase(),
             getOrderNumber(order.sale_id)
           );
        }
     } catch (e) {
        toast.error('Failed to print thermal receipt.');
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

  const updateQuantity = (id: number, delta: number) => {
    setSelectedItems(prev => prev.map(i => {
      if (i.menu_item_id === id) {
         return { ...i, quantity: Math.max(0, i.quantity + delta) };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const getStatusBadge = (status: string) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'delivered' || statusLower === 'paid') return 'status-badge healthy';
    if (statusLower === 'dispatched' || statusLower === 'credit') return 'status-badge warning';
    if (statusLower === 'pending') return 'status-badge pending';
    if (statusLower === 'cancelled' || statusLower === 'failed') return 'status-badge critical';
    return 'status-badge';
  };

  const filteredSales = (Array.isArray(sales) ? sales : []).filter(s => {
    const nameMatch = (s.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const orderNo = getOrderNumber(s.sale_id || 0);
    const idMatch = String(s.sale_id || '').includes(searchTerm) || 
                    orderNo.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = (statusFilter === 'all' || s.dispatch_status === statusFilter);
    return (nameMatch || idMatch) && statusMatch;
  });

  const stats = {
    totalRevenue: filteredSales
      .filter(s => 
        ['delivered', 'dispatched', 'in_transit'].includes((s.dispatch_status || '').toLowerCase()) ||
        (s.payment_status || '').toLowerCase() === 'paid' ||
        ((s as any).status || '').toLowerCase() === 'completed'
      )
      .reduce((acc, curr) => acc + (Number(curr.final_amount || curr.total_amount || 0) - Number(curr.returns_amount || 0)), 0),
    pendingDispatch: filteredSales.filter(s => (s.dispatch_status || '').toLowerCase() === 'pending').length,
    todayOrders: filteredSales.length,
    completed: filteredSales.filter(s => (s.dispatch_status || '').toLowerCase() === 'delivered' || ((s as any).status || '').toLowerCase() === 'completed').length
  };

  return (
    <Layout title={t("sales_dispatch_center")}>
      <div className="inventory-container">
        {/* Sales Performance Metrics */}
        <div className="inventory-metrics">
          <div className="metric-card">
            <div className="metric-icon bg-green"><TrendingUp size={24} /></div>
            <div className="metric-details">
               <span>{t("todays_revenue")}</span>
               <h3>{stats.totalRevenue.toFixed(3)} {currencySymbol}</h3>
               <p className="trend positive"><TrendingUp size={12}/> +12.5% vs yesterday</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-orange"><Clock size={24} /></div>
            <div className="metric-details">
               <span>{t("pending_dispatch")}</span>
               <h3>{stats.pendingDispatch}</h3>
               <p className="trend warning">Needs attention</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-blue"><Truck size={24} /></div>
            <div className="metric-details">
               <span>{t("total_orders")}</span>
               <h3>{stats.todayOrders}</h3>
               <p className="trend neutral">Live tracking</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-purple"><CheckCircle2 size={24} /></div>
            <div className="metric-details">
               <span>{t("completed_transfers")}</span>
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
              placeholder={t("search_sales_hint")} 
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
              <option value="all">{t("all_status")}</option>
              <option value="pending">{t("pending")}</option>
              <option value="dispatched">{t("dispatched")}</option>
              <option value="delivered">{t("delivered")}</option>
            </select>
            <button className="btn-add" onClick={() => setIsModalOpen(true)} style={{ background: 'var(--primary)', color: 'white' }}>
               <ShoppingCart size={18} /> {t("new_direct_sale")}
            </button>
          </div>
        </div>

        <div className="stock-table-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t("order_info")}</th>
                  <th>{t("customer")}</th>
                  <th>{t("dispatch_date")}</th>
                  <th>{t("amount")}</th>
                  <th>{t("discount_percent")}</th>
                  <th>{t("total_amount")}</th>
                  <th>{t("payment")}</th>
                  {businessType !== 'restaurant_pos' && <th>{t("dispatch_status")}</th>}
                  <th className="text-end">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-5"><FoodLoader size="small" /></td></tr>
                ) : (Array.isArray(filteredSales) ? filteredSales : []).map(sale => (
                  <tr key={sale.sale_id || Math.random()}>
                    <td>
                      <div className="item-info">
                        <strong>{getOrderNumber(sale.sale_id || 0)}</strong>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap' }}>
                          <span style={{ 
                            fontSize: '10px', 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            fontWeight: 'bold', 
                            background: sale.order_type === 'walk_in' ? 'rgba(5, 76, 45, 0.1)' : sale.order_type === 'takeaway' ? '#fef3c7' : '#dbeafe', 
                            color: sale.order_type === 'walk_in' ? 'var(--primary)' : sale.order_type === 'takeaway' ? '#d97706' : '#2563eb' 
                          }}>
                            {sale.order_type === 'walk_in' ? 'Dine In' : sale.order_type === 'takeaway' ? 'Takeaway' : sale.order_type === 'delivery' ? 'Delivery' : (sale.order_type || 'Walk In').toUpperCase()}
                          </span>
                          {sale.table_number && (
                            <span style={{ 
                              fontSize: '10px', 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              fontWeight: 'bold', 
                              background: '#e0f2fe', 
                              color: '#0369a1' 
                            }}>
                              {sale.table_number}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>{sale.items_count || 0} {t("items_included")}</span>
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
                               {language === 'ar' ? ((sale as any).branch_name_ar || (sale as any).branch_name) : (sale as any).branch_name} {t("branch")}
                             </span>
                           )}
                           {((sale as any).branch_phone || (sale as any).client_phone) && (
                             <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                               +965 {((sale as any).branch_phone || (sale as any).client_phone).replace(/^\+965\s*/, '')}
                             </span>
                           )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 700 }}>{sale.dispatch_date || sale.order_date}</div>
                    </td>
                    <td>
                       <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: 800 }}>
                          {formatCurrencyValue(sale.total_amount)} {currencySymbol}
                       </span>
                    </td>
                    <td>
                       <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: 600 }}>
                          {Number(sale.discount_percentage || 0) > 0 ? `${Number(sale.discount_percentage).toFixed(2)}%` : '-'}
                       </span>
                    </td>
                    <td><strong style={{ fontSize: '15px', color: 'var(--primary)' }}>{formatCurrencyValue(sale.final_amount || sale.total_amount)} {currencySymbol}</strong></td>
                    <td>
                      <select 
                        className={getStatusBadge(sale.payment_status)} 
                        value={sale.payment_status}
                        onChange={(e) => handleUpdatePayment(sale.sale_id, e.target.value)}
                        style={{ border: 'none', cursor: 'pointer', outline: 'none', appearance: 'none', textAlign: 'center', width: '80px' }}
                      >
                        <option value="credit">credit</option>
                        <option value="paid">paid</option>
                        <option value="failed">failed</option>
                      </select>
                    </td>
                    {businessType !== 'restaurant_pos' && (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={getStatusBadge(sale.dispatch_status)}>{sale.dispatch_status}</span>
                          {sale.dispatch_status === 'dispatched' && <Truck size={14} color="#f59e0b" />}
                          {sale.dispatch_status === 'delivered' && <CheckCircle2 size={14} color="#10b981" />}
                        </div>
                      </td>
                    )}
                    <td className="text-end">
                      <div className="row-actions" style={{ position: 'relative', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                         {/* Core Quick Actions (Visible) */}
                         <button className="btn-icon-sm" style={{color: '#64748b'}} title="View Details" onClick={(e) => { e.stopPropagation(); handleViewOrder(sale); }}><Eye size={16} /></button>
                         
                         {businessType !== 'restaurant_pos' && sale.dispatch_status === 'pending' && (
                            <button className="btn-icon-sm" style={{color: '#f59e0b'}} title="Dispatch Order" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(sale.sale_id, 'dispatched'); }}><Truck size={16} /></button>
                         )}
                         {businessType !== 'restaurant_pos' && sale.dispatch_status === 'dispatched' && (
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
                                <button className="dropdown-item" onClick={() => handleThermalPrint(sale)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 15px', border: 'none', background: 'none', textAlign: 'left', fontSize: '13px', cursor: 'pointer' }}>
                                  <Receipt size={14} color="#f59e0b" /> Thermal Print
                                </button>
                                <button className="dropdown-item" onClick={() => preparePrint(sale, false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 15px', border: 'none', background: 'none', textAlign: 'left', fontSize: '13px', cursor: 'pointer' }}>
                                  <Printer size={14} color="#054c2d" /> {t("standard_pdf_print")}
                                </button>
                                <button className="dropdown-item" onClick={() => preparePrint(sale, true)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 15px', border: 'none', background: 'none', textAlign: 'left', fontSize: '13px', cursor: 'pointer' }}>
                                  <Receipt size={14} color="#f59e0b" /> {t("dot_matrix_print")}
                                </button>
                                <button className="dropdown-item" onClick={() => handleEditOrder(sale)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 15px', border: 'none', background: 'none', textAlign: 'left', fontSize: '13px', cursor: 'pointer' }}>
                                  <Edit size={14} color="#0369a1" /> {t("edit_order")}
                                </button>
                                <div style={{ height: '1px', background: '#f1f5f9' }} />
                                <button className="dropdown-item" onClick={() => handleReturnOrder(sale.sale_id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 15px', border: 'none', background: 'none', textAlign: 'left', fontSize: '13px', cursor: 'pointer', color: '#ef4444' }}>
                                  <RotateCcw size={14} /> {t("return_order")}
                                </button>
                                <button className="dropdown-item" onClick={() => handleDeleteOrder(sale.sale_id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 15px', border: 'none', background: 'none', textAlign: 'left', fontSize: '13px', cursor: 'pointer', color: '#be123c', fontWeight: 600 }}>
                                  <Trash2 size={14} /> {t("delete_order")}
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
                  <h3 style={{ margin: 0 }}>{t("order_details")} {getOrderNumber(detailOrder.sale_id || 0)}</h3>
                </div>
                <button className="btn-close" onClick={() => setIsDetailModalOpen(false)}><X size={20} /></button>
              </div>
              <div className="modal-body" style={{ padding: '2rem' }}>
                 <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{t("customer")}: <b>{detailOrder.customer_name}</b></p>
                    {detailOrder.client_phone && <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Phone: <b>{detailOrder.client_phone}</b></p>}
                    {detailOrder.client_address && <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Address: <b>{detailOrder.client_address}</b></p>}
                    {detailOrder.reference_order_number && <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Order Number: <b style={{ color: 'var(--primary)' }}>{detailOrder.reference_order_number}</b></p>}
                    {detailOrder.notes && <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Notes: <b>{detailOrder.notes}</b></p>}
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>{t("batch_code")}: <b style={{ color: 'var(--primary)' }}>{detailOrder.batch_number || 'N/A'}</b></p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Type: <b style={{ textTransform: 'capitalize' }}>{detailOrder.order_type === 'walk_in' ? 'Dine In' : detailOrder.order_type || 'Walk In'}</b></p>
                    {detailOrder.table_number && <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Table Number: <b style={{ color: '#0369a1' }}>{detailOrder.table_number}</b></p>}
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>{t("date")}: {detailOrder.order_date}</p>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {detailOrder.items?.map((item: any) => (
                       <div key={item.sale_item_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                           <div><p style={{ margin: 0, fontWeight: 700 }}>{language === 'ar' ? (item.name_ar || item.name_en) : item.name_en}</p><p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{t("quantity")}: {item.quantity}</p></div>
                           <p style={{ margin: 0, fontWeight: 800, color: 'var(--primary)' }}>{formatCurrencyValue(item.price * item.quantity)} {currencySymbol}</p>
                       </div>
                    ))}
                 </div>
                 <div style={{ marginTop: '2rem', borderTop: '2px dashed #e2e8f0', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontSize: '14px', color: '#64748b' }}>{t("subtotal")}</span>
                       <span style={{ fontWeight: 700 }}>{formatCurrencyValue(detailOrder.items?.reduce((s: any, i: any) => s + (i.price * i.quantity), 0) || 0)} {currencySymbol}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ef4444' }}>
                       <span style={{ fontSize: '14px' }}>{t("discount")} {Number(detailOrder.discount_percentage) > 0 && `(${detailOrder.discount_percentage}%)`}</span>
                       <span style={{ fontWeight: 700 }}>-{formatCurrencyValue(detailOrder.discount_amount || 0)} {currencySymbol}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                       <h3 style={{ margin: 0 }}>{t("net_total")}</h3>
                       <h2 style={{ margin: 0, color: 'var(--primary)', fontWeight: 900 }}>{formatCurrencyValue(detailOrder.total_amount)} {currencySymbol}</h2>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🛡️ DYNAMIC DISTRIBUTION MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '95%', maxWidth: '1100px', borderRadius: '24px' }}>
             <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ShoppingCart size={24} color="var(--primary)" />
                  <h3 style={{ margin: 0 }}>{t("record_distribution_sale")}</h3>
                </div>
                <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
             </div>
             <div className="modal-body" style={{ padding: '2rem' }}>
                 <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '2rem' }}>
                    <div style={{ flex: '0 0 500px', background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                       <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                         <label style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>{t("distribution_partner_caps")}</label>
                         <SearchableSelect
                           options={vendors
                             .filter(v => v.type === 'client' || v.type === 'supplier')
                             .map(v => ({ value: v.vendor_id, label: language === 'ar' ? (v.name_ar || v.name_en) : v.name_en }))}
                           value={formData.vendor_id}
                           onChange={(val) => {
                             const v = vendors.find(v => String(v.vendor_id) === String(val));
                             setFormData({...formData, vendor_id: String(val), branch_id: '', customer_name: v?.name_en || ''});
                           }}
                           placeholder={t("choose_client")}
                         />
                       </div>
  
                       <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                         <label style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>{t("delivery_branch_node_caps")}</label>
                         <SearchableSelect
                           options={[
                             { value: 'main', label: t('main_corporate_hub') },
                             ...(vendors.find(v => String(v.vendor_id) === String(formData.vendor_id))?.branches?.map((br: any) => ({
                               value: br.branch_id,
                               label: language === 'ar' ? (br.name_ar || br.name_en) : br.name_en
                             })) || [])
                           ]}
                           value={formData.branch_id}
                           onChange={(val) => setFormData({...formData, branch_id: String(val)})}
                           placeholder={t("select_destination")}
                         />
                       </div>
  
                       <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                         <label style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>{t("production_batch_caps")}</label>
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
                           placeholder={t("choose_batch")}
                         />
                       </div>

                       <div className="form-group" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                          <label style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>{t("assign_salesman_caps")}</label>
                          <SearchableSelect
                            options={salesmen.map(s => ({ value: s.salesman_id, label: language === 'ar' ? (s.name_ar || s.name_en) : s.name_en }))}
                            value={formData.salesman_id}
                            onChange={(val) => setFormData({...formData, salesman_id: String(val)})}
                            placeholder={t("choose_salesman")}
                          />
                        </div>

                        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                           <button 
                             onClick={() => setShowOnlineDetails(!showOnlineDetails)} 
                             style={{ width: '100%', padding: '16px 20px', background: showOnlineDetails ? 'linear-gradient(to right, #f8fafc, #ffffff)' : '#ffffff', border: 'none', borderBottom: showOnlineDetails ? '1px solid #e2e8f0' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 800, color: '#0f172a', fontSize: '14px', transition: 'all 0.3s ease' }}
                           >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                 <Globe size={18} color="var(--primary)" />
                                 <span>Online / Direct Sale Details (Optional)</span>
                              </div>
                              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: showOnlineDetails ? '#e2e8f0' : '#f1f5f9', color: '#64748b', transition: 'transform 0.3s ease', transform: showOnlineDetails ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                 <ChevronDown size={16} />
                              </span>
                           </button>
                           {showOnlineDetails && (
                             <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', background: '#fafbfc' }} className="fade-in">
                               <div className="form-group" style={{ marginBottom: 0 }}>
                                 <label style={{ fontWeight: 700, fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>Customer Name</label>
                                 <input type="text" value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} placeholder="e.g. John Doe" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '14px', outline: 'none', transition: 'border 0.2s ease, box-shadow 0.2s ease' }} onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(5, 76, 45, 0.1)'; }} onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }} />
                               </div>
                               <div className="form-group" style={{ marginBottom: 0 }}>
                                 <label style={{ fontWeight: 700, fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>Phone Number</label>
                                 <input type="text" value={formData.client_phone} onChange={(e) => setFormData({...formData, client_phone: e.target.value})} placeholder="e.g. +965 1234 5678" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '14px', outline: 'none', transition: 'border 0.2s ease, box-shadow 0.2s ease' }} onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(5, 76, 45, 0.1)'; }} onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }} />
                               </div>
                               <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
                                 <label style={{ fontWeight: 700, fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>Delivery Address</label>
                                 <input type="text" value={formData.client_address} onChange={(e) => setFormData({...formData, client_address: e.target.value})} placeholder="Block 4, Street 10, Building 22, Floor 3" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '14px', outline: 'none', transition: 'border 0.2s ease, box-shadow 0.2s ease' }} onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(5, 76, 45, 0.1)'; }} onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }} />
                               </div>
                               <div className="form-group" style={{ marginBottom: 0 }}>
                                 <label style={{ fontWeight: 700, fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>Order Number</label>
                                 <input type="text" value={formData.reference_order_number} onChange={(e) => setFormData({...formData, reference_order_number: e.target.value})} placeholder="e.g. #1024" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '14px', outline: 'none', transition: 'border 0.2s ease, box-shadow 0.2s ease' }} onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(5, 76, 45, 0.1)'; }} onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }} />
                               </div>
                               <div className="form-group" style={{ marginBottom: 0 }}>
                                 <label style={{ fontWeight: 700, fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>Notes / Special Instructions</label>
                                 <input type="text" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="e.g. Leave at door, Ring bell twice" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '14px', outline: 'none', transition: 'border 0.2s ease, box-shadow 0.2s ease' }} onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(5, 76, 45, 0.1)'; }} onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }} />
                               </div>
                             </div>
                           )}
                        </div>

                       <h5 style={{ margin: '1rem 0 0.5rem 0' }}>Cart: {selectedItems.length} Products</h5>
                       <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                          {selectedItems.map(item => (
                            <div key={item.menu_item_id} style={{ fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 600, color: '#334155' }}>{item.name_en}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                 <button onClick={() => updateQuantity(item.menu_item_id, -1)} style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}>-</button>
                                 <span style={{ fontWeight: 700, width: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--primary)' }}>{item.quantity}</span>
                                 <button onClick={() => updateQuantity(item.menu_item_id, 1)} style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}>+</button>
                              </div>
                            </div>
                          ))}
                       </div>
                    </div>
                    <div style={{ flex: '1 1 300px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
                          <div style={{ flex: 1, position: 'relative' }}>
                             <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                             <input 
                               type="text" 
                               placeholder="Search menu..." 
                               value={menuSearchTerm}
                               onChange={(e) => setMenuSearchTerm(e.target.value)}
                               style={{ width: '100%', padding: '8px 10px 8px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                             />
                          </div>
                          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px' }}>
                             <button onClick={() => setMenuViewMode('grid')} style={{ padding: '6px', borderRadius: '6px', background: menuViewMode === 'grid' ? 'white' : 'transparent', border: 'none', boxShadow: menuViewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: menuViewMode === 'grid' ? 'var(--primary)' : '#94a3b8', cursor: 'pointer' }}>
                                <LayoutGrid size={16} />
                             </button>
                             <button onClick={() => setMenuViewMode('list')} style={{ padding: '6px', borderRadius: '6px', background: menuViewMode === 'list' ? 'white' : 'transparent', border: 'none', boxShadow: menuViewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: menuViewMode === 'list' ? 'var(--primary)' : '#94a3b8', cursor: 'pointer' }}>
                                <List size={16} />
                             </button>
                          </div>
                       </div>
                       
                       <div style={{ maxHeight: '350px', overflowY: 'auto', display: menuViewMode === 'grid' ? 'grid' : 'flex', gridTemplateColumns: menuViewMode === 'grid' ? '1fr 1fr' : 'none', flexDirection: menuViewMode === 'grid' ? 'row' : 'column', gap: '10px', paddingRight: '5px' }}>
                         {menuItems.filter(item => (item.name_en || '').toLowerCase().includes(menuSearchTerm.toLowerCase())).map(item => (
                           <div 
                             key={item.menu_item_id} 
                             onClick={() => addItemToOrder(item)} 
                             style={{ 
                               cursor: 'pointer', 
                               background: 'white', 
                               border: '1px solid #e2e8f0', 
                               borderRadius: '12px', 
                               overflow: 'hidden',
                               display: 'flex',
                               flexDirection: menuViewMode === 'grid' ? 'column' : 'row',
                               alignItems: menuViewMode === 'grid' ? 'stretch' : 'center',
                               padding: menuViewMode === 'grid' ? '0' : '10px 15px',
                               transition: 'all 0.2s ease',
                               boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                             }}
                             onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                             onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                           >
                             {menuViewMode === 'grid' && (
                               <div style={{ height: '100px', width: '100%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 {item.image_url ? (
                                   <img 
                                     src={getImageUrl(item.image_url)} 
                                     alt={item.name_en} 
                                     style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                   />
                                 ) : (
                                   <Package size={24} color="#cbd5e1" />
                                 )}
                               </div>
                             )}
                             <div style={{ padding: menuViewMode === 'grid' ? '12px' : '0', display: 'flex', flexDirection: 'column', flex: 1 }}>
                               <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155', lineHeight: '1.2' }}>{item.name_en}</span>
                               {menuViewMode === 'grid' && <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 800, marginTop: '4px' }}>{formatCurrencyValue(item.price)} {currencySymbol}</span>}
                             </div>
                             {menuViewMode === 'list' && (
                               <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 800, marginLeft: 'auto' }}>{formatCurrencyValue(item.price)} {currencySymbol}</span>
                             )}
                           </div>
                         ))}
                       </div>
                    </div>
                 </div>
                 <button onClick={() => handleCreateOrder()} style={{ marginTop: '2rem', width: '100%', padding: '1rem', background: '#054c2d', color: 'white', borderRadius: '14px', fontWeight: 800, fontSize: '15px' }}>
                   {t("finalize_distribution")}
                 </button>
              </div>
           </div>
        </div>
      )}
      {isEditModalOpen && editingOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '95%', maxWidth: '1100px', borderRadius: '24px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Edit size={24} color="var(--primary)" />
                <h3 style={{ margin: 0 }}>Modify Order {getOrderNumber(editingOrder.sale_id || 0)}</h3>
              </div>
              <button className="btn-close" onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ padding: '2rem' }}>
               <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '2rem' }}>
                  <div style={{ flex: '0 0 500px', background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                       <label style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>{t("distribution_partner_caps")}</label>
                       <SearchableSelect
                         options={vendors
                           .filter(v => v.type === 'client' || v.type === 'supplier')
                           .map(v => ({ value: v.vendor_id, label: language === 'ar' ? (v.name_ar || v.name_en) : v.name_en }))}
                         value={editingOrder.vendor_id}
                         onChange={(val) => {
                           const v = vendors.find(v => String(v.vendor_id) === String(val));
                           setEditingOrder({...editingOrder, vendor_id: String(val), customer_name: v?.name_en || ''});
                         }}
                         placeholder={t("choose_client")}
                       />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                       <label style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>{t("delivery_branch_node_caps")}</label>
                       <SearchableSelect
                         options={[
                           { value: 'main', label: 'Main Corporate Hub' },
                           ...(vendors.find(v => String(v.vendor_id) === String(editingOrder.vendor_id))?.branches?.map((br: any) => ({
                             value: br.branch_id,
                             label: language === 'ar' ? (br.name_ar || br.name_en) : br.name_en
                           })) || [])
                         ]}
                         value={editingOrder.branch_id}
                         onChange={(val) => setEditingOrder({...editingOrder, branch_id: String(val)})}
                         placeholder="Select Destination..."
                       />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                       <label style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>{t("production_batch_caps")}</label>
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
                         placeholder={t("choose_batch")}
                       />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>{t("assign_salesman_caps")}</label>
                      <SearchableSelect
                        options={salesmen.map(s => ({ value: s.salesman_id, label: language === 'ar' ? (s.name_ar || s.name_en) : s.name_en }))}
                        value={editingOrder.salesman_id}
                        onChange={(val) => setEditingOrder({...editingOrder, salesman_id: String(val)})}
                        placeholder={t("choose_salesman")}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                       <label style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>{t("discount_percentage_caps")}</label>
                       <input 
                         type="number" 
                         style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%', marginTop: '5px', fontWeight: 700 }}
                       value={editingOrder.discount_percentage}
                         onChange={(e) => setEditingOrder({...editingOrder, discount_percentage: Number(e.target.value)})}
                       />
                    </div>

                    <h5 style={{ margin: '1rem 0 0.5rem 0' }}>{t("current_cart")}: {editingOrder.items.length} {t("products")}</h5>
                    <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'white', borderRadius: '10px', padding: '10px', border: '1px solid #eef2f6' }}>
                       {editingOrder.items.map((item: any) => (
                         <div key={item.menu_item_id} style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                           <span><b>{language === 'ar' ? (item.name_ar || item.name_en) : item.name_en}</b> x {item.quantity}</span>
                           <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                             <button onClick={() => {
                               const updated = editingOrder.items.map((i: any) => i.menu_item_id === item.menu_item_id ? {...i, quantity: Math.max(1, i.quantity - 1)} : i);
                               setEditingOrder({...editingOrder, items: updated});
                             }} style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>-</button>
                             <button onClick={() => {
                               const updated = editingOrder.items.map((i: any) => i.menu_item_id === item.menu_item_id ? {...i, quantity: i.quantity + 1} : i);
                               setEditingOrder({...editingOrder, items: updated});
                             }} style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>+</button>
                             <button onClick={() => setEditingOrder({...editingOrder, items: editingOrder.items.filter((i: any) => i.menu_item_id !== item.menu_item_id)})} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '10px', cursor: 'pointer', fontWeight: 800, marginLeft: '5px' }}>{t("remove")}</button>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div style={{ flex: '1 1 300px' }}>
                     <h5 style={{ fontSize: '13px', color: '#64748b', marginBottom: '1rem' }}>{t("add_more_products")}</h5>
                     <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '5px' }}>
                      {menuItems.map(item => (
                        <div key={item.menu_item_id} onClick={() => addItemToEditOrder(item)} style={{ cursor: 'pointer', padding: '12px 15px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s ease', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{language === 'ar' ? (item.name_ar || item.name_en) : item.name_en}</span>
                          <span style={{ fontSize: '11px', color: 'var(--primary)' }}>{Number(item.price).toFixed(3)} {t("kwd")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
               
               <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button onClick={() => setIsEditModalOpen(false)} style={{ flex: 1, padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', fontWeight: 700 }}>{t("cancel_changes")}</button>
                  <button onClick={() => handleUpdateOrder()} style={{ flex: 2, padding: '1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 800, boxShadow: '0 4px 15px rgba(1, 86, 44, 0.2)' }}>{t("save_sync_order")}</button>
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
