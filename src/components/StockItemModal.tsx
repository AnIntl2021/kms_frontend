import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2, Package as PackageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';

interface Category {
  category_id: number;
  name_en: string;
}

interface PackageItem {
  id?: number;
  name_en: string;
  multiplier: number;
  is_base: boolean;
}

interface StockItemModalProps {
  isOpen: boolean;
  item?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const UNIT_OPTIONS = ['Piece', 'Kg', 'Gram', 'Liter', 'ML', 'Box', 'Pouch', 'Bottle', 'Carton', 'Packet'];
const StockItemModal = ({ isOpen, item, onClose, onSuccess }: StockItemModalProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    sku: '',
    category_id: '',
    current_stock: '',
    min_stock_level: '5.0',
    unit_en: '',
    unit_ar: '',
    cost_price: ''
  });

  const [packages, setPackages] = useState<PackageItem[]>([
    { name_en: 'Piece', multiplier: 1, is_base: true }
  ]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (item) {
        setFormData({
          name_en: item.name_en || '',
          name_ar: item.name_ar || '',
          sku: item.sku || '',
          category_id: item.category_id || '',
          current_stock: item.current_stock || '',
          min_stock_level: item.min_stock_level || '5.0',
          unit_en: item.unit_en || '',
          unit_ar: item.unit_ar || '',
          cost_price: item.cost_price || ''
        });
        fetchItemPackages(item.inventory_item_id);
      } else {
        setFormData({
          name_en: '',
          name_ar: '',
          sku: '',
          category_id: '',
          current_stock: '',
          min_stock_level: '5.0',
          unit_en: '',
          unit_ar: '',
          cost_price: ''
        });
        setPackages([{ name_en: 'Piece', multiplier: 1, is_base: true }]);
      }
    }
  }, [isOpen, item]);

  const fetchItemPackages = async (itemId: number) => {
    try {
      const res = await api.get(`/inventory/packages?inventory_item_id=${itemId}`);
      if (res.data.success && res.data.data.length > 0) {
        setPackages(res.data.data.map((p: any) => ({
          id: p.package_id,
          name_en: p.name_en,
          multiplier: Number(p.multiplier),
          is_base: Number(p.multiplier) === 1
        })));
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/business/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const addPackage = () => {
    setPackages([...packages, { name_en: '', multiplier: 1, is_base: false }]);
  };

  const removePackage = (index: number) => {
    if (packages[index].is_base) return;
    setPackages(packages.filter((_, i) => i !== index));
  };

  const updatePackage = (index: number, field: keyof PackageItem, value: any) => {
    const newPkgs = [...packages];
    (newPkgs[index] as any)[field] = value;
    setPackages(newPkgs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Sync unit_en from the first package
      const baseUnitName = packages[0]?.name_en || 'Piece';
      const payload = { 
        ...formData, 
        cost_price: formData.cost_price || 0, // 🛡️ Safety Default
        unit_en: baseUnitName, 
        unit_ar: baseUnitName, 
        packages 
      };
      
      const response = item 
        ? await api.put(`/inventory/${item.inventory_item_id}`, payload)
        : await api.post('/inventory', payload);

      if (response.data.success) {
        onSuccess();
        onClose();
        toast.success(item ? 'Stock Item Updated! 📦' : 'New Stock Item Registered! ✅');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save stock item details.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
        <header className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: '#01562c', color: 'white', borderRadius: '8px', display: 'flex' }}>
              <PackageIcon size={20} />
            </div>
            <h3>{item ? 'Edit Stock Item' : 'Add New Stock Item'}</h3>
          </div>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </header>
        
        <form onSubmit={handleSubmit} className="modal-body">
          
          {/* Main Info Section */}
          <div className="form-section" style={{ marginTop: 0, paddingTop: 0, border: 'none' }}>
            <div className="form-grid">
              <div className="form-group">
                <label>Item Name In English *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name_en}
                  onChange={(e) => setFormData({...formData, name_en: e.target.value})}
                  placeholder="e.g. Arabica Coffee"
                />
              </div>
              <div className="form-group">
                <label style={{ textAlign: 'right' }}>اسم الصنف بالعربي *</label>
                <input 
                  type="text" 
                  required 
                  style={{ textAlign: 'right' }}
                  value={formData.name_ar}
                  onChange={(e) => setFormData({...formData, name_ar: e.target.value})}
                  placeholder="مثال: قهوة عربية"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>SKU / BARCODE *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>CATEGORY *</label>
                <select 
                  required 
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.name_en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>INITIAL STOCK ({packages[0]?.name_en || '...' })</label>
                <input 
                  type="number" 
                  step="0.001"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({...formData, current_stock: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>MIN ALERT LEVEL ({packages[0]?.name_en || '...' })</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData({...formData, min_stock_level: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Package Management Section */}
          <div className="form-section">
            <div className="pkg-header">
              <h4>Packaging & Unit Conversions</h4>
              <button type="button" onClick={addPackage} className="btn-add-pkg">
                <Plus size={14} /> Add New Package
              </button>
            </div>

            <div className="pkg-table-wrapper">
              <table className="pkg-table">
                <thead>
                  <tr>
                    <th>Base Unit</th>
                    <th>Rate</th>
                    <th>Conv. Unit</th>
                    <th>Details</th>
                    <th>Package Name</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg, idx) => (
                    <tr key={idx} style={pkg.is_base ? { background: 'rgba(1, 86, 44, 0.05)' } : {}}>
                      <td style={{ width: '15%' }}>
                        <select disabled={true}>
                          <option>{packages[0].name_en}</option>
                        </select>
                      </td>
                      <td style={{ width: '15%' }}>
                        <input 
                          type="number" 
                          step="0.001"
                          disabled={pkg.is_base}
                          value={pkg.multiplier} 
                          onChange={(e) => updatePackage(idx, 'multiplier', Number(e.target.value))}
                        />
                      </td>
                      <td style={{ width: '15%', color: '#64748b', fontWeight: 600 }}>
                        {packages[0].name_en}
                      </td>
                      <td className="pkg-detail-text">
                        {pkg.is_base ? (
                          <span style={{ color: '#01562c', fontWeight: 800 }}>PRIMARY BASE UNIT</span>
                        ) : (
                          `1 ${pkg.name_en || '...'} = ${pkg.multiplier} ${packages[0].name_en}`
                        )}
                      </td>
                      <td>
                        {pkg.is_base ? (
                           <select 
                             style={{ color: '#01562c', fontWeight: 800, border: '1px solid #01562c' }}
                             value={pkg.name_en}
                             onChange={(e) => updatePackage(idx, 'name_en', e.target.value)}
                           >
                             {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                           </select>
                        ) : (
                          <input 
                            type="text" 
                            style={{ color: '#01562c', fontWeight: 800 }}
                            placeholder="Package (e.g. Box)"
                            value={pkg.name_en} 
                            onChange={(e) => updatePackage(idx, 'name_en', e.target.value)}
                          />
                        )}
                      </td>
                      <td className="text-center">
                        {!pkg.is_base ? (
                          <button type="button" onClick={() => removePackage(idx)} className="btn-remove-pkg">
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <span className="base-badge">SMALLEST UNIT</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <footer className="footer-actions">
            <button type="button" className="btn-large-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-large-save">
              {submitting ? <Loader2 className="animate-spin" size={18} /> : (
                <>Save Item</>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default StockItemModal;
