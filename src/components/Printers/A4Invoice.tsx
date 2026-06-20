import React from 'react';
import { useSettings } from '../../hooks/useSettings';

// For A4 printing, standard width is 210mm
const A4Invoice = ({ invoiceData, digitalSignature }: { invoiceData: any, digitalSignature?: string }) => {
  const { settings, formatCurrencyValue, currencySymbol } = useSettings();
  
  return (
    <div style={{ width: '210mm', minHeight: '297mm', padding: '20mm', backgroundColor: '#fff', color: '#000', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eee', paddingBottom: '20px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: 0, color: '#333' }}>{settings.company_name || 'KMS'}</h1>
          <p style={{ margin: '5px 0', color: '#666' }}>{settings.company_address || '123 Main St, City Center'}</p>
          <p style={{ margin: '5px 0', color: '#666' }}>
            {settings.company_phone && `Tel: ${settings.company_phone}`} 
            {settings.company_email && ` | Email: ${settings.company_email}`}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '36px', margin: 0, color: '#e0e0e0', textTransform: 'uppercase' }}>Invoice</h2>
          <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Invoice #: {invoiceData.id || 'INV-2026-001'}</p>
          <p style={{ margin: '5px 0' }}>Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#999', margin: '0 0 10px 0' }}>Billed To:</h3>
          <p style={{ margin: '2px 0', fontWeight: 'bold' }}>{invoiceData.clientName || 'Walk-in Customer'}</p>
          <p style={{ margin: '2px 0' }}>{invoiceData.clientAddress || ''}</p>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '1px solid #ddd' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>Qty</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Unit Price</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoiceData.items?.map((item: any, i: number) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>{item.name}</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrencyValue(item.price)} {currencySymbol}</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrencyValue(item.price * item.quantity)} {currencySymbol}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
        <div style={{ width: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
            <span>Subtotal:</span>
            <span>{formatCurrencyValue(invoiceData.subtotal || 0)} {currencySymbol}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
            <span>Tax (5%):</span>
            <span>{formatCurrencyValue(invoiceData.tax || 0)} {currencySymbol}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #eee', marginTop: '10px', fontWeight: 'bold', fontSize: '18px' }}>
            <span>Total:</span>
            <span>{formatCurrencyValue(invoiceData.total || 0)} {currencySymbol}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '50px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: '100px' }}>
          {digitalSignature ? (
            <img src={digitalSignature} alt="Authorized Signature" style={{ maxHeight: '80px', maxWidth: '200px' }} />
          ) : (
            <div style={{ borderTop: '1px solid #000', width: '200px', textAlign: 'center', paddingTop: '10px' }}>
              Authorized Signature
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default A4Invoice;
