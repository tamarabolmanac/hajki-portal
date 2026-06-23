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

export const getCurrentUserID = () => {
  const userID = localStorage.getItem('userID');
  if (userID) return userID;

  // Fallback: id may live under `user` or `userDetails` (web login path
  // doesn't always set the standalone `userID` key).
  try {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    if (u?.id != null) return String(u.id);
  } catch { /* ignore */ }
  try {
    const det = JSON.parse(localStorage.getItem('userDetails') || 'null');
    if (det?.id != null) return String(det.id);
  } catch { /* ignore */ }

  return null;
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
