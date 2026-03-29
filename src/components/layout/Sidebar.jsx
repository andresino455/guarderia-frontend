import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import styles from './Sidebar.module.css'

const navItems = [
  { to: '/dashboard',  label: 'Dashboard',   icon: '▦' },
  { to: '/ninos',      label: 'Niños',        icon: '◉' },
  { to: '/tutores',    label: 'Tutores',      icon: '◈' },
  { to: '/asistencia', label: 'Asistencia',   icon: '◷' },
  { to: '/salud',      label: 'Salud',        icon: '♥' },
  { to: '/servicios',  label: 'Servicios',    icon: '◆' },
  { to: '/pagos',      label: 'Pagos',        icon: '◎' },
]

export default function Sidebar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>G</div>
        <span className={styles.brandName}>Guardería</span>
      </div>

      {/* Navegación */}
      <nav className={styles.nav}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Usuario + logout al fondo */}
      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {usuario?.nombre?.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userText}>
            <span className={styles.userName}>{usuario?.nombre}</span>
            <span className={styles.userRole}>{usuario?.rol_nombre}</span>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Salir
        </button>
      </div>
    </aside>
  )
}