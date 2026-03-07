# DATABASE DATASHEET - Car Rental Management System

## Tổng quan hệ thống

Hệ thống Car Rental Management System sử dụng MySQL database với 21 bảng chính để quản lý:
- **Người dùng và phân quyền**: Users, Owner Registrations
- **Xe và thông tin liên quan**: Vehicles, Brands, Car Types, Vehicle Models, Vehicle Images, Vehicle Features, Locations
- **Đặt xe và thanh toán**: Bookings, Payments
- **Đánh giá**: Reviews
- **Bảo dưỡng**: Maintenance Records, Maintenance Cost Items
- **Tranh chấp**: Disputes
- **Tin nhắn và chat**: Messages, Chat Conversations, Chat Messages, Notifications
- **Bảo mật**: Invalidated Tokens

---

## 1. USERS (Người dùng)

**Bảng**: `users`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | INTEGER | No | ID tự động tăng (Primary Key) |
| full_name | VARCHAR(100) | No | Họ tên đầy đủ |
| email | VARCHAR(100) | No | Email (unique) |
| password | VARCHAR(255) | No | Mật khẩu đã mã hóa BCrypt |
| phone | VARCHAR(20) | Yes | Số điện thoại |
| license_number | VARCHAR(50) | Yes | Số giấy phép lái xe |
| address | VARCHAR(255) | Yes | Địa chỉ |
| is_verified | BOOLEAN | Yes | Đã xác thực email chưa |
| is_active | BOOLEAN | Yes | Tài khoản còn hoạt động không |
| created_at | TIMESTAMP | Yes | Thời gian tạo tài khoản |
| role_id | ENUM | Yes | Vai trò: ADMIN, EXPERT, USER |

### Dữ liệu mẫu

- **Admin**: 1 tài khoản
- **EXPERT** (Chủ xe): 4 tài khoản (Nguyễn Văn A, Trần Thị B, Lê Văn C, Phạm Thị D)
- **USER** (Khách hàng): 6 tài khoản
- **Password mặc định**: "password123" (BCrypt hash)

### Mối quan hệ

- **One-to-Many** với `vehicles` (chủ xe)
- **One-to-Many** với `bookings` (khách thuê xe)
- **One-to-Many** với `notifications`
- **One-to-Many** với `chat_conversations`
- **One-to-Many** với `chat_messages`
- **One-to-One** với `owner_registrations`

---

## 2. LOCATIONS (Địa điểm)

**Bảng**: `locations`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | INTEGER | No | ID tự động tăng (Primary Key) |
| city | VARCHAR(100) | No | Thành phố |
| district | VARCHAR(100) | No | Quận/Huyện |
| address_detail | VARCHAR(255) | Yes | Địa chỉ chi tiết |

### Dữ liệu mẫu

- **TP. Hồ Chí Minh**: 7 địa điểm (Quận 1, 3, 7, Bình Thạnh, Tân Bình, Thủ Đức)
- **Hà Nội**: 4 địa điểm (Ba Đình, Hoàn Kiếm, Cầu Giấy, Đống Đa)
- **Đà Nẵng**: 3 địa điểm (Hải Châu, Sơn Trà, Ngũ Hành Sơn)

### Mối quan hệ

- **One-to-Many** với `vehicles`

---

## 3. BRANDS (Thương hiệu xe)

**Bảng**: `brands`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | INTEGER | No | ID tự động tăng (Primary Key) |
| name | VARCHAR(50) | No | Tên thương hiệu |

### Dữ liệu mẫu

15 thương hiệu: Toyota, Honda, Mazda, Hyundai, Kia, Ford, Mercedes-Benz, BMW, Audi, VinFast, Mitsubishi, Nissan, Chevrolet, Lexus, Suzuki

### Mối quan hệ

- **One-to-Many** với `vehicle_models`

---

## 4. CAR_TYPES (Loại xe)

**Bảng**: `car_types`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | INTEGER | No | ID tự động tăng (Primary Key) |
| name | VARCHAR(50) | No | Tên loại xe |

