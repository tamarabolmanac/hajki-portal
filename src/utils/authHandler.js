// Authentication handler utility
let navigate = null;

// Set the navigate function from React Router
export const setNavigate = (navigateFunction) => {
  navigate = navigateFunction;
};

// Handle session expiration
export const handleSessionExpired = () => {
  console.log('Session expired, clearing data and redirecting...');
  
  // Clear all auth data
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('userDetails');
  
  // Try to use React Router navigate if available, otherwise fallback to window.location
  if (navigate) {
    navigate('/login', { replace: true });
  } else {
    window.location.href = '/login';
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('authToken');
  return !!token;
};

// Get current user data
export const getCurrentUser = () => {
  const userData = localStorage.getItem('userDetails');
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  return null;
};
