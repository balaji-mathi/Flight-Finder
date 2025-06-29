// frontend/src/pages/FlightSearch.js
// MODIFIED - To match the final layout

import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Home.css'; // Reusing some styles from Home.css is efficient

const FlightSearch = () => {
  const [searchCriteria, setSearchCriteria] = useState({ from: '', to: '', date: '' });
  const [flights, setFlights] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setSearchCriteria({ ...searchCriteria, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams(searchCriteria);
      const response = await api.get(`/flights/search?${params}`);
      setFlights(response.data);
      setSearched(true);
    } catch (err) {
      setError('Failed to fetch flights. Please try again.');
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f8f9fa', minHeight: '80vh' }}>
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={10} xl={9}>
            <Card className="shadow-sm border-0 mb-5">
              <Card.Body className="p-4">
                <Card.Title as="h2" className="mb-3 fw-bold">Search Flights</Card.Title>
                <Form onSubmit={handleSearch}>
                  <Row className="align-items-end g-3">
                    <Col md><Form.Label>Departure City</Form.Label><Form.Control type="text" name="from" placeholder="e.g., Mumbai" onChange={handleInputChange} required /></Col>
                    <Col md><Form.Label>Destination City</Form.Label><Form.Control type="text" name="to" placeholder="e.g., Delhi" onChange={handleInputChange} required /></Col>
                    <Col md><Form.Label>Journey Date</Form.Label><Form.Control type="date" name="date" onChange={handleInputChange} required /></Col>
                    <Col md="auto"><Button className="w-100 search-button-final" type="submit" disabled={loading}>{loading ? '...' : 'Search'}</Button></Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>

            <h2 className="text-center mb-4 fw-bold">Available Flights</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            {loading && <p className="text-center">Loading...</p>}
            {!loading && flights.length === 0 && searched && (
              <Alert variant="info" className="text-center">No flights found matching your criteria.</Alert>
            )}

            <div className="d-flex flex-column gap-3">
              {flights.map((flight) => (
                <div key={flight._id} className="flight-card-final">
                  <span><strong>{flight.airline}</strong><br /><small>{flight.flightNumber}</small></span>
                  <span><strong>{flight.departure.city} → {flight.arrival.city}</strong><br /><small>{flight.departure.time} - {flight.arrival.time}</small></span>
                  <span><strong>${flight.price.economy}</strong><br /><small>per person</small></span>
                  <Link to={`/book/${flight._id}`}><Button className="book-button-final">Book Now</Button></Link>
                </div>
              ))}
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default FlightSearch;