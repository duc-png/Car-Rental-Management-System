import { formatVndCurrency, getBookingStatusLabel } from '../../../utils/bookingUtils'
import { TRIP_TAB } from '../../../utils/customerProfile/constants'

export default function TripsSection({
    bookingLoading,
    activeTripTab,
    currentTrips,
    tripHistory,
    displayedTrips,
    onTripTabChange,
    formatDateTime
}) {
    return (
        <div className="customer-profile-card">
            <h3>Chuyen di cua toi</h3>
            {bookingLoading ? <p>Dang tai...</p> : null}
            {!bookingLoading ? (
                <>
                    <div className="trip-tabs" role="tablist" aria-label="Trip tabs">
                        <button
                            type="button"
                            className={`trip-tab ${activeTripTab === TRIP_TAB.CURRENT ? 'active' : ''}`}
                            onClick={() => onTripTabChange(TRIP_TAB.CURRENT)}
                        >
                            Hien tai ({currentTrips.length})
                        </button>
                        <button
                            type="button"
                            className={`trip-tab ${activeTripTab === TRIP_TAB.HISTORY ? 'active' : ''}`}
                            onClick={() => onTripTabChange(TRIP_TAB.HISTORY)}
                        >
                            Lich su ({tripHistory.length})
                        </button>
                    </div>

                    <div className="trip-group">
                        <h4>{activeTripTab === TRIP_TAB.CURRENT ? 'Chuyen di hien tai' : 'Lich su chuyen di'}</h4>
                        {displayedTrips.length === 0 ? (
                            <p>{activeTripTab === TRIP_TAB.CURRENT ? 'Khong co chuyen di hien tai.' : 'Chua co lich su chuyen di.'}</p>
                        ) : null}
                        {displayedTrips.map((booking) => (
                            <article className="trip-item" key={booking.id}>
                                <div>
                                    <strong>{booking.vehicleName || `Xe #${booking.vehicleId}`}</strong>
                                    <p>{formatDateTime(booking.startDate)} - {formatDateTime(booking.endDate)}</p>
                                </div>
                                <div className="trip-right">
                                    <span>{getBookingStatusLabel(booking.status)}</span>
                                    <b>{formatVndCurrency(booking.totalPrice)}</b>
                                </div>
                            </article>
                        ))}
                    </div>
                </>
            ) : null}
        </div>
    )
}
