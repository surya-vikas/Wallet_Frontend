import api from './axios';

export const getAuthStatus = () => api.get('/auth/status');

export const loginPin = (pin) =>
  api.post('/auth/login', { pin });
