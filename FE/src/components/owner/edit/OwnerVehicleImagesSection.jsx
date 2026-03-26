import { buildInvalidImageFilesMessage, splitImageFiles } from '../../../utils/imageFileValidation';
import { Image as ImageIcon, Star, Trash2, UploadCloud } from 'lucide-react';

export default function OwnerVehicleImagesSection({
    vehicle,
    imagesUpdating,
    onSetMainImage,
    onDeleteImage,
    imageUrlsInput,
    setImageUrlsInput,
    onAddImageUrls,
    uploadFiles,
    setUploadFiles,
    onUploadImages,
    onImageFileError,
    invalidUploadNames,
    onInvalidUploadNamesChange,
}) {
    return (
        <div className="edit-card">
            <div className="card-header">
                <ImageIcon className="card-icon" size={20} aria-hidden="true" />
                <h2>Hình ảnh</h2>
            </div>

            {vehicle?.images?.length > 0 && (
                <div className="image-grid">
                    {vehicle.images.map((img) => (
                        <div key={img.id} className="image-item">
                            <img src={img.imageUrl || img.url} alt="Xe" />
                            {img.isMain && <span className="main-badge">ẢNH CHÍNH</span>}
                            <div className="image-actions">
                                {!img.isMain && (
                                    <button
                                        type="button"
                                        className="btn-make-main"
                                        onClick={() => onSetMainImage(img.id)}
                                        disabled={imagesUpdating}
                                    >
                                        <Star size={14} aria-hidden="true" /> Làm chính
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="btn-delete"
                                    onClick={() => onDeleteImage(img.id)}
                                    disabled={imagesUpdating}
                                >
                                    <Trash2 size={14} aria-hidden="true" /> Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="upload-zone">
                <div className="upload-drop">
                    <UploadCloud className="upload-icon" size={44} aria-hidden="true" />
                    <p>Tải ảnh lên hoặc dán URL</p>
                    <p className="small">Mỗi dòng 1 URL hoặc kéo thả file</p>
                </div>
                <textarea
                    placeholder="https://example.com/image.jpg\nhttps://..."
                    value={imageUrlsInput}
                    onChange={(e) => setImageUrlsInput(e.target.value)}
                    rows={3}
                />
                <div className="upload-buttons">
                    <button
                        type="button"
                        className="btn-add-url"
                        onClick={onAddImageUrls}
                        disabled={imagesUpdating || !imageUrlsInput.trim()}
                    >
                        Thêm URL
                    </button>
                    <label className="btn-upload">
                        Chọn file
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                                const pickedFiles = Array.from(e.target.files || []);
                                const { validFiles, invalidFiles } = splitImageFiles(pickedFiles);
                                if (invalidFiles.length > 0 && typeof onImageFileError === 'function') {
                                    onImageFileError(buildInvalidImageFilesMessage(invalidFiles));
                                }
                                if (typeof onInvalidUploadNamesChange === 'function') {
                                    const names = invalidFiles.map((file) => String(file?.name || '').trim()).filter(Boolean);
                                    onInvalidUploadNamesChange(names);
                                }
                                setUploadFiles(validFiles);
                                e.target.value = '';
                            }}
                            hidden
                        />
                    </label>
                    {Array.isArray(invalidUploadNames) && invalidUploadNames.length > 0 && (
                        <div className="owner-edit-invalid-files" role="alert">
                            <p>File khong duoc chap nhan:</p>
                            <ul>
                                {invalidUploadNames.map((name) => (
                                    <li key={name}>{name}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {uploadFiles.length > 0 && (
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={onUploadImages}
                            disabled={imagesUpdating}
                        >
                            Upload {uploadFiles.length} ảnh
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
