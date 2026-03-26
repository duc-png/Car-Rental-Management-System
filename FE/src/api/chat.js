import { get, onValue, push, query, ref, set, update, orderByChild } from 'firebase/database'
import { database } from '../../firebase'

const API_BASE_URL = import.meta.env.VITE_API_V1_URL || 'http://localhost:8080/api/v1';

const conversationCache = new Map()

const getAuthToken = () => localStorage.getItem('token');

const authFetch = async (url, options = {}) => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('Chua dang nhap!');
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers
        }
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
};

const decodeTokenPayload = (token) => {
    try {
        const base64Payload = token.split('.')[1];
        if (!base64Payload) return null;
        const normalized = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(decodeURIComponent(
            atob(normalized)
                .split('')
                .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
                .join('')
        ));
        return decoded;
    } catch {
        return null;
    }
}

const getCurrentUserIdFromToken = () => {
    const token = getAuthToken()
    if (!token) return null
    const payload = decodeTokenPayload(token)
    const userId = Number(payload?.userId)
    return Number.isFinite(userId) ? userId : null
}

const normalizeMessages = (snapshot) => {
    const raw = snapshot?.val()
    if (!raw) return []
    return Object.entries(raw)
        .map(([id, value]) => ({
            id,
            senderId: Number(value?.senderId) || null,
            content: String(value?.content || ''),
            createdAt: value?.createdAt || Date.now(),
            type: value?.type || 'text',
            readBy: value?.readBy || {},
        }))
        .sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0))
}

const mergeConversationWithFirebase = (conversation, firebaseMap) => {
    const key = String(conversation.id)
    const meta = firebaseMap[key]
    if (!meta) return conversation
    return {
        ...conversation,
        lastMessage: meta.lastMessage || conversation.lastMessage,
        lastMessageAt: meta.lastMessageAt || conversation.lastMessageAt,
        updatedAt: meta.updatedAt || conversation.updatedAt,
    }
}

const upsertConversationMeta = async (conversation) => {
    if (!conversation?.id) return
    const now = Date.now()
    const id = String(conversation.id)
    const payload = {
        bookingId: conversation.bookingId || null,
        vehicleId: conversation.vehicleId || null,
        customerId: conversation.customerId || null,
        ownerId: conversation.ownerId || null,
        participants: {
            ...(conversation.customerId ? { [String(conversation.customerId)]: true } : {}),
            ...(conversation.ownerId ? { [String(conversation.ownerId)]: true } : {}),
        },
        createdAt: now,
        updatedAt: now,
    }
    await update(ref(database, `conversations/${id}`), payload)
    if (conversation.customerId) {
        await set(ref(database, `userConversations/${conversation.customerId}/${id}`), true)
    }
    if (conversation.ownerId) {
        await set(ref(database, `userConversations/${conversation.ownerId}/${id}`), true)
    }
}

export const startConversationByVehicle = async (vehicleId) => {
    const data = await authFetch(`${API_BASE_URL}/chats/conversations/by-vehicle`, {
        method: 'POST',
        body: JSON.stringify({ vehicleId })
    });
    const conversation = data.result
    if (conversation?.id) {
        conversationCache.set(Number(conversation.id), conversation)
        await upsertConversationMeta(conversation).catch(() => {})
    }
    return conversation;
};

export const getMyConversations = async () => {
    const data = await authFetch(`${API_BASE_URL}/chats/conversations`);
    const backendList = data.result || [];
    backendList.forEach((conversation) => {
        if (conversation?.id) {
            conversationCache.set(Number(conversation.id), conversation)
        }
    })

    try {
        const firebaseSnapshot = await get(ref(database, 'conversations'))
        const firebaseMap = firebaseSnapshot.val() || {}
        return backendList.map((conversation) => mergeConversationWithFirebase(conversation, firebaseMap))
    } catch {
        return backendList
    }
};

export const getConversationMessages = async (conversationId) => {
    const id = String(conversationId)
    const messagesRef = query(ref(database, `messages/${id}`), orderByChild('createdAt'))
    const snapshot = await get(messagesRef)
    return normalizeMessages(snapshot)
};

export const subscribeConversationMessages = (conversationId, onData, onError) => {
    const id = String(conversationId)
    const messagesRef = query(ref(database, `messages/${id}`), orderByChild('createdAt'))
    return onValue(
        messagesRef,
        (snapshot) => {
            onData(normalizeMessages(snapshot))
        },
        (error) => {
            if (typeof onError === 'function') onError(error)
        }
    )
}

export const sendMessage = async (conversationId, content) => {
    const id = Number(conversationId)
    const text = String(content || '').trim()
    if (!id || !text) {
        throw new Error('Tin nhan khong hop le')
    }

    const senderId = getCurrentUserIdFromToken()
    if (!senderId) {
        throw new Error('Khong xac dinh duoc nguoi gui')
    }

    const now = Date.now()
    const messagePayload = {
        senderId,
        content: text,
        type: 'text',
        createdAt: now,
        readBy: {
            [String(senderId)]: true,
        },
    }

    const messageRef = push(ref(database, `messages/${id}`))
    await set(messageRef, messagePayload)

    const cached = conversationCache.get(id)
    const metaUpdate = {
        lastMessage: text,
        lastMessageAt: now,
        lastSenderId: senderId,
        updatedAt: now,
    }
    if (cached?.bookingId && cached?.vehicleId) {
        metaUpdate.bookingId = cached.bookingId
        metaUpdate.vehicleId = cached.vehicleId
    }
    if (cached?.customerId) {
        metaUpdate.customerId = cached.customerId
    }
    if (cached?.ownerId) {
        metaUpdate.ownerId = cached.ownerId
    }
    if (cached?.customerId || cached?.ownerId) {
        metaUpdate.participants = {
            ...(cached?.customerId ? { [String(cached.customerId)]: true } : {}),
            ...(cached?.ownerId ? { [String(cached.ownerId)]: true } : {}),
        }
    }

    await update(ref(database, `conversations/${id}`), metaUpdate)

    if (cached?.customerId) {
        await set(ref(database, `userConversations/${cached.customerId}/${id}`), true)
    }
    if (cached?.ownerId) {
        await set(ref(database, `userConversations/${cached.ownerId}/${id}`), true)
    }

    return {
        id: messageRef.key,
        ...messagePayload,
    };
};
