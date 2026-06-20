import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../hooks/useLanguage';
import { Shield, Users, Edit, Trash2, X, Plus, Key } from 'lucide-react';
import api from '../api/axios';
import './RoleManagementPage.css';
import './AssetsManagementPage.css'; // Reuse modal styles

const ALL_PERMISSIONS = [
  { id: 'dashboard', label: 'Dashboard Overview' },
  { id: 'sales', label: 'Sales Module' },
  { id: 'inventory', label: 'Inventory Management' },
  { id: 'assets', label: 'Assets & Payroll' },
  { id: 'balance-sheet', label: 'Balance Sheet' },
  { id: 'accounts', label: 'Accounts & Reports' },
  { id: 'roles', label: 'Role Management' },
  { id: 'users', label: 'System Users' }
];

const RoleManagementPage: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');
  
  const [roles, setRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rolesRes, usersRes] = await Promise.all([
        api.get('/auth/roles').catch(() => ({ data: { success: false } })),
        api.get('/auth/users').catch(() => ({ data: { success: false } }))
      ]);
      if (rolesRes.data?.success) setRoles(rolesRes.data.data);
      if (usersRes.data?.success) setUsers(usersRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedPermissions = formData.getAll('permissions');
    
    const roleData = {
      role_name: formData.get('role_name'),
      display_name_en: formData.get('display_name_en'),
      permissions: selectedPermissions
    };

    try {
      if (editingRole) {
        await api.put(`/auth/roles/${editingRole.role_id}`, roleData);
      } else {
        await api.post('/auth/roles', roleData);
      }
      setIsRoleModalOpen(false);
      setEditingRole(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save role");
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (window.confirm('Are you sure you want to completely delete this role?')) {
      try {
        await api.delete(`/auth/roles/${id}`);
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to delete role");
      }
    }
  };

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      if (editingUser) {
        await api.put(`/auth/users/${editingUser.admin_id}`, Object.fromEntries(formData));
      } else {
        await api.post('/auth/users', Object.fromEntries(formData));
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save user. Make sure username and email are unique.");
    }
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    if (window.confirm(`Are you sure you want to ${newStatus === 'inactive' ? 'disable' : 'enable'} this user?`)) {
      try {
        const formData = new FormData();
        formData.append('first_name', user.first_name || '');
        formData.append('last_name', user.last_name || '');
        formData.append('email', user.email || '');
        formData.append('username', user.username || '');
        if (user.role_id) formData.append('role_id', user.role_id);
        formData.append('status', newStatus);

        await api.put(`/auth/users/${user.admin_id}`, Object.fromEntries(formData));
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to update user status");
      }
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        await api.delete(`/auth/users/${id}`);
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to delete user");
      }
    }
  };

  return (
    <Layout title={t('role_access_management')}>
      <div className="roles-management-container fade-in">
        
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            <Shield size={18} /> {t('roles_permissions')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} /> {t('system_login_users')}
          </button>
        </div>

        {activeTab === 'roles' && (
          <div className="data-table-wrapper fade-in">
            <div className="table-header">
              <h2>{t('custom_access_roles')}</h2>
              <button className="primary-btn" onClick={() => { setEditingRole(null); setIsRoleModalOpen(true); }}>
                <Plus size={16} style={{marginRight: '6px', verticalAlign: 'middle'}}/> {t('create_role')}
              </button>
            </div>
            
            <div className="roles-grid">
              {roles.map(role => {
                const perms = typeof role.permissions === 'string' ? JSON.parse(role.permissions || '[]') : (role.permissions || []);
                return (
                  <div key={role.role_id} className="role-card">
                    <div className="role-header">
                      <div className="role-icon-wrapper">
                        <Key size={20} />
                      </div>
                      <div className="role-info">
                        <h3>{role.display_name_en}</h3>
                        <p>{t('internal_id')}: {role.role_name}</p>
                      </div>
                      <div style={{marginLeft: 'auto', display: 'flex', gap: '8px'}}>
                        <button 
                          className="btn-close" 
                          onClick={() => { setEditingRole(role); setIsRoleModalOpen(true); }}
                          title={t('edit_role')}
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          className="btn-close" 
                          style={{ color: '#ef4444' }}
                          onClick={() => handleDeleteRole(role.role_id)}
                          title={t('delete_role')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="permissions-list">
                      {perms.length === 0 ? <span className="permission-badge">{t('no_permissions')}</span> : null}
                      {perms.map((p: string) => (
                        <span key={p} className="permission-badge">{p}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="data-table-wrapper fade-in">
            <div className="table-header">
              <h2>{t('system_users')}</h2>
              <button className="primary-btn" onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}>
                <Plus size={16} style={{marginRight: '6px', verticalAlign: 'middle'}}/> {t('create_user')}
              </button>
            </div>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>{t('name')}</th>
                  <th>{t('username')}</th>
                  <th>{t('email')}</th>
                  <th>{t('role')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.admin_id}>
                    <td>{user.first_name} {user.last_name}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className="status-badge paid" style={{background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}}>
                        {user.display_name_en || (user.role_name ? user.role_name : 'Super Admin')}
                      </span>
                    </td>
                    <td><span className={`status-badge ${user.status === 'active' ? 'paid' : 'pending'}`}>{user.status}</span></td>
                    <td>
                      {user.admin_id !== 1 && (
                        <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-icon edit" onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }} title={t('edit_user')}>
                            <Edit size={16} />
                          </button>
                          <button 
                            className="btn-icon" 
                            style={{ color: user.status === 'active' ? '#f59e0b' : '#10b981', background: 'transparent', border: 'none', cursor: 'pointer' }} 
                            onClick={() => handleToggleStatus(user)} 
                            title={user.status === 'active' ? t('disable_user') : t('enable_user')}
                          >
                            <Shield size={16} />
                          </button>
                          <button className="btn-icon delete" onClick={() => handleDeleteUser(user.admin_id)} title={t('delete_user')}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Role Modal */}
        {isRoleModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{editingRole ? t('edit_role') : t('create_role')}</h3>
                <button className="btn-close" onClick={() => setIsRoleModalOpen(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveRole}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>{t('role_name')}</label>
                    <input type="text" name="role_name" defaultValue={editingRole?.role_name} placeholder="e.g. kitchen_staff" required readOnly={!!editingRole} />
                  </div>
                  <div className="form-group">
                    <label>{t('display_name')}</label>
                    <input type="text" name="display_name_en" defaultValue={editingRole?.display_name_en} placeholder="e.g. Kitchen Staff" required />
                  </div>
                  <div className="form-group">
                    <label>{t('module_access_permissions')}</label>
                    <div className="permissions-grid">
                      {ALL_PERMISSIONS.map(perm => {
                        const currentPerms = editingRole && typeof editingRole.permissions === 'string' 
                          ? JSON.parse(editingRole.permissions || '[]') 
                          : (editingRole?.permissions || []);
                        return (
                          <label key={perm.id} className="permission-checkbox">
                            <input 
                              type="checkbox" 
                              name="permissions" 
                              value={perm.id} 
                              defaultChecked={currentPerms.includes(perm.id)} 
                            />
                            {perm.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setIsRoleModalOpen(false)}>{t('cancel')}</button>
                  <button type="submit" className="primary-btn">{editingRole ? t('update_role') : t('save_role')}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User Modal */}
        {isUserModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{editingUser ? t('edit_user') : t('create_user')}</h3>
                <button className="btn-close" onClick={() => { setIsUserModalOpen(false); setEditingUser(null); }}><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveUser}>
                <div className="modal-body">
                  <div style={{display: 'flex', gap: '12px'}}>
                    <div className="form-group" style={{flex: 1}}>
                      <label>{t('first_name')}</label>
                      <input type="text" name="first_name" defaultValue={editingUser?.first_name} required />
                    </div>
                    <div className="form-group" style={{flex: 1}}>
                      <label>{t('last_name')}</label>
                      <input type="text" name="last_name" defaultValue={editingUser?.last_name} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>{t('email')}</label>
                    <input type="email" name="email" defaultValue={editingUser?.email} required />
                  </div>
                  <div className="form-group">
                    <label>{t('username')}</label>
                    <input type="text" name="username" defaultValue={editingUser?.username} required />
                  </div>
                  <div className="form-group">
                    <label>{t('password')} {editingUser && <span style={{fontSize: '12px', color: '#64748b'}}>{t('leave_blank_keep_current')}</span>}</label>
                    <input type="password" name="password" required={!editingUser} />
                  </div>
                  <div style={{display: 'flex', gap: '12px'}}>
                    <div className="form-group" style={{flex: 1}}>
                      <label>{t('assigned_role')}</label>
                      <select key={editingUser ? editingUser.admin_id : 'new'} name="role_id" required defaultValue={editingUser?.role_id ? editingUser.role_id.toString() : ""}>
                        <option value="" disabled>{t('select_role')}</option>
                        {roles.map(r => (
                          <option key={r.role_id} value={r.role_id.toString()}>{r.display_name_en}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{flex: 1}}>
                      <label>Assigned Branch (Optional)</label>
                      <select name="branch_id" defaultValue={editingUser?.branch_id || ""}>
                        <option value="">All Branches / Global</option>
                        <option value="1">Main Branch (City Center)</option>
                        <option value="2">Northside Branch</option>
                        <option value="3">Airport Branch</option>
                      </select>
                    </div>
                    {editingUser && (
                      <div className="form-group" style={{flex: 1}}>
                        <label>{t('status')}</label>
                        <select name="status" defaultValue={editingUser.status} required>
                          <option value="active">{t('active')}</option>
                          <option value="inactive">{t('inactive')}</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => { setIsUserModalOpen(false); setEditingUser(null); }}>{t('cancel')}</button>
                  <button type="submit" className="primary-btn">{editingUser ? t('update_user') : t('create_user')}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default RoleManagementPage;
