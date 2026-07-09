import api from './axios';

export const getDocuments = (params) =>
  api.get('/documents', { params });

export const getDocument = (id) =>
  api.get(`/documents/${id}`);

export const getFavorites = () =>
  api.get('/documents/favorites');

export const getRecent = () =>
  api.get('/documents/recent');

export const createDocument = (formData, config = {}) =>
  api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...config,
  });

export const updateDocument = (id, data) =>
  api.put(`/documents/${id}`, data);

export const toggleFavorite = (id) =>
  api.patch(`/documents/${id}/favorite`);

export const deleteDocument = (id) =>
  api.delete(`/documents/${id}`);
