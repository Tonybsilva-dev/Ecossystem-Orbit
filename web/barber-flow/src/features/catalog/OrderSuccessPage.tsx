import { useNavigate } from 'react-router';
import { Button } from '@/shared/ui/Button';
import { CheckCircle2, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

export function OrderSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-shop-900 bg-noise flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-shop-800/50 border border-leather-800 p-8 rounded-sm text-center relative overflow-hidden"
      >
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-green-500/20 blur-3xl rounded-full" />

        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30"
          >
            <CheckCircle2 size={40} className="text-green-500" />
          </motion.div>

          <h1 className="text-3xl font-serif text-chrome-100 mb-2">Pedido Confirmado!</h1>
          <p className="text-chrome-400 mb-8">
            Obrigado pela sua compra. Enviamos os detalhes do pedido #8392 para o seu email.
          </p>

          <div className="space-y-3">
            <Button onClick={() => navigate('/loja')} className="w-full">
              <ShoppingBag className="mr-2" size={18} />
              Continuar Comprando
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
              Voltar para Início
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
