// src/pages/owner/OwnerVehicleEdit.jsx
import { useCallback, useEffect, useState } from 'react';
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
    updateOwnerVehicleStatus,
    addVehicleImagesByUrl,
    uploadVehicleImages,
    setMainVehicleImage,
    deleteVehicleImage,
} from '../../api/ownerVehicles';
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
        district: '',
        ward: '',
        addressDetail: '',
        deliveryEnabled: true,
        freeDeliveryWithinKm: 0,
        maxDeliveryDistanceKm: 20,
        extraFeePerKm: 10000,
        status: '',
    });

    const [featureCatalog, setFeatureCatalog] = useState([]);
    const [selectedFeatureIds, setSelectedFeatureIds] = useState([]);

    // Fields cho hãng, mẫu, loại (tương tự modal thêm xe)
    const [brandName, setBrandName] = useState('');
    const [modelName, setModelName] = useState('');
    const [typeName, setTypeName] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [imageUrlsInput, setImageUrlsInput] = useState('');
    const [uploadFiles, setUploadFiles] = useState([]);
    const [invalidUploadNames, setInvalidUploadNames] = useState([]);
    const [setFirstAsMain, setSetFirstAsMain] = useState(false);
    const [imagesUpdating, setImagesUpdating] = useState(false);
    const isPendingApproval = String(vehicle?.status || '') === 'PENDING_APPROVAL';
    const isRejected = String(vehicle?.status || '') === 'REJECTED';

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
                    province: data.province ?? data.city ?? '',
                    district: data.district ?? '',
                    ward: data.ward ?? '',
                    addressDetail: data.addressDetail ?? '',
                    deliveryEnabled: data.deliveryEnabled === undefined || data.deliveryEnabled === null
                        ? true
                        : Boolean(data.deliveryEnabled),
                    freeDeliveryWithinKm: data.freeDeliveryWithinKm ?? 0,
                    maxDeliveryDistanceKm: data.maxDeliveryDistanceKm ?? 20,
                    extraFeePerKm: data.extraFeePerKm ?? 10000,
                    status: data.status || '',
                });
            }
        } catch (err) {
            setError(err?.message || 'Không thể tải thông tin xe');
        } finally {
            setLoading(false);
        }
    }, [id]);

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
        loadFeatureCatalog();
    }, [loadFeatureCatalog]);

    const handleChange = (e) => {
        if (isPendingApproval) return;
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const onToggleFeature = (featureId) => {
        if (isPendingApproval) return;
        setSelectedFeatureIds((prev) => {
            if (prev.includes(featureId)) {
                return prev.filter((item) => item !== featureId);
            }
            return [...prev, featureId];
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isPendingApproval) {
            setError('Xe đang trong trạng thái chờ duyệt, chưa thể chỉnh sửa vào lúc này.');
            return;
        }
        if (!ownerId) {
            setError('Thiếu thông tin chủ xe. Vui lòng đăng nhập lại.');
            return;
        }

        setSaving(true);
        setError('');
        const wasRejected = String(vehicle?.status || '') === 'REJECTED';
        const nextStatus = String(form.status || '').trim().toUpperCase();
        const currentStatus = String(vehicle?.status || '').trim().toUpperCase();
        const shouldUpdateStatus =
            !wasRejected &&
            !isPendingApproval &&
            Boolean(nextStatus) &&
            nextStatus !== currentStatus;

        try {
            const payload = {
                color: form.color?.trim() || vehicle?.color || null,
                transmission: form.transmission || vehicle?.transmission || null,
                pricePerDay: form.pricePerDay ? Number(form.pricePerDay) : vehicle?.pricePerDay,
                fuelConsumption: form.fuelConsumption ? Number(form.fuelConsumption) : (vehicle?.fuelConsumption || null),
                description: form.description?.trim() || vehicle?.description || null,
                currentKm: form.currentKm ? Number(form.currentKm) : vehicle?.currentKm,
                location: {
                    province: form.province?.trim() || vehicle?.province || vehicle?.city || null,
                    district: form.district?.trim() || vehicle?.district || null,
                    ward: form.ward?.trim() || vehicle?.ward || null,
                    addressDetail: form.addressDetail?.trim() || vehicle?.addressDetail || null,
                },
                deliveryEnabled: Boolean(form.deliveryEnabled),
                freeDeliveryWithinKm: form.deliveryEnabled
                    ? Math.max(0, Number(form.freeDeliveryWithinKm || 0))
                    : null,
                maxDeliveryDistanceKm: form.deliveryEnabled
                    ? Math.max(0, Number(form.maxDeliveryDistanceKm || 0))
                    : null,
                extraFeePerKm: form.deliveryEnabled
                    ? Math.max(0, Number(form.extraFeePerKm || 0))
                    : null,
                featureIds: selectedFeatureIds,
            };

            await updateOwnerVehicle(id, ownerId, payload);

            if (shouldUpdateStatus) {
                await updateOwnerVehicleStatus(id, ownerId, nextStatus);
            }

            // Xử lý ảnh
            if (uploadFiles.length > 0) {
                await uploadVehicleImages(id, ownerId, uploadFiles, { setFirstAsMain });
                setUploadFiles([]);
                setInvalidUploadNames([]);
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
            if (wasRejected) {
                alert('Đã cập nhật và gửi lại yêu cầu duyệt xe thành công!');
            } else {
                alert('Cập nhật thông tin xe thành công!');
            }
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
        if (isPendingApproval) return;
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
        if (isPendingApproval) return;
        if (!id || !ownerId || Number.isNaN(ownerId) || !uploadFiles.length) return;

        setImagesUpdating(true);
        setError('');
        try {
            await uploadVehicleImages(id, ownerId, uploadFiles, { setFirstAsMain });
            await loadVehicle();
            setUploadFiles([]);
            setInvalidUploadNames([]);
            setSetFirstAsMain(false);
        } catch (err) {
            setError(err?.message || 'Không thể tải ảnh lên');
        } finally {
            setImagesUpdating(false);
        }
    };

    const onSetMainImage = async (imageId) => {
        if (isPendingApproval) return;
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
        if (isPendingApproval) return;
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

                {isPendingApproval && (
                    <div className="fleet-alert" role="status">
                        Xe đang chờ duyệt. Bạn chưa thể chỉnh sửa thông tin cho đến khi admin xử lý xong yêu cầu.
                    </div>
                )}

                {isRejected && (
                    <div className="fleet-alert" role="status">
                        Xe đã bị từ chối duyệt. Hãy cập nhật thông tin/ảnh và bấm Lưu để gửi lại yêu cầu duyệt.
                    </div>
                )}

                {loading ? (
                    <div className="fleet-loading">Đang tải...</div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <fieldset disabled={isPendingApproval}>
                            <OwnerVehicleTypeSection
                                brandName={brandName}
                                modelName={modelName}
                                typeName={typeName}
                                immutable
                            />

                            <OwnerVehicleBasicSection form={form} handleChange={handleChange} immutable />

                            <OwnerVehicleSpecsSection
                                form={form}
                                handleChange={handleChange}
                                transmissionValues={TRANSMISSION_VALUES}
                                fuelValues={FUEL_VALUES}
                                formatEnumLabel={formatEnumLabel}
                                immutable
                            />

                            <OwnerVehicleFeaturesSection
                                featureCatalog={featureCatalog}
                                selectedFeatureIds={selectedFeatureIds}
                                onToggleFeature={onToggleFeature}
                            />

                            <OwnerVehicleLocationSection
                                form={form}
                                handleChange={handleChange}
                                setForm={setForm}
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
                                invalidUploadNames={invalidUploadNames}
                                onImageFileError={(message) => setError(message)}
                                onInvalidUploadNamesChange={setInvalidUploadNames}
                            />

                            <div className="action-bar">
                                <button type="button" className="btn-cancel" onClick={handleCancel}>
                                    × Hủy thay đổi
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving || isPendingApproval}>
                                    {saving ? 'Đang lưu...' : isRejected ? 'Lưu & gửi lại duyệt' : 'Lưu thông tin xe'}
                                </button>
                            </div>
                        </fieldset>
                    </form>
                )}
            </section>
        </div>
    );
}