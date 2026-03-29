import { useEffect, useState } from 'react'
import {
  getAsistenciaHoy, getAlertasHoy,
  getActividadesHoy, checkinNino, checkoutNino
} from '../../api/dashboardApi'
import { useAuth } from '../../hooks/useAuth'
import styles from './Dashboard.module.css'

export default function DashboardPersonal() {
  const { usuario } = useAuth()
  const [asistencia,  setAsistencia]  = useState(null)
  const [alertas,     setAlertas]     = useState([])
  const [actividades, setActividades] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [checkinId,   setCheckinId]   = useState('')
  const [msg,         setMsg]         = useState(null)

  const cargarDatos = () => {
    Promise.all([
      getAsistenciaHoy(),
      getAlertasHoy(),
      getActividadesHoy(),
    ]).then(([a, al, act]) => {
      setAsistencia(a.data)
      setAlertas(al.data.alertas   ?? [])
      setActividades(act.data.actividades ?? [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { cargarDatos() }, [])

  const handleCheckin = async () => {
    if (!checkinId) return
    try {
      await checkinNino({ id_nino: checkinId, estado: 'presente' })
      setMsg({ tipo: 'ok', texto: 'Check-in registrado correctamente.' })
      setCheckinId('')
      cargarDatos()
    } catch {
      setMsg({ tipo: 'err', texto: 'Error al registrar check-in.' })
    }
  }

  const handleCheckout = async (id_asistencia) => {
    const hora = new Date().toTimeString().slice(0, 8)
    try {
      await checkoutNino(id_asistencia, { hora_salida: hora })
      setMsg({ tipo: 'ok', texto: 'Salida registrada.' })
      cargarDatos()
    } catch {
      setMsg({ tipo: 'err', texto: 'Error al registrar salida.' })
    }
  }

  const hoy = new Date().toLocaleDateString('es-BO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className={styles.page}>

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Hola, {usuario?.nombre}</h1>
          <p className={styles.pageDate}>{hoy}</p>
        </div>
        <span className={styles.rolBadge}>Personal</span>
      </div>

      {/* Tarjetas rápidas */}
      <div className={styles.cards}>
        <div className={`${styles.card} ${styles.green}`}>
          <div className={styles.cardIcon}>◷</div>
          <div className={styles.cardBody}>
            <span className={styles.cardValue}>
              {loading ? '—' : asistencia?.total_presentes ?? 0}
            </span>
            <span className={styles.cardLabel}>Presentes hoy</span>
          </div>
        </div>
        <div className={`${styles.card} ${styles.amber}`}>
          <div className={styles.cardIcon}>◷</div>
          <div className={styles.cardBody}>
            <span className={styles.cardValue}>
              {loading ? '—' : asistencia?.total_ausentes ?? 0}
            </span>
            <span className={styles.cardLabel}>Ausentes hoy</span>
          </div>
        </div>
        <div className={`${styles.card} ${styles.red}`}>
          <div className={styles.cardIcon}>♥</div>
          <div className={styles.cardBody}>
            <span className={styles.cardValue}>
              {loading ? '—' : alertas.length}
            </span>
            <span className={styles.cardLabel}>Alertas de salud</span>
          </div>
        </div>
        <div className={`${styles.card} ${styles.blue}`}>
          <div className={styles.cardIcon}>★</div>
          <div className={styles.cardBody}>
            <span className={styles.cardValue}>
              {loading ? '—' : actividades.length}
            </span>
            <span className={styles.cardLabel}>Actividades hoy</span>
          </div>
        </div>
      </div>

      {msg && (
        <div className={msg.tipo === 'ok' ? styles.msgOk : styles.msgErr}>
          {msg.texto}
        </div>
      )}

      <div className={styles.grid2}>

        {/* Check-in rápido */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Check-in rápido</h2>
          </div>
          <div className={styles.checkinBox}>
            <input
              type="number"
              placeholder="ID del niño"
              value={checkinId}
              onChange={e => setCheckinId(e.target.value)}
              className={styles.checkinInput}
            />
            <button className={styles.checkinBtn} onClick={handleCheckin}>
              Registrar entrada
            </button>
          </div>

          {/* Lista de presentes con opción de checkout */}
          <div className={styles.asistenciaList}>
            {(asistencia?.registros ?? []).map(r => (
              <div key={r.id_asistencia} className={styles.asistenciaItem}>
                <div className={styles.asistenciaInfo}>
                  <span className={styles.asistenciaNombre}>{r.nino_nombre}</span>
                  <span className={styles.asistenciaHora}>
                    Ingresó: {r.hora_ingreso ?? '—'}
                  </span>
                </div>
                {!r.hora_salida && (
                  <button
                    className={styles.checkoutBtn}
                    onClick={() => handleCheckout(r.id_asistencia)}
                  >
                    Registrar salida
                  </button>
                )}
                {r.hora_salida && (
                  <span className={styles.salidaTag}>
                    Salió: {r.hora_salida}
                  </span>
                )}
              </div>
            ))}
            {!loading && !(asistencia?.registros?.length) && (
              <p className={styles.empty}>Sin registros de asistencia hoy.</p>
            )}
          </div>
        </div>

        {/* Alertas de salud */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Alertas de salud hoy</h2>
          </div>
          <div className={styles.alertasList}>
            {alertas.map(a => (
              <div key={a.id_salud} className={styles.alertaItem}>
                <span className={styles.alertaNombre}>{a.nino_nombre}</span>
                <span className={styles.alertaSintoma}>{a.sintomas}</span>
              </div>
            ))}
            {!loading && !alertas.length && (
              <p className={styles.empty}>Sin alertas de salud hoy.</p>
            )}
          </div>
        </div>

      </div>

      {/* Actividades del día */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Actividades del día</h2>
        <div className={styles.actividadesList}>
          {actividades.map(a => (
            <div key={a.id_actividad} className={styles.actividadItem}>
              <span className={styles.actividadTipo}>{a.tipo_display}</span>
              <span className={styles.actividadNombre}>{a.nino_nombre}</span>
              <span className={styles.actividadDesc}>{a.descripcion}</span>
            </div>
          ))}
          {!loading && !actividades.length && (
            <p className={styles.empty}>Sin actividades registradas hoy.</p>
          )}
        </div>
      </div>

    </div>
  )
}