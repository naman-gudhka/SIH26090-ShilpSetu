import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * ProtectedRoute
 * Redirects unauthenticated users to /login.
 * NOTE: This is UI-only protection. Data security must be enforced
 * by Firestore security rules and Firebase Custom Claims.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        background: 'var(--color-bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="ShilpSetu" width={64} height={64} style={{ borderRadius: 16 }} />
          <p style={{ color: 'var(--color-text-muted)', marginTop: 16, fontSize: 'var(--text-sm)' }}>
            Loading ShilpSetu…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * RoleGuard
 * Prevents users without the required role from accessing protected areas.
 * NOTE: UI-only. Not a security boundary. Backend must enforce authorization.
 *
 * @param {string[]} allowedRoles - Array of roles allowed to access the content
 */
export function RoleGuard({ children, allowedRoles = [] }) {
  const { role, loading, isAuthenticated } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // If role not yet selected, send to role selection
    if (!role) return <Navigate to="/select-role" replace />;
    // Otherwise show unauthorized
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
