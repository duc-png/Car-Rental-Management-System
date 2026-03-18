'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import VehicleCard from '../../components/vehicle/VehicleCard'
import { getCarsList, searchCars } from '../../api/cars'
import '../../styles/Cars.css'

const normalizeLocationName = (value) => {
  if (!value) return ''

  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(thanh\s*pho|tp\.?|tinh|city)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function Cars() {
  const location = useLocation()
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchApplied, setSearchApplied] = useState(false)
  const [sortBy, setSortBy] = useState('price-asc')

  const [filters, setFilters] = useState({
    search: '',
    brand: 'all',
    model: 'all',
    type: 'all',
    transmission: 'all',
    fuel: 'all',
    seats: 'all',
    city: 'all',
    priceMin: '',
    priceMax: ''
  })

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])

  const addressParam = searchParams.get('address') || ''
  const pickupDateParam = searchParams.get('pickupDate') || ''
  const returnDateParam = searchParams.get('returnDate') || ''
  const pickupTimeParam = searchParams.get('pickupTime') || '09:00'
  const returnTimeParam = searchParams.get('returnTime') || '09:00'
  const normalizedAddressParam = useMemo(() => normalizeLocationName(addressParam), [addressParam])

  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true)
        const hasSearchQuery = Boolean(pickupDateParam && returnDateParam)

        let data = hasSearchQuery
          ? await searchCars({
            address: addressParam,
            pickupDate: pickupDateParam,
            returnDate: returnDateParam,
            pickupTime: pickupTimeParam,
            returnTime: returnTimeParam
          })
          : await getCarsList()

        if (
          hasSearchQuery
          && (!Array.isArray(data) || data.length === 0)
          && normalizedAddressParam
          && normalizedAddressParam !== addressParam.trim().toLowerCase()
        ) {
          data = await searchCars({
            address: normalizedAddressParam,
            pickupDate: pickupDateParam,
            returnDate: returnDateParam,
            pickupTime: pickupTimeParam,
            returnTime: returnTimeParam
          })
        }

        setCars(data || [])
        setSearchApplied(hasSearchQuery)
        setError(null)
      } catch {
        setError('Không thể tải danh sách xe')
      } finally {
        setLoading(false)
      }
    }

    fetchCars()
  }, [addressParam, normalizedAddressParam, pickupDateParam, returnDateParam, pickupTimeParam, returnTimeParam])

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
  const brandOptions = ['all', ...optionFromField('brandName')]
  const modelOptions = useMemo(() => {
    const source = filters.brand === 'all'
      ? availableCars
      : availableCars.filter(car => car.brandName === filters.brand)
    const values = Array.from(new Set(source.map(car => car.modelName).filter(Boolean)))
    return ['all', ...values]
  }, [availableCars, filters.brand])
  const cityOptions = useMemo(() => {
    const byNormalized = new Map()

    availableCars.forEach((car) => {
      const rawCity = String(car.province || car.city || '').trim()
      if (!rawCity) return

      const normalizedCity = normalizeLocationName(rawCity)
      if (!normalizedCity) return

      if (!byNormalized.has(normalizedCity) || rawCity.length < byNormalized.get(normalizedCity).length) {
        byNormalized.set(normalizedCity, rawCity)
      }
    })

    return ['all', ...Array.from(byNormalized.entries()).map(([value, label]) => ({ value, label }))]
  }, [availableCars])

  const filteredCars = useMemo(() => {
    const text = filters.search.trim().toLowerCase()
    return availableCars.filter(car => {
      const matchesText = !text || `${car.brandName} ${car.modelName}`.toLowerCase().includes(text)
      const matchesBrand = filters.brand === 'all' || car.brandName === filters.brand
      const matchesModel = filters.model === 'all' || car.modelName === filters.model
      const matchesType = filters.type === 'all' || car.carTypeName === filters.type
      const matchesTransmission = filters.transmission === 'all' || car.transmission === filters.transmission
      const matchesFuel = filters.fuel === 'all' || car.fuelType === filters.fuel
      const matchesSeats = filters.seats === 'all' || String(car.seatCount) === String(filters.seats)
      const carCityNormalized = normalizeLocationName(car.province || car.city)
      const matchesCity = filters.city === 'all' || carCityNormalized === filters.city
      const price = Number(car.pricePerDay || 0)
      const matchesPriceMin = !filters.priceMin || price >= Number(filters.priceMin)
      const matchesPriceMax = !filters.priceMax || price <= Number(filters.priceMax)

      return matchesText
        && matchesBrand
        && matchesModel
        && matchesType
        && matchesTransmission
        && matchesFuel
        && matchesSeats
        && matchesCity
        && matchesPriceMin
        && matchesPriceMax
    })
  }, [availableCars, filters])

  const sortedCars = useMemo(() => {
    const list = [...filteredCars]

    if (sortBy === 'price-desc') {
      return list.sort((a, b) => Number(b.pricePerDay || 0) - Number(a.pricePerDay || 0))
    }

    if (sortBy === 'name-asc') {
      return list.sort((a, b) => `${a.brandName || ''} ${a.modelName || ''}`.localeCompare(`${b.brandName || ''} ${b.modelName || ''}`))
    }

    return list.sort((a, b) => Number(a.pricePerDay || 0) - Number(b.pricePerDay || 0))
  }, [filteredCars, sortBy])

  const handleChange = (key, value) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'brand') {
        next.model = 'all'
      }
      return next
    })
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      brand: 'all',
      model: 'all',
      type: 'all',
      transmission: 'all',
      fuel: 'all',
      seats: 'all',
      city: 'all',
      priceMin: '',
      priceMax: ''
    })
  }

  return (
    <div className="cars-page">
      <div className="cars-container">
        <aside className="cars-sidebar">
          <div className="cars-filter-group">
            <h3>Tìm kiếm</h3>
            <div className="cars-filter-search-wrap">
              <input
                type="text"
                placeholder="Hãng xe, dòng xe..."
                value={filters.search}
                onChange={(e) => handleChange('search', e.target.value)}
                className="cars-filter-search-input"
              />
              <Search className="cars-filter-search-icon" size={16} aria-hidden="true" />
            </div>
          </div>

          <div className="cars-filter-group">
            <h3>Hãng xe</h3>
            {brandOptions.map(opt => (
              <label key={opt}>
                <input
                  type="radio"
                  name="brand"
                  checked={filters.brand === opt}
                  onChange={() => handleChange('brand', opt)}
                />
                {opt === 'all' ? 'Tất cả' : opt}
              </label>
            ))}
          </div>

          <div className="cars-filter-group">
            <h3>Dòng xe</h3>
            {modelOptions.map(opt => (
              <label key={opt}>
                <input
                  type="radio"
                  name="model"
                  checked={filters.model === opt}
                  onChange={() => handleChange('model', opt)}
                />
                {opt === 'all' ? 'Tất cả' : opt}
              </label>
            ))}
          </div>

          <div className="cars-filter-group">
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

          <div className="cars-filter-group">
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

          <div className="cars-filter-group">
            <h3>Nhiên liệu</h3>
            {fuelOptions.map(opt => (
              <label key={opt}>
                <input
                  type="radio"
                  name="fuel"
                  checked={filters.fuel === opt}
                  onChange={() => handleChange('fuel', opt)}
                />
                {opt === 'all' ? 'Tất cả' : opt === 'DIESEL' ? 'Dầu' : opt === 'GASOLINE' ? 'Xăng' : opt}
              </label>
            ))}
          </div>

          <div className="cars-filter-group">
            <h3>Số ghế</h3>
            {seatOptions.map(opt => (
              <label key={opt}>
                <input
                  type="radio"
                  name="seats"
                  checked={filters.seats === opt}
                  onChange={() => handleChange('seats', opt)}
                />
                {opt === 'all' ? 'Tất cả' : `${opt}`}
              </label>
            ))}
          </div>

          <div className="cars-filter-group">
            <h3>Khoảng giá (VND/ngày)</h3>
            <div className="price-range-inputs">
              <input
                type="number"
                placeholder="Từ"
                value={filters.priceMin}
                onChange={(e) => handleChange('priceMin', e.target.value)}
                className="filter-input"
                min="0"
              />
              <input
                type="number"
                placeholder="Đến"
                value={filters.priceMax}
                onChange={(e) => handleChange('priceMax', e.target.value)}
                className="filter-input"
                min="0"
              />
            </div>
          </div>

          <div className="cars-filter-group">
            <h3>Khu vực</h3>
            {cityOptions.map(opt => (
              <label key={typeof opt === 'string' ? opt : opt.value}>
                <input
                  type="radio"
                  name="city"
                  checked={filters.city === (typeof opt === 'string' ? opt : opt.value)}
                  onChange={() => handleChange('city', typeof opt === 'string' ? opt : opt.value)}
                />
                {opt === 'all' ? 'Tất cả' : opt.label}
              </label>
            ))}
          </div>

          <button
            onClick={clearFilters}
            className="cars-clear-btn cars-full-width"
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
                <div className="cars-toolbar-left">
                  <div className="toolbar-title-row">
                    {/* <h3 className="toolbar-title">{sortedCars.length} kết quả được tìm thấy</h3> */}
                  </div>
                  {searchApplied && (
                    <p className="toolbar-sub">
                      Kết quả tìm kiếm cho {addressParam || 'tất cả khu vực'} • {pickupDateParam} - {returnDateParam}
                    </p>
                  )}
                </div>

                <div className="cars-sort-wrap">
                  <label htmlFor="cars-sort" className="cars-sort-label">Sắp xếp theo:</label>
                  <select
                    id="cars-sort"
                    className="cars-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="price-asc">Giá tốt nhất</option>
                    <option value="price-desc">Giá cao nhất</option>
                    <option value="name-asc">Tên xe (A-Z)</option>
                  </select>
                </div>
              </div>

              <div className="vehicles-grid">
                {sortedCars.length === 0 ? (
                  <div>Không có xe phù hợp bộ lọc</div>
                ) : (
                  sortedCars.map(car => (
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
