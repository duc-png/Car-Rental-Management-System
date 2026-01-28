'use client';

import { useState } from 'react';
import '../styles/LocationModal.css';

function LocationModal({ isOpen, onClose, onSelect }) {
    const [searchInput, setSearchInput] = useState('TP. Hồ Chí Minh');
    const [selectedLocation, setSelectedLocation] = useState('TP. Hồ Chí Minh');

    const airports = [
        { id: 1, name: 'Tân Sơn Nhất', icon: '✈️' },
        { id: 2, name: 'Ga T3 (TSN)', icon: '✈️' },
        { id: 3, name: 'Nội Bài', icon: '✈️' },
        { id: 4, name: 'Đà Nẵng', icon: '✈️' },
        { id: 5, name: 'Cam Ranh', icon: '✈️' },
        { id: 6, name: 'Phú Quốc', icon: '✈️' },
        { id: 7, name: 'Liên Khương', icon: '✈️' },
    ];

    const cities = [
        'TP. Hồ Chí Minh',
        'Hà Nội',
        'Đà Nẵng',
        'Biên Hòa',
        'Cần Thơ',
        'Nha Trang',
    ];

    const handleLocationSelect = (location) => {
        setSelectedLocation(location);
        onSelect(location);
        onClose();
    };

    const handleAirportSelect = (airport) => {
        setSelectedLocation(airport.name);
        onSelect(airport.name);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="location-modal-overlay" onClick={onClose}>
            <div className="location-modal" onClick={(e) => e.stopPropagation()}>
                <div className="location-modal-header">
                    <h2>Địa điểm</h2>
                    <button className="location-modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="location-modal-content">
                    {/* Search Input */}
                    <div className="location-search">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <input
                            type="text"
                            placeholder="Nhập địa điểm"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>

                    {/* Current Location */}
                    <div className="location-section">
                        <button className="location-item current-location">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="12" cy="12" r="1"></circle>
                                <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m2.12 2.12l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m2.12-2.12l4.24-4.24M19.78 19.78l-4.24-4.24m-2.12-2.12l-4.24-4.24"></path>
                            </svg>
                            <span>Vị trí hiện tại</span>
                        </button>
                    </div>

                    {/* Airport Locations */}
                    <div className="location-section">
                        <h3>Giao xe sân bay</h3>
                        <div className="location-grid">
                            {airports.map((airport) => (
                                <button
                                    key={airport.id}
                                    className={`location-airport-btn ${selectedLocation === airport.name ? 'active' : ''
                                        }`}
                                    onClick={() => handleAirportSelect(airport)}
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"></path>
                                    </svg>
                                    {airport.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* City Locations */}
                    <div className="location-section">
                        <h3>Thành phố khác</h3>
                        <div className="location-grid">
                            {cities.map((city) => (
                                <button
                                    key={city}
                                    className={`location-city-btn ${selectedLocation === city ? 'active' : ''
                                        }`}
                                    onClick={() => handleLocationSelect(city)}
                                >
                                    {city}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LocationModal;
