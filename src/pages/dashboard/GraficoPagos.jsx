import { useEffect, useRef } from 'react'
import styles from './Dashboard.module.css'

export default function GraficoPagos({ datos }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!datos.length || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    const PAD = { top: 20, right: 20, bottom: 40, left: 60 }
    const chartW = W - PAD.left - PAD.right
    const chartH = H - PAD.top  - PAD.bottom

    ctx.clearRect(0, 0, W, H)

    const maxVal = Math.max(...datos.map(d => d.total), 1)
    const barW   = Math.floor(chartW / datos.length) - 4

    // Líneas guía
    ctx.strokeStyle = '#E5E4DC'
    ctx.lineWidth   = 1
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + chartH - (i / 4) * chartH
      ctx.beginPath()
      ctx.moveTo(PAD.left, y)
      ctx.lineTo(PAD.left + chartW, y)
      ctx.stroke()

      // Etiqueta eje Y
      ctx.fillStyle  = '#888780'
      ctx.font       = '11px system-ui'
      ctx.textAlign  = 'right'
      ctx.fillText(
        `Bs.${Math.round((i / 4) * maxVal)}`,
        PAD.left - 8, y + 4
      )
    }

    // Barras
    datos.forEach((d, i) => {
      const barH = (d.total / maxVal) * chartH
      const x    = PAD.left + i * (chartW / datos.length) + 2
      const y    = PAD.top  + chartH - barH

      ctx.fillStyle = '#1D9E75'
      ctx.beginPath()
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0])
      ctx.fill()

      // Etiqueta eje X
      ctx.fillStyle  = '#888780'
      ctx.font       = '10px system-ui'
      ctx.textAlign  = 'center'
      ctx.fillText(d.dia, x + barW / 2, PAD.top + chartH + 18)
    })
  }, [datos])

  if (!datos.length) return (
    <p style={{ padding: 16, color: '#888780', fontSize: 14 }}>
      Sin pagos registrados este mes.
    </p>
  )

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={220}
      className={styles.canvas}
    />
  )
}