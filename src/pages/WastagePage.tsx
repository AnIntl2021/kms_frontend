import FoodLoader from '../components/FoodLoader';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { 
  AlertTriangle, 
  Trash2, 
  Search, 
  Filter, 
  Package, 
  BarChart,
  ChevronRight,
  TrendingUp,
  X,
  FileText
} from 'lucide-react';
import './InventoryPage.css';
import { toast } from 'react-toastify';
import { useLanguage } from '../hooks/useLanguage';

interface WastageRecord {
  wastage_id: number;
  item_name: string;
  item_name_ar?: string;
  sku: string;
  quantity: number;
  unit: string;
  reason: string;
  cost_at_time: number;
  total_wasted_value: number;
  date: string;
  reporter: string;
}

const WastagePage = () => {
  const { t, language } = useLanguage();
  const [records, setRecords] = useState<WastageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [itemType, setItemType] = useState<'inventory' | 'menu'>('inventory');

  const [formData, setFormData] = useState({
    inventory_item_id: '',
    menu_item_id: '',
    quantity: '',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    fetchWastage();
    fetchInventory();
    fetchMenu();
  }, []);

  const fetchWastage = async () => {
    setLoading(true);
    try {
      const response = await api.get('/wastage');
      if (response.data.success) {
        const rawData = response.data.data || [];
        // Exclude vendor returns as they should only appear in Sales Returns
        const internalWastage = rawData.filter((r: any) => {
          const reasonStr = (r.reason_en || r.reason || '').toLowerCase();
          return !reasonStr.includes('returned from vendor');
        });
        setRecords(internalWastage);
      }
    } catch (error) {
      console.error('Failed to fetch wastage from API:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenu = async () => {
    try {
      const response = await api.get('/menu');
      if (response.data.success) {
        setMenuItems(response.data.data.filter((m: any) => m.type === 'selling'));
      }
    } catch (e) {
      console.error('Failed to fetch menu items for wastage reporting:', e);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory');
      if (response.data.success) {
        setInventoryItems(response.data.data);
      }
    } catch (e) {
      console.error('Failed to fetch inventory for wastage reporting:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/wastage', {
        ...formData,
        inventory_item_id: itemType === 'inventory' ? formData.inventory_item_id : '',
        menu_item_id: itemType === 'menu' ? formData.menu_item_id : '',
        reason_en: formData.reason,
      });
      setIsModalOpen(false);
      fetchWastage();
      setFormData({ inventory_item_id: '', menu_item_id: '', quantity: '', reason: '', notes: '' });
      toast.success(t('wastage_report_success'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Report submission failed.');
    }
  };

  const formatDateForFilter = (dateInput: any) => {
    if (!dateInput) return '';
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  };

  const filteredRecords = records.filter(r => {
    const name = r.item_name || (r as any).item_name_en || (r as any).menu_name_en || (r as any).product_name_en || '';
    const sku = r.sku || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesReason = true;
    if (reasonFilter !== 'all') {
      const recordReason = (r as any).reason_en || r.reason || '';
      matchesReason = recordReason === reasonFilter;
    }

    let matchesDate = true;
    const rDate = formatDateForFilter(r.date || (r as any).created_at);
    if (rDate) {
      if (startDate && rDate < startDate) matchesDate = false;
      if (endDate && rDate > endDate) matchesDate = false;
    }

    return matchesSearch && matchesReason && matchesDate;
  });

  const todayStr = new Date().toLocaleDateString();

  const stats = {
    totalValue: records.reduce((acc, curr) => acc + Number(curr.total_wasted_value || 0), 0),
    count: records.length,
    highReason: 'Expired', // Just static analysis for now
    todayValue: records.filter(r => {
      const recordDateStr = r.date || ((r as any).created_at ? new Date((r as any).created_at).toLocaleDateString() : new Date().toLocaleDateString());
      return recordDateStr === todayStr;
    }).reduce((acc, curr) => acc + Number(curr.total_wasted_value || 0), 0)
  };

  return (
    <Layout title={t('wastage_tracking')}>
      <div className="inventory-container">
        
        {/* Performance Metrics Section */}
        <div className="inventory-metrics">
          <div className="metric-card">
            <div className="metric-icon bg-red" style={{ background: '#fee2e2', color: '#dc2626' }}><Trash2 size={24} /></div>
            <div className="metric-details">
              <span>{t('todays_loss')}</span>
              <h3>{stats.todayValue.toFixed(3)} {t('kd_currency')}</h3>
              <p className="trend critical"><AlertTriangle size={12} /> {t('needs_monitoring')}</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-orange" style={{ background: '#ffedd5', color: '#ea580c' }}><BarChart size={24} /></div>
            <div className="metric-details">
              <span>{t('total_month_loss')}</span>
              <h3>{stats.totalValue.toFixed(3)} {t('kd_currency')}</h3>
              <p className="trend warning"><TrendingUp size={12} /> +2% vs Feb</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-blue" style={{ background: '#eff6ff', color: '#2563eb' }}><Package size={24} /></div>
            <div className="metric-details">
              <span>{t('wastage_events')}</span>
              <h3>{stats.count}</h3>
              <p className="trend neutral">{t('system_logs')}</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-purple" style={{ background: '#f5f3ff', color: '#7c3aed' }}><AlertTriangle size={24} /></div>
            <div className="metric-details">
              <span>{t('primary_reason')}</span>
              <h3>{t(stats.highReason.toLowerCase()) || stats.highReason}</h3>
              <p className="trend warning">{t('operational_focus')}</p>
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="inventory-actions">
          <div className="search-group">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder={t('search_wastage_hint')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="action-buttons" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="date-filter-group" style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '6px 12px' }}>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#475569' }}
              />
              <span style={{ color: '#cbd5e1', margin: '0 8px' }}>→</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#475569' }}
              />
            </div>
            <select 
              className="btn-filter" 
              style={{ padding: '8px 32px 8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 600, color: '#475569', cursor: 'pointer', outline: 'none', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23475569\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
            >
              <option value="all">{t('reason_filter') || 'All Reasons'}</option>
              {Array.from(new Set(records.map(r => (r as any).reason_en || r.reason || ''))).filter(Boolean).map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
            <button className="btn-add" onClick={() => setIsModalOpen(true)} style={{ background: '#dc2626', borderColor: '#dc2626' }}>
              <Trash2 size={18} /> {t('report_wastage')}
            </button>
          </div>
        </div>

        {/* Records Table */}
        <div className="stock-table-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('product_information')}</th>
                  <th>{t('reason')}</th>
                  <th>{t('quantity_unit')}</th>
                  <th>{t('loss_value')}</th>
                  <th>{t('date_recorded')}</th>
                  <th>{t('reported_by')}</th>
                  <th className="text-end">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-5"><FoodLoader size="small" /></td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-5">{t('no_wastage_records')}</td></tr>
                ) : filteredRecords.map(record => (
                  <tr key={record.wastage_id}>
                    <td>
                      <div className="item-info">
                        <strong>{language === 'ar' ? ((record as any).item_name_ar || (record as any).menu_name_ar || (record as any).product_name_ar || record.item_name) : ((record as any).item_name_en || (record as any).menu_name_en || (record as any).product_name_en || record.item_name)}</strong>
                        <span className="sku-badge" style={{ fontSize: '10px' }}>{record.sku || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: (record as any).reason_en === 'Expired' ? '#dc2626' : '#f59e0b' }}></div>
                        <span style={{ fontWeight: 600, color: '#475569' }}>{language === 'ar' ? ((record as any).reason_ar || record.reason) : ((record as any).reason_en || record.reason)}</span>
                      </div>
                    </td>
                    <td>
                      <strong>{record.quantity} {record.unit || 'units'}</strong>
                    </td>
                    <td>
                      <strong style={{ color: '#dc2626' }}>{Number(record.total_wasted_value || 0).toFixed(3)} {t('kd_currency')}</strong>
                    </td>
                    <td>{record.date || ((record as any).created_at ? new Date((record as any).created_at).toLocaleDateString() : new Date().toLocaleDateString())}</td>
                    <td>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>{(record as any).admin_name || record.reporter || 'Admin'}</span>
                    </td>
                    <td className="text-end">
                       <button className="btn-icon-sm" title="View Audit Trail"><FileText size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{t('showing')} {filteredRecords.length} {t('records_in_this_period')}</span>
            <button className="btn-icon-sm" style={{ padding: '0.5rem 1.5rem', width: 'auto', borderRadius: '10px' }}>
              {t('load_more')} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* REPORT WASTAGE MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', borderRadius: '24px' }}>
            <div className="modal-header" style={{ background: '#fef2f2', borderBottom: '1px solid #fee2e2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: '#dc2626', color: 'white', padding: '10px', borderRadius: '12px' }}><Trash2 size={24} /></div>
                <h3 style={{ color: '#991b1b', margin: 0 }}>{t('report_product_loss')}</h3>
              </div>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '2rem' }}>
               <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                 <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input type="radio" checked={itemType === 'inventory'} onChange={() => setItemType('inventory')} />
                      {t('raw_material_inventory')}
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input type="radio" checked={itemType === 'menu'} onChange={() => setItemType('menu')} />
                      {t('finished_product_menu')}
                    </label>
                 </div>
                 <label style={{ fontWeight: 700, fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>{t('select_damaged_item')}</label>
                 {itemType === 'inventory' ? (
                   <select 
                      style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', width: '100%', fontSize: '15px' }}
                      required 
                      value={formData.inventory_item_id} 
                      onChange={(e) => setFormData({...formData, inventory_item_id: e.target.value})}
                    >
                      <option value="">{t('choose_stock_item')}</option>
                      {inventoryItems.map(item => (
                        <option key={item.inventory_item_id} value={item.inventory_item_id}>
                          {item.name_en} ({item.sku}) - {item.current_stock} {item.unit_en} available
                        </option>
                      ))}
                   </select>
                 ) : (
                   <select 
                      style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', width: '100%', fontSize: '15px' }}
                      required 
                      value={formData.menu_item_id} 
                      onChange={(e) => setFormData({...formData, menu_item_id: e.target.value})}
                    >
                      <option value="">{t('choose_menu_item')}</option>
                      {menuItems.map(item => (
                        <option key={item.menu_item_id} value={item.menu_item_id}>
                          {item.name_en} - {item.current_stock} units available
                        </option>
                      ))}
                   </select>
                 )}
               </div>

               <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                 <div className="form-group">
                    <label style={{ fontWeight: 700, fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>{t('quantity_wasted')}</label>
                    <input 
                      type="number" 
                      step="any" 
                      required 
                      style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', width: '100%', fontVariantNumeric: 'tabular-nums' }}
                      value={formData.quantity} 
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      placeholder="0.00"
                    />
                 </div>
                 <div className="form-group">
                    <label style={{ fontWeight: 700, fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>{t('reason_star')}</label>
                    <select 
                      style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', width: '100%' }}
                      required 
                      value={formData.reason} 
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    >
                      <option value="">{t('select_reason')}</option>
                      <option value="Expired">{t('expired_spoilage')}</option>
                      <option value="Damaged">{t('damaged_dropped')}</option>
                      <option value="Spilled">{t('kitchen_spill')}</option>
                      <option value="Defected">{t('defected_batch')}</option>
                      <option value="Sample">{t('operational_sample')}</option>
                    </select>
                 </div>
               </div>

               <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label style={{ fontWeight: 700, fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>{t('internal_audit_notes')}</label>
                  <textarea 
                    rows={3} 
                    style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', width: '100%', resize: 'none' }}
                    placeholder={t('provide_audit_details')}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
               </div>

               <div className="modal-footer" style={{ borderTop: 'none', padding: 0 }}>
                 <button type="button" className="btn-secondary" style={{ flex: 1, padding: '1rem', borderRadius: '14px' }} onClick={() => setIsModalOpen(false)}>{t('cancel')}</button>
                 <button type="submit" className="btn-primary" style={{ flex: 2, padding: '1rem', borderRadius: '14px', background: '#dc2626', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' }}>
                    {t('record_waste_transfer')}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default WastagePage;
