import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
import {
    Mail,
    Phone,
    MapPin,
    Calendar,
    Camera,
    CreditCard,
    Car,
    CheckCircle,
    Clock,
    Upload,
    AlertCircle,
    IdCard,
    Loader2
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getMyProfile, updateMyProfile, getMyBookings } from "../../api/profile";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Input } from "../../components/ui/input";
import "../../styles/UserProfile.css";

function formatDateTime(value: any): string {
    if (!value) return "";
    try {
        return new Date(value).toLocaleDateString("vi-VN");
    } catch {
        return String(value);
    }
}

function mapStatus(status: string): string {
    const map: Record<string, string> = {
        PENDING: "Chờ xác nhận",
        CONFIRMED: "Đã xác nhận",
        ONGOING: "Đang thuê",
        COMPLETED: "Hoàn thành",
        CANCELLED: "Đã hủy",
    };
    return map[status] || status;
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
    if (status === "ONGOING" || status === "CONFIRMED") return "default";
    return "secondary";
}

export default function UserProfile() {
    const navigate = useNavigate();
    const { user, token, isAuthenticated, loading: authLoading } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [licenseFile, setLicenseFile] = useState<string | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [bookings, setBookings] = useState<any[]>([]);

    const [userData, setUserData] = useState({
        name: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        address: "",
        memberSince: "",
        avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
        license: {
            number: "",
            issuedDate: "",
            expiryDate: "",
            licenseClass: "B2",
            verified: false
        },
        stats: {
            totalRentals: 0,
            activeRentals: 0,
            loyaltyPoints: 0
        }
    });

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        address: "",
        licenseNumber: ""
    });

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate("/login");
        }
    }, [authLoading, isAuthenticated, navigate]);

    useEffect(() => {
        console.log("[UserProfile] Auth state:", { userId: user?.userId, hasToken: !!token, authLoading });
        if (!user?.userId || !token) {
            console.warn("[UserProfile] Missing userId or token, skipping fetch. userId:", user?.userId);
            return;
        }

        const fetchData = async () => {
            setProfileLoading(true);

            // Fetch profile data
            try {
                console.log("[UserProfile] Fetching profile for userId:", user.userId);
                const profile = await getMyProfile(token, user.userId);
                console.log("[UserProfile] Profile response:", profile);

                setUserData(prev => ({
                    ...prev,
                    name: profile.fullName || "",
                    email: profile.email || "",
                    phone: profile.phone || "",
                    dateOfBirth: profile.dateOfBirth || "",
                    address: profile.address || "",
                    memberSince: profile.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })
                        : "",
                    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
                    license: {
                        number: profile.licenseNumber || "",
                        issuedDate: "",
                        expiryDate: "",
                        licenseClass: "B2",
                        verified: !!profile.licenseNumber
                    },
                    stats: {
                        ...prev.stats,
                        totalRentals: Number(profile.totalBookings) || 0,
                    }
                }));

                setFormData({
                    name: profile.fullName || "",
                    email: profile.email || "",
                    phone: profile.phone || "",
                    dateOfBirth: profile.dateOfBirth || "",
                    address: profile.address || "",
                    licenseNumber: profile.licenseNumber || ""
                });
            } catch (err: any) {
                console.error("[UserProfile] Error fetching profile:", err);
                toast.error(err.message || "Không thể tải dữ liệu hồ sơ");
            }

            // Fetch bookings separately so profile still loads if bookings fail
            try {
                const bookingList = await getMyBookings(token);
                console.log("[UserProfile] Bookings response:", bookingList);
                const activeRentals = bookingList.filter(
                    (b: any) => b.status === "ONGOING" || b.status === "CONFIRMED"
                ).length;
                setBookings(bookingList);
                setUserData(prev => ({
                    ...prev,
                    stats: {
                        ...prev.stats,
                        activeRentals,
                    }
                }));
            } catch (err: any) {
                console.error("[UserProfile] Error fetching bookings:", err);
                // Don't show error toast for bookings - profile data is more important
            }

            setProfileLoading(false);
        };

        fetchData();
    }, [user?.userId, token]);

    const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { setLicenseFile(reader.result as string); };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.userId || !token) return;
        setSaving(true);
        try {
            const updated = await updateMyProfile(token, user.userId, {
                fullName: formData.name,
                email: formData.email,
                phone: formData.phone,
                licenseNumber: formData.licenseNumber,
                address: formData.address
            });
            setUserData(prev => ({
                ...prev,
                name: updated.fullName || formData.name,
                email: updated.email || formData.email,
                phone: updated.phone || formData.phone,
                address: updated.address || formData.address,
                license: {
                    ...prev.license,
                    number: updated.licenseNumber || formData.licenseNumber,
                    verified: !!updated.licenseNumber
                }
            }));
            setIsEditing(false);
            toast.success("Cập nhật thông tin thành công!");
        } catch (err: any) {
            toast.error(err.message || "Cập nhật thất bại!");
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setFormData({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            dateOfBirth: userData.dateOfBirth,
            address: userData.address,
            licenseNumber: userData.license.number
        });
        setIsEditing(false);
    };

    const handleStartEdit = () => {
        setFormData({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            dateOfBirth: userData.dateOfBirth,
            address: userData.address,
            licenseNumber: userData.license.number
        });
        setIsEditing(true);
    };

    const initials = userData.name
        ? userData.name.split(" ").map(w => w[0]).slice(-2).join("").toUpperCase()
        : "U";

    if (authLoading || profileLoading) {
        return (
            <div className="profile-page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#2563eb" }} />
            </div>
        );
    }

    return (
        <div className="profile-page">
            <Toaster position="top-center" richColors />

            {/* Header */}
            <div className="profile-header">
                <div className="profile-header-inner">
                    <div className="profile-header-title">
                        <Car size={22} />
                        <span>Hồ Sơ Của Tôi</span>
                    </div>
                    <button className="profile-header-support">
                        <Mail size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                        Hỗ Trợ
                    </button>
                </div>
            </div>

            <div className="profile-content">
                {/* Profile card */}
                <div className="profile-card">
                    {/* Left: Avatar */}
                    <div className="profile-avatar-col">
                        <div className="profile-avatar-wrap">
                            <img
                                className="profile-avatar"
                                src={userData.avatarUrl}
                                alt={userData.name}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                }}
                            />
                            <button className="profile-avatar-camera">
                                <Camera size={12} />
                            </button>
                        </div>
                        <span className={`profile-verified-badge ${userData.license.verified ? "verified" : "unverified"}`}>
                            {userData.license.verified
                                ? <><CheckCircle size={11} /> Đã Xác Minh</>
                                : <><Clock size={11} /> Chưa Xác Minh</>
                            }
                        </span>
                    </div>

                    {/* Right: Info */}
                    <div className="profile-info-col">
                        <div className="profile-info-header">
                            <div>
                                <p className="profile-name">{userData.name}</p>
                                <p className="profile-member-since">Thành viên từ {userData.memberSince}</p>
                            </div>
                            <button
                                className={`profile-edit-btn ${isEditing ? "cancel" : ""}`}
                                onClick={isEditing ? handleCancelEdit : handleStartEdit}
                            >
                                {isEditing ? "Hủy" : "Chỉnh Sửa"}
                            </button>
                        </div>
                        <div className="profile-meta-grid">
                            <div className="profile-meta-item">
                                <Mail size={14} />
                                <span>{userData.email}</span>
                            </div>
                            <div className="profile-meta-item">
                                <Phone size={14} />
                                <span>{userData.phone}</span>
                            </div>
                            <div className="profile-meta-item">
                                <Calendar size={14} />
                                <span>{userData.dateOfBirth || "Chưa cập nhật"}</span>
                            </div>
                            <div className="profile-meta-item">
                                <MapPin size={14} />
                                <span>{userData.address || "Chưa cập nhật"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="profile-stats-grid">
                    <div className="profile-stat-card">
                        <div className="profile-stat-icon">
                            <Car size={28} color="#2563eb" />
                        </div>
                        <div className="profile-stat-number">{userData.stats.totalRentals}</div>
                        <div className="profile-stat-label">Tổng Số Lần Thuê</div>
                    </div>
                    <div className="profile-stat-card">
                        <div className="profile-stat-icon">
                            <Clock size={28} color="#16a34a" />
                        </div>
                        <div className="profile-stat-number">{userData.stats.activeRentals}</div>
                        <div className="profile-stat-label">Đang Thuê</div>
                    </div>
                    <div className="profile-stat-card">
                        <div className="profile-stat-icon">
                            <CreditCard size={28} color="#9333ea" />
                        </div>
                        <div className="profile-stat-number">{userData.stats.loyaltyPoints.toLocaleString()}</div>
                        <div className="profile-stat-label">Điểm Thưởng</div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="personal">
                    <TabsList className="profile-tabs-list grid w-full grid-cols-3">
                        <TabsTrigger className="profile-tabs-trigger" value="personal">Thông Tin Cá Nhân</TabsTrigger>
                        <TabsTrigger className="profile-tabs-trigger" value="license">Bằng Lái Xe</TabsTrigger>
                        <TabsTrigger className="profile-tabs-trigger" value="history">Lịch Sử Thuê</TabsTrigger>
                    </TabsList>

                    {/* Personal Tab */}
                    <TabsContent value="personal">
                        <div className="profile-tab-card">
                            <p className="profile-tab-title">Cập Nhật Thông Tin Cá Nhân</p>
                            <form onSubmit={handleSaveProfile}>
                                <div className="profile-form-grid">
                                    <div className="profile-field">
                                        <label htmlFor="fullname" className={isEditing ? "active-label" : ""}>Họ và Tên</label>
                                        <input
                                            id="fullname"
                                            value={formData.name}
                                            disabled={!isEditing}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="profile-field">
                                        <label htmlFor="email" className={isEditing ? "active-label" : ""}>Email</label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            disabled={!isEditing}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="profile-field">
                                        <label htmlFor="phone" className={isEditing ? "active-label" : ""}>Số Điện Thoại</label>
                                        <input
                                            id="phone"
                                            value={formData.phone}
                                            disabled={!isEditing}
                                            onChange={(e) => {
                                                const cleaned = e.target.value.replace(/[^0-9]/g, '');
                                                if (e.target.value !== cleaned) toast.error("Chỉ được nhập số");
                                                if (cleaned.length > 11) { toast.error("Số điện thoại không được quá 11 chữ số!"); return; }
                                                setFormData({ ...formData, phone: cleaned });
                                            }}
                                        />
                                    </div>
                                    <div className="profile-field">
                                        <label htmlFor="dob" className={isEditing ? "active-label" : ""}>Ngày Sinh</label>
                                        <input
                                            id="dob"
                                            value={formData.dateOfBirth}
                                            disabled={!isEditing}
                                            placeholder="DD/MM/YYYY"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const parts = value.split('/');
                                                if (parts.length === 3 && parseInt(parts[1]) > 12) {
                                                    toast.error("Tháng không hợp lệ!"); return;
                                                }
                                                setFormData({ ...formData, dateOfBirth: value });
                                            }}
                                        />
                                    </div>
                                    <div className="profile-field col-span-2">
                                        <label htmlFor="address" className={isEditing ? "active-label" : ""}>Địa Chỉ</label>
                                        <input
                                            id="address"
                                            value={formData.address}
                                            disabled={!isEditing}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                                {isEditing && (
                                    <div className="profile-form-actions">
                                        <button type="submit" className="profile-save-btn" disabled={saving}>
                                            {saving && <Loader2 size={14} style={{ display: "inline", marginRight: 6, animation: "spin 1s linear infinite" }} />}
                                            Lưu Thay Đổi
                                        </button>
                                        <button type="button" className="profile-cancel-btn" onClick={handleCancelEdit}>
                                            Hủy
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </TabsContent>

                    {/* License Tab */}
                    <TabsContent value="license">
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div className="profile-tab-card">
                                <p className="profile-tab-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <IdCard size={18} /> Thông Tin Bằng Lái
                                </p>
                                <div className="profile-form-grid" style={{ gridTemplateColumns: "1fr" }}>
                                    <div className="profile-field">
                                        <label htmlFor="license-number">Số Bằng Lái</label>
                                        <input id="license-number" defaultValue={userData.license.number} />
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        <div className="profile-field">
                                            <label htmlFor="license-class">Hạng</label>
                                            <input id="license-class" defaultValue={userData.license.licenseClass} />
                                        </div>
                                        <div className="profile-field">
                                            <label htmlFor="issued-date">Ngày Cấp</label>
                                            <input id="issued-date" defaultValue={userData.license.issuedDate} placeholder="DD/MM/YYYY" />
                                        </div>
                                    </div>
                                    <div className="profile-field">
                                        <label htmlFor="expiry-date">Ngày Hết Hạn</label>
                                        <input id="expiry-date" defaultValue={userData.license.expiryDate} placeholder="DD/MM/YYYY" />
                                    </div>
                                </div>
                                <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 16, paddingTop: 14 }}>
                                    <span className={`profile-verified-badge ${userData.license.verified ? "verified" : "unverified"}`} style={{ marginBottom: 8, display: "inline-flex" }}>
                                        {userData.license.verified
                                            ? <><CheckCircle size={11} /> Đã Xác Minh</>
                                            : <><AlertCircle size={11} /> Chờ Xác Minh</>
                                        }
                                    </span>
                                    <p style={{ fontSize: "0.8125rem", color: "#64748b", marginTop: 8 }}>
                                        {userData.license.verified
                                            ? "Bằng lái của bạn đã được xác minh."
                                            : "Vui lòng tải lên ảnh bằng lái để xác minh."}
                                    </p>
                                </div>
                            </div>

                            <div className="profile-tab-card">
                                <p className="profile-tab-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Upload size={18} /> Tải Lên Bằng Lái
                                </p>
                                <div style={{ border: "2px dashed #e2e8f0", borderRadius: 10, padding: "32px 16px", textAlign: "center" }}>
                                    {licenseFile ? (
                                        <div>
                                            <img src={licenseFile} alt="license" style={{ maxWidth: "100%", height: 160, objectFit: "contain", borderRadius: 8, margin: "0 auto 12px" }} />
                                            <button className="profile-cancel-btn" onClick={() => setLicenseFile(null)}>Xóa Ảnh</button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload size={36} color="#cbd5e1" style={{ margin: "0 auto 10px" }} />
                                            <p style={{ fontSize: "0.8125rem", color: "#64748b", marginBottom: 4 }}>Kéo thả ảnh hoặc nhấp để tải lên</p>
                                            <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: 14 }}>JPG, PNG · Tối đa 5MB</p>
                                            <input type="file" accept="image/*" onChange={handleLicenseUpload} className="hidden" id="license-upload" style={{ display: "none" }} />
                                            <label htmlFor="license-upload">
                                                <span className="profile-cancel-btn" style={{ cursor: "pointer" }}>Chọn Ảnh</span>
                                            </label>
                                        </>
                                    )}
                                </div>
                                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "12px 14px", marginTop: 14 }}>
                                    <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#1e40af", marginBottom: 6 }}>Lưu ý khi chụp ảnh:</p>
                                    <ul style={{ fontSize: "0.8rem", color: "#1e40af", paddingLeft: 18, margin: 0 }}>
                                        <li>Chụp rõ nét, đầy đủ 2 mặt</li>
                                        <li>Đủ ánh sáng, không bị mờ</li>
                                        <li>Thông tin phải đọc được</li>
                                        <li>Bằng lái còn hiệu lực</li>
                                    </ul>
                                </div>
                                {licenseFile && (
                                    <button className="profile-save-btn" style={{ width: "100%", marginTop: 14 }}>
                                        Gửi Để Xác Minh
                                    </button>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history">
                        <div className="profile-tab-card">
                            <p className="profile-tab-title">Lịch Sử Thuê Xe</p>
                            {bookings.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                                    <Car size={40} color="#e2e8f0" style={{ margin: "0 auto 12px" }} />
                                    <p style={{ fontSize: "0.875rem" }}>Bạn chưa có lần thuê xe nào.</p>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    {bookings.map((booking) => (
                                        <div
                                            key={booking.id}
                                            style={{
                                                display: "flex",
                                                gap: 16,
                                                padding: "14px",
                                                border: "1px solid #e2e8f0",
                                                borderRadius: 12,
                                                transition: "box-shadow 0.15s",
                                            }}
                                        >
                                            {booking.vehicleImage && (
                                                <img
                                                    src={booking.vehicleImage}
                                                    alt={booking.vehicleName}
                                                    style={{ width: 140, height: 90, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                                                />
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                                    <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "#0f172a", margin: 0 }}>{booking.vehicleName}</p>
                                                    <Badge variant={statusVariant(booking.status)}>{mapStatus(booking.status)}</Badge>
                                                </div>
                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px 12px" }}>
                                                    <div>
                                                        <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>Ngày Nhận</p>
                                                        <p style={{ fontSize: "0.875rem", color: "#374151", margin: 0 }}>{formatDateTime(booking.startDate)}</p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>Ngày Trả</p>
                                                        <p style={{ fontSize: "0.875rem", color: "#374151", margin: 0 }}>{formatDateTime(booking.endDate)}</p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>Tổng Tiền</p>
                                                        <p style={{ fontSize: "0.875rem", color: "#2563eb", fontWeight: 600, margin: 0 }}>{booking.totalPrice?.toLocaleString("vi-VN")} ₫</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                                                <button className="profile-cancel-btn" style={{ fontSize: "0.8rem", padding: "6px 14px" }}>Chi Tiết</button>
                                                {(booking.status === "ONGOING" || booking.status === "CONFIRMED") && (
                                                    <button className="profile-save-btn" style={{ fontSize: "0.8rem", padding: "6px 14px" }}>Gia Hạn</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
