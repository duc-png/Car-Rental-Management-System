'use client';

import { useState } from 'react'
import '../styles/SearchBar.css'
import LocationModal from './LocationModal'
import TimeModal from './TimeModal'

function SearchBar({ onSearch }) {
  const [location, setLocation] = useState('TP. Hồ Chí Minh')
  const [pickupDate, setPickupDate] = useState('21/01/2026')
  const [returnDate, setReturnDate] = useState('22/01/2026')
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
    if (timeData.type === 'day') {
      // timeData.startDate và endDate đã là định dạng 'dd/mm/yyyy' từ TimeModal
      setPickupDate(timeData.startDate)
      setReturnDate(timeData.endDate)
      setPickupTime(timeData.startTime || '21:00')
      setReturnTime(timeData.endTime || '20:00')
    } else {
      // Hour rental - chỉ hiển thị ngày, không thêm /01/2026
      setPickupDate(timeData.startDate)
      setReturnDate(timeData.startDate)
      setPickupTime(timeData.startTime || '09:00')
      setReturnTime(timeData.startTime || '09:00')
    }
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
