export default function OwnerVehicleBasicSection({ form, handleChange, immutable = false }) {
    return (
        <div className="edit-card">
            <div className="card-header">
                <span className="card-icon">📋</span>
                <h2>Thông tin cơ bản</h2>
            </div>
            <div className="form-grid two-col">
                <label>
                    Biển số
                    <input name="licensePlate" value={form.licensePlate} onChange={handleChange} required disabled={immutable} readOnly={immutable} />
                </label>
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
