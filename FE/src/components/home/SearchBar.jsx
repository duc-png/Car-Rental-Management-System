'use client';

import { useState } from 'react'
import '../../styles/SearchBar.css'
import LocationModal from '../booking/LocationModal'
import TimeModal from '../booking/TimeModal'

const formatDateVi = (date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const getRealtimeDefaultDates = () => {
  const now = new Date()
  const pickup = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const returned = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return {
    pickupDate: formatDateVi(pickup),
    returnDate: formatDateVi(returned)
  }
}

function SearchBar({ onSearch }) {
  const defaultDates = getRealtimeDefaultDates()
  const [location, setLocation] = useState('TP. Hồ Chí Minh')
  const [pickupDate, setPickupDate] = useState(defaultDates.pickupDate)
  const [returnDate, setReturnDate] = useState(defaultDates.returnDate)
  const [pickupTime, setPickupTime] = useState('21:00')
  const [returnTime, setReturnTime] = useState('20:00')
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showTimeModal, setShowTimeModal] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch({
        location,
        pickupDate,
        returnDate,
        pickupTime,
        returnTime
      })
    }
  }

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation)
  }

  const handleTimeSelect = (timeData) => {
    setPickupDate(timeData.startDate)
    setReturnDate(timeData.endDate)
    setPickupTime(timeData.startTime || '21:00')
    setReturnTime(timeData.endTime || '20:00')
  }

  return (
    <>
      <div className="search-container">
        <form className="search-bar" onSubmit={handleSearch}>
          <div className="search-inputs">
            <div className="search-input-group location-group">
              <label>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>Địa điểm</span>
              </label>
              <button
                type="button"
                className="location-select-btn"
                onClick={() => setShowLocationModal(true)}
              >
                <span className="location-text">{location}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>

            <div className="search-input-group time-group">
              <label>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                  <path d="M16 2v4M8 2v4M3 10h18"></path>
                </svg>
                <span>Thời gian thuê</span>
              </label>
              <button
                type="button"
                className="time-select-btn"
                onClick={() => setShowTimeModal(true)}
              >
                <span className="time-text">{pickupDate} - {returnDate}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>

            <button type="submit" className="search-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <span>Tìm Xe</span>
            </button>
          </div>
        </form>
      </div>

      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={handleLocationSelect}
        value={location}
      />

      <TimeModal
        isOpen={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        onSelect={handleTimeSelect}
      />
    </>
  )
}

export default SearchBar

