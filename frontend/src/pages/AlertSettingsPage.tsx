import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertThresholdsApi } from '../services/api';
import { AlertThreshold } from '../types';

export default function AlertSettingsPage() {
  const queryClient = useQueryClient();

  const { data: thresholds, isLoading } = useQuery({
    queryKey: ['alert-thresholds'],
    queryFn: async () => {
      const response = await alertThresholdsApi.get();
      return response.data;
    },
  });

  const [formData, setFormData] = useState<Partial<AlertThreshold>>({});

  const updateMutation = useMutation({
    mutationFn: (data: Partial<AlertThreshold>) => alertThresholdsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-thresholds'] });
      alert('Alert thresholds updated successfully');
    },
    onError: (error: any) => {
      alert(`Failed to update: ${error.response?.data?.detail || error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleReset = () => {
    if (thresholds) {
      setFormData({
        cpu_warning_threshold: 85,
        cpu_critical_threshold: 95,
        temperature_warning_threshold: 70,
        temperature_critical_threshold: 80,
        ram_warning_threshold: 85,
        ram_critical_threshold: 95,
      });
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ fontSize: '1.25rem', color: '#64748b' }}>Loading...</div>
      </div>
    );
  }

  const currentThresholds = { ...thresholds, ...formData };

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
              value={currentThresholds.cpu_warning_threshold}
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
              value={currentThresholds.cpu_critical_threshold}
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
              value={currentThresholds.temperature_warning_threshold}
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
              value={currentThresholds.temperature_critical_threshold}
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
              value={currentThresholds.ram_warning_threshold}
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
              value={currentThresholds.ram_critical_threshold}
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
            disabled={updateMutation.isPending}
            style={{
              flex: 1,
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
    </div>
  );
}
