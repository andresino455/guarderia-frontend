import api from './axiosConfig'

const BASE_PATH = '/salud/registros'

/**
 * GET /salud/registros/
 * Lista registros de salud
 */
export const getSaludRequest = async (params = {}) => {
    const response = await api.get(`${BASE_PATH}/`, { params })
    return response
}

/**
 * GET /salud/registros/:id/
 * Obtiene detalle de un registro de salud
 */
export const getSaludByIdRequest = async (id) => {
    const response = await api.get(`${BASE_PATH}/${id}/`)
    return response
}

/**
 * POST /salud/registros/
 * Crea un registro de salud
 */
export const createSaludRequest = async (data) => {
    console.log('📨 API → creando registro de salud:', data)
    const response = await api.post(`${BASE_PATH}/`, data)
    return response
}

/**
 * PUT /salud/registros/:id/
 * Actualiza un registro completo
 */
export const updateSaludRequest = async (id, data) => {
    console.log('📨 API → update salud:', id, data)
    const response = await api.put(`${BASE_PATH}/${id}/`, data)
    return response
}

/**
 * PATCH /salud/registros/:id/
 * Actualiza parcialmente un registro
 */
export const patchSaludRequest = async (id, data) => {
    console.log('📨 API → patch salud:', id, data)
    const response = await api.patch(`${BASE_PATH}/${id}/`, data)
    return response
}

/**
 * DELETE /salud/registros/:id/
 * Borrado lógico
 */
export const deleteSaludRequest = async (id) => {
    console.log('🗑️ API → eliminar salud:', id)
    const response = await api.delete(`${BASE_PATH}/${id}/`)
    return response
}

/**
 * GET /salud/registros/alertas-hoy/
 */
export const getAlertasHoySaludRequest = async () => {
    const response = await api.get(`${BASE_PATH}/alertas-hoy/`)
    return response
}