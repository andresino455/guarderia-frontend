import {
    getNinos,
    getNino,
    crearNino,
    actualizarNino,
    editarNino,
    eliminarNino,
    buscarNinos,
    getTutoresNino,
    vincularTutor,
    getDashboardNinos,
    registrarRetiro,
    getRetirosByNino,
} from '../api/ninosApi'

export const ninosService = {
    async listar(params = {}) {
        const { data } = await getNinos(params)
        return data
    },

    async obtenerPorId(id) {
        const { data } = await getNino(id)
        return data
    },

    async crear(payload) {
        const { data } = await crearNino(payload)
        return data
    },

    async actualizar(id, payload) {
        const { data } = await actualizarNino(id, payload)
        return data
    },

    async actualizarParcial(id, payload) {
        const { data } = await editarNino(id, payload)
        return data
    },

    async eliminar(id) {
        const { data } = await eliminarNino(id)
        return data
    },

    async buscar(q) {
        const { data } = await buscarNinos(q)
        return data
    },

    async obtenerTutores(idNino) {
        const { data } = await getTutoresNino(idNino)
        return data
    },

    async vincularTutor(idNino, payload) {
        const { data } = await vincularTutor(idNino, payload)
        return data
    },

    async dashboard() {
        const { data } = await getDashboardNinos()
        return data
    },

    async registrarRetiro(idNino, payload) {
        const { data } = await registrarRetiro(idNino, payload)
        return data
    },

    async obtenerRetiros(idNino) {
        const { data } = await getRetirosByNino(idNino)
        return data
    },
}