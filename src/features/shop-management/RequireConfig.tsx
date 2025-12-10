import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { useBarbershopStore } from '../shop-management/barbershop.store';
import { useSession } from '@/features/auth/client';
import { Loader2 } from 'lucide-react';

export function RequireConfig() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading: shopLoading, fetchBarbershop } = useBarbershopStore();
  const { data: session, isPending: authLoading } = useSession();

  useEffect(() => {
    fetchBarbershop();
  }, []);

  const isLoading = shopLoading || authLoading;

  useEffect(() => {
    if (!isLoading && !data && location.pathname !== '/onboarding') {
      if (session) {
        navigate('/onboarding');
      }
      // If no session, we stay here (render Outlet).
      // Ideally, the Home page handles the "empty" state or shows a generic landing.
    }
  }, [isLoading, data, session, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-shop-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-leather-500" size={32} />
      </div>
    );
  }

  return <Outlet />;
}
