import { useState, useRef, useCallback } from 'react'

/**
 * Hook para grabar audio desde el micrófono del browser.
 * Usa MediaRecorder API — compatible con Chrome, Edge, Firefox.
 *
 * Retorna:
 *   grabando       — boolean
 *   iniciarGrabacion — función
 *   detenerGrabacion — función (retorna Promise<Blob>)
 *   error          — string | null
 */
export function useGrabadorAudio() {
  const [grabando, setGrabando] = useState(false)
  const [error,    setError]    = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])
  const resolveRef       = useRef(null)

  const iniciarGrabacion = useCallback(async () => {
    setError(null)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Elegir el formato más compatible
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        // Detener el stream del micrófono
        stream.getTracks().forEach(t => t.stop())
        if (resolveRef.current) {
          resolveRef.current(blob)
          resolveRef.current = null
        }
      }

      recorder.start(100) // capturar cada 100ms
      setGrabando(true)

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Permiso de micrófono denegado. Habilitalo en tu navegador.')
      } else {
        setError(`Error al acceder al micrófono: ${err.message}`)
      }
    }
  }, [])

  const detenerGrabacion = useCallback(() => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      if (mediaRecorderRef.current && grabando) {
        mediaRecorderRef.current.stop()
        setGrabando(false)
      } else {
        resolve(null)
      }
    })
  }, [grabando])

  return { grabando, iniciarGrabacion, detenerGrabacion, error }
}