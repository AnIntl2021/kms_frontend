import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { Plus, X, Trash2, Edit, Eye, PlusCircle, Package, Truck, Calendar, CreditCard, StickyNote, Hash, MoreHorizontal, ShoppingBag, ArrowRight, PackageCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import './PurchaseOrdersPage.css';
import { useLanguage } from '../hooks/useLanguage';
import Swal from 'sweetalert2';

const PurchaseOrdersPage = () => {
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
   const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [allPackages, setAllPackages] = useState<any[]>([]);

  const initialItem = { 
    inventory_item_id: '', 
    variant_id: '', 
    package_id: '', 
    quantity: 1, 
    unit_price: 0, 
    amount: 0, 
    discount_amount: 0, 
    additional_charges_amount: 0, 
    final_amount: 0, 
    expiry_date: '' 
  };

  const [formData, setFormData] = useState({ 
    vendor_id: '', 
    branch_id: '1', 
    invoice_type: 'tax_invoice', 
    po_number: '', 
    date: new Date().toISOString().split('T')[0], 
    discount_amount: 0, 
    additional_charges: 0, 
    final_amount: 0, 
    notes: '', 
    items: [{...initialItem}] as any[] 
  });

  useEffect(() => {
    fetchOrders();
    fetchInitialData();

    const handleClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const fetchOrders = async () => { 
    try { 
      const res = await api.get('/purchases'); 
      setOrders(res.data.data); 
    } finally { 
      setLoading(false); 
    } 
  };

  const fetchInitialData = async () => { 
    try {
      const [v, i, p] = await Promise.all([
        api.get('/vendors'), 
        api.get('/inventory'), 
        api.get('/inventory/packages')
      ]); 
      setVendors(v.data.data); 
      setInventoryItems(i.data.data); 
      setAllPackages(p.data.data); 
    } catch (error) {
      console.error("Error fetching initial data", error);
    }
  };

  const updateItem = (index: number, field: string, val: any) => {
    const list = [...formData.items];
    list[index][field] = val;
    
    const q = Number(list[index].quantity || 0);
    const p = Number(list[index].unit_price || 0);
    const d = Number(list[index].discount_amount || 0);
    const c = Number(list[index].additional_charges_amount || 0);
    
    list[index].amount = q * p;
    list[index].final_amount = (list[index].amount - d) + c;
    
    setFormData({ ...formData, items: list });
  };

  const totals = { 
    subtotal: formData.items.reduce((s, i) => s + (Number(i.amount) || 0), 0), 
    final: 0 
  };
  totals.final = (totals.subtotal - Number(formData.discount_amount || 0)) + Number(formData.additional_charges || 0);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const poNum = formData.po_number || `PO-${Date.now().toString().slice(-6)}`;
      const payload = { ...formData, po_number: poNum, final_amount: totals.final };
      
      if (editingId) {
        await api.put(`/purchases/${editingId}`, payload);
        toast.success('Purchase Order Updated!');
      } else {
        await api.post('/purchases', payload);
        toast.success(t('purchase_order_success'));
      }
      
      setIsModalOpen(false); 
      setEditingId(null);
      fetchOrders(); 
    } catch (err) { 
      toast.error('Failed to save purchase order.'); 
    }
  };

  const handleEdit = async (order: any) => {
    try {
      const res = await api.get(`/purchases/${order.purchase_id}`);
      const fullOrder = res.data.data;
      
      setFormData({
        vendor_id: fullOrder.vendor_id,
        branch_id: fullOrder.branch_id || 'main',
        invoice_type: fullOrder.invoice_type || 'tax_invoice',
        po_number: fullOrder.po_number,
        date: new Date(fullOrder.date || fullOrder.created_at).toISOString().split('T')[0],
        discount_amount: Number(fullOrder.discount_amount || 0),
        additional_charges: Number(fullOrder.additional_charges || 0),
        final_amount: Number(fullOrder.final_amount || 0),
        notes: fullOrder.notes || '',
        items: fullOrder.items.map((it: any) => ({
          inventory_item_id: it.inventory_item_id,
          variant_id: it.variant_id || '',
          package_id: it.package_id || '',
          quantity: it.quantity,
          unit_price: it.unit_price,
          amount: it.amount,
          discount_amount: it.discount_amount || 0,
          additional_charges_amount: it.additional_charges_amount || 0,
          final_amount: it.final_amount,
          expiry_date: it.expiry_date ? it.expiry_date.split('T')[0] : ''
        }))
      });
      
      setEditingId(order.purchase_id);
      setIsModalOpen(true);
    } catch (error) {
      toast.error('Failed to fetch order details');
    }
  };
  
  const handleReceive = async (purchaseId: number) => {
    try {
      const confirm = await Swal.fire({
        title: 'Receive Stock?',
        text: 'This will update your inventory levels and create new batches.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#01562c',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, Receive Now'
      });

      if (confirm.isConfirmed) {
        await api.post(`/purchases/${purchaseId}/receive`);
        toast.success('Stock received into inventory!');
        fetchOrders();
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to receive stock.';
      toast.error(msg);
    }
  };

  const handleDeleteOrder = async (id: number) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#be123c',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!'
    });

    if (confirm.isConfirmed) {
      try {
        await api.delete(`/purchases/${id}`);
        toast.success('Order deleted successfully');
        fetchOrders();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete order');
      }
    }
  };

  return (
    <Layout title={t('purchase_management')}>
      <div className="inventory-container">
        
        {/* Main List Section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem', 
          background: 'white', 
          padding: '1.5rem', 
          borderRadius: '16px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #f1f5f9'
        }}>
          <div>
            <h2 className="text-3xl font-extrabold text-[#01562c]" style={{ margin: 0 }}>{t('purchase_orders')}</h2>
            <p className="text-slate-500 font-medium" style={{ margin: 0 }}>{t('track_procurement_msg')}</p>
          </div>
          <button 
            className="btn-add hover:scale-105 transition-all" 
            style={{ 
              borderRadius: '10px', 
              padding: '0.6rem 1.4rem', 
              background: '#01562c', 
              color: 'white', 
              fontWeight: '700', 
              cursor: 'pointer', 
              fontSize: '0.85rem',
              border: 'none',
              whiteSpace: 'nowrap'
            }}
            onClick={() => { 
              setFormData({...formData, items: [{...initialItem}]}); 
              setIsModalOpen(true); 
            }}
          >
            <Plus size={18} className="inline mr-2" /> {t('create_purchase')}
          </button>
        </div>

        <div className="stock-table-card shadow-lg bg-white overflow-hidden" style={{ borderRadius: '20px' }}>
          <div className="table-wrapper">
            <table className="w-full">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-8 py-5 text-start text-xs font-bold text-[#01562c] uppercase">{t('po_number')}</th>
                  <th className="px-8 py-5 text-start text-xs font-bold text-[#01562c] uppercase">{t('vendor')}</th>
                  <th className="px-8 py-5 text-start text-xs font-bold text-[#01562c] uppercase">{t('branch')}</th>
                  <th className="px-8 py-5 text-start text-xs font-bold text-[#01562c] uppercase">{t('date')}</th>
                  <th className="px-8 py-5 text-start text-xs font-bold text-[#01562c] uppercase">{t('final_total')}</th>
                  <th className="px-8 py-5 text-center text-xs font-bold text-[#01562c] uppercase">{t('status')}</th>
                  <th className="px-8 py-5 text-center text-xs font-bold text-[#01562c] uppercase">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-20 text-slate-400">{t('loading_data')}</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-20 text-slate-400 font-medium font-italic">{t('no_new_alerts')}</td></tr>
                ) : (
                  orders.map(o => (
                    <tr key={o.purchase_id} className="hover:bg-slate-50 transition-all cursor-default">
                      <td className="px-8 py-5 font-bold text-[#01562c]"><Hash size={12} className="inline mr-1 opacity-50"/>{o.po_number}</td>
                      <td className="px-8 py-5 font-bold text-slate-800">{language === 'ar' ? (o.vendor_name_ar || o.vendor_name) : o.vendor_name}</td>
                      <td className="px-8 py-5 text-slate-500 font-medium">{language === 'ar' ? (o.branch_name_ar || o.branch_name) : o.branch_name}</td>
                      <td className="px-8 py-5 text-slate-500">{new Date(o.date || o.created_at).toLocaleDateString()}</td>
                      <td className="px-8 py-5 font-black text-[#01562c] text-lg">{Number(o.final_amount).toFixed(3)}</td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${o.status === 'received' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {t(o.status)}
                        </span>
                      </td>
                       <td className="px-8 py-5 text-center">
                        <div className="flex justify-center gap-2" style={{ position: 'relative' }}>
                           <button 
                              className="p-3 bg-slate-100 hover:bg-[#01562c] hover:text-white rounded-xl transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === o.purchase_id ? null : o.purchase_id);
                              }}
                           >
                             <MoreHorizontal size={18} />
                           </button>

                           {activeMenuId === o.purchase_id && (
                             <div className="dropdown-menu-custom shadow-2xl" style={{ right: '40px', top: '0' }}>
                                {o.status === 'pending' && (
                                  <button className="dropdown-item receive" onClick={() => handleReceive(o.purchase_id)}>
                                    <PackageCheck size={16} /> {t('receive_stock')}
                                  </button>
                                )}
                                <button className="dropdown-item edit" onClick={() => handleEdit(o)}>
                                  {o.status === 'pending' ? (
                                    <><Edit size={16} /> {t('edit_order')}</>
                                  ) : (
                                    <><Eye size={16} /> {t('view_order') || 'View Order'}</>
                                  )}
                                </button>
                                <div className="h-[1px] bg-slate-100 my-1" />
                                <button className="dropdown-item delete" onClick={() => handleDeleteOrder(o.purchase_id)}>
                                  <Trash2 size={16} /> {t('delete_order')}
                                </button>
                             </div>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="po-modal-overlay">
          <div className="po-modal-card" style={{ maxHeight: '95vh', overflowY: 'auto' }}>
            
            <header className="po-header">
              <h2>
                <ShoppingBag /> 
                {editingId 
                  ? (orders.find(o => o.purchase_id === editingId)?.status === 'pending' ? t('edit_order') : t('view_order'))
                  : t('add_new_po')}
              </h2>
              <div className="po-close-icon" onClick={() => { setIsModalOpen(false); setEditingId(null); }}>
                <X size={24} />
              </div>
            </header>

            <form onSubmit={handleSubmit} className="po-body">
              
              {/* Order Metadata Card */}
              <div className="po-section-card">
                <div className="po-fields-grid">
                  <div className="po-field-group">
                    <label><Truck size={14} className="inline mr-2" /> {t('vendor_account')}</label>
                    <select disabled={editingId ? orders.find(o => o.purchase_id === editingId)?.status !== 'pending' : false} required className="po-select" value={formData.vendor_id} onChange={e => setFormData({...formData, vendor_id: e.target.value, branch_id: ''})}>
                      <option value="">{t('select_vendor_account')}</option>
                      {vendors.filter(v => v.type === 'supplier').map(v => <option key={v.vendor_id} value={v.vendor_id}>{language === 'ar' ? (v.name_ar || v.name_en) : v.name_en}</option>)}
                    </select>
                  </div>
                  <div className="po-field-group">
                    <label><ArrowRight size={14} className="inline mr-2" /> {t('target_branch_node')}</label>
                    <select disabled={editingId ? orders.find(o => o.purchase_id === editingId)?.status !== 'pending' : false} required className="po-select font-bold" value={formData.branch_id} onChange={e => setFormData({...formData, branch_id: e.target.value})}>
                      <option value="">{t('select_delivery_node')}</option>
                      <option value="main">{t('main_central_node')}</option>
                      {vendors.find(v => String(v.vendor_id) === String(formData.vendor_id))?.branches?.map((br: any) => (
                        <option key={br.branch_id} value={br.branch_id}>{language === 'ar' ? (br.name_ar || br.name_en) : br.name_en}</option>
                      ))}
                    </select>
                  </div>
                  <div className="po-field-group">
                    <label><Hash size={14} className="inline mr-2" /> {t('po_number')}</label>
                    <input disabled={editingId ? orders.find(o => o.purchase_id === editingId)?.status !== 'pending' : false} type="text" className="po-input" value={formData.po_number} onChange={e => setFormData({...formData, po_number: e.target.value})} placeholder={t('internal_notes_hint')} />
                  </div>
                  <div className="po-field-group">
                    <label><Calendar size={14} className="inline mr-2" /> {t('purchase_date')}</label>
                    <input disabled={editingId ? orders.find(o => o.purchase_id === editingId)?.status !== 'pending' : false} type="date" className="po-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div className="po-field-group">
                    <label><CreditCard size={14} className="inline mr-2" /> {t('bill_type')}</label>
                    <select disabled={editingId ? orders.find(o => o.purchase_id === editingId)?.status !== 'pending' : false} className="po-select" value={formData.invoice_type} onChange={e => setFormData({...formData, invoice_type: e.target.value})}>
                      <option value="tax_invoice">{t('tax_invoice')}</option>
                      <option value="simplified">{t('simplified_bill')}</option>
                    </select>
                  </div>
                  <div className="po-field-group">
                    <label><StickyNote size={14} className="inline mr-2" /> {t('order_notes')}</label>
                    <input disabled={editingId ? orders.find(o => o.purchase_id === editingId)?.status !== 'pending' : false} type="text" className="po-input" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder={t('internal_notes_hint')} />
                  </div>
                </div>
              </div>

              {/* Items Table Card */}
              <div className="po-section-card po-table-container">
                <div className="po-table-header">
                  <h3><Package size={18} className="inline mr-2" /> {t('line_items_list')}</h3>
                  <span className="text-xs font-bold text-slate-400 uppercase">{formData.items.length} {t('products_added')}</span>
                </div>
                
                <div className="overflow-auto" style={{ maxHeight: '40vh' }}>
                  <table className="po-table">
                    <thead>
                      <tr>
                        <th style={{ width: '25%' }}>{t('product_name')}</th>
                        <th style={{ width: '12%' }}>{t('variant')}</th>
                        <th style={{ width: '12%' }}>{t('package')}</th>
                        <th style={{ width: '10%' }}>{t('price')}</th>
                        <th style={{ width: '8%' }}>{t('qty')}</th>
                        <th style={{ width: '10%' }}>{t('subtotal')}</th>
                        <th style={{ width: '10%' }}>{t('disc')}</th>
                        <th style={{ width: '10%' }}>{t('net_final')}</th>
                        <th style={{ width: '3%' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((it, idx) => (
                        <tr key={idx}>
                          <td>
                            <select 
                              className="po-table-input font-bold" 
                              value={it.inventory_item_id} 
                              disabled={editingId ? orders.find(o => o.purchase_id === editingId)?.status !== 'pending' : false}
                              onChange={e => {
                               updateItem(idx, 'inventory_item_id', e.target.value);
                               // Reset package when item changes
                               updateItem(idx, 'package_id', '');
                            }}>
                              <option value="">{t('choose_item')}</option>
                              {inventoryItems.map(i => <option key={i.inventory_item_id} value={i.inventory_item_id}>{language === 'ar' ? (i.name_ar || i.name_en) : i.name_en} ({language === 'ar' ? (i.unit_ar || i.unit_en) : i.unit_en})</option>)}
                            </select>
                          </td>
                          <td><select disabled className="po-table-input opacity-40"><option>N/A</option></select></td>
                          <td>
                            <select disabled={editingId ? orders.find(o => o.purchase_id === editingId)?.status !== 'pending' : false} className="po-table-input" value={it.package_id} onChange={e => updateItem(idx, 'package_id', e.target.value)}>
                              <option value="">{t('base_unit')} ({inventoryItems.find(i => String(i.inventory_item_id) === String(it.inventory_item_id))?.[language === 'ar' ? 'unit_ar' : 'unit_en'] || '...' })</option>
                              {allPackages.filter((p: any) => String(p.inventory_item_id) === String(it.inventory_item_id)).map((p: any) => (
                                <option key={p.package_id} value={p.package_id}>{language === 'ar' ? (p.name_ar || p.name_en) : p.name_en} (x{Number(p.multiplier)})</option>
                              ))}
                            </select>
                          </td>
                          <td><input disabled={editingId ? orders.find(o => o.purchase_id === editingId)?.status !== 'pending' : false} type="number" step="0.001" className="po-table-input text-end font-bold" value={it.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} /></td>
                          <td><input disabled={editingId ? orders.find(o => o.purchase_id === editingId)?.status !== 'pending' : false} type="number" className="po-table-input text-end font-bold" value={it.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} /></td>
                          <td className="text-end text-slate-500 font-bold">{Number(it.amount).toFixed(3)}</td>
                          <td><input disabled={editingId ? orders.find(o => o.purchase_id === editingId)?.status !== 'pending' : false} type="number" step="0.001" className="po-table-input text-end" value={it.discount_amount} onChange={e => updateItem(idx, 'discount_amount', e.target.value)} /></td>
                          <td className="text-end font-black text-[#01562c]">{Number(it.final_amount).toFixed(3)}</td>
                          <td className="text-center">
                            {(!editingId || orders.find(o => o.purchase_id === editingId)?.status === 'pending') && (
                              <Trash2 size={16} className="po-delete-row" onClick={() => setFormData({...formData, items: formData.items.filter((_, i) => i !== idx)})} />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="po-add-row" onClick={() => setFormData({...formData, items: [...formData.items, {...initialItem}]})}>
                  <PlusCircle size={18} /> {t('add_new_line_item')}
                </div>
              </div>

              {/* Footer Totals Section */}
              <div className="po-footer-grid">
                <div className="po-section-card">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('internal_communication')}</h4>
                  <textarea className="po-note-area" placeholder={t('write_requirements_hint')}></textarea>
                </div>
                
                <div className="po-totals-card">
                  <div className="po-total-row">
                    <span>{t('subtotal_summary')}</span>
                    <span>{totals.subtotal.toFixed(3)} {t('kd_currency')}</span>
                  </div>
                  <div className="po-total-row">
                    <span>{t('overall_discount')}</span>
                    <div className="flex items-center gap-2">
                      <input type="number" className="w-24 text-end p-1 rounded-lg border border-slate-200" value={formData.discount_amount} onChange={e => setFormData({...formData, discount_amount: Number(e.target.value)})} />
                      <span className="text-xs font-bold text-[#01562c]">{t('kd_currency')}</span>
                    </div>
                  </div>
                  <div className="po-total-row grand">
                    <span>{t('grand_total_due')}</span>
                    <span>{totals.final.toFixed(3)} <small className="text-xs font-bold">{t('kd_currency')}</small></span>
                  </div>

                  <div className="po-actions">
                    <button className="btn-cancel" onClick={() => { setIsModalOpen(false); setEditingId(null); }}>
                      {t('cancel')}
                    </button>
                    {(!editingId || orders.find(o => o.purchase_id === editingId)?.status === 'pending') && (
                      <button className="btn-confirm" onClick={handleSubmit}>
                        {t('confirm_save')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PurchaseOrdersPage;

