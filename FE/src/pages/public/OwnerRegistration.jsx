import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    sendOwnerRegistrationEmailOtp,
    submitOwnerRegistration,
    verifyOwnerRegistrationEmailOtp
} from '../../api/ownerRegistrations';
import { useAuth } from '../../hooks/useAuth';
import { useVehicleCatalogs } from '../../hooks/useVehicleCatalogs';
import { generateQueryVariants, resolveBestGeocodeFromVariants } from '../../utils/carDetailsUtils';
import {
    createEmptyOwnerRegistrationForm,
    CUSTOM_MODEL_OPTION,
    MAX_OWNER_REGISTRATION_IMAGES,
} from '../../utils/ownerRegistrationUtils';
import { buildInvalidImageFilesMessage, getInvalidFileNames, splitImageFiles } from '../../utils/imageFileValidation';
import '../../styles/OwnerRegistration.css';
import 'leaflet/dist/leaflet.css';

function OwnerRegistration() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState(() => createEmptyOwnerRegistrationForm());
    const [images, setImages] = useState([]);
    const [invalidImageNames, setInvalidImageNames] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [otpValue, setOtpValue] = useState('');
    const [isOtpVerifying, setIsOtpVerifying] = useState(false);
    const [isOtpResending, setIsOtpResending] = useState(false);
    const {
        featureCatalog,
        brands: brandCatalog,
        vehicleModels: modelCatalog,
    } = useVehicleCatalogs();
    const [customModelName, setCustomModelName] = useState('');
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [provinceOptions, setProvinceOptions] = useState([]);
    const [districtOptions, setDistrictOptions] = useState([]);
    const [allWardOptions, setAllWardOptions] = useState([]);
    const [wardOptions, setWardOptions] = useState([]);
    const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
    const [selectedDistrictCode, setSelectedDistrictCode] = useState('');
    const [selectedWardCode, setSelectedWardCode] = useState('');
    const [streetDetail, setStreetDetail] = useState('');
    const [isAddressLoading, setIsAddressLoading] = useState(false);
    const [addressMapCoords, setAddressMapCoords] = useState(null);
    const [addressMapLoading, setAddressMapLoading] = useState(false);
    const [addressMapError, setAddressMapError] = useState('');
    const addressMapContainerRef = useRef(null);
    const addressMapRef = useRef(null);

    const previews = useMemo(() => images.map((file) => URL.createObjectURL(file)), [images]);
    const roleText = String(user?.role || user?.scope || '');
    const isAdminAccount = roleText.includes('ROLE_ADMIN') || roleText.includes('ADMIN');
    const isOwnerAccount = roleText.includes('ROLE_CAR_OWNER') || roleText.includes('CAR_OWNER')
        || roleText.includes('ROLE_EXPERT') || roleText.includes('EXPERT');
    const isOwnerRegistrationBlocked = isAuthenticated && (isAdminAccount || isOwnerAccount);
    const isLoggedCustomerFlow = isAuthenticated && !isAdminAccount;

    useEffect(() => {
        if (isOwnerRegistrationBlocked) {
            setShowForm(false);
        }
    }, [isOwnerRegistrationBlocked]);

    useEffect(() => {
        if (!isLoggedCustomerFlow) return;

        setFormData((prev) => ({
            ...prev,
            owner: {
                ...prev.owner,
                email: String(user?.email || user?.sub || '').trim(),
                phone: String(user?.phone || '').trim(),
                fullName: String(user?.fullName || user?.name || '').trim(),
                password: ''
            }
        }));
    }, [isLoggedCustomerFlow, user]);

    useEffect(() => {
        return () => {
            previews.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [previews]);

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

    const selectedDistrict = useMemo(
        () => districtOptions.find((item) => String(item.code) === String(selectedDistrictCode)) || null,
        [districtOptions, selectedDistrictCode]
    );

    const formatFeeShort = (value) => {
        const fee = Number(value || 0);
        if (!Number.isFinite(fee) || fee <= 0) return '0';
        return `${Math.round(fee / 1000)}K`;
    };

    const hasSelectedAddress = Boolean(String(formData.vehicle.addressDetail || '').trim());
    const isElectricFuel = formData.vehicle.fuelType === 'ELECTRIC';
    const fuelConsumptionDescription = isElectricFuel
        ? 'Số km đi được trong 1 lần sạc đầy.'
        : 'Số lít nhiên liệu cho quãng đường 100km.';
    const fuelConsumptionPlaceholder = isElectricFuel ? 'Ví dụ: 350' : 'Ví dụ: 6.8';

    useEffect(() => {
        if (currentStep !== 2) return;

        const addressText = String(formData.vehicle.addressDetail || '').trim();
        if (!addressText) {
            setAddressMapCoords(null);
            setAddressMapError('');
            setAddressMapLoading(false);
            return;
        }

        const controller = new AbortController();

        const resolveAddressCoordinates = async () => {
            try {
                setAddressMapLoading(true);
                setAddressMapError('');

                const parts = addressText.split(',').map((part) => part.trim()).filter(Boolean);
                const province = parts.length > 0 ? parts[parts.length - 1] : '';
                const district = parts.length > 1 ? parts[parts.length - 2] : '';
                const ward = parts.length > 2 ? parts[parts.length - 3] : '';
                const detail = parts.length > 3 ? parts.slice(0, -3).join(', ') : addressText;
                const detailWithWard = [detail, ward].filter(Boolean).join(', ');
                const variants = generateQueryVariants(detailWithWard, district, province);
                const referenceQuery = [detailWithWard, district, province].filter(Boolean).join(', ');
                const result = await resolveBestGeocodeFromVariants(variants, referenceQuery, controller.signal);

                if (!result?.lat || !result?.lon) {
                    setAddressMapCoords(null);
                    setAddressMapError('Không tìm thấy vị trí bản đồ từ địa chỉ đã chọn');
                    return;
                }

                setAddressMapCoords({ lat: Number(result.lat), lon: Number(result.lon) });
                setAddressMapError('');
            } catch (error) {
                if (error?.name === 'AbortError') return;
                setAddressMapCoords(null);
                setAddressMapError('Không thể tải bản đồ lúc này');
            } finally {
                setAddressMapLoading(false);
            }
        };

        resolveAddressCoordinates();

        return () => {
            controller.abort();
        };
    }, [currentStep, formData.vehicle.addressDetail]);

    useEffect(() => {
        if (currentStep !== 2) return;
        if (!addressMapCoords) return;
        if (!addressMapContainerRef.current) return;

        let cancelled = false;

        const initInlineMap = async () => {
            const L = (await import('leaflet')).default;
            if (cancelled) return;

            if (addressMapRef.current) {
                addressMapRef.current.remove();
                addressMapRef.current = null;
            }

            const center = [addressMapCoords.lat, addressMapCoords.lon];
            const map = L.map(addressMapContainerRef.current, {
                zoomControl: true,
                attributionControl: false
            }).setView(center, 14);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(map);

            L.circle(center, {
                radius: 900,
                color: '#8f8f8f',
                weight: 1,
                fillColor: '#8f8f8f',
                fillOpacity: 0.24
            }).addTo(map);

            L.circleMarker(center, {
                radius: 7,
                color: '#3b82f6',
                weight: 2,
                fillColor: '#3b82f6',
                fillOpacity: 1
            }).addTo(map);

            addressMapRef.current = map;
        };

        initInlineMap();

        return () => {
            cancelled = true;
        };
    }, [currentStep, addressMapCoords]);

    useEffect(() => {
        if (!hasSelectedAddress || currentStep !== 2) {
            if (addressMapRef.current) {
                addressMapRef.current.remove();
                addressMapRef.current = null;
            }
            return;
        }
    }, [hasSelectedAddress, currentStep]);

    useEffect(() => {
        return () => {
            if (!addressMapRef.current) return;
            addressMapRef.current.remove();
            addressMapRef.current = null;
        };
    }, []);

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
            setDistrictOptions([]);
            setAllWardOptions([]);
            setWardOptions([]);
            return;
        }

        setIsAddressLoading(true);
        try {
            const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=3`);
            const data = await response.json();

            const districts = Array.isArray(data?.districts) ? data.districts : [];
            const nextDistricts = districts
                .map((district) => ({ code: district?.code, name: district?.name || '' }))
                .filter((district) => district.code)
                .sort((left, right) => (left?.name || '').localeCompare(right?.name || '', 'vi'));
            const wardMap = new Map();
            districts.forEach((district) => {
                const wards = Array.isArray(district?.wards) ? district.wards : [];
                wards.forEach((ward) => {
                    if (!wardMap.has(ward.code)) {
                        wardMap.set(ward.code, {
                            ...ward,
                            districtCode: district?.code,
                            districtName: district?.name || ''
                        });
                    }
                });
            });

            const mergedWards = Array.from(wardMap.values()).sort((left, right) =>
                (left?.name || '').localeCompare(right?.name || '', 'vi')
            );

            setDistrictOptions(nextDistricts);
            setAllWardOptions(mergedWards);
            setWardOptions(mergedWards);
        } catch {
            setDistrictOptions([]);
            setAllWardOptions([]);
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
        setSelectedDistrictCode('');
        setSelectedWardCode('');
        setDistrictOptions([]);
        setAllWardOptions([]);
        setWardOptions([]);
        await loadWardsByProvince(value);
    };

    const handleDistrictChange = (value) => {
        setSelectedDistrictCode(value);
        setSelectedWardCode('');
        if (!value) {
            setWardOptions(allWardOptions);
            return;
        }
        setWardOptions(
            allWardOptions.filter((ward) => String(ward?.districtCode) === String(value))
        );
    };

    const handleApplyAddress = () => {
        if (!streetDetail.trim()) {
            toast.error('Vui lòng nhập đường/địa chỉ cụ thể');
            return;
        }
        if (!selectedProvince?.name) {
            toast.error('Vui lòng chọn tỉnh/thành phố');
            return;
        }
        if (!selectedDistrict?.name) {
            toast.error('Vui lòng chọn quận/huyện');
            return;
        }
        if (!selectedWard?.name) {
            toast.error('Vui lòng chọn xã/phường');
            return;
        }

        const parts = [
            (streetDetail || '').trim(),
            selectedWard?.name,
            selectedDistrict?.name,
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
            if (!isLoggedCustomerFlow
                && (!formData.owner.email || !formData.owner.phone || !formData.owner.fullName || !formData.owner.password)) {
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
            return;
        }

        const { validFiles, invalidFiles } = splitImageFiles(files);
        if (invalidFiles.length > 0) {
            toast.error(buildInvalidImageFilesMessage(invalidFiles));
            setInvalidImageNames(getInvalidFileNames(invalidFiles));
            event.target.value = '';
            return;
        }

        setInvalidImageNames([]);

        const currentFiles = Array.isArray(images) ? images : [];
        const mergedFiles = [...currentFiles, ...validFiles];

        if (mergedFiles.length > MAX_OWNER_REGISTRATION_IMAGES) {
            toast.error(`Tối đa ${MAX_OWNER_REGISTRATION_IMAGES} ảnh`);
            setImages(mergedFiles.slice(0, MAX_OWNER_REGISTRATION_IMAGES));
            event.target.value = '';
            return;
        }

        setImages(mergedFiles);
        event.target.value = '';
    };

    const removeImageAt = (indexToRemove) => {
        setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
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

        if (isOwnerRegistrationBlocked) {
            toast.error('Tài khoản hiện tại không thể tạo thêm tài khoản chủ xe.');
            return;
        }

        if (!validateStep(currentStep)) {
            return;
        }

        if (currentStep < 3) {
            handleNextStep();
            return;
        }

        const payload = {
            owner: isLoggedCustomerFlow ? null : {
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
            setFormData(createEmptyOwnerRegistrationForm());
            setImages([]);
            setInvalidImageNames([]);
            setCurrentStep(1);
            navigate('/');
        } catch (error) {
            if (isLoggedCustomerFlow && Number(error?.code) === 2017) {
                toast.info('Email chưa xác thực. Hệ thống đã gửi OTP vào email của bạn.');
                setOtpValue('');
                setIsOtpModalOpen(true);
                return;
            }
            toast.error(error.message || 'Gửi yêu cầu thất bại');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyOtp = async () => {
        const normalizedOtp = String(otpValue || '').trim();
        if (normalizedOtp.length !== 6) {
            toast.error('Vui lòng nhập OTP gồm 6 số');
            return;
        }

        try {
            setIsOtpVerifying(true);
            await verifyOwnerRegistrationEmailOtp(normalizedOtp);
            setIsOtpModalOpen(false);
            setOtpValue('');
            toast.success('Xác thực email thành công. Vui lòng bấm Gửi yêu cầu lại.');
        } catch (error) {
            toast.error(error.message || 'OTP không hợp lệ');
        } finally {
            setIsOtpVerifying(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            setIsOtpResending(true);
            await sendOwnerRegistrationEmailOtp();
            toast.success('Đã gửi lại OTP vào email của bạn');
        } catch (error) {
            toast.error(error.message || 'Không thể gửi lại OTP');
        } finally {
            setIsOtpResending(false);
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
                        disabled={isOwnerRegistrationBlocked}
                        title={isAdminAccount
                            ? 'Admin là tài khoản quản lý hệ thống, không thể đăng ký chủ xe.'
                            : (isOwnerAccount
                                ? 'Bạn đã là chủ xe, không thể tạo thêm tài khoản chủ xe khi đang đăng nhập.'
                                : '')}
                        onClick={() => {
                            if (isOwnerRegistrationBlocked) {
                                return;
                            }
                            setShowForm(true);
                            setCurrentStep(1);
                        }}
                    >
                        Đăng ký xe tự lái
                    </button>

                    {isOwnerRegistrationBlocked && (
                        <p className="owner-registration-intro-policy">
                            {isAdminAccount
                                ? 'Admin là tài khoản quản lý hệ thống nên không thể đăng ký chủ xe.'
                                : 'Bạn đã có tài khoản chủ xe nên không thể tạo thêm khi đang đăng nhập.'}
                        </p>
                    )}

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
                        {!isLoggedCustomerFlow && (
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
                        )}

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
                                <p>{fuelConsumptionDescription}</p>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={formData.vehicle.fuelConsumption}
                                    onChange={(event) => updateVehicle('fuelConsumption', event.target.value)}
                                    placeholder={fuelConsumptionPlaceholder}
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
                            <label className="owner-rental-field-full">
                                Giá thuê (VNĐ/ngày)
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.vehicle.pricePerDay}
                                    onChange={(event) => updateVehicle('pricePerDay', event.target.value)}
                                    placeholder="Ví dụ: 800000"
                                    required
                                />
                            </label>
                            <label className="owner-rental-field-full">
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
                        </div>

                        {hasSelectedAddress && (
                            <div className="owner-address-map-wrap">
                                {addressMapLoading && <div className="owner-address-map-state">Đang tải bản đồ...</div>}
                                {!addressMapLoading && addressMapError && (
                                    <div className="owner-address-map-state owner-address-map-state-error">{addressMapError}</div>
                                )}
                                <div className="owner-address-map" ref={addressMapContainerRef} />
                            </div>
                        )}

                        <div className="owner-delivery-toggle-row">
                            <h3>Giao xe tận nơi</h3>
                            <label className="owner-switch" htmlFor="delivery-enabled">
                                <input
                                    id="delivery-enabled"
                                    type="checkbox"
                                    checked={formData.vehicle.deliveryEnabled}
                                    onChange={(event) => updateVehicle('deliveryEnabled', event.target.checked)}
                                />
                                <span className="owner-switch-slider" aria-hidden="true" />
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
                                        <small>Quãng đường đề xuất: 20km</small>
                                    </div>

                                    <div className="owner-range-field">
                                        <div className="owner-range-label-row">
                                            <span>Phí giao nhận xe cho mỗi km</span>
                                            <b>{formatFeeShort(formData.vehicle.extraFeePerKm || 10000)}</b>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="30000"
                                            step="1000"
                                            value={formData.vehicle.extraFeePerKm || 10000}
                                            onChange={(event) => updateVehicle('extraFeePerKm', event.target.value)}
                                        />
                                        <small>Phí đề xuất: 10K</small>
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
                                    <small>Quãng đường đề xuất: 0km</small>
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
                        {Array.isArray(invalidImageNames) && invalidImageNames.length > 0 && (
                            <div className="owner-invalid-image-list" role="alert">
                                <p>File khong duoc chap nhan:</p>
                                <ul>
                                    {invalidImageNames.map((name) => (
                                        <li key={name}>{name}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="image-preview-head">
                            <span>Ảnh đã chọn ({previews.length})</span>
                            <small>Bấm vào ảnh để bỏ ảnh</small>
                        </div>
                        {previews.length === 0 ? (
                            <p className="image-preview-empty">Chưa có ảnh nào được chọn.</p>
                        ) : (
                            <div className="image-preview-grid">
                                {previews.map((src, index) => (
                                    <button
                                        type="button"
                                        className="image-preview image-preview-button"
                                        key={`${src}-${index}`}
                                        onClick={() => removeImageAt(index)}
                                        title="Bấm để xóa ảnh này"
                                    >
                                        <img src={src} alt={`Xe ${index + 1}`} />
                                        {index === 0 && <span className="image-badge">Ảnh chính</span>}
                                    </button>
                                ))}
                            </div>
                        )}
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
                                Quận / Huyện
                                <select
                                    value={selectedDistrictCode}
                                    onChange={(event) => handleDistrictChange(event.target.value)}
                                    disabled={!selectedProvinceCode}
                                >
                                    <option value="">Chọn quận/huyện</option>
                                    {districtOptions.map((district) => (
                                        <option key={district.code} value={district.code}>{district.name}</option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Xã / Phường
                                <select
                                    value={selectedWardCode}
                                    onChange={(event) => setSelectedWardCode(event.target.value)}
                                    disabled={!selectedProvinceCode || !selectedDistrictCode}
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

                {isOtpModalOpen && (
                    <div className="owner-address-modal-overlay" onClick={() => setIsOtpModalOpen(false)}>
                        <div className="owner-address-modal owner-otp-modal" onClick={(event) => event.stopPropagation()}>
                            <button
                                type="button"
                                className="owner-address-modal-close"
                                onClick={() => setIsOtpModalOpen(false)}
                                aria-label="Đóng"
                            >
                                ×
                            </button>

                            <h3>Xác thực email</h3>
                            <p className="owner-otp-modal-note">
                                Vui lòng nhập mã OTP 6 số đã gửi tới email tài khoản của bạn để tiếp tục đăng ký chủ xe.
                            </p>

                            <label>
                                Mã OTP
                                <input
                                    type="text"
                                    value={otpValue}
                                    onChange={(event) => setOtpValue(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="Nhập 6 số"
                                    inputMode="numeric"
                                    maxLength={6}
                                />
                            </label>

                            <div className="owner-otp-modal-actions">
                                <button
                                    type="button"
                                    className="owner-address-cancel-btn"
                                    onClick={handleResendOtp}
                                    disabled={isOtpResending || isOtpVerifying}
                                >
                                    {isOtpResending ? 'Đang gửi lại...' : 'Gửi lại OTP'}
                                </button>
                                <button
                                    type="button"
                                    className="owner-address-apply-btn"
                                    onClick={handleVerifyOtp}
                                    disabled={isOtpVerifying || isOtpResending}
                                >
                                    {isOtpVerifying ? 'Đang xác thực...' : 'Xác thực'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default OwnerRegistration;
