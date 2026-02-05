import { useEffect, useMemo, useState } from 'react'
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

export default function Customers() {
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
    }, [])

    useEffect(() => {
        const handler = setTimeout(() => {
            loadCustomers(query.trim())
        }, 400)

        return () => clearTimeout(handler)
    }, [query])

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
                        <button className="nav-item">Fleet</button>
                        <button className="nav-item">Bookings</button>
                        <button className="nav-item active">Customers</button>
                        <button className="nav-item">Analytics</button>
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
                    </div>
                </aside>

                <section className="admin-content">
                    <header className="customers-header">
                        <div>
                            <h1>Customer Management</h1>
                            <p>Manage your customer database</p>
                        </div>
                        <button className="btn-primary" onClick={openCreateModal}>
                            + Add Customer
                        </button>
                    </header>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <p>Total Customers</p>
                            <h3>{stats.totalCustomers}</h3>
                        </div>
                        <div className="stat-card">
                            <p>Active Customers</p>
                            <h3>{stats.activeCustomers}</h3>
                        </div>
                        <div className="stat-card">
                            <p>Total Bookings</p>
                            <h3>{stats.totalBookings}</h3>
                        </div>
                        <div className="stat-card">
                            <p>Avg. Bookings/Customer</p>
                            <h3>{stats.avgBookings}</h3>
                        </div>
                    </div>

                    <div className="customers-table-card">
                        <div className="table-header">
                            <div>
                                <h2>All Customers</h2>
                                <p>Complete customer directory</p>
                            </div>
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or phone..."
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
                                            <th>Customer</th>
                                            <th>Contact</th>
                                            <th>License</th>
                                            <th>Revenue</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customers.map((customer) => (
                                            <tr key={customer.id}>
                                                <td>
                                                    <div className="customer-cell">
                                                        <div className="avatar">
                                                            {customer.fullName?.charAt(0) || 'C'}
                                                        </div>
                                                        <div>
                                                            <p className="customer-name">{customer.fullName}</p>
                                                            <p className="customer-meta">
                                                                Joined {formatDate(customer.createdAt)}
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
                                                        {customer.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="table-actions">
                                                        <button
                                                            className="btn-light"
                                                            onClick={() => openEditModal(customer)}
                                                        >
                                                            View Details
                                                        </button>
                                                        <button
                                                            className="btn-outline"
                                                            onClick={() => handleToggleStatus(customer)}
                                                        >
                                                            {customer.isActive ? 'Deactivate' : 'Activate'}
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
                                <h3>{editingCustomer ? 'Customer Details' : 'Add New Customer'}</h3>
                                <p>Enter customer information</p>
                            </div>
                            <button className="modal-close" onClick={closeModal}>
                                ✕
                            </button>
                        </div>

                        <form className="modal-form" onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <label>
                                    Full Name
                                    <input
                                        type="text"
                                        name="fullName"
                                        placeholder="John Doe"
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
                                    Phone Number
                                    <input
                                        type="text"
                                        name="phone"
                                        placeholder="+84 123 456 789"
                                        value={form.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                </label>
                                <label>
                                    License Number
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
                                Address
                                <input
                                    type="text"
                                    name="address"
                                    placeholder="123 Main St, City, State, ZIP"
                                    value={form.address}
                                    onChange={handleChange}
                                />
                            </label>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : editingCustomer ? 'Save Changes' : 'Add Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
