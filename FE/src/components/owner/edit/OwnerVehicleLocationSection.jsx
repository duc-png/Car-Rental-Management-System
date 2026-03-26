import { MapPin } from 'lucide-react'

export default function OwnerVehicleLocationSection({ form, handleChange, setForm, statusValues, formatEnumLabel }) {
    const formatFeeShort = (value) => {
        const amount = Number(value || 0)
        if (amount <= 0) return '0đ'
        if (amount % 1000 === 0) return `${Math.round(amount / 1000)}k`
        return `${amount.toLocaleString('vi-VN')}đ`
    }

    const onToggleDeliveryEnabled = (event) => {
        const checked = event.target.checked;
        setForm((prev) => ({
            ...prev,
            deliveryEnabled: checked,
            freeDeliveryWithinKm: checked ? (prev.freeDeliveryWithinKm ?? 0) : 0,
            maxDeliveryDistanceKm: checked ? (prev.maxDeliveryDistanceKm ?? 20) : 0,
            extraFeePerKm: checked ? (prev.extraFeePerKm ?? 10000) : 0,
        }));
    };

    return (
        <div className="edit-card owner-edit-location-card">
            <div className="owner-edit-location-head">
                <div className="card-header owner-edit-location-card-header">
                    <MapPin className="card-icon" size={20} aria-hidden="true" />
                    <h2>Vị trí & Trạng thái</h2>
                </div>

                <div className="owner-edit-delivery-toggle-row">
                    <h3>Giao xe tận nơi</h3>
                    <label className="owner-edit-switch" htmlFor="owner-edit-delivery-enabled">
                        <input
                            id="owner-edit-delivery-enabled"
                            type="checkbox"
                            checked={Boolean(form.deliveryEnabled)}
                            onChange={onToggleDeliveryEnabled}
                        />
                        <span className="owner-edit-switch-slider" aria-hidden="true" />
                    </label>
                </div>
            </div>

            <div className="owner-edit-location-grid-top">
                <label>
                    Tỉnh/Thành phố
                    <input name="province" value={form.province} onChange={handleChange} />
                </label>
                <label>
                    Quận/Huyện
                    <input name="district" value={form.district} onChange={handleChange} />
                </label>
                <label>
                    Phường/Xã
                    <input name="ward" value={form.ward} onChange={handleChange} />
                </label>
            </div>

            <div className="owner-edit-location-grid-bottom">
                <label>
                    Địa chỉ cụ thể
                    <input name="addressDetail" value={form.addressDetail} onChange={handleChange} />
                </label>
                <label className="owner-edit-status-field">
                    Trạng thái xe
                    <select name="status" value={form.status} onChange={handleChange}>
                        <option value="">—</option>
                        {statusValues.map((v) => (
                            <option key={v} value={v}>{formatEnumLabel(v)}</option>
                        ))}
                    </select>
                </label>
            </div>

            {Boolean(form.deliveryEnabled) && (
                <div className="owner-edit-delivery-config">
                    <div className="owner-edit-delivery-config-grid">
                        <div className="owner-edit-range-field">
                            <div className="owner-edit-range-label-row">
                                <span>Quãng đường giao xe tối đa</span>
                                <b>{form.maxDeliveryDistanceKm || 20}km</b>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="50"
                                name="maxDeliveryDistanceKm"
                                value={form.maxDeliveryDistanceKm || 20}
                                onChange={handleChange}
                            />
                            <small>Quãng đường đề xuất: 20km</small>
                        </div>

                        <div className="owner-edit-range-field">
                            <div className="owner-edit-range-label-row">
                                <span>Phí giao nhận xe cho mỗi km</span>
                                <b>{formatFeeShort(form.extraFeePerKm || 10000)}</b>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="30000"
                                step="1000"
                                name="extraFeePerKm"
                                value={form.extraFeePerKm || 10000}
                                onChange={handleChange}
                            />
                            <small>Phí đề xuất: 10K</small>
                        </div>
                    </div>

                    <div className="owner-edit-range-field owner-edit-range-field-single">
                        <div className="owner-edit-range-label-row">
                            <span>Miễn phí giao nhận xe trong vòng</span>
                            <b>{form.freeDeliveryWithinKm || 0}km</b>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="20"
                            name="freeDeliveryWithinKm"
                            value={form.freeDeliveryWithinKm || 0}
                            onChange={handleChange}
                        />
                        <small>Quãng đường đề xuất: 0km</small>
                    </div>
                </div>
            )}
        </div>
    );
}
