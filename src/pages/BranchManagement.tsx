import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../hooks/useLanguage';
import { Store, Plus, Edit2, Trash2, CheckCircle, AlertTriangle, FolderTree } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './BranchManagement.css';

interface Brand {
  brand_id: number;
  name_en: string;
  name_ar: string;
}

interface Branch {
  branch_id: number;
  brand_id?: number | null;
  brand_name?: string;
  name_en: string;
  name_ar: string;
  location_en?: string;
  location_ar?: string;
  phone?: string;
  status: 'active' | 'inactive';
}

const BranchManagement: React.FC = () => {
  const { t } = useLanguage();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    location_en: '',
    location_ar: '',
    phone: '',
    status: 'active',
    brand_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [branchRes, brandRes] = await Promise.all([
        api.get('/branches'),
        api.get('/brands')
      ]);
      
      const loadedBrands = brandRes.data.success ? brandRes.data.data : [];
      setBrands(loadedBrands);

      if (branchRes.data.success) {
        const loadedBranches = branchRes.data.data.map((branch: any) => {
          const matchedBrand = loadedBrands.find((b: any) => b.brand_id === branch.brand_id);
          return {
            ...branch,
            brand_name: matchedBrand ? matchedBrand.name_en : ''
          };
        });
        setBranches(loadedBranches);
      }
    } catch (e: any) {
      toast.error('Failed to load branches or brands');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    const cachedSettings = localStorage.getItem('tenantSettings');
    const tenantSettings = cachedSettings ? JSON.parse(cachedSettings) : {};
    const plan = tenantSettings.subscription_plan || 'Basic';
    const limit = plan === 'Enterprise' ? Infinity : (plan === 'Pro' ? 3 : 1);

    if (branches.length >= limit) {
      toast.warning(`Branch Limit Reached: Your current '${plan}' plan supports a maximum of ${limit} branch(es). Please contact the administrator or upgrade your subscription plan to add more branches.`);
      return;
    }

    setEditingBranch(null);
    setFormData({ name_en: '', name_ar: '', location_en: '', location_ar: '', phone: '', status: 'active', brand_id: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name_en: branch.name_en,
      name_ar: branch.name_ar,
      location_en: branch.location_en || '',
      location_ar: branch.location_ar || '',
      phone: branch.phone || '',
      status: branch.status,
      brand_id: branch.brand_id ? String(branch.brand_id) : ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      brand_id: formData.brand_id ? Number(formData.brand_id) : null
    };

    try {
      if (editingBranch) {
        await api.put(`/branches/${editingBranch.branch_id}`, payload);
        toast.success('Branch updated successfully');
      } else {
        await api.post('/branches', payload);
        toast.success('Branch created successfully');
      }
      closeModal();
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error saving branch');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        await api.delete(`/branches/${id}`);
        toast.success('Branch deleted successfully');
        fetchData();
      } catch (e: any) {
        toast.error('Error deleting branch');
      }
    }
  };

  return (
    <Layout title="Branch Management">
      <div className="branch-management-container fade-in">
        <div className="page-header">
          <Store size={32} />
          <h1>Branch Management</h1>
        </div>

        <div className="premium-card">
          <div className="branches-header">
            <div>
              <h2>Your Branches</h2>
              <p>Create and manage your restaurant locations.</p>
            </div>
            <button className="btn-primary" onClick={openAddModal}>
              <Plus size={18} style={{marginRight: '8px'}} /> Add New Branch
            </button>
          </div>
          
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading branches...</div>
          ) : branches.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No branches found. Add one to get started!</div>
          ) : (
            <div className="branches-grid">
              {branches.map(branch => (
                <div key={branch.branch_id} className="premium-card branch-card">
                  <div className={`branch-status ${branch.status === 'active' ? 'active' : 'expired'}`}>
                    {branch.status === 'active' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    {branch.status === 'active' ? 'Active' : 'Inactive'}
                  </div>
                  <h3>{branch.name_en}</h3>
                  {branch.brand_name && (
                    <p className="branch-brand" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                      <FolderTree size={12} /> {branch.brand_name}
                    </p>
                  )}
                  <p className="branch-location">{branch.location_en || 'No location provided'}</p>
                  <p className="branch-phone">📞 {branch.phone || 'N/A'}</p>
                  
                  <div className="branch-actions">
                    <button className="btn-edit" onClick={() => openEditModal(branch)}>
                      <Edit2 size={14} style={{marginRight: '4px'}} /> Edit
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(branch.branch_id)}>
                      <Trash2 size={14} style={{marginRight: '4px'}} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Parent Brand</label>
                <select value={formData.brand_id} onChange={e => setFormData({...formData, brand_id: e.target.value})}>
                  <option value="">No Brand (Independent Branch)</option>
                  {brands.map(b => (
                    <option key={b.brand_id} value={b.brand_id}>{b.name_en}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Branch Name (English) *</label>
                <input required type="text" value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} placeholder="e.g. Salmiya Branch" />
              </div>
              <div className="form-group">
                <label>Branch Name (Arabic) *</label>
                <input required type="text" value={formData.name_ar} onChange={e => setFormData({...formData, name_ar: e.target.value})} placeholder="فرع السالمية" />
              </div>
              <div className="form-group">
                <label>Location / Address (English)</label>
                <input type="text" value={formData.location_en} onChange={e => setFormData({...formData, location_en: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Location / Address (Arabic)</label>
                <input type="text" value={formData.location_ar} onChange={e => setFormData({...formData, location_ar: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              {editingBranch && (
                <div className="form-group">
                  <label>Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary">Save Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default BranchManagement;
