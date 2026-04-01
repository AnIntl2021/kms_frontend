import React from 'react';
import logo from '../assets/logo.jpg';

interface InvoiceProps {
  order: any;
  items: any[];
}

const FullInvoicePrint = React.forwardRef<HTMLDivElement, InvoiceProps>(({ order, items }, ref) => {
  const today = new Date().toLocaleDateString('en-GB');

  // ELITE CALCULATION ORACLE
  const subTotal = (items || []).reduce((acc, curr) => acc + (Number(curr.price || 0) * Number(curr.quantity || 0)), 0);
  const discount = Number(order?.discount || 0);
  const netAmount = subTotal - discount;

  return (
    <div ref={ref} className="invoice-print-container" style={{
      padding: '30px 40px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: '#000',
      backgroundColor: '#fff',
      width: '1000px',
      margin: '0 auto',
      position: 'relative',
      minHeight: '1120px', // Standard A4 One-Page Height at 96DPI
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      border: '1px solid #e2e8f0'
    }}>
      {/* Background Watermark */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.05,
        zIndex: 0,
        pointerEvents: 'none',
        width: '500px'
      }}>
        <img src={logo} alt="watermark" style={{ width: '100%' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
             <img src={logo} alt="logo" style={{ width: '100px', marginBottom: '8px', borderRadius: '8px' }} />
             <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Fresh & Fast</h2>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, direction: 'rtl' }}>شركة مطعم فريش اند فاست</h2>
            <p style={{ margin: '4px 0', fontSize: '14px', fontWeight: 700 }}>Fresh & Fast Restaurant Company</p>
            <p style={{ margin: '1px 0', fontSize: '13px' }}>+965 90002939 <span role="img" aria-label="phone">📞</span></p>
            <p style={{ margin: '1px 0', fontSize: '13px' }}>sales@freshnfastkw.com <span role="img" aria-label="email">✉️</span></p>
          </div>
        </div>

        {/* Invoice Title */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, direction: 'rtl' }}>فاتورة مبيعات</h3>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, borderBottom: '2px solid #000', display: 'inline-block', paddingBottom: '3px' }}>Sales Invoice</h4>
        </div>

        {/* Metadata Grid */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div style={{ flex: 1.5, border: '2px solid #000', padding: '12px' }}>
             <p style={{ margin: 0, fontSize: '12px', fontWeight: 800 }}>Customer Name</p>
             <h3 style={{ margin: '8px 0 0 0', fontSize: '16px', textTransform: 'uppercase' }}>{order?.customer_name || 'Counter Customer'}</h3>
          </div>
          <div style={{ flex: 1, border: '2px solid #000' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', height: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px', fontSize: '12px', fontWeight: 700, backgroundColor: '#f9fafb' }}>Invoice No:</td>
                  <td style={{ border: '1px solid #000', padding: '6px', fontSize: '12px' }}>#{order?.sale_id || '---'}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px', fontSize: '12px', fontWeight: 700, backgroundColor: '#f9fafb' }}>Date</td>
                  <td style={{ border: '1px solid #000', padding: '6px', fontSize: '12px' }}>{order?.order_date || today}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px', fontSize: '12px', fontWeight: 700, backgroundColor: '#f9fafb' }}>Sales Man</td>
                  <td style={{ border: '1px solid #000', padding: '6px', fontSize: '12px' }}>Admin</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '6px', fontSize: '12px', fontWeight: 700, backgroundColor: '#f9fafb' }}>Lpo No</td>
                  <td style={{ border: '1px solid #000', padding: '6px', fontSize: '12px' }}>N/A</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Main Items Grid with CONTINUOUS VERTICAL LINES */}
        <div style={{ 
          flex: 1, 
          border: '2px solid #000', 
          borderBottom: 'none',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* THE GRID BACKGROUND LINES */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'grid',
            gridTemplateColumns: '80px 1fr 80px 80px 100px 120px 150px',
            pointerEvents: 'none',
            zIndex: -1
          }}>
             <div style={{ borderRight: '1px solid #000' }}></div>
             <div style={{ borderRight: '1px solid #000' }}></div>
             <div style={{ borderRight: '1px solid #000' }}></div>
             <div style={{ borderRight: '1px solid #000' }}></div>
             <div style={{ borderRight: '1px solid #000' }}></div>
             <div style={{ borderRight: '1px solid #000' }}></div>
             <div></div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'center', backgroundColor: '#f1f5f9' }}>
                <th style={{ border: '1px solid #000', padding: '10px 5px', fontSize: '11px', width: '80px' }}>رقم الصنف<br/>Item Code.</th>
                <th style={{ border: '1px solid #000', padding: '10px 5px', fontSize: '11px' }}>البيان<br/>Description</th>
                <th style={{ border: '1px solid #000', padding: '10px 5px', fontSize: '11px', width: '80px' }}>الوصف<br/>Unit</th>
                <th style={{ border: '1px solid #000', padding: '10px 5px', fontSize: '11px', width: '80px' }}>التفـ<br/>Pack.</th>
                <th style={{ border: '1px solid #000', padding: '10px 5px', fontSize: '11px', width: '100px' }}>العدد<br/>Qty.</th>
                <th style={{ border: '1px solid #000', padding: '10px 5px', fontSize: '11px', width: '120px' }}>سعرالواحدـة<br/>Unit Price</th>
                <th style={{ border: '1px solid #000', padding: '10px 5px', fontSize: '11px', width: '150px' }}>القيمة الإجمالية<br/>Total Price</th>
              </tr>
            </thead>
            <tbody>
              {(items || []).map((item, idx) => (
                <tr key={idx} style={{ height: '35px' }}>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '13px' }}>{String(item.item_code || idx + 1).padStart(3, '0')}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 700, fontSize: '13px' }}>{item.name_en}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '13px' }}>PCS</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '13px' }}>1</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', fontSize: '13px' }}>{Number(item.quantity).toFixed(0)}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', fontSize: '13px' }}>{Number(item.price).toFixed(3)}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', fontWeight: 800, fontSize: '13px' }}>{(item.price * item.quantity).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Section */}
        <div style={{ marginTop: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', marginBottom: '30px' }}>
            <tfoot>
              <tr>
                <td style={{ border: '1px solid #000', padding: '10px 15px', fontWeight: 700, fontSize: '13px', textAlign: 'left' }}>Total Amount <span style={{ float: 'right' }}>الاجمالي</span></td>
                <td style={{ border: '1px solid #000', padding: '10px 8px', textAlign: 'right', fontWeight: 900, fontSize: '16px', width: '150px' }}>{subTotal.toFixed(3)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '10px 15px', fontWeight: 700, fontSize: '13px', textAlign: 'left' }}>Discount <span style={{ float: 'right' }}>الخصم</span></td>
                <td style={{ border: '1px solid #000', padding: '10px 8px', textAlign: 'right', fontWeight: 900, fontSize: '16px' }}>{discount.toFixed(3)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '10px 15px', fontWeight: 900, fontSize: '13px', textAlign: 'left', backgroundColor: '#f1f5f9' }}>Net Amount <span style={{ float: 'right' }}>الصافي</span></td>
                <td style={{ border: '1px solid #000', padding: '10px 8px', textAlign: 'right', fontWeight: 900, fontSize: '18px', backgroundColor: '#f1f5f9' }}>{netAmount.toFixed(3)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Signature Areas */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '15px', 
            textAlign: 'center',
            marginBottom: '15px'
          }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 800 }}>مدير المبيعات<br/>Sales Manager</p>
              <div style={{ borderBottom: '1.5px solid #000', marginTop: '40px', marginInline: '15px' }}></div>
            </div>
            <div>
               <p style={{ fontSize: '11px', fontWeight: 800 }}>مندوب المبيعات<br/>Signature Salesman</p>
               <div style={{ borderBottom: '1.5px solid #000', marginTop: '40px', marginInline: '15px' }}></div>
            </div>
            <div>
               <p style={{ fontSize: '11px', fontWeight: 800 }}>التوقيع امين المخزن<br/>Signature Store Keeper</p>
               <div style={{ borderBottom: '1.5px solid #000', marginTop: '40px', marginInline: '15px' }}></div>
            </div>
            <div>
               <p style={{ fontSize: '11px', fontWeight: 800 }}>اسم وتوقيع المستلم<br/>Customer Signature Name</p>
               <div style={{ borderBottom: '1.5px solid #000', marginTop: '40px', marginInline: '15px' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default FullInvoicePrint;
