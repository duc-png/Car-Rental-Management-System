'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import '../styles/LocationModal.css';

function LocationModal({ isOpen, onClose, onSelect }) {
    const [searchInput, setSearchInput] = useState('TP. Hồ Chí Minh');
    const [selectedLocation, setSelectedLocation] = useState('TP. Hồ Chí Minh');
    const [currentLocationName, setCurrentLocationName] = useState(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

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

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Trình duyệt của bạn không hỗ trợ lấy vị trí');
            return;
        }

        setIsLoadingLocation(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                // Lấy tên địa điểm từ tọa độ (reverse geocoding)
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();
                    const locationName = data.address?.city || data.address?.province || data.address?.county || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

                    setCurrentLocationName(locationName);
                    setSelectedLocation(locationName);
                    onSelect(locationName);
                    onClose();
                } catch (error) {
                    console.error('Lỗi lấy tên địa điểm:', error);
                    const locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                    setCurrentLocationName(locationName);
                    setSelectedLocation(locationName);
                    onSelect(locationName);
                    onClose();
                } finally {
                    setIsLoadingLocation(false);
                }
            },
            (error) => {
                console.error('Lỗi lấy vị trí:', error);
                alert('Không thể lấy vị trí của bạn. Vui lòng kiểm tra quyền truy cập hoặc thử lại.');
                setIsLoadingLocation(false);
            }
        );
    };

    if (!isOpen) return null;

    const modalContent = (
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
                        <button
                            className="location-item current-location"
                            onClick={handleCurrentLocation}
                            disabled={isLoadingLocation}
                        >
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
                            <span>{isLoadingLocation ? 'Đang tìm vị trí...' : currentLocationName || 'Vị trí hiện tại'}</span>
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

    return createPortal(modalContent, document.body);
}

export default LocationModal;