### Dữ liệu mẫu

10 loại xe: Sedan, SUV, Hatchback, Crossover, MPV, Pickup, Coupe, Convertible, Minivan, Sports Car

### Mối quan hệ

- **One-to-Many** với `vehicle_models`

---

## 5. VEHICLE_MODELS (Dòng xe)

**Bảng**: `vehicle_models`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | INTEGER | No | ID tự động tăng (Primary Key) |
| brand_id | INTEGER | No | ID thương hiệu (FK → brands.id) |
| type_id | INTEGER | No | ID loại xe (FK → car_types.id) |
| name | VARCHAR(50) | No | Tên dòng xe |

### Dữ liệu mẫu

38 dòng xe từ các thương hiệu:
- **Toyota**: Camry, Corolla Altis, Fortuner, Corolla Cross, Innova, Yaris
- **Honda**: Civic, Accord, CR-V, HR-V, City Hatchback
- **Mazda**: Mazda 3, Mazda 6, CX-5, CX-30, CX-8
- **Hyundai**: Elantra, Accent, Tucson, Santa Fe, Creta
- **Kia**: Cerato, Sorento, Seltos, Carnival
- **Ford**: Everest, Ranger, Focus
- **Mercedes-Benz**: C-Class, E-Class, GLC, S-Class
- **BMW**: 3 Series, X3, X5
- **VinFast**: Lux A2.0, Lux SA2.0, VF e34, VF 8, VF 9

### Mối quan hệ

- **Many-to-One** với `brands`
- **Many-to-One** với `car_types`
- **One-to-Many** với `vehicles`

---

## 6. VEHICLES (Xe)

**Bảng**: `vehicles`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | INTEGER | No | ID tự động tăng (Primary Key) |
| owner_id | INTEGER | No | ID chủ xe (FK → users.id) |
| model_id | INTEGER | No | ID dòng xe (FK → vehicle_models.id) |
| license_plate | VARCHAR(20) | No | Biển số xe (unique) |
| color | VARCHAR(30) | Yes | Màu xe |
| seat_count | INTEGER | Yes | Số ghế |
| transmission | ENUM | Yes | Hộp số: AUTOMATIC, MANUAL |
| fuel_type | ENUM | Yes | Nhiên liệu: GASOLINE, DIESEL, ELECTRIC, HYBRID |
| price_per_day | DECIMAL(12,2) | No | Giá thuê mỗi ngày (VNĐ) |
| created_at | TIMESTAMP | Yes | Thời gian tạo |
| reviewed_at | TIMESTAMP | Yes | Thời gian duyệt |
| status | ENUM | Yes | Trạng thái: AVAILABLE, RENTED, MAINTENANCE, PENDING_APPROVAL |
| description | TEXT | Yes | Mô tả xe |
| year | INTEGER | Yes | Năm sản xuất |
| fuel_consumption | FLOAT | Yes | Mức tiêu thụ nhiên liệu |
| current_km | INTEGER | No | Số km hiện tại |
| fuel_level | INTEGER | Yes | Mức nhiên liệu (0-100%) |
| delivery_enabled | BOOLEAN | Yes | Có giao xe tận nơi không |
| free_delivery_within_km | INTEGER | Yes | Giao miễn phí trong bán kính (km) |
| max_delivery_distance_km | INTEGER | Yes | Khoảng cách giao xe tối đa (km) |
| extra_fee_per_km | DECIMAL(12,2) | Yes | Phí thêm mỗi km |
| location_id | INTEGER | Yes | ID địa điểm (FK → locations.id) |

### Dữ liệu mẫu

16 xe từ 4 chủ xe:
- **Nguyễn Văn A**: 4 xe
- **Trần Thị B**: 4 xe
- **Lê Văn C**: 4 xe
- **Phạm Thị D**: 4 xe

**Trạng thái**:
- AVAILABLE: 11 xe
- RENTED: 3 xe
- MAINTENANCE: 1 xe
- PENDING_APPROVAL: 1 xe

**Giá thuê**: 850,000đ - 2,800,000đ/ngày

