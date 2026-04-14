import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import SaludForm from './SaludForm'
import { saludService } from '../../services/saludService'

const waitForUi = () => new Promise((resolve) => setTimeout(resolve, 0))

function EditIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
                d="M4 20H8L18.5 9.5C19.3 8.7 19.3 7.3 18.5 6.5L17.5 5.5C16.7 4.7 15.3 4.7 14.5 5.5L4 16V20Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function DeleteIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 6H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M8 6V4C8 3.4 8.4 3 9 3H15C15.6 3 16 3.4 16 4V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M19 6L18.3 18.1C18.2 19.2 17.3 20 16.2 20H7.8C6.7 20 5.8 19.2 5.7 18.1L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M10 11V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M14 11V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    )
}

function EyeIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
                d="M2 12C3.8 8.5 7.4 6 12 6C16.6 6 20.2 8.5 22 12C20.2 15.5 16.6 18 12 18C7.4 18 3.8 15.5 2 12Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
        </svg>
    )
}

export default function SaludList() {
    const [registros, setRegistros] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingDetalle, setLoadingDetalle] = useState(false)
    const [search, setSearch] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedRegistro, setSelectedRegistro] = useState(null)

    useEffect(() => {
        cargarRegistros()
    }, [])

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
            title: 'Éxito',
            text: mensaje,
            confirmButtonColor: '#2563eb',
            customClass: {
                container: 'swal-top-layer',
            },
        })
    }

    const extraerMensajeError = (error) => {
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

            return texto || 'Ocurrió un error al guardar el registro.'
        }

        if (data?.detail) {
            return data.detail
        }

        if (data && typeof data === 'object') {
            const firstKey = Object.keys(data)[0]
            const firstValue = data[firstKey]

            if (Array.isArray(firstValue)) {
                return firstValue[0]
            }

            if (typeof firstValue === 'string') {
                return firstValue
            }
        }

        return 'Ocurrió un error al guardar el registro.'
    }

    const cargarRegistros = async () => {
        try {
            setLoading(true)
            const data = await saludService.listar()
            const lista = Array.isArray(data) ? data : data.results || []

            setRegistros(lista)
        } catch (error) {
            console.error('❌ Error cargando salud:', error)
            await mostrarError(extraerMensajeError(error))
        } finally {
            setLoading(false)
        }
    }

    const abrirCrear = () => {
        setSelectedRegistro(null)
        setModalOpen(true)
    }

    const abrirEditar = async (registro) => {
        try {
            setLoadingDetalle(true)
            const detalle = await saludService.obtenerPorId(registro.id_salud)
            setSelectedRegistro(detalle)
            setModalOpen(true)
        } catch (error) {
            console.error('❌ Error cargando detalle salud:', error)
            await mostrarError(extraerMensajeError(error))
        } finally {
            setLoadingDetalle(false)
        }
    }

    const verDetalle = async (registro) => {
        await Swal.fire({
            title: 'Detalle médico',
            html: `
                <div style="text-align:left;font-size:14px;line-height:1.7">
                    <p><strong>Niño:</strong> ${registro.nino_nombre || '-'}</p>
                    <p><strong>Fecha:</strong> ${registro.fecha || '-'}</p>
                    <p><strong>Síntomas:</strong> ${registro.sintomas || '-'}</p>
                    <p><strong>Observaciones:</strong> ${registro.observaciones || 'Sin observaciones'}</p>
                    <p><strong>Estado:</strong> ${registro.activo ? 'Activo' : 'Inactivo'}</p>
                </div>
            `,
            confirmButtonColor: '#2563eb',
            width: 620,
            customClass: {
                container: 'swal-top-layer',
            },
        })
    }

    const cerrarModal = () => {
        setModalOpen(false)
        setSelectedRegistro(null)
    }

    const guardarRegistro = async (payload, id) => {
        try {
            let mensajeExito = ''

            if (id) {
                await saludService.actualizar(id, payload)
                mensajeExito = 'Registro médico actualizado correctamente'
            } else {
                await saludService.crear(payload)
                mensajeExito = 'Registro médico creado correctamente'
            }

            cerrarModal()
            await cargarRegistros()
            await waitForUi()
            await mostrarExito(mensajeExito)
        } catch (error) {
            console.error('❌ Error guardando salud:', error)
            await mostrarError(extraerMensajeError(error))
            throw error
        }
    }

    const eliminarRegistro = async (id) => {
        const result = await Swal.fire({
            icon: 'warning',
            title: '¿Eliminar registro?',
            text: 'Esta acción no se puede deshacer.',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            customClass: {
                container: 'swal-top-layer',
            },
        })

        if (!result.isConfirmed) return

        try {
            await saludService.eliminar(id)

            await waitForUi()
            await Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'El registro médico fue eliminado correctamente.',
                confirmButtonColor: '#2563eb',
                customClass: {
                    container: 'swal-top-layer',
                },
            })

            await cargarRegistros()
        } catch (error) {
            console.error('❌ Error eliminando salud:', error)
            await mostrarError(extraerMensajeError(error))
        }
    }

    const registrosFiltrados = useMemo(() => {
        const texto = search.trim().toLowerCase()
        if (!texto) return registros

        return registros.filter((registro) => {
            const nombre = registro.nino_nombre?.toLowerCase() || ''
            const sintomas = registro.sintomas?.toLowerCase() || ''
            const fecha = registro.fecha?.toLowerCase() || ''

            return (
                nombre.includes(texto) ||
                sintomas.includes(texto) ||
                fecha.includes(texto)
            )
        })
    }, [registros, search])

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Gestión de Salud</h2>
                    <p style={styles.subtitle}>
                        Administra síntomas y observaciones médicas de los niños.
                    </p>
                </div>

                <button onClick={abrirCrear} style={styles.primaryButton}>
                    + Añadir Registro
                </button>
            </div>

            <div style={styles.toolbar}>
                <input
                    type="text"
                    placeholder="Buscar por niño, fecha o síntomas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={styles.searchInput}
                />
            </div>

            <div style={styles.card}>
                {loading ? (
                    <div style={styles.emptyState}>Cargando registros...</div>
                ) : registrosFiltrados.length === 0 ? (
                    <div style={styles.emptyState}>No se encontraron registros de salud.</div>
                ) : (
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                            <tr>
                                <th style={styles.th}>Niño</th>
                                <th style={styles.th}>Fecha</th>
                                <th style={styles.th}>Síntomas</th>
                                <th style={styles.th}>Estado</th>
                                <th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {registrosFiltrados.map((registro) => (
                                <tr key={registro.id_salud}>
                                    <td style={styles.td}>{registro.nino_nombre}</td>
                                    <td style={styles.td}>{registro.fecha || '-'}</td>
                                    <td style={styles.td}>{registro.sintomas || '-'}</td>
                                    <td style={styles.td}>
                                            <span
                                                style={{
                                                    ...styles.badge,
                                                    backgroundColor: registro.activo ? '#dcfce7' : '#fee2e2',
                                                    color: registro.activo ? '#166534' : '#991b1b',
                                                }}
                                            >
                                                {registro.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                    </td>
                                    <td style={{ ...styles.td, textAlign: 'center' }}>
                                        <div style={styles.actions}>
                                            <button
                                                onClick={() => abrirEditar(registro)}
                                                style={styles.iconButton}
                                                disabled={loadingDetalle}
                                                title="Editar registro"
                                            >
                                                <EditIcon />
                                            </button>

                                            <button
                                                onClick={() => verDetalle(registro)}
                                                style={{ ...styles.iconButton, color: '#0ea5e9' }}
                                                title="Ver detalle"
                                            >
                                                <EyeIcon />
                                            </button>

                                            <button
                                                onClick={() => eliminarRegistro(registro.id_salud)}
                                                style={{ ...styles.iconButton, color: '#dc2626' }}
                                                title="Eliminar registro"
                                            >
                                                <DeleteIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <SaludForm
                open={modalOpen}
                registro={selectedRegistro}
                onClose={cerrarModal}
                onSubmit={guardarRegistro}
            />
        </div>
    )
}

const styles = {
    page: {
        padding: 24,
        background: '#f8fafc',
        minHeight: '100vh',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    title: {
        margin: 0,
        fontSize: 28,
        fontWeight: 700,
        color: '#0f172a',
    },
    subtitle: {
        margin: '6px 0 0',
        color: '#64748b',
        fontSize: 14,
    },
    toolbar: {
        marginBottom: 16,
    },
    searchInput: {
        width: '100%',
        maxWidth: 420,
        padding: '12px 14px',
        borderRadius: 12,
        border: '1px solid #d1d5db',
        outline: 'none',
        fontSize: 14,
        background: '#fff',
    },
    card: {
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
    },
    tableWrapper: {
        width: '100%',
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        minWidth: 900,
    },
    th: {
        textAlign: 'left',
        padding: '14px 16px',
        background: '#f8fafc',
        color: '#334155',
        fontSize: 13,
        fontWeight: 700,
        borderBottom: '1px solid #e5e7eb',
    },
    td: {
        padding: '14px 16px',
        borderBottom: '1px solid #f1f5f9',
        color: '#0f172a',
        fontSize: 14,
        verticalAlign: 'middle',
    },
    badge: {
        display: 'inline-block',
        padding: '6px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
    },
    actions: {
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: 10,
        border: '1px solid #e5e7eb',
        background: '#fff',
        color: '#2563eb',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
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
    emptyState: {
        padding: 28,
        textAlign: 'center',
        color: '#64748b',
        fontSize: 15,
    },
}