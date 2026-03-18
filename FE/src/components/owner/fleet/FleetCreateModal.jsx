import { useEffect, useMemo } from 'react'
import { splitImageFiles } from '../../../utils/imageFileValidation'

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
    fieldErrors,
    createUploadFiles,
    invalidUploadNames,
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

    const getFieldError = (field) => {
        if (!fieldErrors || typeof fieldErrors !== 'object') return ''
        const value = fieldErrors[field]
        return typeof value === 'string' ? value : ''
    }

    const invalidClass = (field) => (getFieldError(field) ? 'fleet-input-invalid' : '')
    const isElectricFuel = String(createForm.fuelType || '').toUpperCase() === 'ELECTRIC'
    const fuelConsumptionLabel = isElectricFuel
        ? 'Số km đi được trong 1 lần sạc đầy'
        : 'Mức tiêu thụ nhiên liệu (L/100km)'
    const fuelConsumptionPlaceholder = isElectricFuel ? 'VD: 350' : 'VD: 6.8'

    const onToggleDeliveryEnabled = (event) => {
        const checked = event.target.checked
        updateCreateField('deliveryEnabled', checked)
        updateCreateField('freeDeliveryWithinKm', checked ? (createForm.freeDeliveryWithinKm ?? 0) : 0)
        updateCreateField('maxDeliveryDistanceKm', checked ? (createForm.maxDeliveryDistanceKm ?? 20) : 0)
        updateCreateField('extraFeePerKm', checked ? (createForm.extraFeePerKm ?? 10000) : 0)
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
                            className="fleet-modal-close"
                            aria-label="Đóng"
                            onClick={onClose}
                        >
                            ×
                        </button>
                    </div>
                    <div className="fleet-create-content">
                        <section className="fleet-form-section">
                            <h3 className="fleet-form-section-title">Thông tin cơ bản</h3>
                            <div className="fleet-create-grid fleet-create-grid--3">
                                <label>
                                    Hãng xe
                                    <select
                                        className={invalidClass('brandName')}
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
                                    {getFieldError('brandName') && <span className="fleet-field-error">{getFieldError('brandName')}</span>}
                                </label>

                                <label>
                                    Mẫu xe
                                    <input
                                        className={invalidClass('modelName')}
                                        type="text"
                                        value={createModelName}
                                        onChange={(event) => {
                                            setCreateModelName(event.target.value)
                                            updateCreateField('modelId', '')
                                        }}
                                        placeholder={!createBrandName ? 'Chọn hãng trước' : 'VD: C300, Camry...'}
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
                                    {getFieldError('modelName') && <span className="fleet-field-error">{getFieldError('modelName')}</span>}
                                </label>

                                <label>
                                    Biển số
                                    <input
                                        className={invalidClass('licensePlate')}
                                        type="text"
                                        value={createForm.licensePlate}
                                        placeholder="VD: 30A-123.45"
                                        onChange={(event) => updateCreateField('licensePlate', event.target.value)}
                                    />
                                    {getFieldError('licensePlate') && <span className="fleet-field-error">{getFieldError('licensePlate')}</span>}
                                </label>
                            </div>
                        </section>

                        <section className="fleet-form-section">
                            <h3 className="fleet-form-section-title">Đặc điểm kỹ thuật</h3>
                            <div className="fleet-create-grid fleet-create-grid--4">
                                <label>
                                    Loại xe
                                    <input
                                        className={invalidClass('typeName')}
                                        type="text"
                                        value={createTypeName}
                                        onChange={(event) => setCreateTypeName(event.target.value)}
                                        placeholder="VD: Sedan"
                                        disabled={!createBrandName || (selectedExistingModel && String(selectedExistingModel?.typeName || '').trim().toLowerCase() !== 'unknown')}
                                        list="fleet-type-suggestions"
                                    />
                                    <datalist id="fleet-type-suggestions">
                                        {carTypeOptions.map((type) => (
                                            <option key={type} value={type} />
                                        ))}
                                    </datalist>
                                    {getFieldError('typeName') && <span className="fleet-field-error">{getFieldError('typeName')}</span>}
                                </label>

                                <label>
                                    Màu sắc
                                    <input
                                        type="text"
                                        value={createForm.color}
                                        placeholder="VD: Trắng, Đen..."
                                        onChange={(event) => updateCreateField('color', event.target.value)}
                                    />
                                </label>

                                <label>
                                    Số chỗ
                                    <input
                                        className={invalidClass('seatCount')}
                                        type="number"
                                        min="2"
                                        placeholder="VD: 4, 5, 7..."
                                        value={createForm.seatCount}
                                        onChange={(event) => updateCreateField('seatCount', event.target.value)}
                                    />
                                    {getFieldError('seatCount') && <span className="fleet-field-error">{getFieldError('seatCount')}</span>}
                                </label>

                                <label>
                                    Năm sản xuất
                                    <input
                                        className={invalidClass('year')}
                                        type="number"
                                        min="1900"
                                        max="2100"
                                        placeholder="VD: 2023"
                                        value={createForm.year}
                                        onChange={(event) => updateCreateField('year', event.target.value)}
                                    />
                                    {getFieldError('year') && <span className="fleet-field-error">{getFieldError('year')}</span>}
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
                                    Giá thuê/ngày (VNĐ)
                                    <input
                                        className={invalidClass('pricePerDay')}
                                        type="number"
                                        min="0"
                                        max="10000000"
                                        placeholder="VD: 1200000"
                                        value={createForm.pricePerDay}
                                        onChange={(event) => updateCreateField('pricePerDay', event.target.value)}
                                    />
                                    {getFieldError('pricePerDay') && <span className="fleet-field-error">{getFieldError('pricePerDay')}</span>}
                                </label>

                                <label>
                                    Số km đã đi
                                    <input
                                        className={invalidClass('currentKm')}
                                        type="number"
                                        min="0"
                                        placeholder="VD: 5000"
                                        value={createForm.currentKm}
                                        onChange={(event) => updateCreateField('currentKm', event.target.value)}
                                    />
                                    {getFieldError('currentKm') && <span className="fleet-field-error">{getFieldError('currentKm')}</span>}
                                </label>

                                <label>
                                    {fuelConsumptionLabel}
                                    <input
                                        className={invalidClass('fuelConsumption')}
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        placeholder={fuelConsumptionPlaceholder}
                                        value={createForm.fuelConsumption}
                                        onChange={(event) => updateCreateField('fuelConsumption', event.target.value)}
                                    />
                                    {getFieldError('fuelConsumption') && <span className="fleet-field-error">{getFieldError('fuelConsumption')}</span>}
                                </label>
                            </div>
                        </section>

                        <section className="fleet-form-section">
                            <h3 className="fleet-form-section-title">Mô tả chi tiết</h3>
                            <div className="fleet-create-grid fleet-create-grid--1">
                                <label>
                                    <textarea
                                        rows={3}
                                        value={createForm.description}
                                        onChange={(event) => updateCreateField('description', event.target.value)}
                                        placeholder="Mô tả thêm về tình trạng xe, các quy định khi thuê..."
                                    />
                                </label>
                            </div>
                        </section>

                        <section className="fleet-form-section">
                            <h3 className="fleet-form-section-title">Vị trí xe</h3>
                            <div className="fleet-create-grid fleet-create-grid--4">
                                <label>
                                    Tỉnh/Thành phố
                                    <input
                                        className={invalidClass('province')}
                                        type="text"
                                        value={createForm.province}
                                        onChange={(event) => updateCreateField('province', event.target.value)}
                                    />
                                    {getFieldError('province') && <span className="fleet-field-error">{getFieldError('province')}</span>}
                                </label>
                                <label>
                                    Quận/Huyện
                                    <input
                                        className={invalidClass('district')}
                                        type="text"
                                        value={createForm.district}
                                        onChange={(event) => updateCreateField('district', event.target.value)}
                                    />
                                    {getFieldError('district') && <span className="fleet-field-error">{getFieldError('district')}</span>}
                                </label>
                                <label>
                                    Xã/Phường
                                    <input
                                        className={invalidClass('ward')}
                                        type="text"
                                        value={createForm.ward}
                                        onChange={(event) => updateCreateField('ward', event.target.value)}
                                    />
                                    {getFieldError('ward') && <span className="fleet-field-error">{getFieldError('ward')}</span>}
                                </label>
                                <label>
                                    Địa chỉ cụ thể
                                    <input
                                        className={invalidClass('addressDetail')}
                                        type="text"
                                        placeholder="Số nhà, tên đường..."
                                        value={createForm.addressDetail}
                                        onChange={(event) => updateCreateField('addressDetail', event.target.value)}
                                    />
                                    {getFieldError('addressDetail') && <span className="fleet-field-error">{getFieldError('addressDetail')}</span>}
                                </label>
                            </div>
                        </section>

                        <section className="fleet-form-section">
                            <h3 className="fleet-form-section-title">Giao xe tận nơi</h3>
                            <label className="fleet-delivery-toggle" htmlFor="fleet-delivery-enabled">
                                <span>Hỗ trợ giao xe tận nơi</span>
                                <input
                                    id="fleet-delivery-enabled"
                                    type="checkbox"
                                    checked={Boolean(createForm.deliveryEnabled)}
                                    onChange={onToggleDeliveryEnabled}
                                />
                            </label>

                            {Boolean(createForm.deliveryEnabled) && (
                                <div className="fleet-create-grid fleet-create-grid--3">
                                    <label>
                                        Miễn phí giao nhận trong vòng (km)
                                        <input
                                            className={invalidClass('freeDeliveryWithinKm')}
                                            type="number"
                                            min="0"
                                            value={createForm.freeDeliveryWithinKm}
                                            onChange={(event) => updateCreateField('freeDeliveryWithinKm', event.target.value)}
                                        />
                                        {getFieldError('freeDeliveryWithinKm') && <span className="fleet-field-error">{getFieldError('freeDeliveryWithinKm')}</span>}
                                    </label>
                                    <label>
                                        Quãng đường giao xe tối đa (km)
                                        <input
                                            className={invalidClass('maxDeliveryDistanceKm')}
                                            type="number"
                                            min="0"
                                            value={createForm.maxDeliveryDistanceKm}
                                            onChange={(event) => updateCreateField('maxDeliveryDistanceKm', event.target.value)}
                                        />
                                        {getFieldError('maxDeliveryDistanceKm') && <span className="fleet-field-error">{getFieldError('maxDeliveryDistanceKm')}</span>}
                                    </label>
                                    <label>
                                        Phí giao nhận cho mỗi km (VND)
                                        <input
                                            className={invalidClass('extraFeePerKm')}
                                            type="number"
                                            min="0"
                                            step="1000"
                                            value={createForm.extraFeePerKm}
                                            onChange={(event) => updateCreateField('extraFeePerKm', event.target.value)}
                                        />
                                        {getFieldError('extraFeePerKm') && <span className="fleet-field-error">{getFieldError('extraFeePerKm')}</span>}
                                    </label>
                                </div>
                            )}
                        </section>

                        <section className="fleet-form-section">
                            <h3 className="fleet-form-section-title">Hình ảnh xe</h3>
                            <div className="fleet-create-image-block">
                                <label className="fleet-create-image-upload">
                                    <span className="fleet-create-image-upload-title">Nhấn để tải ảnh lên hoặc kéo thả vào đây</span>
                                    <small>Hỗ trợ định dạng JPG, PNG, WEBP (Tối đa 10MB/ảnh)</small>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(event) => {
                                            const files = Array.from(event.target.files || [])
                                            const { validFiles } = splitImageFiles(files)
                                            setCreateUploadFiles((prev) => {
                                                const current = Array.isArray(prev) ? prev : []
                                                return [...current, ...validFiles]
                                            })
                                            event.target.value = ''
                                        }}
                                    />
                                </label>
                                {getFieldError('uploadFiles') && <p className="fleet-field-error fleet-field-error--block">{getFieldError('uploadFiles')}</p>}
                                {Array.isArray(invalidUploadNames) && invalidUploadNames.length > 0 && (
                                    <div className="fleet-invalid-files" role="alert">
                                        <p>File khong duoc chap nhan:</p>
                                        <ul>
                                            {invalidUploadNames.map((name) => (
                                                <li key={name}>{name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="fleet-create-image-preview fleet-create-image-preview--inline">
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
                        </section>

                        <section className="fleet-form-section">
                            <h3 className="fleet-form-section-title">Tiện ích tích hợp</h3>
                            <div className="fleet-create-feature-block">
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
                        </section>
                    </div>
                    <div className="fleet-create-actions">
                        <button
                            type="button"
                            className="fleet-btn-secondary"
                            onClick={onClose}
                            disabled={creating}
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="button"
                            className="add-vehicle fleet-btn-primary"
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
