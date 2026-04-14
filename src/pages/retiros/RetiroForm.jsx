import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { ninosService } from '../../services/ninosService'
import { personasAutorizadasService } from '../../services/personasAutorizadasService'

const initialForm = {
    id_nino: '',
    ci: '',
    codigo_seguridad: '',
    observacion: '',
}

export default function RetiroForm({ open, onClose, onSuccess }) {
    const [form, setForm] = useState(initialForm)
    const [saving, setSaving] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [errors, setErrors] = useState({})
    const [ninos, setNinos] = useState([])
    const [personas, setPersonas] = useState([])
    const [verificacion, setVerificacion] = useState(null)
    const [loadingNinos, setLoadingNinos] = useState(false)
    const [loadingPersonas, setLoadingPersonas] = useState(false)

    useEffect(() => {
        if (open) {
            cargarNinos()
            resetForm()
        }
    }, [open])

    useEffect(() => {
        if (!open) return

        if (form.id_nino) {
            cargarPersonas(form.id_nino)
        } else {
            setPersonas([])
        }

        setVerificacion(null)
    }, [form.id_nino, open])

    const resetForm = () => {
        setForm(initialForm)
        setErrors({})
        setSaving(false)
        setVerifying(false)
        setVerificacion(null)
        setPersonas([])
    }

    const mostrarError = async (mensaje) => {
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: mensaje,
            confirmButtonColor: '#dc2626',
            customClass: {
                container: 'swal-top-layer',
            },
        })
    }

    const mostrarExito = async (mensaje) => {
        await Swal.fire({
            icon: 'success',
            title: 'Retiro registrado',
            text: mensaje,
            confirmButtonColor: '#2563eb',
            customClass: {
                container: 'swal-top-layer',
            },
        })
    }

    const extraerMensajeError = (error, fallback = 'Ocurrió un error.') => {
        const data = error?.response?.data
        const status = error?.response?.status

        if (status === 500) {
            return 'Error interno del servidor. Revisa el backend.'
        }

        if (typeof data === 'string') {
            const texto = data.trim()
            if (texto.startsWith('<!DOCTYPE html') || texto.startsWith('<html')) {
                return 'Error interno del servidor. El backend devolvió una página HTML.'
            }
            return texto || fallback
        }

        if (data?.detail) return data.detail

        if (data && typeof data === 'object') {
            const firstKey = Object.keys(data)[0]
            const firstValue = data[firstKey]

            if (Array.isArray(firstValue)) return firstValue[0]
            if (typeof firstValue === 'string') return firstValue
        }

        return fallback
    }

    const cargarNinos = async () => {
        try {
            setLoadingNinos(true)
            const data = await ninosService.listar()
            setNinos(Array.isArray(data) ? data : data.results || [])
        } catch (error) {
            console.error('❌ Error cargando niños:', error)
            await mostrarError(extraerMensajeError(error, 'No se pudieron cargar los niños.'))
        } finally {
            setLoadingNinos(false)
        }
    }

    const cargarPersonas = async (idNino) => {
        try {
            setLoadingPersonas(true)
            const data = await personasAutorizadasService.listarPorNino(idNino)
            setPersonas(Array.isArray(data) ? data : data.results || [])
        } catch (error) {
            console.error('❌ Error cargando personas autorizadas:', error)
            setPersonas([])
            await mostrarError(
                extraerMensajeError(error, 'No se pudieron cargar las personas autorizadas.')
            )
        } finally {
            setLoadingPersonas(false)
        }
    }

    if (!open) return null

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }))

        setErrors((prev) => ({
            ...prev,
            [name]: '',
        }))

        if (name === 'ci' || name === 'codigo_seguridad') {
            setVerificacion(null)
        }
    }

    const validate = () => {
        const newErrors = {}

        if (!form.id_nino) {
            newErrors.id_nino = 'Debes seleccionar un niño.'
        }

        if (!form.ci.trim()) {
            newErrors.ci = 'El CI es obligatorio.'
        }

        if (!form.codigo_seguridad.trim()) {
            newErrors.codigo_seguridad = 'El código de seguridad es obligatorio.'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleUsarPersona = (persona) => {
        setForm((prev) => ({
            ...prev,
            ci: persona.ci || '',
            codigo_seguridad: persona.codigo_seguridad || '',
        }))
        setVerificacion(null)
    }

    const handleVerificar = async () => {
        if (!validate()) return

        try {
            setVerifying(true)

            const data = await personasAutorizadasService.verificar({
                id_nino: Number(form.id_nino),
                ci: form.ci.trim(),
                codigo_seguridad: form.codigo_seguridad.trim(),
            })

            setVerificacion(data)
        } catch (error) {
            console.error('❌ Error verificando autorización:', error)
            setVerificacion(null)
            await mostrarError(
                extraerMensajeError(error, 'No se pudo verificar la autorización.')
            )
        } finally {
            setVerifying(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validate()) return

        try {
            setSaving(true)

            const idNinoActual = Number(form.id_nino)

            const response = await ninosService.registrarRetiro(form.id_nino, {
                ci: form.ci.trim(),
                codigo_seguridad: form.codigo_seguridad.trim(),
                observacion: form.observacion.trim(),
            })

            const enviados = response?.correo?.enviados || 0
            const mensajeExito =
                enviados > 0
                    ? `${response?.detail || 'El retiro fue registrado correctamente.'} Se notificó por correo a ${enviados} tutor(es).`
                    : response?.detail || 'El retiro fue registrado correctamente.'

            resetForm()
            onClose()

            if (onSuccess) {
                await onSuccess(response, idNinoActual)
            }

            setTimeout(() => {
                mostrarExito(mensajeExito)
            }, 300)
        } catch (error) {
            console.error('❌ Error registrando retiro:', error)
            await mostrarError(
                extraerMensajeError(error, 'No se pudo registrar el retiro.')
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <div>
                        <h3 style={styles.title}>Registrar Retiro</h3>
                        <p style={styles.subtitle}>
                            Verifica la identidad de la persona autorizada y registra la salida del niño.
                        </p>
                    </div>

                    <button onClick={onClose} style={styles.closeButton} type="button">
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={styles.grid}>
                        <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
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
                            <label style={styles.label}>CI *</label>
                            <input
                                type="text"
                                name="ci"
                                value={form.ci}
                                onChange={handleChange}
                                style={inputStyle(errors.ci)}
                                placeholder="Ej. 1234567"
                            />
                            {errors.ci && <span style={styles.error}>{errors.ci}</span>}
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Código de seguridad *</label>
                            <input
                                type="text"
                                name="codigo_seguridad"
                                value={form.codigo_seguridad}
                                onChange={handleChange}
                                style={inputStyle(errors.codigo_seguridad)}
                                placeholder="Ej. COD-1-123"
                            />
                            {errors.codigo_seguridad && (
                                <span style={styles.error}>{errors.codigo_seguridad}</span>
                            )}
                        </div>

                        <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                            <label style={styles.label}>Observación</label>
                            <textarea
                                name="observacion"
                                value={form.observacion}
                                onChange={handleChange}
                                style={{ ...inputStyle(false), minHeight: 100, resize: 'vertical' }}
                                placeholder="Ej. Retirado por su tía. Todo en orden."
                            />
                        </div>
                    </div>

                    <div style={styles.personasCard}>
                        <div style={styles.personasHeader}>
                            <h4 style={styles.personasTitle}>Personas autorizadas del niño</h4>
                            {loadingPersonas && (
                                <span style={styles.personasHint}>Cargando...</span>
                            )}
                        </div>

                        {!form.id_nino ? (
                            <div style={styles.emptyStateMini}>
                                Selecciona un niño para ver sus personas autorizadas.
                            </div>
                        ) : personas.length === 0 ? (
                            <div style={styles.emptyStateMini}>
                                No hay personas autorizadas registradas para este niño.
                            </div>
                        ) : (
                            <div style={styles.personasList}>
                                {personas.map((persona) => (
                                    <div key={persona.id_persona} style={styles.personaItem}>
                                        <div>
                                            <div style={styles.personaNombre}>{persona.nombre}</div>
                                            <div style={styles.personaMeta}>
                                                CI: {persona.ci} · Código: {persona.codigo_seguridad || '—'}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleUsarPersona(persona)}
                                            style={styles.useButton}
                                        >
                                            Usar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {verificacion?.autorizado && (
                        <div style={styles.successBox}>
                            <div style={styles.successHeader}>
                                <span style={styles.successIcon}>✓</span>
                                <div>
                                    <div style={styles.successTitle}>Persona verificada correctamente</div>
                                    <div style={styles.successSubtitle}>
                                        Ya puedes registrar el retiro con seguridad.
                                    </div>
                                </div>
                            </div>

                            <div style={styles.successGrid}>
                                <div style={styles.successItem}>
                                    <span style={styles.successLabel}>Nombre</span>
                                    <span style={styles.successValue}>{verificacion.nombre}</span>
                                </div>

                                <div style={styles.successItem}>
                                    <span style={styles.successLabel}>CI</span>
                                    <span style={styles.successValue}>{verificacion.ci}</span>
                                </div>

                                <div style={styles.successItem}>
                                    <span style={styles.successLabel}>Teléfono</span>
                                    <span style={styles.successValue}>
                                        {verificacion.telefono || 'Sin teléfono'}
                                    </span>
                                </div>

                                <div style={styles.successItem}>
                                    <span style={styles.successLabel}>Niño</span>
                                    <span style={styles.successValue}>{verificacion.nino}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={styles.actions}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving || verifying}
                            style={styles.secondaryButton}
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            onClick={handleVerificar}
                            disabled={saving || verifying}
                            style={{
                                ...(verificacion?.autorizado ? styles.verifiedButton : styles.warningButton),
                                opacity: saving || verifying ? 0.7 : 1,
                                cursor: saving || verifying ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {verifying
                                ? 'Verificando...'
                                : verificacion?.autorizado
                                    ? 'Verificado ✓'
                                    : 'Verificar'}
                        </button>

                        <button
                            type="submit"
                            disabled={saving || verifying}
                            style={{
                                ...styles.primaryButton,
                                opacity: saving || verifying ? 0.7 : 1,
                                cursor: saving || verifying ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {saving ? 'Registrando...' : 'Registrar Retiro'}
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
        maxWidth: 860,
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 20px 45px rgba(0,0,0,0.18)',
        padding: 24,
        maxHeight: '90vh',
        overflowY: 'auto',
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
    personasCard: {
        marginTop: 18,
        background: '#f8fafc',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: 16,
    },
    personasHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    personasTitle: {
        margin: 0,
        fontSize: 16,
        fontWeight: 700,
        color: '#0f172a',
    },
    personasHint: {
        fontSize: 13,
        color: '#64748b',
    },
    personasList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    personaItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: '12px 14px',
    },
    personaNombre: {
        fontSize: 14,
        fontWeight: 700,
        color: '#0f172a',
        marginBottom: 4,
    },
    personaMeta: {
        fontSize: 13,
        color: '#64748b',
    },
    useButton: {
        border: 'none',
        background: '#2563eb',
        color: '#fff',
        padding: '10px 14px',
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    },
    successBox: {
        marginTop: 18,
        padding: 16,
        borderRadius: 14,
        background: '#dcfce7',
        border: '1px solid #86efac',
    },
    successHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },
    successIcon: {
        width: 34,
        height: 34,
        borderRadius: '50%',
        background: '#16a34a',
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 18,
        flexShrink: 0,
    },
    successTitle: {
        fontSize: 15,
        fontWeight: 700,
        color: '#166534',
        marginBottom: 2,
    },
    successSubtitle: {
        fontSize: 13,
        color: '#166534',
        marginTop: 4,
    },
    successGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 12,
    },
    successItem: {
        background: 'rgba(255,255,255,0.45)',
        border: '1px solid #86efac',
        borderRadius: 12,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    successLabel: {
        fontSize: 12,
        fontWeight: 700,
        color: '#166534',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    successValue: {
        fontSize: 14,
        color: '#14532d',
        fontWeight: 600,
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 24,
        flexWrap: 'wrap',
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
    warningButton: {
        border: 'none',
        background: '#f59e0b',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
    },
    verifiedButton: {
        border: 'none',
        background: '#16a34a',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
    },
    primaryButton: {
        border: 'none',
        background: '#16a34a',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
    },
    emptyStateMini: {
        padding: '12px 8px',
        color: '#64748b',
        fontSize: 14,
        textAlign: 'center',
    },
}