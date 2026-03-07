export const STATUS_VALUES = ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'PENDING_APPROVAL', 'REJECTED']
export const TRANSMISSION_VALUES = ['MANUAL', 'AUTOMATIC']
export const FUEL_VALUES = ['GASOLINE', 'DIESEL', 'ELECTRIC']

export const ALL_STATUS_LABEL = 'Tất cả trạng thái'

export const createEmptyVehicleForm = () => ({
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
    addressDetail: '',
    deliveryEnabled: true,
    freeDeliveryWithinKm: 0,
    maxDeliveryDistanceKm: 20,
    extraFeePerKm: 10000
})

export const formatEnumLabel = (value) => {
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

export const formatPrice = (value) => {
    if (value == null || value === '') return '0 VNĐ'
    const numberValue = typeof value === 'number' ? value : Number(value)
    if (Number.isNaN(numberValue)) return '0 VNĐ'

    const formatted = new Intl.NumberFormat('vi-VN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numberValue)

    return `${formatted} VNĐ`
}

export const statusCssClass = (status) => (status ? String(status).toLowerCase().replaceAll('_', '-') : 'unknown')

export const getVehicleThumbnailUrl = (vehicle) => {
    const images = Array.isArray(vehicle?.images) ? vehicle.images : []
    if (images.length === 0) return null

    const main = images.find((img) => Boolean(img?.isMain)) || images[0]
    const url = main?.imageUrl || main?.url || null
    return url && String(url).trim() ? String(url).trim() : null
}

export const formatCarTypeLabel = (value) => {
    if (value == null) return ''
    const trimmed = String(value).trim()
    if (!trimmed) return ''
    if (trimmed.toLowerCase() === 'unknown') return ''
    return trimmed
}

export const formatTransmissionShort = (value) => {
    const label = formatEnumLabel(value)
    return label.replace(/^Số\s+/i, '')
}

export const vehicleDisplayName = (vehicle) => {
    const brand = vehicle?.brandName ? String(vehicle.brandName).trim() : ''
    const model = vehicle?.modelName ? String(vehicle.modelName).trim() : ''
    const combined = `${brand} ${model}`.trim()
    return combined || `Xe #${vehicle?.id ?? ''}`
}
