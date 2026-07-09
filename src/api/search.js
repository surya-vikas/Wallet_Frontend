import api from './axios';

export const globalSearch = (q, categoryId, fileType) =>
  api.get('/search', { params: { q, categoryId, fileType } });
