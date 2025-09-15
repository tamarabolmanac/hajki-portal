import { config } from '../config';

const getAuthToken = () => localStorage.getItem('authToken');

export const authenticatedFetch = async (url, options = {}) => {
  const token = getAuthToken();

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

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
