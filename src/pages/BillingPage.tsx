import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { CreditCard, ShieldCheck, Sparkles, AlertTriangle, ArrowRight, UserPlus, Shield, Store, Layers } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';

// Pricing details in USD matching the handwritten pricing rules
const PRICE_BRANCH_YEARLY_USD = 325.00;
const PRICE_COUNTER_YEARLY_USD = 160.00;
const PRICE_USER_YEARLY_USD = 160.00;
const PRICE_RENEW_BASE_USD = 650.00;

const BillingPage = () => {
  const [loading, setLoading] = useState(false);
  const [subStatus, setSubStatus] = useState<any>(null);

  // Upgrade slider/inputs state
  const [extraBranches, setExtraBranches] = useState(0);
  const [extraCounters, setExtraCounters] = useState(0);
  const [extraUsers, setExtraUsers] = useState(0);

  useEffect(() => {
    // Load Razorpay script dynamically
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    fetchSubStatus();

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchSubStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subscription/status');
      setSubStatus(res.data.data);
    } catch (e) {
      toast.error('Failed to load subscription status.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate pro-rata prices locally for display
  const remainingDays = subStatus?.remaining_days ?? 0;
  const proRataMultiplier = remainingDays / 365.0;

  const branchCost = extraBranches * PRICE_BRANCH_YEARLY_USD * proRataMultiplier;
  const counterCost = extraCounters * PRICE_COUNTER_YEARLY_USD * proRataMultiplier;
  const userCost = extraUsers * PRICE_USER_YEARLY_USD * proRataMultiplier;
  const totalUpgradeCost = branchCost + counterCost + userCost;

  const handleRenew = async () => {
    try {
      setLoading(true);
      const res = await api.post('/subscription/create-order', {
        action: 'renew'
      });
      const order = res.data.data;
      launchRazorpay(order.order_id, order.amount, 'renew');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate renewal order.');
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (extraBranches === 0 && extraCounters === 0 && extraUsers === 0) {
      return toast.warn('Please select at least one add-on item to upgrade.');
    }

    try {
      setLoading(true);
      const res = await api.post('/subscription/create-order', {
        action: 'upgrade',
        branches: extraBranches,
        counters: extraCounters,
        users: extraUsers
      });
      const order = res.data.data;
      launchRazorpay(order.order_id, order.amount, 'upgrade');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate upgrade order.');
      setLoading(false);
    }
  };

  const launchRazorpay = (orderId: string, amount: number, action: 'renew' | 'upgrade') => {
    const options = {
      key: subStatus?.razorpay_key_id || 'rzp_test_FaVgu5WGHfsLyG',
      amount: Math.round(amount * 100),
      currency: 'USD',
      name: 'Kitchen Management System (KMS)',
      description: action === 'renew' ? 'SaaS Subscription Renewal' : 'Upgrade Plan Add-on Limits',
      order_id: orderId,
      modal: {
        ondismiss: function () {
          setLoading(false);
        }
      },
      handler: async function (response: any) {
        try {
          setLoading(true);
          await api.post('/subscription/verify-payment', {
            order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          toast.success('Payment verified successfully! Limits updated.');
          setExtraBranches(0);
          setExtraCounters(0);
          setExtraUsers(0);
          fetchSubStatus();
        } catch (err: any) {
          toast.error('Failed to verify payment with signature.');
          setLoading(false);
        }
      },
      prefill: {
        name: 'Tenant Admin',
        email: 'admin@kms.com'
      },
      theme: {
        color: '#1e293b'
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', function (response: any) {
      toast.error('Payment checkout dismissed or failed: ' + response.error.description);
      setLoading(false);
    });
    rzp.open();
  };

  const limits = subStatus?.limits;

  return (
    <Layout title="Billing & Subscription Plans">
      <div className="billing-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {loading && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '10px' }}></div>
            <p style={{ fontWeight: 600, color: '#1e293b' }}>Processing Subscription Transaction...</p>
          </div>
        )}

        {/* Plan Summary Card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary, #1b4645) 0%, var(--primary-dark, #12302f) 100%)',
          color: 'white',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 10px 25px -5px rgba(27,70,69,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.15)', color: 'white', padding: '3px 8px', borderRadius: '20px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {subStatus?.plan || 'Enterprise'} Plan
              </span>
              <span style={{
                fontSize: '11px',
                background: subStatus?.status === 'Active' ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)',
                color: subStatus?.status === 'Active' ? '#34d399' : '#f87171',
                padding: '3px 8px',
                borderRadius: '20px',
                fontWeight: 700
              }}>
                {subStatus?.status?.toUpperCase() || 'ACTIVE'}
              </span>
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '12px 0 6px 0', color: 'white' }}>KMS Subscription Status</h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
              Your current yearly package expires on: <b style={{ color: 'white' }}>{subStatus?.plan_end_date ? new Date(subStatus.plan_end_date).toLocaleDateString() : 'N/A'}</b>
            </p>
          </div>

          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.08)', padding: '16px 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Time Remaining</span>
            <h3 style={{ fontSize: '32px', margin: '4px 0 0 0', fontWeight: 900, color: '#60a5fa' }}>{remainingDays} Days</h3>
            <button 
              onClick={handleRenew}
              style={{
                marginTop: '10px', background: 'white', color: 'var(--primary, #1b4645)', border: 'none',
                borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}
            >
              Renew Base Plan <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Limit Consumption & Upgrades Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
          
          {/* Active Limit Gauges */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>Resource Consumption</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#64748b' }}>Active resources configured relative to your subscription limits.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Branches Limit */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Store size={16} /> Kitchen Branches</span>
                  <span>{limits?.branches?.active} / {limits?.branches?.allowed} ({limits?.branches?.base} base + {limits?.branches?.extra} extra)</span>
                </div>
                <div style={{ background: '#f1f5f9', height: '10px', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{
                    background: 'var(--primary, #1b4645)', height: '100%',
                    width: `${Math.min(100, ((limits?.branches?.active ?? 0) / (limits?.branches?.allowed ?? 1)) * 100)}%`
                  }}></div>
                </div>
              </div>

              {/* POS Counters Limit */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Layers size={16} /> POS Registers</span>
                  <span>{limits?.counters?.active} / {limits?.counters?.allowed} ({limits?.counters?.base} base + {limits?.counters?.extra} extra)</span>
                </div>
                <div style={{ background: '#f1f5f9', height: '10px', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{
                    background: 'var(--primary, #1b4645)', height: '100%',
                    width: `${Math.min(100, ((limits?.counters?.active ?? 0) / (limits?.counters?.allowed ?? 1)) * 100)}%`
                  }}></div>
                </div>
              </div>

              {/* Users Limit */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><UserPlus size={16} /> Administrative Users</span>
                  <span>{limits?.users?.active} / {limits?.users?.allowed} ({limits?.users?.base} base + {limits?.users?.extra} extra)</span>
                </div>
                <div style={{ background: '#f1f5f9', height: '10px', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{
                    background: 'var(--primary, #1b4645)', height: '100%',
                    width: `${Math.min(100, ((limits?.users?.active ?? 0) / (limits?.users?.allowed ?? 1)) * 100)}%`
                  }}></div>
                </div>
              </div>

            </div>
          </div>

          {/* Add-on Plan Configurator */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>Add-on Plan Upgrade</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>Buy additional resources. Pricing is pro-rated for your remaining billing period.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '24px' }}>
              
              {/* Extra Branches */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px' }}>
                <div>
                  <h5 style={{ margin: 0, fontWeight: 700, color: '#334155' }}>Extra Branch Kitchen</h5>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Yearly: $325.00</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={() => setExtraBranches(b => Math.max(0, b - 1))} style={{ width: '32px', height: '32px', border: '1px solid #cbd5e1', borderRadius: '50%', background: 'white', cursor: 'pointer', fontWeight: 700 }}>-</button>
                  <span style={{ fontWeight: 800, minWidth: '20px', textAlign: 'center' }}>{extraBranches}</span>
                  <button onClick={() => setExtraBranches(b => b + 1)} style={{ width: '32px', height: '32px', border: '1px solid #cbd5e1', borderRadius: '50%', background: 'white', cursor: 'pointer', fontWeight: 700 }}>+</button>
                </div>
              </div>

              {/* Extra Counters */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px' }}>
                <div>
                  <h5 style={{ margin: 0, fontWeight: 700, color: '#334155' }}>Extra POS Register</h5>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Yearly: $160.00</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={() => setExtraCounters(c => Math.max(0, c - 1))} style={{ width: '32px', height: '32px', border: '1px solid #cbd5e1', borderRadius: '50%', background: 'white', cursor: 'pointer', fontWeight: 700 }}>-</button>
                  <span style={{ fontWeight: 800, minWidth: '20px', textAlign: 'center' }}>{extraCounters}</span>
                  <button onClick={() => setExtraCounters(c => c + 1)} style={{ width: '32px', height: '32px', border: '1px solid #cbd5e1', borderRadius: '50%', background: 'white', cursor: 'pointer', fontWeight: 700 }}>+</button>
                </div>
              </div>

              {/* Extra Users */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px' }}>
                <div>
                  <h5 style={{ margin: 0, fontWeight: 700, color: '#334155' }}>Extra User License</h5>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Yearly: $160.00</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={() => setExtraUsers(u => Math.max(0, u - 1))} style={{ width: '32px', height: '32px', border: '1px solid #cbd5e1', borderRadius: '50%', background: 'white', cursor: 'pointer', fontWeight: 700 }}>-</button>
                  <span style={{ fontWeight: 800, minWidth: '20px', textAlign: 'center' }}>{extraUsers}</span>
                  <button onClick={() => setExtraUsers(u => u + 1)} style={{ width: '32px', height: '32px', border: '1px solid #cbd5e1', borderRadius: '50%', background: 'white', cursor: 'pointer', fontWeight: 700 }}>+</button>
                </div>
              </div>

            </div>

            {/* Price Calculations */}
            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '15px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>
                <span>Remaining Time Factor:</span>
                <span>{remainingDays} / 365 Days ({proRataMultiplier.toFixed(3)})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: '#334155', fontWeight: 800 }}>
                <span>Amount to Pay Now:</span>
                <span style={{ color: 'var(--primary, #1b4645)' }}>${totalUpgradeCost.toFixed(2)} USD</span>
              </div>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={totalUpgradeCost <= 0}
              style={{
                width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                background: totalUpgradeCost > 0 ? 'var(--primary, #1b4645)' : '#cbd5e1',
                color: 'white', border: 'none', borderRadius: '10px', padding: '12px',
                fontWeight: 700, cursor: totalUpgradeCost > 0 ? 'pointer' : 'default', fontSize: '14px'
              }}
            >
              <CreditCard size={18} /> Purchase Upgrade
            </button>
          </div>

        </div>

      </div>
    </Layout>
  );
};

export default BillingPage;
