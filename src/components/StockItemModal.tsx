import FoodLoader from './FoodLoader';
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
  parent_idx?: number;
  parent_name?: string;
  temp_id?: string;
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

  const calculateChainedMultiplier = (pkg: PackageItem) => {
    let totalDivider = 1;
    let current: PackageItem | undefined = pkg;
    let safety = 0;
    while (current && !current.is_base && safety < 10) {
      totalDivider *= Number(current.multiplier || 1);
      const parentIdx: number = current.parent_idx || 0;
      current = packages[parentIdx];
      safety++;
    }
    return totalDivider;
  };

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
      if (res.data.success) {
        const dbPackages = res.data.data;
        
        // 🛡️ RECONSTRUCT THE TOP-DOWN LOGIC
        // 1. Find the Main Unit (the one in item.unit_en or multiplier 1)
        const mainUnit = {
          name_en: item?.unit_en || 'Packet',
          multiplier: 1,
          is_base: true,
          temp_id: 'base'
        };

        // 2. Map sub-units from DB
        const rawSubUnits = dbPackages
          .filter((p: any) => Number(p.multiplier) < 1)
          .map((p: any) => ({
            id: p.package_id,
            name_en: p.name_en,
            multiplier: Number(p.multiplier), // This is the fractional multiplier from DB
            is_base: false,
            parent_name: p.parent_name
          }));

        // 3. Reconstruct the list and relationships
        const reconstructedPackages: PackageItem[] = [mainUnit];
        
        // We need to process them in an order that ensures parents are added before children
        // But since we are using names, we can just add them and then resolve indices
        rawSubUnits.forEach((su: any) => {
           reconstructedPackages.push({
              ...su,
              multiplier: 1 // placeholder
           });
        });

        // Resolve indices and multipliers
        reconstructedPackages.forEach((pkg, idx) => {
           if (pkg.is_base) return;
           
           const su = rawSubUnits.find((s: any) => s.id === pkg.id);
           if (!su) return;

           // Find parent index
           const parentIdx = reconstructedPackages.findIndex(p => p.name_en === su.parent_name);
           pkg.parent_idx = parentIdx !== -1 ? parentIdx : 0;

           // Calculate relative multiplier
           // DB multiplier = 1 / (ParentMultiplierChain * RelativeMultiplier)
           // So RelativeMultiplier = 1 / (DB multiplier * ParentMultiplierChain)
           // Wait, simpler: RelativeMultiplier = (1 / DB multiplier) / ParentChainedDivider
           
           // We need to do this carefully. 
           // Let's just use the fact that we know the total divider = 1 / DB multiplier
        });
        
        // Final pass for multipliers
        reconstructedPackages.forEach((pkg, idx) => {
           if (pkg.is_base) return;
           const su = rawSubUnits.find((s: any) => s.id === pkg.id);
           const totalDivider = 1 / (su?.multiplier || 1);
           
           // parent divider
           let parentDivider = 1;
           let currParentIdx = pkg.parent_idx || 0;
           let safety = 0;
           // This is tricky because the parent's relative multiplier might not be set yet.
           // BUT, we can calculate the parent's total divider directly from rawSubUnits if it's a sub-unit
           const parentPkg = reconstructedPackages[currParentIdx];
           if (!parentPkg.is_base) {
              const pSu = rawSubUnits.find((s: any) => s.name_en === parentPkg.name_en);
              parentDivider = 1 / (pSu?.multiplier || 1);
           }
           
           pkg.multiplier = Math.round((totalDivider / parentDivider) * 10000) / 10000;
        });

        setPackages(reconstructedPackages);
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
      const baseUnitName = packages[0]?.name_en || 'Piece';
      const payload = { 
        ...formData, 
        unit_en: baseUnitName, 
        unit_ar: baseUnitName,
        packages: packages.filter(p => !p.is_base).map((p, idx) => {
          const totalDivider = calculateChainedMultiplier(p);
          const parentPkg = packages[p.parent_idx || 0];
          
          return {
            ...p,
            multiplier: 1 / totalDivider,
            parent_name: parentPkg?.name_en
          };
        })
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
                <label>COST PRICE *</label>
                <input 
                  type="number" 
                  step="0.001"
                  required
                  value={formData.cost_price}
                  onChange={(e) => setFormData({...formData, cost_price: e.target.value})}
                  placeholder="0.000"
                />
                {packages.filter(p => !p.is_base).map(p => (
                   <div key={p.temp_id || p.id} style={{ fontSize: '11px', color: '#01562c', fontWeight: 800, marginTop: '6px', background: '#f0fdf4', padding: '4px 8px', borderRadius: '6px', border: '1px solid #dcfce7' }}>
                      {(() => {
                         const totalDivider = calculateChainedMultiplier(p);
                         const subPrice = (Number(formData.cost_price) / totalDivider).toFixed(3);
                         return (
                            <span>
                               Result: 1 {p.name_en || 'Sub-unit'} = {subPrice} KD
                            </span>
                         );
                      })()}
                   </div>
                ))}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>INITIAL STOCK (In {packages[0]?.name_en || 'Piece'}) *</label>
                <input 
                  type="number" 
                  step="0.001"
                  required
                  value={formData.current_stock}
                  onChange={(e) => setFormData({...formData, current_stock: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>MIN ALERT LEVEL ({packages[0]?.name_en || 'Piece'}) *</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
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
                    <th>Unit Name</th>
                    <th>Relationship</th>
                    <th>Resulting Unit Price</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg, index) => (
                    <tr key={pkg.temp_id || pkg.id || index} style={pkg.is_base ? { background: 'rgba(1, 86, 44, 0.05)' } : {}}>
                      <td style={{ width: '25%' }}>
                        {pkg.is_base ? (
                           <select 
                             style={{ fontWeight: 800, color: '#01562c', border: '1px solid #cbd5e1', padding: '4px', borderRadius: '6px' }}
                             value={pkg.name_en}
                             onChange={(e) => updatePackage(index, 'name_en', e.target.value)}
                           >
                             {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                           </select>
                        ) : (
                          <input 
                            type="text" 
                            className="pkg-input"
                            value={pkg.name_en}
                            onChange={(e) => updatePackage(index, 'name_en', e.target.value)}
                            placeholder="e.g. gram"
                          />
                        )}
                      </td>
                      <td>
                        {!pkg.is_base ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>1</span>
                            <select 
                              style={{ 
                                padding: '6px 10px', 
                                borderRadius: '8px', 
                                border: '2px solid var(--primary)', 
                                background: '#fff',
                                color: 'var(--primary)',
                                fontSize: '12px', 
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                              value={pkg.parent_idx || 0}
                              onChange={(e) => updatePackage(index, 'parent_idx', Number(e.target.value))}
                            >
                               {packages.slice(0, index).map((p, i) => (
                                  <option key={i} value={i}>{p.name_en}</option>
                               ))}
                            </select>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>=</span>
                            <input 
                              type="number" 
                              step="any"
                              className="pkg-input"
                              style={{ width: '80px', fontWeight: 800 }}
                              value={pkg.multiplier}
                              onChange={(e) => updatePackage(index, 'multiplier', e.target.value)}
                            />
                            <span style={{ fontSize: '12px', color: '#64748b' }}>{pkg.name_en || '...'}s</span>
                          </div>
                        ) : (
                          <span style={{ color: '#01562c', fontWeight: 800, fontSize: '12px' }}>MAIN PRICING UNIT</span>
                        )}
                      </td>
                      <td>
                         {(() => {
                            if (pkg.is_base) return null;
                            if (!formData.cost_price) return null;
                            const totalDivider = calculateChainedMultiplier(pkg);
                             
                             return (
                                <div style={{ fontSize: '12px', color: '#01562c', fontWeight: 800 }}>
                                   {(Number(formData.cost_price) / totalDivider).toFixed(3)} KD / {pkg.name_en}
                                </div>
                             );
                         })()}
                      </td>
                      <td className="text-center">
                        {!pkg.is_base && (
                          <button type="button" onClick={() => removePackage(index)} className="btn-remove-pkg">
                            <Trash2 size={16} />
                          </button>
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
              {submitting ? <FoodLoader size="icon" /> : (
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
