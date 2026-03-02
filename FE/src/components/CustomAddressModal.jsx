import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import 'leaflet/dist/leaflet.css'
import '../styles/CustomAddressModal.css'
import { geocodeAddress } from '../utils/carDetailsUtils'

function CustomAddressModal({ isOpen, onClose, initialValue, onApply }) {
    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)

    const [input, setInput] = useState('')
    const [coords, setCoords] = useState(null)
    const [resolvedLabel, setResolvedLabel] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!isOpen) return
        setInput(initialValue || '')
        setCoords(null)
        setResolvedLabel('')
        setError(null)
        setLoading(false)
    }, [isOpen, initialValue])

    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose()
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    const query = useMemo(() => (input || '').trim(), [input])

    useEffect(() => {
        if (!isOpen) return

        if (!query || query.length < 2) {
            setCoords(null)
            setResolvedLabel('')
            setError(null)
            return
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(async () => {
            try {
                setLoading(true)
                setError(null)

                const result = await geocodeAddress(query, controller.signal)

                if (!result?.lat || !result?.lon) {
                    setCoords(null)
                    setResolvedLabel('')
                    setError('Không tìm thấy địa chỉ phù hợp')
                    return
                }

                setCoords({
                    lat: Number(result.lat),
                    lon: Number(result.lon)
                })
                setResolvedLabel(result.label || query)
            } catch (err) {
                if (err?.name === 'AbortError') return
                setCoords(null)
                setResolvedLabel('')
                setError('Không thể tìm địa chỉ lúc này')
            } finally {
                setLoading(false)
            }
        }, 350)

        return () => {
            clearTimeout(timeoutId)
            controller.abort()
        }
    }, [isOpen, query])

    useEffect(() => {
        if (!isOpen) return
        if (!coords) return
        if (!mapContainerRef.current) return

        let cancelled = false

        const initMap = async () => {
            const L = (await import('leaflet')).default
            if (cancelled) return

            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }

            const center = [coords.lat, coords.lon]

            const map = L.map(mapContainerRef.current, {
                zoomControl: true,
                attributionControl: false
            }).setView(center, 14)

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(map)

            L.circle(center, {
                radius: 1200,
                color: '#64748b',
                weight: 1,
                fillColor: '#64748b',
                fillOpacity: 0.18
            }).addTo(map)

            L.circleMarker(center, {
                radius: 6,
                color: '#22c55e',
                weight: 2,
                fillColor: '#22c55e',
                fillOpacity: 1
            }).addTo(map)

            mapRef.current = map
        }

        initMap()

        return () => {
            cancelled = true
        }
    }, [isOpen, coords])

    useEffect(() => {
        if (isOpen) return
        if (!mapRef.current) return

        mapRef.current.remove()
        mapRef.current = null
    }, [isOpen])

    if (!isOpen) return null

    const content = (
        <div className="custom-address-modal-overlay" onClick={onClose}>
            <div className="custom-address-modal" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="custom-address-close" onClick={onClose} aria-label="Đóng">
                    ✕
                </button>

                <h2>Địa điểm giao nhận xe</h2>

                <div className="custom-address-input-row">
                    <input
                        type="text"
                        placeholder="Nhập thành phố, quận, địa chỉ..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    {query && (
                        <button
                            type="button"
                            className="custom-address-clear"
                            onClick={() => setInput('')}
                            aria-label="Xóa"
                        >
                            ×
                        </button>
                    )}
                </div>

                {coords && (
                    <div className="custom-address-map" ref={mapContainerRef} />
                )}

                {!coords && loading && <div className="custom-address-state">Đang tìm địa chỉ...</div>}
                {!coords && !loading && error && <div className="custom-address-state error">{error}</div>}

                <button
                    type="button"
                    className="custom-address-apply"
                    disabled={!coords}
                    onClick={() => {
                        if (!coords) return
                        onApply({
                            address: query,
                            coords,
                            label: resolvedLabel || query
                        })
                    }}
                >
                    Áp dụng
                </button>

                <button type="button" className="custom-address-cancel" onClick={onClose}>
                    Hủy bỏ
                </button>
            </div>
        </div>
    )

    return createPortal(content, document.body)
}

export default CustomAddressModal
