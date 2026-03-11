import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { getDisputeByBooking, resolveDispute, acceptResolution, submitCounterOffer } from '../api/disputes'
import { getMessagesByDispute, sendMessage, markMessagesAsRead } from '../api/messages'
import { formatVndCurrency } from '../utils/bookingUtils'
import '../styles/DisputeChatModal.css'

function DisputeChatModal({ booking, isOwner, onClose, onResolved }) {
    const [loading, setLoading] = useState(true)
    const [dispute, setDispute] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [showResolveForm, setShowResolveForm] = useState(false)
    const [resolveData, setResolveData] = useState({ finalAmount: '', resolutionNotes: '' })
    const [showCounterForm, setShowCounterForm] = useState(false)
    const [counterData, setCounterData] = useState({ counterAmount: '', counterReason: '' })
    const messagesEndRef = useRef(null)
    const pollInterval = useRef(null)

    useEffect(() => {
        fetchData()
        pollInterval.current = setInterval(fetchMessages, 5000)
        
        return () => {
            if (pollInterval.current) {
                clearInterval(pollInterval.current)
            }
        }
    }, [booking.id])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const fetchData = async () => {
        try {
            const disputeData = await getDisputeByBooking(booking.id)
            setDispute(disputeData)
            
            const messagesData = await getMessagesByDispute(disputeData.id)
            setMessages(messagesData)
            
            await markMessagesAsRead(disputeData.id)
        } catch (error) {
            toast.error('Không thể tải chi tiết tranh chấp')
        } finally {
            setLoading(false)
        }
    }

    const fetchMessages = async () => {
        if (!dispute) return
        try {
            const messagesData = await getMessagesByDispute(dispute.id)
            setMessages(messagesData)
            await markMessagesAsRead(dispute.id)
        } catch (error) {
            console.error('Failed to fetch messages:', error)
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !dispute) return

        setSending(true)
        try {
            const message = await sendMessage(dispute.id, newMessage.trim())
            setMessages(prev => [...prev, message])
            setNewMessage('')
        } catch (error) {
            toast.error(error.message || 'Không gửi được tin nhắn')
        } finally {
            setSending(false)
        }
    }

    const handleResolve = async () => {
        if (!resolveData.finalAmount || !resolveData.resolutionNotes) {
            toast.error('Vui lòng điền đầy đủ thông tin')
            return
        }

        try {
            const resolved = await resolveDispute(
                dispute.id, 
                parseFloat(resolveData.finalAmount), 
                resolveData.resolutionNotes
            )
            setDispute(resolved)
            toast.success('Đã đưa ra phương án xử lý, chờ khách xác nhận.')
            setShowResolveForm(false)
            onResolved()
        } catch (error) {
            toast.error(error.message || 'Không thể xử lý tranh chấp')
        }
    }

    const handleAccept = async () => {
        if (!confirm('Bạn có chắc muốn chấp nhận phương án này không?')) return

        try {
            const result = await acceptResolution(dispute.id)

            if (result?.penaltyCheckoutUrl) {
                window.open(result.penaltyCheckoutUrl, '_blank')
                toast.success('Đã mở link thanh toán. Vui lòng hoàn tất thanh toán, trạng thái sẽ tự cập nhật khi thanh toán thành công.')
            } else {
                toast.success('Đã chấp nhận! Booking hoàn thành.')
            }

            onResolved()
            onClose()
        } catch (error) {
            toast.error(error.message || 'Không thể chấp nhận phương án')
        }
    }

    const handleCounterOffer = async () => {
        if (!counterData.counterAmount || !counterData.counterReason) {
            toast.error('Vui lòng nhập số tiền đề xuất và lý do')
            return
        }
        try {
            const updated = await submitCounterOffer(
                dispute.id,
                parseFloat(counterData.counterAmount),
                counterData.counterReason
            )
            setDispute(updated)
            setShowCounterForm(false)
            toast.success('Đã gửi đề xuất ngược cho chủ xe.')
            onResolved()
        } catch (error) {
            toast.error(error.message || 'Không thể gửi đề xuất ngược')
        }
    }

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('vi-VN', {
            month: 'short',
            day: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="dispute-chat-modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-loading">
                        <div className="loading-spinner"></div>
                        <p>Đang tải đoạn chat...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="dispute-chat-modal" onClick={e => e.stopPropagation()}>
                <div className="chat-header">
                    <div className="chat-title">
                        <h2>Thảo luận tranh chấp</h2>
                        <span className={`status-badge ${dispute?.status?.toLowerCase()}`}>
                            {dispute?.status}
                        </span>
                    </div>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="dispute-info">
                    <div className="info-row">
                        <span>Xe:</span>
                        <strong>{dispute?.vehicleName}</strong>
                    </div>
                    <div className="info-row">
                        <span>Số tiền tranh chấp:</span>
                        <strong className="amount">{formatVndCurrency(dispute?.disputedAmount || 0)}</strong>
                    </div>
                    {dispute?.customerProposedAmount != null && (
                        <div className="info-row">
                            <span>Khách đề xuất:</span>
                            <strong className="amount">{formatVndCurrency(dispute?.customerProposedAmount || 0)}</strong>
                        </div>
                    )}
                    {dispute?.customerCounterReason && (
                        <div className="info-row reason">
                            <span>Lý do đề xuất ngược:</span>
                            <p>{dispute.customerCounterReason}</p>
                        </div>
                    )}
                    <div className="info-row reason">
                        <span>Lý do:</span>
                        <p>{dispute?.reason}</p>
                    </div>
                    {dispute?.status === 'RESOLVED' && (
                        <div className="resolution-info">
                            <h4>Phương án xử lý</h4>
                            <p className="resolution-notes">{dispute?.resolutionNotes}</p>
                            <div className="final-amount">
                                Số tiền chốt: <strong>{formatVndCurrency(dispute?.finalAmount || 0)}</strong>
                            </div>
                        </div>
                    )}
                </div>

                <div className="messages-container">
                    {messages.length === 0 ? (
                        <div className="no-messages">
                            <p>Chưa có tin nhắn. Hãy bắt đầu trao đổi!</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const showDate = index === 0 || 
                                formatDate(messages[index - 1].sentAt) !== formatDate(msg.sentAt)
                            
                            return (
                                <div key={msg.id}>
                                    {showDate && (
                                        <div className="date-separator">
                                            {formatDate(msg.sentAt)}
                                        </div>
                                    )}
                                    <div className={`message ${msg.isSenderOwner ? 'owner' : 'customer'} ${
                                        (isOwner && msg.isSenderOwner) || (!isOwner && !msg.isSenderOwner) ? 'mine' : ''
                                    }`}>
                                        <div className="message-header">
                                            <span className="sender-name">
                                                {msg.isSenderOwner ? '🚗 Chủ xe' : '👤 Khách'}
                                            </span>
                                            <span className="message-time">{formatTime(msg.sentAt)}</span>
                                        </div>
                                        <div className="message-content">{msg.content}</div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {dispute?.status !== 'RESOLVED' && (
                    <form className="message-input-form" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Nhập tin nhắn..."
                            disabled={sending}
                        />
                        <button type="submit" disabled={sending || !newMessage.trim()}>
                            {sending ? '...' : 'Gửi'}
                        </button>
                    </form>
                )}

                <div className="chat-actions">
                    {isOwner && (dispute?.status === 'OPEN' || dispute?.status === 'IN_DISCUSSION') && !showResolveForm && (
                        <button 
                            className="btn-resolve"
                            onClick={() => setShowResolveForm(true)}
                        >
                            Đề xuất phương án xử lý
                        </button>
                    )}

                    {showResolveForm && (
                        <div className="resolve-form">
                            <h4>Đề xuất phương án xử lý</h4>
                            <div className="form-group">
                                <label>Số tiền chốt (VNĐ)</label>
                                <input
                                    type="number"
                                    value={resolveData.finalAmount}
                                    onChange={(e) => setResolveData(prev => ({
                                        ...prev, 
                                        finalAmount: e.target.value
                                    }))}
                                    placeholder="Nhập số tiền cuối cùng"
                                    min="0"
                                    step="1000"
                                />
                            </div>
                            <div className="form-group">
                                <label>Ghi chú xử lý</label>
                                <textarea
                                    value={resolveData.resolutionNotes}
                                    onChange={(e) => setResolveData(prev => ({
                                        ...prev, 
                                        resolutionNotes: e.target.value
                                    }))}
                                    placeholder="Mô tả phương án xử lý..."
                                    rows="3"
                                />
                            </div>
                            <div className="resolve-actions">
                                <button 
                                    className="btn-cancel"
                                    onClick={() => setShowResolveForm(false)}
                                >
                                    Hủy
                                </button>
                                <button 
                                    className="btn-submit-resolve"
                                    onClick={handleResolve}
                                >
                                    Gửi phương án
                                </button>
                            </div>
                        </div>
                    )}

                    {!isOwner && dispute?.status === 'RESOLVED' && !showCounterForm && (
                        <button
                            className="btn-dispute"
                            onClick={() => setShowCounterForm(true)}
                        >
                            Đề xuất ngược
                        </button>
                    )}

                    {showCounterForm && (
                        <div className="resolve-form">
                            <h4>Đề xuất ngược</h4>
                            <div className="form-group">
                                <label>Số tiền bạn đồng ý trả</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={counterData.counterAmount}
                                    onChange={(e) => setCounterData((prev) => ({ ...prev, counterAmount: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Lý do</label>
                                <textarea
                                    rows="3"
                                    value={counterData.counterReason}
                                    onChange={(e) => setCounterData((prev) => ({ ...prev, counterReason: e.target.value }))}
                                    placeholder="Giải thích đề xuất ngược của bạn..."
                                />
                            </div>
                            <div className="resolve-actions">
                                <button className="btn-cancel" onClick={() => setShowCounterForm(false)}>
                                    Hủy
                                </button>
                                <button className="btn-submit-resolve" onClick={handleCounterOffer}>
                                    Gửi đề xuất ngược
                                </button>
                            </div>
                        </div>
                    )}

                    {!isOwner && dispute?.status === 'RESOLVED' && (
                        <button 
                            className="btn-accept"
                            onClick={handleAccept}
                        >
                            Chấp nhận phương án & hoàn tất booking
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DisputeChatModal
