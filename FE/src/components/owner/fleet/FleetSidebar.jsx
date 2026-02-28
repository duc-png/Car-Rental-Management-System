import { Link } from 'react-router-dom'
import { Car, ChartSpline, LayoutGrid, LogOut, ReceiptText, Settings, UsersRound } from 'lucide-react'
import '../../../styles/FleetSidebar.css'

function FleetSidebar({ user, onLogout }) {
    return (
        <aside className="fleet-sidebar">
            <Link to="/" className="fleet-brand">
                <div className="brand-icon">
                    <img src="/favicon.svg" alt="Hệ thống CarRental" />
                </div>
                <div>
                    <h3>Vehicle Rental</h3>
                    <p>MANAGEMENT</p>
                </div>
            </Link>

            <div className="fleet-nav">
                <p className="nav-section">Điều hướng</p>
                <button type="button" className="nav-item">
                    <span className="nav-item-icon" aria-hidden="true">
                        <LayoutGrid size={20} strokeWidth={2.2} />
                    </span>
                    <span>Tổng quan</span>
                </button>
                <button type="button" className="nav-item active">
                    <span className="nav-item-icon" aria-hidden="true">
                        <Car size={20} strokeWidth={2.2} />
                    </span>
                    <span>Xe của tôi</span>
                </button>
                <button type="button" className="nav-item">
                    <span className="nav-item-icon" aria-hidden="true">
                        <ReceiptText size={20} strokeWidth={2.2} />
                    </span>
                    <span>Đơn thuê</span>
                </button>
                <button type="button" className="nav-item">
                    <span className="nav-item-icon" aria-hidden="true">
                        <UsersRound size={20} strokeWidth={2.2} />
                    </span>
                    <span>Khách hàng</span>
                </button>
                <button type="button" className="nav-item">
                    <span className="nav-item-icon" aria-hidden="true">
                        <ChartSpline size={20} strokeWidth={2.2} />
                    </span>
                    <span>Thống kê</span>
                </button>
            </div>

            <div className="fleet-system">
                <p className="nav-section">Hệ thống</p>
                <button type="button" className="nav-item">
                    <span className="nav-item-icon" aria-hidden="true">
                        <Settings size={20} strokeWidth={2.2} />
                    </span>
                    <span>Cài đặt</span>
                </button>
            </div>

            <div className="fleet-sidebar-bottom">
                <div className="fleet-user">
                    <div className="user-avatar">{(user?.fullName || 'CO').slice(0, 2).toUpperCase()}</div>
                    <div className="user-info">
                        <p className="user-name">{user?.fullName || 'Chủ xe Luxury'}</p>
                        <p className="user-email">{user?.email || 'owner@luxury.com'}</p>
                    </div>
                </div>

                <button type="button" className="fleet-logout-btn" onClick={onLogout}>
                    <span className="fleet-logout-icon" aria-hidden="true">
                        <LogOut size={16} strokeWidth={2.2} />
                    </span>
                    <span>Đăng xuất</span>
                </button>
            </div>
        </aside>
    )
}

export default FleetSidebar
