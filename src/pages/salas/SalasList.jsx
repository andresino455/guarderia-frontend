import { useEffect, useState, useCallback } from 'react'
import {
  getSalas, getResumenSalas, crearSala, editarSala, eliminarSala,
  getNinosSala, asignarNino, asignarPersonal,
  getPersonal, crearPersonal, editarPersonal, eliminarPersonal,
  getNinos,
} from '../../api/salasApi'
import styles from './Salas.module.css'

const SALA_INICIAL     = { nombre: '', edad_min: '', edad_max: '', cupo_max: '' }
const PERSONAL_INICIAL = { nombre: '', telefono: '', tipo: 'maestra' }
const TIPOS_PERSONAL   = ['maestra', 'auxiliar', 'enfermera', 'cocinera', 'seguridad', 'otro']

function colorBarra(pct) {
  if (pct >= 90) return '#E24B4A'
  if (pct >= 70) return '#BA7517'
  return '#1D9E75'
}

export default function SalasList() {
  const [tab,       setTab]       = useState('salas')
  const [salas,     setSalas]     = useState([])
  const [resumen,   setResumen]   = useState([])
  const [personal,  setPersonal]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [busqueda,  setBusqueda]  = useState('')
  const [msg,       setMsg]       = useState(null)

  // Drawer detalle sala
  const [detalle,      setDetalle]      = useState(null)
  const [ninosSala,    setNinosSala]    = useState([])
  const [personalSala, setPersonalSala] = useState([])
  const [loadDet,      setLoadDet]      = useState(false)

  // Modal sala
  const [modalSala,   setModalSala]   = useState(false)
  const [editandoSala,setEditandoSala]= useState(null)
  const [formSala,    setFormSala]    = useState(SALA_INICIAL)
  const [guardando,   setGuardando]   = useState(false)
  const [modalMsg,    setModalMsg]    = useState(null)

  // Modal personal
  const [modalPers,   setModalPers]   = useState(false)
  const [editandoPers,setEditandoPers]= useState(null)
  const [formPers,    setFormPers]    = useState(PERSONAL_INICIAL)
  const [guardandoPers,setGuardandoPers]= useState(false)

  // Asignar niño a sala
  const [todosNinos,  setTodosNinos]  = useState([])
  const [ninoElegido, setNinoElegido] = useState('')

  // Asignar personal a sala
  const [persElegido, setPersElegido] = useState('')

  const mostrarMsg = (tipo, texto) => {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg(null), 3500)
  }

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    try {
      const [s, r, p, n] = await Promise.all([
        getSalas(), getResumenSalas(), getPersonal(), getNinos(),
      ])
      setSalas(s.data.results ?? s.data)
      setResumen(r.data)
      setPersonal(p.data.results ?? p.data)
      setTodosNinos(n.data.results ?? n.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  const salasFiltradas = salas.filter(s =>
    s.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )
  const personalFiltrado = personal.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  // ── Detalle sala ──────────────────────────────────────────────
  const abrirDetalle = async (sala) => {
    setDetalle(sala)
    setLoadDet(true)
    setNinosSala([])
    setPersonalSala([])
    setNinoElegido('')
    setPersElegido('')
    try {
      const { data } = await getNinosSala(sala.id_sala)
      setNinosSala(data)
      // Personal de la sala viene en el objeto sala
      setPersonalSala(sala.personal ?? [])
    } finally {
      setLoadDet(false)
    }
  }

  const cerrarDetalle = () => { setDetalle(null); setNinosSala([]); setPersonalSala([]) }

  const handleAsignarNino = async () => {
    if (!ninoElegido) return
    try {
      await asignarNino(detalle.id_sala, { id_nino: ninoElegido })
      mostrarMsg('ok', 'Niño asignado a la sala.')
      const { data } = await getNinosSala(detalle.id_sala)
      setNinosSala(data)
      setNinoElegido('')
      cargarDatos()
    } catch (err) {
      mostrarMsg('err', err.response?.data?.detail ?? 'No se pudo asignar el niño.')
    }
  }

  const handleAsignarPersonal = async () => {
    if (!persElegido) return
    try {
      await asignarPersonal(detalle.id_sala, { id_personal: persElegido })
      mostrarMsg('ok', 'Personal asignado a la sala.')
      // Recargar sala completa para actualizar personal
      const { data } = await getSalas()
      const salaActualizada = (data.results ?? data).find(s => s.id_sala === detalle.id_sala)
      setPersonalSala(salaActualizada?.personal ?? [])
      setPersElegido('')
      cargarDatos()
    } catch (err) {
      mostrarMsg('err', err.response?.data?.detail ?? 'No se pudo asignar el personal.')
    }
  }

  // ── CRUD Salas ────────────────────────────────────────────────
  const abrirCrearSala = () => {
    setEditandoSala(null)
    setFormSala(SALA_INICIAL)
    setModalMsg(null)
    setModalSala(true)
  }

  const abrirEditarSala = (sala) => {
    setEditandoSala(sala)
    setFormSala({
      nombre:   sala.nombre,
      edad_min: sala.edad_min,
      edad_max: sala.edad_max,
      cupo_max: sala.cupo_max,
    })
    setModalMsg(null)
    setModalSala(true)
    cerrarDetalle()
  }

  const cerrarModalSala = () => { setModalSala(false); setEditandoSala(null); setModalMsg(null) }

  const handleGuardarSala = async () => {
    const { nombre, edad_min, edad_max, cupo_max } = formSala
    if (!nombre || !edad_min || !edad_max || !cupo_max) {
      setModalMsg({ tipo: 'err', texto: 'Todos los campos son obligatorios.' })
      return
    }
    if (Number(edad_min) > Number(edad_max)) {
      setModalMsg({ tipo: 'err', texto: 'La edad mínima no puede ser mayor a la máxima.' })
      return
    }
    setGuardando(true)
    setModalMsg(null)
    try {
      if (editandoSala) {
        await editarSala(editandoSala.id_sala, formSala)
        mostrarMsg('ok', 'Sala actualizada.')
      } else {
        await crearSala(formSala)
        mostrarMsg('ok', 'Sala creada correctamente.')
      }
      cargarDatos()
      cerrarModalSala()
    } catch (err) {
      const detail = err.response?.data?.detail ||
        Object.values(err.response?.data ?? {})[0]?.[0] ||
        'Error al guardar.'
      setModalMsg({ tipo: 'err', texto: detail })
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminarSala = async (id) => {
    if (!confirm('¿Eliminar esta sala?')) return
    try {
      await eliminarSala(id)
      mostrarMsg('ok', 'Sala eliminada.')
      cargarDatos()
      if (detalle?.id_sala === id) cerrarDetalle()
    } catch {
      mostrarMsg('err', 'No se pudo eliminar la sala.')
    }
  }

  // ── CRUD Personal ─────────────────────────────────────────────
  const abrirCrearPersonal = () => {
    setEditandoPers(null)
    setFormPers(PERSONAL_INICIAL)
    setModalPers(true)
  }

  const abrirEditarPersonal = (p) => {
    setEditandoPers(p)
    setFormPers({ nombre: p.nombre, telefono: p.telefono ?? '', tipo: p.tipo })
    setModalPers(true)
  }

  const cerrarModalPers = () => { setModalPers(false); setEditandoPers(null) }

  const handleGuardarPersonal = async () => {
    if (!formPers.nombre.trim()) return
    setGuardandoPers(true)
    try {
      if (editandoPers) {
        await editarPersonal(editandoPers.id_personal, formPers)
        mostrarMsg('ok', 'Personal actualizado.')
      } else {
        await crearPersonal(formPers)
        mostrarMsg('ok', 'Personal registrado.')
      }
      cargarDatos()
      cerrarModalPers()
    } catch (err) {
      mostrarMsg('err', err.response?.data?.detail ?? 'Error al guardar.')
    } finally {
      setGuardandoPers(false)
    }
  }

  const handleEliminarPersonal = async (id) => {
    if (!confirm('¿Eliminar este personal?')) return
    try {
      await eliminarPersonal(id)
      mostrarMsg('ok', 'Personal eliminado.')
      cargarDatos()
    } catch {
      mostrarMsg('err', 'No se pudo eliminar.')
    }
  }

  return (
    <div className={styles.page}>

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Salas</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          {tab === 'salas' && (
            <button className={styles.btnPrimary} onClick={abrirCrearSala}>
              + Nueva sala
            </button>
          )}
          {tab === 'personal' && (
            <button className={styles.btnPrimary} onClick={abrirCrearPersonal}>
              + Nuevo personal
            </button>
          )}
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
          className={`${styles.tab} ${tab === 'salas' ? styles.active : ''}`}
          onClick={() => { setTab('salas'); setBusqueda('') }}
        >
          Salas
        </button>
        <button
          className={`${styles.tab} ${tab === 'resumen' ? styles.active : ''}`}
          onClick={() => setTab('resumen')}
        >
          Ocupación
        </button>
        <button
          className={`${styles.tab} ${tab === 'personal' ? styles.active : ''}`}
          onClick={() => { setTab('personal'); setBusqueda('') }}
        >
          Personal
        </button>
      </div>

      {/* ── TAB SALAS ── */}
      {tab === 'salas' && (
        <>
          <div className={styles.filters}>
            <input
              type="text" placeholder="Buscar sala..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className={styles.searchInput}
            />
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
              {salasFiltradas.length} sala{salasFiltradas.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Rango de edad</th>
                  <th>Ocupación</th>
                  <th>Cupo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} className={styles.empty}>Cargando...</td></tr>
                )}
                {!loading && !salasFiltradas.length && (
                  <tr>
                    <td colSpan={6} className={styles.empty}>No hay salas registradas.</td>
                  </tr>
                )}
                {salasFiltradas.map(s => {
                  const pct   = s.cupo_max > 0 ? Math.round((s.ocupacion / s.cupo_max) * 100) : 0
                  const color = colorBarra(pct)
                  return (
                    <tr key={s.id_sala}>
                      <td style={{ fontWeight: 500 }}>{s.nombre}</td>
                      <td>{s.edad_min} – {s.edad_max} años</td>
                      <td>
                        <div className={styles.ocupacionWrap}>
                          <div className={styles.ocupacionBar}>
                            <div
                              className={styles.ocupacionFill}
                              style={{ width: `${pct}%`, background: color }}
                            />
                          </div>
                          <span className={styles.ocupacionText}>
                            {s.ocupacion}/{s.cupo_max}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 13, fontWeight: 600,
                          color: s.cupo_disponible > 0 ? '#1D9E75' : '#E24B4A'
                        }}>
                          {s.cupo_disponible} libre{s.cupo_disponible !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 12, fontWeight: 500,
                          padding: '3px 8px', borderRadius: 10,
                          background: s.activo ? '#EAF3DE' : '#F1EFE8',
                          color: s.activo ? '#3B6D11' : '#5F5E5A',
                        }}>
                          {s.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button className={styles.btnIcon} onClick={() => abrirDetalle(s)}>
                            Ver
                          </button>
                          <button className={styles.btnIcon} onClick={() => abrirEditarSala(s)}>
                            Editar
                          </button>
                          <button className={styles.btnDanger} onClick={() => handleEliminarSala(s.id_sala)}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── TAB OCUPACIÓN ── */}
      {tab === 'resumen' && (
        <div className={styles.resumenGrid}>
          {loading && <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Cargando...</p>}
          {resumen.map(s => {
            const pct   = s.cupo_max > 0 ? Math.min(s.porcentaje, 100) : 0
            const color = colorBarra(pct)
            return (
              <div key={s.id_sala} className={styles.resumenCard}>
                <div className={styles.resumenCardHeader}>
                  <div>
                    <div className={styles.resumenCardNombre}>{s.nombre}</div>
                    <div className={styles.resumenCardEdades}>
                      {s.edad_min} – {s.edad_max} años
                    </div>
                  </div>
                  <span className={styles.resumenCardCount}>
                    {s.ocupacion}/{s.cupo_max}
                  </span>
                </div>
                <div className={styles.barBg}>
                  <div className={styles.barFill}
                    style={{ width: `${pct}%`, background: color }} />
                </div>
                <div className={styles.resumenCardFooter}>
                  <span className={styles.cupoLabel}>Ocupación</span>
                  <span className={styles.cupoValor} style={{ color }}>
                    {pct}%
                  </span>
                </div>
                <div className={styles.resumenCardFooter}>
                  <span className={styles.cupoLabel}>Lugares disponibles</span>
                  <span className={styles.cupoValor}
                    style={{ color: s.cupo_disponible > 0 ? '#1D9E75' : '#E24B4A' }}>
                    {s.cupo_disponible}
                  </span>
                </div>
              </div>
            )
          })}
          {!loading && !resumen.length && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              No hay salas registradas.
            </p>
          )}
        </div>
      )}

      {/* ── TAB PERSONAL ── */}
      {tab === 'personal' && (
        <>
          <div className={styles.filters}>
            <input
              type="text" placeholder="Buscar personal..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} className={styles.empty}>Cargando...</td></tr>
                )}
                {!loading && !personalFiltrado.length && (
                  <tr>
                    <td colSpan={5} className={styles.empty}>No hay personal registrado.</td>
                  </tr>
                )}
                {personalFiltrado.map(p => (
                  <tr key={p.id_personal}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className={styles.personalAvatar}>
                          {p.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{p.nombre}</span>
                      </div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{p.tipo}</td>
                    <td>{p.telefono ?? '—'}</td>
                    <td>
                      <span style={{
                        fontSize: 12, fontWeight: 500,
                        padding: '3px 8px', borderRadius: 10,
                        background: p.activo ? '#EAF3DE' : '#F1EFE8',
                        color: p.activo ? '#3B6D11' : '#5F5E5A',
                      }}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.btnIcon} onClick={() => abrirEditarPersonal(p)}>
                          Editar
                        </button>
                        <button className={styles.btnDanger} onClick={() => handleEliminarPersonal(p.id_personal)}>
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

      {/* ── DRAWER DETALLE SALA ── */}
      {detalle && (
        <div className={styles.overlay} onClick={cerrarDetalle}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>{detalle.nombre}</span>
              <button className={styles.btnClose} onClick={cerrarDetalle}>✕</button>
            </div>

            <div className={styles.drawerBody}>

              {/* Info general */}
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Información</div>
                <div className={styles.infoList}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Rango de edad</span>
                    <span className={styles.infoValue}>{detalle.edad_min} – {detalle.edad_max} años</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Cupo máximo</span>
                    <span className={styles.infoValue}>{detalle.cupo_max} niños</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Ocupación actual</span>
                    <span className={styles.infoValue}>{detalle.ocupacion} niños</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Lugares disponibles</span>
                    <span className={styles.infoValue}
                      style={{ color: detalle.cupo_disponible > 0 ? '#1D9E75' : '#E24B4A' }}>
                      {detalle.cupo_disponible}
                    </span>
                  </div>
                </div>
              </div>

              {/* Niños en la sala */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>
                    Niños ({ninosSala.length})
                  </span>
                </div>

                {ninosSala.map(n => (
                  <div key={n.id_asignacion} className={styles.ninoItem}>
                    <div className={styles.ninoAvatar}>
                      {n.foto
                        ? <img src={n.foto} alt={n.nino_nombre} />
                        : (n.nino_nombre ?? '?').charAt(0)
                      }
                    </div>
                    <div className={styles.ninoInfo}>
                      <span className={styles.ninoNombre}>{n.nino_nombre}</span>
                      <span className={styles.ninoEdad}>{n.nino_edad} años</span>
                    </div>
                  </div>
                ))}
                {!loadDet && !ninosSala.length && (
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                    Sin niños asignados.
                  </p>
                )}

                {/* Asignar niño */}
                {detalle.cupo_disponible > 0 && (
                  <div className={styles.searchBox} style={{ marginTop: 8 }}>
                    <select
                      value={ninoElegido}
                      onChange={e => setNinoElegido(e.target.value)}
                      className={styles.select2}
                      style={{ flex: 1 }}
                    >
                      <option value="">— Asignar niño —</option>
                      {todosNinos
                        .filter(n =>
                          !ninosSala.some(ns => ns.id_nino === n.id_nino) &&
                          n.edad >= detalle.edad_min &&
                          n.edad <= detalle.edad_max
                        )
                        .map(n => (
                          <option key={n.id_nino} value={n.id_nino}>
                            {n.nombre} ({n.edad} años)
                          </option>
                        ))
                      }
                    </select>
                    <button className={styles.btnAdd} onClick={handleAsignarNino}>
                      Asignar
                    </button>
                  </div>
                )}
              </div>

              {/* Personal de la sala */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>
                    Personal ({personalSala.length})
                  </span>
                </div>

                {personalSala.map(p => (
                  <div key={p.id_personal} className={styles.personalItem}>
                    <div className={styles.personalAvatar}>
                      {(p.personal_nombre ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.personalInfo}>
                      <span className={styles.personalNombre}>{p.personal_nombre}</span>
                      <span className={styles.personalTipo} style={{ textTransform: 'capitalize' }}>
                        {p.personal_tipo}
                      </span>
                    </div>
                  </div>
                ))}
                {!personalSala.length && (
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                    Sin personal asignado.
                  </p>
                )}

                {/* Asignar personal */}
                <div className={styles.searchBox} style={{ marginTop: 8 }}>
                  <select
                    value={persElegido}
                    onChange={e => setPersElegido(e.target.value)}
                    className={styles.select2}
                    style={{ flex: 1 }}
                  >
                    <option value="">— Asignar personal —</option>
                    {personal
                      .filter(p => !personalSala.some(ps => ps.id_personal === p.id_personal))
                      .map(p => (
                        <option key={p.id_personal} value={p.id_personal}>
                          {p.nombre} ({p.tipo})
                        </option>
                      ))
                    }
                  </select>
                  <button className={styles.btnAdd} onClick={handleAsignarPersonal}>
                    Asignar
                  </button>
                </div>
              </div>

              {/* Acciones drawer */}
              <div className={styles.drawerActions}>
                <button className={styles.btnSecondary} onClick={() => abrirEditarSala(detalle)}>
                  Editar sala
                </button>
                <button className={styles.btnDanger} onClick={() => handleEliminarSala(detalle.id_sala)}>
                  Eliminar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CREAR / EDITAR SALA ── */}
      {modalSala && (
        <div className={styles.modalOverlay} onClick={cerrarModalSala}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                {editandoSala ? 'Editar sala' : 'Nueva sala'}
              </span>
              <button className={styles.btnClose} onClick={cerrarModalSala}>✕</button>
            </div>

            <div className={styles.modalBody}>
              {modalMsg && (
                <div className={modalMsg.tipo === 'ok' ? styles.msgOk : styles.msgErr}>
                  {modalMsg.texto}
                </div>
              )}
              <div className={styles.formGrid}>
                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Nombre de la sala *</label>
                  <input
                    value={formSala.nombre}
                    onChange={e => setFormSala(p => ({ ...p, nombre: e.target.value }))}
                    className={styles.input} placeholder="Ej: Sala Bebés, Sala Gatitos"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Edad mínima (años) *</label>
                  <input
                    type="number" min="0" max="12"
                    value={formSala.edad_min}
                    onChange={e => setFormSala(p => ({ ...p, edad_min: e.target.value }))}
                    className={styles.input} placeholder="0"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Edad máxima (años) *</label>
                  <input
                    type="number" min="0" max="12"
                    value={formSala.edad_max}
                    onChange={e => setFormSala(p => ({ ...p, edad_max: e.target.value }))}
                    className={styles.input} placeholder="3"
                  />
                </div>
                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Cupo máximo *</label>
                  <input
                    type="number" min="1"
                    value={formSala.cupo_max}
                    onChange={e => setFormSala(p => ({ ...p, cupo_max: e.target.value }))}
                    className={styles.input} placeholder="20"
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={cerrarModalSala}>
                Cancelar
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleGuardarSala}
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : editandoSala ? 'Guardar cambios' : 'Crear sala'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CREAR / EDITAR PERSONAL ── */}
      {modalPers && (
        <div className={styles.modalOverlay} onClick={cerrarModalPers}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                {editandoPers ? 'Editar personal' : 'Nuevo personal'}
              </span>
              <button className={styles.btnClose} onClick={cerrarModalPers}>✕</button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Nombre completo *</label>
                  <input
                    value={formPers.nombre}
                    onChange={e => setFormPers(p => ({ ...p, nombre: e.target.value }))}
                    className={styles.input} placeholder="Nombre del personal"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Tipo *</label>
                  <select
                    value={formPers.tipo}
                    onChange={e => setFormPers(p => ({ ...p, tipo: e.target.value }))}
                    className={styles.select2}
                  >
                    {TIPOS_PERSONAL.map(t => (
                      <option key={t} value={t} style={{ textTransform: 'capitalize' }}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Teléfono</label>
                  <input
                    value={formPers.telefono}
                    onChange={e => setFormPers(p => ({ ...p, telefono: e.target.value }))}
                    className={styles.input} placeholder="Número de contacto"
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={cerrarModalPers}>
                Cancelar
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleGuardarPersonal}
                disabled={guardandoPers || !formPers.nombre.trim()}
              >
                {guardandoPers ? 'Guardando...' : editandoPers ? 'Guardar cambios' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}