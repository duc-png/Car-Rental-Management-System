import { useEffect, useMemo, useState } from 'react'
import { CarFront, UserCheck, Users } from 'lucide-react'
import { toast } from 'sonner'
import { listOwnerRegistrationsForAdmin } from '../../api/adminOwnerRegistrations'
import { listAllVehicles } from '../../api/adminVehicles'
import { getCustomers } from '../../api/customers'
import { useAuth } from '../../hooks/useAuth'
import DashboardNotificationBell from '../../components/layout/DashboardNotificationBell'
import '../../styles/AdminDashboard.css'

export default function AdminDashboard() {
    const { token } = useAuth()
    const [pendingOwnerRegs, setPendingOwnerRegs] = useState([])
    const [pendingVehicles, setPendingVehicles] = useState([])
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)

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

    return (
        <section className="admin-dashboard-page">
            <header className="admin-dashboard-header">
                <div>
                    <h1>Tổng quan quản trị</h1>
                    <p>Theo dõi nhanh yêu cầu duyệt và số lượng khách hàng</p>
                </div>
                <DashboardNotificationBell />
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
        </section>
    )
}
