// src/pages/owner/OwnerVehicleEdit.jsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import '../../styles/OwnerVehicleEdit.css';

// Giả lập data (thay bằng API thật của bạn)
const mockVehicle = {
    id: '123',
    name: 'BMW X5 (Unknown)',
    licensePlate: '30A-123.45',
    color: 'Đen',
    seatCount: 5,
    transmission: 'Số tự động',
    fuelType: 'Xăng',
    pricePerDay: 2500000,
    year: 2022,
    fuelConsumption: 8.5,
    currentKm: 25000,
    description: 'Xe mới 95%, nội thất da cao cấp, có camera 360, cảm biến lùi, bảo hiểm đầy đủ. Không hút thuốc trong xe.',
    province: 'Hà Nội',
    ward: 'Mộ Lao',
    addressDetail: '123 Nguyễn Trãi, Hà Đông',
    status: 'AVAILABLE',
    images: [
        { id: 1, url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800', isMain: true },
        { id: 2, url: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800', isMain: false },
    ],
};

export default function OwnerVehicleEdit() {
    const { id } = useParams();
    const [form, setForm] = useState({
        model: '',
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

    const [firstAsMain, setFirstAsMain] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Thay bằng API call thật: getVehicleDetail(id)
        setForm({
            model: mockVehicle.name,
            licensePlate: mockVehicle.licensePlate,
            color: mockVehicle.color,
            seatCount: mockVehicle.seatCount,
            transmission: mockVehicle.transmission,
            fuelType: mockVehicle.fuelType,
            pricePerDay: mockVehicle.pricePerDay,
            year: mockVehicle.year,
            fuelConsumption: mockVehicle.fuelConsumption,
            currentKm: mockVehicle.currentKm,
            description: mockVehicle.description,
            province: mockVehicle.province,
            ward: mockVehicle.ward,
            addressDetail: mockVehicle.addressDetail,
            status: mockVehicle.status,
        });
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSaving(true);
        // Gọi API update ở đây
        console.log('Submit data:', form);
        setTimeout(() => setSaving(false), 1200); // giả lập
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="logo-icon">🚗</div>
                    <div>
                        <h3>CarRental</h3>
                        <p>Hệ thống quản lý</p>
                    </div>
                </div>

                <div className="sidebar-section">
                    <p className="section-title">ĐIỀU HƯỚNG</p>
                    <nav>
                        <Link to="/owner/dashboard" className="sidebar-item">
                            <span>📊</span> Tổng quan
                        </Link>
                        <Link to="/owner/fleet" className="sidebar-item active">
                            <span>🚙</span> Xe của tôi
                        </Link>
                        <Link to="/owner/bookings" className="sidebar-item">
                            <span>📋</span> Đơn thuê
                        </Link>
                        <Link to="/owner/customers" className="sidebar-item">
                            <span>👥</span> Khách hàng
                        </Link>
                        <Link to="/owner/stats" className="sidebar-item">
                            <span>📈</span> Thống kê
                        </Link>
                    </nav>
                </div>

                <div className="sidebar-section">
                    <p className="section-title">HỆ THỐNG</p>
                    <button className="sidebar-item">
                        <span>⚙️</span> Cài đặt
                    </button>
                    <button className="sidebar-item logout">
                        <span>↪️</span> Đăng xuất
                    </button>
                </div>

                <div className="sidebar-footer">
                    <div className="user-avatar">CO</div>
                    <div className="user-info">
                        <p className="user-name">Chủ xe</p>
                        <p className="user-email">haoowner@gmail.com</p>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="admin-main">
                <header className="page-header">
                    <div>
                        <p className="breadcrumb">Chủ xe / Chỉnh sửa xe</p>
                        <h1>Chỉnh sửa xe</h1>
                        <p className="vehicle-subtitle">● {mockVehicle.name}</p>
                    </div>
                    <Link to="/owner/fleet" className="btn-back">
                        ← Quay lại
                    </Link>
                </header>

                <form onSubmit={handleSubmit}>
                    {/* Thông tin cơ bản */}
                    <div className="edit-card">
                        <div className="card-header">
                            <span className="card-icon">📋</span>
                            <h2>Thông tin cơ bản</h2>
                        </div>
                        <div className="form-grid two-col">
                            <label>
                                Mẫu xe
                                <select name="model" value={form.model} onChange={handleChange}>
                                    <option value="BMW - BMW X5 (Unknown)">BMW - BMW X5 (Unknown)</option>
                                    {/* Thêm các option khác */}
                                </select>
                            </label>
                            <label>
                                Biển số
                                <input name="licensePlate" value={form.licensePlate} onChange={handleChange} />
                            </label>
                            <label>
                                Màu sắc
                                <input name="color" value={form.color} onChange={handleChange} />
                            </label>
                            <label>
                                Số chỗ
                                <input type="number" name="seatCount" value={form.seatCount} onChange={handleChange} />
                            </label>
                        </div>
                    </div>

                    {/* Thông số kỹ thuật */}
                    <div className="edit-card">
                        <div className="card-header">
                            <span className="card-icon">⚙️</span>
                            <h2>Thông số kỹ thuật</h2>
                        </div>
                        <div className="form-grid three-col">
                            <label>
                                Hộp số
                                <select name="transmission" value={form.transmission} onChange={handleChange}>
                                    <option value="Số sàn">Số sàn</option>
                                    <option value="Số tự động">Số tự động</option>
                                </select>
                            </label>
                            <label>
                                Nhiên liệu
                                <select name="fuelType" value={form.fuelType} onChange={handleChange}>
                                    <option value="Xăng">Xăng</option>
                                    <option value="Dầu diesel">Dầu diesel</option>
                                    <option value="Điện">Điện</option>
                                </select>
                            </label>
                            <label>
                                Giá/ngày (VNĐ)
                                <input type="number" name="pricePerDay" value={form.pricePerDay} onChange={handleChange} />
                            </label>
                            <label>
                                Năm sản xuất
                                <input type="number" name="year" value={form.year} onChange={handleChange} />
                            </label>
                            <label>
                                Mức tiêu thụ (L/100km)
                                <input
                                    type="number"
                                    step="0.1"
                                    name="fuelConsumption"
                                    value={form.fuelConsumption}
                                    onChange={handleChange}
                                />
                            </label>
                            <label>
                                Số km hiện tại
                                <input type="number" name="currentKm" value={form.currentKm} onChange={handleChange} />
                            </label>
                        </div>
                        <label className="full">
                            Mô tả
                            <textarea
                                name="description"
                                rows={4}
                                value={form.description}
                                onChange={handleChange}
                            />
                        </label>
                    </div>

                    {/* Vị trí & Trạng thái */}
                    <div className="edit-card">
                        <div className="card-header">
                            <span className="card-icon">📍</span>
                            <h2>Vị trí & Trạng thái</h2>
                        </div>
                        <div className="form-grid three-col">
                            <label>
                                Tỉnh/Thành phố
                                <input name="province" value={form.province} onChange={handleChange} />
                            </label>
                            <label>
                                Phường/Xã
                                <input name="ward" value={form.ward} onChange={handleChange} />
                            </label>
                            <label>
                                Địa chỉ cụ thể
                                <input name="addressDetail" value={form.addressDetail} onChange={handleChange} />
                            </label>
                        </div>
                        <label>
                            Trạng thái xe
                            <select name="status" value={form.status} onChange={handleChange}>
                                <option value="AVAILABLE">Sẵn sàng</option>
                                <option value="RENTED">Đang thuê</option>
                                <option value="MAINTENANCE">Bảo dưỡng</option>
                            </select>
                        </label>
                    </div>

                    {/* Quản lý hình ảnh */}
                    <div className="edit-card">
                        <div className="card-header">
                            <span className="card-icon">🖼️</span>
                            <h2>Quản lý hình ảnh</h2>
                            <label className="toggle-label">
                                <input
                                    type="checkbox"
                                    checked={firstAsMain}
                                    onChange={(e) => setFirstAsMain(e.target.checked)}
                                />
                                Đặt ảnh đầu làm ảnh chính
                            </label>
                        </div>

                        <div className="image-grid">
                            {mockVehicle.images.map((img) => (
                                <div key={img.id} className="image-item">
                                    <img src={img.url} alt="Xe" />
                                    {img.isMain && <span className="main-badge">ẢNH CHÍNH</span>}
                                    <div className="image-actions">
                                        {!img.isMain && (
                                            <button type="button" className="btn-make-main">
                                                ★ Làm chính
                                            </button>
                                        )}
                                        <button type="button" className="btn-delete">
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="upload-zone">
                            <div className="upload-drop">
                                <span className="upload-icon">↑</span>
                                <p>Tải ảnh lên hoặc dán URL</p>
                                <p className="small">Mỗi dòng 1 URL hoặc kéo thả file vào đây</p>
                            </div>
                            <input type="text" placeholder="https://example.com/image.jpg" />
                            <div className="upload-buttons">
                                <button type="button" className="btn-add-url">
                                    Thêm URL
                                </button>
                                <label className="btn-upload">
                                    Tải ảnh lên
                                    <input type="file" multiple hidden />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Action bar */}
                    <div className="action-bar">
                        <button type="button" className="btn-cancel">
                            × Hủy thay đổi
                        </button>
                        <button type="button" className="btn-outline">
                            Cập nhật trạng thái
                        </button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Đang lưu...' : 'Lưu thông tin xe'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}