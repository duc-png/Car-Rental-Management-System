import { useEffect, useMemo } from 'react'

function FleetCreateModal({
    open,
    onClose,
    brandsLoading,
    brandOptions,
    createBrandName,
    setCreateBrandName,
    setCreateModelName,
    setCreateTypeName,
    updateCreateField,
    createModelName,
    modelsLoading,
    modelOptionsForBrand,
    createTypeName,
    selectedExistingModel,
    carTypeOptions,
    createForm,
    transmissionValues,
    fuelValues,
    formatEnumLabel,
    featureCatalog,
    selectedFeatureIds,
    onToggleCreateFeature,
    createUploadFiles,
    setCreateUploadFiles,
    creating,
    onCreate,
}) {
    const previewItems = useMemo(() => {
        if (!open) return []
        return (Array.isArray(createUploadFiles) ? createUploadFiles : []).map((file, index) => ({
            key: `${file?.name || 'file'}-${file?.size || 0}-${file?.lastModified || index}-${index}`,
            url: URL.createObjectURL(file),
            name: file?.name || `Ảnh ${index + 1}`,
            index,
        }))
    }, [open, createUploadFiles])

    useEffect(() => {
        return () => {
            previewItems.forEach((item) => {
                URL.revokeObjectURL(item.url)
            })
        }
    }, [previewItems])

    const removeUploadAt = (indexToRemove) => {
        setCreateUploadFiles((prev) => {
            const current = Array.isArray(prev) ? prev : []
            return current.filter((_, index) => index !== indexToRemove)
        })
    }

    if (!open) return null

    return (
        <div
            className="fleet-modal-backdrop"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose()
                }
            }}
        >
            <div className="fleet-modal">
                <section className="fleet-create">
                    <div className="fleet-create-header">
                        <div>
                            <h2>Tạo xe mới</h2>
                            <p>Nhập thông tin cơ bản để thêm xe vào hệ thống.</p>
                        </div>
                        <button
                            type="button"
                            className="btn-outline"
                            onClick={onClose}
                        >
                            Đóng
                        </button>
                    </div>
                    <div className="fleet-create-grid">
                        <label>
                            Hãng xe
                            <select
                                value={createBrandName}
                                onChange={(event) => {
                                    const nextBrand = event.target.value
                                    setCreateBrandName(nextBrand)
                                    setCreateModelName('')
                                    setCreateTypeName('')
                                    updateCreateField('modelId', '')
                                }}
                                disabled={brandsLoading}
                            >
                                <option value="">{brandsLoading ? 'Đang tải...' : 'Chọn hãng xe'}</option>
                                {brandOptions.map((brand) => (
                                    <option key={brand} value={brand}>{brand}</option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Mẫu xe
                            <input
                                type="text"
                                value={createModelName}
                                onChange={(event) => {
                                    setCreateModelName(event.target.value)
                                    updateCreateField('modelId', '')
                                }}
                                placeholder={!createBrandName ? 'Chọn hãng trước' : 'Chọn mẫu xe...'}
                                disabled={modelsLoading || !createBrandName}
                                list="fleet-model-suggestions"
                            />
                            <datalist id="fleet-model-suggestions">
                                {modelOptionsForBrand.map((model) => (
                                    <option
                                        key={model.id}
                                        value={String(model.name || '').trim()}
                                    />
                                ))}
                            </datalist>
                        </label>

                        <label>
                            Loại xe
                            <input
                                type="text"
                                value={createTypeName}
                                onChange={(event) => setCreateTypeName(event.target.value)}
                                placeholder="VD: Sedan, SUV, Hatchback..."
                                disabled={!createBrandName || (selectedExistingModel && String(selectedExistingModel?.typeName || '').trim().toLowerCase() !== 'unknown')}
                                list="fleet-type-suggestions"
                            />
                            <datalist id="fleet-type-suggestions">
                                {carTypeOptions.map((type) => (
                                    <option key={type} value={type} />
                                ))}
                            </datalist>
                        </label>

                        <label>
                            Biển số
                            <input
                                type="text"
                                value={createForm.licensePlate}
                                onChange={(event) => updateCreateField('licensePlate', event.target.value)}
                            />
                        </label>
                        <label>
                            Màu sắc
                            <input
                                type="text"
                                value={createForm.color}
                                onChange={(event) => updateCreateField('color', event.target.value)}
                            />
                        </label>
                        <label>
                            Số chỗ
                            <input
                                type="number"
                                min="1"
                                value={createForm.seatCount}
                                onChange={(event) => updateCreateField('seatCount', event.target.value)}
                            />
                        </label>

                        <label>
                            Năm sản xuất
                            <input
                                type="number"
                                min="1900"
                                max="2100"
                                placeholder="VD: 2020"
                                value={createForm.year}
                                onChange={(event) => updateCreateField('year', event.target.value)}
                            />
                        </label>
                        <label>
                            Hộp số
                            <select
                                value={createForm.transmission}
                                onChange={(event) => updateCreateField('transmission', event.target.value)}
                            >
                                <option value="">—</option>
                                {transmissionValues.map((v) => (
                                    <option key={v} value={v}>{formatEnumLabel(v)}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Nhiên liệu
                            <select
                                value={createForm.fuelType}
                                onChange={(event) => updateCreateField('fuelType', event.target.value)}
                            >
                                <option value="">—</option>
                                {fuelValues.map((v) => (
                                    <option key={v} value={v}>{formatEnumLabel(v)}</option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Mức tiêu thụ
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                placeholder="VD: 7.5"
                                value={createForm.fuelConsumption}
                                onChange={(event) => updateCreateField('fuelConsumption', event.target.value)}
                            />
                        </label>
                        <label>
                            Giá thuê/ngày
                            <input
                                type="number"
                                min="0"
                                value={createForm.pricePerDay}
                                onChange={(event) => updateCreateField('pricePerDay', event.target.value)}
                            />
                        </label>

                        <label style={{ gridColumn: '1 / -1' }}>
                            Mô tả
                            <textarea
                                rows={3}
                                value={createForm.description}
                                onChange={(event) => updateCreateField('description', event.target.value)}
                                placeholder="Mô tả thêm về tình trạng, trang bị, quy định..."
                            />
                        </label>
                        <label>
                            Số km hiện tại
                            <input
                                type="number"
                                min="0"
                                value={createForm.currentKm}
                                onChange={(event) => updateCreateField('currentKm', event.target.value)}
                            />
                        </label>
                        <label>
                            Tỉnh/Thành phố
                            <input
                                type="text"
                                value={createForm.province}
                                onChange={(event) => updateCreateField('province', event.target.value)}
                            />
                        </label>
                        <label>
                            Phường/Xã
                            <input
                                type="text"
                                value={createForm.ward}
                                onChange={(event) => updateCreateField('ward', event.target.value)}
                            />
                        </label>
                        <label>
                            Địa chỉ cụ thể
                            <input
                                type="text"
                                value={createForm.addressDetail}
                                onChange={(event) => updateCreateField('addressDetail', event.target.value)}
                            />
                        </label>

                        <div className="fleet-create-image-block" style={{ gridColumn: '1 / -1' }}>
                            <label className="fleet-create-image-upload">
                                Ảnh xe
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(event) => {
                                        const files = Array.from(event.target.files || [])
                                        setCreateUploadFiles((prev) => {
                                            const current = Array.isArray(prev) ? prev : []
                                            return [...current, ...files]
                                        })
                                        event.target.value = ''
                                    }}
                                />
                            </label>

                            <div className="fleet-create-image-preview fleet-create-image-preview--inline">
                                <div className="fleet-create-image-preview-head">
                                    <span>Ảnh đã chọn ({previewItems.length})</span>
                                    <small>Bấm vào ảnh để bỏ ảnh</small>
                                </div>
                                {previewItems.length === 0 ? (
                                    <p className="fleet-create-image-empty">Chưa có ảnh nào được chọn.</p>
                                ) : (
                                    <div className="fleet-create-image-list">
                                        {previewItems.map((item) => (
                                            <button
                                                key={item.key}
                                                type="button"
                                                className="fleet-create-image-item"
                                                onClick={() => removeUploadAt(item.index)}
                                                title={`Bỏ ảnh: ${item.name}`}
                                            >
                                                <img src={item.url} alt={item.name} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="fleet-create-feature-block" style={{ gridColumn: '1 / -1' }}>
                            <span className="fleet-create-feature-title">Tính năng xe</span>
                            {featureCatalog.length === 0 ? (
                                <p className="fleet-create-feature-empty">Không có dữ liệu tính năng.</p>
                            ) : (
                                <div className="fleet-create-feature-list">
                                    {featureCatalog.map((feature) => {
                                        const featureId = Number(feature?.id)
                                        if (!Number.isInteger(featureId)) return null
                                        return (
                                            <label key={featureId} className="fleet-create-feature-item">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFeatureIds.includes(featureId)}
                                                    onChange={() => onToggleCreateFeature(featureId)}
                                                />
                                                <span>{feature?.name || `Tính năng #${featureId}`}</span>
                                            </label>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="fleet-create-actions">
                        <button
                            type="button"
                            className="add-vehicle"
                            disabled={creating}
                            onClick={onCreate}
                        >
                            {creating ? 'Đang tạo...' : 'Tạo xe'}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default FleetCreateModal
