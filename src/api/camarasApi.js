import api from './axiosConfig'

export const getCamaras       = (params)     => api.get('/camaras/', { params })
export const getCamara        = (id)         => api.get(`/camaras/${id}/`)
export const crearCamara      = (data)       => api.post('/camaras/', data)
export const editarCamara     = (id, data)   => api.patch(`/camaras/${id}/`, data)
export const eliminarCamara   = (id)         => api.delete(`/camaras/${id}/`)
export const getCamarasPorSala = ()          => api.get('/camaras/por-sala/')