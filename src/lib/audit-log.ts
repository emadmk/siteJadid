// Admin audit logging utility
// Logs all state-changing admin operations for accountability

import { db } from './db';

// Must match ActivityAction enum in Prisma schema
type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT';

interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  entity: string; // e.g., 'Order', 'Product', 'User', 'Settings'
  entityId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an admin action for audit trail
 */
export async function logAdminAction(entry: AuditLogEntry): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId || null,
        description: entry.description,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
      },
    });
  } catch (error) {
    // Never let audit logging failure break the main operation
    console.error('Audit log write error:', error);
  }
}

/**
 * Helper: extract IP from request headers
 */
export function getClientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
