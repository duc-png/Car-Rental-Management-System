# Car Rental Management System — Datasheet

Tài liệu mô tả cấu trúc dữ liệu (database schema) khi chạy backend dựa trên các entity JPA.

---

## 1. Bảng `users`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|--------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID người dùng |
| `full_name` | VARCHAR(100) | NOT NULL | Họ tên |
| `email` | VARCHAR(100) | NOT NULL, UNIQUE | Email đăng nhập |
| `password` | VARCHAR(255) | NOT NULL | Mật khẩu (hash) |
| `phone` | VARCHAR(20) | | Số điện thoại |
| `license_number` | VARCHAR(50) | | Số bằng lái |
| `address` | VARCHAR(255) | | Địa chỉ |
| `is_verified` | BOOLEAN | | Đã xác thực |
| `is_active` | BOOLEAN | | Tài khoản đang hoạt động |
| `created_at` | TIMESTAMP | | Thời điểm tạo |
| `role_id` | VARCHAR(20) | ENUM | Vai trò: `USER`, `EXPERT`, `ADMIN` |

**Enum `UserRole`:** `USER` \| `EXPERT` \| `ADMIN`

---

## 2. Bảng `brands`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|--------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID hãng xe |
| `name` | VARCHAR(50) | NOT NULL | Tên hãng (Toyota, Honda, …) |

---

## 3. Bảng `car_types`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|--------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID loại xe |
| `name` | VARCHAR(50) | NOT NULL | Tên loại (Sedan, SUV, …) |

---

## 4. Bảng `locations`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|--------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID địa điểm |
| `city` | VARCHAR(100) | NOT NULL | Thành phố |
| `district` | VARCHAR(100) | NOT NULL | Quận/huyện |
| `address_detail` | VARCHAR(255) | | Địa chỉ chi tiết |

---

## 5. Bảng `vehicle_models`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|--------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID mẫu xe |
| `brand_id` | INTEGER | FK → `brands.id` | Hãng xe |
| `type_id` | INTEGER | FK → `car_types.id` | Loại xe |
| `name` | VARCHAR(50) | NOT NULL | Tên mẫu (Vios, City, …) |

---

## 6. Bảng `vehicles`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|--------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID xe |
| `owner_id` | INTEGER | FK → `users.id`, NOT NULL | Chủ xe |
| `model_id` | INTEGER | FK → `vehicle_models.id`, NOT NULL | Mẫu xe |
| `license_plate` | VARCHAR(20) | NOT NULL, UNIQUE | Biển số |
| `color` | VARCHAR(30) | | Màu xe |
| `seat_count` | INTEGER | | Số chỗ ngồi |
| `transmission` | VARCHAR | ENUM | `MANUAL` \| `AUTOMATIC` |
| `fuel_type` | VARCHAR | ENUM | `GASOLINE` \| `DIESEL` \| `ELECTRIC` |
| `price_per_day` | DECIMAL(12,2) | NOT NULL | Giá thuê/ngày |
| `status` | VARCHAR | ENUM | `AVAILABLE` \| `RENTED` \| `MAINTENANCE` \| `PENDING_APPROVAL` |
| `current_km` | INTEGER | NOT NULL | Số km hiện tại |
| `location_id` | INTEGER | FK → `locations.id` | Vị trí đặt xe |

**Enum `Transmission`:** `MANUAL` \| `AUTOMATIC`  
**Enum `FuelType`:** `GASOLINE` \| `DIESEL` \| `ELECTRIC`  
**Enum `VehicleStatus`:** `AVAILABLE` \| `RENTED` \| `MAINTENANCE` \| `PENDING_APPROVAL`

---

## 7. Bảng `vehicle_images`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|--------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID ảnh |
| `vehicle_id` | INTEGER | FK → `vehicles.id` | Xe |
| `image_url` | TEXT/CLOB | NOT NULL | URL ảnh |
| `is_main` | BOOLEAN | | Ảnh đại diện |

---

## 8. Bảng `bookings`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|--------|
| `id` | INTEGER | PK, AUTO_INCREMENT | ID đặt xe |
| `customer_id` | INTEGER | FK → `users.id`, NOT NULL | Khách thuê |
| `vehicle_id` | INTEGER | FK → `vehicles.id`, NOT NULL | Xe thuê |
| `start_date` | DATETIME | NOT NULL | Ngày giờ bắt đầu |
| `end_date` | DATETIME | NOT NULL | Ngày giờ kết thúc |
| `total_price` | DECIMAL(12,2) | | Tổng tiền |
| `status` | VARCHAR | ENUM | Trạng thái đặt xe (xem bên dưới) |
| `created_at` | TIMESTAMP | | Thời điểm tạo |
| `updated_at` | TIMESTAMP | | Thời điểm cập nhật |
| `pickup_location` | VARCHAR(255) | | Địa điểm nhận xe |
| `return_location` | VARCHAR(255) | | Địa điểm trả xe |

**Enum `BookingStatus`:** `PENDING` \| `CONFIRMED` \| `ONGOING` \| `COMPLETED` \| `CANCELLED`

---

## 9. Bảng `invalidatedtokens`

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|--------|
| `id` | VARCHAR(255) | PK | Token (JWT) đã bị vô hiệu hóa |
| `expiry_time` | TIMESTAMP/DATE | NOT NULL | Thời điểm hết hạn |

Dùng để blacklist token khi logout.

---

## Sơ đồ quan hệ (ER – tóm tắt)

```
users (1) ─────< vehicles          (owner_id)
users (1) ─────< bookings          (customer_id)
brands (1) ────< vehicle_models   (brand_id)
car_types (1) ─< vehicle_models   (type_id)
vehicle_models (1) ─< vehicles     (model_id)
locations (1) ──< vehicles         (location_id)
vehicles (1) ───< vehicle_images  (vehicle_id)
vehicles (1) ───< bookings        (vehicle_id)
```

---

## Cách tạo schema khi chạy BE

- **JPA/Hibernate** tạo/ cập nhật bảng theo cấu hình trong `application.yaml` (ví dụ `spring.jpa.hibernate.ddl-auto: update` hoặc `create`).
- Khi run backend (Spring Boot), các bảng trên sẽ tồn tại trong database được cấu hình (URL, username, password trong `application.yaml`).

*Tài liệu được sinh từ entity trong `BE/src/main/java/com/example/car_management/entity`.*
