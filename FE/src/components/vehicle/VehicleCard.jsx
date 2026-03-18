import { useNavigate } from 'react-router-dom'
import { Fuel, Gauge, MapPin, Users } from 'lucide-react'
import '../../styles/VehicleCard.css'

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

  const formatFeatureValue = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A'
    return value
      .toString()
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const formatFuelType = (fuelType) => {
    const normalizedFuelType = (fuelType || '').toString().trim().toUpperCase()
    const fuelTypeMap = {
      GASOLINE: 'Xăng',
      DIESEL: 'Dầu',
      ELECTRIC: 'Điện',
      HYBRID: 'Hybrid',
      PETROL: 'Xăng'
    }

    if (fuelTypeMap[normalizedFuelType]) return fuelTypeMap[normalizedFuelType]
    return formatFeatureValue(fuelType)
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
            <span className="feature-icon-wrapper" aria-hidden="true">
              <Users className="vehicle-feature-icon" />
            </span>
            <span>{vehicle.seatCount} Chỗ </span>
          </div>
          <div className="feature">
            <span className="feature-icon-wrapper" aria-hidden="true">
              <Gauge className="vehicle-feature-icon" />
            </span>
            <span>{formatFeatureValue(vehicle.transmission)}</span>
          </div>
        </div>

        <div className="vehicle-features">
          <div className="feature">
            <span className="feature-icon-wrapper" aria-hidden="true">
              <Fuel className="vehicle-feature-icon" />
            </span>
            <span>{formatFuelType(vehicle.fuelType)}</span>
          </div>
          <div className="feature">
            <span className="feature-icon-wrapper" aria-hidden="true">
              <MapPin className="vehicle-feature-icon" />
            </span>
            <span>{formatFeatureValue(vehicle.province || vehicle.city)}</span>
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

