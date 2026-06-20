import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Plus, Edit, Trash, Settings, X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import './DashboardPage.css';

const TenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', plan: 'Basic', password: '', status: 'Active' });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tenants');
      if (res.data.success) {
        setTenants(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/tenants', formData);
      if (res.data.success) {
        toast.success(res.data.message);
        setIsModalOpen(false);
        setFormData({ name: '', email: '', phone: '', plan: 'Basic', password: '', status: 'Active' });
        fetchTenants();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (tenant: any) => {
    setFormData({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone || '',
      plan: tenant.plan,
      status: tenant.status,
      password: '' // Don't populate password on edit
    });
    setEditingId(tenant.id);
    setIsEditModalOpen(true);
  };

  const openSubscriptionModal = (tenant: any) => {
    setFormData({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone || '',
      plan: tenant.plan,
      status: tenant.status,
      password: ''
    });
    setEditingId(tenant.id);
    setIsSubscriptionModalOpen(true);
  };

  const handleManageSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.put(`/tenants/${editingId}`, formData);
      if (res.data.success) {
        toast.success('Subscription plan updated successfully');
        setIsSubscriptionModalOpen(false);
        fetchTenants();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTenant = () => {
    toast.info("Super Admin Notice: Dedicated MySQL tenant databases cannot be deleted from the SaaS Hub to prevent accidental data loss. Please remove the tenant database manually from PHPMyAdmin/MySQL console.");
  };

  const handleEditTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.put(`/tenants/${editingId}`, formData);
      if (res.data.success) {
        toast.success(res.data.message);
        setIsEditModalOpen(false);
        fetchTenants();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Tenant Management">
      <div className="dashboard-wrapper fade-in">
        <div className="page-header">
          <div className="header-content">
            <h2>Tenant Management</h2>
            <p className="subtitle">Manage customer accounts and subscriptions.</p>
          </div>
          <div className="quick-actions">
            <button className="btn-action primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
              Add New Tenant
            </button>
          </div>
        </div>

        <div className="card-panel mt-4">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading tenants...</div>
          ) : (
            <div className="table-responsive">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Tenant Info</th>
                    <th>Contact</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(tenant => (
                    <tr key={tenant.id}>
                      <td>
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-xs opacity-70">DB: {tenant.db_name || `kms_tenant_${tenant.id}`}</div>
                      </td>
                      <td>
                        <div>{tenant.email}</div>
                        <div className="text-xs opacity-70">{tenant.phone}</div>
                      </td>
                      <td>
                        <span className="status-badge" style={{background: '#e0e7ff', color: '#4338ca'}}>
                          {tenant.plan}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${tenant.status === 'Active' ? 'success' : 'danger'}`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="text-right" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="btn-icon" title="Edit" onClick={() => openEditModal(tenant)}><Edit size={16} /></button>
                        <button className="btn-icon primary" title="Manage Subscription" onClick={() => openSubscriptionModal(tenant)}><Settings size={16} /></button>
                        <button className="btn-icon danger" title="Delete" onClick={handleDeleteTenant}><Trash size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {tenants.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        No tenants found. Click "Add New Tenant" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '750px', width: '90%'}}>
            <div className="modal-header">
              <h2>Add New Tenant</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateTenant}>
              <div className="modal-body">
                <div className="alert-info mb-4" style={{background: '#e0f2fe', color: '#0369a1', padding: '12px', borderRadius: '8px', fontSize: '14px'}}>
                  <strong>Note:</strong> Creating a tenant will automatically provision a new dedicated MySQL database and run the standard schema setup. This may take a few seconds.
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group mb-4">
                    <label className="form-label block mb-2 font-medium">Restaurant / Company Name</label>
                    <input 
                      type="text" 
                      className="form-input w-full p-2 border rounded" 
                      required 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Pizza Palace"
                    />
                  </div>
                  
                  <div className="form-group mb-4">
                    <label className="form-label block mb-2 font-medium">Admin Email</label>
                    <input 
                      type="email" 
                      className="form-input w-full p-2 border rounded" 
                      required 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="admin@pizzapalace.com"
                    />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group mb-4">
                    <label className="form-label block mb-2 font-medium">Contact Phone</label>
                    <input 
                      type="text" 
                      className="form-input w-full p-2 border rounded" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  
                  <div className="form-group mb-4">
                    <label className="form-label block mb-2 font-medium">Initial Admin Password</label>
                    <input 
                      type="password" 
                      className="form-input w-full p-2 border rounded" 
                      required 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      placeholder="Enter secure password"
                    />
                    <p className="text-xs text-gray-500 mt-1">This will be the password for the admin email above.</p>
                  </div>
                </div>
                
                <div className="form-group mb-4">
                  <label className="form-label block mb-2 font-medium">Subscription Plan</label>
                  <select 
                    className="form-select w-full p-2 border rounded" 
                    value={formData.plan} 
                    onChange={e => setFormData({...formData, plan: e.target.value})}
                  >
                    <option value="Basic">Basic (1 Branch)</option>
                    <option value="Pro">Pro (Up to 3 Branches)</option>
                    <option value="Enterprise">Enterprise (Unlimited)</option>
                  </select>
                </div>
              </div>
              
              <div className="modal-footer flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" className="btn-action secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-action primary flex items-center" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin mr-2" /> Provisioning...</> : 'Create & Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '750px', width: '90%'}}>
            <div className="modal-header">
              <h2>Edit Tenant</h2>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleEditTenant}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group mb-4">
                    <label className="form-label block mb-2 font-medium">Restaurant / Company Name</label>
                    <input 
                      type="text" 
                      className="form-input w-full p-2 border rounded" 
                      required 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group mb-4">
                    <label className="form-label block mb-2 font-medium">Admin Email</label>
                    <input 
                      type="email" 
                      className="form-input w-full p-2 border rounded" 
                      required 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group mb-4">
                    <label className="form-label block mb-2 font-medium">Contact Phone</label>
                    <input 
                      type="text" 
                      className="form-input w-full p-2 border rounded" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group mb-4">
                    <label className="form-label block mb-2 font-medium">Subscription Plan</label>
                    <select 
                      className="form-select w-full p-2 border rounded" 
                      value={formData.plan} 
                      onChange={e => setFormData({...formData, plan: e.target.value})}
                    >
                      <option value="Basic">Basic (1 Branch)</option>
                      <option value="Pro">Pro (Up to 3 Branches)</option>
                      <option value="Enterprise">Enterprise (Unlimited)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group mb-4">
                  <label className="form-label block mb-2 font-medium">Status</label>
                  <select 
                    className="form-select w-full p-2 border rounded" 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
              
              <div className="modal-footer flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" className="btn-action secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-action primary flex items-center" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isSubscriptionModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '500px'}}>
            <div className="modal-header">
              <h2>Manage Subscription</h2>
              <button className="close-btn" onClick={() => setIsSubscriptionModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleManageSubscription}>
              <div className="modal-body">
                <p className="mb-4 text-sm text-gray-600">
                  Update subscription plans, billing limits, or account status settings for <strong>{formData.name}</strong>.
                </p>

                <div className="form-group mb-4">
                  <label className="form-label block mb-2 font-medium">Subscription Plan</label>
                  <select 
                    className="form-select w-full p-2 border rounded" 
                    value={formData.plan} 
                    onChange={e => setFormData({...formData, plan: e.target.value})}
                  >
                    <option value="Basic">Basic (1 Branch)</option>
                    <option value="Pro">Pro (Up to 3 Branches)</option>
                    <option value="Enterprise">Enterprise (Unlimited)</option>
                  </select>
                </div>

                <div className="form-group mb-4">
                  <label className="form-label block mb-2 font-medium">Account Status</label>
                  <select 
                    className="form-select w-full p-2 border rounded" 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Active">Active (Full Access)</option>
                    <option value="Inactive">Inactive (Suspended/Disabled)</option>
                    <option value="Suspended">Suspended (Billing Issue)</option>
                  </select>
                </div>
              </div>
              
              <div className="modal-footer flex justify-end gap-3 mt-6 border-t pt-4">
                <button type="button" className="btn-action secondary" onClick={() => setIsSubscriptionModalOpen(false)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-action primary flex items-center" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</> : 'Update Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TenantManagement;
