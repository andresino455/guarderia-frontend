import api from './axiosConfig'

export const loginRequest = (credentials) =>
  api.post('/usuarios/login/', credentials)

export const getMeRequest = () =>
  api.get('/usuarios/me/')