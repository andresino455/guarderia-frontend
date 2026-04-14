import {
    getTutoresRequest,
    getTutorByIdRequest,
    createTutorRequest,
    updateTutorRequest,
    patchTutorRequest,
    deleteTutorRequest,
    searchTutoresRequest,
    getNinosByTutorRequest,
    createTutorConUsuarioRequest,
    getMiDashboardTutorRequest,
} from '../api/tutoresApi'

export const tutoresService = {
    async listar(params = {}) {
        const { data } = await getTutoresRequest(params)
        return data
    },

    async obtenerPorId(id) {
        const { data } = await getTutorByIdRequest(id)
        return data
    },

    async crear(payload) {
        const { data } = await createTutorRequest(payload)
        return data
    },

    async crearConUsuario(payload) {
        const { data } = await createTutorConUsuarioRequest(payload)
        return data
    },

    async actualizar(id, payload) {
        const { data } = await updateTutorRequest(id, payload)
        return data
    },

    async actualizarParcial(id, payload) {
        const { data } = await patchTutorRequest(id, payload)
        return data
    },

    async eliminar(id) {
        const { data } = await deleteTutorRequest(id)
        return data
    },

    async buscar(q) {
        const { data } = await searchTutoresRequest(q)
        return data
    },

    async obtenerNinos(idTutor) {
        const { data } = await getNinosByTutorRequest(idTutor)
        return data
    },

    async miDashboard() {
        const { data } = await getMiDashboardTutorRequest()
        return data
    },
}