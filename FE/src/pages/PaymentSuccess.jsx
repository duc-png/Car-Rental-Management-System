import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/MyBookings.css'; // Reuse styles for consistent look

function PaymentSuccess() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        // Optional: could call backend to check payment status just to be sure,
        // but webhook should handle it.

        // Auto redirect
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate('/my-bookings');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    return (
        <div className="bookings-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            <div className="empty-state" style={{ padding: '60px' }}>
                <div className="empty-icon" style={{ animation: 'none', color: '#10b981' }}>✅</div>
                <h2 style={{ color: '#f1f5f9', marginBottom: '16px' }}>Thanh toán thành công!</h2>
                <p>Cảm ơn bạn đã thanh toán cho chuyến đi #{id}.</p>
                <p>Hệ thống đang cập nhật trạng thái đơn hàng của bạn.</p>

                <div style={{ marginTop: '32px' }}>
                    <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Đang chuyển hướng về trang quản lý đặt xe trong {countdown} giây...</p>
                    <button
                        className="btn-browse"
                        style={{ marginTop: '16px' }}
                        onClick={() => navigate('/my-bookings')}
                    >
                        Về trang Đặt xe của tôi ngay
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PaymentSuccess;
