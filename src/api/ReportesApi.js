import api from './axiosConfig'

/**
 * Envía un blob de audio al backend para transcripción e interpretación.
 * Retorna los parámetros del reporte estructurados.
 */
export const procesarVoz = async (audioBlob) => {
  const formData = new FormData()

  // Determinar extensión según el tipo MIME
  const extension = audioBlob.type.includes('ogg') ? 'ogg'
    : audioBlob.type.includes('mp4') ? 'mp4'
    : 'webm'

  formData.append('audio', audioBlob, `grabacion.${extension}`)

  const { data } = await api.post('/reportes/voz/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return data
}