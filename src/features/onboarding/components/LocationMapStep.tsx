import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { LocationPickerMap } from '@/shared/ui/LocationPickerMap';
import { CheckCircle2 } from 'lucide-react';

export function LocationMapStep() {
  const { setValue, watch } = useFormContext();

  // Initialize from form values if present (e.g. if navigating back)
  const initialLat = watch('latitude');
  const initialLng = watch('longitude');

  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null,
  );

  useEffect(() => {
    if (position) {
      setValue('latitude', position[0]);
      setValue('longitude', position[1]);
    }
  }, [position, setValue]);

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-lg font-medium text-chrome-200">Confirme a Localização</h3>
        <p className="text-sm text-chrome-500">
          Clique no mapa para marcar a posição exata da barbearia.
        </p>
      </div>
      <div className="h-[350px] w-full rounded-md border border-leather-800/30 overflow-hidden relative z-0">
        <LocationPickerMap position={position} setPosition={setPosition} />
      </div>
      {/* Visual feedback if location selected */}
      {position ? (
        <p className="text-center text-xs text-green-500 flex items-center justify-center gap-1 mt-2">
          <CheckCircle2 size={14} /> Localização selecionada: {position[0].toFixed(4)},{' '}
          {position[1].toFixed(4)}
        </p>
      ) : (
        <p className="text-center text-xs text-amber-500 mt-2">
          Por favor, selecione um ponto no mapa.
        </p>
      )}
    </div>
  );
}
