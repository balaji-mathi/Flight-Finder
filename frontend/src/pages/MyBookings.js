// frontend/src/pages/MyBookings.js
// MODIFIED - Combined date and time for better readability in booking cards.

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Alert, Row, Col, Button } from 'react-bootstrap';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './MyBookings.css'; 

// Helper function to format date strings
const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const MyBookingsPage = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchBookings = useCallback(async () => {
        try {
            const response = await api.get('/bookings/my-bookings');
            setBookings(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch your bookings.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchBookings();
        } else {
            setLoading(false);
        }
    }, [user, fetchBookings]);

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) {
            return;
        }
        setError(''); 
        setSuccess('');
        try {
            await api.put(`/bookings/${bookingId}/cancel`);
            setSuccess('Booking cancelled successfully.');
            fetchBookings(); 
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to cancel the booking.');
        }
    };

    if (loading) {
        return <Container className="py-5 text-center"><p>Loading your bookings...</p></Container>;
    }

    return (
        <div className="my-bookings-page">
            <Container>
                <h2 className="mb-4">My Bookings</h2>
                {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
                
                {bookings.length === 0 && !error ? (
                    <Alert variant="info">You have not made any bookings yet.</Alert>
                ) : (
                    <Row>
                        {bookings.map(booking => (
                            <Col md={6} key={booking._id}>
                                <div className="booking-card">
                                    <p className="booking-id">Booking ID: {booking._id}</p>
                                    
                                    {booking.flight ? (
                                        <>
                                            <div className="detail-grid">
                                                <div className="detail-item"><strong>Flight:</strong> {booking.flight.airline} ({booking.flight.flightNumber})</div>
                                                <div className="detail-item"><strong>Total price:</strong> ${booking.totalPrice}</div>
                                                {/* --- FIX: Combined Departure Date & Time --- */}
                                                <div className="detail-item"><strong>Departure:</strong> {formatDate(booking.flight.departure.date)} - {booking.flight.departure.time}</div>
                                                {/* --- FIX: Added Arrival Date & Time --- */}
                                                <div className="detail-item"><strong>Arrival:</strong> {formatDate(booking.flight.arrival.date)} - {booking.flight.arrival.time}</div>
                                                <div className="detail-item"><strong>From:</strong> {booking.flight.departure.city}</div>
                                                <div className="detail-item"><strong>To:</strong> {booking.flight.arrival.city}</div>
                                            </div>

                                            <div className="passengers-section">
                                                <strong>Passengers:</strong>
                                                <ol className="passenger-list pt-1">
                                                    {booking.passengers?.map((p, index) => (
                                                        <li key={index} style={{ marginBottom: '0.5rem' }}>
                                                            <div>Name - {p.name || 'N/A'}</div>
                                                            <div>Age - {p.age || 'N/A'}</div>
                                                        </li>
                                                    ))}
                                                </ol>
                                                <strong>Seats:</strong> {booking.seatsBooked?.join(', ') || 'N/A'}
                                            </div>
                                        </>
                                    ) : ( <Alert variant="warning">Flight details are no longer available.</Alert> )}
                                    <div className="mt-2">
                                        <strong>Booking status: </strong>
                                        <span className={`booking-status ${booking.bookingStatus === 'confirmed' ? 'status-confirmed' : 'status-cancelled'}`}>{booking.bookingStatus}</span>
                                    </div>
                                    {booking.bookingStatus === 'confirmed' && (
                                        <Button variant="danger" className="mt-3 w-100" onClick={() => handleCancelBooking(booking._id)}>Cancel Ticket</Button>
                                    )}
                                </div>
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>
        </div>
    );
};

export default MyBookingsPage;