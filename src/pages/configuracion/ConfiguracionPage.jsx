import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { actualizarGuarderia } from '../../api/guarderiaApi'

const s = {
  page:  { display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 },
  title: { fontSize: 22, fontWeight: 600, color: 'var(--color-text)' },
  card: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: 24,
    display: 'flex', flexDirection: 'column', gap: 20,
  },
  cardTitle: { fontSize: 15, fontWeight: 600, color: 'var(--color-text)', paddingBottom: 12, borderBottom: '1px solid var(--color-border)' },
  grid2:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  field:  { display: 'flex', flexDirection: 'column', gap: 6 },
  full:   { gridColumn: '1 / -1' },
  label:  { fontSize: 13, fontWeight: 500, color: 'var(--color-text)' },
  input: {
    padding: '9px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 14, color: 'var(--color-text)',
    background: 'var(--color-bg)', outline: 'none',
    fontFamily: 'inherit',
  },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  btnPrimary: {
    padding: '9px 20px', background: 'var(--color-primary)',
    color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
    fontSize: 14, fontWeight: 500, cursor: 'pointer',
  },
  msgOk: {
    padding: '10px 14px', background: '#EAF3DE',
    border: '1px solid #97C459', borderRadius: 'var(--radius-sm)',
    fontSize: 13, color: '#3B6D11',
  },
  msgErr: {
    padding: '10px 14px', background: '#FCEBEB',
    border: '1px solid #F09595', borderRadius: 'var(--radius-sm)',
    fontSize: 13, color: '#A32D2D',
  },
  infoBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '6px 12px',
    background: '#E1F5EE', border: '1px solid #5DCAA5',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13, color: '#0F6E56', fontWeight: 500,
  },
}

export default function ConfiguracionPage() {
  const { guarderia, refrescarGuarderia } = useAuth()

  const [form, setForm] = useState({
    nombre:    guarderia?.nombre    ?? '',
    direccion: guarderia?.direccion ?? '',
    telefono:  guarderia?.telefono  ?? '',
    email:     guarderia?.email     ?? '',
    logo:      guarderia?.logo      ?? '',
  })
  const [guardando, setGuardando] = useState(false)
  const [msg,       setMsg]       = useState(null)

  if (!guarderia) {
    return <div style={{ padding: 40, color: 'var(--color-text-muted)' }}>Cargando...</div>
  }

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleGuardar = async () => {
    if (!form.nombre.trim()) {
      setMsg({ tipo: 'err', texto: 'El nombre de la guardería es obligatorio.' })
      return
    }
    setGuardando(true)
    setMsg(null)
    try {
      await actualizarGuarderia(guarderia.id_guarderia, form)
      await refrescarGuarderia()
      setMsg({ tipo: 'ok', texto: 'Configuración guardada correctamente.' })
    } catch (err) {
      const detail = err.response?.data?.detail ||
        Object.values(err.response?.data ?? {})[0]?.[0] ||
        'Error al guardar.'
      setMsg({ tipo: 'err', texto: detail })
    } finally {
      setGuardando(false)
      setTimeout(() => setMsg(null), 3500)
    }
  }

  return (
    <div style={s.page}>
      <h1 style={s.title}>Configuración de la guardería</h1>

      {msg && (
        <div style={msg.tipo === 'ok' ? s.msgOk : s.msgErr}>{msg.texto}</div>
      )}

      {/* ID de la guardería */}
      <div style={s.card}>
        <div style={s.cardTitle}>Información del sistema</div>
        <div>
          <span style={s.infoBadge}>
            🏫 Guardería ID: {guarderia.id_guarderia}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
          Este es el identificador único de tu guardería en el sistema. No se puede cambiar.
        </p>
      </div>

      {/* Datos generales */}
      <div style={s.card}>
        <div style={s.cardTitle}>Datos generales</div>

        <div style={s.grid2}>
          <div style={{ ...s.field, ...s.full }}>
            <label style={s.label}>Nombre de la guardería *</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              style={s.input}
              placeholder="Nombre de tu guardería"
            />
          </div>

          <div style={{ ...s.field, ...s.full }}>
            <label style={s.label}>Dirección</label>
            <input
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              style={s.input}
              placeholder="Dirección completa"
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Teléfono</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              style={s.input}
              placeholder="+591 000 0000"
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Email de contacto</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              style={s.input}
              placeholder="info@guarderia.com"
            />
          </div>

          <div style={{ ...s.field, ...s.full }}>
            <label style={s.label}>URL del logo</label>
            <input
              name="logo"
              value={form.logo}
              onChange={handleChange}
              style={s.input}
              placeholder="https://..."
            />
            {form.logo && (
              <img
                src={form.logo}
                alt="Logo"
                style={{ width: 80, height: 80, objectFit: 'contain', marginTop: 8, borderRadius: 8 }}
                onError={e => e.target.style.display = 'none'}
              />
            )}
          </div>
        </div>

        <div style={s.actions}>
          <button
            style={{ ...s.btnPrimary, opacity: guardando ? .6 : 1 }}
            onClick={handleGuardar}
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}