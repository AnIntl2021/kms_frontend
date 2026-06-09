import FoodLoader from '../components/FoodLoader';
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Settings, Save, Building2, Calculator, Factory } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useLanguage } from '../hooks/useLanguage';

const SettingsPage = () => {
  const { t, language } = useLanguage();
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
      toast.success(t('settings_updated_success'));
    } catch (error) {
      toast.error(t('failed_update_configs'));
    } finally {
      setIsSaving(false);
    }
  };

  const renderTabContent = () => {
    if (loading) return <FoodLoader size="large" />;

    switch (activeTab) {
      case 'general':
        return (
          <div className="settings-grid animated fadeIn">
            <div className="settings-card">
              <div className="card-header">
                <Building2 size={20} />
                <h3>{t('business_identity')}</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label>{t('company_name_label')}</label>
                  <input 
                    type="text" 
                    value={settings.company_name || ''} 
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    placeholder={t('enter_business_name')}
                  />
                </div>
                <div className="form-group">
                  <label>{t('display_address')}</label>
                  <textarea 
                    value={settings.company_address || ''} 
                    onChange={(e) => handleChange('company_address', e.target.value)}
                    placeholder={t('physical_address_hint')}
                  />
                </div>
                <div className="form-group">
                  <label>{t('primary_contact')}</label>
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
                <h3>{t('manufacturing_logic')}</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label>{t('default_expiry_buffer_days')}</label>
                  <div className="input-with-hint">
                    <input 
                      type="number" 
                      value={settings.default_expiry_days || 4} 
                      onChange={(e) => handleChange('default_expiry_days', e.target.value)}
                    />
                    <span>{t('auto_expiry_hint')}</span>
                  </div>
                </div>
                <div className="info-box">
                  <p><strong>{t('note')}:</strong> {t('shelf_life_note')}</p>
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
                <h3>{t('accounting_localization')}</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label>{t('service_currency_symbol')}</label>
                  <input 
                    type="text" 
                    value={settings.currency_symbol || 'KWD'} 
                    onChange={(e) => handleChange('currency_symbol', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>{t('vat_percentage_label')}</label>
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
    <Layout title={t('settings')}>
      <div className="settings-page-container">
        <header className="page-header">
          <div className="header-info">
            <div className="header-icon">
              <Settings size={24} />
            </div>
            <div style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
              <h1>{t('global_configuration')}</h1>
              <p>{t('manage_system_defaults_msg')}</p>
            </div>
          </div>
          
          <button 
            className={`btn-save ${isSaving ? 'loading' : ''}`} 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? t('saving') : <><Save size={18} /> {t('update_settings')}</>}
          </button>
        </header>

        <div className="settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            {t('general_tab')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'production' ? 'active' : ''}`}
            onClick={() => setActiveTab('production')}
          >
            {t('production_tab')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'financials' ? 'active' : ''}`}
            onClick={() => setActiveTab('financials')}
          >
            {t('financials_tab')}
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
