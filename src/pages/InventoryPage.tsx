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
  Edit
} from 'lucide-react';
import './InventoryPage.css';

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
}

const InventoryPage = () => {
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
  
  const totalValue = safeItems.reduce((acc, curr) => {
    const qty = Number(curr?.current_stock) || 0;
    const price = Number(curr?.cost_price) || 0;
    return acc + (qty * price);
  }, 0);

  return (
    <Layout title="Inventory & Stock">
      <div className="inventory-container">
        {/* Metric Cards */}
        <div className="inventory-metrics">
          <div className="metric-card">
            <div className="metric-icon bg-green"><Package size={24} /></div>
            <div className="metric-details">
              <span>Total Items</span>
              <h3>{totalItems}</h3>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-orange"><AlertTriangle size={24} /></div>
            <div className="metric-details">
              <span>Low Stock</span>
              <h3 className={lowStockItems > 0 ? 'text-danger' : ''}>{lowStockItems}</h3>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-blue"><TrendingUp size={24} /></div>
            <div className="metric-details">
              <span>Total Value (د.ك)</span>
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
              placeholder="Search by SKU, Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="action-buttons">
            <button className="btn-filter"><Filter size={18} /> Filter</button>
            <button className="btn-add" onClick={() => setIsModalOpen(true)}><Plus size={18} /> Add Stock Item</button>
          </div>
        </div>

        {/* Main Stock Table */}
        <div className="stock-table-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Item Details</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Min Level</th>
                  <th>Cost Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && safeItems.length === 0 ? (
                  <tr><td colSpan={8} style={{textAlign: 'center', padding: '3rem'}}>Loading stock...</td></tr>
                ) : safeItems.length === 0 ? (
                  <tr><td colSpan={8} style={{textAlign: 'center', padding: '3rem'}}>No stock items found.</td></tr>
                ) : safeItems.map(item => (
                  <tr key={item.inventory_item_id}>
                    <td>
                      <div className="item-info">
                        <strong>{item.name_en}</strong>
                        <span>{item.name_ar || item.name_en}</span>
                      </div>
                    </td>
                    <td><span className="sku-badge">{item.sku}</span></td>
                    <td>{item.category_name_en || 'Uncategorized'}</td>
                    <td>{item.current_stock} {item.unit_en}</td>
                    <td>{item.min_stock_level} {item.unit_en}</td>
                    <td>{Number(item.cost_price).toFixed(3)} د.ك</td>
                    <td>
                      <span className={`status-badge ${Number(item.current_stock) <= Number(item.min_stock_level) ? 'low' : 'healthy'}`}>
                        {Number(item.current_stock) <= Number(item.min_stock_level) ? 'Low Stock' : 'Healthy'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="row-actions">
                        <button className="btn-icon-sm" onClick={() => setAdjustItem(item)} title="Adjust Stock"><PackagePlus size={16} /></button>
                        <button className="btn-icon-sm" onClick={() => setEditItem(item)} title="Edit Item"><Edit size={16} /></button>
                        <button className="btn-more"><MoreVertical size={18} /></button>
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
