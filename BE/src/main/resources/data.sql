-- =====================================================
-- CAR RENTAL MANAGEMENT SYSTEM - SEED DATA
-- =====================================================
-- Run this script after the tables are created by Hibernate
-- Order matters due to foreign key constraints

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
-- Password: "password123" encoded with BCrypt
-- $2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqvzXYXGq8K7d3K.KJyW3.zFO9uSq

INSERT INTO users (full_name, email, password, phone, license_number, address, is_verified, is_active, created_at, role_id) VALUES
-- Admin users
('Admin System', 'admin@carrental.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqvzXYXGq8K7d3K.KJyW3.zFO9uSq', '0901234567', NULL, 'Hà Nội, Việt Nam', TRUE, TRUE, NOW(), 'ADMIN'),

-- Expert users (Car owners)
('Nguyễn Văn A', 'nguyenvana@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqvzXYXGq8K7d3K.KJyW3.zFO9uSq', '0912345678', 'B1-123456', '123 Lê Lợi, Quận 1, TP.HCM', TRUE, TRUE, NOW(), 'EXPERT'),
('Trần Thị B', 'tranthib@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqvzXYXGq8K7d3K.KJyW3.zFO9uSq', '0923456789', 'B1-234567', '456 Nguyễn Huệ, Quận 1, TP.HCM', TRUE, TRUE, NOW(), 'EXPERT'),
('Lê Văn C', 'levanc@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqvzXYXGq8K7d3K.KJyW3.zFO9uSq', '0934567890', 'B1-345678', '789 Trần Hưng Đạo, Quận 5, TP.HCM', TRUE, TRUE, NOW(), 'EXPERT'),
('Phạm Thị D', 'phamthid@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqvzXYXGq8K7d3K.KJyW3.zFO9uSq', '0945678901', 'B1-456789', '321 Cách Mạng Tháng 8, Quận 3, TP.HCM', TRUE, TRUE, NOW(), 'EXPERT'),

-- Regular users (Customers)
('Hoàng Văn E', 'hoangvane@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqvzXYXGq8K7d3K.KJyW3.zFO9uSq', '0956789012', 'B2-567890', '159 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM', TRUE, TRUE, NOW(), 'USER'),
('Vũ Thị F', 'vuthif@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqvzXYXGq8K7d3K.KJyW3.zFO9uSq', '0967890123', 'B2-678901', '753 Võ Văn Tần, Quận 3, TP.HCM', TRUE, TRUE, NOW(), 'USER'),
('Đỗ Văn G', 'dovang@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqvzXYXGq8K7d3K.KJyW3.zFO9uSq', '0978901234', 'B2-789012', '852 Lý Thường Kiệt, Quận 10, TP.HCM', TRUE, TRUE, NOW(), 'USER'),
('Bùi Thị H', 'buithih@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqvzXYXGq8K7d3K.KJyW3.zFO9uSq', '0989012345', 'B2-890123', '951 Nguyễn Trãi, Quận 5, TP.HCM', TRUE, TRUE, NOW(), 'USER'),
('Ngô Văn I', 'ngovani@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqvzXYXGq8K7d3K.KJyW3.zFO9uSq', '0990123456', 'B2-901234', '147 Hai Bà Trưng, Quận 1, TP.HCM', TRUE, TRUE, NOW(), 'USER'),
('Đặng Thị K', 'dangthik@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqvzXYXGq8K7d3K.KJyW3.zFO9uSq', '0901234560', 'B2-012345', '258 Phan Xích Long, Quận Phú Nhuận, TP.HCM', FALSE, TRUE, NOW(), 'USER');

-- =====================================================
-- 2. LOCATIONS TABLE
-- =====================================================
INSERT INTO locations (city, district, address_detail) VALUES
-- Ho Chi Minh City
('TP. Hồ Chí Minh', 'Quận 1', '123 Nguyễn Huệ, Phường Bến Nghé'),
('TP. Hồ Chí Minh', 'Quận 1', '456 Lê Lợi, Phường Bến Thành'),
('TP. Hồ Chí Minh', 'Quận 3', '789 Võ Văn Tần, Phường 5'),
('TP. Hồ Chí Minh', 'Quận 7', '321 Nguyễn Văn Linh, Phường Tân Phong'),
('TP. Hồ Chí Minh', 'Quận Bình Thạnh', '654 Điện Biên Phủ, Phường 25'),
('TP. Hồ Chí Minh', 'Quận Tân Bình', '987 Cộng Hòa, Phường 13'),
('TP. Hồ Chí Minh', 'Thủ Đức', '147 Võ Văn Ngân, Phường Linh Chiểu'),

