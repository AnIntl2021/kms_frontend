import FoodLoader from '../components/FoodLoader';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  BadgeCent, 
  Calendar, 
  Download,
  Filter,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import './InventoryPage.css';
import { useLanguage } from '../hooks/useLanguage';

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
  const { t } = useLanguage();
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

  const incomeTotal = transactions.reduce((acc, curr) => curr.type === 'income' ? acc + Number(curr.amount) : acc, 0);
  const expenseTotal = transactions.reduce((acc, curr) => curr.type === 'expense' ? acc + Number(curr.amount) : acc, 0);

  return (
    <Layout title={t('accounts_finance')}>
      <div className="inventory-container">
        {/* Financial Overview Metrics */}
        <div className="inventory-metrics">
          <div className="metric-card">
            <div className="metric-icon bg-green"><Wallet size={24} /></div>
            <div className="metric-details">
              <span>{t('total_revenue')}</span>
              <h3>{Number(incomeTotal).toFixed(3)} {t('kd_currency')}</h3>
              <p className="trend positive" style={{visibility: loading ? 'hidden' : 'visible'}}><TrendingUp size={12} /> {t('live_tracking')}</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-red" style={{ background: '#fee2e2', color: '#dc2626' }}><TrendingDown size={24} /></div>
            <div className="metric-details">
              <span>{t('total_expenses')}</span>
              <h3>{Number(expenseTotal).toFixed(3)} {t('kd_currency')}</h3>
              <p className="trend warning" style={{visibility: loading ? 'hidden' : 'visible'}}>{t('expenditures')}</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-blue"><BadgeCent size={24} /></div>
            <div className="metric-details">
              <span>{t('net_profit')}</span>
              <h3>{(Number(incomeTotal) - Number(expenseTotal)).toFixed(3)} {t('kd_currency')}</h3>
              <p className="trend positive" style={{visibility: loading ? 'hidden' : 'visible'}}>{t('current_balance')}</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon bg-orange" style={{ background: '#ffedd5', color: '#ea580c' }}><ArrowUpRight size={24} /></div>
            <div className="metric-details">
              <span>{t('estimated_tax')}</span>
              <h3>{((Number(incomeTotal) - Number(expenseTotal)) * 0.05).toFixed(3)} {t('kd_currency')}</h3>
              <p className="trend neutral" style={{visibility: loading ? 'hidden' : 'visible'}}>{t('auto_calculated')}</p>
            </div>
          </div>
        </div>

        {/* Financial Actions */}
        <div className="inventory-actions">
           <div className="search-group">
            <Calendar size={18} className="search-icon" />
            <span style={{ marginLeft: '10px', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} {t('fiscal_period')}
            </span>
           </div>
           <div className="action-buttons">
              <button className="btn-filter"><Filter size={18} /> {t('financial_filter')}</button>
              <button className="btn-add" onClick={fetchData}><Download size={18} /> {t('export_statements')}</button>
              <button className="btn-add" style={{ background: 'var(--primary)' }}><Plus size={18} /> {t('record_entry')}</button>
           </div>
        </div>

        {/* Transaction History */}
        <div className="stock-table-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('transaction_id')}</th>
                  <th>{t('category_purpose')}</th>
                  <th>{t('reference')}</th>
                  <th>{t('date')}</th>
                  <th>{t('amount_kd')}</th>
                  <th>{t('status')}</th>
                  <th className="text-end">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan={7} className="text-center py-5"><FoodLoader size="small" /></td></tr>
                ) : transactions.length === 0 ? (
                   <tr><td colSpan={7} className="text-center py-5">{t('no_financial_records')}</td></tr>
                ) : transactions.map(tr => (
                  <tr key={`${tr.type}-${tr.transaction_id}`}>
                    <td>
                      <div className="item-info">
                        <strong>TXN-{String(tr.transaction_id).padStart(4, '0')}</strong>
                        <span style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px', color: tr.type === 'income' ? '#16a34a' : '#dc2626' }}>
                           {tr.type === 'income' ? <ArrowUpRight size={10}/> : <ArrowDownLeft size={10}/>}
                           {tr.type.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{tr.category}</div>
                    </td>
                    <td>
                      <div style={{ background: '#f8fafc', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b' }}>
                        {tr.reference}
                      </div>
                    </td>
                    <td>{tr.date}</td>
                    <td>
                       <strong style={{ color: tr.type === 'income' ? '#054c2d' : '#991b1b', fontSize: '15px' }}>
                         {tr.type === 'income' ? '+' : '-'}{Number(tr.amount).toFixed(3)}
                       </strong>
                    </td>
                    <td>
                      <span className={getStatusBadge(tr.status)}>{t(tr.status)}</span>
                    </td>
                    <td className="text-end">
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
