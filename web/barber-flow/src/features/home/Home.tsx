import { Button } from '@/shared/ui/Button';

export function Home() {
  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-5xl md:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-br from-chrome-100 to-chrome-400 drop-shadow-lg">
        Cortes Clássicos, <br /> Estilo Moderno.
      </h1>
      <p className="text-lg text-chrome-400 mb-8 max-w-2xl">
        Experimente os melhores serviços de barbearia em uma atmosfera vintage. Agende seu horário
        ou compre nossos produtos premium.
      </p>
      <div className="flex gap-4">
        <Button size="lg">Agendar Horário</Button>
        <Button variant="outline" size="lg">
          Ver Produtos
        </Button>
      </div>
    </div>
  );
}
