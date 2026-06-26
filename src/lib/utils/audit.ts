import { authenticatedApi } from '@/lib/actions/auth.server';
import { API_ENDPOINTS } from '@/lib/config/config';
import { nowIso } from '@/lib/utils/date-time';

export interface AuditLogData {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  result: 'SUCCESS' | 'FAILURE' | 'PENDING';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export interface AuditLogResponse {
  success: boolean;
  logId?: string;
  error?: string;
}

type BackendAuditLog = {
  id: string;
  type: string;
  level: string;
  message: string;
  context: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

function toAuditCsvCell(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export async function auditLog(data: AuditLogData): Promise<AuditLogResponse> {
  try {
    const auditEntry = {
      ...data,
      timestamp: data.timestamp || nowIso(),
      logId: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
    };

    if (process.env.NODE_ENV === 'development') {
      console.debug('[AUDIT]', auditEntry);
    }

    await authenticatedApi(API_ENDPOINTS.LOGGING.AUDIT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(auditEntry),
    });

    return {
      success: true,
      logId: auditEntry.logId,
    };
  } catch (error) {
    console.error('Failed to log audit entry:', error);
    return {
      success: false,
      error: 'Failed to log audit entry',
    };
  }
}

export async function getAuditLogs(
  _userId: string,
  _filters?: {
    startDate?: string;
    endDate?: string;
    action?: string;
    resource?: string;
    riskLevel?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ success: boolean; logs?: AuditLogData[]; meta?: any; error?: string }> {
  try {
    const params = new URLSearchParams();
    params.set('type', 'AUDIT');
    if (_filters?.startDate) params.set('startTime', _filters.startDate);
    if (_filters?.endDate) params.set('endTime', _filters.endDate);
    if (_filters?.page) params.set('page', String(_filters.page));
    if (_filters?.limit) params.set('limit', String(_filters.limit));
    const searchTerms = [_filters?.action, _filters?.resource, _filters?.riskLevel]
      .filter((value): value is string => Boolean(value && value.trim()))
      .join(' ');
    if (searchTerms) params.set('search', searchTerms);

    const endpoint = `${API_ENDPOINTS.LOGGING.LOGS}?${params.toString()}`;
    const { data } = await authenticatedApi<{
      logs?: BackendAuditLog[];
      pagination?: { page: number; limit: number; total: number };
    }>(endpoint);

    const logs =
      data?.logs?.map(log => ({
        userId: String(log.metadata?.userId || _userId || ''),
        action: String(log.metadata?.action || log.message || ''),
        resource: String(log.metadata?.resource || log.context || ''),
        resourceId:
          typeof log.metadata?.resourceId === 'string' ? log.metadata.resourceId : undefined,
        result:
          log.metadata?.result === 'SUCCESS' ||
          log.metadata?.result === 'FAILURE' ||
          log.metadata?.result === 'PENDING'
            ? (log.metadata.result as AuditLogData['result'])
            : 'SUCCESS',
        riskLevel:
          log.metadata?.riskLevel === 'LOW' ||
          log.metadata?.riskLevel === 'MEDIUM' ||
          log.metadata?.riskLevel === 'HIGH' ||
          log.metadata?.riskLevel === 'CRITICAL'
            ? (log.metadata.riskLevel as AuditLogData['riskLevel'])
            : 'LOW',
        ipAddress: typeof log.metadata?.ipAddress === 'string' ? log.metadata.ipAddress : undefined,
        userAgent: typeof log.metadata?.userAgent === 'string' ? log.metadata.userAgent : undefined,
        sessionId: typeof log.metadata?.sessionId === 'string' ? log.metadata.sessionId : undefined,
        metadata: log.metadata as Record<string, any> | undefined,
        timestamp: log.timestamp,
      })) || [];

    return {
      success: true,
      logs,
      meta: data?.pagination || { page: 1, limit: logs.length, total: logs.length },
    };
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return {
      success: false,
      error: 'Failed to retrieve audit logs',
    };
  }
}

export async function exportAuditLogs(_filters: {
  startDate: string;
  endDate: string;
  format?: 'csv' | 'json' | 'pdf';
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const result = await getAuditLogs('system', {
      startDate: _filters.startDate,
      endDate: _filters.endDate,
      page: 1,
      limit: 5000,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to export audit logs',
      };
    }

    if (_filters.format === 'csv') {
      const rows = [
        ['timestamp', 'userId', 'action', 'resource', 'result', 'riskLevel', 'resourceId'].map(
          toAuditCsvCell
        ).join(','),
        ...(result.logs || []).map(log =>
          [
            log.timestamp,
            log.userId,
            log.action,
            log.resource,
            log.result,
            log.riskLevel,
            log.resourceId,
          ]
            .map(toAuditCsvCell)
            .join(',')
        ),
      ];

      return {
        success: true,
        data: rows.join('\n'),
      };
    }

    return {
      success: true,
      data: _filters.format === 'json' ? result.logs || [] : result,
    };
  } catch (error) {
    console.error('Failed to export audit logs:', error);
    return {
      success: false,
      error: 'Failed to export audit logs',
    };
  }
}
