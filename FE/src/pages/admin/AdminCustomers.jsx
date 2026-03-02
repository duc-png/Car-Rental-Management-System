import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../hooks/useAuth'
import { createCustomer, getCustomers, updateCustomer, updateCustomerStatus } from '../../api/customers'
import DashboardNotificationBell from '../../components/DashboardNotificationBell'
import '../../styles/Customers.css'

const emptyForm = {
    fullName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    address: ''
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
    const { token } = useAuth()
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [submitting, setSubmitting] = useState(false)

    const stats = useMemo(() => {
        const totalCustomers = customers.length
        const activeCustomers = customers.filter((item) => item.isActive).length
        const totalBookings = customers.reduce((sum, item) => sum + (item.totalBookings || 0), 0)
        const avgBookings = totalCustomers ? (totalBookings / totalCustomers).toFixed(1) : '0'
        return { totalCustomers, activeCustomers, totalBookings, avgBookings }
    }, [customers])

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

    return (
        <div className="customers-page" style={{ background: 'transparent' }}>
            <header className="customers-header">
                <div>
                    <h1>Quản lý khách hàng</h1>
                    <p>Quản lý danh sách khách hàng trên hệ thống</p>
                </div>
                <div className="customers-header-actions">
                    <DashboardNotificationBell />
                    <button className="btn-primary" onClick={openCreateModal}>
                        + Thêm khách hàng
                    </button>
                </div>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <p>Tổng khách hàng</p>
                    <h3>{stats.totalCustomers}</h3>
                </div>
                <div className="stat-card">
                    <p>Khách hàng đang hoạt động</p>
                    <h3>{stats.activeCustomers}</h3>
                </div>
                <div className="stat-card">
                    <p>Tổng lượt đặt xe</p>
                    <h3>{stats.totalBookings}</h3>
                </div>
                <div className="stat-card">
                    <p>TB lượt đặt/khách</p>
                    <h3>{stats.avgBookings}</h3>
                </div>
            </div>

            <div className="customers-table-card">
                <div className="table-header">
                    <div>
                        <h2>Danh sách khách hàng</h2>
                        <p>Toàn bộ hồ sơ khách hàng</p>
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
                    ) : customers.length === 0 ? (
                        <div className="table-empty">Chưa có khách hàng nào.</div>
                    ) : (
                        <table className="customers-table">
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
                                {customers.map((customer) => (
                                    <tr key={customer.id}>
                                        <td>
                                            <div className="customer-cell">
                                                <div className="customer-avatar">{(customer.fullName || 'U').slice(0, 1).toUpperCase()}</div>
                                                <div>
                                                    <p className="customer-name">{customer.fullName || '—'}</p>
                                                    <p className="customer-email">{customer.email || '—'}</p>
                                                    <p className="customer-meta">Tham gia: {formatDate(customer.createdAt)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p>{customer.phone || '—'}</p>
                                            <p className="muted">{customer.address || '—'}</p>
                                        </td>
                                        <td>
                                            <p>{customer.licenseNumber || '—'}</p>
                                        </td>
                                        <td>
                                            <p className="price">{formatCurrency(customer.totalRevenue)}</p>
                                            <p className="muted">Lượt đặt: {customer.totalBookings || 0}</p>
                                        </td>
                                        <td>
                                            <span className={`status-pill ${customer.isActive ? 'active' : 'inactive'}`}>
                                                {customer.isActive ? 'Hoạt động' : 'Tạm khóa'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="actions">
                                                <button className="btn-outline" onClick={() => openEditModal(customer)}>Sửa</button>
                                                <button className="btn-outline" onClick={() => handleToggleStatus(customer)}>
                                                    {customer.isActive ? 'Khóa' : 'Mở khóa'}
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

            {modalOpen && (
                <div className="modal-backdrop" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) closeModal()
                }}>
                    <div className="modal-card">
                        <div className="modal-header">
                            <div>
                                <h2>{editingCustomer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng'}</h2>
                                <p>Nhập thông tin khách hàng bên dưới</p>
                            </div>
                            <button className="btn-outline" onClick={closeModal} disabled={submitting}>Đóng</button>
                        </div>
                        <form className="modal-form" onSubmit={handleSubmit}>
                            <div className="form-grid">
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
                                <label className="full-width">
                                    Địa chỉ
                                    <input name="address" value={form.address} onChange={handleChange} />
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button className="btn-primary" type="submit" disabled={submitting}>
                                    {submitting ? 'Đang lưu...' : 'Lưu'}
                                </button>
                                <button className="btn-outline" type="button" onClick={closeModal} disabled={submitting}>Hủy</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
