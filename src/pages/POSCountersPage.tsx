import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Store, Plus, Trash2, Key, HelpCircle, Wallet } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useLanguage } from '../hooks/useLanguage';
import { Link } from 'react-router-dom';

const POSCountersPage = () => {
  const { t, language } = useLanguage();
  const [counters, setCounters] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [subStatus, setSubStatus] = useState<any>(null);

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      try {
        const subRes = await api.get('/subscription/status');
        setSubStatus(subRes.data.data || null);
      } catch (e) {
        console.error('Failed to load subscription status', e);
      }

      try {
        const brnchRes = await api.get('/branches');
        setBranches(brnchRes.data.data || []);
      } catch (e) {
        console.error('Failed to load branches', e);
      }

      try {
        const cntsRes = await api.get('/subscription/counters');
        setCounters(cntsRes.data.data || []);
      } catch (e) {
        console.error('Failed to load POS counter data', e);
        toast.error('Failed to load POS counter data.');
      }
    } catch (e: any) {
      console.error('Failed to fetch data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedBranch) {
      return toast.warn('Please fill in all fields.');
    }

    try {
      await api.post('/subscription/counters', {
        name,
        branch_id: Number(selectedBranch)
      });
      toast.success('POS Counter created successfully.');
      setName('');
      setSelectedBranch('');
      setShowAddModal(false);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create counter.';
      toast.error(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this POS counter register?')) return;
    try {
      await api.delete(`/subscription/counters/${id}`);
      toast.success('POS Counter register removed.');
      fetchData();
    } catch (e) {
      toast.error('Failed to delete counter register.');
    }
  };

  const activeCount = subStatus?.limits?.counters?.active ?? counters.length;
  const allowedCount = subStatus?.limits?.counters?.allowed ?? 1;

  return (
    <Layout title="POS Counters Management">
      <div className="pos-counters-container" style={{ padding: '20px' }}>
        
        {/* Header Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          
          {/* Status card */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary, #1b4645) 0%, var(--primary-dark, #12302f) 100%)',
            color: 'white',
            borderRadius: '16px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(27,70,69,0.15)'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>Subscription Limit</span>
              <h2 style={{ fontSize: '36px', fontWeight: 800, margin: '8px 0 4px 0', color: 'white' }}>{activeCount} / {allowedCount}</h2>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>POS Counters currently active</p>
              
              {activeCount >= allowedCount && (
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', background: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '4px', fontWeight: 700 }}>LIMIT REACHED</span>
                  <Link to="/billing" style={{ fontSize: '12px', color: '#60a5fa', textDecoration: 'underline', fontWeight: 600 }}>Upgrade Limit</Link>
                </div>
              )}
            </div>
            <Store size={140} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05, color: 'white' }} />
          </div>

          {/* Quick info card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
              <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '12px', color: '#2563eb' }}>
                <HelpCircle size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>What is a POS Counter?</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                  A POS Counter represents a cash register or checkout register in your restaurant branch. Orders and transactions are bound to the specific counter they are processed from.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
          border: '1px solid #f1f5f9',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>Active Registers</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Overview of cash registers configured in your kitchen branches.</p>
            </div>
            <button 
              onClick={() => {
                if (activeCount >= allowedCount) {
                  toast.error(`Limit reached! You can configure up to ${allowedCount} POS counters. Upgrade your plan to add more.`);
                } else {
                  setShowAddModal(true);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--primary, #2563eb)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 16px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Plus size={16} /> Add Register
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 15px', width: '30px', height: '30px', border: '3px solid #f1f5f9', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ color: '#64748b' }}>Loading counters...</p>
            </div>
          ) : counters.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
              <Store size={40} style={{ color: '#cbd5e1', marginBottom: '10px' }} />
              <h4 style={{ margin: '0 0 4px 0', color: '#475569' }}>No POS Counters Configured</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Create your first register to enable POS transaction logging.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>
                    <th style={{ padding: '12px 16px' }}>Counter Name</th>
                    <th style={{ padding: '12px 16px' }}>Linked Branch</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {counters.map((c) => (
                    <tr key={c.counter_id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '14px', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px', fontWeight: 600, color: '#1e293b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Key size={16} color="#64748b" />
                          {c.name}
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#475569' }}>
                        {language === 'ar' ? (c.branch_name_ar || c.branch_name_en) : c.branch_name_en}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: c.status === 'active' ? '#e6f4ea' : '#fce8e6',
                          color: c.status === 'active' ? '#137333' : '#c5221f'
                        }}>
                          {c.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleDelete(c.counter_id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Counter Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999
          }} onClick={() => setShowAddModal(false)}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              animation: 'scaleIn 0.2s ease-out'
            }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>Add POS Register</h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>Link a new cash register terminal to a branch kitchen.</p>
              
              <form onSubmit={handleCreate}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Register Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Cashier 1, Counter B"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Kitchen Branch</label>
                  <select 
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px'
                    }}
                    required
                  >
                    <option value="">Select a Branch</option>
                    {branches.map(b => (
                      <option key={b.branch_id} value={b.branch_id}>
                        {language === 'ar' ? (b.name_ar || b.name_en) : b.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      background: '#f1f5f9',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontWeight: 600,
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    style={{
                      background: 'var(--primary, #2563eb)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      fontWeight: 600,
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    Create
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

export default POSCountersPage;
