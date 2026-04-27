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
import { toast } from 'react-toastify';
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
  default_discount: number;
  branches?: any[];
}

const VendorsPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<any>({
    name_en: '',
    name_ar: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    type: 'supplier',
    status: 'active',
    default_discount: 0,
    branches: []
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
      status: v.status,
      default_discount: v.default_discount || 0,
      branches: v.branches || []
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
        toast.success('Partner removed successfully! 🚮');
        fetchVendors();
      } catch (e) {
        toast.error('Failed to remove partner.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await api.put(`/vendors/${editingVendor.vendor_id}`, formData);
        toast.success('Partner Updated Successfully! 🤝');
      } else {
        await api.post('/vendors', formData);
        toast.success('New Partner Registered! 🏢');
      }
      setShowModal(false);
      setEditingVendor(null);
      setFormData({ name_en: '', name_ar: '', contact_person: '', email: '', phone: '', address: '', type: 'supplier', status: 'active', default_discount: 0, branches: [] });
      fetchVendors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save partner data.');
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
                  <th>Default Discount</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-5">Loading records...</td></tr>
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
                    <td>
                      {v.type === 'client' ? (
                        <span style={{ fontWeight: 700, color: '#3b82f6' }}>{v.default_discount || 0}%</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>N/A</span>
                      )}
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
              <button className="btn-close" onClick={() => { setShowModal(false); setEditingVendor(null); setFormData({ name_en: '', name_ar: '', contact_person: '', email: '', phone: '', address: '', type: 'supplier', status: 'active', default_discount: 0, branches: [] }); }}><X /></button>
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
                  {formData.type === 'client' && (
                    <div className="form-group">
                      <label>Default Discount (%)</label>
                      <input 
                        type="number" 
                        value={formData.default_discount} 
                        onChange={e => setFormData({...formData, default_discount: Number(e.target.value)})}
                        placeholder="0"
                        min="0"
                        max="100"
                        style={{ borderColor: 'var(--primary)', fontWeight: 'bold' }}
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>

                {/* 🛡️ ELITE BRANCH SEGREGATION HUB (Hierarchical Distribution) */}
                <div style={{ marginTop: '20px', borderTop: '1px dashed #e2e8f0', paddingTop: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center' }}>
                      <Store size={14} style={{ marginRight: '5px' }} /> Branches & Delivery Locations
                    </h4>
                    <button 
                      type="button" 
                      className="btn-add" 
                      style={{ padding: '4px 10px', fontSize: '11px', background: '#3b82f6' }}
                      onClick={() => setFormData((prev: any) => ({ 
                        ...prev, 
                        branches: [...(prev.branches || []), { name_en: '', address: '', phone: '' }] 
                      }))}
                    >
                      + Add New Branch
                    </button>
                  </div>

                  <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '5px' }}>
                    {(formData.branches || []).map((br: any, idx: number) => (
                      <div key={idx} style={{ 
                        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 30px', gap: '8px', 
                        marginBottom: '8px', padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' 
                      }}>
                        <input 
                          placeholder="Branch Name" 
                          value={br.name_en} 
                          style={{ fontSize: '12px', padding: '6px' }}
                          onChange={(e) => {
                            const newBranches = [...formData.branches];
                            newBranches[idx].name_en = e.target.value;
                            setFormData({...formData, branches: newBranches});
                          }}
                        />
                        <input 
                          placeholder="Address" 
                          value={br.address} 
                          style={{ fontSize: '12px', padding: '6px' }}
                          onChange={(e) => {
                            const newBranches = [...formData.branches];
                            newBranches[idx].address = e.target.value;
                            setFormData({...formData, branches: newBranches});
                          }}
                        />
                        <input 
                          placeholder="Phone" 
                          value={br.phone} 
                          style={{ fontSize: '12px', padding: '6px' }}
                          onChange={(e) => {
                            const newBranches = [...formData.branches];
                            newBranches[idx].phone = e.target.value;
                            setFormData({...formData, branches: newBranches});
                          }}
                        />
                        <button 
                          type="button" 
                          style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}
                          onClick={() => {
                            const newBranches = formData.branches.filter((_: any, i: number) => i !== idx);
                            setFormData({...formData, branches: newBranches});
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {(!formData.branches || formData.branches.length === 0) && (
                      <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', margin: '10px 0' }}>No branches defined yet. Click '+ Add New Branch' to start segregating locations.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); setEditingVendor(null); setFormData({ name_en: '', name_ar: '', contact_person: '', email: '', phone: '', address: '', type: 'supplier', status: 'active', default_discount: 0, branches: [] }); }}>Cancel</button>
                <button type="submit" className="btn-primary">Save Partner & Network</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default VendorsPage;
