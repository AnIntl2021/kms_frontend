import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import SearchableSelect from '../components/SearchableSelect';
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
  BadgeCent,
  ChefHat,
  TrendingUp,
  Percent,
  FileText,
  Barcode,
  Eye,
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import './InventoryPage.css'; // Reuse themes
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

interface MenuItem {
  menu_item_id: number;
  name_en: string;
  name_ar: string;
  barcode?: string;
  price: number;
  cost_price: number;
  category_name: string;
  category_id: number;
  image_url?: string;
  status: 'available' | 'unavailable';
  type?: 'selling' | 'premix';
  unit_en?: string;
  unit_ar?: string;
}

const MenuPage = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'premix'>('menu');
  
  // Data for creation
  const [categories, setCategories] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [allPackages, setAllPackages] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    barcode: '',
    category_id: '',
    price: 0,
    cost_price: 0,
    unit_en: 'piece',
    unit_ar: 'حبة',
    description_en: '',
    description_ar: '',
    ingredients: [] as { inventory_item_id: string, package_id: string, quantity: string }[]
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
    formData.ingredients?.forEach(ing => {
      const isPremix = String(ing.inventory_item_id).startsWith('pre-');
      const realId = String(ing.inventory_item_id).replace('inv-', '').replace('pre-', '');
      
      const invItem = isPremix 
        ? (items || []).find(i => String(i.menu_item_id) === realId)
        : (inventoryItems || []).find(i => String(i.inventory_item_id) === realId);

      if (invItem && ing.quantity) {
        let multiplier = 1;
        if (ing.package_id === 'virtual_gram') multiplier = 0.001;
        else if (ing.package_id === 'virtual_ml') multiplier = 0.001;
        else if (ing.package_id) {
           const pkg = allPackages.find(p => String(p.package_id) === String(ing.package_id));
           if (pkg) multiplier = Number(pkg.multiplier);
        }
        const calcMultiplier = Number(multiplier) || 1;
        const itemCost = isPremix 
          ? Number(invItem.cost_price || 0)
          : Number((invItem as any).dynamic_cost_price || (invItem as any).cost_price || 0);

        totalCost += (itemCost * Number(ing.quantity) * calcMultiplier);
      }
    });
    setFormData(prev => ({ ...prev, cost_price: Number(totalCost.toFixed(3)) }));
  }, [formData.ingredients, inventoryItems, allPackages, items]);

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
      let catRes;
      try {
        catRes = await api.get('/categories');
      } catch (e) {
        catRes = await api.get('/business/categories');
      }
      const invRes = await api.get('/inventory');
      const pkgRes = await api.get('/inventory/packages');
      setCategories(catRes.data.data || []);
      setInventoryItems(invRes.data.data || []);
      setAllPackages(pkgRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch support data:', error);
    }
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { inventory_item_id: '', package_id: '', quantity: '' }]
    });
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const list = [...formData.ingredients];
    (list[index] as any)[field] = value;
    setFormData({ ...formData, ingredients: list });
  };

  const removeIngredient = (index: number) => {
    setFormData({ ...formData, ingredients: formData.ingredients.filter((_, i) => i !== index) });
  };

  const handleEdit = async (item: MenuItem) => {
    try {
      const response = await api.get(`/menu/${item.menu_item_id}`);
      if (response.data.success) {
        const details = response.data.data;
        setEditingItem(item);
        setFormData({
          name_en: details.name_en,
          name_ar: details.name_ar,
          barcode: details.barcode || '',
          category_id: String(details.category_id),
          price: Number(details.price),
          cost_price: Number(details.cost_price),
          unit_en: details.unit_en || 'piece',
          unit_ar: details.unit_ar || 'حبة',
          description_en: details.description_en || '',
          description_ar: details.description_ar || '',
          ingredients: (details.ingredients || []).map((ing: any) => ({
            inventory_item_id: ing.sub_menu_item_id ? `pre-${ing.sub_menu_item_id}` : `inv-${ing.inventory_item_id}`,
            package_id: String(ing.package_id || ''),
            quantity: String(ing.quantity || '')
          }))
        });
        if (details.image_url) {
           const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace('/api', '');
           const cleanPath = details.image_url.startsWith('/') ? details.image_url.slice(1) : details.image_url;
           setImagePreview(`${baseUrl}/${cleanPath}`);
        }
        setIsModalOpen(true);
      }
    } catch (error) {
      toast.error('Failed to load menu item details.');
    }
  };

  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: 'Delete Menu Item?',
      text: 'This will permanently remove this item from your catalog. Are you sure?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444'
    });
    if (confirm.isConfirmed) {
      try {
        const response = await api.delete(`/menu/${id}`);
        if (response.data.success) {
          toast.success('Menu Item Deleted Successfully! 🗑️');
          fetchItems();
        }
      } catch (error) {
        toast.error('Failed to delete menu item.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const form = new FormData();
      form.append('name_en', formData.name_en);
      form.append('name_ar', formData.name_ar);
      form.append('barcode', formData.barcode || '');
      form.append('category_id', formData.category_id);
      form.append('price', formData.price.toString());
      form.append('cost_price', formData.cost_price.toString());
      form.append('unit_en', formData.unit_en);
      form.append('unit_ar', formData.unit_ar);
      form.append('description_en', formData.description_en || '');
      form.append('description_ar', formData.description_ar || '');
      form.append('type', activeTab === 'menu' ? 'selling' : 'premix');
      form.append('ingredients', JSON.stringify(formData.ingredients));
      
      if (imageFile) {
        form.append('image', imageFile);
      }

      const url = editingItem ? `/menu/${editingItem.menu_item_id}` : '/menu';
      const method = editingItem ? 'put' : 'post';

      const response = await api[method](url, form, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setIsModalOpen(false);
        fetchItems();
        resetForm();
        toast.success(editingItem ? 'Menu Item Updated! ✨' : 'New Item Added to Catalog! 🍽️');
      } else {
        toast.error(response.data.message || 'Operation failed.');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to save menu item. Please check all required fields.';
      toast.error(msg);
    }
  };

  const resetForm = () => {
    const premixCat = (activeTab === 'premix' && Array.isArray(categories))
      ? categories.find(c => c.name_en?.toLowerCase().includes('premix'))
      : null;

    setEditingItem(null);
    setFormData({
      name_en: '',
      name_ar: '',
      barcode: '',
      category_id: premixCat ? String(premixCat.category_id) : '',
      price: 0,
      cost_price: 0,
      unit_en: 'piece',
      unit_ar: 'حبة',
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

  const isPremix = activeTab === 'premix';

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
            {isPremix ? 'Define New Premix' : 'Create Menu Item'}
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
                ) : (filteredItems || [])
                    .filter(i => {
                      if (!i) return false;
                      return activeTab === 'premix' ? i.type === 'premix' : i.type === 'selling';
                    })
                    .map(item => (
                  <tr key={item.menu_item_id}>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                         <div style={{width: 50, height: 50, borderRadius: 12, overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            {item.image_url ? (
                               <img 
                                 src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace('/api', '')}/${item.image_url.startsWith('/') ? item.image_url.slice(1) : item.image_url}`} 
                                 style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                               />
                            ) : (
                               activeTab === 'menu' ? <Coffee size={22} color="var(--primary)" /> : <Package size={22} color="var(--primary)" />
                            )}
                         </div>
                         <div className="item-info">
                            <strong>{item.name_en}</strong>
                            <span>{item.barcode && <><Barcode size={12} /> {item.barcode}</>}</span>
                         </div>
                      </div>
                    </td>
                    <td><span className="sku-badge" style={{background: '#f1f5f9', color: '#64748b'}}>{item.category_name || 'General'}</span></td>
                    <td><strong>{Number(item.price).toFixed(3)} د.ك</strong></td>
                    <td><span className={item.status === 'available' ? 'status-badge healthy' : 'status-badge critical'}>{item.status}</span></td>
                     <td className="text-right">
                       <div className="row-actions">
                          <button className="btn-icon-sm" onClick={() => handleEdit(item)} title="View Recipe"><Eye size={16} /></button>
                          <button className="btn-icon-sm" onClick={() => handleEdit(item)} title="Edit Item"><Edit3 size={16} /></button>
                          {isPremix && <button className="btn-icon-sm" style={{ color: 'var(--primary)' }} title="Production Log"><TrendingUp size={16} /></button>}
                          <button className="btn-icon-sm" onClick={() => handleDelete(item.menu_item_id)} title="Delete"><Trash2 size={16} /></button>
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
              <h3>{isPremix ? 'Define Kitchen Premix (Sub-Assembly)' : 'Configure Menu Item & Recipe'}</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '2rem', background: '#fcfcfc' }}>
              
              <div className="form-section-premium" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                  <div style={{ background: 'rgba(5, 76, 45, 0.1)', padding: '8px', borderRadius: '10px' }}><Info size={20} /></div>
                  <h4 style={{ margin: 0 }}>Basic Information</h4>
                </div>
                
                <div className="form-grid" style={{ gridTemplateColumns: '150px 1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
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
                      <input type="text" style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} required value={formData.name_en} onChange={(e) => setFormData({...formData, name_en: e.target.value})} placeholder="e.g. Garlic Herb Butter" />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>الاسم باللغة العربية</label>
                      <input type="text" dir="rtl" style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} required value={formData.name_ar} onChange={(e) => setFormData({...formData, name_ar: e.target.value})} placeholder="مثال: دجاج مشوي" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                     <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group">
                          <label style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>CATEGORY *</label>
                          <select
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            required
                            style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%' }}
                          >
                            <option value="">Select Category</option>
                            {categories.map((c) => (
                              <option key={c.category_id} value={c.category_id}>
                                {c.name_en}
                              </option>
                            ))}
                          </select>
                        </div>
                        {isPremix && (
                           <div className="form-group">
                             <label style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>BASE UNIT (BATCH)</label>
                             <select
                               value={formData.unit_en}
                               onChange={(e) => {
                                 const unit = e.target.value;
                                 setFormData({ 
                                   ...formData, 
                                   unit_en: unit,
                                   unit_ar: unit === 'kg' ? 'كجم' : (unit === 'gram' ? 'جرام' : (unit === 'liter' ? 'لتر' : (unit === 'ml' ? 'مل' : 'حبة')))
                                 });
                               }}
                               style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%' }}
                             >
                               <option value="piece">Piece (Unit)</option>
                               <option value="kg">Kilogram (Kg)</option>
                               <option value="gram">Gram (g)</option>
                               <option value="liter">Liter (L)</option>
                               <option value="ml">Milliliter (ml)</option>
                             </select>
                           </div>
                        )}
                     </div>

                     {!isPremix && (
                        <div className="form-group">
                          <label style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>BARCODE</label>
                          <div style={{ position: 'relative' }}>
                            <input type="text" style={{ padding: '0.8rem 0.8rem 0.8rem 2.2rem', width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0' }} value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} placeholder="Scan or enter barcode" />
                            <Barcode size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                          </div>
                        </div>
                     )}
                     
                     <div style={{ display: 'grid', gridTemplateColumns: !isPremix ? '1fr 1fr' : '1fr', gap: '0.8rem' }}>
                        {!isPremix && (
                          <div className="form-group">
                            <label style={{ fontWeight: 800, fontSize: '11px', color: 'var(--primary)' }}>SELLING PRICE (د.ك)</label>
                            <div style={{ position: 'relative' }}>
                              <input type="number" step="0.001" style={{ padding: '0.8rem 0.8rem 0.8rem 2rem', width: '100%', borderRadius: '12px', border: '2px solid #e2e8f0', fontWeight: 'bold' }} required value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} />
                              <BadgeCent size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                            </div>
                          </div>
                        )}
                        <div className="form-group">
                           <label style={{ fontWeight: 800, fontSize: '11px', color: '#f59e0b' }}>{isPremix ? 'TOTAL PRODUCTION COST' : 'COST PRICE (RECIPE)'}</label>
                           <div style={{ position: 'relative' }}>
                             <input type="number" step="0.001" style={{ padding: '0.8rem 0.8rem 0.8rem 2rem', width: '100%', borderRadius: '12px', border: '2px solid #fef3c7', background: '#fffbeb', fontWeight: 'bold', color: '#b45309' }} value={formData.cost_price} readOnly />
                             <TrendingUp size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#f59e0b' }} />
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              {!isPremix && (
                <div className="form-section-premium" style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                    <div style={{ background: 'rgba(5, 76, 45, 0.1)', padding: '8px', borderRadius: '10px' }}><FileText size={20} /></div>
                    <h4 style={{ margin: 0 }}>Marketing Descriptions</h4>
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>DESCRIPTION (ENGLISH)</label>
                      <textarea rows={2} style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0', resize: 'none' }} value={formData.description_en} onChange={(e) => setFormData({...formData, description_en: e.target.value})} placeholder="Describe the item..." />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>وصف الصنف بالعربية</label>
                      <textarea dir="rtl" rows={2} style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0', resize: 'none' }} value={formData.description_ar} onChange={(e) => setFormData({...formData, description_ar: e.target.value})} placeholder="وصف الصنف..." />
                    </div>
                  </div>
                </div>
              )}

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
                    {formData.ingredients.map((ing, idx) => {
                       const isPremixIng = String(ing.inventory_item_id).startsWith('pre-');
                       const realId = String(ing.inventory_item_id).replace('inv-', '').replace('pre-', '');
                       const currentItem = isPremixIng 
                         ? items.find(i => String(i.menu_item_id) === realId)
                         : inventoryItems.find(ii => String(ii.inventory_item_id) === realId);

                       return (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 45px', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '14px', alignItems: 'end', border: '1px solid #f1f5f9' }}>
                          <div className="form-group">
                             <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>RAW MATERIAL / PREMIX</label>
                             <SearchableSelect
                                value={ing.inventory_item_id}
                                onChange={(val: any) => updateIngredient(idx, 'inventory_item_id', String(val))}
                                placeholder="Search Ingredient..."
                                options={[
                                  {
                                    label: 'RAW MATERIALS',
                                    options: (inventoryItems || []).map(ii => ({
                                      value: `inv-${ii.inventory_item_id}`,
                                      label: `${ii.name_en} (${ii.unit_en})`
                                    }))
                                  },
                                  {
                                    label: 'KITCHEN PREMIXES',
                                    options: (items || []).filter(i => i.type === 'premix' && i.menu_item_id !== (editingItem?.menu_item_id)).map(p => ({
                                      value: `pre-${p.menu_item_id}`,
                                      label: `${p.name_en} (${p.unit_en || 'piece'})`
                                    }))
                                  }
                                ]}
                             />
                          </div>
                          <div className="form-group">
                             <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>MEASUREMENT UNIT</label>
                             <select className="po-table-input" style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%' }} value={ing.package_id} onChange={e => updateIngredient(idx, 'package_id', e.target.value)}>
                                <option value="">Base Unit ({currentItem?.unit_en || '...' })</option>
                                {(currentItem?.unit_en?.toLowerCase() === 'kg' || currentItem?.unit_en?.toLowerCase() === 'kilogram') && (
                                   <option value="virtual_gram">Grams (0.001 Kg)</option>
                                )}
                                {(currentItem?.unit_en?.toLowerCase() === 'liter' || currentItem?.unit_en?.toLowerCase() === 'litre') && (
                                   <option value="virtual_ml">ML (0.001 L)</option>
                                )}
                                {allPackages.filter((p: any) => String(p.inventory_item_id) === realId).map((p: any) => (
                                  <option key={p.package_id} value={p.package_id}>{p.name_en} (x{Number(p.multiplier)})</option>
                                ))}
                             </select>
                          </div>
                          <div className="form-group">
                             <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>AMOUNT USED</label>
                             <input type="number" step="any" required style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%' }} placeholder="0.00" value={ing.quantity} onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)} />
                          </div>
                          <button type="button" className="btn-icon-sm" onClick={() => removeIngredient(idx)} style={{ color: '#ef4444', height: '42px', width: '42px', borderRadius: '10px', border: '1px solid #fee2e2', background: '#fff' }}><Trash2 size={16} /></button>
                        </div>
                       );
                     })}
                     {formData.ingredients.length === 0 && (
                       <div style={{ textAlign: 'center', padding: '2.5rem', background: '#f8fafc', borderRadius: '16px', color: '#94a3b8' }}>
                          <ChefHat size={32} style={{ opacity: 0.3, marginBottom: '10px' }} />
                          <p style={{ fontSize: '13px' }}>No ingredients linked yet.</p>
                       </div>
                     )}
                 </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--primary)' }}>
                  {editingItem ? (isPremix ? 'Update Kitchen Premix' : 'Update Menu Item') : (isPremix ? 'Create Kitchen Premix' : 'Create Menu Item')}
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
