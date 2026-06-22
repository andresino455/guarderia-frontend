import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import styles from './Registro.module.css'

const FORM_INICIAL = {
  // Guardería
  nombre:    '',
  direccion: '',
  telefono:  '',
  email:     '',
  // Admin
  admin_nombre:   '',
  admin_email:    '',
  admin_password: '',
  admin_password_confirm: '',
}

const PASOS = ['Guardería', 'Administrador', 'Confirmar']

export default function Registro() {
  const { registrar } = useAuth()
  const navigate      = useNavigate()

  const [paso,       setPaso]       = useState(0)
  const [form,       setForm]       = useState(FORM_INICIAL)
  const [errors,     setErrors]     = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError,   setApiError]   = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
    if (apiError)     setApiError(null)
  }

  // ── Validaciones por paso ──────────────────────────────────────────────────
  const validarPaso0 = () => {
    const errs = {}
    if (!form.nombre.trim())
      errs.nombre = 'El nombre de la guardería es obligatorio.'
    return errs
  }

  const validarPaso1 = () => {
    const errs = {}
    if (!form.admin_nombre.trim())
      errs.admin_nombre = 'Tu nombre es obligatorio.'
    if (!form.admin_email.trim())
      errs.admin_email = 'El email es obligatorio.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.admin_email))
      errs.admin_email = 'El email no es válido.'
    if (!form.admin_password)
      errs.admin_password = 'La contraseña es obligatoria.'
    else if (form.admin_password.length < 8)
      errs.admin_password = 'Mínimo 8 caracteres.'
    if (form.admin_password !== form.admin_password_confirm)
      errs.admin_password_confirm = 'Las contraseñas no coinciden.'
    return errs
  }

  const siguiente = () => {
    const validar = paso === 0 ? validarPaso0 : validarPaso1
    const errs    = validar()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setPaso(p => p + 1)
  }

  const atras = () => setPaso(p => p - 1)

  // ── Submit final ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true)
    setApiError(null)

    const payload = {
      nombre:         form.nombre.trim(),
      direccion:      form.direccion.trim(),
      telefono:       form.telefono.trim(),
      email:          form.email.trim(),
      admin_nombre:   form.admin_nombre.trim(),
      admin_email:    form.admin_email.trim(),
      admin_password: form.admin_password,
    }

    const resultado = await registrar(payload)

    if (resultado.ok) {
      navigate('/dashboard')
    } else {
      // Mostrar errores del backend
      const data = resultado.data
      if (typeof data === 'object') {
        // Puede traer errores de campo
        const fieldErrors = {}
        Object.entries(data).forEach(([key, val]) => {
          fieldErrors[key] = Array.isArray(val) ? val[0] : val
        })
        setErrors(fieldErrors)
        // Si hay errores del paso anterior, volver
        if (fieldErrors.nombre) setPaso(0)
        else if (fieldErrors.admin_email || fieldErrors.admin_password) setPaso(1)
      } else {
        setApiError(data?.detail || 'Error al crear la guardería.')
      }
    }

    setSubmitting(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>G</div>
          <h1 className={styles.title}>Crear tu guardería</h1>
          <p className={styles.subtitle}>Configurá tu espacio en minutos</p>
        </div>

        {/* Stepper */}
        <div className={styles.stepper}>
          {PASOS.map((label, i) => (
            <div key={label} className={styles.stepperItem}>
              <div className={`${styles.stepCircle} ${i <= paso ? styles.stepActive : ''} ${i < paso ? styles.stepDone : ''}`}>
                {i < paso ? '✓' : i + 1}
              </div>
              <span className={`${styles.stepLabel} ${i <= paso ? styles.stepLabelActive : ''}`}>
                {label}
              </span>
              {i < PASOS.length - 1 && (
                <div className={`${styles.stepLine} ${i < paso ? styles.stepLineDone : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error global */}
        {apiError && (
          <div className={styles.errorBox}>{apiError}</div>
        )}

        {/* ── Paso 0: Datos de la guardería ── */}
        {paso === 0 && (
          <div className={styles.form}>
            <h2 className={styles.stepTitle}>Datos de la guardería</h2>

            <div className={styles.field}>
              <label className={styles.label}>Nombre de la guardería *</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className={`${styles.input} ${errors.nombre ? styles.inputError : ''}`}
                placeholder="Ej: Jardín Las Margaritas"
                autoFocus
              />
              {errors.nombre && <span className={styles.fieldError}>{errors.nombre}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Dirección</label>
              <input
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                className={styles.input}
                placeholder="Dirección de la guardería"
              />
            </div>

            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>Teléfono</label>
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="+591 000 0000"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email de contacto</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="info@guarderia.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Paso 1: Datos del administrador ── */}
        {paso === 1 && (
          <div className={styles.form}>
            <h2 className={styles.stepTitle}>Tu cuenta de administrador</h2>
            <p className={styles.stepDesc}>
              Con esta cuenta podés gestionar toda la guardería.
            </p>

            <div className={styles.field}>
              <label className={styles.label}>Tu nombre completo *</label>
              <input
                name="admin_nombre"
                value={form.admin_nombre}
                onChange={handleChange}
                className={`${styles.input} ${errors.admin_nombre ? styles.inputError : ''}`}
                placeholder="Nombre completo"
                autoFocus
              />
              {errors.admin_nombre && <span className={styles.fieldError}>{errors.admin_nombre}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email *</label>
              <input
                name="admin_email"
                type="email"
                value={form.admin_email}
                onChange={handleChange}
                className={`${styles.input} ${errors.admin_email ? styles.inputError : ''}`}
                placeholder="tu@email.com"
              />
              {errors.admin_email && <span className={styles.fieldError}>{errors.admin_email}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Contraseña *</label>
              <input
                name="admin_password"
                type="password"
                value={form.admin_password}
                onChange={handleChange}
                className={`${styles.input} ${errors.admin_password ? styles.inputError : ''}`}
                placeholder="Mínimo 8 caracteres"
              />
              {errors.admin_password && <span className={styles.fieldError}>{errors.admin_password}</span>}
              {/* Indicador de fortaleza */}
              {form.admin_password && <PasswordStrength password={form.admin_password} />}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Confirmar contraseña *</label>
              <input
                name="admin_password_confirm"
                type="password"
                value={form.admin_password_confirm}
                onChange={handleChange}
                className={`${styles.input} ${errors.admin_password_confirm ? styles.inputError : ''}`}
                placeholder="Repetí la contraseña"
              />
              {errors.admin_password_confirm && (
                <span className={styles.fieldError}>{errors.admin_password_confirm}</span>
              )}
            </div>
          </div>
        )}

        {/* ── Paso 2: Confirmación ── */}
        {paso === 2 && (
          <div className={styles.form}>
            <h2 className={styles.stepTitle}>Todo listo</h2>
            <p className={styles.stepDesc}>Revisá los datos antes de crear tu guardería.</p>

            <div className={styles.resumen}>
              <div className={styles.resumenSection}>
                <span className={styles.resumenIcon}>🏫</span>
                <div>
                  <div className={styles.resumenLabel}>Guardería</div>
                  <div className={styles.resumenValue}>{form.nombre}</div>
                  {form.direccion && <div className={styles.resumenMeta}>{form.direccion}</div>}
                  {form.telefono  && <div className={styles.resumenMeta}>{form.telefono}</div>}
                </div>
              </div>

              <div className={styles.resumenDivider} />

              <div className={styles.resumenSection}>
                <span className={styles.resumenIcon}>👤</span>
                <div>
                  <div className={styles.resumenLabel}>Administrador</div>
                  <div className={styles.resumenValue}>{form.admin_nombre}</div>
                  <div className={styles.resumenMeta}>{form.admin_email}</div>
                </div>
              </div>
            </div>

            <div className={styles.infoBox}>
              ✓ Se crearán automáticamente los roles: Administrador, Personal y Tutor.
            </div>
          </div>
        )}

        {/* Navegación */}
        <div className={styles.nav}>
          {paso > 0 && (
            <button className={styles.btnSecondary} onClick={atras} disabled={submitting}>
              ← Atrás
            </button>
          )}

          {paso < PASOS.length - 1 ? (
            <button className={styles.btnPrimary} onClick={siguiente}>
              Siguiente →
            </button>
          ) : (
            <button
              className={styles.btnPrimary}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Creando guardería...' : '🚀 Crear guardería'}
            </button>
          )}
        </div>

        <p className={styles.loginLink}>
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  )
}

// ── Indicador de fortaleza de contraseña ────────────────────────────────────
function PasswordStrength({ password }) {
  const checks = {
    longitud:  password.length >= 8,
    mayuscula: /[A-Z]/.test(password),
    minuscula: /[a-z]/.test(password),
    numero:    /\d/.test(password),
  }
  const cumplidos = Object.values(checks).filter(Boolean).length
  const colores   = ['#E24B4A', '#BA7517', '#1D9E75', '#0F6E56']
  const color     = colores[cumplidos - 1] || '#E5E5E5'

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i < cumplidos ? color : '#E5E5E5',
            transition: 'background .3s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
        {[
          [checks.longitud,  '8+ caracteres'],
          [checks.mayuscula, 'Mayúscula'],
          [checks.minuscula, 'Minúscula'],
          [checks.numero,    'Número'],
        ].map(([ok, label]) => (
          <span key={label} style={{
            fontSize: 11,
            color: ok ? '#3B6D11' : '#A32D2D',
          }}>
            {ok ? '✓' : '✕'} {label}
          </span>
        ))}
      </div>
    </div>
  )
}