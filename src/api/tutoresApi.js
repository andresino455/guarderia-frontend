import api from './axiosConfig'

export const getTutores      = (params) => api.get('/tutores/', { params })
export const getTutor        = (id)     => api.get(`/tutores/${id}/`)
export const crearTutor      = (data)   => api.post('/tutores/', data)
export const editarTutor     = (id, data) => api.patch(`/tutores/${id}/`, data)
export const eliminarTutor   = (id)     => api.delete(`/tutores/${id}/`)
export const buscarTutores   = (q)      => api.get('/tutores/buscar/', { params: { q } })
export const getNinosTutor   = (id)     => api.get(`/tutores/${id}/ninos/`)
export const crearTutorConUsuario = (data) => api.post('/tutores/crear-con-usuario/', data)