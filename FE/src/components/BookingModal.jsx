import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import '../styles/BookingModal.css';

export default function BookingModal({ car, isOpen, onClose, onSuccess }) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [totalPrice, setTotalPrice] = useState(0);

    const [bookedDates, setBookedDates] = useState([]);
    const [isLoadingDates, setIsLoadingDates] = useState(false);

    // Calculate minimum date (today)
    const today = new Date().toISOString().slice(0, 16);

    // Fetch booked dates when modal opens
    useEffect(() => {
        if (isOpen && car?.id) {
            const fetchBookedDates = async () => {
                setIsLoadingDates(true);
                try {
                    const { getBookedDates } = await import('../api/bookings.js');
                    const dates = await getBookedDates(car.id);
                    setBookedDates(dates.map(d => ({
                        start: new Date(d.startDate),
                        end: new Date(d.endDate)
                    })));
                } catch (err) {
                    console.error("Failed to fetch booked dates:", err);
                    // Don't block booking if this fails, just won't show the calendar blocks
                } finally {
                    setIsLoadingDates(false);
                }
            };
            fetchBookedDates();
        } else {
            // Reset state when closed
            setStartDate('');
            setEndDate('');
            setError('');
            setBookedDates([]);
        }
    }, [isOpen, car?.id]);

    // Calculate total price when dates change
    useEffect(() => {
        if (startDate && endDate && car?.pricePerDay) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = end - start;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                setTotalPrice(diffDays * car.pricePerDay);
                setError('');
            } else if (diffDays === 0) {
                setTotalPrice(car.pricePerDay); // Minimum 1 day
                setError('');
            } else {
                setTotalPrice(0);
                setError('Ngày kết thúc phải sau ngày bắt đầu!');
            }
        }
    }, [startDate, endDate, car?.pricePerDay]);

    const isDateOverlappingWithBooking = (start, end) => {
        const startD = new Date(start);
        const endD = new Date(end);

        return bookedDates.some(booking => {
            // Check if selected range overlaps with existing booking
            // (StartA <= EndB) and (EndA >= StartB)
            return startD <= booking.end && endD >= booking.start;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!startDate || !endDate) {
            setError('Vui lòng chọn ngày bắt đầu và kết thúc!');
            return;
        }

        if (new Date(endDate) <= new Date(startDate)) {
            setError('Ngày kết thúc phải sau ngày bắt đầu!');
            return;
        }

        if (isDateOverlappingWithBooking(startDate, endDate)) {
            setError('Khoảng thời gian này đã có người đặt, vui lòng chọn ngày khác!');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Import API function
            const { createBooking } = await import('../api/bookings.js');
            const { format } = await import('date-fns');

            // Format dates precisely to yyyy-MM-dd'T'HH:mm:ss for Spring Boot LocalDateTime
            const formattedStartDate = format(new Date(startDate), "yyyy-MM-dd'T'HH:mm:ss");
            const formattedEndDate = format(new Date(endDate), "yyyy-MM-dd'T'HH:mm:ss");

            await createBooking(car.id, formattedStartDate, formattedEndDate);

            // Success!
            onSuccess?.();
            onClose();

        } catch (err) {
            setError(err.message || 'Đặt xe thất bại. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="booking-modal-overlay" onClick={onClose}>
            <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                <div className="modal-content-wrapper">
                    <div className="modal-left-panel">
                        <div className="modal-car-image">
                            <img
                                src={car?.images?.find(img => img.isMain)?.imageUrl || car?.images?.[0]?.imageUrl || '/placeholder.svg'}
                                alt={car?.modelName}
                            />
                            <div className="image-overlay"></div>
                        </div>
                        <div className="modal-car-info">
                            <h3>{car?.brandName} {car?.modelName}</h3>
                            <div className="car-specs">
                                <span>{car?.seatCount} chỗ</span> •
                                <span>{car?.transmission}</span> •
                                <span>{car?.fuelType}</span>
                            </div>
                            <div className="car-price-tag">
                                {car?.pricePerDay?.toLocaleString('vi-VN')} ₫ / ngày
                            </div>
                        </div>
                    </div>

                    <div className="modal-right-panel">
                        <div className="modal-header">
                            <h2>xác nhận đặt xe</h2>
                            <p>Vui lòng chọn thời gian nhận và trả xe</p>
                        </div>

                        <div className="calendar-section">
                            <h4 className="calendar-title">Lịch trình bận của xe</h4>
                            <div className="calendar-wrapper">
                                {isLoadingDates ? (
                                    <div className="calendar-loading">Đang tải lịch...</div>
                                ) : (
                                    <DayPicker
                                        mode="range"
                                        disabled={bookedDates.map(dateRange => ({
                                            from: dateRange.start,
                                            to: dateRange.end
                                        }))}
                                        modifiers={{ booked: bookedDates.map(d => ({ from: d.start, to: d.end })) }}
                                        modifiersStyles={{
                                            booked: { backgroundColor: '#ffebees', textDecoration: 'line-through', color: '#f44336' }
                                        }}
                                        fromMonth={new Date()}
                                        numberOfMonths={1}
                                        pagedNavigation
                                        className="booking-calendar"
                                    />
                                )}
                            </div>
                            <div className="calendar-legend">
                                <span className="legend-item booked">Đã có người đặt</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="booking-form">
                            <div className="dates-grid">
                                <div className="form-group">
                                    <label htmlFor="startDate">Ngày nhận xe</label>
                                    <input
                                        type="datetime-local"
                                        id="startDate"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        min={today}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="endDate">Ngày trả xe</label>
                                    <input
                                        type="datetime-local"
                                        id="endDate"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        min={startDate || today}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="price-summary">
                                <div className="price-row">
                                    <span>Đơn giá thuê:</span>
                                    <span>{car?.pricePerDay?.toLocaleString('vi-VN')} ₫</span>
                                </div>
                                <div className="price-row">
                                    <span>Số ngày thuê:</span>
                                    <span>
                                        {totalPrice > 0
                                            ? Math.ceil(totalPrice / car.pricePerDay) + ' ngày'
                                            : '--'}
                                    </span>
                                </div>
                                <div className="price-row total">
                                    <span>Tổng cộng:</span>
                                    <span className="total-price">{totalPrice.toLocaleString('vi-VN')} ₫</span>
                                </div>
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={onClose}>
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="btn-confirm" disabled={loading}>
                                    {loading ? (
                                        <span className="sc-loading">Processing...</span>
                                    ) : (
                                        <>
                                            <span>Xác nhận đặt xe</span>
                                            <span className="total-badge">{totalPrice > 0 ? totalPrice.toLocaleString('vi-VN') + ' ₫' : ''}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