-- Ha Noi
('Hà Nội', 'Ba Đình', '12 Hoàng Diệu, Phường Quán Thánh'),
('Hà Nội', 'Hoàn Kiếm', '56 Tràng Tiền, Phường Tràng Tiền'),
('Hà Nội', 'Cầu Giấy', '89 Trần Duy Hưng, Phường Trung Hòa'),
('Hà Nội', 'Đống Đa', '23 Xã Đàn, Phường Nam Đồng'),

-- Da Nang
('Đà Nẵng', 'Hải Châu', '45 Bạch Đằng, Phường Hải Châu 1'),
('Đà Nẵng', 'Sơn Trà', '67 Trần Hưng Đạo, Phường An Hải Bắc'),
('Đà Nẵng', 'Ngũ Hành Sơn', '34 Võ Nguyên Giáp, Phường Mỹ An');

-- =====================================================
-- 3. BRANDS TABLE
-- =====================================================
INSERT INTO brands (name) VALUES
('Toyota'),
('Honda'),
('Mazda'),
('Hyundai'),
('Kia'),
('Ford'),
('Mercedes-Benz'),
('BMW'),
('Audi'),
('VinFast'),
('Mitsubishi'),
('Nissan'),
('Chevrolet'),
('Lexus'),
('Suzuki');

-- =====================================================
-- 4. CAR_TYPES TABLE
-- =====================================================
INSERT INTO car_types (name) VALUES
('Sedan'),
('SUV'),
('Hatchback'),
('Crossover'),
('MPV'),
('Pickup'),
('Coupe'),
('Convertible'),
('Minivan'),
('Sports Car');

-- =====================================================
-- 5. VEHICLE_MODELS TABLE
-- =====================================================
INSERT INTO vehicle_models (brand_id, type_id, name) VALUES
-- Toyota models
(1, 1, 'Camry'),
(1, 1, 'Corolla Altis'),
(1, 2, 'Fortuner'),
(1, 4, 'Corolla Cross'),
(1, 5, 'Innova'),
(1, 3, 'Yaris'),

-- Honda models
(2, 1, 'Civic'),
(2, 1, 'Accord'),
(2, 2, 'CR-V'),
(2, 4, 'HR-V'),
(2, 3, 'City Hatchback'),

-- Mazda models
(3, 1, 'Mazda 3'),
(3, 1, 'Mazda 6'),
(3, 2, 'CX-5'),
(3, 4, 'CX-30'),
(3, 2, 'CX-8'),

-- Hyundai models
(4, 1, 'Elantra'),
(4, 1, 'Accent'),
(4, 2, 'Tucson'),
(4, 2, 'Santa Fe'),
(4, 4, 'Creta'),

-- Kia models
(5, 1, 'Cerato'),
(5, 2, 'Sorento'),
(5, 4, 'Seltos'),
(5, 5, 'Carnival'),

-- Ford models
(6, 2, 'Everest'),
(6, 6, 'Ranger'),
(6, 1, 'Focus'),

-- Mercedes-Benz models
(7, 1, 'C-Class'),
(7, 1, 'E-Class'),
(7, 2, 'GLC'),
(7, 1, 'S-Class'),

-- BMW models
(8, 1, '3 Series'),
(8, 2, 'X3'),
(8, 2, 'X5'),

-- VinFast models
(10, 1, 'Lux A2.0'),
(10, 2, 'Lux SA2.0'),
(10, 3, 'VF e34'),
(10, 2, 'VF 8'),
(10, 2, 'VF 9');

-- =====================================================
-- 6. VEHICLES TABLE
-- =====================================================
INSERT INTO vehicles (owner_id, model_id, license_plate, color, seat_count, transmission, fuel_type, price_per_day, status, current_km, location_id) VALUES
-- Owner: Nguyễn Văn A (id=2)
(2, 1, '51A-12345', 'Trắng', 5, 'AUTOMATIC', 'GASOLINE', 1200000.00, 'AVAILABLE', 25000, 1),
(2, 3, '51A-23456', 'Đen', 7, 'AUTOMATIC', 'DIESEL', 1800000.00, 'AVAILABLE', 45000, 2),
(2, 7, '51A-34567', 'Đỏ', 5, 'AUTOMATIC', 'GASOLINE', 1100000.00, 'RENTED', 18000, 3),