### Mối quan hệ

- **Many-to-One** với `users` (owner)
- **Many-to-One** với `vehicle_models`
- **Many-to-One** với `locations`
- **One-to-Many** với `vehicle_images`
- **Many-to-Many** với `vehicle_features` (qua bảng `vehicle_feature_assignments`)
- **One-to-Many** với `bookings`
- **One-to-Many** với `maintenance_records`

---

## 7. VEHICLE_IMAGES (Hình ảnh xe)

**Bảng**: `vehicle_images`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | INTEGER | No | ID tự động tăng (Primary Key) |
| vehicle_id | INTEGER | No | ID xe (FK → vehicles.id) |
| image_url | VARCHAR(255) | No | URL hình ảnh |
| is_main | BOOLEAN | Yes | Ảnh chính hay không |

### Dữ liệu mẫu

- Mỗi xe có 1-3 hình ảnh
- Mỗi xe có đúng 1 ảnh chính (is_main = TRUE)
- Sử dụng Cloudinary để lưu trữ

### Mối quan hệ

- **Many-to-One** với `vehicles`

---

## 8. VEHICLE_FEATURES (Tính năng xe)

**Bảng**: `vehicle_features`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | INTEGER | No | ID tự động tăng (Primary Key) |
| name | VARCHAR(100) | No | Tên tính năng (unique) |

### Dữ liệu mẫu

30 tính năng:
- **Giải trí & Kết nối**: Bluetooth, Màn hình cảm ứng, Hệ thống âm thanh cao cấp, Khe cắm USB
- **An toàn**: Camera 360, Camera lùi, Cảm biến lùi, Cảm biến áp suất lốp, Túi khí an toàn, Camera hành trình
- **Tiện nghi**: Cửa sổ trời, Ghế da, Ghế massage, Ghế chỉnh điện, Điều hòa tự động
- **Công nghệ**: Định vị GPS, Hệ thống dẫn đường, Chìa khóa thông minh, Khởi động nút bấm, ETC tự động
- **Hỗ trợ lái xe**: Phanh tay điện tử, Cân bằng điện tử, Hỗ trợ khởi hành ngang dốc, Kiểm soát hành trình

### Mối quan hệ

- **Many-to-Many** với `vehicles` (qua bảng `vehicle_feature_assignments`)

---

## 9. VEHICLE_FEATURE_ASSIGNMENTS (Gán tính năng cho xe)

**Bảng**: `vehicle_feature_assignments`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| vehicle_id | INTEGER | No | ID xe (FK → vehicles.id, Primary Key) |
| feature_id | INTEGER | No | ID tính năng (FK → vehicle_features.id, Primary Key) |

### Dữ liệu mẫu

- **Xe hạng sang** (Mercedes, BMW): 20-27 tính năng
- **Xe trung cấp** (Toyota, Honda, Mazda): 15-20 tính năng
- **Xe phổ thông**: 9-13 tính năng

---

## 10. BOOKINGS (Đặt xe)

