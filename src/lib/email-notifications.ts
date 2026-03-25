// Centralized email notification service for ADA Supplies
// Handles sending transactional emails via SMTP (direct, no admin auth required)

import {
  welcomeEmail,
  emailVerificationTemplate,
  passwordResetTemplate,
  orderConfirmationTemplate,
  orderStatusTemplate,
  paymentReceivedTemplate,
  contactConfirmationTemplate,
  adminNewOrderTemplate,
  adminContactFormTemplate,
  adminNewRegistrationTemplate,
  accountApprovalTemplate,
  adminOrderStatusChangeTemplate,
  adminQuoteRequestTemplate,
  ensureBrandLoaded,
} from './email-templates';
import { db } from './db';

/**
 * Send email via SMTP (nodemailer)
 * This is the primary method for transactional emails - no admin auth required
 */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const host = process.env.EMAIL_SERVER_HOST;
    const port = parseInt(process.env.EMAIL_SERVER_PORT || '587');
    const user = process.env.EMAIL_SERVER_USER;
    const pass = process.env.EMAIL_SERVER_PASSWORD;
    const rawFrom = process.env.EMAIL_FROM || user;

    if (!host || !user || !pass) {
      console.error('[EMAIL] SMTP not configured - missing env vars:', {
        host: !!host,
        user: !!user,
        pass: !!pass,
      });
      return false;
    }

    // Ensure FROM field has proper format: "Name <email>"
    const from = rawFrom && rawFrom.includes('<')
      ? rawFrom
      : `ADA Supplies <${rawFrom}>`;

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      // Connection timeout settings
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const result = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log(`[EMAIL] Sent "${subject}" to ${to} (messageId: ${result.messageId})`);
    return true;
  } catch (error: any) {
    console.error(`[EMAIL] Failed to send "${subject}" to ${to}:`, error.message || error);
    if (error.code) {
      console.error(`[EMAIL] Error code: ${error.code}, command: ${error.command}`);
    }
    return false;
  }
}

/**
 * Try logging email to database (non-blocking, best effort)
 */
async function logEmail(data: {
  to: string;
  subject: string;
  type: string;
  userId?: string;
  orderId?: string;
}): Promise<void> {
  try {
    // Using imported db from ./db
    await db.emailLog.create({
      data: {
        toEmail: data.to,
        subject: data.subject,
        emailType: data.type,
        userId: data.userId,
        orderId: data.orderId,
        status: 'SENT',
        provider: 'smtp',
        sentAt: new Date(),
      },
    });
  } catch {
    // Non-blocking - don't fail if logging fails
  }
}

// ═══════════════════════════════════════════════
// PUBLIC API - Email Notification Functions
// ═══════════════════════════════════════════════

/**
 * Send Welcome + Verification email after registration
 */
export async function sendWelcomeEmail(data: {
  email: string;
  userName: string;
  accountType: string;
  verifyUrl?: string;
  userId?: string;
}): Promise<boolean> {
  await ensureBrandLoaded();
  const template = welcomeEmail({
    userName: data.userName,
    accountType: data.accountType,
    verifyUrl: data.verifyUrl,
  });

  const sent = await sendEmail(data.email, template.subject, template.html);
  if (sent) {
    await logEmail({ to: data.email, subject: template.subject, type: 'WELCOME', userId: data.userId });
  }
  return sent;
}

/**
 * Send Email Verification email
 */
export async function sendVerificationNotification(data: {
  email: string;
  userName?: string;
  verifyUrl: string;
  userId?: string;
}): Promise<boolean> {
  await ensureBrandLoaded();
  const template = emailVerificationTemplate({
    userName: data.userName,
    verifyUrl: data.verifyUrl,
  });

  const sent = await sendEmail(data.email, template.subject, template.html);
  if (sent) {
    await logEmail({ to: data.email, subject: template.subject, type: 'EMAIL_VERIFICATION', userId: data.userId });
  }
  return sent;
}

/**
 * Send Password Reset email
 */
export async function sendPasswordResetNotification(data: {
  email: string;
  userName?: string;
  resetUrl: string;
}): Promise<boolean> {
  await ensureBrandLoaded();
  const template = passwordResetTemplate({
    userName: data.userName,
    resetUrl: data.resetUrl,
  });

  const sent = await sendEmail(data.email, template.subject, template.html);
  if (sent) {
    await logEmail({ to: data.email, subject: template.subject, type: 'PASSWORD_RESET' });
  }
  return sent;
}

/**
 * Send Order Confirmation email
 */
