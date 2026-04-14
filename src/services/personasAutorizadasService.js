import {
    getPersonasAutorizadas,
    getPersonaAutorizada,
    crearPersonaAutorizada,
    actualizarPersonaAutorizada,
    editarPersonaAutorizada,
    eliminarPersonaAutorizada,
    getPersonasAutorizadasPorNino,
    verificarPersona,
    generarCodigoPersonaAutorizada,
} from '../api/personasAutorizadasApi'

export const personasAutorizadasService = {
    async listar(params = {}) {
        const { data } = await getPersonasAutorizadas(params)
        return data
    },

    async obtenerPorId(id) {
        const { data } = await getPersonaAutorizada(id)
        return data
    },

    async crear(payload) {
        const { data } = await crearPersonaAutorizada(payload)
        return data
    },

    async actualizar(id, payload) {
        const { data } = await actualizarPersonaAutorizada(id, payload)
        return data
    },

    async actualizarParcial(id, payload) {
        const { data } = await editarPersonaAutorizada(id, payload)
        return data
    },

    async eliminar(id) {
        const { data } = await eliminarPersonaAutorizada(id)
        return data
    },

    async listarPorNino(idNino) {
        const { data } = await getPersonasAutorizadasPorNino(idNino)
        return data
    },

    async verificar(payload) {
        const { data } = await verificarPersona(payload)
        return data
    },

    async generarCodigo(id) {
        const { data } = await generarCodigoPersonaAutorizada(id)
        return data
    },
}