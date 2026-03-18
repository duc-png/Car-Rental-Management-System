# Feature ↔ File map (Car Rental Management System)

Tài liệu này liệt kê **các file liên quan** và **vai trò** của từng file cho các chức năng:

- Xem & chỉnh sửa hồ sơ khách hàng
- Xác minh bằng lái xe (GPLX)
- Wishlist (xe yêu thích)
- Lịch sử thuê xe / lịch sử booking

---

## 1) Xem & chỉnh sửa hồ sơ (Customer profile)

### Backend (BE)

- `BE/src/main/java/com/example/car_management/controller/CustomerController.java`
  - Cung cấp các API hồ sơ cho khách hàng:
    - `GET /api/v1/customers/profile`: xem hồ sơ của tôi
    - `PUT /api/v1/customers/profile`: cập nhật hồ sơ (tổng)
    - `PATCH /api/v1/customers/profile/basic-info`: cập nhật thông tin cơ bản
    - `PATCH /api/v1/customers/profile/phone`: cập nhật SĐT
    - `POST /api/v1/customers/profile/avatar`: upload avatar
    - `PUT /api/v1/customers/profile/password`: đổi mật khẩu
    - `POST /api/v1/customers/profile/email-otp/send`: gửi OTP đổi email
    - `POST /api/v1/customers/profile/email-otp/verify`: xác thực OTP đổi email

- `BE/src/main/java/com/example/car_management/service/CustomerService.java`
  - Chứa business logic cho các thao tác hồ sơ:
    - `getMyProfile`, `updateMyProfile`
    - `updateMyBasicInfo`, `updateMyPhone`
    - `changeMyPassword`
    - `uploadMyAvatar`
    - (đồng thời chứa logic liên quan GPLX và favorites — xem các mục bên dưới)

- `BE/src/main/java/com/example/car_management/dto/request/UpdateCustomerRequest.java`
  - DTO cho update hồ sơ theo dạng tổng (`PUT /profile`).

- `BE/src/main/java/com/example/car_management/dto/request/UpdateMyBasicInfoRequest.java`
  - DTO cập nhật thông tin cơ bản (`PATCH /profile/basic-info`).

- `BE/src/main/java/com/example/car_management/dto/request/UpdateMyPhoneRequest.java`
  - DTO cập nhật số điện thoại (`PATCH /profile/phone`).

- `BE/src/main/java/com/example/car_management/dto/request/ChangePasswordRequest.java`
  - DTO đổi mật khẩu (`PUT /profile/password`).

- `BE/src/main/java/com/example/car_management/dto/response/CustomerResponse.java`
  - DTO trả về thông tin hồ sơ khách hàng (bao gồm cả các trường GPLX & thống kê booking).

- `BE/src/main/java/com/example/car_management/entity/UserEntity.java`
  - Entity bảng `users`: lưu thông tin user (fullName, email, phone, avatar, address, password, role, …).

- `BE/src/main/java/com/example/car_management/service/cloud/CloudinaryService.java`
  - Dịch vụ upload file (avatar) lên Cloudinary và trả về URL.

### Frontend (FE)

- `FE/src/pages/user/CustomerProfile.jsx`
  - Trang tổng hợp hồ sơ khách hàng:
    - quản lý state (profile, favorites, bookings, modal)
    - gọi API cập nhật hồ sơ / avatar / OTP / GPLX / favorites / bookings
    - render các section theo menu.

- `FE/src/components/user/customer-profile/Sidebar.jsx`
  - Menu điều hướng trong trang hồ sơ (Dashboard, Tài khoản, Mật khẩu, Yêu thích, Chuyến đi).

- `FE/src/components/user/customer-profile/DashboardSection.jsx`
  - Hiển thị thông tin tổng quan (thống kê nhanh từ profile).

- `FE/src/components/user/customer-profile/AccountSection.jsx`
  - Hiển thị thông tin tài khoản và các modal chỉnh sửa:
    - basic info
    - phone
    - avatar
    - GPLX (license modal).

- `FE/src/components/user/customer-profile/PasswordSection.jsx`
  - Form đổi mật khẩu.

