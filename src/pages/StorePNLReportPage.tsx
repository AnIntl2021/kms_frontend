import FoodLoader from '../components/FoodLoader';
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useLanguage } from '../hooks/useLanguage';
import { TrendingUp, DollarSign, Calculator, Wallet, Percent, Calendar, CheckCircle2, AlertOctagon, TrendingDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadialBarChart, RadialBar, Legend } from 'recharts';

const StorePNLReportPage = () => {
  const { language, isRTL } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchPNL = async () => {
    setLoading(true);
    try {
      let url = '/reports/store-pnl';
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await api.get(url);
      setData(res.data.data);
    } catch (e) {
      toast.error('Failed to load Store PNL');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPNL();
  }, [startDate, endDate]);

  if (loading && !data) return <Layout title="Store P&L"><FoodLoader text="Calculating PNL Ledger..." /></Layout>;

  return (
    <Layout title="Store Profit & Loss">
      <div className="partner-analytics-portal animated fadeIn">
        
        {/* Header */}
        <div className="portal-header">
          <div className="partner-title-area">
            <div className="partner-avatar bg-green" style={{background: 'var(--primary)', color: 'white'}}>
              <Calculator size={24} />
            </div>
            <div>
              <h2>Store Profit & Loss</h2>
              <span className="partner-badge">Operational Income Statement</span>
            </div>
          </div>
          {/* Date Range Filter */}
          <div className="partner-date-filter">
            <Calendar size={14} />
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={e => setStartDate(e.target.value)}
              className="partner-date-input"
            />
            <span className="partner-date-sep">→</span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={e => setEndDate(e.target.value)}
              className="partner-date-input"
            />
            {(startDate || endDate) && (
              <button
                className="partner-date-clear"
                onClick={() => { setStartDate(''); setEndDate(''); }}
                title="Clear date filter"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {data && (
          <div className="portal-content">
            {/* KPIs Bento Grid */}
            <div className="bento-grid partner-bento">

              {/* Total Sales */}
              <div className="hud-card glass-glow-blue">
                <div className="hud-header">
                  <div className="icon-wrapper bg-blue">
                    <TrendingUp size={24} />
                  </div>
                  <span className="hud-title">TOTAL SALES</span>
                </div>
                <div className="hud-body">
                  <div className="big-value text-blue">{data.totalSales.toFixed(3)} <span className="currency">د.ك</span></div>
                  <div className="hud-sub">Gross Revenue</div>
                </div>
              </div>

              {/* COGS */}
              <div className="hud-card glass-glow-rose">
                <div className="hud-header">
                  <div className="icon-wrapper bg-rose">
                    <AlertOctagon size={24} />
                  </div>
                  <span className="hud-title">COST OF GOODS SOLD</span>
                </div>
                <div className="hud-body">
                  <div className="big-value text-rose">{data.totalCogs.toFixed(3)} <span className="currency">د.ك</span></div>
                  <div className="hud-sub">Direct Recipe Costs</div>
                </div>
              </div>

              {/* Gross Profit */}
              <div className="hud-card glass-glow-green">
                <div className="hud-header">
                  <div className="icon-wrapper bg-green">
                    <CheckCircle2 size={24} />
                  </div>
                  <span className="hud-title">GROSS PROFIT</span>
                </div>
                <div className="hud-body">
                  <div className="big-value text-green">{data.grossProfit.toFixed(3)} <span className="currency">د.ك</span></div>
                  <div className="hud-sub">Sales - COGS</div>
                </div>
              </div>

              {/* Total Expenses */}
              <div className="hud-card glass-glow-rose">
                <div className="hud-header">
                  <div className="icon-wrapper bg-rose">
                    <Wallet size={24} />
                  </div>
                  <span className="hud-title">TOTAL EXPENSES</span>
                </div>
                <div className="hud-body">
                  <div className="big-value text-rose">{(data.totalLabor + data.totalOther).toFixed(3)} <span className="currency">د.ك</span></div>
                  <div className="hud-sub">Labor + Other Operational</div>
                </div>
              </div>

              {/* Net Income */}
              <div className={`hud-card ${data.netIncome >= 0 ? 'glass-glow-green' : 'glass-glow-rose'}`}
                style={{ gridColumn: 'span 2', background: data.netIncome >= 0 ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : 'linear-gradient(135deg, #fff1f2, #ffe4e6)', border: `2px solid ${data.netIncome >= 0 ? '#22c55e' : '#f43f5e'}` }}>
                <div className="hud-header">
                  <div className="icon-wrapper" style={{ background: data.netIncome >= 0 ? '#dcfce7' : '#ffe4e6', color: data.netIncome >= 0 ? '#16a34a' : '#e11d48' }}>
                    {data.netIncome >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                  </div>
                  <span className="hud-title" style={{ color: data.netIncome >= 0 ? '#15803d' : '#be123c', fontSize: '0.9rem' }}>NET INCOME (BOTTOM LINE)</span>
                </div>
                <div className="hud-body">
                  <div className="big-value" style={{ color: data.netIncome >= 0 ? '#16a34a' : '#e11d48', fontSize: '2.5rem' }}>
                    {data.netIncome.toFixed(3)} <span className="currency">د.ك</span>
                  </div>
                  <div className="hud-sub">
                    Gross Profit - Operational Expenses
                  </div>
                </div>
              </div>

            </div>



            {/* 📊 NEXT-GEN CHARTS GRID */}
            <div className="analytics-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
              
              {/* REVENUE BREAKDOWN */}
              <div className="analytics-chart-card glass-glow-blue" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.5px' }}>REVENUE BREAKDOWN</h3>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.salesByCategory}
                        dataKey="sales"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                      >
                        {data.salesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => `${Number(val).toFixed(3)} د.ك`} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* EXPENSE DISTRIBUTION */}
              <div className="analytics-chart-card glass-glow-rose" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.5px' }}>EXPENSE DISTRIBUTION</h3>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'COGS (Recipes)', value: data.totalCogs },
                          ...data.laborExpenses.map(l => ({ name: l.category + ' (Labor)', value: l.amount })),
                          ...data.otherExpenses.map(o => ({ name: o.category, value: o.amount }))
                        ].filter(item => item.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                      >
                        {Array(20).fill(0).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={['#f43f5e', '#e11d48', '#be123c', '#fb923c', '#f59e0b', '#d97706', '#94a3b8', '#64748b'][index % 8]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => `${Number(val).toFixed(3)} د.ك`} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* PROFIT MARGIN GAUGE */}
              <div className="analytics-chart-card glass-glow-green" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.5px' }}>NET MARGIN GAUGE</h3>
                <div style={{ flex: 1, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      cx="50%" 
                      cy="100%" 
                      innerRadius="100%" 
                      outerRadius="140%" 
                      barSize={15} 
                      data={[{ name: 'Margin', value: data.totalSales > 0 ? (data.netIncome / data.totalSales * 100) : 0, fill: data.netIncome >= 0 ? '#10b981' : '#ef4444' }]} 
                      startAngle={180} 
                      endAngle={0}
                    >
                      <RadialBar minAngle={15} background clockWise={true} dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: data.netIncome >= 0 ? '#16a34a' : '#dc2626' }}>
                      {data.totalSales > 0 ? ((data.netIncome / data.totalSales) * 100).toFixed(1) : 0}%
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>PROFIT MARGIN</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Grid Layout for details */}
            <div className="main-content-layout">
              
              {/* LEFT COLUMN: Revenue & Labor */}
              <div className="left-column-layout">
                
                {/* Revenue Table */}
                <div className="analytics-chart-card glass-panel" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '1.5rem' }}>
                  <div className="stream-header">
                    <div className="header-left">
                      <TrendingUp size={18} className="text-blue" />
                      <h3>REVENUE (SALES)</h3>
                    </div>
                  </div>
                  <div className="stream-table-wrapper" style={{ maxHeight: '350px' }}>
                    <table className="dispatch-table">
                      <thead>
                        <tr>
                          <th>CATEGORY NAME</th>
                          <th className="text-center">GROSS REVENUE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.salesByCategory.map((s: any, idx: number) => (
                          <tr key={idx} className="dispatch-row">
                            <td><strong>{s.category}</strong></td>
                            <td className="text-center text-blue font-bold">{s.sales.toFixed(3)} د.ك</td>
                          </tr>
                        ))}
                        <tr style={{ background: '#f8fafc' }}>
                          <td className="text-right font-bold text-slate-500">TOTAL REVENUE</td>
                          <td className="text-center text-blue font-bold" style={{ fontSize: '1.1rem' }}>{data.totalSales.toFixed(3)} د.ك</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Labor Expenses Table */}
                <div className="analytics-chart-card glass-panel" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '1.5rem' }}>
                  <div className="stream-header">
                    <div className="header-left">
                      <Wallet size={18} className="text-rose" />
                      <h3>LABOR EXPENSES</h3>
                    </div>
                  </div>
                  <div className="stream-table-wrapper" style={{ maxHeight: '350px' }}>
                    <table className="dispatch-table">
                      <thead>
                        <tr>
                          <th>EXPENSE TYPE</th>
                          <th className="text-center">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.laborExpenses.map((e: any, idx: number) => (
                          <tr key={idx} className="dispatch-row">
                            <td><strong>{e.category}</strong></td>
                            <td className="text-center text-rose font-bold">{e.amount.toFixed(3)} د.ك</td>
                          </tr>
                        ))}
                        {data.laborExpenses.length === 0 && (
                          <tr><td colSpan={2} className="text-center p-4">No labor expenses logged.</td></tr>
                        )}
                        <tr style={{ background: '#f8fafc' }}>
                          <td className="text-right font-bold text-slate-500">TOTAL LABOR</td>
                          <td className="text-center text-rose font-bold" style={{ fontSize: '1.1rem' }}>{data.totalLabor.toFixed(3)} د.ك</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: COGS & Other */}
              <div className="right-column-layout">
                
                {/* COGS Table */}
                <div className="analytics-chart-card glass-panel" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '1.5rem' }}>
                  <div className="stream-header">
                    <div className="header-left">
                      <AlertOctagon size={18} className="text-rose" />
                      <h3>COST OF GOODS SOLD</h3>
                    </div>
                  </div>
                  <div className="stream-table-wrapper" style={{ maxHeight: '350px' }}>
                    <table className="dispatch-table">
                      <thead>
                        <tr>
                          <th>CATEGORY NAME</th>
                          <th className="text-center">COGS VALUE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.salesByCategory.map((s: any, idx: number) => (
                          <tr key={idx} className="dispatch-row">
                            <td><strong>{s.category}</strong></td>
                            <td className="text-center text-rose font-bold">{s.cogs.toFixed(3)} د.ك</td>
                          </tr>
                        ))}
                        <tr style={{ background: '#f8fafc' }}>
                          <td className="text-right font-bold text-slate-500">TOTAL COGS</td>
                          <td className="text-center text-rose font-bold" style={{ fontSize: '1.1rem' }}>{data.totalCogs.toFixed(3)} د.ك</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Other Expenses Table */}
                <div className="analytics-chart-card glass-panel" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '1.5rem' }}>
                  <div className="stream-header">
                    <div className="header-left">
                      <Percent size={18} className="text-rose" />
                      <h3>OTHER EXPENSES</h3>
                    </div>
                  </div>
                  <div className="stream-table-wrapper" style={{ maxHeight: '350px' }}>
                    <table className="dispatch-table">
                      <thead>
                        <tr>
                          <th>EXPENSE TYPE</th>
                          <th className="text-center">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.otherExpenses.map((e: any, idx: number) => (
                          <tr key={idx} className="dispatch-row">
                            <td><strong>{e.category}</strong></td>
                            <td className="text-center text-rose font-bold">{e.amount.toFixed(3)} د.ك</td>
                          </tr>
                        ))}
                        {data.otherExpenses.length === 0 && (
                          <tr><td colSpan={2} className="text-center p-4">No other expenses logged.</td></tr>
                        )}
                        <tr style={{ background: '#f8fafc' }}>
                          <td className="text-right font-bold text-slate-500">TOTAL OTHER</td>
                          <td className="text-center text-rose font-bold" style={{ fontSize: '1.1rem' }}>{data.totalOther.toFixed(3)} د.ك</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>
    <style>{`
        .page-body {
          padding: 0.5rem !important;
        }

        /* 💎 Premium Filter Card Glassmorphism */
        .premium-filter-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.7);
          border-radius: 14px;
          padding: 0.5rem 0.75rem;
          box-shadow: 0 4px 15px -5px rgba(51, 65, 85, 0.05);
          margin-bottom: 0.1rem;
          transition: all 0.3s ease;
        }

        .premium-filter-card:hover {
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 10px 20px -5px rgba(51, 65, 85, 0.08);
        }

        .filter-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .lux-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.62rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .lux-date-inputs {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 2px 6px;
          transition: all 0.3s ease;
        }

        .lux-date-inputs:focus-within {
          border-color: var(--primary, #01562c);
          box-shadow: 0 0 0 3px rgba(1, 86, 44, 0.1);
          background: #fff;
        }

        .lux-date-inputs input {
          border: none;
          background: transparent;
          padding: 4px 6px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #0f172a;
          outline: none;
        }

        .lux-connector {
          font-size: 0.75rem;
          font-weight: 700;
          color: #94a3b8;
          padding: 0 4px;
        }

        /* 💎 NEXT-GEN LOSS ORACLE & PRODUCTS RETURNS WIDGETS */
        .returns-tag-highlight {
          background: rgba(244, 63, 94, 0.08);
          color: #e11d48;
          font-weight: 800;
          padding: 0.15rem 0.4rem;
          border-radius: 6px;
          font-size: 0.68rem;
          display: inline-block;
          border: 1px solid rgba(244, 63, 94, 0.15);
        }

        /* 🔮 MODERN MODAL BOX OVERLAY & CARDS */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .modal-card {
          background: white;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          width: 90%;
          max-width: 480px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.8rem 1.2rem;
          border-bottom: 1px solid #f1f5f9;
          background: #f8fafc;
        }
        .modal-header h3 {
          font-size: 0.95rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
        }
        .btn-close {
          border: none;
          background: transparent;
          font-size: 1.5rem;
          color: #94a3b8;
          cursor: pointer;
          line-height: 1;
          padding: 0;
          transition: color 0.2s ease;
        }
        .btn-close:hover {
          color: #0f172a;
        }

        .modal-body {
          padding: 1rem;
          overflow-y: auto;
          flex: 1;
          background: #fcfcfd;
        }

        .no-active-orders {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 150px;
          color: #94a3b8;
          text-align: center;
          gap: 0.5rem;
        }
        .no-active-orders p {
          font-size: 0.8rem;
          font-weight: 600;
        }

        .active-orders-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .modal-order-row {
          background: white;
          border: 1px solid #eef2f6;
          border-radius: 10px;
          padding: 0.6rem 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          transition: all 0.2s ease;
        }
        .modal-order-row:hover {
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }

        .order-main-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .order-id {
          font-size: 0.85rem;
          font-weight: 900;
          color: #0f172a;
        }

        .order-sub-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.3rem 0.6rem;
          font-size: 0.72rem;
          border-top: 1px dashed #f1f5f9;
          padding-top: 0.4rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .detail-item .label {
          color: #94a3b8;
          font-weight: 700;
        }
        .detail-item .val {
          color: #334155;
          font-weight: 800;
        }
        .detail-item .val.bold {
          font-weight: 900;
        }

        .loss-tracker-card {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 244, 245, 0.95) 100%);
          border-radius: 12px;
          border: 1px solid rgba(244, 63, 94, 0.12);
          padding: 0.6rem 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          box-shadow: 0 4px 12px -5px rgba(244, 63, 94, 0.08);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .loss-tracker-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -8px rgba(244, 63, 94, 0.15);
          border-color: rgba(244, 63, 94, 0.25);
        }

        .loss-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .product-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .product-name-highlight {
          font-size: 0.85rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
        }

        .units-returned-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.7rem;
          font-weight: 700;
          color: #e11d48;
          background: rgba(244, 63, 94, 0.06);
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          width: fit-content;
        }

        .loss-value-pill {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          background: rgba(244, 63, 94, 0.08);
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          border: 1px solid rgba(244, 63, 94, 0.1);
          min-width: 80px;
        }

        .loss-label {
          font-size: 0.55rem;
          font-weight: 800;
          color: #f43f5e;
          text-transform: uppercase;
          letter-spacing: 0.25px;
        }

        .loss-amount {
          font-size: 0.82rem;
          font-weight: 900;
          color: #e11d48;
        }

        .branch-breakdown-container {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          border-top: 1px dashed rgba(244, 63, 94, 0.15);
          padding-top: 0.4rem;
        }

        .breakdown-title {
          font-size: 0.6rem;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.25px;
        }

        .branch-badges-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
        }

        .branch-qty-badge {
          background: rgba(15, 23, 42, 0.03);
          border: 1px solid rgba(226, 232, 240, 0.8);
          padding: 0.15rem 0.4rem;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: #475569;
          transition: all 0.2s ease;
        }
        .branch-qty-badge:hover {
          background: rgba(15, 23, 42, 0.05);
          border-color: #cbd5e1;
        }
        .branch-qty-badge .b-name {
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .branch-qty-badge .b-val {
          background: #f43f5e;
          color: white;
          padding: 0.02rem 0.25rem;
          border-radius: 4px;
          font-size: 0.6rem;
          font-weight: 800;
        }
        .dispatch-dashboard-hud {
          padding: 0.4rem 0.6rem;
          background: linear-gradient(135deg, #f6f8fb 0%, #edf2f7 100%);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-height: calc(100vh - 90px);
          font-family: 'Inter', -apple-system, sans-serif;
          box-sizing: border-box;
        }

        /* 🌟 DYNAMIC FUTURISTIC BENTO GRID */
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 0.4rem;
          flex-shrink: 0;
        }

        @media (min-width: 1200px) {
          .bento-grid {
            grid-template-columns: repeat(7, 1fr);
          }
        }

        /* 💎 PREMIUM COMPACT GLASSMORPHISM HUD CARDS */
        .hud-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 14px;
          padding: 0.5rem 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 4px 15px -5px rgba(51, 65, 85, 0.05);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hud-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          opacity: 0.85;
        }

        /* Neon gradient headers for each card type */
        .glass-glow-blue::after { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
        .glass-glow-green::after { background: linear-gradient(90deg, #10b981, #34d399); }
        .glass-glow-rose::after { background: linear-gradient(90deg, #f43f5e, #fb7185); }
        .glass-glow-gold::after { background: linear-gradient(90deg, #eab308, #facc15); }

        .hud-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 10px 20px -5px rgba(51, 65, 85, 0.08);
        }

        .hud-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.25rem;
        }

        .icon-wrapper {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: inset 0 -1px 2px rgba(0,0,0,0.02);
        }

        .icon-wrapper.bg-blue { background: rgba(59, 130, 246, 0.08); color: #2563eb; }
        .icon-wrapper.bg-green { background: rgba(16, 185, 129, 0.08); color: #059669; }
        .icon-wrapper.bg-rose { background: rgba(244, 63, 94, 0.08); color: #e11d48; }
        .icon-wrapper.bg-gold { background: rgba(234, 179, 8, 0.08); color: #ca8a04; }

        .hud-card:hover .icon-wrapper {
          transform: scale(1.05) rotate(3deg);
        }

        .hud-title {
          font-size: 0.58rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .big-value {
          font-size: 1.15rem;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.1;
          letter-spacing: -0.5px;
          margin-bottom: 0.15rem;
        }
        .big-value.text-green { color: #059669; }
        .big-value.text-blue { color: #2563eb; }
        .big-value.text-amber { color: #d97706; }
        .big-value.text-rose { color: #e11d48; }

        .currency {
          font-size: 0.7rem;
          font-weight: 800;
          color: #94a3b8;
          margin-left: 0.1rem;
        }

        .hud-sub {
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .indicator {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }
        .indicator.active-pulse {
          background: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.6; }
        }

        .progress-bar-container {
          background: #f1f5f9;
          height: 4px;
          border-radius: 99px;
          overflow: hidden;
          margin-top: 0.4rem;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 1s ease-in-out;
        }
        .progress-bar-fill.bg-blue { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
        .progress-bar-fill.bg-green { background: linear-gradient(90deg, #10b981, #34d399); }
        .progress-bar-fill.bg-rose { background: linear-gradient(90deg, #f43f5e, #fb7185); }
        .progress-bar-fill.bg-gold { background: linear-gradient(90deg, #eab308, #facc15); }

        /* Radial progress KPI */
        .hud-body-radial {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .radial-content {
          display: flex;
          flex-direction: column;
        }
        .radial-number {
          font-size: 1.15rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        .radial-desc {
          font-size: 0.58rem;
          color: #64748b;
          font-weight: 600;
        }

        .radial-bar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          transition: transform 0.4s ease;
        }
        .hud-card:hover .radial-bar {
          transform: scale(1.04) rotate(15deg);
        }
        .radial-bar::after {
          content: '';
          position: absolute;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
        }

        /* 📊 SPLIT SCREEN LAYOUT */
        .main-content-layout {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 0.5rem;
          flex: 1;
          min-height: 0;
        }

        @media (max-width: 768px) {
          .main-content-layout {
            grid-template-columns: 1fr;
            overflow-y: auto;
          }
        }

        .left-column-layout {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-height: 0;
        }

        .right-column-layout {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-height: 0;
        }

        /* 🚚 LIVE INTERACTIVE CONTROL DECK Layout */
        .dispatch-stream-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 10px 25px -10px rgba(51, 65, 85, 0.05);
          padding: 0.5rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          flex: 1;
        }

        .stream-header {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .header-left h3 {
          font-size: 1.05rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.3px;
        }

        .pulse-text {
          color: #3b82f6;
          animation: text-pulse 2s infinite;
        }
        @keyframes text-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }

        .search-and-filter {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .search-box-wrapper {
          background: rgba(248, 250, 252, 0.8);
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.4rem 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          min-width: 200px;
          transition: all 0.3s ease;
        }
        .search-box-wrapper:focus-within {
          border-color: #3b82f6;
          background: white;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
        }
        .search-box-wrapper input {
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          font-size: 0.82rem;
          color: #0f172a;
          font-weight: 600;
        }

        .status-toggles {
          display: flex;
          gap: 0.25rem;
          background: #f1f5f9;
          padding: 0.25rem;
          border-radius: 10px;
        }
        .toggle-btn {
          border: none;
          background: transparent;
          font-size: 0.75rem;
          font-weight: 800;
          color: #64748b;
          padding: 0.3rem 0.6rem;
          border-radius: 7px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .toggle-btn.active {
          background: white;
          color: #01562c;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }

        .stream-table-wrapper {
          flex: 1;
          overflow-y: auto;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
        }

        .dispatch-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .dispatch-table th {
          font-size: 0.65rem;
          font-weight: 900;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 0.4rem 0.5rem;
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .dispatch-table td {
          padding: 0.4rem 0.5rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
          font-size: 0.78rem;
        }

        .dispatch-row {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .dispatch-row:hover {
          background: rgba(248, 250, 252, 0.8);
        }
        .dispatch-row.row-selected {
          background: rgba(1, 86, 44, 0.05) !important;
        }

        .order-no {
          font-weight: 900;
          color: #0f172a;
          font-size: 0.85rem;
          margin-bottom: 0.1rem;
        }
        .batch-tag {
          font-size: 0.62rem;
          font-weight: 800;
          color: #475569;
          background: #f1f5f9;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
        }

        .client-name {
          font-weight: 800;
          color: #1e293b;
        }
        .branch-tag {
          font-size: 0.65rem;
          font-weight: 800;
          color: #01562c;
        }

        .salesman-tag {
          font-size: 0.68rem;
          font-weight: 800;
          color: #2563eb;
          background: rgba(37, 99, 235, 0.08);
          padding: 0.2rem 0.5rem;
          border-radius: 8px;
          width: fit-content;
        }

        .status-badge-premium {
          font-size: 0.65rem;
          font-weight: 900;
          padding: 0.2rem 0.6rem;
          border-radius: 99px;
          display: inline-block;
          letter-spacing: 0.25px;
        }
        .status-badge-premium.pending { background: rgba(234, 88, 12, 0.08); color: #ea580c; }
        .status-badge-premium.in_transit, .status-badge-premium.dispatched { background: rgba(37, 99, 235, 0.08); color: #2563eb; }
        .status-badge-premium.delivered { background: rgba(16, 185, 129, 0.08); color: #059669; }
        .status-badge-premium.returned { background: rgba(244, 63, 94, 0.08); color: #e11d48; }

        .dispatch-date-cell {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .load-value {
          font-size: 0.9rem;
          font-weight: 900;
          color: #0f172a;
        }
        .load-value .unit {
          font-size: 0.68rem;
          color: #94a3b8;
        }

        /* RIGHT PANEL: Selected Order Pulse */
        .dispatch-pulse-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 10px 25px -10px rgba(51, 65, 85, 0.05);
          padding: 0.5rem 0.75rem;
          display: flex;
          flex-direction: column;
          flex: 1.2;
          gap: 0.4rem;
        }

        .no-selected-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          text-align: center;
          color: #64748b;
          padding: 1.5rem;
        }
        .placeholder-icon {
          color: #cbd5e1;
          margin-bottom: 0.75rem;
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .no-selected-placeholder h4 {
          font-size: 1rem;
          font-weight: 900;
          color: #1e293b;
          margin: 0 0 0.4rem 0;
          letter-spacing: -0.3px;
        }
        .no-selected-placeholder p {
          font-size: 0.78rem;
          line-height: 1.5;
          max-width: 260px;
        }

        .pulse-detail-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          height: 100%;
          min-height: 0;
        }

        .logistics-chain-header {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .logistics-chain-header h4 {
          font-size: 0.72rem;
          font-weight: 900;
          color: #475569;
          letter-spacing: 0.5px;
          margin: 0;
        }

        .chain-visual {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          padding: 0 0.25rem;
        }

        .chain-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          z-index: 2;
        }

        .node-icon {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        }
        .node-icon.bg-green { background: #10b981; }
        .node-icon.bg-blue { background: #3b82f6; }
        .node-icon.bg-slate { background: #94a3b8; }

        .node-label {
          font-size: 0.62rem;
          font-weight: 800;
          color: #475569;
        }

        .chain-line {
          height: 3px;
          flex: 1;
          margin: 0 -4px;
          margin-bottom: 0.85rem;
          z-index: 1;
        }
        .chain-line.bg-green { background: #10b981; }
        .chain-line.bg-slate { background: #cbd5e1; }

        .specs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.3rem;
          background: #f8fafc;
          padding: 0.4rem 0.6rem;
          border-radius: 10px;
          border: 1px solid #f1f5f9;
        }

        .spec-item {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }
        .spec-label {
          font-size: 0.62rem;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.25px;
        }
        .spec-val {
          font-size: 0.82rem;
          font-weight: 900;
          color: #1e293b;
        }
        .spec-val.text-green {
          color: #01562c;
        }

        .status-pill {
          font-size: 0.68rem;
          font-weight: 900;
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          width: fit-content;
          letter-spacing: 0.15px;
        }
        .status-pill.pending { background: rgba(234, 88, 12, 0.08); color: #ea580c; }
        .status-pill.in_transit, .status-pill.dispatched { background: rgba(37, 99, 235, 0.08); color: #2563eb; }
        .status-pill.delivered { background: rgba(16, 185, 129, 0.08); color: #059669; }
        .status-pill.returned { background: rgba(244, 63, 94, 0.08); color: #e11d48; }

        .action-buttons-wrapper {
          margin-top: 0.2rem;
        }

        .btn-action {
          border: none;
          padding: 0.35rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 800;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-action.dispatch-btn { background: #3b82f6; }
        .btn-action.dispatch-btn:hover { background: #2563eb; transform: translateY(-1px); }
        .btn-action.deliver-btn { background: #10b981; }
        .btn-action.deliver-btn:hover { background: #059669; transform: translateY(-1px); }

        .completed-log-tag {
          font-size: 0.75rem;
          font-weight: 800;
          color: #10b981;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .dispatch-items-list-container {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          flex: 1;
          min-height: 0;
        }
        .dispatch-items-list-container h5 {
          font-size: 0.68rem;
          font-weight: 900;
          color: #475569;
          letter-spacing: 0.5px;
          margin: 0;
        }

        .small-items-list {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          max-height: 180px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .dispatch-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.3rem 0.5rem;
          background: rgba(248, 250, 252, 0.8);
          border-radius: 8px;
          border: 1px solid #eef2f6;
          transition: all 0.2s ease;
        }
        .dispatch-item-row:hover {
          background: white;
          border-color: #cbd5e1;
        }
        .item-left {
          display: flex;
          flex-direction: column;
        }
        .item-name {
          font-size: 0.78rem;
          font-weight: 800;
          color: #1e293b;
        }
        .unit-price-tag {
          font-size: 0.65rem;
          font-weight: 600;
          color: #94a3b8;
        }
        .item-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .loaded-qty {
          font-size: 0.68rem;
          font-weight: 800;
          color: #475569;
          background: #e2e8f0;
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
        }
        .item-total-price {
          font-size: 0.78rem;
          font-weight: 900;
          color: #1e293b;
        }

        /* 🔮 PREDICTIVE RETURNS TRACKER CARD */
        .returns-pulse-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 10px 25px -10px rgba(51, 65, 85, 0.05);
          padding: 0.5rem 0.75rem;
          display: flex;
          flex-direction: column;
          flex: 0.8;
          gap: 0.3rem;
        }

        .returns-pulse-card h3 {
          font-size: 0.85rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.3px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .returns-tracker-list {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          max-height: 220px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .tracker-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.7);
          padding: 0.35rem 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .tracker-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 15px -5px rgba(51, 65, 85, 0.08);
        }

        .tracker-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .salesman-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .salesman-avatar {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: rgba(1, 86, 44, 0.08);
          color: #01562c;
          font-weight: 900;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 -2px 4px rgba(0,0,0,0.03);
        }

        .salesman-meta .name {
          font-size: 0.85rem;
          font-weight: 900;
          color: #1e293b;
          display: block;
        }
        .salesman-meta .destination {
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 700;
          display: block;
        }

        .timer-badge {
          font-size: 0.65rem;
          font-weight: 900;
          padding: 0.15rem 0.45rem;
          border-radius: 6px;
          letter-spacing: 0.15px;
        }
        .timer-badge.active { background: rgba(16, 185, 129, 0.08); color: #10b981; }
        .timer-badge.scheduled { background: #f8fafc; color: #64748b; border: 1px dashed #cbd5e1; }

        .route-bar {
          background: #f1f5f9;
          height: 6px;
          border-radius: 99px;
          position: relative;
          margin-bottom: 0.25rem;
          overflow: hidden;
        }
        .route-fill {
          background: linear-gradient(90deg, #10b981, #3b82f6);
          height: 100%;
          border-radius: 99px;
        }
        .route-bar .dot {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .time-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.68rem;
          color: #64748b;
          font-weight: 800;
        }
        .time-meta .bold {
          color: #1e293b;
        }

        /* loading / small layout assets */
        .loading-spinner-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 120px;
          color: #3b82f6;
        }
        .loading-spinner-area p {
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }
        .loading-spinner-area-small {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: #64748b;
          padding: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .no-records-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 120px;
          color: #94a3b8;
          text-align: center;
        }
        .no-records-area p {
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }
        .spin-icon {
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* 📊 NEXT-GEN CHARTS STYLING */
        .analytics-charts-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .analytics-charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .analytics-chart-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 14px;
          padding: 0.4rem 0.6rem;
          border: 1px solid rgba(255, 255, 255, 0.7);
          box-shadow: 0 6px 15px -10px rgba(51, 65, 85, 0.05);
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }

        .analytics-chart-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          opacity: 0.85;
        }

        .analytics-chart-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 10px 20px -8px rgba(51, 65, 85, 0.08);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-icon-title {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .header-icon-title h4 {
          font-size: 0.85rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.3px;
        }

        .chart-sub {
          font-size: 0.62rem;
          color: #64748b;
          font-weight: 600;
          margin: 0.02rem 0 0 0;
        }

        .icon-wrapper.small {
          width: 22px;
          height: 22px;
          border-radius: 6px;
        }

        .chart-body {
          position: relative;
        }

        .empty-chart-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 140px;
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 600;
          gap: 0.25rem;
        }

        .pie-chart-body {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .pie-container-layout {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .custom-pie-legend {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.3rem 0.5rem;
          margin-top: 0.3rem;
          width: 100%;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.68rem;
          font-weight: 800;
          color: #475569;
          white-space: nowrap;
        }
        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .legend-label {
          color: #475569;
        }
        .legend-val {
          color: #94a3b8;
        }

        .pagination-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.8rem 0.25rem 0.2rem 0.25rem;
          border-top: 1px solid #e2e8f0;
          margin-top: 0.5rem;
          flex-shrink: 0;
        }
        .pagination-info {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 600;
        }
        .pagination-info b {
          color: #0f172a;
        }
        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .pagination-arrow {
          border: 1px solid #cbd5e1;
          background: white;
          color: #475569;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.15rem;
          cursor: pointer;
          font-weight: 700;
          transition: all 0.2s ease;
        }
        .pagination-arrow:hover:not(:disabled) {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .pagination-arrow:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .page-indicator {
          font-size: 0.8rem;
          color: #475569;
          font-weight: 600;
          margin: 0 0.6rem;
        }
        .page-indicator b {
          color: #0f172a;
        }

        /* 🏢 PARTNER PORTAL SPECIFIC STYLING */
        .partner-analytics-portal {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .portal-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: white;
          padding: 0.75rem 1.25rem;
          border-radius: 14px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 4px 15px -5px rgba(51, 65, 85, 0.05);
          flex-wrap: wrap;
        }
        .partner-date-filter {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-left: auto;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.4rem 0.75rem;
          color: #64748b;
        }
        .partner-date-input {
          border: 1px solid #e2e8f0;
          border-radius: 7px;
          padding: 0.3rem 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: #1e293b;
          background: white;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .partner-date-input:focus {
          border-color: #01562c;
        }
        .partner-date-sep {
          font-size: 0.8rem;
          color: #94a3b8;
          font-weight: 700;
        }
        .partner-date-clear {
          background: #fee2e2;
          color: #e11d48;
          border: none;
          border-radius: 6px;
          padding: 0.25rem 0.6rem;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .partner-date-clear:hover {
          background: #fecdd3;
        }
        .btn-back {
          border: 1px solid #cbd5e1;
          background: white;
          color: #475569;
          font-weight: 700;
          font-size: 0.78rem;
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          transition: all 0.2s ease;
        }
        .btn-back:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #94a3b8;
        }
        .partner-title-area {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .partner-avatar {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(1, 86, 44, 0.08);
          color: #01562c;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .partner-title-area h2 {
          font-size: 1.2rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.3px;
        }
        .partner-badge {
          font-size: 0.68rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .portal-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #01562c;
          gap: 0.5rem;
        }
        .portal-loading p {
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;
        }
        .portal-content {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .partner-bento {
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        }
        @media (min-width: 1200px) {
          .partner-bento {
            grid-template-columns: repeat(7, 1fr);
          }
        }
        .font-bold {
          font-weight: 800;
        }
        .link-style {
          cursor: pointer;
          color: #01562c;
          text-decoration: underline;
          text-underline-offset: 2px;
          font-weight: 800;
        }
        .link-style:hover {
          color: #0369a1;
        }
      `}</style>
    </Layout>
  );
};

export default StorePNLReportPage;
