import {
    getSaludRequest,
    getSaludByIdRequest,
    createSaludRequest,
    updateSaludRequest,
    patchSaludRequest,
    deleteSaludRequest,
    getAlertasHoySaludRequest,
} from '../api/saludApi'

export const saludService = {
    async listar(params = {}) {
        const { data } = await getSaludRequest(params)
        return data
    },

    async obtenerPorId(id) {
        const { data } = await getSaludByIdRequest(id)
        return data
    },

    async crear(payload) {
        const { data } = await createSaludRequest(payload)
        return data
    },

    async actualizar(id, payload) {
        const { data } = await updateSaludRequest(id, payload)
        return data
    },

    async actualizarParcial(id, payload) {
        const { data } = await patchSaludRequest(id, payload)
        return data
    },

    async eliminar(id) {
        const { data } = await deleteSaludRequest(id)
        return data
    },

    async alertasHoy() {
        const { data } = await getAlertasHoySaludRequest()
        return data
    },
}