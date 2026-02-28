import { Grid2x2, List, Search } from 'lucide-react'

function FleetFilters({ search, onSearchChange, status, statuses, onStatusChange, viewMode, onViewModeChange, formatEnumLabel, allStatusLabel }) {
    return (
        <div className="fleet-filters">
            <div className="search-field">
                <Search className="search-icon" size={18} strokeWidth={2.2} aria-hidden="true" />
                <input
                    type="text"
                    placeholder="Tìm theo tên xe hoặc hãng..."
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                />
            </div>
            <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
                {statuses.map((item) => (
                    <option key={item} value={item}>{item === allStatusLabel ? item : formatEnumLabel(item)}</option>
                ))}
            </select>
            <div className="fleet-view-toggle" role="group" aria-label="Chế độ hiển thị">
                <button
                    type="button"
                    className={viewMode === 'list' ? 'active' : ''}
                    aria-pressed={viewMode === 'list'}
                    title="Danh sách"
                    onClick={() => onViewModeChange('list')}
                >
                    <List aria-hidden="true" focusable="false" />
                </button>
                <button
                    type="button"
                    className={viewMode === 'grid' ? 'active' : ''}
                    aria-pressed={viewMode === 'grid'}
                    title="Lưới"
                    onClick={() => onViewModeChange('grid')}
                >
                    <Grid2x2 aria-hidden="true" focusable="false" />
                </button>
            </div>
        </div>
    )
}

export default FleetFilters
