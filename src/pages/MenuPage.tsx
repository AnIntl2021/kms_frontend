import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  X,
  Search,
  Coffee
} from 'lucide-react';
import './InventoryPage.css'; // Reuse themes

interface MenuItem {
  menu_item_id: number;
  name_en: string;
  name_ar: string;
  price: number;
  category_name: string;
  category_id: number;
  status: 'available' | 'unavailable';
}

const MenuPage = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Data for creation
  const [categories, setCategories] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    category_id: '',
    price: '',
    description_en: '',
    description_ar: '',
    ingredients: [] as any[]
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchItems();
    fetchSupportData();
  }, []);

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
      const catRes = await api.get('/business/categories');
      const invRes = await api.get('/inventory');
      setCategories(catRes.data.data);
      setInventoryItems(invRes.data.data);
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
    try {
      await api.post('/menu', formData);
      setIsModalOpen(false);
      fetchItems();
      resetForm();
    } catch (error) {
      alert('Action failed.');
    }
  };

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_ar: '',
      category_id: '',
      price: '',
      description_en: '',
      description_ar: '',
      ingredients: []
    });
  };

  const filteredItems = items.filter(i => 
    i.name_en.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Menu & Recipe Management">
      <div className="inventory-container">
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
            Create Menu Item
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
                  <tr><td colSpan={5} className="text-center py-5">Loading menu...</td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-5">No menu items found.</td></tr>
                ) : filteredItems.map(item => (
                  <tr key={item.menu_item_id}>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                         <div style={{width: 44, height: 44, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'}}>
                            <Coffee size={22} />
                         </div>
                         <div className="item-info">
                            <strong>{item.name_en}</strong>
                            <span>{item.name_ar}</span>
                         </div>
                      </div>
                    </td>
                    <td><span className="sku-badge" style={{background: '#f1f5f9', color: '#64748b'}}>{item.category_name || 'General'}</span></td>
                    <td><strong>{Number(item.price).toFixed(3)} KWD</strong></td>
                    <td><span className="status-badge healthy">{item.status}</span></td>
                    <td className="text-right">
                       <div className="row-actions">
                          <button className="btn-icon-sm" title="Edit Item"><Edit3 size={16} /></button>
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
          <div className="modal-content" style={{maxWidth: '850px'}}>
            <div className="modal-header">
              <h3>Configure Menu Item & Recipe</h3>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Item Name (English) *</label>
                  <input type="text" required value={formData.name_en} onChange={(e) => setFormData({...formData, name_en: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Item Name (Arabic) *</label>
                  <input type="text" dir="rtl" required value={formData.name_ar} onChange={(e) => setFormData({...formData, name_ar: e.target.value})} />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                   <label>Category *</label>
                   <select required value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})}>
                      <option value="">-- Choose --</option>
                      {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name_en}</option>)}
                   </select>
                </div>
                <div className="form-group">
                   <label>Selling Price (KWD) *</label>
                   <input type="number" step="0.001" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                </div>
              </div>

              <div className="recipe-section" style={{marginTop: '2rem'}}>
                 <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                    <h4 style={{margin: 0, color: 'var(--primary)'}}>Recipe Ingredients (BOM)</h4>
                    <button type="button" className="btn-icon-sm" onClick={addIngredient} style={{color: 'var(--primary)', borderColor: 'var(--primary)'}}>
                       <Plus size={16} /> Link Ingredient
                    </button>
                 </div>
                 
                 <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto'}}>
                    {formData.ingredients.map((ing, idx) => (
                      <div key={idx} style={{display: 'grid', gridTemplateColumns: '1fr 120px 40px', gap: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', alignItems: 'end'}}>
                        <div className="form-group">
                           <label>Raw Material</label>
                           <select required value={ing.inventory_item_id} onChange={(e) => updateIngredient(idx, 'inventory_item_id', e.target.value)}>
                              <option value="">-- Select Material --</option>
                              {inventoryItems.map(ii => <option key={ii.inventory_item_id} value={ii.inventory_item_id}>{ii.name_en} ({ii.unit_en})</option>)}
                           </select>
                        </div>
                        <div className="form-group">
                           <label>Qty per Sale</label>
                           <input type="number" step="any" required placeholder="Amount" value={ing.quantity} onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)} />
                        </div>
                        <button type="button" className="btn-icon-sm" onClick={() => removeIngredient(idx)} style={{color: '#ef4444', marginBottom: '4px'}}><X size={16} /></button>
                      </div>
                    ))}
                    {formData.ingredients.length === 0 && <div style={{textAlign: 'center', padding: '1.5rem', border: '1px dashed #e2e8f0', borderRadius: '10px', color: '#64748b'}}>No ingredients linked yet. This item will not deduct from inventory.</div>}
                 </div>
              </div>

              <div className="modal-footer" style={{padding: '2rem 0 0'}}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Finalize Menu Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MenuPage;
