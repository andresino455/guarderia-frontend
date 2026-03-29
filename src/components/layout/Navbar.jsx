import { useLocation } from 'react-router-dom'
import styles from './Navbar.module.css'

const titles = {
  '/dashboard':  'Dashboard',
  '/ninos':      'Gestión de niños',
  '/tutores':    'Tutores y padres',
  '/asistencia': 'Control de asistencia',
  '/salud':      'Salud y medicación',
  '/servicios':  'Servicios',
  '/pagos':      'Pagos',
}

export default function Navbar() {
  const { pathname } = useLocation()
  const base = '/' + pathname.split('/')[1]
  const title = titles[base] || 'Guardería'

  return (
    <header className={styles.navbar}>
      <h2 className={styles.title}>{title}</h2>
    </header>
  )
}