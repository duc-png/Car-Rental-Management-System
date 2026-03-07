import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listOwnerRegistrationsForAdmin } from '../../api/adminOwnerRegistrations'
import DashboardNotificationBell from '../../components/layout/DashboardNotificationBell'
import '../../styles/AdminOwnerRegistrations.css'

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'PENDING', label: 'Chờ duyệt' },
    { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'CANCELLED', label: 'Đã hủy' },
]

const SORT_OPTIONS = [
    { value: 'NEWEST', label: 'Mới nhất' },
    { value: 'OLDEST', label: 'Cũ nhất' },
]

const formatDateShort = (value) => {
    if (!value) return '—'
    try {
        return new Date(value).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    } catch {
        return '—'
    }
}

const isSameLocalDay = (dateValue, compareDate) => {
    try {
        const a = new Date(dateValue)
        const b = compareDate instanceof Date ? compareDate : new Date(compareDate)
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
    } catch {
        return false
    }
}

const formatEnum = (value) => {
    if (!value) return '—'
    return String(value)
        .toLowerCase()
        .split('_')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ')
}

const formatTransmissionVi = (value) => {
    if (!value) return '—'
    const v = String(value).toUpperCase()
    if (v === 'AUTOMATIC') return 'Tự động'
    if (v === 'MANUAL') return 'Số sàn'
    if (v === 'SEMI_AUTOMATIC') return 'Bán tự động'
    return formatEnum(value)
}

const formatFuelTypeVi = (value) => {
    if (!value) return '—'
    const v = String(value).toUpperCase()
    if (v === 'GASOLINE') return 'Xăng'
    if (v === 'DIESEL') return 'Dầu'
    if (v === 'ELECTRIC') return 'Điện'
    if (v === 'HYBRID') return 'Hybrid'
    return formatEnum(value)
}

const statusBucket = (statusValue) => {
    const value = String(statusValue || '')
    if (value === 'PENDING') return 'pending'
    if (value === 'CANCELLED') return 'cancelled'
    if (value === 'APPROVED') return 'approved'
    return 'approved'
}

const statusLabel = (statusValue) => {
    const value = String(statusValue || '')
    if (value === 'ALL') return 'Tất cả'
    if (value === 'PENDING') return 'Chờ duyệt'
    if (value === 'CANCELLED') return 'Đã hủy'
    if (value === 'APPROVED') return 'Đã duyệt'
    return value || '—'
}

const registrationTitle = (item) => {
    const combined = `${item?.brandName || ''} ${item?.modelName || ''}`.trim()
    const year = item?.manufacturingYear ? ` (${item.manufacturingYear})` : ''
    return `${combined || '—'}${year}`
}

const registrationSubtitle = (item) => {
    const parts = []
    if (item?.seatCount != null) parts.push(`${item.seatCount} chỗ`)
    if (item?.licensePlate) parts.push(item.licensePlate)
    return parts.length ? parts.join(' • ') : '—'
}

const formatFuelConsumption = (value) => {
    if (value == null || value === '') return '—'
    return `${value}L/100km`
}

