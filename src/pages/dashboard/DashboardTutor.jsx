import { useEffect, useState } from 'react'
import { getDashboardTutor } from '../../api/dashboardApi'
import { useAuth } from '../../hooks/useAuth'
import styles from './Dashboard.module.css'

export default function DashboardTutor() {
  const { usuario } = useAuth()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [camaraActiva, setCamaraActiva] = useState(null)

  useEffect(() => {
    getDashboardTutor()
      .then(({ data }) => {
        setData(data)
        if (data.camaras?.length) setCamaraActiva(data.camaras[0])
      })
      .finally(() => setLoading(false))
  }, [])

  const hoy = new Date().toLocaleDateString('es-BO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  if (loading) return (
    <div className={styles.loadingPage}>Cargando tu panel...</div>
  )

  return (
    <div className={styles.page}>

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Hola, {usuario?.nombre}</h1>
          <p className={styles.pageDate}>{hoy}</p>
        </div>
        <span className={styles.rolBadge}>Tutor</span>
      </div>

      {/* Tarjetas resumen */}
      <div className={styles.cards}>
        <div className={`${styles.card} ${styles.blue}`}>
          <div className={styles.cardIcon}>◉</div>
          <div className={styles.cardBody}>
            <span className={styles.cardValue}>
              {data?.resumen?.total_ninos ?? 0}
            </span>
            <span className={styles.cardLabel}>Mis hijos</span>
          </div>
        </div>
        <div className={`${styles.card} ${styles.amber}`}>
          <div className={styles.cardIcon}>◎</div>
          <div className={styles.cardBody}>
            <span className={styles.cardValue}>
              {data?.resumen?.pagos_pendientes ?? 0}
            </span>
            <span className={styles.cardLabel}>Pagos pendientes</span>
          </div>
        </div>
        <div className={`${styles.card} ${styles.red}`}>
          <div className={styles.cardIcon}>◔</div>
          <div className={styles.cardBody}>
            <span className={styles.cardValue}>
              {data?.resumen?.notif_no_leidas ?? 0}
            </span>
            <span className={styles.cardLabel}>Notificaciones</span>
          </div>
        </div>
      </div>

      <div className={styles.grid2}>

        {/* Info de hijos */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Mis hijos</h2>
          </div>
          <div className={styles.ninosList}>
            {(data?.ninos ?? []).map(n => (
              <div key={n.id_nino} className={styles.ninoItem}>
                <div className={styles.ninoAvatar}>
                  {n.foto
                    ? <img src={n.foto} alt={n.nombre} className={styles.ninoFoto} />
                    : <span>{n.nombre.charAt(0)}</span>
                  }
                </div>
                <div className={styles.ninoInfo}>
                  <span className={styles.ninoNombre}>{n.nombre}</span>
                  <span className={styles.ninoEdad}>{n.edad} años</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Asistencia reciente */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h2 className={styles.chartTitle}>Asistencia reciente</h2>
            <span className={styles.chartSub}>Últimos 7 días</span>
          </div>
          <div className={styles.asistenciaList}>
            {(data?.asistencias_recientes ?? []).slice(0, 7).map(a => (
              <div key={a.id_asistencia} className={styles.asistenciaItem}>
                <div className={styles.asistenciaInfo}>
                  <span className={styles.asistenciaNombre}>{a.nino_nombre}</span>
                  <span className={styles.asistenciaHora}>{a.fecha}</span>
                </div>
                <span className={`${styles.estadoBadge} ${styles[a.estado]}`}>
                  {a.estado}
                </span>
              </div>
            ))}
            {!data?.asistencias_recientes?.length && (
              <p className={styles.empty}>Sin registros recientes.</p>
            )}
          </div>
        </div>

      </div>

      {/* Pagos pendientes */}
      {data?.pagos_pendientes?.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Pagos pendientes</h2>
          <div className={styles.pagosList}>
            {data.pagos_pendientes.map(p => (
              <div key={p.id_pago} className={styles.pagoItem}>
                <div className={styles.pagoInfo}>
                  <span className={styles.pagoNino}>{p.nino_nombre}</span>
                  <span className={styles.pagoFecha}>{p.fecha}</span>
                </div>
                <span className={styles.pagoMonto}>Bs. {p.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cámaras de la sala */}
      {data?.camaras?.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Cámara de la sala</h2>

          {data.camaras.length > 1 && (
            <div className={styles.camaraTabs}>
              {data.camaras.map(c => (
                <button
                  key={c.id_camara}
                  className={`${styles.camaraTab} ${camaraActiva?.id_camara === c.id_camara ? styles.active : ''}`}
                  onClick={() => setCamaraActiva(c)}
                >
                  {c.sala_nombre}
                </button>
              ))}
            </div>
          )}

          {camaraActiva && (
            <div className={styles.streamBox}>
              <iframe
                src={camaraActiva.url_stream}
                title={`Cámara — ${camaraActiva.sala_nombre}`}
                className={styles.streamFrame}
                allowFullScreen
              />
              <p className={styles.streamLabel}>
                Sala: {camaraActiva.sala_nombre}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Notificaciones */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Notificaciones recientes</h2>
        <div className={styles.notifList}>
          {(data?.notificaciones ?? []).map(n => (
            <div key={n.id_notificacion} className={`${styles.notifItem} ${!n.leido ? styles.notifNueva : ''}`}>
              <span className={styles.notifMensaje}>{n.mensaje}</span>
              <span className={styles.notifFecha}>
                {new Date(n.fecha).toLocaleDateString('es-BO')}
              </span>
            </div>
          ))}
          {!data?.notificaciones?.length && (
            <p className={styles.empty}>Sin notificaciones.</p>
          )}
        </div>
      </div>

    </div>
  )
}