import { useSession } from '@/features/auth/client';
import { Navigate, Outlet, useLocation } from 'react-router';
import { motion } from 'framer-motion';

interface RequireRoleProps {
  allowedRoles: ('ADMIN' | 'BARBER' | 'USER')[];
  children?: React.ReactNode;
}

export function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const { data: session, isPending } = useSession();
  const location = useLocation();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-shop-900 text-leather-700">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="h-12 w-12 border-4 border-current border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Check if session exists
  if (!session) {
    // Redirect to login, saving the location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role
  // Note: better-auth session.user object structure might vary.
  // Custom Role field was added in config, assume it's available on session.user.role
  const userRole = (session.user as any).role;

  if (!allowedRoles.includes(userRole)) {
    // Role mismatch
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
