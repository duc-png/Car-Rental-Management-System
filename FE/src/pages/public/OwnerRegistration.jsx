import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { submitOwnerRegistration } from '../../api/ownerRegistrations';
import { listBrands } from '../../api/brands';
import { listVehicleModels } from '../../api/vehicleModels';
import { listVehicleFeatures } from '../../api/vehicleFeatures';
import '../../styles/OwnerRegistration.css';

const MAX_IMAGES = 5;
const CUSTOM_MODEL_OPTION = '__custom_model__';
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const emptyForm = {
    owner: {
        email: '',
        phone: '',
        fullName: '',
        password: ''
    },
    vehicle: {
        licensePlate: '',
        brand: '',
        model: '',
        seatCount: '',
        manufacturingYear: '',
        transmission: 'AUTOMATIC',
        fuelType: 'GASOLINE',
        pricePerDay: '',
        addressDetail: '',
        deliveryEnabled: true,
        freeDeliveryWithinKm: 0,
        maxDeliveryDistanceKm: 20,
        extraFeePerKm: 10000,
        fuelConsumption: '',
        description: '',
        featureIds: []
    }
};

function OwnerRegistration() {
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState(emptyForm);
    const [images, setImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [featureCatalog, setFeatureCatalog] = useState([]);
    const [brandCatalog, setBrandCatalog] = useState([]);
    const [modelCatalog, setModelCatalog] = useState([]);
    const [customModelName, setCustomModelName] = useState('');
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [provinceOptions, setProvinceOptions] = useState([]);
    const [wardOptions, setWardOptions] = useState([]);
    const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
    const [selectedWardCode, setSelectedWardCode] = useState('');
    const [streetDetail, setStreetDetail] = useState('');
    const [isAddressLoading, setIsAddressLoading] = useState(false);

    const previews = useMemo(() => images.map((file) => URL.createObjectURL(file)), [images]);

    useEffect(() => {
        return () => {
            previews.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [previews]);

    useEffect(() => {
        let cancelled = false;

        const loadFeatureCatalog = async () => {
            try {
                const data = await listVehicleFeatures();
                if (!cancelled) {
                    setFeatureCatalog(Array.isArray(data) ? data : []);
                }
            } catch {
                if (!cancelled) {
                    setFeatureCatalog([]);
                }
            }
        };

        loadFeatureCatalog();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadModels = async () => {
            try {
                const data = await listVehicleModels();
                if (!cancelled) {
                    setModelCatalog(Array.isArray(data) ? data : []);
                }
            } catch {
                if (!cancelled) {
                    setModelCatalog([]);
                }
            }
        };

        loadModels();

        return () => {
            cancelled = true;
        };
    }, []);

    const modelOptions = useMemo(() => {
        if (!formData.vehicle.brand) return [];

        const modelsByBrand = modelCatalog.filter((item) =>
            (item?.brandName || '').trim().toLowerCase() === formData.vehicle.brand.trim().toLowerCase()
        );

        const uniqueNames = Array.from(
            new Map(
                modelsByBrand
                    .map((item) => (item?.name || '').trim())
                    .filter(Boolean)
                    .map((name) => [name.toLowerCase(), name])
            ).values()
        );

        return uniqueNames.sort((left, right) => left.localeCompare(right, 'vi'));
    }, [modelCatalog, formData.vehicle.brand]);

    useEffect(() => {
        let cancelled = false;

        const loadBrands = async () => {
            try {
                const data = await listBrands();
                if (!cancelled) {
                    setBrandCatalog(Array.isArray(data) ? data : []);
                }
            } catch {
                if (!cancelled) {
                    setBrandCatalog([]);
                }
            }
        };

        loadBrands();

        return () => {
            cancelled = true;
        };
    }, []);

    const updateOwner = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            owner: {
                ...prev.owner,
                [field]: value
            }
        }));
    };

    const updateVehicle = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            vehicle: {
                ...prev.vehicle,
                [field]: value
            }
        }));
    };

    const handleBrandChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            vehicle: {
                ...prev.vehicle,
                brand: value,
                model: ''
            }
        }));
        setCustomModelName('');
    };

    const resolvedVehicleModel = useMemo(() => {
        if (formData.vehicle.model === CUSTOM_MODEL_OPTION || modelOptions.length === 0) {
            return customModelName;
        }
        return formData.vehicle.model;
    }, [formData.vehicle.model, modelOptions.length, customModelName]);

    const selectedProvince = useMemo(
        () => provinceOptions.find((item) => String(item.code) === String(selectedProvinceCode)) || null,
        [provinceOptions, selectedProvinceCode]
    );

    const selectedWard = useMemo(
        () => wardOptions.find((item) => String(item.code) === String(selectedWardCode)) || null,
        [wardOptions, selectedWardCode]
    );

    const loadProvinces = async () => {
        setIsAddressLoading(true);
        try {
            const response = await fetch('https://provinces.open-api.vn/api/p/');
            const data = await response.json();
            setProvinceOptions(Array.isArray(data) ? data : []);
        } catch {
            setProvinceOptions([]);
            toast.error('Không tải được danh sách tỉnh/thành phố');
        } finally {
            setIsAddressLoading(false);
        }
    };

    const loadWardsByProvince = async (provinceCode) => {
        if (!provinceCode) {
            setWardOptions([]);
            return;
        }

        setIsAddressLoading(true);
        try {
            const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=3`);
            const data = await response.json();

            const districts = Array.isArray(data?.districts) ? data.districts : [];
            const wardMap = new Map();
            districts.forEach((district) => {
                const wards = Array.isArray(district?.wards) ? district.wards : [];
                wards.forEach((ward) => {
                    if (!wardMap.has(ward.code)) {
                        wardMap.set(ward.code, { ...ward, districtName: district?.name || '' });
                    }
                });
            });

            const mergedWards = Array.from(wardMap.values()).sort((left, right) =>
                (left?.name || '').localeCompare(right?.name || '', 'vi')
            );

            setWardOptions(mergedWards);
        } catch {
            setWardOptions([]);
            toast.error('Không tải được danh sách phường/xã');
        } finally {
            setIsAddressLoading(false);
        }
    };

    const handleOpenAddressModal = async () => {
        setStreetDetail((formData.vehicle.addressDetail || '').trim());
        setIsAddressModalOpen(true);
        if (provinceOptions.length === 0) {
            await loadProvinces();
        }
    };

    const handleProvinceChange = async (value) => {
        setSelectedProvinceCode(value);
        setSelectedWardCode('');
        setWardOptions([]);
        await loadWardsByProvince(value);
    };

    const handleApplyAddress = () => {
        if (!streetDetail.trim()) {
            toast.error('Vui lòng nhập đường/địa chỉ cụ thể');
            return;
        }

        const parts = [
            (streetDetail || '').trim(),
            selectedWard?.name,
            selectedProvince?.name
        ].filter(Boolean);

        const fullAddress = parts.join(', ');
        if (!fullAddress) {
            toast.error('Vui lòng chọn địa chỉ hợp lệ');
            return;
        }

        updateVehicle('addressDetail', fullAddress);
        setIsAddressModalOpen(false);
    };

    const validateStep = (step) => {
        if (step === 1) {
            if (!formData.owner.email || !formData.owner.phone || !formData.owner.fullName || !formData.owner.password) {
                toast.error('Vui lòng nhập đầy đủ thông tin chủ xe');
                return false;
            }

            if (!formData.vehicle.licensePlate || !formData.vehicle.brand || !resolvedVehicleModel?.trim()) {
                toast.error('Vui lòng nhập đầy đủ thông tin xe');
                return false;
            }

            if (!formData.vehicle.seatCount || !formData.vehicle.manufacturingYear) {
                toast.error('Vui lòng nhập số ghế và năm sản xuất');
                return false;
            }
        }

        if (step === 2) {
            if (!formData.vehicle.pricePerDay || Number(formData.vehicle.pricePerDay) <= 0) {
                toast.error('Vui lòng nhập giá thuê hợp lệ');
                return false;
            }

            if (!formData.vehicle.addressDetail || !formData.vehicle.addressDetail.trim()) {
                toast.error('Vui lòng nhập địa chỉ xe');
                return false;
            }
        }

        if (step === 3) {
            if (images.length < 1) {
                toast.error('Vui lòng tải ít nhất 1 ảnh xe');
                return false;
            }
        }

        return true;
    };

    const toggleFeature = (featureId) => {
        setFormData((prev) => {
            const current = Array.isArray(prev.vehicle.featureIds) ? prev.vehicle.featureIds : [];
            const next = current.includes(featureId)
                ? current.filter((id) => id !== featureId)
                : [...current, featureId];

            return {
                ...prev,
                vehicle: {
                    ...prev.vehicle,
                    featureIds: next
                }
            };
        });
    };

    const handleImagesChange = (event) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) {
            setImages([]);
            return;
        }

        if (files.length > MAX_IMAGES) {
            toast.error(`Tối đa ${MAX_IMAGES} ảnh`);
            setImages(files.slice(0, MAX_IMAGES));
            return;
        }

        const invalidFile = files.find((file) => !ACCEPTED_IMAGE_TYPES.includes((file.type || '').toLowerCase()));
        if (invalidFile) {
            toast.error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP');
            event.target.value = '';
            return;
        }

        setImages(files);
    };

    const goToStep = (step) => {
        if (step < 1 || step > 3) return;
        setCurrentStep(step);
    };

    const handleNextStep = () => {
        if (!validateStep(currentStep)) return;
        goToStep(currentStep + 1);
    };

    const handlePrevStep = () => {
        if (currentStep === 1) {
            setShowForm(false);
            return;
        }
        goToStep(currentStep - 1);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateStep(currentStep)) {
            return;
        }

        if (currentStep < 3) {
            handleNextStep();
            return;
        }

        const payload = {
            owner: {
                email: formData.owner.email.trim(),
                phone: formData.owner.phone.trim(),
                fullName: formData.owner.fullName.trim(),
                password: formData.owner.password
            },
            vehicle: {
                licensePlate: formData.vehicle.licensePlate.trim(),
                brand: formData.vehicle.brand.trim(),
                model: resolvedVehicleModel.trim(),
                seatCount: Number(formData.vehicle.seatCount),
                manufacturingYear: Number(formData.vehicle.manufacturingYear),
                transmission: formData.vehicle.transmission,
                fuelType: formData.vehicle.fuelType,
                pricePerDay: Number(formData.vehicle.pricePerDay),
                addressDetail: formData.vehicle.addressDetail.trim(),
                deliveryEnabled: Boolean(formData.vehicle.deliveryEnabled),
                freeDeliveryWithinKm: formData.vehicle.deliveryEnabled
                    ? Number(formData.vehicle.freeDeliveryWithinKm || 0)
                    : null,
                maxDeliveryDistanceKm: formData.vehicle.deliveryEnabled
                    ? Number(formData.vehicle.maxDeliveryDistanceKm || 0)
                    : null,
                extraFeePerKm: formData.vehicle.deliveryEnabled
                    ? Number(formData.vehicle.extraFeePerKm || 0)
                    : null,
                fuelConsumption: formData.vehicle.fuelConsumption
                    ? Number(formData.vehicle.fuelConsumption)
                    : null,
                description: formData.vehicle.description.trim() || null,
                featureIds: Array.isArray(formData.vehicle.featureIds) ? formData.vehicle.featureIds : []
            }
        };

        try {
            setIsSubmitting(true);
            await submitOwnerRegistration(payload, images);
            toast.success('Đã gửi yêu cầu, admin sẽ duyệt sớm');
            setFormData(emptyForm);
            setImages([]);
            setCurrentStep(1);
            navigate('/');
        } catch (error) {
            toast.error(error.message || 'Gửi yêu cầu thất bại');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!showForm) {
        return (
            <section className="owner-registration-intro">
                <div className="owner-registration-intro-shell">
                    <h1>Đăng ký xe</h1>

                    <div className="owner-registration-intro-visual">
                        <img
                            src="https://www.mioto.vn/static/media/empty_trip.2a66f8dd.svg"
                            alt="Đăng ký xe"
                            onError={(event) => {
                                event.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>

                    <button
                        type="button"
                        className="owner-registration-intro-cta"
                        onClick={() => {
                            setShowForm(true);
                            setCurrentStep(1);
                        }}
                    >
                        Đăng ký xe tự lái
                    </button>

                    <h2>Gia tăng thu nhập hàng tháng cùng CarRental!</h2>

                    <div className="owner-registration-intro-checklist">
                        <h3>Thủ tục đăng ký đơn giản & nhanh chóng:</h3>
                        <ul>
                            <li>Điền thông tin xe</li>
                            <li>Đăng tải hình ảnh xe</li>
                            <li>CarRental xem thông tin chủ xe và duyệt xe</li>
                            <li>Bắt đầu cho thuê</li>
                        </ul>
                    </div>

                    <p className="owner-registration-intro-policy">
                        ⓘ Chính sách <a href="#">Hỗ trợ phạt nguội cùng chủ xe</a>
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="owner-registration owner-registration--form">
            <div className="owner-registration-form-shell">
                <button
                    type="button"
                    className="owner-registration-form-back"
                    onClick={handlePrevStep}
                >
                    ← Quay lại
                </button>

                <h1 className="owner-registration-form-title">Đăng ký xe</h1>

                <div className="owner-registration-form-stepper">
                    <div className={`owner-step-item ${currentStep === 1 ? 'active' : ''}`}>
                        <span>1</span>
                        <small>Thông tin</small>
                    </div>
                    <div className="owner-step-divider">›</div>
                    <div className={`owner-step-item ${currentStep === 2 ? 'active' : ''}`}>
                        <span>2</span>
                        <small>Cho thuê</small>
                    </div>
                    <div className="owner-step-divider">›</div>
                    <div className={`owner-step-item ${currentStep === 3 ? 'active' : ''}`}>
                        <span>3</span>
                        <small>Hình ảnh</small>
                    </div>
                </div>

                <form className="owner-registration-form" onSubmit={handleSubmit}>
                    {currentStep === 1 && <>
                        <div className="form-section">
                            <h2>Thông tin chủ xe</h2>
                            <div className="form-grid">
                                <label>
                                    Họ và tên
                                    <input
                                        type="text"
                                        value={formData.owner.fullName}
                                        onChange={(event) => updateOwner('fullName', event.target.value)}
                                        placeholder="Ví Dụ: Nguyễn Văn A"
                                        required
                                    />
                                </label>
                                <label>
                                    Email
                                    <input
                                        type="email"
                                        value={formData.owner.email}
                                        onChange={(event) => updateOwner('email', event.target.value)}
                                        placeholder="Ví Dụ:owner@email.com"
                                        required
                                    />
                                </label>
                                <label>
                                    Số điện thoại
                                    <input
                                        type="tel"
                                        value={formData.owner.phone}
                                        onChange={(event) => updateOwner('phone', event.target.value)}
                                        placeholder="Ví Dụ:0901234567"
                                        required
                                    />
                                </label>
                                <label>
                                    Mật khẩu
                                    <input
                                        type="password"
                                        value={formData.owner.password}
                                        onChange={(event) => updateOwner('password', event.target.value)}
                                        placeholder="********"
                                        required
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="form-section owner-vehicle-license-section">
                            <h2>Biển số xe</h2>
                            <small className="owner-warning-text">
                                Lưu ý: Biển số xe không thể thay đổi sau khi đăng ký.
                            </small>
                            <div className="form-grid">
                                <label>
                                    <input
                                        type="text"
                                        value={formData.vehicle.licensePlate}
                                        onChange={(event) => updateVehicle('licensePlate', event.target.value)}
                                        placeholder="Ví Dụ: 51A-12345"
                                        required
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="form-section">
                            <h2>Thông tin cơ bản</h2>
                            <small className="owner-warning-text">
                                Lưu ý: Các thông tin cơ bản sẽ không thể thay đổi sau khi đăng ký.
                            </small>
                            <div className="form-grid">
                                <label>
                                    Hãng xe
                                    <select
                                        value={formData.vehicle.brand}
                                        onChange={(event) => handleBrandChange(event.target.value)}
                                        required
                                    >
                                        <option value="">Chọn hãng xe</option>
                                        {brandCatalog.map((brand) => (
                                            <option key={brand.id || brand.name} value={brand.name || ''}>
                                                {brand.name || ''}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    Mẫu xe
                                    {modelOptions.length > 0 ? (
                                        <>
                                            <select
                                                value={formData.vehicle.model}
                                                onChange={(event) => updateVehicle('model', event.target.value)}
                                                disabled={!formData.vehicle.brand}
                                                required
                                            >
                                                <option value="">Chọn mẫu xe</option>
                                                {modelOptions.map((modelName) => (
                                                    <option key={modelName} value={modelName}>{modelName}</option>
                                                ))}
                                                <option value={CUSTOM_MODEL_OPTION}>+ Khác</option>
                                            </select>
                                            {formData.vehicle.model === CUSTOM_MODEL_OPTION && (
                                                <input
                                                    type="text"
                                                    value={customModelName}
                                                    onChange={(event) => setCustomModelName(event.target.value)}
                                                    placeholder="Nhập mẫu xe mới"
                                                    required
                                                />
                                            )}
                                        </>
                                    ) : (
                                        <input
                                            type="text"
                                            value={customModelName}
                                            onChange={(event) => setCustomModelName(event.target.value)}
                                            placeholder={formData.vehicle.brand ? 'Nhập mẫu xe mới' : 'Chọn hãng xe trước'}
                                            disabled={!formData.vehicle.brand}
                                            required
                                        />
                                    )}
                                </label>
                                <label>
                                    Số ghế
                                    <input
                                        type="number"
                                        min="2"
                                        max="16"
                                        value={formData.vehicle.seatCount}
                                        onChange={(event) => updateVehicle('seatCount', event.target.value)}
                                        required
                                    />
                                </label>
                                <label>
                                    Năm sản xuất
                                    <input
                                        type="number"
                                        min="1980"
                                        max="2100"
                                        value={formData.vehicle.manufacturingYear}
                                        onChange={(event) => updateVehicle('manufacturingYear', event.target.value)}
                                        required
                                    />
                                </label>
                                <label>
                                    Truyền động
                                    <select
                                        value={formData.vehicle.transmission}
                                        onChange={(event) => updateVehicle('transmission', event.target.value)}
                                    >
                                        <option value="AUTOMATIC">Số tự động</option>
                                        <option value="MANUAL">Số sàn</option>
                                    </select>
                                </label>
                                <label>
                                    Nhiên liệu
                                    <select
                                        value={formData.vehicle.fuelType}
                                        onChange={(event) => updateVehicle('fuelType', event.target.value)}
                                    >
                                        <option value="GASOLINE">Xăng</option>
                                        <option value="DIESEL">Dầu</option>
                                        <option value="ELECTRIC">Điện</option>
                                    </select>
                                </label>
                            </div>

                            <div className="owner-fuel-consumption-section">
                                <h3>Mức tiêu thụ nhiên liệu</h3>
                                <p>Số lít nhiên liệu cho quãng đường 100km.</p>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={formData.vehicle.fuelConsumption}
                                    onChange={(event) => updateVehicle('fuelConsumption', event.target.value)}
                                    placeholder="Ví Dụ: 6.8"
                                />
                            </div>

                            <label className="full-width owner-description-field">
                                <span>Mô tả xe</span>
                                <textarea
                                    rows="4"
                                    value={formData.vehicle.description}
                                    onChange={(event) => updateVehicle('description', event.target.value)}
                                    placeholder="Mô tả tình trạng, nội thất, ngoại thất..."
                                />
                            </label>
                            <h3 className="owner-feature-title">Tính năng</h3>
                            <div className="owner-feature-grid">
                                {featureCatalog.length === 0 && (
                                    <p className="owner-feature-empty">Chưa tải được danh sách tính năng.</p>
                                )}
                                {featureCatalog.map((feature) => (
                                    <label key={feature.id} className="owner-feature-item">
                                        <input
                                            type="checkbox"
                                            checked={formData.vehicle.featureIds.includes(feature.id)}
                                            onChange={() => toggleFeature(feature.id)}
                                        />
                                        <span>{feature.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </>}

                    {currentStep === 2 && <div className="form-section">
                        <h2>Thông tin cho thuê</h2>
                        <div className="form-grid">
                            <label>
                                Giá thuê (₫/ngày)
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.vehicle.pricePerDay}
                                    onChange={(event) => updateVehicle('pricePerDay', event.target.value)}
                                    placeholder="Ví dụ: 800000"
                                    required
                                />
                            </label>
                            <label>
                                Địa chỉ xe
                                <button
                                    type="button"
                                    className="owner-address-trigger"
                                    onClick={handleOpenAddressModal}
                                >
                                    <span>{formData.vehicle.addressDetail || 'Địa chỉ mặc định để giao nhận xe.'}</span>
                                    <span className="owner-address-trigger-icon" aria-hidden="true">🗺</span>
                                </button>
                            </label>
                            <label className="owner-delivery-field" htmlFor="delivery-enabled">
                                <span>Giao xe tận nơi</span>
                                <input
                                    id="delivery-enabled"
                                    type="checkbox"
                                    checked={formData.vehicle.deliveryEnabled}
                                    onChange={(event) => updateVehicle('deliveryEnabled', event.target.checked)}
                                />
                            </label>
                        </div>

                        {formData.vehicle.deliveryEnabled && (
                            <div className="owner-delivery-config">
                                <div className="owner-delivery-config-grid">
                                    <div className="owner-range-field">
                                        <div className="owner-range-label-row">
                                            <span>Quãng đường giao xe tối đa</span>
                                            <b>{formData.vehicle.maxDeliveryDistanceKm || 20}km</b>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="50"
                                            value={formData.vehicle.maxDeliveryDistanceKm || 20}
                                            onChange={(event) => updateVehicle('maxDeliveryDistanceKm', event.target.value)}
                                        />
                                    </div>

                                    <div className="owner-range-field">
                                        <div className="owner-range-label-row">
                                            <span>Phí giao nhận xe cho mỗi km</span>
                                            <b>{Number(formData.vehicle.extraFeePerKm || 10000).toLocaleString('vi-VN')}đ</b>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="30000"
                                            step="1000"
                                            value={formData.vehicle.extraFeePerKm || 10000}
                                            onChange={(event) => updateVehicle('extraFeePerKm', event.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="owner-range-field owner-range-field-single">
                                    <div className="owner-range-label-row">
                                        <span>Miễn phí giao nhận xe trong vòng</span>
                                        <b>{formData.vehicle.freeDeliveryWithinKm || 0}km</b>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="20"
                                        value={formData.vehicle.freeDeliveryWithinKm || 0}
                                        onChange={(event) => updateVehicle('freeDeliveryWithinKm', event.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>}

                    {currentStep === 3 && <div className="form-section">
                        <h2>Ảnh xe </h2>
                        <p className="helper-text">Ảnh đầu tiên sẽ được xem là ảnh đại diện.</p>
                        <label className="image-dropzone">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImagesChange}
                            />
                            <span>Kéo thả ảnh hoặc bấm để tải lên</span>
                            <small>PNG, JPG. Tối đa 5 ảnh.</small>
                        </label>
                        <div className="image-preview-grid">
                            {previews.map((src, index) => (
                                <div className="image-preview" key={`${src}-${index}`}>
                                    <img src={src} alt={`Xe ${index + 1}`} />
                                    {index === 0 && <span className="image-badge">Ảnh chính</span>}
                                </div>
                            ))}
                        </div>
                    </div>}

                    <div className="form-actions">
                        <button type="button" className="ghost-btn" onClick={handlePrevStep}>Quay lại</button>
                        <button type="submit" className="primary-btn" disabled={isSubmitting}>
                            {isSubmitting
                                ? 'Đang gửi...'
                                : currentStep < 3
                                    ? 'Kế tiếp'
                                    : 'Gửi yêu cầu'}
                        </button>
                    </div>
                </form>

                {isAddressModalOpen && (
                    <div className="owner-address-modal-overlay" onClick={() => setIsAddressModalOpen(false)}>
                        <div className="owner-address-modal" onClick={(event) => event.stopPropagation()}>
                            <button
                                type="button"
                                className="owner-address-modal-close"
                                onClick={() => setIsAddressModalOpen(false)}
                                aria-label="Đóng"
                            >
                                ×
                            </button>

                            <h3>Chỉnh sửa địa chỉ</h3>

                            <label>
                                Tỉnh / Thành phố
                                <select
                                    value={selectedProvinceCode}
                                    onChange={(event) => handleProvinceChange(event.target.value)}
                                >
                                    <option value="">Chọn thành phố</option>
                                    {provinceOptions.map((province) => (
                                        <option key={province.code} value={province.code}>{province.name}</option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Xã / Phường
                                <select
                                    value={selectedWardCode}
                                    onChange={(event) => setSelectedWardCode(event.target.value)}
                                    disabled={!selectedProvinceCode}
                                >
                                    <option value="">Chọn xã/phường</option>
                                    {wardOptions.map((ward) => (
                                        <option key={ward.code} value={ward.code}>{ward.name}</option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Đường / Địa chỉ cụ thể
                                <input
                                    type="text"
                                    value={streetDetail}
                                    onChange={(event) => setStreetDetail(event.target.value)}
                                    placeholder="Nhập tên đường / tòa nhà"
                                />
                            </label>

                            <button
                                type="button"
                                className="owner-address-apply-btn"
                                onClick={handleApplyAddress}
                                disabled={isAddressLoading}
                            >
                                Áp dụng
                            </button>

                            <button
                                type="button"
                                className="owner-address-cancel-btn"
                                onClick={() => setIsAddressModalOpen(false)}
                            >
                                Hủy bỏ
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default OwnerRegistration;