export async function sendOrderConfirmation(data: {
  email: string;
  userName: string;
  orderNumber: string;
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  shippingAddress: {
    name?: string;
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  paymentMethod: string;
  userId?: string;
  orderId?: string;
}): Promise<boolean> {
  await ensureBrandLoaded();
  const template = orderConfirmationTemplate({
    userName: data.userName,
    orderNumber: data.orderNumber,
    items: data.items,
    subtotal: data.subtotal,
    shipping: data.shipping,
    tax: data.tax,
    discount: data.discount,
    total: data.total,
    shippingAddress: data.shippingAddress,
    paymentMethod: data.paymentMethod,
  });

  const sent = await sendEmail(data.email, template.subject, template.html);
  if (sent) {
    await logEmail({ to: data.email, subject: template.subject, type: 'ORDER_CONFIRMATION', userId: data.userId, orderId: data.orderId });
  }
  return sent;
}

/**
 * Send Order Status Update email
 */
export async function sendOrderStatusUpdate(data: {
  email: string;
  userName: string;
  orderNumber: string;
  status: string;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
  userId?: string;
  orderId?: string;
}): Promise<boolean> {
  await ensureBrandLoaded();
  const template = orderStatusTemplate({
    userName: data.userName,
    orderNumber: data.orderNumber,
    status: data.status,
    trackingNumber: data.trackingNumber,
    carrier: data.carrier,
    notes: data.notes,
  });

  const sent = await sendEmail(data.email, template.subject, template.html);
  if (sent) {
    await logEmail({ to: data.email, subject: template.subject, type: `ORDER_${data.status}`, userId: data.userId, orderId: data.orderId });
  }
  return sent;
}

/**
 * Send Payment Received email
 */
export async function sendPaymentReceivedNotification(data: {
  email: string;
  userName: string;
  orderNumber: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  userId?: string;
  orderId?: string;
}): Promise<boolean> {
  await ensureBrandLoaded();
  const template = paymentReceivedTemplate({
    userName: data.userName,
    orderNumber: data.orderNumber,
    amount: data.amount,
    paymentMethod: data.paymentMethod,
    transactionId: data.transactionId,
  });

  const sent = await sendEmail(data.email, template.subject, template.html);
  if (sent) {
    await logEmail({ to: data.email, subject: template.subject, type: 'PAYMENT_RECEIVED', userId: data.userId, orderId: data.orderId });
  }
  return sent;
}

/**
 * Send Contact Form Confirmation email
 */
export async function sendContactConfirmation(data: {
  email: string;
  userName: string;
  subject: string;
  message: string;
}): Promise<boolean> {
  await ensureBrandLoaded();
  const template = contactConfirmationTemplate({
    userName: data.userName,
    subject: data.subject,
    message: data.message,
  });

  const sent = await sendEmail(data.email, template.subject, template.html);
  if (sent) {
    await logEmail({ to: data.email, subject: template.subject, type: 'CONTACT_CONFIRMATION' });
  }
  return sent;
}

// ═══════════════════════════════════════════════
// ADMIN & STAFF NOTIFICATION FUNCTIONS
// ═══════════════════════════════════════════════

/**
 * Fetch all staff emails (SUPER_ADMIN, ADMIN, CUSTOMER_SERVICE)
 * Reads from the database so any new staff member automatically receives notifications
 */
async function getStaffEmails(): Promise<Array<{ id: string; email: string; name: string | null; role: string }>> {
  try {
    // Using imported db from ./db
    const staffUsers = await db.user.findMany({
      where: {
        role: { in: ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER_SERVICE'] },
        isActive: true,
        email: { not: undefined },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
    return staffUsers.filter((u: any) => u.email);
  } catch (error) {
    console.error('[EMAIL] Failed to fetch staff emails:', error);
    return [];
  }
}

/**
 * Send email to all staff members (SUPER_ADMIN, ADMIN, CUSTOMER_SERVICE)
 */
async function sendToAllStaff(subject: string, html: string, logType: string, extraLogData?: { orderId?: string }): Promise<void> {
  const staff = await getStaffEmails();
  if (staff.length === 0) {
    console.error('[EMAIL] No staff emails found in database! Check that admin users exist with isActive=true and roles SUPER_ADMIN/ADMIN/CUSTOMER_SERVICE');
    return;
  }
  console.log(`[EMAIL] Sending "${logType}" to ${staff.length} staff members: ${staff.map(s => s.email).join(', ')}`);

  const results = await Promise.allSettled(
    staff.map(async (member) => {
      const sent = await sendEmail(member.email, subject, html);
      if (sent) {
        await logEmail({
          to: member.email,
          subject,
          type: logType,
          ...extraLogData,
        });
      }
      return sent;
    })
  );

  const sentCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  console.log(`[EMAIL] Admin notification "${logType}" sent to ${sentCount}/${staff.length} staff members`);
}

/**
 * Send Admin Notification: New Order Placed
 */
export async function sendAdminNewOrderNotification(data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  accountType: string;
  total: number;
  itemCount: number;
  paymentMethod: string;
  orderId?: string;
}): Promise<void> {
  await ensureBrandLoaded();
  const template = adminNewOrderTemplate({
    orderNumber: data.orderNumber,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    accountType: data.accountType,
    total: data.total,
    itemCount: data.itemCount,
    paymentMethod: data.paymentMethod,
  });

  await sendToAllStaff(template.subject, template.html, 'ADMIN_NEW_ORDER', { orderId: data.orderId });

  // Create in-app notifications for all staff users
  try {
    const staff = await getStaffEmails();
    await Promise.allSettled(
      staff.map((member) =>
        db.notification.create({
          data: {
            userId: member.id,
            type: 'ORDER_UPDATE',
            title: `New Order #${data.orderNumber}`,
            message: `${data.customerName} placed a $${data.total.toFixed(2)} order (${data.itemCount} items)`,
            data: JSON.stringify({ url: `/admin/orders/${data.orderId}`, orderNumber: data.orderNumber }),
          },
        })
      )
    );
  } catch (error) {
    console.error('[NOTIFICATION] Failed to create in-app notifications for new order:', error);
  }
}

/**
 * Send Admin Notification: Contact Form Message
 */
export async function sendAdminContactFormNotification(data: {
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  subject: string;
  message: string;
  accountType?: string;
}): Promise<void> {
  await ensureBrandLoaded();
  const template = adminContactFormTemplate({
    senderName: data.senderName,
    senderEmail: data.senderEmail,
    senderPhone: data.senderPhone,
    subject: data.subject,
    message: data.message,
    accountType: data.accountType,
  });

  await sendToAllStaff(template.subject, template.html, 'ADMIN_CONTACT_FORM');
}

/**
 * Send Admin Notification: New Registration Requiring Approval
 */
export async function sendAdminNewRegistrationNotification(data: {
  userName: string;
  userEmail: string;
  userPhone?: string;
  accountType: string;
  companyName?: string;
  governmentDepartment?: string;
  userId?: string;
}): Promise<void> {
  await ensureBrandLoaded();
  const template = adminNewRegistrationTemplate({
    userName: data.userName,
    userEmail: data.userEmail,
    userPhone: data.userPhone,
    accountType: data.accountType,
    companyName: data.companyName,
    governmentDepartment: data.governmentDepartment,
    registeredAt: new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
  });

  await sendToAllStaff(template.subject, template.html, 'ADMIN_NEW_REGISTRATION');

  // Create in-app notifications for all staff users
  try {
    const staff = await getStaffEmails();
    await Promise.allSettled(
      staff.map((member) =>
        db.notification.create({
          data: {
            userId: member.id,
            type: 'SYSTEM',
            title: `New Registration: ${data.userName}`,
            message: `${data.userEmail} registered as ${data.accountType}${data.companyName ? ` (${data.companyName})` : ''}`,
            data: JSON.stringify({ url: '/admin/customers/approvals', accountType: data.accountType }),
          },
        })
      )
    );
  } catch (error) {
    console.error('[NOTIFICATION] Failed to create in-app notifications for new registration:', error);
  }
}

/**
 * Send Customer Notification: Account Approved/Rejected
 */
export async function sendAccountApprovalNotification(data: {
  email: string;
  userName: string;
  accountType: string;
  status: 'APPROVED' | 'REJECTED';
  userId?: string;
}): Promise<boolean> {
  await ensureBrandLoaded();
  const template = accountApprovalTemplate({
    userName: data.userName,
    accountType: data.accountType,
    status: data.status,
  });

  const sent = await sendEmail(data.email, template.subject, template.html);
  if (sent) {
    await logEmail({
      to: data.email,
      subject: template.subject,
      type: `ACCOUNT_${data.status}`,
      userId: data.userId,
    });
  }
  return sent;
}

/**
 * Send Admin Notification: Order Status Change (Cancel, Refund, etc.)
 */
export async function sendAdminOrderStatusChangeNotification(data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  notes?: string;
  orderId?: string;
}): Promise<void> {
  await ensureBrandLoaded();
  const template = adminOrderStatusChangeTemplate({
    orderNumber: data.orderNumber,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    oldStatus: data.oldStatus,
    newStatus: data.newStatus,
    changedBy: data.changedBy,
    notes: data.notes,
  });

  await sendToAllStaff(template.subject, template.html, `ADMIN_ORDER_${data.newStatus}`, { orderId: data.orderId });
}

/**
 * Send Admin Notification: Quote Request
 */
export async function sendAdminQuoteRequestNotification(data: {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  products: string;
  quantity: string;
  timeline?: string;
  message?: string;
}): Promise<void> {
  await ensureBrandLoaded();
  const template = adminQuoteRequestTemplate({
    companyName: data.companyName,
    contactName: data.contactName,
    email: data.email,
    phone: data.phone,
    products: data.products,
    quantity: data.quantity,
    timeline: data.timeline,
    message: data.message,
  });

  await sendToAllStaff(template.subject, template.html, 'ADMIN_QUOTE_REQUEST');
}
