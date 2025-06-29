// frontend/src/pages/Register.js
// MODIFIED - Added a Phone Number field.

import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: '', // <-- FIX: Added phone to initial state
    role: 'user', 
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // --- FIX: Added phone to the validation check ---
    if (!formData.username || !formData.email || !formData.password || !formData.phone) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', formData);
      
      if (formData.role === 'operator') {
         setSuccess('Registration successful! Your account is pending admin approval.');
         setFormData({ username: '', email: '', password: '', phone: '', role: 'operator' }); // Reset form
      } else {
        alert('Registration successful! Please login.');
        navigate('/login');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <Row className="justify-content-center w-100">
        <Col md={6} lg={4}>
          <Card className="shadow-lg border-0 rounded-lg">
            <Card.Body className="p-4 p-sm-5">
              <h3 className="text-center mb-4">Register</h3>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>
                    {formData.role === 'operator' ? 'Airline Company Name' : 'Username'}
                  </Form.Label>
                  <Form.Control type="text" name="username" value={formData.username} onChange={handleChange} required />
                </Form.Group>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
                </Form.Group>
                
                {/* --- FIX: Added Phone Number Form Group --- */}
                <Form.Group className="mb-3" controlId="phone">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
                </Form.Group>

                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control type="password" name="password" value={formData.password} onChange={handleChange} required />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Select name="role" value={formData.role} onChange={handleChange}>
                    <option value="user">Regular User</option>
                    <option value="operator">Flight Operator</option>
                  </Form.Select>
                </Form.Group>
                <div className="d-grid">
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Signing up...' : 'Sign up'}
                    </Button>
                </div>
              </Form>
              <div className="text-center mt-4">
                <small>Already registered? <Link to="/login">Login</Link></small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;