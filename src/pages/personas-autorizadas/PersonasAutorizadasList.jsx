import { useEffect, useState, useCallback } from 'react'
import {
  getPersonasAutorizadas, crearPersonaAutorizada,
  editarPersonaAutorizada, eliminarPersonaAutorizada,
  verificarPersona, getNinos,
} from '../../api/personasAutorizadasApi'
import styles from './PersonasAutorizadas.module.css'

const FORM_INICIAL = {
  nombre: '', ci: '', telefono: '',
  codigo_seguridad: '', id_nino: '',
}

const VERIFICAR_INICIAL = { ci: '', codigo_seguridad: '' }

export default function PersonasAutorizadasList() {
  const [tab,       setTab]       = useState('lista')  // 'lista' | 'verificar'
  const [personas,  setPersonas]  = useState([])
  const [ninos,     setNinos]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [busqueda,  setBusqueda]  = useState('')
  const [filtroNino,setFiltroNino]= useState('')
  const [msg,       setMsg]       = useState(null)

  // Modal form
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando,     setEditando]     = useState(null)
  const [form,         setForm]         = useState(FORM_INICIAL)
  const [guardando,    setGuardando]    = useState(false)

  // Verificador
  const [verificar,   setVerificar]   = useState(VERIFICAR_INICIAL)
  const [resultado,   setResultado]   = useState(null)
  const [verificando, setVerificando] = useState(false)

  const cargarDatos = useCallback(() => {
    setLoading(true)
    Promise.all([
      getPersonasAutorizadas(),
      getNinos(),
    ]).then(([p, n]) => {
      setPersonas(p.data.results ?? p.data)
      setNinos(n.data.results ?? n.data)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // Filtros combinados
  const personasFiltradas = personas.filter(p => {
    const matchBusq = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                      p.ci.includes(busqueda)
    const matchNino = filtroNino ? String(p.id_nino) === filtroNino : true
    return matchBusq && matchNino
  })

  const abrirCrear = () => {
    setEditando(null)
    setForm(FORM_INICIAL)
    setMsg(null)
    setModalAbierto(true)
  }

  const abrirEditar = (persona) => {
    setEditando(persona)
    setForm({
      nombre:           persona.nombre,
      ci:               persona.ci,
      telefono:         persona.telefono ?? '',
      codigo_seguridad: '',  // no se pre-rellena por seguridad
      id_nino:          String(persona.id_nino),
    })
    setMsg(null)
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setEditando(null)
    setForm(FORM_INICIAL)
    setMsg(null)
  }

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleGuardar = async () => {
    if (!form.nombre || !form.ci || !form.id_nino) {
      setMsg({ tipo: 'err', texto: 'Nombre, CI y niño son obligatorios.' })
      return
    }
    if (!editando && !form.codigo_seguridad) {
      setMsg({ tipo: 'err', texto: 'El código de seguridad es obligatorio.' })
      return
    }
    setGuardando(true)
    setMsg(null)
    try {
      const payload = { ...form }
      if (editando && !payload.codigo_seguridad) delete payload.codigo_seguridad

      if (editando) {
        await editarPersonaAutorizada(editando.id_persona, payload)
      } else {
        await crearPersonaAutorizada(payload)
      }
      cargarDatos()
      cerrarModal()
    } catch (err) {
      const detail = err.response?.data?.detail ||
        Object.values(err.response?.data ?? {})[0]?.[0] ||
        'Error al guardar.'
      setMsg({ tipo: 'err', texto: detail })
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar esta persona autorizada?')) return
    await eliminarPersonaAutorizada(id)
    cargarDatos()
  }

  const handleVerificar = async () => {
    if (!verificar.ci || !verificar.codigo_seguridad) return
    setVerificando(true)
    setResultado(null)
    try {
      const { data } = await verificarPersona(verificar)
      setResultado({ ok: true, ...data })
    } catch {
      setResultado({ ok: false })
    } finally {
      setVerificando(false)
    }
  }

  const nombreNino = (id_nino) => {
    const n = ninos.find(n => n.id_nino === id_nino)
    return n?.nombre ?? '—'
  }

  return (
    <div className={styles.page}>

      {/* Encabezado */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Personas autorizadas</h1>
        {tab === 'lista' && (
          <button className={styles.btnPrimary} onClick={abrirCrear}>
            + Nueva persona
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'lista' ? styles.active : ''}`}
          onClick={() => setTab('lista')}
        >
          Lista
        </button>
        <button
          className={`${styles.tab} ${tab === 'verificar' ? styles.active : ''}`}
          onClick={() => { setTab('verificar'); setResultado(null) }}
        >
          Verificar identidad
        </button>
      </div>

      {/* ── TAB LISTA ── */}
      {tab === 'lista' && (
        <>
          <div className={styles.filters}>
            <input
              type="text"
              placeholder="Buscar por nombre o CI..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className={styles.searchInput}
            />
            <select
              value={filtroNino}
              onChange={e => setFiltroNino(e.target.value)}
              className={styles.select}
            >
              <option value="">Todos los niños</option>
              {ninos.map(n => (
                <option key={n.id_nino} value={String(n.id_nino)}>
                  {n.nombre}
                </option>
              ))}
            </select>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
              {personasFiltradas.length} resultado{personasFiltradas.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>CI</th>
                  <th>Teléfono</th>
                  <th>Niño autorizado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} className={styles.empty}>Cargando...</td></tr>
                )}
                {!loading && !personasFiltradas.length && (
                  <tr>
                    <td colSpan={5} className={styles.empty}>
                      No se encontraron personas autorizadas.
                    </td>
                  </tr>
                )}
                {personasFiltradas.map(p => (
                  <tr key={p.id_persona}>
                    <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                    <td>{p.ci}</td>
                    <td>{p.telefono ?? '—'}</td>
                    <td>
                      <span className={styles.ninoBadge}>
                        ◉ {p.nino_nombre ?? nombreNino(p.id_nino)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.btnIcon}
                          onClick={() => abrirEditar(p)}
                        >
                          Editar
                        </button>
                        <button
                          className={styles.btnDanger}
                          onClick={() => handleEliminar(p.id_persona)}
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

      {/* ── TAB VERIFICAR ── */}
      {tab === 'verificar' && (
        <div className={styles.verificarCard}>
          <div>
            <p className={styles.verificarTitle}>Verificar identidad</p>
            <p className={styles.verificarDesc}>
              Ingresá el CI y el código de seguridad para confirmar
              si una persona está autorizada a recoger a un niño.
            </p>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.label}>Cédula de identidad</label>
              <input
                type="text"
                placeholder="CI de la persona"
                value={verificar.ci}
                onChange={e => setVerificar(p => ({ ...p, ci: e.target.value }))}
                className={styles.input}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Código de seguridad</label>
              <input
                type="password"
                placeholder="Código"
                value={verificar.codigo_seguridad}
                onChange={e => setVerificar(p => ({ ...p, codigo_seguridad: e.target.value }))}
                className={styles.input}
              />
            </div>
          </div>

          <button
            className={styles.btnPrimary}
            onClick={handleVerificar}
            disabled={verificando || !verificar.ci || !verificar.codigo_seguridad}
            style={{ alignSelf: 'flex-start' }}
          >
            {verificando ? 'Verificando...' : 'Verificar'}
          </button>

          {resultado?.ok && (
            <div className={styles.resultadoOk}>
              <span className={styles.resultadoLabel}>✓ Autorizado</span>
              <span className={styles.resultadoNombre}>{resultado.nombre}</span>
              <span className={styles.resultadoNino}>
                Autorizado para recoger a: <strong>{resultado.nino}</strong>
              </span>
            </div>
          )}

          {resultado && !resultado.ok && (
            <div className={styles.resultadoErr}>
              <span className={styles.resultadoLabel}>✗ No autorizado</span>
              <span className={styles.resultadoNombre}>Identidad no verificada</span>
              <span className={styles.resultadoNino}>
                CI o código de seguridad incorrectos.
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL CREAR / EDITAR ── */}
      {modalAbierto && (
        <div className={styles.overlay} onClick={cerrarModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>

            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                {editando ? 'Editar persona autorizada' : 'Nueva persona autorizada'}
              </span>
              <button className={styles.btnClose} onClick={cerrarModal}>✕</button>
            </div>

            <div className={styles.modalBody}>

              {msg && (
                <div className={msg.tipo === 'ok' ? styles.msgOk : styles.msgErr}>
                  {msg.texto}
                </div>
              )}

              <div className={styles.formGrid}>
                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Nombre completo *</label>
                  <input
                    name="nombre" value={form.nombre}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Nombre de la persona"
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>CI *</label>
                  <input
                    name="ci" value={form.ci}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Cédula de identidad"
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Teléfono</label>
                  <input
                    name="telefono" value={form.telefono}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Número de contacto"
                  />
                </div>

                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>
                    Código de seguridad {!editando && '*'}
                  </label>
                  <input
                    name="codigo_seguridad"
                    type="password"
                    value={form.codigo_seguridad}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder={editando ? 'Dejar vacío para no cambiar' : 'Código para verificar identidad'}
                  />
                </div>

                <div className={`${styles.formField} ${styles.full}`}>
                  <label className={styles.label}>Niño autorizado *</label>
                  <select
                    name="id_nino"
                    value={form.id_nino}
                    onChange={handleChange}
                    className={styles.input}
                  >
                    <option value="">— Seleccioná un niño —</option>
                    {ninos.map(n => (
                      <option key={n.id_nino} value={String(n.id_nino)}>
                        {n.nombre} ({n.edad} años)
                      </option>
                    ))}
                  </select>
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
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}