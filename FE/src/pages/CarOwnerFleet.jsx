import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/CarOwnerFleet.css'

const vehiclesSeed = [
    {
        id: 1,
        name: 'Mercedes-Benz S-Class',
        year: 2024,
        plate: 'ABC-1234',
        price: 250,
        type: 'Luxury',
        status: 'Available',
        seats: 5,
        fuel: 'Hybrid',
        transmission: 'Automatic',
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 2,
        name: 'BMW 5 Series',
        year: 2023,
        plate: 'XYZ-5678',
        price: 180,
        type: 'Sedan',
        status: 'Rented',
        seats: 5,
        fuel: 'Diesel',
        transmission: 'Automatic',
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 3,
        name: 'Porsche 911',
        year: 2024,
        plate: 'SP-9999',
        price: 450,
        type: 'Sports',
        status: 'Available',
        seats: 2,
        fuel: 'Petrol',
        transmission: 'Automatic',
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 4,
        name: 'Range Rover Sport',
        year: 2024,
        plate: 'SUV-4567',
        price: 320,
        type: 'SUV',
        status: 'Available',
        seats: 7,
        fuel: 'Diesel',
        transmission: 'Automatic',
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 5,
        name: 'Tesla Model 3',
        year: 2024,
        plate: 'EV-2024',
        price: 200,
        type: 'Electric',
        status: 'Rented',
        seats: 5,
        fuel: 'Electric',
        transmission: 'Automatic',
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 6,
        name: 'Honda Civic',
        year: 2023,
        plate: 'CMP-7890',
        price: 85,
        type: 'Compact',
        status: 'Available',
        seats: 5,
        fuel: 'Petrol',
        transmission: 'Manual',
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 7,
        name: 'Audi A6',
        year: 2023,
        plate: 'AUD-3456',
        price: 190,
        type: 'Sedan',
        status: 'Maintenance',
        seats: 5,
        fuel: 'Diesel',
        transmission: 'Automatic',
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 8,
        name: 'Toyota Camry',
        year: 2023,
        plate: 'TOY-1111',
        price: 120,
        type: 'Sedan',
        status: 'Available',
        seats: 5,
        fuel: 'Hybrid',
        transmission: 'Automatic',
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80'
    },
    {
        id: 9,
        name: 'Chevrolet Bolt EV',
        year: 2024,
        plate: 'CHE-2222',
        price: 180,
        type: 'Electric',
        status: 'Rented',
        seats: 5,
        fuel: 'Electric',
        transmission: 'Automatic',
        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80'
    }
]

const categories = ['All Categories', 'Luxury', 'Sedan', 'Sports', 'SUV', 'Electric', 'Compact']
const statuses = ['All Status', 'Available', 'Rented', 'Maintenance']

const formatPrice = (value) => `$${value.toLocaleString('en-US')}`

