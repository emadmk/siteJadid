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
} from './email-templates';

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
    const from = process.env.EMAIL_FROM || `ADA Supplies <${user}>`;

    if (!host || !user || !pass) {
      console.warn('[EMAIL] SMTP not configured - email not sent to:', to);
      return false;
    }

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log(`[EMAIL] Sent "${subject}" to ${to}`);
    return true;
  } catch (error) {
    console.error('[EMAIL] Failed to send email:', error);
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
    const { db } = require('./db');
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
