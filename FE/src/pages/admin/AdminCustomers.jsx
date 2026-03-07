import { useEffect, useMemo, useState } from 'react'
import { Lock, LockOpen, Search, ShieldCheck } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuth'
import {
    createCustomer,
    getCustomers,
    updateCustomer,
    updateCustomerStatus
} from '../../api/customers'
import DashboardNotificationBell from '../../components/layout/DashboardNotificationBell'
import '../../styles/AdminCustomers.css'

const emptyForm = {
    fullName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    address: ''
}

const CUSTOMER_VIEW = {
    ALL: 'ALL',
    PENDING_LICENSE: 'PENDING_LICENSE',
    LOCKED: 'LOCKED'
}

const formatCurrency = (value) => {
    const amount = Number(value || 0)
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
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

export default function AdminCustomers() {
    const navigate = useNavigate()
    const location = useLocation()
    const { token } = useAuth()
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState('')
    const [activeView, setActiveView] = useState(CUSTOMER_VIEW.ALL)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [submitting, setSubmitting] = useState(false)

    const getLicenseVerificationMeta = (statusValue) => {
        const status = String(statusValue || '').trim().toUpperCase()
        if (status === 'APPROVED') {
            return { text: 'Đã duyệt', className: 'license-approved' }
        }
        if (status === 'REJECTED') {
            return { text: 'Từ chối', className: 'license-rejected' }
        }
        if (status === 'PENDING') {
            return { text: 'Chờ duyệt', className: 'license-pending' }
        }
        return { text: 'Chưa gửi', className: 'license-unsubmitted' }
    }

    const stats = useMemo(() => {
        const totalCustomers = customers.length
        const activeCustomers = customers.filter((item) => item.isActive).length
        const totalBookings = customers.reduce((sum, item) => sum + (item.totalBookings || 0), 0)
        const avgBookings = totalCustomers ? (totalBookings / totalCustomers).toFixed(1) : '0'
        return { totalCustomers, activeCustomers, totalBookings, avgBookings }
    }, [customers])

    const pendingLicenseCount = useMemo(
        () => customers.filter((item) => String(item.licenseVerificationStatus || '').trim().toUpperCase() === 'PENDING').length,
        [customers]
    )

    const filteredCustomers = useMemo(() => {
        if (activeView === CUSTOMER_VIEW.PENDING_LICENSE) {
            return customers.filter((item) => String(item.licenseVerificationStatus || '').trim().toUpperCase() === 'PENDING')
        }

        if (activeView === CUSTOMER_VIEW.LOCKED) {
            return customers.filter((item) => !item.isActive)
        }

        return customers
    }, [activeView, customers])

    const loadCustomers = async (searchValue = '') => {
        try {
            setLoading(true)
            const response = await getCustomers(token, searchValue)
            setCustomers(response.result || [])
        } catch (error) {
            toast.error(error.message || 'Không thể tải khách hàng')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadCustomers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])

    useEffect(() => {
        const requestedView = String(location.state?.activeView || '').trim().toUpperCase()
        if (!requestedView) return

        if (requestedView === CUSTOMER_VIEW.PENDING_LICENSE) {
            setActiveView(CUSTOMER_VIEW.PENDING_LICENSE)
            return
        }

        if (requestedView === CUSTOMER_VIEW.LOCKED) {
            setActiveView(CUSTOMER_VIEW.LOCKED)
            return
        }

        setActiveView(CUSTOMER_VIEW.ALL)
    }, [location.state])

    useEffect(() => {
        if (!token) return

        const handler = setTimeout(() => {
            loadCustomers(query.trim())
        }, 400)

        return () => clearTimeout(handler)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, token])

    const openCreateModal = () => {
        setEditingCustomer(null)
        setForm(emptyForm)
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
                setCustomers((prev) => prev.map((item) => (item.id === editingCustomer.id ? response.result : item)))
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
            setCustomers((prev) => prev.map((item) => (item.id === customer.id ? response.result : item)))
            toast.success(`Đã ${nextStatus ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản`)
        } catch (error) {
            toast.error(error.message || 'Không thể cập nhật trạng thái')
        }
    }

    const renderActionCell = (customer) => {
        if (activeView === CUSTOMER_VIEW.PENDING_LICENSE) {
            return (
                <button
                    className="admin-customers-btn admin-customers-btn-outline"
                    onClick={() => navigate(`/admin/customers/${customer.id}/license-review`, { state: { customer } })}
                    title="Duyệt GPLX"
                >
                    <ShieldCheck size={15} />
                    <span>Duyệt GPLX</span>
                </button>
            )
        }

        const isLocked = !customer.isActive
        return (
            <button
                className="admin-customers-icon-action"
                onClick={() => handleToggleStatus(customer)}
                title={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                aria-label={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
            >
                {isLocked ? <LockOpen size={16} /> : <Lock size={16} />}
            </button>
        )
    }

    return (
        <div className="admin-customers-page">
            <header className="admin-customers-header">
                <div>
                    <h1>Quản lý khách hàng</h1>
                    <p>Quản lý danh sách khách hàng trên hệ thống</p>
                </div>
                <div className="admin-customers-header-actions">
                    <DashboardNotificationBell />
                    <button className="admin-customers-btn admin-customers-btn-primary" onClick={openCreateModal}>
                        + Thêm khách hàng
                    </button>
                </div>
            </header>

            <div className="admin-customers-stats-grid">
                <div className="admin-customers-stat-card">
                    <p>Tổng khách hàng</p>
                    <h3>{stats.totalCustomers}</h3>
                </div>
                <div className="admin-customers-stat-card">
                    <p>Khách hàng đang hoạt động</p>
                    <h3>{stats.activeCustomers}</h3>
                </div>
                <div className="admin-customers-stat-card">
                    <p>Tổng lượt đặt xe</p>
                    <h3>{stats.totalBookings}</h3>
                </div>
                <div className="admin-customers-stat-card">
                    <p>TB lượt đặt/khách</p>
                    <h3>{stats.avgBookings}</h3>
                </div>
            </div>

            <div className="admin-customers-table-card">
                <div className="admin-customers-table-header">
                    <div className="admin-customers-view-tabs" role="tablist" aria-label="Bộ lọc danh sách khách hàng">
                        <button
                            type="button"
                            role="tab"
                            className={`admin-customers-view-tab ${activeView === CUSTOMER_VIEW.ALL ? 'active' : ''}`}
                            aria-selected={activeView === CUSTOMER_VIEW.ALL}
                            onClick={() => setActiveView(CUSTOMER_VIEW.ALL)}
                        >
                            Tất cả khách hàng
                        </button>
                        <button
                            type="button"
                            role="tab"
                            className={`admin-customers-view-tab ${activeView === CUSTOMER_VIEW.PENDING_LICENSE ? 'active' : ''}`}
                            aria-selected={activeView === CUSTOMER_VIEW.PENDING_LICENSE}
                            onClick={() => setActiveView(CUSTOMER_VIEW.PENDING_LICENSE)}
                        >
                            Chờ duyệt GPLX
                            {pendingLicenseCount > 0 ? (
                                <span className="admin-customers-view-badge">{pendingLicenseCount}</span>
                            ) : null}
                        </button>
                        <button
                            type="button"
                            role="tab"
                            className={`admin-customers-view-tab ${activeView === CUSTOMER_VIEW.LOCKED ? 'active' : ''}`}
                            aria-selected={activeView === CUSTOMER_VIEW.LOCKED}
                            onClick={() => setActiveView(CUSTOMER_VIEW.LOCKED)}
                        >
                            Bị khóa
                        </button>
                    </div>
                    <div className="admin-customers-search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm hồ sơ..."
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                    </div>
                </div>

                <div className="admin-customers-table-wrapper">
                    {loading ? (
                        <div className="admin-customers-table-empty">Đang tải dữ liệu...</div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="admin-customers-table-empty">Chưa có khách hàng nào.</div>
                    ) : (
                        <table className="admin-customers-table">
                            <thead>
                                <tr>
                                    <th>Khách hàng</th>
                                    <th>Liên hệ</th>
                                    <th>Bằng lái</th>
                                    <th>Doanh thu</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>
                                            <div className="admin-customers-customer-cell">
                                                <div className="admin-customers-customer-avatar">{(customer.fullName || 'U').slice(0, 1).toUpperCase()}</div>
                                                <div>
                                                    <p className="admin-customers-customer-name">{customer.fullName || '—'}</p>
                                                    <p className="admin-customers-customer-email">{customer.email || '—'}</p>
                                                    <p className="admin-customers-customer-meta">Tham gia: {formatDate(customer.createdAt)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p>{customer.phone || '—'}</p>
                                            <p className="admin-customers-muted">{customer.address || '—'}</p>
                                        </td>
                                        <td>
                                            <span className={`admin-customers-status-pill ${getLicenseVerificationMeta(customer.licenseVerificationStatus).className}`}>
                                                {getLicenseVerificationMeta(customer.licenseVerificationStatus).text}
                                            </span>
                                        </td>
                                        <td>
                                            <p className="admin-customers-price">{formatCurrency(customer.totalRevenue)}</p>
                                            <p className="admin-customers-muted">Lượt đặt: {customer.totalBookings || 0}</p>
                                        </td>
                                        <td>
                                            <span className={`admin-customers-status-pill ${customer.isActive ? 'active' : 'inactive'}`}>
                                                {customer.isActive ? 'Hoạt động' : 'Tạm khóa'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="admin-customers-actions">
                                                {renderActionCell(customer)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {modalOpen && (
                <div className="admin-customers-modal-backdrop" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) closeModal()
                }}>
                    <div className="admin-customers-modal-card">
                        <div className="admin-customers-modal-header">
                            <div>
                                <h2>{editingCustomer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng'}</h2>
                                <p>Nhập thông tin khách hàng bên dưới</p>
                            </div>
                            <button className="admin-customers-btn admin-customers-btn-outline" onClick={closeModal} disabled={submitting}>Đóng</button>
                        </div>
                        <form className="admin-customers-modal-form" onSubmit={handleSubmit}>
                            <div className="admin-customers-form-grid">
                                <label>
                                    Họ và tên
                                    <input name="fullName" value={form.fullName} onChange={handleChange} required />
                                </label>
                                <label>
                                    Email
                                    <input type="email" name="email" value={form.email} onChange={handleChange} required />
                                </label>
                                <label>
                                    Số điện thoại
                                    <input name="phone" value={form.phone} onChange={handleChange} />
                                </label>
                                <label>
                                    Số bằng lái
                                    <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange} />
                                </label>
                                <label className="admin-customers-full-width">
                                    Địa chỉ
                                    <input name="address" value={form.address} onChange={handleChange} />
                                </label>
                            </div>
                            <div className="admin-customers-modal-actions">
                                <button className="admin-customers-btn admin-customers-btn-primary" type="submit" disabled={submitting}>
                                    {submitting ? 'Đang lưu...' : 'Lưu'}
                                </button>
                                <button className="admin-customers-btn admin-customers-btn-outline" type="button" onClick={closeModal} disabled={submitting}>Hủy</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
