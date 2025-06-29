// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import OperatorDashboard from './pages/OperatorDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import UserListPage from './pages/UserListPage';
import BookingListPage from './pages/BookingListPage';
import FlightListPage from './pages/FlightListPage';
import BookingForm from './pages/BookingForm';
import MyBookingsPage from './pages/MyBookings';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import FlightSearch from './pages/FlightSearch'; 

const AppLayout = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  // *** CHANGE: Add a check for the operator page ***
  const isOperatorPage = location.pathname.startsWith('/operator');

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* *** CHANGE: Update condition to hide Navbar on admin AND operator pages *** */}
      {!isAdminPage && !isOperatorPage && <Navbar />}
      
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<RoleBasedRedirect />} />
          <Route path="/flights" element={<FlightSearch />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/book/:flightId" element={<ProtectedRoute><BookingForm /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
          <Route path="/operator" element={<ProtectedRoute operatorOnly><OperatorDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute adminOnly><UserListPage /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute adminOnly><BookingListPage /></ProtectedRoute>} />
          <Route path="/admin/flights"  element={<ProtectedRoute adminOnly><FlightListPage /></ProtectedRoute>} />
        </Routes>
      </main>

      {/* *** CHANGE: Update condition to hide Footer on admin AND operator pages *** */}
      {!isAdminPage && !isOperatorPage && <Footer />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;