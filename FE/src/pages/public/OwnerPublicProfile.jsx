import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOwnerPublicProfile } from '../../api/owners';
import '../../styles/OwnerPublicProfile.css';

const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return `${amount.toLocaleString('vi-VN')} ₫/ngày`;
};

const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('vi-VN');
};

function OwnerPublicProfile() {
    const { ownerId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const data = await getOwnerPublicProfile(ownerId);
                if (!data) {
                    setError('Không tìm thấy thông tin chủ xe.');
                    setProfile(null);
                    return;
                }
                setProfile(data);
                setError('');
                // eslint-disable-next-line no-unused-vars
            } catch (e) {
                setError('Không tải được thông tin chủ xe.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [ownerId]);

    const owner = profile?.owner || null;
    const vehicles = profile?.vehicles || [];
    const receivedReviews = profile?.receivedReviews || [];

    const ownerDisplayName = useMemo(() => {
        if (!owner?.fullName) return 'Chưa cập nhật';
        return owner.fullName;
    }, [owner]);

    if (loading) {
        return <div className="owner-public-loading">Đang tải trang chủ xe...</div>;
    }

    if (error) {
        return <div className="owner-public-error">{error}</div>;
    }

    return (
        <div className="owner-public-page">
            <div className="owner-public-shell">
                <div className="owner-public-topbar">
                    <Link to="/cars" className="owner-public-back">← Quay lại danh sách xe</Link>
                </div>

                <section className="owner-public-card">
                    <div className="owner-public-header">
                        <h2>Thông tin tài khoản</h2>
                        <span className="owner-trip-badge">{owner?.totalTrips || 0} chuyến</span>
                    </div>

                    <div className="owner-public-main">
                        <div className="owner-public-identity">
                            <div className="owner-public-avatar">{(ownerDisplayName || 'A').charAt(0).toUpperCase()}</div>
                            <div>
                                <h3>{ownerDisplayName}</h3>
                                {/* <p>{owner?.isVerified ? 'Tài khoản đã xác thực' : 'Tài khoản chưa xác thực'}</p> */}
                            </div>
                        </div>

                        <div className="owner-public-metrics">
                            <div>
                                <span>Tỉ lệ phản hồi</span>
                                <b>{owner?.isVerified ? '90%' : '80%'}</b>
                            </div>
                            <div>
                                <span>Phản hồi trong</span>
                                <b>{owner?.isVerified ? '5 phút' : '15 phút'}</b>
                            </div>
                            <div>
                                <span>Tỉ lệ đồng ý</span>
                                <b>{owner?.isVerified ? '87%' : '75%'}</b>
                            </div>
                        </div>
                    </div>

                    <div className="owner-public-summary">
                        ⭐ {Number(owner?.avgRating || 0).toFixed(1)} • {owner?.totalReviews || 0} đánh giá
                    </div>
                </section>

                <section className="owner-public-card">
                    <div className="owner-public-header">
                        <h2>Danh sách xe</h2>
                        <span>{vehicles.length} xe</span>
                    </div>

                    <div className="owner-vehicle-grid">
                        {vehicles.length === 0 && <p className="owner-empty">Chủ xe chưa có xe hiển thị.</p>}
                        {vehicles.map((vehicle) => (
                            <Link to={`/car/${vehicle.id}`} key={vehicle.id} className="owner-vehicle-card">
                                <img src={vehicle.images[0]?.imageUrl || '/placeholder.svg'} alt={vehicle.modelName || 'Vehicle'} />
                                <div className="owner-vehicle-info">
                                    <strong>{vehicle.brandName} {vehicle.modelName}</strong>
                                    <p>{vehicle.carTypeName || 'Xe tự lái'} • {[vehicle.addressDetail, vehicle.district, vehicle.city].filter(Boolean).join(', ')}</p>
                                    <b>{formatCurrency(vehicle.pricePerDay)}</b>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="owner-public-card">
                    <div className="owner-public-header">
                        <h2>Đánh giá đã nhận</h2>
                        <span>{receivedReviews.length} đánh giá</span>
                    </div>

                    <div className="owner-review-list">
                        {receivedReviews.length === 0 && <p className="owner-empty">Chủ xe chưa có đánh giá.</p>}
                        {receivedReviews.map((review) => (
                            <article key={review.reviewId} className="owner-review-item">
                                <div className="owner-review-avatar">{(review.reviewerName || 'U').charAt(0).toUpperCase()}</div>
                                <div className="owner-review-content">
                                    <div className="owner-review-head">
                                        <strong>{review.reviewerName || 'Khách thuê'}</strong>
                                        <span>{formatDate(review.createdAt)}</span>
                                    </div>
                                    <p className="owner-review-stars">{'★'.repeat(Math.max(0, Number(review.vehicleRating || 0)))}{'☆'.repeat(Math.max(0, 5 - Number(review.vehicleRating || 0)))}</p>
                                    {review.comment && <p className="owner-review-comment">{review.comment}</p>}
                                    {review.vehicleName && <p className="owner-review-vehicle">Xe: {review.vehicleName}</p>}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default OwnerPublicProfile;
