export default function DashboardPage() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>
        Dashboard
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '0.5rem', color: '#64748b' }}>
            Total Servers
          </h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>12</p>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '0.5rem', color: '#64748b' }}>
            Online Servers
          </h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>10</p>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '0.5rem', color: '#64748b' }}>
            Active Alerts
          </h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>3</p>
        </div>
      </div>

      <p style={{ marginTop: '2rem', color: '#64748b' }}>
        WebSocket integration and real-time updates will be implemented here...
      </p>
    </div>
  )
}