**Bảng**: `bookings`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | INTEGER | No | ID tự động tăng (Primary Key) |
| customer_id | INTEGER | No | ID khách hàng (FK → users.id) |
| vehicle_id | INTEGER | No | ID xe (FK → vehicles.id) |
| start_date | DATETIME | No | Ngày bắt đầu thuê |
| end_date | DATETIME | No | Ngày kết thúc thuê |
| total_price | DECIMAL(12,2) | Yes | Tổng giá |
| status | ENUM | Yes | Trạng thái: PENDING, CONFIRMED, ONGOING, COMPLETED, CANCELLED |
| created_at | TIMESTAMP | Yes | Thời gian tạo |
| updated_at | TIMESTAMP | Yes | Thời gian cập nhật |
| pickup_location | VARCHAR(255) | Yes | Địa điểm nhận xe |
| return_location | VARCHAR(255) | Yes | Địa điểm trả xe |
| deposit_amount | DECIMAL(12,2) | Yes | Tiền đặt cọc |
| payment_status | ENUM | Yes | Trạng thái thanh toán |
| payos_deposit_order_code | BIGINT | Yes | Mã đơn hàng cọc PayOS |
| payos_full_order_code | BIGINT | Yes | Mã đơn hàng full PayOS |
| checkout_url | VARCHAR(500) | Yes | URL thanh toán |
| start_km | INTEGER | Yes | Số km khi nhận xe |
| end_km | INTEGER | Yes | Số km khi trả xe |
| start_fuel_level | INTEGER | Yes | Mức nhiên liệu khi nhận (0-100%) |
| end_fuel_level | INTEGER | Yes | Mức nhiên liệu khi trả (0-100%) |
| surcharge_amount | DECIMAL(12,2) | Yes | Phụ phí |
| actual_return_date | DATETIME | Yes | Ngày trả xe thực tế |
| odometer_start | INTEGER | Yes | Đồng hồ km lúc nhận |
| odometer_end | INTEGER | Yes | Đồng hồ km lúc trả |
| fuel_level_start | ENUM | Yes | Mức nhiên liệu lúc nhận: FULL, THREE_QUARTERS, HALF, QUARTER, EMPTY |
| fuel_level_end | ENUM | Yes | Mức nhiên liệu lúc trả |
| late_fee | DECIMAL(12,2) | Yes | Phí trả xe trễ |
| fuel_fee | DECIMAL(12,2) | Yes | Phí nhiên liệu |
| damage_fee | DECIMAL(12,2) | Yes | Phí hư hỏng |
| total_additional_fees | DECIMAL(12,2) | Yes | Tổng phí phụ trội |
| damage_description | VARCHAR(1000) | Yes | Mô tả hư hỏng |
| return_status | ENUM | Yes | Trạng thái trả xe: NOT_RETURNED, OWNER_CONFIRMED, CUSTOMER_CONFIRMED, DISPUTED, RESOLVED |
| return_notes | VARCHAR(500) | Yes | Ghi chú khi trả xe |

### Dữ liệu mẫu

14 bookings:
- **COMPLETED**: 4 bookings (đã hoàn thành, có reviews)
- **ONGOING**: 3 bookings (đang diễn ra)
- **CONFIRMED**: 3 bookings (đã xác nhận, sắp tới)
- **PENDING**: 2 bookings (chờ xác nhận)
- **CANCELLED**: 1 booking (đã hủy)
- **DISPUTED**: 1 booking (có tranh chấp)

### Mối quan hệ

- **Many-to-One** với `users` (customer)
- **Many-to-One** với `vehicles`
- **One-to-Many** với `payments`
- **One-to-One** với `reviews`
- **One-to-Many** với `disputes`
- **One-to-One** với `chat_conversations`

---

## 11. BOOKING_DAMAGE_IMAGES (Hình ảnh hư hỏng)

**Bảng**: `booking_damage_images`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| booking_id | INTEGER | No | ID booking (FK → bookings.id) |
| image_url | VARCHAR(255) | No | URL hình ảnh hư hỏng |

### Dữ liệu mẫu

- Booking #4: 1 ảnh (vết xước nhỏ)
- Booking #14: 2 ảnh (vết móp)

---

## 12. MAINTENANCE_RECORDS (Lịch sử bảo dưỡng)

**Bảng**: `maintenance_records`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | INTEGER | No | ID tự động tăng (Primary Key) |
| vehicle_id | INTEGER | No | ID xe (FK → vehicles.id) |
| customer_id | INTEGER | No | ID chủ xe (FK → users.id) |
| description | TEXT | Yes | Mô tả công việc |
| service_type | VARCHAR(100) | Yes | Loại dịch vụ |
| status | ENUM | Yes | Trạng thái: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED |
| odometer_km | INTEGER | Yes | Số km khi bảo dưỡng |
| scheduled_at | DATETIME | Yes | Thời gian lên lịch |
| started_at | DATETIME | Yes | Thời gian bắt đầu |
| completed_at | DATETIME | Yes | Thời gian hoàn thành |
| total_cost | DECIMAL(12,2) | Yes | Tổng chi phí |
| created_at | TIMESTAMP | Yes | Thời gian tạo |
| updated_at | TIMESTAMP | Yes | Thời gian cập nhật |

