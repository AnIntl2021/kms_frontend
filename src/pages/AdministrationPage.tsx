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
      toast.success('Staff Account Registered Successfully! 👤');
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
      toast.success('New Branch Network Added! 🏢');
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
    <Layout title="System Administration">
      <div className="inventory-container">
        {/* Navigation Tabs */}
        <div className="tabs-navigation" style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <button onClick={() => setActiveTab('users')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 4px', fontWeight: 700, fontSize: '15px', color: activeTab === 'users' ? 'var(--primary)' : '#64748b', borderBottom: activeTab === 'users' ? '3px solid var(--primary)' : 'none', cursor: 'pointer' }}>
            <Users size={20} /> Staff Management
          </button>
          <button onClick={() => setActiveTab('branches')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 4px', fontWeight: 700, fontSize: '15px', color: activeTab === 'branches' ? 'var(--primary)' : '#64748b', borderBottom: activeTab === 'branches' ? '3px solid var(--primary)' : 'none', cursor: 'pointer' }}>
            <Building2 size={20} /> Branch Network
          </button>
          <button onClick={() => setActiveTab('logs')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 4px', fontWeight: 700, fontSize: '15px', color: activeTab === 'logs' ? 'var(--primary)' : '#64748b', borderBottom: activeTab === 'logs' ? '3px solid var(--primary)' : 'none', cursor: 'pointer' }}>
            <History size={20} /> Audit Logs
          </button>
        </div>

        {/* Global Toolbar */}
        <div className="inventory-actions">
           <div className="search-group">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder={`Search ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
           </div>
           <div className="action-buttons">
              {activeTab === 'users' && <button className="btn-add" style={{ background: 'var(--primary)' }} onClick={() => setShowUserModal(true)}><Plus size={18} /> Add User</button>}
              {activeTab === 'branches' && <button className="btn-add" style={{ background: 'var(--primary)' }} onClick={() => setShowBranchModal(true)}><Plus size={18} /> New Branch</button>}
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
                      <th>Admin Name</th>
                      <th>Username</th>
                      <th>Email / Contact</th>
                      <th>Role</th>
                      <th>Created</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="text-center py-5">Fetching staff records...</td></tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-5">No staff found.</td></tr>
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
                        <td className="text-right">
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
                      <th>Branch Name (EN)</th>
                      <th>Branch Name (AR)</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="text-center py-5">Syncing network...</td></tr>
                    ) : branches.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-5">No branches recorded.</td></tr>
                    ) : branches.map(b => (
                      <tr key={b.branch_id}>
                        <td><strong>{b.name_en}</strong></td>
                        <td dir="rtl" className="text-right" style={{ fontSize: '15px' }}>{b.name_ar}</td>
                        <td>{b.phone}</td>
                        <td><span className={getStatusBadge(b.status)}>{b.status}</span></td>
                        <td className="text-right">
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
                      <th>Action</th>
                      <th>User</th>
                      <th>Entity</th>
                      <th>Timestamp</th>
                      <th>IP Address</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                       <tr><td colSpan={6} className="text-center py-5">Pulling audit trail...</td></tr>
                    ) : logs.length === 0 ? (
                       <tr><td colSpan={6} className="text-center py-5">No logs found.</td></tr>
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
              <h3><User size={24} style={{ marginRight: '10px', color: 'var(--primary)' }} /> Register New Staff Account</h3>
              <button className="btn-close" onClick={() => setShowUserModal(false)}><X /></button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label><User size={14} /> First Name</label>
                    <input type="text" required value={userForm.first_name} onChange={e => setUserForm({...userForm, first_name: e.target.value})} placeholder="e.g. John" />
                  </div>
                  <div className="form-group">
                    <label><User size={14} /> Last Name</label>
                    <input type="text" value={userForm.last_name} onChange={e => setUserForm({...userForm, last_name: e.target.value})} placeholder="e.g. Doe" />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label><Hash size={14} /> Username</label>
                    <input type="text" required value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} placeholder="staff_john" />
                  </div>
                  <div className="form-group">
                    <label><Mail size={14} /> Email Address</label>
                    <input type="email" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} placeholder="john@example.com" />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label><Lock size={14} /> Secret Password</label>
                    <input type="password" required value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} placeholder="••••••••" />
                  </div>
                  <div className="form-group">
                    <label><LayoutGrid size={14} /> System Role</label>
                    <select required value={userForm.role_id} onChange={e => setUserForm({...userForm, role_id: e.target.value})}>
                      <option value="">Choose a Role...</option>
                      {roles.map(r => <option key={r.role_id} value={r.role_id}>{r.display_name_en}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowUserModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  <Plus size={18} /> Create Account
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
              <h3><Building2 size={24} style={{ marginRight: '10px', color: 'var(--primary)' }} /> Create New Branch</h3>
              <button className="btn-close" onClick={() => setShowBranchModal(false)}><X /></button>
            </div>
            <form onSubmit={handleAddBranch}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label><Building2 size={14} /> Branch Name (English)</label>
                  <input type="text" required value={branchForm.name_en} onChange={e => setBranchForm({...branchForm, name_en: e.target.value})} placeholder="Main Warehouse" />
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label><Building2 size={14} /> Branch Name (Arabic)</label>
                  <input type="text" required dir="rtl" value={branchForm.name_ar} onChange={e => setBranchForm({...branchForm, name_ar: e.target.value})} placeholder="المستودع الرئيسي" />
                </div>
                <div className="form-group">
                  <label><Phone size={14} /> Contact Phone</label>
                  <input type="text" required value={branchForm.phone} onChange={e => setBranchForm({...branchForm, phone: e.target.value})} placeholder="+965 XXXX XXXX" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowBranchModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  <Plus size={18} /> Add Branch
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
