// Professional email template system for ADA Supplies
// Beautiful, responsive HTML email templates

import { prisma } from '@/lib/prisma';

const BRAND = {
  name: 'ADA Supplies',
  tagline: 'Safety Done Right!',
  color: '#16a34a', // safety-green-600
  colorDark: '#15803d', // safety-green-700
  colorLight: '#f0fdf4', // green-50
  website: '', // Set from env
  phone: '478-329-8896',
  email: 'info@adasupply.com',
  address: '205 Old Perry Rd. Bonaire, Georgia 31005',
  logoUrl: '/images/imagesite/logo.png',
  gsaContract: 'GS-21F-0086U',
  cageCode: '1J2Y1',
  since: '1999',
};

// Load company info from settings DB and update BRAND defaults
let _brandLoaded = false;
async function ensureBrandLoaded() {
  if (_brandLoaded) return;
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'store.email', 'store.phone',
            'shipping.originStreet', 'shipping.originCity',
            'shipping.originState', 'shipping.originZip',
            'shipping.originPhone',
          ],
        },
      },
    });
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;

    if (map['shipping.originPhone'] || map['store.phone']) {
      BRAND.phone = map['shipping.originPhone'] || map['store.phone'];
    }
    if (map['store.email']) BRAND.email = map['store.email'];

    const parts = [
      map['shipping.originStreet'],
      map['shipping.originCity'],
      map['shipping.originState'],
      map['shipping.originZip'],
    ].filter(Boolean);
    if (parts.length > 0) BRAND.address = parts.join(', ');

    _brandLoaded = true;
  } catch {
    // Use defaults if DB is unavailable
  }
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

function getLogoUrl(): string {
  return `${getBaseUrl()}${BRAND.logoUrl}`;
}

/**
 * Base email layout - wraps all email content with header and footer
 */
