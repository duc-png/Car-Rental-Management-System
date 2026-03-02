import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getMyBookings, updateBookingStatus } from '../api/bookings'
import { useAuth } from '../hooks/useAuth'
import ReturnInspectionModal from '../components/ReturnInspectionModal'
import DisputeChatModal from '../components/DisputeChatModal'
import '../styles/MyBookings.css'

function ManageRentals() {
    const [rentals, setRentals] = useState([])
    const [loading, setLoading] = useState(true)
    const [showReturnModal, setShowReturnModal] = useState(false)
    const [showChatModal, setShowChatModal] = useState(false)
    const [selectedBooking, setSelectedBooking] = useState(null)
    const { user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (user) {
            fetchRentals()
        }
    }, [user])

    const fetchRentals = async () => {
        try {
            const data = await getMyBookings()
            const myRentals = data.filter(booking => booking.ownerId === user?.userId)
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
            fetchRentals()
        } catch (error) {
            console.error('Update failed:', error)
            toast.error('Failed to update booking status')
        }
    }

    const handleReturnInspection = (booking) => {
        setSelectedBooking(booking)
        setShowReturnModal(true)
    }

    const handleOpenChat = (booking) => {
        setSelectedBooking(booking)
        setShowChatModal(true)
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

    const getReturnStatusLabel = (returnStatus) => {
        const labels = {
            'NOT_RETURNED': null,
            'PENDING_INSPECTION': 'Pending Inspection',
            'FEES_CALCULATED': 'Awaiting Customer Confirm',
            'CUSTOMER_CONFIRMED': 'Customer Confirmed',
            'DISPUTED': 'Disputed',
            'RESOLVED': 'Resolved'
        }
        return labels[returnStatus] || null
    }

    const getReturnStatusColor = (returnStatus) => {
        const colors = {
            'FEES_CALCULATED': '#f59e0b',
            'DISPUTED': '#ef4444',
            'RESOLVED': '#10b981',
            'CUSTOMER_CONFIRMED': '#10b981'
        }
        return colors[returnStatus] || '#6b7280'
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
                            <div className="booking-image">
                                <img
                                    src={booking.vehicleImage || '/placeholder.svg'}
                                    alt={booking.vehicleName || `Vehicle #${booking.vehicleId}`}
                                />
                            </div>

                            <div className="booking-details">
                                <h3>{booking.vehicleName || `Vehicle #${booking.vehicleId}`}</h3>
                                <div className="booking-info">
                                    <p><strong>Renter:</strong> {booking.renterName || 'N/A'} {booking.renterEmail && `(${booking.renterEmail})`}</p>
                                    <p><strong>Dates:</strong> {booking.startDate ? new Date(booking.startDate).toLocaleDateString() : 'N/A'} - {booking.endDate ? new Date(booking.endDate).toLocaleDateString() : 'N/A'}</p>
                                    <p><strong>Total:</strong> ${(booking.totalPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    
                                    {booking.totalAdditionalFees > 0 && (
                                        <p><strong>Extra Fees:</strong> <span style={{color: '#f87171', fontWeight: 600}}>+${booking.totalAdditionalFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                                    )}
                                    
                                    <div className="booking-status">
                                        <span className={`status-badge ${getStatusColor(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                        {getReturnStatusLabel(booking.returnStatus) && (
                                            <span 
                                                className="status-badge" 
                                                style={{ 
                                                    background: getReturnStatusColor(booking.returnStatus)
                                                }}
                                            >
                                                {getReturnStatusLabel(booking.returnStatus)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

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

                                {booking.status === 'ONGOING' && booking.returnStatus === 'NOT_RETURNED' && (
                                    <button
                                        className="btn-view"
                                        style={{ background: '#3b82f6', color: 'white' }}
                                        onClick={() => handleReturnInspection(booking)}
                                    >
                                        Return Inspection
                                    </button>
                                )}

                                {booking.returnStatus === 'DISPUTED' && (
                                    <button
                                        className="btn-view"
                                        style={{ background: '#f59e0b', color: 'white' }}
                                        onClick={() => handleOpenChat(booking)}
                                    >
                                        Open Chat
                                    </button>
                                )}

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

            {showReturnModal && selectedBooking && (
                <ReturnInspectionModal
                    booking={selectedBooking}
                    onClose={() => {
                        setShowReturnModal(false)
                        setSelectedBooking(null)
                    }}
                    onSuccess={() => {
                        fetchRentals()
                    }}
                />
            )}

            {showChatModal && selectedBooking && (
                <DisputeChatModal
                    booking={selectedBooking}
                    isOwner={true}
                    onClose={() => {
                        setShowChatModal(false)
                        setSelectedBooking(null)
                    }}
                    onResolved={() => {
                        fetchRentals()
                    }}
                />
            )}
        </div>
    )
}

export default ManageRentals