### Dữ liệu mẫu

6 records:
- **COMPLETED**: 3 records (bảo dưỡng định kỳ, thay dầu, sửa phanh)
- **IN_PROGRESS**: 1 record (thay lốp)
- **SCHEDULED**: 2 records (bảo dưỡng định kỳ, kiểm tra điện)

**Chi phí**: 800,000đ - 3,500,000đ

### Mối quan hệ

- **Many-to-One** với `vehicles`
- **Many-to-One** với `users` (owner)
- **One-to-Many** với `maintenance_cost_items`

---

## 13. MAINTENANCE_COST_ITEMS (Chi tiết chi phí bảo dưỡng)

**Bảng**: `maintenance_cost_items`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | INTEGER | No | ID tự động tăng (Primary Key) |
| maintenance_id | INTEGER | No | ID bảo dưỡng (FK → maintenance_records.id) |
| category | VARCHAR(50) | Yes | Danh mục: Phụ tùng, Vật tư, Nhân công |
| description | VARCHAR(255) | Yes | Mô tả chi tiết |
| quantity | INTEGER | Yes | Số lượng |
| unit_price | DECIMAL(12,2) | Yes | Đơn giá |
| total_price | DECIMAL(12,2) | Yes | Thành tiền |

### Dữ liệu mẫu

18 items cho 3 maintenance records:
- **Bảo dưỡng định kỳ 60,000km**: 7 items (lọc, dầu, phí bảo dưỡng)
- **Thay dầu**: 3 items (dầu, lọc, phí thay)
- **Sửa phanh**: 4 items (má phanh, đĩa phanh, dầu phanh, phí sửa)

### Mối quan hệ

- **Many-to-One** với `maintenance_records`

---

## 14. DISPUTES (Tranh chấp)

**Bảng**: `disputes`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | INTEGER | No | ID tự động tăng (Primary Key) |
| booking_id | INTEGER | No | ID booking (FK → bookings.id) |
| customer_id | INTEGER | No | ID khách hàng (FK → users.id) |
| owner_id | INTEGER | No | ID chủ xe (FK → users.id) |
| reason | TEXT | Yes | Lý do tranh chấp |
| disputed_amount | DECIMAL(12,2) | Yes | Số tiền tranh chấp |
| status | ENUM | Yes | Trạng thái: OPEN, IN_DISCUSSION, RESOLVED, CANCELLED |
| resolution_notes | TEXT | Yes | Ghi chú giải quyết |
| final_amount | DECIMAL(12,2) | Yes | Số tiền cuối cùng |
| created_at | TIMESTAMP | Yes | Thời gian tạo |
| updated_at | TIMESTAMP | Yes | Thời gian cập nhật |
| resolved_at | TIMESTAMP | Yes | Thời gian giải quyết |

### Dữ liệu mẫu

3 disputes:
- **OPEN**: 1 dispute (tranh chấp phí hư hỏng 800,000đ)
- **IN_DISCUSSION**: 1 dispute (tranh chấp phí xước 500,000đ)
- **RESOLVED**: 1 dispute (đã giải quyết, giảm phí từ 300,000đ → 150,000đ)

### Mối quan hệ

- **Many-to-One** với `bookings`
- **Many-to-One** với `users` (customer)
- **Many-to-One** với `users` (owner)
- **One-to-Many** với `messages`

---

## 15. MESSAGES (Tin nhắn - Legacy)

**Bảng**: `messages`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | INTEGER | No | ID tự động tăng (Primary Key) |
| sender_id | INTEGER | No | ID người gửi (FK → users.id) |
| receiver_id | INTEGER | No | ID người nhận (FK → users.id) |
| booking_id | INTEGER | Yes | ID booking (FK → bookings.id) |
| dispute_id | INTEGER | Yes | ID tranh chấp (FK → disputes.id) |
| content | TEXT | No | Nội dung tin nhắn |
| sent_at | TIMESTAMP | Yes | Thời gian gửi |
| is_read | BOOLEAN | Yes | Đã đọc chưa |
| read_at | TIMESTAMP | Yes | Thời gian đọc |

