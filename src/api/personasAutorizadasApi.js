import api from './axiosConfig'

// ─── Personas autorizadas ─────────────────────────────────────────────────────

export const getPersonasAutorizadas    = (params)    => api.get('/ninos/personas-autorizadas/', { params })
export const getPersonaAutorizada      = (id)        => api.get(`/ninos/personas-autorizadas/${id}/`)
export const crearPersonaAutorizada    = (data)      => api.post('/ninos/personas-autorizadas/', data)
export const editarPersonaAutorizada   = (id, data)  => api.patch(`/ninos/personas-autorizadas/${id}/`, data)
export const eliminarPersonaAutorizada = (id)        => api.delete(`/ninos/personas-autorizadas/${id}/`)
export const verificarPersona          = (data)      => api.post('/ninos/personas-autorizadas/verificar/', data)

// Exclusivas del trabajo 2
export const actualizarPersonaAutorizada  = (id, data) => api.put(`/ninos/personas-autorizadas/${id}/`, data)
export const getPersonasAutorizadasPorNino = (idNino)  => api.get('/ninos/personas-autorizadas/por-nino/', { params: { nino: idNino } })
export const generarCodigoPersonaAutorizada = (id)     => api.post(`/ninos/personas-autorizadas/${id}/generar-codigo/`)

// ─── Niños ────────────────────────────────────────────────────────────────────

export const getNinos = () => api.get('/ninos/')