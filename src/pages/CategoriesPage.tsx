import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { 
  FolderTree, 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronRight, 
  X
} from 'lucide-react';
import './InventoryPage.css'; // Reuse table/modal styles
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useLanguage } from '../hooks/useLanguage';

interface Category {
  category_id: number;
  parent_id: number | null;
  name_en: string;
  name_ar: string;
  sort_order: number;
}

const CategoriesPage = () => {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    parent_id: '',
    sort_order: '0'
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/business/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/business/categories/${editingCategory.category_id}`, formData);
      } else {
        await api.post('/business/categories', formData);
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ name_en: '', name_ar: '', parent_id: '', sort_order: '0' });
      fetchCategories();
      toast.success(t('category_updated_success'));
    } catch (error) {
      toast.error('Failed to save category.');
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name_en: cat.name_en,
      name_ar: cat.name_ar,
      parent_id: cat.parent_id?.toString() || '',
      sort_order: cat.sort_order.toString()
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: t('remove_category_q'),
      text: t('remove_category_msg'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444'
    });
    if (confirm.isConfirmed) {
      try {
        await api.delete(`/business/categories/${id}`);
        toast.success(t('category_removed'));
        fetchCategories();
      } catch (error) {
        toast.error('Failed to remove category.');
      }
    }
  };

  // Organize categories into hierarchy
  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: number) => categories.filter(c => c.parent_id === parentId);

  return (
    <Layout title={t('category_management')}>
      <div className="inventory-container">
        <div className="inventory-actions">
          <div className="search-group" style={{visibility: 'hidden'}}></div>
          <button className="btn-add" onClick={() => { setEditingCategory(null); setFormData({name_en: '', name_ar: '', parent_id: '', sort_order: '0'}); setIsModalOpen(true); }}>
            <Plus size={18} />
            {t('create_new_category')}
          </button>
        </div>

        <div className="stock-table-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('category_name')}</th>
                  <th>{t('level')}</th>
                  <th>{t('order')}</th>
                  <th className="text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-5">{t('loading_categories')}</td></tr>
                ) : parentCategories.map(parent => (
                  <React.Fragment key={parent.category_id}>
                    <tr className="parent-row">
                      <td>
                        <div className="item-info">
                          <strong style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <FolderTree size={16} className="text-primary" />
                            {language === 'ar' ? (parent.name_ar || parent.name_en) : parent.name_en}
                          </strong>
                          <span>{parent.name_ar}</span>
                        </div>
                      </td>
                      <td><span className="status-badge healthy">{t('primary')}</span></td>
                      <td>{parent.sort_order}</td>
                      <td className="text-right">
                        <div className="row-actions">
                          <button className="btn-icon-sm" onClick={() => handleEdit(parent)}><Edit3 size={16} /></button>
                          <button className="btn-icon-sm" onClick={() => handleDelete(parent.category_id)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                    {getSubcategories(parent.category_id).map(sub => (
                      <tr key={sub.category_id} className="sub-row">
                        <td style={{paddingLeft: '3rem'}}>
                          <div className="item-info">
                            <strong style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                              <ChevronRight size={14} />
                              {language === 'ar' ? (sub.name_ar || sub.name_en) : sub.name_en}
                            </strong>
                            <span>{sub.name_ar}</span>
                          </div>
                        </td>
                        <td><span className="status-badge" style={{background: '#f1f5f9', color: '#64748b'}}>{t('sub_category')}</span></td>
                        <td>{sub.sort_order}</td>
                        <td className="text-right">
                          <div className="row-actions">
                            <button className="btn-icon-sm" onClick={() => handleEdit(sub)}><Edit3 size={16} /></button>
                            <button className="btn-icon-sm" onClick={() => handleDelete(sub.category_id)}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'}}>
            <div className="modal-header">
              <h3>{editingCategory ? t('edit_category') : t('create_new_category')}</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>{t('parent_category_opt')}</label>
                <select 
                  value={formData.parent_id}
                  onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
                >
                  <option value="">{t('none_top_level')}</option>
                  {parentCategories.filter(p => p.category_id !== editingCategory?.category_id).map(p => (
                    <option key={p.category_id} value={p.category_id}>{language === 'ar' ? (p.name_ar || p.name_en) : p.name_en}</option>
                  ))}
                </select>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('category_name_en_star')}</label>
                  <input type="text" required value={formData.name_en} onChange={(e) => setFormData({...formData, name_en: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>{t('category_name_ar_star')}</label>
                  <input type="text" required dir="rtl" value={formData.name_ar} onChange={(e) => setFormData({...formData, name_ar: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>{t('sort_order')}</label>
                <input type="number" value={formData.sort_order} onChange={(e) => setFormData({...formData, sort_order: e.target.value})} />
              </div>
              <div className="modal-footer" style={{padding: '1.5rem 0 0'}}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</button>
                <button type="submit" className="btn-primary">{t('save_category')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CategoriesPage;

