import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import 'leaflet/dist/leaflet.css'
import '../styles/DeliveryLocationModal.css'

function formatVndNumber(value) {
    const numeric = Number(value || 0)
    return Math.round(numeric).toLocaleString('vi-VN')
}

function DeliveryLocationModal({
    isOpen,
    onClose,
    carCoords,
    destinationCoords,
    destinationLabel,
    totalFee,
    distanceKm,
    onOpenCustomAddress
}) {
    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)

    const [mapError, setMapError] = useState(null)

    const canRenderMap = Boolean(carCoords?.lat && carCoords?.lon)
    const distanceValue = Number(distanceKm)
    const hasDestination = Boolean(destinationCoords?.lat && destinationCoords?.lon)
    const isOverLimit = hasDestination && Number.isFinite(distanceValue) && distanceValue > 7

    const distanceLabel = useMemo(() => {
        const d = distanceValue
        if (!Number.isFinite(d) || d <= 0) return '0 km'
        return `${d} km`
    }, [distanceValue])

    const feeLabel = useMemo(() => {
        const fee = Number(totalFee)
        if (!Number.isFinite(fee) || fee <= 0) return `Miễn phí (${distanceLabel})`
        return `Tổng phí: ${formatVndNumber(fee)}đ (${distanceLabel})`
    }, [totalFee, distanceLabel])

    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose()
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    useEffect(() => {
        if (!isOpen) return
        if (!mapContainerRef.current) return

        setMapError(null)

        if (!canRenderMap) {
            setMapError('Chưa có vị trí xe để hiển thị bản đồ')
            return
        }

        let cancelled = false

        const initMap = async () => {
            try {
                const L = (await import('leaflet')).default
                if (cancelled) return

                if (mapRef.current) {
                    mapRef.current.remove()
                    mapRef.current = null
                }

                const carPoint = [carCoords.lat, carCoords.lon]
                const hasDestination = Boolean(destinationCoords?.lat && destinationCoords?.lon)
                const destinationPoint = hasDestination
                    ? [destinationCoords.lat, destinationCoords.lon]
                    : null

                const map = L.map(mapContainerRef.current, {
                    zoomControl: true,
                    attributionControl: false
                })

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19
                }).addTo(map)

                const carMarker = L.circleMarker(carPoint, {
                    radius: 7,
                    color: '#2563eb',
                    weight: 2,
                    fillColor: '#2563eb',
                    fillOpacity: 1
                }).addTo(map)

                if (destinationPoint) {
                    L.circleMarker(destinationPoint, {
                        radius: 7,
                        color: '#22c55e',
                        weight: 2,
                        fillColor: '#22c55e',
                        fillOpacity: 1
                    }).addTo(map)

                    L.polyline([carPoint, destinationPoint], {
                        color: '#2563eb',
                        weight: 3,
                        opacity: 0.75
                    }).addTo(map)

                    const bounds = L.latLngBounds([carPoint, destinationPoint])
                    map.fitBounds(bounds.pad(0.25))
                } else {
                    map.setView(carPoint, 13)
                    L.circle(carPoint, {
                        radius: 900,
                        color: '#64748b',
                        weight: 1,
                        fillColor: '#64748b',
                        fillOpacity: 0.18
                    }).addTo(map)
                }

                carMarker.bindTooltip('Vị trí xe', { direction: 'top' })

                mapRef.current = map
            } catch {
                setMapError('Không thể tải bản đồ lúc này')
            }
        }

        initMap()

        return () => {
            cancelled = true
        }
    }, [isOpen, canRenderMap, carCoords, destinationCoords])

    useEffect(() => {
        if (isOpen) return
        if (!mapRef.current) return

        mapRef.current.remove()
        mapRef.current = null
        setMapError(null)
    }, [isOpen])

    if (!isOpen) return null

    const content = (
        <div className="delivery-modal-overlay" onClick={onClose}>
            <div className="delivery-modal" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="delivery-modal-close" onClick={onClose} aria-label="Đóng">
                    ✕
                </button>

                <h2>Địa điểm giao nhận xe</h2>

                <div className="delivery-modal-grid">
                    <div className="delivery-map-panel">
                        <div className="delivery-map" ref={mapContainerRef} />
                        {mapError && <div className="delivery-map-error">{mapError}</div>}
                    </div>

                    <div className="delivery-form-panel">
                        <div className="delivery-form-head">
                            <div>
                                <div className="delivery-form-title">Địa chỉ tuỳ chỉnh</div>
                            </div>
                            <button type="button" className="delivery-change-link" onClick={onOpenCustomAddress}>
                                Thay đổi ›
                            </button>
                        </div>

                        <label className="delivery-address-card" onClick={onOpenCustomAddress}>
                            <span className="delivery-radio" aria-hidden="true" />
                            <span className="delivery-address-text">
                                {destinationLabel || 'Nhập địa chỉ tuỳ chỉnh'}
                            </span>
                        </label>

                        {isOverLimit ? (
                            <div className="delivery-warning">
                                Địa điểm giao nhận quá xa so với vị trí của xe ({distanceLabel}).
                                Bạn vui lòng chọn địa điểm giao nhận gần hơn hoặc có thể chọn thuê xe khác.
                            </div>
                        ) : (
                            <div className="delivery-fee-line">{feeLabel}</div>
                        )}

                        <button
                            type="button"
                            className="delivery-primary"
                            onClick={onOpenCustomAddress}
                            disabled={isOverLimit}
                        >
                            Thay đổi
                        </button>
                    </div>
                </div>

                <div className="delivery-footer">
                    <h3>Giao xe nhận xe tận nơi</h3>
                    <div className="delivery-footer-rows">
                        <div>
                            <span>Dịch vụ giao nhận xe tận nơi</span>
                            <b>trong vòng 7km</b>
                        </div>
                        <div>
                            <span>Phí giao nhận xe (2 chiều)</span>
                            <b>20.000đ/km</b>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

    return createPortal(content, document.body)
}

export default DeliveryLocationModal
