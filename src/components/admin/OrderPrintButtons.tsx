'use client';

import { FileText, ClipboardList, Package } from 'lucide-react';

interface OrderPrintProps {
  order: {
    id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string | null;
    paidAt: string | null;
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    customerNotes: string | null;
    adminNotes: string | null;
    purchaseOrderNumber: string | null;
    gsaContractNumber: string | null;
    shippingMethod: string | null;
    shippingCarrier: string | null;
    trackingNumber: string | null;
    user: { name: string | null; email: string; phone: string | null; accountType: string };
    items: Array<{
      id: string;
      name: string;
      sku: string;
      quantity: number;
      price: number;
      total: number;
      discount: number;
      variantName: string | null;
      variantSku: string | null;
    }>;
    shippingAddress: {
      firstName: string | null; lastName: string | null; company: string | null;
      address1: string | null; address2: string | null;
      city: string | null; state: string | null; zipCode: string | null; country: string | null; phone: string | null;
    };
    billingAddress: {
      firstName: string | null; lastName: string | null; company: string | null;
      address1: string | null; address2: string | null;
      city: string | null; state: string | null; zipCode: string | null; country: string | null; phone: string | null;
    };
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatAddress(addr: OrderPrintProps['order']['shippingAddress']) {
  const lines = [
    `${addr.firstName} ${addr.lastName}`,
    addr.company,
    addr.address1,
    addr.address2,
    `${addr.city}, ${addr.state} ${addr.zipCode}`,
    addr.country,
    addr.phone,
  ].filter(Boolean);
  return lines;
}

function openPrintWindow(title: string, bodyHtml: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; padding: 40px; font-size: 13px; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 8px 10px; text-align: left; }
  th { background: #f3f4f6; font-weight: 600; border-bottom: 2px solid #d1d5db; }
  td { border-bottom: 1px solid #e5e7eb; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .bold { font-weight: 700; }
  .mt-4 { margin-top: 16px; }
  .mt-6 { margin-top: 24px; }
  .mb-2 { margin-bottom: 8px; }
  .mb-4 { margin-bottom: 16px; }
  .border-top { border-top: 2px solid #111; padding-top: 8px; }
  @media print {
    body { padding: 20px; }
    @page { margin: 0.5in; }
  }
</style>
</head>
<body>
${bodyHtml}
<script>window.onload=function(){window.print();}</script>
</body>
</html>`);
  win.document.close();
}

function printInvoice(order: OrderPrintProps['order']) {
  const billTo = formatAddress(order.billingAddress);
  const shipTo = formatAddress(order.shippingAddress);

  const itemsRows = order.items.map(item => `
    <tr>
      <td>${item.name}${item.variantName ? `<br><small style="color:#666">${item.variantName}</small>` : ''}</td>
      <td>${item.variantSku || item.sku}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-right">$${item.price.toFixed(2)}</td>
      <td class="text-right">${item.discount > 0 ? '-$' + item.discount.toFixed(2) : '-'}</td>
      <td class="text-right">$${item.total.toFixed(2)}</td>
    </tr>
  `).join('');

  const poLine = order.purchaseOrderNumber
    ? `<div class="mb-2"><strong>Purchase Order #:</strong> ${order.purchaseOrderNumber}</div>` : '';
  const gsaLine = order.gsaContractNumber
    ? `<div class="mb-2"><strong>GSA Contract #:</strong> ${order.gsaContractNumber}</div>` : '';

  const html = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px;">
      <div>
        <h1 style="font-size:28px; margin-bottom:4px;">ADA Supply</h1>
        <div style="color:#666; font-size:12px;">Warner Robins, GA 31088</div>
      </div>
      <div style="text-align:right;">
        <h2 style="font-size:24px; color:#16a34a; margin-bottom:8px;">INVOICE</h2>
        <div><strong>Invoice #:</strong> ${order.orderNumber}</div>
        <div><strong>Date:</strong> ${formatDate(order.createdAt)}</div>
        <div><strong>Status:</strong> ${order.paymentStatus.replace('_', ' ')}</div>
      </div>
    </div>

    ${poLine}${gsaLine}

    <div style="display:flex; gap:40px; margin-bottom:24px;">
      <div style="flex:1;">
        <div style="font-weight:700; color:#16a34a; margin-bottom:6px; text-transform:uppercase; font-size:11px; letter-spacing:1px;">Bill To</div>
        ${billTo.map(l => `<div>${l}</div>`).join('')}
        <div style="margin-top:4px; font-size:12px; color:#666;">${order.user.email}</div>
      </div>
      <div style="flex:1;">
        <div style="font-weight:700; color:#16a34a; margin-bottom:6px; text-transform:uppercase; font-size:11px; letter-spacing:1px;">Ship To</div>
        ${shipTo.map(l => `<div>${l}</div>`).join('')}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>SKU</th>
          <th class="text-center">Qty</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Discount</th>
          <th class="text-right">Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div style="display:flex; justify-content:flex-end; margin-top:20px;">
      <div style="width:280px;">
        <div style="display:flex; justify-content:space-between; padding:4px 0;"><span>Subtotal:</span><span>$${order.subtotal.toFixed(2)}</span></div>
        ${order.discount > 0 ? `<div style="display:flex; justify-content:space-between; padding:4px 0; color:#dc2626;"><span>Discount:</span><span>-$${order.discount.toFixed(2)}</span></div>` : ''}
        <div style="display:flex; justify-content:space-between; padding:4px 0;"><span>Shipping:</span><span>$${order.shipping.toFixed(2)}</span></div>
        <div style="display:flex; justify-content:space-between; padding:4px 0;"><span>Tax:</span><span>$${order.tax.toFixed(2)}</span></div>
        <div class="border-top" style="display:flex; justify-content:space-between; padding:8px 0; font-size:16px; font-weight:700;">
          <span>Total:</span><span>$${order.total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div class="mt-6" style="border-top:1px solid #e5e7eb; padding-top:16px;">
      <div class="mb-2"><strong>Payment Method:</strong> ${order.paymentMethod?.replace('_', ' ') || 'N/A'}</div>
      ${order.paidAt ? `<div class="mb-2"><strong>Paid:</strong> ${formatDate(order.paidAt)}</div>` : ''}
    </div>

    <div class="mt-6" style="text-align:center; color:#666; border-top:1px solid #e5e7eb; padding-top:20px;">
      <div style="font-size:14px; margin-bottom:4px;">Thank you for your business</div>
      <div style="font-size:11px;">ADA Supply &bull; Warner Robins, GA 31088</div>
    </div>
  `;

  openPrintWindow(`Invoice ${order.orderNumber}`, html);
}

function printPackingSlip(order: OrderPrintProps['order']) {
  const itemsRows = order.items.map(item => `
    <tr>
      <td style="width:30px;"><input type="checkbox" style="width:18px; height:18px;" /></td>
      <td>${item.name}${item.variantName ? `<br><small style="color:#666">${item.variantName}</small>` : ''}</td>
      <td>${item.variantSku || item.sku}</td>
      <td class="text-center">${item.quantity}</td>
    </tr>
  `).join('');

  const notes = [order.customerNotes, order.adminNotes].filter(Boolean).join('\n\n');

  const html = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px;">
      <div>
        <h1 style="font-size:24px; margin-bottom:4px;">PACKING SLIP</h1>
        <div style="color:#666;">ADA Supply</div>
      </div>
      <div style="text-align:right;">
        <div><strong>Order #:</strong> ${order.orderNumber}</div>
        <div><strong>Date:</strong> ${formatDate(order.createdAt)}</div>
      </div>
    </div>

    <div class="mb-4">
      <div style="font-weight:700; margin-bottom:4px;">Ship To:</div>
      ${formatAddress(order.shippingAddress).map(l => `<div>${l}</div>`).join('')}
    </div>

    <div class="mb-2"><strong>Customer:</strong> ${order.user.name || order.user.email}</div>

    <table class="mt-4">
      <thead>
        <tr>
          <th style="width:30px;">&#10003;</th>
          <th>Product</th>
          <th>SKU</th>
          <th class="text-center">Qty</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    ${notes ? `
    <div class="mt-6">
      <div style="font-weight:700; margin-bottom:4px;">Special Instructions / Notes:</div>
      <div style="border:1px solid #d1d5db; padding:10px; border-radius:4px; min-height:60px; white-space:pre-wrap;">${notes}</div>
    </div>
    ` : `
    <div class="mt-6">
      <div style="font-weight:700; margin-bottom:4px;">Special Instructions / Notes:</div>
      <div style="border:1px solid #d1d5db; padding:10px; border-radius:4px; min-height:60px;"></div>
    </div>
    `}

    <div class="mt-6" style="display:flex; gap:40px;">
      <div style="flex:1;">
        <div style="font-weight:700; margin-bottom:8px;">Picked By:</div>
        <div style="border-bottom:1px solid #111; height:40px;"></div>
      </div>
      <div style="flex:1;">
        <div style="font-weight:700; margin-bottom:8px;">Date:</div>
        <div style="border-bottom:1px solid #111; height:40px;"></div>
      </div>
    </div>
  `;

  openPrintWindow(`Packing Slip ${order.orderNumber}`, html);
}

function printShippingLabel(order: OrderPrintProps['order']) {
  const shipTo = formatAddress(order.shippingAddress);

  const html = `
    <div style="border:3px solid #111; padding:30px; max-width:500px; margin:0 auto;">
      <div style="border-bottom:2px solid #111; padding-bottom:16px; margin-bottom:20px;">
        <div style="font-size:11px; text-transform:uppercase; color:#666; letter-spacing:1px; margin-bottom:4px;">From</div>
        <div style="font-size:14px; font-weight:700;">ADA Supply</div>
        <div style="font-size:13px;">Warner Robins, GA 31088</div>
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-size:11px; text-transform:uppercase; color:#666; letter-spacing:1px; margin-bottom:6px;">To</div>
        ${shipTo.map(l => `<div style="font-size:18px; font-weight:700; line-height:1.4;">${l}</div>`).join('')}
      </div>

      <div style="border-top:2px solid #111; padding-top:16px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:11px; text-transform:uppercase; color:#666; letter-spacing:1px;">Order #</div>
          <div style="font-size:22px; font-weight:900; letter-spacing:3px; font-family:monospace;">${order.orderNumber}</div>
        </div>
        ${order.shippingMethod ? `
        <div style="text-align:right;">
          <div style="font-size:11px; text-transform:uppercase; color:#666; letter-spacing:1px;">Shipping Method</div>
          <div style="font-size:14px; font-weight:700;">${order.shippingMethod}</div>
        </div>` : ''}
      </div>

      ${order.trackingNumber ? `
      <div style="margin-top:16px; border-top:1px solid #d1d5db; padding-top:12px;">
        <div style="font-size:11px; text-transform:uppercase; color:#666; letter-spacing:1px;">Tracking #</div>
        <div style="font-size:14px; font-weight:700; font-family:monospace;">${order.trackingNumber}</div>
      </div>` : ''}
    </div>
  `;

  openPrintWindow(`Shipping Label ${order.orderNumber}`, html);
}

export default function OrderPrintButtons({ order }: OrderPrintProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => printInvoice(order)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-safety-green-50 hover:border-safety-green-300 hover:text-safety-green-700 transition-colors"
        title="Print Invoice"
      >
        <FileText className="w-4 h-4" />
        Invoice
      </button>
      <button
        onClick={() => printPackingSlip(order)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-safety-green-50 hover:border-safety-green-300 hover:text-safety-green-700 transition-colors"
        title="Print Packing Slip"
      >
        <ClipboardList className="w-4 h-4" />
        Packing Slip
      </button>
      <button
        onClick={() => printShippingLabel(order)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-safety-green-50 hover:border-safety-green-300 hover:text-safety-green-700 transition-colors"
        title="Print Shipping Label"
      >
        <Package className="w-4 h-4" />
        Shipping Label
      </button>
    </div>
  );
}