function CarOwnerFleet() {
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState(categories[0])
    const [status, setStatus] = useState(statuses[0])
    const [currentPage, setCurrentPage] = useState(1)

    const ITEMS_PER_PAGE = 8

    const stats = useMemo(() => {
        const total = vehiclesSeed.length
        const available = vehiclesSeed.filter(vehicle => vehicle.status === 'Available').length
        const rented = vehiclesSeed.filter(vehicle => vehicle.status === 'Rented').length
        const maintenance = vehiclesSeed.filter(vehicle => vehicle.status === 'Maintenance').length
        return { total, available, rented, maintenance }
    }, [])

    const vehicles = useMemo(() => {
        return vehiclesSeed.filter((vehicle) => {
            const matchesSearch = vehicle.name.toLowerCase().includes(search.toLowerCase())
            const matchesCategory = category === 'All Categories' || vehicle.type === category
            const matchesStatus = status === 'All Status' || vehicle.status === status
            return matchesSearch && matchesCategory && matchesStatus
        })
    }, [search, category, status])

    const totalPages = Math.ceil(vehicles.length / ITEMS_PER_PAGE)

    const paginatedVehicles = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
        return vehicles.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    }, [vehicles, currentPage])

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Reset to page 1 when filters change
    const handleSearchChange = (value) => {
        setSearch(value)
        setCurrentPage(1)
    }

    const handleCategoryChange = (value) => {
        setCategory(value)
        setCurrentPage(1)
    }

    const handleStatusChange = (value) => {
        setStatus(value)
        setCurrentPage(1)
    }

    return (
        <div className="fleet-dashboard">
            <aside className="fleet-sidebar">
                <Link to="/" className="fleet-brand">
                    <div className="brand-icon">
                        <img src="/favicon.svg" alt="CarRental System" />
                    </div>
                    <div>
                        <h3>CarRental System</h3>
                        <p>Fleet Management</p>
                    </div>
                </Link>

                <div className="fleet-nav">
                    <p className="nav-section">Navigation</p>
                    <button type="button" className="nav-item">Dashboard</button>
                    <button type="button" className="nav-item active">Fleet</button>
                    <button type="button" className="nav-item">Bookings</button>
                    <button type="button" className="nav-item">Customers</button>
                    <button type="button" className="nav-item">Analytics</button>
                </div>

                <div className="fleet-system">
                    <p className="nav-section">System</p>
                    <button type="button" className="nav-item">Settings</button>
                </div>

                <div className="fleet-user">
                    <div className="user-avatar">AD</div>
                    <div className="user-info">
                        <p className="user-name">Car Owner</p>
                        <p className="user-email">owner@carrental.com</p>
                    </div>
                </div>
            </aside>

            <section className="fleet-main">
                <header className="fleet-header">
                    <div>
                        <p className="fleet-breadcrumb">Car Owner / Fleet</p>
                        <h1>Fleet Management</h1>
                        <p>Manage your vehicle inventory</p>
                    </div>
                    <div className="fleet-header-actions">
                        <button className="add-vehicle">+ Add Vehicle</button>
                    </div>
                </header>

                <div className="fleet-overview">
                    <div className="overview-card">
                        <p>Total Vehicles</p>
                        <h3>{stats.total}</h3>
                        <span>All listed vehicles</span>
                    </div>
                    <div className="overview-card">
                        <p>Available</p>
                        <h3>{stats.available}</h3>
                        <span>Ready for booking</span>
                    </div>
                    <div className="overview-card">
                        <p>Rented</p>
                        <h3>{stats.rented}</h3>
                        <span>On the road</span>
                    </div>
                    <div className="overview-card">
                        <p>Maintenance</p>
                        <h3>{stats.maintenance}</h3>
                        <span>In service</span>
                    </div>
                </div>

                <div className="fleet-filters">
                    <div className="search-field">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by name or brand..."
                            value={search}
                            onChange={(event) => handleSearchChange(event.target.value)}
                        />
                    </div>
                    <select value={category} onChange={(event) => handleCategoryChange(event.target.value)}>
                        {categories.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>
                    <select value={status} onChange={(event) => handleStatusChange(event.target.value)}>
                        {statuses.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>
                </div>

                <div className="fleet-grid">
                    {paginatedVehicles.map((vehicle) => (
                        <article className="fleet-card" key={vehicle.id}>
                            <div className="fleet-image">
                                <img src={vehicle.image} alt={vehicle.name} />
                                <span className={`status-badge ${vehicle.status.toLowerCase()}`}>
                                    {vehicle.status}
                                </span>
                            </div>

                            <div className="fleet-card-body">
                                <h3>{vehicle.name}</h3>
                                <p className="fleet-subtitle">{vehicle.year} • {vehicle.plate}</p>

                                <div className="fleet-meta">
                                    <span>👥 {vehicle.seats}</span>
                                    <span>⛽ {vehicle.fuel}</span>
                                    <span>⚙️ {vehicle.transmission}</span>
                                </div>

                                <div className="fleet-pricing">
                                    <div>
                                        <span className="label">Per day</span>
                                        <strong>{formatPrice(vehicle.price)}</strong>
                                    </div>
                                    <span className="type-pill">{vehicle.type}</span>
                                </div>

                                <div className="fleet-actions">
                                    <button type="button" className="btn-outline">✏️ Edit</button>
                                    <button type="button" className="btn-outline danger">🗑️ Delete</button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="fleet-pagination">
                        <button
                            type="button"
                            className="pagination-button"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            ← Previous
                        </button>

                        {[...Array(totalPages)].map((_, index) => {
                            const page = index + 1
                            return (
                                <button
                                    key={page}
                                    type="button"
                                    className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                                    onClick={() => handlePageChange(page)}
                                >
                                    {page}
                                </button>
                            )
                        })}

                        <button
                            type="button"
                            className="pagination-button"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </section>
        </div>
    )
}

export default CarOwnerFleet