function baseLayout(content: string, preheader?: string): string {
  const baseUrl = getBaseUrl();
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${BRAND.name}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    table { border-spacing: 0; border-collapse: collapse; }
    td { padding: 0; }
    img { border: 0; display: block; }
    a { color: ${BRAND.color}; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content { padding: 24px 16px !important; }
      .button { width: 100% !important; }
      .mobile-hide { display: none !important; }
      .mobile-full { width: 100% !important; display: block !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
  ${preheader ? `<div style="display:none;font-size:1px;color:#f3f4f6;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND.color} 0%, ${BRAND.colorDark} 100%); border-radius: 12px 12px 0 0; padding: 28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${baseUrl}" style="display: inline-block;">
                      <img src="${getLogoUrl()}" alt="${BRAND.name}" width="48" height="48" style="width: 48px; height: 48px; border-radius: 8px; background: white; padding: 4px;">
                    </a>
                  </td>
                  <td style="padding-left: 16px; vertical-align: middle;">
                    <a href="${baseUrl}" style="color: white; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; text-decoration: none;">${BRAND.name}</a>
                    <div style="color: rgba(255,255,255,0.85); font-size: 13px; font-style: italic; margin-top: 2px;">${BRAND.tagline}</div>
                  </td>
                  <td class="mobile-hide" style="text-align: right; vertical-align: middle;">
                    <span style="color: rgba(255,255,255,0.7); font-size: 11px;">Serving Since ${BRAND.since}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content" style="background-color: #ffffff; padding: 40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; border-radius: 0 0 12px 12px; padding: 32px;">
              <!-- Company Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 20px; border-bottom: 1px solid #374151;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td class="mobile-full" style="width: 50%; vertical-align: top;">
                          <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
                            <strong style="color: #e5e7eb;">${BRAND.name}</strong><br>
                            ${BRAND.address}<br>
                            <a href="tel:${BRAND.phone}" style="color: #9ca3af;">${BRAND.phone}</a><br>
                            <a href="mailto:${BRAND.email}" style="color: ${BRAND.color};">${BRAND.email}</a>
                          </p>
                        </td>
                        <td class="mobile-full mobile-hide" style="width: 50%; vertical-align: top; text-align: right;">
                          <p style="color: #9ca3af; font-size: 11px; line-height: 1.6; margin: 0;">
                            GSA Contract: ${BRAND.gsaContract}<br>
                            CAGE Code: ${BRAND.cageCode}<br>
                            SBA WOSB Certified
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="color: #6b7280; font-size: 11px; line-height: 1.5; margin: 0;">
                            &copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.<br>
                            <a href="${baseUrl}/privacy" style="color: #6b7280; text-decoration: underline;">Privacy Policy</a> &bull;
                            <a href="${baseUrl}/terms" style="color: #6b7280; text-decoration: underline;">Terms of Service</a> &bull;
                            <a href="${baseUrl}/contact" style="color: #6b7280; text-decoration: underline;">Contact Us</a>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Reusable button component
 */
function button(text: string, url: string, color?: string): string {
  const bgColor = color || BRAND.color;
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
      <tr>
        <td style="border-radius: 8px; background-color: ${bgColor};">
          <a href="${url}" class="button" target="_blank" style="display: inline-block; padding: 14px 36px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; letter-spacing: 0.3px;">${text}</a>
        </td>
      </tr>
    </table>`;
}

/**
 * Divider line
 */
function divider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;"><tr><td style="border-top: 1px solid #e5e7eb;"></td></tr></table>`;
}

/**
 * Info box (highlighted section)
 */
function infoBox(content: string, bgColor?: string): string {
  const bg = bgColor || '#f0fdf4';
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
      <tr>
        <td style="background-color: ${bg}; border-radius: 8px; padding: 20px; border-left: 4px solid ${BRAND.color};">
          ${content}
        </td>
      </tr>
    </table>`;
}

// ═══════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════

/**
 * Welcome Email - Sent after registration
 */
export function welcomeEmail(data: {
  userName: string;
  accountType: string;
  verifyUrl?: string;
}): { subject: string; html: string } {
  const baseUrl = getBaseUrl();
  const accountLabel = data.accountType === 'GOVERNMENT' ? 'Government'
    : data.accountType === 'VOLUME_BUYER' ? 'Volume Buyer'
    : 'Personal';

  const content = `
    <h1 style="color: #111827; font-size: 26px; font-weight: 700; margin: 0 0 8px 0;">Welcome to ${BRAND.name}!</h1>
    <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">Your safety equipment partner</p>

    <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 16px 0;">
      Hi <strong>${data.userName}</strong>,
    </p>
    <p style="color: #374151; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">
      Thank you for creating your <strong>${accountLabel}</strong> account with ${BRAND.name}. We've been providing quality safety equipment since ${BRAND.since}, and we're excited to have you on board!
    </p>

    ${data.verifyUrl ? `
    ${infoBox(`
      <p style="color: #166534; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">📧 Verify Your Email</p>
      <p style="color: #374151; font-size: 14px; line-height: 1.5; margin: 0;">Please verify your email address to unlock all features and start shopping.</p>
    `)}
    <div style="text-align: center; margin: 28px 0;">
      ${button('Verify My Email', data.verifyUrl)}
    </div>
    ` : ''}

    <h2 style="color: #111827; font-size: 18px; font-weight: 600; margin: 28px 0 16px 0;">What You Can Do Now:</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width: 36px; vertical-align: top;">
                <div style="width: 28px; height: 28px; background-color: ${BRAND.colorLight}; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px;">🛒</div>
              </td>
              <td style="padding-left: 12px;">
                <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0;">Browse Our Catalog</p>
                <p style="color: #6b7280; font-size: 13px; margin: 2px 0 0 0;">Explore thousands of safety products from top brands</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width: 36px; vertical-align: top;">
                <div style="width: 28px; height: 28px; background-color: ${BRAND.colorLight}; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px;">⚡</div>
              </td>
              <td style="padding-left: 12px;">
                <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0;">Quick Order</p>
                <p style="color: #6b7280; font-size: 13px; margin: 2px 0 0 0;">Know your SKU? Use Quick Order for faster checkout</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width: 36px; vertical-align: top;">
                <div style="width: 28px; height: 28px; background-color: ${BRAND.colorLight}; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px;">🏆</div>
              </td>
              <td style="padding-left: 12px;">
                <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0;">Earn Rewards</p>
                <p style="color: #6b7280; font-size: 13px; margin: 2px 0 0 0;">Earn points on every purchase with our loyalty program</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin: 32px 0 0 0;">
      ${button('Start Shopping', `${baseUrl}/products`)}
    </div>

    ${data.accountType !== 'PERSONAL' ? `
    ${divider()}
    ${infoBox(`
      <p style="color: #92400e; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">⏳ Account Approval Required</p>
      <p style="color: #374151; font-size: 13px; line-height: 1.5; margin: 0;">Your ${accountLabel} account requires verification. Our team will review your application and notify you within 1-2 business days.</p>
    `, '#fef3c7')}
    ` : ''}
  `;

  return {
    subject: `Welcome to ${BRAND.name} – ${BRAND.tagline}`,
    html: baseLayout(content, `Welcome to ${BRAND.name}! Your account has been created successfully.`),
  };
}

/**
 * Email Verification
 */
export function emailVerificationTemplate(data: {
  userName?: string;
  verifyUrl: string;
}): { subject: string; html: string } {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: ${BRAND.colorLight}; border-radius: 50%; line-height: 64px; font-size: 28px;">📧</div>
    </div>
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; text-align: center;">Verify Your Email Address</h1>
    <p style="color: #6b7280; font-size: 15px; text-align: center; margin: 0 0 28px 0;">Just one more step to get started</p>

    <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
      Hi${data.userName ? ` <strong>${data.userName}</strong>` : ''},
    </p>
    <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">
      Thank you for signing up with ${BRAND.name}. Please verify your email address by clicking the button below:
    </p>

    <div style="text-align: center; margin: 32px 0;">
      ${button('Verify Email Address', data.verifyUrl)}
    </div>

    <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0 0 24px 0;">
      This link will expire in 24 hours
    </p>

    ${divider()}

    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
      If the button doesn't work, copy and paste this URL into your browser:<br>
      <a href="${data.verifyUrl}" style="color: ${BRAND.color}; word-break: break-all; font-size: 11px;">${data.verifyUrl}</a>
    </p>
    <p style="color: #9ca3af; font-size: 12px; margin: 12px 0 0 0;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  `;

  return {
    subject: `Verify your email – ${BRAND.name}`,
    html: baseLayout(content, `Please verify your email to complete your ${BRAND.name} registration.`),
  };
}

/**
 * Password Reset Email
 */
export function passwordResetTemplate(data: {
  userName?: string;
  resetUrl: string;
}): { subject: string; html: string } {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #fef2f2; border-radius: 50%; line-height: 64px; font-size: 28px;">🔐</div>
    </div>
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; text-align: center;">Reset Your Password</h1>
    <p style="color: #6b7280; font-size: 15px; text-align: center; margin: 0 0 28px 0;">No worries, we'll help you get back in</p>

    <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
      Hi${data.userName ? ` <strong>${data.userName}</strong>` : ''},
    </p>
    <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">
      We received a request to reset your password for your ${BRAND.name} account. Click the button below to set a new password:
    </p>

    <div style="text-align: center; margin: 32px 0;">
      ${button('Reset Password', data.resetUrl, '#dc2626')}
    </div>

    <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0 0 24px 0;">
      This link will expire in 1 hour
    </p>

    ${infoBox(`
      <p style="color: #92400e; font-size: 13px; line-height: 1.5; margin: 0;">
        <strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged. If you're concerned about your account security, please <a href="${getBaseUrl()}/contact" style="color: #92400e; text-decoration: underline;">contact us</a>.
      </p>
    `, '#fef3c7')}

    ${divider()}

    <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0;">
      If the button doesn't work, copy and paste this URL:<br>
      <a href="${data.resetUrl}" style="color: ${BRAND.color}; word-break: break-all; font-size: 11px;">${data.resetUrl}</a>
    </p>
  `;

  return {
    subject: `Reset your password – ${BRAND.name}`,
    html: baseLayout(content, `Reset your ${BRAND.name} password. This link expires in 1 hour.`),
  };
}

/**
 * Order Confirmation Email
 */
export function orderConfirmationTemplate(data: {
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
  estimatedDelivery?: string;
}): { subject: string; html: string } {
  const baseUrl = getBaseUrl();
  const fmt = (n: number) => `$${n.toFixed(2)}`;

  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 60px; vertical-align: top;">
              <div style="width: 56px; height: 56px; background-color: #f3f4f6; border-radius: 8px; overflow: hidden;">
                ${item.image ? `<img src="${item.image}" alt="" width="56" height="56" style="width: 56px; height: 56px; object-fit: cover;">` : '<div style="width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 24px;">📦</div>'}
              </div>
            </td>
            <td style="padding-left: 12px; vertical-align: top;">
              <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0 0 2px 0;">${item.name}</p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">SKU: ${item.sku}</p>
            </td>
            <td style="text-align: right; vertical-align: top; white-space: nowrap;">
              <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0;">${fmt(item.price * item.quantity)}</p>
              <p style="color: #9ca3af; font-size: 12px; margin: 2px 0 0 0;">Qty: ${item.quantity} × ${fmt(item.price)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: ${BRAND.colorLight}; border-radius: 50%; line-height: 64px; font-size: 28px;">✅</div>
    </div>
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">Order Confirmed!</h1>
    <p style="color: #6b7280; font-size: 15px; text-align: center; margin: 0 0 28px 0;">Thank you for your purchase, ${data.userName}</p>

    ${infoBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="color: #166534; font-size: 13px; margin: 0;"><strong>Order Number</strong></p>
            <p style="color: #111827; font-size: 18px; font-weight: 700; margin: 4px 0 0 0; letter-spacing: 0.5px;">${data.orderNumber}</p>
          </td>
          <td style="text-align: right;">
            <a href="${baseUrl}/account/orders" style="display: inline-block; padding: 8px 16px; background-color: ${BRAND.color}; color: white; font-size: 13px; font-weight: 600; border-radius: 6px; text-decoration: none;">Track Order</a>
          </td>
        </tr>
      </table>
    `)}

    <!-- Order Items -->
    <h2 style="color: #111827; font-size: 16px; font-weight: 600; margin: 28px 0 12px 0;">Items Ordered</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itemRows}
    </table>

    <!-- Order Summary -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
      <tr>
        <td style="padding: 6px 0;"><span style="color: #6b7280; font-size: 14px;">Subtotal</span></td>
        <td style="padding: 6px 0; text-align: right;"><span style="color: #374151; font-size: 14px;">${fmt(data.subtotal)}</span></td>
      </tr>
      ${data.discount > 0 ? `
      <tr>
        <td style="padding: 6px 0;"><span style="color: #059669; font-size: 14px;">Discount</span></td>
        <td style="padding: 6px 0; text-align: right;"><span style="color: #059669; font-size: 14px;">-${fmt(data.discount)}</span></td>
      </tr>` : ''}
      <tr>
        <td style="padding: 6px 0;"><span style="color: #6b7280; font-size: 14px;">Shipping</span></td>
        <td style="padding: 6px 0; text-align: right;"><span style="color: #374151; font-size: 14px;">${data.shipping === 0 ? '<span style="color: #059669;">FREE</span>' : fmt(data.shipping)}</span></td>
      </tr>
      <tr>
        <td style="padding: 6px 0;"><span style="color: #6b7280; font-size: 14px;">Tax</span></td>
        <td style="padding: 6px 0; text-align: right;"><span style="color: #374151; font-size: 14px;">${fmt(data.tax)}</span></td>
      </tr>
      <tr>
        <td style="padding: 12px 0; border-top: 2px solid #111827;"><span style="color: #111827; font-size: 16px; font-weight: 700;">Total</span></td>
        <td style="padding: 12px 0; border-top: 2px solid #111827; text-align: right;"><span style="color: #111827; font-size: 18px; font-weight: 700;">${fmt(data.total)}</span></td>
      </tr>
    </table>

    ${divider()}

    <!-- Shipping & Payment -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td class="mobile-full" style="width: 50%; vertical-align: top; padding-right: 16px;">
          <h3 style="color: #111827; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">📍 Shipping Address</h3>
          <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0;">
            ${data.shippingAddress.name ? `${data.shippingAddress.name}<br>` : ''}
            ${data.shippingAddress.street}<br>
            ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}
          </p>
        </td>
        <td class="mobile-full" style="width: 50%; vertical-align: top;">
          <h3 style="color: #111827; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">💳 Payment Method</h3>
          <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0;">${data.paymentMethod}</p>
          ${data.estimatedDelivery ? `
          <h3 style="color: #111827; font-size: 14px; font-weight: 600; margin: 16px 0 8px 0;">📅 Estimated Delivery</h3>
          <p style="color: #6b7280; font-size: 13px; margin: 0;">${data.estimatedDelivery}</p>
          ` : ''}
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin: 32px 0 0 0;">
      ${button('View My Orders', `${baseUrl}/account/orders`)}
    </div>
  `;

  return {
    subject: `Order Confirmed #${data.orderNumber} – ${BRAND.name}`,
    html: baseLayout(content, `Your order #${data.orderNumber} has been confirmed. Total: ${fmt(data.total)}`),
  };
}

