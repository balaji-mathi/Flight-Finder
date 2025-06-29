// frontend/src/components/Footer.js

import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import './Footer.css'; 

const Footer = () => {
  return (
    <footer className="site-footer">
      <Container>
        {/* --- FIX: The Row is now justified to space out the two columns --- */}
        <Row className="justify-content-between">
          <Col md={5}>
            <h5>✈️ FlyNGo</h5>
            <p>Your trusted partner for flight bookings worldwide.</p>
          </Col>
          
          {/* --- The "Quick Links" column has been removed --- */}

          <Col md={4}>
            <h5>Contact</h5>
            <ul className="footer-links">
              <li>Email: support@FlyNGo.com</li>
              <li>Phone: +1 (555) 123-4567</li>
            </ul>
          </Col>
        </Row>
        <hr />
        <p className="text-center small mt-4">
          © {new Date().getFullYear()} FlyNGo. All Rights Reserved.
        </p>
      </Container>
    </footer>
  );
};

export default Footer;