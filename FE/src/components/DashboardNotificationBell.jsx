import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { getUnreadNotificationCount } from '../api/notifications'
import '../styles/DashboardNotificationBell.css'

export default function DashboardNotificationBell({ className = '' }) {
    const [unreadCount, setUnreadCount] = useState(0)

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
        const timer = window.setInterval(load, 30000)

        return () => {
            isMounted = false
            window.clearInterval(timer)
        }
    }, [])

    const classes = ['dashboard-notification-btn', className].filter(Boolean).join(' ')

    return (
        <button type="button" className={classes} aria-label="Thông báo">
            <Bell size={18} strokeWidth={2.2} aria-hidden="true" />
            {unreadCount > 0 && (
                <span className="dashboard-notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
        </button>
    )
}
