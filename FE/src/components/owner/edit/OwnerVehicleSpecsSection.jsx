import { Settings2 } from 'lucide-react'

export default function OwnerVehicleSpecsSection({
    form,
    handleChange,
    transmissionValues,
    fuelValues,
    formatEnumLabel,
    immutable = false,
}) {
    const isElectricFuel = String(form?.fuelType || '').toUpperCase() === 'ELECTRIC'
    return (
        <div className="edit-card">
            <div className="card-header">
                <Settings2 className="card-icon" size={20} aria-hidden="true" />
                <h2>Thông số kỹ thuật</h2>
            </div>
            {immutable && (
                <p className="field-note-danger">Lưu ý: Truyền động, nhiên liệu và năm sản xuất không thể thay đổi sau khi đăng ký.</p>
            )}
            <div className="form-grid three-col">
                <label>
                    Truyền động
                    <select name="transmission" value={form.transmission} onChange={handleChange} disabled={immutable}>
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
                    {isElectricFuel ? 'Quãng đường/sạc đầy (km)' : 'Mức tiêu thụ (L/100km)'}
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
