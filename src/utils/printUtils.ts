export interface PrintCartItem {
  name: string;
  price: number;
  quantity: number;
}

import api from '../api/axios';

export const printReceipt = async (
  items: PrintCartItem[],
  total: number,
  orderType: string,
  paymentMethod: string,
  orderNumber: string,
  discountAmount: number = 0,
  discountPercentage: number = 0,
  tableNumber: string = '',
  receivedAmount: number = 0,
  returnedAmount: number = 0
) => {
  let companyName = '';
  let companyAddress = '';
  let companyPhone = '';
  let companyLogo = '';

  try {
    const res = await api.get('/settings');
    if (res.data && res.data.data) {
      const systemSettings = res.data.data;
      companyName = systemSettings.company_name || '';
      companyAddress = systemSettings.company_address || '';
      companyPhone = systemSettings.contact_number || '';
      companyLogo = systemSettings.company_logo || '';
    }
  } catch (e) {
    console.error('Failed to fetch system settings for print', e);
  }

  const settingsStr = localStorage.getItem('printSettings');
  let printType = 'thermal';
  let footerText = 'Thank you for your visit!\\nPlease come again.';

  if (settingsStr) {
    try {
      const settings = JSON.parse(settingsStr);
      printType = settings.printType || 'thermal';
      footerText = settings.footerText || '';
    } catch (e) {
      console.error('Error parsing print settings', e);
    }
  }

  // Handle newlines in header and footer text
  const formatText = (text: string) => {
    return text.replace(/\\n/g, '<br/>').replace(/\n/g, '<br/>');
  };

  let formattedHeader = '';
  if (companyName) formattedHeader += `<div class="bold" style="font-size: 16px; margin-bottom: 5px;">${companyName}</div>`;
  if (companyAddress) formattedHeader += `<div>${companyAddress.replace(/\\n/g, '<br/>').replace(/\n/g, '<br/>')}</div>`;
  if (companyPhone) formattedHeader += `<div>Tel: ${companyPhone}</div>`;

  const formattedFooter = formatText(footerText);

  const dateStr = new Date().toLocaleString();
  
  let htmlContent = '';

  if (printType === 'thermal') {
    htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${orderNumber}</title>
          <style>
            @page { margin: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 76mm;
              margin: 0 auto;
              padding: 10px;
              font-size: 12px;
              box-sizing: border-box;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .header { margin-bottom: 10px; }
            .footer { margin-top: 10px; text-align: center; }
            .divider { border-bottom: 1px dashed #000; margin: 5px 0; }
            table { width: 100%; text-align: left; border-collapse: collapse; }
            th, td { padding: 4px 0; font-size: 11px; }
            th:nth-child(1), td:nth-child(1) { width: 60%; padding-right: 5px; }
            th:nth-child(2), td:nth-child(2) { width: 10%; text-align: center; }
            th:nth-child(3), td:nth-child(3) { width: 30%; text-align: right; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          ${companyLogo ? `<div class="center" style="margin-bottom: 10px;">
            <img src="${companyLogo}" alt="Logo" style="max-width: 80px; max-height: 80px;" onerror="this.style.display='none'" />
          </div>` : ''}
          ${formattedHeader ? `<div class="header center">
            ${formattedHeader}
          </div>` : ''}
          <div>Date: ${dateStr}</div>
          <div>Order #: ${orderNumber}</div>
          <div>Type: ${orderType.toUpperCase().replace('_', ' ')}</div>
          ${tableNumber ? `<div>Table: ${tableNumber}</div>` : ''}
          <div>Payment: ${paymentMethod.toUpperCase()}</div>
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th>Item / الصنف</th>
                <th class="right">Qty / الكمية</th>
                <th class="right">Price / السعر</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td class="right">${item.quantity}</td>
                  <td class="right">${(item.price * item.quantity).toFixed(3)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="divider"></div>
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal / المجموع:</span>
            <span>${(total + discountAmount).toFixed(3)} KWD</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Discount / الخصم (${discountPercentage}%):</span>
            <span>-${discountAmount.toFixed(3)} KWD</span>
          </div>
          <div class="divider"></div>
          <div style="display: flex; justify-content: space-between;" class="bold">
            <span>TOTAL:</span>
            <span>${total.toFixed(3)} KWD</span>
          </div>
          ${receivedAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 4px;">
              <span>Received / المدفوع:</span>
              <span>${receivedAmount.toFixed(3)} KWD</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span>Returned / المتبقي:</span>
              <span>${returnedAmount.toFixed(3)} KWD</span>
            </div>
          ` : ''}
          <div class="divider"></div>
          <div class="footer">${formattedFooter}</div>
        </body>
      </html>
    `;
  } else {
    htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${orderNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              color: #333;
            }
            .header-container { text-align: center; margin-bottom: 30px; }
            .header-text { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
            .info-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .info-box { border: 1px solid #ccc; padding: 15px; border-radius: 8px; width: 48%; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 12px; border-bottom: 1px solid #ddd; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .right { text-align: right; }
            .total-row { font-size: 18px; font-weight: bold; }
            .footer { text-align: center; margin-top: 40px; color: #666; font-style: italic; }
            @media print {
              body { padding: 0; }
              .info-box { border: 1px solid #ccc; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            ${companyLogo ? `<div style="margin-bottom: 15px;">
              <img src="${companyLogo}" alt="Logo" style="max-height: 80px;" onerror="this.style.display='none'" />
            </div>` : ''}
            ${formattedHeader ? `<div class="header-text">${formattedHeader}</div>` : ''}
            <div style="font-size: 24px; font-weight: bold; margin-top: 20px; color: #2c3e50;">TAX INVOICE / RECEIPT</div>
          </div>
          
          <div class="info-section">
            <div class="info-box">
              <div><strong>Order Number:</strong> ${orderNumber}</div>
              <div><strong>Date:</strong> ${dateStr}</div>
              ${tableNumber ? `<div><strong>Table:</strong> ${tableNumber}</div>` : ''}
            </div>
            <div class="info-box">
              <div><strong>Order Type:</strong> ${orderType.toUpperCase().replace('_', ' ')}</div>
              <div><strong>Payment Method:</strong> ${paymentMethod.toUpperCase()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description / الوصف</th>
                <th class="right">Unit Price / سعر الوحدة</th>
                <th class="right">Qty / الكمية</th>
                <th class="right">Total / الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td class="right">${item.price.toFixed(3)}</td>
                  <td class="right">${item.quantity}</td>
                  <td class="right">${(item.price * item.quantity).toFixed(3)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="right">Subtotal / المجموع (KWD)</td>
                <td class="right">${(total + discountAmount).toFixed(3)}</td>
              </tr>
              <tr>
                <td colspan="3" class="right">Discount / الخصم (${discountPercentage}%)</td>
                <td class="right">-${discountAmount.toFixed(3)}</td>
              </tr>
              <tr>
                <td colspan="3" class="right total-row">Grand Total (KWD)</td>
                <td class="right total-row">${total.toFixed(3)}</td>
              </tr>
              ${receivedAmount > 0 ? `
                <tr>
                  <td colspan="3" class="right" style="font-weight: bold; border-top: none;">Amount Received / المدفوع (KWD)</td>
                  <td class="right" style="font-weight: bold; border-top: none;">${receivedAmount.toFixed(3)}</td>
                </tr>
                <tr>
                  <td colspan="3" class="right" style="font-weight: bold; border-top: none;">Amount Returned / المتبقي (KWD)</td>
                  <td class="right" style="font-weight: bold; border-top: none;">${returnedAmount.toFixed(3)}</td>
                </tr>
              ` : ''}
            </tfoot>
          </table>

          <div class="footer">${formattedFooter}</div>
        </body>
      </html>
    `;
  }

  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'absolute';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = 'none';
  document.body.appendChild(printIframe);

  const win = printIframe.contentWindow;
  if (win) {
    win.document.open();
    win.document.write(htmlContent);
    win.document.close();
    
    win.focus();
    setTimeout(() => {
      win.print();
      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe);
        }
      }, 1000);
    }, 250);
  }
};
