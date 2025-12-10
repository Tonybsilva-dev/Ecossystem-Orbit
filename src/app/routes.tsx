import { createBrowserRouter } from 'react-router';
import { Home } from '../features/home/Home';
import { AppLayout } from './AppLayout';
import { AuthLayout } from './AuthLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { RequireRole } from '../features/auth/RequireRole';
import { Component as Schedule } from '../features/scheduling/routes';
import { DashboardLayout } from '../features/shop-management/DashboardLayout';
import { DashboardHome } from '../features/shop-management/DashboardHome';
import { AppointmentsList } from '../features/shop-management/components/AppointmentsList';
import { ShopPage } from '../features/catalog/ShopPage';
import { CheckoutPage } from '../features/catalog/CheckoutPage';
import { OrderSuccessPage } from '../features/catalog/OrderSuccessPage';

export const router = createBrowserRouter([
  // Public & User Routes (AppLayout)
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'schedule',
        element: (
          <RequireRole allowedRoles={['USER', 'ADMIN']}>
            <Schedule />
          </RequireRole>
        ),
      },
      {
        path: 'loja',
        element: <ShopPage />,
      },
      {
        path: 'checkout',
        element: <CheckoutPage />,
      },
      {
        path: 'checkout/success',
        element: <OrderSuccessPage />,
      },
    ],
  },

  // Protected Backoffice Routes (DashboardLayout)
  {
    path: 'dashboard',
    element: (
      <RequireRole allowedRoles={['ADMIN', 'BARBER']}>
        <DashboardLayout />
      </RequireRole>
    ),
    children: [
      {
        index: true,
        element: <DashboardHome />,
      },
      {
        path: 'appointments',
        element: <AppointmentsList />,
      },
    ],
  },

  // Auth Routes (AuthLayout)
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
    ],
  },
]);
