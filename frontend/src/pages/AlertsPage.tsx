import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '../services/api';
import { Alert, AlertLevel } from '../types';
import { formatInTimeZone } from 'date-fns-tz';

const levelColors = {
  [AlertLevel.INFO]: '#3b82f6',
  [AlertLevel.WARNING]: '#f59e0b',
  [AlertLevel.ERROR]: '#ef4444',
  [AlertLevel.CRITICAL]: '#dc2626',
};

const levelLabels = {
  [AlertLevel.INFO]: 'Info',
  [AlertLevel.WARNING]: 'Warning',
  [AlertLevel.ERROR]: 'Error',
  [AlertLevel.CRITICAL]: 'Critical',
};

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [levelFilter, setLevelFilter] = useState<AlertLevel | 'all'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', 'all'],
    queryFn: async () => {
      const response = await alertsApi.getAll(false);
      return response.data;
    },
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => alertsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => alertsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => alertsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const handleMarkRead = async (alert: Alert) => {
    if (!alert.is_read) {
      markReadMutation.mutate(alert.id);
    }
  };

  const handleMarkAllRead = async () => {
    if (confirm('Mark all visible alerts as read?')) {
      markAllReadMutation.mutate();
    }
  };

  const handleDelete = async (alert: Alert) => {
    if (confirm(`Delete alert "${alert.title}"?`)) {
      deleteMutation.mutate(alert.id);
    }
  };

  const filteredAlerts = alerts?.filter((alert) => {
    if (levelFilter !== 'all' && alert.level !== levelFilter) return false;
    if (readFilter === 'unread' && alert.is_read) return false;
    if (readFilter === 'read' && !alert.is_read) return false;
    return true;
  });

  const unreadCount = alerts?.filter(a => !a.is_read).length || 0;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ fontSize: '1.25rem', color: '#64748b' }}>Loading alerts...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Alerts
          </h1>
          <p style={{ color: '#64748b' }}>
            {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#10b981',
              color: 'white',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: markAllReadMutation.isPending ? 'not-allowed' : 'pointer',
              opacity: markAllReadMutation.isPending ? 0.5 : 1,
            }}
          >
            Mark All as Read
          </button>
        )}
      </div>

      <div
        style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as AlertLevel | 'all')}
            style={{
              padding: '0.5rem',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}
          >
            <option value="all">All Levels</option>
            <option value={AlertLevel.INFO}>Info</option>
            <option value={AlertLevel.WARNING}>Warning</option>
            <option value={AlertLevel.ERROR}>Error</option>
            <option value={AlertLevel.CRITICAL}>Critical</option>
          </select>

          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value as 'all' | 'unread' | 'read')}
            style={{
              padding: '0.5rem',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredAlerts?.map((alert) => (
            <div
              key={alert.id}
              style={{
                padding: '1rem',
                borderRadius: '6px',
                border: `2px solid ${levelColors[alert.level]}`,
                background: alert.is_read ? '#f8fafc' : 'white',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span
                      style={{
                        padding: '0.125rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: levelColors[alert.level],
                        color: 'white',
                      }}
                    >
                      {levelLabels[alert.level]}
                    </span>
                    {alert.source && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {alert.source}
                      </span>
                    )}
                    {!alert.is_read && (
                      <span
                        style={{
                          padding: '0.125rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: '#dbeafe',
                          color: '#1e40af',
                        }}
                      >
                        NEW
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {alert.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    {alert.message}
                  </p>
                  {alert.is_read && alert.read_by_email && (
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                      Read by {alert.read_by_email} at {alert.read_at && formatInTimeZone(new Date(alert.read_at), 'Europe/Warsaw', 'yyyy-MM-dd HH:mm')}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {formatInTimeZone(new Date(alert.created_at), 'Europe/Warsaw', 'yyyy-MM-dd HH:mm:ss')}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!alert.is_read && (
                      <button
                        onClick={() => handleMarkRead(alert)}
                        disabled={markReadMutation.isPending}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          background: '#10b981',
                          color: 'white',
                          borderRadius: '4px',
                          fontWeight: '500',
                          cursor: 'pointer',
                        }}
                      >
                        Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(alert)}
                      disabled={deleteMutation.isPending}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        background: '#ef4444',
                        color: 'white',
                        borderRadius: '4px',
                        fontWeight: '500',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAlerts?.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            No alerts found
          </div>
        )}
      </div>
    </div>
  );
}
