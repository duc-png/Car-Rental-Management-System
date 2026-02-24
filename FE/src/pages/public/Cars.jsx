'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import VehicleCard from '../../components/VehicleCard'
import { getCarsList, searchCars } from '../../api/cars'
import '../../styles/Cars.css'

function Cars() {
  const location = useLocation()
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchApplied, setSearchApplied] = useState(false)

  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    transmission: 'all',
    fuel: 'all',
    seats: 'all',
    city: 'all'
  })

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const addressParam = searchParams.get('address') || ''
  const pickupDateParam = searchParams.get('pickupDate') || ''
  const returnDateParam = searchParams.get('returnDate') || ''
  const pickupTimeParam = searchParams.get('pickupTime') || '09:00'
  const returnTimeParam = searchParams.get('returnTime') || '09:00'

  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true)
        const hasSearchQuery = Boolean(pickupDateParam && returnDateParam)

        const data = hasSearchQuery
          ? await searchCars({
            address: addressParam,
            pickupDate: pickupDateParam,
            returnDate: returnDateParam,
            pickupTime: pickupTimeParam,
            returnTime: returnTimeParam
          })
          : await getCarsList()

        setCars(data || [])
        setSearchApplied(hasSearchQuery)
        setError(null)
      } catch (err) {
        setError('Không thể tải danh sách xe')
      } finally {
        setLoading(false)
      }
    }

    fetchCars()
  }, [addressParam, pickupDateParam, returnDateParam, pickupTimeParam, returnTimeParam])

  const availableCars = useMemo(
    () => (cars || []).filter(car => car.status === 'AVAILABLE'),
    [cars]
  )

  const optionFromField = (field) => {
    const values = Array.from(new Set(availableCars.map(car => car[field]).filter(Boolean)))
    return values
  }

  const typeOptions = ['all', ...optionFromField('carTypeName')]
  const transmissionOptions = ['all', ...optionFromField('transmission')]
  const fuelOptions = ['all', ...optionFromField('fuelType')]
  const seatOptions = ['all', ...optionFromField('seatCount')]
  const cityOptions = ['all', ...optionFromField('city')]

  const filteredCars = useMemo(() => {
    const text = filters.search.trim().toLowerCase()
    return availableCars.filter(car => {
      const matchesText = !text || `${car.brandName} ${car.modelName}`.toLowerCase().includes(text)
      const matchesType = filters.type === 'all' || car.carTypeName === filters.type
      const matchesTransmission = filters.transmission === 'all' || car.transmission === filters.transmission
      const matchesFuel = filters.fuel === 'all' || car.fuelType === filters.fuel
      const matchesSeats = filters.seats === 'all' || String(car.seatCount) === String(filters.seats)
      const matchesCity = filters.city === 'all' || car.city === filters.city

      return matchesText && matchesType && matchesTransmission && matchesFuel && matchesSeats && matchesCity
    })
  }, [availableCars, filters])

  const totalAvailable = availableCars.length

  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({ search: '', type: 'all', transmission: 'all', fuel: 'all', seats: 'all', city: 'all' })
  }

  return (
    <div className="cars-page">
      <div className="cars-container">
        <aside className="cars-sidebar">
          <div className="filter-group">
            <h3>Tìm kiếm</h3>
            <input
              type="text"
              placeholder="Tìm theo hãng hoặc mẫu..."
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              className="filter-search-input"
            />
          </div>

          <div className="filter-group">
            <h3>Loại xe</h3>
            {typeOptions.map(opt => (
              <label key={opt}>
                <input
                  type="radio"
                  name="type"
                  checked={filters.type === opt}
                  onChange={() => handleChange('type', opt)}
                />
                {opt === 'all' ? 'Tất cả' : opt}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h3>Hộp số</h3>
            {transmissionOptions.map(opt => (
              <label key={opt}>
                <input
                  type="radio"
                  name="transmission"
                  checked={filters.transmission === opt}
                  onChange={() => handleChange('transmission', opt)}
                />
                {opt === 'all' ? 'Tất cả' : opt === 'AUTOMATIC' ? 'Tự động' : 'Số sàn'}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h3>Nhiên liệu</h3>
            {fuelOptions.map(opt => (
              <label key={opt}>
                <input
                  type="radio"
                  name="fuel"
                  checked={filters.fuel === opt}
                  onChange={() => handleChange('fuel', opt)}
                />
                {opt === 'all' ? 'Tất cả' : opt === 'DIESEL' ? 'Dầu' : opt === 'PETROL' ? 'Xăng' : opt}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h3>Số ghế</h3>
            {seatOptions.map(opt => (
              <label key={opt}>
                <input
                  type="radio"
                  name="seats"
                  checked={filters.seats === opt}
                  onChange={() => handleChange('seats', opt)}
                />
                {opt === 'all' ? 'Tất cả' : `${opt} chỗ`}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h3>Khu vực</h3>
            {cityOptions.map(opt => (
              <label key={opt}>
                <input
                  type="radio"
                  name="city"
                  checked={filters.city === opt}
                  onChange={() => handleChange('city', opt)}
                />
                {opt === 'all' ? 'Tất cả' : opt}
              </label>
            ))}
          </div>

          <button
            onClick={clearFilters}
            className="clear-btn full-width"
          >
            Xóa bộ lọc
          </button>
        </aside>

        <section className="cars-content">
          {loading && <div>Đang tải danh sách xe...</div>}
          {error && <div style={{ color: '#e74c3c' }}>{error}</div>}

          {!loading && !error && (
            <>
              <div className="cars-toolbar">
                <div>
                  {searchApplied && (
                    <p className="toolbar-sub">
                      Kết quả tìm kiếm cho {addressParam || 'tất cả khu vực'} • {pickupDateParam} - {returnDateParam}
                    </p>
                  )}
                  {/* <p className="toolbar-kicker">Chỉ hiển thị xe còn trống</p> */}
                  {/* <h3 className="toolbar-title">{filteredCars.length} xe phù hợp</h3> */}
                  {/* <p className="toolbar-sub">Tổng {totalAvailable} xe khả dụng trên hệ thống</p> */}
                </div>
                <button className="clear-btn" onClick={clearFilters}>Xóa bộ lọc</button>
              </div>

              <div className="vehicles-grid">
                {filteredCars.length === 0 ? (
                  <div>Không có xe phù hợp bộ lọc</div>
                ) : (
                  filteredCars.map(car => (
                    <VehicleCard key={car.id} vehicle={car} />
                  ))
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default Cars
