import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { submitOwnerRegistration } from '../../api/ownerRegistrations';
import { listVehicleFeatures } from '../../api/vehicleFeatures';
import '../../styles/OwnerRegistration.css';

const MAX_IMAGES = 5;

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
        fuelConsumption: '',
        description: '',
        featureIds: []
    }
};

function OwnerRegistration() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState(emptyForm);
    const [images, setImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [featureCatalog, setFeatureCatalog] = useState([]);

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
            } catch (error) {
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

        setImages(files);
    };

    const validateForm = () => {
        if (!formData.owner.email || !formData.owner.phone || !formData.owner.fullName || !formData.owner.password) {
            toast.error('Vui lòng nhập đầy đủ thông tin chủ xe');
            return false;
        }

        if (!formData.vehicle.licensePlate || !formData.vehicle.brand || !formData.vehicle.model) {
            toast.error('Vui lòng nhập đầy đủ thông tin xe');
            return false;
        }

        if (!formData.vehicle.seatCount || !formData.vehicle.manufacturingYear) {
            toast.error('Vui lòng nhập số ghế và năm sản xuất');
            return false;
        }

        if (images.length < 1) {
            toast.error('Vui lòng tải ít nhất 1 ảnh xe');
            return false;
        }

        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) {
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
                model: formData.vehicle.model.trim(),
                seatCount: Number(formData.vehicle.seatCount),
                manufacturingYear: Number(formData.vehicle.manufacturingYear),
                transmission: formData.vehicle.transmission,
                fuelType: formData.vehicle.fuelType,
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
            navigate('/');
        } catch (error) {
            toast.error(error.message || 'Gửi yêu cầu thất bại');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="owner-registration">
            <div className="owner-registration-hero">
                <div className="owner-registration-hero-content">
                    <span className="owner-registration-badge">CarRental Owner</span>
                    <h1>Trở thành chủ xe trong 5 phút</h1>
                    <p>
                        Đăng ký xe của bạn và bắt đầu tạo doanh thu. Hồ sơ sẽ được admin xem xét trước khi
                        hiển thị trên hệ thống.
                    </p>
                    <div className="owner-registration-steps">
                        <span>1. Điền thông tin</span>
                        <span>2. Tải ảnh xe</span>
                        <span>3. Duyệt trong 24h</span>
                    </div>
                </div>
                <div className="owner-registration-hero-visual">
                    <div className="hero-visual-card">
                        <p className="visual-label">Tỷ lệ duyệt</p>
                        <h3>92%</h3>
                        <p>Hồ sơ đầy đủ thông tin</p>
                    </div>
                    <div className="hero-visual-card highlighted">
                        <p className="visual-label">Doanh thu trung bình</p>
                        <h3>18tr/thang</h3>
                        <p>Chủ xe đang hoạt động</p>
                    </div>
                    <div className="hero-visual-card">
                        <p className="visual-label">Hỗ trợ</p>
                        <h3>24/7</h3>
                        <p>Tư vấn & xử lý sự cố</p>
                    </div>
                </div>
            </div>

            <div className="owner-registration-body">
                <form className="owner-registration-form" onSubmit={handleSubmit}>
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

                    <div className="form-section">
                        <h2>Thông tin xe</h2>
                        <div className="form-grid">
                            <label>
                                Biển số xe
                                <input
                                    type="text"
                                    value={formData.vehicle.licensePlate}
                                    onChange={(event) => updateVehicle('licensePlate', event.target.value)}
                                    placeholder="Ví Dụ: 51A-12345"
                                    required
                                />
                            </label>
                            <label>
                                Hãng xe
                                <input
                                    type="text"
                                    value={formData.vehicle.brand}
                                    onChange={(event) => updateVehicle('brand', event.target.value)}
                                    placeholder="Ví Dụ: Toyota"
                                    required
                                />
                            </label>
                            <label>
                                Mẫu xe
                                <input
                                    type="text"
                                    value={formData.vehicle.model}
                                    onChange={(event) => updateVehicle('model', event.target.value)}
                                    placeholder="Ví Dụ: Camry"
                                    required
                                />
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
                            <label>
                                Mức tiêu thụ (L/100km)
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={formData.vehicle.fuelConsumption}
                                    onChange={(event) => updateVehicle('fuelConsumption', event.target.value)}
                                    placeholder="Ví Dụ: 6.8"
                                />
                            </label>
                        </div>
                        <label className="full-width">
                            Mô tả xe
                            <textarea
                                rows="4"
                                value={formData.vehicle.description}
                                onChange={(event) => updateVehicle('description', event.target.value)}
                                placeholder="Mô tả tình trạng, nội thất, ngoại thất..."
                            />
                        </label>
                        <div className="owner-feature-grid">
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

                    <div className="form-section">
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
                    </div>

                    <div className="form-actions">
                        <button type="button" className="ghost-btn" onClick={() => navigate('/')}>Hủy</button>
                        <button type="submit" className="primary-btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                        </button>
                    </div>
                </form>

                <aside className="owner-registration-aside">
                    <div className="aside-card">
                        <h3>Checklist hồ sơ</h3>
                        <ul>
                            <li>Thông tin chủ xe khớp giấy tờ</li>
                            <li>Thông số xe rõ ràng, không viết tắt</li>
                            <li>Ảnh xe chụp rõ 3 góc</li>
                        </ul>
                    </div>
                    <div className="aside-card standout">
                        <h3>Mẹo duyệt nhanh</h3>
                        <p>Hồ sơ duyệt nhanh hơn khi ảnh xe sáng, đủ ánh ngoài trời và có biển số rõ nét.</p>
                        <div className="aside-metrics">
                            <div>
                                <strong>2h</strong>
                                <span>Xử lý nhanh nhất</span>
                            </div>
                            <div>
                                <strong>5p</strong>
                                <span>Hoàn tất form</span>
                            </div>
                        </div>
                    </div>
                    <div className="aside-card">
                        <h3>Cần hỗ trợ?</h3>
                        <p>Hotline 1900-1234 hoặc support@carrental.vn</p>
                    </div>
                </aside>
            </div>
        </section>
    );
}

export default OwnerRegistration;
