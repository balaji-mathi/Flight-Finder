// frontend/src/pages/Home.js
// MODIFIED - Displaying date and time together for flights.

import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Select from 'react-select';
import { indianCities } from '../data/cities'; 
import './Home.css';

// Helper function to format date strings
const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const Home = () => {
  const [searchCriteria, setSearchCriteria] = useState({ from: '', to: '', date: '' });
  const [flights, setFlights] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cityOptions = indianCities.map(city => ({ value: city, label: city }));

  useEffect(() => {
    const fetchLatestFlights = async () => {
      setLoading(true);
      try {
        const response = await api.get('/flights/latest');
        setFlights(response.data);
      } catch (err) {
        console.error('Could not fetch latest flights:', err);
        setError('Could not load recent flights. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchLatestFlights();
  }, []);

  const handleCityChange = (selectedOption, actionMeta) => {
    setSearchCriteria(prev => ({ ...prev, [actionMeta.name]: selectedOption ? selectedOption.value : '' }));
  };
  
  const handleDateChange = (e) => setSearchCriteria({ ...searchCriteria, [e.target.name]: e.target.value });

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!searchCriteria.from || !searchCriteria.to || !searchCriteria.date) {
        setError('Please fill in all search fields.');
        setLoading(false);
        return;
      }
      const params = new URLSearchParams(searchCriteria);
      const response = await api.get(`/flights/search?${params}`);
      setFlights(response.data);
      setSearched(true);
    } catch (err) {
      setError('Failed to fetch flights.');
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="homepage-design">
      <section className="hero-section">
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={8}><h1 className="hero-title">FlyNGo</h1><p className="hero-subtitle">Destinations, igniting a sense of adventure like never before.</p></Col>
          </Row>
          <Row className="justify-content-center">
            <Col lg={10} xl={9}>
              <div className="search-card">
                <Form onSubmit={handleSearch}>
                  <Row className="align-items-end g-3">
                    <Col md>
                      <Form.Label>Departure City</Form.Label>
                      <Select
                        name="from"
                        options={cityOptions}
                        onChange={handleCityChange}
                        placeholder="Select Departure"
                        isClearable
                      />
                    </Col>
                    <Col md>
                      <Form.Label>Destination City</Form.Label>
                      <Select
                        name="to"
                        options={cityOptions}
                        onChange={handleCityChange}
                        placeholder="Select Destination"
                        isClearable
                      />
                    </Col>
                    <Col md><Form.Label>Journey date</Form.Label><Form.Control type="date" name="date" onChange={handleDateChange} /></Col>
                    <Col md="auto"><Button className="search-btn" type="submit" disabled={loading}>{loading && searched ? '...' : 'Search'}</Button></Col>
                  </Row>
                </Form>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <div className="results-wrapper">
        <Container className="results-section">
          <h2 className="results-title">{searched ? 'Search Results' : 'Recently Added Flights'}</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading && <p className="text-center">Loading...</p>}
          {!loading && flights.length === 0 && (
            <Alert variant="info" className="text-center">
              {searched ? 'No flights found matching your criteria.' : 'No recent flights available.'}
            </Alert>
          )}
          <div className="d-flex flex-column gap-3">
            {flights.map((flight) => (
              <div key={flight._id} className="flight-result-item">
                <div><strong>{flight.airline}</strong><small className="d-block text-muted">Flight: {flight.flightNumber}</small></div>
                {/* --- FIX: Display Date & Time --- */}
                <div><strong>Start: {flight.departure.city}</strong><small className="d-block text-muted">{formatDate(flight.departure.date)} - {flight.departure.time}</small></div>
                {/* --- FIX: Display Date & Time --- */}
                <div><strong>Destination: {flight.arrival.city}</strong><small className="d-block text-muted">{formatDate(flight.arrival.date)} - {flight.arrival.time}</small></div>
                <div><strong>Starting Price: ${flight.price.economy}</strong><small className="d-block text-muted">Seats: {flight.seats.economy.available}</small></div>
                <Link to={`/book/${flight._id}`}><Button className="book-btn">Book Now</Button></Link>
              </div>
            ))}
          </div>
        </Container>
      </div>

      <section className="about-us-section">
        <Container>
            <h2 className="about-us-title">✈️ About Us – FlyNGo</h2>
            <Row className="justify-content-center">
                <Col lg={8}>
                    <p className="about-us-text">
                        At FlyNGo, we are dedicated to making air travel simple, convenient, and accessible for everyone. Our goal is to help travelers find the best flights at the best prices — whether you're flying for business, leisure, or anything in between.
                    </p>
                    <p className="about-us-text">
                        We partner with a wide range of domestic and international airlines to offer a comprehensive selection of flights, tailored to suit every budget and schedule. With an easy-to-use interface and secure booking system, FlyNGo ensures a smooth and hassle-free experience from search to boarding.
                    </p>
                    <p className="about-us-text">
                        Customer satisfaction is at the heart of what we do. From flexible search options to real-time availability and instant confirmations, we strive to provide reliable service every step of the way.
                    </p>
                    <p className="about-us-text">
                        <strong>Wherever you're going, start your journey with FlyNGo.</strong>
                    </p>
                </Col>
            </Row>
        </Container>
      </section>

    </div>
  );
};

export default Home;