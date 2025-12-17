import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import ServersPage from './pages/ServersPage'
import TasksPage from './pages/TasksPage'
import AlertsPage from './pages/AlertsPage'
import AlertSettingsPage from './pages/AlertSettingsPage'
import Layout from './components/Layout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="servers" element={<ServersPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="alert-settings" element={<AlertSettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
