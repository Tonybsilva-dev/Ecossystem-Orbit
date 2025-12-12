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
    if (!isLoading && location.pathname !== '/onboarding') {
      // Priority Check: If user is logged in but has no barbershopId, force onboarding
      if (session && !session.user.barbershopId) {
        navigate('/onboarding');
        return;
      }

      // Secondary Check: If store data failed to load (and we expect it), redirect
      if (!data && session) {
        navigate('/onboarding');
      }
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