### Dữ liệu mẫu

10 tin nhắn liên quan đến bookings và disputes

### Mối quan hệ

- **Many-to-One** với `users` (sender)
- **Many-to-One** với `users` (receiver)
- **Many-to-One** với `bookings`
- **Many-to-One** với `disputes`

---

## 16. PAYMENTS (Thanh toán)

**Bảng**: `payments`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | INTEGER | No | ID tự động tăng (Primary Key) |
| booking_id | INTEGER | No | ID booking (FK → bookings.id) |
| payment_method | ENUM | Yes | Phương thức: PAYOS, CASH, BANK_TRANSFER |
| amount | DECIMAL(12,2) | No | Số tiền |
| transaction_id | VARCHAR(100) | Yes | Mã giao dịch PayOS |
| status | ENUM | Yes | Trạng thái: SUCCESS, PENDING, FAILED, REFUNDED |
| payment_date | TIMESTAMP | Yes | Thời gian thanh toán |

### Dữ liệu mẫu

14 payments:
- **SUCCESS**: 12 payments (tiền cọc + tiền full + phí phụ trội)
- **REFUNDED**: 1 payment (hoàn tiền booking bị hủy)

**Tổng giá trị**: ~50,000,000đ

### Mối quan hệ

- **Many-to-One** với `bookings`

---

## 17. REVIEWS (Đánh giá)

**Bảng**: `reviews`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | INTEGER | No | ID tự động tăng (Primary Key) |
| booking_id | INTEGER | No | ID booking (FK → bookings.id, unique) |
| vehicle_rating | INTEGER | Yes | Đánh giá xe (1-5 sao) |
| comment | TEXT | Yes | Bình luận |
| created_at | TIMESTAMP | Yes | Thời gian tạo |

### Dữ liệu mẫu

4 reviews cho các booking đã hoàn thành:
- **5 sao**: 2 reviews
- **4 sao**: 2 reviews

### Mối quan hệ

- **One-to-One** với `bookings`

---

## 18. NOTIFICATIONS (Thông báo)

**Bảng**: `notifications`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | INTEGER | No | ID tự động tăng (Primary Key) |
| user_id | INTEGER | No | ID người nhận (FK → users.id) |
| title | VARCHAR(255) | No | Tiêu đề |
| message | TEXT | No | Nội dung |
| type | VARCHAR(30) | No | Loại: SYSTEM, BOOKING, PAYMENT, REVIEW, DISPUTE, MAINTENANCE, VEHICLE |
| priority | VARCHAR(20) | No | Độ ưu tiên: HIGH, NORMAL, LOW |
| is_read | BOOLEAN | No | Đã đọc chưa |
| deep_link | VARCHAR(255) | Yes | Link đến trang chi tiết |
| created_at | TIMESTAMP | No | Thời gian tạo |

### Dữ liệu mẫu

25+ notifications cho tất cả users:
- **Admin**: thông báo hệ thống, tranh chấp
- **Owners**: đặt xe mới, bảo dưỡng, tranh chấp, đánh giá
- **Customers**: xác nhận booking, nhắc nhở trả xe, thanh toán, tranh chấp

### Mối quan hệ

- **Many-to-One** với `users`

---

## 19. CHAT_CONVERSATIONS (Cuộc trò chuyện)

**Bảng**: `chat_conversations`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | INTEGER | No | ID tự động tăng (Primary Key) |
| customer_id | INTEGER | No | ID khách hàng (FK → users.id) |
| owner_id | INTEGER | No | ID chủ xe (FK → users.id) |
| vehicle_id | INTEGER | Yes | ID xe (FK → vehicles.id) |
| booking_id | INTEGER | Yes | ID booking (FK → bookings.id, unique) |
| created_at | TIMESTAMP | Yes | Thời gian tạo |
| last_message_at | TIMESTAMP | Yes | Thời gian tin nhắn cuối |

