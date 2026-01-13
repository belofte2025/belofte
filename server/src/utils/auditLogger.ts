import prisma from './prisma';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  EXPORT = 'EXPORT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  IMPORT = 'IMPORT',
}

export enum EntityType {
  CUSTOMER = 'Customer',
  SUPPLIER = 'Supplier',
  ITEM = 'Item',
  CONTAINER = 'Container',
  SALE = 'Sale',
  PAYMENT = 'Payment',
  DEBT = 'Debt',
  USER = 'User',
  ROLE = 'Role',
  COMPANY = 'Company',
}

interface AuditLogData {
  userId: string;
  actionType: AuditAction;
  entityType: EntityType;
  entityId: string;
  description: string;
  metadata?: Record<string, any>;
}

/**
 * Log an audit event
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        actionType: data.actionType,
        entityType: data.entityType,
        entityId: data.entityId,
        description: data.description,
      },
    });
  } catch (error) {
    // Don't throw errors for audit logging failures
    // Just log to console to avoid breaking business operations
    console.error('Audit logging failed:', error);
  }
}

/**
 * Helper functions for common audit scenarios
 */

export async function logCreate(
  userId: string,
  entityType: EntityType,
  entityId: string,
  entityName: string
): Promise<void> {
  await logAudit({
    userId,
    actionType: AuditAction.CREATE,
    entityType,
    entityId,
    description: `Created ${entityType}: ${entityName}`,
  });
}

export async function logUpdate(
  userId: string,
  entityType: EntityType,
  entityId: string,
  entityName: string,
  changes?: string
): Promise<void> {
  const description = changes
    ? `Updated ${entityType}: ${entityName} - Changes: ${changes}`
    : `Updated ${entityType}: ${entityName}`;

  await logAudit({
    userId,
    actionType: AuditAction.UPDATE,
    entityType,
    entityId,
    description,
  });
}

export async function logDelete(
  userId: string,
  entityType: EntityType,
  entityId: string,
  entityName: string
): Promise<void> {
  await logAudit({
    userId,
    actionType: AuditAction.DELETE,
    entityType,
    entityId,
    description: `Deleted ${entityType}: ${entityName}`,
  });
}

export async function logLogin(userId: string, email: string): Promise<void> {
  await logAudit({
    userId,
    actionType: AuditAction.LOGIN,
    entityType: EntityType.USER,
    entityId: userId,
    description: `User logged in: ${email}`,
  });
}

export async function logLogout(userId: string, email: string): Promise<void> {
  await logAudit({
    userId,
    actionType: AuditAction.LOGOUT,
    entityType: EntityType.USER,
    entityId: userId,
    description: `User logged out: ${email}`,
  });
}

export async function logExport(
  userId: string,
  reportType: string,
  filters?: string
): Promise<void> {
  const description = filters
    ? `Exported ${reportType} report - Filters: ${filters}`
    : `Exported ${reportType} report`;

  await logAudit({
    userId,
    actionType: AuditAction.EXPORT,
    entityType: EntityType.COMPANY,
    entityId: 'N/A',
    description,
  });
}

export async function logImport(
  userId: string,
  entityType: EntityType,
  count: number
): Promise<void> {
  await logAudit({
    userId,
    actionType: AuditAction.IMPORT,
    entityType,
    entityId: 'N/A',
    description: `Imported ${count} ${entityType} records`,
  });
}
