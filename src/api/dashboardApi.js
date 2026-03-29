import api from './axiosConfig'

export const getDashboardAdmin    = () => api.get('/ninos/dashboard/')
export const getDashboardPersonal = () => api.get('/salas/resumen/')
export const getDashboardTutor    = () => api.get('/tutores/mi-dashboard/')
export const getAsistenciaHoy     = () => api.get('/asistencia/hoy/')
export const getMiSala            = () => api.get('/salas/mi-sala/')
export const getAlertasHoy        = () => api.get('/salud/alertas-hoy/')
export const getActividadesHoy    = () => api.get('/actividades/hoy/')
export const checkinNino          = (data) => api.post('/asistencia/checkin/', data)
export const checkoutNino         = (id, data) => api.patch(`/asistencia/${id}/checkout/`, data)