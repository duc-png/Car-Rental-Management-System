// src/pages/owner/OwnerVehicleEdit.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/OwnerVehicleEdit.css';
import FleetSidebar from '../../components/owner/fleet/FleetSidebar';
import OwnerVehicleTypeSection from '../../components/owner/edit/OwnerVehicleTypeSection';
import OwnerVehicleBasicSection from '../../components/owner/edit/OwnerVehicleBasicSection';
import OwnerVehicleSpecsSection from '../../components/owner/edit/OwnerVehicleSpecsSection';
import OwnerVehicleFeaturesSection from '../../components/owner/edit/OwnerVehicleFeaturesSection';
import OwnerVehicleLocationSection from '../../components/owner/edit/OwnerVehicleLocationSection';
import OwnerVehicleImagesSection from '../../components/owner/edit/OwnerVehicleImagesSection';

import {
    getVehicleDetail,
    updateOwnerVehicle,
    addVehicleImagesByUrl,
    uploadVehicleImages,
    setMainVehicleImage,
    deleteVehicleImage,
} from '../../api/ownerVehicles';
import { listVehicleModels, createVehicleModel } from '../../api/vehicleModels';
import { listBrands } from '../../api/brands';
import { listVehicleFeatures } from '../../api/vehicleFeatures';
import { FUEL_VALUES, formatEnumLabel, TRANSMISSION_VALUES } from '../../utils/ownerFleetUtils';

const STATUS_VALUES = ['AVAILABLE', 'RENTED', 'MAINTENANCE'];

