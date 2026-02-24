import React, { useState, useEffect } from 'react';
import '../styles/BookingModal.css';

export default function BookingModal({ car, isOpen, onClose, onSuccess }) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [totalPrice, setTotalPrice] = useState(0);

    // Calculate minimum date (today)
    const today = new Date().toISOString().slice(0, 16);

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

        setLoading(true);
        setError('');

        try {
            // Import API function
            const { createBooking } = await import('../api/bookings.js');

            // Format dates to ISO string
            const formattedStartDate = new Date(startDate).toISOString();
            const formattedEndDate = new Date(endDate).toISOString();

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
                                            <span>Thanh toán ngay</span>
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
