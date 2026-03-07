'use client';

import { useState } from 'react'
import '../styles/DatePicker.css'

/**
 * DatePicker - Component chỉ chọn ngày (không có giờ)
 * Dùng cho filters, reports, v.v.
 * 
 * @param {boolean} isOpen - Modal mở/đóng
 * @param {Function} onClose - Callback khi đóng
 * @param {Function} onConfirm - Callback khi confirm, nhận { date: Date } hoặc { fromDate: Date, toDate: Date }
 * @param {Date} initialDate - Ngày ban đầu (single date mode)
 * @param {Date} initialFromDate - Ngày bắt đầu (range mode)
 * @param {Date} initialToDate - Ngày kết thúc (range mode)
 * @param {string} mode - 'single' | 'range' (default: 'single')
 */
function DatePicker({ 
    isOpen, 
    onClose, 
    onConfirm, 
    initialDate = null,
    initialFromDate = null,
    initialToDate = null,
    mode = 'single' 
}) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [currentMonth, setCurrentMonth] = useState(today)
    const [selectedDate, setSelectedDate] = useState(initialDate)
    const [fromDate, setFromDate] = useState(initialFromDate)
    const [toDate, setToDate] = useState(initialToDate)
    const [selectionPhase, setSelectionPhase] = useState('from') // 'from' | 'to'

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    }

    const getMonthName = (date) => {
        return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    }

    const isPastDate = (date) => {
        const checkDate = new Date(date)
        checkDate.setHours(0, 0, 0, 0)
        return checkDate < today
    }

    const isToday = (date) => {
        const checkDate = new Date(date)
        checkDate.setHours(0, 0, 0, 0)
        return checkDate.getTime() === today.getTime()
    }

    const handleDateClick = (day) => {
        const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        clickedDate.setHours(0, 0, 0, 0)

        if (isPastDate(clickedDate)) return

        if (mode === 'single') {
            setSelectedDate(clickedDate)
        } else {
            // Range mode
            if (selectionPhase === 'from' || (fromDate && toDate)) {
                // Start new selection
                setFromDate(clickedDate)
                setToDate(null)
                setSelectionPhase('to')
            } else {
                // Select end date
                if (clickedDate < fromDate) {
                    // Swap if clicked before start
                    setToDate(fromDate)
                    setFromDate(clickedDate)
                } else {
                    setToDate(clickedDate)
                }
                setSelectionPhase('from')
            }
        }
    }

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
    }

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
    }

    const handleConfirm = () => {
        if (mode === 'single') {
            if (selectedDate) {
                onConfirm({ date: selectedDate })
                onClose()
            }
        } else {
            if (fromDate && toDate) {
                onConfirm({ fromDate, toDate })
                onClose()
            }
        }
    }

    const renderCalendar = (monthOffset) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset)
        const daysInMonth = getDaysInMonth(date)
        const firstDay = getFirstDayOfMonth(date)
        const days = []

        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="date-picker-empty"></div>)
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(date.getFullYear(), date.getMonth(), day)
            dateObj.setHours(0, 0, 0, 0)
            const isPast = isPastDate(dateObj)
            const isTodayDate = isToday(dateObj)

            let className = 'date-picker-day'
            if (isPast) className += ' past-date'
            if (isTodayDate) className += ' today'

            if (mode === 'single') {
                if (selectedDate && dateObj.getTime() === selectedDate.getTime()) {
                    className += ' selected'
                }
            } else {
                // Range mode
                const isFrom = fromDate && dateObj.getTime() === fromDate.getTime()
                const isTo = toDate && dateObj.getTime() === toDate.getTime()
                const isBetween = fromDate && toDate && dateObj > fromDate && dateObj < toDate

                if (isFrom) className += ' selected start-date'
                if (isTo) className += ' selected end-date'
                if (isBetween) className += ' between'
            }

            days.push(
                <button
                    key={day}
                    className={className}
                    onClick={() => handleDateClick(day)}
                    disabled={isPast}
                >
                    {day}
                </button>
            )
        }

        return days
    }

    if (!isOpen) return null

    const nextMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)

    return (
        <div className="date-picker-overlay" onClick={onClose}>
            <div className="date-picker-modal" onClick={(e) => e.stopPropagation()}>
                <div className="date-picker-header">
                    <h2>{mode === 'single' ? 'Chọn ngày' : 'Chọn khoảng ngày'}</h2>
                    <button className="date-picker-close" onClick={onClose}>✕</button>
                </div>

                <div className="date-picker-calendar-container">
                    <div className="date-picker-calendar-header">
                        <button className="date-picker-nav" onClick={handlePrevMonth}>←</button>
                        <h3>{getMonthName(currentMonth)}</h3>
                        <h3>{getMonthName(nextMonthDate)}</h3>
                        <button className="date-picker-nav" onClick={handleNextMonth}>→</button>
                    </div>

                    <div className="date-picker-calendars-grid">
                        <div className="date-picker-calendar">
                            <div className="date-picker-weekdays">
                                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                                    <div key={day} className="date-picker-weekday">{day}</div>
                                ))}
                            </div>
                            <div className="date-picker-days">
                                {renderCalendar(0)}
                            </div>
                        </div>

                        <div className="date-picker-calendar">
                            <div className="date-picker-weekdays">
                                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                                    <div key={day} className="date-picker-weekday">{day}</div>
                                ))}
                            </div>
                            <div className="date-picker-days">
                                {renderCalendar(1)}
                            </div>
                        </div>
                    </div>
                </div>

                {mode === 'range' && (
                    <div className="date-picker-range-info">
                        <p>
                            {fromDate && toDate 
                                ? `${fromDate.toLocaleDateString('vi-VN')} → ${toDate.toLocaleDateString('vi-VN')}`
                                : fromDate 
                                    ? `Từ: ${fromDate.toLocaleDateString('vi-VN')} (chọn ngày kết thúc)`
                                    : 'Chọn ngày bắt đầu'}
                        </p>
                    </div>
                )}

                <div className="date-picker-footer">
                    <button className="date-picker-btn-cancel" onClick={onClose}>Hủy</button>
                    <button 
                        className="date-picker-btn-confirm" 
                        onClick={handleConfirm}
                        disabled={mode === 'single' ? !selectedDate : !fromDate || !toDate}
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DatePicker
