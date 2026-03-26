import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Phone, 
  Mail, 
  User,
  X,
  Search
} from 'lucide-react';
import './InventoryPage.css'; // Reuse common themes

interface Vendor {
  vendor_id: number;
  name_en: string;
  name_ar: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  status: 'active' | 'inactive';
}

const VendorsPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    status: 'active'
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/vendors');
      if (response.data.success) {
        setVendors(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await api.put(`/vendors/${editingVendor.vendor_id}`, formData);
      } else {
        await api.post('/vendors', formData);
      }
      setIsModalOpen(false);
      setEditingVendor(null);
      resetForm();
      fetchVendors();
    } catch (error) {
      alert('Action failed.');
    }
  };

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_ar: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      status: 'active'
    });
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name_en: vendor.name_en,
      name_ar: vendor.name_ar || '',
      contact_person: vendor.contact_person || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      address: vendor.address || '',
      status: vendor.status
    });
    setIsModalOpen(true);
  };

  const filteredVendors = vendors.filter(v => 
    v.name_en.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.phone?.includes(searchTerm)
  );

  return (
    <Layout title="Vendor & Supplier Management">
      <div className="inventory-container">
        <div className="inventory-actions">
          <div className="search-group">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search suppliers by name or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-add" onClick={() => { setEditingVendor(null); resetForm(); setIsModalOpen(true); }}>
            <Plus size={18} />
            Add New Vendor
          </button>
        </div>

        <div className="stock-table-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Vendor Details</th>
                  <th>Contact Info</th>
                  <th>Contact Person</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-5">Loading vendors...</td></tr>
                ) : filteredVendors.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-5">No vendors found.</td></tr>
                ) : filteredVendors.map(vendor => (
                  <tr key={vendor.vendor_id}>
                    <td>
                      <div className="item-info">
                        <strong>{vendor.name_en}</strong>
                        <span>{vendor.name_ar || vendor.name_en}</span>
                      </div>
                    </td>
                    <td>
                      <div className="vendor-links" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <span style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem'}}><Phone size={14} /> {vendor.phone || 'N/A'}</span>
                        <span style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem'}}><Mail size={14} /> {vendor.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                       <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><User size={14} /> {vendor.contact_person || 'N/A'}</span>
                    </td>
                    <td><span className={`status-badge ${vendor.status === 'active' ? 'healthy' : ''}`}>{vendor.status}</span></td>
                    <td className="text-right">
                      <div className="row-actions">
                        <button className="btn-icon-sm" onClick={() => handleEdit(vendor)}><Edit3 size={16} /></button>
                        <button className="btn-icon-sm" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxHeight: '90vh', overflowY: 'auto'}}>
            <div className="modal-header">
              <h3>{editingVendor ? 'Edit Vendor' : 'Register New Vendor'}</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Vendor Name In English *</label>
                  <input type="text" required value={formData.name_en} onChange={(e) => setFormData({...formData, name_en: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>اسم المورد بالعربي</label>
                  <input type="text" dir="rtl" value={formData.name_ar} onChange={(e) => setFormData({...formData, name_ar: e.target.value})} />
                </div>
              </div>
              <div className="form-grid">
                 <div className="form-group">
                   <label>Contact Person</label>
                   <input type="text" value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} />
                 </div>
                 <div className="form-group">
                   <label>Phone Number *</label>
                   <input type="text" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                 </div>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Physical Address</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="modal-footer" style={{padding: '1.5rem 0 0'}}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default VendorsPage;
