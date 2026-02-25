import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/CarOwnerFleet.css'

import { createVehicleModel, listVehicleModels } from '../../api/vehicleModels'
import { listBrands } from '../../api/brands'

import {
    addVehicleImagesByUrl,
    createOwnerVehicle,
    deleteOwnerVehicle,
    deleteVehicleImage,
    getVehicleDetail,
    listOwnerVehicles,
    setMainVehicleImage,
    updateOwnerVehicle,
    updateOwnerVehicleStatus,
    uploadVehicleImages
} from '../../api/ownerVehicles'

const STATUS_VALUES = ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'PENDING_APPROVAL', 'REJECTED']
const TRANSMISSION_VALUES = ['MANUAL', 'AUTOMATIC']
const FUEL_VALUES = ['GASOLINE', 'DIESEL', 'ELECTRIC']

const ALL_STATUS_LABEL = 'Tất cả trạng thái'

const createEmptyVehicleForm = () => ({
    modelId: '',
    licensePlate: '',
    color: '',
    seatCount: '',
    transmission: '',
    fuelType: '',
    pricePerDay: '',
    year: '',
    fuelConsumption: '',
    description: '',
    currentKm: '',
    province: '',
    ward: '',
    addressDetail: ''
})

const formatEnumLabel = (value) => {
    if (!value) return ''

    const normalized = String(value).trim().toUpperCase()
    const map = {
        MANUAL: 'Số sàn',
        AUTOMATIC: 'Số tự động',
        GASOLINE: 'Xăng',
        DIESEL: 'Dầu diesel',
        ELECTRIC: 'Điện',
        AVAILABLE: 'Sẵn sàng',
        RENTED: 'Đang thuê',
        MAINTENANCE: 'Bảo dưỡng',
        PENDING_APPROVAL: 'Chờ duyệt',
        REJECTED: 'Bị từ chối'
    }
    if (map[normalized]) return map[normalized]

    return String(value)
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
}

const formatPrice = (value) => {
    if (value == null || value === '') return '0 VNĐ'
    const numberValue = typeof value === 'number' ? value : Number(value)
    if (Number.isNaN(numberValue)) return '0 VNĐ'

    const formatted = new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numberValue)

    return `${formatted} VNĐ`
}

const statusCssClass = (status) => (status ? String(status).toLowerCase().replaceAll('_', '-') : 'unknown')

const getVehicleThumbnailUrl = (vehicle) => {
    const images = Array.isArray(vehicle?.images) ? vehicle.images : []
    if (images.length === 0) return null

    const main = images.find((img) => Boolean(img?.isMain)) || images[0]
    const url = main?.imageUrl || main?.url || null
    return url && String(url).trim() ? String(url).trim() : null
}

const formatCarTypeLabel = (value) => {
    if (value == null) return ''
    const trimmed = String(value).trim()
    if (!trimmed) return ''
    if (trimmed.toLowerCase() === 'unknown') return ''
    return trimmed
}

