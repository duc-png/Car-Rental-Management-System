import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/CarOwnerFleet.css'
import '../../styles/OwnerVehicleDetails.css'
import FleetSidebar from '../../components/owner/fleet/FleetSidebar'

import { getVehicleDetail } from '../../api/ownerVehicles'
import {
    formatCarTypeLabel,
    formatEnumLabel,
    formatPrice,
    statusCssClass,
    vehicleDisplayName
} from '../../utils/ownerFleetUtils'

export default function OwnerVehicleDetails() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [searchParams] = useSearchParams()

    const { user, isAuthenticated, logout } = useAuth()
    const ownerIdParam = searchParams.get('ownerId')
    const ownerIdFromUser = user?.userId || user?.id
    const ownerId = ownerIdFromUser ?? (ownerIdParam ? Number(ownerIdParam) : null)
    const canManage = Boolean(user?.role?.includes('ROLE_CAR_OWNER') || user?.role?.includes('ROLE_ADMIN'))

    const [vehicle, setVehicle] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            setError('')
            try {
                const detail = await getVehicleDetail(id)
                if (!cancelled) setVehicle(detail)
            } catch (err) {
                if (!cancelled) setError(err?.message || 'Không thể tải thông tin xe')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [id])

    const images = Array.isArray(vehicle?.images)
        ? vehicle.images
            .filter((image) => Boolean(image?.imageUrl))
            .map((image) => ({ ...image, imageUrl: image.imageUrl }))
        : []
    const initialImageIndex = (() => {
        const visibleImages = images.slice(0, 4)
        if (visibleImages.length === 0) return 0
        const mainIndex = visibleImages.findIndex((img) => Boolean(img?.isMain))
        return mainIndex >= 0 ? mainIndex : 0
    })()

    const [selectedImageIndex, setSelectedImageIndex] = useState(initialImageIndex)

    useEffect(() => {
        setSelectedImageIndex(initialImageIndex)
    }, [vehicle?.id, initialImageIndex])

    const galleryImages = images.length > 0
        ? images
        : vehicle?.mainImageUrl
            ? [{ id: 'main', imageUrl: vehicle.mainImageUrl, isMain: true }]
            : [{ id: 'placeholder', imageUrl: '/favicon.svg', isMain: true }]
    const displayImages = galleryImages.slice(0, 4)
    const safeSelectedIndex = Math.min(Math.max(selectedImageIndex, 0), displayImages.length - 1)
    const selectedImage = displayImages[safeSelectedIndex]

    const goPrev = () => {
        setSelectedImageIndex((prev) => {
            const next = prev - 1
            return next < 0 ? displayImages.length - 1 : next
        })
    }

    const goNext = () => {
        setSelectedImageIndex((prev) => {
            const next = prev + 1
            return next >= displayImages.length ? 0 : next
        })
    }

    if (!isAuthenticated) {
        return (
            <div className="fleet-guard">
                <h2>Vui lòng đăng nhập</h2>
                <p>Chỉ tài khoản chủ xe mới có thể truy cập trang này.</p>
                <Link to="/login" className="add-vehicle">Đăng nhập ngay</Link>
            </div>
        )
    }

    if (!canManage) {
        return (
            <div className="fleet-guard">
                <h2>Không đủ quyền truy cập</h2>
                <p>Vui lòng đăng nhập bằng tài khoản chủ xe.</p>
                <Link to="/" className="add-vehicle">Quay lại trang chủ</Link>
            </div>
        )
    }

    const province = vehicle?.province || vehicle?.city || ''
    const ward = vehicle?.ward || vehicle?.district || ''
    const carType = formatCarTypeLabel(vehicle?.carTypeName || vehicle?.typeName)
    const featureList = Array.isArray(vehicle?.features)
        ? vehicle.features
            .map((feature) => String(feature?.name || '').trim())
            .filter(Boolean)
        : []

    return (
        <div className="fleet-dashboard owner-vehicle-details-page">
            <FleetSidebar user={user} onLogout={handleLogout} />

            <section className="fleet-main owner-vehicle-details-main">
                <header className="fleet-header">
                    <div>
                        <p className="fleet-breadcrumb">Chủ xe</p>
                        <h1>Chi tiết xe</h1>
                    </div>
                    <div className="fleet-header-actions">
                        <Link className="btn-outline" to={ownerId ? `/owner/fleet?ownerId=${ownerId}` : '/owner/fleet'}>
                            Quay lại
                        </Link>
                        <Link className="btn-outline btn-outline-dark" to={ownerId ? `/owner/vehicles/${id}/edit?ownerId=${ownerId}` : `/owner/vehicles/${id}/edit`}>
                            ✏️ Sửa
                        </Link>
                    </div>
                </header>

                {error && (
                    <div className="fleet-alert" role="alert">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="fleet-loading">Đang tải...</div>
                ) : !vehicle ? (
                    <div className="fleet-loading">Không tìm thấy xe.</div>
                ) : (
                    <div className="vehicle-details">
                        <div className="owner-vehicle-details-layout">
                            <div className="owner-vehicle-details-left">
                                <div className="vehicle-details-heroImage">
                                    <div className="vehicle-gallery">
                                        <div className="vehicle-gallery-main">
                                            <button
                                                type="button"
                                                className="vehicle-gallery-nav vehicle-gallery-prev"
                                                onClick={goPrev}
                                                aria-label="Ảnh trước"
                                                disabled={displayImages.length <= 1}
                                                hidden={displayImages.length <= 1}
                                            >
                                                ❮
                                            </button>

                                            <img
                                                src={selectedImage?.imageUrl || '/favicon.svg'}
                                                alt={vehicleDisplayName(vehicle)}
                                            />

                                            <button
                                                type="button"
                                                className="vehicle-gallery-nav vehicle-gallery-next"
                                                onClick={goNext}
                                                aria-label="Ảnh tiếp theo"
                                                disabled={displayImages.length <= 1}
                                                hidden={displayImages.length <= 1}
                                            >
                                                ❯
                                            </button>

                                            <span className={`status-badge ${statusCssClass(vehicle?.status)}`}>
                                                {formatEnumLabel(vehicle?.status)}
                                            </span>
                                        </div>

                                        <div className="vehicle-gallery-thumbs" role="list">
                                            {displayImages.map((img, index) => (
                                                <button
                                                    key={img.id ?? index}
                                                    type="button"
                                                    role="listitem"
                                                    className={`vehicle-thumb ${index === safeSelectedIndex ? 'active' : ''}`}
                                                    onClick={() => setSelectedImageIndex(index)}
                                                    aria-label={`Chọn ảnh ${index + 1}`}
                                                >
                                                    <img src={img.imageUrl || '/favicon.svg'} alt="Thumbnail" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="vehicle-details-card owner-vehicle-details-infoCard">
                                    <div className="vehicle-details-grid owner-vehicle-details-grid">
                                        <div className="vehicle-field">
                                            <span className="vehicle-label">Biển số</span>
                                            <span className="vehicle-value">{vehicle?.licensePlate || '—'}</span>
                                        </div>
                                        <div className="vehicle-field">
                                            <span className="vehicle-label">Giá/ngày</span>
                                            <span className="vehicle-value">{formatPrice(vehicle?.pricePerDay)}</span>
                                        </div>
                                        <div className="vehicle-field">
                                            <span className="vehicle-label">Trạng thái</span>
                                            <span className="vehicle-value">{formatEnumLabel(vehicle?.status) || '—'}</span>
                                        </div>
                                        <div className="vehicle-field">
                                            <span className="vehicle-label">Hãng xe</span>
                                            <span className="vehicle-value">{vehicle?.brandName || '—'}</span>
                                        </div>
                                        <div className="vehicle-field">
                                            <span className="vehicle-label">Mẫu xe</span>
                                            <span className="vehicle-value">{vehicle?.modelName || '—'}</span>
                                        </div>
                                        <div className="vehicle-field">
                                            <span className="vehicle-label">Loại xe</span>
                                            <span className="vehicle-value">{carType || '—'}</span>
                                        </div>
                                        <div className="vehicle-field">
                                            <span className="vehicle-label">Màu sắc</span>
                                            <span className="vehicle-value">{vehicle?.color || '—'}</span>
                                        </div>
                                        <div className="vehicle-field">
                                            <span className="vehicle-label">Hộp số</span>
                                            <span className="vehicle-value">{formatEnumLabel(vehicle?.transmission) || '—'}</span>
                                        </div>
                                        <div className="vehicle-field">
                                            <span className="vehicle-label">Nhiên liệu</span>
                                            <span className="vehicle-value">{formatEnumLabel(vehicle?.fuelType) || '—'}</span>
                                        </div>
                                        <div className="vehicle-field">
                                            <span className="vehicle-label">Năm sản xuất</span>
                                            <span className="vehicle-value">{vehicle?.year ?? '—'}</span>
                                        </div>
                                        <div className="vehicle-field">
                                            <span className="vehicle-label">Mức tiêu thụ</span>
                                            <span className="vehicle-value">{vehicle?.fuelConsumption ?? '—'}</span>
                                        </div>
                                        <div className="vehicle-field">
                                            <span className="vehicle-label">Số km hiện tại</span>
                                            <span className="vehicle-value">{vehicle?.currentKm ?? '—'}</span>
                                        </div>
                                        <div className="vehicle-field owner-vehicle-address-field">
                                            <span className="vehicle-label">Địa chỉ</span>
                                            <span className="vehicle-value">
                                                {[province, ward, vehicle?.addressDetail].filter(Boolean).join(', ') || '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="vehicle-details-card owner-vehicle-details-descCard">
                                    <div className="vehicle-details-description owner-vehicle-details-description-block">
                                        <span className="vehicle-label">Mô tả</span>
                                        <p className="vehicle-paragraph">{String(vehicle?.description || '').trim() || '—'}</p>
                                    </div>
                                    <div className="vehicle-details-description owner-vehicle-details-description-block">
                                        <span className="vehicle-label">Tính năng</span>
                                        {featureList.length > 0 ? (
                                            <div className="vehicle-feature-chips">
                                                {featureList.map((featureName, index) => (
                                                    <span key={`${featureName}-${index}`} className="vehicle-feature-chip">
                                                        {featureName}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="vehicle-paragraph">—</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <aside className="owner-vehicle-details-right">
                                <p className="vehicle-details-subtitle">Thông tin nhanh</p>
                                <div className="vehicle-details-kpis">
                                    <div className="vehicle-kpi vehicle-kpi-highlight">
                                        <span className="label">Giá/ngày</span>
                                        <strong>{formatPrice(vehicle?.pricePerDay)}</strong>
                                    </div>
                                    <div className="vehicle-kpi">
                                        <span className="label">Biển số</span>
                                        <strong>{vehicle?.licensePlate || '—'}</strong>
                                    </div>
                                    <div className="vehicle-kpi">
                                        <span className="label">Số chỗ</span>
                                        <strong>{vehicle?.seatCount ? `${vehicle.seatCount} chỗ` : '—'}</strong>
                                    </div>
                                    <div className="vehicle-kpi">
                                        <span className="label">Loại xe</span>
                                        <strong>{carType || '—'}</strong>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}
