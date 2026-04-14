import React from 'react';

interface InvoiceProps {
  order: any;
  items: any[];
}

const PrePrintedInvoice = React.forwardRef<HTMLDivElement, InvoiceProps>(({ order, items }, ref) => {
  const today = new Date().toLocaleDateString('en-GB');

  const subTotal = (items || []).reduce((acc, curr) => acc + (Number(curr.price || 0) * Number(curr.quantity || 0)), 0);
  const discount = Number(order?.discount_amount || 0);
  const netAmount = Number(order?.final_amount || subTotal - discount);

  return (
    <div ref={ref} className="invoice-print-container" style={{
      padding: '30px 40px',
      fontFamily: "'Courier New', Courier, monospace", // Better for Dot Matrix
      color: '#000',
      backgroundColor: '#fff',
      width: '1000px',
      margin: '0 auto',
      position: 'relative',
      minHeight: '1120px',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    }}>
      {/* HEADER SPACE - Hidden for pre-printed paper */}
      <div style={{ height: '180px' }} />

      {/* Metadata - Only values, no boxes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', paddingLeft: '50px' }}>
         <div style={{ flex: 1.5 }}>
            <h3 style={{ margin: 0, fontSize: '18px', textTransform: 'uppercase' }}>{order?.customer_name || 'Counter Customer'}</h3>
         </div>
         <div style={{ flex: 1, textAlign: 'right', paddingRight: '50px' }}>
            <p style={{ margin: '2px 0', fontSize: '14px' }}>#{order?.sale_id || order?.order_number}</p>
            <p style={{ margin: '2px 0', fontSize: '14px' }}>{order?.order_date || today}</p>
            <p style={{ margin: '2px 0', fontSize: '14px' }}>Admin</p>
         </div>
      </div>

      {/* Items List - No lines, just aligned columns */}
      <div style={{ flex: 1, marginTop: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ height: '40px' }}>
                <th style={{ width: '80px' }}></th>
                <th style={{ textAlign: 'left' }}></th>
                <th style={{ width: '80px' }}></th>
                <th style={{ width: '80px' }}></th>
                <th style={{ width: '100px' }}></th>
                <th style={{ width: '120px' }}></th>
                <th style={{ width: '150px' }}></th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map((item, idx) => (
                <tr key={idx} style={{ height: '35px' }}>
                  <td style={{ textAlign: 'center', fontSize: '14px' }}>{String(idx + 1).padStart(3, '0')}</td>
                  <td style={{ fontWeight: 700, fontSize: '14px' }}>{item.name_en}</td>
                  <td style={{ textAlign: 'center', fontSize: '14px' }}>PCS</td>
                  <td style={{ textAlign: 'center', fontSize: '14px' }}>1</td>
                  <td style={{ textAlign: 'center', fontSize: '14px' }}>{Number(item.quantity).toFixed(0)}</td>
                  <td style={{ textAlign: 'right', fontSize: '14px' }}>{Number(item.price).toFixed(3)} د.ك</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '14px' }}>{(item.price * item.quantity).toFixed(3)} د.ك</td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {/* Totals - No boxes */}
      <div style={{ marginTop: 'auto', paddingRight: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
             <div style={{ width: '200px', textAlign: 'right', fontWeight: 900, fontSize: '16px' }}>{subTotal.toFixed(3)} د.ك</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
             <div style={{ width: '200px', textAlign: 'right', fontWeight: 900, fontSize: '16px' }}>{discount.toFixed(3)} د.ك</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
             <div style={{ width: '200px', textAlign: 'right', fontWeight: 900, fontSize: '20px' }}>{netAmount.toFixed(3)} د.ك</div>
          </div>
      </div>
      
      {/* Bottom Padding for signatures */}
      <div style={{ height: '120px' }} />
    </div>
  );
});

export default PrePrintedInvoice;
