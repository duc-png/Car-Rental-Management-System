'use client'

import { useEffect, useMemo, useState } from 'react'
import VehicleCard from '../components/VehicleCard'
import { getCarsList } from '../api/cars'
import '../styles/Cars.css'

const DEFAULT_FILTERS = {
  search: '',
  brand: 'all',
  model: 'all',
  type: 'all',
  transmission: 'all',
  fuel: 'all',
  seats: 'all',
  city: 'all',
  priceMin: '',
  priceMax: '',
  onlyAvailable: true
}

function Cars() {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true)
        const data = await getCarsList()
        setCars(data || [])
        setError(null)
      } catch (err) {
        setError('Không thể tải danh sách xe')
      } finally {
        setLoading(false)
      }
    }

    fetchCars()
  }, [])

  const carsByAvailability = useMemo(() => {
    const list = cars || []
    if (filters.onlyAvailable) return list.filter(car => car.status === 'AVAILABLE')
    return list
  }, [cars, filters.onlyAvailable])

  const optionFromField = (field, sourceList) => {
    const list = sourceList || carsByAvailability
    const values = Array.from(new Set(list.map(car => car[field]).filter(Boolean)))
    return values.sort((a, b) => String(a).localeCompare(String(b)))
  }

  const brandOptions = ['all', ...optionFromField('brandName')]
  const typeOptions = ['all', ...optionFromField('carTypeName')]
  const transmissionOptions = ['all', ...optionFromField('transmission')]
  const fuelOptions = ['all', ...optionFromField('fuelType')]
  const seatOptions = ['all', ...optionFromField('seatCount')]
  const cityOptions = ['all', ...optionFromField('city')]

  const modelOptions = useMemo(() => {
    const list = filters.brand === 'all'
      ? carsByAvailability
      : carsByAvailability.filter(car => car.brandName === filters.brand)
    return ['all', ...optionFromField('modelName', list)]
  }, [carsByAvailability, filters.brand])

  const filteredCars = useMemo(() => {
    const text = filters.search.trim().toLowerCase()
    const priceMin = filters.priceMin === '' ? null : Number(filters.priceMin)
    const priceMax = filters.priceMax === '' ? null : Number(filters.priceMax)

    return carsByAvailability.filter(car => {
      const matchesText = !text || `${car.brandName || ''} ${car.modelName || ''}`.toLowerCase().includes(text)
      const matchesBrand = filters.brand === 'all' || car.brandName === filters.brand
      const matchesModel = filters.model === 'all' || car.modelName === filters.model
      const matchesType = filters.type === 'all' || car.carTypeName === filters.type
      const matchesTransmission = filters.transmission === 'all' || car.transmission === filters.transmission
      const matchesFuel = filters.fuel === 'all' || car.fuelType === filters.fuel
      const matchesSeats = filters.seats === 'all' || String(car.seatCount) === String(filters.seats)
      const matchesCity = filters.city === 'all' || car.city === filters.city

      const price = car.pricePerDay != null ? Number(car.pricePerDay) : null
      const matchesPriceMin = priceMin == null || (price != null && price >= priceMin)
      const matchesPriceMax = priceMax == null || (price != null && price <= priceMax)

      return matchesText && matchesBrand && matchesModel && matchesType &&
        matchesTransmission && matchesFuel && matchesSeats && matchesCity &&
        matchesPriceMin && matchesPriceMax
    })
  }, [carsByAvailability, filters])

  const totalCount = cars?.length ?? 0
  const availableCount = (cars || []).filter(c => c.status === 'AVAILABLE').length

  const handleChange = (key, value) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'brand') next.model = 'all'
      return next
    })
  }

  const handlePriceChange = (key, value) => {
    const rawValue = value.replace(/\D/g, '')
    setFilters(prev => ({ ...prev, [key]: rawValue }))
  }

  const formatPriceDisplay = (value) => {
    if (value === '' || value == null) return ''
    const digits = String(value).replace(/\D/g, '')
    if (!digits) return ''
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  const clearFilters = () => {
    setFilters({ ...DEFAULT_FILTERS })
  }

  return (
    <div className="cars-page">
      <div className="cars-header">
        <h1>Danh sách xe</h1>
        <p>Chọn chiếc xe phù hợp từ bộ sưu tập có sẵn</p>
      </div>

      <div className="cars-container">
        <aside className="cars-sidebar">
          <div className="filter-group">
            <h3>Tìm kiếm</h3>
            <input
              type="text"
              placeholder="Hãng, mẫu xe..."
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <h3>Hãng xe</h3>
            <select
              value={filters.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả</option>
              {brandOptions.filter(b => b !== 'all').map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <h3>Mẫu xe</h3>
            <select
              value={filters.model}
              onChange={(e) => handleChange('model', e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả</option>
              {modelOptions.filter(m => m !== 'all').map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <h3>Loại xe (danh mục)</h3>
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

          <div className="filter-group">
            <h3>Giá thuê / ngày (VNĐ)</h3>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Từ (VD: 200.000)"
              value={formatPriceDisplay(filters.priceMin)}
              onChange={(e) => handlePriceChange('priceMin', e.target.value)}
              className="filter-input"
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Đến (VD: 1.000.000)"
              value={formatPriceDisplay(filters.priceMax)}
              onChange={(e) => handlePriceChange('priceMax', e.target.value)}
              className="filter-input"
              style={{ marginTop: '8px' }}
            />
          </div>

          <div className="filter-group">
            <h3>Trạng thái</h3>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.onlyAvailable}
                onChange={(e) => handleChange('onlyAvailable', e.target.checked)}
              />
              Chỉ xe còn trống (sẵn có)
            </label>
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
                  <h3 className="toolbar-title">{filteredCars.length} xe phù hợp</h3>
                  <p className="toolbar-sub">
                    {filters.onlyAvailable
                      ? `${availableCount} xe khả dụng trên hệ thống`
                      : `Tổng ${totalCount} xe (${availableCount} khả dụng)`}
                  </p>
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
