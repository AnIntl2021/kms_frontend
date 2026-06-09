import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { Plus, Trash2, Wallet, TrendingUp, Calendar, AlertOctagon, FileText, X } from 'lucide-react';

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState('Other Expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const fetchExpenses = async () => {
    try {
      const res = await api.get('/expenses');
      setExpenses(res.data.data || []);
    } catch (e) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expenses', {
        type, category, amount: Number(amount), expense_date: expenseDate, description
      });
      toast.success('Expense logged successfully');
      setShowModal(false);
      fetchExpenses();
      
      setCategory('');
      setAmount('');
      setDescription('');
    } catch (e) {
      toast.error('Failed to save expense');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted');
      fetchExpenses();
    } catch (e) {
      toast.error('Failed to delete expense');
    }
  };

  // KPI Calculations
  const totalExpensesLogged = expenses.length;
  const totalSpend = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthSpend = expenses
    .filter(exp => {
      const d = new Date(exp.expense_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

  const averageExpense = totalExpensesLogged > 0 ? (totalSpend / totalExpensesLogged) : 0;

  return (
    <Layout title="Operational Expenses">
      <div className="assets-management-container">
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 900, color: '#1e293b' }}>Operational Expenses</h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '0.5rem' }}>Track marketing, rent, and other operational costs.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(4, 120, 87, 0.2)' }}>
            <Plus size={20} /> Log New Expense
          </button>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card glass-panel" style={{ background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)', border: '1px solid #fecdd3' }}>
            <div className="kpi-icon-wrapper" style={{ background: '#fecdd3', color: '#e11d48' }}>
              <Wallet size={24} />
            </div>
            <div className="kpi-details">
              <span className="kpi-label" style={{ color: '#9f1239' }}>Total Historical Spend</span>
              <h3 className="kpi-value" style={{ color: '#be123c' }}>{totalSpend.toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})} د.ك</h3>
            </div>
          </div>

          <div className="kpi-card glass-panel" style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe' }}>
            <div className="kpi-icon-wrapper" style={{ background: '#bfdbfe', color: '#2563eb' }}>
              <TrendingUp size={24} />
            </div>
            <div className="kpi-details">
              <span className="kpi-label" style={{ color: '#1e40af' }}>Spend This Month</span>
              <h3 className="kpi-value" style={{ color: '#1d4ed8' }}>{thisMonthSpend.toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})} د.ك</h3>
            </div>
          </div>

          <div className="kpi-card glass-panel" style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', border: '1px solid #e2e8f0' }}>
            <div className="kpi-icon-wrapper" style={{ background: '#e2e8f0', color: '#475569' }}>
              <AlertOctagon size={24} />
            </div>
            <div className="kpi-details">
              <span className="kpi-label" style={{ color: '#475569' }}>Average Expense Size</span>
              <h3 className="kpi-value" style={{ color: '#334155' }}>{averageExpense.toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})} د.ك</h3>
            </div>
          </div>

          <div className="kpi-card glass-panel" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0' }}>
            <div className="kpi-icon-wrapper" style={{ background: '#bbf7d0', color: '#16a34a' }}>
              <FileText size={24} />
            </div>
            <div className="kpi-details">
              <span className="kpi-label" style={{ color: '#166534' }}>Total Expenses Logged</span>
              <h3 className="kpi-value" style={{ color: '#15803d' }}>{totalExpensesLogged} Records</h3>
            </div>
          </div>
        </div>

        {/* Data Grid */}
        <div className="glass-panel" style={{ marginTop: '2rem', padding: '2rem', borderRadius: '24px', background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Expense Ledger</h2>
          
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Loading expenses...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>DATE</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>CATEGORY</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>AMOUNT</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>DESCRIPTION</th>
                    <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px', textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                        No expenses logged. Click "Log New Expense" to start.
                      </td>
                    </tr>
                  ) : (
                    expenses.map(exp => (
                      <tr key={exp.expense_id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                        <td style={{ padding: '1rem', color: '#475569', fontWeight: 500 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={14} className="text-slate-400" />
                            {new Date(exp.expense_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ background: '#f1f5f9', color: '#334155', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                            {exp.category}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: '#e11d48', fontWeight: 800 }}>
                          {Number(exp.amount).toFixed(3)} د.ك
                        </td>
                        <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                          {exp.description || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>No description provided</span>}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button 
                            onClick={() => handleDelete(exp.expense_id)}
                            style={{ background: '#fff1f2', border: 'none', color: '#e11d48', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#ffe4e6'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#fff1f2'}
                            title="Delete Expense"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Glassmorphism Modal */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              
              <div style={{ background: '#f8fafc', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 800, fontSize: '1.25rem' }}>Log New Expense</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'white', border: '1px solid #e2e8f0', color: '#64748b', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddExpense} style={{ padding: '2rem' }}>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: 600, fontSize: '0.9rem' }}>Date</label>
                  <input 
                    type="date" 
                    value={expenseDate} 
                    onChange={e => setExpenseDate(e.target.value)} 
                    style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '12px', background: '#f8fafc', fontSize: '1rem', color: '#1e293b', boxSizing: 'border-box' }}
                    required 
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: 600, fontSize: '0.9rem' }}>Category</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Marketing / CAC, Rent, Utilities" 
                    value={category} 
                    onChange={e => setCategory(e.target.value)} 
                    style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '12px', background: '#f8fafc', fontSize: '1rem', color: '#1e293b', boxSizing: 'border-box' }}
                    required 
                  />
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Type the name of the expense to categorize it.</p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: 600, fontSize: '0.9rem' }}>Amount (د.ك)</label>
                  <input 
                    type="number" 
                    step="0.001" 
                    placeholder="0.000" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 700, color: '#e11d48', boxSizing: 'border-box' }}
                    required 
                  />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: 600, fontSize: '0.9rem' }}>Description (Optional)</label>
                  <textarea 
                    rows={3} 
                    placeholder="Add notes about this expense..."
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '12px', background: '#f8fafc', fontSize: '0.95rem', color: '#1e293b', resize: 'none', boxSizing: 'border-box' }}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ padding: '12px 24px', background: 'white', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ padding: '12px 32px', background: 'var(--primary)', border: 'none', color: 'white', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(4, 120, 87, 0.2)' }}>
                    Save Expense
                  </button>
                </div>

              </form>
            </div>
            
            <style>
              {`
                @keyframes slideUp {
                  from { opacity: 0; transform: translateY(20px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}
            </style>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default ExpensesPage;
