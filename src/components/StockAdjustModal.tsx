import React, { useState } from 'react';
import { X, Save, Loader2, PlusCircle, MinusCircle } from 'lucide-react';
import api from '../api/axios';

interface InventoryItem {
  inventory_item_id: number;
  name_en: string;
  sku: string;
  current_stock: number;
  unit_en: string;
}

interface StockAdjustModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

const StockAdjustModal = ({ item, onClose, onSuccess }: StockAdjustModalProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<'add' | 'subtract'>('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || parseFloat(quantity) <= 0) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/inventory/${item.inventory_item_id}/adjust-stock`, {
        adjustment_type: type,
        quantity: parseFloat(quantity),
        reason
      });

      if (response.data.success) {
        onSuccess();
        onClose();
        setQuantity('');
        setReason('');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto'}}>
        <div className="modal-header">
          <h3>Stock Adjustment</h3>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="item-preview-box">
            <span>Updating Stock for:</span>
            <strong>{item.name_en}</strong>
            <small>SKU: {item.sku} | Current: {item.current_stock} {item.unit_en}</small>
          </div>

          <div className="adjust-type-toggle">
            <button 
              type="button" 
              className={`type-btn add ${type === 'add' ? 'active' : ''}`}
              onClick={() => setType('add')}
            >
              <PlusCircle size={20} />
              Stock In (+)
            </button>
            <button 
              type="button" 
              className={`type-btn subtract ${type === 'subtract' ? 'active' : ''}`}
              onClick={() => setType('subtract')}
            >
              <MinusCircle size={20} />
              Stock Out (-)
            </button>
          </div>

          <div className="form-group" style={{marginTop: '1.5rem'}}>
            <label>Adjustment Quantity ({item.unit_en}) *</label>
            <input 
              type="number" 
              step="0.001" 
              required 
              autoFocus
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.000"
            />
          </div>

          <div className="form-group" style={{marginTop: '1rem'}}>
            <label>Reason / Reference</label>
            <input 
              type="text" 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Monthly Restock, Damage, etc."
            />
          </div>

          <div className="modal-footer" style={{paddingLeft: 0, paddingRight: 0, paddingBottom: 0}}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className={`btn-primary ${type}`} disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  <Save size={18} />
                  Confirm {type === 'add' ? 'Addition' : 'Subtraction'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustModal;
