import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ProductGrid from '../components/POS/ProductGrid';
import Cart from '../components/POS/Cart';
import { useLanguage } from '../hooks/useLanguage';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MapPin, Key, X, Store, Search } from 'lucide-react';
import Select from 'react-select';
import './POSPage.css';

const tableOptions = Array.from({ length: 20 }, (_, i) => ({
  value: `Table-${i + 1}`,
  label: `Table ${i + 1}`
}));

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
  const [tableCarts, setTableCarts] = useState<Record<string, CartItem[]>>({});
  const [tableNumber, setTableNumber] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [orderType, setOrderType] = useState<'walk_in' | 'takeaway' | 'delivery'>('walk_in');
  const cartKey = orderType === 'walk_in' && tableNumber ? tableNumber : 'default';
  const cart = tableCarts[cartKey] || [];
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['cash', 'card']);

  const [branchName, setBranchName] = useState<string>('');
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  // Customer states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const fetchCustomerSuggestions = async (inputValue: string) => {
    if (!inputValue || inputValue.length < 2) {
      setCustomerSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const res = await api.get(`/sales/customers/search?q=${inputValue}`);
      if (res.data.success && res.data.data) {
        const formatted = res.data.data.map((c: any) => ({
          label: `${c.customer_name} (${c.client_phone || 'No Phone'})`,
          value: c
        }));
        setCustomerSuggestions(formatted);
      }
    } catch (e) {
      console.error('Failed to search customers', e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data && res.data.data && res.data.data.pos_payment_methods) {
          const methods = res.data.data.pos_payment_methods.split(',').map((x: string) => x.trim()).filter(Boolean);
          if (methods.length > 0) {
            setPaymentMethods(methods);
            setPaymentMethod(methods[0]);
          }
        }
      } catch (e) {
        console.error('Failed to fetch payment settings', e);
      }
    };
    fetchSettings();
  }, []);

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
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
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
    if (orderType === 'walk_in' && !tableNumber) {
      return toast.warn('Please select a table first.');
    }
    const cartKey = orderType === 'walk_in' && tableNumber ? tableNumber : 'default';
    setTableCarts(prev => {
      const currentCart = prev[cartKey] || [];
      const existing = currentCart.find(item => item.id === product.id);
      let updatedCart;
      if (existing) {
        updatedCart = currentCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        updatedCart = [...currentCart, { ...product, quantity: 1 }];
      }
      return { ...prev, [cartKey]: updatedCart };
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    const cartKey = orderType === 'walk_in' && tableNumber ? tableNumber : 'default';
    setTableCarts(prev => {
      const currentCart = prev[cartKey] || [];
      const updatedCart = currentCart.map(item => {
        if (item.id === id) {
          const newQ = item.quantity + delta;
          return newQ > 0 ? { ...item, quantity: newQ } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
      return { ...prev, [cartKey]: updatedCart };
    });
  };

  const removeItem = (id: number) => {
    const cartKey = orderType === 'walk_in' && tableNumber ? tableNumber : 'default';
    setTableCarts(prev => {
      const currentCart = prev[cartKey] || [];
      const updatedCart = currentCart.filter(item => item.id !== id);
      return { ...prev, [cartKey]: updatedCart };
    });
  };

  const clearCart = () => {
    const cartKey = orderType === 'walk_in' && tableNumber ? tableNumber : 'default';
    setTableCarts(prev => ({ ...prev, [cartKey]: [] }));
  };

  const filteredProducts = (() => {
    let list = selectedCategory === 'All' ? products : products.filter(p => p.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q)));
    }
    return list;
  })();

  return (
    <Layout>
      <div className="pos-container fade-in">
        
        {/* Left Side: Products */}
        <div className="pos-menu-section">
          
          {/* Top Header: Branch + Session */}
          <div className="pos-menu-header-strip">
            <div className="pos-location-selector">
              <MapPin size={16} />
              {!admin?.branch_id && branches.length > 0 ? (
                <select
                  value={selectedBranchId || ''}
                  onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                  className="pos-location-select"
                >
                  {branches.map(b => (
                    <option key={b.branch_id} value={b.branch_id}>{b.name_en}</option>
                  ))}
                </select>
              ) : (
                <span style={{ color: 'var(--pos-teal, #0d6b5e)', fontWeight: 800 }}>{branchName}</span>
              )}
              {activeSession && (
                <span className="pos-session-badge">
                  {activeSession.counter_name} · OPEN
                </span>
              )}
            </div>
            {activeSession && (
              <button onClick={handleRequestCloseSession} className="pos-close-counter-btn">
                Close Counter
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="pos-search-wrap">
            <div className="pos-search-inner">
              <Search size={16} className="pos-search-icon" />
              <input
                type="text"
                placeholder="Search Items here..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Order Configuration Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '10px 20px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            alignItems: 'center'
          }}>
            {/* Order Type Buttons */}
            <div style={{ display: 'flex', background: '#f0f4f8', padding: '3px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              {(['walk_in', 'takeaway', 'delivery'] as const).map((type) => {
                const isActive = orderType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setOrderType(type)}
                    style={{
                      border: 'none',
                      background: isActive ? '#ffffff' : 'transparent',
                      color: isActive ? '#0d6b5e' : '#64748b',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    {type === 'walk_in' ? 'Dine In' : type === 'takeaway' ? 'Takeaway' : 'Delivery'}
                  </button>
                );
              })}
            </div>

            {/* Table Selector */}
            {orderType === 'walk_in' && (
              <div style={{ minWidth: '150px' }}>
                <Select
                  options={tableOptions}
                  value={tableOptions.find(opt => opt.value === tableNumber) || null}
                  onChange={(val: any) => setTableNumber(val ? val.value : '')}
                  placeholder="Select Table..."
                  isSearchable
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '8px',
                      borderColor: '#cbd5e1',
                      fontSize: '0.8rem',
                      minHeight: '32px'
                    })
                  }}
                />
              </div>
            )}

            {/* Customer Search & Details */}
            <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '300px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <Select
                  placeholder="Search customer..."
                  onInputChange={(val) => {
                    if (val.length >= 2) {
                      fetchCustomerSuggestions(val);
                    }
                  }}
                  onChange={(opt: any) => {
                    if (opt && opt.value) {
                      setCustomerName(opt.value.customer_name);
                      setCustomerPhone(opt.value.client_phone || '');
                    }
                  }}
                  options={customerSuggestions}
                  isLoading={loadingSuggestions}
                  isClearable
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '8px',
                      borderColor: '#cbd5e1',
                      fontSize: '0.8rem',
                      minHeight: '32px'
                    })
                  }}
                />
              </div>
              <input
                type="text"
                placeholder="Cust. Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{
                  width: '100px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.8rem',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              />
              <input
                type="text"
                placeholder="Phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{
                  width: '100px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.8rem',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              />
            </div>
          </div>

          {/* Category Tabs */}
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

          {/* Section label */}
          <div className="pos-items-label">Choose Items</div>

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
            paymentMethods={paymentMethods}
            branchId={selectedBranchId || admin?.branch_id}
            counterId={activeSession?.counter_id}
            tableNumber={tableNumber}
            setTableNumber={setTableNumber}
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
          />
        </div>

        {/* Open Counter Modal — Clean Light Theme */}
        {showOpenModal && (
          <div className="pos-modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 30, 40, 0.55)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
            <div className="pos-modal-box" style={{
              background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '420px',
              padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(13,107,94,0.1)',
              border: '1px solid #e2e8f0', textAlign: 'center'
            }}>
              <div style={{
                display: 'inline-flex', background: '#e6f4f2', color: '#0d6b5e',
                padding: '16px', borderRadius: '50%', marginBottom: '1rem',
                boxShadow: '0 4px 12px rgba(13,107,94,0.15)'
              }}>
                <Key size={28} />
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 800, color: '#1a2332' }}>Open Counter Register</h3>
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.875rem', color: '#6b7a8d', lineHeight: 1.6 }}>
                Open a shift to start processing orders at this branch.
              </p>

              {counters.length === 0 ? (
                <div style={{ margin: '16px 0', padding: '1rem', border: '1.5px dashed #b2dbd6', borderRadius: '12px', background: '#f0f9f7' }}>
                  <Store size={22} style={{ color: '#0d6b5e', marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#0d6b5e', fontWeight: 600 }}>No active registers configured</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '0.78rem', color: '#6b7a8d' }}>
                    Add a counter under <Link to="/pos-counters" style={{ color: '#0d6b5e', fontWeight: 700, textDecoration: 'underline' }}>POS Counters</Link>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleOpenSession} style={{ textAlign: 'left' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#6b7a8d', marginBottom: '5px', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Select Terminal</label>
                    <select
                      value={selectedCounterId}
                      onChange={(e) => setSelectedCounterId(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 600, outline: 'none', fontFamily: 'Inter, sans-serif', background: '#f0f4f8', color: '#1a2332', cursor: 'pointer' }}
                      required
                    >
                      {counters.map(c => (<option key={c.counter_id} value={c.counter_id}>{c.name}</option>))}
                    </select>
                  </div>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#6b7a8d', marginBottom: '5px', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Opening Cash (KWD)</label>
                    <input
                      type="number" step="0.001" placeholder="0.000" value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none', fontFamily: 'Inter, sans-serif', background: '#f0f4f8', color: '#1a2332' }}
                      required
                    />
                  </div>
                  <button type="submit" style={{ width: '100%', padding: '12px', background: '#0d6b5e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem', letterSpacing: '0.03em', boxShadow: '0 4px 14px rgba(13,107,94,0.25)', fontFamily: 'Inter, sans-serif' }}>
                    Open Counter Shift
                  </button>
                </form>
              )}
              <button onClick={() => window.history.back()} style={{ marginTop: '0.875rem', background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Inter, sans-serif' }}>
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* Close Counter Modal — Clean Light Theme */}
        {showCloseModal && closingSummary && (
          <div className="pos-modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 30, 40, 0.55)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
            <div className="pos-modal-box" style={{
              background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '460px',
              padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1a2332' }}>Close Counter Shift</h3>
                <button onClick={() => setShowCloseModal(false)} style={{ background: '#f0f4f8', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#6b7a8d', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Terminal Info */}
              <div style={{ background: '#e6f4f2', padding: '0.875rem 1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid #b2dbd6' }}>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#0d6b5e', fontWeight: 800, letterSpacing: '0.08em' }}>Active Terminal</span>
                <h4 style={{ margin: '3px 0 0 0', fontSize: '1rem', fontWeight: 800, color: '#0d6b5e' }}>{closingSummary.session.counter_name}</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#6b7a8d' }}>Opened: {new Date(closingSummary.session.opened_at).toLocaleString()}</p>
              </div>

              {/* Sales rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: '#f0f4f8', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.85rem', color: '#6b7a8d', fontWeight: 600 }}>Opening Cash</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1a2332' }}>{Number(closingSummary.sales.opening_balance).toFixed(3)} KWD</span>
                </div>
                {(closingSummary.sales.breakdown || []).map((b: any) => (
                  <div key={b.method} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0.75rem', background: '#f0f4f8', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.85rem', color: '#6b7a8d', fontWeight: 600, textTransform: 'capitalize' }}>{b.method} Sales</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1a2332' }}>{Number(b.amount).toFixed(3)} KWD</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#e6f4f2', borderRadius: '10px', border: '1.5px solid #b2dbd6', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a2332' }}>Expected Cash</span>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#0d6b5e' }}>{Number(closingSummary.sales.expected_cash).toFixed(3)} KWD</span>
                </div>
              </div>

              <form onSubmit={handleCloseSession}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#6b7a8d', marginBottom: '5px', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Actual Ending Cash (KWD)</label>
                  <input type="number" step="0.001" value={actualCash} onChange={(e) => setActualCash(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 700, outline: 'none', fontFamily: 'Inter, sans-serif', background: '#f0f4f8', color: '#1a2332' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button type="button" onClick={() => setShowCloseModal(false)}
                    style={{ flex: 1, padding: '11px', background: '#f0f4f8', color: '#6b7a8d', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
                    Cancel
                  </button>
                  <button type="submit"
                    style={{ flex: 1, padding: '11px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 12px rgba(220,38,38,0.2)' }}>
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
