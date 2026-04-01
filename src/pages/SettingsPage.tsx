import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Settings, Save, Building2, Calculator, Factory, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/settings/update', settings);
      toast.success('System Settings Updated Successfully! ⚙️');
    } catch (error) {
      toast.error('Failed to update system configurations.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderTabContent = () => {
    if (loading) return <div className="loading-container">Gathering system configurations...</div>;

    switch (activeTab) {
      case 'general':
        return (
          <div className="settings-grid animated fadeIn">
            <div className="settings-card">
              <div className="card-header">
                <Building2 size={20} />
                <h3>Business Identity</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label>Company Name</label>
                  <input 
                    type="text" 
                    value={settings.company_name || ''} 
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    placeholder="Enter business name"
                  />
                </div>
                <div className="form-group">
                  <label>Display Address</label>
                  <textarea 
                    value={settings.company_address || ''} 
                    onChange={(e) => handleChange('company_address', e.target.value)}
                    placeholder="Physical address for labels/invoices"
                  />
                </div>
                <div className="form-group">
                  <label>Primary Contact</label>
                  <input 
                    type="text" 
                    value={settings.contact_number || ''} 
                    onChange={(e) => handleChange('contact_number', e.target.value)}
                    placeholder="e.g. +965 12345678"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 'production':
        return (
          <div className="settings-grid animated fadeIn">
             <div className="settings-card">
              <div className="card-header">
                <Factory size={20} />
                <h3>Manufacturing Logic</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label>Default Expiry Buffer (Days)</label>
                  <div className="input-with-hint">
                    <input 
                      type="number" 
                      value={settings.default_expiry_days || 4} 
                      onChange={(e) => handleChange('default_expiry_days', e.target.value)}
                    />
                    <span>Automatically sets the [Use By] date based on production date.</span>
                  </div>
                </div>
                <div className="info-box">
                  <p><strong>Note:</strong> Typical shelf life for Fresh 'n' Fast products is 4 days including production day.</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'financials':
        return (
          <div className="settings-grid animated fadeIn">
             <div className="settings-card">
              <div className="card-header">
                <Calculator size={20} />
                <h3>Accounting & Localization</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label>Service Currency Symbol</label>
                  <input 
                    type="text" 
                    value={settings.currency_symbol || 'KWD'} 
                    onChange={(e) => handleChange('currency_symbol', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>GST/VAT Percentage (%)</label>
                  <input 
                    type="number" 
                    value={settings.vat_percentage || 0} 
                    onChange={(e) => handleChange('vat_percentage', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout title="System Settings">
      <div className="settings-page-container">
        <header className="page-header">
          <div className="header-info">
            <div className="header-icon">
              <Settings size={24} />
            </div>
            <div>
              <h1>Global Configuration</h1>
              <p>Manage system-wide defaults and business information.</p>
            </div>
          </div>
          
          <button 
            className={`btn-save ${isSaving ? 'loading' : ''}`} 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : <><Save size={18} /> Update Settings</>}
          </button>
        </header>

        <div className="settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button 
            className={`tab-btn ${activeTab === 'production' ? 'active' : ''}`}
            onClick={() => setActiveTab('production')}
          >
            Production
          </button>
          <button 
            className={`tab-btn ${activeTab === 'financials' ? 'active' : ''}`}
            onClick={() => setActiveTab('financials')}
          >
            Financials
          </button>
        </div>

        <div className="tab-viewport">
          {renderTabContent()}
        </div>
      </div>

      <style>{`
        .settings-page-container {
          padding: 1rem;
          max-width: 900px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          width: 48px;
          height: 48px;
          background: rgba(16, 71, 40, 0.1);
          color: var(--primary);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-info h1 {
          font-size: 1.5rem;
          margin: 0;
          color: #1e293b;
        }

        .header-info p {
          color: #64748b;
          margin: 0;
          font-size: 0.9rem;
        }

        .btn-save {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-save:hover {
          background: #0d3b21;
          transform: translateY(-1px);
        }

        .settings-tabs {
          display: flex;
          gap: 1rem;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 2rem;
        }

        .tab-btn {
          padding: 0.8rem 1.5rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          color: #64748b;
          font-weight: 500;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          color: var(--primary);
        }

        .tab-btn.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }

        .settings-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          padding: 1.5rem;
          border: 1px solid #f1f5f9;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin-bottom: 1.5rem;
          color: #475569;
        }

        .card-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
        }

        .form-group input, 
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
          font-family: inherit;
        }

        .form-group textarea {
          min-height: 80px;
          resize: vertical;
        }

        .input-with-hint span {
          display: block;
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 0.4rem;
        }

        .info-box {
          background: #f0fdf4;
          border-left: 4px solid #16a34a;
          padding: 1rem;
          border-radius: 4px;
          margin-top: 1rem;
        }

        .info-box p {
          margin: 0;
          font-size: 0.85rem;
          color: #166534;
        }

        .settings-success-alert {
          background: #ecfdf5;
          color: #065f46;
          padding: 0.8rem 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          animation: slideInDown 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .animated {
          animation-duration: 0.5s;
          animation-fill-mode: both;
        }

        .fadeIn {
          animation-name: fadeIn;
        }
      `}</style>
    </Layout>
  );
};

export default SettingsPage;
