import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/MyBookings.css'; // Reuse styles for consistent look

function PaymentCancel() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
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
            <div className="empty-state" style={{ padding: '60px', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                <div className="empty-icon" style={{ animation: 'none', color: '#ef4444' }}>❌</div>
                <h2 style={{ color: '#f1f5f9', marginBottom: '16px' }}>Thanh toán bị hủy</h2>
                <p>Giao dịch thanh toán cho đơn hàng #{id} đã bị hủy hoặc không thành công.</p>
                <p>Vui lòng thử lại sau hoặc chọn phương thức khác.</p>

                <div style={{ marginTop: '32px' }}>
                    <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Đang chuyển hướng về trang quản lý đặt xe trong {countdown} giây...</p>
                    <button
                        className="btn-browse"
                        style={{ marginTop: '16px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
                        onClick={() => navigate('/my-bookings')}
                    >
                        Trở lại Đặt xe của tôi
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PaymentCancel;
