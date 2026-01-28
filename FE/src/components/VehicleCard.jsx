import { useNavigate } from 'react-router-dom'
import '../styles/VehicleCard.css'

function VehicleCard({ vehicle }) {
  const navigate = useNavigate()

  const mainImage = vehicle.images && vehicle.images.length > 0
    ? vehicle.images.find(img => img.isMain)?.imageUrl || vehicle.images[0]?.imageUrl
    : "/placeholder.svg"

  const displayName = `${vehicle.brandName} ${vehicle.modelName}`
  const displayPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(vehicle.pricePerDay)

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return '#4ade80'
      case 'RENTED':
        return '#f97316'
      case 'MAINTENANCE':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  const handleOpenDetails = () => {
    navigate(`/car/${vehicle.id}`)
  }

  return (
    <div className="vehicle-card" onClick={handleOpenDetails}>
      <div className="vehicle-image-container">
        <img
          src={mainImage || "/placeholder.svg"}
          alt={displayName}
          className="vehicle-image"
          onError={(e) => { e.target.src = "/placeholder.svg" }}
        />
        <span className="price-badge">{displayPrice}/day</span>
        <span
          className="status-badge"
          style={{ backgroundColor: getStatusBadgeColor(vehicle.status) }}
        >
          {vehicle.status}
        </span>
      </div>

      <div className="vehicle-content">
        <h3 className="vehicle-name">{displayName}</h3>
        <p className="vehicle-year">{vehicle.carTypeName}</p>

        <div className="vehicle-features">
          <div className="feature">
            <span className="feature-icon">👥</span>
            <span>{vehicle.seatCount} Seats</span>
          </div>
          <div className="feature">
            <span className="feature-icon">⚙️</span>
            <span>{vehicle.transmission}</span>
          </div>
        </div>

        <div className="vehicle-features">
          <div className="feature">
            <span className="feature-icon">⛽</span>
            <span>{vehicle.fuelType}</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📍</span>
            <span>{vehicle.city}</span>
          </div>
        </div>
      </div>

      <button className="btn-book" disabled={vehicle.status !== 'AVAILABLE'}>
        {vehicle.status === 'AVAILABLE' ? 'Book Now' : 'Unavailable'}
      </button>
    </div>
  )
}

export default VehicleCard
