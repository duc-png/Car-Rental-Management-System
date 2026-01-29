'use client';

import { useState } from 'react'
import '../styles/SearchBar.css'
import LocationModal from './LocationModal'
import TimeModal from './TimeModal'

function SearchBar({ onSearch }) {
  const [activeTab, setActiveTab] = useState('self-drive')
  const [location, setLocation] = useState('TP. Hồ Chí Minh')
  const [pickupDate, setPickupDate] = useState('21/01/2026')
  const [returnDate, setReturnDate] = useState('22/01/2026')
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showTimeModal, setShowTimeModal] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch({
        location,
        pickupDate,
        returnDate
      })
    }
  }

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation)
  }

  const handleTimeSelect = (timeData) => {
    if (timeData.type === 'day') {
      const monthNames = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
      setPickupDate(`${timeData.startDate}/${monthNames[0]}/2026`)
      setReturnDate(`${timeData.endDate}/${monthNames[0]}/2026`)
    } else {
      setPickupDate(`${timeData.startDate}/01/2026`)
      setReturnDate(`${timeData.startDate}/01/2026`)
    }
  }

  return (
    <>
      <div className="search-container">
        {/* Tabs moved outside the search box */}
        <div className="search-tabs">
          <button
            type="button"
            className={`search-tab ${activeTab === 'self-drive' ? 'active' : ''}`}
            onClick={() => setActiveTab('self-drive')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8C13.6569 8 15 6.65685 15 5C15 3.34315 13.6569 2 12 2C10.3431 2 9 3.34315 9 5C9 6.65685 10.3431 8 12 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M16.5 19.1538H18.1283C18.9357 19.1538 19.6639 18.6684 19.9744 17.923L20.691 16.2031C20.8893 15.7272 20.8961 15.1931 20.7101 14.7123L18.9946 10.2783C18.6965 9.50789 17.9554 9 17.1293 9H6.87067C6.04458 9 5.30349 9.50789 5.00541 10.2783L3.28991 14.7122C3.10386 15.1931 3.11071 15.7272 3.30903 16.2032L4.0257 17.9231C4.33625 18.6684 5.06446 19.1538 5.87184 19.1538H7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M7.5 18.7857L12 16.5M12 16.5L16.5 18.7857M12 16.5V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
            </svg>
            <span>Xe tự lái</span>
          </button>
          <button
            type="button"
            className={`search-tab ${activeTab === 'long-term' ? 'active' : ''}`}
            onClick={() => setActiveTab('long-term')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"></rect>
              <path d="M16 2v4M8 2v4M3 10h18"></path>
            </svg>
            <span>Thuê xe dài hạn</span>
          </button>
        </div>

        {/* Booking-style horizontal search bar */}
        <form className="search-bar" onSubmit={handleSearch}>
          <div className={`search-inputs ${activeTab === 'long-term' ? 'long-term-mode' : ''}`}>
            <div className="search-input-group location-group">
              <label>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>{activeTab === 'long-term' ? 'Địa điểm áp dụng' : 'Địa điểm'}</span>
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

            <div className="search-divider"></div>

            <div className={`search-input-group time-group ${activeTab === 'long-term' ? 'hidden-for-long-term' : ''}`}>
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
