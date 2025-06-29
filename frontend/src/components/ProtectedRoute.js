import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, operatorOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (operatorOnly && user.role !== 'operator') {
    return <Navigate to="/" replace />;
  }

  // Check if operator is approved
  if (user.role === 'operator' && user.operatorDetails?.approvalStatus !== 'approved') {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          <h4>Account Pending Approval</h4>
          <p>Your operator account is currently pending approval. Please wait for an administrator to review your application.</p>
          <p>Status: <strong>{user.operatorDetails?.approvalStatus || 'pending'}</strong></p>
          {user.operatorDetails?.rejectionReason && (
            <p>Rejection Reason: <strong>{user.operatorDetails.rejectionReason}</strong></p>
          )}
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

