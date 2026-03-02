export default function OwnerVehicleSpecsSection({
    form,
    handleChange,
    transmissionValues,
    fuelValues,
    formatEnumLabel,
    immutable = false,
}) {
    return (
        <div className="edit-card">
            <div className="card-header">
                <span className="card-icon">⚙️</span>
                <h2>Thông số kỹ thuật</h2>
            </div>
            <div className="form-grid three-col">
                <label>
                    Hộp số
                    <select name="transmission" value={form.transmission} onChange={handleChange}>
                        <option value="">—</option>
                        {transmissionValues.map((v) => (
                            <option key={v} value={v}>{formatEnumLabel(v)}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Nhiên liệu
                    <select name="fuelType" value={form.fuelType} onChange={handleChange} disabled={immutable}>
                        <option value="">—</option>
                        {fuelValues.map((v) => (
                            <option key={v} value={v}>{formatEnumLabel(v)}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Giá/ngày (VNĐ)
                    <input type="number" name="pricePerDay" value={form.pricePerDay} onChange={handleChange} required />
                </label>
                <label>
                    Năm sản xuất
                    <input type="number" name="year" value={form.year} onChange={handleChange} disabled={immutable} readOnly={immutable} />
                </label>
                <label>
                    Mức tiêu thụ (L/100km)
                    <input type="number" step="0.1" name="fuelConsumption" value={form.fuelConsumption} onChange={handleChange} />
                </label>
                <label>
                    Số km hiện tại
                    <input type="number" name="currentKm" value={form.currentKm} onChange={handleChange} required />
                </label>
            </div>
            <label className="full">
                Mô tả
                <textarea name="description" rows={4} value={form.description} onChange={handleChange} />
            </label>
        </div>
    );
}
