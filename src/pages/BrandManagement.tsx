import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../hooks/useLanguage';
import { FolderTree, Plus, Edit2, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './BranchManagement.css'; // Re-use the existing high-quality branch management styles

interface Brand {
  brand_id: number;
  name_en: string;
  name_ar: string;
  status: 'active' | 'inactive';
}

const BrandManagement: React.FC = () => {
  const { t } = useLanguage();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    status: 'active'
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const res = await api.get('/brands');
      if (res.data.success) {
        setBrands(res.data.data);
      }
    } catch (e: any) {
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingBrand(null);
    setFormData({ name_en: '', name_ar: '', status: 'active' });
    setIsModalOpen(true);
  };

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name_en: brand.name_en,
      name_ar: brand.name_ar,
      status: brand.status
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBrand) {
        await api.put(`/brands/${editingBrand.brand_id}`, formData);
        toast.success('Brand updated successfully');
      } else {
        await api.post('/brands', formData);
        toast.success('Brand created successfully');
      }
      closeModal();
      fetchBrands();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error saving brand');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this brand? This will not delete branches, but they may lose their brand associations.')) {
      try {
        await api.delete(`/brands/${id}`);
        toast.success('Brand deleted successfully');
        fetchBrands();
      } catch (e: any) {
        toast.error('Error deleting brand');
      }
    }
  };

  return (
    <Layout title="Brand Management">
      <div className="branch-management-container fade-in">
        <div className="page-header">
          <FolderTree size={32} />
          <h1>Brand Management</h1>
        </div>

        <div className="premium-card">
          <div className="branches-header">
            <div>
              <h2>Your Brands</h2>
              <p>Create and manage parent brands/franchises (e.g. KFC, Hardees).</p>
            </div>
            <button className="btn-primary" onClick={openAddModal}>
              <Plus size={18} style={{marginRight: '8px'}} /> Add New Brand
            </button>
          </div>
          
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading brands...</div>
          ) : brands.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No brands found. Add one to get started!</div>
          ) : (
            <div className="branches-grid">
              {brands.map(brand => (
                <div key={brand.brand_id} className="premium-card branch-card">
                  <div className={`branch-status ${brand.status === 'active' ? 'active' : 'expired'}`}>
                    {brand.status === 'active' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    {brand.status === 'active' ? 'Active' : 'Inactive'}
                  </div>
                  <h3>{brand.name_en}</h3>
                  <p className="branch-location">{brand.name_ar}</p>
                  
                  <div className="branch-actions">
                    <button className="btn-edit" onClick={() => openEditModal(brand)}>
                      <Edit2 size={14} style={{marginRight: '4px'}} /> Edit
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(brand.brand_id)}>
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
            <h2>{editingBrand ? 'Edit Brand' : 'Add New Brand'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Brand Name (English) *</label>
                <input required type="text" value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} placeholder="e.g. KFC" />
              </div>
              <div className="form-group">
                <label>Brand Name (Arabic) *</label>
                <input required type="text" value={formData.name_ar} onChange={e => setFormData({...formData, name_ar: e.target.value})} placeholder="كي إف سي" />
              </div>
              {editingBrand && (
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
                <button type="submit" className="btn-primary">Save Brand</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default BrandManagement;
