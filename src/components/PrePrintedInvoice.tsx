import React from 'react';

interface InvoiceProps {
  order: any;
  items: any[];
}

// 1cm = 37.795px (96dpi standard)
const CM = 37.795;

const PrePrintedInvoice = React.forwardRef<HTMLDivElement, InvoiceProps>(({ order, items }, ref) => {
  const today = new Date().toLocaleDateString('en-GB');

  const subTotal = (items || []).reduce(
    (acc, curr) => acc + Number(curr.price || 0) * Number(curr.quantity || 0),
    0
  );
  const discount = Number(order?.discount_amount || 0);
  const netAmount = Number(order?.final_amount || subTotal - discount);

  // ── Exact column widths from the diagram (cm) ──────────────────────────────
  // 3.1 | 9.0 | 1.2 | 1.2 | 1.2 | 1.9 | 2.6   → total ≈ 20.2 cm
  const cols = {
    code: `${3.1 * CM}px`,
    desc: `${9.0 * CM}px`,
    unit: `${1.2 * CM}px`,
    pack: `${1.2 * CM}px`,
    qty: `${1.2 * CM}px`,
    unitPrice: `${1.9 * CM}px`,
    total: `${2.6 * CM}px`,
  };

  const TOTAL_W = 20.02 * CM; // px

  return (
    <div
      ref={ref}
      className="invoice-print-container"
      style={{
        width: `${TOTAL_W}px`,
        margin: '0 auto',
        fontFamily: "'Courier New', Courier, monospace",
        color: '#000',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
        position: 'relative',
        transform: `translate(${0.2 * CM}px, ${0.1 * CM}px)`,
      }}
    >
      {/* ── HEADER SPACER (space above pre-printed header area) ── */}
      {/* Shifted to 5.7cm down to move header and middle table exactly 0.3cm down */}
      <div style={{ height: `${5.7 * CM}px` }} />

      {/* ── HEADER ROW: Customer Name (left) + Metadata block (right) ── */}
      {/*
          From diagram:
            8 cm   → Customer Name box
            4.2 cm → gap
            2.6 cm → label column  (Invoice No / Date / Sales Man / LPO No)
            5.0 cm → value column
          Total = 19.8 cm ≈ inside 20.02 cm total width
      */}
      <div style={{
        display: 'flex',
        width: `${TOTAL_W}px`,
        height: `${2.4 * CM}px`,   // header block height from diagram
        alignItems: 'stretch',
      }}>
        {/* Customer Name – 8 cm wide */}
        <div style={{
          width: `${8 * CM}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingLeft: `${0.8 * CM}px`, // Moved 1cm right from -0.2cm
          flexShrink: 0,
        }}>
          <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase' }}>
            {order?.customer_name || 'Counter Customer'}
          </div>
          {order?.branch_name && (
            <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>
              {order.branch_name} Branch
            </div>
          )}
          {(order?.branch_phone || order?.client_phone) && (
            <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '1px' }}>
              +965 {(order.branch_phone || order.client_phone).replace(/^\+965\s*/, '')}
            </div>
          )}
        </div>

        {/* 5.2 cm gap (Increased to align above Unit Price) */}
        <div style={{ width: `${5.2 * CM}px`, flexShrink: 0 }} />

        {/* Spacer – 2.6 cm (REMOVED LABELS, KEPT SPACER) */}
        <div style={{
          width: `${2.6 * CM}px`,
          flexShrink: 0,
        }} />

        {/* Values column – 5 cm (Shifted to land in boxes) */}
        <div style={{
          width: `${5 * CM}px`,
          flexShrink: 0,
          fontSize: '13px',
          fontWeight: 900,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          paddingLeft: `${1.2 * CM}px`, // Adjusted to center value in box
        }}>
          <div>FNFI-{100000 + (order?.sale_id || 0)}</div>
          <div>{(order?.dispatch_date || today).split(' ')[0]}</div>
          <div style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', marginLeft: `-${0.8 * CM}px`, fontWeight: 900 }}>
            {order?.salesman_name || 'Admin'} 
            {order?.salesman_phone && (
              <span style={{ fontSize: '11px', fontWeight: 600, marginLeft: '4px' }}>
                / +965 {order.salesman_phone.replace(/^\+965\s*/, '')}
              </span>
            )}
          </div>
          <div>N/A</div>
        </div>
      </div>

      {/* ── TABLE AREA (Fixed height, increased to 13.5cm to push totals down) ── */}
      <div style={{ height: `${13.5 * CM}px`, position: 'relative' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          transform: `translate(${0.2 * CM}px, ${0.2 * CM}px)`,
        }}>
          <colgroup>
            <col style={{ width: cols.code }} />
            <col style={{ width: cols.desc }} />
            <col style={{ width: cols.unit }} />
            <col style={{ width: cols.pack }} />
            <col style={{ width: cols.qty }} />
            <col style={{ width: cols.unitPrice }} />
            <col style={{ width: cols.total }} />
          </colgroup>
  
          <thead>
            {/* 2cm Header Row from diagram */}
            <tr style={{ height: `${2 * CM}px` }}>
              <th colSpan={7} />
            </tr>
          </thead>
  
          <tbody>
            {(items || []).map((item, idx) => (
              <tr key={idx} style={{ height: `${0.5 * CM}px`, verticalAlign: 'middle' }}>
                <td style={{ textAlign: 'center', fontSize: '13px', padding: 0, lineHeight: 1 }}>{String(idx + 1).padStart(3, '0')}</td>
                <td style={{ 
                  textAlign: 'left', 
                  fontWeight: 700, 
                  fontSize: '10.5px', 
                  padding: '2px 0', 
                  paddingLeft: `${0.8 * CM}px`, 
                  lineHeight: 1, 
                  wordBreak: 'break-word',
                  overflow: 'hidden'
                }}>
                  {item.name_en} {item.name_ar ? `/ ${item.name_ar}` : ''}
                </td>
                <td style={{ textAlign: 'center', fontSize: '12px', padding: 0, paddingLeft: `${0.5 * CM}px`, lineHeight: 1 }}>PCS</td>
                <td style={{ textAlign: 'center', fontSize: '12px', padding: 0, paddingLeft: `${0.5 * CM}px`, lineHeight: 1 }}>1</td>
                <td style={{ textAlign: 'center', fontSize: '12px', padding: 0, paddingLeft: `${0.5 * CM}px`, lineHeight: 1 }}>{Number(item.quantity).toFixed(0)}</td>
                <td style={{ textAlign: 'right', fontSize: '12px', padding: 0, paddingLeft: `${0.5 * CM}px`, lineHeight: 1 }}>{Number(item.price).toFixed(3)}</td>
                <td style={{ textAlign: 'right', fontWeight: 900, fontSize: '13px', padding: 0, paddingRight: `${0.5 * CM}px`, lineHeight: 1 }}>{(item.price * item.quantity).toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── FOOTER ROWS (3 × 1 cm) ── */}
      {/*
          Diagram: value box is 2.6 cm wide, right-aligned.
          Each footer row is 1 cm tall.
      */}
      {[
        { label: 'Total Amount', value: subTotal.toFixed(3) },
        { label: 'Discount', value: discount.toFixed(3) },
        { label: 'Net Amount', value: netAmount.toFixed(3) },
      ].map(({ label, value }, i) => (
        <div
          key={i}
          style={{
            width: `${TOTAL_W}px`,
            height: `${1 * CM}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          {/* Absolutely position the discount percentage at exactly 3 cm from left */}
          {i === 1 && Number(order?.discount_percentage) > 0 && (
            <div style={{
              position: 'absolute',
              left: `${3 * CM}px`,
              fontWeight: 800,
              fontSize: '13px',
              fontFamily: "'Courier New', Courier, monospace",
              transform: `translateY(${0 * CM}px)`,
            }}>
              {Number(order.discount_percentage) % 1 === 0 
                ? Number(order.discount_percentage).toFixed(0) 
                : Number(order.discount_percentage).toFixed(2)}%
            </div>
          )}

          {/* value sits inside the rightmost 4.0 cm column, shifted 0.35cm right */}
          <div style={{
            width: `${4.0 * CM}px`,
            textAlign: 'right',
            fontWeight: i === 2 ? 900 : 800,
            fontSize: i === 2 ? '14px' : '13px',
            paddingRight: `${0.35 * CM}px`, 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-end',
          }}>
            {value}
          </div>
        </div>
      ))}

      {/* Signature / bottom padding */}
      <div style={{ height: `${3 * CM}px` }} />
    </div>
  );
});

export default PrePrintedInvoice;