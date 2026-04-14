import { useEffect, useState } from 'react'
import { ninosService } from '../../services/ninosService'

const initialForm = {
    id_nino: '',
    fecha: '',
    sintomas: '',
    observaciones: '',
    activo: true,
}

export default function SaludForm({ open, registro, onClose, onSubmit }) {
    const [form, setForm] = useState(initialForm)
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState({})
    const [ninos, setNinos] = useState([])
    const [loadingNinos, setLoadingNinos] = useState(false)

    useEffect(() => {
        if (open) {
            cargarNinos()
        }
    }, [open])

    useEffect(() => {
        if (registro) {
            setForm({
                id_nino: registro.id_nino || '',
                fecha: registro.fecha || '',
                sintomas: registro.sintomas || '',
                observaciones: registro.observaciones || '',
                activo: registro.activo ?? true,
            })
        } else {
            setForm(initialForm)
        }

        setErrors({})
        setSaving(false)
    }, [registro, open])

    const cargarNinos = async () => {
        try {
            setLoadingNinos(true)
            const data = await ninosService.listar()
            setNinos(Array.isArray(data) ? data : data.results || [])
        } catch (error) {
            console.error('❌ Error cargando niños:', error)
        } finally {
            setLoadingNinos(false)
        }
    }

    if (!open) return null

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))

        setErrors((prev) => ({
            ...prev,
            [name]: '',
        }))
    }

    const validate = () => {
        const newErrors = {}

        if (!form.id_nino) {
            newErrors.id_nino = 'Debes seleccionar un niño.'
        }

        if (!form.fecha) {
            newErrors.fecha = 'La fecha es obligatoria.'
        }

        if (!form.sintomas.trim()) {
            newErrors.sintomas = 'Los síntomas son obligatorios.'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validate()) return

        const payload = {
            id_nino: Number(form.id_nino),
            fecha: form.fecha,
            sintomas: form.sintomas.trim(),
            observaciones: form.observaciones.trim(),
            activo: form.activo,
        }

        try {
            setSaving(true)
            await onSubmit(payload, registro?.id_salud)
        } catch (error) {
            console.error('❌ Error en modal salud:', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <div>
                        <h3 style={styles.title}>
                            {registro ? 'Editar Registro de Salud' : 'Nuevo Registro de Salud'}
                        </h3>
                        <p style={styles.subtitle}>
                            {registro
                                ? 'Actualiza la información médica del niño.'
                                : 'Registra síntomas y observaciones importantes del niño.'}
                        </p>
                    </div>

                    <button onClick={onClose} style={styles.closeButton} type="button">
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={styles.grid}>
                        <div style={styles.field}>
                            <label style={styles.label}>Niño *</label>
                            <select
                                name="id_nino"
                                value={form.id_nino}
                                onChange={handleChange}
                                style={inputStyle(errors.id_nino)}
                                disabled={loadingNinos}
                            >
                                <option value="">
                                    {loadingNinos ? 'Cargando niños...' : 'Selecciona un niño'}
                                </option>
                                {ninos.map((nino) => (
                                    <option key={nino.id_nino} value={nino.id_nino}>
                                        {nino.nombre}
                                    </option>
                                ))}
                            </select>
                            {errors.id_nino && <span style={styles.error}>{errors.id_nino}</span>}
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Fecha *</label>
                            <input
                                type="date"
                                name="fecha"
                                value={form.fecha}
                                onChange={handleChange}
                                style={inputStyle(errors.fecha)}
                            />
                            {errors.fecha && <span style={styles.error}>{errors.fecha}</span>}
                        </div>

                        <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                            <label style={styles.label}>Síntomas *</label>
                            <textarea
                                name="sintomas"
                                value={form.sintomas}
                                onChange={handleChange}
                                style={{ ...inputStyle(errors.sintomas), minHeight: 100, resize: 'vertical' }}
                                placeholder="Ej. Fiebre, tos, dolor de estómago..."
                            />
                            {errors.sintomas && <span style={styles.error}>{errors.sintomas}</span>}
                        </div>

                        <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                            <label style={styles.label}>Observaciones</label>
                            <textarea
                                name="observaciones"
                                value={form.observaciones}
                                onChange={handleChange}
                                style={{ ...inputStyle(false), minHeight: 110, resize: 'vertical' }}
                                placeholder="Ej. Se llamó al tutor, se administró descanso, se observó evolución..."
                            />
                        </div>

                        <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                            <label style={styles.checkboxWrapper}>
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={form.activo}
                                    onChange={handleChange}
                                />
                                <span>Activo</span>
                            </label>
                        </div>
                    </div>

                    <div style={styles.actions}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            style={styles.secondaryButton}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                ...styles.primaryButton,
                                opacity: saving ? 0.7 : 1,
                                cursor: saving ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {saving ? 'Guardando...' : registro ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function inputStyle(hasError) {
    return {
        width: '100%',
        padding: '12px 14px',
        borderRadius: 12,
        border: `1px solid ${hasError ? '#dc2626' : '#d1d5db'}`,
        outline: 'none',
        fontSize: 14,
        background: '#fff',
        boxSizing: 'border-box',
    }
}

const styles = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 1600,
    },
    modal: {
        width: '100%',
        maxWidth: 760,
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 20px 45px rgba(0,0,0,0.18)',
        padding: 24,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 16,
        marginBottom: 20,
    },
    title: {
        margin: 0,
        fontSize: 24,
        fontWeight: 700,
        color: '#0f172a',
    },
    subtitle: {
        margin: '6px 0 0',
        color: '#64748b',
        fontSize: 14,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        border: '1px solid #e5e7eb',
        background: '#fff',
        fontSize: 24,
        lineHeight: 1,
        cursor: 'pointer',
        color: '#334155',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 16,
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: 600,
        color: '#334155',
    },
    error: {
        color: '#dc2626',
        fontSize: 12,
        marginTop: -2,
    },
    checkboxWrapper: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 14,
        fontWeight: 600,
        color: '#334155',
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 24,
    },
    secondaryButton: {
        border: '1px solid #d1d5db',
        background: '#fff',
        color: '#111827',
        padding: '12px 16px',
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
    },
    primaryButton: {
        border: 'none',
        background: '#2563eb',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
    },
}