-- Owner: Trần Thị B (id=3)
(3, 9, '51A-45678', 'Bạc', 5, 'AUTOMATIC', 'GASOLINE', 1400000.00, 'AVAILABLE', 32000, 4),
(3, 14, '51A-56789', 'Xanh', 5, 'AUTOMATIC', 'GASOLINE', 1300000.00, 'AVAILABLE', 28000, 5),
(3, 29, '51A-67890', 'Đen', 5, 'AUTOMATIC', 'GASOLINE', 2500000.00, 'RENTED', 15000, 1),

-- Owner: Lê Văn C (id=4)
(4, 19, '51A-78901', 'Trắng', 5, 'AUTOMATIC', 'GASOLINE', 1000000.00, 'AVAILABLE', 55000, 6),
(4, 26, '51A-89012', 'Xám', 7, 'AUTOMATIC', 'DIESEL', 2000000.00, 'MAINTENANCE', 62000, 7),
(4, 36, '51A-90123', 'Xanh Navy', 5, 'AUTOMATIC', 'ELECTRIC', 1500000.00, 'AVAILABLE', 12000, 2),

-- Owner: Phạm Thị D (id=5)
(5, 20, '51A-01234', 'Đỏ', 7, 'AUTOMATIC', 'DIESEL', 1600000.00, 'AVAILABLE', 38000, 8),
(5, 25, '51A-11111', 'Trắng', 7, 'AUTOMATIC', 'DIESEL', 1700000.00, 'PENDING_APPROVAL', 20000, 9),
(5, 33, '51A-22222', 'Đen', 5, 'AUTOMATIC', 'GASOLINE', 2800000.00, 'AVAILABLE', 8000, 10),

-- More vehicles for variety
(2, 12, '51A-33333', 'Trắng', 5, 'AUTOMATIC', 'GASOLINE', 950000.00, 'AVAILABLE', 42000, 11),
(3, 17, '51A-44444', 'Xám', 5, 'AUTOMATIC', 'GASOLINE', 850000.00, 'AVAILABLE', 68000, 12),
(4, 22, '51A-55555', 'Đen', 5, 'AUTOMATIC', 'GASOLINE', 900000.00, 'RENTED', 35000, 13),
(5, 38, '51A-66666', 'Xanh', 5, 'AUTOMATIC', 'ELECTRIC', 1400000.00, 'AVAILABLE', 5000, 14);

-- =====================================================
-- 7. VEHICLE_IMAGES TABLE
-- =====================================================
INSERT INTO vehicle_images (vehicle_id, image_url, is_main) VALUES
-- Vehicle 1: Toyota Camry
(1, 'https://res.cloudinary.com/demo/image/upload/v1/cars/camry_1.jpg', TRUE),
(1, 'https://res.cloudinary.com/demo/image/upload/v1/cars/camry_2.jpg', FALSE),
(1, 'https://res.cloudinary.com/demo/image/upload/v1/cars/camry_3.jpg', FALSE),

-- Vehicle 2: Toyota Fortuner
(2, 'https://res.cloudinary.com/demo/image/upload/v1/cars/fortuner_1.jpg', TRUE),
(2, 'https://res.cloudinary.com/demo/image/upload/v1/cars/fortuner_2.jpg', FALSE),

-- Vehicle 3: Honda Civic
(3, 'https://res.cloudinary.com/demo/image/upload/v1/cars/civic_1.jpg', TRUE),
(3, 'https://res.cloudinary.com/demo/image/upload/v1/cars/civic_2.jpg', FALSE),

-- Vehicle 4: Honda CR-V
(4, 'https://res.cloudinary.com/demo/image/upload/v1/cars/crv_1.jpg', TRUE),

-- Vehicle 5: Mazda CX-5
(5, 'https://res.cloudinary.com/demo/image/upload/v1/cars/cx5_1.jpg', TRUE),
(5, 'https://res.cloudinary.com/demo/image/upload/v1/cars/cx5_2.jpg', FALSE),

