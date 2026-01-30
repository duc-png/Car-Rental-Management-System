# CarRental - Luxury Car Rental Website

A modern React + Vite application for browsing and booking luxury vehicles.

## Project Structure

```
car-rental/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── SearchBar.jsx
│   │   ├── FeaturedVehicles.jsx
│   │   ├── VehicleCard.jsx
│   │   ├── CallToAction.jsx
│   │   ├── Testimonials.jsx
│   │   ├── TestimonialCard.jsx
│   │   └── Newsletter.jsx
│   ├── pages/               # Page components
│   │   ├── Home.jsx
│   │   ├── Cars.jsx
│   │   └── MyBookings.jsx
│   ├── styles/              # CSS files
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
├── package.json             # Project dependencies
└── .gitignore               # Git ignore rules
```

## Features

- **Homepage**: Hero section with search functionality and featured vehicles
- **Cars Catalog**: Browse all available vehicles with filtering options
- **Bookings Management**: View and manage your car rental reservations
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean and professional interface

## Technologies Used

- **React 18.2.0** - UI framework
- **Vite 5.0.0** - Build tool and dev server
- **React Router 6.20** - Client-side routing
- **SWC** - Fast JavaScript compiler

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd car-rental
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Project Features

### Components
- **Navbar**: Navigation bar with links to all pages
- **SearchBar**: Filter vehicles by location and dates
- **FeaturedVehicles**: Display popular rental vehicles
- **VehicleCard**: Individual vehicle display with details
- **Testimonials**: Customer reviews and ratings
- **Newsletter**: Email subscription form
- **CallToAction**: Promote selling your car
- **Footer**: Footer with links and information

### Pages
- **Home**: Landing page with search and featured vehicles
- **Cars**: Browse all available vehicles with filtering
- **My Bookings**: View and manage active reservations

## Styling

The project uses CSS with CSS variables for theming. All styles are organized in `/src/styles/` directory for easy maintenance and customization.

## Future Enhancements

- Payment integration
- User authentication
- Advanced search filters
- Booking confirmation emails
- Admin dashboard
- Real-time availability

## License

This project is open source and available for use.
