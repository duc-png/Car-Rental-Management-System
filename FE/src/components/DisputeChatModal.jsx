import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { getDisputeByBooking, resolveDispute, acceptResolution } from '../api/disputes'
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
            toast.error('Failed to load dispute details')
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
            toast.error(error.message || 'Failed to send message')
        } finally {
            setSending(false)
        }
    }

    const handleResolve = async () => {
        if (!resolveData.finalAmount || !resolveData.resolutionNotes) {
            toast.error('Please fill in all fields')
            return
        }

        try {
            const resolved = await resolveDispute(
                dispute.id, 
                parseFloat(resolveData.finalAmount), 
                resolveData.resolutionNotes
            )
            setDispute(resolved)
            toast.success('Dispute resolved! Waiting for customer acceptance.')
            setShowResolveForm(false)
            onResolved()
        } catch (error) {
            toast.error(error.message || 'Failed to resolve dispute')
        }
    }

    const handleAccept = async () => {
        if (!confirm('Accept this resolution and complete the booking?')) return

        try {
            await acceptResolution(dispute.id)
            toast.success('Resolution accepted! Booking completed.')
            onResolved()
            onClose()
        } catch (error) {
            toast.error(error.message || 'Failed to accept resolution')
        }
    }

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
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
                        <p>Loading chat...</p>
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
                        <h2>Dispute Discussion</h2>
                        <span className={`status-badge ${dispute?.status?.toLowerCase()}`}>
                            {dispute?.status}
                        </span>
                    </div>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="dispute-info">
                    <div className="info-row">
                        <span>Vehicle:</span>
                        <strong>{dispute?.vehicleName}</strong>
                    </div>
                    <div className="info-row">
                        <span>Disputed Amount:</span>
                        <strong className="amount">{formatVndCurrency(dispute?.disputedAmount || 0)}</strong>
                    </div>
                    <div className="info-row reason">
                        <span>Reason:</span>
                        <p>{dispute?.reason}</p>
                    </div>
                    {dispute?.status === 'RESOLVED' && (
                        <div className="resolution-info">
                            <h4>Resolution</h4>
                            <p className="resolution-notes">{dispute?.resolutionNotes}</p>
                            <div className="final-amount">
                                Final Amount: <strong>{formatVndCurrency(dispute?.finalAmount || 0)}</strong>
                            </div>
                        </div>
                    )}
                </div>

                <div className="messages-container">
                    {messages.length === 0 ? (
                        <div className="no-messages">
                            <p>No messages yet. Start the conversation!</p>
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
                                                {msg.isSenderOwner ? '🚗 Owner' : '👤 Customer'}
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
                            placeholder="Type your message..."
                            disabled={sending}
                        />
                        <button type="submit" disabled={sending || !newMessage.trim()}>
                            {sending ? '...' : 'Send'}
                        </button>
                    </form>
                )}

                <div className="chat-actions">
                    {isOwner && dispute?.status === 'IN_DISCUSSION' && !showResolveForm && (
                        <button 
                            className="btn-resolve"
                            onClick={() => setShowResolveForm(true)}
                        >
                            Propose Resolution
                        </button>
                    )}

                    {showResolveForm && (
                        <div className="resolve-form">
                            <h4>Propose Resolution</h4>
                            <div className="form-group">
                                <label>Final Amount ($)</label>
                                <input
                                    type="number"
                                    value={resolveData.finalAmount}
                                    onChange={(e) => setResolveData(prev => ({
                                        ...prev, 
                                        finalAmount: e.target.value
                                    }))}
                                    placeholder="Enter final fee amount"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div className="form-group">
                                <label>Resolution Notes</label>
                                <textarea
                                    value={resolveData.resolutionNotes}
                                    onChange={(e) => setResolveData(prev => ({
                                        ...prev, 
                                        resolutionNotes: e.target.value
                                    }))}
                                    placeholder="Explain the resolution..."
                                    rows="3"
                                />
                            </div>
                            <div className="resolve-actions">
                                <button 
                                    className="btn-cancel"
                                    onClick={() => setShowResolveForm(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="btn-submit-resolve"
                                    onClick={handleResolve}
                                >
                                    Submit Resolution
                                </button>
                            </div>
                        </div>
                    )}

                    {!isOwner && dispute?.status === 'RESOLVED' && (
                        <button 
                            className="btn-accept"
                            onClick={handleAccept}
                        >
                            Accept Resolution & Complete Booking
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DisputeChatModal
