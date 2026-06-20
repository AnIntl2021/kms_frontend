import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ProductGrid from '../components/POS/ProductGrid';
import Cart from '../components/POS/Cart';
import { useLanguage } from '../hooks/useLanguage';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MapPin, Key, Wallet, X, Store } from 'lucide-react';
import './POSPage.css';

interface Product {
  id: number;
  name: string;
  name_ar?: string;
  price: number;
  category: string;
  image?: string;
  menu_item_id?: number;
}

interface CartItem extends Product {
  quantity: number;
}

const POSPage: React.FC = () => {
  const { t, language } = useLanguage();
  const { admin } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const [orderType, setOrderType] = useState<'walk_in' | 'takeaway' | 'delivery'>('walk_in');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

  const [branchName, setBranchName] = useState<string>('');
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  // Counter Session States
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [counters, setCounters] = useState<any[]>([]);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('0');
  const [selectedCounterId, setSelectedCounterId] = useState('');
  const [closingSummary, setClosingSummary] = useState<any | null>(null);
  const [actualCash, setActualCash] = useState('0');

  useEffect(() => {
    fetchProducts();
    if (selectedBranchId) {
      checkActiveSession(selectedBranchId);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    fetchBranches();
  }, [admin]);

  const checkActiveSession = async (branchId: number) => {
    try {
      const res = await api.get(`/subscription/counters/active-session?branch_id=${branchId}`);
      if (res.data.success && res.data.data) {
        setActiveSession(res.data.data);
        setShowOpenModal(false);
      } else {
        setActiveSession(null);
        setShowOpenModal(true);
        fetchBranchCounters(branchId);
      }
    } catch (e) {
      console.error('Failed to check active session', e);
    }
  };

  const fetchBranchCounters = async (branchId: number) => {
    try {
      const res = await api.get('/subscription/counters');
      if (res.data.success) {
        const filtered = (res.data.data || []).filter((c: any) => c.branch_id === branchId && c.status === 'active');
        setCounters(filtered);
        if (filtered.length > 0) {
          setSelectedCounterId(String(filtered[0].counter_id));
        } else {
          setSelectedCounterId('');
        }
      }
    } catch (e) {
      console.error('Failed to fetch counters', e);
    }
  };

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCounterId || !selectedBranchId) {
      return toast.warn('Please select a counter register.');
    }
    try {
      const res = await api.post('/subscription/counters/sessions/open', {
        counter_id: Number(selectedCounterId),
        branch_id: selectedBranchId,
        opening_balance: Number(openingBalance || 0)
      });
      if (res.data.success) {
        toast.success('POS Counter register opened successfully!');
        checkActiveSession(selectedBranchId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to open counter.');
    }
  };

  const handleRequestCloseSession = async () => {
    if (!activeSession) return;
    try {
      const res = await api.get(`/subscription/counters/sessions/${activeSession.session_id}/summary`);
      if (res.data.success) {
        setClosingSummary(res.data.data);
        setActualCash(String(res.data.data.sales.expected_cash));
        setShowCloseModal(true);
      }
    } catch (e) {
      toast.error('Failed to load shift summary.');
    }
  };

  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    try {
      const res = await api.post('/subscription/counters/sessions/close', {
        session_id: activeSession.session_id,
        closing_balance: Number(actualCash || 0)
      });
      if (res.data.success) {
        toast.success('Counter session closed successfully!');
        setShowCloseModal(false);
        setClosingSummary(null);
        if (selectedBranchId) {
          checkActiveSession(selectedBranchId);
        }
      }
    } catch (e) {
      toast.error('Failed to close counter session.');
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      if (response.data.success) {
        setBranches(response.data.data);
        if (admin?.branch_id) {
          setSelectedBranchId(admin.branch_id);
          const b = response.data.data.find((x: any) => x.branch_id === admin.branch_id);
          setBranchName(b ? b.name_en : `Branch ID: ${admin.branch_id}`);
        } else if (response.data.data.length > 0) {
          setSelectedBranchId(response.data.data[0].branch_id);
          setBranchName(response.data.data[0].name_en);
        } else {
          setBranchName('Main / Master Branch');
        }
      }
    } catch (e) {
      setBranchName('Main / Master Branch');
    }
  };

  const fetchProducts = async () => {
    try {
      const url = selectedBranchId ? `/menu?branch_id=${selectedBranchId}&pos=true` : '/menu?pos=true';
      const response = await api.get(url);
      if (response.data.success) {
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace('/api', '');
        const mapped: Product[] = response.data.data
          .map((item: any) => {
            const cleanPath = item.image_url ? (item.image_url.startsWith('/') ? item.image_url.slice(1) : item.image_url) : '';
            return {
              id: item.menu_item_id,
              menu_item_id: item.menu_item_id,
              name: item.name_en,
              name_ar: item.name_ar,
              price: item.price,
              category: item.category_name || 'Uncategorized',
              image: item.image_url ? `${baseUrl}/${cleanPath}` : undefined
            };
          });
        setProducts(mapped);
      }
    } catch (e) {
      console.error('Failed to load menu items', e);
    }
  };

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const handleAddToCart = (product: Product) => {
    if (!activeSession) {
      return toast.warn('Please open a counter shift first.');
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <Layout>
      <div className="pos-container fade-in">
        
        {/* Left Side: Products */}
        <div className="pos-menu-section">
          
          <div style={{ padding: '0.75rem 1.5rem', background: '#e0f2fe', color: '#0369a1', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #bae6fd' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} /> Current Location: 
              {!admin?.branch_id && branches.length > 0 ? (
                <select 
                  value={selectedBranchId || ''} 
                  onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                  style={{ marginLeft: '10px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #7dd3fc', background: '#fff', color: '#0369a1', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
                >
                  {branches.map(b => (
                    <option key={b.branch_id} value={b.branch_id}>{b.name_en}</option>
                  ))}
                </select>
              ) : (
                branchName
              )}
              {activeSession && (
                <span style={{ marginLeft: '15px', background: 'var(--primary, #1b4645)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                  REGISTER: {activeSession.counter_name} (OPEN)
                </span>
              )}
            </div>
            {activeSession && (
              <button 
                onClick={handleRequestCloseSession}
                style={{
                  background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px',
                  padding: '5px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(239,68,68,0.2)', transition: 'background 0.2s'
                }}
              >
                Close Counter
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="pos-categories">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`pos-category-btn ${selectedCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          {/* Product Grid */}
          <div className="pos-product-grid">
            <ProductGrid products={filteredProducts} onAddToCart={handleAddToCart} />
          </div>
        </div>

        {/* Right Side: Cart */}
        <div className="pos-cart-section">
          <Cart 
            items={cart} 
            updateQuantity={updateQuantity} 
            removeItem={removeItem} 
            clearCart={clearCart}
            orderType={orderType}
            setOrderType={setOrderType}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            branchId={selectedBranchId || admin?.branch_id}
            counterId={activeSession?.counter_id}
          />
        </div>

        {/* Open Counter Modal (Shift Opening) */}
        {showOpenModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(5px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
            <div style={{
              background: 'white', borderRadius: '16px', width: '100%', maxWidth: '440px',
              padding: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0', textAlign: 'center'
            }}>
              <div style={{ display: 'inline-flex', background: '#e0f2fe', color: '#0284c7', padding: '16px', borderRadius: '50%', marginBottom: '20px' }}>
                <Key size={32} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Open Register Counter</h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
                A register shift must be opened to process orders at this branch kitchen.
              </p>

              {counters.length === 0 ? (
                <div style={{ margin: '20px 0', padding: '16px', border: '1px dashed #cbd5e1', borderRadius: '12px', background: '#f8fafc' }}>
                  <Store size={24} style={{ color: '#94a3b8', marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', fontWeight: 600 }}>No active registers configured</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                    Please add a counter under <Link to="/settings/counters" style={{ color: 'var(--primary, #1b4645)', textDecoration: 'underline', fontWeight: 600 }}>POS Counters</Link> first.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleOpenSession} style={{ textAlign: 'left' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>SELECT TERMINAL REGISTER</label>
                    <select
                      value={selectedCounterId}
                      onChange={(e) => setSelectedCounterId(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                      required
                    >
                      {counters.map(c => (
                        <option key={c.counter_id} value={c.counter_id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>OPENING CASH IN HAND (KWD)</label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder="0.000"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%', padding: '14px', background: 'var(--primary, #1b4645)', color: 'white',
                      border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '15px'
                    }}
                  >
                    Open Counter Shift
                  </button>
                </form>
              )}

              <button
                onClick={() => window.history.back()}
                style={{
                  marginTop: '15px', background: 'none', border: 'none', color: '#64748b',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline'
                }}
              >
                Go Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Close Counter Modal (Shift Summary) */}
        {showCloseModal && closingSummary && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(5px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
            <div style={{
              background: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px',
              padding: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Close Counter Shift</h3>
                <button onClick={() => setShowCloseModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Active Terminal</span>
                <h4 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>{closingSummary.session.counter_name}</h4>
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  Opened At: {new Date(closingSummary.session.opened_at).toLocaleString()}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', fontSize: '14px', color: '#475569' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                  <span>Opening Cash:</span>
                  <span style={{ fontWeight: 700 }}>{Number(closingSummary.sales.opening_balance).toFixed(3)} KWD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                  <span>Cash Sales (Total):</span>
                  <span style={{ fontWeight: 700 }}>+{Number(closingSummary.sales.cash_sales).toFixed(3)} KWD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                  <span>Card Sales (Total):</span>
                  <span style={{ fontWeight: 700 }}>{Number(closingSummary.sales.card_sales).toFixed(3)} KWD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '8px', color: '#0f172a' }}>
                  <span style={{ fontWeight: 700 }}>Expected Drawer Cash:</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary, #1b4645)', fontSize: '16px' }}>{Number(closingSummary.sales.expected_cash).toFixed(3)} KWD</span>
                </div>
              </div>

              <form onSubmit={handleCloseSession}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>ACTUAL ENDING DRAWER CASH (KWD)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCloseModal(false)}
                    style={{
                      flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569',
                      border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1, padding: '12px', background: '#ef4444', color: 'white',
                      border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    Close Shift
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default POSPage;
