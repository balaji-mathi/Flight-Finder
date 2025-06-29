// frontend/src/pages/AdminDashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, ListGroup, Alert } from 'react-bootstrap';
// *** FIX 1 of 4: Import useNavigate ***
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { logout } = useAuth();
  // *** FIX 2 of 4: Get the navigate function from React Router ***
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, bookings: 0, flights: 0 });
  const [pendingOperators, setPendingOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setError('');
    try {
      const response = await api.get('/admin/stats');
      const { totalUsers, totalBookings, totalFlights, pendingOperators } = response.data;
      
      setStats({
        users: totalUsers || 0,
        bookings: totalBookings || 0,
        flights: totalFlights || 0,
      });
      setPendingOperators(pendingOperators || []);

    } catch (err) {
      console.error('Admin Dashboard Error:', err);
      if (err.response) {
        if (err.response.status === 403) {
          setError('Access Denied. Your account does not have admin privileges.');
        } else if (err.response.status === 401) {
          setError('Authentication error. Please log out and log in again.');
        } else {
          setError(`Server Error ${err.response.status}: Failed to load dashboard data.`);
        }
      } else if (err.request) {
        setError('Network Error: Could not connect to the server. Is the backend running?');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/${id}/approve`);
      setPendingOperators(prev => prev.filter(op => op._id !== id));
      setSuccess('Operator approved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error approving operator:', err);
      setError('Failed to approve operator. Please try again.');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/admin/${id}/reject`);
      setPendingOperators(prev => prev.filter(op => op._id !== id));
      setSuccess('Operator rejected successfully.');
       setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error rejecting operator:', err);
      setError('Failed to reject operator. Please try again.');
    }
  };

  // *** FIX 3 of 4: Create a dedicated logout handler ***
  const handleAdminLogout = () => {
    logout(); // Clears user state and tokens
    navigate('/login'); // Cleanly navigates to the login page
  };

  const statCards = [
    { title: 'Users', count: stats.users, link: '/admin/users' },
    { title: 'Bookings', count: stats.bookings, link: '/admin/bookings' },
    { title: 'Flights', count: stats.flights, link: '/admin/flights' },
  ];

  return (
    <div className="admin-page-container">
      <header className="admin-header">
        <div className="brand">✈️ FlyNGo (Admin)</div>
        <nav className="nav-links">
          <Link to="/admin">Home</Link>
          <Link to="/admin/users">Users</Link>
          <Link to="/admin/bookings">Bookings</Link>
          <Link to="/admin/flights">Flights</Link>
          {/* *** FIX 4 of 4: Call the new handler instead of using href *** */}
          <a onClick={handleAdminLogout} style={{cursor: 'pointer'}}>Logout</a>
        </nav>
      </header>

      <main className="admin-content">
        <Container fluid>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          
          <Row className="mb-4">
            {statCards.map((card, index) => (
              <Col md={4} key={index} className="mb-3">
                <div className="stat-card">
                  <h5 className="card-title">{card.title}</h5>
                  <p className="card-count">{loading ? '...' : card.count}</p>
                  <Button as={Link} to={card.link} variant="primary">View all</Button>
                </div>
              </Col>
            ))}
          </Row>
          <Row>
            <Col>
              <div className="applications-card">
                <h4 className="mb-3">New Operator Applications</h4>
                <div className="applications-list-container">
                  {loading ? <p>Loading...</p> : pendingOperators.length > 0 ? (
                    <ListGroup variant="flush">
                      {pendingOperators.map((op) => (
                        <ListGroup.Item key={op._id} className="application-item">
                          <div><strong>{op.operatorDetails?.companyName || 'N/A'}</strong><small className="d-block text-muted">{op.firstName} {op.lastName} ({op.email})</small></div>
                          <div><Button variant="success" size="sm" className="me-2" onClick={() => handleApprove(op._id)}>Approve</Button><Button variant="danger" size="sm" onClick={() => handleReject(op._id)}>Reject</Button></div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  ) : <p className="text-muted no-requests-message">No new requests..</p>}
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </main>
    </div>
  );
};

export default AdminDashboard;