// frontend/src/pages/BookingListPage.js
// This code is confirmed to be correct.

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Alert, Spinner, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './BookingListPage.css';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
        year: 'numeric', month: '2-digit', day: '2-digit'
    }).replace(/\//g, '-');
};

const BookingListPage = () => {
    const { logout } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/bookings');
            setBookings(res.data || []);
        } catch (err) {
            setError('Failed to fetch bookings.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleCancelTicket = async (bookingId) => {
        if (window.confirm('Are you sure you want to cancel this ticket? This action cannot be undone.')) {
            try {
                await api.put(`/admin/bookings/${bookingId}/cancel`);
                fetchBookings();
            } catch (err) {
                setError('Failed to cancel the booking.');
                console.error(err);
            }
        }
    };

    return (
        <div className="admin-bookings-page">
            <header className="admin-header">
                <div className="brand">FlyNGo (Admin)</div>
                <nav className="nav-links">
                    <Link to="/admin">Home</Link>
                    <Link to="/admin/users">Users</Link>
                    <Link to="/admin/bookings">Bookings</Link>
                    <Link to="/admin/flights">Flights</Link>
                    <a href="/login" onClick={logout}>Logout</a>
                </nav>
            </header>

            <main className="admin-content">
                <Container fluid>
                    <h2 className="page-title">All Bookings</h2>
                    {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                    
                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" /><p className="mt-2">Loading Bookings...</p></div>
                    ) : (
                        <Row>
                            {bookings.length > 0 ? bookings.map((booking) => (
                                <Col lg={6} md={12} key={booking._id} className="mb-4">
                                    <div className="admin-booking-card">
                                        <p><strong>Booking ID:</strong> {booking._id}</p>
                                        
                                        {/* --- THIS IS THE KEY LINE --- */}
                                        {/* It correctly looks for booking.user.phone */}
                                        <p><strong>Mobile:</strong> {booking.user?.phone || 'N/A'}     <strong>Email:</strong> {booking.user?.email || 'N/A'}</p>
                                        
                                        <p><strong>Flight Id:</strong> {booking.flight?.flightNumber || 'N/A'}     <strong>Flight name:</strong> {booking.flight?.airline || 'N/A'}</p>
                                        <p><strong>On-boarding:</strong> {booking.flight?.departure?.city || '?'}     <strong>Destination:</strong> {booking.flight?.arrival?.city || '?'}</p>
                                        
                                        <div>
                                            <strong>Passengers:</strong>
                                            <ol className="passengers-list">
                                                {booking.passengers.map((p, index) => (
                                                    <li key={index}>Name: {p.name}, Age: {p.age || 'N/A'}</li>
                                                ))}
                                            </ol>
                                        </div>
                                        
                                        <p><strong>Seats:</strong> {booking.seatsBooked?.join(', ') || 'N/A'}</p>
                                        <p><strong>Booking date:</strong> {formatDate(booking.createdAt)}     <strong>Journey date:</strong> {formatDate(booking.flight?.departure?.date)}</p>
                                        <p><strong>Journey Time:</strong> {booking.flight?.departure?.time || 'N/A'}     <strong>Total price:</strong> ${booking.totalPrice.toFixed(2)}</p>
                                        
                                        <p className="d-flex align-items-center">
                                            <strong className="me-2">Booking status:</strong> 
                                            <span className={`status-text status-${booking.bookingStatus}`}>
                                                {booking.bookingStatus}
                                            </span>
                                        </p>

                                        {booking.bookingStatus === 'confirmed' && (
                                            <Button variant="danger" className="cancel-button" onClick={() => handleCancelTicket(booking._id)}>Cancel Ticket</Button>
                                        )}
                                    </div>
                                </Col>
                            )) : (
                                <Col>
                                    <Alert variant="info">No bookings found.</Alert>
                                </Col>
                            )}
                        </Row>
                    )}
                </Container>
            </main>
        </div>
    );
};

export default BookingListPage;