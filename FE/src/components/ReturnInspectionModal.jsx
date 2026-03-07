import { useState } from 'react'
import { toast } from 'sonner'
import { submitReturnInspection, FUEL_LEVELS } from '../api/returns'
import { formatVndCurrency } from '../utils/bookingUtils'
import '../styles/ReturnInspectionModal.css'

function ReturnInspectionModal({ booking, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        actualReturnDate: new Date().toISOString().slice(0, 16),
        odometerStart: '',
        odometerEnd: '',
        fuelLevelStart: 'FULL',
        fuelLevelEnd: 'FULL',
        damageDescription: '',
        damageFee: '',
        returnNotes: ''
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const calculatePreview = () => {
        const lateFee = calculateLateFee()
        const fuelFee = calculateFuelFee()
        const damageFee = parseFloat(formData.damageFee) || 0
        return {
            lateFee,
            fuelFee,
            damageFee,
            total: lateFee + fuelFee + damageFee
        }
    }

    const calculateLateFee = () => {
        if (!formData.actualReturnDate || !booking.endDate) return 0
        const actualReturn = new Date(formData.actualReturnDate)
        const scheduledEnd = new Date(booking.endDate)
        if (actualReturn <= scheduledEnd) return 0
        
        const diffMs = actualReturn - scheduledEnd
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const chargeableHours = Math.max(0, diffHours - 1) // 1 hour grace period
        return chargeableHours * 50000 // 50.000 VNĐ per hour
    }

    const calculateFuelFee = () => {
        const startLevel = FUEL_LEVELS.find(f => f.value === formData.fuelLevelStart)?.percentage || 0
        const endLevel = FUEL_LEVELS.find(f => f.value === formData.fuelLevelEnd)?.percentage || 0
        const diff = startLevel - endLevel
        if (diff <= 0) return 0
        return diff * 5000 // 5.000 VNĐ per percent
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (parseInt(formData.odometerEnd) < parseInt(formData.odometerStart)) {
            toast.error('Odometer end must be greater than or equal to start')
            return
        }

        setLoading(true)
        try {
            const inspectionData = {
                actualReturnDate: formData.actualReturnDate,
                odometerStart: parseInt(formData.odometerStart),
                odometerEnd: parseInt(formData.odometerEnd),
                fuelLevelStart: formData.fuelLevelStart,
                fuelLevelEnd: formData.fuelLevelEnd,
                damageDescription: formData.damageDescription || null,
                damageFee: formData.damageFee ? parseFloat(formData.damageFee) : 0,
                returnNotes: formData.returnNotes || null,
                damageImages: []
            }

            const result = await submitReturnInspection(booking.id, inspectionData)
            toast.success('Return inspection submitted! Waiting for customer confirmation.')
            onSuccess(result)
            onClose()
        } catch (error) {
            toast.error(error.message || 'Failed to submit inspection')
        } finally {
            setLoading(false)
        }
    }

    const preview = calculatePreview()

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="return-inspection-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Return Inspection</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="booking-summary">
                    <h4>{booking.vehicleName || `Vehicle #${booking.vehicleId}`}</h4>
                    <p>Renter: {booking.renterName || 'N/A'}</p>
                    <p>Scheduled End: {booking.endDate ? new Date(booking.endDate).toLocaleString('vi-VN') : 'N/A'}</p>
                    <p>Original Price: {formatVndCurrency(booking.totalPrice || 0)}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h3>Return Details</h3>
                        
                        <div className="form-group">
                            <label>Actual Return Date & Time *</label>
                            <input
                                type="datetime-local"
                                name="actualReturnDate"
                                value={formData.actualReturnDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Odometer Start (km) *</label>
                                <input
                                    type="number"
                                    name="odometerStart"
                                    value={formData.odometerStart}
                                    onChange={handleChange}
                                    placeholder="e.g., 50000"
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Odometer End (km) *</label>
                                <input
                                    type="number"
                                    name="odometerEnd"
                                    value={formData.odometerEnd}
                                    onChange={handleChange}
                                    placeholder="e.g., 50500"
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Fuel Level Start *</label>
                                <select
                                    name="fuelLevelStart"
                                    value={formData.fuelLevelStart}
                                    onChange={handleChange}
                                    required
                                >
                                    {FUEL_LEVELS.map(level => (
                                        <option key={level.value} value={level.value}>
                                            {level.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Fuel Level End *</label>
                                <select
                                    name="fuelLevelEnd"
                                    value={formData.fuelLevelEnd}
                                    onChange={handleChange}
                                    required
                                >
                                    {FUEL_LEVELS.map(level => (
                                        <option key={level.value} value={level.value}>
                                            {level.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Damage Assessment</h3>
                        
                        <div className="form-group">
                            <label>Damage Description</label>
                            <textarea
                                name="damageDescription"
                                value={formData.damageDescription}
                                onChange={handleChange}
                                placeholder="Describe any damage found..."
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label>Damage Fee (VNĐ)</label>
                            <input
                                type="number"
                                name="damageFee"
                                value={formData.damageFee}
                                onChange={handleChange}
                                placeholder="0"
                                min="0"
                                step="1000"
                            />
                        </div>

                        <div className="form-group">
                            <label>Additional Notes</label>
                            <textarea
                                name="returnNotes"
                                value={formData.returnNotes}
                                onChange={handleChange}
                                placeholder="Any other notes about the return..."
                                rows="2"
                            />
                        </div>
                    </div>

                    <div className="fee-preview">
                        <h3>Fee Preview</h3>
                        <div className="fee-row">
                            <span>Late Fee:</span>
                            <span className={preview.lateFee > 0 ? 'fee-amount' : ''}>
                                {formatVndCurrency(preview.lateFee)}
                            </span>
                        </div>
                        <div className="fee-row">
                            <span>Fuel Fee:</span>
                            <span className={preview.fuelFee > 0 ? 'fee-amount' : ''}>
                                {formatVndCurrency(preview.fuelFee)}
                            </span>
                        </div>
                        <div className="fee-row">
                            <span>Damage Fee:</span>
                            <span className={preview.damageFee > 0 ? 'fee-amount' : ''}>
                                {formatVndCurrency(preview.damageFee)}
                            </span>
                        </div>
                        <div className="fee-row total">
                            <span>Total Additional Fees:</span>
                            <span>{formatVndCurrency(preview.total)}</span>
                        </div>
                        <div className="fee-row grand-total">
                            <span>Grand Total:</span>
                            <span>{formatVndCurrency((booking.totalPrice || 0) + preview.total)}</span>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Inspection'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ReturnInspectionModal
