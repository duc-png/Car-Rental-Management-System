import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { getReturnInspection, confirmReturnFees, FUEL_LEVELS } from '../api/returns'
import { createDispute } from '../api/disputes'
import { formatVndCurrency } from '../utils/bookingUtils'
import '../styles/ReturnConfirmationModal.css'

function ReturnConfirmationModal({ booking, onClose, onSuccess, onDispute }) {
    const [loading, setLoading] = useState(true)
    const [confirming, setConfirming] = useState(false)
    const [disputing, setDisputing] = useState(false)
    const [inspection, setInspection] = useState(null)
    const [showDisputeForm, setShowDisputeForm] = useState(false)
    const [disputeReason, setDisputeReason] = useState('')
    const [proposedAmount, setProposedAmount] = useState('')

    useEffect(() => {
        fetchInspection()
    }, [booking.id])

    const fetchInspection = async () => {
        try {
            const data = await getReturnInspection(booking.id)
            setInspection(data)
        } catch (error) {
            toast.error('Không thể tải chi tiết biên bản trả xe')
        } finally {
            setLoading(false)
        }
    }

    const handleConfirm = async () => {
        if (!confirm('Bạn có chắc muốn xác nhận các khoản phí này không? Hành động này không thể hoàn tác.')) return
        
        setConfirming(true)
        try {
            const result = await confirmReturnFees(booking.id)

            if (result?.penaltyCheckoutUrl) {
                window.open(result.penaltyCheckoutUrl, '_blank')
                toast.success('Đã mở link thanh toán phí phạt. Vui lòng hoàn tất thanh toán, trạng thái sẽ tự cập nhật.')
            } else {
                toast.success('Đã xác nhận phí! Booking đã hoàn tất.')
            }

            onSuccess()
            onClose()
        } catch (error) {
            toast.error(error.message || 'Không thể xác nhận phí')
        } finally {
            setConfirming(false)
        }
    }

    const handleDispute = async () => {
        if (disputeReason.length < 10) {
            toast.error('Vui lòng nhập lý do ít nhất 10 ký tự')
            return
        }

        setDisputing(true)
        try {
            const parsedProposedAmount = proposedAmount ? parseFloat(proposedAmount) : null
            const dispute = await createDispute(
                booking.id,
                disputeReason,
                inspection.totalAdditionalFees,
                Number.isFinite(parsedProposedAmount) ? parsedProposedAmount : null
            )
            toast.success('Đã tạo tranh chấp! Bạn có thể trò chuyện với chủ xe.')
            onDispute(dispute)
            onClose()
        } catch (error) {
            toast.error(error.message || 'Không thể tạo tranh chấp')
        } finally {
            setDisputing(false)
        }
    }

    const getFuelLabel = (value) => {
        return FUEL_LEVELS.find(f => f.value === value)?.label || value
    }

    if (loading) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="return-confirmation-modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-loading">
                        <div className="loading-spinner"></div>
                        <p>Đang tải chi tiết biên bản trả xe...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="return-confirmation-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Tóm tắt phí trả xe</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="booking-summary">
                    <h4>{booking.vehicleName}</h4>
                    <p>Chủ xe: {booking.ownerName}</p>
                </div>

                <div className="inspection-details">
                    <div className="detail-section">
                        <h3>Thông tin trả xe</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="label">Thời gian trả dự kiến:</span>
                                <span>{new Date(inspection?.scheduledEndDate).toLocaleString()}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Thời gian trả thực tế:</span>
                                <span>{new Date(inspection?.actualReturnDate).toLocaleString()}</span>
                            </div>
                            {inspection?.lateHours > 0 && (
                                <div className="detail-item highlight">
                                    <span className="label">Trả muộn:</span>
                                    <span>{inspection.lateHours} giờ</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>Quãng đường & nhiên liệu</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="label">Quãng đường đã đi:</span>
                                <span>{inspection?.distanceTraveled?.toLocaleString()} km</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Số km cho phép:</span>
                                <span>{inspection?.allowedKm?.toLocaleString?.() || 0} km</span>
                            </div>
                            {(inspection?.overKm || 0) > 0 && (
                                <div className="detail-item highlight">
                                    <span className="label">Vượt mức:</span>
                                    <span>{inspection?.overKm?.toLocaleString()} km</span>
                                </div>
                            )}
                            <div className="detail-item">
                                <span className="label">Nhiên liệu đầu:</span>
                                <span>{getFuelLabel(inspection?.fuelLevelStart)}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Nhiên liệu cuối:</span>
                                <span>{getFuelLabel(inspection?.fuelLevelEnd)}</span>
                            </div>
                        </div>
                    </div>

                    {inspection?.damageDescription && (
                        <div className="detail-section damage">
                            <h3>Báo cáo hư hỏng</h3>
                            <p className="damage-description">{inspection.damageDescription}</p>
                            {inspection.damageImages?.length > 0 && (
                                <div className="damage-images">
                                    {inspection.damageImages.map((img, idx) => (
                                        <img key={idx} src={img} alt={`Hư hỏng ${idx + 1}`} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {inspection?.returnNotes && (
                        <div className="detail-section">
                            <h3>Ghi chú của chủ xe</h3>
                            <p className="notes">{inspection.returnNotes}</p>
                        </div>
                    )}

                    <div className="fee-breakdown">
                        <h3>Chi tiết phí</h3>
                        
                        <div className="fee-item">
                            <div className="fee-label">
                                <span>Phí trả muộn</span>
                                <small>{inspection?.lateFeeBreakdown}</small>
                            </div>
                            <span className={inspection?.lateFee > 0 ? 'fee-amount negative' : 'fee-amount'}>
                                {formatVndCurrency(inspection?.lateFee || 0)}
                            </span>
                        </div>

                        <div className="fee-item">
                            <div className="fee-label">
                                <span>Phí nhiên liệu</span>
                                <small>{inspection?.fuelFeeBreakdown}</small>
                            </div>
                            <span className={inspection?.fuelFee > 0 ? 'fee-amount negative' : 'fee-amount'}>
                                {formatVndCurrency(inspection?.fuelFee || 0)}
                            </span>
                        </div>

                        <div className="fee-item">
                            <div className="fee-label">
                                <span>Phí vượt km</span>
                                <small>{inspection?.overKmFeeBreakdown}</small>
                            </div>
                            <span className={inspection?.overKmFee > 0 ? 'fee-amount negative' : 'fee-amount'}>
                                {formatVndCurrency(inspection?.overKmFee || 0)}
                            </span>
                        </div>

                        <div className="fee-item">
                            <div className="fee-label">
                                <span>Phí hư hỏng</span>
                            </div>
                            <span className={inspection?.damageFee > 0 ? 'fee-amount negative' : 'fee-amount'}>
                                {formatVndCurrency(inspection?.damageFee || 0)}
                            </span>
                        </div>

                        <div className="fee-item total-additional">
                            <span>Tổng phí phát sinh</span>
                            <span className="fee-amount">{formatVndCurrency(inspection?.totalAdditionalFees || 0)}</span>
                        </div>

                        <div className="fee-item original">
                            <span>Giá thuê gốc</span>
                            <span>{formatVndCurrency(inspection?.originalPrice || 0)}</span>
                        </div>

                        <div className="fee-item grand-total">
                            <span>Tổng cộng</span>
                            <span>{formatVndCurrency(inspection?.finalTotal || 0)}</span>
                        </div>
                    </div>
                </div>

                {showDisputeForm ? (
                    <div className="dispute-form">
                        <h3>Tranh chấp các khoản phí này</h3>
                        <p>Vui lòng nêu rõ lý do bạn không đồng ý:</p>
                        <textarea
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            placeholder="Mô tả chi tiết lý do (tối thiểu 10 ký tự)..."
                            rows="4"
                        />
                        <input
                            type="number"
                            value={proposedAmount}
                            onChange={(e) => setProposedAmount(e.target.value)}
                            placeholder="Tùy chọn: số tiền bạn đồng ý trả"
                            min="0"
                            style={{ marginTop: '10px' }}
                        />
                        <div className="dispute-actions">
                            <button 
                                className="btn-cancel" 
                                onClick={() => setShowDisputeForm(false)}
                            >
                                Quay lại
                            </button>
                            <button 
                                className="btn-dispute-submit" 
                                onClick={handleDispute}
                                disabled={disputing || disputeReason.length < 10}
                            >
                                {disputing ? 'Đang gửi...' : 'Gửi tranh chấp'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="modal-actions">
                        <button 
                            className="btn-dispute" 
                            onClick={() => setShowDisputeForm(true)}
                        >
                            Tranh chấp phí
                        </button>
                        <button 
                            className="btn-confirm" 
                            onClick={handleConfirm}
                            disabled={confirming}
                        >
                            {confirming ? 'Đang xác nhận...' : 'Xác nhận & Thanh toán'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ReturnConfirmationModal