export default function OwnerVehicleEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { user, logout } = useAuth();

    const ownerIdParam = searchParams.get('ownerId');
    const ownerId = user?.userId || user?.id || (ownerIdParam ? Number(ownerIdParam) : null);

    const [vehicle, setVehicle] = useState(null);
    const [form, setForm] = useState({
        licensePlate: '',
        color: '',
        seatCount: '',
        transmission: '',
        fuelType: '',
        pricePerDay: '',
        year: '',
        fuelConsumption: '',
        currentKm: '',
        description: '',
        province: '',
        ward: '',
        addressDetail: '',
        status: '',
    });

    const [vehicleModels, setVehicleModels] = useState([]);
    const [modelsLoading, setModelsLoading] = useState(false);

    const [brands, setBrands] = useState([]);
    const [featureCatalog, setFeatureCatalog] = useState([]);
    const [selectedFeatureIds, setSelectedFeatureIds] = useState([]);

    // Fields cho hãng, mẫu, loại (tương tự modal thêm xe)
    const [brandName, setBrandName] = useState('');
    const [modelName, setModelName] = useState('');
    const [typeName, setTypeName] = useState('');
    const [isCustomModel, setIsCustomModel] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [imageUrlsInput, setImageUrlsInput] = useState('');
    const [uploadFiles, setUploadFiles] = useState([]);
    const [setFirstAsMain, setSetFirstAsMain] = useState(false);
    const [imagesUpdating, setImagesUpdating] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const loadVehicle = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getVehicleDetail(id);
            if (data) {
                setVehicle(data);
                setBrandName(data.brandName || '');
                setModelName(data.modelName || '');
                setTypeName(data.carTypeName || '');
                setSelectedFeatureIds(
                    Array.isArray(data.features)
                        ? data.features
                            .map((feature) => Number(feature?.id))
                            .filter((featureId) => Number.isInteger(featureId))
                        : []
                );

                setForm({
                    licensePlate: data.licensePlate || '',
                    color: data.color || '',
                    seatCount: data.seatCount || '',
                    transmission: data.transmission || '',
                    fuelType: data.fuelType || '',
                    pricePerDay: data.pricePerDay || '',
                    year: data.year || '',
                    fuelConsumption: data.fuelConsumption || '',
                    currentKm: data.currentKm || '',
                    description: data.description || '',
                    province: data.city ?? '',
                    ward: data.district ?? '',
                    addressDetail: data.addressDetail ?? '',
                    status: data.status || '',
                });
            }
        } catch (err) {
            setError(err?.message || 'Không thể tải thông tin xe');
        } finally {
            setLoading(false);
        }
    }, [id]);

    const loadBrands = useCallback(async () => {
        try {
            const data = await listBrands();
            setBrands(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error loading brands:', err);
            setBrands([]);
        }
    }, []);

    const loadModels = useCallback(async () => {
        try {
            setModelsLoading(true);
            const data = await listVehicleModels();
            setVehicleModels(data || []);
        } catch (err) {
            console.error('Error loading models:', err);
        } finally {
            setModelsLoading(false);
        }
    }, []);

    const loadFeatureCatalog = useCallback(async () => {
        try {
            const data = await listVehicleFeatures();
            setFeatureCatalog(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error loading vehicle features:', err);
            setFeatureCatalog([]);
        }
    }, []);

    useEffect(() => {
        loadVehicle();
    }, [loadVehicle]);

    useEffect(() => {
        loadBrands();
        loadModels();
        loadFeatureCatalog();
    }, [loadBrands, loadModels, loadFeatureCatalog]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const onToggleFeature = (featureId) => {
        setSelectedFeatureIds((prev) => {
            if (prev.includes(featureId)) {
                return prev.filter((item) => item !== featureId);
            }
            return [...prev, featureId];
        });
    };

    const brandOptions = useMemo(() => {
        const fromBrands = brands.map((b) => b?.name?.trim()).filter(Boolean);
        const fromModels = vehicleModels.map((m) => m?.brandName?.trim()).filter(Boolean);
        const merged = fromBrands.length > 0 ? fromBrands : fromModels;
        return Array.from(new Set(merged)).sort((a, b) => a.localeCompare(b));
    }, [brands, vehicleModels]);

    const modelOptionsForBrand = useMemo(() => {
        if (!brandName.trim()) return [];
        return vehicleModels
            .filter((m) => String(m?.brandName || '').trim() === String(brandName).trim())
            .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')));
    }, [vehicleModels, brandName]);

    const selectedExistingModel = useMemo(() => {
        const typed = String(modelName || '').trim();
        if (!typed) return null;
        return modelOptionsForBrand.find((m) => String(m?.name || '').trim().toLowerCase() === typed.toLowerCase()) || null;
    }, [modelName, modelOptionsForBrand]);

    // Tự động điền loại xe nếu chọn được model có sẵn
    useEffect(() => {
        if (selectedExistingModel) {
            const typeFromModel = String(selectedExistingModel?.typeName || selectedExistingModel?.carTypeName || '').trim();
            if (typeFromModel && typeFromModel.toLowerCase() !== 'unknown') {
                setTypeName(typeFromModel);
            }
        }
    }, [selectedExistingModel]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!ownerId) {
            setError('Thiếu thông tin chủ xe. Vui lòng đăng nhập lại.');
            return;
        }

        if (!brandName.trim()) {
            setError('Vui lòng chọn hoặc nhập hãng xe.');
            return;
        }

        if (!modelName.trim()) {
            setError('Vui lòng nhập mẫu xe.');
            return;
        }

        const existingTypeKnown = selectedExistingModel &&
            String(selectedExistingModel.typeName || '').trim().toLowerCase() !== 'unknown';
        if (!existingTypeKnown && !typeName.trim()) {
            setError('Vui lòng nhập loại xe (SUV, Sedan, Hatchback...).');
            return;
        }

        setSaving(true);
        setError('');

        try {
            let modelId = selectedExistingModel?.id ? Number(selectedExistingModel.id) : null;

            // Nếu model không tồn tại → tạo mới (giống modal thêm xe)
            if (!modelId) {
                const newModel = await createVehicleModel({
                    brandName: brandName.trim(),
                    modelName: modelName.trim(),
                    typeName: typeName.trim() || null,
                });

                if (!newModel?.id) {
                    throw new Error('Không thể tạo mẫu xe mới');
                }

                modelId = Number(newModel.id);

                // Cập nhật danh sách models để lần sau load lại không cần refresh trang
                setVehicleModels((prev) => {
                    const exists = prev.some((m) => m.id === newModel.id);
                    return exists ? prev : [...prev, newModel];
                });
            }

            // Nếu model cũ có type unknown nhưng giờ nhập type → update type
            const shouldUpdateType = modelId &&
                selectedExistingModel &&
                String(selectedExistingModel.typeName || '').trim().toLowerCase() === 'unknown' &&
                typeName.trim();

            if (shouldUpdateType) {
                await createVehicleModel({
                    brandName: brandName.trim(),
                    modelName: modelName.trim(),
                    typeName: typeName.trim(),
                });
                // Không cần reload models ở đây vì chỉ update type, không ảnh hưởng lớn
            }

            const payload = {
                modelId,
                licensePlate: form.licensePlate?.trim() || vehicle?.licensePlate || null,
                color: form.color?.trim() || vehicle?.color || null,
                seatCount: form.seatCount ? Number(form.seatCount) : vehicle?.seatCount,
                transmission: form.transmission || vehicle?.transmission || null,
                fuelType: form.fuelType || vehicle?.fuelType || null,
                pricePerDay: form.pricePerDay ? Number(form.pricePerDay) : vehicle?.pricePerDay,
                year: form.year ? Number(form.year) : (vehicle?.year || null),
                fuelConsumption: form.fuelConsumption ? Number(form.fuelConsumption) : (vehicle?.fuelConsumption || null),
                description: form.description?.trim() || vehicle?.description || null,
                currentKm: form.currentKm ? Number(form.currentKm) : vehicle?.currentKm,
                location: {
                    province: form.province?.trim() || vehicle?.location?.province || null,
                    ward: form.ward?.trim() || vehicle?.location?.ward || null,
                    addressDetail: form.addressDetail?.trim() || vehicle?.location?.addressDetail || null,
                },
                status: form.status || vehicle?.status || null,
                featureIds: selectedFeatureIds,
            };

            await updateOwnerVehicle(id, ownerId, payload);

            // Xử lý ảnh
            if (uploadFiles.length > 0) {
                await uploadVehicleImages(id, ownerId, uploadFiles, { setFirstAsMain });
                setUploadFiles([]);
                setSetFirstAsMain(false);
            }

            if (imageUrlsInput.trim()) {
                const urls = imageUrlsInput.split('\n').map(l => l.trim()).filter(Boolean);
                if (urls.length > 0) {
                    await addVehicleImagesByUrl(id, ownerId, { imageUrls: urls, setFirstAsMain });
                    setImageUrlsInput('');
                }
            }

            await loadVehicle();
            alert('Cập nhật thông tin xe thành công!');
        } catch (err) {
            setError(err?.message || 'Không thể cập nhật thông tin xe');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate(ownerId ? `/owner/fleet?ownerId=${ownerId}` : '/owner/fleet');
    };

    // Các hàm ảnh giữ nguyên
    const onAddImageUrls = async () => {
        if (!id || !ownerId || Number.isNaN(ownerId)) return;
        const urls = imageUrlsInput.split('\n').map(l => l.trim()).filter(Boolean);
        if (urls.length === 0) return;

        setImagesUpdating(true);
        setError('');
        try {
            await addVehicleImagesByUrl(id, ownerId, { imageUrls: urls, setFirstAsMain });
            await loadVehicle();
            setImageUrlsInput('');
            setSetFirstAsMain(false);
        } catch (err) {
            setError(err?.message || 'Không thể thêm ảnh');
        } finally {
            setImagesUpdating(false);
        }
    };

    const onUploadImages = async () => {
        if (!id || !ownerId || Number.isNaN(ownerId) || !uploadFiles.length) return;

        setImagesUpdating(true);
        setError('');
        try {
            await uploadVehicleImages(id, ownerId, uploadFiles, { setFirstAsMain });
            await loadVehicle();
            setUploadFiles([]);
            setSetFirstAsMain(false);
        } catch (err) {
            setError(err?.message || 'Không thể tải ảnh lên');
        } finally {
            setImagesUpdating(false);
        }
    };

    const onSetMainImage = async (imageId) => {
        if (!id || !ownerId || Number.isNaN(ownerId)) return;
        setImagesUpdating(true);
        setError('');
        try {
            await setMainVehicleImage(id, ownerId, imageId);
            await loadVehicle();
        } catch (err) {
            setError(err?.message || 'Không thể đặt ảnh chính');
        } finally {
            setImagesUpdating(false);
        }
    };

    const onDeleteImage = async (imageId) => {
        if (!id || !ownerId || Number.isNaN(ownerId)) return;
        if (!window.confirm('Bạn có chắc muốn xóa ảnh này không?')) return;

        setImagesUpdating(true);
        setError('');
        try {
            await deleteVehicleImage(id, ownerId, imageId);
            await loadVehicle();
        } catch (err) {
            setError(err?.message || 'Không thể xóa ảnh');
        } finally {
            setImagesUpdating(false);
        }
    };

    return (
        <div className="fleet-dashboard">
            <FleetSidebar user={user} onLogout={handleLogout} />

            <section className="fleet-main">
                <header className="fleet-header">
                    <div>
                        <p className="fleet-breadcrumb">Chủ xe / Chỉnh sửa xe</p>
                        <h1>Chỉnh sửa xe</h1>
                        {vehicle && (
                            <p className="vehicle-subtitle">
                                ● {brandName} {modelName}
                            </p>
                        )}
                    </div>
                    <Link to={ownerId ? `/owner/fleet?ownerId=${ownerId}` : '/owner/fleet'} className="btn-back">
                        ← Quay lại
                    </Link>
                </header>

                {error && <div className="fleet-alert" role="alert">{error}</div>}

                {loading ? (
                    <div className="fleet-loading">Đang tải...</div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <OwnerVehicleTypeSection
                            modelsLoading={modelsLoading}
                            brandName={brandName}
                            setBrandName={setBrandName}
                            setModelName={setModelName}
                            setTypeName={setTypeName}
                            brandOptions={brandOptions}
                            isCustomModel={isCustomModel}
                            setIsCustomModel={setIsCustomModel}
                            modelName={modelName}
                            modelOptionsForBrand={modelOptionsForBrand}
                            typeName={typeName}
                        />

                        <OwnerVehicleBasicSection form={form} handleChange={handleChange} />

                        <OwnerVehicleSpecsSection
                            form={form}
                            handleChange={handleChange}
                            transmissionValues={TRANSMISSION_VALUES}
                            fuelValues={FUEL_VALUES}
                            formatEnumLabel={formatEnumLabel}
                        />

                        <OwnerVehicleFeaturesSection
                            featureCatalog={featureCatalog}
                            selectedFeatureIds={selectedFeatureIds}
                            onToggleFeature={onToggleFeature}
                        />

                        <OwnerVehicleLocationSection
                            form={form}
                            handleChange={handleChange}
                            statusValues={STATUS_VALUES}
                            formatEnumLabel={formatEnumLabel}
                        />

                        <OwnerVehicleImagesSection
                            vehicle={vehicle}
                            imagesUpdating={imagesUpdating}
                            onSetMainImage={onSetMainImage}
                            onDeleteImage={onDeleteImage}
                            imageUrlsInput={imageUrlsInput}
                            setImageUrlsInput={setImageUrlsInput}
                            onAddImageUrls={onAddImageUrls}
                            uploadFiles={uploadFiles}
                            setUploadFiles={setUploadFiles}
                            onUploadImages={onUploadImages}
                        />

                        <div className="action-bar">
                            <button type="button" className="btn-cancel" onClick={handleCancel}>
                                × Hủy thay đổi
                            </button>
                            <button type="submit" className="btn-primary" disabled={saving}>
                                {saving ? 'Đang lưu...' : 'Lưu thông tin xe'}
                            </button>
                        </div>
                    </form>
                )}
            </section>
        </div>
    );
}