- `FE/src/api/customers.js`
  - Wrapper gọi API liên quan customer:
    - `getMyCustomerProfile`
    - `updateMyCustomerProfile`, `updateMyCustomerBasicInfo`, `updateMyCustomerPhone`
    - `changeMyCustomerPassword`
    - `uploadMyCustomerAvatar`
    - `sendEmailOtpForProfileUpdate`, `verifyEmailOtpForProfileUpdate`
    - (có cả API favorites và GPLX — xem các mục bên dưới).

- `FE/src/utils/customerProfile/constants.js`
  - Định nghĩa menu, tab, và `EMPTY_PROFILE_FORM` cho trang hồ sơ.

- `FE/src/utils/customerProfile/utils.js`
  - Hàm tiện ích cho trang hồ sơ (format date, className theo status, …).

- `FE/src/styles/customer-profile/Layout.css`
  - CSS layout tổng.

- `FE/src/styles/customer-profile/Dashboard.css`
  - CSS dashboard section.

- `FE/src/styles/customer-profile/Account.css`
  - CSS account section (avatar, thông tin, modal, …).

---

## 2) Xác minh bằng lái xe (GPLX verification)

### Backend (BE)

- `BE/src/main/java/com/example/car_management/controller/CustomerController.java`
  - API liên quan GPLX:
    - `PATCH /api/v1/customers/profile/license-info`: user cập nhật thông tin GPLX
    - `POST /api/v1/customers/profile/license-ocr`: user upload ảnh để OCR GPLX
    - `PATCH /api/v1/customers/{id}/license-verification`: admin duyệt GPLX (APPROVED/REJECTED)

- `BE/src/main/java/com/example/car_management/service/CustomerService.java`
  - Logic GPLX:
    - `scanMyLicenseWithOcr`: gọi OCR (FPT) và tạo `LicenseOcrResponse`
    - `updateMyLicenseInfo`: cập nhật thông tin GPLX user, thường set trạng thái về `PENDING`
    - `reviewCustomerLicenseVerification`: admin duyệt hồ sơ GPLX PENDING → APPROVED/REJECTED, yêu cầu note khi REJECTED, set `verifiedAt` khi APPROVED.

- `BE/src/main/java/com/example/car_management/entity/CustomerLicenseEntity.java`
  - Entity bảng `customer_licenses`: thông tin GPLX + trạng thái xác minh.

- `BE/src/main/java/com/example/car_management/entity/enums/LicenseVerificationStatus.java`
  - Enum trạng thái: `PENDING`, `APPROVED`, `REJECTED`.

- `BE/src/main/java/com/example/car_management/dto/request/UpdateCustomerLicenseVerificationRequest.java`
  - DTO admin duyệt GPLX: `status`, `note`.

- `BE/src/main/java/com/example/car_management/dto/response/LicenseOcrResponse.java`
  - DTO trả về dữ liệu OCR (số GPLX, họ tên, ngày sinh, địa chỉ, hạng, ngày hết hạn, …).

### Frontend (FE)

- `FE/src/pages/user/CustomerProfile.jsx`
  - Quản lý state và handler của license modal:
    - mở/đóng modal
    - upload ảnh OCR (`scanMyCustomerLicenseOcr`)
    - submit cập nhật GPLX (`updateMyCustomerLicenseInfo`).

- `FE/src/components/user/customer-profile/AccountSection.jsx`
  - UI thẻ GPLX:
    - hiển thị trạng thái duyệt (PENDING/APPROVED/REJECTED), note từ admin, thời gian verified
    - modal chỉnh sửa GPLX + nút OCR.

- `FE/src/pages/admin/AdminCustomerLicenseReview.jsx`
  - UI admin duyệt GPLX:
    - tải danh sách/chi tiết khách hàng
    - gửi quyết định APPROVED/REJECTED kèm note.

- `FE/src/api/customers.js`
  - API GPLX:
    - `updateMyCustomerLicenseInfo`
    - `scanMyCustomerLicenseOcr`
    - `updateCustomerLicenseVerification` (admin).

- `FE/src/styles/customer-profile/Account.css`
  - CSS cho phần GPLX và modal GPLX.

- `FE/src/styles/AdminCustomerLicenseReview.css`
  - CSS trang admin duyệt GPLX.

---

## 3) Wishlist (Xe yêu thích / favorites)

### Backend (BE)

- `BE/src/main/java/com/example/car_management/controller/CustomerController.java`
  - API favorites:
    - `GET /api/v1/customers/profile/favorites`
    - `POST /api/v1/customers/profile/favorites/{vehicleId}`
    - `DELETE /api/v1/customers/profile/favorites/{vehicleId}`

