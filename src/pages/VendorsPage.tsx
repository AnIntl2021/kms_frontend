import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { 
  Store, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Edit3, 
  Trash2,
  X
} from 'lucide-react';
import './InventoryPage.css'; 
import Swal from 'sweetalert2';

interface Vendor {
  vendor_id: number;
  name_en: string;
  name_ar: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  type: 'supplier' | 'client';
  status: 'active' | 'inactive';
}

const VendorsPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    type: 'supplier',
    status: 'active'
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vendors');
      setVendors(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (v: Vendor) => {
    setEditingVendor(v);
    setFormData({
      name_en: v.name_en,
      name_ar: v.name_ar,
      contact_person: v.contact_person,
      email: v.email,
      phone: v.phone,
      address: v.address,
      type: v.type,
      status: v.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: 'Remove Partner?',
      text: 'Are you sure you want to remove this vendor/client?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444'
    });
    if (confirm.isConfirmed) {
      try {
        await api.delete(`/vendors/${id}`);
        Swal.fire('Removed', 'Partner has been removed', 'success');
        fetchVendors();
      } catch (e) {
        Swal.fire('Error', 'Failed to remove partner', 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await api.put(`/vendors/${editingVendor.vendor_id}`, formData);
        Swal.fire('Success', 'Partner updated successfully', 'success');
      } else {
        await api.post('/vendors', formData);
        Swal.fire('Success', 'Partner registered successfully', 'success');
      }
      setShowModal(false);
      setEditingVendor(null);
      setFormData({ name_en: '', name_ar: '', contact_person: '', email: '', phone: '', address: '', type: 'supplier', status: 'active' });
      fetchVendors();
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Failed to save', 'error');
    }
  };

  const filtered = vendors.filter(v => v.name_en.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Layout title="Vendors & Distribution Clients">
      <div className="inventory-container">
        <div className="inventory-actions">
           <div className="search-group">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Search suppliers or clients..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
           </div>
           <button className="btn-add" onClick={() => setShowModal(true)}>
             <Plus size={18} /> Add New Partner
           </button>
        </div>

        <div className="stock-table-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Partner Name</th>
                  <th>Contact Details</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-5">Loading records...</td></tr>
                ) : filtered.map(v => (
                  <tr key={v.vendor_id}>
                    <td>
                      <div className="item-info">
                        <strong>{v.name_en}</strong>
                        <span style={{ fontSize: '12px' }}>{v.name_ar}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Mail size={12}/> {v.email}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Phone size={12}/> {v.phone}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        background: v.type === 'client' ? '#f0fdf4' : '#eff6ff', 
                        color: v.type === 'client' ? '#166534' : '#1e40af',
                        padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800
                      }}>
                        {v.type?.toUpperCase()}
                      </span>
                    </td>
                    <td><span className={`status-badge ${v.status === 'active' ? 'healthy' : 'low'}`}>{v.status}</span></td>
                    <td className="text-right">
                       <div className="row-actions">
                          <button className="btn-icon-sm" onClick={() => handleEdit(v)} style={{color: 'var(--primary)'}}><Edit3 size={16}/></button>
                          <button className="btn-icon-sm" onClick={() => handleDelete(v.vendor_id)} style={{color: '#ef4444'}}><Trash2 size={16}/></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3><Store size={22} style={{ color: 'var(--primary)', marginRight: '10px' }} /> {editingVendor ? 'Update Partner' : 'Register Partner'}</h3>
              <button className="btn-close" onClick={() => { setShowModal(false); setEditingVendor(null); setFormData({ name_en: '', name_ar: '', contact_person: '', email: '', phone: '', address: '', type: 'supplier', status: 'active' }); }}><X /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name (English)</label>
                    <input type="text" required value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Name (Arabic)</label>
                    <input type="text" dir="rtl" value={formData.name_ar} onChange={e => setFormData({...formData, name_ar: e.target.value})} />
                  </div>
                </div>
                <div className="form-grid">
                   <div className="form-group">
                      <label>Partner Type</label>
                      <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} required>
                        <option value="supplier">Supplier (Inbound Goods)</option>
                        <option value="client">Distribution Client (Outbound Sales)</option>
                      </select>
                   </div>
                   <div className="form-group">
                      <label>Contact Person</label>
                      <input type="text" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
                   </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Partner</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default VendorsPage;