const vehicleDisplayName = (vehicle) => {
    const brand = vehicle?.brandName ? String(vehicle.brandName).trim() : ''
    const model = vehicle?.modelName ? String(vehicle.modelName).trim() : ''
    const combined = `${brand} ${model}`.trim()
    return combined || `Xe #${vehicle?.id ?? ''}`
}

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
    const [category, setCategory] = useState('')
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

    const [editingVehicleId, setEditingVehicleId] = useState(null)
    const [editForm, setEditForm] = useState(null)
    const [saving, setSaving] = useState(false)
    const [statusUpdating, setStatusUpdating] = useState(false)
    const [imagesUpdating, setImagesUpdating] = useState(false)
    const [imageUrlsInput, setImageUrlsInput] = useState('')
    const [setFirstAsMain, setSetFirstAsMain] = useState(false)
    const [uploadFiles, setUploadFiles] = useState([])

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

    const categories = useMemo(() => {
        const typeNames = vehicles
            .map((vehicle) => vehicle?.carTypeName)
            .filter(Boolean)
            .map((v) => String(v))
            .filter((name) => name.trim() && name.trim().toLowerCase() !== 'unknown')
        const unique = Array.from(new Set(typeNames)).sort((a, b) => a.localeCompare(b))
        return unique
    }, [vehicles])

    useEffect(() => {
        if (category && !categories.includes(category)) {
            setCategory('')
        }
    }, [categories, category])

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
            const matchesCategory = !category || vehicle?.carTypeName === category
            const matchesStatus = status === ALL_STATUS_LABEL || String(vehicle?.status) === String(status)
            return matchesSearch && matchesCategory && matchesStatus
        })
    }, [vehicles, search, category, status])

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

    const upsertVehicle = (nextVehicle) => {
        setVehicles((prev) => prev.map((v) => (v.id === nextVehicle.id ? nextVehicle : v)))
    }

    const refreshVehicle = async (vehicleId) => {
        const detail = await getVehicleDetail(vehicleId)
        if (detail) {
            upsertVehicle(detail)
        }
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

    const cancelEdit = () => {
        setEditingVehicleId(null)
        setEditForm(null)
        setImageUrlsInput('')
        setSetFirstAsMain(false)
        setUploadFiles([])
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

    const saveEdit = async () => {
        if (!editingVehicleId || !editForm) return
        if (!ownerId || Number.isNaN(ownerId)) {
            setError('Thiếu ownerId. Vui lòng đăng nhập lại hoặc truyền /owner/fleet?ownerId=1')
            return
        }

        const requiredFields = ['modelId', 'licensePlate', 'seatCount', 'pricePerDay', 'currentKm']
        for (const field of requiredFields) {
            if (!String(editForm[field] ?? '').trim()) {
                setError(`Thiếu thông tin bắt buộc: ${field}`)
                return
            }
        }

        setSaving(true)
        setError('')
        try {
            const payload = {
                modelId: Number(editForm.modelId),
                licensePlate: String(editForm.licensePlate).trim(),
                color: String(editForm.color || '').trim() || null,
                seatCount: Number(editForm.seatCount),
                transmission: editForm.transmission || null,
                fuelType: editForm.fuelType || null,
                pricePerDay: Number(editForm.pricePerDay),
                year: String(editForm.year || '').trim() ? Number(editForm.year) : null,
                fuelConsumption: String(editForm.fuelConsumption || '').trim() ? Number(editForm.fuelConsumption) : null,
                description: String(editForm.description || '').trim() || null,
                currentKm: Number(editForm.currentKm),
                locationId: String(editForm.province || '').trim() && String(editForm.ward || '').trim() && String(editForm.addressDetail || '').trim()
                    ? null
                    : (String(editForm.locationId || '').trim() ? Number(editForm.locationId) : null),
                location: String(editForm.province || '').trim() && String(editForm.ward || '').trim() && String(editForm.addressDetail || '').trim()
                    ? {
                        province: String(editForm.province || '').trim(),
                        ward: String(editForm.ward || '').trim(),
                        addressDetail: String(editForm.addressDetail || '').trim(),
                    }
                    : null
            }

            const updated = await updateOwnerVehicle(editingVehicleId, ownerId, payload)
            if (updated) {
                upsertVehicle(updated)
            }
            cancelEdit()
        } catch (err) {
            setError(err?.message || 'Không thể cập nhật xe')
        } finally {
            setSaving(false)
        }
    }

    const saveStatus = async () => {
        if (!editingVehicleId || !editForm) return
        if (!ownerId || Number.isNaN(ownerId)) {
            setError('Thiếu ownerId. Vui lòng đăng nhập lại hoặc truyền /owner/fleet?ownerId=1')
            return
        }
        if (!editForm.status) {
            setError('Vui lòng chọn trạng thái')
            return
        }

        setStatusUpdating(true)
        setError('')
        try {
            const updated = await updateOwnerVehicleStatus(editingVehicleId, ownerId, editForm.status)
            if (updated) {
                upsertVehicle(updated)
            }
        } catch (err) {
            setError(err?.message || 'Không thể cập nhật trạng thái')
        } finally {
            setStatusUpdating(false)
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
            if (editingVehicleId === vehicleId) {
                cancelEdit()
            }
        } catch (err) {
            setError(err?.message || 'Không thể xóa xe')
        }
    }

    const onAddImageUrls = async () => {
        if (!editingVehicleId || !ownerId || Number.isNaN(ownerId)) return
        const urls = imageUrlsInput
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
        if (urls.length === 0) return

        setImagesUpdating(true)
        setError('')
        try {
            await addVehicleImagesByUrl(editingVehicleId, ownerId, { imageUrls: urls, setFirstAsMain })
            await refreshVehicle(editingVehicleId)
            setImageUrlsInput('')
            setSetFirstAsMain(false)
        } catch (err) {
            setError(err?.message || 'Không thể thêm ảnh')
        } finally {
            setImagesUpdating(false)
        }
    }

    const onUploadImages = async () => {
        if (!editingVehicleId || !ownerId || Number.isNaN(ownerId)) return
        if (!uploadFiles || uploadFiles.length === 0) return

        setImagesUpdating(true)
        setError('')
        try {
            await uploadVehicleImages(editingVehicleId, ownerId, uploadFiles, { setFirstAsMain })
            await refreshVehicle(editingVehicleId)
            setUploadFiles([])
            setSetFirstAsMain(false)
        } catch (err) {
            setError(err?.message || 'Không thể tải ảnh lên')
        } finally {
            setImagesUpdating(false)
        }
    }

    const onSetMainImage = async (imageId) => {
        if (!editingVehicleId || !ownerId || Number.isNaN(ownerId)) return
        setImagesUpdating(true)
        setError('')
        try {
            await setMainVehicleImage(editingVehicleId, ownerId, imageId)
            await refreshVehicle(editingVehicleId)
        } catch (err) {
            setError(err?.message || 'Không thể đặt ảnh chính')
        } finally {
            setImagesUpdating(false)
        }
    }

    const onDeleteImage = async (imageId) => {
        if (!editingVehicleId || !ownerId || Number.isNaN(ownerId)) return
        const confirmed = window.confirm('Bạn có chắc muốn xóa ảnh này không?')
        if (!confirmed) return
        setImagesUpdating(true)
        setError('')
        try {
            await deleteVehicleImage(editingVehicleId, ownerId, imageId)
            await refreshVehicle(editingVehicleId)
        } catch (err) {
            setError(err?.message || 'Không thể xóa ảnh')
        } finally {
            setImagesUpdating(false)
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
            <aside className="fleet-sidebar">
                <Link to="/" className="fleet-brand">
                    <div className="brand-icon">
                        <img src="/favicon.svg" alt="Hệ thống CarRental" />
                    </div>
                    <div>
                        <h3>Hệ thống CarRental</h3>
                        <p>Quản lý đội xe</p>
                    </div>
                </Link>

                <div className="fleet-nav">
                    <p className="nav-section">Điều hướng</p>
                    <button type="button" className="nav-item">Tổng quan</button>
                    <button type="button" className="nav-item active">Xe của tôi</button>
                    <button type="button" className="nav-item">Đơn thuê</button>
                    <button type="button" className="nav-item">Khách hàng</button>
                    <button type="button" className="nav-item">Thống kê</button>
                </div>

                <div className="fleet-system">
                    <p className="nav-section">Hệ thống</p>
                    <button type="button" className="nav-item">Cài đặt</button>
                    <button type="button" className="nav-item fleet-logout" onClick={handleLogout}>
                        <span className="fleet-logout-icon" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M10 17L5 12L10 7"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M5 12H19"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>
                        Đăng xuất
                    </button>
                </div>

                <div className="fleet-user">
                    <div className="user-avatar">{(user?.fullName || 'CO').slice(0, 2).toUpperCase()}</div>
                    <div className="user-info">
                        <p className="user-name">{user?.fullName || 'Chủ xe'}</p>
                        <p className="user-email">{user?.email || 'owner@carrental.com'}</p>
                    </div>
                </div>
            </aside>

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

                {showCreateForm && (
                    <div
                        className="fleet-modal-backdrop"
                        role="dialog"
                        aria-modal="true"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                closeCreateModal()
                            }
                        }}
                    >
                        <div className="fleet-modal">
                            <section className="fleet-create">
                                <div className="fleet-create-header">
                                    <div>
                                        <h2>Tạo xe mới</h2>
                                        <p>Nhập thông tin cơ bản để thêm xe vào hệ thống.</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-outline"
                                        onClick={closeCreateModal}
                                    >
                                        Đóng
                                    </button>
                                </div>
                                <div className="fleet-create-grid">
                                    <label>
                                        Hãng xe
                                        <select
                                            value={createBrandName}
                                            onChange={(event) => {
                                                const nextBrand = event.target.value
                                                setCreateBrandName(nextBrand)
                                                setCreateModelName('')
                                                setCreateTypeName('')
                                                updateCreateField('modelId', '')
                                            }}
                                            disabled={brandsLoading}
                                        >
                                            <option value="">{brandsLoading ? 'Đang tải...' : 'Chọn hãng xe'}</option>
                                            {brandOptions.map((brand) => (
                                                <option key={brand} value={brand}>{brand}</option>
                                            ))}
                                        </select>
                                    </label>

                                    <label>
                                        Mẫu xe
                                        <input
                                            type="text"
                                            value={createModelName}
                                            onChange={(event) => {
                                                setCreateModelName(event.target.value)
                                                updateCreateField('modelId', '')
                                            }}
                                            placeholder={!createBrandName ? 'Chọn hãng trước' : 'Chọn mẫu xe...'}
                                            disabled={modelsLoading || !createBrandName}
                                            list="fleet-model-suggestions"
                                        />
                                        <datalist id="fleet-model-suggestions">
                                            {modelOptionsForBrand.map((model) => (
                                                <option
                                                    key={model.id}
                                                    value={String(model.name || '').trim()}
                                                />
                                            ))}
                                        </datalist>
                                    </label>

                                    <label>
                                        Loại xe
                                        <input
                                            type="text"
                                            value={createTypeName}
                                            onChange={(event) => setCreateTypeName(event.target.value)}
                                            placeholder="VD: Sedan, SUV, Hatchback..."
                                            disabled={!createBrandName || (selectedExistingModel && String(selectedExistingModel?.typeName || '').trim().toLowerCase() !== 'unknown')}
                                            list="fleet-type-suggestions"
                                        />
                                        <datalist id="fleet-type-suggestions">
                                            {carTypeOptions.map((type) => (
                                                <option key={type} value={type} />
                                            ))}
                                        </datalist>
                                    </label>

                                    <label>
                                        Biển số
                                        <input
                                            type="text"
                                            value={createForm.licensePlate}
                                            onChange={(event) => updateCreateField('licensePlate', event.target.value)}
                                        />
                                    </label>
                                    <label>
                                        Màu sắc
                                        <input
                                            type="text"
                                            value={createForm.color}
                                            onChange={(event) => updateCreateField('color', event.target.value)}
                                        />
                                    </label>
                                    <label>
                                        Số chỗ
                                        <input
                                            type="number"
                                            min="1"
                                            value={createForm.seatCount}
                                            onChange={(event) => updateCreateField('seatCount', event.target.value)}
                                        />
                                    </label>

                                    <label>
                                        Năm sản xuất
                                        <input
                                            type="number"
                                            min="1900"
                                            max="2100"
                                            placeholder="VD: 2020"
                                            value={createForm.year}
                                            onChange={(event) => updateCreateField('year', event.target.value)}
                                        />
                                    </label>
                                    <label>
                                        Hộp số
                                        <select
                                            value={createForm.transmission}
                                            onChange={(event) => updateCreateField('transmission', event.target.value)}
                                        >
                                            <option value="">—</option>
                                            {TRANSMISSION_VALUES.map((v) => (
                                                <option key={v} value={v}>{formatEnumLabel(v)}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label>
                                        Nhiên liệu
                                        <select
                                            value={createForm.fuelType}
                                            onChange={(event) => updateCreateField('fuelType', event.target.value)}
                                        >
                                            <option value="">—</option>
                                            {FUEL_VALUES.map((v) => (
                                                <option key={v} value={v}>{formatEnumLabel(v)}</option>
                                            ))}
                                        </select>
                                    </label>

                                    <label>
                                        Mức tiêu thụ
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            placeholder="VD: 7.5"
                                            value={createForm.fuelConsumption}
                                            onChange={(event) => updateCreateField('fuelConsumption', event.target.value)}
                                        />
                                    </label>
                                    <label>
                                        Giá thuê/ngày
                                        <input
                                            type="number"
                                            min="0"
                                            value={createForm.pricePerDay}
                                            onChange={(event) => updateCreateField('pricePerDay', event.target.value)}
                                        />
                                    </label>

                                    <label style={{ gridColumn: '1 / -1' }}>
                                        Mô tả
                                        <textarea
                                            rows={3}
                                            value={createForm.description}
                                            onChange={(event) => updateCreateField('description', event.target.value)}
                                            placeholder="Mô tả thêm về tình trạng, trang bị, quy định..."
                                        />
                                    </label>
                                    <label>
                                        Số km hiện tại
                                        <input
                                            type="number"
                                            min="0"
                                            value={createForm.currentKm}
                                            onChange={(event) => updateCreateField('currentKm', event.target.value)}
                                        />
                                    </label>
                                    <label>
                                        Tỉnh/Thành phố
                                        <input
                                            type="text"
                                            value={createForm.province}
                                            onChange={(event) => updateCreateField('province', event.target.value)}
                                        />
                                    </label>
                                    <label>
                                        Phường/Xã
                                        <input
                                            type="text"
                                            value={createForm.ward}
                                            onChange={(event) => updateCreateField('ward', event.target.value)}
                                        />
                                    </label>
                                    <label>
                                        Địa chỉ cụ thể
                                        <input
                                            type="text"
                                            value={createForm.addressDetail}
                                            onChange={(event) => updateCreateField('addressDetail', event.target.value)}
                                        />
                                    </label>

                                    <label>
                                        Ảnh xe
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(event) => {
                                                const files = Array.from(event.target.files || [])
                                                setCreateUploadFiles(files)
                                            }}
                                        />
                                    </label>

                                    <label>
                                        <span style={{ display: 'block' }}>Đặt ảnh đầu tiên làm ảnh chính</span>
                                        <input
                                            type="checkbox"
                                            checked={createSetFirstAsMain}
                                            onChange={(event) => setCreateSetFirstAsMain(event.target.checked)}
                                        />
                                    </label>
                                </div>
                                <div className="fleet-create-actions">
                                    <button
                                        type="button"
                                        className="add-vehicle"
                                        disabled={creating}
                                        onClick={createVehicle}
                                    >
                                        {creating ? 'Đang tạo...' : 'Tạo xe'}
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                <div className="fleet-overview">
                    <div className="overview-card">
                        <p>Tổng số xe</p>
                        <h3>{stats.total}</h3>
                        <span>Tất cả xe đang quản lý</span>
                    </div>
                    <div className="overview-card">
                        <p>Sẵn sàng</p>
                        <h3>{stats.available}</h3>
                        <span>Có thể cho thuê</span>
                    </div>
                    <div className="overview-card">
                        <p>Đang thuê</p>
                        <h3>{stats.rented}</h3>
                        <span>Đang có khách thuê</span>
                    </div>
                    <div className="overview-card">
                        <p>Bảo dưỡng</p>
                        <h3>{stats.maintenance}</h3>
                        <span>Đang bảo trì/sửa chữa</span>
                    </div>
                </div>

                <div className="fleet-filters">
                    <div className="search-field">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm theo tên xe hoặc hãng..."
                            value={search}
                            onChange={(event) => handleSearchChange(event.target.value)}
                        />
                    </div>
                    <select value={status} onChange={(event) => handleStatusChange(event.target.value)}>
                        {statuses.map((item) => (
                            <option key={item} value={item}>{item === ALL_STATUS_LABEL ? item : formatEnumLabel(item)}</option>
                        ))}
                    </select>
                    <div className="fleet-view-toggle" role="group" aria-label="Chế độ hiển thị">
                        <button
                            type="button"
                            className={viewMode === 'list' ? 'active' : ''}
                            aria-pressed={viewMode === 'list'}
                            title="Danh sách"
                            onClick={() => setViewMode('list')}
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                <rect x="4" y="5" width="16" height="3" rx="1.5" />
                                <rect x="4" y="10.5" width="16" height="3" rx="1.5" />
                                <rect x="4" y="16" width="16" height="3" rx="1.5" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className={viewMode === 'grid' ? 'active' : ''}
                            aria-pressed={viewMode === 'grid'}
                            title="Lưới"
                            onClick={() => setViewMode('grid')}
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                <rect x="4" y="4" width="7" height="7" rx="1.5" />
                                <rect x="13" y="4" width="7" height="7" rx="1.5" />
                                <rect x="4" y="13" width="7" height="7" rx="1.5" />
                                <rect x="13" y="13" width="7" height="7" rx="1.5" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className={`fleet-grid ${viewMode === 'list' ? 'fleet-grid--list' : ''}`.trim()}>
                    {loading ? (
                        <div className="fleet-loading">Đang tải...</div>
                    ) : (
                        paginatedVehicles.map((vehicle) => (
                            <article className="fleet-card" key={vehicle.id}>
                                <div className="fleet-image">
                                    <img
                                        src={getVehicleThumbnailUrl(vehicle) || '/favicon.svg'}
                                        alt={vehicleDisplayName(vehicle)}
                                    />
                                    <span className={`status-badge ${statusCssClass(vehicle.status)}`}>
                                        {formatEnumLabel(vehicle.status)}
                                    </span>
                                </div>

                                {viewMode === 'list' ? (
                                    <div className="fleet-row">
                                        <div className="fleet-row-main">
                                            <h3>{vehicleDisplayName(vehicle)}</h3>
                                            <p className="fleet-subtitle">Biển số: {vehicle.licensePlate}</p>

                                            <div className="fleet-meta">
                                                <span>👥 {vehicle.seatCount}</span>
                                                <span>⛽ {formatEnumLabel(vehicle.fuelType)}</span>
                                                <span>⚙️ {formatEnumLabel(vehicle.transmission)}</span>
                                            </div>
                                        </div>

                                        <div className="fleet-row-side">
                                            <div className="fleet-row-price">
                                                <span className="label">Giá/ngày</span>
                                                <strong>{formatPrice(vehicle.pricePerDay)}</strong>
                                            </div>
                                            {(() => {
                                                const carTypeLabel = formatCarTypeLabel(vehicle.carTypeName)
                                                return carTypeLabel ? <span className="type-pill">{carTypeLabel}</span> : null
                                            })()}

                                            <div className="fleet-row-actions">
                                                <button
                                                    type="button"
                                                    className="btn-icon"
                                                    title="Chi tiết"
                                                    aria-label="Chi tiết"
                                                    onClick={() => viewDetails(vehicle)}
                                                >
                                                    👁️
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn-icon"
                                                    title="Sửa"
                                                    aria-label="Sửa"
                                                    onClick={() => startEdit(vehicle)}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn-icon danger"
                                                    title="Xóa"
                                                    aria-label="Xóa"
                                                    onClick={() => onDeleteVehicle(vehicle.id)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="fleet-card-body">
                                        <h3>{vehicleDisplayName(vehicle)}</h3>
                                        <p className="fleet-subtitle">Biển số: {vehicle.licensePlate}</p>

                                        <div className="fleet-meta">
                                            <span>👥 {vehicle.seatCount}</span>
                                            <span>⛽ {formatEnumLabel(vehicle.fuelType)}</span>
                                            <span>⚙️ {formatEnumLabel(vehicle.transmission)}</span>
                                        </div>

                                        <div className="fleet-pricing">
                                            <div>
                                                <span className="label">Giá/ngày</span>
                                                <strong>{formatPrice(vehicle.pricePerDay)}</strong>
                                            </div>
                                            {(() => {
                                                const carTypeLabel = formatCarTypeLabel(vehicle.carTypeName)
                                                return carTypeLabel ? <span className="type-pill">{carTypeLabel}</span> : null
                                            })()}
                                        </div>

                                        <div className="fleet-actions">
                                            <button type="button" className="btn-outline" onClick={() => viewDetails(vehicle)}>
                                                👁️ Chi tiết
                                            </button>
                                            <button type="button" className="btn-outline" onClick={() => startEdit(vehicle)}>
                                                ✏️ Sửa
                                            </button>
                                            <button type="button" className="btn-outline danger" onClick={() => onDeleteVehicle(vehicle.id)}>
                                                🗑️ Xóa
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {editingVehicleId === vehicle.id && editForm && (
                                    <div className="fleet-edit">
                                        <div className="edit-grid">
                                            <label>
                                                Mẫu xe
                                                <select
                                                    value={editForm.modelId}
                                                    onChange={(e) => setEditForm((prev) => ({ ...prev, modelId: e.target.value }))}
                                                    disabled={modelsLoading}
                                                >
                                                    <option value="">{modelsLoading ? 'Đang tải...' : 'Chọn mẫu xe'}</option>
                                                    {vehicleModels.map((model) => (
                                                        <option key={model.id} value={model.id}>
                                                            {`${model.brandName || '—'} - ${model.name || '—'}${model.typeName ? ` (${model.typeName})` : ''}`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label>
                                                Biển số
                                                <input
                                                    type="text"
                                                    value={editForm.licensePlate}
                                                    onChange={(e) => setEditForm((prev) => ({ ...prev, licensePlate: e.target.value }))}
                                                />
                                            </label>
                                            <label>
                                                Màu sắc
                                                <input
                                                    type="text"
                                                    value={editForm.color}
                                                    onChange={(e) => setEditForm((prev) => ({ ...prev, color: e.target.value }))}
                                                />
                                            </label>
                                            <label>
                                                Số chỗ
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={editForm.seatCount}
                                                    onChange={(e) => setEditForm((prev) => ({ ...prev, seatCount: e.target.value }))}
                                                />
                                            </label>
                                            <label>
                                                Hộp số
                                                <select
                                                    value={editForm.transmission}
                                                    onChange={(e) => setEditForm((prev) => ({ ...prev, transmission: e.target.value }))}
                                                >
                                                    <option value="">—</option>
                                                    {TRANSMISSION_VALUES.map((v) => (
                                                        <option key={v} value={v}>
                                                            {formatEnumLabel(v)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label>
                                                Nhiên liệu
                                                <select
                                                    value={editForm.fuelType}
                                                    onChange={(e) => setEditForm((prev) => ({ ...prev, fuelType: e.target.value }))}
                                                >
                                                    <option value="">—</option>
                                                    {FUEL_VALUES.map((v) => (
                                                        <option key={v} value={v}>
                                                            {formatEnumLabel(v)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label>
                                                Giá/ngày
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={editForm.pricePerDay}
                                                    onChange={(e) => setEditForm((prev) => ({ ...prev, pricePerDay: e.target.value }))}
                                                />
                                            </label>

                                            <label>
                                                Năm sản xuất
                                                <input
                                                    type="number"
                                                    min="1900"
                                                    max="2100"
                                                    value={editForm.year}
                                                    onChange={(e) => setEditForm((prev) => ({ ...prev, year: e.target.value }))}
                                                />
                                            </label>

                                            <label>
                                                Mức tiêu thụ
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.1"
                                                    value={editForm.fuelConsumption}
                                                    onChange={(e) => setEditForm((prev) => ({ ...prev, fuelConsumption: e.target.value }))}
                                                />
                                            </label>
                                            <label>
                                                Số km hiện tại
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={editForm.currentKm}
                                                    onChange={(e) => setEditForm((prev) => ({ ...prev, currentKm: e.target.value }))}
                                                />
                                            </label>

                                            <label style={{ gridColumn: '1 / -1' }}>
                                                Mô tả
                                                <textarea
                                                    rows={3}
                                                    value={editForm.description}
                                                    onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                                                />
                                            </label>
                                            <label>
                                                Tỉnh/Thành phố
                                                <input
                                                    type="text"
                                                    value={editForm.province}
                                                    onChange={(e) => setEditForm((prev) => ({ ...prev, province: e.target.value }))}
                                                />
                                            </label>
                                            <label>
                                                Phường/Xã
                                                <input
                                                    type="text"
                                                    value={editForm.ward}
                                                    onChange={(e) => setEditForm((prev) => ({ ...prev, ward: e.target.value }))}
                                                />
                                            </label>
                                            <label>
                                                Địa chỉ cụ thể
                                                <input
                                                    type="text"
                                                    value={editForm.addressDetail}
                                                    onChange={(e) => setEditForm((prev) => ({ ...prev, addressDetail: e.target.value }))}
                                                />
                                            </label>
                                            <label>
                                                Trạng thái
                                                <select
                                                    value={editForm.status}
                                                    onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                                                >
                                                    <option value="">—</option>
                                                    {STATUS_VALUES.map((s) => (
                                                        <option key={s} value={s}>
                                                            {formatEnumLabel(s)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>

                                        <div className="edit-actions">
                                            <button type="button" className="btn-outline" onClick={saveEdit} disabled={saving}>
                                                {saving ? 'Đang lưu...' : 'Lưu'}
                                            </button>
                                            <button type="button" className="btn-outline" onClick={saveStatus} disabled={statusUpdating}>
                                                {statusUpdating ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
                                            </button>
                                            <button type="button" className="btn-outline danger" onClick={cancelEdit} disabled={saving || statusUpdating}>
                                                Hủy
                                            </button>
                                        </div>

                                        <div className="edit-images">
                                            <div className="edit-images-header">
                                                <p>Ảnh xe</p>
                                                <label className="edit-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={setFirstAsMain}
                                                        onChange={(e) => setSetFirstAsMain(e.target.checked)}
                                                    />
                                                    Đặt ảnh đầu làm ảnh chính
                                                </label>
                                            </div>

                                            <div className="image-grid">
                                                {(vehicle.images || []).map((img) => (
                                                    <div className="image-item" key={img.id}>
                                                        <img src={img.imageUrl} alt="Xe" />
                                                        <div className="image-actions">
                                                            <button
                                                                type="button"
                                                                className="btn-outline"
                                                                onClick={() => onSetMainImage(img.id)}
                                                                disabled={imagesUpdating}
                                                            >
                                                                {img.isMain ? 'Chính' : 'Đặt làm chính'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn-outline danger"
                                                                onClick={() => onDeleteImage(img.id)}
                                                                disabled={imagesUpdating}
                                                            >
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="image-add">
                                                <textarea
                                                    rows="3"
                                                    placeholder="Dán URL ảnh (mỗi dòng 1 URL)"
                                                    value={imageUrlsInput}
                                                    onChange={(e) => setImageUrlsInput(e.target.value)}
                                                />
                                                <button type="button" className="btn-outline" onClick={onAddImageUrls} disabled={imagesUpdating}>
                                                    Thêm URL
                                                </button>
                                            </div>

                                            <div className="image-upload">
                                                <input
                                                    type="file"
                                                    multiple
                                                    onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                                                />
                                                <button type="button" className="btn-outline" onClick={onUploadImages} disabled={imagesUpdating}>
                                                    Tải ảnh lên
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </article>
                        ))
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
