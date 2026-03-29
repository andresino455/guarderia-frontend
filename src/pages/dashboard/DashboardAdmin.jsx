import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardAdmin } from '../../api/dashboardApi'
import GraficoPagos from './GraficoPagos'
import styles from './Dashboard.module.css'

const TARJETAS = [
  { key: 'total_ninos',    label: 'Niños activos',    icon: '◉', color: 'blue'  },
  { key: 'asistencia_hoy', label: 'Asistencia hoy',   icon: '◷', color: 'green' },
  { key: 'pagos_mes',      label: 'Pagos este mes',    icon: '◎', color: 'amber' },
  { key: 'alertas_salud',  label: 'Alertas de salud',  icon: '♥', color: 'red'   },
]

const ACCESOS = [
  { label: 'Niños',       path: '/ninos',      icon: '◉' },
  { label: 'Tutores',     path: '/tutores',    icon: '◈' },
  { label: 'Asistencia',  path: '/asistencia', icon: '◷' },
  { label: 'Salud',       path: '/salud',      icon: '♥' },
  { label: 'Servicios',   path: '/servicios',  icon: '◆' },
  { label: 'Pagos',       path: '/pagos',      icon: '◎' },
  { label: 'Salas',       path: '/salas',      icon: '▦' },
  { label: 'Actividades', path: '/actividades',icon: '★' },
]

export default function DashboardAdmin() {
  const [resumen, setResumen] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getDashboardAdmin()
      .then(({ data }) => setResumen(data))
      .finally(() => setLoading(false))
  }, [])

  const hoy = new Date().toLocaleDateString('es-BO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className={styles.page}>

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Panel de administración</h1>
          <p className={styles.pageDate}>{hoy}</p>
        </div>
        <span className={styles.rolBadge}>Administrador</span>
      </div>

      {/* Tarjetas resumen */}
      <div className={styles.cards}>
        {TARJETAS.map(t => (
          <div key={t.key} className={`${styles.card} ${styles[t.color]}`}>
            <div className={styles.cardIcon}>{t.icon}</div>
            <div className={styles.cardBody}>
              <span className={styles.cardValue}>
                {loading ? '—' : (resumen?.[t.key] ?? 0)}
              </span>
              <span className={styles.cardLabel}>{t.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.grid2}>

        {/* Gráfico de pagos */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Pagos del mes</h2>
            <span className={styles.chartSub}>
              {new Date().toLocaleDateString('es-BO', {
                month: 'long', year: 'numeric'
              })}
            </span>
          </div>
          {loading
            ? <div className={styles.chartPlaceholder}>Cargando...</div>
            : <GraficoPagos datos={resumen?.pagos_grafico ?? []} />
          }
        </div>

        {/* Ocupación de salas */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Ocupación de salas</h2>
          </div>
          {loading
            ? <div className={styles.chartPlaceholder}>Cargando...</div>
            : <OcupacionSalas datos={resumen?.salas ?? []} />
          }
        </div>

      </div>

      {/* Accesos rápidos */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Accesos rápidos</h2>
        <div className={styles.accesos}>
          {ACCESOS.map(a => (
            <button
              key={a.path}
              className={styles.accesoBtn}
              onClick={() => navigate(a.path)}
            >
              <span className={styles.accesoIcon}>{a.icon}</span>
              <span className={styles.accesoLabel}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}

function OcupacionSalas({ datos }) {
  if (!datos.length) return (
    <p className={styles.empty}>Sin datos de salas.</p>
  )
  return (
    <div className={styles.salasList}>
      {datos.map(s => {
        const pct = Math.min(
          Math.round((s.ocupacion / s.cupo_max) * 100), 100
        )
        const color = pct >= 90 ? '#E24B4A' : pct >= 70 ? '#BA7517' : '#1D9E75'
        return (
          <div key={s.id_sala} className={styles.salaItem}>
            <div className={styles.salaHeader}>
              <span className={styles.salaNombre}>{s.nombre}</span>
              <span className={styles.salaCount}>
                {s.ocupacion}/{s.cupo_max}
              </span>
            </div>
            <div className={styles.barBg}>
              <div
                className={styles.barFill}
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <span className={styles.salaPct}>{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}