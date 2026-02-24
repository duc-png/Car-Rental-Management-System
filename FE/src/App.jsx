import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/public/Home'
import Cars from './pages/public/Cars'
import MyBookings from './pages/user/MyBookings'
import CarDetails from './pages/public/CarDetails'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import CarOwnerFleet from './pages/owner/CarOwnerFleet'
import OwnerPublicProfile from './pages/public/OwnerPublicProfile'
import ManageRentals from './pages/ManageRentals'
import Customers from './pages/Customers'
import './styles/App.css'
import './index.css'

function AppLayout() {
  const location = useLocation()
  const isOwnerDashboard = location.pathname.startsWith('/owner') || location.pathname.startsWith('/admin')
  const isCarDetailsPage = location.pathname.startsWith('/car/') || (location.pathname.startsWith('/cars/') && location.pathname !== '/cars')

  return (
    <>
      {!isOwnerDashboard && <Navbar sticky={!isCarDetailsPage} />}
      <main className={isOwnerDashboard ? 'owner-main' : ''}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/car/:id" element={<CarDetails />} />
          <Route path="/cars/:id" element={<CarDetails />} />
          <Route path="/owners/:ownerId" element={<OwnerPublicProfile />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/manage-rentals" element={<ManageRentals />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/owner/fleet" element={<CarOwnerFleet />} />
          <Route path="/admin/customers" element={<Customers />} />
        </Routes>
      </main>
      {!isOwnerDashboard && <Footer />}
    </>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppLayout />
          <Toaster richColors position="top-right" />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
