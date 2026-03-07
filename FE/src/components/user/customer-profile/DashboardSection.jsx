import { CalendarDays, CreditCard, Heart, MoreVertical } from 'lucide-react'
import { formatVndCurrency, getBookingStatusLabel } from '../../../utils/bookingUtils'

export default function DashboardSection({
    fullName,
    memberSinceYear,
    currentTrips,
    favoriteCars,
    spendingTotal,
    highlightedTrip,
    recentTrips,
    onOpenTrips,
    formatDateTime,
    statusClassName
}) {
    return (
        <div className="customer-dashboard-wrap">
            <div className="dashboard-hero-card">
                <div>
                    <h3>Chào mừng trở lại, {fullName || 'bạn'}!</h3>
                    <p>Khám phá xe mới, quản lý lịch thuê và theo dõi hành trình của bạn ngay tại đây.</p>
                </div>
                <span>MEMBER SINCE {memberSinceYear}</span>
            </div>

            <div className="dashboard-stat-grid">
                <article className="dashboard-stat-card">
                    <span className="stat-icon-wrap blue"><CalendarDays size={20} strokeWidth={2.2} /></span>
                    <div className="dashboard-stat-content">
                        <span>Chuyến đi sắp tới</span>
                        <b>{currentTrips.length}</b>
                    </div>
                </article>
                <article className="dashboard-stat-card">
                    <span className="stat-icon-wrap pink"><Heart size={20} strokeWidth={2.2} /></span>
                    <div className="dashboard-stat-content">
                        <span>Xe yêu thích</span>
                        <b>{favoriteCars.length}</b>
                    </div>
                </article>
                <article className="dashboard-stat-card">
                    <span className="stat-icon-wrap amber"><CreditCard size={20} strokeWidth={2.2} /></span>
                    <div className="dashboard-stat-content">
                        <span>Tổng chi tiêu</span>
                        <b>{formatVndCurrency(spendingTotal)}</b>
                    </div>
                </article>
            </div>

            <div className="dashboard-main-grid">
                <article className="dashboard-current-trip-card">
                    <h4><span className="cp-dot cp-dot-amber" />{currentTrips.length > 0 ? 'Chuyến đi hiện tại' : 'Chuyến đi gần nhất'}</h4>
                    {highlightedTrip ? (
                        <>
                            {currentTrips.length > 0 ? <span className="dashboard-live-chip">Đang sử dụng</span> : null}
                            <img
                                src={highlightedTrip.vehicleImage || highlightedTrip.imageUrl || '/placeholder.svg'}
                                alt={highlightedTrip.vehicleName || 'Trip'}
                            />
                            <strong>{highlightedTrip.vehicleName || `Xe #${highlightedTrip.vehicleId}`}</strong>
                            <p>{formatDateTime(highlightedTrip.startDate)} - {formatDateTime(highlightedTrip.endDate)}</p>
                            <div className="dashboard-current-trip-footer">
                                <span className={`cp-status-pill ${statusClassName(highlightedTrip.status)}`}>
                                    {getBookingStatusLabel(highlightedTrip.status)}
                                </span>
                                <b>{formatVndCurrency(highlightedTrip.totalPrice)}</b>
                            </div>
                            <button type="button" className="dashboard-trip-btn" onClick={onOpenTrips}>
                                Xem chi tiết
                            </button>
                        </>
                    ) : (
                        <p>Bạn chưa có dữ liệu chuyến đi.</p>
                    )}
                </article>

                <article className="dashboard-activity-card">
                    <div className="dashboard-activity-head">
                        <h4><span className="cp-dot cp-dot-slate" />Hoạt động gần đây</h4>
                        <button type="button" onClick={onOpenTrips}>Xem tất cả</button>
                    </div>

                    <div className="dashboard-activity-table">
                        <div className="dashboard-activity-row dashboard-head">
                            <span>Dòng xe</span>
                            <span>Ngày thuê</span>
                            <span>Giá trị</span>
                            <span>Trạng thái</span>
                            <span />
                        </div>

                        {recentTrips.length === 0 ? <p className="dashboard-empty">Chưa có hoạt động nào.</p> : null}
                        {recentTrips.map((booking) => (
                            <div className="dashboard-activity-row" key={booking.id}>
                                <div className="dashboard-car-cell">
                                    <img
                                        src={booking.vehicleImage || booking.imageUrl || '/placeholder.svg'}
                                        alt={booking.vehicleName || 'Vehicle'}
                                    />
                                    <strong>{booking.vehicleName || `Xe #${booking.vehicleId}`}</strong>
                                </div>
                                <span>{formatDateTime(booking.startDate)}</span>
                                <b>{formatVndCurrency(booking.totalPrice)}</b>
                                <em className={`cp-status-pill ${statusClassName(booking.status)}`}>
                                    {getBookingStatusLabel(booking.status)}
                                </em>
                                <MoreVertical size={14} />
                            </div>
                        ))}
                    </div>
                </article>
            </div>
        </div>
    )
}
