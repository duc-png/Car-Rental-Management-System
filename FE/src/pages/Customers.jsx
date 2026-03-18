import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import { createCustomer, getCustomers, updateCustomer, updateCustomerStatus } from '../api/customers'
import '../styles/Customers.css'

const emptyForm = {
    fullName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    address: ''
}

const formatCurrency = (value) => {
    const amount = Number(value || 0)
    return `${Math.round(amount).toLocaleString('vi-VN')} VNĐ`
}

const formatDate = (value) => {
    if (!value) return '—'
    try {
        const date = new Date(value)
        return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
    } catch {
        return '—'
    }
}

export default function Customers() {
    const navigate = useNavigate()
    const { token, user, logout } = useAuth()
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [submitting, setSubmitting] = useState(false)
    const [activeFilter, setActiveFilter] = useState('all')

    const stats = useMemo(() => {
        const totalCustomers = customers.length
        const activeCustomers = customers.filter((item) => item.isActive).length
        const inactiveCustomers = totalCustomers - activeCustomers
        const totalBookings = customers.reduce((sum, item) => sum + (item.totalBookings || 0), 0)
        const highValueCustomers = customers.filter((item) => Number(item.totalRevenue || 0) >= 5000000).length
        const avgBookings = totalCustomers ? (totalBookings / totalCustomers).toFixed(1) : '0'
        return { totalCustomers, activeCustomers, inactiveCustomers, totalBookings, highValueCustomers, avgBookings }
    }, [customers])

    const filteredCustomers = useMemo(() => {
        if (activeFilter === 'active') return customers.filter((item) => item.isActive)
        if (activeFilter === 'inactive') return customers.filter((item) => !item.isActive)
        if (activeFilter === 'vip') return customers.filter((item) => Number(item.totalRevenue || 0) >= 5000000)
        return customers
    }, [customers, activeFilter])

    const loadCustomers = useCallback(async (searchValue = '') => {
        try {
            setLoading(true)
            const response = await getCustomers(token, searchValue)
            setCustomers(response.result || [])
        } catch (error) {
            toast.error(error.message || 'Không thể tải khách hàng')
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        if (!token) {
            navigate('/login')
            return
        }
        if (!user?.role?.includes('ROLE_ADMIN')) {
            navigate('/')
            return
        }
        loadCustomers()
    }, [token, user, navigate, loadCustomers])

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    useEffect(() => {
        if (!token || !user?.role?.includes('ROLE_ADMIN')) {
            return
        }

        const handler = setTimeout(() => {
            loadCustomers(query.trim())
        }, 400)

        return () => clearTimeout(handler)
    }, [query, token, user, loadCustomers])

    const openCreateModal = () => {
        setEditingCustomer(null)
        setForm(emptyForm)
        setModalOpen(true)
    }

    const openEditModal = (customer) => {
        setEditingCustomer(customer)
        setForm({
            fullName: customer.fullName || '',
            email: customer.email || '',
            phone: customer.phone || '',
            licenseNumber: customer.licenseNumber || '',
            address: customer.address || ''
        })
        setModalOpen(true)
    }

    const closeModal = () => {
        if (submitting) return
        setModalOpen(false)
    }

    const handleChange = (event) => {
        const { name, value } = event.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        try {
            setSubmitting(true)
            if (editingCustomer) {
                const response = await updateCustomer(token, editingCustomer.id, form)
                setCustomers((prev) =>
                    prev.map((item) => (item.id === editingCustomer.id ? response.result : item))
                )
                toast.success('Đã cập nhật khách hàng')
            } else {
                const response = await createCustomer(token, form)
                setCustomers((prev) => [response.result, ...prev])
                toast.success('Đã thêm khách hàng mới')
            }
            setModalOpen(false)
        } catch (error) {
            toast.error(error.message || 'Không thể lưu khách hàng')
        } finally {
            setSubmitting(false)
        }
    }

    const handleToggleStatus = async (customer) => {
        const nextStatus = !customer.isActive
        try {
            const response = await updateCustomerStatus(token, customer.id, nextStatus)
            setCustomers((prev) =>
                prev.map((item) => (item.id === customer.id ? response.result : item))
            )
            toast.success(`Đã ${nextStatus ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản`)
        } catch (error) {
            toast.error(error.message || 'Không thể cập nhật trạng thái')
        }
    }

    return (
        <div className="customers-page">
            <div className="admin-shell">
                <aside className="admin-sidebar">
                    <div className="brand-block">
                        <div className="brand-icon">C</div>
                        <div>
                            <p className="brand-title">CarRental Pro</p>
                            <p className="brand-subtitle">Management System</p>
                        </div>
                    </div>

                    <nav className="admin-nav">
                        <p className="nav-section">Navigation</p>
                        <button className="nav-item">Dashboard</button>
                        <button className="nav-item">Vehicles</button>
                        <button className="nav-item">Bookings</button>
                        <button className="nav-item active">Customers</button>
                        <Link to="/admin/reports" className="nav-item">Reports</Link>
                    </nav>

                    <nav className="admin-nav">
                        <p className="nav-section">System</p>
                        <button className="nav-item">Settings</button>
                    </nav>

                    <div className="admin-profile">
                        <div className="profile-avatar">AD</div>
                        <div>
                            <p className="profile-name">Admin User</p>
                            <p className="profile-email">admin@carrental.com</p>
                        </div>
                        <button className="btn-outline" onClick={handleLogout}>
                            Log out
                        </button>
                    </div>
                </aside>

                <section className="admin-content">
                    <header className="customers-header">
                        <div>
                            <h1>Customer Dashboard</h1>
                            <p>Theo dõi hồ sơ thuê xe, mức độ hoạt động và doanh thu theo khách hàng.</p>
                        </div>
                        <div className="customers-header-actions">
                            <button className="btn-outline" onClick={() => loadCustomers(query.trim())}>
                                Làm mới dữ liệu
                            </button>
                            <button className="btn-primary" onClick={openCreateModal}>
                                + Thêm khách hàng
                            </button>
                        </div>
                    </header>

                    <div className="stats-grid">
                        <div className="stat-card stat-card-accent">
                            <p>Tổng khách hàng</p>
                            <h3>{stats.totalCustomers}</h3>
                            <span className="stat-footnote">Toàn bộ hồ sơ trong hệ thống</span>
                        </div>
                        <div className="stat-card">
                            <p>Đang hoạt động</p>
                            <h3>{stats.activeCustomers}</h3>
                            <span className="stat-footnote">Khách có thể đặt xe bình thường</span>
                        </div>
                        <div className="stat-card">
                            <p>Đã vô hiệu</p>
                            <h3>{stats.inactiveCustomers}</h3>
                            <span className="stat-footnote">Tài khoản đang bị tạm khóa</span>
                        </div>
                        <div className="stat-card">
                            <p>Khách giá trị cao</p>
                            <h3>{stats.highValueCustomers}</h3>
                            <span className="stat-footnote">Doanh thu từ 5.000.000 VNĐ</span>
                        </div>
                        <div className="stat-card">
                            <p>Tổng lượt booking</p>
                            <h3>{stats.totalBookings}</h3>
                            <span className="stat-footnote">Tổng booking của tất cả khách</span>
                        </div>
                        <div className="stat-card">
                            <p>TB booking / khách</p>
                            <h3>{stats.avgBookings}</h3>
                            <span className="stat-footnote">Tần suất sử dụng dịch vụ</span>
                        </div>
                    </div>

                    <div className="customers-table-card">
                        <div className="table-header">
                            <div>
                                <h2>Danh sách khách hàng</h2>
                                <p>Quản trị thông tin liên hệ, tình trạng tài khoản và doanh thu.</p>
                                <div className="customer-filters">
                                    <button
                                        type="button"
                                        className={`customer-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                                        onClick={() => setActiveFilter('all')}
                                    >
                                        Tất cả ({customers.length})
                                    </button>
                                    <button
                                        type="button"
                                        className={`customer-filter-btn ${activeFilter === 'active' ? 'active' : ''}`}
                                        onClick={() => setActiveFilter('active')}
                                    >
                                        Active ({stats.activeCustomers})
                                    </button>
                                    <button
                                        type="button"
                                        className={`customer-filter-btn ${activeFilter === 'inactive' ? 'active' : ''}`}
                                        onClick={() => setActiveFilter('inactive')}
                                    >
                                        Inactive ({stats.inactiveCustomers})
                                    </button>
                                    <button
                                        type="button"
                                        className={`customer-filter-btn ${activeFilter === 'vip' ? 'active' : ''}`}
                                        onClick={() => setActiveFilter('vip')}
                                    >
                                        Giá trị cao ({stats.highValueCustomers})
                                    </button>
                                </div>
                            </div>
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên, email hoặc số điện thoại..."
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                />
                            </div>
                        </div>

                        <div className="table-wrapper">
                            {loading ? (
                                <div className="table-empty">Đang tải dữ liệu...</div>
                            ) : filteredCustomers.length === 0 ? (
                                <div className="table-empty">Chưa có khách hàng nào.</div>
                            ) : (
                                <table className="customers-table">
                                    <thead>
                                        <tr>
                                            <th>Khách hàng</th>
                                            <th>Liên hệ</th>
                                            <th>GPLX</th>
                                            <th>Doanh thu</th>
                                            <th>Trạng thái</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCustomers.map((customer) => (
                                            <tr key={customer.id}>
                                                <td>
                                                    <div className="customer-cell">
                                                        <div className="avatar">
                                                            {customer.fullName?.charAt(0) || 'C'}
                                                        </div>
                                                        <div>
                                                            <p className="customer-name">{customer.fullName}</p>
                                                            <p className="customer-meta">
                                                                Tham gia {formatDate(customer.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <p>{customer.email}</p>
                                                    <p className="customer-meta">{customer.phone || '—'}</p>
                                                </td>
                                                <td>{customer.licenseNumber || '—'}</td>
                                                <td>{formatCurrency(customer.totalRevenue)}</td>
                                                <td>
                                                    <span
                                                        className={`status-pill ${customer.isActive ? 'active' : 'inactive'}`}
                                                    >
                                                        {customer.isActive ? 'Đang hoạt động' : 'Đang khóa'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="table-actions">
                                                        <button
                                                            className="btn-light"
                                                            onClick={() => openEditModal(customer)}
                                                        >
                                                            Xem chi tiết
                                                        </button>
                                                        <button
                                                            className="btn-outline"
                                                            onClick={() => handleToggleStatus(customer)}
                                                        >
                                                            {customer.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {modalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3>{editingCustomer ? 'Chi tiết khách hàng' : 'Thêm khách hàng mới'}</h3>
                                <p>Nhập thông tin hồ sơ khách hàng.</p>
                            </div>
                            <button className="modal-close" onClick={closeModal}>
                                ✕
                            </button>
                        </div>

                        <form className="modal-form" onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <label>
                                    Họ và tên
                                    <input
                                        type="text"
                                        name="fullName"
                                        placeholder="Nguyen Van A"
                                        value={form.fullName}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>
                                <label>
                                    Email
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="john@example.com"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>
                                <label>
                                    Số điện thoại
                                    <input
                                        type="text"
                                        name="phone"
                                        placeholder="09xx xxx xxx"
                                        value={form.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>
                                <label>
                                    Số GPLX
                                    <input
                                        type="text"
                                        name="licenseNumber"
                                        placeholder="DL123456789"
                                        value={form.licenseNumber}
                                        onChange={handleChange}
                                    />
                                </label>
                            </div>
                            <label className="full-width">
                                Địa chỉ
                                <input
                                    type="text"
                                    name="address"
                                    placeholder="Số nhà, phường/xã, quận/huyện, tỉnh/thành"
                                    value={form.address}
                                    onChange={handleChange}
                                />
                            </label>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal}>
                                    Hủy
                                </button>
                                <button type="submit" className="btn-primary" disabled={submitting}>
                                    {submitting ? 'Đang lưu...' : editingCustomer ? 'Lưu thay đổi' : 'Thêm khách hàng'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
