import { Cog, Eye, Fuel, Pencil, Plus, ReceiptText, Trash2, Users } from 'lucide-react'
import {
    formatCarTypeLabel,
    formatEnumLabel,
    formatPrice,
    formatTransmissionShort,
    getVehicleThumbnailUrl,
    statusCssClass,
    vehicleDisplayName
} from '../../../utils/ownerFleetUtils'

export function FleetGridCard({ vehicle, onViewDetails, onEdit, onDelete }) {
    return (
        <article className="fleet-card">
            <div className="fleet-image">
                <img
                    src={getVehicleThumbnailUrl(vehicle) || '/favicon.svg'}
                    alt={vehicleDisplayName(vehicle)}
                />
                <span className={`status-badge ${statusCssClass(vehicle.status)}`}>
                    {formatEnumLabel(vehicle.status)}
                </span>
            </div>

            <div className="fleet-card-body fleet-card-body--grid">
                <div className="fleet-card-title-row">
                    <h3>{vehicleDisplayName(vehicle)}</h3>
                    {(() => {
                        const nextTypeLabel = formatCarTypeLabel(vehicle.carTypeName)
                        return nextTypeLabel ? <span className="type-pill type-pill--grid">{nextTypeLabel}</span> : null
                    })()}
                </div>
                <p className="fleet-subtitle fleet-subtitle--plate">
                    <ReceiptText size={14} />
                    <span>Biển số: {vehicle.licensePlate}</span>
                </p>

                <div className="fleet-spec-grid">
                    <div className="fleet-spec-chip">
                        <Users size={15} />
                        <span>{vehicle.seatCount} chỗ</span>
                    </div>
                    <div className="fleet-spec-chip">
                        <Fuel size={15} />
                        <span>{formatEnumLabel(vehicle.fuelType)}</span>
                    </div>
                    <div className="fleet-spec-chip">
                        <Cog size={15} />
                        <span>{formatTransmissionShort(vehicle.transmission)}</span>
                    </div>
                </div>

                <div className="fleet-pricing fleet-pricing--grid">
                    <div>
                        <span className="label">Giá/ngày</span>
                        <strong>{formatPrice(vehicle.pricePerDay)}</strong>
                    </div>
                </div>

                <div className="fleet-actions fleet-actions--grid">
                    <button type="button" className="btn-outline" onClick={() => onViewDetails(vehicle)}>
                        <Eye size={15} />
                        <span>Chi tiết</span>
                    </button>
                    <div className="fleet-actions-secondary">
                        <button type="button" className="btn-outline btn-outline-warning" onClick={() => onEdit(vehicle)}>
                            <Pencil size={15} />
                            <span>Sửa</span>
                        </button>
                        <button type="button" className="btn-outline danger" onClick={() => onDelete(vehicle.id)}>
                            <Trash2 size={15} />
                            <span>Xóa</span>
                        </button>
                    </div>
                </div>
            </div>
        </article>
    )
}

export function FleetAddCard({ onAdd }) {
    return (
        <button
            type="button"
            className="fleet-add-card"
            onClick={onAdd}
        >
            <span className="fleet-add-card-icon"><Plus size={30} strokeWidth={2.4} /></span>
            <strong>Thêm xe mới</strong>
            <small>Mở rộng danh sách cho thuê</small>
        </button>
    )
}
