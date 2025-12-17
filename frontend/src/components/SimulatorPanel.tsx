import { useState, useEffect } from 'react';
import { Server, UserRole } from '../types';
import { simulatorApi } from '../api/simulator';
import { useQueryClient } from '@tanstack/react-query';
import { useServers } from '../hooks/useServers';
import { useAuthStore } from '../store/authStore';

interface SimulatorPanelProps {
  server: Server;
  onClose: () => void;
}

interface ActiveStressTest {
  test_id: number;
  started_at: string;
  duration_seconds: number;
  intensity: number;
  started_by: string;
}

export default function SimulatorPanel({ server: initialServer, onClose }: SimulatorPanelProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isPowerChanging, setIsPowerChanging] = useState(false);
  const [cpuBaseline, setCpuBaseline] = useState(50);
  const [ramBaseline, setRamBaseline] = useState(50);
  const [stressDuration, setStressDuration] = useState(60);
  const [stressIntensity, setStressIntensity] = useState(1.0);
  const [activeStressTest, setActiveStressTest] = useState<ActiveStressTest | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const { data: servers } = useServers({ refetchInterval: 5000 });

  const server = servers?.find(s => s.id === initialServer.id) || initialServer;

  useEffect(() => {
    const fetchStressTestStatus = async () => {
      try {
        const response = await simulatorApi.getState(server.id);
        const state = response.data;
        setActiveStressTest(state.active_stress_test);

        if (state.baseline) {
          setCpuBaseline(Math.round(state.baseline.cpu_baseline));
          setRamBaseline(Math.round(state.baseline.ram_baseline));
        }

        if (state.active_stress_test) {
          const startedAt = new Date(state.active_stress_test.started_at).getTime();
          const elapsed = (Date.now() - startedAt) / 1000;
          const remaining = Math.max(0, state.active_stress_test.duration_seconds - elapsed);
          setRemainingSeconds(Math.ceil(remaining));
        } else {
          setRemainingSeconds(0);
        }
      } catch (error) {
        console.error('Failed to fetch stress test status:', error);
      }
    };

    fetchStressTestStatus();
    const interval = setInterval(fetchStressTestStatus, 2000);
    return () => clearInterval(interval);
  }, [server.id]);

  useEffect(() => {
    if (!activeStressTest || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeStressTest, remainingSeconds]);

  const handlePowerToggle = async () => {
    setIsPowerChanging(true);
    try {
      await simulatorApi.controlPower(server.id, server.status !== 'online');
      await queryClient.invalidateQueries({ queryKey: ['servers'] });
      await new Promise(resolve => setTimeout(resolve, 500));
      await queryClient.refetchQueries({ queryKey: ['servers'] });
    } catch (error) {
      console.error('Failed to toggle power:', error);
      alert('Failed to toggle server power');
    } finally {
      setTimeout(() => setIsPowerChanging(false), 1000);
    }
  };

  const handleSetBaseline = async () => {
    setIsLoading(true);
    try {
      await simulatorApi.setBaseline(server.id, cpuBaseline, ramBaseline);
      alert(`Baseline set: CPU ${cpuBaseline}%, RAM ${ramBaseline}%`);
    } catch (error) {
      console.error('Failed to set baseline:', error);
      alert('Failed to set baseline');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStressTest = async () => {
    if (server.status !== 'online') {
      alert('Server must be online to run stress test');
      return;
    }

    setIsLoading(true);
    try {
      await simulatorApi.triggerStressTest(server.id, stressDuration, stressIntensity);
      alert(`Stress test started for ${stressDuration}s at ${stressIntensity * 100}% intensity`);
    } catch (error) {
      console.error('Failed to trigger stress test:', error);
      alert('Failed to trigger stress test');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            Simulator Control: {server.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              background: '#e5e7eb',
              borderRadius: '4px',
              fontWeight: '500'
            }}
          >
            Close
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>Power Control</h3>
            {(() => {
              const canControl = user?.role === UserRole.ADMIN || user?.role === UserRole.OPERATOR;
              return (
                <button
                  onClick={handlePowerToggle}
                  disabled={isPowerChanging || !canControl}
                  title={!canControl ? 'Only Admin and Operator can control server power' : undefined}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: !canControl ? '#d1d5db' : (server.status === 'online' ? '#ef4444' : '#10b981'),
                    color: !canControl ? '#6b7280' : 'white',
                    borderRadius: '4px',
                    fontWeight: '500',
                    opacity: isPowerChanging ? 0.6 : 1,
                    cursor: (isPowerChanging || !canControl) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {!canControl ? 'No Permission' : (isPowerChanging ? 'Processing...' : (server.status === 'online' ? 'Turn OFF' : 'Turn ON'))}
                </button>
              );
            })()}
          </div>

          <div style={{
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>Load Baseline</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                CPU Baseline: {cpuBaseline}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={cpuBaseline}
                onChange={(e) => setCpuBaseline(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                RAM Baseline: {ramBaseline}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={ramBaseline}
                onChange={(e) => setRamBaseline(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {(() => {
              const canControl = user?.role === UserRole.ADMIN || user?.role === UserRole.OPERATOR;
              return (
                <button
                  onClick={handleSetBaseline}
                  disabled={isLoading || !canControl}
                  title={!canControl ? 'Only Admin and Operator can set baseline' : undefined}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: !canControl ? '#d1d5db' : '#3b82f6',
                    color: !canControl ? '#6b7280' : 'white',
                    borderRadius: '4px',
                    fontWeight: '500',
                    opacity: isLoading ? 0.6 : 1,
                    cursor: (!canControl || isLoading) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {!canControl ? 'No Permission' : 'Apply Baseline'}
                </button>
              );
            })()}
          </div>

          <div style={{
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>Stress Test</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Duration: {stressDuration}s
              </label>
              <input
                type="range"
                min="10"
                max="300"
                step="10"
                value={stressDuration}
                onChange={(e) => setStressDuration(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Intensity: {Math.round(stressIntensity * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={stressIntensity}
                onChange={(e) => setStressIntensity(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {(() => {
              const canStressTest = user?.role === UserRole.ADMIN || user?.role === UserRole.OPERATOR;
              const isDisabled = isLoading || server.status !== 'online' || activeStressTest !== null || !canStressTest;

              return (
                <button
                  onClick={handleStressTest}
                  disabled={isDisabled}
                  title={!canStressTest ? 'Only Admin and Operator can run stress tests' : undefined}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: !canStressTest ? '#d1d5db' : (activeStressTest ? '#9ca3af' : (server.status === 'online' ? '#f59e0b' : '#9ca3af')),
                    color: !canStressTest ? '#6b7280' : 'white',
                    borderRadius: '4px',
                    fontWeight: '500',
                    opacity: (isLoading || activeStressTest) ? 0.6 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                  }}
                >
                  {!canStressTest
                    ? 'No Permission'
                    : activeStressTest
                      ? `Running... ${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`
                      : (server.status === 'online' ? 'Run Stress Test' : 'Server Offline')
                  }
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
