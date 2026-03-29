import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return (
    <div style={{
      height: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <p style={{ color: 'var(--color-text-muted)' }}>Cargando...</p>
    </div>
  )

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}