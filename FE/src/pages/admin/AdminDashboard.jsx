import { useEffect, useMemo, useState } from 'react'
import { CarFront, UserCheck, Users, Ticket, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'
import { listOwnerRegistrationsForAdmin } from '../../api/adminOwnerRegistrations'
import { listAllVehicles } from '../../api/adminVehicles'
import { getCustomers } from '../../api/customers'
import { generateVoucherCode, createVoucher } from '../../api/vouchers'
import { useAuth } from '../../hooks/useAuth'
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
                    <p>Theo dõi nhanh yêu cầu duyệt và số lượng khách hàng</p>
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

            {loading ? (
                <div className="admin-dashboard-card">Đang tải dữ liệu...</div>
            ) : (
                <>
                    <div className="admin-dashboard-stats-grid">
                        {statCards.map((item) => {
                            const Icon = item.icon
                            return (
                                <div key={item.key} className="admin-dashboard-stat-card">
                                    <div className="admin-dashboard-stat-icon" aria-hidden="true">
                                        <Icon size={20} strokeWidth={2.2} />
                                    </div>
                                    <div>
                                        <p>{item.label}</p>
                                        <h3>{item.value}</h3>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="admin-dashboard-panels-grid">
                        <article className="admin-dashboard-panel">
                            <div className="admin-dashboard-panel-head">
                                <h3>Đăng ký chủ xe chờ duyệt</h3>
                                <span>{pendingOwnerRegs.length}</span>
                            </div>
                            {recentOwnerRegs.length === 0 ? (
                                <p className="admin-dashboard-empty">Hiện chưa có đăng ký đang chờ duyệt.</p>
                            ) : (
                                <ul className="admin-dashboard-list">
                                    {recentOwnerRegs.map((item) => (
                                        <li key={item.id}>
                                            <strong>{item.fullName || 'Chủ xe'}</strong>
                                            <span>{item.email || item.phone || 'Không có liên hệ'}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </article>

                        <article className="admin-dashboard-panel">
                            <div className="admin-dashboard-panel-head">
                                <h3>Xe chờ duyệt gần nhất</h3>
                                <span>{pendingVehicles.length}</span>
                            </div>
                            {recentPendingVehicles.length === 0 ? (
                                <p className="admin-dashboard-empty">Không có xe nào đang chờ duyệt.</p>
                            ) : (
                                <ul className="admin-dashboard-list">
                                    {recentPendingVehicles.map((item) => (
                                        <li key={item.id}>
                                            <strong>{item.brandName || 'Xe'} {item.modelName || ''}</strong>
                                            <span>{item.licensePlate || 'Chưa có biển số'}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </article>

                        <article className="admin-dashboard-panel admin-dashboard-panel-wide">
                            <div className="admin-dashboard-panel-head">
                                <h3>Khách hàng mới</h3>
                                <span>{customers.length}</span>
                            </div>
                            {customers.length === 0 ? (
                                <p className="admin-dashboard-empty">Chưa có dữ liệu khách hàng.</p>
                            ) : (
                                <ul className="admin-dashboard-list">
                                    {customers.slice(0, 6).map((item) => (
                                        <li key={item.id}>
                                            <strong>{item.fullName || 'Khách hàng'}</strong>
                                            <span>{item.email || 'Không có email'}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </article>
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
        </section>
    )
}

