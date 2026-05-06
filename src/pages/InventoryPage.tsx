import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import StockItemModal from '../components/StockItemModal';
import StockAdjustModal from '../components/StockAdjustModal';
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  AlertTriangle, 
  TrendingUp,
  PackagePlus,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import './InventoryPage.css';
import { useLanguage } from '../hooks/useLanguage';

interface InventoryItem {
  inventory_item_id: number;
  name_en: string;
  name_ar: string;
  sku: string;
  category_name_en: string;
  current_stock: number;
  min_stock_level: number;
  unit_en: string;
  unit_ar: string;
  cost_price: number;
  dynamic_cost_price?: number;
}

const InventoryPage = () => {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/inventory?search=${searchTerm}`);
      console.log('Inventory Response:', response.data);
      if (response.data && response.data.success) {
        setItems(Array.isArray(response.data.data) ? response.data.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const handleDelete = async (id: number) => {
    const { isConfirmed } = await Swal.fire({
      title: t('are_you_sure'),
      text: t('revert_msg'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: t('yes_delete')
    });

    if (isConfirmed) {
      try {
        const response = await api.delete(`/inventory/${id}`);
        if (response.data.success) {
          toast.success(t('deleted_success'));
          fetchInventory();
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error(t('delete_fail'));
      }
    }
  };

  useEffect(() => {
    const debounceFetch = setTimeout(() => {
      fetchInventory();
    }, 500);
    return () => clearTimeout(debounceFetch);
  }, [fetchInventory]);

  // Safe checks for rendering
  const safeItems = Array.isArray(items) ? items : [];
  const totalItems = safeItems.length;
  const lowStockItems = safeItems.filter(i => 
    i && i.current_stock !== undefined && i.min_stock_level !== undefined && 
    Number(i.current_stock) <= Number(i.min_stock_level)
  ).length;
  
  const totalValue = safeItems.reduce((acc, curr: any) => {
    const qty = Number(curr?.current_stock) || 0;
    const price = Number(curr?.dynamic_cost_price || curr?.cost_price || 0);
    return acc + (qty * price);
  }, 0);

  return (
    <Layout title={t('inventory_stock')}>
      <div className="inventory-container">
        {/* Metric Cards */}
        <div className="inventory-metrics">
          <div className="metric-card">
            <div className="metric-icon bg-green"><Package size={24} /></div>
            <div className="metric-details">
              <span>{t('total_items')}</span>
              <h3>{totalItems}</h3>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-orange"><AlertTriangle size={24} /></div>
            <div className="metric-details">
              <span>{t('low_stock')}</span>
              <h3 className={lowStockItems > 0 ? 'text-danger' : ''}>{lowStockItems}</h3>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-blue"><TrendingUp size={24} /></div>
            <div className="metric-details">
              <span>{t('total_value_kd')}</span>
              <h3>{totalValue.toFixed(3)}</h3>
            </div>
          </div>
        </div>

        {/* Search and Buttons */}
        <div className="inventory-actions">
          <div className="search-group">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder={t('search_sku_name')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="action-buttons">
            <button className="btn-filter"><Filter size={18} /> {t('filter')}</button>
            <button className="btn-add" onClick={() => setIsModalOpen(true)}><Plus size={18} /> {t('add_stock_item')}</button>
          </div>
        </div>

        {/* Main Stock Table */}
        <div className="stock-table-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('item_details')}</th>
                  <th>{t('sku')}</th>
                  <th>{t('category')}</th>
                  <th>{t('current_stock')}</th>
                  <th>{t('min_level')}</th>
                  <th>{t('cost_price')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading && safeItems.length === 0 ? (
                  <tr><td colSpan={8} style={{textAlign: 'center', padding: '3rem'}}>{t('loading_stock')}</td></tr>
                ) : safeItems.length === 0 ? (
                  <tr><td colSpan={8} style={{textAlign: 'center', padding: '3rem'}}>{t('no_stock_items')}</td></tr>
                ) : safeItems.map(item => (
                  <tr key={item.inventory_item_id}>
                    <td>
                      <div className="item-info">
                        <strong>{language === 'ar' ? (item.name_ar || item.name_en) : item.name_en}</strong>
                        <span>{language === 'ar' ? item.name_en : (item.name_ar || item.name_en)}</span>
                      </div>
                    </td>
                    <td><span className="sku-badge">{item.sku}</span></td>
                    <td>{(language === 'ar' ? item.category_name_en : item.category_name_en) || 'Uncategorized'}</td>
                    <td>{item.current_stock} {language === 'ar' ? (item.unit_ar || item.unit_en) : item.unit_en}</td>
                    <td>{item.min_stock_level} {language === 'ar' ? (item.unit_ar || item.unit_en) : item.unit_en}</td>
                    <td>{Number(item.dynamic_cost_price || item.cost_price || 0).toFixed(3)} {t('kd_currency')}</td>
                    <td>
                      <span className={`status-badge ${Number(item.current_stock) <= Number(item.min_stock_level) ? 'low' : 'healthy'}`}>
                        {Number(item.current_stock) <= Number(item.min_stock_level) ? t('low_stock') : t('healthy')}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="row-actions">
                        <button className="btn-icon-sm" onClick={() => setAdjustItem(item)} title={t('adjust_stock')}><PackagePlus size={16} /></button>
                        <button className="btn-icon-sm" onClick={() => setEditItem(item)} title={t('edit_item')}><Edit size={16} /></button>
                        <button className="btn-icon-sm" onClick={() => handleDelete(item.inventory_item_id)} title={t('delete')} style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <StockItemModal 
        isOpen={isModalOpen || !!editItem} 
        item={editItem}
        onClose={() => {
          setIsModalOpen(false);
          setEditItem(null);
        }} 
        onSuccess={fetchInventory} 
      />

      {adjustItem && (
        <StockAdjustModal
          item={adjustItem}
          onClose={() => setAdjustItem(null)}
          onSuccess={fetchInventory}
        />
      )}
    </Layout>
  );
};

export default InventoryPage;
