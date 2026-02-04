import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { getMyBookings, updateBookingStatus } from '../api/bookings'
import { useAuth } from '../hooks/useAuth'
import '../styles/MyBookings.css' // Reuse main styles for consistency

function ManageRentals() {
    const [rentals, setRentals] = useState([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    useEffect(() => {
        if (user) {
            fetchRentals()
        }
    }, [user])

    const fetchRentals = async () => {
        try {
            const data = await getMyBookings()
            // Filter only bookings where I am the owner
            // Note: user.userId comes from decoded JWT in AuthContext
            const myRentals = data.filter(booking => booking.ownerId === user?.userId)

            // Sort by date desc
            myRentals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

            setRentals(myRentals)
        } catch (error) {
            console.error('Failed to fetch rentals:', error)
            toast.error('Failed to load rental requests')
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (bookingId, newStatus) => {
        try {
            if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return

            await updateBookingStatus(bookingId, newStatus)
            toast.success(`Booking updated to ${newStatus}`)
            fetchRentals() // Refresh list
        } catch (error) {
            console.error('Update failed:', error)
            toast.error('Failed to update booking status')
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'pending'
            case 'CONFIRMED': return 'confirmed'
            case 'ONGOING': return 'ongoing'
            case 'COMPLETED': return 'completed'
            case 'CANCELLED': return 'cancelled'
            default: return ''
        }
    }

    if (loading) {
        return (
            <div className="bookings-page">
                <div className="bookings-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading your rentals...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bookings-page">
            <div className="bookings-header">
                <h1>Rental Management</h1>
                <p>Manage incoming booking requests for your vehicles.</p>
            </div>

            <div className="bookings-list">
                {rentals.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📂</div>
                        <h3>No rental requests yet</h3>
                        <p>Once users book your cars, they will appear here.</p>
                    </div>
                ) : (
                    rentals.map((booking) => (
                        <div key={booking.id} className={`booking-card ${getStatusColor(booking.status)}`}>
                            {/* Left: Image */}
                            <div className="booking-image">
                                <img
                                    src={booking.vehicleImage || '/placeholder.svg'}
                                    alt={booking.vehicleName || `Vehicle #${booking.vehicleId}`}
                                />
                            </div>

                            {/* Middle: Info */}
                            <div className="booking-details">
                                <h3>{booking.vehicleName}</h3>
                                <div className="booking-info">
                                    <p><strong>Renter:</strong> {booking.renterName} ({booking.renterEmail})</p>
                                    <p><strong>Dates:</strong> {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</p>
                                    <p><strong>Total:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(booking.totalPrice)}</p>
                                    <div className="booking-status">
                                        <span className={`status-badge ${getStatusColor(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="booking-actions">
                                {booking.status === 'PENDING' && (
                                    <>
                                        <button
                                            className="btn-view"
                                            style={{ background: '#10b981', color: 'white' }}
                                            onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')}
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            className="btn-cancel"
                                            onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')}
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}

                                {booking.status === 'CONFIRMED' && (
                                    <button
                                        className="btn-view"
                                        style={{ background: '#8b5cf6', color: 'white' }}
                                        onClick={() => handleStatusUpdate(booking.id, 'ONGOING')}
                                    >
                                        Start Trip
                                    </button>
                                )}

                                {booking.status === 'ONGOING' && (
                                    <button
                                        className="btn-view"
                                        style={{ background: '#3b82f6', color: 'white' }}
                                        onClick={() => handleStatusUpdate(booking.id, 'COMPLETED')}
                                    >
                                        Complete
                                    </button>
                                )}

                                {/* Always allow cancel if active? No, maybe restricted. Using backend rules. */}
                                {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                                    <button
                                        className="btn-cancel"
                                        onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default ManageRentals