### Dữ liệu mẫu

5 conversations:
- 2 conversations cho ongoing bookings
- 2 conversations cho disputed bookings
- 1 conversation cho inquiry (chưa có booking)

### Mối quan hệ

- **Many-to-One** với `users` (customer)
- **Many-to-One** với `users` (owner)
- **Many-to-One** với `vehicles`
- **One-to-One** với `bookings`
- **One-to-Many** với `chat_messages`

---

## 20. CHAT_MESSAGES (Tin nhắn chat)

**Bảng**: `chat_messages`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | INTEGER | No | ID tự động tăng (Primary Key) |
| conversation_id | INTEGER | No | ID conversation (FK → chat_conversations.id) |
| sender_id | INTEGER | No | ID người gửi (FK → users.id) |
| content | VARCHAR(2000) | No | Nội dung tin nhắn |
| is_read | BOOLEAN | Yes | Đã đọc chưa |
| created_at | TIMESTAMP | Yes | Thời gian gửi |

### Dữ liệu mẫu

20 tin nhắn trong 5 conversations:
- Hỏi về xe và lịch trình
- Xác nhận nhận/trả xe
- Tranh chấp về phí hư hỏng
- Thương lượng giá

### Mối quan hệ

- **Many-to-One** với `chat_conversations`
- **Many-to-One** với `users` (sender)

---

## 21. OWNER_REGISTRATIONS (Đăng ký làm chủ xe)

**Bảng**: `owner_registrations`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | INTEGER | No | ID tự động tăng (Primary Key) |
| user_id | INTEGER | No | ID người dùng (FK → users.id) |
| status | ENUM | Yes | Trạng thái: PENDING, APPROVED, REJECTED |
| license_front_url | VARCHAR(255) | Yes | URL ảnh CMND/CCCD mặt trước |
| license_back_url | VARCHAR(255) | Yes | URL ảnh CMND/CCCD mặt sau |
| selfie_url | VARCHAR(255) | Yes | URL ảnh selfie với CMND/CCCD |
| registration_number | VARCHAR(50) | Yes | Mã đăng ký |
| submitted_at | TIMESTAMP | Yes | Thời gian nộp |
| reviewed_at | TIMESTAMP | Yes | Thời gian duyệt |
| reviewed_by | INTEGER | Yes | ID admin duyệt (FK → users.id) |
| rejection_reason | TEXT | Yes | Lý do từ chối |

### Dữ liệu mẫu

5 registrations:
- **APPROVED**: 4 registrations (4 EXPERT users)
- **PENDING**: 1 registration (đang chờ duyệt)

### Mối quan hệ

- **One-to-One** với `users`
- **Many-to-One** với `users` (reviewer)

---

## 22. INVALIDATED_TOKENS (Token đã vô hiệu hóa)

**Bảng**: `invalidated_tokens`

### Cấu trúc

| Cột | Kiểu dữ liệu | Nullable | Mô tả |
|-----|-------------|----------|--------|
| id | VARCHAR(255) | No | Token ID (Primary Key) |
| expiry_time | TIMESTAMP | Yes | Thời gian hết hạn |

### Dữ liệu mẫu

Không có dữ liệu mẫu (chỉ chứa token khi user logout)

---

## Sơ đồ quan hệ (ER Diagram)

### Nhóm User & Authentication
```
users (1) ←→ (1) owner_registrations
users (1) ←→ (N) vehicles [as owner]
users (1) ←→ (N) bookings [as customer]
users (1) ←→ (N) notifications
users (1) ←→ (N) chat_conversations [as customer/owner]
users (1) ←→ (N) chat_messages [as sender]
users (1) ←→ (N) maintenance_records [as owner]
```

### Nhóm Vehicle
```
brands (1) ←→ (N) vehicle_models
car_types (1) ←→ (N) vehicle_models
vehicle_models (1) ←→ (N) vehicles
locations (1) ←→ (N) vehicles
vehicles (1) ←→ (N) vehicle_images
vehicles (N) ←→ (N) vehicle_features [via vehicle_feature_assignments]
vehicles (1) ←→ (N) bookings
vehicles (1) ←→ (N) maintenance_records
vehicles (1) ←→ (N) chat_conversations
```

