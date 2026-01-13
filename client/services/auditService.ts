import api from '../lib/api';

export interface AuditLog {
  id: string;
  userId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  description: string;
  timestamp: string;
  user: {
    userName: string;
    email: string;
  };
}

/**
 * Get audit history for a specific entity
 * @param entityType - Type of entity (e.g., 'Sale', 'Customer')
 * @param entityId - ID of the entity
 * @returns Promise<AuditLog[]>
 */
export const getEntityAuditHistory = async (
  entityType: string,
  entityId: string
): Promise<AuditLog[]> => {
  const res = await api.get(`/audit/entity/${entityType}/${entityId}`);
  return res.data;
};

/**
 * Get all audit logs with optional filters
 */
export const getAuditLogs = async (filters?: {
  userId?: string;
  actionType?: string;
  entityType?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.userId) params.append('userId', filters.userId);
  if (filters?.actionType) params.append('actionType', filters.actionType);
  if (filters?.entityType) params.append('entityType', filters.entityType);
  if (filters?.from) params.append('from', filters.from);
  if (filters?.to) params.append('to', filters.to);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());

  const res = await api.get(`/audit?${params}`);
  return res.data;
};

/**
 * Get audit statistics
 */
export const getAuditStats = async (filters?: {
  from?: string;
  to?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.from) params.append('from', filters.from);
  if (filters?.to) params.append('to', filters.to);

  const res = await api.get(`/audit/stats?${params}`);
  return res.data;
};
