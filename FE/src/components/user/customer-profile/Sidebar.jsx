import { CarFront, Heart, KeyRound, LayoutDashboard, LogOut, UserRound } from 'lucide-react'
import { MENU } from '../../../utils/customerProfile/constants'

const MENU_ITEMS = [
    { key: MENU.DASHBOARD, label: 'Bảng điều khiển', icon: LayoutDashboard },
    { key: MENU.ACCOUNT, label: 'Tài khoản của tôi', icon: UserRound },
    { key: MENU.FAVORITES, label: 'Xe yêu thích', icon: Heart },
    { key: MENU.TRIPS, label: 'Chuyến đi của tôi', icon: CarFront },
    { key: MENU.PASSWORD, label: 'Đổi mật khẩu', icon: KeyRound }
]

export default function Sidebar({
    previewAvatar,
    fullName,
    email,
    activeMenu,
    onMenuChange,
    onLogout
}) {
    return (
        <aside className="customer-sidebar">
            <h2>Xin chào bạn!</h2>
            <div className="customer-sidebar-profile">
                <div className="customer-sidebar-avatar">
                    {previewAvatar
                        ? <img src={previewAvatar} alt={fullName || 'Avatar'} />
                        : (fullName || 'U').charAt(0).toUpperCase()}
                </div>
                <strong>{fullName || 'Người dùng'}</strong>
                <span>{email || 'Chưa cập nhật email'}</span>
            </div>

            <div className="customer-side-list">
                {MENU_ITEMS.map((item) => {
                    const Icon = item.icon

                    return (
                        <button
                            key={item.key}
                            type="button"
                            className={`customer-side-item ${activeMenu === item.key ? 'active' : ''}`}
                            onClick={() => onMenuChange(item.key)}
                        >
                            <Icon size={16} strokeWidth={2.2} />
                            <span>{item.label}</span>
                        </button>
                    )
                })}
            </div>

            <button type="button" className="customer-side-item logout" onClick={onLogout}>
                <LogOut size={16} strokeWidth={2.2} />
                Đăng xuất
            </button>
        </aside>
    )
}
