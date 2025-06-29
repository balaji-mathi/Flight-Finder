// frontend/src/pages/UserListPage.js
// MODIFIED - To show operator status and add approval/rejection buttons.

import React, { useState, useEffect } from 'react';
import { Container, Alert, Spinner, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './UserListPage.css';

const UserListPage = () => {
    const { logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [operators, setOperators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchUsersAndOperators = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data.filter(u => u.role === 'user'));
            setOperators(res.data.filter(u => u.role === 'operator'));
        } catch (err) {
            setError('Failed to fetch user data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchUsersAndOperators();
    }, []);

    // Handler to approve an operator
    const handleApprove = async (operatorId) => {
        if (!window.confirm('Are you sure you want to approve this operator?')) return;
        try {
            const res = await api.put(`/admin/${operatorId}/approve`);
            // Update the state locally to reflect the change immediately
            setOperators(prevOperators => 
                prevOperators.map(op => 
                    op._id === operatorId ? res.data.operator : op
                )
            );
        } catch (err) {
            setError('Failed to approve operator.');
            console.error(err);
        }
    };

    // Handler to reject an operator
    const handleReject = async (operatorId) => {
        const reason = prompt('Please provide a reason for rejection (optional):');
        if (reason === null) return; // User clicked cancel
        try {
            const res = await api.put(`/admin/${operatorId}/reject`, { rejectionReason: reason });
            // Update state locally
            setOperators(prevOperators => 
                prevOperators.map(op => 
                    op._id === operatorId ? res.data.operator : op
                )
            );
        } catch (err) {
            setError('Failed to reject operator.');
            console.error(err);
        }
    };

    const UserCard = ({ user }) => (
        <div className="user-info-card">
            <span><strong>UserId</strong> {user._id}</span>
            <span><strong>Username</strong> {user.firstName}</span>
            <span><strong>Email</strong> {user.email}</span>
        </div>
    );

    // Modified OperatorCard to include status and action buttons
    const OperatorCard = ({ operator, onApprove, onReject }) => {
        const status = operator.operatorDetails?.approvalStatus || 'pending';
        let badgeVariant = 'secondary';
        if (status === 'approved') badgeVariant = 'success';
        if (status === 'pending') badgeVariant = 'warning';
        if (status === 'rejected') badgeVariant = 'danger';

        return (
            <div className="user-info-card">
                <span><strong>Id</strong> {operator._id}</span>
                <span><strong>Flight Name</strong> {operator.operatorDetails?.companyName || 'N/A'}</span>
                <span><strong>Email</strong> {operator.email}</span>
                <span className="operator-status">
                    <strong>Status</strong> 
                    <Badge bg={badgeVariant} text={badgeVariant === 'warning' ? 'dark' : 'white'} pill>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                </span>
                <div className="operator-actions">
                    {status === 'pending' && (
                        <>
                            <Button variant="outline-success" size="sm" onClick={() => onApprove(operator._id)}>Approve</Button>
                            <Button variant="outline-danger" size="sm" onClick={() => onReject(operator._id)}>Reject</Button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="admin-users-page">
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
                    {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                    
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" />
                            <p className="mt-2">Loading Users...</p>
                        </div>
                    ) : (
                        <>
                            <section className="user-section">
                                <h2 className="section-title">All Users</h2>
                                {users.length > 0 ? (
                                    users.map(user => <UserCard key={user._id} user={user} />)
                                ) : (
                                    <p>No regular users found.</p>
                                )}
                            </section>

                            <section className="user-section">
                                <h2 className="section-title">Flight Operators</h2>
                                {operators.length > 0 ? (
                                    operators.map(op => <OperatorCard key={op._id} operator={op} onApprove={handleApprove} onReject={handleReject} />)
                                ) : (
                                    <p>No flight operators found.</p>
                                )}
                            </section>
                        </>
                    )}
                </Container>
            </main>
        </div>
    );
};

export default UserListPage;