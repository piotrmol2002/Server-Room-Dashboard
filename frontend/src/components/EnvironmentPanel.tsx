import { Environment } from '../types';

interface EnvironmentPanelProps {
  environment: Environment;
}

export default function EnvironmentPanel({ environment }: EnvironmentPanelProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>
        Environment Status
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Room Temperature</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>
              {environment.room_temperature.toFixed(1)}°C
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: environment.room_temperature > 25 ? '#ef4444' : '#10b981' }}>
            {environment.room_temperature > 25 ? 'High' : 'Normal'}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Humidity</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>
              {environment.humidity.toFixed(1)}%
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: environment.humidity > 60 || environment.humidity < 30 ? '#f59e0b' : '#10b981' }}>
            {environment.humidity > 60 ? 'High' : environment.humidity < 30 ? 'Low' : 'Optimal'}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Air Conditioning</span>
            <span
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '600',
                background: environment.ac_status ? '#10b981' : '#6b7280',
                color: 'white',
              }}
            >
              {environment.ac_status ? 'ON' : 'OFF'}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Target: {environment.ac_target_temp.toFixed(1)}°C
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>UPS Battery</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: environment.ups_battery < 20 ? '#ef4444' : '#0f172a' }}>
              {environment.ups_battery.toFixed(0)}%
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: environment.ups_on_battery ? '#ef4444' : '#10b981' }}>
            {environment.ups_on_battery ? 'On Battery' : 'AC Power'}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Power Consumption</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>
              {environment.power_consumption.toFixed(1)} kW
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: environment.power_consumption > 10 ? '#f59e0b' : '#64748b' }}>
            {environment.power_consumption > 10 ? 'High load' : 'Normal'}
          </div>
        </div>
      </div>
    </div>
  );
}
