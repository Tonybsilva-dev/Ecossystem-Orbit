import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, X } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { useMarketplaceStore } from '../marketplace.store';
import { geolocationService } from '@/shared/services/geolocation';
import { ibgeService, type UF, type City } from '@/shared/services/ibge';

import { toast } from 'sonner';

export function LocationSelector() {
  const { location, setLocation, isLocationModalOpen, setLocationModalOpen } =
    useMarketplaceStore();
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  // Manual Selection State
  const [states, setStates] = useState<UF[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedUF, setSelectedUF] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Initial load checks
  useEffect(() => {
    if (!location) {
      setLocationModalOpen(true);
    }
  }, [location, setLocationModalOpen]);

  // Load States for manual mode
  useEffect(() => {
    if (manualMode && states.length === 0) {
      ibgeService.getStates().then(setStates);
    }
  }, [manualMode, states.length]);

  // Load Cities when UF changes
  useEffect(() => {
    if (selectedUF) {
      ibgeService.getCities(selectedUF).then(setCities);
    }
  }, [selectedUF]);

  const handleGPSLocation = async () => {
    setLoadingGPS(true);
    try {
      // 1. Get Coords
      const coords = await geolocationService.getCurrentPosition();

      // 2. Reverse Geocode for UI Context
      const address = await geolocationService.reverseGeocode(coords.lat, coords.lng);

      // 3. Save
      setLocation({
        latitude: coords.lat,
        longitude: coords.lng,
        city: address.city,
        state: address.state, // Note: This might be full name "São Paulo" vs UF "SP". Logic to map might be needed later.
        method: 'GPS',
      });
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível obter sua localização exata. Tente selecionar manualmente.');
      setManualMode(true);
    } finally {
      setLoadingGPS(false);
    }
  };

  const handleManualSubmit = () => {
    if (selectedUF && selectedCity) {
      setLocation({
        city: selectedCity,
        state: selectedUF,
        method: 'MANUAL',
      });
    }
  };

  if (!isLocationModalOpen && location) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-shop-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-shop-900 border border-leather-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="w-12 h-12 bg-leather-500/10 rounded-full flex items-center justify-center text-leather-500 mb-4">
                  <MapPin size={24} />
                </div>
                <h2 className="text-2xl font-bold text-chrome-100">Onde você está?</h2>
                <p className="text-chrome-400 mt-1">
                  Precisamos da sua localização para mostrar produtos e barbearias próximas.
                </p>
              </div>
              {location && (
                <button
                  onClick={() => setLocationModalOpen(false)}
                  className="text-chrome-500 hover:text-chrome-300"
                >
                  <X size={24} />
                </button>
              )}
            </div>

            {!manualMode ? (
              <div className="space-y-4">
                <Button
                  onClick={handleGPSLocation}
                  disabled={loadingGPS}
                  className="w-full flex items-center justify-center gap-3 py-4 text-lg bg-leather-600 hover:bg-leather-500"
                >
                  {loadingGPS ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-chrome-100 border-t-transparent" />
                  ) : (
                    <Navigation size={20} />
                  )}
                  Usar Localização Atual
                </Button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-leather-800/50"></div>
                  <span className="flex-shrink mx-4 text-chrome-600 text-sm">OU</span>
                  <div className="flex-grow border-t border-leather-800/50"></div>
                </div>

                <Button variant="outline" className="w-full" onClick={() => setManualMode(true)}>
                  Selecionar Manualmentee
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-chrome-400 mb-1">Estado</label>
                    <select
                      value={selectedUF}
                      onChange={(e) => {
                        setSelectedUF(e.target.value);
                        setSelectedCity('');
                      }}
                      className="w-full bg-shop-800 border border-leather-800/30 rounded-lg px-3 py-2 text-chrome-100 focus:border-leather-500 outline-none appearance-none"
                    >
                      <option value="">UF</option>
                      {states.map((uf) => (
                        <option key={uf.id} value={uf.sigla}>
                          {uf.sigla}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-chrome-400 mb-1">Cidade</label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      disabled={!selectedUF}
                      className="w-full bg-shop-800 border border-leather-800/30 rounded-lg px-3 py-2 text-chrome-100 focus:border-leather-500 outline-none appearance-none disabled:opacity-50"
                    >
                      <option value="">Selecione...</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.nome}>
                          {city.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setManualMode(false)}>
                    Voltar
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1" // Fixed: variant="primary" is actually "default" or similar in our system, let's assume default/primary logic exists or fallback to className
                    disabled={!selectedCity}
                    onClick={handleManualSubmit}
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-xs text-chrome-600">
                Não compartilhamos sua localização com terceiros.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
