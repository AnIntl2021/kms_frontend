import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Store, Plus, Trash2, Key, HelpCircle, Wallet, Edit2 } from 'lucide-react';
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

  // Edit Form State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCounterId, setEditingCounterId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [selectedEditBranch, setSelectedEditBranch] = useState('');
  const [editStatus, setEditStatus] = useState('active');

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

  const handleEditClick = (counter: any) => {
    setEditingCounterId(counter.counter_id);
    setEditName(counter.name);
    setSelectedEditBranch(String(counter.branch_id));
    setEditStatus(counter.status || 'active');
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !selectedEditBranch) {
      return toast.warn('Please fill in all fields.');
    }

    try {
      await api.put(`/subscription/counters/${editingCounterId}`, {
        name: editName,
        branch_id: Number(selectedEditBranch),
        status: editStatus
      });
      toast.success('POS Counter updated successfully.');
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update counter.';
      toast.error(msg);
    }
  };

  const activeCount = subStatus?.limits?.counters?.active ?? counters.length;
  const allowedCount = subStatus?.limits?.counters?.allowed ?? 1;

  return (
    <Layout title="POS Counters Management">
      <style>{`
        .counter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          margin-top: 24px;
        }
        .counter-card {
          background: white;
          border-radius: 18px;
          padding: 28px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 200px;
        }
        .counter-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03);
          border-color: var(--primary, #1b4645);
        }
        .counter-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: var(--primary, #1b4645);
          opacity: 0.8;
        }
        .counter-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .counter-card-title {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
        .counter-card-branch {
          font-size: 13px;
          color: #64748b;
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .counter-status-badge {
          padding: 6px 12px;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.5px;
        }
        .counter-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #f1f5f9;
          padding-top: 20px;
          margin-top: 24px;
        }
        .counter-delete-btn {
          color: #94a3b8;
          background: none;
          border: none;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .counter-delete-btn:hover {
          color: #ef4444;
          background: #fef2f2;
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="pos-counters-container" style={{ padding: '24px 30px' }}>
        
        {/* Header Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          
          {/* Status card */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary, #1b4645) 0%, var(--primary-dark, #12302f) 100%)',
            color: 'white',
            borderRadius: '16px',
            padding: '28px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(27,70,69,0.15)'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.7, fontWeight: 700 }}>Subscription Limit</span>
              <h2 style={{ fontSize: '42px', fontWeight: 855, margin: '8px 0 4px 0', color: 'white' }}>{activeCount} / {allowedCount}</h2>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.8, fontWeight: 500 }}>POS Counters currently active</p>
              
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
            padding: '28px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '18px' }}>
              <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '12px', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HelpCircle size={26} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>What is a POS Counter?</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                  A POS Counter represents a cash register or checkout register in your restaurant branch. Orders and transactions are bound to the specific counter they are processed from.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 855, color: '#0f172a' }}>Active Registers</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Configure and link cashier terminals to kitchen locations.</p>
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
              background: 'var(--primary, #1b4645)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(27, 70, 69, 0.2)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#12302f';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'var(--primary, #1b4645)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <Plus size={18} /> Add Register Terminal
          </button>
        </div>

        {/* Grid List Section */}
        {loading ? (
          <div style={{ padding: '80px', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ margin: '0 auto 15px', width: '36px', height: '36px', border: '3px solid #f1f5f9', borderTopColor: 'var(--primary, #1b4645)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ color: '#64748b', fontWeight: 600 }}>Loading registers...</p>
          </div>
        ) : counters.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', border: '2px dashed #cbd5e1', borderRadius: '16px', background: 'white' }}>
            <Store size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
            <h4 style={{ margin: '0 0 6px 0', color: '#334155', fontSize: '18px', fontWeight: 800 }}>No Registers Found</h4>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b', maxWidth: '380px', marginInline: 'auto', lineHeight: 1.5 }}>
              Create your first kitchen cash register terminal to begin logging point of sales orders.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'var(--primary, #1b4645)', color: 'white', border: 'none', borderRadius: '8px',
                padding: '10px 20px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Add Counter
            </button>
          </div>
        ) : (
          <div className="counter-grid">
            {counters.map((c) => (
              <div key={c.counter_id} className="counter-card">
                <div className="counter-card-header">
                  <div>
                    <h4 className="counter-card-title">{c.name}</h4>
                    <div className="counter-card-branch">
                      <Store size={14} />
                      {language === 'ar' ? (c.branch_name_ar || c.branch_name_en) : c.branch_name_en}
                    </div>
                  </div>
                  <span className="counter-status-badge" style={{
                    background: c.status === 'active' ? '#def7ec' : '#fde8e8',
                    color: c.status === 'active' ? '#03543f' : '#9b1c1c'
                  }}>
                    {c.status.toUpperCase()}
                  </span>
                </div>

                <div className="counter-card-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
                    <Key size={14} />
                    Terminal ID: #{c.counter_id}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={() => handleEditClick(c)}
                      className="counter-edit-btn"
                      title="Edit Terminal"
                      style={{
                        color: '#94a3b8',
                        background: 'none',
                        border: 'none',
                        padding: '8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary, #1b4645)'; e.currentTarget.style.background = '#f1f5f9'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none'; }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(c.counter_id)}
                      className="counter-delete-btn"
                      title="Remove Terminal"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Counter Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(5px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }} onClick={() => setShowAddModal(false)}>
            <div style={{
              background: 'white', borderRadius: '16px', width: '100%', maxWidth: '460px',
              padding: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0', animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Add POS Terminal Register</h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>Link a new cashier terminal station to one of your kitchen branches.</p>
              
              <form onSubmit={handleCreate}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Terminal Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Front Cashier, Counter Station A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '8px',
                      border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: 500
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '28px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Linked Kitchen Branch</label>
                  <select 
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '8px',
                      border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: 500, background: 'white'
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

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569',
                      border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    style={{
                      flex: 1, padding: '12px', background: 'var(--primary, #1b4645)', color: 'white',
                      border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px'
                    }}
                  >
                    Create Terminal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Counter Modal */}
        {showEditModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(5px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }} onClick={() => setShowEditModal(false)}>
            <div style={{
              background: 'white', borderRadius: '16px', width: '100%', maxWidth: '460px',
              padding: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0', animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Edit POS Terminal Register</h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>Update the cashier terminal register settings and status.</p>
              
              <form onSubmit={handleUpdate}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Terminal Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Front Cashier, Counter Station A"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '8px',
                      border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: 500
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Linked Kitchen Branch</label>
                  <select 
                    value={selectedEditBranch}
                    onChange={(e) => setSelectedEditBranch(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '8px',
                      border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: 500, background: 'white'
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

                <div style={{ marginBottom: '28px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>Terminal Status</label>
                  <select 
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '8px',
                      border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: 500, background: 'white'
                    }}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    style={{
                      flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569',
                      border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    style={{
                      flex: 1, padding: '12px', background: 'var(--primary, #1b4645)', color: 'white',
                      border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '14px'
                    }}
                  >
                    Save Changes
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
