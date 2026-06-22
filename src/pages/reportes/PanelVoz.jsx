import { useState } from 'react'
import { useGrabadorAudio } from '../../hooks/useGrabadorAudio'
import { procesarVoz } from '../../api/reportesApi'

// Ejemplos de comandos para mostrarle al usuario
const EJEMPLOS = [
  'Mostrar asistencia de hoy',
  'Reporte de pagos pendientes de este mes',
  'Actividades de la semana pasada',
  'Niños activos registrados',
  'Salud — registros de ayer',
  'Asistencia de junio exportar a PDF',
]

export default function PanelVoz({ onComandoInterpretado }) {
  const {  iniciarGrabacion, detenerGrabacion, error: errorMic } = useGrabadorAudio()

  const [estado,   setEstado]   = useState('idle') // idle | grabando | procesando | listo | error
  const [texto,    setTexto]    = useState('')
  const [mensaje,  setMensaje]  = useState('')
  const [tiempoGrabacion, setTiempo] = useState(0)

  // Temporizador mientras graba
  const timerRef = useState(null)

  const handleIniciar = async () => {
    setEstado('grabando')
    setTexto('')
    setMensaje('')

    // Contador de segundos
    let seg = 0
    timerRef[0] = setInterval(() => {
      seg++
      setTiempo(seg)
      // Auto-detener a los 30 segundos
      if (seg >= 30) handleDetener()
    }, 1000)

    await iniciarGrabacion()
  }

  const handleDetener = async () => {
    clearInterval(timerRef[0])
    setTiempo(0)
    setEstado('procesando')

    try {
      const blob = await detenerGrabacion()

      if (!blob || blob.size === 0) {
        setEstado('error')
        setMensaje('No se capturó audio. Intentá de nuevo.')
        return
      }

      const resultado = await procesarVoz(blob)

      setTexto(resultado.texto_original || '')
      setMensaje(resultado.descripcion  || 'Comando interpretado.')
      setEstado('listo')

      // Notificar a la página de reportes
      if (onComandoInterpretado) {
        onComandoInterpretado(resultado)
      }

    } catch (err) {
      setEstado('error')
      const detail = err?.response?.data?.detail || 'Error al procesar el audio.'
      setMensaje(detail)
    }
  }

  const handleReset = () => {
    setEstado('idle')
    setTexto('')
    setMensaje('')
    setTiempo(0)
  }

  return (
    <div style={s.panel}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.icono}>🎙️</span>
          <div>
            <div style={s.titulo}>Reporte por voz</div>
            <div style={s.subtitulo}>Describí el reporte que necesitás</div>
          </div>
        </div>
        {estado === 'listo' && (
          <button style={s.btnReset} onClick={handleReset}>
            Nuevo comando
          </button>
        )}
      </div>

      {/* Área principal */}
      <div style={s.cuerpo}>

        {/* Estado: idle */}
        {estado === 'idle' && (
          <>
            <button style={s.btnGrabar} onClick={handleIniciar}>
              <span style={s.btnIcono}>🎤</span>
              Presioná para hablar
            </button>
            {errorMic && (
              <div style={s.msgErr}>{errorMic}</div>
            )}
            <div style={s.ejemplos}>
              <div style={s.ejemplosTitulo}>Podés decir cosas como:</div>
              <div style={s.ejemplosGrid}>
                {EJEMPLOS.map(e => (
                  <div key={e} style={s.ejemploChip}>"{e}"</div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Estado: grabando */}
        {estado === 'grabando' && (
          <div style={s.grabandoWrap}>
            <div style={s.ondas}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{
                  ...s.onda,
                  animationDelay: `${i * 0.1}s`,
                }} />
              ))}
            </div>
            <div style={s.grabandoTexto}>Escuchando... {tiempoGrabacion}s</div>
            <div style={s.grabandoSub}>Hablá claramente y describí el reporte</div>
            <button style={s.btnDetener} onClick={handleDetener}>
              ⏹ Detener grabación
            </button>
          </div>
        )}

        {/* Estado: procesando */}
        {estado === 'procesando' && (
          <div style={s.procesandoWrap}>
            <div style={s.spinner} />
            <div style={s.procesandoTexto}>Procesando con IA...</div>
            <div style={s.procesandoSub}>Whisper está transcribiendo tu audio</div>
          </div>
        )}

        {/* Estado: listo */}
        {estado === 'listo' && (
          <div style={s.listoWrap}>
            <div style={s.listoIcono}>✓</div>
            <div style={s.listoMensaje}>{mensaje}</div>
            {texto && (
              <div style={s.transcripcion}>
                <span style={s.transcripcionLabel}>Escuché:</span>
                <span style={s.transcripcionTexto}>"{texto}"</span>
              </div>
            )}
            <div style={s.listoSub}>
              El reporte fue configurado automáticamente abajo ↓
            </div>
          </div>
        )}

        {/* Estado: error */}
        {estado === 'error' && (
          <div style={s.errorWrap}>
            <div style={s.errorIcono}>⚠️</div>
            <div style={s.errorMensaje}>{mensaje}</div>
            <button style={s.btnGrabar} onClick={handleReset}>
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>

      {/* Animación de ondas */}
      <style>{`
        @keyframes onda {
          0%, 100% { height: 8px; }
          50% { height: 32px; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

const s = {
  panel: {
    background: 'var(--color-surface)',
    border: '2px solid var(--color-primary)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    background: '#E1F5EE',
    borderBottom: '1px solid #5DCAA5',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  icono: { fontSize: 24 },
  titulo: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--color-primary-dk)',
  },
  subtitulo: {
    fontSize: 12,
    color: '#1D9E75',
  },
  btnReset: {
    padding: '6px 14px',
    background: 'none',
    border: '1px solid var(--color-primary)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--color-primary-dk)',
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 500,
  },
  cuerpo: {
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    minHeight: 180,
  },

  // Botón principal
  btnGrabar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 28px',
    background: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 40,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(29,158,117,.35)',
    transition: 'transform .15s, box-shadow .15s',
  },
  btnIcono: { fontSize: 20 },

  // Ejemplos
  ejemplos: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  ejemplosTitulo: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '.04em',
  },
  ejemplosGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  ejemploChip: {
    padding: '5px 12px',
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 20,
    fontSize: 12,
    color: 'var(--color-text-muted)',
    cursor: 'default',
  },

  // Grabando
  grabandoWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
  },
  ondas: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    height: 40,
  },
  onda: {
    width: 6,
    height: 8,
    background: 'var(--color-primary)',
    borderRadius: 3,
    animation: 'onda .8s ease-in-out infinite',
  },
  grabandoTexto: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--color-primary)',
  },
  grabandoSub: {
    fontSize: 13,
    color: 'var(--color-text-muted)',
  },
  btnDetener: {
    padding: '10px 24px',
    background: '#E24B4A',
    color: '#fff',
    border: 'none',
    borderRadius: 30,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },

  // Procesando
  procesandoWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  spinner: {
    width: 44,
    height: 44,
    border: '4px solid var(--color-border)',
    borderTop: '4px solid var(--color-primary)',
    borderRadius: '50%',
    animation: 'spin .8s linear infinite',
  },
  procesandoTexto: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  procesandoSub: {
    fontSize: 13,
    color: 'var(--color-text-muted)',
  },

  // Listo
  listoWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  listoIcono: {
    width: 48,
    height: 48,
    background: '#EAF3DE',
    border: '2px solid #97C459',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    color: '#3B6D11',
    fontWeight: 700,
  },
  listoMensaje: {
    fontSize: 15,
    fontWeight: 600,
    color: '#3B6D11',
    textAlign: 'center',
  },
  transcripcion: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    width: '100%',
  },
  transcripcionLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    whiteSpace: 'nowrap',
  },
  transcripcionTexto: {
    fontSize: 14,
    color: 'var(--color-text)',
    fontStyle: 'italic',
  },
  listoSub: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
  },

  // Error
  errorWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  errorIcono: { fontSize: 32 },
  errorMensaje: {
    fontSize: 14,
    color: '#A32D2D',
    textAlign: 'center',
    maxWidth: 320,
  },

  msgErr: {
    padding: '8px 14px',
    background: '#FCEBEB',
    border: '1px solid #F09595',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    color: '#A32D2D',
    width: '100%',
    textAlign: 'center',
  },
}