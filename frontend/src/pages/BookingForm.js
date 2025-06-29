// frontend/src/pages/BookingForm.js
// MODIFIED - Added a clear summary of flight date and time details.

import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './BookingForm.css';

// Helper function to format date strings
const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const BookingForm = () => {
  const { flightId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [showPassengerDetails, setShowPassengerDetails] = useState(false);

  const [numberOfPassengers, setNumberOfPassengers] = useState(1);
  const [seatClass, setSeatClass] = useState('economy');
  const [passengers, setPassengers] = useState([{ name: '', age: '' }]);

  useEffect(() => {
    const newPassengers = Array.from({ length: numberOfPassengers }, (_, index) => {
        return passengers[index] || { name: '', age: '' };
    });
    setPassengers(newPassengers);
  }, [numberOfPassengers]);

  useEffect(() => {
    const fetchFlight = async () => {
      try {
        const { data } = await api.get(`/flights/${flightId}`);
        setFlight(data);
      } catch (err) {
        setError('Flight details could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    fetchFlight();
  }, [flightId]);

  const totalPrice = useMemo(() => {
    if (!flight) return 0;
    const pricePerSeat = flight.price[seatClass] || 0;
    return (pricePerSeat * numberOfPassengers).toFixed(2);
  }, [flight, numberOfPassengers, seatClass]);

  const handlePassengerChange = (index, field, value) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index][field] = value;
    setPassengers(updatedPassengers);
  };

  const handleProceed = (e) => {
      e.preventDefault();
      setShowPassengerDetails(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    for (const passenger of passengers) {
        if (!passenger.name.trim() || !passenger.age.trim()) {
            setError('Please fill out the name and age for all passengers.');
            return;
        }
    }

    setSubmitting(true);
    try {
      const bookingData = {
        flightId,
        numberOfPassengers: parseInt(numberOfPassengers),
        seatClass,
        totalPrice: parseFloat(totalPrice),
        passengers,
      };
      await api.post('/bookings', bookingData);
      alert('Booking successful! You will now be redirected to your bookings page.');
      navigate('/my-bookings');
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
        setSubmitting(false);
    }
  };

  if (loading && !flight) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  if (error && !flight) return <Container className="py-5"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <div className="booking-page-container">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={7}>
            <div className="booking-form-card">
              <Form onSubmit={handleSubmit}>
                <h2>Book ticket</h2>
                
                {/* --- FIX: Added a clear flight details summary section --- */}
                <div className="flight-summary-box">
                  <div className="flight-info-grid">
                    <div><strong>Flight:</strong> {flight?.airline} ({flight?.flightNumber})</div>
                    <div><strong>Price/Seat:</strong> ${flight?.price[seatClass]}</div>
                    <div><strong>Departure:</strong> {flight?.departure.city}</div>
                    <div><strong>Departure Time:</strong> {formatDate(flight?.departure.date)} - {flight?.departure.time}</div>
                    <div><strong>Arrival:</strong> {flight?.arrival.city}</div>
                    <div><strong>Arrival Time:</strong> {formatDate(flight?.arrival.date)} - {flight?.arrival.time}</div>
                  </div>
                </div>

                <div className="input-grid">
                    <Form.Group>
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" value={user.email} readOnly />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Mobile</Form.Label>
                        <Form.Control type="tel" value={user.phone} readOnly />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>No of passengers</Form.Label>
                        <Form.Control as="select" value={numberOfPassengers} onChange={e => setNumberOfPassengers(parseInt(e.target.value))} disabled={showPassengerDetails}>
                            {[1, 2, 3, 4, 5, 6].map(n => (<option key={n} value={n}>{n}</option>))}
                        </Form.Control>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Class</Form.Label>
                        <Form.Select value={seatClass} onChange={e => setSeatClass(e.target.value)} disabled={showPassengerDetails}>
                            <option value="economy">Economy</option>
                            <option value="business">Business</option>
                            <option value="firstClass">First Class</option>
                        </Form.Select>
                    </Form.Group>
                </div>
                
                <div className="total-price mt-3">Total price: ${totalPrice}</div>
                {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

                {!showPassengerDetails ? (
                    <Button variant="primary" className="mt-2 w-100" onClick={handleProceed}>
                        Proceed to Passenger Details
                    </Button>
                ) : (
                    <>
                        <div className="passenger-details-section">
                        <hr/>
                        {passengers.map((p, index) => (
                            <div key={index} className="passenger-card">
                            <h5>Passenger {index + 1}</h5>
                            <Row>
                                <Col md={8}><Form.Group className="mb-2"><Form.Label>Name</Form.Label><Form.Control type="text" placeholder="e.g. Srinadh" value={p.name} onChange={(e) => handlePassengerChange(index, 'name', e.target.value)} required /></Form.Group></Col>
                                <Col md={4}><Form.Group className="mb-2"><Form.Label>Age</Form.Label><Form.Control type="number" placeholder="e.g. 25" value={p.age} onChange={(e) => handlePassengerChange(index, 'age', e.target.value)} required /></Form.Group></Col>
                            </Row>
                            </div>
                        ))}
                        </div>
                        <Button type="submit" variant="success" className="mt-4 w-100" disabled={submitting}>
                            {submitting ? 'Booking...' : 'Confirm and Book Now'}
                        </Button>
                        <Button variant="secondary" className="mt-2 w-100" onClick={() => setShowPassengerDetails(false)}>
                            Back
                        </Button>
                    </>
                )}
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default BookingForm;