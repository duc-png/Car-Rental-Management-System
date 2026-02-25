import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { listOwnerRegistrationsForAdmin } from '../../api/adminOwnerRegistrations'
import { listAllVehicles } from '../../api/adminVehicles'
import { getCustomers } from '../../api/customers'
import { useAuth } from '../../hooks/useAuth'

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

    return (
        <>
            <header className="admin-header">
                <div>
                    <h1>Admin Dashboard</h1>
                    <p>Overview of approvals and customers</p>
                </div>
            </header>

            {loading ? (
                <div className="admin-card">Đang tải dữ liệu...</div>
            ) : (
                <div className="stats-grid">
                    <div className="stat-card">
                        <p>Owner registrations (pending)</p>
                        <h3>{stats.pendingOwnerRegs}</h3>
                    </div>
                    <div className="stat-card">
                        <p>Vehicles (pending approval)</p>
                        <h3>{stats.pendingVehicles}</h3>
                    </div>
                    <div className="stat-card">
                        <p>Total customers</p>
                        <h3>{stats.customers}</h3>
                    </div>
                </div>
            )}
        </>
    )
}
