import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getConversationMessages, getMyConversations, sendMessage } from '../../api/chat'
import FleetSidebar from '../../components/owner/fleet/FleetSidebar'
import DashboardNotificationBell from '../../components/layout/DashboardNotificationBell'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/OwnerResponseDashboard.css'

const formatTime = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
    })
}

export default function OwnerResponseDashboard() {
    const navigate = useNavigate()
    const { user, isAuthenticated, logout } = useAuth()

    const [conversations, setConversations] = useState([])
    const [activeConversationId, setActiveConversationId] = useState(null)
    const [messages, setMessages] = useState([])
    const [loadingConversations, setLoadingConversations] = useState(true)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState('')
    const [draft, setDraft] = useState('')

    const canManage = Boolean(user?.role?.includes('ROLE_CAR_OWNER') || user?.role?.includes('ROLE_ADMIN'))

    const myUserId = Number(user?.userId || user?.id)

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    useEffect(() => {
        if (!isAuthenticated || !canManage) return

        let mounted = true
        const loadConversations = async (showLoading = false) => {
            if (showLoading) {
                setLoadingConversations(true)
            }
            setError('')
            try {
                const list = await getMyConversations()
                if (!mounted) return
                const safeList = Array.isArray(list) ? list : []
                setConversations(safeList)
                setActiveConversationId((prev) => {
                    if (safeList.length === 0) return null

                    const hasCurrent = prev && safeList.some((item) => Number(item?.id) === Number(prev))
                    if (hasCurrent) return prev

                    return Number(safeList[0]?.id) || null
                })
            } catch (err) {
                if (!mounted) return
                setError(err?.message || 'Không thể tải danh sách cuộc trò chuyện.')
            } finally {
                if (mounted && showLoading) {
                    setLoadingConversations(false)
                }
            }
        }

        loadConversations(true)
        const timer = window.setInterval(() => {
            loadConversations(false)
        }, 5000)

        return () => {
            mounted = false
            window.clearInterval(timer)
        }
    }, [isAuthenticated, canManage])

    useEffect(() => {
        if (!activeConversationId || !isAuthenticated || !canManage) {
            setMessages([])
            return
        }

        let mounted = true
        const loadMessages = async () => {
            setLoadingMessages(true)
            try {
                const list = await getConversationMessages(activeConversationId)
                if (!mounted) return
                setMessages(Array.isArray(list) ? list : [])
                setError('')
            } catch (err) {
                if (!mounted) return
                setError(err?.message || 'Không thể tải nội dung cuộc trò chuyện.')
            } finally {
                if (mounted) {
                    setLoadingMessages(false)
                }
            }
        }

        loadMessages()
        const timer = window.setInterval(loadMessages, 5000)

        return () => {
            mounted = false
            window.clearInterval(timer)
        }
    }, [activeConversationId, isAuthenticated, canManage])

    const activeConversation = useMemo(
        () => conversations.find((item) => Number(item?.id) === Number(activeConversationId)) || null,
        [conversations, activeConversationId]
    )

    const handleSendMessage = async () => {
        const content = draft.trim()
        if (!content || !activeConversationId || sending) return

        setSending(true)
        try {
            const sent = await sendMessage(activeConversationId, content)
            setMessages((prev) => [...prev, sent])
            setDraft('')
        } catch (err) {
            toast.error(err?.message || 'Không thể gửi phản hồi.')
        } finally {
            setSending(false)
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="fleet-guard">
                <h2>Vui lòng đăng nhập</h2>
                <p>Chỉ tài khoản chủ xe mới có thể truy cập trang này.</p>
                <Link to="/login" className="add-vehicle">Đăng nhập ngay</Link>
            </div>
        )
    }

    if (!canManage) {
        return (
            <div className="fleet-guard">
                <h2>Không đủ quyền truy cập</h2>
                <p>Vui lòng đăng nhập bằng tài khoản chủ xe.</p>
                <Link to="/" className="add-vehicle">Quay lại trang chủ</Link>
            </div>
        )
    }

    return (
        <div className="fleet-dashboard owner-feedback-page">
            <FleetSidebar user={user} onLogout={handleLogout} />

            <section className="fleet-main">
                <header className="fleet-header">
                    <div>
                        <p className="fleet-breadcrumb">Chủ xe</p>
                        <h1>Phản hồi khách hàng</h1>
                        <p>Theo dõi và trả lời tin nhắn từ khách thuê xe.</p>
                    </div>
                    <div className="fleet-header-actions">
                        <DashboardNotificationBell />
                    </div>
                </header>

                {error && (
                    <div className="fleet-alert" role="alert">
                        {error}
                    </div>
                )}

                <div className="owner-feedback-layout">
                    <aside className="owner-feedback-sidebar">
                        <h3>Hội thoại</h3>
                        {loadingConversations ? (
                            <p className="owner-feedback-placeholder">Đang tải...</p>
                        ) : conversations.length === 0 ? (
                            <p className="owner-feedback-placeholder">Chưa có hội thoại nào.</p>
                        ) : (
                            <div className="owner-feedback-list">
                                {conversations.map((item) => {
                                    const isActive = Number(item?.id) === Number(activeConversationId)
                                    return (
                                        <button
                                            key={item?.id}
                                            type="button"
                                            className={`owner-feedback-item ${isActive ? 'active' : ''}`}
                                            onClick={() => setActiveConversationId(Number(item?.id) || null)}
                                        >
                                            <strong>{item?.otherUserName || 'Khách hàng'}</strong>
                                            <span>{item?.vehicleName || 'Xe'}</span>
                                            <small>{item?.lastMessage || 'Chưa có tin nhắn'}</small>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </aside>

                    <div className="owner-feedback-main">
                        {activeConversation ? (
                            <>
                                <header className="owner-feedback-main-header">
                                    <h3>{activeConversation?.otherUserName || 'Khách hàng'}</h3>
                                    <p>{activeConversation?.vehicleName || ''}</p>
                                </header>

                                <div className="owner-feedback-messages">
                                    {loadingMessages ? (
                                        <p className="owner-feedback-placeholder">Đang tải tin nhắn...</p>
                                    ) : messages.length === 0 ? (
                                        <p className="owner-feedback-placeholder">Chưa có tin nhắn nào. Hãy bắt đầu phản hồi.</p>
                                    ) : (
                                        messages.map((message) => {
                                            const mine = Number(message?.senderId) === myUserId
                                            return (
                                                <div key={message?.id} className={`owner-feedback-row ${mine ? 'mine' : ''}`}>
                                                    <div className="owner-feedback-bubble">
                                                        <p>{message?.content || ''}</p>
                                                        <small>{formatTime(message?.createdAt)}</small>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>

                                <div className="owner-feedback-send">
                                    <input
                                        type="text"
                                        value={draft}
                                        placeholder="Nhập phản hồi cho khách hàng..."
                                        onChange={(event) => setDraft(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.preventDefault()
                                                handleSendMessage()
                                            }
                                        }}
                                    />
                                    <button type="button" onClick={handleSendMessage} disabled={sending || !draft.trim()}>
                                        {sending ? 'Đang gửi...' : 'Gửi phản hồi'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="owner-feedback-empty">
                                <p>Chọn một hội thoại để bắt đầu phản hồi khách.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}
