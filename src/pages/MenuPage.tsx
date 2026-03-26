import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  X,
  Search,
  Coffee,
  Package,
  Upload,
  Info,
  DollarSign,
  FileText,
  ChefHat,
  TrendingUp,
  Percent
} from 'lucide-react';
import './InventoryPage.css'; // Reuse themes

interface MenuItem {
  menu_item_id: number;
  name_en: string;
  name_ar: string;
  price: number;
  cost_price: number;
  category_name: string;
  category_id: number;
  image_url?: string;
  status: 'available' | 'unavailable';
}

const MenuPage = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'premix'>('menu');
  
  // Data for creation
  const [categories, setCategories] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    category_id: '',
    price: 0,
    cost_price: 0,
    description_en: '',
    description_ar: '',
    ingredients: [] as any[]
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchItems();
    fetchSupportData();
  }, []);

  // AUTO COST CALCULATION
  useEffect(() => {
    let totalCost = 0;
    formData.ingredients.forEach(ing => {
      const invItem = inventoryItems.find(i => String(i.inventory_item_id) === String(ing.inventory_item_id));
      if (invItem && ing.quantity) {
        totalCost += (Number(invItem.cost_price) * Number(ing.quantity));
      }
    });
    setFormData(prev => ({ ...prev, cost_price: Number(totalCost.toFixed(3)) }));
  }, [formData.ingredients, inventoryItems]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await api.get('/menu');
      if (response.data.success) {
        setItems(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportData = async () => {
    try {
      // Try /categories first, then fallback to /business/categories
      let catRes;
      try {
        catRes = await api.get('/categories');
      } catch (e) {
        catRes = await api.get('/business/categories');
      }
      const invRes = await api.get('/inventory');
      setCategories(catRes.data.data || []);
      setInventoryItems(invRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch support data:', error);
    }
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { inventory_item_id: '', quantity: '' }]
    });
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const list = [...formData.ingredients];
    list[index][field] = value;
    setFormData({ ...formData, ingredients: list });
  };

  const removeIngredient = (index: number) => {
    setFormData({ ...formData, ingredients: formData.ingredients.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting Menu Form:', formData);
    try {
      const form = new FormData();
      form.append('name_en', formData.name_en);
      form.append('name_ar', formData.name_ar);
      form.append('category_id', formData.category_id);
      form.append('price', formData.price.toString());
      form.append('cost_price', formData.cost_price.toString());
      form.append('description_en', formData.description_en || '');
      form.append('description_ar', formData.description_ar || '');
      form.append('type', activeTab === 'menu' ? 'selling' : 'premix');
      form.append('ingredients', JSON.stringify(formData.ingredients));
      
      if (imageFile) {
        form.append('image', imageFile);
      }

      const response = await api.post('/menu', form, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setIsModalOpen(false);
        fetchItems();
        resetForm();
      } else {
        alert(response.data.message || 'Failed to create menu item');
      }
    } catch (error: any) {
      console.error('Submit error:', error.response?.data);
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to create menu item. Please check all required fields.';
      alert(msg);
    }
  };

  const resetForm = () => {
    // If we are in the premix tab, try to find the 'Premix' category
    const premixCat = activeTab === 'premix' 
      ? categories.find(c => c.name_en.toLowerCase().includes('premix'))
      : null;

    setFormData({
      name_en: '',
      name_ar: '',
      category_id: premixCat ? String(premixCat.category_id) : '',
      price: 0,
      cost_price: 0,
      description_en: '',
      description_ar: '',
      ingredients: []
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const filteredItems = items.filter(i => 
    i.name_en.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Menu & Recipe Management">
      <div className="inventory-container">
        {/* Tab System */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('menu')}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '16px', 
              fontWeight: 700, 
              color: activeTab === 'menu' ? 'var(--primary)' : '#94a3b8', 
              cursor: 'pointer',
              position: 'relative',
              paddingBottom: '0.5rem'
            }}
          >
            🍽️ Selling Items
            {activeTab === 'menu' && <div style={{ position: 'absolute', bottom: '-0.5rem', left: 0, right: 0, height: '3px', background: 'var(--primary)', borderRadius: '10px' }} />}
          </button>
          <button 
            onClick={() => setActiveTab('premix')}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '16px', 
              fontWeight: 700, 
              color: activeTab === 'premix' ? 'var(--primary)' : '#94a3b8', 
              cursor: 'pointer',
              position: 'relative',
              paddingBottom: '0.5rem'
            }}
          >
            🧪 Kitchen Premixes
            {activeTab === 'premix' && <div style={{ position: 'absolute', bottom: '-0.5rem', left: 0, right: 0, height: '3px', background: 'var(--primary)', borderRadius: '10px' }} />}
          </button>
        </div>

        <div className="inventory-actions">
           <div className="search-group">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search Menu (e.g. Latte, Coffee...)" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-add" onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus size={18} />
            {activeTab === 'menu' ? 'Create Menu Item' : 'Define New Premix'}
          </button>
        </div>

        <div className="stock-table-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Sale Price</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-5">Loading data...</td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-5">No items found in this category.</td></tr>
                ) : filteredItems
                    .filter(i => activeTab === 'premix' ? i.category_name?.toLowerCase().includes('premix') : !i.category_name?.toLowerCase().includes('premix'))
                    .map(item => (
                  <tr key={item.menu_item_id}>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                         <div style={{width: 50, height: 50, borderRadius: 12, overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            {item.image_url ? (
                               <img src={`${import.meta.env.VITE_API_URL.replace('/api', '')}${item.image_url}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                            ) : (
                               activeTab === 'menu' ? <Coffee size={22} color="var(--primary)" /> : <Package size={22} color="var(--primary)" />
                            )}
                         </div>
                         <div className="item-info">
                            <strong>{item.name_en}</strong>
                            <span>{item.name_ar}</span>
                         </div>
                      </div>
                    </td>
                    <td><span className="sku-badge" style={{background: '#f1f5f9', color: '#64748b'}}>{item.category_name || 'General'}</span></td>
                    <td><strong>{Number(item.price).toFixed(3)} KWD</strong></td>
                    <td><span className={item.status === 'available' ? 'status-badge healthy' : 'status-badge critical'}>{item.status}</span></td>
                    <td className="text-right">
                       <div className="row-actions">
                          <button className="btn-icon-sm" title="Edit Item"><Edit3 size={16} /></button>
                          {activeTab === 'premix' && <button className="btn-icon-sm" style={{ color: 'var(--primary)' }} title="Production Log"><TrendingUp size={16} /></button>}
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
          <div className="modal-content" style={{maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto'}}>
            <div className="modal-header">
              <h3>{activeTab === 'menu' ? 'Configure Menu Item & Recipe' : 'Define Kitchen Premix (Sub-Assembly)'}</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '2rem', background: '#fcfcfc' }}>
              
              {/* SECTION 1: BASIC INFO */}
              <div className="form-section-premium" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                  <div style={{ background: 'rgba(5, 76, 45, 0.1)', padding: '8px', borderRadius: '10px' }}><Info size={20} /></div>
                  <h4 style={{ margin: 0 }}>Basic Information</h4>
                </div>
                
                <div className="form-grid" style={{ gridTemplateColumns: '150px 1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
                  {/* Image Section */}
                  <div 
                    className="image-upload-box" 
                    onClick={() => document.getElementById('image-upload')?.click()}
                    style={{
                      height: '145px',
                      width: '100%',
                      border: '2px dashed #cbd5e1',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: '#fff',
                      transition: 'all 0.3s ease',
                      overflow: 'hidden'
                    }}
                  >
                    {imagePreview ? (
                       <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                       <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                          <Upload size={24} style={{ marginBottom: '4px' }} />
                          <span style={{ fontSize: '10px', display: 'block' }}>IMAGE</span>
                       </div>
                    )}
                    <input id="image-upload" type="file" hidden accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageFile(file);
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                      <label style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>ITEM NAME (ENGLISH)</label>
                      <input type="text" style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} required value={formData.name_en} onChange={(e) => setFormData({...formData, name_en: e.target.value})} placeholder="e.g. Grilled Chicken" />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>الاسم باللغة العربية</label>
                      <input type="text" dir="rtl" style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} required value={formData.name_ar} onChange={(e) => setFormData({...formData, name_ar: e.target.value})} placeholder="مثال: دجاج مشوي" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                     <div className="form-group">
                        <label style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>CATEGORY *</label>
                        <select required value={formData.category_id} style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} onChange={(e) => setFormData({...formData, category_id: e.target.value})}>
                            <option value="">-- Choose Category --</option>
                            {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name_en}</option>)}
                        </select>
                     </div>
                     
                     <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'menu' ? '1fr 1fr' : '1fr', gap: '0.8rem' }}>
                        {activeTab === 'menu' && (
                          <div className="form-group">
                            <label style={{ fontWeight: 800, fontSize: '11px', color: 'var(--primary)' }}>SELLING PRICE (KWD)</label>
                            <div style={{ position: 'relative' }}>
                              <input type="number" step="0.001" style={{ padding: '0.8rem 0.8rem 0.8rem 2rem', width: '100%', borderRadius: '12px', border: '2px solid #e2e8f0', fontWeight: 'bold' }} required value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} />
                              <DollarSign size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                            </div>
                          </div>
                        )}
                        <div className="form-group">
                           <label style={{ fontWeight: 800, fontSize: '11px', color: '#f59e0b' }}>{activeTab === 'menu' ? 'COST PRICE (RECIPE)' : 'TOTAL PRODUCTION COST'}</label>
                           <div style={{ position: 'relative' }}>
                             <input type="number" step="0.001" style={{ padding: '0.8rem 0.8rem 0.8rem 2rem', width: '100%', borderRadius: '12px', border: '2px solid #fef3c7', background: '#fffbeb', fontWeight: 'bold', color: '#b45309' }} value={formData.cost_price} readOnly />
                             <TrendingUp size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#f59e0b' }} />
                           </div>
                        </div>
                     </div>

                     {/* Profit Analysis (Menu Only) */}
                     {activeTab === 'menu' && formData.price > 0 && formData.cost_price > 0 && (
                       <div style={{ background: '#f0fdf4', padding: '10px 15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #dcfce7' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>
                             <Percent size={14} /> PROFIT MARGIN:
                          </div>
                          <div style={{ fontWeight: 900, color: '#15803d' }}>
                             {(((formData.price - formData.cost_price) / formData.price) * 100).toFixed(1)}%
                          </div>
                       </div>
                     )}
                  </div>
                </div>
              </div>

               {/* SECTION 2: DESCRIPTIONS (MENU ONLY) */}
              {activeTab === 'menu' && (
                <div className="form-section-premium" style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                    <div style={{ background: 'rgba(5, 76, 45, 0.1)', padding: '8px', borderRadius: '10px' }}><FileText size={20} /></div>
                    <h4 style={{ margin: 0 }}>Marketing Descriptions</h4>
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>DESCRIPTION (ENGLISH)</label>
                      <textarea 
                        rows={2} 
                        style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0', resize: 'none' }}
                        value={formData.description_en} 
                        onChange={(e) => setFormData({...formData, description_en: e.target.value})} 
                        placeholder="Describe the item to your customers..." 
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>وصف الصنف بالعربية</label>
                      <textarea 
                        dir="rtl" 
                        rows={2} 
                        style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0', resize: 'none' }}
                        value={formData.description_ar} 
                        onChange={(e) => setFormData({...formData, description_ar: e.target.value})} 
                        placeholder="أضف وصفاً جذاباً للصنف..." 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: RECIPE */}
              <div className="recipe-section-premium" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.5rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)' }}>
                      <div style={{ background: 'rgba(5, 76, 45, 0.1)', padding: '8px', borderRadius: '10px' }}><ChefHat size={20} /></div>
                      <h4 style={{ margin: 0 }}>Recipe Ingredients (BOM)</h4>
                    </div>
                    <button type="button" className="btn-add" onClick={addIngredient} style={{ padding: '0.5rem 1rem', fontSize: '13px' }}>
                       <Plus size={16} /> Link Ingredient
                    </button>
                 </div>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {formData.ingredients.map((ing, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 45px', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '14px', alignItems: 'end', border: '1px solid #f1f5f9' }}>
                        <div className="form-group">
                           <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>RAW MATERIAL</label>
                           <select required value={ing.inventory_item_id} style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} onChange={(e) => updateIngredient(idx, 'inventory_item_id', e.target.value)}>
                              <option value="">-- Select Material --</option>
                              {inventoryItems.map(ii => <option key={ii.inventory_item_id} value={ii.inventory_item_id}>{ii.name_en} ({ii.unit_en})</option>)}
                           </select>
                        </div>
                        <div className="form-group">
                           <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>QTY PER SALE</label>
                           <input type="number" step="any" required style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} placeholder="0.00" value={ing.quantity} onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)} />
                        </div>
                        <button type="button" className="btn-icon-sm" onClick={() => removeIngredient(idx)} style={{ color: '#ef4444', height: '42px', width: '42px', borderRadius: '10px', border: '1px solid #fee2e2', background: '#fff' }}><Trash2 size={16} /></button>
                      </div>
                    ))}
                    {formData.ingredients.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2.5rem', background: '#f8fafc', border: '2px dashed #f1f5f9', borderRadius: '16px', color: '#94a3b8' }}>
                         <ChefHat size={32} style={{ opacity: 0.3, marginBottom: '10px' }} />
                         <p style={{ fontSize: '13px', margin: 0 }}>No ingredients linked to this recipe yet.</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn-secondary" style={{ padding: '0.8rem 2rem', borderRadius: '12px' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '0.8rem 2.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(5, 76, 45, 0.2)' }}>
                  {activeTab === 'menu' ? 'Finalize Menu Item' : 'Create Kitchen Premix'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MenuPage;
