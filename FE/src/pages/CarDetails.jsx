import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import BookingModal from '../components/BookingModal';
import '../styles/CarDetails.css';

export default function CarDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showBookingModal, setShowBookingModal] = useState(false);

    useEffect(() => {
        fetchCarDetails();
    }, [id]);

    const fetchCarDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8080/api/v1/vehicles/${id || 2}`);
            const data = await response.json();

            if (data.code === 1000) {
                setCar(data.result);
                setError(null);
            } else {
                setError('Không tìm thấy thông tin xe');
            }
        } catch (err) {
            setError('Lỗi khi tải thông tin xe: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevImage = () => {
        if (car?.images?.length > 0) {
            setCurrentImageIndex((prev) => (prev - 1 + car.images.length) % car.images.length);
        }
    };

    const handleNextImage = () => {
        if (car?.images?.length > 0) {
            setCurrentImageIndex((prev) => (prev + 1) % car.images.length);
        }
    };

    const handleBookNow = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Vui lòng đăng nhập để đặt xe!');
            navigate('/login');
            return;
        }
        setShowBookingModal(true);
    };

    const handleBookingSuccess = () => {
        toast.success('Đặt xe thành công! Chờ chủ xe xác nhận.');
        navigate('/my-bookings');
    };

    if (loading) {
        return <div className="car-details-loading">Đang tải thông tin xe...</div>;
    }

    if (error) {
        return <div className="car-details-error">{error}</div>;
    }

    if (!car) {
        return <div className="car-details-error">Không tìm thấy dữ liệu xe</div>;
    }

    const mainImage = car.images?.find(img => img.isMain) || car.images?.[0];
    const currentImage = car.images?.[currentImageIndex]?.imageUrl || mainImage?.imageUrl || '/placeholder.svg';

    const statusLabel = car.status === 'AVAILABLE' ? 'Có sẵn' : 'Không sẵn'
    const fuelLabel = car.fuelType === 'DIESEL' ? 'Dầu' : car.fuelType === 'PETROL' ? 'Xăng' : car.fuelType
    const transmissionLabel = car.transmission === 'AUTOMATIC' ? 'Tự động' : 'Số sàn'

    return (
        <div className="car-details-container">
            <div className="car-hero">
                <div className="hero-content">
                    <div className="hero-text">
                        <div className="title-row">
                            <h1>{car.brandName} {car.modelName}</h1>
                            <span className={`status-pill ${car.status === 'AVAILABLE' ? 'available' : 'unavailable'}`}>
                                {statusLabel}
                            </span>
                        </div>
                        <p className="subtitle">{car.carTypeName} • {car.color} • {car.currentKm?.toLocaleString('vi-VN')} km</p>

                        <div className="meta-row">
                            <span className="meta-chip">📍 {car.city} - {car.district}</span>
                            <span className="meta-chip">🔖 Biển số {car.licensePlate}</span>
                        </div>

                        <div className="price-block">
                            <div>
                                <p className="price-label">Giá thuê / ngày</p>
                                <p className="price-value">{car.pricePerDay?.toLocaleString('vi-VN')} ₫</p>
                            </div>
                            <p className="price-note">Đã bao gồm bảo hiểm cơ bản</p>
                        </div>

                        <div className="hero-actions">
                            <button
                                className="btn-primary"
                                onClick={handleBookNow}
                                disabled={car.status !== 'AVAILABLE'}
                            >
                                Đặt xe ngay
                            </button>
                            <button className="btn-secondary">Liên hệ chủ xe</button>
                        </div>

                        <div className="hero-stats">
                            <div className="stat-pill">👥 {car.seatCount} chỗ</div>
                            <div className="stat-pill">⚙️ {transmissionLabel}</div>
                            <div className="stat-pill">⛽ {fuelLabel}</div>
                            <div className="stat-pill">🏷️ {car.carTypeName}</div>
                        </div>
                    </div>

                    <div className="hero-gallery">
                        <div className="main-image-wrapper">
                            <img
                                src={currentImage || mainImage?.imageUrl}
                                alt={`${car.brandName} ${car.modelName}`}
                                className="car-main-image"
                            />
                            {car.images && car.images.length > 1 && (
                                <>
                                    <button className="gallery-nav prev" onClick={handlePrevImage}>❮</button>
                                    <button className="gallery-nav next" onClick={handleNextImage}>❯</button>
                                </>
                            )}
                        </div>

                        {car.images && car.images.length > 1 && (
                            <div className="image-thumbnails">
                                {car.images.map((img, index) => (
                                    <img
                                        key={index}
                                        src={img.imageUrl}
                                        alt={`Ảnh ${index + 1}`}
                                        className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                                        onClick={() => setCurrentImageIndex(index)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="car-details-content">
                <div className="info-grid">
                    <div className="info-card">
                        <h3>Thông tin tổng quan</h3>
                        <div className="info-row"><span>Hãng / Dòng xe</span><span>{car.brandName} {car.modelName}</span></div>
                        <div className="info-row"><span>Loại xe</span><span>{car.carTypeName}</span></div>
                        <div className="info-row"><span>Màu sắc</span><span>{car.color}</span></div>
                        <div className="info-row"><span>Biển số</span><span>{car.licensePlate}</span></div>
                        <div className="info-row"><span>Số km hiện tại</span><span>{car.currentKm?.toLocaleString('vi-VN')} km</span></div>
                    </div>

                    <div className="info-card">
                        <h3>Thông số & vận hành</h3>
                        <div className="info-row"><span>Số ghế</span><span>{car.seatCount} chỗ</span></div>
                        <div className="info-row"><span>Hộp số</span><span>{transmissionLabel}</span></div>
                        <div className="info-row"><span>Nhiên liệu</span><span>{fuelLabel}</span></div>
                        <div className="info-row"><span>Trạng thái</span><span>{statusLabel}</span></div>
                        <div className="info-row"><span>Giá thuê / ngày</span><span>{car.pricePerDay?.toLocaleString('vi-VN')} ₫</span></div>
                    </div>

                    <div className="info-card">
                        <h3>Vị trí & nhận xe</h3>
                        <div className="info-row"><span>Thành phố</span><span>{car.city}</span></div>
                        <div className="info-row"><span>Quận / Huyện</span><span>{car.district}</span></div>
                        <div className="info-row"><span>Địa chỉ chi tiết</span><span>{car.addressDetail}</span></div>
                        <div className="info-row"><span>Mã xe</span><span>#{car.id}</span></div>
                    </div>
                </div>

                <div className="action-panel">
                    <div className="panel-card">
                        <h4>Ưu đãi & bảo hiểm</h4>
                        <ul>
                            <li>Miễn phí hủy trước 24h</li>
                            <li>Bảo hiểm cơ bản đã bao gồm</li>
                            <li>Hỗ trợ 24/7 trong suốt hành trình</li>
                        </ul>
                    </div>
                    <div className="panel-card highlight">
                        <div className="panel-price">
                            <span>Chỉ từ</span>
                            <strong>{car.pricePerDay?.toLocaleString('vi-VN')} ₫ / ngày</strong>
                        </div>
                        <button
                            className="btn-primary full"
                            onClick={handleBookNow}
                            disabled={car.status !== 'AVAILABLE'}
                        >
                            Đặt xe ngay
                        </button>
                        <button className="btn-secondary ghost">Gọi cho chủ xe</button>
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            <BookingModal
                car={car}
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                onSuccess={handleBookingSuccess}
            />
        </div>
    );
}

