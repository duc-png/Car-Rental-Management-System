import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import '../../styles/CarOwnerFleet.css'

import {
    addVehicleImagesByUrl,
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

const formatEnumLabel = (value) => {
    if (!value) return ''
    return String(value)
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
}

const formatPrice = (value) => {
    if (value == null || value === '') return '$0'
    const numberValue = typeof value === 'number' ? value : Number(value)
    if (Number.isNaN(numberValue)) return '$0'
    return `$${numberValue.toLocaleString('en-US')}`
}

const statusCssClass = (status) => (status ? String(status).toLowerCase().replaceAll('_', '-') : 'unknown')

const vehicleDisplayName = (vehicle) => {
    const brand = vehicle?.brandName ? String(vehicle.brandName).trim() : ''
    const model = vehicle?.modelName ? String(vehicle.modelName).trim() : ''
    const combined = `${brand} ${model}`.trim()
    return combined || `Vehicle #${vehicle?.id ?? ''}`
}

function CarOwnerFleet() {
    const [searchParams] = useSearchParams()
    const ownerIdParam = searchParams.get('ownerId')
    const ownerId = ownerIdParam ? Number(ownerIdParam) : null

    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All Categories')
    const [status, setStatus] = useState('All Status')
    const [currentPage, setCurrentPage] = useState(1)

    const [vehicles, setVehicles] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [editingVehicleId, setEditingVehicleId] = useState(null)
    const [editForm, setEditForm] = useState(null)
    const [saving, setSaving] = useState(false)
    const [statusUpdating, setStatusUpdating] = useState(false)
    const [imagesUpdating, setImagesUpdating] = useState(false)
    const [imageUrlsInput, setImageUrlsInput] = useState('')
    const [setFirstAsMain, setSetFirstAsMain] = useState(false)
    const [uploadFiles, setUploadFiles] = useState([])

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            if (!ownerId || Number.isNaN(ownerId)) {
                setVehicles([])
                setError('Missing ownerId. Use /owner/fleet?ownerId=1')
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
                    setError(err?.message || 'Failed to load vehicles')
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
    }, [ownerId])

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
        const unique = Array.from(new Set(typeNames)).sort((a, b) => a.localeCompare(b))
        return ['All Categories', ...unique]
    }, [vehicles])

    const statuses = useMemo(() => {
        const seen = vehicles
            .map((vehicle) => vehicle?.status)
            .filter(Boolean)
            .map((s) => String(s))
        const unique = Array.from(new Set(seen))
        const sorted = STATUS_VALUES.filter((s) => unique.includes(s)).concat(unique.filter((s) => !STATUS_VALUES.includes(s)))
        return ['All Status', ...sorted]
    }, [vehicles])

    const filteredVehicles = useMemo(() => {
        return vehicles.filter((vehicle) => {
            const haystack = `${vehicleDisplayName(vehicle)} ${vehicle?.licensePlate || ''}`.toLowerCase()
            const matchesSearch = haystack.includes(search.toLowerCase())
            const matchesCategory = category === 'All Categories' || vehicle?.carTypeName === category
            const matchesStatus = status === 'All Status' || String(vehicle?.status) === String(status)
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

    const handleCategoryChange = (value) => {
        setCategory(value)
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

    const startEdit = (vehicle) => {
        setEditingVehicleId(vehicle.id)
        setEditForm({
            modelId: vehicle?.modelId != null ? String(vehicle.modelId) : '',
            licensePlate: vehicle?.licensePlate || '',
            color: vehicle?.color || '',
            seatCount: vehicle?.seatCount != null ? String(vehicle.seatCount) : '',
            transmission: vehicle?.transmission || '',
            fuelType: vehicle?.fuelType || '',
            pricePerDay: vehicle?.pricePerDay != null ? String(vehicle.pricePerDay) : '',
            currentKm: vehicle?.currentKm != null ? String(vehicle.currentKm) : '',
            locationId: vehicle?.locationId != null ? String(vehicle.locationId) : '',
            status: vehicle?.status || ''
        })
        setImageUrlsInput('')
        setSetFirstAsMain(false)
        setUploadFiles([])
    }

    const cancelEdit = () => {
        setEditingVehicleId(null)
        setEditForm(null)
        setImageUrlsInput('')
        setSetFirstAsMain(false)
        setUploadFiles([])
    }

    const saveEdit = async () => {
        if (!editingVehicleId || !editForm) return
        if (!ownerId || Number.isNaN(ownerId)) {
            setError('Missing ownerId. Use /owner/fleet?ownerId=1')
            return
        }

        const requiredFields = ['modelId', 'licensePlate', 'seatCount', 'pricePerDay', 'currentKm']
        for (const field of requiredFields) {
            if (!String(editForm[field] ?? '').trim()) {
                setError(`Missing required field: ${field}`)
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
                currentKm: Number(editForm.currentKm),
                locationId: String(editForm.locationId || '').trim() ? Number(editForm.locationId) : null,
                location: null
            }

            const updated = await updateOwnerVehicle(editingVehicleId, ownerId, payload)
            if (updated) {
                upsertVehicle(updated)
            }
            cancelEdit()
        } catch (err) {
            setError(err?.message || 'Failed to update vehicle')
        } finally {
            setSaving(false)
        }
    }

    const saveStatus = async () => {
        if (!editingVehicleId || !editForm) return
        if (!ownerId || Number.isNaN(ownerId)) {
            setError('Missing ownerId. Use /owner/fleet?ownerId=1')
            return
        }
        if (!editForm.status) {
            setError('Missing status')
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
            setError(err?.message || 'Failed to update status')
        } finally {
            setStatusUpdating(false)
        }
    }

    const onDeleteVehicle = async (vehicleId) => {
        if (!ownerId || Number.isNaN(ownerId)) {
            setError('Missing ownerId. Use /owner/fleet?ownerId=1')
            return
        }

        const confirmed = window.confirm('Delete this vehicle?')
        if (!confirmed) return

        setError('')
        try {
            await deleteOwnerVehicle(vehicleId, ownerId)
            setVehicles((prev) => prev.filter((v) => v.id !== vehicleId))
            if (editingVehicleId === vehicleId) {
                cancelEdit()
            }
        } catch (err) {
            setError(err?.message || 'Failed to delete vehicle')
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
            setError(err?.message || 'Failed to add images')
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
            setError(err?.message || 'Failed to upload images')
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
            setError(err?.message || 'Failed to set main image')
        } finally {
            setImagesUpdating(false)
        }
    }

    const onDeleteImage = async (imageId) => {
        if (!editingVehicleId || !ownerId || Number.isNaN(ownerId)) return
        const confirmed = window.confirm('Delete this image?')
        if (!confirmed) return
        setImagesUpdating(true)
        setError('')
        try {
            await deleteVehicleImage(editingVehicleId, ownerId, imageId)
            await refreshVehicle(editingVehicleId)
        } catch (err) {
            setError(err?.message || 'Failed to delete image')
        } finally {
            setImagesUpdating(false)
        }
    }

    return (
        <div className="fleet-dashboard">
            <aside className="fleet-sidebar">
                <Link to="/" className="fleet-brand">
                    <div className="brand-icon">
                        <img src="/favicon.svg" alt="CarRental System" />
                    </div>
                    <div>
                        <h3>CarRental System</h3>
                        <p>Fleet Management</p>
                    </div>
                </Link>

                <div className="fleet-nav">
                    <p className="nav-section">Navigation</p>
                    <button type="button" className="nav-item">Dashboard</button>
                    <button type="button" className="nav-item active">Fleet</button>
                    <button type="button" className="nav-item">Bookings</button>
                    <button type="button" className="nav-item">Customers</button>
                    <button type="button" className="nav-item">Analytics</button>
                </div>

                <div className="fleet-system">
                    <p className="nav-section">System</p>
                    <button type="button" className="nav-item">Settings</button>
                </div>

                <div className="fleet-user">
                    <div className="user-avatar">AD</div>
                    <div className="user-info">
                        <p className="user-name">Car Owner</p>
                        <p className="user-email">owner@carrental.com</p>
                    </div>
                </div>
            </aside>

            <section className="fleet-main">
                <header className="fleet-header">
                    <div>
                        <p className="fleet-breadcrumb">Car Owner / Fleet</p>
                        <h1>Fleet Management</h1>
                        <p>Manage your vehicle inventory</p>
                    </div>
                    <div className="fleet-header-actions">
                        <button className="add-vehicle">+ Add Vehicle</button>
                    </div>
                </header>

                {error && (
                    <div className="fleet-alert" role="alert">
                        {error}
                    </div>
                )}

                <div className="fleet-overview">
                    <div className="overview-card">
                        <p>Total Vehicles</p>
                        <h3>{stats.total}</h3>
                        <span>All listed vehicles</span>
                    </div>
                    <div className="overview-card">
                        <p>Available</p>
                        <h3>{stats.available}</h3>
                        <span>Ready for booking</span>
                    </div>
                    <div className="overview-card">
                        <p>Rented</p>
                        <h3>{stats.rented}</h3>
                        <span>On the road</span>
                    </div>
                    <div className="overview-card">
                        <p>Maintenance</p>
                        <h3>{stats.maintenance}</h3>
                        <span>In service</span>
                    </div>
                </div>

                <div className="fleet-filters">
                    <div className="search-field">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by name or brand..."
                            value={search}
                            onChange={(event) => handleSearchChange(event.target.value)}
                        />
                    </div>
                    <select value={category} onChange={(event) => handleCategoryChange(event.target.value)}>
                        {categories.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>
                    <select value={status} onChange={(event) => handleStatusChange(event.target.value)}>
                        {statuses.map((item) => (
                            <option key={item} value={item}>{item === 'All Status' ? item : formatEnumLabel(item)}</option>
                        ))}
                    </select>
                </div>

                <div className="fleet-grid">
                    {loading ? (
                        <div className="fleet-loading">Loading...</div>
                    ) : (
                        paginatedVehicles.map((vehicle) => (
                            <article className="fleet-card" key={vehicle.id}>
                                <div className="fleet-image">
                                    <img
                                        src={vehicle.mainImageUrl || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80'}
                                        alt={vehicleDisplayName(vehicle)}
                                    />
                                    <span className={`status-badge ${statusCssClass(vehicle.status)}`}>
                                        {formatEnumLabel(vehicle.status)}
                                    </span>
                                </div>

                                <div className="fleet-card-body">
                                    <h3>{vehicleDisplayName(vehicle)}</h3>
                                    <p className="fleet-subtitle">Plate: {vehicle.licensePlate}</p>

                                    <div className="fleet-meta">
                                        <span>👥 {vehicle.seatCount}</span>
                                        <span>⛽ {formatEnumLabel(vehicle.fuelType)}</span>
                                        <span>⚙️ {formatEnumLabel(vehicle.transmission)}</span>
                                    </div>

                                    <div className="fleet-pricing">
                                        <div>
                                            <span className="label">Per day</span>
                                            <strong>{formatPrice(vehicle.pricePerDay)}</strong>
                                        </div>
                                        <span className="type-pill">{vehicle.carTypeName || '—'}</span>
                                    </div>

                                    <div className="fleet-actions">
                                        <button type="button" className="btn-outline" onClick={() => startEdit(vehicle)}>
                                            ✏️ Edit
                                        </button>
                                        <button type="button" className="btn-outline danger" onClick={() => onDeleteVehicle(vehicle.id)}>
                                            🗑️ Delete
                                        </button>
                                    </div>

                                    {editingVehicleId === vehicle.id && editForm && (
                                        <div className="fleet-edit">
                                            <div className="edit-grid">
                                                <label>
                                                    Model ID
                                                    <input
                                                        type="number"
                                                        value={editForm.modelId}
                                                        onChange={(e) => setEditForm((prev) => ({ ...prev, modelId: e.target.value }))}
                                                    />
                                                </label>
                                                <label>
                                                    License Plate
                                                    <input
                                                        type="text"
                                                        value={editForm.licensePlate}
                                                        onChange={(e) => setEditForm((prev) => ({ ...prev, licensePlate: e.target.value }))}
                                                    />
                                                </label>
                                                <label>
                                                    Color
                                                    <input
                                                        type="text"
                                                        value={editForm.color}
                                                        onChange={(e) => setEditForm((prev) => ({ ...prev, color: e.target.value }))}
                                                    />
                                                </label>
                                                <label>
                                                    Seats
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={editForm.seatCount}
                                                        onChange={(e) => setEditForm((prev) => ({ ...prev, seatCount: e.target.value }))}
                                                    />
                                                </label>
                                                <label>
                                                    Transmission
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
                                                    Fuel
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
                                                    Price/Day
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={editForm.pricePerDay}
                                                        onChange={(e) => setEditForm((prev) => ({ ...prev, pricePerDay: e.target.value }))}
                                                    />
                                                </label>
                                                <label>
                                                    Current KM
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={editForm.currentKm}
                                                        onChange={(e) => setEditForm((prev) => ({ ...prev, currentKm: e.target.value }))}
                                                    />
                                                </label>
                                                <label>
                                                    Location ID
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={editForm.locationId}
                                                        onChange={(e) => setEditForm((prev) => ({ ...prev, locationId: e.target.value }))}
                                                    />
                                                </label>
                                                <label>
                                                    Status
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
                                                    {saving ? 'Saving...' : 'Save'}
                                                </button>
                                                <button type="button" className="btn-outline" onClick={saveStatus} disabled={statusUpdating}>
                                                    {statusUpdating ? 'Updating...' : 'Update Status'}
                                                </button>
                                                <button type="button" className="btn-outline danger" onClick={cancelEdit} disabled={saving || statusUpdating}>
                                                    Cancel
                                                </button>
                                            </div>

                                            <div className="edit-images">
                                                <div className="edit-images-header">
                                                    <p>Images</p>
                                                    <label className="edit-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={setFirstAsMain}
                                                            onChange={(e) => setSetFirstAsMain(e.target.checked)}
                                                        />
                                                        Set first as main
                                                    </label>
                                                </div>

                                                <div className="image-grid">
                                                    {(vehicle.images || []).map((img) => (
                                                        <div className="image-item" key={img.id}>
                                                            <img src={img.imageUrl} alt="Vehicle" />
                                                            <div className="image-actions">
                                                                <button
                                                                    type="button"
                                                                    className="btn-outline"
                                                                    onClick={() => onSetMainImage(img.id)}
                                                                    disabled={imagesUpdating}
                                                                >
                                                                    {img.isMain ? 'Main' : 'Set Main'}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn-outline danger"
                                                                    onClick={() => onDeleteImage(img.id)}
                                                                    disabled={imagesUpdating}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="image-add">
                                                    <textarea
                                                        rows="3"
                                                        placeholder="Paste image URLs (one per line)"
                                                        value={imageUrlsInput}
                                                        onChange={(e) => setImageUrlsInput(e.target.value)}
                                                    />
                                                    <button type="button" className="btn-outline" onClick={onAddImageUrls} disabled={imagesUpdating}>
                                                        Add URLs
                                                    </button>
                                                </div>

                                                <div className="image-upload">
                                                    <input
                                                        type="file"
                                                        multiple
                                                        onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                                                    />
                                                    <button type="button" className="btn-outline" onClick={onUploadImages} disabled={imagesUpdating}>
                                                        Upload Files
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
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
                            ← Previous
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
                            Next →
                        </button>
                    </div>
                )}
            </section>
        </div>
    )
}

export default CarOwnerFleet
