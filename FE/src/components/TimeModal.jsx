'use client';

import { useState } from 'react';
import '../styles/TimeModal.css';

function TimeModal({ isOpen, onClose, onSelect }) {
    const [activeTab, setActiveTab] = useState('day'); // 'day' or 'hour'
    const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0)); // January 2026
    const [startDate, setStartDate] = useState(25);
    const [endDate, setEndDate] = useState(26);
    const [startTime, setStartTime] = useState('21:00');
    const [endTime, setEndTime] = useState('20:00');
    const [rentalHours, setRentalHours] = useState(5);
    const [showHourDropdown, setShowHourDropdown] = useState(false);

    const hours = Array.from({ length: 24 }, (_, i) =>
        `${String(i).padStart(2, '0')}:00`
    );

    const hourOptions = [4, 5, 6, 7, 8];

    const calculateEndTime = (start, duration) => {
        const [hour] = start.split(':').map(Number);
        const endHour = (hour + duration) % 24;
        return `${String(endHour).padStart(2, '0')}:00`;
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
            const isStart = day === startDate;
            const isEnd = day === endDate;
            const isBetween = day > Math.min(startDate, endDate) && day < Math.max(startDate, endDate);

            days.push(
                <button
                    key={day}
                    className={`calendar-day ${isStart || isEnd ? 'selected' : ''} ${isBetween ? 'between' : ''
                        } ${day > 15 && day < 22 ? 'highlight' : ''}`}
                    onClick={() => {
                        if (day < startDate) {
                            setStartDate(day);
                        } else {
                            setEndDate(day);
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
        if (activeTab === 'day') {
            onSelect({
                type: 'day',
                startDate,
                endDate,
                startTime,
                endTime,
            });
        } else {
            onSelect({
                type: 'hour',
                startDate,
                startTime,
                rentalHours,
            });
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
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
                                    <select value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                                        {hours.map((hour) => (
                                            <option key={hour} value={hour}>
                                                {hour}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="time-reset">
                                    <button type="button">↻</button>
                                </div>

                                <div className="time-input-group">
                                    <label>Trả xe</label>
                                    <select value={endTime} onChange={(e) => setEndTime(e.target.value)}>
                                        {hours.map((hour) => (
                                            <option key={hour} value={hour}>
                                                {hour}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </>
                    ) : (
                        // Hour rental view
                        <>
                            <div className="hour-inputs">
                                <div className="hour-input-group">
                                    <label>Ngày bắt đầu</label>
                                    <select value={String(startDate)} onChange={(e) => setStartDate(Number(e.target.value))}>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                            <option key={day} value={day}>
                                                {String(day).padStart(2, '0')}/01/2026
                                            </option>
                                        ))}
                                    </select>
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
                            <span>{startTime}, {String(startDate).padStart(2, '0')}/01 - {activeTab === 'day' ? `${endTime}, 26/01` : `${calculateEndTime(startTime, rentalHours)}, ${String(startDate).padStart(2, '0')}/01`}</span>
                            <span>
                                Thời gian thuê: {activeTab === 'day' ? '1 ngày' : `${rentalHours} giờ`}
                            </span>
                        </div>
                        <button className="confirm-button" onClick={handleConfirm}>
                            Tiếp tục
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TimeModal;
