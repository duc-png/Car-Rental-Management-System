'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import 'leaflet/dist/leaflet.css'
import '../../styles/MapModal.css'
import { generateQueryVariants, resolveBestGeocodeFromVariants } from '../../utils/carDetailsUtils'

function MapModal({ isOpen, onClose, addressText }) {
    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)

    const [coords, setCoords] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const query = useMemo(() => (addressText || '').trim(), [addressText])

    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose()
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    useEffect(() => {
        if (!isOpen) return

        setCoords(null)
        setError(null)

        const q = query
        if (!q) {
            setError('Chưa có địa chỉ để hiển thị bản đồ')
            return
        }

        const controller = new AbortController()

        const fetchCoords = async () => {
            try {
                setLoading(true)
                const parts = q.split(',').map((part) => part.trim()).filter(Boolean)
                const city = parts.length > 0 ? parts[parts.length - 1] : ''
                const district = parts.length > 1 ? parts[parts.length - 2] : ''
                const detail = parts.length > 2 ? parts.slice(0, -2).join(', ') : q
                const variants = generateQueryVariants(detail, district, city)
                const referenceQuery = [detail, district, city].filter(Boolean).join(', ')
                const result = await resolveBestGeocodeFromVariants(variants, referenceQuery, controller.signal)

                if (!result?.lat || !result?.lon) {
                    setError('Không tìm thấy tọa độ cho địa chỉ này')
                    return
                }

                setCoords({
                    lat: Number(result.lat),
                    lon: Number(result.lon)
                })
            } catch (err) {
                if (err?.name === 'AbortError') return
                setError('Không thể tải bản đồ lúc này')
            } finally {
                setLoading(false)
            }
        }

        fetchCoords()

        return () => {
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
                radius: 900,
                color: '#64748b',
                weight: 1,
                fillColor: '#64748b',
                fillOpacity: 0.18
            }).addTo(map)

            L.circleMarker(center, {
                radius: 6,
                color: '#ef4444',
                weight: 2,
                fillColor: '#ef4444',
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
        setCoords(null)
        setError(null)
        setLoading(false)
    }, [isOpen])

    if (!isOpen) return null

    const content = (
        <div className="map-modal-overlay" onClick={onClose}>
            <div className="map-modal" onClick={(e) => e.stopPropagation()}>
                <div className="map-modal-header">
                    <h2>Bản đồ vị trí xe</h2>
                    <button type="button" className="map-modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="map-modal-body">
                    <div className="map-modal-meta">{query || '---'}</div>

                    {loading && <div className="map-modal-state">Đang tải bản đồ...</div>}
                    {!loading && error && <div className="map-modal-state error">{error}</div>}

                    <div className="map-modal-map" ref={mapContainerRef} />
                </div>
            </div>
        </div>
    )

    return createPortal(content, document.body)
}

export default MapModal

