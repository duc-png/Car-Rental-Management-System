export default function OwnerVehicleLocationSection({ form, handleChange, setForm, statusValues, formatEnumLabel }) {
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
        <div className="edit-card">
            <div className="card-header">
                <span className="card-icon">📍</span>
                <h2>Vị trí & Trạng thái</h2>
            </div>
            <div className="form-grid three-col">
                <label>
                    Tỉnh/Thành phố
                    <input name="province" value={form.province} onChange={handleChange} />
                </label>
                <label>
                    Phường/Xã
                    <input name="ward" value={form.ward} onChange={handleChange} />
                </label>
                <label>
                    Địa chỉ cụ thể
                    <input name="addressDetail" value={form.addressDetail} onChange={handleChange} />
                </label>
            </div>
            <label>
                Trạng thái xe
                <select name="status" value={form.status} onChange={handleChange}>
                    <option value="">—</option>
                    {statusValues.map((v) => (
                        <option key={v} value={v}>{formatEnumLabel(v)}</option>
                    ))}
                </select>
            </label>

            <label className="owner-edit-delivery-toggle" htmlFor="owner-edit-delivery-enabled">
                <span>Hỗ trợ giao xe tận nơi</span>
                <input
                    id="owner-edit-delivery-enabled"
                    type="checkbox"
                    checked={Boolean(form.deliveryEnabled)}
                    onChange={onToggleDeliveryEnabled}
                />
            </label>

            {Boolean(form.deliveryEnabled) && (
                <div className="owner-edit-delivery-grid">
                    <label>
                        Miễn phí giao nhận trong vòng (km)
                        <input
                            type="number"
                            min="0"
                            name="freeDeliveryWithinKm"
                            value={form.freeDeliveryWithinKm}
                            onChange={handleChange}
                        />
                    </label>
                    <label>
                        Quãng đường giao xe tối đa (km)
                        <input
                            type="number"
                            min="0"
                            name="maxDeliveryDistanceKm"
                            value={form.maxDeliveryDistanceKm}
                            onChange={handleChange}
                        />
                    </label>
                    <label>
                        Phí giao nhận cho mỗi km (VND)
                        <input
                            type="number"
                            min="0"
                            step="1000"
                            name="extraFeePerKm"
                            value={form.extraFeePerKm}
                            onChange={handleChange}
                        />
                    </label>
                </div>
            )}
        </div>
    );
}
