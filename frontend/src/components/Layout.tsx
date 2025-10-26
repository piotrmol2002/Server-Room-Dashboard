import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { UserRole } from '../types'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '250px',
        background: '#1e293b',
        color: 'white',
        padding: '1.5rem'
      }}>
        <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>
          Serwerownia
        </h2>

        <nav>
          <ul style={{ listStyle: 'none' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <Link
                to="/"
                style={{
                  display: 'block',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  transition: 'background 0.2s'
                }}
              >
                Dashboard
              </Link>
            </li>

            <li style={{ marginBottom: '0.5rem' }}>
              <Link
                to="/servers"
                style={{
                  display: 'block',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  transition: 'background 0.2s'
                }}
              >
                Servers
              </Link>
            </li>

            <li style={{ marginBottom: '0.5rem' }}>
              <Link
                to="/tasks"
                style={{
                  display: 'block',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  transition: 'background 0.2s'
                }}
              >
                Tasks
              </Link>
            </li>

            {user?.role === UserRole.ADMIN && (
              <li style={{ marginBottom: '0.5rem' }}>
                <Link
                  to="/users"
                  style={{
                    display: 'block',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    transition: 'background 0.2s'
                  }}
                >
                  Users (Admin)
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: '1.5rem',
          right: '1.5rem'
        }}>
          <div style={{
            padding: '1rem',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              {user?.full_name || user?.username}
            </p>
            <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>
              {user?.role}
            </p>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#ef4444',
              color: 'white',
              borderRadius: '4px',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        padding: '2rem',
        background: '#f8fafc'
      }}>
        <Outlet />
      </main>
    </div>
  )
}
