import { useState } from 'react';
import { useServers } from '../hooks/useServers';
import { useEnvironment } from '../hooks/useEnvironment';
import { useAlerts } from '../hooks/useAlerts';
import ServerCard from '../components/ServerCard';
import EnvironmentPanel from '../components/EnvironmentPanel';
import AlertsList from '../components/AlertsList';
import SimulatorPanel from '../components/SimulatorPanel';
import ServerMetricsChart from '../components/ServerMetricsChart';
import { Server } from '../types';

export default function DashboardPage() {
  const { data: servers, isLoading: serversLoading } = useServers();
  const { data: environment, isLoading: envLoading } = useEnvironment();
  const { data: alerts, isLoading: alertsLoading } = useAlerts(true);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [showChart, setShowChart] = useState(false);

  if (serversLoading || envLoading || alertsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ fontSize: '1.25rem', color: '#64748b' }}>Loading dashboard...</div>
      </div>
    );
  }

  const onlineServers = servers?.filter(s => s.status === 'online').length || 0;
  const totalServers = servers?.length || 0;
  const activeAlerts = alerts?.filter(a => !a.is_read).length || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Server Room Dashboard
        </h1>
        <p style={{ color: '#64748b' }}>
          Real-time monitoring and management
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
            Total Servers
          </h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{totalServers}</p>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
            Online Servers
          </h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>{onlineServers}</p>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
            Active Alerts
          </h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: activeAlerts > 0 ? '#f59e0b' : '#10b981' }}>
            {activeAlerts}
          </p>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
            Room Temperature
          </h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
            {environment?.room_temperature.toFixed(1) || '0'}°C
          </p>
        </div>
      </div>

      {environment && <EnvironmentPanel environment={environment} />}

      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
          Servers
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {servers?.map((server) => (
            <div
              key={server.id}
              style={{ position: 'relative' }}
            >
              <ServerCard server={server} />
              <div style={{
                position: 'absolute',
                bottom: '1rem',
                right: '1rem',
                display: 'flex',
                gap: '0.5rem'
              }}>
                <button
                  onClick={() => {
                    setSelectedServer(server);
                    setShowChart(true);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Charts
                </button>
                <button
                  onClick={() => {
                    setSelectedServer(server);
                    setShowSimulator(true);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#8b5cf6',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Control
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {alerts && alerts.length > 0 && <AlertsList alerts={alerts} />}

      {selectedServer && showSimulator && (
        <SimulatorPanel
          server={selectedServer}
          onClose={() => {
            setShowSimulator(false);
            setSelectedServer(null);
          }}
        />
      )}

      {selectedServer && showChart && (
        <ServerMetricsChart
          server={selectedServer}
          onClose={() => {
            setShowChart(false);
            setSelectedServer(null);
          }}
        />
      )}
    </div>
  );
}
