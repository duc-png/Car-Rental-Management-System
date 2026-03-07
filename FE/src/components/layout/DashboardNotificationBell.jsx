import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
    getMyNotifications,
    getUnreadNotificationCount,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from '../../api/notifications'
import '../../styles/DashboardNotificationBell.css'

export default function DashboardNotificationBell({ className = '' }) {
    const navigate = useNavigate()
    const wrapperRef = useRef(null)
    const [unreadCount, setUnreadCount] = useState(0)
    const [open, setOpen] = useState(false)
    const [loadingList, setLoadingList] = useState(false)
    const [markingAll, setMarkingAll] = useState(false)
    const [notifications, setNotifications] = useState([])

    useEffect(() => {
        let isMounted = true

        const load = async () => {
            try {
                const count = await getUnreadNotificationCount()
                if (isMounted) {
                    setUnreadCount(Number.isFinite(count) ? count : 0)
                }
            } catch {
                if (isMounted) {
                    setUnreadCount(0)
                }
            }
        }

        load()
        const timer = window.setInterval(load, 5000) // set time refresh every 5 seconds notification 

        return () => {
            isMounted = false
            window.clearInterval(timer)
        }
    }, [])

    useEffect(() => {
        const onClickOutside = (event) => {
            if (!wrapperRef.current) return
            if (!wrapperRef.current.contains(event.target)) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', onClickOutside)
        return () => {
            document.removeEventListener('mousedown', onClickOutside)
        }
    }, [])

    const loadNotifications = async () => {
        setLoadingList(true)
        try {
            const list = await getMyNotifications({ limit: 20 })
            setNotifications(Array.isArray(list) ? list : [])
        } catch {
            setNotifications([])
        } finally {
            setLoadingList(false)
        }
    }

    const handleToggle = async () => {
        const nextOpen = !open
        setOpen(nextOpen)
        if (nextOpen) {
            await loadNotifications()
        }
    }

    const handleOpenNotification = async (item) => {
        if (!item) return

        if (!item.isRead && item.id) {
            try {
                await markNotificationAsRead(item.id)
                setNotifications((prev) =>
                    prev.map((notification) =>
                        notification.id === item.id ? { ...notification, isRead: true } : notification
                    )
                )
                setUnreadCount((prev) => Math.max(0, prev - 1))
            } catch (error) {
                console.error('Không thể đánh dấu thông báo đã đọc:', error)
            }
        }

        if (item.deepLink) {
            navigate(item.deepLink)
            setOpen(false)
        }
    }

    const handleMarkAllRead = async () => {
        if (markingAll || unreadCount === 0) return

        setMarkingAll(true)
        try {
            await markAllNotificationsAsRead()
            setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error('Không thể đánh dấu tất cả thông báo đã đọc:', error)
        } finally {
            setMarkingAll(false)
        }
    }

    const formatCreatedAt = (value) => {
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

    const classes = ['dashboard-notification-btn', className].filter(Boolean).join(' ')
    const hasNotifications = notifications.length > 0

    const titleText = useMemo(() => {
        if (unreadCount <= 0) return 'Thông báo'
        return `Thông báo (${unreadCount} chưa đọc)`
    }, [unreadCount])

    return (
        <div className="dashboard-notification" ref={wrapperRef}>
            <button
                type="button"
                className={classes}
                aria-label={titleText}
                aria-expanded={open}
                onClick={handleToggle}
            >
                <Bell size={18} strokeWidth={2.2} aria-hidden="true" />
                {unreadCount > 0 && (
                    <span className="dashboard-notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {open && (
                <div className="dashboard-notification-popover" role="dialog" aria-label="Danh sách thông báo">
                    <div className="dashboard-notification-popover-head">
                        <strong>Thông báo</strong>
                        <button
                            type="button"
                            onClick={handleMarkAllRead}
                            disabled={markingAll || unreadCount === 0}
                        >
                            {markingAll ? 'Đang xử lý...' : 'Đánh dấu đã đọc'}
                        </button>
                    </div>

                    {loadingList ? (
                        <p className="dashboard-notification-empty">Đang tải...</p>
                    ) : !hasNotifications ? (
                        <p className="dashboard-notification-empty">Chưa có thông báo nào.</p>
                    ) : (
                        <div className="dashboard-notification-list">
                            {notifications.map((item) => (
                                <button
                                    key={item.id || `${item.title}-${item.createdAt}`}
                                    type="button"
                                    className={`dashboard-notification-item ${item.isRead ? '' : 'is-unread'}`}
                                    onClick={() => handleOpenNotification(item)}
                                >
                                    <div className="dashboard-notification-item-title-row">
                                        <span className="dashboard-notification-item-title">{item.title || 'Thông báo'}</span>
                                        {!item.isRead && <span className="dashboard-notification-dot" aria-hidden="true" />}
                                    </div>
                                    {item.message && (
                                        <p className="dashboard-notification-item-message">{item.message}</p>
                                    )}
                                    <small className="dashboard-notification-item-time">
                                        {formatCreatedAt(item.createdAt)}
                                    </small>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

