import api from './axios';

export const getNotifications = () => api.get('/notifications');
export const markNotificationsRead = (ids) => api.put('/notifications/read', { ids });
