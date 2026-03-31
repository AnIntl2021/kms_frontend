import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart2, 
  Target, 
  AlertCircle, 
  Info, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Box,
  Truck,
  RotateCcw,
  BadgeCent,
  ShieldCheck,
  Zap
} from 'lucide-react';
import api from '../api/axios';

const AnalyticsPage = () => {
  const [forecasting, setForecasting] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [foreRow, healthRow] = await Promise.all([
        api.get('/analytics/forecasting'),
        api.get('/analytics/health')
      ]);
      setForecasting(foreRow.data.data.forecasting);
      setHealth(healthRow.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEfficiencyScore = () => {
      if (!health || !health.total_produced) return 0;
      const efficiency = ((health.total_produced - (health.total_wasted || 0)) / health.total_produced) * 100;
      return Math.round(efficiency);
  };

  // Helper to render bars for SVG Chart
  const renderProfitBars = () => {
      // Get top 6 stores by sales
      const sorted = [...forecasting].sort((a, b) => b.recent_sales - a.recent_sales).slice(0, 6);
      if (sorted.length === 0) return null;

      const maxSales = Math.max(...sorted.map(s => parseFloat(s.recent_sales || '1')));
      
      return sorted.map((s, idx) => {
          const height = (parseFloat(s.recent_sales) / maxSales) * 100;
          return (
              <div key={idx} className="chart-bar-v">
                  <div className="bar-label">{parseFloat(s.recent_sales).toFixed(1)}</div>
                  <div className="bar-fill" style={{ height: `${height}%` }}></div>
                  <div className="bar-title">{s.vendor_name.substring(0, 8)}..</div>
              </div>
          );
      });
  };

  return (
    <Layout title="Analytics & Business Intelligence">
      <div className="analytics-container">
        {loading ? (
           <div className="analytics-loading animated fadeIn">
              <Activity className="spin" size={48} />
              <p>Calculating Profits & Loss Patterns...</p>
           </div>
        ) : (
          <>
            {/* 🩺 FINANCIAL HERO SECTION */}
            <div className="stats-hero-grid animated slideInUp">
               <div className="hero-card health primary-hero">
                  <div className="card-top">
                    <Activity size={24} />
                    <span>Manufacturing Health Score</span>
                  </div>
                  <div className="card-stats">
                    <div className="big-stat">{getEfficiencyScore()}%</div>
                    <div className="stat-label">System Efficiency Index</div>
                  </div>
                  <div className="health-bar-container">
                    <div className="health-bar-fill" style={{ width: `${getEfficiencyScore()}%` }}></div>
                  </div>
                  <div className="hero-insight">
                     <p>Your production is optimized. Targeting {getEfficiencyScore() + 5}% next week.</p>
                  </div>
               </div>

               <div className="hero-card finance-total">
                   <div className="card-top">
                     <BadgeCent size={24} />
                     <span>Profit & Loss Overview (7D)</span>
                   </div>
                   <div className="sub-stats">
                      <div className="sub-stat revenue">
                         <span className="val">{parseFloat(health?.total_revenue_7d || '0').toFixed(3)} د.ك</span>
                         <span className="lab">Total Settled Revenue</span>
                      </div>
                      <div className="sub-stat loss">
                         <span className="val">{parseFloat(health?.total_loss_kwd || '0').toFixed(3)} د.ك</span>
                         <span className="lab">Loss to Wastage / Expiry</span>
                      </div>
                      <div className="sub-stat units">
                         <span className="val">{health?.total_wasted || 0}</span>
                         <span className="lab">Units Expired</span>
                      </div>
                   </div>
               </div>
            </div>

            {/* 📊 INTERACTIVE CHART DECK */}
            <div className="chart-deck-grid animated slideInUp delay-100">
                <div className="chart-card">
                   <div className="chart-header">
                      <BarChart2 size={20} />
                      <h4>Top Revenue Stores (7D Performance)</h4>
                   </div>
                   <div className="main-chart-area">
                      {renderProfitBars()}
                   </div>
                </div>

                <div className="chart-card dark">
                   <div className="chart-header">
                      <Zap size={20} className="neon-icon" style={{ color: '#fbbf24' }} />
                      <h4 style={{ color: 'white' }}>Profit Expansion Deck</h4>
                   </div>
                   <div className="deck-body">
                      <p style={{ color: '#94a3b8' }}>Stores below have high demand with ZERO waste. Add more quantity here to increase revenue.</p>
                      <div className="opportunity-list">
                         {forecasting.filter(f => f.adjustmentScore > 0).length > 0 ? (
                            forecasting.filter(f => f.adjustmentScore > 0).slice(0, 3).map((f, i) => (
                                <div key={i} className="opp-item">
                                    <span className="sname">{f.vendor_name}</span>
                                    <span className="stag neon">+ {f.adjustmentScore}% Potential</span>
                                </div>
                            ))
                         ) : (
                            <div className="empty-forecasting" style={{ padding: '1rem', textAlign: 'center', opacity: 0.6 }}>
                               <Info size={24} style={{ marginBottom: '0.5rem' }} />
                               <p style={{ fontSize: '0.8rem' }}>System is still gathering sales data to identify expansion targets.</p>
                            </div>
                         )}
                      </div>
                   </div>
                </div>
            </div>

            {/* 🔮 FINANCIAL FORECASTING TABLE */}
            <div className="analytics-main-card animated slideInUp delay-200">
               <div className="card-header">
                  <div className="header-title">
                     <Activity size={20} />
                     <h3>Financial Leak & Growth Forecast</h3>
                  </div>
                  <div className="header-actions">
                     <span className="intelligence-tag">AI Profit Logic Active</span>
                  </div>
               </div>
               
               <div className="forecasting-table-wrapper">
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Store Name</th>
                        <th>7D Waste (د.ك)</th>
                        <th>7D Revenue</th>
                        <th>Priority</th>
                        <th>Adjustment Recommendation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecasting.length > 0 ? forecasting.map((store) => (
                        <tr key={store.vendor_id}>
                          <td><strong>{store.vendor_name}</strong></td>
                          <td className="loss-cell">
                             {parseFloat(store.loss_kwd || '0') > 0 ? (
                                <span className="loss-badge">{parseFloat(store.loss_kwd).toFixed(3)} د.ك Lost</span>
                             ) : (
                                <span className="no-loss">0 Loss</span>
                             )}
                          </td>
                          <td>{parseFloat(store.recent_sales || '0').toFixed(3)} د.ك</td>
                          <td>
                             <span className={`priority-tag ${store.priority.toLowerCase().replace(' ', '-')}`}>
                                {store.priority}
                             </span>
                          </td>
                          <td>
                             <div className={`recommendation-box ${store.actionColor}`}>
                                {store.recommendation === 'EXPAND INVENTORY' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                <span>{store.recommendation} ({store.adjustmentScore > 0 ? '+' : ''}{store.adjustmentScore}%)</span>
                             </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={5} style={{textAlign:'center', padding:'3rem'}}>No data available for analytical forecasting yet.</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>

            {/* 💡 STRATEGY DECK */}
            <div className="strategy-grid animated slideInUp delay-300">
               <div className="strategy-card green">
                  <h4>💡 To Earn Everything Back:</h4>
                  <p>Increase production for <b>{forecasting.find(f => f.adjustmentScore > 0)?.vendor_name || 'Top Stores'}</b> by 25% today. Their sales velocity is higher than current delivery volumes.</p>
               </div>
               <div className="strategy-card red">
                  <h4>✋ STOP The Leak:</h4>
                  <p>Reduce delivery for stores with <b>Critical Priority</b> immediately. You are losing approx. {parseFloat(health?.total_loss_kwd || '0').toFixed(1)} د.ك every week just in these locations.</p>
               </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .analytics-container { padding: 1.5rem; }
        
        /* HEROS */
        .primary-hero { background: linear-gradient(135deg, white, #f8fafc) !important; position: relative; }
        .hero-insight { margin-top: 1.5rem; font-size: 0.85rem; color: #16a34a; font-weight: 600; }
        
        .loss-cell { font-weight: 600; }
        .loss-badge { background: #fee2e2; color: #dc2626; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; }
        .no-loss { color: #10b981; font-size: 0.8rem; }

        .priority-tag { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; padding: 0.3rem 0.7rem; border-radius: 4px; }
        .priority-tag.critical { background: #f43f5e; color: white; }
        .priority-tag.high-profit { background: #fbbf24; color: #92400e; }
        .priority-tag.low { background: #f1f5f9; color: #475569; }

        /* CHARTS */
        .chart-deck-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
        .chart-card { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #f1f5f9; }
        .chart-card.dark { background: #1e293b; color: white; }
        .chart-header { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 2rem; }
        .chart-header h4 { margin: 0; }
        
        .main-chart-area { 
            height: 200px; 
            display: flex; 
            align-items: flex-end; 
            justify-content: space-around; 
            padding-top: 2rem; 
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 0.5rem;
        }
        .chart-bar-v { display: flex; flex-direction: column; align-items: center; width: 15%; gap: 0.5rem; }
        .bar-fill { width: 100%; background: #3b82f6; border-radius: 4px 4px 0 0; transition: height 1s cubic-bezier(0.16, 1, 0.3, 1); min-height: 5px; }
        .bar-label { font-size: 0.7rem; font-weight: 700; color: #3b82f6; }
        .bar-title { font-size: 0.65rem; color: #64748b; font-weight: 600; white-space: nowrap; }

        .opportunity-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem; }
        .opp-item { display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 0.8rem 1.2rem; border-radius: 10px; border-left: 4px solid #34d399; }
        .stag.neon { color: #34d399; font-weight: 800; font-size: 0.8rem; }

        /* STRATEGY CARDS */
        .strategy-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .strategy-card { padding: 1.5rem; border-radius: 12px; }
        .strategy-card h4 { margin: 0 0 0.5rem 0; font-size: 1.1rem; }
        .strategy-card p { margin: 0; font-size: 0.9rem; line-height: 1.6; }
        .strategy-card.green { background: #f0fdf4; border-left: 5px solid #22c55e; color: #166534; }
        .strategy-card.red { background: #fff1f2; border-left: 5px solid #f43f5e; color: #9f1239; }

        /* GENERAL */
        .stats-hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
        .hero-card { background: white; border-radius: 16px; padding: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #f1f5f9; }
        .card-stats { display: flex; flex-direction: column; }
        .big-stat { font-size: 3.5rem; font-weight: 800; color: #1e293b; line-height: 1; margin-bottom: 0.5rem; }
        .stat-label { color: #64748b; font-weight: 500; font-size: 1.1rem; }
        .health-bar-container { background: #f1f5f9; height: 12px; border-radius: 6px; margin-top: 2rem; overflow: hidden; }
        .health-bar-fill { background: #10b981; height: 100%; border-radius: 6px; transition: width 1s linear; }

        .sub-stats { display: grid; grid-template-columns: 1fr; gap: 1.2rem; }
        .sub-stat .val { font-size: 1.5rem; font-weight: 700; color: #1e293b; display: block; }
        .sub-stat .lab { font-size: 0.8rem; color: #64748b; font-weight: 600; }
        .sub-stat.loss .val { color: #f43f5e; }
        .sub-stat.revenue .val { color: #10b981; }

        .analytics-main-card { background: white; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #f1f5f9; overflow: hidden; margin-bottom: 2rem; }
        .card-header { padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
        .intelligence-tag { background: #eff6ff; color: #2563eb; padding: 0.4rem 1rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700; border: 1px solid #dbeafe; }
        .analytics-table { width: 100%; border-collapse: collapse; }
        .analytics-table th { text-align: left; padding: 1.2rem 2rem; background: #f8fafc; color: #64748b; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; }
        .analytics-table td { padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9; }

        .recommendation-box { display: flex; align-items: center; gap: 0.6rem; font-weight: 700; color: white; padding: 0.6rem 1rem; border-radius: 8px; width: fit-content; font-size: 0.8rem; }
        .recommendation-box.emerald { background: #10b981; }
        .recommendation-box.rose { background: #f43f5e; }
        .recommendation-box.amber { background: #fbbf24; }

        .analytics-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: var(--primary); }
        .spin { animation: spin 2s linear infinite; margin-bottom: 1rem; }
        @keyframes spin { from {transform: rotate(0deg)} to {transform: rotate(360deg)}}
        @keyframes slideInUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animated { animation-duration: 0.6s; animation-fill-mode: both; }
        .slideInUp { animation-name: slideInUp; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
      `}</style>
    </Layout>
  );
};

export default AnalyticsPage;
