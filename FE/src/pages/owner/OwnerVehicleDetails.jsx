import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/CarOwnerFleet.css'

import { getVehicleDetail } from '../../api/ownerVehicles'

const formatEnumLabel = (value) => {
    if (!value) return ''

    const normalized = String(value).trim().toUpperCase()
    const map = {
        MANUAL: 'Số sàn',
        AUTOMATIC: 'Số tự động',
        GASOLINE: 'Xăng',
        DIESEL: 'Dầu diesel',
        ELECTRIC: 'Điện',
        AVAILABLE: 'Sẵn sàng',
        RENTED: 'Đang thuê',
        MAINTENANCE: 'Bảo dưỡng',
        PENDING_APPROVAL: 'Chờ duyệt',
        REJECTED: 'Bị từ chối'
    }
    if (map[normalized]) return map[normalized]

    return String(value)
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
}

const formatPrice = (value) => {
    if (value == null || value === '') return '0 VNĐ'
    const numberValue = typeof value === 'number' ? value : Number(value)
    if (Number.isNaN(numberValue)) return '0 VNĐ'

    const formatted = new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numberValue)

    return `${formatted} VNĐ`
}

const statusCssClass = (status) => (status ? String(status).toLowerCase().replaceAll('_', '-') : 'unknown')

const formatCarTypeLabel = (value) => {
    if (value == null) return ''
    const trimmed = String(value).trim()
    if (!trimmed) return ''
    if (trimmed.toLowerCase() === 'unknown') return ''
    return trimmed
}

const vehicleDisplayName = (vehicle) => {
    const brand = vehicle?.brandName ? String(vehicle.brandName).trim() : ''
    const model = vehicle?.modelName ? String(vehicle.modelName).trim() : ''
    const combined = `${brand} ${model}`.trim()
    return combined || `Xe #${vehicle?.id ?? ''}`
}

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

    const images = Array.isArray(vehicle?.images) ? vehicle.images : []
    const initialImageIndex = (() => {
        if (images.length === 0) return 0
        const mainIndex = images.findIndex((img) => Boolean(img?.isMain))
        return mainIndex >= 0 ? mainIndex : 0
    })()

    const [selectedImageIndex, setSelectedImageIndex] = useState(initialImageIndex)

    useEffect(() => {
        setSelectedImageIndex(initialImageIndex)
    }, [vehicle?.id, initialImageIndex])

    const galleryImages = images.length > 0 ? images : [{ id: 'placeholder', imageUrl: '/favicon.svg', isMain: true }]
    const safeSelectedIndex = Math.min(Math.max(selectedImageIndex, 0), galleryImages.length - 1)
    const selectedImage = galleryImages[safeSelectedIndex]

    const goPrev = () => {
        setSelectedImageIndex((prev) => {
            const next = prev - 1
            return next < 0 ? galleryImages.length - 1 : next
        })
    }

    const goNext = () => {
        setSelectedImageIndex((prev) => {
            const next = prev + 1
            return next >= galleryImages.length ? 0 : next
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

    return (
        <div className="fleet-dashboard">
            <aside className="fleet-sidebar">
                <Link to="/" className="fleet-brand">
                    <div className="brand-icon">
                        <img src="/favicon.svg" alt="Hệ thống CarRental" />
                    </div>
                    <div>
                        <h3>Hệ thống CarRental</h3>
                        <p>Quản lý đội xe</p>
                    </div>
                </Link>

                <div className="fleet-nav">
                    <p className="nav-section">Điều hướng</p>
                    <button type="button" className="nav-item">Tổng quan</button>
                    <button type="button" className="nav-item active">Xe của tôi</button>
                    <button type="button" className="nav-item">Đơn thuê</button>
                    <button type="button" className="nav-item">Khách hàng</button>
                    <button type="button" className="nav-item">Thống kê</button>
                </div>

                <div className="fleet-system">
                    <p className="nav-section">Hệ thống</p>
                    <button type="button" className="nav-item">Cài đặt</button>
                    <button type="button" className="nav-item fleet-logout" onClick={handleLogout}>
                        <span className="fleet-logout-icon" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M10 17L5 12L10 7"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M5 12H19"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>
                        Đăng xuất
                    </button>
                </div>

                <div className="fleet-user">
                    <div className="user-avatar">{(user?.fullName || 'CO').slice(0, 2).toUpperCase()}</div>
                    <div className="user-info">
                        <p className="user-name">{user?.fullName || 'Chủ xe'}</p>
                        <p className="user-email">{user?.email || 'owner@carrental.com'}</p>
                    </div>
                </div>
            </aside>

            <section className="fleet-main">
                <header className="fleet-header">
                    <div>
                        <p className="fleet-breadcrumb">Chủ xe</p>
                        <h1>Chi tiết xe</h1>
                        {/* <p>{vehicle ? vehicleDisplayName(vehicle) : '—'}</p> */}
                    </div>
                    <div className="fleet-header-actions">
                        <Link className="btn-outline" to={ownerId ? `/owner/fleet?ownerId=${ownerId}` : '/owner/fleet'}>
                            Quay lại
                        </Link>
                        <Link className="btn-outline" to={ownerId ? `/owner/vehicles/${id}/edit?ownerId=${ownerId}` : `/owner/vehicles/${id}/edit`}>
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
                        <div className="vehicle-details-hero">
                            <div className="vehicle-details-heroImage">
                                <div className="vehicle-gallery">
                                    <div className="vehicle-gallery-main">
                                        <button
                                            type="button"
                                            className="vehicle-gallery-nav vehicle-gallery-prev"
                                            onClick={goPrev}
                                            aria-label="Ảnh trước"
                                            disabled={galleryImages.length <= 1}
                                        >
                                            ‹
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
                                            disabled={galleryImages.length <= 1}
                                        >
                                            ›
                                        </button>

                                        <span className={`status-badge ${statusCssClass(vehicle?.status)}`}>
                                            {formatEnumLabel(vehicle?.status)}
                                        </span>
                                    </div>

                                    <div className="vehicle-gallery-thumbs" role="list">
                                        {galleryImages.map((img, index) => (
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

                            <div className="vehicle-details-summary">
                                <p className="vehicle-details-subtitle">Thông tin nhanh</p>
                                <div className="vehicle-details-kpis">
                                    <div className="vehicle-kpi">
                                        <span className="label">Giá/ngày</span>
                                        <strong>{formatPrice(vehicle?.pricePerDay)}</strong>
                                    </div>
                                    <div className="vehicle-kpi">
                                        <span className="label">Biển số</span>
                                        <strong>{vehicle?.licensePlate || '—'}</strong>
                                    </div>
                                    <div className="vehicle-kpi">
                                        <span className="label">Số chỗ</span>
                                        <strong>{vehicle?.seatCount ?? '—'}</strong>
                                    </div>
                                    <div className="vehicle-kpi">
                                        <span className="label">Loại xe</span>
                                        <strong>{carType || '—'}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="vehicle-details-card">
                            <div className="vehicle-details-sectionHeader">
                                <h2>Thông tin xe</h2>
                            </div>

                            <div className="vehicle-details-grid">
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
                                <div className="vehicle-field">
                                    <span className="vehicle-label">Địa chỉ</span>
                                    <span className="vehicle-value">
                                        {[province, ward, vehicle?.addressDetail].filter(Boolean).join(', ') || '—'}
                                    </span>
                                </div>
                            </div>

                            <div className="vehicle-details-description">
                                <span className="vehicle-label">Mô tả</span>
                                <p className="vehicle-paragraph">{String(vehicle?.description || '').trim() || '—'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}
