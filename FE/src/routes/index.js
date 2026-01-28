import Home from '../pages/Home';
import Cars from '../pages/Cars';
import MyBookings from '../pages/MyBookings';
import CarDetails from '../pages/CarDetails';

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
  }
];

export default routes;
