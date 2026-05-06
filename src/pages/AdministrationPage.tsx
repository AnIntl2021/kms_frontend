import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { 
  Users, 
  Building2, 
  History, 
  Plus, 
  Search, 
  Mail, 
  Edit3, 
  Trash2,
  Lock,
  X,
  User,
  Hash,
  Phone,
  LayoutGrid
} from 'lucide-react';
import './InventoryPage.css'; 
import { toast } from 'react-toastify';
import { useLanguage } from '../hooks/useLanguage';

interface AdminUser {
  admin_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role_name: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}

interface Branch {
  branch_id: number;
  name_en: string;
  name_ar: string;
  phone: string;
  status: 'active' | 'inactive';
}

interface AuditLog {
  audit_id: number;
  username: string;
  action: string;
  entity_name: string;
  created_at: string;
  ip_address: string;
}

interface Role {
  role_id: number;
  role_name: string;
  display_name_en: string;
}

const AdministrationPage = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'users' | 'branches' | 'logs'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  
  // Forms
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role_id: '',
    status: 'active'
  });

  const [branchForm, setBranchForm] = useState({
    name_en: '',
    name_ar: '',
    phone: '',
    location_en: '',
    status: 'active'
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const [userRes, roleRes] = await Promise.all([
          api.get('/auth/users'),
          api.get('/auth/roles')
        ]);
        setUsers(userRes.data.data || []);
        setRoles(roleRes.data.data || []);
      } else if (activeTab === 'branches') {
        const res = await api.get('/branches');
        setBranches(res.data.data || []);
      } else if (activeTab === 'logs') {
        const res = await api.get('/business/audit-logs');
        setLogs(res.data.data || []);
      }
    } catch (e) {
      console.error('Fetch Admin Data failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/users', userForm);
      setShowUserModal(false);
      setUserForm({ username: '', email: '', password: '', first_name: '', last_name: '', role_id: '', status: 'active' });
      fetchData();
      toast.success(t('staff_account_success'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create staff account.');
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/branches', branchForm);
      setShowBranchModal(false);
      setBranchForm({ name_en: '', name_ar: '', phone: '', location_en: '', status: 'active' });
      fetchData();
      toast.success(t('branch_network_success'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add branch.');
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'active') return 'status-badge healthy';
    if (s === 'inactive') return 'status-badge pending';
    return 'status-badge critical';
  };

  return (
    <Layout title={t('sys_administration')}>
      <div className="inventory-container">
        {/* Navigation Tabs */}
        <div className="tabs-navigation" style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <button onClick={() => setActiveTab('users')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 4px', fontWeight: 700, fontSize: '15px', color: activeTab === 'users' ? 'var(--primary)' : '#64748b', borderBottom: activeTab === 'users' ? '3px solid var(--primary)' : 'none', cursor: 'pointer' }}>
            <Users size={20} /> {t('staff_management')}
          </button>
          <button onClick={() => setActiveTab('branches')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 4px', fontWeight: 700, fontSize: '15px', color: activeTab === 'branches' ? 'var(--primary)' : '#64748b', borderBottom: activeTab === 'branches' ? '3px solid var(--primary)' : 'none', cursor: 'pointer' }}>
            <Building2 size={20} /> {t('branch_network')}
          </button>
          <button onClick={() => setActiveTab('logs')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 4px', fontWeight: 700, fontSize: '15px', color: activeTab === 'logs' ? 'var(--primary)' : '#64748b', borderBottom: activeTab === 'logs' ? '3px solid var(--primary)' : 'none', cursor: 'pointer' }}>
            <History size={20} /> {t('audit_logs')}
          </button>
        </div>

        {/* Global Toolbar */}
        <div className="inventory-actions">
           <div className="search-group">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder={t('search_tab_hint').replace('{tab}', t(activeTab))} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
           </div>
           <div className="action-buttons">
              {activeTab === 'users' && <button className="btn-add" style={{ background: 'var(--primary)' }} onClick={() => setShowUserModal(true)}><Plus size={18} /> {t('add_user')}</button>}
              {activeTab === 'branches' && <button className="btn-add" style={{ background: 'var(--primary)' }} onClick={() => setShowBranchModal(true)}><Plus size={18} /> {t('new_branch')}</button>}
           </div>
        </div>

        {/* Dynamic Table Card */}
        <div className="stock-table-card">
          <div className="table-wrapper">
            <table>
              {activeTab === 'users' && (
                <>
                  <thead>
                    <tr>
                      <th>{t('admin_name')}</th>
                      <th>{t('username')}</th>
                      <th>{t('email_contact')}</th>
                      <th>{t('role')}</th>
                      <th>{t('created')}</th>
                      <th>{t('status')}</th>
                      <th className="text-end">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="text-center py-5">{t('fetching_staff_records')}</td></tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-5">{t('no_staff_found')}</td></tr>
                    ) : users.map(user => (
                      <tr key={user.admin_id}>
                        <td>
                          <div className="item-info">
                            <strong>{user.first_name} {user.last_name || ''}</strong>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>ID: #{user.admin_id}</span>
                          </div>
                        </td>
                        <td><strong>{user.username}</strong></td>
                        <td>
                          <div style={{ fontSize: '13px' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}><Mail size={12}/> {user.email}</div>
                          </div>
                        </td>
                        <td>
                           <span style={{ background: '#f0f9ff', color: '#0369a1', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                              {user.role_name?.toUpperCase().replace(/_/g, ' ')}
                           </span>
                        </td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td><span className={getStatusBadge(user.status)}>{user.status}</span></td>
                        <td className="text-end">
                           <div className="row-actions">
                              <button className="btn-icon-sm" style={{color: '#6366f1'}} title="Reset Password"><Lock size={16}/></button>
                              <button className="btn-icon-sm" style={{color: 'var(--primary)'}}><Edit3 size={16}/></button>
                              <button className="btn-icon-sm" style={{color: '#ef4444'}}><Trash2 size={16}/></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'branches' && (
                <>
                  <thead>
                    <tr>
                      <th>{t('branch_name_en')}</th>
                      <th>{t('branch_name_ar')}</th>
                      <th>{t('phone')}</th>
                      <th>{t('status')}</th>
                      <th className="text-end">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="text-center py-5">{t('syncing_network')}</td></tr>
                    ) : branches.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-5">{t('no_branches_recorded')}</td></tr>
                    ) : branches.map(b => (
                      <tr key={b.branch_id}>
                        <td><strong>{b.name_en}</strong></td>
                        <td dir="rtl" className="text-end" style={{ fontSize: '15px' }}>{b.name_ar}</td>
                        <td>{b.phone}</td>
                        <td><span className={getStatusBadge(b.status)}>{b.status}</span></td>
                        <td className="text-end">
                           <div className="row-actions">
                              <button className="btn-icon-sm" style={{color: 'var(--primary)'}}><Edit3 size={16}/></button>
                              <button className="btn-icon-sm" style={{color: '#ef4444'}}><Trash2 size={16}/></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'logs' && (
                <>
                  <thead>
                    <tr>
                      <th>{t('action')}</th>
                      <th>{t('user')}</th>
                      <th>{t('entity')}</th>
                      <th>{t('timestamp')}</th>
                      <th>{t('ip_address')}</th>
                      <th className="text-end">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                       <tr><td colSpan={6} className="text-center py-5">{t('pulling_audit_trail')}</td></tr>
                    ) : logs.length === 0 ? (
                       <tr><td colSpan={6} className="text-center py-5">{t('no_logs_found')}</td></tr>
                    ) : logs.map(l => (
                      <tr key={l.audit_id}>
                        <td><strong>{l.action}</strong></td>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14} color="#64748b"/> {l.username || 'System'}</div></td>
                        <td><span style={{ fontSize: '12px', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px' }}>{l.entity_name}</span></td>
                        <td>{new Date(l.created_at).toLocaleString()}</td>
                        <td><code>{l.ip_address || '127.0.0.1'}</code></td>
                        <td className="text-right"><button className="btn-more"><History size={16}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Register Staff Modal */}
      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3><User size={24} style={{ marginRight: '10px', color: 'var(--primary)' }} /> {t('register_staff_account')}</h3>
              <button className="btn-close" onClick={() => setShowUserModal(false)}><X /></button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label><User size={14} /> {t('first_name')}</label>
                    <input type="text" required value={userForm.first_name} onChange={e => setUserForm({...userForm, first_name: e.target.value})} placeholder="e.g. John" />
                  </div>
                  <div className="form-group">
                    <label><User size={14} /> {t('last_name')}</label>
                    <input type="text" value={userForm.last_name} onChange={e => setUserForm({...userForm, last_name: e.target.value})} placeholder="e.g. Doe" />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label><Hash size={14} /> {t('username')}</label>
                    <input type="text" required value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} placeholder="staff_john" />
                  </div>
                  <div className="form-group">
                    <label><Mail size={14} /> {t('email_address')}</label>
                    <input type="email" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} placeholder="john@example.com" />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label><Lock size={14} /> {t('secret_password')}</label>
                    <input type="password" required value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} placeholder="••••••••" />
                  </div>
                  <div className="form-group">
                    <label><LayoutGrid size={14} /> {t('system_role')}</label>
                    <select required value={userForm.role_id} onChange={e => setUserForm({...userForm, role_id: e.target.value})}>
                      <option value="">{t('choose_role')}</option>
                      {roles.map(r => <option key={r.role_id} value={r.role_id}>{r.display_name_en}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowUserModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn-primary">
                  <Plus size={18} /> {t('create_account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {showBranchModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3><Building2 size={24} style={{ marginRight: '10px', color: 'var(--primary)' }} /> {t('create_new_branch')}</h3>
              <button className="btn-close" onClick={() => setShowBranchModal(false)}><X /></button>
            </div>
            <form onSubmit={handleAddBranch}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label><Building2 size={14} /> {t('branch_name_en')}</label>
                  <input type="text" required value={branchForm.name_en} onChange={e => setBranchForm({...branchForm, name_en: e.target.value})} placeholder="Main Warehouse" />
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label><Building2 size={14} /> {t('branch_name_ar')}</label>
                  <input type="text" required dir="rtl" value={branchForm.name_ar} onChange={e => setBranchForm({...branchForm, name_ar: e.target.value})} placeholder="المستودع الرئيسي" />
                </div>
                <div className="form-group">
                  <label><Phone size={14} /> {t('contact_phone')}</label>
                  <input type="text" required value={branchForm.phone} onChange={e => setBranchForm({...branchForm, phone: e.target.value})} placeholder="+965 XXXX XXXX" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowBranchModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn-primary">
                  <Plus size={18} /> {t('add_branch')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdministrationPage;
