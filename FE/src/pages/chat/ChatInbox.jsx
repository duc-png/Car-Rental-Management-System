import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getConversationMessages, getMyConversations, sendMessage } from '../../api/chat';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/ChatInbox.css';

const POLL_CONVERSATIONS_MS = 5000;
const POLL_MESSAGES_MS = 2500;

const formatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const getInitial = (name) => String(name || 'U').trim().charAt(0).toUpperCase();

export default function ChatInbox() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();

    const [conversations, setConversations] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);

    const selectedConversation = useMemo(
        () => conversations.find((item) => String(item.id) === String(selectedConversationId)) || null,
        [conversations, selectedConversationId]
    );

    useEffect(() => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để sử dụng chat');
            navigate('/login');
        }
    }, [navigate, user]);

    useEffect(() => {
        if (!user) return;

        let mounted = true;

        const loadConversations = async () => {
            try {
                const data = await getMyConversations();
                if (!mounted) return;
                setConversations(data);

                const fromQuery = searchParams.get('conversationId');
                if (fromQuery && data.some((item) => String(item.id) === String(fromQuery))) {
                    setSelectedConversationId(fromQuery);
                    return;
                }

                setSelectedConversationId((current) => {
                    if (current && data.some((item) => String(item.id) === String(current))) {
                        return current;
                    }
                    return data[0]?.id || null;
                });
            } catch (error) {
                if (mounted) {
                    toast.error(error.message || 'Không thể tải danh sách hội thoại');
                }
            } finally {
                if (mounted) {
                    setLoadingConversations(false);
                }
            }
        };

        loadConversations();
        const intervalId = window.setInterval(loadConversations, POLL_CONVERSATIONS_MS);
        return () => {
            mounted = false;
            window.clearInterval(intervalId);
        };
    }, [searchParams, user]);

    useEffect(() => {
        if (!selectedConversationId) {
            setMessages([]);
            return;
        }

        let mounted = true;

        const loadMessages = async () => {
            try {
                setLoadingMessages(true);
                const data = await getConversationMessages(selectedConversationId);
                if (mounted) {
                    setMessages(data);
                }
            } catch (error) {
                if (mounted) {
                    toast.error(error.message || 'Không thể tải tin nhắn');
                }
            } finally {
                if (mounted) {
                    setLoadingMessages(false);
                }
            }
        };

        loadMessages();
        const intervalId = window.setInterval(loadMessages, POLL_MESSAGES_MS);
        return () => {
            mounted = false;
            window.clearInterval(intervalId);
        };
    }, [selectedConversationId]);

    const handleSend = async () => {
        const content = messageInput.trim();
        if (!content || !selectedConversationId) return;

        try {
            setSending(true);
            await sendMessage(selectedConversationId, content);
            setMessageInput('');
            const data = await getConversationMessages(selectedConversationId);
            setMessages(data);
        } catch (error) {
            toast.error(error.message || 'Không gửi được tin nhắn');
        } finally {
            setSending(false);
        }
    };

    if (loadingConversations) {
        return <div className="chat-loading">Đang tải hội thoại...</div>;
    }

    return (
        <div className="chat-page-wrap">
            <div className="chat-page">
                <aside className="chat-conversation-list">
                    <h2>Tin nhắn</h2>
                    {conversations.length === 0 ? (
                        <p className="chat-empty-text">Chưa có hội thoại nào.</p>
                    ) : (
                        conversations.map((conversation) => (
                            <button
                                key={conversation.id}
                                type="button"
                                className={`chat-conversation-item ${String(conversation.id) === String(selectedConversationId) ? 'active' : ''}`}
                                onClick={() => setSelectedConversationId(conversation.id)}
                            >
                                <div className="chat-conversation-user">{getInitial(conversation.otherUserName)}</div>
                                <div className="chat-conversation-content">
                                    <div className="chat-conversation-head">
                                        <strong>{conversation.otherUserName || 'Người dùng'}</strong>
                                        {Number(conversation.unreadCount || 0) > 0 && (
                                            <span className="chat-unread">{conversation.unreadCount}</span>
                                        )}
                                    </div>
                                    <p>{conversation.lastMessage || 'Bắt đầu cuộc trò chuyện'}</p>
                                    <small>
                                        {conversation.vehicleName || 'Xe'}
                                        {conversation.lastMessageAt ? ` • ${formatTime(conversation.lastMessageAt)}` : ''}
                                    </small>
                                </div>
                            </button>
                        ))
                    )}
                </aside>

                <section className="chat-message-panel">
                    {selectedConversation ? (
                        <>
                            <div className="chat-message-header">
                                <div className="chat-message-user">
                                    <div className="chat-message-avatar">{getInitial(selectedConversation.otherUserName)}</div>
                                    <div>
                                        <strong>{selectedConversation.otherUserName || 'Người dùng'}</strong>
                                        <p>{selectedConversation.vehicleName || 'Xe'}</p>
                                    </div>
                                </div>
                                {selectedConversation.vehicleId && (
                                    <Link to={`/car/${selectedConversation.vehicleId}`} className="chat-view-car-link">
                                        Xem xe
                                    </Link>
                                )}
                            </div>

                            <div className="chat-message-list">
                                {loadingMessages && <p className="chat-empty-text">Đang tải tin nhắn...</p>}
                                {!loadingMessages && messages.length === 0 && (
                                    <p className="chat-empty-text">Chưa có tin nhắn. Hãy bắt đầu ngay.</p>
                                )}
                                {messages.map((message) => {
                                    const isMine = String(message.senderId) === String(user?.userId);
                                    return (
                                        <div
                                            key={message.id}
                                            className={`chat-message-bubble ${isMine ? 'mine' : 'theirs'}`}
                                        >
                                            <p>{message.content}</p>
                                            <small>{formatTime(message.createdAt)}</small>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="chat-input-row">
                                <input
                                    value={messageInput}
                                    onChange={(event) => setMessageInput(event.target.value)}
                                    placeholder="Nhập tin nhắn..."
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            handleSend();
                                        }
                                    }}
                                />
                                <button type="button" onClick={handleSend} disabled={sending || !messageInput.trim()}>
                                    {sending ? 'Đang gửi...' : 'Gửi'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="chat-empty-panel">
                            <p>Chọn một hội thoại để bắt đầu chat.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
