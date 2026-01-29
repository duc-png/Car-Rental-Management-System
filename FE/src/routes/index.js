import Home from '../pages/Home';
import Cars from '../pages/Cars';
import MyBookings from '../pages/MyBookings';
import CarDetails from '../pages/CarDetails';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';

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
    path: '/my-bookings',
    element: <MyBookings />,
    name: 'My Bookings'
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
  }
];

export default routes;
