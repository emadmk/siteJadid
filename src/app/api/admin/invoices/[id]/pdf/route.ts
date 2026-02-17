export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await db.order.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        billingAddress: true,
        shippingAddress: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Generate HTML invoice
    const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const dueDate = new Date(order.createdAt);
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateStr = dueDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const billingAddress = order.billingAddress;
    const shippingAddress = order.shippingAddress;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice INV-${order.orderNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      color: #333;
      line-height: 1.5;
    }
    .invoice {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #22c55e;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #22c55e;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      font-size: 32px;
      color: #333;
      margin-bottom: 5px;
    }
    .invoice-number {
      font-size: 16px;
      color: #666;
    }
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .info-box {
      width: 48%;
    }
    .info-box h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }
    .info-box p {
      margin-bottom: 5px;
    }
    .info-box .name {
      font-weight: bold;
      font-size: 16px;
      color: #333;
    }
    .meta-info {
      display: flex;
      justify-content: space-between;
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .meta-item {
      text-align: center;
    }
    .meta-item .label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .meta-item .value {
      font-weight: bold;
      font-size: 16px;
    }
    .status-paid {
      color: #22c55e;
    }
    .status-unpaid {
      color: #f59e0b;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background: #f3f4f6;
      padding: 12px 15px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
      font-weight: 600;
    }
    td {
      padding: 15px;
      border-bottom: 1px solid #e5e7eb;
    }
    .item-name {
      font-weight: 500;
    }
    .item-sku {
      font-size: 12px;
      color: #999;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      margin-left: auto;
      width: 300px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .totals-row.total {
      border-bottom: none;
      padding-top: 15px;
      font-size: 18px;
      font-weight: bold;
      color: #22c55e;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
    .payment-info {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
    }
    .payment-info h3 {
      font-size: 14px;
      margin-bottom: 10px;
    }
    .payment-info p {
      font-size: 13px;
      color: #666;
    }
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .invoice {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="logo">SafetyFirst</div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <div class="invoice-number">INV-${order.orderNumber}</div>
      </div>
    </div>

    <div class="info-section">
      <div class="info-box">
        <h3>Bill To</h3>
        <p class="name">${billingAddress?.firstName || ''} ${billingAddress?.lastName || order.user?.name || 'Guest'}</p>
        ${billingAddress?.company ? `<p>${billingAddress.company}</p>` : ''}
        <p>${billingAddress?.address1 || billingAddress?.addressLine1 || ''}</p>
        ${(billingAddress?.address2 || billingAddress?.addressLine2) ? `<p>${billingAddress?.address2 || billingAddress?.addressLine2}</p>` : ''}
        <p>${billingAddress?.city || ''}, ${billingAddress?.state || ''} ${billingAddress?.zipCode || ''}</p>
        <p>${billingAddress?.country || ''}</p>
        <p>${order.user?.email || ''}</p>
      </div>
      <div class="info-box">
        <h3>Ship To</h3>
        <p class="name">${shippingAddress?.firstName || ''} ${shippingAddress?.lastName || order.user?.name || 'Guest'}</p>
        ${shippingAddress?.company ? `<p>${shippingAddress.company}</p>` : ''}
        <p>${shippingAddress?.address1 || shippingAddress?.addressLine1 || ''}</p>
        ${(shippingAddress?.address2 || shippingAddress?.addressLine2) ? `<p>${shippingAddress?.address2 || shippingAddress?.addressLine2}</p>` : ''}
        <p>${shippingAddress?.city || ''}, ${shippingAddress?.state || ''} ${shippingAddress?.zipCode || ''}</p>
        <p>${shippingAddress?.country || ''}</p>
      </div>
    </div>

    <div class="meta-info">
      <div class="meta-item">
        <div class="label">Invoice Date</div>
        <div class="value">${invoiceDate}</div>
      </div>
      <div class="meta-item">
        <div class="label">Due Date</div>
        <div class="value">${dueDateStr}</div>
      </div>
      <div class="meta-item">
        <div class="label">Payment Status</div>
        <div class="value ${order.paymentStatus === 'PAID' ? 'status-paid' : 'status-unpaid'}">
          ${order.paymentStatus}
        </div>
      </div>
      <div class="meta-item">
        <div class="label">Order Status</div>
        <div class="value">${order.status}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(item => `
          <tr>
            <td>
              <div class="item-name">${item.product?.name || item.name || 'Product'}</div>
              <div class="item-sku">SKU: ${item.product?.sku || item.sku || 'N/A'}</div>
            </td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">$${Number(item.price).toFixed(2)}</td>
            <td class="text-right">$${Number(item.total).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Subtotal</span>
        <span>$${Number(order.subtotal).toFixed(2)}</span>
      </div>
      ${order.discount && Number(order.discount) > 0 ? `
        <div class="totals-row">
          <span>Discount</span>
          <span>-$${Number(order.discount).toFixed(2)}</span>
        </div>
      ` : ''}
      <div class="totals-row">
        <span>Shipping</span>
        <span>$${Number(order.shipping || 0).toFixed(2)}</span>
      </div>
      <div class="totals-row">
        <span>Tax</span>
        <span>$${Number(order.tax || 0).toFixed(2)}</span>
      </div>
      <div class="totals-row total">
        <span>Total</span>
        <span>$${Number(order.total).toFixed(2)}</span>
      </div>
    </div>

    <div class="payment-info">
      <h3>Payment Information</h3>
      <p>Payment Method: ${order.paymentMethod || 'N/A'}</p>
      ${order.paymentStatus === 'PAID' ? `
        <p>Payment has been received. Thank you for your business!</p>
      ` : `
        <p>Please make payment by the due date. For questions, contact billing@safetyfirst.com</p>
      `}
    </div>

    <div class="footer">
      <p>Thank you for your business!</p>
      <p>SafetyFirst Supply Co. | 123 Safety Lane, Industrial City, ST 12345 | (555) 123-4567</p>
    </div>
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${order.orderNumber}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}
