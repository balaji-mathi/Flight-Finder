// frontend/src/pages/FlightListPage.js
// MODIFIED - Calling the correct admin endpoint and adding the company name column.

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Alert, Spinner } from 'react-bootstrap';
import { Link, useAuth } from 'react-router-dom';
import api from '../services/api';

const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const FlightListPage = () => {
    // Assuming logout might be needed, let's bring in useAuth
    // const { logout } = useAuth(); 
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchFlights = useCallback(async () => {
        try {
            setLoading(true);
            // --- FIX: The API call MUST point to the admin-specific route ---
            const res = await api.get('/admin/flights'); 
            setFlights(res.data);
        } catch (err) {
            console.error('Error fetching flights:', err);
            setError('Failed to load flights.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFlights();
    }, [fetchFlights]);

    return (
        <div className="admin-page-container">
            <header className="admin-header">
                <div className="brand">FlyNGo (Admin)</div>
                <nav className="nav-links">
                    <Link to="/admin">Home</Link>
                    <Link to="/admin/users">Users</Link>
                    <Link to="/admin/bookings">Bookings</Link>
                    <Link to="/admin/flights">Flights</Link>
                    {/* It's better to use Link for navigation consistency if logout is handled in context */}
                    <Link to="/login">Logout</Link>
                </nav>
            </header>
            <main className="admin-content">
                <Container fluid>
                    <h2 className="my-4">All Flights</h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {loading ? (
                        <div className="text-center py-5"><Spinner animation="border" /></div>
                    ) : flights.length === 0 ? (
                        <Alert variant="info">No flights found in the system.</Alert>
                    ) : (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>Flight ID</th>
                                    <th>Airline</th>
                                    {/* --- FIX: Added new table header --- */}
                                    <th>Company Name</th>
                                    <th>Departure City</th>
                                    <th>Departure Date & Time</th>
                                    <th>Arrival City</th>
                                    <th>Arrival Date & Time</th>
                                    <th>Base Price</th>
                                    <th>Total Seats</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flights.map((flight) => (
                                    <tr key={flight._id}>
                                        <td>{flight.flightNumber}</td>
                                        <td>{flight.airline}</td>
                                        {/* --- FIX: Display the populated company name --- */}
                                        <td>{flight.createdBy?.operatorDetails?.companyName || 'N/A'}</td>
                                        <td>{flight.departure.city}</td>
                                        <td>{formatDate(flight.departure.date)} - {flight.departure.time}</td>
                                        <td>{flight.arrival.city}</td>
                                        <td>{formatDate(flight.arrival.date)} - {flight.arrival.time}</td>
                                        <td>${flight.price.economy}</td>
                                        <td>{(flight.seats.economy?.total || 0) + (flight.seats.business?.total || 0) + (flight.seats.firstClass?.total || 0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Container>
            </main>
        </div>
    );
};

export default FlightListPage;