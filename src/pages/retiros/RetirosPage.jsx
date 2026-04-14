import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import RetiroForm from './RetiroForm'
import RetirosList from './RetirosList'
import { ninosService } from '../../services/ninosService'

const waitForUi = () => new Promise((resolve) => setTimeout(resolve, 0))

export default function RetirosPage() {
    const [retiros, setRetiros] = useState([])
    const [ninos, setNinos] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingNinos, setLoadingNinos] = useState(false)
    const [search, setSearch] = useState('')
    const [selectedNino, setSelectedNino] = useState('')
    const [modalOpen, setModalOpen] = useState(false)

    useEffect(() => {
        cargarNinos()
        cargarRetirosGlobal()
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

    const cargarRetirosGlobal = async () => {
        try {
            setLoading(true)

            const dataNinos = await ninosService.listar()
            const listaNinos = Array.isArray(dataNinos) ? dataNinos : dataNinos.results || []

            const resultados = await Promise.allSettled(
                listaNinos.map((nino) => ninosService.obtenerRetiros(nino.id_nino))
            )

            const retirosUnificados = resultados.flatMap((resultado) => {
                if (resultado.status === 'fulfilled') {
                    const value = resultado.value
                    return Array.isArray(value) ? value : value.results || []
                }
                return []
            })

            retirosUnificados.sort((a, b) => {
                const fechaA = new Date(a.fecha_hora_retiro || 0).getTime()
                const fechaB = new Date(b.fecha_hora_retiro || 0).getTime()
                return fechaB - fechaA
            })

            setRetiros(retirosUnificados)
        } catch (error) {
            console.error('❌ Error cargando retiros:', error)
            await mostrarError(extraerMensajeError(error, 'No se pudieron cargar los retiros.'))
        } finally {
            setLoading(false)
        }
    }

    const cargarRetirosPorNino = async (idNino) => {
        try {
            setLoading(true)
            const data = await ninosService.obtenerRetiros(idNino)
            const lista = Array.isArray(data) ? data : data.results || []
            setRetiros(lista)
        } catch (error) {
            console.error('❌ Error cargando retiros por niño:', error)
            await mostrarError(extraerMensajeError(error, 'No se pudieron cargar los retiros.'))
        } finally {
            setLoading(false)
        }
    }

    const abrirCrear = () => {
        setModalOpen(true)
    }

    const cerrarModal = () => {
        setModalOpen(false)
    }

    const handleFiltroNino = async (value) => {
        setSelectedNino(value)

        if (!value) {
            await cargarRetirosGlobal()
            return
        }

        await cargarRetirosPorNino(value)
    }

    const handleSuccess = async (_, idNino) => {
        await waitForUi()

        // Si actualmente estoy viendo "Todos los niños"
        // mantengo esa vista y solo recargo todo
        if (!selectedNino) {
            await cargarRetirosGlobal()
            return
        }

        // Si estoy filtrando por un niño específico,
        // mantengo el filtro actual
        await cargarRetirosPorNino(selectedNino)
    }

    const verDetalle = async (retiro) => {
        await Swal.fire({
            title: 'Detalle del retiro',
            html: `
                <div style="text-align:left;font-size:14px;line-height:1.7">
                    <p><strong>Niño:</strong> ${retiro.nino_nombre || '-'}</p>
                    <p><strong>Persona autorizada:</strong> ${retiro.persona_nombre || '-'}</p>
                    <p><strong>CI:</strong> ${retiro.persona_ci || '-'}</p>
                    <p><strong>Fecha y hora:</strong> ${
                retiro.fecha_hora_retiro
                    ? new Date(retiro.fecha_hora_retiro).toLocaleString()
                    : '-'
            }</p>
                    <p><strong>Código usado:</strong> ${retiro.codigo_seguridad_usado || '-'}</p>
                    <p><strong>Observación:</strong> ${retiro.observacion || 'Sin observación'}</p>
                    <p><strong>Registrado por:</strong> ${retiro.registrado_por_nombre || 'Sistema'}</p>
                </div>
            `,
            confirmButtonColor: '#2563eb',
            width: 620,
            customClass: {
                container: 'swal-top-layer',
            },
        })
    }

    const retirosFiltrados = useMemo(() => {
        const texto = search.trim().toLowerCase()
        if (!texto) return retiros

        return retiros.filter((retiro) => {
            const nino = retiro.nino_nombre?.toLowerCase() || ''
            const persona = retiro.persona_nombre?.toLowerCase() || ''
            const ci = retiro.persona_ci?.toLowerCase() || ''
            const codigo = retiro.codigo_seguridad_usado?.toLowerCase() || ''

            return (
                nino.includes(texto) ||
                persona.includes(texto) ||
                ci.includes(texto) ||
                codigo.includes(texto)
            )
        })
    }, [retiros, search])

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Gestión de Retiros</h2>
                    <p style={styles.subtitle}>
                        Verifica personas autorizadas y registra la salida de los niños.
                    </p>
                </div>

                <button onClick={abrirCrear} style={styles.primaryButton}>
                    + Registrar Retiro
                </button>
            </div>

            <div style={styles.toolbar}>
                <input
                    type="text"
                    placeholder="Buscar por niño, persona, CI o código..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={styles.searchInput}
                />

                <select
                    value={selectedNino}
                    onChange={(e) => handleFiltroNino(e.target.value)}
                    style={styles.filterSelect}
                    disabled={loadingNinos}
                >
                    <option value="">
                        {loadingNinos ? 'Cargando niños...' : 'Todos los niños'}
                    </option>
                    {ninos.map((nino) => (
                        <option key={nino.id_nino} value={nino.id_nino}>
                            {nino.nombre}
                        </option>
                    ))}
                </select>
            </div>

            <RetirosList
                retiros={retirosFiltrados}
                loading={loading}
                onVerDetalle={verDetalle}
            />

            <RetiroForm
                open={modalOpen}
                onClose={cerrarModal}
                onSuccess={handleSuccess}
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
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
    },
    searchInput: {
        flex: 1,
        minWidth: 260,
        padding: '12px 14px',
        borderRadius: 12,
        border: '1px solid #d1d5db',
        outline: 'none',
        fontSize: 14,
        background: '#fff',
    },
    filterSelect: {
        minWidth: 240,
        padding: '12px 14px',
        borderRadius: 12,
        border: '1px solid #d1d5db',
        outline: 'none',
        fontSize: 14,
        background: '#fff',
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
}