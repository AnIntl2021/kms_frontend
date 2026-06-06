import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../hooks/useLanguage';
import { Scale, Calendar, Download, Building, Landmark } from 'lucide-react';
import api from '../api/axios';
import './BalanceSheetPage.css';

const BalanceSheetPage: React.FC = () => {
  const { t } = useLanguage();
  const [assets, setAssets] = useState<any[]>([]);
  const [liabilities, setLiabilities] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState<any>({ totalIncome: 0, totalExpense: 0, netProfit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assRes, liabRes, summaryRes, empRes] = await Promise.all([
        api.get('/assets').catch(() => ({ data: { success: false } })),
        api.get('/liabilities').catch(() => ({ data: { success: false } })),
        api.get('/accounts/summary').catch(() => ({ data: { success: false } })),
        api.get('/employees').catch(() => ({ data: { success: false } }))
      ]);
      if (assRes.data?.success) setAssets(assRes.data.data || []);
      if (liabRes.data?.success) setLiabilities(liabRes.data.data || []);
      if (summaryRes.data?.success) setFinancialSummary(summaryRes.data.data || { totalIncome: 0, totalExpense: 0, netProfit: 0 });
      if (empRes.data?.success) setSalaries(empRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch balance sheet data', err);
    } finally {
      setLoading(false);
    }
  };

  const totalAssets = assets.reduce((acc, curr) => acc + Number(curr.value || 0), 0);
  
  // Separate pure liabilities from Equity entered in the liabilities form
  const pureLiabilities = liabilities.filter(l => l.type !== "Owner's Equity");
  const equityEntries = liabilities.filter(l => l.type === "Owner's Equity");
  
  const totalLiabilities = pureLiabilities.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const explicitEquity = equityEntries.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  
  // Add salaries to total expense
  const totalSalaries = salaries.reduce((acc, curr) => acc + Number(curr.salary || 0), 0);
  const adjustedExpense = Number(financialSummary.totalExpense) + totalSalaries;
  const netProfit = Number(financialSummary.totalIncome) - adjustedExpense;

  // Equity = Explicit Capital + Retained Earnings
  const totalEquity = explicitEquity + netProfit;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  // Auto-calculated Cash & Bank to balance the sheet
  // Cash = (Liabilities + Equity) - Explicit Assets
  const calculatedCash = totalLiabilitiesAndEquity - totalAssets;
  
  // Total Assets including calculated cash
  const finalTotalAssets = totalAssets + calculatedCash;

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Layout title="Balance Sheet">
      <div className="balance-sheet-container fade-in">
        <div className="sheet-header-actions">
          <div className="sheet-date">
            <Calendar size={18} />
            <span>As of {currentDate}</span>
          </div>
          <button className="btn-export" onClick={() => window.print()}>
            <Download size={18} /> Export / Print
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Loading Balance Sheet...</div>
        ) : (
          <div className="sheet-paper printable-area">
            <div className="sheet-title-area">
              <h1>Fresh & Fast Restaurant Company</h1>
              <h2>Balance Sheet</h2>
              <p>As of {currentDate}</p>
            </div>

            <div className="sheet-columns">
              {/* ASSETS COLUMN */}
              <div className="sheet-column">
                <div className="column-header">
                  <Building size={20} />
                  <h3>ASSETS</h3>
                </div>
                
                <table className="sheet-table">
                  <tbody>
                    {assets.length === 0 && <tr><td className="empty-row">No assets recorded</td><td className="text-right">0.000</td></tr>}
                    {assets.map((asset) => (
                      <tr key={asset.asset_id}>
                        <td>{asset.name} <span className="item-type">({asset.type})</span></td>
                        <td className="text-right amount">{Number(asset.value).toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})}</td>
                      </tr>
                    ))}
                    <tr className="auto-calculated-row">
                      <td>
                        Cash & Bank Balances
                        <div style={{fontSize: '11px', color: '#10b981', marginTop: '4px'}}>
                          Auto-calculated from Profit & Capital
                        </div>
                      </td>
                      <td className="text-right amount">{calculatedCash.toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})}</td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="column-total">
                  <span>Total Assets</span>
                  <span className="total-amount double-underline">{finalTotalAssets.toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})} د.ك</span>
                </div>
              </div>

              {/* LIABILITIES & EQUITY COLUMN */}
              <div className="sheet-column">
                <div className="column-header">
                  <Landmark size={20} />
                  <h3>LIABILITIES & EQUITY</h3>
                </div>

                <div className="sub-section">
                  <h4 className="section-subtitle">Liabilities</h4>
                  <table className="sheet-table">
                    <tbody>
                      {pureLiabilities.length === 0 && <tr><td className="empty-row">No liabilities recorded</td><td className="text-right">0.000</td></tr>}
                      {pureLiabilities.map((liab) => (
                        <tr key={liab.liability_id}>
                          <td>{liab.name} <span className="item-type">({liab.type})</span></td>
                          <td className="text-right amount">{Number(liab.amount).toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="sub-total">
                    <span>Total Liabilities</span>
                    <span>{totalLiabilities.toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})}</span>
                  </div>
                </div>

                <div className="sub-section mt-4">
                  <h4 className="section-subtitle">Owner's Equity</h4>
                  <table className="sheet-table">
                    <tbody>
                      {equityEntries.map((eq) => (
                        <tr key={eq.liability_id}>
                          <td>{eq.name} <span className="item-type">(Owner's Capital)</span></td>
                          <td className="text-right amount">{Number(eq.amount).toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})}</td>
                        </tr>
                      ))}
                      <tr>
                        <td>
                          Retained Earnings (Net Profit)
                          <div style={{fontSize: '11px', color: '#64748b', marginTop: '4px'}}>
                            Sales: {Number(financialSummary.totalIncome).toLocaleString()} | Exp & Salaries: {adjustedExpense.toLocaleString()}
                          </div>
                        </td>
                        <td className="text-right amount">{netProfit.toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="sub-total">
                    <span>Total Equity</span>
                    <span>{totalEquity.toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})}</span>
                  </div>
                </div>

                <div className="column-total" style={{marginTop: 'auto'}}>
                  <span>Total Liabilities & Equity</span>
                  <span className="total-amount double-underline">{totalLiabilitiesAndEquity.toLocaleString(undefined, {minimumFractionDigits: 3, maximumFractionDigits: 3})} د.ك</span>
                </div>
              </div>
            </div>
            
            <div className="balance-indicator">
              <Scale size={24} className={finalTotalAssets === totalLiabilitiesAndEquity ? "balanced-icon" : "unbalanced-icon"} />
              <span>
                {finalTotalAssets === totalLiabilitiesAndEquity 
                  ? "The Balance Sheet is Balanced." 
                  : "Warning: Sheet is Unbalanced."}
              </span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BalanceSheetPage;