-- Vehicle 6: Mercedes C-Class
(6, 'https://res.cloudinary.com/demo/image/upload/v1/cars/cclass_1.jpg', TRUE),
(6, 'https://res.cloudinary.com/demo/image/upload/v1/cars/cclass_2.jpg', FALSE),
(6, 'https://res.cloudinary.com/demo/image/upload/v1/cars/cclass_3.jpg', FALSE),

-- Vehicle 7: Hyundai Tucson
(7, 'https://res.cloudinary.com/demo/image/upload/v1/cars/tucson_1.jpg', TRUE),

-- Vehicle 8: Ford Everest
(8, 'https://res.cloudinary.com/demo/image/upload/v1/cars/everest_1.jpg', TRUE),

-- Vehicle 9: VinFast Lux A
(9, 'https://res.cloudinary.com/demo/image/upload/v1/cars/luxa_1.jpg', TRUE),
(9, 'https://res.cloudinary.com/demo/image/upload/v1/cars/luxa_2.jpg', FALSE),

-- Vehicle 10: Hyundai Santa Fe
(10, 'https://res.cloudinary.com/demo/image/upload/v1/cars/santafe_1.jpg', TRUE),

-- Vehicle 11: Kia Carnival
(11, 'https://res.cloudinary.com/demo/image/upload/v1/cars/carnival_1.jpg', TRUE),

-- Vehicle 12: BMW 3 Series
(12, 'https://res.cloudinary.com/demo/image/upload/v1/cars/bmw3_1.jpg', TRUE);

-- =====================================================
-- 8. BOOKINGS TABLE
-- =====================================================
INSERT INTO bookings (customer_id, vehicle_id, start_date, end_date, total_price, status, created_at, updated_at, pickup_location, return_location, actual_return_date, odometer_start, odometer_end, fuel_level_start, fuel_level_end, late_fee, fuel_fee, damage_fee, total_additional_fees, damage_description, return_status, return_notes) VALUES

-- Completed bookings
(6, 1, '2026-02-01 09:00:00', '2026-02-03 18:00:00', 3600000.00, 'COMPLETED', NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 27 DAY, '123 Nguyễn Huệ, Quận 1', '123 Nguyễn Huệ, Quận 1', '2026-02-03 17:30:00', 25000, 25350, 'FULL', 'THREE_QUARTERS', 0, 150000.00, 0, 150000.00, NULL, 'CUSTOMER_CONFIRMED', 'Xe trả đúng hạn, sạch sẽ'),

(7, 2, '2026-02-05 08:00:00', '2026-02-07 20:00:00', 5400000.00, 'COMPLETED', NOW() - INTERVAL 25 DAY, NOW() - INTERVAL 22 DAY, '456 Lê Lợi, Quận 1', '456 Lê Lợi, Quận 1', '2026-02-07 19:00:00', 45000, 45520, 'FULL', 'HALF', 0, 300000.00, 0, 300000.00, NULL, 'CUSTOMER_CONFIRMED', NULL),

(8, 4, '2026-02-10 10:00:00', '2026-02-12 10:00:00', 2800000.00, 'COMPLETED', NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 18 DAY, 'Quận 7, TP.HCM', 'Quận 7, TP.HCM', '2026-02-12 12:00:00', 32000, 32180, 'FULL', 'FULL', 200000.00, 0, 0, 200000.00, NULL, 'CUSTOMER_CONFIRMED', 'Trả xe trễ 2 giờ'),

(9, 5, '2026-02-15 07:00:00', '2026-02-18 19:00:00', 5200000.00, 'COMPLETED', NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 11 DAY, 'Quận Bình Thạnh', 'Quận Bình Thạnh', '2026-02-18 18:00:00', 28000, 28650, 'FULL', 'THREE_QUARTERS', 0, 150000.00, 500000.00, 650000.00, 'Vết xước nhỏ ở cửa sau bên trái', 'RESOLVED', 'Đã thỏa thuận phí sửa chữa'),

-- Ongoing bookings
(6, 3, '2026-02-28 08:00:00', '2026-03-03 20:00:00', 4400000.00, 'ONGOING', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY, 'Quận 3, TP.HCM', 'Quận 3, TP.HCM', NULL, 18000, NULL, 'FULL', NULL, NULL, NULL, NULL, NULL, NULL, 'NOT_RETURNED', NULL),

