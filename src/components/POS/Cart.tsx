import React, { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingCart, CreditCard, Banknote, Car, ShoppingBag, Utensils, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { printReceipt } from '../../utils/printUtils';

interface CartItem {
  id: number;
  menu_item_id?: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  updateQuantity: (id: number, delta: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  orderType: 'walk_in' | 'takeaway' | 'delivery';
  setOrderType: (type: 'walk_in' | 'takeaway' | 'delivery') => void;
  paymentMethod: 'cash' | 'card';
  setPaymentMethod: (method: 'cash' | 'card') => void;
  branchId?: number;
  counterId?: number;
}

const Cart: React.FC<CartProps> = ({ 
  items, updateQuantity, removeItem, clearCart, 
  orderType, setOrderType, paymentMethod, setPaymentMethod, branchId, counterId 
}) => {
  const [loading, setLoading] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const payload = {
        branch_id: branchId || 1,
        order_type: orderType,
        payment_method: paymentMethod,
        total_amount: total,
        counter_id: counterId || null,
        items: items.map(i => ({
          menu_item_id: i.menu_item_id || i.id,
          quantity: i.quantity,
          price: i.price
        }))
      };
      
      const response = await api.post('/sales', payload);
      if (response.data.success) {
        const orderNumber = response.data.data?.order_number || 'N/A';
        toast.success(`Order Placed Successfully! (${orderNumber})`);
        
        const itemsToPrint = items.map((i: any) => ({
          ...i,
          name: (i.name && i.name_ar) ? `${i.name} / ${i.name_ar}` : (i.name || i.name_ar || 'Unknown Item')
        }));
        
        printReceipt(itemsToPrint, total, orderType, paymentMethod, orderNumber);

        clearCart();
      } else {
        toast.error('Failed to place order');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error processing checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="pos-cart-header">
        <h2><ShoppingCart size={22} /> Current Order</h2>
        {items.length > 0 && (
          <button className="btn-clear-cart" onClick={clearCart} disabled={loading}>
            <Trash2 size={16} /> Clear
          </button>
        )}
      </div>

      <div className="pos-cart-items">
        {items.length === 0 ? (
          <div className="pos-cart-empty">
            <ShoppingCart size={48} strokeWidth={1} />
            <p>Your cart is empty. Add items from the menu.</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="pos-cart-item">
              <div className="pos-cart-item-info">
                <div className="pos-cart-item-title">{item.name}</div>
                <div className="pos-cart-item-price">{(item.price * item.quantity).toFixed(3)} KWD</div>
              </div>
              <div className="pos-cart-item-controls">
                <button className="pos-qty-btn" onClick={() => updateQuantity(item.id, -1)} disabled={loading}><Minus size={14}/></button>
                <div className="pos-qty-val">{item.quantity}</div>
                <button className="pos-qty-btn" onClick={() => updateQuantity(item.id, 1)} disabled={loading}><Plus size={14}/></button>
              </div>
              <button className="btn-remove-item" onClick={() => removeItem(item.id)} disabled={loading}>
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="pos-cart-footer">
        
        {/* Order Type Selector */}
        <div className="pos-order-type">
          <button 
            className={`pos-type-btn ${orderType === 'walk_in' ? 'active' : ''}`}
            onClick={() => setOrderType('walk_in')}
            disabled={loading}
          >
            <Utensils size={16} className="mb-1" /> Dine In
          </button>
          <button 
            className={`pos-type-btn ${orderType === 'takeaway' ? 'active' : ''}`}
            onClick={() => setOrderType('takeaway')}
            disabled={loading}
          >
            <ShoppingBag size={16} className="mb-1" /> Takeaway
          </button>
          <button 
            className={`pos-type-btn ${orderType === 'delivery' ? 'active' : ''}`}
            onClick={() => setOrderType('delivery')}
            disabled={loading}
          >
            <Car size={16} className="mb-1" /> Delivery
          </button>
        </div>

        {/* Payment Method Selector */}
        <div className="pos-payment-method">
          <button 
            className={`pos-pay-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('cash')}
            disabled={loading}
          >
            <Banknote size={20} />
            Cash
          </button>
          <button 
            className={`pos-pay-btn ${paymentMethod === 'card' ? 'active' : ''}`}
            onClick={() => setPaymentMethod('card')}
            disabled={loading}
          >
            <CreditCard size={20} />
            Card
          </button>
        </div>

        <div className="pos-summary-row">
          <span>Subtotal</span>
          <span>{subtotal.toFixed(3)}</span>
        </div>
        <div className="pos-summary-row total">
          <span>Total (KWD)</span>
          <span>{total.toFixed(3)}</span>
        </div>
        
        <button 
          className="btn-checkout" 
          disabled={items.length === 0 || loading}
          onClick={handleCheckout}
        >
          {loading ? <Loader2 size={24} className="animate-spin" /> : 'Checkout Order'}
        </button>
      </div>
    </>
  );
};

export default Cart;
