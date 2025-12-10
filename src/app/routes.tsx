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
import { OnboardingPage } from '../features/onboarding/OnboardingPage';

import { RequireConfig } from '../features/shop-management/RequireConfig';
import { RequireLicense } from '../features/shop-management/RequireLicense';

export const router = createBrowserRouter([
  {
    path: '/onboarding',
    element: (
      <RequireRole allowedRoles={['ADMIN', 'USER', 'BARBER']}>
        <OnboardingPage />
      </RequireRole>
    ),
  },
  {
    path: '/',
    element: <RequireConfig />,
    children: [
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
      // Admin/Dashboard Routes (also require config)
      {
        path: '/dashboard',
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
            element: <RequireLicense />,
            children: [
              {
                path: 'appointments',
                element: <AppointmentsList />,
              },
            ],
          },
        ],
      },
    ],
  },
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
