import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Cars from './pages/Cars'
import MyBookings from './pages/MyBookings'
import ManageRentals from './pages/ManageRentals'
import CarDetails from './pages/CarDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import CarOwnerFleet from './pages/CarOwnerFleet'
import Customers from './pages/Customers'
import './styles/App.css'
import './index.css'

function AppLayout() {
  const location = useLocation()
  const isOwnerDashboard = location.pathname.startsWith('/owner') || location.pathname.startsWith('/admin')

  return (
    <>
      {!isOwnerDashboard && <Navbar />}
      <main className={isOwnerDashboard ? 'owner-main' : ''}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/car/:id" element={<CarDetails />} />
          <Route path="/cars/:id" element={<CarDetails />} />
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
