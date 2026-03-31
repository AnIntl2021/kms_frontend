import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { Plus, X, Trash2, PlusCircle, Package, Truck, Calendar, CreditCard, StickyNote, Hash, MoreHorizontal, ShoppingBag, ArrowRight, PackageCheck } from 'lucide-react';
import Swal from 'sweetalert2';
import './PurchaseOrdersPage.css';

const PurchaseOrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      await api.post('/purchases', { ...formData, po_number: poNum, final_amount: totals.final });
      setIsModalOpen(false); 
      fetchOrders(); 
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Purchase order created successfully',
        confirmButtonColor: '#01562c'
      });
    } catch (err) { 
      Swal.fire('Error', 'Failed to save purchase order', 'error'); 
    }
  };
  
  const handleReceive = async (purchaseId: number) => {
    try {
      const confirm = await Swal.fire({
        title: 'Receive Goods?',
        text: 'This will confirm the delivery and INCREMENT your inventory stock!',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#01562c',
        cancelButtonColor: '#ff4444',
        confirmButtonText: 'Yes, Receive & Stock'
      });

      if (confirm.isConfirmed) {
        await api.post(`/purchases/${purchaseId}/receive`);
        Swal.fire('Received!', 'Inventory levels have been updated successfully.', 'success');
        fetchOrders();
      }
    } catch (error: any) {
      Swal.fire('Process Error', error.response?.data?.message || 'Failed to receive stock. Please try again.', 'error');
    }
  };

  return (
    <Layout title="Purchase Management">
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
            <h2 className="text-3xl font-extrabold text-[#01562c]" style={{ margin: 0 }}>Purchase Orders</h2>
            <p className="text-slate-500 font-medium" style={{ margin: 0 }}>Track and manage your procurement operations.</p>
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
            <Plus size={18} className="inline mr-2" /> CREATE PURCHASE
          </button>
        </div>

        <div className="stock-table-card shadow-lg bg-white overflow-hidden" style={{ borderRadius: '20px' }}>
          <div className="table-wrapper">
            <table className="w-full">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-8 py-5 text-left text-xs font-bold text-[#01562c] uppercase">PO Number</th>
                  <th className="px-8 py-5 text-left text-xs font-bold text-[#01562c] uppercase">Vendor</th>
                  <th className="px-8 py-5 text-left text-xs font-bold text-[#01562c] uppercase">Branch</th>
                  <th className="px-8 py-5 text-left text-xs font-bold text-[#01562c] uppercase">Date</th>
                  <th className="px-8 py-5 text-left text-xs font-bold text-[#01562c] uppercase">Final Total</th>
                  <th className="px-8 py-5 text-center text-xs font-bold text-[#01562c] uppercase">Status</th>
                  <th className="px-8 py-5 text-center text-xs font-bold text-[#01562c] uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-20 text-slate-400">Loading orders...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-20 text-slate-400 font-medium font-italic">No purchase orders found.</td></tr>
                ) : (
                  orders.map(o => (
                    <tr key={o.purchase_id} className="hover:bg-slate-50 transition-all cursor-default">
                      <td className="px-8 py-5 font-bold text-[#01562c]"><Hash size={12} className="inline mr-1 opacity-50"/>{o.po_number}</td>
                      <td className="px-8 py-5 font-bold text-slate-800">{o.vendor_name}</td>
                      <td className="px-8 py-5 text-slate-500 font-medium">{o.branch_name}</td>
                      <td className="px-8 py-5 text-slate-500">{new Date(o.date || o.created_at).toLocaleDateString()}</td>
                      <td className="px-8 py-5 font-black text-[#01562c] text-lg">{Number(o.final_amount).toFixed(3)}</td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${o.status === 'received' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex justify-center gap-2">
                           {o.status === 'pending' && (
                              <button 
                                 className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all"
                                 title="Receive Stock"
                                 onClick={() => handleReceive(o.purchase_id)}
                              >
                                 <PackageCheck size={18} />
                              </button>
                           )}
                           <button className="p-3 bg-slate-100 hover:bg-[#01562c] hover:text-white rounded-xl transition-all">
                             <MoreHorizontal size={18} />
                           </button>
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
              <h2><ShoppingBag /> ADD NEW PURCHASE ORDER</h2>
              <div className="po-close-icon" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </div>
            </header>

            <form onSubmit={handleSubmit} className="po-body">
              
              {/* Order Metadata Card */}
              <div className="po-section-card">
                <div className="po-fields-grid">
                  <div className="po-field-group">
                    <label><Truck size={14} className="inline mr-2" /> Vendor Name</label>
                    <select required className="po-select" value={formData.vendor_id} onChange={e => setFormData({...formData, vendor_id: e.target.value})}>
                      <option value="">Select Vendor Account</option>
                      {vendors.map(v => <option key={v.vendor_id} value={v.vendor_id}>{v.name_en}</option>)}
                    </select>
                  </div>
                  <div className="po-field-group">
                    <label><Hash size={14} className="inline mr-2" /> Order Number</label>
                    <input type="text" className="po-input" value={formData.po_number} onChange={e => setFormData({...formData, po_number: e.target.value})} placeholder="Auto-generated if empty" />
                  </div>
                  <div className="po-field-group">
                    <label><Calendar size={14} className="inline mr-2" /> Purchase Date</label>
                    <input type="date" className="po-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div className="po-field-group">
                    <label><CreditCard size={14} className="inline mr-2" /> Bill Type</label>
                    <select className="po-select" value={formData.invoice_type} onChange={e => setFormData({...formData, invoice_type: e.target.value})}>
                      <option value="tax_invoice">Tax Invoice</option>
                      <option value="simplified">Simplified Bill</option>
                    </select>
                  </div>
                  <div className="po-field-group">
                    <label><StickyNote size={14} className="inline mr-2" /> Order Notes</label>
                    <input type="text" className="po-input" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Internal notes..." />
                  </div>
                </div>
              </div>

              {/* Items Table Card */}
              <div className="po-section-card po-table-container">
                <div className="po-table-header">
                  <h3><Package size={18} className="inline mr-2" /> LINE ITEMS LIST</h3>
                  <span className="text-xs font-bold text-slate-400 uppercase">{formData.items.length} Products Added</span>
                </div>
                
                <div className="overflow-auto" style={{ maxHeight: '40vh' }}>
                  <table className="po-table">
                    <thead>
                      <tr>
                        <th style={{ width: '25%' }}>PRODUCT NAME</th>
                        <th style={{ width: '12%' }}>VARIANT</th>
                        <th style={{ width: '12%' }}>PACKAGE</th>
                        <th style={{ width: '10%' }}>PRICE</th>
                        <th style={{ width: '8%' }}>QTY</th>
                        <th style={{ width: '10%' }}>SUBTOTAL</th>
                        <th style={{ width: '10%' }}>DISC.</th>
                        <th style={{ width: '10%' }}>NET FINAL</th>
                        <th style={{ width: '3%' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((it, idx) => (
                        <tr key={idx}>
                          <td>
                            <select className="po-table-input font-bold" value={it.inventory_item_id} onChange={e => updateItem(idx, 'inventory_item_id', e.target.value)}>
                              <option value="">Choose item...</option>
                              {inventoryItems.map(i => <option key={i.inventory_item_id} value={i.inventory_item_id}>{i.name_en}</option>)}
                            </select>
                          </td>
                          <td><select disabled className="po-table-input opacity-40"><option>N/A</option></select></td>
                          <td>
                            <select className="po-table-input" value={it.package_id} onChange={e => updateItem(idx, 'package_id', e.target.value)}>
                              <option value="">Base Unit</option>
                              {allPackages.map(p => <option key={p.package_id} value={p.package_id}>{p.name_en}</option>)}
                            </select>
                          </td>
                          <td><input type="number" step="0.001" className="po-table-input text-right font-bold" value={it.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} /></td>
                          <td><input type="number" className="po-table-input text-right font-bold" value={it.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} /></td>
                          <td className="text-right text-slate-500 font-bold">{Number(it.amount).toFixed(3)}</td>
                          <td><input type="number" step="0.001" className="po-table-input text-right" value={it.discount_amount} onChange={e => updateItem(idx, 'discount_amount', e.target.value)} /></td>
                          <td className="text-right font-black text-[#01562c]">{Number(it.final_amount).toFixed(3)}</td>
                          <td className="text-center">
                            <Trash2 size={16} className="po-delete-row" onClick={() => setFormData({...formData, items: formData.items.filter((_, i) => i !== idx)})} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="po-add-row" onClick={() => setFormData({...formData, items: [...formData.items, {...initialItem}]})}>
                  <PlusCircle size={18} /> ADD NEW LINE ITEM
                </div>
              </div>

              {/* Footer Totals Section */}
              <div className="po-footer-grid">
                <div className="po-section-card">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Internal Communication</h4>
                  <textarea className="po-note-area" placeholder="Write any specific requirements or delivery instructions here..."></textarea>
                </div>
                
                <div className="po-totals-card">
                  <div className="po-total-row">
                    <span>Sub-Total Summary</span>
                    <span>{totals.subtotal.toFixed(3)} د.ك</span>
                  </div>
                  <div className="po-total-row">
                    <span>Overall Discount</span>
                    <div className="flex items-center gap-2">
                      <input type="number" className="w-24 text-right p-1 rounded-lg border border-slate-200" value={formData.discount_amount} onChange={e => setFormData({...formData, discount_amount: Number(e.target.value)})} />
                      <span className="text-xs font-bold text-[#01562c]">د.ك</span>
                    </div>
                  </div>
                  <div className="po-total-row grand">
                    <span>Grand Total Due</span>
                    <span>{totals.final.toFixed(3)} <small className="text-xs font-bold">د.ك</small></span>
                  </div>

                  <div className="po-actions">
                    <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>CANCEL</button>
                    <button type="submit" className="btn-confirm">CONFIRM & SAVE <ArrowRight size={18} className="inline ml-1" /></button>
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

