import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getConversationMessages, getMyConversations, sendMessage, subscribeConversationMessages } from '../../api/chat'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/CustomerChatWidget.css'

const formatTime = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function CustomerChatWidget() {
    const { user } = useAuth()
    const myUserId = Number(user?.userId || user?.id)
    const [open, setOpen] = useState(false)
    const [loadingConversations, setLoadingConversations] = useState(false)
    const [loadingMessages, setLoadingMessages] = useState(false)
    const [sending, setSending] = useState(false)
    const [conversations, setConversations] = useState([])
    const [activeConversationId, setActiveConversationId] = useState(null)
    const [messages, setMessages] = useState([])
    const [draft, setDraft] = useState('')
    const [error, setError] = useState('')

    const activeConversation = useMemo(
        () => conversations.find((item) => Number(item?.id) === Number(activeConversationId)) || null,
        [conversations, activeConversationId]
    )

    const loadConversations = useCallback(async (showLoading = false) => {
        if (showLoading) {
            setLoadingConversations(true)
        }
        try {
            const list = await getMyConversations()
            const safeList = Array.isArray(list) ? list : []
            setConversations(safeList)
            setActiveConversationId((prev) => {
                if (safeList.length === 0) return null
                if (prev && safeList.some((item) => Number(item?.id) === Number(prev))) {
                    return prev
                }
                return Number(safeList[0]?.id) || null
            })
            setError('')
        } catch (err) {
            setError(err?.message || 'Khong the tai hoi thoai')
        } finally {
            if (showLoading) {
                setLoadingConversations(false)
            }
        }
    }, [])

    useEffect(() => {
        if (!open) return
        let mounted = true
        const run = async () => {
            await loadConversations(true)
        }
        run()
        const timer = window.setInterval(() => {
            if (!mounted) return
            loadConversations(false)
        }, 8000)

        return () => {
            mounted = false
            window.clearInterval(timer)
        }
    }, [open, loadConversations])

    useEffect(() => {
        if (!open || !activeConversationId) {
            setMessages([])
            return
        }

        let mounted = true
        let unsubscribe = null
        const loadInitial = async () => {
            try {
                setLoadingMessages(true)
                const list = await getConversationMessages(activeConversationId)
                if (!mounted) return
                setMessages(Array.isArray(list) ? list : [])
                setError('')
            } catch (err) {
                if (!mounted) return
                setError(err?.message || 'Khong the tai tin nhan')
            } finally {
                if (mounted) setLoadingMessages(false)
            }
        }
        loadInitial()

        unsubscribe = subscribeConversationMessages(
            activeConversationId,
            (nextMessages) => {
                if (!mounted) return
                setMessages(Array.isArray(nextMessages) ? nextMessages : [])
            },
            () => {
                if (!mounted) return
                setError('Khong the dong bo tin nhan realtime')
            }
        )

        return () => {
            mounted = false
            if (typeof unsubscribe === 'function') unsubscribe()
        }
    }, [open, activeConversationId])

    const handleSendMessage = async () => {
        const content = draft.trim()
        if (!content || !activeConversationId || sending) return
        setSending(true)
        try {
            await sendMessage(activeConversationId, content)
            setDraft('')
        } catch (err) {
            setError(err?.message || 'Khong the gui tin nhan')
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="customer-chat-widget">
            {open && (
                <section className="cw-panel">
                    <header className="cw-header">
                        <div>
                            <h3>Chat ho tro</h3>
                            <p>{activeConversation?.otherUserName || 'Chu xe'}</p>
                        </div>
                        <button type="button" onClick={() => setOpen(false)}>x</button>
                    </header>

                    <div className="cw-conversations">
                        {loadingConversations ? (
                            <p>Dang tai hoi thoai...</p>
                        ) : conversations.length === 0 ? (
                            <p>Chua co hoi thoai nao.</p>
                        ) : (
                            <select
                                value={activeConversationId || ''}
                                onChange={(e) => setActiveConversationId(Number(e.target.value) || null)}
                            >
                                {conversations.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        #{item.id} - {item.otherUserName || 'Chu xe'} - {item.vehicleName || 'Xe'}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="cw-messages">
                        {loadingMessages ? (
                            <p>Dang tai tin nhan...</p>
                        ) : messages.length === 0 ? (
                            <p>Chua co tin nhan. Hay bat dau.</p>
                        ) : (
                            messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`cw-message-row ${Number(message.senderId) === myUserId ? 'mine' : 'other'}`}
                                >
                                    <div className="cw-message-meta">
                                        {Number(message.senderId) === myUserId ? 'Ban' : (activeConversation?.otherUserName || 'Chu xe')}
                                    </div>
                                    <div className="cw-message-bubble">
                                        <p>{message.content}</p>
                                        <small>{formatTime(message.createdAt)}</small>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="cw-input">
                        <input
                            type="text"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder="Nhap tin nhan..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleSendMessage()
                                }
                            }}
                        />
                        <button type="button" onClick={handleSendMessage} disabled={sending || !draft.trim()}>
                            {sending ? 'Dang gui...' : 'Gui'}
                        </button>
                    </div>

                    <footer className="cw-footer">
                        <Link to={activeConversationId ? `/chat?conversationId=${activeConversationId}` : '/chat'}>Mo trang chat day du</Link>
                    </footer>

                    {error && <p className="cw-error">{error}</p>}
                </section>
            )}

            <button type="button" className="cw-fab" onClick={() => setOpen((prev) => !prev)}>
                {open ? 'Dong chat' : 'Chat'}
            </button>
        </div>
    )
}

export default CustomerChatWidget
