import api from './axiosConfig'

export const getAsistencias    = (params) => api.get('/asistencia/', { params })
export const crearAsistencia   = (data)   => api.post('/asistencia/', data)
export const editarAsistencia  = (id, data) => api.patch(`/asistencia/${id}/`, data)
export const eliminarAsistencia = (id)    => api.delete(`/asistencia/${id}/`)
export const getAsistenciaHoy  = ()       => api.get('/asistencia/hoy/')
export const checkinNino       = (data)   => api.post('/asistencia/checkin/', data)
export const checkoutNino      = (id, data) => api.patch(`/asistencia/${id}/checkout/`, data)
export const getReporte        = (params) => api.get('/asistencia/reporte/', { params })
export const getNinos          = ()       => api.get('/ninos/')