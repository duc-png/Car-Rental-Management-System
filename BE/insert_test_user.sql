-- Insert test user với password đúng: mito123
-- Password hash: $2a$12$b23gs7vVvYQtrgxUuHdqs.ePBpW207L.bzeWZM71LzDJcASpPJeNi

USE car_manager;

-- Xóa user cũ nếu có (để tránh duplicate)
DELETE FROM user_roles WHERE user_id = (SELECT id FROM users WHERE email = 'mito1701@gmail.com');
DELETE FROM users WHERE email = 'mito1701@gmail.com';

-- Tạo roles nếu chưa có
INSERT INTO roles (id, name) 
SELECT 1, 'ADMIN' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE id = 1);

INSERT INTO roles (id, name) 
SELECT 2, 'USER' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE id = 2);

-- Insert user mới
INSERT INTO users (full_name, email, password, phone, license_number, is_verified, created_at)
VALUES (
    'Đức Mito',
    'mito1701@gmail.com',
    '$2a$12$b23gs7vVvYQtrgxUuHdqs.ePBpW207L.bzeWZM71LzDJcASpPJeNi',
    '0974000000',
    NULL,
    1,
    NOW()
);

-- Gán role USER
INSERT INTO user_roles (user_id, role_id)
VALUES (LAST_INSERT_ID(), 2);

-- Kiểm tra kết quả
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.password,
    u.phone,
    u.is_verified,
    r.name as role_name
FROM users u 
LEFT JOIN user_roles ur ON u.id = ur.user_id 
LEFT JOIN roles r ON ur.role_id = r.id 
WHERE u.email = 'mito1701@gmail.com';
