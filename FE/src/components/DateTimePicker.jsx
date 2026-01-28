'use client';

import { useState, useEffect } from 'react'
import '../styles/DateTimePicker.css'

function DateTimePicker({ isOpen, onClose, onConfirm, initialPickup, initialReturn, rentalType: initialRentalType }) {
    const [rentalType, setRentalType] = useState(initialRentalType || 'day') // 'day' or 'hour'
    const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0)) // January 2026
    const [pickupDate, setPickupDate] = useState(initialPickup || null)
    const [returnDate, setReturnDate] = useState(initialReturn || null)
    const [pickupTime, setPickupTime] = useState('21:00')
    const [returnTime, setReturnTime] = useState('20:00')
    const [selectionPhase, setSelectionPhase] = useState('pickup') // 'pickup' or 'return'

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    }

    const getMonthName = (date) => {
        return `Tháng ${date.getMonth() + 1}`
    }

    const handleDateClick = (day) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)

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

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
    }

    const calculateRentalDuration = () => {
        if (!pickupDate || !returnDate) return ''
        const diffTime = Math.abs(returnDate - pickupDate)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return `${diffDays} ngày`
    }

    const formatSelectedDateTime = () => {
        if (!pickupDate || !returnDate) return ''
        const pickupStr = `${String(pickupDate.getDate()).padStart(2, '0')}/0${pickupDate.getMonth() + 1}`
        const returnStr = `${String(returnDate.getDate()).padStart(2, '0')}/0${returnDate.getMonth() + 1}`
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
            const isPickupDate = pickupDate && dateObj.toDateString() === pickupDate.toDateString()
            const isReturnDate = returnDate && dateObj.toDateString() === returnDate.toDateString()
            const isBetween = pickupDate && returnDate && dateObj > pickupDate && dateObj < returnDate
            const isDisabled = dateObj < new Date(2026, 0, 1) || dateObj > new Date(2026, 1, 28)
            const isToday = dateObj.getDate() === 25 && dateObj.getMonth() === 0

            days.push(
                <button
                    key={day}
                    className={`calendar-day ${isPickupDate || isReturnDate ? 'selected' : ''} ${isBetween ? 'between' : ''} ${isToday ? 'today' : ''} ${isDisabled ? 'disabled' : ''}`}
                    onClick={() => handleDateClick(day)}
                    disabled={isDisabled}
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
