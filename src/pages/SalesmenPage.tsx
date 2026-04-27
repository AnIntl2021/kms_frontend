import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  MoreVertical, 
  Phone, 
  Mail, 
  TrendingUp, 
  Award,
  Filter,
  X
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

interface Salesman {
  salesman_id: number;
  name_en: string;
  name_ar: string;
  phone: string;
  email: string;
  commission_rate: number;
  status: 'active' | 'inactive';
  total_revenue?: number;
  total_orders?: number;
}

const SalesmenPage = () => {
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    phone: '',
    email: '',
    commission_rate: 0,
    status: 'active'
  });

  useEffect(() => {
    fetchSalesmen();
  }, []);

  const fetchSalesmen = async () => {
    setLoading(true);
    try {
      // Fetch both list and performance stats
      const [listRes, statsRes] = await Promise.all([
        api.get('/salesmen'),
        api.get('/salesmen/performance')
      ]);
      
      const statsMap = new Map(statsRes.data.data.map((s: any) => [s.salesman_id, s]));
      const combined = listRes.data.data.map((s: any) => ({
        ...s,
        total_revenue: statsMap.get(s.salesman_id)?.total_revenue || 0,
        total_orders: statsMap.get(s.salesman_id)?.total_orders || 0
      }));
      
      setSalesmen(combined);
    } catch (error) {
      toast.error('Failed to load salesmen data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/salesmen/${editingId}`, formData);
        toast.success('Salesman updated successfully! 👔');
      } else {
        await api.post('/salesmen', formData);
        toast.success('New salesman recruited! 🚀');
      }
      setIsModalOpen(false);
      resetForm();
      fetchSalesmen();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed.');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This salesman will be removed from active duty!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/salesmen/${id}`);
        toast.success('Salesman removed.');
        fetchSalesmen();
      } catch (error) {
        toast.error('Delete failed.');
      }
    }
  };

  const handleEdit = (salesman: Salesman) => {
    setEditingId(salesman.salesman_id);
    setFormData({
      name_en: salesman.name_en,
      name_ar: salesman.name_ar || '',
      phone: salesman.phone || '',
      email: salesman.email || '',
      commission_rate: salesman.commission_rate,
      status: salesman.status
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name_en: '',
      name_ar: '',
      phone: '',
      email: '',
      commission_rate: 0,
      status: 'active'
    });
  };

  const filteredSalesmen = salesmen.filter(s => 
    s.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.includes(searchTerm)
  );

  return (
    <Layout title="Sales Team Management">
      <div className="salesmen-container">
        
        {/* Executive Stats Bar */}
        <div className="sales-team-metrics">
           <div className="metric-glass">
              <div className="icon-box blue"><TrendingUp size={24} /></div>
              <div className="text-box">
                 <span>Active Team</span>
                 <h3>{salesmen.filter(s => s.status === 'active').length} Members</h3>
              </div>
           </div>
           <div className="metric-glass">
              <div className="icon-box gold"><Award size={24} /></div>
              <div className="text-box">
                 <span>Top Performer</span>
                 <h3>{salesmen.length > 0 ? salesmen.reduce((prev, curr) => (prev.total_revenue! > curr.total_revenue! ? prev : curr)).name_en : 'N/A'}</h3>
              </div>
           </div>
           <div className="metric-glass">
              <div className="icon-box green"><TrendingUp size={24} /></div>
              <div className="text-box">
                 <span>Team Revenue</span>
                 <h3>{salesmen.reduce((acc, curr) => acc + Number(curr.total_revenue || 0), 0).toFixed(3)} KWD</h3>
              </div>
           </div>
        </div>

        {/* Toolbar */}
        <div className="sales-toolbar">
          <div className="search-pill">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-recruit" onClick={() => { resetForm(); setIsModalOpen(true); }}>
            <UserPlus size={18} /> Recruit Salesman
          </button>
        </div>

        {/* Salesmen Grid */}
        <div className="salesmen-grid">
          {loading ? (
            <div className="loading-grid">
               <div className="skeleton-card"></div>
               <div className="skeleton-card"></div>
               <div className="skeleton-card"></div>
            </div>
          ) : filteredSalesmen.length > 0 ? filteredSalesmen.map(salesman => (
            <div className="salesman-card animated fadeIn" key={salesman.salesman_id}>
               <div className="card-header">
                  <div className="avatar-pill">
                     {salesman.name_en.charAt(0)}
                  </div>
                  <div className="status-indicator">
                     <span className={`status-dot ${salesman.status}`}></span>
                     {salesman.status}
                  </div>
                  <div className="card-actions">
                     <button className="btn-icon" onClick={() => handleEdit(salesman)}><Edit2 size={16} /></button>
                     <button className="btn-icon delete" onClick={() => handleDelete(salesman.salesman_id)}><Trash2 size={16} /></button>
                  </div>
               </div>
               
               <div className="card-body">
                  <h3>{salesman.name_en}</h3>
                  <p className="ar-name">{salesman.name_ar}</p>
                  
                  <div className="contact-info">
                     {salesman.phone && <span><Phone size={14} /> {salesman.phone}</span>}
                     {salesman.email && <span><Mail size={14} /> {salesman.email}</span>}
                  </div>

                  <div className="performance-stats">
                     <div className="stat-item">
                        <label>Revenue</label>
                        <strong>{Number(salesman.total_revenue || 0).toFixed(3)} KWD</strong>
                     </div>
                     <div className="stat-item">
                        <label>Orders</label>
                        <strong>{salesman.total_orders || 0}</strong>
                     </div>
                     <div className="stat-item">
                        <label>Commission</label>
                        <strong>{salesman.commission_rate}%</strong>
                     </div>
                  </div>
               </div>

               <div className="card-footer">
                  <div className="progress-bar">
                     <div className="fill" style={{ width: `${Math.min(100, (salesman.total_revenue || 0) / 10)}%` }}></div>
                  </div>
                  <span>Monthly Target Progress</span>
               </div>
            </div>
          )) : (
            <div className="empty-team">
               <Filter size={48} />
               <p>No salesmen found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* RECRUITMENT MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-modal animated slideIn">
            <div className="modal-header">
               <div className="header-title">
                  <UserPlus size={24} />
                  <h3>{editingId ? 'Update Salesman Profile' : 'Recruit New Salesman'}</h3>
               </div>
               <button className="btn-close" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
               <div className="form-grid">
                  <div className="form-group">
                     <label>Full Name (English) *</label>
                     <input 
                        type="text" 
                        required 
                        value={formData.name_en} 
                        onChange={e => setFormData({...formData, name_en: e.target.value})}
                        placeholder="e.g. John Doe"
                     />
                  </div>
                  <div className="form-group">
                     <label>الاسم بالكامل (عربي)</label>
                     <input 
                        type="text" 
                        value={formData.name_ar} 
                        onChange={e => setFormData({...formData, name_ar: e.target.value})}
                        placeholder="مثال: جون دو"
                     />
                  </div>
                  <div className="form-group">
                     <label>Phone Number</label>
                     <input 
                        type="tel" 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        placeholder="+965 XXXX XXXX"
                     />
                  </div>
                  <div className="form-group">
                     <label>Email Address</label>
                     <input 
                        type="email" 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        placeholder="john@freshnfast.com"
                     />
                  </div>
                  <div className="form-group">
                     <label>Commission Rate (%)</label>
                     <input 
                        type="number" 
                        step="0.1" 
                        value={formData.commission_rate} 
                        onChange={e => setFormData({...formData, commission_rate: Number(e.target.value)})}
                     />
                  </div>
                  <div className="form-group">
                     <label>Employment Status</label>
                     <select 
                        value={formData.status} 
                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                     >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive / On Leave</option>
                     </select>
                  </div>
               </div>

               <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">
                     {editingId ? 'Save Changes' : 'Confirm Recruitment'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .salesmen-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
        
        .sales-team-metrics { 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          gap: 1.5rem; 
          margin-bottom: 2.5rem;
        }

        .metric-glass {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.2rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.05);
        }

        .icon-box {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-box.blue { background: #eff6ff; color: #3b82f6; }
        .icon-box.gold { background: #fffbeb; color: #d97706; }
        .icon-box.green { background: #ecfdf5; color: #10b981; }

        .text-box span { font-size: 0.85rem; color: #64748b; font-weight: 600; }
        .text-box h3 { font-size: 1.4rem; color: #1e293b; margin: 0; }

        .sales-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          background: white;
          padding: 1rem;
          border-radius: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
        }

        .search-pill {
          display: flex;
          align-items: center;
          background: #f8fafc;
          padding: 0.6rem 1.2rem;
          border-radius: 99px;
          gap: 10px;
          width: 400px;
          border: 1px solid #f1f5f9;
        }

        .search-pill input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 0.9rem;
        }

        .btn-recruit {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: 0.2s;
        }

        .btn-recruit:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(59, 130, 246, 0.3); }

        .salesmen-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .salesman-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          border: 1px solid #f1f5f9;
          transition: 0.3s;
        }

        .salesman-card:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); }

        .card-header {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          position: relative;
        }

        .avatar-pill {
          width: 48px;
          height: 48px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.4rem;
        }

        .status-indicator {
          flex: 1;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        .status-dot.active { background: #10b981; box-shadow: 0 0 8px #10b981; }
        .status-dot.inactive { background: #94a3b8; }

        .card-actions { display: flex; gap: 8px; }
        .btn-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: #f8fafc;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .btn-icon:hover { background: #eff6ff; color: #3b82f6; }
        .btn-icon.delete:hover { background: #fef2f2; color: #ef4444; }

        .card-body { padding: 0 1.5rem 1.5rem; }
        .card-body h3 { margin: 0; font-size: 1.2rem; color: #1e293b; }
        .ar-name { font-size: 0.9rem; color: #94a3b8; margin: 4px 0 15px; font-family: 'Inter', sans-serif; }

        .contact-info { display: flex; flex-direction: column; gap: 8px; margin-bottom: 1.5rem; }
        .contact-info span { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #64748b; }

        .performance-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          background: #f8fafc;
          padding: 1rem;
          border-radius: 12px;
        }

        .stat-item { display: flex; flex-direction: column; }
        .stat-item label { font-size: 0.65rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
        .stat-item strong { font-size: 0.85rem; color: #1e293b; font-weight: 800; }

        .card-footer {
          padding: 1rem 1.5rem;
          background: #fcfcfc;
          border-top: 1px solid #f1f5f9;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: #f1f5f9;
          border-radius: 3px;
          margin-bottom: 6px;
          overflow: hidden;
        }

        .progress-bar .fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          border-radius: 3px;
        }

        .card-footer span { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }

        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .glass-modal {
          background: white;
          width: 90%;
          max-width: 700px;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
        }

        .modal-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-title { display: flex; align-items: center; gap: 12px; color: #1e293b; }
        .header-title h3 { margin: 0; }

        .modal-body { padding: 2rem; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        
        .form-group label { display: block; font-size: 0.8rem; font-weight: 700; color: #64748b; margin-bottom: 8px; text-transform: uppercase; }
        .form-group input, .form-group select {
          width: 100%;
          padding: 0.8rem 1rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          outline: none;
          transition: 0.2s;
        }

        .form-group input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 2rem;
        }

        .btn-primary { background: var(--primary); color: white; padding: 0.8rem 2rem; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; }
        .btn-secondary { background: #f1f5f9; color: #64748b; padding: 0.8rem 2rem; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </Layout>
  );
};

export default SalesmenPage;
