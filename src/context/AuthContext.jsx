import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  const unsubscribe = authService.onAuthStateChanged((user) => {
    setCurrentUser(user);

    if (user) {
      const savedRole = localStorage.getItem(`shilpsetu_role_${user.uid}`);
      setRole(savedRole || null);
    } else {
      setRole(null);
    }

    setLoading(false);
  });

  return unsubscribe;
}, []);

  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const result = await authService.signInWithEmail(email, password);

      if (result?.role) {
        localStorage.setItem(`shilpsetu_role_${result.user.uid}`, result.role);
        setRole(result.role);
      } else {
        setRole(null);
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, displayName) => {
    setError(null);
    setLoading(true);
    try {
      const result = await authService.createAccount(email, password, displayName);
      setRole(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (currentUser) {
      localStorage.removeItem(`shilpsetu_role_${currentUser.uid}`);
    }
    setRole(null);
    await authService.signOut();
  };

  const forgotPassword = async (email) => {
    setError(null);
    try {
      return await authService.sendPasswordReset(email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const selectRole = async (selectedRole) => {
    
    if (currentUser) {
      localStorage.setItem(`shilpsetu_role_${currentUser.uid}`, selectedRole);
    }
    await authService.setUserRole(selectedRole);
    setRole(selectedRole);
  };

  const clearError = () => setError(null);

  const availableRoles = currentUser
    ? (role === 'admin' || currentUser.isAdminDemo || currentUser.email?.includes('admin')
        ? ['admin', 'artisan', 'buyer']
        : (role ? [role] : []))
    : [];

  const value = {
    currentUser,
    role,
    activeRole: role,
    setActiveRole: selectRole,
    availableRoles,
    loading,
    error,
    login,
    signup,
    logout,
    signOut: logout,
    forgotPassword,
    selectRole,
    clearError,
    isAuthenticated: !!currentUser,
    isArtisan: role === 'artisan',
    isBuyer: role === 'buyer',
    isAdmin: role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Re-exported via src/hooks/useAuth.js for fast-refresh compatibility
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
