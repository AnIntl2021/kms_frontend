import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../hooks/useLanguage';
import { Truck, Plus, Eye, Check, X, FileText, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/useAuthStore';
import './BranchManagement.css'; // Re-use general premium spacing/tables

interface TransferItem {
  transfer_item_id?: number;
  inventory_item_id: number;
  quantity: number;
  name_en?: string;
  name_ar?: string;
  unit_en?: string;
}

interface StockTransfer {
  transfer_id: number;
  from_branch_id: number | null;
  from_branch_name: string | null;
  to_branch_id: number;
  to_branch_name: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes: string | null;
  created_by_name: string;
  created_at: string;
  items: TransferItem[];
}

interface Branch {
  branch_id: number;
  name_en: string;
}

interface InventoryItem {
  inventory_item_id: number;
  name_en: string;
  unit_en: string;
}

const StockTransfer: React.FC = () => {
  const { t } = useLanguage();
  const { admin } = useAuthStore();
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);

  // Form State
  const [fromBranchId, setFromBranchId] = useState('');
  const [toBranchId, setToBranchId] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ inventory_item_id: number; quantity: number }[]>([]);

  useEffect(() => {
    fetchTransfers();
    fetchOptions();
  }, []);

  const fetchTransfers = async () => {
    try {
      const res = await api.get('/transfers');
      if (res.data.success) {
        setTransfers(res.data.data);
      }
    } catch (e) {
      toast.error('Failed to load stock transfers');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [branchRes, invRes] = await Promise.all([
        api.get('/branches'),
        api.get('/inventory')
      ]);
      if (branchRes.data.success) setBranches(branchRes.data.data);
      if (invRes.data.success) setInventory(invRes.data.data);
    } catch (e) {
      console.error('Failed to load list options');
    }
  };

  const handleOpenRequest = () => {
    setFromBranchId('');
    setToBranchId('');
    setNotes('');
    setSelectedItems([{ inventory_item_id: 0, quantity: 1 }]);
    setIsRequestModalOpen(true);
  };

  const handleAddItemRow = () => {
    setSelectedItems([...selectedItems, { inventory_item_id: 0, quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    setSelectedItems(selectedItems.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, itemId: number) => {
    const updated = [...selectedItems];
    updated[index].inventory_item_id = itemId;
    setSelectedItems(updated);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const updated = [...selectedItems];
    updated[index].quantity = qty;
    setSelectedItems(updated);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const filteredItems = selectedItems.filter(item => item.inventory_item_id > 0 && item.quantity > 0);
    if (filteredItems.length === 0) {
      toast.warning('Please add at least one valid item.');
      return;
    }

    if (!toBranchId) {
      toast.warning('Destination branch is required');
      return;
    }

    try {
      const res = await api.post('/transfers', {
        from_branch_id: fromBranchId ? Number(fromBranchId) : null,
        to_branch_id: Number(toBranchId),
        notes,
        items: filteredItems
      });

      if (res.data.success) {
        toast.success('Stock transfer requested successfully');
        setIsRequestModalOpen(false);
        fetchTransfers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit transfer request');
    }
  };

  const handleUpdateStatus = async (id: number, status: 'completed' | 'cancelled') => {
    if (window.confirm(`Are you sure you want to mark this transfer as ${status}?`)) {
      try {
        const res = await api.put(`/transfers/${id}/status`, { status });
        if (res.data.success) {
          toast.success(`Transfer marked as ${status}`);
          setIsDetailModalOpen(false);
          fetchTransfers();
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to update transfer status');
      }
    }
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'completed') return 'status-badge healthy';
    if (status === 'cancelled') return 'status-badge critical';
    return 'status-badge pending';
  };

  return (
    <Layout title="Stock Transfers">
      <div className="branch-management-container fade-in">
        <div className="page-header">
          <Truck size={32} />
          <h1>Inventory Stock Transfers</h1>
        </div>

        <div className="premium-card">
          <div className="branches-header">
            <div>
              <h2>Transfer Logs & Requests</h2>
              <p>Move inventory items from Head Office / Warehouse to specific branch locations.</p>
            </div>
            <button className="btn-primary" onClick={handleOpenRequest}>
              <Plus size={18} style={{marginRight: '8px'}} /> New Transfer Request
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading transfers...</div>
          ) : transfers.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No transfer logs found.</div>
          ) : (
            <div className="table-responsive" style={{ marginTop: '1.5rem' }}>
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Status</th>
                    <th>Requested By</th>
                    <th>Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map(t => (
                    <tr key={t.transfer_id}>
                      <td><strong>{t.from_branch_name || 'Head Warehouse'}</strong></td>
                      <td><strong>{t.to_branch_name}</strong></td>
                      <td>
                        <span className={getStatusBadgeClass(t.status)}>
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td>{t.created_by_name}</td>
                      <td>{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="text-right">
                        <button className="btn-icon" onClick={() => { setSelectedTransfer(t); setIsDetailModalOpen(true); }} title="View details">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail / Action Modal */}
      {isDetailModalOpen && selectedTransfer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', width: '90%' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <h2>Stock Transfer Details (ID #{selectedTransfer.transfer_id})</h2>
              <button className="btn-close" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => setIsDetailModalOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '20px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <p><strong>From Source:</strong> {selectedTransfer.from_branch_name || 'Head Warehouse'}</p>
                <p><strong>To Destination:</strong> {selectedTransfer.to_branch_name}</p>
                <p><strong>Requested By:</strong> {selectedTransfer.created_by_name}</p>
                <p><strong>Date:</strong> {new Date(selectedTransfer.created_at).toLocaleString()}</p>
                <p><strong>Status:</strong> <span className={getStatusBadgeClass(selectedTransfer.status)}>{selectedTransfer.status.toUpperCase()}</span></p>
              </div>

              {selectedTransfer.notes && (
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', marginBottom: '20px' }}>
                  <strong>Notes:</strong> {selectedTransfer.notes}
                </div>
              )}

              <h3>Items Transferred</h3>
              <table className="table-modern" style={{ width: '100%', marginTop: '10px' }}>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Unit</th>
                    <th className="text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTransfer.items && selectedTransfer.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name_en}</td>
                      <td>{item.unit_en || 'kg'}</td>
                      <td className="text-right">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {selectedTransfer.status === 'pending' && (admin?.role === 'super_admin' || admin?.role === 'manager') && (
                <>
                  <button className="btn-edit" style={{ background: '#22c55e', color: 'white' }} onClick={() => handleUpdateStatus(selectedTransfer.transfer_id, 'completed')}>
                    <Check size={16} style={{ marginRight: '4px' }} /> Approve & Update Stock
                  </button>
                  <button className="btn-delete" style={{ background: '#ef4444', color: 'white' }} onClick={() => handleUpdateStatus(selectedTransfer.transfer_id, 'cancelled')}>
                    <X size={16} style={{ marginRight: '4px' }} /> Reject / Cancel
                  </button>
                </>
              )}
              <button className="btn-secondary" onClick={() => setIsDetailModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {isRequestModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
            <h2>New Stock Transfer Request</h2>
            <form onSubmit={handleRequestSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div className="form-group">
                  <label>From Source Branch</label>
                  <select value={fromBranchId} onChange={e => setFromBranchId(e.target.value)}>
                    <option value="">Head Office / Central Warehouse</option>
                    {branches.map(b => (
                      <option key={b.branch_id} value={b.branch_id}>{b.name_en}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>To Destination Branch *</label>
                  <select required value={toBranchId} onChange={e => setToBranchId(e.target.value)}>
                    <option value="">Select Branch</option>
                    {branches.map(b => (
                      <option key={b.branch_id} value={b.branch_id}>{b.name_en}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Notes / Reason</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for transfer or instruction notes..." />
              </div>

              <h3>Transfer Items</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                {selectedItems.map((selectedItem, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <select
                      style={{ flex: 2 }}
                      required
                      value={selectedItem.inventory_item_id || ''}
                      onChange={e => handleItemChange(idx, Number(e.target.value))}
                    >
                      <option value="">Choose Inventory Item</option>
                      {inventory.map(item => (
                        <option key={item.inventory_item_id} value={item.inventory_item_id}>
                          {item.name_en} ({item.unit_en})
                        </option>
                      ))}
                    </select>

                    <input
                      style={{ flex: 1 }}
                      type="number"
                      required
                      min="0.001"
                      step="0.001"
                      placeholder="Qty"
                      value={selectedItem.quantity}
                      onChange={e => handleQtyChange(idx, Number(e.target.value))}
                    />

                    <button
                      type="button"
                      className="btn-delete"
                      style={{ padding: '8px' }}
                      onClick={() => handleRemoveItemRow(idx)}
                      disabled={selectedItems.length === 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" className="btn-secondary" style={{ marginBottom: '15px' }} onClick={handleAddItemRow}>
                + Add Item Line
              </button>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsRequestModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default StockTransfer;