(7, 6, '2026-02-27 09:00:00', '2026-03-04 18:00:00', 15000000.00, 'ONGOING', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY, 'Quận 1, TP.HCM', 'Quận 1, TP.HCM', NULL, 15000, NULL, 'FULL', NULL, NULL, NULL, NULL, NULL, NULL, 'NOT_RETURNED', NULL),

(10, 15, '2026-02-26 10:00:00', '2026-03-02 10:00:00', 4500000.00, 'ONGOING', NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 4 DAY, 'Đà Nẵng', 'Đà Nẵng', NULL, 35000, NULL, 'FULL', NULL, NULL, NULL, NULL, NULL, NULL, 'NOT_RETURNED', NULL),

-- Confirmed bookings (upcoming)
(8, 9, '2026-03-05 08:00:00', '2026-03-08 18:00:00', 4500000.00, 'CONFIRMED', NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY, 'Quận 1, TP.HCM', 'Quận 7, TP.HCM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'NOT_RETURNED', NULL),

(9, 10, '2026-03-10 09:00:00', '2026-03-12 17:00:00', 3200000.00, 'CONFIRMED', NOW(), NOW(), 'Hà Nội', 'Hà Nội', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'NOT_RETURNED', NULL),

(11, 12, '2026-03-07 07:00:00', '2026-03-09 19:00:00', 2850000.00, 'CONFIRMED', NOW(), NOW(), 'Hà Nội', 'Hà Nội', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'NOT_RETURNED', NULL),

-- Pending bookings
(6, 7, '2026-03-15 10:00:00', '2026-03-17 18:00:00', 2000000.00, 'PENDING', NOW(), NOW(), 'Quận Tân Bình', 'Quận Tân Bình', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'NOT_RETURNED', NULL),

(10, 13, '2026-03-20 08:00:00', '2026-03-22 20:00:00', 1900000.00, 'PENDING', NOW(), NOW(), 'Đà Nẵng', 'Đà Nẵng', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'NOT_RETURNED', NULL),

-- Cancelled bookings
(7, 1, '2026-02-20 09:00:00', '2026-02-22 18:00:00', 3600000.00, 'CANCELLED', NOW() - INTERVAL 12 DAY, NOW() - INTERVAL 11 DAY, 'Quận 1, TP.HCM', 'Quận 1, TP.HCM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'NOT_RETURNED', 'Khách hủy do lịch trình thay đổi'),

-- Disputed booking
(8, 14, '2026-02-22 08:00:00', '2026-02-24 17:00:00', 1700000.00, 'COMPLETED', NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 6 DAY, 'Đà Nẵng', 'Đà Nẵng', '2026-02-24 18:00:00', 68000, 68450, 'FULL', 'QUARTER', 100000.00, 450000.00, 800000.00, 1350000.00, 'Vết móp ở cản trước', 'DISPUTED', 'Khách không đồng ý phí hư hỏng');

-- =====================================================
-- 9. BOOKING_DAMAGE_IMAGES TABLE
-- =====================================================
INSERT INTO booking_damage_images (booking_id, image_url) VALUES
(4, 'https://res.cloudinary.com/demo/image/upload/v1/damages/scratch_1.jpg'),
(14, 'https://res.cloudinary.com/demo/image/upload/v1/damages/dent_1.jpg'),
(14, 'https://res.cloudinary.com/demo/image/upload/v1/damages/dent_2.jpg');

-- =====================================================
-- 10. MAINTENANCE_RECORDS TABLE
-- =====================================================
INSERT INTO maintenance_records (vehicle_id, customer_id, description, service_type, status, odometer_km, scheduled_at, started_at, completed_at, total_cost, created_at, updated_at) VALUES
-- Completed maintenance
(8, 4, 'Bảo dưỡng định kỳ 60,000km', 'Bảo dưỡng định kỳ', 'COMPLETED', 60000, '2026-02-20 08:00:00', '2026-02-20 08:30:00', '2026-02-20 16:00:00', 3500000.00, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 10 DAY),

(1, 2, 'Thay dầu động cơ và lọc dầu', 'Thay dầu', 'COMPLETED', 25000, '2026-02-15 09:00:00', '2026-02-15 09:15:00', '2026-02-15 10:30:00', 800000.00, NOW() - INTERVAL 15 DAY, NOW() - INTERVAL 15 DAY),

(3, 2, 'Sửa chữa hệ thống phanh', 'Sửa chữa', 'COMPLETED', 17500, '2026-02-10 10:00:00', '2026-02-10 10:30:00', '2026-02-11 14:00:00', 2200000.00, NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 19 DAY),

-- In progress maintenance
(8, 4, 'Kiểm tra và thay thế lốp xe', 'Thay lốp', 'IN_PROGRESS', 62000, '2026-03-01 08:00:00', '2026-03-01 08:30:00', NULL, NULL, NOW() - INTERVAL 1 DAY, NOW()),

-- Scheduled maintenance
(4, 3, 'Bảo dưỡng định kỳ 35,000km', 'Bảo dưỡng định kỳ', 'SCHEDULED', 32000, '2026-03-10 08:00:00', NULL, NULL, NULL, NOW(), NOW()),

(10, 5, 'Kiểm tra hệ thống điện', 'Kiểm tra', 'SCHEDULED', 38000, '2026-03-15 09:00:00', NULL, NULL, NULL, NOW(), NOW());

-- =====================================================
-- 11. MAINTENANCE_COST_ITEMS TABLE
-- =====================================================
INSERT INTO maintenance_cost_items (maintenance_id, category, description, quantity, unit_price, total_price) VALUES
-- Maintenance 1: Bảo dưỡng định kỳ 60,000km
(1, 'Phụ tùng', 'Lọc dầu động cơ', 1, 250000.00, 250000.00),
(1, 'Phụ tùng', 'Lọc gió điều hòa', 1, 350000.00, 350000.00),
(1, 'Phụ tùng', 'Lọc gió động cơ', 1, 400000.00, 400000.00),
(1, 'Vật tư', 'Dầu động cơ tổng hợp 5W-30 (lít)', 6, 200000.00, 1200000.00),
(1, 'Nhân công', 'Phí bảo dưỡng', 1, 500000.00, 500000.00),
(1, 'Phụ tùng', 'Dầu phanh', 1, 300000.00, 300000.00),
(1, 'Phụ tùng', 'Nước làm mát', 2, 250000.00, 500000.00),

-- Maintenance 2: Thay dầu
(2, 'Vật tư', 'Dầu động cơ tổng hợp 5W-30 (lít)', 4, 150000.00, 600000.00),
(2, 'Phụ tùng', 'Lọc dầu', 1, 120000.00, 120000.00),
(2, 'Nhân công', 'Phí thay dầu', 1, 80000.00, 80000.00),

-- Maintenance 3: Sửa chữa phanh
(3, 'Phụ tùng', 'Má phanh trước', 2, 450000.00, 900000.00),
(3, 'Phụ tùng', 'Đĩa phanh trước', 2, 350000.00, 700000.00),
(3, 'Vật tư', 'Dầu phanh DOT4', 1, 200000.00, 200000.00),
(3, 'Nhân công', 'Phí sửa chữa', 1, 400000.00, 400000.00);

-- =====================================================
-- 12. DISPUTES TABLE
-- =====================================================
INSERT INTO disputes (booking_id, customer_id, owner_id, reason, disputed_amount, status, resolution_notes, final_amount, created_at, updated_at, resolved_at) VALUES
-- Open dispute
(14, 8, 3, 'Không đồng ý với phí hư hỏng. Vết móp đã có sẵn trước khi thuê xe, tôi đã chụp ảnh làm bằng chứng.', 800000.00, 'OPEN', NULL, NULL, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 5 DAY, NULL),

-- In discussion dispute
(4, 9, 3, 'Phí xước xe quá cao so với mức độ hư hỏng thực tế. Đề nghị giảm xuống còn 200,000đ.', 500000.00, 'IN_DISCUSSION', NULL, NULL, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 8 DAY, NULL),

-- Resolved dispute
(2, 7, 2, 'Không đồng ý phí nhiên liệu. Tôi đã đổ xăng đầy trước khi trả xe.', 300000.00, 'RESOLVED', 'Sau khi xem xét bằng chứng từ cả hai bên, chủ xe đồng ý giảm phí nhiên liệu xuống còn 150,000đ.', 150000.00, NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 18 DAY, NOW() - INTERVAL 18 DAY);

-- =====================================================
-- 13. MESSAGES TABLE
-- =====================================================
INSERT INTO messages (sender_id, receiver_id, booking_id, dispute_id, content, sent_at, is_read, read_at) VALUES
-- Messages for booking 5 (ongoing)
(6, 2, 5, NULL, 'Chào anh/chị, tôi muốn hỏi xe có sẵn để tôi nhận sớm hơn 30 phút được không?', NOW() - INTERVAL 3 DAY, TRUE, NOW() - INTERVAL 3 DAY + INTERVAL 1 HOUR),
(2, 6, 5, NULL, 'Dạ được anh/chị. Anh/chị có thể đến sớm 30 phút nhé.', NOW() - INTERVAL 3 DAY + INTERVAL 2 HOUR, TRUE, NOW() - INTERVAL 3 DAY + INTERVAL 3 HOUR),
(6, 2, 5, NULL, 'Cảm ơn anh/chị!', NOW() - INTERVAL 3 DAY + INTERVAL 4 HOUR, TRUE, NOW() - INTERVAL 3 DAY + INTERVAL 5 HOUR),

-- Messages for booking 6 (ongoing)
(7, 3, 6, NULL, 'Tôi đã nhận xe. Xe rất đẹp và sạch sẽ.', NOW() - INTERVAL 2 DAY, TRUE, NOW() - INTERVAL 2 DAY + INTERVAL 30 MINUTE),
(3, 7, 6, NULL, 'Cảm ơn bạn. Chúc bạn có chuyến đi vui vẻ!', NOW() - INTERVAL 2 DAY + INTERVAL 1 HOUR, TRUE, NOW() - INTERVAL 2 DAY + INTERVAL 2 HOUR),

-- Messages for dispute 1
(8, 3, 14, 1, 'Tôi có ảnh chụp xe trước khi nhận, vết móp này đã có sẵn.', NOW() - INTERVAL 4 DAY, TRUE, NOW() - INTERVAL 4 DAY + INTERVAL 1 HOUR),
(3, 8, 14, 1, 'Xin bạn gửi ảnh để tôi xem xét.', NOW() - INTERVAL 4 DAY + INTERVAL 2 HOUR, TRUE, NOW() - INTERVAL 4 DAY + INTERVAL 3 HOUR),
(8, 3, 14, 1, 'Tôi đã gửi ảnh qua email.', NOW() - INTERVAL 4 DAY + INTERVAL 4 HOUR, FALSE, NULL),

-- Messages for dispute 2
(9, 3, 4, 2, 'Vết xước rất nhỏ, chỉ khoảng 5cm. Tôi nghĩ phí 500,000đ là quá cao.', NOW() - INTERVAL 9 DAY, TRUE, NOW() - INTERVAL 9 DAY + INTERVAL 1 HOUR),
(3, 9, 4, 2, 'Để tôi kiểm tra lại và báo giá sửa chữa thực tế cho bạn.', NOW() - INTERVAL 9 DAY + INTERVAL 2 HOUR, TRUE, NOW() - INTERVAL 9 DAY + INTERVAL 3 HOUR),
(3, 9, 4, 2, 'Sau khi kiểm tra, chi phí sửa chữa thực tế là 350,000đ. Bạn có đồng ý không?', NOW() - INTERVAL 8 DAY, TRUE, NOW() - INTERVAL 8 DAY + INTERVAL 1 HOUR),
(9, 3, 4, 2, 'Vâng, tôi đồng ý với mức giá này.', NOW() - INTERVAL 8 DAY + INTERVAL 2 HOUR, TRUE, NOW() - INTERVAL 8 DAY + INTERVAL 3 HOUR),

-- General inquiry messages
(10, 2, NULL, NULL, 'Cho tôi hỏi xe Toyota Camry còn trống ngày 15-20/3 không?', NOW() - INTERVAL 1 DAY, TRUE, NOW() - INTERVAL 1 DAY + INTERVAL 30 MINUTE),
(2, 10, NULL, NULL, 'Dạ xe còn trống. Anh/chị có thể đặt trên hệ thống nhé.', NOW() - INTERVAL 1 DAY + INTERVAL 1 HOUR, FALSE, NULL);

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. Password for all users: "password123"
-- 2. Adjust dates if needed (currently set relative to NOW())
-- 3. Image URLs are placeholders - replace with actual Cloudinary URLs
-- 4. BCrypt hash was generated with strength 10
-- =====================================================
