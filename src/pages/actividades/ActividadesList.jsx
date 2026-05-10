import { useEffect, useState, useCallback } from 'react'
import {
  getActividades, crearActividad, editarActividad,
  eliminarActividad, getActividadesHoy,
  getEstadisticas, registrarGrupo, getNinos,
} from '../../api/actividadesApi'
import styles from './Actividades.module.css'

const TIPOS = [
  'pedagogica', 'recreativa', 'deportiva', 'artistica', 'social', 'otro'
]

const FORM_INICIAL = {
  id_nino: '', tipo: 'pedagogica',
  descripcion: '', fecha: new Date().toISOString().split('T')[0],
}

const GRUPO_INICIAL = {
  tipo: 'pedagogica', descripcion: '',
  fecha: new Date().toISOString().split('T')[0],
}

function tipoClass(tipo) {
  const map = {
    pedagogica:  styles.tipoPedagogica,
    recreativa:  styles.tipoRecreativa,
    deportiva:   styles.tipoDeportiva,
    artistica:   styles.tipoArtistica,
    social:      styles.tipoSocial,
    otro:        styles.tipoOtro,
  }
  return map[tipo] ?? styles.tipoOtro
}

export default function ActividadesList() {
  const [tab,          setTab]          = useState('lista')
  const [actividades,  setActividades]  = useState([])
  const [hoy,          setHoy]          = useState([])
  const [estadisticas, setEstadisticas] = useState([])
  const [ninos,        setNinos]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [busqueda,     setBusqueda]     = useState('')
  const [filtroTipo,   setFiltroTipo]   = useState('')
  const [filtroFecha,  setFiltroFecha]  = useState('')
  const [msg,          setMsg]          = useState(null)

  // Modal individual
  const [modal,     setModal]     = useState(false)
  const [editando,  setEditando]  = useState(null)
  const [form,      setForm]      = useState(FORM_INICIAL)
  const [guardando, setGuardando] = useState(false)
  const [modalMsg,  setModalMsg]  = useState(null)

  // Modal grupo
  const [modalGrupo,    setModalGrupo]    = useState(false)
  const [formGrupo,     setFormGrupo]     = useState(GRUPO_INICIAL)
  const [ninosElegidos, setNinosElegidos] = useState([])
  const [guardandoGrupo,setGuardandoGrupo]= useState(false)
  const [modalMsgGrupo, setModalMsgGrupo] = useState(null)

  const mostrarMsg = (tipo, texto) => {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg(null), 3500)
  }

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    try {
      const [a, h, e, n] = await Promise.all([
        getActividades(),
        getActividadesHoy(),
        getEstadisticas(),
        getNinos(),
      ])
      setActividades(a.data.results ?? a.data)
      setHoy(h.data.actividades ?? [])
      setEstadisticas(e.data.por_tipo ?? [])
      setNinos(n.data.results ?? n.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // Filtros
  const actividadesFiltradas = actividades.filter(a => {
    const matchBusq  = a.nino_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
                       a.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
    const matchTipo  = filtroTipo  ? a.tipo  === filtroTipo  : true
    const matchFecha = filtroFecha ? a.fecha === filtroFecha : true
    return matchBusq && matchTipo && matchFecha
  })

  const totalActividades = estadisticas.reduce((acc, e) => acc + e.total, 0)

  // ── Modal individual ──────────────────────────────────────────
  const abrirCrear = () => {
    setEditando(null)
    setForm({ ...FORM_INICIAL, fecha: new Date().toISOString().split('T')[0] })
    setModalMsg(null)
    setModal(true)
  }

  const abrirEditar = (a) => {
    setEditando(a)
    setForm({
      id_nino:     a.id_nino,
      tipo:        a.tipo,
      descripcion: a.descripcion,
      fecha:       a.fecha,
    })
    setModalMsg(null)
    setModal(true)
  }

  const cerrarModal = () => { setModal(false); setEditando(null); setModalMsg(null) }

  const handleGuardar = async () => {
    if (!form.id_nino || !form.descripcion || !form.fecha) {
      setModalMsg({ tipo: 'err', texto: 'Todos los campos son obligatorios.' })
      return
    }
    setGuardando(true)
    setModalMsg(null)
    try {
      if (editando) {
        await editarActividad(editando.id_actividad, form)
        mostrarMsg('ok', 'Actividad actualizada.')
      } else {
        await crearActividad(form)
        mostrarMsg('ok', 'Actividad registrada.')
      }
      cargarDatos()
      cerrarModal()
    } catch (err) {
      const detail = err.response?.data?.detail ||
        Object.values(err.response?.data ?? {})[0]?.[0] || 'Error al guardar.'
      setModalMsg({ tipo: 'err', texto: detail })
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar esta actividad?')) return
    try {
      await eliminarActividad(id)
      mostrarMsg('ok', 'Actividad eliminada.')
      cargarDatos()
    } catch {
      mostrarMsg('err', 'No se pudo eliminar la actividad.')
    }
  }

  // ── Modal grupo ───────────────────────────────────────────────
  const abrirGrupo = () => {
    setFormGrupo({ ...GRUPO_INICIAL, fecha: new Date().toISOString().split('T')[0] })
    setNinosElegidos([])
    setModalMsgGrupo(null)
    setModalGrupo(true)
  }

  const cerrarGrupo = () => { setModalGrupo(false); setModalMsgGrupo(null) }

  const toggleNino = (id) => {
    setNinosElegidos(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    )
  }

  const seleccionarTodos = () => {
    if (ninosElegidos.length === ninos.length) {
      setNinosElegidos([])
    } else {
      setNinosElegidos(ninos.map(n => n.id_nino))
    }
  }

  const handleGuardarGrupo = async () => {
    if (!ninosElegidos.length) {
      setModalMsgGrupo({ tipo: 'err', texto: 'Seleccioná al menos un niño.' })
      return
    }
    if (!formGrupo.descripcion || !formGrupo.fecha) {
      setModalMsgGrupo({ tipo: 'err', texto: 'Descripción y fecha son obligatorios.' })
      return
    }
    setGuardandoGrupo(true)
    setModalMsgGrupo(null)
    try {
      const { data } = await registrarGrupo({
        ninos:       ninosElegidos,
        tipo:        formGrupo.tipo,
        descripcion: formGrupo.descripcion,
        fecha:       formGrupo.fecha,
      })
      mostrarMsg('ok', data.detail)
      cargarDatos()
      cerrarGrupo()
    } catch (err) {
      const detail = err.response?.data?.detail ||
        Object.values(err.response?.data ?? {})[0]?.[0] || 'Error al guardar.'
      setModalMsgGrupo({ tipo: 'err', texto: detail })
    } finally {
      setGuardandoGrupo(false)
    }
  }

  return (
    <div className={styles.page}>

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Actividades</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={styles.btnSecondary} onClick={abrirGrupo}>
            + Actividad grupal
          </button>
          <button className={styles.btnPrimary} onClick={abrirCrear}>
            + Nueva actividad
          </button>
        </div>
      </div>

      {msg && (
        <div className={msg.tipo === 'ok' ? styles.msgOk : styles.msgErr}>
          {msg.texto}
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'lista' ? styles.active : ''}`}
          onClick={() => setTab('lista')}
        >
          Lista
        </button>
        <button
          className={`${styles.tab} ${tab === 'hoy' ? styles.active : ''}`}
          onClick={() => setTab('hoy')}
        >
          Hoy
        </button>
        <button
          className={`${styles.tab} ${tab === 'estadisticas' ? styles.active : ''}`}
          onClick={() => setTab('estadisticas')}
        >
          Estadísticas
        </button>
      </div>

      {/* ── TAB LISTA ── */}
      {tab === 'lista' && (
        <>
          <div className={styles.filters}>
            <input
              type="text" placeholder="Buscar por niño o descripción..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className={styles.searchInput}
            />
            <select
              value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
              className={styles.select}
            >
              <option value="">Todos los tipos</option>
              {TIPOS.map(t => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
            <input
              type="date" value={filtroFecha}
              onChange={e => setFiltroFecha(e.target.value)}
              className={styles.select}
            />
            {filtroFecha && (
              <button
                className={styles.btnSecondary}
                onClick={() => setFiltroFecha('')}
                style={{ padding: '8px 10px', fontSize: 13 }}
              >
                ✕ Fecha
              </button>
            )}
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
              {actividadesFiltradas.length} resultado{actividadesFiltradas.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Niño</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} className={styles.empty}>Cargando...</td></tr>
                )}
                {!loading && !actividadesFiltradas.length && (
                  <tr>
                    <td colSpan={5} className={styles.empty}>
                      No se encontraron actividades.
                    </td>
                  </tr>
                )}
                {actividadesFiltradas.map(a => (
                  <tr key={a.id_actividad}>
                    <td style={{ fontWeight: 500 }}>{a.nino_nombre}</td>
                    <td>
                      <span className={`${styles.tipoBadge} ${tipoClass(a.tipo)}`}>
                        {a.tipo_display ?? a.tipo}
                      </span>
                    </td>
                    <td style={{
                      color: 'var(--color-text-muted)',
                      maxWidth: 280,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {a.descripcion}
                    </td>
                    <td>{a.fecha}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.btnIcon}
                          onClick={() => abrirEditar(a)}
                        >
                          Editar
                        </button>
                        <button
                          className={styles.btnDanger}
                          onClick={() => handleEliminar(a.id_actividad)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── TAB HOY ── */}
      {tab === 'hoy' && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
              {hoy.length} actividad{hoy.length !== 1 ? 'es' : ''} registrada{hoy.length !== 1 ? 's' : ''} hoy
            </p>
          </div>

          {!loading && !hoy.length && (
            <div style={{
              padding: 40, textAlign: 'center',
              color: 'var(--color-text-muted)', fontSize: 14,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
            }}>
              No hay actividades registradas para hoy.
            </div>
          )}

          <div className={styles.hoyGrid}>
            {hoy.map(a => (
              <div key={a.id_actividad} className={styles.hoyCard}>
                <div className={styles.hoyCardHeader}>
                  <span className={styles.hoyCardNino}>{a.nino_nombre}</span>
                  <span className={`${styles.tipoBadge} ${tipoClass(a.tipo)}`}>
                    {a.tipo_display ?? a.tipo}
                  </span>
                </div>
                <p className={styles.hoyCardDesc}>{a.descripcion}</p>
                <span className={styles.hoyCardFecha}>{a.fecha}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── TAB ESTADÍSTICAS ── */}
      {tab === 'estadisticas' && (
        <>
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
            Total registradas: <strong style={{ color: 'var(--color-text)' }}>
              {totalActividades}
            </strong>
          </div>

          <div className={styles.statsGrid}>
            {estadisticas.map(e => {
              const pct = totalActividades > 0
                ? Math.round((e.total / totalActividades) * 100)
                : 0
              return (
                <div key={e.tipo} className={styles.statCard}>
                  <span className={`${styles.tipoBadge} ${tipoClass(e.tipo)}`}>
                    {e.tipo.charAt(0).toUpperCase() + e.tipo.slice(1)}
                  </span>
                  <span className={styles.statTotal}>{e.total}</span>
                  <span className={styles.statLabel}>{pct}% del total</span>
                  <div className={styles.statBar}>
                    <div
                      className={styles.statBarFill}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {!loading && !estadisticas.length && (
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', gridColumn: '1/-1' }}>
                Sin datos de estadísticas.
              </p>
            )}
          </div>
        </>
      )}

      {/* ── MODAL CREAR / EDITAR ACTIVIDAD ── */}
      {modal && (
        <div className={styles.overlay} onClick={cerrarModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                {editando ? 'Editar actividad' : 'Nueva actividad'}
              </span>
              <button className={styles.btnClose} onClick={cerrarModal}>✕</button>
            </div>

            <div className={styles.modalBody}>
              {modalMsg && (
                <div className={modalMsg.tipo === 'ok' ? styles.msgOk : styles.msgErr}>
                  {modalMsg.texto}
                </div>
              )}

              <div className={styles.formGrid}>
                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Niño *</label>
                  <select
                    value={form.id_nino}
                    onChange={e => setForm(p => ({ ...p, id_nino: e.target.value }))}
                    className={styles.select2}
                  >
                    <option value="">— Seleccioná un niño —</option>
                    {ninos.map(n => (
                      <option key={n.id_nino} value={n.id_nino}>
                        {n.nombre} ({n.edad} años)
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Tipo *</label>
                  <select
                    value={form.tipo}
                    onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}
                    className={styles.select2}
                  >
                    {TIPOS.map(t => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Fecha *</label>
                  <input
                    type="date" value={form.fecha}
                    onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
                    className={styles.input}
                  />
                </div>

                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Descripción *</label>
                  <textarea
                    value={form.descripcion}
                    onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                    className={styles.textarea}
                    placeholder="Describí la actividad realizada..."
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={cerrarModal}>
                Cancelar
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleGuardar}
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ACTIVIDAD GRUPAL ── */}
      {modalGrupo && (
        <div className={styles.overlay} onClick={cerrarGrupo}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Actividad grupal</span>
              <button className={styles.btnClose} onClick={cerrarGrupo}>✕</button>
            </div>

            <div className={styles.modalBody}>
              {modalMsgGrupo && (
                <div className={modalMsgGrupo.tipo === 'ok' ? styles.msgOk : styles.msgErr}>
                  {modalMsgGrupo.texto}
                </div>
              )}

              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>Tipo *</label>
                  <select
                    value={formGrupo.tipo}
                    onChange={e => setFormGrupo(p => ({ ...p, tipo: e.target.value }))}
                    className={styles.select2}
                  >
                    {TIPOS.map(t => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Fecha *</label>
                  <input
                    type="date" value={formGrupo.fecha}
                    onChange={e => setFormGrupo(p => ({ ...p, fecha: e.target.value }))}
                    className={styles.input}
                  />
                </div>

                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Descripción *</label>
                  <textarea
                    value={formGrupo.descripcion}
                    onChange={e => setFormGrupo(p => ({ ...p, descripcion: e.target.value }))}
                    className={styles.textarea}
                    placeholder="Describí la actividad del grupo..."
                  />
                </div>

                <div className={styles.sectionDivider}>
                  Seleccioná los niños ({ninosElegidos.length}/{ninos.length})
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  style={{ fontSize: 12, padding: '5px 12px' }}
                  onClick={seleccionarTodos}
                >
                  {ninosElegidos.length === ninos.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>

              <div className={styles.ninoCheckList}>
                {ninos.map(n => (
                  <div
                    key={n.id_nino}
                    className={`${styles.ninoCheckItem} ${ninosElegidos.includes(n.id_nino) ? styles.checked : ''}`}
                    onClick={() => toggleNino(n.id_nino)}
                  >
                    <input
                      type="checkbox" readOnly
                      checked={ninosElegidos.includes(n.id_nino)}
                      style={{ flexShrink: 0 }}
                    />
                    <div>
                      <div className={styles.ninoCheckNombre}>{n.nombre}</div>
                      <div className={styles.ninoCheckEdad}>{n.edad} años</div>
                    </div>
                  </div>
                ))}
                {!ninos.length && (
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)', padding: 8 }}>
                    No hay niños registrados.
                  </p>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={cerrarGrupo}>
                Cancelar
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleGuardarGrupo}
                disabled={guardandoGrupo || !ninosElegidos.length}
              >
                {guardandoGrupo
                  ? 'Guardando...'
                  : `Registrar para ${ninosElegidos.length} niño${ninosElegidos.length !== 1 ? 's' : ''}`
                }
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}