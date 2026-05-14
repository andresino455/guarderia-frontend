import api from "./axiosConfig";

export const getRegistrosSalud = (params) =>
  api.get("/salud/registros/", { params });

export const getRegistroSalud = (id) => api.get(`/salud/registros/${id}/`);

export const crearRegistroSalud = (data) => api.post("/salud/registros/", data);

export const editarRegistroSalud = (id, data) =>
  api.patch(`/salud/registros/${id}/`, data);

export const eliminarRegistroSalud = (id) =>
  api.delete(`/salud/registros/${id}/`);

export const getAlertasHoy = () => api.get("/salud/registros/alertas-hoy/");

export const getMedicaciones = (params) =>
  api.get("/salud/medicacion/", { params });

export const crearMedicacion = (data) => api.post("/salud/medicacion/", data);

export const editarMedicacion = (id, data) =>
  api.patch(`/salud/medicacion/${id}/`, data);

export const eliminarMedicacion = (id) =>
  api.delete(`/salud/medicacion/${id}/`);

export const getMedicacionesHoy = () => api.get("/salud/medicacion/hoy/");

export const getAlimentaciones = (params) =>
  api.get("/salud/alimentacion/", { params });

export const crearAlimentacion = (data) =>
  api.post("/salud/alimentacion/", data);

export const editarAlimentacion = (id, data) =>
  api.patch(`/salud/alimentacion/${id}/`, data);

export const eliminarAlimentacion = (id) =>
  api.delete(`/salud/alimentacion/${id}/`);

export const getNinos = () => api.get("/ninos/");