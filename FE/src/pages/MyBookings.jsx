'use client';

import { useState } from 'react'
import '../styles/MyBookings.css'

function MyBookings() {
  const [bookings, setBookings] = useState([
    {
      id: 1,
      carName: 'Toyota Corolla',
      pickupDate: '2024-02-01',
      returnDate: '2024-02-05',
      location: 'New York',
      status: 'Confirmed',
      totalPrice: '$750',
      image: 'https://images.unsplash.com/photo-1606611013016-969ce3defd0f?w=300&h=200&fit=crop'
    },
    {
      id: 2,
      carName: 'BMW X5',
      pickupDate: '2024-02-10',
      returnDate: '2024-02-15',
      location: 'Los Angeles',
      status: 'Pending',
      totalPrice: '$1500',
      image: 'https://images.unsplash.com/photo-1605559424843-9e4c3ca4628c?w=300&h=200&fit=crop'
    }
  ])

  const handleCancelBooking = (id) => {
    setBookings(bookings.filter(b => b.id !== id))
  }

  return (
    <div className="bookings-page">
      <div className="bookings-header">
        <h1>My Bookings</h1>
        <p>Manage your car rental reservations</p>
      </div>

      {bookings.length > 0 ? (
        <div className="bookings-list">
          {bookings.map(booking => (
            <div key={booking.id} className="booking-card">
              <div className="booking-image">
                <img src={booking.image || "/placeholder.svg"} alt={booking.carName} />
              </div>
              <div className="booking-details">
                <h3>{booking.carName}</h3>
                <div className="booking-info">
                  <p><strong>Pickup:</strong> {booking.pickupDate}</p>
                  <p><strong>Return:</strong> {booking.returnDate}</p>
                  <p><strong>Location:</strong> {booking.location}</p>
                  <p><strong>Total Price:</strong> {booking.totalPrice}</p>
                </div>
                <div className="booking-status">
                  <span className={`status-badge ${booking.status.toLowerCase()}`}>
                    {booking.status}
                  </span>
                </div>
              </div>
              <div className="booking-actions">
                <button className="btn-view">View Details</button>
                <button 
                  className="btn-cancel"
                  onClick={() => handleCancelBooking(booking.id)}
                >
                  Cancel Booking
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No bookings yet. Start by browsing our vehicles!</p>
          <a href="/cars" className="btn-browse">Browse Cars</a>
        </div>
      )}
    </div>
  )
}

export default MyBookings