### Nhóm Booking & Payment
```
bookings (1) ←→ (N) payments
bookings (1) ←→ (1) reviews
bookings (1) ←→ (N) disputes
bookings (1) ←→ (1) chat_conversations
bookings (1) ←→ (N) booking_damage_images
```

### Nhóm Maintenance
```
maintenance_records (1) ←→ (N) maintenance_cost_items
```

### Nhóm Communication
```
chat_conversations (1) ←→ (N) chat_messages
disputes (1) ←→ (N) messages [legacy]
bookings (1) ←→ (N) messages [legacy]
```

---

## Thống kê dữ liệu

| Bảng | Số records |
|------|-----------|
| users | 11 |
| locations | 14 |
| brands | 15 |
| car_types | 10 |
| vehicle_models | 38 |
| vehicles | 16 |
| vehicle_images | ~30 |
| vehicle_features | 30 |
| vehicle_feature_assignments | ~200 |
| bookings | 14 |
| booking_damage_images | 3 |
| maintenance_records | 6 |
| maintenance_cost_items | 18 |
| disputes | 3 |
| messages | 10 |
| payments | 14 |
| reviews | 4 |
| notifications | 25+ |
| chat_conversations | 5 |
| chat_messages | 20 |
| owner_registrations | 5 |
| invalidated_tokens | 0 |

**Tổng**: ~480+ records

---

## Hướng dẫn sử dụng

### 1. Khởi tạo database

```sql
-- Tạo database
CREATE DATABASE car_manager;

-- Sử dụng database
USE car_manager;
```

### 2. Cấu hình application.yaml

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/car_manager
    username: sa
    password: 123
  jpa:
    hibernate:
      ddl-auto: create-drop  # Tự động tạo bảng và load data.sql
    show-sql: true
```

### 3. Chạy ứng dụng

Khi ứng dụng Spring Boot khởi động:
1. Hibernate sẽ tự động tạo tất cả các bảng (do `ddl-auto: create-drop`)
2. Spring Boot sẽ tự động chạy file `data.sql` để load seed data

### 4. Đăng nhập

**Admin**:
- Email: `admin@carrental.com`
- Password: `password123`

**Chủ xe (EXPERT)**:
- Email: `nguyenvana@gmail.com`, `tranthib@gmail.com`, `levanc@gmail.com`, `phamthid@gmail.com`
- Password: `password123`

**Khách hàng (USER)**:
- Email: `hoangvane@gmail.com`, `vuthif@gmail.com`, v.v.
- Password: `password123`

---

## Lưu ý quan trọng

1. **Password**: Tất cả user có password là `password123` (đã mã hóa BCrypt)
2. **Dates**: Dữ liệu sử dụng `NOW()` và `INTERVAL` để tính toán ngày tháng động
3. **Images**: Tất cả URL hình ảnh là placeholder từ Cloudinary, cần thay thế bằng URL thực
4. **PayOS**: Transaction IDs là giả lập, cần tích hợp thật với PayOS API
5. **Foreign Keys**: Thứ tự insert dữ liệu phải đúng để tránh lỗi foreign key constraint

---

## Cập nhật và mở rộng

Để thêm dữ liệu mới, tuân thủ thứ tự sau:

1. **Dữ liệu master**: users, locations, brands, car_types, vehicle_features
2. **Dữ liệu vehicle**: vehicle_models → vehicles → vehicle_images → vehicle_feature_assignments
3. **Dữ liệu booking**: bookings → payments → reviews
4. **Dữ liệu maintenance**: maintenance_records → maintenance_cost_items
5. **Dữ liệu communication**: disputes, chat_conversations → chat_messages
6. **Dữ liệu notification**: notifications

---

**Version**: 1.0  
**Last Updated**: 2026-03-05  
**Author**: Car Rental Management System Team
