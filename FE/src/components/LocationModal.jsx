'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import '../styles/LocationModal.css';
import { reverseGeocode } from '../utils/carDetailsUtils';

const AIRPORTS = [
    { id: 1, name: 'Tân Sơn Nhất', icon: '✈️' },
    { id: 2, name: 'Ga T3 (TSN)', icon: '✈️' },
    { id: 3, name: 'Nội Bài', icon: '✈️' },
    { id: 4, name: 'Đà Nẵng', icon: '✈️' },
    { id: 5, name: 'Cam Ranh', icon: '✈️' },
    { id: 6, name: 'Phú Quốc', icon: '✈️' },
    { id: 7, name: 'Liên Khương', icon: '✈️' },
];

const CITIES = [
    'TP. Hồ Chí Minh',
    'Hà Nội',
    'Đà Nẵng',
    'Biên Hòa',
    'Cần Thơ',
    'Nha Trang',
];

function LocationModal({ isOpen, onClose, onSelect, value }) {
    const [searchInput, setSearchInput] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [currentLocationName, setCurrentLocationName] = useState(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    const [placeSuggestions, setPlaceSuggestions] = useState([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [suggestionError, setSuggestionError] = useState(null);

    useEffect(() => {
        if (!isOpen) return;
        const next = value || '';
        setSelectedLocation(next);
        setSearchInput('');
    }, [isOpen, value]);

    const normalizedQuery = searchInput.trim().toLowerCase();

    const formatSuggestionForSearch = (item) => {
        const address = item?.address || {};
        const city = address.city || address.town || address.state || address.province;
        const district = address.city_district || address.county || address.district || address.suburb;

        let detail = '';
        if (address.house_number && address.road) detail = `${address.house_number} ${address.road}`;
        else if (address.road) detail = address.road;
        else if (address.amenity) detail = address.amenity;
        else if (address.neighbourhood) detail = address.neighbourhood;
        else if (item?.name) detail = item.name;

        const parts = [detail, district, city].filter(Boolean);
        return parts.join(', ') || item?.display_name || '';
    };

    useEffect(() => {
        if (!isOpen) return;
        const query = searchInput.trim();

        if (!query) {
            setPlaceSuggestions([]);
            setSuggestionError(null);
            return;
        }

        if (query.length < 2) {
            setPlaceSuggestions([]);
            setSuggestionError(null);
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(async () => {
            try {
                setIsLoadingSuggestions(true);
                setSuggestionError(null);

                const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&addressdetails=1&limit=10&countrycodes=vn`;
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'Accept-Language': 'vi'
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch suggestions');
                const data = await response.json();
                setPlaceSuggestions(Array.isArray(data) ? data : []);
            } catch (error) {
                if (error?.name === 'AbortError') return;
                setSuggestionError('Không thể tải gợi ý địa điểm');
                setPlaceSuggestions([]);
            } finally {
                setIsLoadingSuggestions(false);
            }
        }, 350);

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [isOpen, searchInput]);

    const filteredAirports = useMemo(() => {
        if (!normalizedQuery) return AIRPORTS;
        return AIRPORTS.filter((airport) => airport.name.toLowerCase().includes(normalizedQuery));
    }, [normalizedQuery]);

    const filteredCities = useMemo(() => {
        if (!normalizedQuery) return CITIES;
        return CITIES.filter((city) => city.toLowerCase().includes(normalizedQuery));
    }, [normalizedQuery]);

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

    const handleManualLocationSelect = () => {
        const manualLocation = searchInput.trim();
        if (!manualLocation) return;

        setSelectedLocation(manualLocation);
        onSelect(manualLocation);
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
                    const locationName = await reverseGeocode(latitude, longitude)
                        || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

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

    const showSuggestions = Boolean(searchInput.trim());

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
                            placeholder="Nhập địa chỉ cụ thể (VD: 123 Le Loi, District 1, Ho Chi Minh)"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleManualLocationSelect();
                                }
                            }}
                        />

                        {searchInput.trim() && (
                            <button
                                type="button"
                                className="location-search-clear"
                                onClick={() => setSearchInput('')}
                                aria-label="Xóa tìm kiếm"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {showSuggestions ? (
                        <div className="location-suggestions">
                            <button
                                type="button"
                                className="location-suggestion-item"
                                onClick={handleManualLocationSelect}
                            >
                                <span className="location-suggestion-icon" aria-hidden="true">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                </span>
                                <span className="location-suggestion-text">{searchInput.trim()}</span>
                            </button>

                            {isLoadingSuggestions && (
                                <p className="location-empty">Đang tìm kiếm...</p>
                            )}

                            {!isLoadingSuggestions && suggestionError && (
                                <p className="location-empty">{suggestionError}</p>
                            )}

                            {!isLoadingSuggestions && !suggestionError && placeSuggestions.map((item) => {
                                const label = item?.display_name || '';
                                const valueForSearch = formatSuggestionForSearch(item);
                                return (
                                    <button
                                        type="button"
                                        key={`${item.place_id}-${label}`}
                                        className={`location-suggestion-item ${selectedLocation === valueForSearch ? 'active' : ''}`}
                                        onClick={() => handleLocationSelect(valueForSearch)}
                                        title={label}
                                    >
                                        <span className="location-suggestion-icon" aria-hidden="true">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="9"></circle>
                                                <circle cx="12" cy="12" r="2"></circle>
                                            </svg>
                                        </span>
                                        <span className="location-suggestion-text">{label}</span>
                                    </button>
                                );
                            })}

                            {!isLoadingSuggestions && !suggestionError && placeSuggestions.length === 0 && (
                                <p className="location-empty">Không có gợi ý phù hợp.</p>
                            )}
                        </div>
                    ) : (
                        <>
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
                                    {filteredAirports.map((airport) => (
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
                                    {filteredAirports.length === 0 && (
                                        <p className="location-empty">Không có sân bay phù hợp từ khóa.</p>
                                    )}
                                </div>
                            </div>

                            {/* City Locations */}
                            <div className="location-section">
                                <h3>Thành phố khác</h3>
                                <div className="location-grid">
                                    {filteredCities.map((city) => (
                                        <button
                                            key={city}
                                            className={`location-city-btn ${selectedLocation === city ? 'active' : ''
                                                }`}
                                            onClick={() => handleLocationSelect(city)}
                                        >
                                            {city}
                                        </button>
                                    ))}
                                    {filteredCities.length === 0 && (
                                        <p className="location-empty">Không có thành phố phù hợp từ khóa.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

export default LocationModal;
