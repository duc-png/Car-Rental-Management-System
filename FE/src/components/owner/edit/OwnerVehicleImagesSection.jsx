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
}) {
    return (
        <div className="edit-card">
            <div className="card-header">
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
                                        ★ Làm chính
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="btn-delete"
                                    onClick={() => onDeleteImage(img.id)}
                                    disabled={imagesUpdating}
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="upload-zone">
                <div className="upload-drop">
                    <span className="upload-icon">↑</span>
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
                            onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                            hidden
                        />
                    </label>
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
