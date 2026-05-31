import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { 
  FileText, 
  Search, 
  Printer, 
  Wallet, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  User,
  MapPin,
  Building,
  Truck,
  Coins,
  AlertCircle
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useLanguage } from '../hooks/useLanguage';
import { toast } from 'react-toastify';
import SearchableSelect from '../components/SearchableSelect';
import './InventoryPage.css';

interface StatementItem {
  sale_item_id: number;
  sale_id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
  name_en: string;
  name_ar: string;
}

interface StatementOrder {
  sale_id: number;
  order_number: string;
  customer_name: string;
  vendor_id: number;
  branch_id: number | null;
  total_amount: number;
  discount_amount: number;
  discount_percentage: number;
  final_amount: number;
  payment_status: 'paid' | 'credit' | 'failed';
  dispatch_status: 'pending' | 'dispatched' | 'delivered' | 'cancelled';
  batch_number: string | null;
  expiry_date: string | null;
  created_at: string;
  report_date: string;
  client_name: string;
  client_name_ar: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  branch_name: string | null;
  branch_name_ar: string | null;
  items: StatementItem[];
}

const ClientStatementsPage: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>(() => {
    return new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orders, setOrders] = useState<StatementOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});

  // Printing Statement Reference
  const printComponentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    setSelectedBranchId('all');
  }, [selectedClientId]);

  useEffect(() => {
    fetchStatements();
  }, [selectedClientId, selectedBranchId, startDate, endDate, statusFilter]);

  const fetchClients = async () => {
    try {
      const res = await api.get('/vendors');
      const filtered = (res.data.data || []).filter((v: any) => v.type === 'client');
      setClients(filtered);
      if (filtered.length > 0) {
        setSelectedClientId(String(filtered[0].vendor_id));
      }
    } catch (e) {
      toast.error('Failed to load clients list');
    }
  };

  const fetchStatements = async () => {
    if (!selectedClientId) return;
    setLoading(true);
    try {
      const params: any = {
        startDate,
        endDate,
        vendor_id: selectedClientId
      };
      if (selectedBranchId && selectedBranchId !== 'all') {
        params.branch_id = selectedBranchId;
      }
      const res = await api.get('/reports/client-statements', { params });
      setOrders(res.data.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load statement details');
    } finally {
      setLoading(false);
    }
  };

  const selectedClientInfo = () => {
    return clients.find(c => String(c.vendor_id) === String(selectedClientId));
  };

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: `Statement-${selectedClientInfo()?.name_en || 'Client'}-${startDate}-to-${endDate}`,
    pageStyle: `
      @media print {
        @page {
          size: A4 portrait;
          margin: 20mm 10mm 20mm 10mm;
          @bottom-left {
            content: "Fresh 'n' Fast Statement";
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
          }
          @bottom-right {
            content: "Page " counter(page);
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
          }
        }
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      }
    `
  });

  const toggleExpandOrder = (id: number) => {
    setExpandedOrders(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Predefined date periods helper
  const handleQuickPeriod = (period: 'this_month' | 'last_month' | 'last_30_days') => {
    const today = new Date();
    if (period === 'this_month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const end = today.toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(end);
    } else if (period === 'last_month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0];
      const end = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(end);
    } else if (period === 'last_30_days') {
      const start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = today.toISOString().split('T')[0];
      setStartDate(start);
      setEndDate(end);
    }
  };

  // Filtered orders list (status client-side fallback)
  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'paid') return o.payment_status === 'paid';
    if (statusFilter === 'credit') return o.payment_status === 'credit' || o.payment_status === 'failed';
    return true;
  });

  // Calculate stats
  const totalSent = filteredOrders.reduce((sum, o) => sum + Number(o.final_amount), 0);
  const paidAmount = filteredOrders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + Number(o.final_amount), 0);
  const balanceDue = totalSent - paidAmount;

  const paymentStatusText = () => {
    if (totalSent === 0) return t('no_statements');
    if (balanceDue <= 0) return language === 'ar' ? 'مدفوع بالكامل' : 'Fully Paid';
    if (paidAmount > 0) return language === 'ar' ? 'مدفوع جزئياً' : 'Partially Paid';
    return language === 'ar' ? 'غير مدفوع / رصيد معلق' : 'Unpaid / Outstanding';
  };

  const getPaymentStatusColor = () => {
    if (totalSent === 0) return '#64748b';
    if (balanceDue <= 0) return '#10b981'; // Green
    if (paidAmount > 0) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const clientInfo = selectedClientInfo();

  return (
    <Layout title={t('client_statements')}>
      <div className="inventory-container">
        
        {/* Advanced Filters */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '1.5rem',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'flex-end'
          }}>
            <div style={{ flex: '1 1 250px', minWidth: '200px' }} className="form-group">
              <label style={{ fontWeight: 700, fontSize: '12px', color: '#475569', marginBottom: '6px', display: 'block' }}>
                {language === 'ar' ? 'اختر العميل' : 'Select Client'}
              </label>
              <SearchableSelect
                options={clients.map(c => ({
                  value: c.vendor_id,
                  label: language === 'ar' ? (c.name_ar || c.name_en) : c.name_en
                }))}
                value={selectedClientId}
                onChange={(val) => setSelectedClientId(String(val))}
                placeholder={t('choose_client')}
              />
            </div>

            {clientInfo && (
              <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
                <label style={{ fontWeight: 700, fontSize: '12px', color: '#475569', marginBottom: '6px', display: 'block' }}>
                  {language === 'ar' ? 'الفرع المستلم' : 'Destination Branch'}
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: 'white',
                    height: '48px'
                  }}
                >
                  <option value="all">{language === 'ar' ? 'كل الفروع' : 'All Branches'}</option>
                  <option value="main">{language === 'ar' ? 'الفرع الرئيسي' : 'Main Hub'}</option>
                  {(clientInfo.branches || []).map((b: any) => (
                    <option key={b.branch_id} value={b.branch_id}>
                      {language === 'ar' ? (b.name_ar || b.name_en) : b.name_en}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ flex: '1 1 180px' }}>
              <label style={{ fontWeight: 700, fontSize: '12px', color: '#475569', marginBottom: '6px', display: 'block' }}>
                {language === 'ar' ? 'تاريخ البدء' : 'Start Date'}
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                />
              </div>
            </div>

            <div style={{ flex: '1 1 180px' }}>
              <label style={{ fontWeight: 700, fontSize: '12px', color: '#475569', marginBottom: '6px', display: 'block' }}>
                {language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}
              </label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              />
            </div>

            <div style={{ flex: '1 1 150px' }}>
              <label style={{ fontWeight: 700, fontSize: '12px', color: '#475569', marginBottom: '6px', display: 'block' }}>
                {t('payment_status_filter')}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: 'white'
                }}
              >
                <option value="all">{language === 'ar' ? 'الكل' : 'All Status'}</option>
                <option value="paid">{language === 'ar' ? 'مدفوع' : 'Paid'}</option>
                <option value="credit">{language === 'ar' ? 'رصيد مستحق' : 'Unpaid (Credit)'}</option>
              </select>
            </div>

            <button 
              onClick={handlePrint}
              disabled={orders.length === 0}
              style={{
                background: orders.length === 0 ? '#94a3b8' : 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 20px',
                fontWeight: 700,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: orders.length === 0 ? 'not-allowed' : 'pointer',
                height: '42px',
                transition: 'all 0.2s'
              }}
            >
              <Printer size={16} />
              {t('print_statement')}
            </button>
          </div>

          {/* Quick Date Presets */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => handleQuickPeriod('this_month')} 
              style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 700, borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer' }}
            >
              {language === 'ar' ? 'هذا الشهر' : 'This Month'}
            </button>
            <button 
              onClick={() => handleQuickPeriod('last_month')} 
              style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 700, borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer' }}
            >
              {language === 'ar' ? 'الشهر الماضي' : 'Last Month'}
            </button>
            <button 
              onClick={() => handleQuickPeriod('last_30_days')} 
              style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 700, borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer' }}
            >
              {language === 'ar' ? 'آخر ٣٠ يوم' : 'Last 30 Days'}
            </button>
          </div>
        </div>

        {/* Dynamic Financial Overview Cards */}
        <div className="inventory-metrics" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {/* Card 1: Total Sent */}
          <div className="metric-card" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f4fbf7 100%)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.05), 0 8px 10px -6px rgba(16, 185, 129, 0.03)',
            borderRadius: '24px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #e6f7ed 0%, #c2ffd9 100%)',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.12)',
              color: '#059669',
              flexShrink: 0
            }}>
              <Truck size={24} color="#059669" strokeWidth={2.2} />
            </div>
            <div className="metric-details" style={{ flexGrow: 1 }}>
              <span style={{ color: '#475569', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                {t('total_sent')}
              </span>
              <h3 style={{ color: '#0f291e', fontSize: '24px', fontWeight: 900, margin: '4px 0 2px' }}>
                {totalSent.toFixed(3)} <span style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>{t('kd_currency')}</span>
              </h3>
              <p style={{ color: '#64748b', fontSize: '11px', margin: 0, fontWeight: 500 }}>
                {language === 'ar' ? 'إجمالي المبيعات والمنتجات المرسلة' : 'Total outbound products'}
              </p>
            </div>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.03)',
              filter: 'blur(15px)',
              pointerEvents: 'none'
            }} />
          </div>

          {/* Card 2: Paid Amount */}
          <div className="metric-card" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f4f8ff 100%)',
            border: '1px solid rgba(59, 130, 246, 0.15)',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.05), 0 8px 10px -6px rgba(59, 130, 246, 0.03)',
            borderRadius: '24px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #eef2ff 0%, #c7d2fe 100%)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.12)',
              color: '#2563eb',
              flexShrink: 0
            }}>
              <Coins size={24} color="#2563eb" strokeWidth={2.2} />
            </div>
            <div className="metric-details" style={{ flexGrow: 1 }}>
              <span style={{ color: '#475569', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                {t('paid_amount')}
              </span>
              <h3 style={{ color: '#0f172a', fontSize: '24px', fontWeight: 900, margin: '4px 0 2px' }}>
                {paidAmount.toFixed(3)} <span style={{ fontSize: '14px', fontWeight: 700, color: '#2563eb' }}>{t('kd_currency')}</span>
              </h3>
              <p style={{ color: '#64748b', fontSize: '11px', margin: 0, fontWeight: 500 }}>
                {language === 'ar' ? 'المبلغ المستلم كلياً' : 'Total cleared payments'}
              </p>
            </div>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.03)',
              filter: 'blur(15px)',
              pointerEvents: 'none'
            }} />
          </div>

          {/* Card 3: Balance Due */}
          <div className="metric-card" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fff5f5 100%)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.05), 0 8px 10px -6px rgba(239, 68, 68, 0.03)',
            borderRadius: '24px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.12)',
              color: '#dc2626',
              flexShrink: 0
            }}>
              <AlertCircle size={24} color="#dc2626" strokeWidth={2.2} />
            </div>
            <div className="metric-details" style={{ flexGrow: 1 }}>
              <span style={{ color: '#475569', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                {t('balance_due')}
              </span>
              <h3 style={{ color: '#450a0a', fontSize: '24px', fontWeight: 900, margin: '4px 0 2px' }}>
                {balanceDue.toFixed(3)} <span style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>{t('kd_currency')}</span>
              </h3>
              <p style={{ color: '#64748b', fontSize: '11px', margin: 0, fontWeight: 500 }}>
                {language === 'ar' ? 'الرصيد المتبقي ذو الدفع الآجل' : 'Outstanding client balance'}
              </p>
            </div>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.03)',
              filter: 'blur(15px)',
              pointerEvents: 'none'
            }} />
          </div>

          {/* Card 4: Account Status */}
          <div className="metric-card" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02), 0 8px 10px -6px rgba(0,0,0,0.01)',
            borderRadius: '24px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
              boxShadow: '0 4px 12px rgba(148, 163, 184, 0.12)',
              color: '#475569',
              flexShrink: 0
            }}>
              <Wallet size={24} color="#475569" strokeWidth={2.2} />
            </div>
            <div className="metric-details" style={{ flexGrow: 1 }}>
              <span style={{ color: '#475569', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                {language === 'ar' ? 'حالة الحساب العامة' : 'Account Status'}
              </span>
              <h3 style={{ color: getPaymentStatusColor(), fontSize: '18px', fontWeight: 900, margin: '6px 0 2px' }}>
                {paymentStatusText()}
              </h3>
              <p style={{ color: '#64748b', fontSize: '11px', margin: 0, fontWeight: 500 }}>
                {language === 'ar' ? 'بناءً على الفواتير المصفاة' : 'Based on current filters'}
              </p>
            </div>
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(71, 85, 105, 0.02)',
              filter: 'blur(15px)',
              pointerEvents: 'none'
            }} />
          </div>
        </div>

        {/* Detailed Statements Table */}
        <div className="stock-table-card" style={{ marginTop: '1.5rem' }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>{t('order_id')}</th>
                  <th>{language === 'ar' ? 'الفرع المستلم' : 'Destination Branch'}</th>
                  <th>{language === 'ar' ? 'تاريخ التوزيع' : 'Dispatch Date'}</th>
                  <th>{language === 'ar' ? 'مجموع المنتجات' : 'Products Total'}</th>
                  <th>{t('total_amount')}</th>
                  <th>{t('payment')}</th>
                  <th>{language === 'ar' ? 'حالة الشحن' : 'Delivery'}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-5">{t('loading_data')}</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-5" style={{ color: '#94a3b8' }}>{t('no_statements')}</td></tr>
                ) : filteredOrders.map(order => {
                  const isExpanded = !!expandedOrders[order.sale_id];
                  return (
                    <React.Fragment key={order.sale_id}>
                      <tr 
                        onClick={() => toggleExpandOrder(order.sale_id)} 
                        style={{ cursor: 'pointer', transition: 'background 0.2s', background: isExpanded ? '#f8fafc' : 'transparent' }}
                      >
                        <td>
                          {isExpanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
                        </td>
                        <td>
                          <div className="item-info">
                            <strong>FNFI-{100000 + order.sale_id}</strong>
                            <span>{order.batch_number ? `Batch: ${order.batch_number}` : 'No Batch'}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#334155' }}>
                            {language === 'ar' ? (order.branch_name_ar || order.branch_name || 'الفرع الرئيسي') : (order.branch_name || 'Main Hub')}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{order.report_date}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>
                            {order.items?.length || 0} {language === 'ar' ? 'أصناف' : 'items'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ fontSize: '14px', color: 'var(--primary)' }}>{Number(order.final_amount).toFixed(3)} {t('kd_currency')}</strong>
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: order.payment_status === 'paid' ? '#e6f4ea' : '#fce8e6',
                            color: order.payment_status === 'paid' ? '#137333' : '#c5221f'
                          }}>
                            {order.payment_status?.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: order.dispatch_status === 'delivered' ? '#e6f4ea' : '#fef7e0',
                            color: order.dispatch_status === 'delivered' ? '#137333' : '#b06000'
                          }}>
                            {order.dispatch_status?.toUpperCase()}
                          </span>
                        </td>
                      </tr>

                      {/* Collapsible Order Itemized List */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} style={{ padding: '0 1.5rem 1.5rem 1.5rem', background: '#f8fafc' }}>
                            <div style={{
                              background: 'white',
                              borderRadius: '12px',
                              padding: '1rem',
                              border: '1px solid #e2e8f0',
                              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                              <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {language === 'ar' ? 'تفاصيل المنتجات المصدرة' : 'Itemized Dispatch List'}
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {order.items && order.items.length > 0 ? order.items.map((item) => (
                                  <div 
                                    key={item.sale_item_id}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '8px 12px',
                                      background: '#f8fafc',
                                      borderRadius: '8px',
                                      fontSize: '13px'
                                    }}
                                  >
                                    <div style={{ fontWeight: 600, color: '#334155' }}>
                                      {language === 'ar' ? (item.name_ar || item.name_en) : item.name_en}
                                    </div>
                                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                      <div style={{ color: '#64748b', fontSize: '12px' }}>
                                        {item.quantity} x {Number(item.price).toFixed(3)}
                                      </div>
                                      <div style={{ fontWeight: 700, color: 'var(--primary)', minWidth: '80px', textAlign: 'right' }}>
                                        {Number(item.price * item.quantity).toFixed(3)} {t('kd_currency')}
                                      </div>
                                    </div>
                                  </div>
                                )) : (
                                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>No items recorded.</div>
                                )}
                              </div>

                              {/* Breakdown Calculation */}
                              <div style={{
                                marginTop: '12px',
                                borderTop: '1px dashed #e2e8f0',
                                paddingTop: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                gap: '4px'
                              }}>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '12px', color: '#64748b' }}>
                                  <span>{t('subtotal')}:</span>
                                  <span style={{ fontWeight: 700 }}>{Number(order.total_amount).toFixed(3)} {t('kd_currency')}</span>
                                </div>
                                {Number(order.discount_amount) > 0 && (
                                  <div style={{ display: 'flex', gap: '1rem', fontSize: '12px', color: '#ef4444' }}>
                                    <span>{language === 'ar' ? 'الخصم المطبق' : 'Discount'} ({order.discount_percentage}%):</span>
                                    <span style={{ fontWeight: 700 }}>-{Number(order.discount_amount).toFixed(3)} {t('kd_currency')}</span>
                                  </div>
                                )}
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '13px', color: 'var(--primary)', fontWeight: 800 }}>
                                  <span>{language === 'ar' ? 'الصافي' : 'Net Total'}:</span>
                                  <span>{Number(order.final_amount).toFixed(3)} {t('kd_currency')}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* STATEMENT PRINTABLE TEMPLATE (HIDDEN ON SCREEN, RENDERED IN PRINT PREVIEW) */}
      {/* ========================================================================= */}
      <div style={{ display: 'none' }}>
        <div ref={printComponentRef} style={{ padding: '15mm 10mm', width: '100%', boxSizing: 'border-box', direction: isRTL ? 'rtl' : 'ltr', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: '#1e293b' }}>
          
          {/* Header Identity */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px double #01562c', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '30px', background: '#01562c', borderRadius: '2px' }} />
                <h1 style={{ fontSize: '32px', color: '#01562c', margin: 0, fontWeight: 900, letterSpacing: '-1px' }}>Fresh 'n' Fast</h1>
              </div>
              <p style={{ margin: '6px 0 0 12px', fontSize: '13px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Elite Food Distribution ERP</p>
            </div>
            <div style={{ textAlign: isRTL ? 'left' : 'right' }}>
              <span style={{ background: 'rgba(1, 86, 44, 0.1)', color: '#01562c', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', display: 'inline-block', marginBottom: '8px' }}>
                {language === 'ar' ? 'كشف حساب عميل' : 'Account Statement'}
              </span>
              <p style={{ margin: 0, fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                {t('statement_period')}: <b style={{ color: '#1e293b' }}>{startDate}</b> {t('to')} <b style={{ color: '#1e293b' }}>{endDate}</b>
              </p>
            </div>
          </div>

          {/* Client & Company Addresses Grid */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ 
              flex: 1, 
              padding: '1.25rem', 
              background: '#f8fafc', 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0',
              borderLeft: isRTL ? '1px solid #e2e8f0' : '4px solid #01562c',
              borderRight: isRTL ? '4px solid #01562c' : '1px solid #e2e8f0'
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#01562c', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {language === 'ar' ? 'بيانات العميل المستلم' : 'Client Delivery Details'}
              </h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                {language === 'ar' ? (clientInfo?.name_ar || clientInfo?.name_en) : clientInfo?.name_en}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#475569' }}>
                {clientInfo?.contact_person && <p style={{ margin: 0 }}><span style={{ fontWeight: 600 }}>{language === 'ar' ? 'المسؤول:' : 'Contact:'}</span> {clientInfo.contact_person}</p>}
                {clientInfo?.phone && <p style={{ margin: 0 }}><span style={{ fontWeight: 600 }}>{language === 'ar' ? 'الهاتف:' : 'Phone:'}</span> {clientInfo.phone}</p>}
                {clientInfo?.email && <p style={{ margin: 0 }}><span style={{ fontWeight: 600 }}>{language === 'ar' ? 'البريد:' : 'Email:'}</span> {clientInfo.email}</p>}
                {clientInfo?.address && <p style={{ margin: 0 }}><span style={{ fontWeight: 600 }}>{language === 'ar' ? 'العنوان:' : 'Address:'}</span> {clientInfo.address}</p>}
              </div>
            </div>
            
            <div style={{ width: '260px', padding: '1.25rem', border: '1px dashed #cbd5e1', borderRadius: '12px', fontSize: '12px', color: '#475569', background: '#fcfcfc' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#0f172a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {language === 'ar' ? 'تعليمات السداد والتحصيل' : 'Remittance & Terms'}
              </h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '11px', lineHeight: '1.4', color: '#64748b' }}>
                {language === 'ar' ? 'الرجاء مطابقة كشف الحساب وسداد الأرصدة المستحقة في غضون ٧ أيام.' : 'Please reconcile the listed statement and settle outstanding balances within 7 days.'}</p>
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <p style={{ margin: 0 }}><b>Bank:</b> Gulf Bank Kuwait</p>
                <p style={{ margin: 0 }}><b>IBAN:</b> KW73GFBK000010892738</p>
                <p style={{ margin: 0 }}><b>Currency:</b> Kuwaiti Dinar (KWD)</p>
              </div>
            </div>
          </div>

          {/* Statement Shipments List */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2.5rem', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#01562c', color: 'white' }}>
                <th style={{ padding: '12px 14px', textAlign: isRTL ? 'right' : 'left', fontWeight: 700, borderBottom: '2px solid #014020' }}>{language === 'ar' ? 'رقم الطلب' : 'Order No'}</th>
                <th style={{ padding: '12px 14px', textAlign: isRTL ? 'right' : 'left', fontWeight: 700, borderBottom: '2px solid #014020' }}>{language === 'ar' ? 'الفرع المستلم' : 'Destination Branch'}</th>
                <th style={{ padding: '12px 14px', textAlign: isRTL ? 'right' : 'left', fontWeight: 700, borderBottom: '2px solid #014020' }}>{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                <th style={{ padding: '12px 14px', textAlign: isRTL ? 'left' : 'right', fontWeight: 700, borderBottom: '2px solid #014020' }}>{t('total_amount')}</th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, borderBottom: '2px solid #014020' }}>{t('payment')}</th>
              </tr>
            </thead>
            {filteredOrders.map((order, idx) => (
              <tbody key={order.sale_id} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <tr style={{ 
                  borderBottom: '1px solid #e2e8f0', 
                  background: idx % 2 === 0 ? 'white' : '#f8fafc',
                  transition: 'background 0.2s',
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid'
                }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>FNFI-{100000 + order.sale_id}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                    {language === 'ar' ? (order.branch_name_ar || order.branch_name || 'الرئيسي') : (order.branch_name || 'Main Hub')}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{order.report_date}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#01562c', textAlign: isRTL ? 'left' : 'right' }}>
                    {Number(order.final_amount).toFixed(3)} {t('kd_currency')}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '10px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background: order.payment_status === 'paid' ? '#e6f4ea' : '#fce8e6',
                      color: order.payment_status === 'paid' ? '#137333' : '#c5221f',
                      display: 'inline-block'
                    }}>
                      {order.payment_status?.toUpperCase()}
                    </span>
                  </td>
                </tr>
                {/* Detailed nested items inside the print view */}
                <tr style={{ background: idx % 2 === 0 ? 'white' : '#f8fafc', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <td colSpan={5} style={{ padding: '0px 14px 12px 14px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ 
                      background: '#ffffff', 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0', 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '12px' 
                    }}>
                      {order.items?.map(it => (
                        <span key={it.sale_item_id} style={{ fontSize: '11px', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#16a34a' }}>•</span>
                          <span style={{ fontWeight: 600 }}>{language === 'ar' ? (it.name_ar || it.name_en) : it.name_en}</span>
                          <span style={{ color: '#64748b' }}>({it.quantity})</span>
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              </tbody>
            ))}
          </table>

          {/* Totals Summary Card */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', pageBreakInside: 'avoid' }}>
            <div style={{ 
              width: '340px', 
              padding: '1.25rem', 
              background: '#f8fafc', 
              borderRadius: '12px', 
              border: '1px solid #01562c',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0', fontSize: '13px' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>{language === 'ar' ? 'إجمالي فواتير المرسل' : 'Total Amount Sent'}:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{totalSent.toFixed(3)} {t('kd_currency')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0', fontSize: '13px', color: '#166534' }}>
                <span style={{ fontWeight: 600 }}>{language === 'ar' ? 'إجمالي المبلغ المدفوع' : 'Total Amount Paid'}:</span>
                <span style={{ fontWeight: 700 }}>{paidAmount.toFixed(3)} {t('kd_currency')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0 0', fontSize: '16px', fontWeight: 900, color: '#be123c' }}>
                <span>{t('balance_due')}:</span>
                <span style={{ borderBottom: '3px double #be123c', paddingBottom: '2px' }}>{balanceDue.toFixed(3)} {t('kd_currency')}</span>
              </div>
            </div>
          </div>

          {/* Signature / Stamp Area */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4cm', fontSize: '12px', color: '#475569', pageBreakInside: 'avoid' }}>
            <div style={{ textAlign: 'center', width: '220px' }}>
              <div style={{ borderBottom: '1.5px dashed #cbd5e1', height: '45px', marginBottom: '8px' }} />
              <p style={{ margin: 0, fontWeight: 700 }}>{language === 'ar' ? 'توقيع العميل المستلم' : 'Recipient Customer Sign'}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#94a3b8' }}>Fresh 'n' Fast Partner Network</p>
            </div>
            <div style={{ textAlign: 'center', width: '220px' }}>
              <div style={{ borderBottom: '1.5px dashed #cbd5e1', height: '45px', marginBottom: '8px' }} />
              <p style={{ margin: 0, fontWeight: 700 }}>{language === 'ar' ? 'الختم والمصادقة' : 'Authorized Signature & Stamp'}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#94a3b8' }}>Corporate Food Distribution ERP</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ClientStatementsPage;
