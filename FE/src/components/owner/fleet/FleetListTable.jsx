import { Cog, Eye, Fuel, Pencil, Trash2, Wrench } from 'lucide-react'
import {
    formatCarTypeLabel,
    formatEnumLabel,
    formatPrice,
    formatTransmissionShort,
    getVehicleThumbnailUrl,
    statusCssClass,
    vehicleDisplayName
} from '../../../utils/ownerFleetUtils'

function FleetListTable({ vehicles, onViewDetails, onEdit, onDelete, onMaintenance }) {
    return (
        <div className="fleet-list-table">
            <header className="fleet-list-head">
                <span>Thông tin xe</span>
                <span>Biển số</span>
                <span>Trạng thái</span>
                <span>Đặc tính</span>
                <span>Giá thuê/ngày</span>
                <span>Hành động</span>
            </header>

            {vehicles.map((vehicle) => {
                const carTypeLabel = formatCarTypeLabel(vehicle.carTypeName)
                const canEdit = String(vehicle?.status || '') !== 'PENDING_APPROVAL'
                return (
                    <article className="fleet-list-row" key={vehicle.id}>
                        <div className="fleet-list-cell fleet-list-info">
                            <img
                                className="fleet-list-thumb"
                                src={getVehicleThumbnailUrl(vehicle) || '/favicon.svg'}
                                alt={vehicleDisplayName(vehicle)}
                            />
                            <div className="fleet-list-info-text">
                                <h3>{vehicleDisplayName(vehicle)}</h3>
                                <p>{`${carTypeLabel || 'Sedan'} | ${vehicle.seatCount || 0} chỗ`}</p>
                            </div>
                        </div>

                        <div className="fleet-list-cell">
                            <span className="fleet-list-plate">{vehicle.licensePlate || '—'}</span>
                        </div>

                        <div className="fleet-list-cell">
                            <span className={`fleet-list-status ${statusCssClass(vehicle.status)}`}>
                                {formatEnumLabel(vehicle.status)}
                            </span>
                        </div>

                        <div className="fleet-list-cell fleet-list-features">
                            <span><Fuel size={14} /> {formatEnumLabel(vehicle.fuelType) || '—'}</span>
                            <span className="fleet-list-dot">•</span>
                            <span><Cog size={14} /> {formatTransmissionShort(vehicle.transmission) || '—'}</span>
                        </div>

                        <div className="fleet-list-cell fleet-list-price">{formatPrice(vehicle.pricePerDay)}</div>

                        <div className="fleet-list-cell fleet-list-actions">
                            <button
                                type="button"
                                className="fleet-list-action"
                                title="Chi tiết"
                                aria-label="Chi tiết"
                                onClick={() => onViewDetails(vehicle)}
                            >
                                <Eye size={18} />
                            </button>
                            {onMaintenance && (
                                <button
                                    type="button"
                                    className="fleet-list-action"
                                    title="Bảo dưỡng"
                                    aria-label="Bảo dưỡng"
                                    onClick={() => onMaintenance(vehicle)}
                                >
                                    <Wrench size={18} />
                                </button>
                            )}
                            <button
                                type="button"
                                className="fleet-list-action"
                                title={canEdit ? 'Sửa' : 'Xe đang chờ duyệt, chưa thể sửa'}
                                aria-label={canEdit ? 'Sửa' : 'Xe đang chờ duyệt, chưa thể sửa'}
                                onClick={() => onEdit(vehicle)}
                                disabled={!canEdit}
                            >
                                <Pencil size={18} />
                            </button>
                            <button
                                type="button"
                                className="fleet-list-action danger"
                                title="Xóa"
                                aria-label="Xóa"
                                onClick={() => onDelete(vehicle.id)}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </article>
                )
            })}
        </div>
    )
}

export default FleetListTable
