'use client';

import { useState } from 'react'
import '../../styles/DateTimePicker.css'

/**
 * DateTimePicker - Component chọn ngày + giờ (cho booking)
 * Khác với DatePicker: DateTimePicker có thêm time selector
 * 
 * @param {boolean} isOpen - Modal mở/đóng
 * @param {Function} onClose - Callback khi đóng
 * @param {Function} onConfirm - Callback khi confirm, nhận { pickupDate: Date, returnDate: Date }
 * @param {Date} initialPickup - Ngày nhận xe ban đầu
 * @param {Date} initialReturn - Ngày trả xe ban đầu
 * @param {string} rentalType - 'day' | 'hour' (default: 'day')
 */
function DateTimePicker({ isOpen, onClose, onConfirm, initialPickup = null, initialReturn = null, rentalType: initialRentalType = 'day' }) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [rentalType, setRentalType] = useState(initialRentalType) // 'day' or 'hour'
    const [currentMonth, setCurrentMonth] = useState(today)
    const [pickupDate, setPickupDate] = useState(initialPickup)
    const [returnDate, setReturnDate] = useState(initialReturn)
    const [pickupTime, setPickupTime] = useState('09:00')
    const [returnTime, setReturnTime] = useState('18:00')
    const [selectionPhase, setSelectionPhase] = useState('pickup') // 'pickup' or 'return'

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
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        newDate.setHours(0, 0, 0, 0)

        if (isPastDate(newDate)) return

        if (selectionPhase === 'pickup') {
            setPickupDate(newDate)
            setSelectionPhase('return')
        } else {
            if (newDate < pickupDate) {
                // If return date is before pickup, swap them
                setReturnDate(pickupDate)
                setPickupDate(newDate)
                setSelectionPhase('pickup')
            } else {
                setReturnDate(newDate)
                setSelectionPhase('pickup')
            }
        }
    }

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
    }

    const calculateRentalDuration = () => {
        if (!pickupDate || !returnDate) return ''
        const diffTime = Math.abs(returnDate - pickupDate)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return `${diffDays} ngày`
    }

    const formatSelectedDateTime = () => {
        if (!pickupDate || !returnDate) return ''
        const pickupStr = pickupDate.toLocaleDateString('vi-VN')
        const returnStr = returnDate.toLocaleDateString('vi-VN')
        return `${pickupTime}, ${pickupStr} - ${returnTime}, ${returnStr}`
    }

    const handleConfirm = () => {
        if (pickupDate && returnDate) {
            const pickup = new Date(pickupDate)
            const [pickupHour, pickupMin] = pickupTime.split(':')
            pickup.setHours(parseInt(pickupHour), parseInt(pickupMin))

            const returnDateObj = new Date(returnDate)
            const [returnHour, returnMin] = returnTime.split(':')
            returnDateObj.setHours(parseInt(returnHour), parseInt(returnMin))

            onConfirm({
                pickupDate: pickup,
                returnDate: returnDateObj
            })
            onClose()
        }
    }

    const renderCalendar = (monthOffset) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset)
        const daysInMonth = getDaysInMonth(date)
        const firstDay = getFirstDayOfMonth(date)
        const days = []

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-empty"></div>)
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateObj = new Date(date.getFullYear(), date.getMonth(), day)
            dateObj.setHours(0, 0, 0, 0)
            const isPickupDate = pickupDate && dateObj.getTime() === pickupDate.getTime()
            const isReturnDate = returnDate && dateObj.getTime() === returnDate.getTime()
            const isBetween = pickupDate && returnDate && dateObj > pickupDate && dateObj < returnDate
            const isPast = isPastDate(dateObj)
            const isTodayDate = isToday(dateObj)

            let className = 'calendar-day'
            if (isPast) className += ' disabled'
            if (isTodayDate) className += ' today'
            if (isPickupDate) className += ' selected start-date'
            if (isReturnDate) className += ' selected end-date'
            if (isBetween) className += ' between'

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

    return (
        <div className="datetime-picker-overlay" onClick={onClose}>
            <div className="datetime-picker-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Thời gian</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-tabs">
                    <button
                        className={`tab ${rentalType === 'day' ? 'active' : ''}`}
                        onClick={() => setRentalType('day')}
                    >
                        Thuê theo ngày
                    </button>
                    <button
                        className={`tab ${rentalType === 'hour' ? 'active' : ''}`}
                        onClick={() => setRentalType('hour')}
                    >
                        Thuê theo giờ
                    </button>
                </div>

                <div className="calendar-container">
                    <div className="calendar-header">
                        <button className="calendar-nav" onClick={handlePrevMonth}>←</button>
                        <h3>{getMonthName(currentMonth)}</h3>
                        <h3>{getMonthName(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}</h3>
                        <button className="calendar-nav" onClick={handleNextMonth}>→</button>
                    </div>

                    <div className="calendars-grid">
                        <div className="calendar">
                            <div className="calendar-weekdays">
                                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                                    <div key={day} className="weekday">{day}</div>
                                ))}
                            </div>
                            <div className="calendar-days">
                                {renderCalendar(0)}
                            </div>
                        </div>

                        <div className="calendar">
                            <div className="calendar-weekdays">
                                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                                    <div key={day} className="weekday">{day}</div>
                                ))}
                            </div>
                            <div className="calendar-days">
                                {renderCalendar(1)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="time-selector">
                    <div className="time-group">
                        <label>Nhận xe</label>
                        <select value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="time-select">
                            {Array.from({ length: 24 }, (_, i) => {
                                const hour = String(i).padStart(2, '0')
                                return (
                                    <option key={hour} value={`${hour}:00`}>
                                        {hour}:00
                                    </option>
                                )
                            })}
                        </select>
                    </div>

                    <div className="time-separator">⊗</div>

                    <div className="time-group">
                        <label>Trả xe</label>
                        <select value={returnTime} onChange={(e) => setReturnTime(e.target.value)} className="time-select">
                            {Array.from({ length: 24 }, (_, i) => {
                                const hour = String(i).padStart(2, '0')
                                return (
                                    <option key={hour} value={`${hour}:00`}>
                                        {hour}:00
                                    </option>
                                )
                            })}
                        </select>
                    </div>
                </div>

                <div className="modal-footer">
                    <div className="rental-info">
                        <p className="rental-datetime">{formatSelectedDateTime()}</p>
                        <p className="rental-duration">Thời gian thuê: <span className="duration-highlight">{calculateRentalDuration()}</span></p>
                    </div>
                    <button className="btn-continue" onClick={handleConfirm}>Tiếp tục</button>
                </div>
            </div>
        </div>
    )
}

export default DateTimePicker

