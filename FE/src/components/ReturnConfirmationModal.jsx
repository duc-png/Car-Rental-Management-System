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

    useEffect(() => {
        fetchInspection()
    }, [booking.id])

    const fetchInspection = async () => {
        try {
            const data = await getReturnInspection(booking.id)
            setInspection(data)
        } catch (error) {
            toast.error('Failed to load inspection details')
        } finally {
            setLoading(false)
        }
    }

    const handleConfirm = async () => {
        if (!confirm('Are you sure you want to confirm these fees? This action cannot be undone.')) return
        
        setConfirming(true)
        try {
            await confirmReturnFees(booking.id)
            toast.success('Fees confirmed! Booking completed.')
            onSuccess()
            onClose()
        } catch (error) {
            toast.error(error.message || 'Failed to confirm fees')
        } finally {
            setConfirming(false)
        }
    }

    const handleDispute = async () => {
        if (disputeReason.length < 10) {
            toast.error('Please provide a reason with at least 10 characters')
            return
        }

        setDisputing(true)
        try {
            const dispute = await createDispute(booking.id, disputeReason, inspection.totalAdditionalFees)
            toast.success('Dispute created! You can now chat with the owner.')
            onDispute(dispute)
            onClose()
        } catch (error) {
            toast.error(error.message || 'Failed to create dispute')
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
                        <p>Loading inspection details...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="return-confirmation-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Return Fee Summary</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="booking-summary">
                    <h4>{booking.vehicleName}</h4>
                    <p>Owner: {booking.ownerName}</p>
                </div>

                <div className="inspection-details">
                    <div className="detail-section">
                        <h3>Return Information</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="label">Scheduled Return:</span>
                                <span>{new Date(inspection?.scheduledEndDate).toLocaleString()}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Actual Return:</span>
                                <span>{new Date(inspection?.actualReturnDate).toLocaleString()}</span>
                            </div>
                            {inspection?.lateHours > 0 && (
                                <div className="detail-item highlight">
                                    <span className="label">Late By:</span>
                                    <span>{inspection.lateHours} hours</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="detail-section">
                        <h3>Mileage & Fuel</h3>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="label">Distance Traveled:</span>
                                <span>{inspection?.distanceTraveled?.toLocaleString()} km</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Fuel Start:</span>
                                <span>{getFuelLabel(inspection?.fuelLevelStart)}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Fuel End:</span>
                                <span>{getFuelLabel(inspection?.fuelLevelEnd)}</span>
                            </div>
                        </div>
                    </div>

                    {inspection?.damageDescription && (
                        <div className="detail-section damage">
                            <h3>Damage Report</h3>
                            <p className="damage-description">{inspection.damageDescription}</p>
                            {inspection.damageImages?.length > 0 && (
                                <div className="damage-images">
                                    {inspection.damageImages.map((img, idx) => (
                                        <img key={idx} src={img} alt={`Damage ${idx + 1}`} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {inspection?.returnNotes && (
                        <div className="detail-section">
                            <h3>Owner Notes</h3>
                            <p className="notes">{inspection.returnNotes}</p>
                        </div>
                    )}

                    <div className="fee-breakdown">
                        <h3>Fee Breakdown</h3>
                        
                        <div className="fee-item">
                            <div className="fee-label">
                                <span>Late Fee</span>
                                <small>{inspection?.lateFeeBreakdown}</small>
                            </div>
                            <span className={inspection?.lateFee > 0 ? 'fee-amount negative' : 'fee-amount'}>
                                {formatVndCurrency(inspection?.lateFee || 0)}
                            </span>
                        </div>

                        <div className="fee-item">
                            <div className="fee-label">
                                <span>Fuel Fee</span>
                                <small>{inspection?.fuelFeeBreakdown}</small>
                            </div>
                            <span className={inspection?.fuelFee > 0 ? 'fee-amount negative' : 'fee-amount'}>
                                {formatVndCurrency(inspection?.fuelFee || 0)}
                            </span>
                        </div>

                        <div className="fee-item">
                            <div className="fee-label">
                                <span>Damage Fee</span>
                            </div>
                            <span className={inspection?.damageFee > 0 ? 'fee-amount negative' : 'fee-amount'}>
                                {formatVndCurrency(inspection?.damageFee || 0)}
                            </span>
                        </div>

                        <div className="fee-item total-additional">
                            <span>Total Additional Fees</span>
                            <span className="fee-amount">{formatVndCurrency(inspection?.totalAdditionalFees || 0)}</span>
                        </div>

                        <div className="fee-item original">
                            <span>Original Rental</span>
                            <span>{formatVndCurrency(inspection?.originalPrice || 0)}</span>
                        </div>

                        <div className="fee-item grand-total">
                            <span>Grand Total</span>
                            <span>{formatVndCurrency(inspection?.finalTotal || 0)}</span>
                        </div>
                    </div>
                </div>

                {showDisputeForm ? (
                    <div className="dispute-form">
                        <h3>Dispute These Fees</h3>
                        <p>Please explain why you disagree with the charges:</p>
                        <textarea
                            value={disputeReason}
                            onChange={(e) => setDisputeReason(e.target.value)}
                            placeholder="Describe your concern in detail (minimum 10 characters)..."
                            rows="4"
                        />
                        <div className="dispute-actions">
                            <button 
                                className="btn-cancel" 
                                onClick={() => setShowDisputeForm(false)}
                            >
                                Back
                            </button>
                            <button 
                                className="btn-dispute-submit" 
                                onClick={handleDispute}
                                disabled={disputing || disputeReason.length < 10}
                            >
                                {disputing ? 'Submitting...' : 'Submit Dispute'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="modal-actions">
                        <button 
                            className="btn-dispute" 
                            onClick={() => setShowDisputeForm(true)}
                        >
                            Dispute Fees
                        </button>
                        <button 
                            className="btn-confirm" 
                            onClick={handleConfirm}
                            disabled={confirming}
                        >
                            {confirming ? 'Confirming...' : 'Confirm & Pay'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ReturnConfirmationModal
