import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  Calendar, 
  Download,
  Filter,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import './InventoryPage.css';

interface Transaction {
  transaction_id: number;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
}

const AccountsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/accounts/transactions');
      if (response.data.success) {
        setTransactions(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch account transactions from API:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'completed') return 'status-badge healthy';
    if (status === 'pending') return 'status-badge warning';
    return 'status-badge critical';
  };

  const incomeTotal = transactions.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc, 0);
  const expenseTotal = transactions.reduce((acc, curr) => curr.type === 'expense' ? acc + curr.amount : acc, 0);

  return (
    <Layout title="Accounts & Finance">
      <div className="inventory-container">
        {/* Financial Overview Metrics */}
        <div className="inventory-metrics">
          <div className="metric-card">
            <div className="metric-icon bg-green"><Wallet size={24} /></div>
            <div className="metric-details">
              <span>Total Revenue</span>
              <h3>{incomeTotal.toFixed(3)} KWD</h3>
              <p className="trend positive"><TrendingUp size={12} /> +8.2% monthly</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-red" style={{ background: '#fee2e2', color: '#dc2626' }}><TrendingDown size={24} /></div>
            <div className="metric-details">
              <span>Total Expenses</span>
              <h3>{expenseTotal.toFixed(3)} KWD</h3>
              <p className="trend warning">Within budget</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-blue"><DollarSign size={24} /></div>
            <div className="metric-details">
              <span>Net Profit</span>
              <h3>{(incomeTotal - expenseTotal).toFixed(3)} KWD</h3>
              <p className="trend positive">Excellent</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-orange" style={{ background: '#ffedd5', color: '#ea580c' }}><ArrowUpRight size={24} /></div>
            <div className="metric-details">
              <span>Pending Taxes</span>
              <h3>{((incomeTotal - expenseTotal) * 0.05).toFixed(3)} KWD</h3>
              <p className="trend neutral">Q1 Accruals</p>
            </div>
          </div>
        </div>

        {/* Financial Actions */}
        <div className="inventory-actions">
           <div className="search-group">
            <Calendar size={18} className="search-icon" />
            <span style={{ marginLeft: '10px', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>March 2026 Fiscal Period</span>
           </div>
           <div className="action-buttons">
              <button className="btn-filter"><Filter size={18} /> Financial Filter</button>
              <button className="btn-add" onClick={fetchData}><Download size={18} /> Export Statements</button>
              <button className="btn-add" style={{ background: 'var(--primary)' }}><Plus size={18} /> Record Entry</button>
           </div>
        </div>

        {/* Transaction History */}
        <div className="stock-table-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Category / Purpose</th>
                  <th>Reference</th>
                  <th>Date</th>
                  <th>Amount (KWD)</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan={7} className="text-center py-5">Syncing financial records...</td></tr>
                ) : transactions.length === 0 ? (
                   <tr><td colSpan={7} className="text-center py-5">No financial records found.</td></tr>
                ) : transactions.map(t => (
                  <tr key={t.transaction_id}>
                    <td>
                      <div className="item-info">
                        <strong>TXN-{String(t.transaction_id).padStart(4, '0')}</strong>
                        <span style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px', color: t.type === 'income' ? '#16a34a' : '#dc2626' }}>
                           {t.type === 'income' ? <ArrowUpRight size={10}/> : <ArrowDownLeft size={10}/>}
                           {t.type.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.category}</div>
                    </td>
                    <td>
                      <div style={{ background: '#f8fafc', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b' }}>
                        {t.reference}
                      </div>
                    </td>
                    <td>{t.date}</td>
                    <td>
                       <strong style={{ color: t.type === 'income' ? '#054c2d' : '#991b1b', fontSize: '15px' }}>
                         {t.type === 'income' ? '+' : '-'}{t.amount.toFixed(3)}
                       </strong>
                    </td>
                    <td>
                      <span className={getStatusBadge(t.status)}>{t.status}</span>
                    </td>
                    <td className="text-right">
                       <button className="btn-more"><MoreHorizontal size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AccountsPage;
