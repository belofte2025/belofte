export function printReceiptHTML(data: {
  customer: string;
  items: { itemName: string; qty: number; unitPrice: number }[];
  subtotal?: number;
  discountType?: "percentage" | "amount" | null;
  discountValue?: number;
  discountAmount?: number;
  total: number;
  saleType: string;
}) {
  console.log("Printing receipt for:", data);
  const win = window.open("", "_blank", "width=600,height=800");
  const rows = data.items
    .map(
      (item) =>
        `<tr>
          <td>${item.itemName}</td>
          <td>${item.qty}</td>
          <td>₵ ${item.unitPrice.toFixed(2)}</td>
          <td>₵ ${(item.qty * item.unitPrice).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  // Calculate subtotal if not provided
  const subtotal = data.subtotal ?? data.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const hasDiscount = data.discountAmount && data.discountAmount > 0;

  const discountRow = hasDiscount
    ? `<tr style="color: #ea580c;">
        <td colspan="3">Discount (${data.discountType === "percentage" ? `${data.discountValue}%` : "Fixed"})</td>
        <td>- ₵ ${data.discountAmount?.toFixed(2)}</td>
      </tr>`
    : "";

  const html = `
    <html>
      <head>
        <title>Sales Receipt</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h2 { color: #1e3a8a; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          tfoot td { font-weight: bold; }
          .subtotal-row { background-color: #f9fafb; }
          .total-row { background-color: #ecfdf5; color: #059669; }
        </style>
      </head>
      <body>
        <h2>Sales Receipt</h2>
        <p><strong>Customer:</strong> ${data.customer}</p>
        <p><strong>Sale Type:</strong> ${data.saleType}</p>
        <table>
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            ${hasDiscount ? `<tr class="subtotal-row"><td colspan="3">Subtotal</td><td>₵ ${subtotal.toFixed(2)}</td></tr>` : ""}
            ${discountRow}
            <tr class="total-row"><td colspan="3">Total</td><td>₵ ${data.total.toFixed(2)}</td></tr>
          </tfoot>
        </table>
      </body>
    </html>
  `;

  if (win) {
    win.document.write(html);
    win.document.close();
    win.print();
  }
}
