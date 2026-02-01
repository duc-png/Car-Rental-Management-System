'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/TimeModal.css';

function TimeModal({ isOpen, onClose, onSelect }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare dates only

    const [activeTab, setActiveTab] = useState('day');
    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth()));
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [startTime, setStartTime] = useState('21:00');
    const [endTime, setEndTime] = useState('20:00');
    const [rentalHours, setRentalHours] = useState(5);
    const [showHourDropdown, setShowHourDropdown] = useState(false);
    const [showStartTimeDropdown, setShowStartTimeDropdown] = useState(false);
    const [showEndTimeDropdown, setShowEndTimeDropdown] = useState(false);
    const startTimeMenuRef = useRef(null);
    const endTimeMenuRef = useRef(null);

    const hours = Array.from({ length: 24 }, (_, i) =>
        `${String(i).padStart(2, '0')}:00`
    );

    const hourOptions = [4, 5, 6, 7, 8];

    const calculateEndTime = (start, duration) => {
        const [hour] = start.split(':').map(Number);
        const endHour = (hour + duration) % 24;
        return `${String(endHour).padStart(2, '0')}:00`;
    };

    // Tính số ngày thuê chính xác
    const calculateRentalDays = () => {
        if (!startDate || !endDate) return 0;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 0 ? diffDays : 1;
    };

    // Kiểm tra ngày quá khứ
    const isPastDate = (date) => {
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today;
    };

    // Kiểm tra ngày hôm nay
    const isToday = (date) => {
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate.getTime() === today.getTime();
    };

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const renderCalendar = (date) => {
        const daysInMonth = getDaysInMonth(date);
        const firstDay = getFirstDayOfMonth(date);
        const days = [];
        const monthName = date.toLocaleDateString('vi-VN', {
            month: 'long',
            year: 'numeric',
        });

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(
                <div key={`empty-${i}`} className="calendar-empty-day"></div>
            );
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
            const isPast = isPastDate(currentDate);
            const isTodayDate = isToday(currentDate);

            const isStart = startDate && currentDate.toDateString() === startDate.toDateString();
            const isEnd = endDate && currentDate.toDateString() === endDate.toDateString();
            const isBetween = startDate && endDate && currentDate > startDate && currentDate < endDate;

            days.push(
                <button
                    key={day}
                    disabled={isPast}
                    className={`calendar-day 
                        ${isPast ? 'past-date' : ''} 
                        ${isTodayDate ? 'today' : ''}
                        ${isStart ? 'selected start-date' : ''} 
                        ${isEnd ? 'selected end-date' : ''}
                        ${isBetween ? 'between' : ''}
                    `}
                    onClick={() => {
                        if (!isPast) {
                            if (!startDate || (startDate && endDate)) {
                                // Chọn ngày bắt đầu mới
                                setStartDate(currentDate);
                                setEndDate(null);
                            } else if (currentDate < startDate) {
                                // Click vào ngày trước startDate → thay đổi startDate
                                setStartDate(currentDate);
                            } else {
                                // Click vào ngày sau startDate → set endDate
                                setEndDate(currentDate);
                            }
                        }
                    }}
                >
                    {day}
                </button>
            );
        }

        return { days, monthName };
    };

    const prevMonth = () => {
        setCurrentMonth(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
        );
    };

    const nextMonth = () => {
        setCurrentMonth(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
        );
    };

    const { days: calendarDays1, monthName: month1 } = renderCalendar(
        currentMonth
    );
    const nextMonthDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1
    );
    const { days: calendarDays2, monthName: month2 } = renderCalendar(
        nextMonthDate
    );

    const handleConfirm = () => {
        if (activeTab === 'day' && startDate && endDate) {
            onSelect({
                type: 'day',
                startDate: startDate.toLocaleDateString('vi-VN'),
                endDate: endDate.toLocaleDateString('vi-VN'),
                startTime,
                endTime,
                rentalDays: calculateRentalDays(),
            });
            onClose();
        } else if (activeTab === 'hour' && startDate) {
            onSelect({
                type: 'hour',
                startDate: startDate.toLocaleDateString('vi-VN'),
                startTime,
                rentalHours,
            });
            onClose();
        }
    };

    // Auto-scroll dropdown to active item
    useEffect(() => {
        if (showStartTimeDropdown && startTimeMenuRef.current) {
            const activeItem = startTimeMenuRef.current.querySelector('.time-dropdown-item.active');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [showStartTimeDropdown]);

    useEffect(() => {
        if (showEndTimeDropdown && endTimeMenuRef.current) {
            const activeItem = endTimeMenuRef.current.querySelector('.time-dropdown-item.active');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [showEndTimeDropdown]);

    if (!isOpen) return null;

    const modalContent = (
        <div className="time-modal-overlay" onClick={onClose}>
            <div className="time-modal" onClick={(e) => e.stopPropagation()}>
                <div className="time-modal-header">
                    <h2>Thời gian</h2>
                    <button className="time-modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="time-modal-tabs">
                    <button
                        className={`time-tab ${activeTab === 'day' ? 'active' : ''}`}
                        onClick={() => setActiveTab('day')}
                    >
                        Thuê theo ngày
                    </button>
                    <button
                        className={`time-tab ${activeTab === 'hour' ? 'active' : ''}`}
                        onClick={() => setActiveTab('hour')}
                    >
                        Thuê theo giờ
                    </button>
                </div>

                <div className="time-modal-content">
                    {activeTab === 'day' ? (
                        // Day rental view
                        <>
                            <div className="calendar-container">
                                <div className="calendar-header">
                                    <button className="calendar-nav" onClick={prevMonth}>
                                        {'<'}
                                    </button>
                                    <h3>{month1}</h3>
                                    <h3>{month2}</h3>
                                    <button className="calendar-nav" onClick={nextMonth}>
                                        {'>'}
                                    </button>
                                </div>

                                <div className="calendars">
                                    <div className="calendar">
                                        <div className="calendar-weekdays">
                                            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                                                <div key={day} className="calendar-weekday">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="calendar-days">{calendarDays1}</div>
                                    </div>

                                    <div className="calendar">
                                        <div className="calendar-weekdays">
                                            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                                                <div key={day} className="calendar-weekday">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="calendar-days">{calendarDays2}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="time-inputs">
                                <div className="time-input-group">
                                    <label>Nhận xe</label>
                                    <div className="custom-time-dropdown">
                                        <button
                                            className="time-dropdown-button"
                                            onClick={() => setShowStartTimeDropdown(!showStartTimeDropdown)}
                                        >
                                            {startTime}
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="2 4 6 8 10 4"></polyline>
                                            </svg>
                                        </button>
                                        {showStartTimeDropdown && (
                                            <div className="time-dropdown-menu" ref={startTimeMenuRef}>
                                                {hours.map((hour) => (
                                                    <button
                                                        key={hour}
                                                        className={`time-dropdown-item ${startTime === hour ? 'active' : ''}`}
                                                        onClick={() => {
                                                            setStartTime(hour);
                                                            setShowStartTimeDropdown(false);
                                                        }}
                                                    >
                                                        {hour}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="time-reset">
                                    <button type="button">↻</button>
                                </div>

                                <div className="time-input-group">
                                    <label>Trả xe</label>
                                    <div className="custom-time-dropdown">
                                        <button
                                            className="time-dropdown-button"
                                            onClick={() => setShowEndTimeDropdown(!showEndTimeDropdown)}
                                        >
                                            {endTime}
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="2 4 6 8 10 4"></polyline>
                                            </svg>
                                        </button>
                                        {showEndTimeDropdown && (
                                            <div className="time-dropdown-menu" ref={endTimeMenuRef}>
                                                {hours.map((hour) => (
                                                    <button
                                                        key={hour}
                                                        className={`time-dropdown-item ${endTime === hour ? 'active' : ''}`}
                                                        onClick={() => {
                                                            setEndTime(hour);
                                                            setShowEndTimeDropdown(false);
                                                        }}
                                                    >
                                                        {hour}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        // Hour rental view
                        <>
                            <div className="hour-inputs">
                                <div className="hour-input-group">
                                    <label>Ngày bắt đầu</label>
                                    <input
                                        type="date"
                                        value={startDate ? startDate.toISOString().split('T')[0] : ''}
                                        min={today.toISOString().split('T')[0]}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                setStartDate(new Date(e.target.value));
                                            }
                                        }}
                                    />
                                </div>

                                <div className="hour-input-group">
                                    <label>Giờ nhận xe</label>
                                    <select value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                                        {hours.map((hour) => (
                                            <option key={hour} value={hour}>
                                                {hour}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="hour-input-group full-width">
                                    <label>Thời gian thuê</label>
                                    <div className="duration-select">
                                        <button
                                            type="button"
                                            className="duration-display"
                                            onClick={() => setShowHourDropdown(!showHourDropdown)}
                                        >
                                            <span>{rentalHours} giờ (kết thúc: {calculateEndTime(startTime, rentalHours)} {String(startDate).padStart(2, '0')}/01/2026)</span>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </button>
                                        {showHourDropdown && (
                                            <div className="duration-dropdown">
                                                {hourOptions.map((option) => (
                                                    <label key={option} className="duration-option">
                                                        <input
                                                            type="radio"
                                                            name="duration"
                                                            value={option}
                                                            checked={rentalHours === option}
                                                            onChange={(e) => {
                                                                setRentalHours(Number(e.target.value));
                                                                setShowHourDropdown(false);
                                                            }}
                                                        />
                                                        <span>{option} giờ (kết thúc: {calculateEndTime(startTime, option)} {String(startDate).padStart(2, '0')}/01/2026)</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Duration info and confirm button */}
                    <div className="time-modal-footer">
                        <div className="duration-info">
                            <span>
                                {startDate && `${startTime}, ${startDate.toLocaleDateString('vi-VN')}`}
                                {endDate && ` - ${endTime}, ${endDate.toLocaleDateString('vi-VN')}`}
                                {!startDate && 'Vui lòng chọn ngày'}
                            </span>
                            <span>
                                Thời gian thuê: {activeTab === 'day'
                                    ? `${calculateRentalDays()} ngày`
                                    : `${rentalHours} giờ`}
                            </span>
                        </div>
                        <button
                            className="confirm-button"
                            onClick={handleConfirm}
                            disabled={activeTab === 'day' ? !startDate || !endDate : !startDate}
                        >
                            Tiếp tục
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

export default TimeModal;
