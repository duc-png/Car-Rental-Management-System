import { IdCard } from 'lucide-react'

export default function OwnerVehicleBasicSection({ form, handleChange, immutable = false }) {
    return (
        <div className="edit-card">
            <div className="card-header">
                <IdCard className="card-icon" size={20} aria-hidden="true" />
                <h2>Biển số xe</h2>
            </div>
            <p className="field-note-danger">Lưu ý: Biển số xe không thể thay đổi sau khi đăng ký.</p>
            <div className="form-grid one-col">
                <label>
                    Biển số xe
                    <input name="licensePlate" value={form.licensePlate} onChange={handleChange} required disabled={immutable} readOnly={immutable} />
                </label>
            </div>

            <h3 className="section-subtitle">Thông tin có thể cập nhật</h3>
            <div className="form-grid two-col">
                <label>
                    Màu sắc
                    <input name="color" value={form.color} onChange={handleChange} />
                </label>
                <label>
                    Số chỗ
                    <input type="number" name="seatCount" value={form.seatCount} onChange={handleChange} required disabled={immutable} readOnly={immutable} />
                </label>
            </div>
        </div>
    );
}
