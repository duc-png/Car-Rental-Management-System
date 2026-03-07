export const BOOKING_STATUS_LABELS = {
    PENDING: 'Chờ duyệt',
    CONFIRMED: 'Đã duyệt',
    ONGOING: 'Đang thuê',
    COMPLETED: 'Hoàn tất',
    CANCELLED: 'Đã huỷ',
}

export const getBookingStatusLabel = (status) => BOOKING_STATUS_LABELS[status] || status

export const formatVndCurrency = (amount) => {
    const value = Number(amount || 0)
    return `${Math.round(value).toLocaleString('vi-VN')} VNĐ`
}
