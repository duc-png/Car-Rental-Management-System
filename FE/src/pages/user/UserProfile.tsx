import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast, Toaster } from "sonner";
import {
    User,
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
    IdCard
} from "lucide-react";

export default function UserProfile() {
    const [isEditing, setIsEditing] = useState(false);
    const [licenseFile, setLicenseFile] = useState<string | null>(null);

    const [userData, setUserData] = useState({
        name: "Nguyễn Văn An",
        email: "nguyenvanan@email.com",
        phone: "+84 901 234 567",
        dateOfBirth: "15/03/1990",
        address: "123 Lê Lợi, Quận 1, TP. Hồ Chí Minh",
        memberSince: "Tháng 3, 2023",
        avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
        license: {
            number: "012345678",
            issuedDate: "10/01/2015",
            expiryDate: "10/01/2030",
            class: "B2",
            verified: true
        },
        stats: {
            totalRentals: 24,
            activeRentals: 1,
            loyaltyPoints: 1250
        }
    });

    const [formData, setFormData] = useState({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        dateOfBirth: userData.dateOfBirth,
        address: userData.address
    });

    const rentalHistory = [
        {
            id: 1,
            car: "Toyota Camry 2023",
            type: "Sedan",
            startDate: "05/01/2026",
            endDate: "08/01/2026",
            status: "Hoàn thành",
            total: "3.500.000 ₫",
            image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=300&h=200&fit=crop"
        },
        {
            id: 2,
            car: "Honda CR-V 2024",
            type: "SUV",
            startDate: "20/12/2025",
            endDate: "25/12/2025",
            status: "Hoàn thành",
            total: "5.000.000 ₫",
            image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=300&h=200&fit=crop"
        },
        {
            id: 3,
            car: "Mercedes-Benz C-Class",
            type: "Luxury",
            startDate: "10/01/2026",
            endDate: "12/01/2026",
            status: "Đang thuê",
            total: "4.200.000 ₫",
            image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=300&h=200&fit=crop"
        }
    ];

    const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLicenseFile(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();

        // Cập nhật userData với formData mới
        setUserData({
            ...userData,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            dateOfBirth: formData.dateOfBirth,
            address: formData.address
        });

        setIsEditing(false);
        toast.success("Cập nhật thông tin thành công!");
    };

    const handleCancelEdit = () => {
        // Reset formData về userData hiện tại
        setFormData({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            dateOfBirth: userData.dateOfBirth,
            address: userData.address
        });
        setIsEditing(false);
    };

    const handleStartEdit = () => {
        // Đồng bộ formData với userData trước khi chỉnh sửa
        setFormData({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            dateOfBirth: userData.dateOfBirth,
            address: userData.address
        });
        setIsEditing(true);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-center" richColors />
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Car className="w-8 h-8" />
                            <h1 className="text-2xl">Hồ Sơ Của Tôi</h1>
                        </div>
                        <Button variant="secondary" size="sm">
                            <Mail className="w-4 h-4 mr-2" />
                            Hỗ Trợ
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Overview */}
                <Card className="mb-8">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    <Avatar className="w-32 h-32">
                                        <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                                        <AvatarFallback>NA</AvatarFallback>
                                    </Avatar>
                                    <Button
                                        size="sm"
                                        className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </Button>
                                </div>
                                <Badge variant={userData.license.verified ? "default" : "secondary"} className="flex items-center gap-1">
                                    {userData.license.verified ? (
                                        <>
                                            <CheckCircle className="w-3 h-3" />
                                            Đã Xác Minh
                                        </>
                                    ) : (
                                        <>
                                            <Clock className="w-3 h-3" />
                                            Chưa Xác Minh
                                        </>
                                    )}
                                </Badge>
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-2xl mb-1">{userData.name}</h2>
                                        <p className="text-sm text-gray-600">Thành viên từ {userData.memberSince}</p>
                                    </div>
                                    <Button onClick={isEditing ? handleCancelEdit : handleStartEdit}>
                                        {isEditing ? "Hủy" : "Chỉnh Sửa"}
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span>{userData.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span>{userData.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span>{userData.dateOfBirth}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span>{userData.address}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <Car className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                            <div className="text-3xl mb-1">{userData.stats.totalRentals}</div>
                            <div className="text-sm text-gray-600">Tổng Số Lần Thuê</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <Clock className="w-8 h-8 mx-auto mb-2 text-green-600" />
                            <div className="text-3xl mb-1">{userData.stats.activeRentals}</div>
                            <div className="text-sm text-gray-600">Đang Thuê</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <CreditCard className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                            <div className="text-3xl mb-1">{userData.stats.loyaltyPoints.toLocaleString()}</div>
                            <div className="text-sm text-gray-600">Điểm Thưởng</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="personal" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="personal">Thông Tin Cá Nhân</TabsTrigger>
                        <TabsTrigger value="license">Bằng Lái Xe</TabsTrigger>
                        <TabsTrigger value="history">Lịch Sử Thuê</TabsTrigger>
                    </TabsList>

                    {/* Personal Info Tab */}
                    <TabsContent value="personal">
                        <Card>
                            <CardHeader>
                                <CardTitle>Cập Nhật Thông Tin Cá Nhân</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-4" onSubmit={handleSaveProfile}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="fullname">Họ và Tên</Label>
                                            <Input
                                                id="fullname"
                                                value={formData.name}
                                                disabled={!isEditing}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                disabled={!isEditing}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Số Điện Thoại</Label>
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                disabled={!isEditing}
                                                onChange={(e) => {
                                                    let value = e.target.value;

                                                    // Tự động loại bỏ ký tự không phải số
                                                    const cleaned = value.replace(/[^0-9]/g, '');

                                                    if (value !== cleaned) {
                                                        toast.error("chỉ được nhập số");
                                                    }

                                                    if (cleaned.length > 11) {
                                                        toast.error("Số điện thoại không được quá 11 chữ số!");
                                                        return;
                                                    }

                                                    setFormData({ ...formData, phone: cleaned });
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="dob">Ngày Sinh</Label>
                                            <Input
                                                id="dob"
                                                value={formData.dateOfBirth}
                                                disabled={!isEditing}
                                                placeholder="DD/MM/YYYY"
                                                onChange={(e) => {
                                                    const value = e.target.value;

                                                    // Kiểm tra format DD/MM/YYYY
                                                    const parts = value.split('/');

                                                    if (parts.length === 3) {
                                                        const month = parseInt(parts[1]);

                                                        if (month > 12) {
                                                            toast.error("Tháng không hợp lệ! Vui lòng nhập tháng từ 01-12");
                                                            return;
                                                        }
                                                    }

                                                    setFormData({ ...formData, dateOfBirth: value });
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="address">Địa Chỉ</Label>
                                            <Input
                                                id="address"
                                                value={formData.address}
                                                disabled={!isEditing}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    {isEditing && (
                                        <div className="flex gap-2 pt-4">
                                            <Button type="submit">Lưu Thay Đổi</Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleCancelEdit}
                                            >
                                                Hủy
                                            </Button>
                                        </div>
                                    )}
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Driver's License Tab */}
                    <TabsContent value="license">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <IdCard className="w-5 h-5" />
                                        Thông Tin Bằng Lái
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="license-number">Số Bằng Lái</Label>
                                        <Input
                                            id="license-number"
                                            defaultValue={userData.license.number}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="license-class">Hạng</Label>
                                            <Input
                                                id="license-class"
                                                defaultValue={userData.license.class}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="issued-date">Ngày Cấp</Label>
                                            <Input
                                                id="issued-date"
                                                defaultValue={userData.license.issuedDate}
                                                placeholder="DD/MM/YYYY"
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    const parts = value.split('/');

                                                    if (parts.length === 3) {
                                                        const month = parseInt(parts[1]);

                                                        if (month > 12) {
                                                            toast.error("Tháng không hợp lệ! Vui lòng nhập tháng từ 01-12");
                                                            return;
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="expiry-date">Ngày Hết Hạn</Label>
                                        <Input
                                            id="expiry-date"
                                            defaultValue={userData.license.expiryDate}
                                            placeholder="DD/MM/YYYY"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                const parts = value.split('/');

                                                if (parts.length === 3) {
                                                    const month = parseInt(parts[1]);

                                                    if (month > 12) {
                                                        toast.error("Tháng không hợp lệ! Vui lòng nhập tháng từ 01-12");
                                                        return;
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="pt-4 border-t">
                                        <div className="flex items-center gap-2 mb-2">
                                            {userData.license.verified ? (
                                                <Badge className="bg-green-100 text-green-800">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Đã Xác Minh
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                    Chờ Xác Minh
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {userData.license.verified
                                                ? "Bằng lái của bạn đã được xác minh và có thể thuê xe."
                                                : "Vui lòng tải lên ảnh bằng lái để được xác minh."}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Upload className="w-5 h-5" />
                                        Tải Lên Bằng Lái
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                            {licenseFile ? (
                                                <div className="space-y-4">
                                                    <img
                                                        src={licenseFile}
                                                        alt="License preview"
                                                        className="max-w-full h-48 mx-auto object-contain rounded"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setLicenseFile(null)}
                                                    >
                                                        Xóa Ảnh
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        Kéo thả ảnh hoặc nhấp để tải lên
                                                    </p>
                                                    <p className="text-xs text-gray-500 mb-4">
                                                        Chấp nhận: JPG, PNG (Tối đa 5MB)
                                                    </p>
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleLicenseUpload}
                                                        className="hidden"
                                                        id="license-upload"
                                                    />
                                                    <Label htmlFor="license-upload">
                                                        <Button variant="outline" asChild>
                                                            <span>Chọn Ảnh</span>
                                                        </Button>
                                                    </Label>
                                                </>
                                            )}
                                        </div>

                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-blue-900 mb-2">
                                                Lưu ý khi chụp ảnh:
                                            </h4>
                                            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                                <li>Chụp rõ nét, đầy đủ 2 mặt bằng lái</li>
                                                <li>Đảm bảo đủ ánh sáng, không bị mờ</li>
                                                <li>Thông tin trên bằng phải đọc được</li>
                                                <li>Bằng lái còn hiệu lực</li>
                                            </ul>
                                        </div>

                                        {licenseFile && (
                                            <Button className="w-full">
                                                Gửi Để Xác Minh
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Rental History Tab */}
                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lịch Sử Thuê Xe</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {rentalHistory.map((rental) => (
                                        <div
                                            key={rental.id}
                                            className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                                        >
                                            <img
                                                src={rental.image}
                                                alt={rental.car}
                                                className="w-full md:w-48 h-32 object-cover rounded-lg"
                                            />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="text-lg mb-1">{rental.car}</h3>
                                                        <Badge variant="outline">{rental.type}</Badge>
                                                    </div>
                                                    <Badge variant={rental.status === "Đang thuê" ? "default" : "secondary"}>
                                                        {rental.status}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600 mt-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Ngày Nhận</p>
                                                        <p>{rental.startDate}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Ngày Trả</p>
                                                        <p>{rental.endDate}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Tổng Tiền</p>
                                                        <p className="font-medium text-blue-600">{rental.total}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex md:flex-col gap-2">
                                                <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                                                    Chi Tiết
                                                </Button>
                                                {rental.status === "Đang thuê" && (
                                                    <Button size="sm" className="flex-1 md:flex-none">
                                                        Gia Hạn
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
