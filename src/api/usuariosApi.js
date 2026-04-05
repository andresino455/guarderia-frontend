import api from './axiosConfig'

export const getUsuarios      = (params) => api.get('/usuarios/', { params })
export const getUsuario       = (id)     => api.get(`/usuarios/${id}/`)
export const crearUsuario     = (data)   => api.post('/usuarios/', data)
export const editarUsuario    = (id, data) => api.patch(`/usuarios/${id}/`, data)
export const eliminarUsuario  = (id)     => api.delete(`/usuarios/${id}/`)
export const activarUsuario   = (id)     => api.patch(`/usuarios/${id}/activar/`)
export const cambiarPassword  = (id, data) => api.post(`/usuarios/${id}/cambiar-password/`, data)
export const getRoles         = ()       => api.get('/usuarios/roles/')
export const crearRol         = (data)   => api.post('/usuarios/roles/', data)
export const editarRol        = (id, data) => api.patch(`/usuarios/roles/${id}/`, data)
export const eliminarRol      = (id)     => api.delete(`/usuarios/roles/${id}/`)