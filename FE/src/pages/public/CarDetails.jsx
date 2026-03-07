import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { getCarById, getCarsList } from '../../api/cars';
import { getOwnerById, getOwnerPerformance } from '../../api/owners';
import { createBooking } from '../../api/bookings';
import { startConversationByVehicle } from '../../api/chat';
import { addMyFavoriteVehicle, getMyFavoriteVehicles, removeMyFavoriteVehicle } from '../../api/customers';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import MapModal from '../../components/booking/MapModal';
import DeliveryLocationModal from '../../components/booking/DeliveryLocationModal';
import CustomAddressModal from '../../components/booking/CustomAddressModal';
import {
    DAY_MS,
    FALLBACK_CAR,
    toDateOnly,
    formatDate,
    formatDateShort,
    formatOwnerName,
    isSameDate,
    getMonthGrid,
    formatVndNumber,
    generateQueryVariants,
    resolveBestGeocodeFromVariants,
    haversineDistanceKm,
    routeDistanceKm,
    getTransmissionLabel,
    getFuelLabel,
    getFuelConsumptionLabel,
    buildAddressInfo,
    calculatePricing,
    getOwnerPerformanceStats,
    TRANSMISSION_LABELS,
    FUEL_LABELS,
} from '../../utils/carDetailsUtils';
import '../../styles/CarDetails.css';

