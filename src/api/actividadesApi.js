import api from './axiosConfig'

export const getActividades      = (params) => api.get('/actividades/', { params })
export const getActividad        = (id)     => api.get(`/actividades/${id}/`)
export const crearActividad      = (data)   => api.post('/actividades/', data)
export const editarActividad     = (id, data) => api.patch(`/actividades/${id}/`, data)
export const eliminarActividad   = (id)     => api.delete(`/actividades/${id}/`)
export const getActividadesHoy   = ()       => api.get('/actividades/hoy/')
export const getEstadisticas     = (params) => api.get('/actividades/estadisticas/', { params })
export const registrarGrupo      = (data)   => api.post('/actividades/registrar-grupo/', data)
export const getNinos            = ()       => api.get('/ninos/')