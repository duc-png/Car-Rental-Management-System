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
        allowedKm: '',
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
        const overKmFee = calculateOverKmFee()
        const damageFee = parseFloat(formData.damageFee) || 0
        return {
            lateFee,
            fuelFee,
            overKmFee,
            damageFee,
            total: lateFee + fuelFee + overKmFee + damageFee
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

    const calculateOverKmFee = () => {
        const start = parseInt(formData.odometerStart)
        const end = parseInt(formData.odometerEnd)
        if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0

        const distance = end - start
        const defaultAllowed = calculateDefaultAllowedKm()
        const allowedKm = parseInt(formData.allowedKm || defaultAllowed)
        const overKm = Math.max(0, distance - (Number.isNaN(allowedKm) ? defaultAllowed : allowedKm))
        return overKm * 5000
    }

    const calculateDefaultAllowedKm = () => {
        if (!booking.startDate || !booking.endDate) return 200
        const start = new Date(booking.startDate)
        const end = new Date(booking.endDate)
        const diffMs = end - start
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        return Math.max(1, diffDays) * 200
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (parseInt(formData.odometerEnd) < parseInt(formData.odometerStart)) {
            toast.error('Công-tơ-mét cuối phải lớn hơn hoặc bằng ban đầu')
            return
        }

        setLoading(true)
        try {
            const inspectionData = {
                actualReturnDate: formData.actualReturnDate,
                odometerStart: parseInt(formData.odometerStart),
                odometerEnd: parseInt(formData.odometerEnd),
                allowedKm: formData.allowedKm ? parseInt(formData.allowedKm) : calculateDefaultAllowedKm(),
                fuelLevelStart: formData.fuelLevelStart,
                fuelLevelEnd: formData.fuelLevelEnd,
                damageDescription: formData.damageDescription || null,
                damageFee: formData.damageFee ? parseFloat(formData.damageFee) : 0,
                returnNotes: formData.returnNotes || null,
                damageImages: []
            }

            const result = await submitReturnInspection(booking.id, inspectionData)
            toast.success('Đã gửi biên bản trả xe! Đang chờ khách xác nhận.')
            onSuccess(result)
            onClose()
        } catch (error) {
            toast.error(error.message || 'Không thể gửi biên bản kiểm tra')
        } finally {
            setLoading(false)
        }
    }

    const preview = calculatePreview()

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="return-inspection-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Kiểm tra trả xe</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="booking-summary">
                    <h4>{booking.vehicleName || `Xe #${booking.vehicleId}`}</h4>
                    <p>Khách thuê: {booking.renterName || 'N/A'}</p>
                    <p>Thời gian kết thúc dự kiến: {booking.endDate ? new Date(booking.endDate).toLocaleString('vi-VN') : 'N/A'}</p>
                    <p>Giá thuê gốc: {formatVndCurrency(booking.totalPrice || 0)}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h3>Thông tin trả xe</h3>
                        
                        <div className="form-group">
                            <label>Ngày giờ trả xe thực tế *</label>
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
                                <label>Công-tơ-mét đầu (km) *</label>
                                <input
                                    type="number"
                                    name="odometerStart"
                                    value={formData.odometerStart}
                                    onChange={handleChange}
                                    placeholder="ví dụ: 50000"
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Công-tơ-mét cuối (km) *</label>
                                <input
                                    type="number"
                                    name="odometerEnd"
                                    value={formData.odometerEnd}
                                    onChange={handleChange}
                                    placeholder="ví dụ: 50500"
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Số km cho phép (km)</label>
                            <input
                                type="number"
                                name="allowedKm"
                                value={formData.allowedKm}
                                onChange={handleChange}
                                placeholder={`Mặc định: ${calculateDefaultAllowedKm()} km`}
                                min="0"
                            />
                            <small style={{ color: '#64748b' }}>
                                Hệ thống tính phí vượt mức theo 5,000 VNĐ/km.
                            </small>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Mức nhiên liệu ban đầu *</label>
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
                                <label>Mức nhiên liệu khi trả *</label>
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
                        <h3>Đánh giá hư hỏng</h3>
                        
                        <div className="form-group">
                            <label>Mô tả hư hỏng</label>
                            <textarea
                                name="damageDescription"
                                value={formData.damageDescription}
                                onChange={handleChange}
                                placeholder="Mô tả các hư hỏng nếu có..."
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label>Phí hư hỏng (VNĐ)</label>
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
                            <label>Ghi chú thêm</label>
                            <textarea
                                name="returnNotes"
                                value={formData.returnNotes}
                                onChange={handleChange}
                                placeholder="Ghi chú khác về việc trả xe..."
                                rows="2"
                            />
                        </div>
                    </div>

                    <div className="fee-preview">
                        <h3>Xem trước phí</h3>
                        <div className="fee-row">
                            <span>Phí trả muộn:</span>
                            <span className={preview.lateFee > 0 ? 'fee-amount' : ''}>
                                {formatVndCurrency(preview.lateFee)}
                            </span>
                        </div>
                        <div className="fee-row">
                            <span>Phí nhiên liệu:</span>
                            <span className={preview.fuelFee > 0 ? 'fee-amount' : ''}>
                                {formatVndCurrency(preview.fuelFee)}
                            </span>
                        </div>
                        <div className="fee-row">
                            <span>Phí vượt km:</span>
                            <span className={preview.overKmFee > 0 ? 'fee-amount' : ''}>
                                {formatVndCurrency(preview.overKmFee)}
                            </span>
                        </div>
                        <div className="fee-row">
                            <span>Phí hư hỏng:</span>
                            <span className={preview.damageFee > 0 ? 'fee-amount' : ''}>
                                {formatVndCurrency(preview.damageFee)}
                            </span>
                        </div>
                        <div className="fee-row total">
                            <span>Tổng phí phát sinh:</span>
                            <span>{formatVndCurrency(preview.total)}</span>
                        </div>
                        <div className="fee-row grand-total">
                            <span>Tổng cộng:</span>
                            <span>{formatVndCurrency((booking.totalPrice || 0) + preview.total)}</span>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Hủy
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Đang gửi...' : 'Gửi biên bản kiểm tra'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ReturnInspectionModal
