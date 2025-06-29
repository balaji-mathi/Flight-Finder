// frontend/src/components/Navbar.js
// MODIFIED - To apply the correct gradient theme to the auth pages.

import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- FIX: Create specific boolean flags for each role ---
  const isOperator = user && user.role === 'operator';
  const isUser = user && user.role === 'user';
  const isAdmin = user && user.role === 'admin';
  
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isHomePage = location.pathname === '/';

  // --- FIX: Prioritize role checks and apply the correct theme every time ---
  let navbarClasses = 'shadow-sm';
  if (isOperator || isAdmin) {
    // Operators and Admins always get the same dark blue theme
    navbarClasses += ' navbar-admin-theme';
  } else if (isUser) {
    // Regular users get different themes based on the page
    navbarClasses += isHomePage ? ' navbar-user-hero' : ' navbar-user-theme';
  } else {
    // Logged-out users get different themes based on the page
    // FINAL FIX: Use the forceful 'navbar-auth' class on login/register pages
    navbarClasses += isHomePage ? ' navbar-hero' : ' navbar-auth';
  }

  return (
    <BootstrapNavbar 
      expand="lg" 
      className={navbarClasses}
    >
      <Container>
        <BootstrapNavbar.Brand as={Link} to={isOperator ? "/operator" : isAdmin ? "/admin" : "/"}>
          {isOperator ? "✈️ FlyNGo (Operator)" : isAdmin ? "✈️ FlyNGo (Admin)" : "✈️ FlyNGo"}
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          
          <Nav className="me-auto">
            {/* This section is intentionally left empty */}
          </Nav>

          <Nav>
            {user && !isAuthPage ? (
              <>
                {/* --- FIX: Added a dedicated block for operator navigation links --- */}
                {isOperator ? (
                  <>
                    <Nav.Link as={Link} to="/operator">Home</Nav.Link>
                    <Nav.Link onClick={handleLogout} style={{ cursor: 'pointer' }}>Logout</Nav.Link>
                  </>
                ) : isUser ? (
                  <>
                    <Nav.Link as={Link} to="/">Home</Nav.Link>
                    <Nav.Link as={Link} to="/my-bookings">Bookings</Nav.Link>
                    <Nav.Link onClick={handleLogout} style={{ cursor: 'pointer' }}>Logout</Nav.Link>
                  </>
                ) : ( // Fallback for admin or other roles
                  <NavDropdown title={`Hello, ${user.firstName}`} id="user-dropdown">
                    {isAdmin && <NavDropdown.Item as={Link} to="/admin">Admin Dashboard</NavDropdown.Item>}
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
                  </NavDropdown>
                )}
              </>
            ) : (
              // Guest links
              <>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;