import { useEffect, useMemo, useState } from 'react'

import { BarChart4, CarFront, LayoutDashboard, RefreshCw, Ticket, UserCheck, Users, X } from 'lucide-react'

import { toast } from 'sonner'
import { listOwnerRegistrationsForAdmin } from '../../api/adminOwnerRegistrations'
import { listAllVehicles } from '../../api/adminVehicles'
import { getCustomers } from '../../api/customers'
import { generateVoucherCode, createVoucher } from '../../api/vouchers'
import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'
import DashboardNotificationBell from '../../components/layout/DashboardNotificationBell'
import '../../styles/AdminDashboard.css'

export default function AdminDashboard() {
    const { token } = useAuth()
    const [pendingOwnerRegs, setPendingOwnerRegs] = useState([])
    const [pendingVehicles, setPendingVehicles] = useState([])
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)

    // Voucher modal state
    const [showVoucherModal, setShowVoucherModal] = useState(false)
    const [voucherCode, setVoucherCode] = useState('')
    const [discountPercent, setDiscountPercent] = useState('')
    const [quantity, setQuantity] = useState('')
    const [generatingCode, setGeneratingCode] = useState(false)
    const [creatingVoucher, setCreatingVoucher] = useState(false)

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            try {
                const [ownerRegs, vehicles, customerResp] = await Promise.all([
                    listOwnerRegistrationsForAdmin('PENDING'),
                    listAllVehicles(),
                    getCustomers(token, '')
                ])

                if (cancelled) return

                setPendingOwnerRegs(Array.isArray(ownerRegs) ? ownerRegs : [])
                const allVehicles = Array.isArray(vehicles) ? vehicles : []
                setPendingVehicles(allVehicles.filter((v) => String(v.status) === 'PENDING_APPROVAL'))
                setCustomers(customerResp?.result || [])
            } catch (error) {
                if (!cancelled) {
                    toast.error(error.message || 'Không thể tải dashboard')
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        load()
        return () => {
            cancelled = true
        }
    }, [token])

    const stats = useMemo(() => {
        return {
            pendingOwnerRegs: pendingOwnerRegs.length,
            pendingVehicles: pendingVehicles.length,
            customers: customers.length
        }
    }, [pendingOwnerRegs, pendingVehicles, customers])

    const statCards = [
        {
            key: 'ownerRegs',
            label: 'Đăng ký chủ xe chờ duyệt',
            value: stats.pendingOwnerRegs,
            icon: UserCheck
        },
        {
            key: 'vehicles',
            label: 'Xe chờ duyệt',
            value: stats.pendingVehicles,
            icon: CarFront
        },
        {
            key: 'customers',
            label: 'Tổng khách hàng',
            value: stats.customers,
            icon: Users
        }
    ]

    const recentOwnerRegs = useMemo(() => pendingOwnerRegs.slice(0, 4), [pendingOwnerRegs])
    const recentPendingVehicles = useMemo(() => pendingVehicles.slice(0, 4), [pendingVehicles])

    // Voucher handlers
    const handleOpenVoucherModal = () => {
        setVoucherCode('')
        setDiscountPercent('')
        setQuantity('')
        setShowVoucherModal(true)
    }

    const handleGenerateCode = async () => {
        setGeneratingCode(true)
        try {
            const code = await generateVoucherCode()
            setVoucherCode(code)
        } catch (err) {
            toast.error(err.message || 'Không thể tạo mã')
        } finally {
            setGeneratingCode(false)
        }
    }

    const handleCreateVoucher = async (e) => {
        e.preventDefault()

        if (!voucherCode) {
            toast.error('Vui lòng tạo mã voucher trước')
            return
        }

        const discount = parseFloat(discountPercent)
        if (isNaN(discount) || discount <= 0 || discount > 30) {
            toast.error('Giảm giá phải từ 0.01% đến 30%')
            return
        }

        const qty = parseInt(quantity, 10)
        if (isNaN(qty) || qty < 1) {
            toast.error('Số lượng phải ít nhất là 1')
            return
        }

        setCreatingVoucher(true)
        try {
            await createVoucher({
                code: voucherCode,
                discountPercent: discount,
                quantity: qty,
            })
            toast.success(`Tạo voucher ${voucherCode} thành công!`)
            setShowVoucherModal(false)
        } catch (err) {
            toast.error(err.message || 'Không thể tạo voucher')
        } finally {
            setCreatingVoucher(false)
        }
    }

    return (
        <section className="admin-dashboard-page">
            <header className="admin-dashboard-header">
                <div>
                    <h1>Tổng quan quản trị</h1>
                    <p>Chọn module ở thanh điều hướng trái hoặc từ các thẻ bên dưới.</p>
                </div>
                <div className="admin-dashboard-header-actions">
                    <button
                        className="admin-voucher-create-btn"
                        onClick={handleOpenVoucherModal}
                    >
                        <Ticket size={18} />
                        Tạo Voucher
                    </button>
                    <DashboardNotificationBell />
                </div>
            </header>

            <div className="admin-dashboard-modules-grid">
                <Link to="/admin/dashboard" className="admin-dashboard-module-card">
                    <div className="admin-dashboard-module-icon" aria-hidden="true">
                        <LayoutDashboard size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <h3>Tổng quan</h3>
                        <p>Xem nhanh thông tin hệ thống quản trị.</p>
                    </div>
                </Link>

                <Link to="/admin/vehicles" className="admin-dashboard-module-card">
                    <div className="admin-dashboard-module-icon" aria-hidden="true">
                        <CarFront size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <h3>Xe</h3>
                        <p>Quản lý danh sách và phê duyệt xe.</p>
                    </div>
                </Link>

                <Link to="/admin/owner-registrations" className="admin-dashboard-module-card">
                    <div className="admin-dashboard-module-icon" aria-hidden="true">
                        <UserCheck size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <h3>Đăng ký chủ xe</h3>
                        <p>Duyệt yêu cầu trở thành chủ xe.</p>
                    </div>
                </Link>

                <Link to="/admin/customers" className="admin-dashboard-module-card">
                    <div className="admin-dashboard-module-icon" aria-hidden="true">
                        <Users size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <h3>Khách hàng</h3>
                        <p>Quản lý thông tin và hồ sơ khách hàng.</p>
                    </div>
                </Link>

                <Link to="/admin/reports" className="admin-dashboard-module-card admin-dashboard-module-accent">
                    <div className="admin-dashboard-module-icon" aria-hidden="true">
                        <BarChart4 size={22} strokeWidth={2.2} />
                    </div>
                    <div>
                        <h3>Báo cáo</h3>
                        <p>Xem báo cáo doanh thu và thống kê đặt xe.</p>
                    </div>
                </>
            )}

            {/* Voucher Creation Modal */}
            {showVoucherModal && (
                <div className="voucher-modal-overlay" onClick={() => setShowVoucherModal(false)}>
                    <div className="voucher-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="voucher-modal-header">
                            <h2>Tạo Voucher mới</h2>
                            <button
                                className="voucher-modal-close"
                                onClick={() => setShowVoucherModal(false)}
                                aria-label="Đóng"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateVoucher} className="voucher-modal-form">
                            <div className="voucher-form-group">
                                <label htmlFor="voucher-code">Mã Voucher</label>
                                <div className="voucher-code-row">
                                    <input
                                        id="voucher-code"
                                        type="text"
                                        value={voucherCode}
                                        readOnly
                                        placeholder="Bấm nút để tạo mã"
                                        className="voucher-input voucher-code-input"
                                    />
                                    <button
                                        type="button"
                                        className="voucher-generate-btn"
                                        onClick={handleGenerateCode}
                                        disabled={generatingCode}
                                    >
                                        <RefreshCw size={16} className={generatingCode ? 'spin' : ''} />
                                        {generatingCode ? 'Đang tạo...' : 'Tạo mã'}
                                    </button>
                                </div>
                            </div>

                            <div className="voucher-form-group">
                                <label htmlFor="voucher-discount">Giảm giá (%)</label>
                                <input
                                    id="voucher-discount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max="30"
                                    value={discountPercent}
                                    onChange={(e) => setDiscountPercent(e.target.value)}
                                    placeholder="Nhập % giảm giá (tối đa 30%)"
                                    className="voucher-input"
                                    required
                                />
                            </div>

                            <div className="voucher-form-group">
                                <label htmlFor="voucher-quantity">Số lượng</label>
                                <input
                                    id="voucher-quantity"
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="Nhập số lượt sử dụng"
                                    className="voucher-input"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="voucher-submit-btn"
                                disabled={creatingVoucher || !voucherCode}
                            >
                                {creatingVoucher ? 'Đang tạo...' : 'Tạo Voucher'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
                </Link>
            </div>

            {showVoucherModal && (
                <div className="voucher-modal-overlay" onClick={() => setShowVoucherModal(false)}>
                    <div className="voucher-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="voucher-modal-header">
                            <h2>Tạo Voucher mới</h2>
                            <button
                                className="voucher-modal-close"
                                onClick={() => setShowVoucherModal(false)}
                                aria-label="Đóng"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateVoucher} className="voucher-modal-form">
                            <div className="voucher-form-group">
                                <label htmlFor="voucher-code">Mã Voucher</label>
                                <div className="voucher-code-row">
                                    <input
                                        id="voucher-code"
                                        type="text"
                                        value={voucherCode}
                                        readOnly
                                        placeholder="Bấm nút để tạo mã"
                                        className="voucher-input voucher-code-input"
                                    />
                                    <button
                                        type="button"
                                        className="voucher-generate-btn"
                                        onClick={handleGenerateCode}
                                        disabled={generatingCode}
                                    >
                                        <RefreshCw size={16} className={generatingCode ? 'spin' : ''} />
                                        {generatingCode ? 'Đang tạo...' : 'Tạo mã'}
                                    </button>
                                </div>
                            </div>

                            <div className="voucher-form-group">
                                <label htmlFor="voucher-discount">Giảm giá (%)</label>
                                <input
                                    id="voucher-discount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max="30"
                                    value={discountPercent}
                                    onChange={(e) => setDiscountPercent(e.target.value)}
                                    placeholder="Nhập % giảm giá (tối đa 30%)"
                                    className="voucher-input"
                                    required
                                />
                            </div>

                            <div className="voucher-form-group">
                                <label htmlFor="voucher-quantity">Số lượng</label>
                                <input
                                    id="voucher-quantity"
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="Nhập số lượt sử dụng"
                                    className="voucher-input"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="voucher-submit-btn"
                                disabled={creatingVoucher || !voucherCode}
                            >
                                {creatingVoucher ? 'Đang tạo...' : 'Tạo Voucher'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}

