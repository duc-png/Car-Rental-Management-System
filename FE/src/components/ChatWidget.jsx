import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getConversationMessages, getMyConversations, sendMessage } from '../api/chat';
import { useAuth } from '../hooks/useAuth';
import '../styles/ChatWidget.css';

const CONVERSATION_POLL_MS = 8000;
const MESSAGE_POLL_MS = 3000;

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const getInitial = (name) => String(name || 'U').trim().charAt(0).toUpperCase();

const sameConversationList = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  return a.every((item, index) => {
    const other = b[index];
    return other
      && String(item.id) === String(other.id)
      && String(item.lastMessageAt || '') === String(other.lastMessageAt || '')
      && Number(item.unreadCount || 0) === Number(other.unreadCount || 0);
  });
};

const sameMessageList = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  return a.every((item, index) => {
    const other = b[index];
    return other
      && String(item.id) === String(other.id)
      && String(item.content || '') === String(other.content || '')
      && String(item.createdAt || '') === String(other.createdAt || '');
  });
};

function ChatWidget() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const endRef = useRef(null);

  const hideWidget = !isAuthenticated
    || location.pathname.startsWith('/admin')
    || location.pathname === '/messages';

  const activeConversation = useMemo(
    () => conversations.find((item) => String(item.id) === String(activeConversationId)) || null,
    [conversations, activeConversationId]
  );

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, item) => sum + Number(item.unreadCount || 0), 0),
    [conversations]
  );

  useEffect(() => {
    if (!isOpen || !endRef.current) return;
    endRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (hideWidget) return undefined;

    let mounted = true;

    const loadConversations = async () => {
      try {
        if (mounted && conversations.length === 0) setLoadingConversations(true);
        const data = await getMyConversations();
        if (!mounted) return;
        setConversations((prev) => (sameConversationList(prev, data) ? prev : data));

        if (activeConversationId && !data.some((item) => String(item.id) === String(activeConversationId))) {
          setActiveConversationId(data[0]?.id || null);
        }
      } catch (error) {
        console.error('ChatWidget conversations error:', error);
      } finally {
        if (mounted) setLoadingConversations(false);
      }
    };

    loadConversations();
    const id = window.setInterval(loadConversations, CONVERSATION_POLL_MS);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [hideWidget, activeConversationId]);

  useEffect(() => {
    if (hideWidget || !isOpen || !activeConversationId) return undefined;

    let mounted = true;

    const loadMessages = async (silent = false) => {
      try {
        if (mounted && !silent && messages.length === 0) setLoadingMessages(true);
        const data = await getConversationMessages(activeConversationId);
        if (mounted) {
          setMessages((prev) => (sameMessageList(prev, data) ? prev : data));
        }
      } catch (error) {
        console.error('ChatWidget messages error:', error);
      } finally {
        if (mounted && !silent) setLoadingMessages(false);
      }
    };

    loadMessages(false);
    const id = window.setInterval(() => loadMessages(true), MESSAGE_POLL_MS);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [hideWidget, isOpen, activeConversationId]);

  const handleOpenConversation = async (conversationId) => {
    setActiveConversationId(conversationId);
    try {
      setLoadingMessages(true);
      const data = await getConversationMessages(conversationId);
      setMessages((prev) => (sameMessageList(prev, data) ? prev : data));
    } catch (error) {
      console.error('ChatWidget open conversation error:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async () => {
    const content = messageInput.trim();
    if (!content || !activeConversationId) return;

    try {
      setSending(true);
      await sendMessage(activeConversationId, content);
      setMessageInput('');
      const data = await getConversationMessages(activeConversationId);
      setMessages(data);
    } catch (error) {
      console.error('ChatWidget send message error:', error);
    } finally {
      setSending(false);
    }
  };

  if (hideWidget) return null;

  return (
    <div className="chat-widget">
      {isOpen && (
        <div className="chat-widget-panel">
          <div className="chat-widget-header">
            <div>
              <h3>Tin nhan</h3>
              {!activeConversation && <small>{loadingConversations ? 'Dang tai...' : `${conversations.length} hoi thoai`}</small>}
              {activeConversation && <small>{activeConversation.otherUserName || 'Nguoi dung'}</small>}
            </div>
            <div className="chat-widget-header-actions">
              <Link to="/messages">Mo rong</Link>
              <button type="button" onClick={() => setIsOpen(false)}>x</button>
            </div>
          </div>

          {!activeConversation ? (
            <div className="chat-widget-conversation-list">
              {conversations.length === 0 && <p className="chat-widget-empty">Chua co hoi thoai nao.</p>}
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  className="chat-widget-conversation-item"
                  onClick={() => handleOpenConversation(conversation.id)}
                >
                  <span className="chat-widget-avatar">{getInitial(conversation.otherUserName)}</span>
                  <span className="chat-widget-conversation-content">
                    <strong>{conversation.otherUserName || 'Nguoi dung'}</strong>
                    <small>{conversation.lastMessage || 'Bat dau tro chuyen'}</small>
                  </span>
                  {Number(conversation.unreadCount || 0) > 0 && (
                    <span className="chat-widget-unread">{conversation.unreadCount}</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="chat-widget-chat">
              <div className="chat-widget-chat-top">
                <button type="button" onClick={() => setActiveConversationId(null)}>←</button>
                <div>
                  <strong>{activeConversation.otherUserName || 'Nguoi dung'}</strong>
                  <small>{activeConversation.vehicleName || 'Xe'}</small>
                </div>
              </div>

              <div className="chat-widget-message-list">
                {loadingMessages && <p className="chat-widget-empty">Dang tai tin nhan...</p>}
                {!loadingMessages && messages.length === 0 && (
                  <p className="chat-widget-empty">Chua co tin nhan nao.</p>
                )}
                {messages.map((message) => {
                  const mine = String(message.senderId) === String(user?.userId);
                  return (
                    <div key={message.id} className={`chat-widget-message ${mine ? 'mine' : 'theirs'}`}>
                      <p>{message.content}</p>
                      <small>{formatTime(message.createdAt)}</small>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <div className="chat-widget-input">
                <input
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  placeholder="Nhap tin nhan..."
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSend();
                    }
                  }}
                />
                <button type="button" disabled={sending || !messageInput.trim()} onClick={handleSend}>
                  {sending ? '...' : 'Gui'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        className="chat-widget-fab"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open chat"
      >
        Chat
        {unreadTotal > 0 && <span className="chat-widget-fab-badge">{unreadTotal}</span>}
      </button>
    </div>
  );
}

export default ChatWidget;
