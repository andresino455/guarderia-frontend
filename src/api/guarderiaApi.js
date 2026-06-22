import api from './axiosConfig'

// Registro público — no necesita token
export const registrarGuarderia = (data) =>
  api.post('/guarderias/', data)

// Info de la guardería actual del usuario autenticado
export const getMiGuarderia = () =>
  api.get('/guarderias/mi-guarderia/')

// Actualizar datos de la guardería
export const actualizarGuarderia = (id, data) =>
  api.patch(`/guarderias/${id}/configuracion/`, data)