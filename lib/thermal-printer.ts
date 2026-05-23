export const printReceipt = (data: any) => {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const chunks = [];
  const chunkSize = 3;
  for (let i = 0; i < data.cart.length; i += chunkSize) {
    chunks.push(data.cart.slice(i, i + chunkSize));
  }

  const receiptHTML = `
    <html>
      <head>
        <style>
          /* KAPP'S CORNER EXACT RULER CONFIGURATION */
          @page {
            size: 115mm 195mm; /* Physical paper size */
            margin: 0; 
          }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            width: 100%; 
            margin: 0; 
            padding: 0; 
            font-size: 11px; 
            color: #000; 
          }

          .page {
            width: 90mm;
            height: 70mm;
            max-height: 70mm;
            overflow: hidden;
            box-sizing: border-box;
            
            /* CLIENT'S MEASUREMENTS FOR HEADER & FOOTER */
            /* 90mm top margin pushes it exactly past the 3.5 inch logo header */
            margin-top: 90mm;
            /* 35mm bottom margin for the footer space */
            margin-bottom: 35mm;
            /* auto left/right perfectly centers the 90mm text block inside the 115mm paper */
            margin-left: auto;
            margin-right: auto;
            
            page-break-after: always;
            break-after: page;
          }

          .page:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }
          
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { text-align: left; padding: 2px 0; }
          th.right, td.right { text-align: right; }
        </style>
      </head>
      <body>
        ${chunks.map((chunk, index) => {
          const isLastPage = index === chunks.length - 1;
          const pageNum = index + 1;
          
          return `
            <div class="page">
              <div style="display: flex; justify-content: space-between; margin:0 0 2px 0;">
                <span>Order: #${data.orderId.slice(-6).toUpperCase()}</span>
                <span>Page ${pageNum}/${chunks.length}</span>
              </div>
              <p style="margin:0 0 2px 0;">Date: ${new Date().toLocaleString()}</p>
              <div class="divider"></div>

              <table>
                <tr>
                  <th>Item</th>
                  <th class="right" style="padding-right: 8px;">Qty</th>
                  <th class="right">Amt</th>
                </tr>
                ${chunk.map((item: any) => `
                  <tr>
                    <td>${item.name}</td>
                    <td class="right" style="padding-right: 8px;">${item.quantity}</td>
                    <td class="right">${item.subtotal}</td>
                  </tr>
                `).join("")}
              </table>

              ${isLastPage ? `
                <div class="divider"></div>
                <table>
                  <tr><td>Subtotal</td><td class="right">${data.subtotal.toFixed(2)}</td></tr>
                  
                  ${data.discount && data.discount.amount > 0 ? `
                    <tr>
                      <td>Discount ${data.discount.value ? `(${data.discount.type === 'percentage' ? data.discount.value + '%' : 'Flat'})` : ''}</td>
                      <td class="right">-₹${data.discount.amount.toFixed(2)}</td>
                    </tr>
                  ` : ''}
                  
                  ${data.taxAmount > 0 ? `<tr><td>GST (18%)</td><td class="right">${data.taxAmount.toFixed(2)}</td></tr>` : ""}
                  <tr><th class="bold">TOTAL</th><th class="bold right">${data.total.toFixed(2)}</th></tr>
                </table>
                <div class="divider"></div>
                
                <p class="center bold" style="margin-top:5px;">Paid via: ${data.paymentMethod.toUpperCase()}</p>
                <p class="center" style="margin-top:10px; font-size:12px;">Ladoo POS system</p>
              ` : ''}
            </div>
          `;
        }).join("")}
      </body>
    </html>
  `;

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(receiptHTML);
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  }
};