import { config } from '../config';

const getAuthToken = () => localStorage.getItem('authToken');

export const authenticatedFetch = async (url, options = {}) => {
  const token = getAuthToken();
  
  console.log('authenticatedFetch called with URL:', url); // Debug log
  console.log('Token exists:', !!token); // Debug log

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('Added Authorization header'); // Debug log
  }

  // The browser will automatically set the Content-Type for FormData.
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Determine the full URL
  let fullUrl;
  if (options.useProductionUrl && process.env.NODE_ENV !== 'development') {
    fullUrl = url; // url should be the full production URL in this case
  } else {
    fullUrl = `${config.apiUrl}${url}`;
  }
  
  console.log('Making request to:', fullUrl); // Debug log
  console.log('Headers:', headers); // Debug log

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });
    
    console.log('Response status:', response.status); // Debug log
    console.log('Response headers:', response.headers); // Debug log

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } else {
      // Handle non-JSON responses (like HTML error pages)
      if (!response.ok) {
        throw new Error(`Server error! status: ${response.status}`);
      }
      
      const text = await response.text();
      return { message: text };
    }
  } catch (error) {
    console.error('Error in authenticatedFetch:', error);
    throw error;
  }
};
