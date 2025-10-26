import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Server } from '../types';
import { metricsHistoryApi } from '../api/simulator';
import { format } from 'date-fns';

interface ServerMetricsChartProps {
  server: Server;
  onClose: () => void;
}

interface MetricData {
  timestamp: string;
  cpu_usage: number;
  ram_usage: number;
  temperature: number;
}

const timeRanges = [
  { label: '15 min', hours: 0.25 },
  { label: '1 hour', hours: 1 },
  { label: '6 hours', hours: 6 },
  { label: '24 hours', hours: 24 },
  { label: '7 days', hours: 168 },
];

export default function ServerMetricsChart({ server, onClose }: ServerMetricsChartProps) {
  const [data, setData] = useState<MetricData[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState({
    cpu: true,
    ram: true,
    temperature: true,
  });
  const [timeRange, setTimeRange] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await metricsHistoryApi.getHistory(server.id, timeRange, 500);
      const metrics = response.data.reverse().map((item: any) => ({
        timestamp: format(new Date(item.timestamp), 'HH:mm:ss'),
        cpu_usage: item.cpu_usage,
        ram_usage: item.ram_usage,
        temperature: item.temperature,
      }));
      setData(metrics);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMetric = (metric: 'cpu' | 'ram' | 'temperature') => {
    setSelectedMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
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
        maxWidth: '1200px',
        width: '95%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            {server.name} - Metrics History
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

        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '500', marginRight: '0.5rem' }}>
              Time Range:
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #d1d5db'
              }}
            >
              {timeRanges.map(range => (
                <option key={range.hours} value={range.hours}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedMetrics.cpu}
                onChange={() => toggleMetric('cpu')}
              />
              <span style={{ fontSize: '0.875rem', color: '#3b82f6' }}>CPU</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedMetrics.ram}
                onChange={() => toggleMetric('ram')}
              />
              <span style={{ fontSize: '0.875rem', color: '#10b981' }}>RAM</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedMetrics.temperature}
                onChange={() => toggleMetric('temperature')}
              />
              <span style={{ fontSize: '0.875rem', color: '#ef4444' }}>Temperature</span>
            </label>
          </div>

          {isLoading && (
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Loading...</span>
          )}
        </div>

        {data.length === 0 ? (
          <div style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            color: '#64748b'
          }}>
            No metrics data available for this time range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
              />
              <Tooltip />
              <Legend />
              {selectedMetrics.cpu && (
                <Line
                  type="monotone"
                  dataKey="cpu_usage"
                  stroke="#3b82f6"
                  name="CPU %"
                  dot={false}
                  strokeWidth={2}
                />
              )}
              {selectedMetrics.ram && (
                <Line
                  type="monotone"
                  dataKey="ram_usage"
                  stroke="#10b981"
                  name="RAM %"
                  dot={false}
                  strokeWidth={2}
                />
              )}
              {selectedMetrics.temperature && (
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#ef4444"
                  name="Temperature °C"
                  dot={false}
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#f8fafc',
          borderRadius: '6px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Current CPU</p>
            <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>{server.cpu_usage.toFixed(1)}%</p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Current RAM</p>
            <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>{server.ram_usage.toFixed(1)}%</p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Current Temp</p>
            <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>{server.temperature.toFixed(1)}°C</p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Status</p>
            <p style={{ fontSize: '1.25rem', fontWeight: '700', textTransform: 'capitalize' }}>{server.status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
