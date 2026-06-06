import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import Layout from './Layout';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
  requiredPermission?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, requiredPermission }) => {
  const { isAuthenticated, admin } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasRole = allowedRoles && admin ? allowedRoles.includes(admin.role) : false;
  const hasPermission = requiredPermission && admin?.permissions ? admin.permissions.includes(requiredPermission) : false;

  // Super Admin bypasses permission checks
  if (admin?.role === 'super_admin') {
    return children;
  }

  const renderAccessDenied = () => (
    <Layout title="Access Denied">
      <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '12px', margin: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h2 style={{ color: '#ef4444', marginBottom: '12px' }}>Access Denied</h2>
        <p style={{ color: '#64748b', fontSize: '16px' }}>
          You do not have the required permissions to view this module.
        </p>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>
          Please select an option from the sidebar that you have access to.
        </p>
      </div>
    </Layout>
  );

  if (allowedRoles && requiredPermission) {
    if (!hasRole && !hasPermission) return renderAccessDenied();
  } else if (allowedRoles && !hasRole) {
    return renderAccessDenied();
  } else if (requiredPermission && !hasPermission) {
    return renderAccessDenied();
  }

  return children;
};

export default ProtectedRoute;
