export default function OwnerVehicleFeaturesSection({ featureCatalog, selectedFeatureIds, onToggleFeature }) {
    return (
        <div className="edit-card">
            <div className="card-header">
                <h2>Tính năng xe</h2>
            </div>
            <div className="feature-checkbox-grid">
                {featureCatalog.map((feature) => (
                    <label key={feature.id} className="feature-checkbox-item">
                        <input
                            type="checkbox"
                            checked={selectedFeatureIds.includes(feature.id)}
                            onChange={() => onToggleFeature(feature.id)}
                        />
                        <span>{feature.name}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
