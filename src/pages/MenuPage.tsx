import FoodLoader from '../components/FoodLoader';
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
import { useLanguage } from '../hooks/useLanguage';

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
  const { t, language } = useLanguage();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [selectedRecipeItem, setSelectedRecipeItem] = useState<any>(null);

  const getImageUrl = (url: string) => {
    if (!url) return '';
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${baseUrl}/${cleanUrl}`;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'premix'>('menu');
  
  // Data for creation
  const [categories, setCategories] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [allPackages, setAllPackages] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  
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
    yield_quantity: 1.000,
    ingredients: [] as { inventory_item_id: string, package_id: string, quantity: string }[],
    branch_customizations: [] as { branch_id: number, custom_price: string, status: 'available' | 'unavailable' }[]
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
    if (!formData.ingredients || formData.ingredients.length === 0) return;
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
    const isPremixItem = activeTab === 'premix';
    const finalCost = isPremixItem ? (totalCost / (Number(formData.yield_quantity) || 1.0)) : totalCost;
    setFormData(prev => ({ ...prev, cost_price: Number(finalCost.toFixed(3)) }));
  }, [formData.ingredients, inventoryItems, allPackages, items, formData.yield_quantity, activeTab]);

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
      let catData = [];
      try {
        const catRes = await api.get('/categories');
        catData = catRes.data.data || [];
      } catch (e) {
        try {
          const catResAlt = await api.get('/business/categories');
          catData = catResAlt.data.data || [];
        } catch(err) {
          console.error('Failed to fetch categories:', err);
        }
      }
      setCategories(catData);

      try {
        const invRes = await api.get('/inventory');
        setInventoryItems(invRes.data.data || []);
      } catch (e) {
        console.error('Failed to fetch inventory:', e);
      }

      try {
        const pkgRes = await api.get('/inventory/packages');
        setAllPackages(pkgRes.data.data || []);
      } catch (e) {
        console.error('Failed to fetch packages:', e);
      }

      try {
        const branchesRes = await api.get('/branches');
        setBranches(branchesRes.data.data || []);
      } catch (e) {
        console.error('Failed to fetch branches:', e);
      }
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
          yield_quantity: Number(details.yield_quantity || 1.000),
          ingredients: (details.ingredients || []).map((ing: any) => ({
            inventory_item_id: ing.sub_menu_item_id ? `pre-${ing.sub_menu_item_id}` : `inv-${ing.inventory_item_id}`,
            package_id: String(ing.package_id || ''),
            quantity: String(ing.quantity || '')
          })),
          branch_customizations: (details.branch_customizations || []).map((bc: any) => ({
            branch_id: bc.branch_id,
            custom_price: bc.custom_price !== null ? String(bc.custom_price) : '',
            status: bc.status
          }))
        });
        if (details.image_url) {
           const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5002/api').replace('/api', '');
           const cleanPath = details.image_url.startsWith('/') ? details.image_url.slice(1) : details.image_url;
           setImagePreview(`${baseUrl}/${cleanPath}`);
        }
        setIsModalOpen(true);
      }
    } catch (error) {
      toast.error(t('failed_load_details'));
    }
  };

  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      title: t('delete_menu_item_q'),
      text: t('delete_menu_item_msg'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444'
    });
    if (confirm.isConfirmed) {
      try {
        const response = await api.delete(`/menu/${id}`);
        if (response.data.success) {
          toast.success(t('menu_item_deleted_success'));
          fetchItems();
        }
      } catch (error) {
        toast.error(t('failed_delete_item'));
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
      form.append('price', activeTab === 'premix' ? formData.cost_price.toString() : formData.price.toString());
      form.append('cost_price', formData.cost_price.toString());
      form.append('unit_en', formData.unit_en);
      form.append('unit_ar', formData.unit_ar);
      form.append('description_en', formData.description_en || '');
      form.append('description_ar', formData.description_ar || '');
      form.append('yield_quantity', formData.yield_quantity.toString());
      form.append('type', activeTab === 'menu' ? 'selling' : 'premix');
      form.append('ingredients', JSON.stringify(formData.ingredients));
      form.append('branch_customizations', JSON.stringify(formData.branch_customizations));
      
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
        toast.success(editingItem ? t('item_updated') : t('item_added'));
      } else {
        toast.error(response.data.message || t('operation_failed'));
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || t('failed_save_menu_item');
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
      yield_quantity: 1.000,
      ingredients: [],
      branch_customizations: []
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
    <Layout title={t('menu_premix')}>
      <div className="inventory-container">
        {/* Tab System */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('menu')}
            style={{ background: 'none', border: 'none', padding: '10px 0', fontSize: '15px', fontWeight: 600, color: activeTab === 'menu' ? 'var(--primary)' : '#64748b', cursor: 'pointer', position: 'relative' }}
          >
            🍽️ {t('selling_items')}
            {activeTab === 'menu' && <div style={{ position: 'absolute', bottom: '-0.5rem', left: 0, right: 0, height: '3px', background: 'var(--primary)', borderRadius: '10px' }} />}
          </button>
          <button 
            onClick={() => setActiveTab('premix')}
            style={{ background: 'none', border: 'none', padding: '10px 0', fontSize: '15px', fontWeight: 600, color: activeTab === 'premix' ? 'var(--primary)' : '#64748b', cursor: 'pointer', position: 'relative' }}
          >
            🧪 {t('kitchen_premixes')}
            {activeTab === 'premix' && <div style={{ position: 'absolute', bottom: '-0.5rem', left: 0, right: 0, height: '3px', background: 'var(--primary)', borderRadius: '10px' }} />}
          </button>
        </div>

        <div className="inventory-actions">
           <div className="search-group">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder={t('search_menu_hint')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-add" onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <Plus size={18} />
            {isPremix ? t('define_new_premix') : t('create_menu_item')}
          </button>
        </div>

        <div className="stock-table-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('product_details')}</th>
                  <th>{t('category')}</th>
                  <th>{isPremix ? (t('production_cost') || 'Production Cost') : t('sale_price')}</th>
                  <th>{t('status')}</th>
                  <th className="text-end">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-5"><FoodLoader size="small" /></td></tr>
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
                                 src={getImageUrl(item.image_url)} 
                                 style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                               />
                            ) : (
                               activeTab === 'menu' ? <Coffee size={22} color="var(--primary)" /> : <Package size={22} color="var(--primary)" />
                            )}
                         </div>
                         <div className="item-info">
                            <strong>{language === 'ar' ? (item.name_ar || item.name_en) : item.name_en}</strong>
                            <span>{item.barcode && <><Barcode size={12} /> {item.barcode}</>}</span>
                         </div>
                      </div>
                    </td>
                    <td><span className="sku-badge" style={{background: '#f1f5f9', color: '#64748b'}}>{item.category_name || t('general')}</span></td>
                    <td>
                      <strong>
                        {Number(activeTab === 'premix' ? item.cost_price : item.price).toFixed(3)} {t('kd_currency')}
                      </strong>
                      {activeTab === 'premix' && (
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal', marginLeft: '4px' }}>
                          / {item.unit_en}
                        </span>
                      )}
                    </td>
                    <td><span className={item.status === 'available' ? 'status-badge healthy' : 'status-badge critical'}>{t(item.status)}</span></td>
                     <td className="text-end">
                       <div className="row-actions">
                          <button className="btn-icon-sm" onClick={() => handleEdit(item)} title={t('view_recipe')}><Eye size={16} /></button>
                          <button className="btn-icon-sm" onClick={() => handleEdit(item)} title={t('edit_item')}><Edit3 size={16} /></button>
                          {isPremix && <button className="btn-icon-sm" style={{ color: 'var(--primary)' }} title={t('production_log')}><TrendingUp size={16} /></button>}
                          <button className="btn-icon-sm" onClick={() => handleDelete(item.menu_item_id)} title={t('delete')}><Trash2 size={16} /></button>
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
          <div className="modal-content" style={{maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
            <div className="modal-header">
              <h3>{isPremix ? t('define_kitchen_premix') : t('configure_menu_item')}</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ padding: '2rem', background: '#fcfcfc', overflowY: 'auto', flex: 1 }}>
              
              <div className="form-section-premium" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                  <div style={{ background: 'rgba(5, 76, 45, 0.1)', padding: '8px', borderRadius: '10px' }}><Info size={20} /></div>
                  <h4 style={{ margin: 0 }}>{t('basic_information')}</h4>
                </div>
                
                <div className="menu-modal-grid">
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
                          <span style={{ fontSize: '10px', display: 'block' }}>{t('image_upload')}</span>
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
                      <label style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>{t('item_name_en')}</label>
                      <input type="text" style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} required value={formData.name_en} onChange={(e) => setFormData({...formData, name_en: e.target.value})} placeholder={t('enter_name_en')} />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>{t('item_name_ar')}</label>
                      <input type="text" dir="rtl" style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} required value={formData.name_ar} onChange={(e) => setFormData({...formData, name_ar: e.target.value})} placeholder={t('enter_name_ar')} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                     <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        <div className="form-group">
                          <label style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>{t('category_star')}</label>
                          <select
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            required
                            style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%' }}
                          >
                            <option value="">{t('select_category')}</option>
                            {categories.map((c) => (
                              <option key={c.category_id} value={c.category_id}>
                                {language === 'ar' ? (c.name_ar || c.name_en) : c.name_en}
                              </option>
                            ))}
                          </select>
                        </div>
                        {isPremix && (
                           <div className="form-group">
                             <label style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>{t('base_unit_batch')}</label>
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
                               <option value="piece">{t('piece_unit')}</option>
                               <option value="kg">{t('kg_unit')}</option>
                               <option value="gram">{t('gram_unit')}</option>
                               <option value="liter">{t('liter_unit')}</option>
                               <option value="ml">{t('ml_unit')}</option>
                             </select>
                           </div>
                        )}
                     </div>

                     {!isPremix && (
                        <div className="form-group">
                          <label style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>{t('barcode')}</label>
                          <div style={{ position: 'relative' }}>
                            <input type="text" style={{ padding: '0.8rem 0.8rem 0.8rem 2.2rem', width: '100%', borderRadius: '12px', border: '1px solid #e2e8f0' }} value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} placeholder={t('scan_barcode_hint')} />
                            <Barcode size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                          </div>
                        </div>
                     )}
                     
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem' }}>
                         {isPremix && (
                           <div className="form-group">
                              <label style={{ fontWeight: 800, fontSize: '11px', color: 'var(--primary)' }}>
                                 {language === 'ar' 
                                   ? `إجمالي كمية الإنتاج (${formData.unit_ar})` 
                                   : `Total Recipe Yield (${formData.unit_en})`}
                              </label>
                              <div style={{ position: 'relative' }}>
                                <input 
                                  type="number" 
                                  step="any" 
                                  style={{ padding: '0.8rem 0.8rem 0.8rem 2rem', width: '100%', borderRadius: '12px', border: '2px solid #e2e8f0', fontWeight: 'bold' }} 
                                  required 
                                  value={formData.yield_quantity} 
                                  onChange={(e) => setFormData({...formData, yield_quantity: Number(e.target.value) || 1.000})} 
                                />
                                <ClipboardList size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                              </div>
                           </div>
                         )}
                         {!isPremix && (
                           <div className="form-group">
                             <label style={{ fontWeight: 800, fontSize: '11px', color: 'var(--primary)' }}>{t('selling_price_kd')}</label>
                             <div style={{ position: 'relative' }}>
                               <input type="number" step="0.001" style={{ padding: '0.8rem 0.8rem 0.8rem 2rem', width: '100%', borderRadius: '12px', border: '2px solid #e2e8f0', fontWeight: 'bold' }} required value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} />
                               <BadgeCent size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                             </div>
                           </div>
                         )}
                         <div className="form-group">
                            <label style={{ fontWeight: 800, fontSize: '11px', color: '#f59e0b' }}>
                               {isPremix ? `${t('total_production_cost') || 'Unit Cost'} (${t('per') || 'Per 1'} ${formData.unit_en})` : t('cost_price_recipe')}
                            </label>
                            <div style={{ position: 'relative' }}>
                              <input type="number" step="0.001" style={{ padding: '0.8rem 0.8rem 0.8rem 2rem', width: '100%', borderRadius: '12px', border: '2px solid #fef3c7', background: '#fffbeb', fontWeight: 'bold', color: '#b45309' }} value={formData.cost_price} onChange={(e) => setFormData({...formData, cost_price: Number(e.target.value)})} />
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
                    <h4 style={{ margin: 0 }}>{t('marketing_descriptions')}</h4>
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>{t('description_en')}</label>
                      <textarea rows={2} style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0', resize: 'none' }} value={formData.description_en} onChange={(e) => setFormData({...formData, description_en: e.target.value})} placeholder="..." />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: 600, fontSize: '13px', color: '#64748b' }}>{t('description_ar')}</label>
                      <textarea dir="rtl" rows={2} style={{ padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0', resize: 'none' }} value={formData.description_ar} onChange={(e) => setFormData({...formData, description_ar: e.target.value})} placeholder="..." />
                    </div>
                  </div>
                </div>
              )}

              {!isPremix && branches.length > 0 && (
                <div className="form-section-premium" style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                    <div style={{ background: 'rgba(5, 76, 45, 0.1)', padding: '8px', borderRadius: '10px' }}><BadgeCent size={20} /></div>
                    <h4 style={{ margin: 0 }}>{t('branch_pricing_visibility') || 'Branch Pricing & Visibility'}</h4>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {branches.map((br) => {
                      const custom = formData.branch_customizations.find(c => c.branch_id === br.branch_id) || {
                        branch_id: br.branch_id,
                        custom_price: '',
                        status: 'available'
                      };

                      const setCustomField = (field: 'custom_price' | 'status', value: any) => {
                        const exists = formData.branch_customizations.some(c => c.branch_id === br.branch_id);
                        let updated: { branch_id: number; custom_price: string; status: 'available' | 'unavailable' }[] = [];
                        if (exists) {
                          updated = formData.branch_customizations.map(c => 
                            c.branch_id === br.branch_id ? { ...c, [field]: value } : c
                          ) as any;
                        } else {
                          updated = [...formData.branch_customizations, { 
                            branch_id: br.branch_id, 
                            custom_price: '', 
                            status: 'available', 
                            [field]: value 
                          }] as any;
                        }
                        setFormData(prev => ({ ...prev, branch_customizations: updated }));
                      };

                      return (
                        <div key={br.branch_id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div>
                            <strong style={{ fontSize: '14px', color: '#1e293b' }}>{language === 'ar' ? (br.name_ar || br.name_en) : br.name_en}</strong>
                          </div>
                          
                          <div className="form-group" style={{ margin: 0 }}>
                            <select 
                              value={custom.status}
                              onChange={(e) => setCustomField('status', e.target.value)}
                              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%' }}
                            >
                              <option value="available">{t('available') || 'Available'}</option>
                              <option value="unavailable">{t('unavailable') || 'Unavailable'}</option>
                            </select>
                          </div>

                          <div className="form-group" style={{ margin: 0, position: 'relative' }}>
                            <input 
                              type="number" 
                              step="0.001" 
                              placeholder={`${formData.price} KD`}
                              value={custom.custom_price}
                              onChange={(e) => setCustomField('custom_price', e.target.value)}
                              disabled={custom.status === 'unavailable'}
                              style={{ padding: '0.5rem 0.5rem 0.5rem 1.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%' }}
                            />
                            <BadgeCent size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="recipe-section-premium" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '1.5rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)' }}>
                      <div style={{ background: 'rgba(5, 76, 45, 0.1)', padding: '8px', borderRadius: '10px' }}><ChefHat size={20} /></div>
                      <h4 style={{ margin: 0 }}>{t('recipe_ingredients_bom')}</h4>
                    </div>
                    <button type="button" className="btn-add" onClick={addIngredient} style={{ padding: '0.5rem 1rem', fontSize: '13px' }}>
                       <Plus size={16} /> {t('link_ingredient')}
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
                        <div key={idx} className="menu-ingredient-row">
                          <div className="form-group">
                             <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>{t('raw_material_premix')}</label>
                             <SearchableSelect
                                value={ing.inventory_item_id}
                                onChange={(val: any) => updateIngredient(idx, 'inventory_item_id', String(val))}
                                placeholder={t('search_ingredient_hint')}
                                options={[
                                  {
                                    label: t('raw_materials'),
                                    options: (inventoryItems || []).map(ii => ({
                                      value: `inv-${ii.inventory_item_id}`,
                                      label: `${ii.name_en} (${ii.unit_en})`
                                    }))
                                  },
                                  {
                                    label: t('kitchen_premixes'),
                                    options: (items || []).filter(i => i.type === 'premix' && i.menu_item_id !== (editingItem?.menu_item_id)).map(p => ({
                                      value: `pre-${p.menu_item_id}`,
                                      label: `${p.name_en} (${p.unit_en || 'piece'})`
                                    }))
                                  }
                                ]}
                             />
                          </div>
                          <div className="form-group">
                             <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>{t('measurement_unit')}</label>
                             <select 
                                className="po-table-input" 
                                style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%', fontSize: '13px' }} 
                                value={ing.package_id} 
                                onChange={e => updateIngredient(idx, 'package_id', e.target.value)}
                             >
                                <option value="">{currentItem?.unit_en || t('base_unit')} (x1)</option>
                                {(currentItem?.unit_en?.toLowerCase() === 'kg' || currentItem?.unit_en?.toLowerCase() === 'kilogram') && (
                                   <option value="virtual_gram">{t('grams_unit')} (x0.001)</option>
                                )}
                                {(currentItem?.unit_en?.toLowerCase() === 'liter' || currentItem?.unit_en?.toLowerCase() === 'litre') && (
                                   <option value="virtual_ml">{t('ml_unit')} (x0.001)</option>
                                )}
                                {!isPremixIng && allPackages.filter((p: any) => String(p.inventory_item_id) === realId && Number(p.multiplier) !== 1).map((p: any) => {
                                   const mult = Number(p.multiplier);
                                   const displayLabel = mult < 1 
                                     ? `(1 ${currentItem?.unit_en || 'Unit'} = ${Math.round(1/mult)} ${p.name_en}s)` 
                                     : `(x${mult})`;
                                   return (
                                     <option key={p.package_id} value={p.package_id}>
                                       {p.name_en} {displayLabel}
                                     </option>
                                   );
                                })}
                             </select>
                          </div>
                          <div className="form-group">
                             <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>{t('amount_used')}</label>
                             <input type="number" step="any" required style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%' }} placeholder="0.00" value={ing.quantity} onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)} />
                             {currentItem && (
                                <div style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 600, marginTop: '4px' }}>
                                   {t('unit_cost')}: {((Number(allPackages.find(p => String(p.package_id) === String(ing.package_id))?.multiplier || 1) || 1) * Number((currentItem as any).dynamic_cost_price || currentItem.cost_price || 0)).toFixed(3)} KD
                                </div>
                             )}
                          </div>
                          <button type="button" className="btn-icon-sm" onClick={() => removeIngredient(idx)} style={{ color: '#ef4444', height: '42px', width: '42px', borderRadius: '10px', border: '1px solid #fee2e2', background: '#fff' }}><Trash2 size={16} /></button>
                        </div>
                       );
                     })}
                     {formData.ingredients.length === 0 && (
                       <div style={{ textAlign: 'center', padding: '2.5rem', background: '#f8fafc', borderRadius: '16px', color: '#94a3b8' }}>
                          <ChefHat size={32} style={{ opacity: 0.3, marginBottom: '10px' }} />
                          <p style={{ fontSize: '13px' }}>{t('no_ingredients_linked')}</p>
                       </div>
                     )}
                 </div>
              </div>
              </div>

              <div className="modal-footer" style={{ padding: '1.5rem 2rem', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem', zIndex: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--primary)' }}>
                  {editingItem ? (isPremix ? t('update_kitchen_premix') : t('update_menu_item')) : (isPremix ? t('create_kitchen_premix') : t('create_menu_item'))}
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
