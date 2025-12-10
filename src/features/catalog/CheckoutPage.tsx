import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CreditCard, Wallet } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { useCartStore } from './cart.store';
import { useEffect, useState } from 'react';

const checkoutSchema = z.object({
  name: z.string().min(3, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  address: z.string().min(5, 'Endereço completo é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  zip: z.string().min(8, 'CEP inválido'),
  paymentMethod: z.enum(['CREDIT_CARD', 'PIX']),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products to calculate total (in real app, use SWR/React Query or pass via context)
  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.map((p: any) => ({ ...p, price: Number(p.price) })));
        setLoading(false);
      });
  }, []);

  const total = items.reduce((acc, item) => {
    const product = products.find((p) => p.id === item.productId);
    return acc + (product ? product.price * item.quantity : 0);
  }, 0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'CREDIT_CARD',
    },
  });

  const paymentMethod = watch('paymentMethod');

  const onSubmit = async (data: CheckoutForm) => {
    // Simulate API Call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('Order Data:', { ...data, items, total });

    // Success flow
    clearCart();
    navigate('/checkout/success');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-shop-900 flex items-center justify-center p-4">
        <p className="text-chrome-400">Carregando checkout...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-shop-900 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-serif text-chrome-100 mb-4">Seu carrinho está vazio</h2>
        <Button onClick={() => navigate('/loja')}>Voltar para Loja</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-shop-900 bg-noise pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/loja')}
          className="mb-8 text-chrome-400 hover:text-white pl-0"
        >
          <ArrowLeft className="mr-2" size={20} />
          Voltar para Loja
        </Button>

        <h1 className="text-3xl font-serif text-chrome-100 mb-8">Finalizar Pedido</h1>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-8">
            <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Info */}
              <section className="bg-shop-800/30 border border-leather-800/30 p-6 rounded-sm">
                <h3 className="text-lg font-serif text-leather-500 mb-4 uppercase tracking-wider">
                  Dados de Entrega
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-chrome-400 mb-1">
                      Nome Completo
                    </label>
                    <input
                      {...register('name')}
                      className="w-full bg-shop-900 border border-leather-800/30 rounded-sm px-4 py-2 text-chrome-100 focus:outline-none focus:border-leather-500 transition-colors"
                      placeholder="Ex: João da Silva"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-chrome-400 mb-1">
                      Email
                    </label>
                    <input
                      {...register('email')}
                      className="w-full bg-shop-900 border border-leather-800/30 rounded-sm px-4 py-2 text-chrome-100 focus:outline-none focus:border-leather-500 transition-colors"
                      placeholder="seu@email.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-chrome-400 mb-1">
                      Endereço
                    </label>
                    <input
                      {...register('address')}
                      className="w-full bg-shop-900 border border-leather-800/30 rounded-sm px-4 py-2 text-chrome-100 focus:outline-none focus:border-leather-500 transition-colors"
                      placeholder="Rua, Número, Complemento"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-chrome-400 mb-1">
                      Cidade
                    </label>
                    <input
                      {...register('city')}
                      className="w-full bg-shop-900 border border-leather-800/30 rounded-sm px-4 py-2 text-chrome-100 focus:outline-none focus:border-leather-500 transition-colors"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-chrome-400 mb-1">
                      CEP
                    </label>
                    <input
                      {...register('zip')}
                      className="w-full bg-shop-900 border border-leather-800/30 rounded-sm px-4 py-2 text-chrome-100 focus:outline-none focus:border-leather-500 transition-colors"
                      placeholder="00000-000"
                    />
                    {errors.zip && (
                      <p className="text-red-500 text-xs mt-1">{errors.zip.message}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Payment Info */}
              <section className="bg-shop-800/30 border border-leather-800/30 p-6 rounded-sm">
                <h3 className="text-lg font-serif text-leather-500 mb-4 uppercase tracking-wider">
                  Pagamento
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <label
                    className={`cursor-pointer border p-4 rounded-sm flex flex-col items-center gap-2 transition-all ${paymentMethod === 'CREDIT_CARD' ? 'border-leather-500 bg-leather-500/10 text-white' : 'border-leather-800/30 text-chrome-400 hover:border-leather-600'}`}
                  >
                    <input
                      type="radio"
                      value="CREDIT_CARD"
                      {...register('paymentMethod')}
                      className="hidden"
                    />
                    <CreditCard size={24} />
                    <span className="font-bold text-sm">Cartão de Crédito</span>
                  </label>
                  <label
                    className={`cursor-pointer border p-4 rounded-sm flex flex-col items-center gap-2 transition-all ${paymentMethod === 'PIX' ? 'border-leather-500 bg-leather-500/10 text-white' : 'border-leather-800/30 text-chrome-400 hover:border-leather-600'}`}
                  >
                    <input
                      type="radio"
                      value="PIX"
                      {...register('paymentMethod')}
                      className="hidden"
                    />
                    <Wallet size={24} />
                    <span className="font-bold text-sm">PIX</span>
                  </label>
                </div>

                {paymentMethod === 'CREDIT_CARD' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <input
                      placeholder="Número do Cartão"
                      className="w-full bg-shop-900 border border-leather-800/30 rounded-sm px-4 py-2 text-chrome-100"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        placeholder="Validade (MM/AA)"
                        className="w-full bg-shop-900 border border-leather-800/30 rounded-sm px-4 py-2 text-chrome-100"
                      />
                      <input
                        placeholder="CVV"
                        className="w-full bg-shop-900 border border-leather-800/30 rounded-sm px-4 py-2 text-chrome-100"
                      />
                    </div>
                    <input
                      placeholder="Nome no Cartão"
                      className="w-full bg-shop-900 border border-leather-800/30 rounded-sm px-4 py-2 text-chrome-100"
                    />
                  </div>
                )}
                {paymentMethod === 'PIX' && (
                  <div className="text-center p-8 bg-shop-900 rounded-sm animate-in fade-in">
                    <p className="text-chrome-300 text-sm">
                      O QR Code será gerado na próxima etapa.
                    </p>
                  </div>
                )}
              </section>
            </form>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <div className="bg-shop-800/50 border border-leather-800 p-6 rounded-sm sticky top-8">
              <h3 className="text-xl font-serif text-chrome-100 mb-6 border-b border-leather-800/50 pb-4">
                Resumo do Pedido
              </h3>

              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto custom-scrollbar">
                {items.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  if (!product) return null;
                  return (
                    <div key={item.productId} className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <span className="text-chrome-300 block">{product.name}</span>
                        <span className="text-chrome-500 text-xs">Qtd: {item.quantity}</span>
                      </div>
                      <span className="text-chrome-200 font-medium ml-4">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(product.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-leather-800/50 pt-4 space-y-2 mb-8">
                <div className="flex justify-between text-chrome-400 text-sm">
                  <span>Subtotal</span>
                  <span>
                    {' '}
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      total,
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-chrome-400 text-sm">
                  <span>Frete</span>
                  <span className="text-green-500">Grátis</span>
                </div>
                <div className="flex justify-between text-xl font-serif text-chrome-100 font-bold pt-2 border-t border-leather-800/30 mt-2">
                  <span>Total</span>
                  <span>
                    {' '}
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      total,
                    )}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                form="checkout-form"
                className="w-full py-4 text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processando...' : 'Confirmar Pagamento'}
              </Button>
              <p className="text-xs text-chrome-500 text-center mt-4">
                Ambiente seguro. Seus dados estão protegidos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