/**
 * Order Status Update Email
 */
export function orderStatusTemplate(data: {
  userName: string;
  orderNumber: string;
  status: string;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
}): { subject: string; html: string } {
  const baseUrl = getBaseUrl();

  const statusConfig: Record<string, { icon: string; color: string; bgColor: string; title: string; message: string }> = {
    CONFIRMED: {
      icon: '✅',
      color: '#059669',
      bgColor: '#ecfdf5',
      title: 'Order Confirmed',
      message: 'Your order has been confirmed and is being prepared.',
    },
    PROCESSING: {
      icon: '⚙️',
      color: '#2563eb',
      bgColor: '#eff6ff',
      title: 'Order Being Processed',
      message: 'Your order is being picked and packed in our warehouse.',
    },
    SHIPPED: {
      icon: '🚚',
      color: '#7c3aed',
      bgColor: '#f5f3ff',
      title: 'Order Shipped!',
      message: 'Great news! Your order is on its way.',
    },
    DELIVERED: {
      icon: '📬',
      color: '#059669',
      bgColor: '#ecfdf5',
      title: 'Order Delivered',
      message: 'Your order has been delivered successfully!',
    },
    CANCELLED: {
      icon: '❌',
      color: '#dc2626',
      bgColor: '#fef2f2',
      title: 'Order Cancelled',
      message: 'Your order has been cancelled.',
    },
    REFUNDED: {
      icon: '💰',
      color: '#ea580c',
      bgColor: '#fff7ed',
      title: 'Refund Processed',
      message: 'Your refund has been processed.',
    },
  };

  const config = statusConfig[data.status] || {
    icon: '📋',
    color: '#6b7280',
    bgColor: '#f9fafb',
    title: `Order Status: ${data.status}`,
    message: `Your order status has been updated to ${data.status}.`,
  };

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: ${config.bgColor}; border-radius: 50%; line-height: 64px; font-size: 28px;">${config.icon}</div>
    </div>
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">${config.title}</h1>
    <p style="color: #6b7280; font-size: 15px; text-align: center; margin: 0 0 28px 0;">Order #${data.orderNumber}</p>

    <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
      Hi <strong>${data.userName}</strong>,
    </p>
    <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
      ${config.message}
    </p>

    ${data.trackingNumber ? `
    ${infoBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="color: #166534; font-size: 13px; font-weight: 600; margin: 0 0 4px 0;">📦 Tracking Information</p>
            <p style="color: #111827; font-size: 15px; font-weight: 700; margin: 0; letter-spacing: 1px;">${data.trackingNumber}</p>
            ${data.carrier ? `<p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">Carrier: ${data.carrier}</p>` : ''}
          </td>
        </tr>
      </table>
    `)}
    ` : ''}

    ${data.notes ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
      <tr>
        <td style="background-color: #f9fafb; border-radius: 8px; padding: 16px;">
          <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0;">Notes</p>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">${data.notes}</p>
        </td>
      </tr>
    </table>
    ` : ''}

    <div style="text-align: center; margin: 32px 0 0 0;">
      ${button('View Order Details', `${baseUrl}/account/orders`)}
    </div>

    ${data.status === 'DELIVERED' ? `
    ${divider()}
    <div style="text-align: center;">
      <p style="color: #374151; font-size: 14px; margin: 0 0 12px 0;">How was your experience?</p>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">We'd love to hear your feedback! Leave a review on the products you purchased.</p>
    </div>
    ` : ''}
  `;

  const subjects: Record<string, string> = {
    CONFIRMED: `Order Confirmed #${data.orderNumber}`,
    PROCESSING: `Order Being Processed #${data.orderNumber}`,
    SHIPPED: `Your Order Has Shipped! #${data.orderNumber}`,
    DELIVERED: `Order Delivered #${data.orderNumber}`,
    CANCELLED: `Order Cancelled #${data.orderNumber}`,
    REFUNDED: `Refund Processed #${data.orderNumber}`,
  };

  return {
    subject: `${subjects[data.status] || `Order Update #${data.orderNumber}`} – ${BRAND.name}`,
    html: baseLayout(content, `${config.message} Order #${data.orderNumber}`),
  };
}

/**
 * Payment Received Email
 */
export function paymentReceivedTemplate(data: {
  userName: string;
  orderNumber: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
}): { subject: string; html: string } {
  const baseUrl = getBaseUrl();
  const fmt = (n: number) => `$${n.toFixed(2)}`;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #ecfdf5; border-radius: 50%; line-height: 64px; font-size: 28px;">💳</div>
    </div>
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">Payment Received</h1>
    <p style="color: #6b7280; font-size: 15px; text-align: center; margin: 0 0 28px 0;">Thank you for your payment</p>

    <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
      Hi <strong>${data.userName}</strong>, we have successfully received your payment.
    </p>

    ${infoBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-bottom: 8px;">
            <span style="color: #6b7280; font-size: 13px;">Order Number</span><br>
            <span style="color: #111827; font-size: 15px; font-weight: 600;">${data.orderNumber}</span>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 8px;">
            <span style="color: #6b7280; font-size: 13px;">Amount Paid</span><br>
            <span style="color: #059669; font-size: 20px; font-weight: 700;">${fmt(data.amount)}</span>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: ${data.transactionId ? '8' : '0'}px;">
            <span style="color: #6b7280; font-size: 13px;">Payment Method</span><br>
            <span style="color: #111827; font-size: 14px;">${data.paymentMethod}</span>
          </td>
        </tr>
        ${data.transactionId ? `
        <tr>
          <td>
            <span style="color: #6b7280; font-size: 13px;">Transaction ID</span><br>
            <span style="color: #111827; font-size: 13px; font-family: monospace;">${data.transactionId}</span>
          </td>
        </tr>` : ''}
      </table>
    `)}

    <div style="text-align: center; margin: 32px 0 0 0;">
      ${button('View Order', `${baseUrl}/account/orders`)}
    </div>
  `;

  return {
    subject: `Payment Received for Order #${data.orderNumber} – ${BRAND.name}`,
    html: baseLayout(content, `Payment of ${fmt(data.amount)} received for order #${data.orderNumber}.`),
  };
}

/**
 * Contact Form Confirmation Email
 */
export function contactConfirmationTemplate(data: {
  userName: string;
  subject: string;
  message: string;
}): { subject: string; html: string } {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #eff6ff; border-radius: 50%; line-height: 64px; font-size: 28px;">💬</div>
    </div>
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">We've Received Your Message</h1>
    <p style="color: #6b7280; font-size: 15px; text-align: center; margin: 0 0 28px 0;">We'll get back to you within 1-2 business days</p>

    <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
      Hi <strong>${data.userName}</strong>,
    </p>
    <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
      Thank you for contacting ${BRAND.name}. We've received your message and our team will review it shortly.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
      <tr>
        <td style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
          <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;">Subject</p>
          <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">${data.subject}</p>
          <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;">Message</p>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">${data.message}</p>
        </td>
      </tr>
    </table>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.7; margin: 24px 0 0 0;">
      In the meantime, you can reach us directly at <a href="tel:${BRAND.phone}" style="color: ${BRAND.color}; font-weight: 600;">${BRAND.phone}</a> or reply to this email.
    </p>
  `;

  return {
    subject: `We received your message – ${BRAND.name}`,
    html: baseLayout(content, `Thank you for contacting ${BRAND.name}. We'll respond within 1-2 business days.`),
  };
}

// ═══════════════════════════════════════════════
// ADMIN NOTIFICATION TEMPLATES
// ═══════════════════════════════════════════════

/**
 * Admin Notification: New Order Placed
 */
export function adminNewOrderTemplate(data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  accountType: string;
  total: number;
  itemCount: number;
  paymentMethod: string;
}): { subject: string; html: string } {
  const baseUrl = getBaseUrl();
  const fmt = (n: number) => `$${n.toFixed(2)}`;
  const accountLabel = data.accountType === 'GOVERNMENT' ? 'Government'
    : data.accountType === 'VOLUME_BUYER' ? 'Volume Buyer'
    : data.accountType === 'GSA' ? 'GSA'
    : data.accountType === 'B2B' ? 'B2B'
    : 'Personal';

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #eff6ff; border-radius: 50%; line-height: 64px; font-size: 28px;">🛒</div>
    </div>
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">New Order Received</h1>
    <p style="color: #6b7280; font-size: 15px; text-align: center; margin: 0 0 28px 0;">A new order has been placed on ${BRAND.name}</p>

    ${infoBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-bottom: 12px;">
            <span style="color: #6b7280; font-size: 13px;">Order Number</span><br>
            <span style="color: #111827; font-size: 18px; font-weight: 700; letter-spacing: 0.5px;">${data.orderNumber}</span>
          </td>
          <td style="text-align: right; padding-bottom: 12px;">
            <span style="color: #6b7280; font-size: 13px;">Total</span><br>
            <span style="color: #059669; font-size: 20px; font-weight: 700;">${fmt(data.total)}</span>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width: 50%;">
                  <span style="color: #6b7280; font-size: 12px;">Customer</span><br>
                  <span style="color: #111827; font-size: 14px; font-weight: 600;">${data.customerName}</span><br>
                  <a href="mailto:${data.customerEmail}" style="color: ${BRAND.color}; font-size: 13px;">${data.customerEmail}</a>
                </td>
                <td style="width: 50%;">
                  <span style="color: #6b7280; font-size: 12px;">Account Type</span><br>
                  <span style="color: #111827; font-size: 14px; font-weight: 600;">${accountLabel}</span><br>
                  <span style="color: #6b7280; font-size: 13px;">${data.itemCount} item${data.itemCount > 1 ? 's' : ''} &bull; ${data.paymentMethod}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `)}

    <div style="text-align: center; margin: 28px 0 0 0;">
      ${button('View Order in Admin', `${baseUrl}/admin/orders`)}
    </div>
  `;

  return {
    subject: `[New Order] #${data.orderNumber} – ${fmt(data.total)} from ${data.customerName}`,
    html: baseLayout(content, `New order #${data.orderNumber} – ${fmt(data.total)} from ${data.customerName}`),
  };
}

/**
 * Admin Notification: Contact Form Submission
 */
export function adminContactFormTemplate(data: {
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  subject: string;
  message: string;
  accountType?: string;
}): { subject: string; html: string } {
  const baseUrl = getBaseUrl();

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #fef3c7; border-radius: 50%; line-height: 64px; font-size: 28px;">💬</div>
    </div>
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">New Contact Form Message</h1>
    <p style="color: #6b7280; font-size: 15px; text-align: center; margin: 0 0 28px 0;">A customer has submitted a message through the contact form</p>

    ${infoBox(`
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="color: #166534; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Contact Information</p>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding: 4px 0;"><span style="color: #6b7280; font-size: 13px; width: 80px; display: inline-block;">Name:</span> <strong style="color: #111827; font-size: 14px;">${data.senderName}</strong></td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><span style="color: #6b7280; font-size: 13px; width: 80px; display: inline-block;">Email:</span> <a href="mailto:${data.senderEmail}" style="color: ${BRAND.color}; font-size: 14px;">${data.senderEmail}</a></td>
              </tr>
              ${data.senderPhone ? `<tr><td style="padding: 4px 0;"><span style="color: #6b7280; font-size: 13px; width: 80px; display: inline-block;">Phone:</span> <a href="tel:${data.senderPhone}" style="color: ${BRAND.color}; font-size: 14px;">${data.senderPhone}</a></td></tr>` : ''}
              ${data.accountType ? `<tr><td style="padding: 4px 0;"><span style="color: #6b7280; font-size: 13px; width: 80px; display: inline-block;">Account:</span> <span style="color: #111827; font-size: 14px;">${data.accountType}</span></td></tr>` : ''}
            </table>
          </td>
        </tr>
      </table>
    `)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
      <tr>
        <td style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
          <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;">Subject</p>
          <p style="color: #111827; font-size: 15px; font-weight: 600; margin: 0 0 16px 0;">${data.subject}</p>
          <p style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;">Message</p>
          <p style="color: #374151; font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${data.message}</p>
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin: 28px 0 0 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td style="padding-right: 8px;">${button('Reply via Email', `mailto:${data.senderEmail}?subject=Re: ${encodeURIComponent(data.subject)}`)}</td>
          ${data.senderPhone ? `<td style="padding-left: 8px;">${button('Call Customer', `tel:${data.senderPhone}`, '#2563eb')}</td>` : ''}
        </tr>
      </table>
    </div>
  `;

  return {
    subject: `[Contact Form] ${data.subject} – from ${data.senderName}`,
    html: baseLayout(content, `New contact form message from ${data.senderName}: ${data.subject}`),
  };
}

/**
 * Admin Notification: New Registration Requiring Approval (Government/Volume Buyer)
 */
export function adminNewRegistrationTemplate(data: {
  userName: string;
  userEmail: string;
  userPhone?: string;
  accountType: string;
  companyName?: string;
  governmentDepartment?: string;
  registeredAt: string;
}): { subject: string; html: string } {
  const baseUrl = getBaseUrl();
  const accountLabel = data.accountType === 'GOVERNMENT' ? 'Government'
    : data.accountType === 'VOLUME_BUYER' ? 'Volume Buyer'
    : data.accountType;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #fef3c7; border-radius: 50%; line-height: 64px; font-size: 28px;">🔔</div>
    </div>
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">New ${accountLabel} Registration</h1>
    <p style="color: #6b7280; font-size: 15px; text-align: center; margin: 0 0 28px 0;">A new ${accountLabel.toLowerCase()} account requires your approval</p>

    ${infoBox(`
      <p style="color: #92400e; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">⏳ Approval Required</p>
      <p style="color: #374151; font-size: 13px; line-height: 1.5; margin: 0;">This account is pending approval. Please review the details below and approve or reject the account.</p>
    `, '#fef3c7')}

    <h2 style="color: #111827; font-size: 16px; font-weight: 600; margin: 24px 0 12px 0;">Registration Details</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
          <span style="color: #6b7280; font-size: 13px; display: inline-block; width: 160px;">Full Name</span>
          <strong style="color: #111827; font-size: 14px;">${data.userName}</strong>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
          <span style="color: #6b7280; font-size: 13px; display: inline-block; width: 160px;">Email</span>
          <a href="mailto:${data.userEmail}" style="color: ${BRAND.color}; font-size: 14px;">${data.userEmail}</a>
        </td>
      </tr>
      ${data.userPhone ? `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
          <span style="color: #6b7280; font-size: 13px; display: inline-block; width: 160px;">Phone</span>
          <a href="tel:${data.userPhone}" style="color: ${BRAND.color}; font-size: 14px;">${data.userPhone}</a>
        </td>
      </tr>` : ''}
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
          <span style="color: #6b7280; font-size: 13px; display: inline-block; width: 160px;">Account Type</span>
          <span style="display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 13px; font-weight: 600; background-color: ${data.accountType === 'GOVERNMENT' ? '#dbeafe' : '#fef3c7'}; color: ${data.accountType === 'GOVERNMENT' ? '#1e40af' : '#92400e'};">${accountLabel}</span>
        </td>
      </tr>
      ${data.companyName ? `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
          <span style="color: #6b7280; font-size: 13px; display: inline-block; width: 160px;">Company Name</span>
          <strong style="color: #111827; font-size: 14px;">${data.companyName}</strong>
        </td>
      </tr>` : ''}
      ${data.governmentDepartment ? `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
          <span style="color: #6b7280; font-size: 13px; display: inline-block; width: 160px;">Government Department</span>
          <strong style="color: #111827; font-size: 14px;">${data.governmentDepartment}</strong>
        </td>
      </tr>` : ''}
      <tr>
        <td style="padding: 10px 0;">
          <span style="color: #6b7280; font-size: 13px; display: inline-block; width: 160px;">Registered At</span>
          <span style="color: #111827; font-size: 14px;">${data.registeredAt}</span>
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin: 28px 0 0 0;">
      ${button('Review in Admin Panel', `${baseUrl}/admin/customers`)}
    </div>

    ${divider()}

    <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
      You can contact this customer directly:<br>
      ${data.userPhone ? `<a href="tel:${data.userPhone}" style="color: ${BRAND.color};">${data.userPhone}</a> &bull; ` : ''}
      <a href="mailto:${data.userEmail}" style="color: ${BRAND.color};">${data.userEmail}</a>
    </p>
  `;

  return {
    subject: `[Approval Required] New ${accountLabel} Registration – ${data.userName}`,
    html: baseLayout(content, `New ${accountLabel.toLowerCase()} registration from ${data.userName} requires approval.`),
  };
}

/**
 * Customer Notification: Account Approved/Rejected
 */
export function accountApprovalTemplate(data: {
  userName: string;
  accountType: string;
  status: 'APPROVED' | 'REJECTED';
}): { subject: string; html: string } {
  const baseUrl = getBaseUrl();
  const accountLabel = data.accountType === 'GOVERNMENT' ? 'Government'
    : data.accountType === 'VOLUME_BUYER' ? 'Volume Buyer'
    : data.accountType === 'GSA' ? 'Government'
    : data.accountType;

  const isApproved = data.status === 'APPROVED';

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: ${isApproved ? '#ecfdf5' : '#fef2f2'}; border-radius: 50%; line-height: 64px; font-size: 28px;">${isApproved ? '✅' : '❌'}</div>
    </div>
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; text-align: center;">Account ${isApproved ? 'Approved' : 'Not Approved'}</h1>
    <p style="color: #6b7280; font-size: 15px; text-align: center; margin: 0 0 28px 0;">Your ${accountLabel} account status has been updated</p>

    <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">
      Hi <strong>${data.userName}</strong>,
    </p>

    ${isApproved ? `
    <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
      Great news! Your <strong>${accountLabel}</strong> account has been approved. You now have full access to all ${accountLabel.toLowerCase()} features and pricing.
    </p>

    ${infoBox(`
      <p style="color: #166534; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">🎉 What's Now Available:</p>
      <ul style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
        ${data.accountType === 'GOVERNMENT' || data.accountType === 'GSA' ? `
        <li>GSA contract pricing</li>
        <li>Tax-exempt purchasing</li>
        <li>Purchase order payment</li>
        <li>Government compliance documentation</li>
        ` : `
        <li>Volume discount pricing</li>
        <li>Tax-exempt purchasing</li>
        <li>Net 30 payment terms</li>
        <li>Dedicated account support</li>
        `}
      </ul>
    `)}

    <div style="text-align: center; margin: 32px 0 0 0;">
      ${button('Start Shopping', `${baseUrl}/products`)}
    </div>
    ` : `
    <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
      We're sorry, but your <strong>${accountLabel}</strong> account application has not been approved at this time. You can still use your account as a personal customer.
    </p>

    ${infoBox(`
      <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
        If you believe this is an error or would like to provide additional documentation, please contact our team at <a href="mailto:${BRAND.email}" style="color: #92400e; text-decoration: underline;">${BRAND.email}</a> or call us at <a href="tel:${BRAND.phone}" style="color: #92400e; text-decoration: underline;">${BRAND.phone}</a>.
      </p>
    `, '#fef3c7')}
    `}
  `;

  return {
    subject: isApproved
      ? `Your ${accountLabel} Account is Approved! – ${BRAND.name}`
      : `${accountLabel} Account Update – ${BRAND.name}`,
    html: baseLayout(content, isApproved
      ? `Your ${accountLabel} account has been approved! Start shopping with ${accountLabel.toLowerCase()} pricing.`
      : `Update on your ${accountLabel} account application.`),
  };
}

export {
  baseLayout,
  button,
  divider,
  infoBox,
  getBaseUrl,
  BRAND,
  ensureBrandLoaded,
};
