import { Alert, AlertLevel } from '../types';
import { format } from 'date-fns';

interface AlertsListProps {
  alerts: Alert[];
}

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

export default function AlertsList({ alerts }: AlertsListProps) {
  if (alerts.length === 0) {
    return (
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
          Active Alerts
        </h2>
        <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>
          No active alerts
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
          Active Alerts
        </h2>
        <span
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: '600',
            background: '#ef4444',
            color: 'white',
          }}
        >
          {alerts.filter(a => !a.is_read).length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {alerts.slice(0, 5).map((alert) => (
          <div
            key={alert.id}
            style={{
              padding: '1rem',
              borderRadius: '6px',
              border: `2px solid ${levelColors[alert.level]}`,
              background: alert.is_read ? '#f8fafc' : 'white',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
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
                </div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  {alert.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {alert.message}
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                {format(new Date(alert.created_at), 'HH:mm')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {alerts.length > 5 && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              color: '#2563eb',
              fontWeight: '500',
            }}
          >
            View all {alerts.length} alerts
          </button>
        </div>
      )}
    </div>
  );
}
