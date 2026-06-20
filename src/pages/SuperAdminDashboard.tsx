import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../hooks/useLanguage';
import { Users, Server, Activity, DollarSign, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css'; // Reuse the excellent Dashboard CSS

const SuperAdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await api.get('/tenants');
        if (res.data.success) {
          setTenants(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch tenants:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, []);

  const metrics = [
    { label: 'Total Tenants', value: tenants.length, icon: <Server size={24} />, color: '#0984e3' },
    { label: 'Active Tenants', value: tenants.filter(t => t.status === 'Active').length, icon: <Activity size={24} />, color: '#00b894' },
    { label: 'Total Branches', value: tenants.reduce((sum, t) => sum + t.branches, 0), icon: <Users size={24} />, color: '#6c5ce7' },
    { label: 'Estimated MRR', value: tenants.reduce((sum, t) => sum + t.mrr, 0), unit: 'KWD ', icon: <DollarSign size={24} />, color: '#fdcb6e' }
  ];

  return (
    <Layout title="Super Admin Dashboard">
      <div className="dashboard-wrapper fade-in">
        <div className="page-header">
          <div className="header-content">
            <h2>SaaS Operations Hub</h2>
            <p className="subtitle">High-level overview of all your registered tenants.</p>
          </div>
          <div className="quick-actions">
            <button className="btn-action primary" onClick={() => navigate('/superadmin/tenants')}>
              <Plus size={18} />
              Add Tenant
            </button>
          </div>
        </div>

        <div className="metrics-grid">
          {metrics.map((m, i) => (
            <div key={i} className="metric-card" style={{ '--metric-color': m.color, '--metric-color-alpha': `${m.color}15` } as any}>
              <div className="metric-icon-box">
                {m.icon}
              </div>
              <div className="metric-info">
                <h4>{m.label}</h4>
                <div className="metric-main">
                  {m.unit && <span className="metric-unit">{m.unit}</span>}
                  <span className="metric-value">{m.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card-panel mt-4">
          <div className="panel-header">
            <h3>Recent Tenants</h3>
          </div>
          
          <div className="table-responsive">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Branches</th>
                  <th>MRR</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(tenant => (
                  <tr key={tenant.id}>
                    <td>
                      <div className="font-medium text-gray-900">{tenant.name}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${tenant.status === 'Active' ? 'success' : 'danger'}`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td>{tenant.branches}</td>
                    <td className="font-medium text-gray-900">KWD {tenant.mrr}</td>
                    <td className="text-right" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button className="btn-icon" title="Edit"><Edit2 size={16} /></button>
                      <button className="btn-icon danger" title="Delete"><Trash2 size={16} /></button>
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

export default SuperAdminDashboard;
