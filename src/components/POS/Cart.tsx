import React, { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingCart, CreditCard, Banknote, Car, ShoppingBag, Utensils, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { printReceipt } from '../../utils/printUtils';
import Select from 'react-select';

const tableOptions = Array.from({ length: 20 }, (_, i) => ({
  value: `Table-${i + 1}`,
  label: `Table ${i + 1}`
}));

interface CartItem {
  id: number;
  menu_item_id?: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartProps {
  items: CartItem[];
  updateQuantity: (id: number, delta: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  orderType: 'walk_in' | 'takeaway' | 'delivery';
  setOrderType: (type: 'walk_in' | 'takeaway' | 'delivery') => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  paymentMethods?: string[];
  branchId?: number;
  counterId?: number;
  tableNumber: string;
  setTableNumber: (table: string) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
}

const Cart: React.FC<CartProps> = ({
  items, updateQuantity, removeItem, clearCart,
  orderType, setOrderType, paymentMethod, setPaymentMethod, paymentMethods = ['cash', 'card'], branchId, counterId,
  tableNumber, setTableNumber, customerName, setCustomerName, customerPhone, setCustomerPhone
}) => {
  const [loading, setLoading] = useState(false);
  const [discount, setDiscount] = useState<number>(0);

  // Popup Calculator states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [returnedAmount, setReturnedAmount] = useState(0);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = Number(discount) || 0;
  const discountPercentage = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;
  const tax = subtotal * 0.1; // 10% VAT example — adjust as needed
  const total = Math.max(0, subtotal - discountAmount);

  const handleCheckout = async (finalReceived: number = total, finalReturned: number = 0) => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const payload = {
        branch_id: branchId || 1,
        order_type: orderType,
        payment_method: paymentMethod,
        total_amount: subtotal,
        discount_amount: discountAmount,
        discount_percentage: parseFloat(discountPercentage.toFixed(2)),
        final_amount: total,
        table_number: orderType === 'walk_in' ? (tableNumber || null) : null,
        counter_id: counterId || null,
        customer_name: customerName || null,
        client_phone: customerPhone || null,
        received_amount: finalReceived,
        returned_amount: finalReturned,
        items: items.map(i => ({
          menu_item_id: i.menu_item_id || i.id,
          quantity: i.quantity,
          price: i.price
        }))
      };

      const response = await api.post('/sales', payload);
      if (response.data.success) {
        const orderNumber = response.data.data?.order_number || 'N/A';
        toast.success(`Order Placed! (${orderNumber})`);

        const itemsToPrint = items.map((i: any) => ({
          ...i,
          name: (i.name && i.name_ar) ? `${i.name} / ${i.name_ar}` : (i.name || i.name_ar || 'Unknown Item')
        }));

        printReceipt(
          itemsToPrint, 
          total, 
          orderType, 
          paymentMethod, 
          orderNumber, 
          discountAmount, 
          parseFloat(discountPercentage.toFixed(2)), 
          orderType === 'walk_in' ? tableNumber : '',
          finalReceived,
          finalReturned
        );

        setDiscount(0);
        setTableNumber('');
        setCustomerName('');
        setCustomerPhone('');
        clearCart();
        setShowCheckoutModal(false);
      } else {
        toast.error('Failed to place order');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error processing checkout');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrderClick = () => {
    if (items.length === 0) return;
    setReceivedAmount(total.toFixed(3));
    setReturnedAmount(0);
    setShowCheckoutModal(true);
  };

  return (
    <>
      {/* Header */}
      <div className="pos-cart-header">
        <h2>
          <ShoppingCart size={18} />
          Bills
        </h2>
        {items.length > 0 && (
          <button className="btn-clear-cart" onClick={clearCart} disabled={loading}>
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      {/* Items */}
      <div className="pos-cart-items">
        {items.length === 0 ? (
          <div className="pos-cart-empty">
            <ShoppingCart size={40} strokeWidth={1.5} style={{ color: '#cbd5e1' }} />
            <p>No items yet.<br />Add from the menu.</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="pos-cart-item">
              {/* Thumbnail */}
              {item.image ? (
                <img src={item.image} alt={item.name} className="pos-cart-item-thumb" />
              ) : (
                <div className="pos-cart-item-thumb-placeholder">
                  {item.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Info */}
              <div className="pos-cart-item-info">
                <div className="pos-cart-item-title">{item.name}</div>
                <div className="pos-cart-item-price">{(item.price * item.quantity).toFixed(3)} KWD</div>
              </div>

              {/* Qty Controls */}
              <div className="pos-cart-item-controls">
                <button className="pos-qty-btn" onClick={() => updateQuantity(item.id, 1)} disabled={loading}>
                  <Plus size={11} />
                </button>
                <div className="pos-qty-val">{String(item.quantity).padStart(2, '0')}</div>
                <button className="pos-qty-btn" onClick={() => updateQuantity(item.id, -1)} disabled={loading}>
                  <Minus size={11} />
                </button>
              </div>

              {/* Remove */}
              <button className="btn-remove-item" onClick={() => removeItem(item.id)} disabled={loading}>
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="pos-cart-footer">



        {/* Payment Method */}
        <div className="pos-payment-method" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {paymentMethods.map((method) => {
            const isActive = paymentMethod.toLowerCase() === method.toLowerCase();
            return (
              <button
                key={method}
                className={`pos-pay-btn ${isActive ? 'active' : ''}`}
                onClick={() => setPaymentMethod(method)}
                disabled={loading}
                style={{
                  flex: '1 1 45%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  transition: 'all 0.2s',
                  background: isActive ? '#0d6b5e' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#475569',
                  border: '1.5px solid',
                  borderColor: isActive ? '#0d6b5e' : '#e2e8f0',
                  cursor: 'pointer'
                }}
              >
                {method.toLowerCase() === 'cash' ? <Banknote size={16} /> : <CreditCard size={16} />}
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Summary */}
        <div className="pos-summary-row">
          <span>Sub Total</span>
          <span>{subtotal.toFixed(3)} KWD</span>
        </div>

        {items.length > 0 && (
          <div className="pos-summary-row">
            <span>Discount (KWD)</span>
            <input
              type="number"
              step="0.05"
              min="0"
              max={subtotal}
              value={discount || ''}
              onChange={(e) => {
                const val = Math.min(subtotal, Math.max(0, parseFloat(e.target.value) || 0));
                setDiscount(val);
              }}
              className="pos-discount-input"
              placeholder="0.000"
              disabled={loading}
            />
          </div>
        )}

        <hr className="pos-summary-divider" />

        <div className="pos-summary-row total">
          <span>Total</span>
          <span>{total.toFixed(3)} KWD</span>
        </div>

        <button
          className="btn-checkout"
          disabled={items.length === 0 || loading}
          onClick={handlePlaceOrderClick}
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : 'Place Order'}
        </button>
      </div>

      {/* Change Calculator Popup Modal */}
      {showCheckoutModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 30, 40, 0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '400px',
            padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0', textAlign: 'center', position: 'relative'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: 800, color: '#1a2332' }}>
              Confirm Payment
            </h3>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: '#64748b' }}>
              Order checkout via <strong>{paymentMethod.toUpperCase()}</strong>
            </p>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>
                Total Bill Amount
              </span>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: 900, color: '#0d6b5e' }}>
                {total.toFixed(3)} KWD
              </h2>
            </div>

            <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                Received Amount (KWD)
              </label>
              <input
                type="number"
                step="0.001"
                placeholder="0.000"
                value={receivedAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  setReceivedAmount(val);
                  const parsed = parseFloat(val) || 0;
                  setReturnedAmount(Math.max(0, parsed - total));
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  outline: 'none',
                  background: '#f8fafc',
                  color: '#1e293b'
                }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 700 }}>
                Change to Return:
              </span>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#166534' }}>
                {returnedAmount.toFixed(3)} KWD
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                disabled={loading}
                style={{
                  flex: 1, padding: '12px', background: '#f1f5f9', color: '#64748b',
                  border: '1.5px solid #cbd5e1', borderRadius: '10px', fontWeight: 700,
                  cursor: 'pointer', fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleCheckout(parseFloat(receivedAmount) || total, returnedAmount)}
                style={{
                  flex: 1, padding: '12px', background: '#0d6b5e', color: 'white',
                  border: 'none', borderRadius: '10px', fontWeight: 800,
                  cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(13,107,94,0.2)'
                }}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Complete & Print'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Cart;