export default function AdminOwnerRegistrations() {
    const [status, setStatus] = useState('ALL')
    const [sortKey, setSortKey] = useState('NEWEST')
    const [items, setItems] = useState([])
    const [pendingStats, setPendingStats] = useState({ pending: 0, newToday: 0 })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [page, setPage] = useState(1)

    const load = async () => {
        try {
            setLoading(true)
            setError('')
            const pendingPromise = listOwnerRegistrationsForAdmin('PENDING')
            const approvedPromise = listOwnerRegistrationsForAdmin('APPROVED')
            const cancelledPromise = listOwnerRegistrationsForAdmin('CANCELLED')

            const currentListPromise =
                status === 'PENDING'
                    ? pendingPromise
                    : status === 'APPROVED'
                        ? approvedPromise
                        : status === 'CANCELLED'
                            ? cancelledPromise
                            : Promise.all([pendingPromise, approvedPromise, cancelledPromise]).then((parts) => parts.flat())

            const [currentListRaw, pendingRaw, approvedRaw, cancelledRaw] = await Promise.all([
                currentListPromise,
                pendingPromise,
                approvedPromise,
                cancelledPromise
            ])

            const currentList = (Array.isArray(currentListRaw) ? currentListRaw : []).filter(Boolean)
            if (status === 'ALL') {
                const byId = new Map()
                for (const it of currentList) {
                    if (it?.requestId == null) continue
                    byId.set(it.requestId, it)
                }
                setItems(Array.from(byId.values()))
            } else {
                setItems(currentList)
            }

            const pendingList = (Array.isArray(pendingRaw) ? pendingRaw : []).filter(Boolean)
            const approvedList = (Array.isArray(approvedRaw) ? approvedRaw : []).filter(Boolean)
            const cancelledList = (Array.isArray(cancelledRaw) ? cancelledRaw : []).filter(Boolean)

            const today = new Date()
            const allForToday = [...pendingList, ...approvedList, ...cancelledList]
            const newToday = allForToday.filter((it) => it?.createdAt && isSameLocalDay(it.createdAt, today)).length

            setPendingStats({ pending: pendingList.length, newToday })
        } catch (e) {
            setError(e.message || 'Không thể tải danh sách')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status])

    useEffect(() => {
        setPage(1)
    }, [status, sortKey])

    const sorted = useMemo(() => {
        const next = [...items]
        if (sortKey === 'NEWEST') {
            next.sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())
        } else {
            next.sort((a, b) => new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime())
        }
        return next
    }, [items, sortKey])

    const PAGE_SIZE = 3
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
    const currentPage = Math.min(page, totalPages)

    const paginated = useMemo(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE
        return sorted.slice(startIndex, startIndex + PAGE_SIZE)
    }, [sorted, currentPage])

    return (
        <section className="admin-owner-registrations-page">
            <div className="owner-reg-page-header">
                <div>
                    <h1>Yêu cầu đăng ký chủ xe</h1>
                    <p>Rà soát và xử lý hồ sơ chủ xe mới trên nền tảng.</p>
                </div>
                <DashboardNotificationBell />
            </div>

            <div className="owner-reg-stats">
                <div className="owner-reg-stat-card stat-pending">
                    <div className="owner-reg-stat-top">
                        <div className="owner-reg-stat-icon" aria-hidden="true">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7 7H17V17H7V7Z" stroke="currentColor" strokeWidth="2" />
                                <path d="M9 3H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M9 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <span className="owner-reg-stat-badge">Hàng chờ xử lý</span>
                    </div>
                    <div className="owner-reg-stat-label">Hồ sơ chờ duyệt</div>
                    <div className="owner-reg-stat-value">{pendingStats.pending}</div>
                </div>

                <div className="owner-reg-stat-card stat-today">
                    <div className="owner-reg-stat-top">
                        <div className="owner-reg-stat-icon" aria-hidden="true">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 2V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M16 2V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M5 6H19C20.1046 6 21 6.89543 21 8V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V8C3 6.89543 3.89543 6 5 6Z" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                        <span className="owner-reg-stat-badge">+{pendingStats.newToday} hôm nay</span>
                    </div>
                    <div className="owner-reg-stat-label">Mới hôm nay</div>
                    <div className="owner-reg-stat-value">{pendingStats.newToday}</div>
                </div>

                <div className="owner-reg-stat-card stat-total">
                    <div className="owner-reg-stat-top">
                        <div className="owner-reg-stat-icon" aria-hidden="true">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17 21V19C17 17.8954 16.1046 17 15 17H9C7.89543 17 7 17.8954 7 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M12 13C14.2091 13 16 11.2091 16 9C16 6.79086 14.2091 5 12 5C9.79086 5 8 6.79086 8 9C8 11.2091 9.79086 13 12 13Z" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                        <span className="owner-reg-stat-badge">Tổng quan</span>
                    </div>
                    <div className="owner-reg-stat-label">Tổng chủ xe</div>
                    <div className="owner-reg-stat-value">—</div>
                </div>
            </div>

            {error && <div className="owner-reg-alert">{error}</div>}

            <div className="owner-reg-card">
                <div className="owner-reg-card-head">
                    <div className="owner-reg-card-title">Đăng ký chủ xe</div>
                    <div className="owner-reg-controls">
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="owner-reg-select"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <select
                            value={sortKey}
                            onChange={(e) => setSortKey(e.target.value)}
                            className="owner-reg-select"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>Sắp xếp: {opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="owner-reg-empty">Đang tải dữ liệu...</div>
                ) : sorted.length === 0 ? (
                    <div className="owner-reg-empty">Không có yêu cầu.</div>
                ) : (
                    <div className="owner-reg-table-wrap">
                        <table className="owner-reg-table">
                            <colgroup>
                                <col style={{ width: '4%' }} />
                                <col style={{ width: '18%' }} />
                                <col style={{ width: '33%' }} />
                                <col style={{ width: '19%' }} />
                                <col style={{ width: '12%' }} />
                                <col style={{ width: '8%' }} />
                                <col style={{ width: '6%' }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>Chủ xe</th>
                                    <th>Thông tin xe</th>
                                    <th>Thông số</th>
                                    <th>Ngày gửi</th>
                                    <th>Trạng thái</th>
                                    <th className="actions">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((item, index) => {
                                    const bucket = statusBucket(item.status)
                                    const previewUrl = item?.vehicleImageUrls?.length ? item.vehicleImageUrls[0] : ''
                                    const displayNo = (currentPage - 1) * PAGE_SIZE + index + 1
                                    return (
                                        <tr key={item.requestId}>
                                            <td className="muted">{displayNo}</td>
                                            <td>
                                                <div className="owner-cell">
                                                    <div className="owner-name">{item.fullName || '—'}</div>
                                                    <div className="owner-sub" title={item.email || ''}>{item.email || '—'}</div>
                                                    <div className="owner-sub" title={item.phone || ''}>{item.phone || '—'}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="owner-reg-vehicle-cell">
                                                    <div className="owner-reg-vehicle-thumb">
                                                        {previewUrl ? <img src={previewUrl} alt="Vehicle" loading="lazy" /> : null}
                                                    </div>
                                                    <div className="owner-reg-vehicle-meta">
                                                        <div className="owner-reg-vehicle-title" title={registrationTitle(item)}>{registrationTitle(item)}</div>
                                                        <div className="owner-reg-vehicle-sub" title={registrationSubtitle(item)}>{registrationSubtitle(item)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="specs-cell">
                                                    <div className="spec-line">
                                                        <span className="dot" aria-hidden="true">⚙</span>
                                                        <span>{formatTransmissionVi(item.transmission)}</span>
                                                    </div>
                                                    <div className="spec-line">
                                                        <span className="dot" aria-hidden="true">⛽</span>
                                                        <span>{formatFuelTypeVi(item.fuelType)}</span>
                                                    </div>
                                                    <div className="spec-line">
                                                        <span className="dot" aria-hidden="true">🧮</span>
                                                        <span>{formatFuelConsumption(item.fuelConsumption)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{formatDateShort(item.createdAt)}</td>
                                            <td>
                                                <span className={`owner-reg-pill status-${bucket}`}>{statusLabel(item.status)}</span>
                                            </td>
                                            <td className="actions">
                                                <Link
                                                    to={`/admin/owner-registrations/${item.requestId}`}
                                                    className="owner-reg-view"
                                                    aria-label="View details"
                                                    title="Xem chi tiết"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                                        <path d="M2 12C4.5 7 8 5 12 5C16 5 19.5 7 22 12C19.5 17 16 19 12 19C8 19 4.5 17 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                                                        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" />
                                                    </svg>
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>

                        <div className="owner-reg-footer">
                            <div className="owner-reg-range">
                                Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} đến {Math.min(currentPage * PAGE_SIZE, sorted.length)} trên tổng {sorted.length} yêu cầu
                            </div>
                            <div className="owner-reg-pagination">
                                <button
                                    type="button"
                                    className="owner-reg-page-btn"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    aria-label="Trang trước"
                                >
                                    ‹
                                </button>
                                {Array.from({ length: totalPages }).slice(0, 5).map((_, index) => {
                                    const p = index + 1
                                    return (
                                        <button
                                            key={p}
                                            type="button"
                                            className={`owner-reg-page-btn ${p === currentPage ? 'active' : ''}`}
                                            onClick={() => setPage(p)}
                                        >
                                            {p}
                                        </button>
                                    )
                                })}
                                <button
                                    type="button"
                                    className="owner-reg-page-btn"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    aria-label="Trang sau"
                                >
                                    ›
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}
