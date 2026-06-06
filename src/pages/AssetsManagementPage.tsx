import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../hooks/useLanguage';
import { Users, Briefcase, Building, Landmark, TrendingUp, TrendingDown, DollarSign, X } from 'lucide-react';
import api from '../api/axios';
import './AssetsManagementPage.css';

const AssetsManagementPage: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'salaries' | 'assets' | 'liabilities'>('salaries');

  // Modal States
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isLiabilityModalOpen, setIsLiabilityModalOpen] = useState(false);

  const [salaries, setSalaries] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [liabilities, setLiabilities] = useState<any[]>([]);

  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [editingLiability, setEditingLiability] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salRes, assRes, liabRes] = await Promise.all([
        api.get('/employees').catch(() => ({ data: { success: false } })),
        api.get('/assets').catch(() => ({ data: { success: false } })),
        api.get('/liabilities').catch(() => ({ data: { success: false } }))
      ]);
      if (salRes.data?.success) setSalaries(salRes.data.data);
      if (assRes.data?.success) setAssets(assRes.data.data);
      if (liabRes.data?.success) setLiabilities(liabRes.data.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.employee_id}`, Object.fromEntries(formData));
      } else {
        await api.post('/employees', Object.fromEntries(formData));
      }
      setIsPayrollModalOpen(false);
      setEditingEmployee(null);
      fetchData();
    } catch(err) { console.error(err); }
  };

  const handleSaveAsset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      if (editingAsset) {
        await api.put(`/assets/${editingAsset.asset_id}`, Object.fromEntries(formData));
      } else {
        await api.post('/assets', Object.fromEntries(formData));
      }
      setIsAssetModalOpen(false);
      setEditingAsset(null);
      fetchData();
    } catch(err) { console.error(err); }
  };

  const handleSaveLiability = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      if (editingLiability) {
        await api.put(`/liabilities/${editingLiability.liability_id}`, Object.fromEntries(formData));
      } else {
        await api.post('/liabilities', Object.fromEntries(formData));
      }
      setIsLiabilityModalOpen(false);
      setEditingLiability(null);
      fetchData();
    } catch(err) { console.error(err); }
  };

  // Calculate totals
  const totalSalaries = salaries.reduce((acc, curr) => acc + Number(curr.salary || 0), 0);
  const totalAssets = assets.reduce((acc, curr) => acc + Number(curr.value || 0), 0);
  const totalLiabilities = liabilities.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const netValue = totalAssets - totalLiabilities;

  return (
    <Layout title="Assets Management">
      <div className="assets-management-container">
        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card glass-panel">
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Building size={24} />
            </div>
            <div className="kpi-details">
              <span className="kpi-label">Total Assets</span>
              <h3 className="kpi-value">{totalAssets.toLocaleString()} د.ك</h3>
            </div>
          </div>

          <div className="kpi-card glass-panel">
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <Landmark size={24} />
            </div>
            <div className="kpi-details">
              <span className="kpi-label">Total Liabilities</span>
              <h3 className="kpi-value">{totalLiabilities.toLocaleString()} د.ك</h3>
            </div>
          </div>

          <div className="kpi-card glass-panel">
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <DollarSign size={24} />
            </div>
            <div className="kpi-details">
              <span className="kpi-label">Net Value</span>
              <h3 className="kpi-value">{netValue.toLocaleString()} د.ك</h3>
            </div>
          </div>

          <div className="kpi-card glass-panel">
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <Users size={24} />
            </div>
            <div className="kpi-details">
              <span className="kpi-label">Monthly Payroll</span>
              <h3 className="kpi-value">{totalSalaries.toLocaleString()} د.ك</h3>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'salaries' ? 'active' : ''}`}
            onClick={() => setActiveTab('salaries')}
          >
            <Users size={18} /> Employee Salaries
          </button>
          <button 
            className={`tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
            onClick={() => setActiveTab('assets')}
          >
            <Briefcase size={18} /> Company Assets
          </button>
          <button 
            className={`tab-btn ${activeTab === 'liabilities' ? 'active' : ''}`}
            onClick={() => setActiveTab('liabilities')}
          >
            <Landmark size={18} /> Company Liabilities
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content-area glass-panel">
          {activeTab === 'salaries' && (
            <div className="data-table-wrapper fade-in">
              <div className="table-header">
                <h2>Employee Salaries</h2>
                <button className="primary-btn" onClick={() => { setEditingEmployee(null); setIsPayrollModalOpen(true); }}>Process Payroll</button>
              </div>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Role</th>
                    <th>Salary</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salaries.map(emp => (
                    <tr key={emp.employee_id}>
                      <td>{emp.name}</td>
                      <td>{emp.role}</td>
                      <td>{Number(emp.salary).toLocaleString()} د.ك</td>
                      <td>
                        <span className={`status-badge ${emp.status.toLowerCase()}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td>
                        <button className="action-link" onClick={() => { setEditingEmployee(emp); setIsPayrollModalOpen(true); }}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="data-table-wrapper fade-in">
              <div className="table-header">
                <h2>Company Assets Register</h2>
                <button className="primary-btn" onClick={() => { setEditingAsset(null); setIsAssetModalOpen(true); }}>Add Asset</button>
              </div>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Asset Name</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Depreciation Rate</th>
                    <th>Date Acquired</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(asset => (
                    <tr key={asset.asset_id}>
                      <td>{asset.name}</td>
                      <td>{asset.type}</td>
                      <td>{Number(asset.value).toLocaleString()} د.ك</td>
                      <td>{asset.depreciation_rate ? `${asset.depreciation_rate}% / yr` : '-'}</td>
                      <td>{asset.date_acquired ? new Date(asset.date_acquired).toLocaleDateString() : '-'}</td>
                      <td>
                        <button className="action-link" onClick={() => { setEditingAsset(asset); setIsAssetModalOpen(true); }}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'liabilities' && (
            <div className="data-table-wrapper fade-in">
              <div className="table-header">
                <h2>Liabilities & Debts</h2>
                <button className="primary-btn" onClick={() => { setEditingLiability(null); setIsLiabilityModalOpen(true); }}>Add Liability</button>
              </div>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Liability Name</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Interest</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {liabilities.map(liab => (
                    <tr key={liab.liability_id}>
                      <td>{liab.name}</td>
                      <td>{liab.type}</td>
                      <td>{Number(liab.amount).toLocaleString()} د.ك</td>
                      <td>{liab.interest_rate}</td>
                      <td>{liab.due_date ? new Date(liab.due_date).toLocaleDateString() : '-'}</td>
                      <td>
                        <button className="action-link" onClick={() => { setEditingLiability(liab); setIsLiabilityModalOpen(true); }}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modals */}
        {isPayrollModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '500px'}}>
              <div className="modal-header">
                <h3>{editingEmployee ? 'Update Employee / Payroll' : 'Add Employee / Payroll'}</h3>
                <button className="btn-close" onClick={() => { setIsPayrollModalOpen(false); setEditingEmployee(null); }}><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveEmployee}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Employee Name</label>
                    <input type="text" name="name" defaultValue={editingEmployee?.name} placeholder="e.g. Ahmad Abdullah" required />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select name="role" defaultValue={editingEmployee?.role || "Staff"} required>
                      <option value="Staff">Staff</option>
                      <option value="Chef">Chef</option>
                      <option value="Store Manager">Store Manager</option>
                      <option value="Delivery Driver">Delivery Driver</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Salary Amount (د.ك)</label>
                    <input type="number" name="salary" defaultValue={editingEmployee?.salary} placeholder="0.000" step="0.001" required />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => { setIsPayrollModalOpen(false); setEditingEmployee(null); }}>Cancel</button>
                  <button type="submit" className="primary-btn">{editingEmployee ? 'Update' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isAssetModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '500px'}}>
              <div className="modal-header">
                <h3>{editingAsset ? 'Update Asset' : 'Add Asset'}</h3>
                <button className="btn-close" onClick={() => { setIsAssetModalOpen(false); setEditingAsset(null); }}><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveAsset}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Asset Name</label>
                    <input type="text" name="name" defaultValue={editingAsset?.name} placeholder="e.g. Delivery Van A" required />
                  </div>
                  <div className="form-group">
                    <label>Asset Type</label>
                    <select name="type" defaultValue={editingAsset?.type || "General"} required>
                      <option value="Vehicle">Vehicle</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Furniture">Furniture</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Estimated Value (د.ك)</label>
                    <input type="number" name="value" defaultValue={editingAsset?.value} placeholder="0.000" step="0.001" required />
                  </div>
                  <div className="form-group">
                    <label>Depreciation Rate (%) / Year</label>
                    <input type="number" name="depreciation_rate" defaultValue={editingAsset?.depreciation_rate} placeholder="e.g. 10" step="0.01" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => { setIsAssetModalOpen(false); setEditingAsset(null); }}>Cancel</button>
                  <button type="submit" className="primary-btn">{editingAsset ? 'Update Asset' : 'Save Asset'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isLiabilityModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '500px'}}>
              <div className="modal-header">
                <h3>{editingLiability ? 'Update Account' : 'Add Liability / Equity'}</h3>
                <button className="btn-close" onClick={() => { setIsLiabilityModalOpen(false); setEditingLiability(null); }}><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveLiability}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Account Name</label>
                    <input type="text" name="name" defaultValue={editingLiability?.name} placeholder="e.g. Bank Loan or Owner's Equity" required />
                  </div>
                  <div className="form-group">
                    <label>Account Type</label>
                    <select name="type" defaultValue={editingLiability?.type || "Loan"} required>
                      <option value="Loan">Loan</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Owner's Equity">Owner's Equity</option>
                      <option value="Tax Payable">Tax Payable</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Amount (د.ك)</label>
                    <input type="number" name="amount" defaultValue={editingLiability?.amount} placeholder="0.000" step="0.001" required />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => { setIsLiabilityModalOpen(false); setEditingLiability(null); }}>Cancel</button>
                  <button type="submit" className="primary-btn">{editingLiability ? 'Update' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default AssetsManagementPage;
