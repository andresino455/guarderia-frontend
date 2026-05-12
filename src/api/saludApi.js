import api from "./axiosConfig";

// --- SALUD (Basado en router.register('registros', ...)) ---
export const getRegistrosSalud = (params) =>
  api.get("/registros/", { params });

export const getRegistroSalud = (id) => 
  api.get(`/registros/${id}/`);

export const crearRegistroSalud = (data) => 
  api.post("/registros/", data);

export const editarRegistroSalud = (id, data) =>
  api.patch(`/registros/${id}/`, data);

export const eliminarRegistroSalud = (id) =>
  api.delete(`/registros/${id}/`);

// Corregido: antes apuntaba a /salud/alertas-hoy/
export const getAlertasHoy = () => 
  api.get("/registros/alertas-hoy/");

// --- MEDICACIÓN (Basado en router.register('medicacion', ...)) ---
export const getMedicaciones = (params) =>
  api.get("/medicacion/", { params });

export const crearMedicacion = (data) => 
  api.post("/medicacion/", data);

export const editarMedicacion = (id, data) =>
  api.patch(`/medicacion/${id}/`, data);

export const eliminarMedicacion = (id) =>
  api.delete(`/medicacion/${id}/`);

// Corregido: antes apuntaba a /salud/medicacion/hoy/
export const getMedicacionesHoy = () => 
  api.get("/medicacion/hoy/");

// --- ALIMENTACIÓN (Basado en router.register('alimentacion', ...)) ---
export const getAlimentaciones = (params) =>
  api.get("/alimentacion/", { params });

export const crearAlimentacion = (data) =>
  api.post("/alimentacion/", data);

export const editarAlimentacion = (id, data) =>
  api.patch(`/alimentacion/${id}/`, data);

export const eliminarAlimentacion = (id) =>
  api.delete(`/alimentacion/${id}/`);

export const getNinos = () => api.get("/ninos/");