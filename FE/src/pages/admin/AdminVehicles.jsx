import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { approveVehicle, listAllVehicles, rejectVehicle } from '../../api/adminVehicles'
import { getOwnerById } from '../../api/owners'
import '../../styles/AdminVehicles.css'

const APPROVED_STATUSES = new Set(['AVAILABLE', 'RENTED', 'MAINTENANCE'])

const formatPrice = (value) => {
    if (value == null) return '—'
    try {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))
    } catch {
        return String(value)
    }
}

const vehicleName = (vehicle) => {
    const combined = `${vehicle?.brandName || ''} ${vehicle?.modelName || ''}`.trim()
    return combined || `Vehicle #${vehicle?.id ?? ''}`
}

const vehicleSubtitle = (vehicle) => {
    const fuel = vehicle?.fuelType ? String(vehicle.fuelType).toLowerCase() : ''
    const transmission = vehicle?.transmission ? String(vehicle.transmission).toLowerCase() : ''
    const year = ''
    const parts = [fuel, transmission, year].filter(Boolean)
    return parts.length ? parts.join(' • ') : (vehicle?.carTypeName || '—')
}

const addressText = (vehicle) => {
    const parts = [vehicle?.city, vehicle?.district].filter(Boolean)
    return parts.length ? parts.join(', ') : '—'
}

const statusBucket = (status) => {
    const value = String(status || '')
    if (value === 'PENDING_APPROVAL') return 'pending'
    if (value === 'REJECTED') return 'rejected'
    if (APPROVED_STATUSES.has(value)) return 'approved'
    return 'approved'
}

const statusLabel = (status) => {
    const bucket = statusBucket(status)
    if (bucket === 'pending') return 'Pending'
    if (bucket === 'rejected') return 'Rejected'
    return 'Approved'
}

const pickVehicleImage = (vehicle) => {
    const images = Array.isArray(vehicle?.images) ? vehicle.images : []
    const main = images.find((img) => Boolean(img?.isMain))
    return main?.imageUrl || images[0]?.imageUrl || ''
}

const initialsFrom = (value) => {
    if (!value) return '—'
    const text = String(value).trim()
    if (!text) return '—'
    const parts = text.split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] || ''
    const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : (parts[0]?.[1] || '')
    return `${first}${second}`.toUpperCase() || '—'
}

const formatDate = (value) => {
    if (!value) return '—'
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('vi-VN')
}

