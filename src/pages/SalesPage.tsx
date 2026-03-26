import { useState, useEffect } from 'react';
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
  DollarSign,
  Package,
  Calendar,
  MoreVertical,
  ChevronRight,
  Plus,
  X,
  User,
  ShoppingCart,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import './InventoryPage.css';
import Swal from 'sweetalert2';

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
  const [isAddingItem, setIsAddingItem] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [menuSearch, setMenuSearch] = useState('');

  useEffect(() => {
    fetchSales();
    fetchMenuItems();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
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
        setSales(response.data.data || []);
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
      const result = await Swal.fire({
        title: 'Confirm Status Change',
        text: `Update Order #${saleId} to ${nextStatus.toUpperCase()}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: 'var(--primary)',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, update it!'
      });

      if (result.isConfirmed) {
        await api.put(`/sales/${saleId}/status`, { dispatch_status: nextStatus });
        Swal.fire('Updated!', `Order status is now ${nextStatus}.`, 'success');
        fetchSales();
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to update status.', 'error');
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return alert('Please add at least one item.');

    try {
      const total = selectedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
      const orderPayload = {
        customer_name: customerName,
        items: selectedItems.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity, price: i.price })),
        total_amount: total,
        payment_status: 'paid', // Default for now
        dispatch_status: 'pending'
      };

      await api.post('/sales', orderPayload);
      setIsModalOpen(false);
      setCustomerName('');
      setSelectedItems([]);
      fetchSales();
      Swal.fire('Success', 'Order created successfully!', 'success');
    } catch (error) {
      Swal.fire('Error', 'Failed to create order.', 'error');
    }
  };

  const addItemToOrder = (item: any) => {
    const existing = selectedItems.find(i => i.menu_item_id === item.menu_item_id);
    if (existing) {
      setSelectedItems(selectedItems.map(i => i.menu_item_id === item.menu_item_id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  const removeItemFromOrder = (id: number) => {
    setSelectedItems(selectedItems.filter(i => i.menu_item_id !== id));
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'delivered' || statusLower === 'paid') return 'status-badge healthy';
    if (statusLower === 'dispatched') return 'status-badge warning';
    if (statusLower === 'pending') return 'status-badge pending';
    if (statusLower === 'cancelled' || statusLower === 'failed') return 'status-badge critical';
    return 'status-badge';
  };

  const filteredSales = sales.filter(s => 
    (s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || String(s.sale_id).includes(searchTerm)) &&
    (statusFilter === 'all' || s.dispatch_status === statusFilter)
  );

  const stats = {
    totalRevenue: sales.reduce((acc, curr) => acc + (curr.payment_status === 'paid' ? curr.total_amount : 0), 0),
    pendingDispatch: sales.filter(s => s.dispatch_status === 'pending').length,
    todayOrders: sales.length,
    completed: sales.filter(s => s.dispatch_status === 'delivered').length
  };

  return (
    <Layout title="Sales & Dispatch Center">
      <div className="inventory-container">
        {/* Sales Performance Metrics */}
        <div className="inventory-metrics">
          <div className="metric-card">
            <div className="metric-icon bg-green"><DollarSign size={24} /></div>
            <div className="metric-details">
              <span>Today's Revenue</span>
              <h3>{stats.totalRevenue.toFixed(3)} KWD</h3>
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

        {/* Search and Filters */}
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

        {/* Sales Table */}
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
                ) : filteredSales.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-5">No orders found.</td></tr>
                ) : filteredSales.map(sale => (
                  <tr key={sale.sale_id}>
                    <td>
                      <div className="item-info">
                        <strong>Order #{sale.sale_id}</strong>
                        <span>{sale.items_count} items included</span>
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
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        {sale.order_date}
                      </div>
                    </td>
                    <td>
                      <strong>{Number(sale.total_amount).toFixed(3)} KWD</strong>
                    </td>
                    <td>
                      <span className={getStatusBadge(sale.payment_status)}>{sale.payment_status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={getStatusBadge(sale.dispatch_status)}>
                          {sale.dispatch_status}
                        </span>
                        {sale.dispatch_status === 'dispatched' && <Truck size={14} color="#f59e0b" />}
                        {sale.dispatch_status === 'delivered' && <CheckCircle2 size={14} color="#10b981" />}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="row-actions">
                        {sale.dispatch_status === 'pending' && (
                           <button className="btn-icon-sm" style={{color: '#f59e0b'}} title="Dispatch Order" onClick={() => handleUpdateStatus(sale.sale_id, 'dispatched')}>
                             <Truck size={16} />
                           </button>
                        )}
                        {sale.dispatch_status === 'dispatched' && (
                           <button className="btn-icon-sm" style={{color: '#10b981'}} title="Confirm Delivery" onClick={() => handleUpdateStatus(sale.sale_id, 'delivered')}>
                             <CheckCircle2 size={16} />
                           </button>
                        )}
                        <button className="btn-icon-sm" title="View Details"><Eye size={16} /></button>
                        <button className="btn-more"><MoreVertical size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dispatch Management Cards */}
        {stats.pendingDispatch > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h4 style={{ marginBottom: '1.25rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <AlertTriangle size={20} color="#f59e0b" /> Orders Awaiting Dispatch
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {sales.filter(s => s.dispatch_status === 'pending').slice(0, 3).map(order => (
                <div key={order.sale_id} style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #fee2e2', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 800, color: '#941c1c' }}>Order #{order.sale_id}</span>
                    <span style={{ fontSize: '12px', background: '#fef2f2', color: '#991b1b', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>SHIP NOW</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '1.25rem' }}>Customer: <b>{order.customer_name}</b><br/>Value: {Number(order.total_amount).toFixed(3)} KWD</p>
                  <button 
                    onClick={() => handleUpdateStatus(order.sale_id, 'dispatched')}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: '12px', 
                      background: '#054c2d', 
                      color: 'white', 
                      border: 'none', 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Truck size={18} /> Mark as Dispatched <ChevronRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* NEW ORDER MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', borderRadius: '24px' }}>
             <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ShoppingCart size={24} color="var(--primary)" />
                  <h3 style={{ margin: 0 }}>Record New Wholesale Sale</h3>
                </div>
                <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
             </div>
             
             <div className="modal-body" style={{ padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  {/* LEFT: Customer and Items List */}
                  <div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontWeight: 700, fontSize: '11px', color: '#64748b' }}>CUSTOMER NAME *</label>
                      <div style={{ position: 'relative' }}>
                        <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                          style={{ padding: '0.8rem 0.8rem 0.8rem 2.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%' }}
                          placeholder="e.g. Dana Catering"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', minHeight: '250px', display: 'flex', flexDirection: 'column' }}>
                       <h5 style={{ margin: '0 0 1rem 0', display: 'flex', justifyContent: 'space-between' }}>
                          Current Cart
                          <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{selectedItems.length} Items</span>
                       </h5>
                       
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '200px' }}>
                          {selectedItems.map(item => (
                            <div key={item.menu_item_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '0.75rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                               <div>
                                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>{item.name_en}</p>
                                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{item.quantity} x {item.price.toFixed(3)}</p>
                               </div>
                               <button onClick={() => removeItemFromOrder(item.menu_item_id)} style={{ color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '4px' }}><Trash2 size={14} /></button>
                            </div>
                          ))}
                          {selectedItems.length === 0 && (
                             <p style={{ textAlign: 'center', marginTop: '3rem', color: '#94a3b8', fontSize: '13px' }}>Cart is empty. Add items from the right.</p>
                          )}
                       </div>
                    </div>
                  </div>

                  {/* RIGHT: Menu Item Selection */}
                  <div style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                     <h5 style={{ margin: '0 0 1rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Choose Items
                        <div style={{ position: 'relative', width: '200px' }}>
                          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                          <input 
                            style={{ padding: '0.4rem 0.4rem 0.4rem 1.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%', fontSize: '12px' }}
                            placeholder="Search menu..."
                            value={menuSearch}
                            onChange={(e) => setMenuSearch(e.target.value)}
                          />
                        </div>
                     </h5>

                     {/* Modal Category Pills */}
                     <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '5px' }}>
                        <button 
                          onClick={() => setActiveCategory('all')}
                          style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: activeCategory === 'all' ? 'var(--primary)' : '#f1f5f9', color: activeCategory === 'all' ? 'white' : '#64748b', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          All Items
                        </button>
                        {categories.map(cat => (
                          <button 
                            key={cat.category_id}
                            onClick={() => setActiveCategory(cat.category_id)}
                            style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: activeCategory == cat.category_id ? 'var(--primary)' : '#f1f5f9', color: activeCategory == cat.category_id ? 'white' : '#64748b', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            {cat.name_en}
                          </button>
                        ))}
                     </div>

                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', overflowY: 'auto', maxHeight: '350px' }}>
                        {menuItems
                          .filter(item => (activeCategory === 'all' || item.category_id == activeCategory))
                          .filter(item => item.name_en.toLowerCase().includes(menuSearch.toLowerCase()))
                          .map(item => (
                            <div 
                              key={item.menu_item_id} 
                              onClick={() => addItemToOrder(item)} 
                              style={{ 
                                cursor: 'pointer', 
                                background: 'white', 
                                padding: '0.75rem', 
                                borderRadius: '12px', 
                                border: '1px solid #e2e8f0', 
                                textAlign: 'center', 
                                transition: 'all 0.2s',
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                              className="item-tile-hover"
                            >
                               <p style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name_en}</p>
                               <p style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 800, margin: 0 }}>{Number(item.price).toFixed(3)} KWD</p>
                               
                               {/* Plus Indicator on Hover */}
                               <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px', background: 'var(--primary)', color: 'white', borderRadius: '0 0 0 10px', opacity: 0 }} className="plus-hint">
                                  <Plus size={10} strokeWidth={4} />
                                </div>
                            </div>
                          ))}
                        
                        {menuItems.length === 0 && (
                          <div style={{ gridColumn: '1/3', textAlign: 'center', padding: '3rem 1rem' }}>
                             <div style={{ color: 'var(--primary)', opacity: 0.3, marginBottom: '0.5rem' }}><ShoppingCart size={40} style={{ margin: '0 auto' }} /></div>
                             <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>No menu items available.</p>
                             <p style={{ fontSize: '10px', color: '#94a3b8' }}>Go to the Menu page to create your catalog first.</p>
                          </div>
                        )}
                     </div>
                  </div>
                </div>

                <div style={{ marginTop: '2rem', background: '#054c2d', color: 'white', padding: '1.5rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                      <p style={{ margin: 0, opacity: 0.8, fontSize: '12px' }}>Total Amount</p>
                      <h3 style={{ margin: 0 }}>{selectedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0).toFixed(3)} KWD</h3>
                   </div>
                   <button 
                      onClick={handleCreateOrder}
                      style={{ background: 'white', color: '#054c2d', border: 'none', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                   >
                     FINALIZE & SELL
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SalesPage;
