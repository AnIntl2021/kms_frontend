import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart2, 
  Info,
  Activity,
  BadgeCent,
  Zap,
  Download
} from 'lucide-react';
import api from '../api/axios';
import { useLanguage } from '../hooks/useLanguage';

const AnalyticsPage = () => {
  const { t, language } = useLanguage();
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
  
  const handleExport = () => {
    // Generate a simple CSV export for the user
    const headers = [t('partner_name'), t('loss_value'), t('revenue'), t('potential'), t('adjustment_recommendation')];
    const rows = forecasting.map(f => [
      language === 'ar' ? (f.vendor_name_ar || f.vendor_name) : f.vendor_name,
      parseFloat(f.loss_kwd || '0').toFixed(3),
      parseFloat(f.recent_sales || '0').toFixed(3),
      f.priority,
      f.recommendation
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FNF_Analytics_Report_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEfficiencyScore = () => {
      if (!health || !health.total_produced) return 0;
      const efficiency = ((health.total_produced - (health.total_wasted || 0)) / health.total_produced) * 100;
      return Math.round(efficiency);
  };

  // Helper to render bars for SVG Chart
  const renderProfitBars = () => {
      // Get top 6 stores by sales
      const sorted = [...forecasting].sort((a, b) => parseFloat(b.recent_sales || '0') - parseFloat(a.recent_sales || '0')).slice(0, 6);
      if (sorted.length === 0) return null;

      const maxSales = Math.max(...sorted.map(s => parseFloat(s.recent_sales || '0')), 1);
      
      return sorted.map((s, idx) => {
          const height = (parseFloat(s.recent_sales || '0') / maxSales) * 100;
          return (
              <div key={idx} className="chart-bar-v">
                  <div className="bar-label">{parseFloat(s.recent_sales || '0').toFixed(1)}</div>
                  <div className="bar-fill" style={{ height: `${height}%` }}></div>
                  <div className="bar-title">{language === 'ar' ? (s.vendor_name_ar || s.vendor_name).substring(0, 8) : s.vendor_name.substring(0, 8)}..</div>
              </div>
          );
      });
  };

  return (
    <Layout title={t('analytics_bi')}>
      <div className="analytics-container">
        {loading ? (
            <div className="analytics-loading animated fadeIn">
               <Activity className="spin" size={48} />
               <p>{t('calculating_profits_loss')}</p>
            </div>
        ) : (
          <>
            {/* 🩺 FINANCIAL HERO SECTION */}
            <div className="stats-hero-grid animated slideInUp">
               <div className="hero-card health primary-hero">
                   <div className="card-top">
                    <Activity size={24} />
                    <span>{t('mfg_health_score')}</span>
                  </div>
                  <div className="icon-btn download-app" title="Install Desktop App">
                    <Download size={20} />
                  </div>
                   <div className="icon-btn notification">
                    <div className="big-stat">{getEfficiencyScore()}%</div>
                    <div className="stat-label">{t('system_efficiency_index')}</div>
                  </div>
                  <div className="health-bar-container">
                    <div className="health-bar-fill" style={{ width: `${getEfficiencyScore()}%` }}></div>
                  </div>
                   <div className="hero-insight">
                      <p>{t('production_optimized_msg').replace('{score}', String(getEfficiencyScore() + 5))}</p>
                   </div>
               </div>

               <div className="hero-card finance-total">
                    <div className="card-top">
                      <BadgeCent size={24} />
                      <span>{t('profit_loss_overview_7d')}</span>
                    </div>
                   <div className="sub-stats">
                       <div className="sub-stat revenue">
                          <span className="val">{parseFloat(health?.total_revenue_7d || '0').toFixed(3)} {t('kd_currency')}</span>
                          <span className="lab">{t('total_settled_revenue')}</span>
                       </div>
                       <div className="sub-stat loss">
                          <span className="val">{parseFloat(health?.total_returns_7d || '0').toFixed(3)} {t('kd_currency')}</span>
                          <span className="lab">{t('total_returns_loss')}</span>
                       </div>
                       <div className="sub-stat profit">
                          <span className="val" style={{ color: '#0ea5e9' }}>{parseFloat(health?.total_profit_7d || '0').toFixed(3)} {t('kd_currency')}</span>
                          <span className="lab">{t('net_profit_after_costs')}</span>
                       </div>
                       <div className="sub-stat units" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                          <span className="val" style={{ fontSize: '1rem' }}>{health?.total_wasted || 0} {t('units')} / {parseFloat(health?.total_loss_kwd || '0').toFixed(3)} {t('kd_currency')}</span>
                          <span className="lab">{t('expired_wastage_potential')}</span>
                       </div>
                   </div>
               </div>
            </div>

            {/* 📊 INTERACTIVE CHART DECK */}
            <div className="chart-deck-grid animated slideInUp delay-100">
                <div className="chart-card">
                    <div className="chart-header">
                       <BarChart2 size={20} />
                       <h4>{t('top_revenue_stores_7d')}</h4>
                    </div>
                   <div className="main-chart-area">
                      {renderProfitBars()}
                   </div>
                </div>

                <div className="chart-card dark">
                    <div className="chart-header">
                       <Zap size={20} color="#fbbf24" />
                       <h4>{t('optimization_opportunities')}</h4>
                    </div>
                    <div className="opportunity-list">
                        {forecasting.filter(f => f.adjustmentScore > 5).slice(0, 3).map((f, i) => (
                           <div key={i} className="opp-item">
                               <div>
                                   <div style={{ fontWeight: 700 }}>{language === 'ar' ? (f.vendor_name_ar || f.vendor_name) : f.vendor_name}</div>
                                   <div style={{ fontSize: '11px', opacity: 0.8 }}>{t('sales_vs_stock_ratio')}: {(parseFloat(f.recent_sales || '0') / (parseFloat(f.loss_kwd || '0') || 1)).toFixed(1)}x</div>
                               </div>
                               <span className="stag neon">+{f.adjustmentScore}%</span>
                           </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 🔮 FINANCIAL FORECASTING TABLE */}
            <div className="analytics-main-card animated slideInUp delay-200">
               <div className="card-header">
                   <div className="header-title">
                      <Activity size={20} />
                      <h3>{t('leak_growth_forecast')}</h3>
                   </div>
                   <div className="header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                       <button className="btn-download" onClick={handleExport} title="Download Full Report">
                          <Download size={16} />
                          {t('export_bi_report')}
                       </button>
                       <span className="intelligence-tag">{t('ai_profit_logic_active')}</span>
                    </div>
               </div>
               
               <div className="forecasting-table-wrapper">
                  <table className="analytics-table">
                    <thead>
                      <tr>
                         <th>{t('store_name')}</th>
                        <th>{t('7d_waste_kd')}</th>
                        <th>{t('7d_revenue')}</th>
                        <th>{t('priority')}</th>
                        <th>{t('adjustment_recommendation')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecasting.length > 0 ? forecasting.map((store) => (
                        <tr key={store.vendor_id}>
                          <td><strong>{language === 'ar' ? (store.vendor_name_ar || store.vendor_name) : store.vendor_name}</strong></td>
                           <td className="loss-cell">
                             {parseFloat(store.loss_kwd || '0') > 0 ? (
                                <span className="loss-badge">{parseFloat(store.loss_kwd).toFixed(3)} {t('kd_currency')} {t('lost')}</span>
                             ) : (
                                <span className="no-loss">{t('no_loss')}</span>
                             )}
                           </td>
                           <td>{parseFloat(store.recent_sales || '0').toFixed(3)} {t('kd_currency')}</td>
                          <td>
                             <span className={`priority-tag ${store.priority.toLowerCase().replace(' ', '-')}`}>
                                {store.priority}
                             </span>
                          </td>
                           <td>
                             <div className={`recommendation-box ${store.actionColor}`}>
                                {store.recommendation === 'EXPAND INVENTORY' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                <span>{t(store.recommendation.toLowerCase().replace(' ', '_'))} ({store.adjustmentScore > 0 ? '+' : ''}{store.adjustmentScore}%)</span>
                             </div>
                           </td>
                        </tr>
                       )) : (
                        <tr><td colSpan={5} style={{textAlign:'center', padding:'3rem'}}>{t('no_data_analytical_msg')}</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>

            {/* 💡 STRATEGY DECK */}
            <div className="strategy-grid animated slideInUp delay-300">
                <div className="strategy-card green">
                   <h4>💡 {t('earn_everything_back')}</h4>
                   <p>Increase production for <b>{(() => {
                       const topStore = forecasting.find(f => f.adjustmentScore > 0);
                       if (!topStore) return 'Top Stores';
                       return language === 'ar' ? (topStore.vendor_name_ar || topStore.vendor_name) : topStore.vendor_name;
                   })()}</b> by 25% today. Their sales velocity is higher than current delivery volumes.</p>
                </div>
                <div className="strategy-card red">
                   <h4>✋ {t('stop_the_leak')}</h4>
                   <p>
                     {forecasting.some(f => f.priority.toLowerCase() === 'critical') ? (
                       <>
                         Reduce delivery for <b>{forecasting.filter(f => f.priority.toLowerCase() === 'critical').map(f => language === 'ar' ? (f.vendor_name_ar || f.vendor_name) : f.vendor_name).join(', ')}</b> (Critical Priority) immediately.
                       </>
                     ) : (
                       <>Reduce delivery for stores with <b>Critical Priority</b> immediately.</>
                     )}{' '}
                     You are losing approx. {parseFloat(health?.total_loss_kwd || '0').toFixed(1)} {t('kd_currency')} every week just in these locations.
                   </p>
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
        .chart-card.dark h4 { color: white !important; }
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
        .analytics-table th { text-align: start; padding: 1.2rem 2rem; background: #f8fafc; color: #64748b; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; }
        .analytics-table td { padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9; }

        .recommendation-box { display: flex; align-items: center; gap: 0.6rem; font-weight: 700; color: white; padding: 0.6rem 1rem; border-radius: 8px; width: fit-content; font-size: 0.8rem; }
        .recommendation-box.emerald { background: #10b981; }
        .recommendation-box.rose { background: #f43f5e; }
        .recommendation-box.amber { background: #fbbf24; }

        .analytics-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: var(--primary); }
        
        .btn-download { display: flex; align-items: center; gap: 0.6rem; background: #1e293b; color: white; padding: 0.5rem 1rem; border-radius: 8px; border: none; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
        .btn-download:hover { background: #334155; transform: translateY(-1px); }

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
