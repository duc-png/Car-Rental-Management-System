import { Car, CheckCircle2, KeyRound, Wrench } from 'lucide-react'

function FleetOverview({ stats, availabilityRate }) {
    return (
        <div className="fleet-overview">
            <div className="overview-card">
                <div className="overview-card-top">
                    <span className="overview-icon" aria-hidden="true">
                        <Car size={20} strokeWidth={2.2} />
                    </span>
                    <p>Tổng số xe</p>
                </div>
                <div className="overview-value-row">
                    <h3>{stats.total}</h3>
                </div>
            </div>
            <div className="overview-card">
                <div className="overview-card-top">
                    <span className="overview-icon" aria-hidden="true">
                        <CheckCircle2 size={20} strokeWidth={2.2} />
                    </span>
                    <p>Sẵn sàng</p>
                </div>
                <div className="overview-value-row">
                    <h3>{stats.available}</h3>
                    <span className="overview-note">{availabilityRate}% hiệu suất</span>
                </div>
            </div>
            <div className="overview-card">
                <div className="overview-card-top">
                    <span className="overview-icon" aria-hidden="true">
                        <KeyRound size={20} strokeWidth={2.2} />
                    </span>
                    <p>Đang thuê</p>
                </div>
                <div className="overview-value-row">
                    <h3>{stats.rented}</h3>
                    <span className="overview-note">Hoạt động</span>
                </div>
            </div>
            <div className="overview-card">
                <div className="overview-card-top">
                    <span className="overview-icon" aria-hidden="true">
                        <Wrench size={20} strokeWidth={2.2} />
                    </span>
                    <p>Bảo dưỡng</p>
                </div>
                <div className="overview-value-row">
                    <h3>{stats.maintenance}</h3>
                    <span className="overview-note">Tất cả ổn định</span>
                </div>
            </div>
        </div>
    )
}

export default FleetOverview
