export default function OwnerVehicleLocationSection({ form, handleChange, statusValues, formatEnumLabel }) {
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
        </div>
    );
}
