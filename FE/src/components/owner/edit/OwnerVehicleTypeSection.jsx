export default function OwnerVehicleTypeSection({
    modelsLoading,
    brandName,
    setBrandName,
    setModelName,
    setTypeName,
    brandOptions,
    isCustomModel,
    setIsCustomModel,
    modelName,
    modelOptionsForBrand,
    typeName,
    immutable = false,
}) {
    if (immutable) {
        return (
            <div className="edit-card">
                <div className="card-header">
                    <span className="card-icon">🚗</span>
                    <h2>Loại xe</h2>
                </div>
                <p className="field-immutable-note">Hãng xe, mẫu xe và loại xe không thể thay đổi sau khi đã tạo xe.</p>
                <div className="form-grid three-col">
                    <label>
                        Hãng xe
                        <input type="text" value={brandName || ''} disabled readOnly />
                    </label>
                    <label>
                        Mẫu xe
                        <input type="text" value={modelName || ''} disabled readOnly />
                    </label>
                    <label>
                        Loại xe
                        <input type="text" value={typeName || ''} disabled readOnly />
                    </label>
                </div>
            </div>
        );
    }

    return (
        <div className="edit-card">
            <div className="card-header">
                <span className="card-icon">🚗</span>
                <h2>Loại xe</h2>
            </div>
            <div className="form-grid three-col">
                <label>
                    Hãng xe
                    <div className="select-with-button">
                        <select
                            value={brandName}
                            onChange={(e) => {
                                setBrandName(e.target.value);
                                setModelName('');
                                setTypeName('');
                            }}
                            disabled={modelsLoading}
                            required
                        >
                            <option value="">Chọn hãng xe</option>
                            {brandOptions.map((brand) => (
                                <option key={brand} value={brand}>
                                    {brand}
                                </option>
                            ))}
                        </select>
                    </div>
                </label>
                <label>
                    Mẫu xe

                    {isCustomModel ? (
                        <input
                            type="text"
                            value={modelName}
                            onChange={(e) => setModelName(e.target.value)}
                            placeholder="Nhập mẫu xe mới"
                            required
                        />
                    ) : (
                        <select
                            value={modelName}
                            onChange={(e) => {
                                if (e.target.value === '__new__') {
                                    setIsCustomModel(true);
                                    setModelName('');
                                } else {
                                    setModelName(e.target.value);
                                }
                            }}
                            required
                        >
                            <option value="">Chọn mẫu xe</option>

                            {modelOptionsForBrand.map((model) => (
                                <option key={model.id} value={model.name}>
                                    {model.name}
                                </option>
                            ))}

                            <option value="__new__">+ Thêm mẫu mới</option>
                        </select>
                    )}
                </label>
                <label>
                    Loại xe
                    <input
                        type="text"
                        value={typeName}
                        onChange={(e) => setTypeName(e.target.value)}
                        placeholder="SUV, Sedan, Hatchback, MPV..."
                    />
                </label>
            </div>
        </div>
    );
}
