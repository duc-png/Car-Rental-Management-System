import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getConversationMessages, getMyConversations, sendMessage } from '../../api/chat'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/ChatPage.css'

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

export default function ChatPage() {
    const [searchParams] = useSearchParams()
    const location = useLocation()
    const navigate = useNavigate()
    const { user, isAuthenticated, loading } = useAuth()

    const [conversations, setConversations] = useState([])
    const [activeConversationId, setActiveConversationId] = useState(null)
    const [messages, setMessages] = useState([])
    const [loadingConversations, setLoadingConversations] = useState(false)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState('')
    const [draft, setDraft] = useState('')

    const requestedConversationId = useMemo(() => {
        const value = Number(searchParams.get('conversationId'))
        return Number.isInteger(value) ? value : null
    }, [searchParams])

    const lockToRequestedConversation = useMemo(
        () => searchParams.get('fromDetails') === '1',
        [searchParams]
    )

    const visibleConversations = useMemo(() => {
        if (!lockToRequestedConversation || !requestedConversationId) return conversations
        return conversations.filter((item) => Number(item?.id) === requestedConversationId)
    }, [conversations, lockToRequestedConversation, requestedConversationId])

    useEffect(() => {
        if (loading) return
        if (!isAuthenticated) {
            navigate('/login')
        }
    }, [isAuthenticated, loading, navigate])

    useLayoutEffect(() => {
        const forceTop = () => {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
            document.documentElement.scrollTop = 0
            document.body.scrollTop = 0
        }

        forceTop()
        const rafId = window.requestAnimationFrame(() => {
            forceTop()
        })
        const timeoutId = window.setTimeout(() => {
            forceTop()
        }, 0)

        return () => {
            window.cancelAnimationFrame(rafId)
            window.clearTimeout(timeoutId)
        }
    }, [location.key, location.search])

    useEffect(() => {
        if (!lockToRequestedConversation) return

        const forceTop = () => {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
            document.documentElement.scrollTop = 0
            document.body.scrollTop = 0
        }

        const timers = [0, 60, 140, 280, 520, 900].map((delay) => window.setTimeout(forceTop, delay))

        return () => {
            timers.forEach((timerId) => window.clearTimeout(timerId))
        }
    }, [lockToRequestedConversation, location.key])

    useEffect(() => {
        if (loading || !isAuthenticated) return

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

                if (safeList.length === 0) {
                    setActiveConversationId(null)
                    return
                }

                const hasRequested = requestedConversationId
                    && safeList.some((item) => Number(item?.id) === requestedConversationId)

                if (lockToRequestedConversation && requestedConversationId) {
                    setActiveConversationId((prev) => {
                        if (hasRequested) return requestedConversationId
                        if (prev && safeList.some((item) => Number(item?.id) === Number(prev))) {
                            return prev
                        }
                        return null
                    })
                    if (!hasRequested) {
                        setError('Không tìm thấy cuộc trò chuyện của xe này.')
                    }
                    return
                }

                setActiveConversationId((prev) => {
                    if (hasRequested) return requestedConversationId
                    if (prev && safeList.some((item) => Number(item?.id) === Number(prev))) {
                        return prev
                    }
                    return Number(safeList[0]?.id) || null
                })
            } catch (err) {
                if (!mounted) return
                setError(err?.message || 'Không thể tải danh sách hội thoại.')
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
    }, [isAuthenticated, loading, requestedConversationId, lockToRequestedConversation])

    useEffect(() => {
        if (!activeConversationId) {
            setMessages([])
            return
        }

        let mounted = true

        const loadMessages = async (showLoading = false) => {
            if (showLoading) {
                setLoadingMessages(true)
            }
            try {
                const list = await getConversationMessages(activeConversationId)
                if (!mounted) return
                setMessages(Array.isArray(list) ? list : [])
                setError('')
            } catch (err) {
                if (!mounted) return
                setError(err?.message || 'Không thể tải tin nhắn.')
            } finally {
                if (mounted && showLoading) {
                    setLoadingMessages(false)
                }
            }
        }

        loadMessages(true)
        const timer = window.setInterval(() => {
            loadMessages(false)
        }, 5000)

        return () => {
            mounted = false
            window.clearInterval(timer)
        }
    }, [activeConversationId])

    const activeConversation = visibleConversations.find((item) => Number(item?.id) === Number(activeConversationId)) || null

    const handleSendMessage = async () => {
        const content = draft.trim()
        if (!content || !activeConversationId || sending) return

        setSending(true)
        try {
            const sent = await sendMessage(activeConversationId, content)
            setMessages((prev) => [...prev, sent])
            setConversations((prev) => prev.map((item) => (
                Number(item?.id) === Number(activeConversationId)
                    ? { ...item, lastMessage: content }
                    : item
            )))
            setDraft('')
        } catch (err) {
            setError(err?.message || 'Không thể gửi tin nhắn.')
        } finally {
            setSending(false)
        }
    }

    const myUserId = Number(user?.userId || user?.id)

    return (
        <section className="chat-page">
            <div className="chat-page-shell">
                <aside className="chat-sidebar">
                    <h2>Cuộc trò chuyện</h2>
                    {loadingConversations ? (
                        <p>Đang tải...</p>
                    ) : visibleConversations.length === 0 ? (
                        <p>Chưa có cuộc trò chuyện nào.</p>
                    ) : (
                        <div className="chat-conversation-list">
                            {visibleConversations.map((item) => {
                                const isActive = Number(item?.id) === Number(activeConversationId)
                                return (
                                    <button
                                        key={item?.id}
                                        type="button"
                                        className={`chat-conversation-item ${isActive ? 'active' : ''}`}
                                        onClick={() => setActiveConversationId(Number(item?.id) || null)}
                                    >
                                        <strong>{item?.otherUserName || 'Chủ xe'}</strong>
                                        <span>{item?.vehicleName || 'Xe'}</span>
                                        <small>{item?.lastMessage || 'Chưa có tin nhắn'}</small>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </aside>

                <div className="chat-main">
                    {activeConversation ? (
                        <>
                            <header className="chat-main-header">
                                <h3>{activeConversation?.otherUserName || 'Chủ xe'}</h3>
                                <p>{activeConversation?.vehicleName || ''}</p>
                            </header>

                            <div className="chat-message-list">
                                {loadingMessages ? (
                                    <p>Đang tải tin nhắn...</p>
                                ) : messages.length === 0 ? (
                                    <p>Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.</p>
                                ) : (
                                    messages.map((message) => {
                                        const mine = Number(message?.senderId) === myUserId
                                        return (
                                            <div key={message?.id} className={`chat-message-row ${mine ? 'mine' : ''}`}>
                                                <div className="chat-message-bubble">
                                                    <p>{message?.content || ''}</p>
                                                    <small>{formatTime(message?.createdAt)}</small>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>

                            <div className="chat-send-box">
                                <input
                                    type="text"
                                    value={draft}
                                    placeholder="Nhập tin nhắn..."
                                    onChange={(event) => setDraft(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault()
                                            handleSendMessage()
                                        }
                                    }}
                                />
                                <button type="button" onClick={handleSendMessage} disabled={sending || !draft.trim()}>
                                    {sending ? 'Đang gửi...' : 'Gửi'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="chat-empty">
                            <p>Chọn một cuộc trò chuyện để bắt đầu.</p>
                        </div>
                    )}
                </div>
            </div>

            {error && <p className="chat-error">{error}</p>}
        </section>
    )
}