export default function AdminVehicles() {
    const [vehicles, setVehicles] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [ownersById, setOwnersById] = useState({})

    const [query, setQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [dateRange, setDateRange] = useState('LAST_30')
    const [sortKey, setSortKey] = useState('LATEST')
    const [page, setPage] = useState(1)

    const load = async () => {
        try {
            setLoading(true)
            setError('')
            const data = await listAllVehicles()
            setVehicles(Array.isArray(data) ? data : [])
        } catch (e) {
            setError(e.message || 'Không thể tải danh sách xe')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    useEffect(() => {
        setPage(1)
    }, [query, statusFilter, dateRange, sortKey])

    const stats = useMemo(() => {
        const total = vehicles.length
        const pendingRequests = vehicles.filter((v) => String(v.status) === 'PENDING_APPROVAL').length
        const rejectedRequests = vehicles.filter((v) => String(v.status) === 'REJECTED').length
        const approvedVehicles = vehicles.filter((v) => APPROVED_STATUSES.has(String(v.status))).length
        return { total, pendingRequests, approvedVehicles, rejectedRequests }
    }, [vehicles])

    const percentOfTotal = (value) => {
        if (!stats.total) return 0
        return Math.round((value / stats.total) * 100)
    }

    const filtered = useMemo(() => {
        const keyword = query.trim().toLowerCase()
        let list = vehicles

        if (statusFilter === 'PENDING') {
            list = list.filter((v) => String(v.status) === 'PENDING_APPROVAL')
        } else if (statusFilter === 'APPROVED') {
            list = list.filter((v) => APPROVED_STATUSES.has(String(v.status)))
        } else if (statusFilter === 'REJECTED') {
            list = list.filter((v) => String(v.status) === 'REJECTED')
        }

        if (keyword) {
            list = list.filter((v) => {
                const owner = v?.ownerId ? ownersById[v.ownerId] : null
                const ownerText = `${owner?.fullName || ''} ${owner?.email || ''} ${v?.ownerId || ''}`.toLowerCase()
                const vehicleText = `${v?.id || ''} ${vehicleName(v)} ${v?.licensePlate || ''}`.toLowerCase()
                return vehicleText.includes(keyword) || ownerText.includes(keyword)
            })
        }

        const sorted = [...list]
        if (sortKey === 'LATEST') {
            sorted.sort((a, b) => (Number(b?.id) || 0) - (Number(a?.id) || 0))
        } else if (sortKey === 'OLDEST') {
            sorted.sort((a, b) => (Number(a?.id) || 0) - (Number(b?.id) || 0))
        } else if (sortKey === 'PRICE_HIGH') {
            sorted.sort((a, b) => (Number(b?.pricePerDay) || 0) - (Number(a?.pricePerDay) || 0))
        } else if (sortKey === 'PRICE_LOW') {
            sorted.sort((a, b) => (Number(a?.pricePerDay) || 0) - (Number(b?.pricePerDay) || 0))
        }
        return sorted
    }, [vehicles, ownersById, query, statusFilter, sortKey])

    const PAGE_SIZE = 4
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const currentPage = Math.min(page, totalPages)

    const paginated = useMemo(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE
        return filtered.slice(startIndex, startIndex + PAGE_SIZE)
    }, [filtered, currentPage])

    useEffect(() => {
        let cancelled = false

        const loadOwners = async () => {
            const ids = Array.from(new Set(paginated.map((v) => v?.ownerId).filter(Boolean)))
            const missing = ids.filter((id) => ownersById[id] == null)
            if (missing.length === 0) return

            const results = await Promise.all(
                missing.map(async (id) => {
                    try {
                        const data = await getOwnerById(id)
                        return [id, data]
                    } catch {
                        return [id, null]
                    }
                })
            )

            if (cancelled) return
            setOwnersById((prev) => {
                const next = { ...prev }
                for (const [id, data] of results) {
                    if (data && next[id] == null) {
                        next[id] = data
                    }
                }
                return next
            })
        }

        loadOwners()
        return () => {
            cancelled = true
        }
    }, [paginated, ownersById])

    const onApprove = async (id) => {
        const ok = window.confirm('Duyệt xe này?')
        if (!ok) return
        try {
            const updated = await approveVehicle(id)
            if (updated) {
                setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)))
            }
            toast.success('Đã duyệt xe')
        } catch (e) {
            toast.error(e.message || 'Không thể duyệt')
        }
    }

    const onReject = async (id) => {
        const reason = window.prompt('Lý do từ chối (tuỳ chọn):') || ''
        const ok = window.confirm('Từ chối xe này?')
        if (!ok) return
        try {
            const updated = await rejectVehicle(id, reason.trim() || undefined)
            if (updated) {
                setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)))
            }
            toast.success('Đã từ chối xe')
        } catch (e) {
            toast.error(e.message || 'Không thể từ chối')
        }
    }

    const showRange = (currentPage - 1) * PAGE_SIZE + 1
    const endRange = Math.min(currentPage * PAGE_SIZE, filtered.length)

    return (
        <>
            <div className="approval-header">
                <div>
                    <h1>Vehicle Approval</h1>
                    <p>Review and manage vehicle approval requests from car owners.</p>
                </div>
                {/* <button className="btn-outline" onClick={load} disabled={loading}>Refresh</button> */}
            </div>

            <div className="approval-stats">
                <div className="approval-stat-card stat-pending">
                    <div className="approval-stat-top">
                        <div className="approval-stat-icon" aria-hidden="true">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22Z" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                        <span className="approval-stat-badge">+{percentOfTotal(stats.pendingRequests)}%</span>
                    </div>
                    <div className="approval-stat-label">Pending requests</div>
                    <div className="approval-stat-value">{stats.pendingRequests}</div>
                </div>

                <div className="approval-stat-card stat-approved">
                    <div className="approval-stat-top">
                        <div className="approval-stat-icon" aria-hidden="true">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="approval-stat-badge">+{percentOfTotal(stats.approvedVehicles)}%</span>
                    </div>
                    <div className="approval-stat-label">Approved vehicles</div>
                    <div className="approval-stat-value">{stats.approvedVehicles}</div>
                </div>

                <div className="approval-stat-card stat-rejected">
                    <div className="approval-stat-top">
                        <div className="approval-stat-icon" aria-hidden="true">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <span className="approval-stat-badge">-{percentOfTotal(stats.rejectedRequests)}%</span>
                    </div>
                    <div className="approval-stat-label">Rejected requests</div>
                    <div className="approval-stat-value">{stats.rejectedRequests}</div>
                </div>

                <div className="approval-stat-card stat-total">
                    <div className="approval-stat-top">
                        <div className="approval-stat-icon" aria-hidden="true">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <span className="approval-stat-badge">+{stats.total ? 100 : 0}%</span>
                    </div>
                    <div className="approval-stat-label">Total requests</div>
                    <div className="approval-stat-value">{stats.total}</div>
                </div>
            </div>

            {error && <div className="admin-alert">{error}</div>}

            <div className="approval-card">
                <div className="approval-filters">
                    <div className="filter-search">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M11 18C14.866 18 18 14.866 18 11C18 7.13401 14.866 4 11 4C7.13401 4 4 7.13401 4 11C4 14.866 7.13401 18 11 18Z" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Quick search..."
                        />
                    </div>

                    <div className="filter-group">
                        <select className="approval-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="ALL">Status: All</option>
                            <option value="PENDING">Status: Pending</option>
                            <option value="APPROVED">Status: Approved</option>
                            <option value="REJECTED">Status: Rejected</option>
                        </select>
                        <select className="approval-select" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                            <option value="LAST_30">Last 30 Days</option>
                            <option value="LAST_7">Last 7 Days</option>
                            <option value="ALL_TIME">All Time</option>
                        </select>
                        <select className="approval-select" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                            <option value="LATEST">Sort: Latest</option>
                            <option value="OLDEST">Sort: Oldest</option>
                            <option value="PRICE_HIGH">Sort: Price High</option>
                            <option value="PRICE_LOW">Sort: Price Low</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="approval-footer">
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="approval-footer">
                        <p>Không có yêu cầu phù hợp.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="approval-table">
                            <thead>
                                <tr>
                                    <th>Vehicle</th>
                                    <th>Owner</th>
                                    <th>Location</th>
                                    <th>Price/Day</th>
                                    <th>Date Submitted</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((vehicle) => {
                                    const imageUrl = pickVehicleImage(vehicle)
                                    const owner = vehicle?.ownerId ? ownersById[vehicle.ownerId] : null
                                    const ownerName = owner?.fullName || (vehicle?.ownerId ? `Owner #${vehicle.ownerId}` : '—')
                                    const ownerEmail = owner?.email || ''
                                    const bucket = statusBucket(vehicle?.status)
                                    const canAct = String(vehicle?.status) === 'PENDING_APPROVAL'
                                    const submittedAt = vehicle?.createdAt
                                    const reviewedAt = vehicle?.reviewedAt
                                    const dateValue = canAct ? submittedAt : (reviewedAt || submittedAt)

                                    return (
                                        <tr key={vehicle.id}>
                                            <td>
                                                <div className="vehicle-cell">
                                                    <div className="vehicle-thumb">
                                                        {imageUrl ? (
                                                            <img src={imageUrl} alt={vehicleName(vehicle)} loading="lazy" />
                                                        ) : null}
                                                    </div>
                                                    <div className="vehicle-meta">
                                                        <div className="name">{vehicleName(vehicle)}</div>
                                                        <div className="sub">{vehicleSubtitle(vehicle)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="owner-cell">
                                                    <div className="owner-avatar">{initialsFrom(ownerName)}</div>
                                                    <div className="owner-meta">
                                                        <div className="name">{ownerName}</div>
                                                        <div className="email">{ownerEmail || '—'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{addressText(vehicle)}</td>
                                            <td style={{ fontWeight: 800 }}>{formatPrice(vehicle.pricePerDay)}</td>
                                            <td>{formatDate(dateValue)}</td>
                                            <td>
                                                <span className={`status-pill status-${bucket}`}>{statusLabel(vehicle.status)}</span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    {canAct ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="action-icon success"
                                                                onClick={() => onApprove(vehicle.id)}
                                                                aria-label="Approve"
                                                            >
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                                                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="action-icon danger"
                                                                onClick={() => onReject(vehicle.id)}
                                                                aria-label="Reject"
                                                            >
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                                                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                                </svg>
                                                            </button>
                                                        </>
                                                    ) : null}
                                                    <Link
                                                        to={`/admin/vehicles/${vehicle.id}`}
                                                        className="action-icon"
                                                        aria-label="View"
                                                        title="View"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                                            <path d="M2 12C4.5 7 8 5 12 5C16 5 19.5 7 22 12C19.5 17 16 19 12 19C8 19 4.5 17 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                                                            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" />
                                                        </svg>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && filtered.length > 0 && (
                    <div className="approval-footer">
                        <p>Showing {showRange} to {endRange} of {filtered.length} requests</p>
                        <div className="pagination">
                            <button className="page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                ‹
                            </button>
                            {Array.from({ length: totalPages }).slice(0, 5).map((_, index) => {
                                const p = index + 1
                                return (
                                    <button
                                        key={p}
                                        className={`page-btn ${p === currentPage ? 'active' : ''}`}
                                        onClick={() => setPage(p)}
                                    >
                                        {p}
                                    </button>
                                )
                            })}
                            <button className="page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                ›
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
