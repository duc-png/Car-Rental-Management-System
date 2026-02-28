import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/CarOwnerFleet.css'
import FleetSidebar from '../../components/owner/fleet/FleetSidebar'
import FleetOverview from '../../components/owner/fleet/FleetOverview'
import FleetFilters from '../../components/owner/fleet/FleetFilters'
import FleetListTable from '../../components/owner/fleet/FleetListTable'
import { FleetAddCard, FleetGridCard } from '../../components/owner/fleet/FleetGridCard'
import FleetCreateModal from '../../components/owner/fleet/FleetCreateModal'

import { createVehicleModel, listVehicleModels } from '../../api/vehicleModels'
import { listBrands } from '../../api/brands'

import {
    createOwnerVehicle,
    deleteOwnerVehicle,
    getVehicleDetail,
    listOwnerVehicles,
    uploadVehicleImages
} from '../../api/ownerVehicles'
import {
    ALL_STATUS_LABEL,
    createEmptyVehicleForm,
    FUEL_VALUES,
    formatEnumLabel,
    STATUS_VALUES,
    TRANSMISSION_VALUES,
    vehicleDisplayName
} from '../../utils/ownerFleetUtils'

function CarOwnerFleet() {
    const navigate = useNavigate()
    const { user, isAuthenticated, logout } = useAuth()
    const [searchParams] = useSearchParams()
    const ownerIdParam = searchParams.get('ownerId')
    const ownerIdFromUser = user?.userId || user?.id
    const ownerId = ownerIdFromUser ?? (ownerIdParam ? Number(ownerIdParam) : null)
    const canManage = Boolean(user?.role?.includes('ROLE_CAR_OWNER') || user?.role?.includes('ROLE_ADMIN'))

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const [search, setSearch] = useState('')
    const [status, setStatus] = useState(ALL_STATUS_LABEL)
    const [currentPage, setCurrentPage] = useState(1)

    const [viewMode, setViewMode] = useState('grid')

    const [vehicles, setVehicles] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [vehicleModels, setVehicleModels] = useState([])
    const [modelsLoading, setModelsLoading] = useState(false)
    const [modelsError, setModelsError] = useState('')

    const [brands, setBrands] = useState([])
    const [brandsLoading, setBrandsLoading] = useState(false)
    const [brandsError, setBrandsError] = useState('')

    const [showCreateForm, setShowCreateForm] = useState(false)
    const [creating, setCreating] = useState(false)
    const [createForm, setCreateForm] = useState(createEmptyVehicleForm)

    const [createBrandName, setCreateBrandName] = useState('')
    const [createModelName, setCreateModelName] = useState('')
    const [createTypeName, setCreateTypeName] = useState('')
    const [createUploadFiles, setCreateUploadFiles] = useState([])
    const [createSetFirstAsMain, setCreateSetFirstAsMain] = useState(true)

    const closeCreateModal = useCallback(() => {
        setCreateForm(createEmptyVehicleForm())
        setCreateBrandName('')
        setCreateModelName('')
        setCreateUploadFiles([])
        setCreateSetFirstAsMain(true)
        setShowCreateForm(false)
    }, [])

    useEffect(() => {
        if (!showCreateForm) return

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                closeCreateModal()
            }
        }

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', onKeyDown)

        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener('keydown', onKeyDown)
        }
    }, [showCreateForm, closeCreateModal])

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            if (!isAuthenticated) {
                setVehicles([])
                setError('Vui lòng đăng nhập bằng tài khoản chủ xe')
                return
            }

            if (!canManage) {
                setVehicles([])
                setError('Tài khoản hiện tại không đủ quyền quản lý xe')
                return
            }

            if (!ownerId || Number.isNaN(ownerId)) {
                setVehicles([])
                setError('Không tìm thấy ID chủ xe. Hãy đăng nhập lại hoặc truyền ownerId.')
                return
            }

            setLoading(true)
            setError('')
            try {
                const data = await listOwnerVehicles(ownerId)
                if (!cancelled) {
                    setVehicles(data)
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err?.message || 'Không thể tải danh sách xe')
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
    }, [ownerId, isAuthenticated, canManage])

    useEffect(() => {
        let cancelled = false

        const loadModels = async () => {
            setModelsLoading(true)
            setModelsError('')
            try {
                const data = await listVehicleModels()
                if (!cancelled) {
                    setVehicleModels(Array.isArray(data) ? data : [])
                }
            } catch (err) {
                if (!cancelled) {
                    setVehicleModels([])
                    setModelsError(err?.message || 'Không thể tải danh sách mẫu xe')
                }
            } finally {
                if (!cancelled) {
                    setModelsLoading(false)
                }
            }
        }

        loadModels()
        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        let cancelled = false

        const loadBrands = async () => {
            setBrandsLoading(true)
            setBrandsError('')
            try {
                const data = await listBrands()
                if (!cancelled) {
                    setBrands(Array.isArray(data) ? data : [])
                }
            } catch (err) {
                if (!cancelled) {
                    setBrands([])
                    setBrandsError(err?.message || 'Không thể tải danh sách hãng xe')
                }
            } finally {
                if (!cancelled) {
                    setBrandsLoading(false)
                }
            }
        }

        loadBrands()
        return () => {
            cancelled = true
        }
    }, [])

    const ITEMS_PER_PAGE = 8

    const stats = useMemo(() => {
        const total = vehicles.length
        const available = vehicles.filter(vehicle => vehicle.status === 'AVAILABLE').length
        const rented = vehicles.filter(vehicle => vehicle.status === 'RENTED').length
        const maintenance = vehicles.filter(vehicle => vehicle.status === 'MAINTENANCE').length
        return { total, available, rented, maintenance }
    }, [vehicles])

    const availabilityRate = useMemo(() => {
        if (!stats.total) return 0
        return Math.round((stats.available / stats.total) * 100)
    }, [stats.total, stats.available])

    const statuses = useMemo(() => {
        const seen = vehicles
            .map((vehicle) => vehicle?.status)
            .filter(Boolean)
            .map((s) => String(s))
        const unique = Array.from(new Set(seen))
        const sorted = STATUS_VALUES.filter((s) => unique.includes(s)).concat(unique.filter((s) => !STATUS_VALUES.includes(s)))
        return [ALL_STATUS_LABEL, ...sorted]
    }, [vehicles])

    const filteredVehicles = useMemo(() => {
        return vehicles.filter((vehicle) => {
            const haystack = `${vehicleDisplayName(vehicle)} ${vehicle?.licensePlate || ''}`.toLowerCase()
            const matchesSearch = haystack.includes(search.toLowerCase())
            const matchesStatus = status === ALL_STATUS_LABEL || String(vehicle?.status) === String(status)
            return matchesSearch && matchesStatus
        })
    }, [vehicles, search, status])

    const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE)

    const paginatedVehicles = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredVehicles.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    }, [filteredVehicles, currentPage])

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Reset to page 1 when filters change
    const handleSearchChange = (value) => {
        setSearch(value)
        setCurrentPage(1)
    }

    const handleStatusChange = (value) => {
        setStatus(value)
        setCurrentPage(1)
    }

    const viewDetails = (vehicle) => {
        if (!vehicle?.id) return
        const ownerQuery = ownerId ? `?ownerId=${ownerId}` : ''
        navigate(`/owner/vehicles/${vehicle.id}${ownerQuery}`)
    }

    const startEdit = (vehicle) => {
        if (!vehicle?.id) return
        const ownerQuery = ownerId ? `?ownerId=${ownerId}` : ''
        navigate(`/owner/vehicles/${vehicle.id}/edit${ownerQuery}`)
    }

    const updateCreateField = (field, value) => {
        setCreateForm((prev) => ({
            ...prev,
            [field]: value
        }))
    }

    const resetCreateForm = () => {
        setCreateForm(createEmptyVehicleForm())
        setCreateBrandName('')
        setCreateModelName('')
        setCreateTypeName('')
        setCreateUploadFiles([])
        setCreateSetFirstAsMain(true)
    }

    const carTypeOptions = useMemo(() => {
        const types = vehicleModels
            .map((m) => m?.typeName)
            .filter(Boolean)
            .map((name) => String(name).trim())
            .filter((name) => name && name.toLowerCase() !== 'unknown')

        return Array.from(new Set(types)).sort((a, b) => a.localeCompare(b))
    }, [vehicleModels])

    const brandOptions = useMemo(() => {
        const fromBrandsTable = brands
            .map((b) => b?.name)
            .filter(Boolean)
            .map((name) => String(name).trim())
            .filter(Boolean)

        // fallback nếu API brands lỗi -> derive từ models
        const fromModels = vehicleModels
            .map((model) => model?.brandName)
            .filter(Boolean)
            .map((name) => String(name).trim())
            .filter(Boolean)

        const merged = fromBrandsTable.length > 0 ? fromBrandsTable : fromModels
        return Array.from(new Set(merged)).sort((a, b) => a.localeCompare(b))
    }, [brands, vehicleModels])

    const modelOptionsForBrand = useMemo(() => {
        if (!createBrandName) return []
        return vehicleModels
            .filter((m) => String(m?.brandName || '').trim() === String(createBrandName).trim())
            .slice()
            .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))
    }, [vehicleModels, createBrandName])

    const selectedExistingModel = useMemo(() => {
        const typed = String(createModelName || '').trim()
        if (!typed) return null
        return modelOptionsForBrand.find((m) => String(m?.name || '').trim().toLowerCase() === typed.toLowerCase()) || null
    }, [createModelName, modelOptionsForBrand])

    useEffect(() => {
        if (!selectedExistingModel) return
        const typeName = String(selectedExistingModel?.typeName || '').trim()
        if (typeName && typeName.toLowerCase() !== 'unknown') {
            setCreateTypeName(typeName)
        }
    }, [selectedExistingModel])

    const createVehicle = async () => {
        if (!ownerId || Number.isNaN(ownerId)) {
            setError('Không tìm thấy ID chủ xe')
            return
        }

        if (!String(createBrandName || '').trim()) {
            setError('Vui lòng chọn hãng xe')
            return
        }

        if (!String(createModelName || '').trim()) {
            setError('Vui lòng nhập mẫu xe')
            return
        }

        const selectedTypeName = String(createTypeName || '').trim()
        const existingTypeName = String(selectedExistingModel?.typeName || '').trim()
        const existingTypeKnown = existingTypeName && existingTypeName.toLowerCase() !== 'unknown'
        const needsType = !selectedExistingModel || !existingTypeKnown
        if (needsType && !selectedTypeName) {
            setError('Vui lòng nhập loại xe (VD: Sedan, SUV, Hatchback...)')
            return
        }

        const requiredFields = ['licensePlate', 'seatCount', 'pricePerDay', 'currentKm', 'province', 'ward', 'addressDetail']
        for (const field of requiredFields) {
            if (!String(createForm[field] ?? '').trim()) {
                setError(`Thiếu thông tin bắt buộc: ${field}`)
                return
            }
        }

        setCreating(true)
        setError('')
        try {
            let modelId = selectedExistingModel?.id ? Number(selectedExistingModel.id) : null

            const shouldUpsertModelType =
                Boolean(modelId) &&
                String(selectedExistingModel?.typeName || '').trim().toLowerCase() === 'unknown' &&
                Boolean(String(createTypeName || '').trim())

            if (!modelId) {
                const createdModel = await createVehicleModel({
                    brandName: createBrandName,
                    modelName: createModelName,
                    typeName: String(createTypeName || '').trim()
                })
                if (!createdModel?.id) {
                    throw new Error('Không thể tạo mẫu xe mới')
                }
                modelId = Number(createdModel.id)
                setVehicleModels((prev) => {
                    const exists = prev.some((m) => String(m?.id) === String(createdModel.id))
                    return exists ? prev : [createdModel, ...prev]
                })
            } else if (shouldUpsertModelType) {
                const updatedModel = await createVehicleModel({
                    brandName: createBrandName,
                    modelName: createModelName,
                    typeName: String(createTypeName || '').trim()
                })
                if (updatedModel?.id) {
                    setVehicleModels((prev) => prev.map((m) => (String(m?.id) === String(updatedModel.id) ? updatedModel : m)))
                }
            }

            if (!modelId || Number.isNaN(modelId)) {
                throw new Error('Vui lòng chọn mẫu xe hợp lệ')
            }

            const payload = {
                ownerId,
                modelId,
                licensePlate: String(createForm.licensePlate).trim(),
                color: String(createForm.color || '').trim() || null,
                seatCount: Number(createForm.seatCount),
                transmission: createForm.transmission || null,
                fuelType: createForm.fuelType || null,
                pricePerDay: Number(createForm.pricePerDay),
                year: String(createForm.year || '').trim() ? Number(createForm.year) : null,
                fuelConsumption: String(createForm.fuelConsumption || '').trim() ? Number(createForm.fuelConsumption) : null,
                description: String(createForm.description || '').trim() || null,
                currentKm: Number(createForm.currentKm),
                locationId: null,
                location: {
                    province: String(createForm.province || '').trim(),
                    ward: String(createForm.ward || '').trim(),
                    addressDetail: String(createForm.addressDetail || '').trim(),
                }
            }

            const created = await createOwnerVehicle(payload)

            if (created) {
                setVehicles((prev) => [created, ...prev])
            }

            if (created?.id && createUploadFiles.length > 0) {
                await uploadVehicleImages(created.id, ownerId, createUploadFiles, { setFirstAsMain: createSetFirstAsMain })
                const detail = await getVehicleDetail(created.id)
                if (detail) {
                    setVehicles((prev) => prev.map((v) => (v.id === detail.id ? detail : v)))
                }
            }

            resetCreateForm()
            setShowCreateForm(false)
        } catch (err) {
            setError(err?.message || 'Không thể tạo xe mới')
        } finally {
            setCreating(false)
        }
    }

    const onDeleteVehicle = async (vehicleId) => {
        if (!ownerId || Number.isNaN(ownerId)) {
            setError('Thiếu ownerId. Vui lòng đăng nhập lại hoặc truyền /owner/fleet?ownerId=1')
            return
        }

        const confirmed = window.confirm('Bạn có chắc muốn xóa xe này không?')
        if (!confirmed) return

        setError('')
        try {
            await deleteOwnerVehicle(vehicleId, ownerId)
            setVehicles((prev) => prev.filter((v) => v.id !== vehicleId))
        } catch (err) {
            setError(err?.message || 'Không thể xóa xe')
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="fleet-guard">
                <h2>Vui lòng đăng nhập</h2>
                <p>Chỉ tài khoản chủ xe mới có thể truy cập trang này.</p>
                <Link to="/login" className="add-vehicle">Đăng nhập ngay</Link>
            </div>
        )
    }

    if (!canManage) {
        return (
            <div className="fleet-guard">
                <h2>Không đủ quyền truy cập</h2>
                <p>Vui lòng đăng nhập bằng tài khoản chủ xe.</p>
                <Link to="/" className="add-vehicle">Quay lại trang chủ</Link>
            </div>
        )
    }

    return (
        <div className="fleet-dashboard">
            <FleetSidebar user={user} onLogout={handleLogout} />

            <section className="fleet-main">
                <header className="fleet-header">
                    <div>
                        <p className="fleet-breadcrumb">Chủ xe </p>
                        <h1>Quản lý xe</h1>
                        <p>Quản lý danh sách xe của bạn</p>
                    </div>
                    <div className="fleet-header-actions">
                        <button className="add-vehicle" onClick={() => setShowCreateForm(true)}>
                            + Thêm xe mới
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="fleet-alert" role="alert">
                        {error}
                    </div>
                )}

                {modelsError && (
                    <div className="fleet-alert" role="alert">
                        {modelsError}
                    </div>
                )}

                {brandsError && (
                    <div className="fleet-alert" role="alert">
                        {brandsError}
                    </div>
                )}

                <FleetCreateModal
                    open={showCreateForm}
                    onClose={closeCreateModal}
                    brandsLoading={brandsLoading}
                    brandOptions={brandOptions}
                    createBrandName={createBrandName}
                    setCreateBrandName={setCreateBrandName}
                    setCreateModelName={setCreateModelName}
                    setCreateTypeName={setCreateTypeName}
                    updateCreateField={updateCreateField}
                    createModelName={createModelName}
                    modelsLoading={modelsLoading}
                    modelOptionsForBrand={modelOptionsForBrand}
                    createTypeName={createTypeName}
                    selectedExistingModel={selectedExistingModel}
                    carTypeOptions={carTypeOptions}
                    createForm={createForm}
                    transmissionValues={TRANSMISSION_VALUES}
                    fuelValues={FUEL_VALUES}
                    formatEnumLabel={formatEnumLabel}
                    setCreateUploadFiles={setCreateUploadFiles}
                    createSetFirstAsMain={createSetFirstAsMain}
                    setCreateSetFirstAsMain={setCreateSetFirstAsMain}
                    creating={creating}
                    onCreate={createVehicle}
                />

                <FleetOverview stats={stats} availabilityRate={availabilityRate} />

                <FleetFilters
                    search={search}
                    onSearchChange={handleSearchChange}
                    status={status}
                    statuses={statuses}
                    onStatusChange={handleStatusChange}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    formatEnumLabel={formatEnumLabel}
                    allStatusLabel={ALL_STATUS_LABEL}
                />

                <div className={`fleet-grid ${viewMode === 'list' ? 'fleet-grid--list' : ''}`.trim()}>
                    {loading ? (
                        <div className="fleet-loading">Đang tải...</div>
                    ) : (
                        viewMode === 'list' ? (
                            <FleetListTable
                                vehicles={paginatedVehicles}
                                onViewDetails={viewDetails}
                                onEdit={startEdit}
                                onDelete={onDeleteVehicle}
                            />
                        ) : (
                            <>
                                {paginatedVehicles.map((vehicle) => (
                                    <FleetGridCard
                                        key={vehicle.id}
                                        vehicle={vehicle}
                                        onViewDetails={viewDetails}
                                        onEdit={startEdit}
                                        onDelete={onDeleteVehicle}
                                    />
                                ))}

                                <FleetAddCard onAdd={() => setShowCreateForm(true)} />
                            </>
                        )
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="fleet-pagination">
                        <button
                            type="button"
                            className="pagination-button"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            ← Trước
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
                            Sau →
                        </button>
                    </div>
                )}
            </section>
        </div>
    )
}

export default CarOwnerFleet