export default function CarDetails() {
    const { id } = useParams();
    const [car, setCar] = useState(null);
    const [owner, setOwner] = useState(null);
    const [relatedCars, setRelatedCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
    const [pickupMode, setPickupMode] = useState('self');
    const [enableExtraInsurance, setEnableExtraInsurance] = useState(false);
    const [pickupTime, setPickupTime] = useState('21:00');
    const [returnTime, setReturnTime] = useState('20:00');
    const [showSectionNav, setShowSectionNav] = useState(false);
    const [activeSection, setActiveSection] = useState('specs');
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [isCustomAddressModalOpen, setIsCustomAddressModalOpen] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [deliveryAddressLabel, setDeliveryAddressLabel] = useState('');
    const [carCoords, setCarCoords] = useState(null);
    const [deliveryCoords, setDeliveryCoords] = useState(null);
    const [deliveryDistanceKm, setDeliveryDistanceKm] = useState(0);
    const [deliveryFeeVnd, setDeliveryFeeVnd] = useState(0);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [contactLoading, setContactLoading] = useState(false);

    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

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
    const deliveryEnabled = car?.deliveryEnabled === undefined || car?.deliveryEnabled === null
        ? true
        : Boolean(car.deliveryEnabled);
    const freeDeliveryWithinKm = Math.max(0, Number(car?.freeDeliveryWithinKm ?? 0) || 0);
    const maxDeliveryDistanceKm = Math.max(0, Number(car?.maxDeliveryDistanceKm ?? 20) || 0);
    const extraFeePerKm = Math.max(0, Number(car?.extraFeePerKm ?? 10000) || 0);

    const fetchCarDetails = useCallback(async () => {
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

            const ownerPerformance = selectedVehicle?.ownerId
                ? await getOwnerPerformance(selectedVehicle.ownerId)
                : null;

            const mergedOwner = ownerDetail
                ? { ...ownerDetail, ...(ownerPerformance || {}) }
                : ownerPerformance;

            setCar(selectedVehicle);
            setOwner(mergedOwner);
            setRelatedCars(vehiclesList.filter(item => item.id !== selectedVehicle.id).slice(0, 4));
            setError(null);
        } catch {
            setCar(FALLBACK_CAR);
            setOwner(null);
            setRelatedCars([]);
            setError(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        setPickupMode('self');
        setIsDeliveryModalOpen(false);
        setIsCustomAddressModalOpen(false);
        fetchCarDetails();
    }, [fetchCarDetails]);

    useEffect(() => {
        const checkFavorite = async () => {
            if (!token || !car?.id) {
                setIsFavorite(false);
                return;
            }

            const roleScope = String(user?.role || user?.scope || '');
            if (!roleScope.includes('ROLE_USER')) {
                setIsFavorite(false);
                return;
            }

            try {
                const payload = await getMyFavoriteVehicles(token);
                const ids = (payload?.result || []).map((item) => item.id);
                setIsFavorite(ids.includes(car.id));
            } catch {
                setIsFavorite(false);
            }
        };

        checkFavorite();
    }, [car?.id, token, user?.role, user?.scope]);

    useEffect(() => {
        if (!car?.id) return;

        const controller = new AbortController();

        const run = async () => {
            try {
                const city = (car.city || car.province || '').trim();
                const district = (car.district || car.ward || '').trim();
                const detail = (car.addressDetail || '').trim();

                const variants = generateQueryVariants(detail, district, city);
                const referenceQuery = [detail, district, city].filter(Boolean).join(', ');
                const result = await resolveBestGeocodeFromVariants(variants, referenceQuery, controller.signal);

                if (!result) {
                    setCarCoords(null);
                } else {
                    setCarCoords({ lat: result.lat, lon: result.lon });
                }
            } catch (error) {
                if (error?.name !== 'AbortError') {
                    setCarCoords(null);
                }
            }
        };

        run();
        return () => controller.abort();
    }, [car?.id, car?.addressDetail, car?.district, car?.ward, car?.city, car?.province]);

    useEffect(() => {
        if (!carCoords || !deliveryCoords) {
            setDeliveryDistanceKm(0);
            setDeliveryFeeVnd(0);
            return;
        }

        if (!deliveryEnabled) {
            setDeliveryDistanceKm(0);
            setDeliveryFeeVnd(0);
            return;
        }

        const controller = new AbortController();

        const calculateDistance = async () => {
            try {
                const routeKm = await routeDistanceKm(carCoords, deliveryCoords, controller.signal);
                const rawKm = Number.isFinite(routeKm) ? routeKm : haversineDistanceKm(carCoords, deliveryCoords);
                const roundedKm = Math.max(0, Math.round(rawKm));
                const chargeableKm = Math.max(0, roundedKm - freeDeliveryWithinKm);

                setDeliveryDistanceKm(roundedKm);
                setDeliveryFeeVnd(chargeableKm * extraFeePerKm);
            } catch (error) {
                if (error?.name !== 'AbortError') {
                    const fallbackKm = Math.max(0, Math.round(haversineDistanceKm(carCoords, deliveryCoords)));
                    const chargeableKm = Math.max(0, fallbackKm - freeDeliveryWithinKm);
                    setDeliveryDistanceKm(fallbackKm);
                    setDeliveryFeeVnd(chargeableKm * extraFeePerKm);
                }
            }
        };

        calculateDistance();

        return () => controller.abort();
    }, [carCoords, deliveryCoords, deliveryEnabled, freeDeliveryWithinKm, extraFeePerKm]);

    useEffect(() => {
        if (deliveryEnabled) {
            return;
        }
        if (pickupMode === 'delivery') {
            setPickupMode('self');
        }
        setIsDeliveryModalOpen(false);
        setIsCustomAddressModalOpen(false);
    }, [deliveryEnabled, pickupMode]);

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

    // const statusLabel = statusMap[car.status] || car.status || 'N/A';
    const transmissionLabel = getTransmissionLabel(car.transmission);
    const fuelLabel = getFuelLabel(car.fuelType);
    const fuelConsumptionLabel = getFuelConsumptionLabel(car);
    const { addressText, locationDisplayText, hasAddress } = buildAddressInfo(car);

    const selectedDays = (!pickupDate || !returnDate)
        ? 1
        : Math.max(1, Math.round((toDateOnly(returnDate).getTime() - toDateOnly(pickupDate).getTime()) / DAY_MS));

    const {
        pricePerDay,
        bookingFeePerDay,
        insuranceFeePerDay,
        extraInsurancePerDay,
        subtotalPrice,
        promoDiscount,
        totalPrice,
        discountPercent,
    } = calculatePricing({
        pricePerDay: car.pricePerDay,
        selectedDays,
        enableExtraInsurance,
    });
    const defaultContact = 'Chưa cập nhật';
    const ownerName = owner?.fullName || car.ownerName;
    const displayOwnerName = formatOwnerName(ownerName);
    const ownerRating = Number(owner?.avgRating ?? 5).toFixed(1);
    const ownerTrips = Number(owner?.totalTrips ?? 0);
    const ownerReviews = Number(owner?.totalReviews ?? 0);
    const ownerPublicId = owner?.ownerId || car.ownerId;
    const ownerPerformanceStats = getOwnerPerformanceStats(owner);
    const ownerResponseRate = ownerPerformanceStats.responseRate;
    const ownerResponseTime = ownerPerformanceStats.responseTime;
    const ownerApprovalRate = ownerPerformanceStats.approvalRate;
    const featureNames = Array.isArray(car?.features)
        ? car.features
            .map((feature) => String(feature?.name || '').trim())
            .filter(Boolean)
        : [];
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

    const handleBooking = async () => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để đặt xe!');
            navigate('/login');
            return;
        }

        if (!car?.id) {
            toast.error('Không tìm thấy xe để đặt.');
            return;
        }

        const resolvedReturn = returnDate || new Date(pickupDate.getTime() + DAY_MS);

        const [pickupHour, pickupMin] = pickupTime.split(':').map(Number);
        const [returnHour, returnMin] = returnTime.split(':').map(Number);

        const startDt = new Date(pickupDate);
        startDt.setHours(pickupHour, pickupMin, 0, 0);

        const endDt = new Date(resolvedReturn);
        endDt.setHours(returnHour, returnMin, 0, 0);

        if (endDt.getTime() <= startDt.getTime()) {
            toast.error('Thoi gian tra xe phai sau thoi gian nhan xe.');
            return;
        }

        const pad = (n) => String(n).padStart(2, '0');
        const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

        setBookingLoading(true);
        try {
            await createBooking(car.id, fmt(startDt), fmt(endDt));
            toast.success('Đặt xe thành công! Vui lòng chờ chủ xe duyệt.');
            navigate('/my-bookings');
        } catch (err) {
            toast.error(err.message || 'Đặt xe thất bại. Vui lòng thử lại!');
        } finally {
            setBookingLoading(false);
        }
    };

    const handleContactOwner = async () => {
        if (!user) {
            toast.error('Vui lòng đăng nhập tài khoản khách hàng để liên hệ chủ xe!');
            navigate('/login');
            return;
        }

        const roleScope = String(user?.role || user?.scope || '');
        if (!roleScope.includes('ROLE_USER')) {
            toast.error('Tính năng liên hệ hiện chỉ dành cho tài khoản khách hàng.');
            return;
        }

        if (!car?.id) {
            toast.error('Không tìm thấy xe để tạo hội thoại.');
            return;
        }

        setContactLoading(true);
        try {
            const conversation = await startConversationByVehicle(car.id);
            if (!conversation?.id) {
                throw new Error('Không thể tạo hội thoại.');
            }
            navigate(`/chat?conversationId=${conversation.id}&fromDetails=1`);
        } catch (error) {
            toast.error(error?.message || 'Không thể liên hệ chủ xe lúc này.');
        } finally {
            setContactLoading(false);
        }
    };

    const handleToggleFavorite = async () => {
        if (!user) {
            toast.error('Vui long dang nhap de luu xe yeu thich!');
            navigate('/login');
            return;
        }

        const roleScope = String(user?.role || user?.scope || '');
        if (!roleScope.includes('ROLE_USER')) {
            toast.error('Tinh nang yeu thich chi danh cho tai khoan khach hang.');
            return;
        }

        if (!car?.id) return;

        setFavoriteLoading(true);
        try {
            if (isFavorite) {
                await removeMyFavoriteVehicle(token, car.id);
                setIsFavorite(false);
                toast.success('Da xoa xe khoi danh sach yeu thich');
            } else {
                await addMyFavoriteVehicle(token, car.id);
                setIsFavorite(true);
                toast.success('Da them xe vao danh sach yeu thich');
            }
        } catch (error) {
            toast.error(error?.message || 'Khong the cap nhat danh sach yeu thich');
        } finally {
            setFavoriteLoading(false);
        }
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
                        <section className="detail-gallery-card" ref={specsRef}>
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
                            <div className="car-title-block">
                                <div className="car-meta-line">
                                    <span className="car-type-pill">{car.carTypeName || 'N/A'}</span>
                                    <span className="car-status-pill">Sẵn sàng</span>
                                    <span className="car-rating-pill">⭐ {ownerRating} ({ownerTrips} chuyến)</span>
                                </div>
                                <div className="car-title-row">
                                    <h1>{car.brandName} {car.modelName}{car.year ? ` ${car.year}` : ''}</h1>
                                    <button
                                        type="button"
                                        className={`title-favorite-btn ${isFavorite ? 'active' : ''}`}
                                        onClick={handleToggleFavorite}
                                        disabled={favoriteLoading}
                                        aria-label={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                                        title={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                                    >
                                        <Heart size={19} fill={isFavorite ? 'currentColor' : 'none'} />
                                    </button>
                                </div>
                                <p>📍 {addressText || 'Chưa cập nhật địa chỉ'}</p>
                                <div className="quick-spec-grid">
                                    <div className="quick-spec-item">
                                        <span className="quick-spec-icon" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M8 4H4V8M16 4H20V8M8 20H4V16M20 16V20H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M9 9H15V15H9V9Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </span>
                                        <span className="quick-spec-label">TRUYỀN ĐỘNG</span>
                                        <b>{transmissionLabel}</b>
                                    </div>
                                    <div className="quick-spec-item">
                                        <span className="quick-spec-icon" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
                                                <path d="M5 20C5 16.6863 8.13401 14 12 14C15.866 14 19 16.6863 19 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                            </svg>
                                        </span>
                                        <span className="quick-spec-label">SỐ GHẾ</span>
                                        <b>{car.seatCount || 'N/A'} </b>
                                    </div>
                                    <div className="quick-spec-item">
                                        <span className="quick-spec-icon" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M7 7H16L18 10V20H6V8C6 7.44772 6.44772 7 7 7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M9 12H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                                <path d="M10 4H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                            </svg>
                                        </span>
                                        <span className="quick-spec-label">NHIÊN LIỆU</span>
                                        <b>{fuelLabel}</b>
                                    </div>
                                    <div className="quick-spec-item">
                                        <span className="quick-spec-icon" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M4 16C4 11.5817 7.58172 8 12 8C16.4183 8 20 11.5817 20 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                                <path d="M12 16L16 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                                <circle cx="12" cy="16" r="1.5" fill="currentColor" />
                                            </svg>
                                        </span>
                                        <span className="quick-spec-label">MỨC TIÊU THỤ</span>
                                        <b>{fuelConsumptionLabel}</b>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="detail-block info-combined-block">
                            <div className="info-subsection">
                                <h3>Mô tả</h3>
                                <p className="paragraph">
                                    {String(car?.description || '').trim()
                                        || 'Xe được bảo dưỡng định kỳ, vận hành ổn định và phù hợp cho cả chuyến đi ngắn ngày lẫn đường dài.'}
                                </p>
                            </div>

                            <div className="info-subsection">
                                <h3>Các tiện ích khác</h3>
                                <div className="chip-list">
                                    {featureNames.length > 0
                                        ? featureNames.map((name) => <span key={name}>{name}</span>)
                                        : <span>Chưa cập nhật</span>}
                                </div>
                            </div>

                            <div ref={docsRef} className="info-subsection">
                                <h3>Giấy tờ thuê xe</h3>
                                <ul className="list-block">
                                    <li>CMND/CCCD hoặc Passport (bản gốc)</li>
                                    <li>GPLX hợp lệ, còn hiệu lực</li>
                                    <li>Đối chiếu thông tin người đặt và người nhận xe</li>
                                </ul>
                            </div>

                            <div ref={locationRef} className="info-subsection">
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
                            </div>
                        </section>

                        <section ref={ownerRef} className="detail-block">
                            <h3>Chủ xe</h3>
                            <div className="owner-detail-card">
                                {ownerPublicId ? (
                                    <Link to={`/owners/${ownerPublicId}`} className="owner-basic owner-link">
                                        <div className="owner-avatar-wrap">
                                            <div className="owner-avatar">{(displayOwnerName || 'A').charAt(0).toUpperCase()}</div>
                                            <span className="owner-pro-badge">PRO</span>
                                        </div>
                                        <div className="owner-profile-main">
                                            <strong>{displayOwnerName || defaultContact}</strong>
                                            <div className="owner-subline">⭐ {ownerRating} • {ownerTrips} chuyến</div>
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="owner-basic">
                                        <div className="owner-avatar-wrap">
                                            <div className="owner-avatar">{(displayOwnerName || 'A').charAt(0).toUpperCase()}</div>
                                            <span className="owner-pro-badge">PRO</span>
                                        </div>
                                        <div className="owner-profile-main">
                                            <strong>{displayOwnerName || defaultContact}</strong>
                                            <div className="owner-subline">⭐ {ownerRating} • {ownerTrips} chuyến</div>
                                        </div>
                                    </div>
                                )}
                                <div className="owner-metrics">
                                    <div>
                                        <span>Tỉ lệ phản hồi</span>
                                        <b>{ownerResponseRate}</b>
                                    </div>
                                    <div>
                                        <span>Thời gian phản hồi</span>
                                        <b>{ownerResponseTime}</b>
                                    </div>
                                    <div>
                                        <span>Tỉ lệ đồng ý</span>
                                        <b>{ownerApprovalRate}</b>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="owner-contact-btn"
                                    onClick={handleContactOwner}
                                    disabled={contactLoading}
                                >
                                    {contactLoading ? 'Đang mở chat...' : 'Liên hệ'}
                                </button>
                            </div>
                            <p className="owner-review-note">⭐ {ownerRating} • {ownerReviews} đánh giá</p>
                        </section>

                    </div>

                    <aside className="booking-sidebar">
                        <div className="detail-booking-card">
                            <div className="price-head-row">
                                <span className="old-price">{formatVndNumber(pricePerDay)}</span>
                                <span className="per-day">/ ngày</span>
                                <span className="discount-pill">-{discountPercent}%</span>
                            </div>

                            <button type="button" className="booking-time-box" onClick={() => setIsTimeModalOpen(true)}>
                                <div className="booking-time-col">
                                    <div className="booking-time-top">
                                        <span>NHẬN XE</span>
                                        <em>Sửa</em>
                                    </div>
                                    <b>{formatDate(pickupDate)}</b>
                                    <small>{pickupTime}</small>
                                </div>
                                <div className="booking-time-col">
                                    <div className="booking-time-top">
                                        <span>TRẢ XE</span>
                                        <em>Sửa</em>
                                    </div>
                                    <b>{formatDate(returnDate || pickupDate)}</b>
                                    <small>{returnTime}</small>
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
                                    <span className="pickup-radio-icon" aria-hidden="true" />
                                    <div>
                                        <span>Tôi tự đến lấy xe</span>
                                        <b>{addressText || 'Chưa cập nhật địa chỉ'}</b>
                                    </div>
                                    <strong>Miễn phí</strong>
                                </label>

                                {deliveryEnabled ? (
                                    <label
                                        className={`pickup-option ${pickupMode === 'delivery' ? 'active' : ''}`}
                                        onClick={() => {
                                            setPickupMode('delivery');
                                            setIsDeliveryModalOpen(true);
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="pickupMode"
                                            checked={pickupMode === 'delivery'}
                                            onChange={() => setPickupMode('delivery')}
                                        />
                                        <span className="pickup-radio-icon" aria-hidden="true" />
                                        <div>
                                            <span>Giao xe tận nơi</span>
                                            <b>{deliveryAddressLabel || `Phạm vi tối đa ${maxDeliveryDistanceKm}km`}</b>
                                        </div>
                                        <strong>{extraFeePerKm > 0 ? `${extraFeePerKm.toLocaleString('vi-VN')} VNĐ/km` : 'Miễn phí'}</strong>
                                    </label>
                                ) : (
                                    <div className="pickup-option pickup-option-disabled" role="status" aria-live="polite">
                                        <span className="pickup-radio-icon" aria-hidden="true" />
                                        <div>
                                            <span>Tôi muốn được giao xe tận nơi</span>
                                            <b>Rất tiếc, chủ xe không hỗ trợ giao xe tận nơi</b>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="fee-breakdown">
                                <div className="fee-row">
                                    <span>Đơn giá thuê</span>
                                    <b>{formatVndNumber(pricePerDay)} /ngày</b>
                                </div>

                                <div className="fee-row">
                                    <span>Bảo hiểm thuê xe</span>
                                    <b>{formatVndNumber(insuranceFeePerDay)} /ngày</b>
                                </div>

                                <div className="fee-row">
                                    <span>Phí dịch vụ</span>
                                    <b>{formatVndNumber(bookingFeePerDay)} /ngày</b>
                                </div>

                                <label className="extra-insurance">
                                    <input
                                        type="checkbox"
                                        checked={enableExtraInsurance}
                                        onChange={(e) => setEnableExtraInsurance(e.target.checked)}
                                    />
                                    <span>Bảo hiểm bổ sung</span>
                                    <b>{formatVndNumber(enableExtraInsurance ? extraInsurancePerDay : 0)} /ngày</b>
                                </label>

                                <div className="fee-row total">
                                    <span>Tổng cộng</span>
                                    <b>
                                        {formatVndNumber(subtotalPrice)} x {selectedDays} ngày
                                    </b>
                                </div>

                                <div className="fee-row discount">
                                    <span>Giảm giá</span>
                                    <b>-{formatVndNumber(promoDiscount)}</b>
                                </div>

                                <div className="promo-code">
                                    <span>Mã khuyến mãi</span>
                                    <button type="button">Áp dụng</button>
                                </div>
                            </div>

                            <div className="booking-final-total">
                                <span>Thành tiền</span>
                                <b>{formatVndNumber(totalPrice)}</b>
                            </div>

                            <button
                                type="button"
                                className="btn-primary full-width"
                                onClick={handleBooking}
                                disabled={bookingLoading}
                            >
                                {bookingLoading ? 'Đang đặt xe...' : 'CHỌN THUÊ'}
                            </button>

                        </div>
                    </aside>
                </div>

                <section className="detail-block related-block related-block-full">
                    <h3>Xe tương tự</h3>
                    <div className="related-grid">
                        {relatedCars.length === 0 && <p className="paragraph">Chưa có xe tương tự.</p>}
                        {relatedCars.map(item => (
                            <Link to={`/car/${item.id}`} key={item.id} className="related-card">
                                <img src={item.images[0]?.imageUrl || '/placeholder.svg'} alt={item.modelName || 'Vehicle'} />
                                <div className="related-card-content">
                                    <span className="related-type">{item.carTypeName || 'Sedan'}</span>
                                    <strong>{item.brandName} {item.modelName}</strong>
                                    <p className="related-meta">
                                        <span className="related-meta-item">
                                            <span className="related-meta-icon" aria-hidden="true">
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M14.5 4H9.5V6.3L7.6 7.4L5.6 6.5L3.1 11L5.1 12.1V14.3L3.1 15.4L5.6 19.9L7.6 19L9.5 20.1V22H14.5V20.1L16.4 19L18.4 19.9L20.9 15.4L18.9 14.3V12.1L20.9 11L18.4 6.5L16.4 7.4L14.5 6.3V4Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                                                    <circle cx="12" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.7" />
                                                </svg>
                                            </span>
                                            {TRANSMISSION_LABELS[item.transmission] || item.transmission || 'Auto'}
                                        </span>
                                        <span className="related-meta-item">
                                            <span className="related-meta-icon" aria-hidden="true">
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 3C12 3 6.5 9.2 6.5 13.2C6.5 16.5 8.9 19 12 19C15.1 19 17.5 16.5 17.5 13.2C17.5 9.2 12 3 12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M9.8 13.4C9.8 12.5 10.3 11.6 11.2 10.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                                </svg>
                                            </span>
                                            {FUEL_LABELS[item.fuelType] || item.fuelType || 'Xăng'}
                                        </span>
                                    </p>
                                    <div className="related-footer">
                                        <p>{Number(item.pricePerDay || 0).toLocaleString('vi-VN')} VNĐ <small>/ngày</small></p>
                                        <span className="related-arrow">→</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
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
                            <button type="button" onClick={applyTimeSelection}>
                                Xác nhận thời gian
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <MapModal
                isOpen={isMapModalOpen}
                onClose={() => setIsMapModalOpen(false)}
                addressText={addressText}
            />

            <DeliveryLocationModal
                isOpen={isDeliveryModalOpen}
                onClose={() => {
                    setIsDeliveryModalOpen(false);
                    setIsCustomAddressModalOpen(false);
                }}
                carCoords={carCoords}
                destinationCoords={deliveryCoords}
                destinationLabel={deliveryAddressLabel}
                totalFee={deliveryFeeVnd}
                distanceKm={deliveryDistanceKm}
                maxDistanceKm={maxDeliveryDistanceKm}
                freeWithinKm={freeDeliveryWithinKm}
                feePerKmVnd={extraFeePerKm}
                onOpenCustomAddress={() => setIsCustomAddressModalOpen(true)}
                onApply={() => {
                    setIsDeliveryModalOpen(false);
                    setIsCustomAddressModalOpen(false);
                }}
            />

            <CustomAddressModal
                isOpen={isCustomAddressModalOpen}
                onClose={() => setIsCustomAddressModalOpen(false)}
                initialValue={deliveryAddress}
                onApply={({ address, coords, label }) => {
                    setDeliveryAddress(address);
                    setDeliveryAddressLabel(label || address);
                    setDeliveryCoords(coords);
                    setIsCustomAddressModalOpen(false);
                }}
            />
        </div>
    );
}

