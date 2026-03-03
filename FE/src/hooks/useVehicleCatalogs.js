import { useEffect, useState } from 'react'
import { listBrands } from '../api/brands'
import { listVehicleFeatures } from '../api/vehicleFeatures'
import { listVehicleModels } from '../api/vehicleModels'

export const useVehicleCatalogs = () => {
    const [vehicleModels, setVehicleModels] = useState([])
    const [modelsLoading, setModelsLoading] = useState(false)
    const [modelsError, setModelsError] = useState('')

    const [brands, setBrands] = useState([])
    const [brandsLoading, setBrandsLoading] = useState(false)
    const [brandsError, setBrandsError] = useState('')

    const [featureCatalog, setFeatureCatalog] = useState([])

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

    useEffect(() => {
        let cancelled = false

        const loadFeatures = async () => {
            try {
                const data = await listVehicleFeatures()
                if (!cancelled) {
                    setFeatureCatalog(Array.isArray(data) ? data : [])
                }
            } catch {
                if (!cancelled) {
                    setFeatureCatalog([])
                }
            }
        }

        loadFeatures()
        return () => {
            cancelled = true
        }
    }, [])

    return {
        vehicleModels,
        setVehicleModels,
        modelsLoading,
        modelsError,
        brands,
        brandsLoading,
        brandsError,
        featureCatalog,
        setFeatureCatalog,
    }
}
