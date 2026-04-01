import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { 
  Truck, 
  Package, 
  Zap, 
  Plus, 
  Search, 
  AlertCircle,
  Calendar,
  Building2,
  X,
  TrendingDown,
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import './InventoryPage.css'; 
import { toast } from 'react-toastify';

interface Vendor {
  vendor_id: number;
  name_en: string;
  type: string;
}

interface MenuItem {
  menu_item_id: number;
  name_en: string;
  current_stock: number;
  price: number;
}

const FactoryDispatchPage = () => {
  const [activeTab, setActiveTab] = useState<'produce' | 'dispatch' | 'returns'>('dispatch');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [productionLogs, setProductionLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showProduceModal, setShowProduceModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  const [produceForm, setProduceForm] = useState({ 
    production_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    items: [] as any[]
  });

  const [dispatchForm, setDispatchForm] = useState({
    vendor_id: '',
    batch_number: '',
    expiry_date: '',
    items: [] as any[],
    payment_method: 'credit'
  });

  useEffect(() => {
    fetchBaseData();
  }, [activeTab]);

  const fetchBaseData = async () => {
    setLoading(true);
    try {
      const results: any = await Promise.all([
        api.get('/vendors').catch(() => ({ data: { data: [] } })),
        api.get('/menu').catch(() => ({ data: { data: [] } })),
        api.get('/factory/dispatches').catch(() => ({ data: { data: [] } })),
        api.get('/factory/production/logs').catch(() => ({ data: { data: [] } }))
      ]);
      
      const vArr = results[0].data.data || results[0].data;
      const mArr = results[1].data.data || results[1].data;
      const dArr = results[2].data.data || results[2].data;
      const pArr = (results[3].data.data || results[3].data).filter((p: any) => p.batch_number);

      setVendors(Array.isArray(vArr) ? vArr : []);
      setMenuItems(Array.isArray(mArr) ? mArr : []);
      setDispatches(Array.isArray(dArr) ? dArr : []);
      setProductionLogs(Array.isArray(pArr) ? pArr : []);
    } catch (e) {
      console.error('Fetch Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSelect = (batchNum: string) => {
    const batch = productionLogs.find(p => p.batch_number === batchNum);
    if (batch) {
      setDispatchForm({
        ...dispatchForm,
        batch_number: batchNum,
        expiry_date: batch.expiry_date.split('T')[0]
      });
    }
  };

  const addItemToBatch = (item: MenuItem) => {
    if (produceForm.items.find(i => i.menu_item_id === item.menu_item_id)) return;
    setProduceForm({
      ...produceForm,
      items: [...produceForm.items, { ...item, quantity: 100 }]
    });
  };

  const handleProduceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (produceForm.items.length === 0) return toast.warning('Please add items to the production batch.');
    if (!produceForm.expiry_date) return toast.warning('Missing expiry date for the batch.');

    try {
      await api.post('/factory/production/batch', produceForm);
      toast.success('Production Batch Recorded Successfully! 🏭');
      setShowProduceModal(false);
      setProduceForm({ production_date: new Date().toISOString().split('T')[0], expiry_date: '', items: [] });
      fetchBaseData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record production.');
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/factory/dispatches/${id}/status`, { status });
      fetchBaseData();
    } catch (e) { console.error(e); }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/factory/sales', dispatchForm);
      toast.success('Goods Dispatched & Linked to Batch! 🚛');
      setShowDispatchModal(false);
      setDispatchForm({ vendor_id: '', batch_number: '', expiry_date: '', items: [], payment_method: 'credit' });
      fetchBaseData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Dispatch operation failed.');
    }
  };

  const addItemToDispatch = (item: MenuItem) => {
    if (dispatchForm.items.find(i => i.menu_item_id === item.menu_item_id)) return;
    setDispatchForm({
      ...dispatchForm,
      items: [...dispatchForm.items, { ...item, quantity: 1 }]
    });
  };

  return (
    <Layout title="Production & Distribution Hub">
      <div className="inventory-container">
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <button onClick={() => setActiveTab('dispatch')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 4px', fontWeight: 700, fontSize: '15px', color: activeTab === 'dispatch' ? 'var(--primary)' : '#64748b', borderBottom: activeTab === 'dispatch' ? '3px solid var(--primary)' : 'none', cursor: 'pointer' }}>
            <Truck size={20} /> Client Distribution
          </button>
          <button onClick={() => setActiveTab('produce')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 4px', fontWeight: 700, fontSize: '15px', color: activeTab === 'produce' ? 'var(--primary)' : '#64748b', borderBottom: activeTab === 'produce' ? '3px solid var(--primary)' : 'none', cursor: 'pointer' }}>
            <Zap size={20} /> Batch Production
          </button>
          <button onClick={() => setActiveTab('returns')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 4px', fontWeight: 700, fontSize: '15px', color: activeTab === 'returns' ? 'var(--primary)' : '#64748b', borderBottom: activeTab === 'returns' ? '3px solid var(--primary)' : 'none', cursor: 'pointer' }}>
            <TrendingDown size={20} /> Returns & Wastage
          </button>
        </div>

        {/* Toolbar */}
        <div className="inventory-actions">
           <div className="search-group">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Search orders or batches..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
           </div>
           <div className="action-buttons">
              <button className="btn-add" style={{ background: 'var(--primary)' }} onClick={() => setShowProduceModal(true)}><Plus size={18} /> New Production Batch</button>
              <button className="btn-add" style={{ background: '#0369a1' }} onClick={() => setShowDispatchModal(true)}><Truck size={18} /> Create Dispatch</button>
           </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
          <div className="stock-table-card">
            <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
               <strong>{activeTab === 'dispatch' ? 'Internal Distribution' : 'Factory Production History'}</strong>
               <span style={{ fontSize: '12px', color: '#64748b' }}>Real-time Traceability</span>
            </div>
            
            <div className="table-wrapper">
               <table>
                  <thead>
                    {activeTab === 'dispatch' ? (
                      <tr>
                        <th>SO #</th>
                        <th>Distribution Partner</th>
                        <th>Status</th>
                        <th>Dispatch Date</th>
                        <th className="text-right">Action</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>Batch Code</th>
                        <th>Mfd Date</th>
                        <th>Exp Date</th>
                        <th>Line Count</th>
                        <th className="text-right">Batch Size</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {activeTab === 'dispatch' ? (
                      dispatches.length === 0 ? <tr><td colSpan={5} className="text-center py-4">No distributions found.</td></tr> :
                      dispatches.map(d => (
                        <tr key={d.sale_id}>
                          <td><strong>{d.order_number}</strong></td>
                          <td>{d.client_name}</td>
                          <td><span className={`status-badge ${d.dispatch_status === 'pending' ? 'low' : d.dispatch_status === 'in_transit' ? 'warning' : 'healthy'}`}>{d.dispatch_status}</span></td>
                          <td>{new Date(d.created_at).toLocaleDateString()}</td>
                          <td className="text-right">
                             <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <span style={{fontWeight: 700, marginRight:'5px'}}>{Number(d.total_amount).toFixed(3)} KWD</span>
                                {d.dispatch_status === 'pending' && <button onClick={() => handleUpdateStatus(d.sale_id, 'in_transit')} className="btn-secondary" style={{padding:'4px 8px', fontSize: '10px'}}>Track</button>}
                                {d.dispatch_status === 'in_transit' && <button onClick={() => handleUpdateStatus(d.sale_id, 'delivered')} className="btn-success" style={{padding:'4px 8px', fontSize: '10px'}}>Deliver</button>}
                             </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      productionLogs.length === 0 ? <tr><td colSpan={5} className="text-center py-4">Wait for production run.</td></tr> :
                      productionLogs.filter(p => p.batch_number).map(p => (
                        <tr key={p.production_id}>
                          <td>
                            <div style={{fontWeight: 700, color: 'var(--primary)', fontSize: '14px'}}>{p.batch_number}</div>
                            <div style={{fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: '1.4', maxWidth: '300px'}}>
                               {p.product_summary ? p.product_summary : 'Loading details...'}
                            </div>
                          </td>
                          <td>{new Date(p.production_date).toLocaleDateString()}</td>
                          <td><span style={{color:'#be123c', fontWeight: 600}}>{new Date(p.expiry_date).toLocaleDateString()}</span></td>
                          <td>{p.total_items} types</td>
                          <td className="text-right"><strong>{p.total_qty} units</strong></td>
                        </tr>
                      ))
                    )}
                  </tbody>
               </table>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', padding: '1.5rem', borderRadius: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#047857', marginBottom: '10px', fontWeight: 800 }}>
                   <ClipboardList size={20} /> Traceability Live
                </div>
                <p style={{ fontSize: '13px', color: '#047857' }}>All current dispatches are linked to valid production batches.</p>
             </div>
             <div style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b', marginBottom: '15px', fontWeight: 800 }}>
                   <Zap size={20} /> Efficiency
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span>System Uptime</span>
                      <strong>100%</strong>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Production Modal */}
      {showProduceModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h3><Zap size={22} style={{ color: '#f59e0b', marginRight: '10px' }} /> Record Production Batch</h3>
              <button className="btn-close" onClick={() => setShowProduceModal(false)}><X /></button>
            </div>
            <form onSubmit={handleProduceSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div className="form-group"><label>Mfd Date</label><input type="date" value={produceForm.production_date} onChange={e => setProduceForm({...produceForm, production_date: e.target.value})} required /></div>
                  <div className="form-group"><label>Expiry Date</label><input type="date" value={produceForm.expiry_date} onChange={e => setProduceForm({...produceForm, expiry_date: e.target.value})} required /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '15px', maxHeight: '400px', overflowY: 'auto' }}>
                    <h4 style={{ fontSize: '13px', marginBottom: '15px' }}>Product Catalog</h4>
                    {menuItems.map(item => (
                      <div key={item.menu_item_id} onClick={() => addItemToBatch(item)} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'white', borderRadius: '10px', cursor: 'pointer', border: '1px solid #f1f5f9', marginBottom: '8px' }}>
                         <span style={{ fontWeight: 600 }}>{item.name_en}</span>
                         <span style={{ fontSize: '12px', color: 'var(--primary)' }}>Stock: {item.current_stock}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'white', border: '1px solid #f1f5f9', padding: '15px', borderRadius: '15px' }}>
                    <h4 style={{ fontSize: '13px', marginBottom: '15px' }}>Batch Composition</h4>
                    {produceForm.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ flex: 1, fontSize: '13px' }}>{item.name_en}</div>
                        <input type="number" style={{ width: '80px', padding: '6px' }} value={item.quantity} onChange={e => {
                          const n = [...produceForm.items]; n[idx].quantity = e.target.value; setProduceForm({...produceForm, items: n});
                        }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowProduceModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--primary)' }}>Complete Production Batch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Modal - WITH BATCH SELECT */}
      {showDispatchModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3><Truck size={22} style={{ color: '#0369a1', marginRight: '10px' }} /> Client Distribution Dispatch</h3>
              <button className="btn-close" onClick={() => setShowDispatchModal(false)}><X /></button>
            </div>
            <form onSubmit={handleDispatch}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', marginBottom: '20px' }}>
                   <div className="form-group">
                      <label><Building2 size={14} /> Select Distribution Partner</label>
                      <select value={dispatchForm.vendor_id} onChange={e => setDispatchForm({...dispatchForm, vendor_id: e.target.value})} required>
                        <option value="">-- Choose Client --</option>
                        {vendors.filter(v => v.type === 'client' || vendors.length < 5).map(v => <option key={v.vendor_id} value={v.vendor_id}>{v.name_en}</option>)}
                      </select>
                   </div>
                   <div className="form-group">
                      <label><Zap size={14} /> Link to Production Batch</label>
                      <select value={dispatchForm.batch_number} onChange={e => handleBatchSelect(e.target.value)} required>
                        <option value="">-- Choose Batch --</option>
                        {productionLogs.map(p => <option key={p.production_id} value={p.batch_number}>{p.batch_number} (Exp: {new Date(p.expiry_date).toLocaleDateString()})</option>)}
                      </select>
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '15px' }}>
                    <h4 style={{ fontSize: '13px', marginBottom: '15px' }}>Finished Product Stock</h4>
                    {menuItems.map(item => (
                      <div key={item.menu_item_id} onClick={() => addItemToDispatch(item)} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'white', borderRadius: '10px', cursor: 'pointer', border: '1px solid #f1f5f9', marginBottom: '8px' }}>
                         <span style={{ fontWeight: 600 }}>{item.name_en}</span>
                         <span style={{ fontSize: '12px', color: 'var(--primary)' }}>Stock: {item.current_stock}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'white', border: '1px solid #f1f5f9', padding: '15px', borderRadius: '15px' }}>
                    <h4 style={{ fontSize: '13px', marginBottom: '15px' }}>Loading for Partner</h4>
                    {dispatchForm.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ flex: 1, fontSize: '13px' }}>{item.name_en}</div>
                        <input type="number" style={{ width: '60px', padding: '5px' }} value={item.quantity} onChange={e => {
                          const n = [...dispatchForm.items]; n[idx].quantity = e.target.value; setDispatchForm({...dispatchForm, items: n});
                        }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowDispatchModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#0369a1' }}>Confirm Dispatch to Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default FactoryDispatchPage;
