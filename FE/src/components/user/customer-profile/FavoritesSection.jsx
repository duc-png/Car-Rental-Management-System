import { Link } from 'react-router-dom'
import { formatVndCurrency } from '../../../utils/bookingUtils'

export default function FavoritesSection({ favoriteLoading, favoriteCars, onRemoveFavorite }) {
    return (
        <div className="customer-profile-card">
            <h3>Xe yeu thich</h3>
            {favoriteLoading ? <p>Dang tai...</p> : null}
            {!favoriteLoading && favoriteCars.length === 0 ? (
                <p>
                    Ban chua co xe yeu thich. <Link to="/cars">Kham pha xe ngay</Link>.
                </p>
            ) : null}

            <div className="favorite-list">
                {favoriteCars.map((vehicle) => (
                    <article className="favorite-item" key={vehicle.id}>
                        <img src={vehicle.images?.[0]?.imageUrl || '/placeholder.svg'} alt={vehicle.modelName || 'Vehicle'} />
                        <div className="favorite-meta">
                            <strong>{vehicle.brandName} {vehicle.modelName}</strong>
                            <span>{formatVndCurrency(vehicle.pricePerDay)} / ngay</span>
                        </div>
                        <div className="favorite-actions">
                            <Link to={`/car/${vehicle.id}`}>Xem xe</Link>
                            <button type="button" onClick={() => onRemoveFavorite(vehicle.id)}>Xoa</button>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    )
}
