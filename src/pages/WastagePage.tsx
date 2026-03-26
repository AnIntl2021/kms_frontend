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
  const [records, setRecords] = useState<WastageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    inventory_item_id: '',
    quantity: '',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    fetchWastage();
    fetchInventory();
  }, []);

  const fetchWastage = async () => {
    setLoading(true);
    try {
      const response = await api.get('/wastage');
      if (response.data.success) {
        setRecords(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch wastage from API:', error);
      setRecords([]);
    } finally {
      setLoading(false);
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
      await api.post('/wastage', formData);
      setIsModalOpen(false);
      fetchWastage();
      setFormData({ inventory_item_id: '', quantity: '', reason: '', notes: '' });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Report submission failed.');
    }
  };

  const filteredRecords = records.filter(r => 
    r.item_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalValue: records.reduce((acc, curr) => acc + curr.total_wasted_value, 0),
    count: records.length,
    highReason: 'Expired', // Just static analysis for now
    todayValue: records.filter(r => r.date === '2026-03-26').reduce((acc, curr) => acc + curr.total_wasted_value, 0)
  };

  return (
    <Layout title="Wastage & Spoilage Tracking">
      <div className="inventory-container">
        
        {/* Performance Metrics Section */}
        <div className="inventory-metrics">
          <div className="metric-card">
            <div className="metric-icon bg-red" style={{ background: '#fee2e2', color: '#dc2626' }}><Trash2 size={24} /></div>
            <div className="metric-details">
              <span>Today's Loss</span>
              <h3>{stats.todayValue.toFixed(3)} KWD</h3>
              <p className="trend critical"><AlertTriangle size={12} /> Needs monitoring</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-orange" style={{ background: '#ffedd5', color: '#ea580c' }}><BarChart size={24} /></div>
            <div className="metric-details">
              <span>Total Month Loss</span>
              <h3>{stats.totalValue.toFixed(3)} KWD</h3>
              <p className="trend warning"><TrendingUp size={12} /> +2% vs Feb</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-blue" style={{ background: '#eff6ff', color: '#2563eb' }}><Package size={24} /></div>
            <div className="metric-details">
              <span>Wastage Events</span>
              <h3>{stats.count}</h3>
              <p className="trend neutral">System logs</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-purple" style={{ background: '#f5f3ff', color: '#7c3aed' }}><AlertTriangle size={24} /></div>
            <div className="metric-details">
              <span>Primary Reason</span>
              <h3>{stats.highReason}</h3>
              <p className="trend warning">Operational focus</p>
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="inventory-actions">
          <div className="search-group">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by SKU, Product Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="action-buttons">
            <button className="btn-filter"><Filter size={18} /> Reason Filter</button>
            <button className="btn-add" onClick={() => setIsModalOpen(true)} style={{ background: '#dc2626', borderColor: '#dc2626' }}>
              <Trash2 size={18} /> REPORT WASTAGE
            </button>
          </div>
        </div>

        {/* Records Table */}
        <div className="stock-table-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product Information</th>
                  <th>Reason</th>
                  <th>Quantity / Unit</th>
                  <th>Loss Value</th>
                  <th>Date Recorded</th>
                  <th>Reported By</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-5">Syncing wastage logs...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-5">No wastage records found. Good job!</td></tr>
                ) : filteredRecords.map(record => (
                  <tr key={record.wastage_id}>
                    <td>
                      <div className="item-info">
                        <strong>{record.item_name}</strong>
                        <span className="sku-badge" style={{ fontSize: '10px' }}>{record.sku}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: record.reason === 'Expired' ? '#dc2626' : '#f59e0b' }}></div>
                        <span style={{ fontWeight: 600, color: '#475569' }}>{record.reason}</span>
                      </div>
                    </td>
                    <td>
                      <strong>{record.quantity} {record.unit}</strong>
                    </td>
                    <td>
                      <strong style={{ color: '#dc2626' }}>{record.total_wasted_value.toFixed(3)} KWD</strong>
                    </td>
                    <td>{record.date}</td>
                    <td>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>{record.reporter}</span>
                    </td>
                    <td className="text-right">
                       <button className="btn-icon-sm" title="View Audit Trail"><FileText size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Showing {filteredRecords.length} records in this fiscal period.</span>
            <button className="btn-icon-sm" style={{ padding: '0.5rem 1.5rem', width: 'auto', borderRadius: '10px' }}>
              Load More <ChevronRight size={14} />
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
                <h3 style={{ color: '#991b1b', margin: 0 }}>Report Product Loss</h3>
              </div>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '2rem' }}>
               <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                 <label style={{ fontWeight: 700, fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>SELECT DAMAGED ITEM *</label>
                 <select 
                    style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', width: '100%', fontSize: '15px' }}
                    required 
                    value={formData.inventory_item_id} 
                    onChange={(e) => setFormData({...formData, inventory_item_id: e.target.value})}
                  >
                    <option value="">-- Choose Stock Item --</option>
                    {inventoryItems.map(item => (
                      <option key={item.inventory_item_id} value={item.inventory_item_id}>
                        {item.name_en} ({item.sku}) - {item.current_stock} {item.unit_en} available
                      </option>
                    ))}
                 </select>
               </div>

               <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                 <div className="form-group">
                    <label style={{ fontWeight: 700, fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>QUANTITY WASTED *</label>
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
                    <label style={{ fontWeight: 700, fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>REASON *</label>
                    <select 
                      style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', width: '100%' }}
                      required 
                      value={formData.reason} 
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    >
                      <option value="">-- Select Reason --</option>
                      <option value="Expired">Expired (Spoilage)</option>
                      <option value="Damaged">Damaged / Dropped</option>
                      <option value="Spilled">Kitchen Spill</option>
                      <option value="Defected">Defected Batch</option>
                      <option value="Sample">Operational Sample</option>
                    </select>
                 </div>
               </div>

               <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label style={{ fontWeight: 700, fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>INTERNAL AUDIT NOTES</label>
                  <textarea 
                    rows={3} 
                    style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '14px', width: '100%', resize: 'none' }}
                    placeholder="Provide details for management audit..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
               </div>

               <div className="modal-footer" style={{ borderTop: 'none', padding: 0 }}>
                 <button type="button" className="btn-secondary" style={{ flex: 1, padding: '1rem', borderRadius: '14px' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                 <button type="submit" className="btn-primary" style={{ flex: 2, padding: '1rem', borderRadius: '14px', background: '#dc2626', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)' }}>
                    Record Waste Transfer
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
