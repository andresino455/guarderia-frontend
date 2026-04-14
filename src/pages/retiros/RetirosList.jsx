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

export default function RetirosList({ retiros, loading, onVerDetalle }) {
    return (
        <div style={styles.card}>
            {loading ? (
                <div style={styles.emptyState}>Cargando retiros...</div>
            ) : retiros.length === 0 ? (
                <div style={styles.emptyState}>No hay retiros registrados.</div>
            ) : (
                <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                        <thead>
                        <tr>
                            <th style={styles.th}>Niño</th>
                            <th style={styles.th}>Persona autorizada</th>
                            <th style={styles.th}>CI</th>
                            <th style={styles.th}>Fecha / Hora</th>
                            <th style={styles.th}>Código usado</th>
                            <th style={styles.th}>Registrado por</th>
                            <th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {retiros.map((retiro) => (
                            <tr key={retiro.id_retiro}>
                                <td style={styles.td}>{retiro.nino_nombre || '-'}</td>
                                <td style={styles.td}>{retiro.persona_nombre || '-'}</td>
                                <td style={styles.td}>{retiro.persona_ci || '-'}</td>
                                <td style={styles.td}>
                                    {retiro.fecha_hora_retiro
                                        ? new Date(retiro.fecha_hora_retiro).toLocaleString()
                                        : '-'}
                                </td>
                                <td style={styles.td}>
                                        <span style={styles.codeBadge}>
                                            {retiro.codigo_seguridad_usado || '-'}
                                        </span>
                                </td>
                                <td style={styles.td}>{retiro.registrado_por_nombre || 'Sistema'}</td>
                                <td style={{ ...styles.td, textAlign: 'center' }}>
                                    <div style={styles.actions}>
                                        <button
                                            onClick={() => onVerDetalle(retiro)}
                                            style={styles.iconButton}
                                            title="Ver detalle"
                                        >
                                            <EyeIcon />
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
    )
}

const styles = {
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
        minWidth: 1100,
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
    emptyState: {
        padding: 28,
        textAlign: 'center',
        color: '#64748b',
        fontSize: 15,
    },
    codeBadge: {
        display: 'inline-block',
        padding: '6px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        backgroundColor: '#dbeafe',
        color: '#1d4ed8',
    },
}