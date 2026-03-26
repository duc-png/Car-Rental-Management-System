import { useEffect, useMemo, useState } from 'react'
import { Lock, LockOpen, Search } from 'lucide-react'
import { toast } from 'sonner'
import DashboardNotificationBell from '../../components/layout/DashboardNotificationBell'
import { useAuth } from '../../hooks/useAuth'
import { getOwnersForAdmin, updateOwnerStatus } from '../../api/owners'
import '../../styles/AdminCustomers.css'

const OWNER_VIEW = {
    ALL: 'ALL',
    ACTIVE: 'ACTIVE',
    LOCKED: 'LOCKED'
}

const formatDate = (value) => {
    if (!value) return '-'
    try {
        const date = new Date(value)
        return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
    } catch {
        return '-'
    }
}

export default function AdminOwners() {
    const { token } = useAuth()
    const [owners, setOwners] = useState([])
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState('')
    const [activeView, setActiveView] = useState(OWNER_VIEW.ALL)

    const stats = useMemo(() => {
        const totalOwners = owners.length
        const activeOwners = owners.filter((item) => item.isActive).length
        const totalTrips = owners.reduce((sum, item) => sum + Number(item.totalTrips || 0), 0)
        const avgTrips = totalOwners ? (totalTrips / totalOwners).toFixed(1) : '0'
        return { totalOwners, activeOwners, totalTrips, avgTrips }
    }, [owners])

    const filteredOwners = useMemo(() => {
        if (activeView === OWNER_VIEW.ACTIVE) {
            return owners.filter((item) => item.isActive)
        }
        if (activeView === OWNER_VIEW.LOCKED) {
            return owners.filter((item) => !item.isActive)
        }
        return owners
    }, [activeView, owners])

    const normalizeOwner = (item) => {
        const ownerId = item?.ownerId ?? item?.id ?? null
        const isActiveRaw = item?.isActive
        const isActive = isActiveRaw === null || isActiveRaw === undefined ? true : Boolean(isActiveRaw)
        return { ...item, ownerId, isActive }
    }

    const loadOwners = async (searchValue = '') => {
        try {
            setLoading(true)
            const response = await getOwnersForAdmin(token, searchValue)
            setOwners((response?.result || []).map(normalizeOwner).filter((item) => item.ownerId != null))
        } catch (error) {
            toast.error(error.message || 'Khong the tai danh sach chu xe')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!token) return
        loadOwners()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])

    useEffect(() => {
        if (!token) return
        const handler = setTimeout(() => loadOwners(query.trim()), 400)
        return () => clearTimeout(handler)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, token])

    const handleToggleStatus = async (owner) => {
        const nextStatus = !owner.isActive
        try {
            const response = await updateOwnerStatus(token, owner.ownerId, nextStatus)
            const updatedOwner = normalizeOwner(response.result || {})
            setOwners((prev) => prev.map((item) => (item.ownerId === owner.ownerId ? updatedOwner : item)))
            toast.success(nextStatus ? 'Da mo khoa chu xe' : 'Da khoa tai khoan chu xe')
        } catch (error) {
            toast.error(error.message || 'Khong the cap nhat trang thai chu xe')
        }
    }

    return (
        <div className="admin-customers-page">
            <header className="admin-customers-header">
                <div>
                    <h1>Quan ly chu xe</h1>
                    <p>Theo doi danh sach chu xe va khoa/mo khoa tai khoan</p>
                </div>
                <div className="admin-customers-header-actions">
                    <DashboardNotificationBell />
                </div>
            </header>

            <div className="admin-customers-stats-grid">
                <div className="admin-customers-stat-card">
                    <p>Tong chu xe</p>
                    <h3>{stats.totalOwners}</h3>
                </div>
                <div className="admin-customers-stat-card">
                    <p>Chu xe dang hoat dong</p>
                    <h3>{stats.activeOwners}</h3>
                </div>
                <div className="admin-customers-stat-card">
                    <p>Tong luot chuyen</p>
                    <h3>{stats.totalTrips}</h3>
                </div>
                <div className="admin-customers-stat-card">
                    <p>TB chuyen/chu xe</p>
                    <h3>{stats.avgTrips}</h3>
                </div>
            </div>

            <div className="admin-customers-table-card">
                <div className="admin-customers-table-header">
                    <div className="admin-customers-view-tabs" role="tablist" aria-label="Bo loc danh sach chu xe">
                        <button
                            type="button"
                            role="tab"
                            className={`admin-customers-view-tab ${activeView === OWNER_VIEW.ALL ? 'active' : ''}`}
                            aria-selected={activeView === OWNER_VIEW.ALL}
                            onClick={() => setActiveView(OWNER_VIEW.ALL)}
                        >
                            Tat ca chu xe
                        </button>
                        <button
                            type="button"
                            role="tab"
                            className={`admin-customers-view-tab ${activeView === OWNER_VIEW.ACTIVE ? 'active' : ''}`}
                            aria-selected={activeView === OWNER_VIEW.ACTIVE}
                            onClick={() => setActiveView(OWNER_VIEW.ACTIVE)}
                        >
                            Dang hoat dong
                        </button>
                        <button
                            type="button"
                            role="tab"
                            className={`admin-customers-view-tab ${activeView === OWNER_VIEW.LOCKED ? 'active' : ''}`}
                            aria-selected={activeView === OWNER_VIEW.LOCKED}
                            onClick={() => setActiveView(OWNER_VIEW.LOCKED)}
                        >
                            Bi khoa
                        </button>
                    </div>
                    <div className="admin-customers-search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Tim kiem ho so..."
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                    </div>
                </div>

                <div className="admin-customers-table-wrapper">
                    {loading ? (
                        <div className="admin-customers-table-empty">Dang tai du lieu...</div>
                    ) : filteredOwners.length === 0 ? (
                        <div className="admin-customers-table-empty">Chua co chu xe nao.</div>
                    ) : (
                        <table className="admin-customers-table">
                            <thead>
                                <tr>
                                    <th>Chu xe</th>
                                    <th>Lien he</th>
                                    <th>Hieu suat</th>
                                    <th>Trang thai</th>
                                    <th>Thao tac</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOwners.map((owner) => {
                                    const isLocked = !owner.isActive
                                    return (
                                        <tr key={owner.ownerId}>
                                            <td>
                                                <div className="admin-customers-customer-cell">
                                                    <div className="admin-customers-customer-avatar">
                                                        {(owner.fullName || 'O').slice(0, 1).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="admin-customers-customer-name">{owner.fullName || '-'}</p>
                                                        <p className="admin-customers-customer-email">{owner.email || '-'}</p>
                                                        <p className="admin-customers-customer-meta">Tham gia: {formatDate(owner.joinedAt)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <p>{owner.phone || '-'}</p>
                                                <p className="admin-customers-muted">Ty le phan hoi: {owner.responseRate ?? 0}%</p>
                                            </td>
                                            <td>
                                                <p className="admin-customers-price">Danh gia: {owner.avgRating ?? 0}/5</p>
                                                <p className="admin-customers-muted">Chuyen: {owner.totalTrips || 0}</p>
                                            </td>
                                            <td>
                                                <span className={`admin-customers-status-pill ${isLocked ? 'inactive' : 'active'}`}>
                                                    {isLocked ? 'Tam khoa' : 'Hoat dong'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="admin-customers-actions">
                                                    <button
                                                        className="admin-customers-icon-action"
                                                        onClick={() => handleToggleStatus(owner)}
                                                        title={isLocked ? 'Mo khoa tai khoan' : 'Khoa tai khoan'}
                                                        aria-label={isLocked ? 'Mo khoa tai khoan' : 'Khoa tai khoan'}
                                                    >
                                                        {isLocked ? <LockOpen size={16} /> : <Lock size={16} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}
