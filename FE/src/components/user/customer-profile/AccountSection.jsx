import { useEffect, useRef } from 'react'
import { BadgeCheck, CarFront, Pencil, X } from 'lucide-react'

export default function AccountSection({
    formData,
    emailVerified,
    successTripsCount,
    birthDateLabel,
    licenseBirthDateLabel,
    genderLabel,
    joinedDateLabel,
    phoneVerified,
    avatarUploading,
    previewAvatar,
    isAvatarModalOpen,
    avatarModalPreview,
    isInfoModalOpen,
    infoModalForm,
    isPhoneModalOpen,
    phoneModalValue,
    isLicenseModalOpen,
    licenseModalForm,
    licenseModalPreview,
    licenseOcrScanning,
    isEmailModalOpen,
    emailModalForm,
    avatarZoom = 1,
    avatarPosition = { x: 50, y: 50 },
    avatarInputRef,
    onOpenInfoModal,
    onCloseInfoModal,
    onInfoModalChange,
    onInfoModalSubmit,
    onOpenPhoneModal,
    onClosePhoneModal,
    onPhoneModalChange,
    onPhoneModalSubmit,
    onOpenLicenseModal,
    onCloseLicenseModal,
    onLicenseModalChange,
    onLicenseModalSubmit,
    onOpenLicenseOcrPicker,
    onLicenseOcrFileChange,
    onOpenEmailModal,
    onCloseEmailModal,
    onEmailModalChange,
    onSendEmailOtp,
    onVerifyEmailOtp,
    onOpenAvatarModal,
    onCloseAvatarModal,
    onOpenAvatarPicker,
    onAvatarFileChange,
    onAvatarZoomChange = () => { },
    onAvatarPositionChange = () => { },
    onAvatarUpdate,
    saving,
    phoneSaving,
    licenseOcrInputRef,
    emailOtpSending,
    emailVerifying,
    error
}) {
    const zoomRef = useRef(avatarZoom)
    const positionRef = useRef(avatarPosition)
    const onAvatarZoomChangeRef = useRef(onAvatarZoomChange)
    const onAvatarPositionChangeRef = useRef(onAvatarPositionChange)

    const dragStateRef = useRef({
        dragging: false,
        pinching: false,
        pinchStartDistance: 0,
        pinchStartZoom: 1,
        startClientX: 0,
        startClientY: 0,
        startX: 50,
        startY: 50,
        width: 1,
        height: 1
    })

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
    const getTouchDistance = (touchA, touchB) => {
        const dx = touchA.clientX - touchB.clientX
        const dy = touchA.clientY - touchB.clientY
        return Math.hypot(dx, dy)
    }

    useEffect(() => {
        zoomRef.current = avatarZoom
        positionRef.current = avatarPosition
        onAvatarZoomChangeRef.current = onAvatarZoomChange
        onAvatarPositionChangeRef.current = onAvatarPositionChange
    }, [avatarZoom, avatarPosition, onAvatarZoomChange, onAvatarPositionChange])

    const updatePositionByClient = (clientX, clientY) => {
        if (!dragStateRef.current.dragging) return

        const deltaX = clientX - dragStateRef.current.startClientX
        const deltaY = clientY - dragStateRef.current.startClientY
        const zoom = Math.max(zoomRef.current || 1, 1)

        const moveX = (deltaX / dragStateRef.current.width) * (100 / zoom)
        const moveY = (deltaY / dragStateRef.current.height) * (100 / zoom)

        onAvatarPositionChangeRef.current({
            x: clamp(dragStateRef.current.startX - moveX, 0, 100),
            y: clamp(dragStateRef.current.startY - moveY, 0, 100)
        })
    }

    const stopDragging = () => {
        dragStateRef.current.dragging = false
        dragStateRef.current.pinching = false
    }

    const startDragging = (clientX, clientY, rect) => {
        const currentPosition = positionRef.current || { x: 50, y: 50 }
        dragStateRef.current = {
            dragging: true,
            startClientX: clientX,
            startClientY: clientY,
            startX: currentPosition.x,
            startY: currentPosition.y,
            width: rect.width || 1,
            height: rect.height || 1
        }
    }

    const handlePreviewMouseDown = (event) => {
        if (!avatarModalPreview) return
        startDragging(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect())
        event.preventDefault()
    }

    const handlePreviewWheel = (event) => {
        if (!avatarModalPreview) return
        event.preventDefault()
        const nextZoom = clamp((zoomRef.current || 1) + (event.deltaY < 0 ? 0.06 : -0.06), 1, 2.5)
        onAvatarZoomChangeRef.current(nextZoom)
    }

    const handlePreviewTouchStart = (event) => {
        if (!avatarModalPreview) return
        if (event.touches?.length >= 2) {
            const [touchA, touchB] = event.touches
            const rect = event.currentTarget.getBoundingClientRect()
            dragStateRef.current = {
                ...dragStateRef.current,
                pinching: true,
                dragging: false,
                pinchStartDistance: getTouchDistance(touchA, touchB),
                pinchStartZoom: zoomRef.current || 1,
                width: rect.width || 1,
                height: rect.height || 1
            }
            return
        }

        const touch = event.touches?.[0]
        if (!touch) return
        startDragging(touch.clientX, touch.clientY, event.currentTarget.getBoundingClientRect())
    }

    useEffect(() => {
        const handleMouseMove = (event) => {
            if (!dragStateRef.current.dragging) return
            event.preventDefault()
            updatePositionByClient(event.clientX, event.clientY)
        }

        const handleMouseUp = () => {
            stopDragging()
        }

        const handleTouchMove = (event) => {
            if (dragStateRef.current.pinching && event.touches?.length >= 2) {
                const [touchA, touchB] = event.touches
                const distance = getTouchDistance(touchA, touchB)
                if (dragStateRef.current.pinchStartDistance > 0) {
                    const ratio = distance / dragStateRef.current.pinchStartDistance
                    const nextZoom = clamp(dragStateRef.current.pinchStartZoom * ratio, 1, 2.5)
                    onAvatarZoomChangeRef.current(nextZoom)
                }
                event.preventDefault()
                return
            }

            if (!dragStateRef.current.dragging) return
            const touch = event.touches?.[0]
            if (!touch) return
            event.preventDefault()
            updatePositionByClient(touch.clientX, touch.clientY)
        }

        const handleTouchEnd = (event) => {
            if (event.touches?.length >= 2) {
                const [touchA, touchB] = event.touches
                dragStateRef.current.pinchStartDistance = getTouchDistance(touchA, touchB)
                dragStateRef.current.pinchStartZoom = zoomRef.current || 1
                dragStateRef.current.pinching = true
                dragStateRef.current.dragging = false
                return
            }

            if (event.touches?.length === 1) {
                const touch = event.touches[0]
                dragStateRef.current.pinching = false
                dragStateRef.current.dragging = true
                dragStateRef.current.startClientX = touch.clientX
                dragStateRef.current.startClientY = touch.clientY
                dragStateRef.current.startX = (positionRef.current?.x ?? 50)
                dragStateRef.current.startY = (positionRef.current?.y ?? 50)
                return
            }

            stopDragging()
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        window.addEventListener('touchmove', handleTouchMove, { passive: false })
        window.addEventListener('touchend', handleTouchEnd)
        window.addEventListener('touchcancel', handleTouchEnd)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
            window.removeEventListener('touchmove', handleTouchMove)
            window.removeEventListener('touchend', handleTouchEnd)
            window.removeEventListener('touchcancel', handleTouchEnd)
        }
    }, [])

    useEffect(() => {
        if (!isAvatarModalOpen) {
            stopDragging()
        }
    }, [isAvatarModalOpen])

    const licenseStatus = String(formData.licenseVerificationStatus || '').trim().toUpperCase()
    const isLicenseApproved = licenseStatus === 'APPROVED'
    const displayedLicenseNumber = isLicenseApproved ? String(formData.licenseNumber || '').trim() : ''
    const displayedLicenseFullName = isLicenseApproved ? String(formData.licenseFullName || '').trim() : ''
    const displayedLicenseBirthDate = isLicenseApproved ? licenseBirthDateLabel : '--/--/----'
    const displayedLicensePreview = isLicenseApproved ? String(formData.licenseImagePreview || '').trim() : ''
    const licenseStatusText =
        licenseStatus === 'APPROVED'
            ? 'Đã duyệt'
            : licenseStatus === 'REJECTED'
                ? 'Đã từ chối'
                : licenseStatus === 'PENDING'
                    ? 'Đang chờ duyệt'
                    : 'Chưa xác thực'
    const licenseStatusClass =
        licenseStatus === 'APPROVED'
            ? 'done'
            : licenseStatus === 'REJECTED'
                ? 'rejected'
                : licenseStatus === 'PENDING'
                    ? 'pending'
                    : ''

    return (
        <>
            <section className="customer-profile-card">
                <div className="account-header-row">
                    <div className="account-title-wrap">
                        <h3>Thông tin tài khoản</h3>
                        <button
                            type="button"
                            className="account-edit-btn"
                            onClick={onOpenInfoModal}
                            aria-label="Chỉnh sửa thông tin"
                            title="Chỉnh sửa thông tin"
                        >
                            <Pencil size={14} />
                        </button>
                    </div>
                    <div className="account-trip-badge">
                        <CarFront size={18} />
                        <b>{successTripsCount}</b>
                        <span>chuyến</span>
                    </div>
                </div>

                <div className="account-layout-grid">
                    <div className="account-left-panel">
                        <div className="account-avatar-wrap">
                            <div
                                className="customer-profile-avatar large clickable"
                                onClick={onOpenAvatarModal}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault()
                                        onOpenAvatarModal()
                                    }
                                }}
                                title="Bấm để cập nhật ảnh đại diện"
                            >
                                {previewAvatar
                                    ? <img src={previewAvatar} alt={formData.fullName || 'Avatar'} />
                                    : (formData.fullName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                onChange={onAvatarFileChange}
                                className="account-avatar-input-hidden"
                            />
                        </div>
                        <strong>{formData.fullName || 'Người dùng'}</strong>
                        <p>Tham gia: {joinedDateLabel}</p>
                        <span className="account-point-pill">0 điểm</span>
                    </div>

                    <div className="account-right-panel">
                        <div className="account-summary-box">
                            <div>
                                <span>Ngày sinh</span>
                                <b>{birthDateLabel || '--/--/----'}</b>
                            </div>
                            <div>
                                <span>Giới tính</span>
                                <b>{genderLabel || 'Nam'}</b>
                            </div>
                        </div>

                        <div className="account-field-row">
                            <label>
                                Số điện thoại
                                <span className={`account-verified ${phoneVerified ? '' : 'unverified'}`}>
                                    <BadgeCheck size={12} />
                                    {phoneVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                                </span>
                            </label>
                            <div className="account-field-value-wrap">
                                <strong>{formData.phone || 'Chưa cập nhật'}</strong>
                                <button
                                    type="button"
                                    className="account-inline-edit"
                                    onClick={onOpenPhoneModal}
                                    aria-label="Chỉnh sửa số điện thoại"
                                    title="Chỉnh sửa số điện thoại"
                                >
                                    <Pencil size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="account-field-row">
                            <label>
                                Email
                                <span className={`account-verified ${emailVerified ? '' : 'unverified'}`}>
                                    <BadgeCheck size={12} />
                                    {emailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                                </span>
                            </label>
                            <div className="account-field-value-wrap">
                                <strong>{formData.email || 'Chưa cập nhật'}</strong>
                                <button
                                    type="button"
                                    className="account-inline-edit"
                                    onClick={onOpenEmailModal}
                                    aria-label="Chỉnh sửa email"
                                    title="Chỉnh sửa email"
                                >
                                    <Pencil size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="account-field-row">
                            <label>Họ và tên</label>
                            <strong>{formData.fullName || 'Chưa cập nhật'}</strong>
                        </div>

                        <div className="account-field-row">
                            <label>Số GPLX</label>
                            <strong>{displayedLicenseNumber || (licenseStatus === 'PENDING' ? 'Đang chờ duyệt' : 'Chưa xác thực')}</strong>
                        </div>

                        <div className="account-field-row">
                            <label>Địa chỉ</label>
                            <strong>{formData.address || 'Chưa cập nhật'}</strong>
                        </div>
                    </div>
                </div>

                {error ? <p className="customer-profile-error">{error}</p> : null}
            </section>

            <section className="driver-license-card">
                <div className="driver-license-header">
                    <div className="driver-license-title-wrap">
                        <h3>Giấy phép lái xe</h3>
                        <span className={`driver-license-status ${licenseStatusClass}`}>
                            {licenseStatusText}
                        </span>
                    </div>
                    <button type="button" className="driver-license-edit-btn" onClick={onOpenLicenseModal}>
                        <span>Chỉnh sửa</span>
                        <Pencil size={14} />
                    </button>
                </div>

                <p className="driver-license-note warning">
                    Khách thuê cần xác thực GPLX chính chủ để hoàn tất hồ sơ nhận xe.
                </p>

                <p className="driver-license-note success">
                    Ảnh chụp cần thấy rõ ảnh đại diện và số GPLX để hệ thống đối chiếu.
                </p>

                {licenseStatus === 'REJECTED' && String(formData.licenseVerificationNote || '').trim() ? (
                    <p className="driver-license-note rejected">
                        Lý do từ chối: {formData.licenseVerificationNote}
                    </p>
                ) : null}

                {licenseStatus === 'APPROVED' && formData.licenseVerifiedAt ? (
                    <p className="driver-license-note approved-time">
                        Đã duyệt lúc: {new Date(formData.licenseVerifiedAt).toLocaleString('vi-VN')}
                    </p>
                ) : null}

                <div className="driver-license-layout">
                    <div className="driver-license-upload-box">
                        <h4>Ảnh mặt trước GPLX</h4>
                        {displayedLicensePreview ? (
                            <img className="driver-license-preview" src={displayedLicensePreview} alt="Ảnh GPLX" />
                        ) : (
                            <div className="driver-license-upload-placeholder">Chưa có ảnh GPLX đã duyệt</div>
                        )}
                    </div>

                    <div className="driver-license-info">
                        <h4>Thông tin chung</h4>

                        <label>
                            Số GPLX
                            <input type="text" value={displayedLicenseNumber} readOnly placeholder="Chỉ hiển thị sau khi duyệt" />
                        </label>

                        <label>
                            Họ và tên trên GPLX
                            <input type="text" value={displayedLicenseFullName} readOnly placeholder="Chỉ hiển thị sau khi duyệt" />
                        </label>

                        <label>
                            Ngày sinh
                            <input type="text" value={displayedLicenseBirthDate} readOnly />
                        </label>
                    </div>
                </div>
            </section>

            {isInfoModalOpen ? (
                <div className="avatar-modal-overlay" role="dialog" aria-modal="true" aria-label="Cập nhật thông tin" onClick={onCloseInfoModal}>
                    <form className="account-info-modal-card" onSubmit={onInfoModalSubmit} onClick={(event) => event.stopPropagation()}>
                        <button
                            type="button"
                            className="avatar-modal-close"
                            onClick={onCloseInfoModal}
                            disabled={saving}
                            aria-label="Đóng"
                        >
                            <X size={16} />
                        </button>
                        <h3>Cập nhật thông tin</h3>

                        <label className="account-info-field">
                            <span>Tên tài khoản</span>
                            <input
                                name="fullName"
                                type="text"
                                value={infoModalForm?.fullName || ''}
                                onChange={onInfoModalChange}
                                required
                            />
                        </label>

                        <label className="account-info-field">
                            <span>Ngày sinh</span>
                            <input
                                name="birthDate"
                                type="date"
                                value={infoModalForm?.birthDate || ''}
                                onChange={onInfoModalChange}
                            />
                        </label>

                        <label className="account-info-field">
                            <span>Giới tính</span>
                            <select name="gender" value={infoModalForm?.gender || 'Nam'} onChange={onInfoModalChange}>
                                <option value="Nam">Nam</option>
                                <option value="Nu">Nữ</option>
                                <option value="Khac">Khác</option>
                            </select>
                        </label>

                        <button type="submit" className="avatar-modal-submit" disabled={saving}>
                            {saving ? 'Đang cập nhật...' : 'Cập nhật'}
                        </button>
                    </form>
                </div>
            ) : null}

            {isPhoneModalOpen ? (
                <div className="avatar-modal-overlay" role="dialog" aria-modal="true" aria-label="Cập nhật số điện thoại" onClick={onClosePhoneModal}>
                    <form className="account-info-modal-card" onSubmit={onPhoneModalSubmit} onClick={(event) => event.stopPropagation()}>
                        <button type="button" className="avatar-modal-close" onClick={onClosePhoneModal} disabled={phoneSaving} aria-label="Đóng">
                            <X size={16} />
                        </button>
                        <h3>Cập nhật số điện thoại</h3>

                        <label className="account-info-field">
                            <span>Số điện thoại</span>
                            <input
                                name="phone"
                                type="text"
                                value={phoneModalValue || ''}
                                onChange={(event) => onPhoneModalChange(event.target.value)}
                                required
                            />
                        </label>

                        <button type="submit" className="avatar-modal-submit" disabled={phoneSaving}>
                            {phoneSaving ? 'Đang cập nhật...' : 'Cập nhật'}
                        </button>
                    </form>
                </div>
            ) : null}

            {isLicenseModalOpen ? (
                <div className="avatar-modal-overlay" role="dialog" aria-modal="true" aria-label="Cập nhật thông tin GPLX">
                    <form className="account-info-modal-card license-modal-card" onSubmit={onLicenseModalSubmit} onClick={(event) => event.stopPropagation()}>
                        <button type="button" className="avatar-modal-close" onClick={onCloseLicenseModal} disabled={saving || licenseOcrScanning} aria-label="Đóng">
                            <X size={16} />
                        </button>
                        <h3>Cập nhật thông tin GPLX</h3>

                        <input
                            ref={licenseOcrInputRef}
                            type="file"
                            accept="image/*"
                            onChange={onLicenseOcrFileChange}
                            className="account-avatar-input-hidden"
                        />

                        <div className="license-modal-grid">
                            <div className="license-modal-left">
                                <div className="license-modal-preview-shell">
                                    {licenseModalPreview ? (
                                        <img className="driver-license-preview" src={licenseModalPreview} alt="Xem trước GPLX" />
                                    ) : (
                                        <div className="driver-license-upload-placeholder">Chọn ảnh GPLX để xem trước</div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    className="driver-license-ocr-btn license-modal-ocr-btn"
                                    onClick={onOpenLicenseOcrPicker}
                                    disabled={saving || licenseOcrScanning}
                                >
                                    {licenseOcrScanning ? 'Đang quét OCR...' : 'Chọn ảnh và quét OCR'}
                                </button>
                            </div>

                            <div className="license-modal-right">
                                <label className="account-info-field">
                                    <span>Số GPLX</span>
                                    <input
                                        name="licenseNumber"
                                        type="text"
                                        value={licenseModalForm?.licenseNumber || ''}
                                        onChange={onLicenseModalChange}
                                        placeholder="Nhập số GPLX đã cấp"
                                    />
                                </label>

                                <label className="account-info-field">
                                    <span>Họ và tên</span>
                                    <input
                                        name="licenseFullName"
                                        type="text"
                                        value={licenseModalForm?.licenseFullName || ''}
                                        onChange={onLicenseModalChange}
                                        placeholder="Nhập đầy đủ họ tên trên GPLX"
                                        required
                                    />
                                </label>

                                <label className="account-info-field">
                                    <span>Ngày sinh</span>
                                    <input
                                        name="birthDate"
                                        type="date"
                                        value={licenseModalForm?.birthDate || ''}
                                        onChange={onLicenseModalChange}
                                    />
                                </label>

                                <label className="account-info-field">
                                    <span>Ngày cấp</span>
                                    <input
                                        name="issueDate"
                                        type="date"
                                        value={licenseModalForm?.issueDate || ''}
                                        onChange={onLicenseModalChange}
                                    />
                                </label>

                                <label className="account-info-field">
                                    <span>Hạng xe</span>
                                    <input
                                        name="licenseClass"
                                        type="text"
                                        value={licenseModalForm?.licenseClass || ''}
                                        onChange={onLicenseModalChange}
                                        placeholder="Ví dụ: A1, B1, B2, C"
                                    />
                                </label>

                                <label className="account-info-field">
                                    <span>Ngày hết hạn</span>
                                    <input
                                        name="expiryDate"
                                        type="date"
                                        value={licenseModalForm?.expiryDate || ''}
                                        onChange={onLicenseModalChange}
                                    />
                                </label>

                                <p className="license-modal-note">
                                    Vui lòng kiểm tra lại thông tin sau khi quét OCR để đảm bảo tính chính xác.
                                </p>
                            </div>
                        </div>

                        <div className="license-modal-actions">
                            <button type="button" className="avatar-modal-select" onClick={onCloseLicenseModal} disabled={saving || licenseOcrScanning}>
                                Hủy
                            </button>
                            <button type="submit" className="avatar-modal-submit" disabled={saving || licenseOcrScanning}>
                                {saving ? 'Đang cập nhật...' : 'Cập nhật'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {isEmailModalOpen ? (
                <div className="avatar-modal-overlay" role="dialog" aria-modal="true" aria-label="Cập nhật email" onClick={onCloseEmailModal}>
                    <div className="account-info-modal-card" onClick={(event) => event.stopPropagation()}>
                        <button type="button" className="avatar-modal-close" onClick={onCloseEmailModal} disabled={emailOtpSending || emailVerifying} aria-label="Đóng">
                            <X size={16} />
                        </button>
                        <h3>Cập nhật email</h3>

                        <form onSubmit={onSendEmailOtp}>
                            <label className="account-info-field">
                                <span>Email mới</span>
                                <input
                                    name="newEmail"
                                    type="email"
                                    value={emailModalForm?.newEmail || ''}
                                    onChange={onEmailModalChange}
                                    required
                                />
                            </label>

                            <button type="submit" className="avatar-modal-submit" disabled={emailOtpSending || emailVerifying}>
                                {emailOtpSending ? 'Đang gửi OTP...' : 'Gửi OTP'}
                            </button>
                        </form>

                        {emailModalForm?.otpSent ? (
                            <form className="account-email-otp-form" onSubmit={onVerifyEmailOtp}>
                                <label className="account-info-field">
                                    <span>Mã OTP đã gửi qua email</span>
                                    <input
                                        name="otp"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={emailModalForm?.otp || ''}
                                        onChange={onEmailModalChange}
                                        required
                                    />
                                </label>
                                <button type="submit" className="avatar-modal-submit" disabled={emailVerifying || emailOtpSending}>
                                    {emailVerifying ? 'Đang xác minh...' : 'Xác minh và cập nhật'}
                                </button>
                            </form>
                        ) : null}
                    </div>
                </div>
            ) : null}

            {isAvatarModalOpen ? (
                <div
                    className="avatar-modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Cập nhật ảnh đại diện"
                    onClick={onCloseAvatarModal}
                >
                    <div className="avatar-modal-card" onClick={(event) => event.stopPropagation()}>
                        <button
                            type="button"
                            className="avatar-modal-close"
                            onClick={onCloseAvatarModal}
                            disabled={avatarUploading}
                            aria-label="Đóng"
                        >
                            <X size={16} />
                        </button>
                        <h3>Cập nhật ảnh đại diện</h3>

                        <button
                            type="button"
                            className="avatar-modal-select"
                            onClick={onOpenAvatarPicker}
                            disabled={avatarUploading}
                        >
                            CHỌN HÌNH
                        </button>

                        {avatarModalPreview ? (
                            <div
                                className="avatar-modal-preview-wrap"
                                onMouseDown={handlePreviewMouseDown}
                                onTouchStart={handlePreviewTouchStart}
                                onWheel={handlePreviewWheel}
                            >
                                <img
                                    src={avatarModalPreview}
                                    alt="Xem trước ảnh đại diện"
                                    className="avatar-modal-preview"
                                    draggable={false}
                                    onDragStart={(event) => event.preventDefault()}
                                    style={{
                                        objectPosition: `${avatarPosition.x}% ${avatarPosition.y}%`,
                                        transform: `scale(${avatarZoom})`
                                    }}
                                />
                                <div className="avatar-modal-grid" aria-hidden="true" />
                            </div>
                        ) : null}

                        {avatarModalPreview ? (
                            <p className="avatar-modal-hint">Kéo để di chuyển, lăn chuột hoặc pinch 2 ngón để thu phóng.</p>
                        ) : null}

                        {avatarModalPreview ? (
                            <button
                                type="button"
                                className="avatar-modal-submit"
                                onClick={onAvatarUpdate}
                                disabled={avatarUploading}
                            >
                                {avatarUploading ? 'Đang cập nhật...' : 'Cập nhật'}
                            </button>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </>
    )
}
