// frontend/src/pages/OperatorDashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Alert, Modal, Form, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './OperatorDashboard.css';
import { indianCities } from '../data/cities';
import Footer from '../components/Footer'; 

const OperatorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ totalFlights: 0, totalBookings: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newFlight, setNewFlight] = useState({});
  const [editingFlight, setEditingFlight] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [cities] = useState(indianCities);

  const emptyFlight = {
    flightNumber: '', airline: '',
    departure: { city: '', date: '', time: '' },
    arrival: { city: '', date: '', time: '' },
    price: { economy: '', business: '', firstClass: '' },
    seats: { economy: { total: '' }, business: { total: '' }, firstClass: { total: '' } },
  };

  const fetchOperatorData = useCallback(async () => {
    if (user?.operatorDetails?.approvalStatus !== 'approved') { setLoading(false); return; }
    try {
      const response = await api.get('/operator/stats');
      setFlights(response.data.flights || []);
      setBookings(response.data.bookings || []);
      setStats({ totalFlights: response.data.totalFlights || 0, totalBookings: response.data.totalBookings || 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch operator data.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
        setLoading(true);
        fetchOperatorData();
    }
  }, [user, fetchOperatorData]);

  const handleFormChange = (e, formType) => {
    const { name, value } = e.target;
    const parts = name.split('.');
    const setState = formType === 'new' ? setNewFlight : setEditingFlight;
    setState(prev => {
      const newState = { ...prev };
      let current = newState;
      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = { ...current[parts[i]] };
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      return newState;
    });
  };

  const handleCityChange = (fieldName, selected, formType) => {
    const value = selected.length > 0 ? selected[0] : '';
    const [section, subSection] = fieldName.split('.');
    const setState = formType === 'new' ? setNewFlight : setEditingFlight;
    setState(prev => ({ ...prev, [section]: { ...prev[section], [subSection]: value } }));
  };

  const handleShowAddModal = () => {
    setNewFlight(emptyFlight);
    setShowAddModal(true);
  };
  
  const handleAddFlight = async (e) => {
    e.preventDefault();
    try {
      const flightData = {...newFlight, price: { economy: parseFloat(newFlight.price.economy), business: parseFloat(newFlight.price.business), firstClass: parseFloat(newFlight.price.firstClass) }, seats: { economy: { total: parseInt(newFlight.seats.economy.total), available: parseInt(newFlight.seats.economy.total) }, business: { total: parseInt(newFlight.seats.business.total), available: parseInt(newFlight.seats.business.total) }, firstClass: { total: parseInt(newFlight.seats.firstClass.total), available: parseInt(newFlight.seats.firstClass.total) } } };
      await api.post('/flights', flightData);
      setSuccess('Flight added successfully!');
      setShowAddModal(false);
      fetchOperatorData();
      setView('flights');
    } catch (error) {
      setError(error.response?.data?.message || 'Server error while creating flight');
    }
  };
  
  const handleShowEditModal = (flight) => {
    const formattedFlight = { ...flight, 
      departure: { ...flight.departure, date: flight.departure.date ? new Date(flight.departure.date).toISOString().split('T')[0] : ''}, 
      arrival: { ...flight.arrival, date: flight.arrival.date ? new Date(flight.arrival.date).toISOString().split('T')[0] : ''} 
    };
    setEditingFlight(formattedFlight);
    setShowEditModal(true);
  };
  
  const handleUpdateFlight = async (e) => {
    e.preventDefault();
    if (!editingFlight) return;
    try {
      await api.put(`/flights/${editingFlight._id}`, editingFlight);
      setSuccess('Flight updated successfully!');
      setShowEditModal(false);
      setEditingFlight(null);
      fetchOperatorData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update flight');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      setSuccess('Booking cancelled successfully.');
      fetchOperatorData(); 
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const handleOperatorLogout = () => {
      logout();
      navigate('/login');
  };

  const isApproved = user?.operatorDetails?.approvalStatus === 'approved';

  const renderPendingView = () => (
    <div className="pending-view-container">
        <div className="pending-card">
            <h4>Account Pending Approval</h4>
            <hr />
            <p>Your operator account is currently pending approval. Please wait for an administrator to review your application.</p>
            <p className="status-display">
                Status: <Badge bg="warning" text="dark">{user?.operatorDetails?.approvalStatus}</Badge>
            </p>
        </div>
    </div>
  );

  const renderDashboard = () => (
    <Row>
      <Col md={4} className="mb-4">
        <div className="dashboard-card">
          <div className="card-content">
            <p className="card-title">Bookings</p>
            <p className="card-number">{stats.totalBookings}</p>
          </div>
          <Button className="card-button" onClick={() => setView('bookings')}>View all</Button>
        </div>
      </Col>
      <Col md={4} className="mb-4">
        <div className="dashboard-card">
          <div className="card-content">
            <p className="card-title">Flights</p>
            <p className="card-number">{stats.totalFlights}</p>
          </div>
          <Button className="card-button" onClick={() => setView('flights')}>View all</Button>
        </div>
      </Col>
      <Col md={4} className="mb-4">
        <div className="dashboard-card action-card">
          <div className="card-content">
            <p className="card-title">New Flight</p>
            <p className="card-subtitle">(add new route)</p>
          </div>
          <Button className="card-button" onClick={handleShowAddModal}>Add now</Button>
        </div>
      </Col>
    </Row>
  );

  const renderFlightsGrid = () => ( <div className="data-table-card"><div className="d-flex justify-content-between align-items-center mb-4"><h2>All Flights</h2><Button variant="secondary" onClick={() => setView('dashboard')}>Back to Dashboard</Button></div>{flights.length === 0 ? (<p className="text-center text-muted">No flights found.</p>) : (<Row>{flights.map((flight) => (<Col md={6} key={flight._id}><div className="flight-card"><p className="flight-id">_id: {flight._id}</p><div className="flight-details-grid"><div className="detail-item"><strong>Flight id:</strong> {flight.flightNumber}</div><div className="detail-item"><strong>Flight name:</strong> {flight.airline}</div><div className="detail-item"><strong>Starting station:</strong> {flight.departure?.city}</div><div className="detail-item"><strong>Departure time:</strong> {flight.departure?.time}</div><div className="detail-item"><strong>Destination:</strong> {flight.arrival?.city}</div><div className="detail-item"><strong>Arrival time:</strong> {flight.arrival?.time}</div><div className="detail-item"><strong>Base price:</strong> {flight.price?.economy}</div><div className="detail-item"><strong>Total seats:</strong> {(flight.seats?.economy?.total || 0) + (flight.seats?.business?.total || 0) + (flight.seats?.firstClass?.total || 0)}</div></div><Button variant="primary" className="mt-3 w-100" onClick={() => handleShowEditModal(flight)}>Edit details</Button></div></Col>))}</Row>)}</div> );
  const renderBookingsGrid = () => ( <div className="data-table-card"><div className="d-flex justify-content-between align-items-center mb-4"><h2>Bookings</h2><Button variant="secondary" onClick={() => setView('dashboard')}>Back to Dashboard</Button></div>{bookings.length === 0 ? (<p className="text-center text-muted">No bookings found.</p>) : (<Row>{bookings.map((booking) => (<Col md={6} key={booking._id}><div className="booking-card"><p className="booking-id">Booking ID: {booking._id}</p><div className="detail-grid"><div className="detail-item"><strong>Mobile:</strong> {booking.user?.mobileNumber || 'N/A'}</div><div className="detail-item"><strong>Email:</strong> {booking.user?.email || 'N/A'}</div><div className="detail-item"><strong>Flight Id:</strong> {booking.flight?.flightNumber}</div><div className="detail-item"><strong>Flight name:</strong> {booking.flight?.airline}</div><div className="detail-item"><strong>On-boarding:</strong> {booking.flight?.departure?.city}</div><div className="detail-item"><strong>Destination:</strong> {booking.flight?.arrival?.city}</div></div><div className="passengers-section"><strong>Passengers:</strong><ol className="passenger-list ps-3 pt-1">{booking.passengers?.map((p, index) => <li key={index}>{p.name}, Age: {p.age}</li>)}</ol><strong>Seats:</strong> {booking.seatsBooked?.join(', ') || 'N/A'}</div><div className="detail-grid"><div className="detail-item"><strong>Booking date:</strong> {new Date(booking.createdAt).toLocaleDateString()}</div><div className="detail-item"><strong>Journey date:</strong> {new Date(booking.flight?.departure?.date).toLocaleDateString()}</div><div className="detail-item"><strong>Journey Time:</strong> {booking.flight?.departure?.time}</div><div className="detail-item"><strong>Total price:</strong> {booking.totalPrice}</div></div><div className="mt-2"><strong>Booking status: </strong><span className={`booking-status ${booking.bookingStatus === 'confirmed' ? 'status-confirmed' : 'status-cancelled'}`}>{booking.bookingStatus}</span></div>{booking.bookingStatus === 'confirmed' && (<Button variant="danger" className="mt-3 w-100" onClick={() => handleCancelBooking(booking._id)}>Cancel Ticket</Button>)}</div></Col>))}</Row>)}</div> );
  
  const renderFlightForm = (flightData, handleChange, handleCity, formType) => (
    <>
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group><Form.Label>Flight Number</Form.Label><Form.Control type="text" name="flightNumber" value={flightData.flightNumber || ''} onChange={(e) => handleChange(e, formType)} required /></Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group><Form.Label>Flight Name</Form.Label><Form.Control type="text" name="airline" value={flightData.airline || ''} onChange={(e) => handleChange(e, formType)} required /></Form.Group>
        </Col>
      </Row>

      <div className="mb-4">
        <h5>Departure</h5>
        <Row>
          <Col md={5}><Form.Group><Form.Label>City</Form.Label><Typeahead id={`departure-city-${formType}`} options={cities} selected={flightData.departure?.city ? [flightData.departure.city] : []} onChange={(s) => handleCity('departure.city', s, formType)} placeholder="Select Departure..." /></Form.Group></Col>
          <Col md={4}><Form.Group><Form.Label>Date</Form.Label><Form.Control type="date" name="departure.date" value={flightData.departure?.date || ''} onChange={(e) => handleChange(e, formType)} required /></Form.Group></Col>
          <Col md={3}><Form.Group><Form.Label>Time</Form.Label><Form.Control type="time" name="departure.time" value={flightData.departure?.time || ''} onChange={(e) => handleChange(e, formType)} required /></Form.Group></Col>
        </Row>
      </div>

      <div className="mb-4">
        <h5>Arrival</h5>
        <Row>
          <Col md={5}><Form.Group><Form.Label>City</Form.Label><Typeahead id={`arrival-city-${formType}`} options={cities} selected={flightData.arrival?.city ? [flightData.arrival.city] : []} onChange={(s) => handleCity('arrival.city', s, formType)} placeholder="Select Arrival..." /></Form.Group></Col>
          <Col md={4}><Form.Group><Form.Label>Date</Form.Label><Form.Control type="date" name="arrival.date" value={flightData.arrival?.date || ''} onChange={(e) => handleChange(e, formType)} required /></Form.Group></Col>
          <Col md={3}><Form.Group><Form.Label>Time</Form.Label><Form.Control type="time" name="arrival.time" value={flightData.arrival?.time || ''} onChange={(e) => handleChange(e, formType)} required /></Form.Group></Col>
        </Row>
      </div>
      
      <div className="mb-4">
        <h5>Pricing ($)</h5>
        <Row>
          <Col><Form.Group><Form.Label>Economy</Form.Label><Form.Control type="number" name="price.economy" value={flightData.price?.economy || ''} onChange={(e) => handleChange(e, formType)} required /></Form.Group></Col>
          <Col><Form.Group><Form.Label>Business</Form.Label><Form.Control type="number" name="price.business" value={flightData.price?.business || ''} onChange={(e) => handleChange(e, formType)} required /></Form.Group></Col>
          <Col><Form.Group><Form.Label>First Class</Form.Label><Form.Control type="number" name="price.firstClass" value={flightData.price?.firstClass || ''} onChange={(e) => handleChange(e, formType)} required /></Form.Group></Col>
        </Row>
      </div>
      
      <div>
        <h5>Seat Capacity</h5>
        <Row>
          <Col><Form.Group><Form.Label>Economy Seats</Form.Label><Form.Control type="number" name="seats.economy.total" value={flightData.seats?.economy?.total || ''} onChange={(e) => handleChange(e, formType)} required /></Form.Group></Col>
          <Col><Form.Group><Form.Label>Business Seats</Form.Label><Form.Control type="number" name="seats.business.total" value={flightData.seats?.business?.total || ''} onChange={(e) => handleChange(e, formType)} required /></Form.Group></Col>
          <Col><Form.Group><Form.Label>First Class Seats</Form.Label><Form.Control type="number" name="seats.firstClass.total" value={flightData.seats?.firstClass?.total || ''} onChange={(e) => handleChange(e, formType)} required /></Form.Group></Col>
        </Row>
      </div>
    </>
  );

  return (
    <div className="operator-page-container d-flex flex-column min-vh-100">
      <header className="operator-header">
          <div className="brand">✈️ FlyNGo (Operator - {user?.operatorDetails?.companyName})</div>
          <nav className="nav-links">
              <a onClick={() => isApproved && setView('dashboard')} style={{cursor: isApproved ? 'pointer' : 'not-allowed'}}>Home</a>
              <a onClick={() => isApproved && setView('bookings')} style={{cursor: isApproved ? 'pointer' : 'not-allowed'}}>Bookings</a>
              <a onClick={() => isApproved && setView('flights')} style={{cursor: isApproved ? 'pointer' : 'not-allowed'}}>Flights</a>
              <a onClick={() => isApproved && handleShowAddModal()} style={{cursor: isApproved ? 'pointer' : 'not-allowed'}}>Add Flight</a>
              <a onClick={handleOperatorLogout} style={{cursor: 'pointer'}}>Logout</a>
          </nav>
      </header>
      
      <main className="operator-content flex-grow-1">
        <Container fluid>
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          ) : isApproved ? (
            <>
              {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
              {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
              {view === 'dashboard' && renderDashboard()}
              {view === 'flights' && renderFlightsGrid()}
              {view === 'bookings' && renderBookingsGrid()}
            </>
          ) : (
            renderPendingView()
          )}
        </Container>
      </main>
      
      <Footer />

      {/* Edit Flight Modal */}
      {editingFlight && (
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Edit Flight</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleUpdateFlight}>
              {renderFlightForm(editingFlight, handleFormChange, handleCityChange, 'edit')}
              <Modal.Footer className="mt-4">
                <Button variant="secondary" onClick={() => setShowEditModal(false)}>Close</Button>
                <Button variant="primary" type="submit">Update Flight</Button>
              </Modal.Footer>
            </Form>
          </Modal.Body>
        </Modal>
      )}
      
      {/* Add Flight Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Flight</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddFlight}>
            {renderFlightForm(newFlight, handleFormChange, handleCityChange, 'new')}
            <Modal.Footer className="mt-4">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>Close</Button>
              <Button variant="primary" type="submit">Add Flight</Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>

    </div>
  );
};

export default OperatorDashboard;