import { Link } from 'react-router-dom'
import { BarChart4, CarFront, LayoutDashboard, UserCheck, Users } from 'lucide-react'
import DashboardNotificationBell from '../../components/layout/DashboardNotificationBell'
import '../../styles/AdminDashboard.css'

export default function AdminDashboard() {
    return (
        <section className="admin-dashboard-page">
            <header className="admin-dashboard-header">
                <div>
                    <h1>Tổng quan quản trị</h1>
                    <p>Chọn module ở thanh điều hướng trái hoặc từ các thẻ bên dưới.</p>
                </div>
                <DashboardNotificationBell />
            </header>

            <div className="admin-dashboard-modules-grid">
                <Link to="/admin/dashboard" className="admin-dashboard-module-card">
                    <div className="admin-dashboard-module-icon" aria-hidden="true">
                        <LayoutDashboard size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <h3>Tổng quan</h3>
                        <p>Xem nhanh thông tin hệ thống quản trị.</p>
                    </div>
                </Link>

                <Link to="/admin/vehicles" className="admin-dashboard-module-card">
                    <div className="admin-dashboard-module-icon" aria-hidden="true">
                        <CarFront size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <h3>Xe</h3>
                        <p>Quản lý danh sách và phê duyệt xe.</p>
                    </div>
                </Link>

                <Link to="/admin/owner-registrations" className="admin-dashboard-module-card">
                    <div className="admin-dashboard-module-icon" aria-hidden="true">
                        <UserCheck size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <h3>Đăng ký chủ xe</h3>
                        <p>Duyệt yêu cầu trở thành chủ xe.</p>
                    </div>
                </Link>

                <Link to="/admin/customers" className="admin-dashboard-module-card">
                    <div className="admin-dashboard-module-icon" aria-hidden="true">
                        <Users size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <h3>Khách hàng</h3>
                        <p>Quản lý thông tin và hồ sơ khách hàng.</p>
                    </div>
                </Link>

                <Link to="/admin/reports" className="admin-dashboard-module-card admin-dashboard-module-accent">
                    <div className="admin-dashboard-module-icon" aria-hidden="true">
                        <BarChart4 size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <h3>Báo cáo</h3>
                        <p>Xem báo cáo doanh thu và thống kê đặt xe.</p>
                    </div>
                </Link>
            </div>
        </section>
    )
}
