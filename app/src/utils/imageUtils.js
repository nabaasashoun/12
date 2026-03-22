export const getFullImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  const BASE_URL = API_BASE_URL.replace('/api', '');
  
  if (url.startsWith('/')) {
    return `${BASE_URL}${url}`;
  }
  return `${BASE_URL}/media/${url}`;
};

export const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300x300?text=No+Image';