- `BE/src/main/java/com/example/car_management/service/CustomerService.java`
  - Logic favorites:
    - `listMyFavorites`: lấy danh sách xe yêu thích theo user
    - `addFavorite`: thêm vehicle vào danh sách yêu thích (nếu chưa có)
    - `removeFavorite`: xóa vehicle khỏi danh sách yêu thích.

- `BE/src/main/java/com/example/car_management/entity/UserEntity.java`
  - Lưu relation favorites bằng `@ManyToMany` qua bảng `customer_favorites`.

### Frontend (FE)

- `FE/src/pages/user/CustomerProfile.jsx`
  - Fetch favorites khi load profile và xử lý xóa favorites (`removeMyFavoriteVehicle`).

- `FE/src/components/user/customer-profile/FavoritesSection.jsx`
  - UI liệt kê xe yêu thích, nút “Xóa”, link sang chi tiết xe.

- `FE/src/api/customers.js`
  - API favorites:
    - `getMyFavoriteVehicles`, `addMyFavoriteVehicle`, `removeMyFavoriteVehicle`.

- `FE/src/pages/public/CarDetails.jsx`
  - Nút thêm/bỏ xe khỏi favorites trên trang chi tiết xe (gọi API favorites).

- `FE/src/styles/customer-profile/FavoritesTrips.css`
  - CSS cho phần favorites (và trips).

---

## 4) Lịch sử thuê xe (Booking history / trips)

### Backend (BE)

- `BE/src/main/java/com/example/car_management/controller/BookingController.java`
  - API booking cho user:
    - `GET /api/v1/bookings`: lấy danh sách booking của user hiện tại (renter hoặc owner)
    - `PATCH /api/v1/bookings/{id}/status`: cập nhật trạng thái booking (owner/flow)
    - `GET /api/v1/bookings/{id}`: xem chi tiết booking
    - `GET /api/v1/bookings/vehicle/{vehicleId}/booked-dates`: ngày đã book theo xe
    - `GET /api/v1/bookings/owner/calendar`: calendar cho owner.

- `BE/src/main/java/com/example/car_management/service/BookingService.java`
  - Logic:
    - `getUserBookings`: lấy danh sách booking theo userId hiện tại.

- `BE/src/main/java/com/example/car_management/repository/BookingRepository.java`
  - Query:
    - `findByRenterIdOrOwnerId`: fetch booking theo renterId hoặc ownerId (kèm fetch-join vehicle/model/brand/images).

- `BE/src/main/java/com/example/car_management/entity/BookingEntity.java`
  - Entity booking: vehicle, customer, owner, status, start/end date, totalPrice, …

- `BE/src/main/java/com/example/car_management/dto/response/BookingResponse.java`
  - DTO booking trả về FE.

- `BE/src/main/java/com/example/car_management/mapper/BookingMapper.java`
  - Map `BookingEntity` → `BookingResponse`.

### Frontend (FE)

- `FE/src/pages/user/CustomerProfile.jsx`
  - Lấy bookings và tách:
    - “Hiện tại” theo `CURRENT_TRIP_STATUS`
    - “Lịch sử” theo `SUCCESS_TRIP_STATUS`
  - render qua `TripsSection`.

- `FE/src/components/user/customer-profile/TripsSection.jsx`
  - UI trips: tab “Hiện tại / Lịch sử” và list chuyến đi.

- `FE/src/pages/user/MyBookings.jsx`
  - Trang riêng danh sách booking: hiển thị list, hỗ trợ hủy booking, mở modal chat/trả xe.

- `FE/src/api/bookings.js`
  - Wrapper booking API:
    - `getMyBookings`
    - `updateBookingStatus`
    - `cancelBooking`.

- `FE/src/utils/customerProfile/constants.js`
  - `CURRENT_TRIP_STATUS`, `SUCCESS_TRIP_STATUS`, `TRIP_TAB`.

- `FE/src/utils/bookingUtils.js`
  - Tiện ích hiển thị booking (format tiền, label trạng thái).

- `FE/src/styles/customer-profile/FavoritesTrips.css`
  - CSS phần trips trong profile.

- `FE/src/styles/MyBookings.css`
  - CSS trang MyBookings.

