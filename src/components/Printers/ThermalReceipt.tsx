import React from 'react';
import { useSettings } from '../../hooks/useSettings';

// For printing, this component should be rendered inside an iframe or a new window
// and standard browser print invoked. For styling, 80mm is approx 302px.
const ThermalReceipt = ({ orderData }: { orderData: any }) => {
  const { settings, formatCurrencyValue, currencySymbol } = useSettings();

  return (
    <div style={{ width: '80mm', margin: '0 auto', fontFamily: 'monospace', fontSize: '12px', color: '#000', padding: '10px' }}>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h2 style={{ margin: 0, fontSize: '16px' }}>{settings.company_name || 'KMS'}</h2>
        <p style={{ margin: '2px 0' }}>{settings.company_address || '123 Main St, City Center'}</p>
        <p style={{ margin: '2px 0' }}>{settings.company_phone && `Tel: ${settings.company_phone}`}</p>
        <p style={{ margin: '10px 0', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>Receipt #: {orderData.id || '10001'}</p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <thead>
          <tr style={{ borderBottom: '1px dashed #000' }}>
            <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Item</th>
            <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Qty</th>
            <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Amt</th>
          </tr>
        </thead>
        <tbody>
          {orderData.items?.map((item: any, i: number) => (
            <tr key={i}>
              <td style={{ padding: '4px 0' }}>{item.name}</td>
              <td style={{ textAlign: 'right', padding: '4px 0' }}>{item.quantity}</td>
              <td style={{ textAlign: 'right', padding: '4px 0' }}>{formatCurrencyValue(item.price * item.quantity)} {currencySymbol}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: '1px dashed #000', paddingTop: '10px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal</span>
          <span>{formatCurrencyValue(orderData.subtotal || 0)} {currencySymbol}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Tax (5%)</span>
          <span>{formatCurrencyValue(orderData.tax || 0)} {currencySymbol}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '5px' }}>
          <span>Total</span>
          <span>{formatCurrencyValue(orderData.total || 0)} {currencySymbol}</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', borderTop: '1px dashed #000', paddingTop: '10px' }}>
        <p style={{ margin: '2px 0' }}>Thank you for your visit!</p>
        <p style={{ margin: '2px 0' }}>Please come again.</p>
        <p style={{ margin: '10px 0', fontSize: '10px' }}>{new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default ThermalReceipt;
