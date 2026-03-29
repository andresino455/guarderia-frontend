import { useAuth } from '../../hooks/useAuth'
import DashboardAdmin    from './DashboardAdmin'
import DashboardPersonal from './DashboardPersonal'
import DashboardTutor    from './DashboardTutor'

export default function Dashboard() {
  const { isAdmin, isPersonal, isTutor } = useAuth()

  if (isAdmin)    return <DashboardAdmin />
  if (isPersonal) return <DashboardPersonal />
  if (isTutor)    return <DashboardTutor />

  return (
    <div style={{ padding: 32 }}>
      <p>Rol no reconocido. Contactá al administrador.</p>
    </div>
  )
}