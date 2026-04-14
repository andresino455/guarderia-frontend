import api from './axiosConfig'

// ─── Niños ────────────────────────────────────────────────────────────────────

export const getNinos          = (params)    => api.get('/ninos/', { params })
export const getNino           = (id)        => api.get(`/ninos/${id}/`)
export const crearNino         = (data)      => api.post('/ninos/', data)
export const editarNino        = (id, data)  => api.patch(`/ninos/${id}/`, data)
export const eliminarNino      = (id)        => api.delete(`/ninos/${id}/`)
export const buscarNinos       = (q)         => api.get('/ninos/buscar/', { params: { q } })

// Exclusivas del trabajo 2
export const actualizarNino    = (id, data)  => api.put(`/ninos/${id}/`, data)
export const getDashboardNinos = ()          => api.get('/ninos/dashboard/')
export const registrarRetiro   = (id, data)  => api.post(`/ninos/${id}/registrar-retiro/`, data)
export const getRetirosByNino  = (id)        => api.get(`/ninos/${id}/retiros/`)

// ─── Tutores ──────────────────────────────────────────────────────────────────

export const getTutores        = ()          => api.get('/tutores/')
export const buscarTutores     = (q)         => api.get('/tutores/buscar/', { params: { q } })
export const getTutoresNino    = (id)        => api.get(`/ninos/${id}/tutores/`)
export const vincularTutor     = (id, data)  => api.post(`/ninos/${id}/vincular-tutor/`, data)

// ─── Personas autorizadas ─────────────────────────────────────────────────────

export const getPersonasAutorizadas    = (nino_id) =>
  api.get('/ninos/personas-autorizadas/', { params: { nino: nino_id } })
export const crearPersonaAutorizada    = (data)    =>
  api.post('/ninos/personas-autorizadas/', data)
export const eliminarPersonaAutorizada = (id)      =>
  api.delete(`/ninos/personas-autorizadas/${id}/`)

// ─── Salas ────────────────────────────────────────────────────────────────────

export const getSalas          = ()          => api.get('/salas/')
export const asignarSala       = (id_sala, data) =>
  api.post(`/salas/${id_sala}/asignar-nino/`, data)
export const getSalaAsignada   = (id_nino)   =>
  api.get('/salas/', { params: { nino: id_nino } })