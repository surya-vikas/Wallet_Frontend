import api from './axios';

export const sendSOS = (device, location) => api.post('/sos/send', { device, location });
