import { useMemo, useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import { getOwnerVehicles } from '../api/cars'
import '../styles/CarOwnerFleet.css'

const categories = ['All Categories', 'Luxury', 'Sedan', 'Sports', 'SUV', 'Electric', 'Compact']
const statuses = ['All Status', 'Available', 'Rented', 'Maintenance']

const formatPrice = (value) => {
    if (value == null) return '—'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))
}

/** Map API VehicleResponse to fleet card shape */
const mapVehicleToCard = (v) => {
    const mainImg = v.images?.find((i) => i.isMain) || v.images?.[0]
    return {
        id: v.id,
        name: [v.brandName, v.modelName].filter(Boolean).join(' ') || 'Xe',
        plate: v.licensePlate,
        price: v.pricePerDay,
        type: v.carTypeName || '—',
        status: v.status || 'AVAILABLE',
        seats: v.seatCount ?? '—',
        fuel: v.fuelType ?? '—',
        transmission: v.transmission ?? '—',
        image: mainImg?.imageUrl || '/placeholder.svg'
    }
}

function CarOwnerFleet() {
    const location = useLocation()
    const navigate = useNavigate()
    const { token, user, logout } = useAuth()
    const [apiVehicles, setApiVehicles] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState(categories[0])
    const [status, setStatus] = useState(statuses[0])
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        if (!token) {
            navigate('/login')
            return
        }
        if (!user?.role?.includes('ROLE_EXPERT')) {
            navigate('/')
            return
        }
        const load = async () => {
            try {
                setLoading(true)
                const list = await getOwnerVehicles(token, user?.userId)
                setApiVehicles(Array.isArray(list) ? list.map(mapVehicleToCard) : [])
            } catch (e) {
                toast.error(e.message || 'Không tải được danh sách xe')
                setApiVehicles([])
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [token, user?.userId, user?.role, navigate])

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const ITEMS_PER_PAGE = 8

    const stats = useMemo(() => {
        const total = apiVehicles.length
        const available = apiVehicles.filter((v) => v.status === 'AVAILABLE').length
        const rented = apiVehicles.filter((v) => v.status === 'RENTED').length
        const maintenance = apiVehicles.filter((v) => v.status === 'MAINTENANCE').length
        return { total, available, rented, maintenance }
    }, [apiVehicles])

    const vehicles = useMemo(() => {
        return apiVehicles.filter((vehicle) => {
            const matchesSearch = vehicle.name.toLowerCase().includes(search.toLowerCase()) ||
                (vehicle.plate && vehicle.plate.toLowerCase().includes(search.toLowerCase()))
            const matchesCategory = category === 'All Categories' || vehicle.type === category
            const matchesStatus = status === 'All Status' || String(vehicle.status).toLowerCase() === status.toLowerCase()
            return matchesSearch && matchesCategory && matchesStatus
        })
    }, [apiVehicles, search, category, status])

    const totalPages = Math.ceil(vehicles.length / ITEMS_PER_PAGE)

    const paginatedVehicles = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
        return vehicles.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    }, [vehicles, currentPage])

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Reset to page 1 when filters change
    const handleSearchChange = (value) => {
        setSearch(value)
        setCurrentPage(1)
    }

    const handleCategoryChange = (value) => {
        setCategory(value)
        setCurrentPage(1)
    }

    const handleStatusChange = (value) => {
        setStatus(value)
        setCurrentPage(1)
    }

    return (
        <div className="fleet-dashboard">
            <aside className="fleet-sidebar">
                <Link to="/" className="fleet-brand">
                    <div className="brand-icon">
                        CR
                    </div>
                    <div>
                        <h3>CarRental System</h3>
                        <p>Fleet Management</p>
                    </div>
                </Link>

                <div className="fleet-nav">
                    <p className="nav-section">Navigation</p>
                    <Link to="/owner/fleet" className={`nav-item ${location.pathname === '/owner/fleet' ? 'active' : ''}`}>Fleet</Link>
                    <Link to="/owner/analytics" className={`nav-item ${location.pathname === '/owner/analytics' ? 'active' : ''}`}>Analytics</Link>
                </div>

                <div className="fleet-system">
                    <p className="nav-section">System</p>
                    <button type="button" className="nav-item">Settings</button>
                </div>

                <div className="fleet-user">
                    <div className="fleet-user-row">
                        <div className="user-avatar">CO</div>
                        <div className="user-info">
                            <p className="user-name">Car Owner</p>
                            <p className="user-email">{user?.email || '—'}</p>
                        </div>
                    </div>
                    <button type="button" className="fleet-logout-btn" onClick={handleLogout}>Đăng xuất</button>
                </div>
            </aside>

            <section className="fleet-main">
                <header className="fleet-header">
                    <div>
                        <p className="fleet-breadcrumb">Car Owner / Fleet</p>
                        <h1>Fleet Management</h1>
                        <p>Manage your vehicle inventory</p>
                    </div>
                    <div className="fleet-header-actions">
                        <button className="add-vehicle">+ Add Vehicle</button>
                    </div>
                </header>

                <div className="fleet-overview">
                    <div className="overview-card">
                        <p>Total Vehicles</p>
                        <h3>{stats.total}</h3>
                        <span>All listed vehicles</span>
                    </div>
                    <div className="overview-card">
                        <p>Available</p>
                        <h3>{stats.available}</h3>
                        <span>Ready for booking</span>
                    </div>
                    <div className="overview-card">
                        <p>Rented</p>
                        <h3>{stats.rented}</h3>
                        <span>On the road</span>
                    </div>
                    <div className="overview-card">
                        <p>Maintenance</p>
                        <h3>{stats.maintenance}</h3>
                        <span>In service</span>
                    </div>
                </div>

                <div className="fleet-filters">
                    <div className="search-field">
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc biển số..."
                            value={search}
                            onChange={(event) => handleSearchChange(event.target.value)}
                        />
                    </div>
                    <select value={category} onChange={(event) => handleCategoryChange(event.target.value)}>
                        {categories.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>
                    <select value={status} onChange={(event) => handleStatusChange(event.target.value)}>
                        {statuses.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>
                </div>

                <div className="fleet-grid">
                    {loading ? (
                        <div className="fleet-loading">Đang tải danh sách xe...</div>
                    ) : paginatedVehicles.length === 0 ? (
                        <div className="fleet-empty">Chưa có xe nào. Thêm xe để bắt đầu.</div>
                    ) : (
                        paginatedVehicles.map((vehicle) => (
                            <article className="fleet-card" key={vehicle.id}>
                                <div className="fleet-image">
                                    <img src={vehicle.image} alt={vehicle.name} />
                                    <span className={`status-badge  ${String(vehicle.status).toLowerCase()}`}>
                                        {vehicle.status === 'AVAILABLE' ? 'Có sẵn' : vehicle.status === 'RENTED' ? 'Đang thuê' : vehicle.status === 'MAINTENANCE' ? 'Bảo trì' : vehicle.status}
                                    </span>
                                </div>

                                <div className="fleet-card-body">
                                    <h3>{vehicle.name}</h3>
                                    <p className="fleet-subtitle">{vehicle.plate}</p>

                                    <div className="fleet-meta">
                                        <span className="meta-chip">
                                            <span className="meta-label">Seats</span>
                                            <span className="meta-value">{vehicle.seats}</span>
                                        </span>
                                        <span className="meta-chip">
                                            <span className="meta-label">Fuel</span>
                                            <span className="meta-value">{vehicle.fuel}</span>
                                        </span>
                                        <span className="meta-chip">
                                            <span className="meta-label">Trans</span>
                                            <span className="meta-value">{vehicle.transmission}</span>
                                        </span>
                                    </div>

                                    <div className="fleet-pricing">
                                        <div>
                                            <span className="label">/ ngày</span>
                                            <strong>{formatPrice(vehicle.price)}</strong>
                                        </div>
                                        <span className="type-pill">{vehicle.type}</span>
                                    </div>

                                    <div className="fleet-actions">
                                        <Link to={`/car/${vehicle.id}`} className="btn-outline">Xem</Link>
                                        <button type="button" className="btn-outline danger">Xóa</button>
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </div>

                {!loading && totalPages > 1 && (
                    <div className="fleet-pagination">
                        <button
                            type="button"
                            className="pagination-button"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            ← Previous
                        </button>

                        {[...Array(totalPages)].map((_, index) => {
                            const page = index + 1
                            return (
                                <button
                                    key={page}
                                    type="button"
                                    className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                                    onClick={() => handlePageChange(page)}
                                >
                                    {page}
                                </button>
                            )
                        })}

                        <button
                            type="button"
                            className="pagination-button"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </section>
        </div>
    )
}

export default CarOwnerFleet
