import Home from '../pages/public/Home';
import Cars from '../pages/public/Cars';
import MyBookings from '../pages/user/MyBookings';
import CarDetails from '../pages/public/CarDetails';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import CarOwnerFleet from '../pages/owner/CarOwnerFleet';
import OwnerPublicProfile from '../pages/public/OwnerPublicProfile';
import ManageRentals from '../pages/ManageRentals';
import Customers from '../pages/Customers';
import ChatInbox from '../pages/chat/ChatInbox';

export const routes = [
  {
    path: '/',
    element: <Home />,
    name: 'Home'
  },
  {
    path: '/cars',
    element: <Cars />,
    name: 'Cars'
  },
  {
    path: '/car/:id',
    element: <CarDetails />,
    name: 'Car Details'
  },
  {
    path: '/cars/:id',
    element: <CarDetails />,
    name: 'Car Details'
  },
  {
    path: '/owners/:ownerId',
    element: <OwnerPublicProfile />,
    name: 'Owner Profile'
  },
  {
    path: '/my-bookings',
    element: <MyBookings />,
    name: 'My Bookings'
  },
  {
    path: '/messages',
    element: <ChatInbox />,
    name: 'Messages'
  },
  {
    path: '/manage-rentals',
    element: <ManageRentals />,
    name: 'Manage Rentals'
  },
  {
    path: '/login',
    element: <Login />,
    name: 'Login'
  },
  {
    path: '/register',
    element: <Register />,
    name: 'Register'
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
    name: 'Forgot Password'
  },
  {
    path: '/owner/fleet',
    element: <CarOwnerFleet />,
    name: 'Owner Fleet'
  },
  {
    path: '/admin/customers',
    element: <Customers />,
    name: 'Customers'
  }
];

export default routes;
