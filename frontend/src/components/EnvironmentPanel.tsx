import { memo, useState } from 'react';
import { Environment, UserRole } from '../types';
import { useAuthStore } from '../store/authStore';
import { environmentApi } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';

interface EnvironmentPanelProps {
  environment: Environment;
}

function EnvironmentPanel({ environment }: EnvironmentPanelProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [acTargetTemp, setAcTargetTemp] = useState(environment.ac_target_temp);
  const [isUpdating, setIsUpdating] = useState(false);

  const canControlAC = user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN;

  const handleAcTargetChange = async () => {
    if (!canControlAC) return;
    setIsUpdating(true);
    try {
      await environmentApi.update({ ac_target_temp: acTargetTemp });
      queryClient.invalidateQueries({ queryKey: ['environment'] });
    } catch (error) {
      console.error('Failed to update AC target:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAcToggle = async () => {
    if (!canControlAC) return;
    setIsUpdating(true);
    try {
      await environmentApi.update({ ac_status: !environment.ac_status });
      queryClient.invalidateQueries({ queryKey: ['environment'] });
    } catch (error) {
      console.error('Failed to toggle AC:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const boxStyle = {
    background: '#f8fafc',
    borderRadius: '8px',
    padding: '1rem',
    border: '1px solid #e2e8f0',
  };

  const labelStyle = {
    fontSize: '0.75rem',
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
  };

  const valueStyle = {
    fontSize: '1.75rem',
    fontWeight: '700' as const,
    lineHeight: 1.2,
  };

  const statusBadge = (isGood: boolean, goodText: string, badText: string) => (
    <span style={{
      display: 'inline-block',
      padding: '0.125rem 0.5rem',
      borderRadius: '4px',
      fontSize: '0.7rem',
      fontWeight: '600',
      background: isGood ? '#d1fae5' : '#fee2e2',
      color: isGood ? '#065f46' : '#991b1b',
      marginTop: '0.25rem',
    }}>
      {isGood ? goodText : badText}
    </span>
  );

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>
        Environment Status
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div style={boxStyle}>
          <div style={labelStyle}>Room Temperature</div>
          <div style={{ ...valueStyle, color: environment.room_temperature > 28 ? '#dc2626' : environment.room_temperature > 25 ? '#f59e0b' : '#0f172a' }}>
            {environment.room_temperature.toFixed(1)}°C
          </div>
          {statusBadge(environment.room_temperature <= 25, 'Normal', environment.room_temperature > 28 ? 'Critical' : 'High')}
        </div>

        <div style={boxStyle}>
          <div style={labelStyle}>Humidity</div>
          <div style={{ ...valueStyle, color: environment.humidity > 60 || environment.humidity < 30 ? '#f59e0b' : '#0f172a' }}>
            {environment.humidity.toFixed(1)}%
          </div>
          {statusBadge(environment.humidity >= 30 && environment.humidity <= 60, 'Optimal', environment.humidity > 60 ? 'High' : 'Low')}
        </div>

        <div style={boxStyle}>
          <div style={labelStyle}>Power Consumption</div>
          <div style={{ ...valueStyle, color: environment.power_consumption > 8 ? '#f59e0b' : '#0f172a' }}>
            {environment.power_consumption.toFixed(2)} kW
          </div>
          {statusBadge(environment.power_consumption <= 8, 'Normal', 'High Load')}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ ...boxStyle, background: environment.ac_status ? '#ecfdf5' : '#fef2f2', border: `1px solid ${environment.ac_status ? '#a7f3d0' : '#fecaca'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <div style={labelStyle}>Air Conditioning</div>
              <span style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: '600',
                background: environment.ac_status ? '#10b981' : '#6b7280',
                color: 'white',
              }}>
                {environment.ac_status ? 'ON' : 'OFF'}
              </span>
            </div>
            {canControlAC && (
              <button
                onClick={handleAcToggle}
                disabled={isUpdating}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: environment.ac_status ? '#ef4444' : '#10b981',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                  opacity: isUpdating ? 0.5 : 1,
                }}
              >
                {environment.ac_status ? 'Turn OFF' : 'Turn ON'}
              </button>
            )}
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
              Target Temperature
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                {environment.ac_target_temp.toFixed(1)}°C
              </span>
              {canControlAC && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto' }}>
                  <input
                    type="number"
                    min="16"
                    max="28"
                    step="0.5"
                    value={acTargetTemp}
                    onChange={(e) => setAcTargetTemp(Number(e.target.value))}
                    style={{
                      width: '60px',
                      padding: '0.25rem 0.5rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                    }}
                  />
                  <button
                    onClick={handleAcTargetChange}
                    disabled={isUpdating || acTargetTemp === environment.ac_target_temp}
                    style={{
                      padding: '0.25rem 0.5rem',
                      background: acTargetTemp === environment.ac_target_temp ? '#e2e8f0' : '#3b82f6',
                      color: acTargetTemp === environment.ac_target_temp ? '#94a3b8' : 'white',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      cursor: (isUpdating || acTargetTemp === environment.ac_target_temp) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Set
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ ...boxStyle, background: environment.ups_on_battery ? '#fef2f2' : '#f0fdf4', border: `1px solid ${environment.ups_on_battery ? '#fecaca' : '#bbf7d0'}` }}>
          <div style={labelStyle}>UPS Power</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '100%',
              height: '24px',
              background: '#e2e8f0',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <div style={{
                width: `${environment.ups_battery}%`,
                height: '100%',
                background: environment.ups_battery <= 25 ? '#dc2626' : environment.ups_battery <= 50 ? '#f59e0b' : '#10b981',
                transition: 'width 0.5s ease',
              }} />
              <span style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#0f172a',
              }}>
                {environment.ups_battery.toFixed(0)}%
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: '600',
              background: environment.ups_on_battery ? '#fee2e2' : '#d1fae5',
              color: environment.ups_on_battery ? '#991b1b' : '#065f46',
            }}>
              {environment.ups_on_battery ? '⚠ On Battery' : '✓ AC Power'}
            </span>
            {environment.ups_on_battery && (
              <span style={{ fontSize: '0.7rem', color: '#dc2626' }}>
                Power outage detected
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(EnvironmentPanel);
