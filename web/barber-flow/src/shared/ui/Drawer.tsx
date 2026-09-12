import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Link, useLocation } from 'react-router';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Drawer({ isOpen, onClose }: DrawerProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  const menuItems = [
    !isHome && { label: 'Início', href: '/' },
    { label: 'Sobre Nós', href: '/sobre' },
    { label: 'Loja', href: '/loja' },
    { label: 'Contato', href: '/contato' },
    { label: 'Acessar Conta', href: '/login', isAuth: true },
  ].filter(Boolean) as { label: string; href: string; isAuth?: boolean }[];

  const variants = {
    initial: { x: '100%' },
    animate: { x: 0, transition: { type: 'spring', damping: 20, stiffness: 80 } },
    exit: { x: '100%', transition: { type: 'spring', damping: 20, stiffness: 80 } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-shop-900/90 backdrop-blur-sm"
          />

          {/* Drawer Content */}
          <motion.div
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-y-0 right-0 z-50 w-full md:w-[400px] bg-shop-900 border-l border-leather-800 shadow-2xl flex flex-col"
          >
            <div className="flex justify-end p-6">
              <button
                onClick={onClose}
                className="text-chrome-400 hover:text-leather-500 transition-colors"
              >
                <X size={32} />
              </button>
            </div>

            <nav className="flex-1 flex flex-col justify-center items-center gap-8 p-8">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={`text-3xl font-serif font-bold tracking-widest uppercase transition-all hover:text-leather-500 hover:scale-105 ${
                    item.isAuth ? 'text-leather-700 mt-8' : 'text-chrome-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="p-8 text-center text-chrome-400 text-sm font-sans tracking-wide">
              <p>&copy; {new Date().getFullYear()} BarberFlow</p>
              <p className="mt-2">Clássico. Moderno. Eterno.</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
