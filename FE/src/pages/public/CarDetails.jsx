import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCarById, getCarsList } from '../../api/cars';
import { getOwnerById } from '../../api/owners';
import MapModal from '../../components/MapModal';
import '../../styles/CarDetails.css';

const DAY_MS = 24 * 60 * 60 * 1000;

const FALLBACK_CAR = {
    id: 0,
    brandName: 'Xe mẫu',
    modelName: 'Đang cập nhật',
    carTypeName: 'SUV',
    licensePlate: 'N/A',
    color: 'N/A',
    seatCount: 5,
    transmission: 'AUTOMATIC',
    fuelType: 'GASOLINE',
    pricePerDay: 0,
    status: 'AVAILABLE',
    currentKm: 0,
    city: 'Hồ Chí Minh',
    district: 'Quận 1',
    addressDetail: 'Đang cập nhật',
    ownerName: 'Chưa cập nhật',
    ownerPhone: 'Chưa cập nhật',
    ownerEmail: 'Chưa cập nhật',
    mainImageUrl: '/placeholder.svg',
    images: []
};

const toDateOnly = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatDate = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const formatDateShort = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
};

const formatOwnerName = (name) => {
    if (!name || typeof name !== 'string') return 'Chưa cập nhật';
    return name
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const isSameDate = (a, b) => {
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

const getMonthGrid = (baseMonthDate) => {
    const year = baseMonthDate.getFullYear();
    const month = baseMonthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leadingEmptyCount = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    const cells = [];
    for (let index = 0; index < leadingEmptyCount; index += 1) {
        cells.push(null);
    }
    for (let day = 1; day <= totalDays; day += 1) {
        cells.push(new Date(year, month, day));
    }

    return {
        title: `Tháng ${month + 1}`,
        cells
    };
};

export default function CarDetails() {
    const { id } = useParams();
    const [car, setCar] = useState(null);
    const [owner, setOwner] = useState(null);
    const [relatedCars, setRelatedCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
    const [pickupMode, setPickupMode] = useState('delivery');
    const [enableExtraInsurance, setEnableExtraInsurance] = useState(false);
    const [pickupTime, setPickupTime] = useState('21:00');
    const [returnTime, setReturnTime] = useState('20:00');
    const [showSectionNav, setShowSectionNav] = useState(false);
    const [activeSection, setActiveSection] = useState('specs');
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    const specsRef = useRef(null);
    const docsRef = useRef(null);
    const locationRef = useRef(null);
    const ownerRef = useRef(null);

    const today = useMemo(() => toDateOnly(new Date()), []);
    const tomorrow = useMemo(() => new Date(today.getTime() + DAY_MS), [today]);
    const [pickupDate, setPickupDate] = useState(today);
    const [returnDate, setReturnDate] = useState(tomorrow);
    const [calendarMonth, setCalendarMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const currentMonthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);

    useEffect(() => {
        fetchCarDetails();
    }, [id]);

    const fetchCarDetails = async () => {
        try {
            setLoading(true);
            const vehicles = await getCarsList();
            const vehiclesList = Array.isArray(vehicles) ? vehicles : [];
            const detailVehicle = id ? await getCarById(id) : null;

            const selectedVehicle = detailVehicle
                || vehiclesList.find((item) => String(item.id) === String(id))
                || vehiclesList[0]
                || FALLBACK_CAR;

            const ownerDetail = selectedVehicle?.ownerId
                ? await getOwnerById(selectedVehicle.ownerId)
                : null;

            setCar(selectedVehicle);
            setOwner(ownerDetail);
            setRelatedCars(vehiclesList.filter(item => item.id !== selectedVehicle.id).slice(0, 4));
            setError(null);
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            setCar(FALLBACK_CAR);
            setOwner(null);
            setRelatedCars([]);
            setError(null);
        } finally {
            setLoading(false);
        }
    };

    const images = useMemo(() => {
        if (car?.images?.length) {
            return car.images
                .filter(img => img?.imageUrl)
                .map(img => ({
                    url: img.imageUrl,
                    isMain: Boolean(img.isMain)
                }));
        }
        if (car?.mainImageUrl) {
            return [{ url: car.mainImageUrl, isMain: true }];
        }
        return [{ url: '/placeholder.svg', isMain: true }];
    }, [car]);

    useEffect(() => {
        setCurrentImageIndex(0);
    }, [id, images.length]);

    useEffect(() => {
        const updateSectionState = () => {
            const scrollTop = window.pageYOffset
                || document.documentElement.scrollTop
                || document.body.scrollTop
                || 0;

            const sections = [
                { key: 'specs', ref: specsRef },
                { key: 'docs', ref: docsRef },
                { key: 'location', ref: locationRef },
                { key: 'owner', ref: ownerRef }
            ];

            setShowSectionNav(scrollTop > 120);

            let currentKey = 'specs';
            sections.forEach(({ key, ref }) => {
                if (ref.current && scrollTop + 140 >= ref.current.offsetTop) {
                    currentKey = key;
                }
            });

            setActiveSection(currentKey);
        };

        updateSectionState();
        window.addEventListener('scroll', updateSectionState, { passive: true });
        document.addEventListener('scroll', updateSectionState, { passive: true, capture: true });

        return () => {
            window.removeEventListener('scroll', updateSectionState);
            document.removeEventListener('scroll', updateSectionState, true);
        };
    }, [car?.id]);

    const scrollToSection = (key) => {
        const sectionMap = {
            specs: specsRef,
            docs: docsRef,
            location: locationRef,
            owner: ownerRef
        };

        const targetRef = sectionMap[key];
        if (!targetRef?.current) return;

        const scrollTop = window.pageYOffset
            || document.documentElement.scrollTop
            || document.body.scrollTop
            || 0;

        const absoluteTop = targetRef.current.getBoundingClientRect().top + scrollTop;

        window.scrollTo({
            top: Math.max(0, absoluteTop - 90),
            behavior: 'smooth'
        });
    };

    const handlePrevImage = () => {
        if (images.length > 1) {
            setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
        }
    };

    const handleNextImage = () => {
        if (images.length > 1) {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }
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

    const currentImage = images[currentImageIndex]?.url || images[0]?.url || '/placeholder.svg';

    // const statusMap = {
    //     AVAILABLE: 'Sẵn sàng',
    //     RENTED: 'Đang thuê',
    //     MAINTENANCE: 'Bảo dưỡng',
    //     PENDING_APPROVAL: 'Chờ duyệt'
    // };

    const transmissionMap = {
        AUTOMATIC: 'Tự động',
        MANUAL: 'Số sàn'
    };

    const fuelMap = {
        GASOLINE: 'Xăng',
        DIESEL: 'Dầu',
        ELECTRIC: 'Điện'
    };

    // const statusLabel = statusMap[car.status] || car.status || 'N/A';
    const transmissionLabel = transmissionMap[car.transmission] || car.transmission || 'N/A';
    const fuelLabel = fuelMap[car.fuelType] || car.fuelType || 'N/A';
    const addressText = [car.addressDetail, car.district, car.city].filter(Boolean).join(', ');
    const locationDisplayText = [car.addressDetail, car.district].filter(Boolean).join(', ')
        || [car.district, car.city].filter(Boolean).join(', ')
        || addressText;
    const hasAddress = Boolean(addressText);

    const selectedDays = (!pickupDate || !returnDate)
        ? 1
        : Math.max(1, Math.round((toDateOnly(returnDate).getTime() - toDateOnly(pickupDate).getTime()) / DAY_MS));

    const pricePerDay = Number(car.pricePerDay || 0);
    const bookingFeePerDay = Math.round(pricePerDay * 0.08);
    const insuranceFeePerDay = Math.round(pricePerDay * 0.03);
    const extraInsurancePerDay = Math.round(pricePerDay * 0.02);

    const rentalCost = pricePerDay * selectedDays;
    const bookingFee = bookingFeePerDay * selectedDays;
    const insuranceFee = insuranceFeePerDay * selectedDays;
    const extraInsuranceFee = enableExtraInsurance ? extraInsurancePerDay * selectedDays : 0;
    const subtotalPrice = rentalCost + bookingFee + insuranceFee + extraInsuranceFee;
    const promoDiscount = Math.round(pricePerDay * 0.05) * selectedDays;
    const totalPrice = Math.max(0, subtotalPrice - promoDiscount);

    const oldPrice = Math.round(pricePerDay * 1.06);
    const discountPercent = Math.max(1, Math.round(((oldPrice - pricePerDay) / oldPrice) * 100));
    const defaultContact = 'Chưa cập nhật';
    const ownerName = owner?.fullName || car.ownerName;
    const displayOwnerName = formatOwnerName(ownerName);
    const ownerPhone = owner?.phone || car.ownerPhone;
    const ownerEmail = owner?.email || car.ownerEmail;
    const ownerRating = Number(owner?.avgRating ?? 5).toFixed(1);
    const ownerTrips = Number(owner?.totalTrips ?? 0);
    const ownerReviews = Number(owner?.totalReviews ?? 0);
    const ownerPublicId = owner?.ownerId || car.ownerId;
    const ownerResponseRate = owner?.isVerified ? '90%' : '80%';
    const ownerResponseTime = owner?.isVerified ? '5 phút' : '15 phút';
    const ownerApprovalRate = owner?.isVerified ? '88%' : '75%';
    // const statusClass = (car.status || '').toLowerCase().replace('_', '-');

    const monthOne = getMonthGrid(calendarMonth);
    const monthTwoDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    const monthTwo = getMonthGrid(monthTwoDate);
    const canGoPrevMonth = calendarMonth.getTime() > currentMonthStart.getTime();

    const isPastDate = (date) => {
        if (!date) return false;
        return toDateOnly(date).getTime() < today.getTime();
    };

    const isInSelectedRange = (date) => {
        if (!date || !pickupDate || !returnDate) return false;
        const d = toDateOnly(date).getTime();
        return d >= toDateOnly(pickupDate).getTime() && d <= toDateOnly(returnDate).getTime();
    };

    const handleSelectDate = (selectedDate) => {
        if (!selectedDate) return;
        const normalized = toDateOnly(selectedDate);
        if (isPastDate(normalized)) return;

        if (!pickupDate || (pickupDate && returnDate)) {
            setPickupDate(normalized);
            setReturnDate(null);
            return;
        }

        if (normalized.getTime() < pickupDate.getTime()) {
            setReturnDate(pickupDate);
            setPickupDate(normalized);
            return;
        }

        setReturnDate(normalized);
    };

    const applyTimeSelection = () => {
        if (!returnDate) {
            setReturnDate(new Date(pickupDate.getTime() + DAY_MS));
        }
        setIsTimeModalOpen(false);
    };

    return (
        <div className="vehicle-detail-page">
            <div className="vehicle-detail-shell">
                <div className={`detail-section-nav ${showSectionNav ? 'visible' : ''}`}>
                    <div className="detail-section-nav-inner">
                        <button
                            type="button"
                            className={activeSection === 'specs' ? 'active' : ''}
                            onClick={() => scrollToSection('specs')}
                        >
                            Đặc điểm
                        </button>
                        <button
                            type="button"
                            className={activeSection === 'docs' ? 'active' : ''}
                            onClick={() => scrollToSection('docs')}
                        >
                            Giấy tờ thuê xe
                        </button>
                        <button
                            type="button"
                            className={activeSection === 'location' ? 'active' : ''}
                            onClick={() => scrollToSection('location')}
                        >
                            Vị trí xe
                        </button>
                        <button
                            type="button"
                            className={activeSection === 'owner' ? 'active' : ''}
                            onClick={() => scrollToSection('owner')}
                        >
                            Chủ xe
                        </button>
                    </div>
                </div>

                <div className="detail-main-layout">
                    <div className="detail-main-column">
                        <section className="detail-gallery-card">
                            <div className="main-image-wrap">
                                <img
                                    src={currentImage}
                                    alt={`${car.brandName || ''} ${car.modelName || ''}`.trim() || 'Vehicle image'}
                                    className="main-image"
                                />
                                {images.length > 1 && (
                                    <>
                                        <button className="gallery-btn prev" onClick={handlePrevImage}>❮</button>
                                        <button className="gallery-btn next" onClick={handleNextImage}>❯</button>
                                    </>
                                )}
                            </div>
                            <div className="thumb-grid">
                                {images.slice(0, 4).map((img, index) => (
                                    <button
                                        key={`${img.url}-${index}`}
                                        className={`thumb-item ${index === currentImageIndex ? 'active' : ''}`}
                                        onClick={() => setCurrentImageIndex(index)}
                                        type="button"
                                    >
                                        <img src={img.url} alt={`Ảnh xe ${index + 1}`} className="thumb-image" />
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="car-title-block">
                            <h1>{car.brandName} {car.modelName}</h1>
                            <p>{car.carTypeName || 'N/A'} • {addressText || 'Chưa cập nhật địa chỉ'}</p>
                            <div className="stats-inline">
                                <span>⚙️ {transmissionLabel}</span>
                                <span>⛽ {fuelLabel}</span>
                                <span>👥 {car.seatCount || 'N/A'} chỗ</span>
                                <span>🏷️ {car.licensePlate || 'N/A'}</span>
                            </div>
                        </section>

                        <section ref={specsRef} className="detail-block">
                            <h3>Đặc điểm</h3>
                            <div className="spec-grid">
                                <div><span>Truyền động</span><b>{transmissionLabel}</b></div>
                                <div><span>Số ghế</span><b>{car.seatCount || 'N/A'} chỗ</b></div>
                                <div><span>Nhiên liệu</span><b>{fuelLabel}</b></div>
                                <div><span>Số km</span><b>{car.currentKm?.toLocaleString('vi-VN') || 0} km</b></div>
                            </div>
                        </section>

                        <section className="detail-block">
                            <h3>Mô tả</h3>
                            <p className="paragraph">
                                Xe được bảo dưỡng định kỳ, vận hành ổn định và phù hợp cho cả chuyến đi ngắn ngày lẫn đường dài.
                                Nội thất sạch sẽ, điều hòa mát, hỗ trợ nhận xe linh hoạt theo lịch của khách.
                            </p>
                        </section>

                        <section className="detail-block">
                            <h3>Các tiện ích khác</h3>
                            <div className="chip-list">
                                <span>Bluetooth</span>
                                <span>Camera lùi</span>
                                <span>Camera hành trình</span>
                                <span>Bản đồ</span>
                                <span>Cảm biến lốp</span>
                                <span>USB</span>
                                <span>ETC</span>
                                <span>Túi khí an toàn</span>
                            </div>
                        </section>

                        <section ref={docsRef} className="detail-block">
                            <h3>Giấy tờ thuê xe</h3>
                            <ul className="list-block">
                                <li>CMND/CCCD hoặc Passport (bản gốc)</li>
                                <li>GPLX hợp lệ, còn hiệu lực</li>
                                <li>Đối chiếu thông tin người đặt và người nhận xe</li>
                            </ul>
                        </section>

                        <section ref={locationRef} className="detail-block">
                            <h3>Vị trí xe</h3>
                            <div
                                className="location-box location-box-clickable"
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                    if (!hasAddress) return;
                                    setIsMapModalOpen(true);
                                }}
                                onKeyDown={(e) => {
                                    if (!hasAddress) return;
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setIsMapModalOpen(true);
                                    }
                                }}
                            >
                                <div className="location-box-row">
                                    <div className="location-box-left">
                                        <span className="location-pin" aria-hidden="true">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                <circle cx="12" cy="10" r="3"></circle>
                                            </svg>
                                        </span>
                                        <strong>{locationDisplayText || 'Chưa cập nhật địa chỉ'}</strong>
                                    </div>

                                    {hasAddress && (
                                        <button
                                            type="button"
                                            className="location-map-link"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsMapModalOpen(true);
                                            }}
                                        >
                                            <span className="location-map-icon" aria-hidden="true">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M9 20l-5.447-2.724A2 2 0 0 1 2 15.382V5.618a2 2 0 0 1 1.553-1.894L9 1m0 19l6-3m-6 3V1m6 16l5.447 2.724A2 2 0 0 0 22 18.382V8.618a2 2 0 0 0-1.553-1.894L15 4m0 13V4m0 13l-6 3m6-16l-6-3"></path>
                                                </svg>
                                            </span>
                                            <span>Xem bản đồ</span>
                                            <span className="location-map-arrow" aria-hidden="true">›</span>
                                        </button>
                                    )}
                                </div>
                                <p>Địa chỉ cụ thể sẽ được hiển thị sau khi thanh toán giữ chỗ</p>
                            </div>
                        </section>

                        <section ref={ownerRef} className="detail-block">
                            <h3>Chủ xe</h3>
                            <div className="owner-detail-card">
                                {ownerPublicId ? (
                                    <Link to={`/owners/${ownerPublicId}`} className="owner-basic owner-link">
                                        <div className="owner-avatar">{(displayOwnerName || 'A').charAt(0).toUpperCase()}</div>
                                        <div className="owner-profile-main">
                                            <strong>{displayOwnerName || defaultContact}</strong>
                                            <div className="owner-subline">
                                                <span>⭐ {ownerRating}</span>
                                                <span>• {ownerTrips} chuyến</span>
                                            </div>
                                            <p>📞 {ownerPhone || defaultContact}</p>
                                            <p>✉️ {ownerEmail || defaultContact}</p>
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="owner-basic">
                                        <div className="owner-avatar">{(displayOwnerName || 'A').charAt(0).toUpperCase()}</div>
                                        <div className="owner-profile-main">
                                            <strong>{displayOwnerName || defaultContact}</strong>
                                            <div className="owner-subline">
                                                <span>⭐ {ownerRating}</span>
                                                <span>• {ownerTrips} chuyến</span>
                                            </div>
                                            <p>📞 {ownerPhone || defaultContact}</p>
                                            <p>✉️ {ownerEmail || defaultContact}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="owner-metrics">
                                    <div>
                                        <span>Tỉ lệ phản hồi</span>
                                        <b>{ownerResponseRate}</b>
                                    </div>
                                    <div>
                                        <span>Phản hồi trong</span>
                                        <b>{ownerResponseTime}</b>
                                    </div>
                                    <div>
                                        <span>Tỉ lệ đồng ý</span>
                                        <b>{ownerApprovalRate}</b>
                                    </div>
                                </div>
                            </div>
                            <p className="owner-review-note">⭐ {ownerRating} • {ownerReviews} đánh giá</p>
                        </section>

                        <section className="detail-block">
                            <h3>Xe tương tự</h3>
                            <div className="related-grid">
                                {relatedCars.length === 0 && <p className="paragraph">Chưa có xe tương tự.</p>}
                                {relatedCars.map(item => (
                                    <Link to={`/car/${item.id}`} key={item.id} className="related-card">
                                        <img src={item.mainImageUrl || '/placeholder.svg'} alt={item.modelName || 'Vehicle'} />
                                        <div>
                                            <strong>{item.brandName} {item.modelName}</strong>
                                            <p>{Number(item.pricePerDay || 0).toLocaleString('vi-VN')} ₫/ngày</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    </div>

                    <aside className="booking-sidebar">
                        <div className="booking-card">
                            <div className="price-head-row">
                                <span className="old-price">{oldPrice.toLocaleString('vi-VN')} ₫</span>
                                <span className="discount-pill">-{discountPercent}%</span>
                            </div>

                            <div className="price-number">{pricePerDay.toLocaleString('vi-VN')} ₫<small>/ngày</small></div>

                            <button type="button" className="booking-time-box" onClick={() => setIsTimeModalOpen(true)}>
                                <div>
                                    <span>Nhận xe</span>
                                    <b>{formatDate(pickupDate)}</b>
                                    <em>{pickupTime}</em>
                                </div>
                                <div>
                                    <span>Trả xe</span>
                                    <b>{formatDate(returnDate || pickupDate)}</b>
                                    <em>{returnTime}</em>
                                </div>
                            </button>

                            <div className="pickup-box">
                                <p>Địa điểm giao nhận xe</p>
                                <label className={`pickup-option ${pickupMode === 'self' ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="pickupMode"
                                        checked={pickupMode === 'self'}
                                        onChange={() => setPickupMode('self')}
                                    />
                                    <div>
                                        <span>Tôi tự đến lấy xe</span>
                                        <b>{addressText || 'Chưa cập nhật địa chỉ'}</b>
                                    </div>
                                    <strong>Miễn phí</strong>
                                </label>

                                <label className={`pickup-option ${pickupMode === 'delivery' ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="pickupMode"
                                        checked={pickupMode === 'delivery'}
                                        onChange={() => setPickupMode('delivery')}
                                    />
                                    <div>
                                        <span>Tôi muốn được giao xe tận nơi</span>
                                        <b>{car.city || 'Nội thành'}</b>
                                    </div>
                                    <strong>Miễn phí</strong>
                                </label>
                            </div>

                            <button type="button" className="btn-primary full-width">CHỌN THUÊ</button>

                            <div className="fee-breakdown">
                                <h4>Chi tiết giá</h4>
                                <div><span>Đơn giá thuê xe</span><b>{rentalCost.toLocaleString('vi-VN')} ₫</b></div>
                                <div><span>Bảo hiểm thuê xe</span><b>{insuranceFee.toLocaleString('vi-VN')} ₫</b></div>
                                <div><span>Phí dịch vụ</span><b>{bookingFee.toLocaleString('vi-VN')} ₫</b></div>
                                <label className="extra-insurance">
                                    <input
                                        type="checkbox"
                                        checked={enableExtraInsurance}
                                        onChange={(e) => setEnableExtraInsurance(e.target.checked)}
                                    />
                                    <span>Bảo hiểm bổ sung</span>
                                    <b>{extraInsuranceFee.toLocaleString('vi-VN')} ₫</b>
                                </label>
                                <div><span>Tổng cộng</span><b>{subtotalPrice.toLocaleString('vi-VN')} ₫ x {selectedDays} ngày</b></div>
                                <div><span>Chương trình giảm giá</span><b>-{promoDiscount.toLocaleString('vi-VN')} ₫</b></div>
                                <div className="total"><span>Thành tiền</span><b>{totalPrice.toLocaleString('vi-VN')} ₫</b></div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {isTimeModalOpen && (
                <div className="detail-time-modal-overlay" onClick={() => setIsTimeModalOpen(false)}>
                    <div className="detail-time-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="detail-time-modal-header">
                            <h3>Thời gian</h3>
                            <button type="button" onClick={() => setIsTimeModalOpen(false)}>✕</button>
                        </div>

                        <div className="detail-time-calendar-box">
                            <div className="detail-calendar-head-actions">
                                <button
                                    type="button"
                                    className="detail-calendar-nav-btn"
                                    disabled={!canGoPrevMonth}
                                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                                >
                                    ←
                                </button>
                                <button
                                    type="button"
                                    className="detail-calendar-nav-btn"
                                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                                >
                                    →
                                </button>
                            </div>

                            <div className="detail-calendar-months">
                                {[monthOne, monthTwo].map((monthData) => (
                                    <div key={monthData.title} className="detail-calendar-month">
                                        <h4>{monthData.title}</h4>
                                        <div className="detail-calendar-weekdays">
                                            <span>T2</span>
                                            <span>T3</span>
                                            <span>T4</span>
                                            <span>T5</span>
                                            <span>T6</span>
                                            <span>T7</span>
                                            <span>CN</span>
                                        </div>
                                        <div className="detail-calendar-days-grid">
                                            {monthData.cells.map((dateCell, cellIndex) => {
                                                if (!dateCell) {
                                                    return <span key={`empty-${monthData.title}-${cellIndex}`} className="detail-day-cell empty" />;
                                                }

                                                const isPast = isPastDate(dateCell);
                                                const isStart = isSameDate(dateCell, pickupDate);
                                                const isEnd = isSameDate(dateCell, returnDate);
                                                const inRange = isInSelectedRange(dateCell);
                                                const classNames = [
                                                    'detail-day-cell',
                                                    isPast ? 'past-date' : '',
                                                    inRange ? 'in-range' : '',
                                                    isStart ? 'start' : '',
                                                    isEnd ? 'end' : ''
                                                ].filter(Boolean).join(' ');

                                                return (
                                                    <button
                                                        type="button"
                                                        key={`${monthData.title}-${dateCell.getDate()}`}
                                                        className={classNames}
                                                        disabled={isPast}
                                                        onClick={() => handleSelectDate(dateCell)}
                                                    >
                                                        {dateCell.getDate()}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="detail-time-row-select">
                            <div>
                                <span>Nhận xe</span>
                                <select value={pickupTime} onChange={(event) => setPickupTime(event.target.value)}>
                                    <option value="07:00">07:00</option>
                                    <option value="09:00">09:00</option>
                                    <option value="12:00">12:00</option>
                                    <option value="15:00">15:00</option>
                                    <option value="18:00">18:00</option>
                                    <option value="21:00">21:00</option>
                                </select>
                            </div>
                            <div>
                                <span>Trả xe</span>
                                <select value={returnTime} onChange={(event) => setReturnTime(event.target.value)}>
                                    <option value="08:00">08:00</option>
                                    <option value="10:00">10:00</option>
                                    <option value="13:00">13:00</option>
                                    <option value="16:00">16:00</option>
                                    <option value="18:00">18:00</option>
                                    <option value="20:00">20:00</option>
                                </select>
                            </div>
                        </div>

                        <div className="detail-time-modal-footer">
                            <p>{pickupTime}, {formatDateShort(pickupDate)} - {returnTime}, {formatDateShort(returnDate || pickupDate)} • Thuê {selectedDays} ngày</p>
                            <button type="button" onClick={applyTimeSelection}>Tiếp tục</button>
                        </div>
                    </div>
                </div>
            )}

            <MapModal
                isOpen={isMapModalOpen}
                onClose={() => setIsMapModalOpen(false)}
                addressText={addressText}
            />
        </div>
    );
}
