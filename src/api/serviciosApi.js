import api from './axiosConfig'

export const getServicios       = (params) => api.get('/servicios/servicios/', { params })
export const getServicio        = (id)     => api.get(`/servicios/servicios/${id}/`)
export const crearServicio      = (data)   => api.post('/servicios/servicios/', data)
export const editarServicio     = (id, data) => api.patch(`/servicios/servicios/${id}/`, data)
export const eliminarServicio   = (id)     => api.delete(`/servicios/servicios/${id}/`)
export const asignarServicio    = (data)   => api.post('/servicios/servicios/asignar/', data)
export const desasignarServicio = (data)   => api.delete('/servicios/servicios/desasignar/', { data })
export const getNinosServicio   = (id)     => api.get(`/servicios/servicios/${id}/ninos/`)

export const getPagos           = (params) => api.get('/servicios/pagos/', { params })
export const crearPago          = (data)   => api.post('/servicios/pagos/', data)
export const editarPago         = (id, data) => api.patch(`/servicios/pagos/${id}/`, data)
export const eliminarPago       = (id)     => api.delete(`/servicios/pagos/${id}/`)
export const marcarPagado       = (id)     => api.patch(`/servicios/pagos/${id}/marcar-pagado/`)
export const getResumenPagos    = (params) => api.get('/servicios/pagos/resumen/', { params })
export const generarMensual     = (data)   => api.post('/servicios/pagos/generar-mensual/', data)
export const getNinos           = ()       => api.get('/ninos/')