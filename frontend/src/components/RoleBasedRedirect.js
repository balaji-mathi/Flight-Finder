// frontend/src/components/RoleBasedRedirect.js

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Home from '../pages/Home'; // The real home page for normal users
import { Spinner } from 'react-bootstrap'; // To show a loading indicator

const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();

  // While we are checking for the user, show a loading spinner.
  // This prevents the home page from flashing briefly before redirecting.
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  // After loading, if a user exists and their role is 'admin',
  // redirect them to the admin dashboard immediately.
  if (user && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // *** FIX: Add a new rule to redirect approved operators ***
  // If the user is an operator and their account is approved,
  // redirect them to the operator dashboard.
  if (user && user.role === 'operator' && user.operatorDetails?.approvalStatus === 'approved') {
    return <Navigate to="/operator" replace />;
  }

  // For any other case (guests, normal users, or unapproved operators),
  // show the normal Home page.
  return <Home />;
};

export default RoleBasedRedirect;