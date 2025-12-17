import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertThresholdsApi, alertsApi } from '../services/api';
import { AlertThreshold, AlertLog, AlertLevel } from '../types';
import { formatInTimeZone } from 'date-fns-tz';

const levelColors: Record<string, string> = {
  [AlertLevel.INFO]: '#3b82f6',
  [AlertLevel.WARNING]: '#f59e0b',
  [AlertLevel.ERROR]: '#ef4444',
  [AlertLevel.CRITICAL]: '#dc2626',
};

export default function AlertSettingsPage() {
  const queryClient = useQueryClient();

  const { data: thresholds, isLoading } = useQuery({
    queryKey: ['alert-thresholds'],
    queryFn: async () => {
      const response = await alertThresholdsApi.get();
      return response.data;
    },
  });

  const { data: alertLogs } = useQuery({
    queryKey: ['alert-logs'],
    queryFn: async () => {
      const response = await alertsApi.getLogs();
      return response.data;
    },
  });

  const [formData, setFormData] = useState<AlertThreshold | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (thresholds && !formData) {
      setFormData(thresholds);
    }
  }, [thresholds]);

  useEffect(() => {
    if (!thresholds || !formData) return;

    const changed =
      formData.cpu_warning_threshold !== thresholds.cpu_warning_threshold ||
      formData.cpu_critical_threshold !== thresholds.cpu_critical_threshold ||
      formData.temperature_warning_threshold !== thresholds.temperature_warning_threshold ||
      formData.temperature_critical_threshold !== thresholds.temperature_critical_threshold ||
      formData.ram_warning_threshold !== thresholds.ram_warning_threshold ||
      formData.ram_critical_threshold !== thresholds.ram_critical_threshold ||
      formData.humidity_warning_threshold !== thresholds.humidity_warning_threshold ||
      formData.humidity_critical_threshold !== thresholds.humidity_critical_threshold;

    setHasChanges(changed);
  }, [formData, thresholds]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<AlertThreshold>) => alertThresholdsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-thresholds'] });
      setHasChanges(false);
      alert('Alert thresholds updated successfully');
    },
    onError: (error: any) => {
      alert(`Failed to update: ${error.response?.data?.detail || error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      updateMutation.mutate(formData);
    }
  };

  const handleReset = () => {
    if (thresholds) {
      setFormData({
        ...thresholds,
        cpu_warning_threshold: 85,
        cpu_critical_threshold: 95,
        temperature_warning_threshold: 70,
        temperature_critical_threshold: 80,
        ram_warning_threshold: 85,
        ram_critical_threshold: 95,
        humidity_warning_threshold: 60,
        humidity_critical_threshold: 75,
      });
    }
  };

  if (isLoading || !formData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ fontSize: '1.25rem', color: '#64748b' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
        Alert Thresholds Settings
      </h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        Configure when alerts are triggered for CPU, temperature, and RAM usage
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            CPU Usage Thresholds
          </h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Warning Threshold (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.cpu_warning_threshold}
              onChange={(e) => setFormData({ ...formData, cpu_warning_threshold: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            <small style={{ color: '#64748b' }}>
              Generates WARNING alert for OPERATOR when CPU usage exceeds this value
            </small>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Critical Threshold (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.cpu_critical_threshold}
              onChange={(e) => setFormData({ ...formData, cpu_critical_threshold: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            <small style={{ color: '#64748b' }}>
              Generates CRITICAL alert for OPERATOR when CPU usage exceeds this value
            </small>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            Temperature Thresholds
          </h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Warning Threshold (°C)
            </label>
            <input
              type="number"
              min="0"
              max="150"
              step="0.1"
              value={formData.temperature_warning_threshold}
              onChange={(e) => setFormData({ ...formData, temperature_warning_threshold: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            <small style={{ color: '#64748b' }}>
              Generates WARNING alert for TECHNICIAN when temperature exceeds this value
            </small>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Critical Threshold (°C)
            </label>
            <input
              type="number"
              min="0"
              max="150"
              step="0.1"
              value={formData.temperature_critical_threshold}
              onChange={(e) => setFormData({ ...formData, temperature_critical_threshold: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            <small style={{ color: '#64748b' }}>
              Generates CRITICAL alert for TECHNICIAN when temperature exceeds this value
            </small>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            RAM Usage Thresholds
          </h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Warning Threshold (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.ram_warning_threshold}
              onChange={(e) => setFormData({ ...formData, ram_warning_threshold: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            <small style={{ color: '#64748b' }}>
              Generates WARNING alert for OPERATOR when RAM usage exceeds this value
            </small>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Critical Threshold (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.ram_critical_threshold}
              onChange={(e) => setFormData({ ...formData, ram_critical_threshold: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            <small style={{ color: '#64748b' }}>
              Generates CRITICAL alert for OPERATOR when RAM usage exceeds this value
            </small>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
            Humidity Thresholds
          </h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Warning Threshold (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.humidity_warning_threshold}
              onChange={(e) => setFormData({ ...formData, humidity_warning_threshold: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            <small style={{ color: '#64748b' }}>
              Generates WARNING alert for TECHNICIAN when humidity exceeds this value
            </small>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Critical Threshold (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.humidity_critical_threshold}
              onChange={(e) => setFormData({ ...formData, humidity_critical_threshold: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            <small style={{ color: '#64748b' }}>
              Generates CRITICAL alert for TECHNICIAN when humidity exceeds this value
            </small>
          </div>
        </div>

        {thresholds?.updated_by && (
          <div style={{
            background: '#f8fafc',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            color: '#64748b'
          }}>
            Last updated by: {thresholds.updated_by}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            disabled={updateMutation.isPending || !hasChanges}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: (updateMutation.isPending || !hasChanges) ? 'not-allowed' : 'pointer',
              opacity: (updateMutation.isPending || !hasChanges) ? 0.5 : 1
            }}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#64748b',
              color: 'white',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Reset to Defaults
          </button>
        </div>
      </form>

      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginTop: '2rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          Alert History / Logs
        </h2>

        {alertLogs && alertLogs.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Alert</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Level</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Source</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Created</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Read By</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Read At</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Deleted By</th>
                </tr>
              </thead>
              <tbody>
                {alertLogs.slice(0, 20).map((log: AlertLog) => (
                  <tr key={`${log.id}-${log.deleted_at || ''}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.75rem' }}>{log.title}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: levelColors[log.level] || '#64748b',
                        color: 'white'
                      }}>
                        {log.level}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#64748b' }}>{log.source || '-'}</td>
                    <td style={{ padding: '0.75rem', color: '#64748b' }}>
                      {formatInTimeZone(new Date(log.created_at), 'Europe/Warsaw', 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#64748b' }}>{log.read_by_email || '-'}</td>
                    <td style={{ padding: '0.75rem', color: '#64748b' }}>
                      {log.read_at ? formatInTimeZone(new Date(log.read_at), 'Europe/Warsaw', 'yyyy-MM-dd HH:mm') : '-'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {log.deleted_by_email ? (
                        <span style={{ color: '#ef4444' }}>{log.deleted_by_email}</span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>
            No alert logs available
          </p>
        )}
      </div>
    </div>
  );
}
