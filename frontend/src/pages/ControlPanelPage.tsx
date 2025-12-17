import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentApi } from '../services/api';
import { Environment } from '../types';

export default function ControlPanelPage() {
  const queryClient = useQueryClient();

  const { data: environment, isLoading } = useQuery({
    queryKey: ['environment'],
    queryFn: async () => {
      const response = await environmentApi.get();
      return response.data;
    },
  });

  const [humidity, setHumidity] = useState(45);
  const [upsBattery, setUpsBattery] = useState(100);
  const [upsOnBattery, setUpsOnBattery] = useState(false);

  useEffect(() => {
    if (environment) {
      setHumidity(environment.humidity);
      setUpsBattery(environment.ups_battery);
      setUpsOnBattery(environment.ups_on_battery);
    }
  }, [environment]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Environment>) => environmentApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environment'] });
    },
    onError: (error: any) => {
      alert(`Failed to update: ${error.response?.data?.detail || error.message}`);
    },
  });

  const handleHumidityChange = () => {
    updateMutation.mutate({ humidity });
  };

  const handleUpsBatteryChange = () => {
    updateMutation.mutate({ ups_battery: upsBattery });
  };

  const handleUpsOnBatteryToggle = () => {
    const newValue = !upsOnBattery;
    setUpsOnBattery(newValue);
    updateMutation.mutate({ ups_on_battery: newValue });
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ fontSize: '1.25rem', color: '#64748b' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
        Environment Control Panel
      </h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        Manually adjust environment parameters for testing alerts
      </p>

      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          Humidity Control
        </h2>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: '500' }}>
              Humidity Level
            </label>
            <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>
              {humidity.toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={humidity}
            onChange={(e) => setHumidity(Number(e.target.value))}
            style={{ width: '100%', marginBottom: '0.5rem' }}
          />
          <small style={{ color: '#64748b' }}>
            Current: {environment?.humidity.toFixed(1)}% | Warning: 60% | Critical: 75%
          </small>
        </div>

        <button
          onClick={handleHumidityChange}
          disabled={updateMutation.isPending}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#3b82f6',
            color: 'white',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: updateMutation.isPending ? 'not-allowed' : 'pointer',
            opacity: updateMutation.isPending ? 0.5 : 1
          }}
        >
          Apply Humidity
        </button>
      </div>

      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          UPS Power Control
        </h2>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontWeight: '500', display: 'block' }}>
                Power Source
              </label>
              <small style={{ color: '#64748b' }}>
                Toggle to simulate power outage
              </small>
            </div>
            <button
              onClick={handleUpsOnBatteryToggle}
              disabled={updateMutation.isPending}
              style={{
                padding: '0.75rem 1.5rem',
                background: upsOnBattery ? '#ef4444' : '#10b981',
                color: 'white',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: updateMutation.isPending ? 'not-allowed' : 'pointer'
              }}
            >
              {upsOnBattery ? 'ON BATTERY (Simulated Outage)' : 'AC POWER (Normal)'}
            </button>
          </div>
        </div>

        <div style={{
          padding: '1rem',
          background: upsOnBattery ? '#fef2f2' : '#f0fdf4',
          borderRadius: '6px',
          marginBottom: '1.5rem',
          border: `1px solid ${upsOnBattery ? '#fecaca' : '#bbf7d0'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>{upsOnBattery ? '⚠️' : '✓'}</span>
            <span style={{ fontWeight: '500', color: upsOnBattery ? '#dc2626' : '#16a34a' }}>
              {upsOnBattery
                ? 'UPS is running on battery - battery will drain based on power consumption'
                : 'UPS is connected to AC power - battery charging/stable'
              }
            </span>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: '500' }}>
              UPS Battery Level
            </label>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: upsBattery <= 25 ? '#dc2626' : upsBattery <= 50 ? '#f59e0b' : '#0f172a'
            }}>
              {upsBattery.toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={upsBattery}
            onChange={(e) => setUpsBattery(Number(e.target.value))}
            style={{ width: '100%', marginBottom: '0.5rem' }}
          />
          <small style={{ color: '#64748b' }}>
            Current: {environment?.ups_battery.toFixed(1)}% | Alerts at: 75%, 50%, 25%
          </small>
        </div>

        <button
          onClick={handleUpsBatteryChange}
          disabled={updateMutation.isPending}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#f59e0b',
            color: 'white',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: updateMutation.isPending ? 'not-allowed' : 'pointer',
            opacity: updateMutation.isPending ? 0.5 : 1
          }}
        >
          Set Battery Level
        </button>
      </div>

      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Current Environment Status
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Room Temperature</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>{environment?.room_temperature.toFixed(1)}°C</div>
          </div>
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Humidity</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>{environment?.humidity.toFixed(1)}%</div>
          </div>
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>UPS Battery</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>{environment?.ups_battery.toFixed(1)}%</div>
          </div>
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Power Consumption</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>{environment?.power_consumption.toFixed(2)} kW</div>
          </div>
        </div>
      </div>
    </div>
  );
}
