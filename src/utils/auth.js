// Authentication utility functions
export const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  return !!token; // Returns true if token exists, false otherwise
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('userDetails');
  window.location.href = '/login';
};
