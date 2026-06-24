import React, { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingCart, CreditCard, Banknote, Car, ShoppingBag, Utensils, Loader2, Edit } from 'lucide-react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { printReceipt } from '../../utils/printUtils';
import Select from 'react-select';
import { useSettings } from '../../hooks/useSettings';

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
  notes?: string;
  addons?: { name: string; price: number }[];
}

interface CartProps {
  items: CartItem[];
  updateQuantity: (id: number, delta: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  onUpdateItem?: (id: number, notes: string, addons: { name: string; price: number }[], newPrice: number) => void;
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
  items, updateQuantity, removeItem, clearCart, onUpdateItem,
  orderType, setOrderType, paymentMethod, setPaymentMethod, paymentMethods = ['cash', 'card'], branchId, counterId,
  tableNumber, setTableNumber, customerName, setCustomerName, customerPhone, setCustomerPhone
}) => {
  const { currencySymbol } = useSettings();
  const [loading, setLoading] = useState(false);
  const [discount, setDiscount] = useState<number>(0);

  // Popup Calculator states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [returnedAmount, setReturnedAmount] = useState(0);
  const [splitAmounts, setSplitAmounts] = useState<Record<string, string>>({});

  // Item Customization states
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [customizingItem, setCustomizingItem] = useState<CartItem | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [tempAddons, setTempAddons] = useState<{ name: string; price: number }[]>([]);
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');
  const [availableAddons, setAvailableAddons] = useState<{ addon_id: number; name: string; price: number }[]>([]);

  const fetchAvailableAddons = async () => {
    try {
      const res = await api.get('/sales/addons');
      if (res.data.success) {
        setAvailableAddons(res.data.data);
      }
    } catch (e) {
      console.error('Failed to fetch addons', e);
    }
  };

  const handleOpenCustomizeModal = (item: CartItem) => {
    setCustomizingItem(item);
    setTempNotes(item.notes || '');
    setTempAddons(item.addons || []);
    setNewAddonName('');
    setNewAddonPrice('');
    fetchAvailableAddons();
    setShowCustomizeModal(true);
  };

  const handleCreateAddon = async (e: any) => {
    e.preventDefault();
    if (!newAddonName.trim()) return toast.warn('Enter addon name');
    const priceNum = parseFloat(newAddonPrice) || 0;
    try {
      const res = await api.post('/sales/addons', { name: newAddonName.trim(), price: priceNum });
      if (res.data.success) {
        toast.success('Addon created/updated!');
        const created = res.data.data;
        setAvailableAddons(prev => {
          const exists = prev.some(a => a.name.toLowerCase() === created.name.toLowerCase());
          if (exists) {
            return prev.map(a => a.name.toLowerCase() === created.name.toLowerCase() ? { ...a, price: created.price } : a);
          }
          return [...prev, created];
        });
        setTempAddons(prev => {
          const exists = prev.some(a => a.name.toLowerCase() === created.name.toLowerCase());
          if (exists) return prev;
          return [...prev, { name: created.name, price: created.price }];
        });
        setNewAddonName('');
        setNewAddonPrice('');
      }
    } catch (error) {
      toast.error('Failed to create addon');
    }
  };

  const handleSaveCustomization = () => {
    if (!customizingItem || !onUpdateItem) return;
    const currentAddons = customizingItem.addons || [];
    const oldAddonCost = currentAddons.reduce((sum, a) => sum + Number(a.price), 0);
    const basePrice = Number(customizingItem.price) - oldAddonCost;
    const newAddonCost = tempAddons.reduce((sum, a) => sum + Number(a.price), 0);
    const newPrice = basePrice + newAddonCost;

    onUpdateItem(customizingItem.id, tempNotes, tempAddons, newPrice);
    setShowCustomizeModal(false);
    setCustomizingItem(null);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = Number(discount) || 0;
  const discountPercentage = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;
  const tax = subtotal * 0.1; // 10% VAT example — adjust as needed
  const total = Math.max(0, subtotal - discountAmount);

  const handleCheckout = async (finalReceived: number = total, finalReturned: number = 0) => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      let finalNotes = '';
      if (Object.keys(splitAmounts).length > 0) {
        const breakdownStr = `[Split Payment] ` + Object.entries(splitAmounts)
          .map(([m, val]) => `${m.toUpperCase()}: ${Number(val).toFixed(3)} ${currencySymbol}`)
          .join(', ');
        finalNotes = breakdownStr;
      }

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
        notes: finalNotes || null,
        items: items.map(i => ({
          menu_item_id: i.menu_item_id || i.id,
          quantity: i.quantity,
          price: i.price,
          notes: i.notes || null,
          addons: i.addons || []
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
    const selectedMethods = paymentMethod.split(',').map(x => x.trim());
    if (selectedMethods.length > 1) {
      const initial: Record<string, string> = {};
      selectedMethods.forEach((m, idx) => {
        initial[m] = idx === 0 ? total.toFixed(3) : '0.000';
      });
      setSplitAmounts(initial);
      setReceivedAmount(total.toFixed(3));
    } else {
      setReceivedAmount(total.toFixed(3));
      setSplitAmounts({});
    }
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
              <div className="pos-cart-item-info" style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div className="pos-cart-item-title" style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>{item.name}</div>
                {item.notes && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                    Note: {item.notes}
                  </div>
                )}
                {item.addons && item.addons.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#0d6b5e', fontWeight: 500, marginTop: '2px' }}>
                    + {item.addons.map(a => `${a.name} (+${Number(a.price).toFixed(3)})`).join(', ')}
                  </div>
                )}
                <div className="pos-cart-item-price" style={{ fontWeight: 700, fontSize: '0.85rem', color: '#475569', marginTop: '4px' }}>
                  {(item.price * item.quantity).toFixed(3)} {currencySymbol}
                </div>
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

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                <button 
                  className="btn-customize-item" 
                  onClick={() => handleOpenCustomizeModal(item)}
                  disabled={loading}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    color: '#0d6b5e',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Edit size={10} /> Custom
                </button>
                <button className="btn-remove-item" onClick={() => removeItem(item.id)} disabled={loading}>
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="pos-cart-footer">



        {/* Payment Method */}
        <div className="pos-payment-method" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
          {paymentMethods.map((method) => {
            const selectedMethods = paymentMethod.split(',').map(x => x.trim().toLowerCase());
            const isActive = selectedMethods.includes(method.toLowerCase());
            
            const handleMethodClick = () => {
              let updated;
              if (isActive) {
                if (selectedMethods.length > 1) {
                  updated = selectedMethods.filter(m => m !== method.toLowerCase()).join(',');
                } else {
                  updated = paymentMethod;
                }
              } else {
                updated = [...selectedMethods, method.toLowerCase()].join(',');
              }
              setPaymentMethod(updated);
            };

            return (
              <button
                key={method}
                className={`pos-pay-btn ${isActive ? 'active' : ''}`}
                onClick={handleMethodClick}
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
          <span>{subtotal.toFixed(3)} {currencySymbol}</span>
        </div>

        {items.length > 0 && (
          <div className="pos-summary-row">
            <span>Discount ({currencySymbol})</span>
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
          <span>{total.toFixed(3)} {currencySymbol}</span>
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
                {total.toFixed(3)} {currencySymbol}
              </h2>
            </div>

            {Object.keys(splitAmounts).length > 0 ? (
              Object.keys(splitAmounts).map((method, index) => (
                <div key={method} style={{ textAlign: 'left', marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                    {method.toUpperCase()} Received Amount ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    value={splitAmounts[method]}
                    onChange={(e) => {
                      const val = e.target.value;
                      const updatedSplits = {
                        ...splitAmounts,
                        [method]: val
                      };
                      setSplitAmounts(updatedSplits);
                      const sum = Object.values(updatedSplits).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
                      setReceivedAmount(sum.toString());
                      setReturnedAmount(Math.max(0, sum - total));
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
                    autoFocus={index === 0}
                  />
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Received Amount ({currencySymbol})
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
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 700 }}>
                Change to Return:
              </span>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#166534' }}>
                {returnedAmount.toFixed(3)} {currencySymbol}
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

      {/* Customize Item Modal */}
      {showCustomizeModal && customizingItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 30, 40, 0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2100
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '450px',
            padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0', position: 'relative'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.3rem', fontWeight: 800, color: '#1a2332', textAlign: 'center' }}>
              Customize: {customizingItem.name}
            </h3>

            {/* Custom Notes Section */}
            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                Item Notes / Instructions
              </label>
              <textarea
                placeholder="e.g. Extra spicy, no onions, well done..."
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                style={{
                  width: '100%',
                  height: '60px',
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none',
                  background: '#f8fafc',
                  color: '#1e293b',
                  resize: 'none'
                }}
              />
            </div>

            {/* Existing Addons Section */}
            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                Select Add-ons
              </label>
              
              <div style={{
                maxHeight: '120px', overflowY: 'auto', border: '1.5px solid #e2e8f0', 
                borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px',
                background: '#f8fafc'
              }}>
                {availableAddons.length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No add-ons available. Create one below!</span>
                ) : (
                  availableAddons.map(addon => {
                    const isChecked = tempAddons.some(a => a.name.toLowerCase() === addon.name.toLowerCase());
                    return (
                      <label key={addon.addon_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempAddons([...tempAddons, { name: addon.name, price: addon.price }]);
                            } else {
                              setTempAddons(tempAddons.filter(a => a.name.toLowerCase() !== addon.name.toLowerCase()));
                            }
                          }}
                          style={{ width: '16px', height: '16px', accentColor: '#0d6b5e' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>{addon.name}</span>
                          <span style={{ color: '#0d6b5e' }}>+{Number(addon.price).toFixed(3)} {currencySymbol}</span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Create New Addon Form (Directly inside terminal overlay/modal) */}
            <div style={{ textAlign: 'left', marginBottom: '1.5rem', background: '#f1f5f9', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                Create New Add-on (POS Terminal)
              </label>
              <div style={{ display: 'flex', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
                <input
                  type="text"
                  placeholder="Cheese, Sauce..."
                  value={newAddonName}
                  onChange={(e) => setNewAddonName(e.target.value)}
                  style={{
                    flex: '2 1 0%', minWidth: '0px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box'
                  }}
                />
                <input
                  type="number"
                  step="0.050"
                  placeholder="Price"
                  value={newAddonPrice}
                  onChange={(e) => setNewAddonPrice(e.target.value)}
                  style={{
                    flex: '1 1 0%', minWidth: '0px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => handleCreateAddon(e)}
                  style={{
                    flexShrink: 0, padding: '8px 12px', background: '#0d6b5e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                  }}
                >
                  Create
                </button>
              </div>
            </div>

            {/* Pricing Summary */}
            {(() => {
              const currentAddons = customizingItem.addons || [];
              const oldAddonCost = currentAddons.reduce((sum, a) => sum + Number(a.price), 0);
              const basePrice = Number(customizingItem.price) - oldAddonCost;
              const addonCost = tempAddons.reduce((sum, a) => sum + Number(a.price), 0);
              const totalPrice = basePrice + addonCost;

              return (
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
                  <span>Price Preview:</span>
                  <span>{totalPrice.toFixed(3)} {currencySymbol}</span>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowCustomizeModal(false);
                  setCustomizingItem(null);
                }}
                style={{
                  flex: 1, padding: '10px', background: '#f1f5f9', color: '#64748b',
                  border: '1.5px solid #cbd5e1', borderRadius: '8px', fontWeight: 700,
                  cursor: 'pointer', fontSize: '0.85rem'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomization}
                style={{
                  flex: 1, padding: '10px', background: '#0d6b5e', color: 'white',
                  border: 'none', borderRadius: '8px', fontWeight: 800,
                  cursor: 'pointer', fontSize: '0.85rem'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Cart;
