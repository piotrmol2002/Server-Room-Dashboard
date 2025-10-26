import { Server, ServerStatus } from '../types';

interface ServerCardProps {
  server: Server;
}

const statusColors = {
  [ServerStatus.ONLINE]: '#10b981',
  [ServerStatus.OFFLINE]: '#6b7280',
  [ServerStatus.MAINTENANCE]: '#f59e0b',
  [ServerStatus.ERROR]: '#ef4444',
};

const statusLabels = {
  [ServerStatus.ONLINE]: 'Online',
  [ServerStatus.OFFLINE]: 'Offline',
  [ServerStatus.MAINTENANCE]: 'Maintenance',
  [ServerStatus.ERROR]: 'Error',
};

export default function ServerCard({ server }: ServerCardProps) {
  const statusColor = statusColors[server.status];
  const statusLabel = statusLabels[server.status];

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: `2px solid ${statusColor}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
            {server.name}
          </h3>
          {server.ip_address && (
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              {server.ip_address}
            </p>
          )}
        </div>
        <span
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '600',
            background: statusColor,
            color: 'white',
          }}
        >
          {statusLabel}
        </span>
      </div>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>CPU</span>
            <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
              {server.cpu_usage.toFixed(1)}%
            </span>
          </div>
          <div style={{ background: '#e5e7eb', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
            <div
              style={{
                background: server.cpu_usage > 80 ? '#ef4444' : server.cpu_usage > 60 ? '#f59e0b' : '#10b981',
                height: '100%',
                width: `${Math.min(server.cpu_usage, 100)}%`,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>RAM</span>
            <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
              {server.ram_usage.toFixed(1)}%
            </span>
          </div>
          <div style={{ background: '#e5e7eb', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
            <div
              style={{
                background: server.ram_usage > 80 ? '#ef4444' : server.ram_usage > 60 ? '#f59e0b' : '#10b981',
                height: '100%',
                width: `${Math.min(server.ram_usage, 100)}%`,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Temperature</p>
            <p style={{ fontSize: '1.25rem', fontWeight: '700', color: server.temperature > 70 ? '#ef4444' : '#0f172a' }}>
              {server.temperature.toFixed(1)}°C
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Uptime</p>
            <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>
              {Math.floor(server.uptime / 86400)}d
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
