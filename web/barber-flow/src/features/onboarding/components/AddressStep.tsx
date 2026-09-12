import { useEffect, useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { IMaskInput } from 'react-imask';
import { MASKS } from '@/shared/constants/masks';
import { Combobox } from '@/shared/ui/Combobox';
import { ibgeService, type UF, type City } from '@/shared/services/ibge';

export function AddressStep() {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const [states, setStates] = useState<UF[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const selectedState = watch('state');
  const zipCode = watch('zipCode');

  useEffect(() => {
    ibgeService.getStates().then(setStates);
  }, []);

  useEffect(() => {
    if (selectedState) {
      ibgeService.getCities(selectedState).then(setCities);
    }
  }, [selectedState]);

  useEffect(() => {
    const cleanCep = zipCode?.replace(/\D/g, '');
    if (cleanCep?.length === 8) {
      ibgeService.getAddressByCEP(cleanCep).then((data) => {
        if (data) {
          setValue('address', data.logradouro);
          setValue('neighborhood', data.bairro);
          setValue('state', data.uf);
          setValue('city', data.localidade);
        }
      });
    }
  }, [zipCode, setValue]);

  return (
    <div className="space-y-4">
      {/* Row 1: CEP, State, City */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="col-span-1">
          <label className="block text-sm font-medium text-chrome-300 mb-1">CEP</label>
          <Controller
            name="zipCode"
            control={control}
            render={({ field: { onChange, value, ref } }) => (
              <IMaskInput
                mask={MASKS.CEP}
                value={value}
                onAccept={(val: any) => onChange(val)}
                inputRef={ref}
                placeholder="00000-000"
                className="w-full bg-shop-900 border border-leather-800/30 rounded-md px-4 py-3 text-chrome-100 focus:border-leather-500 outline-none"
              />
            )}
          />
          {errors.zipCode && (
            <p className="text-red-500 text-sm mt-1">{String(errors.zipCode.message)}</p>
          )}
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium text-chrome-300 mb-1">Estado</label>
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <Combobox
                options={states.map((uf) => ({ label: uf.nome, value: uf.sigla }))}
                value={field.value}
                onChange={field.onChange}
                placeholder="UF"
              />
            )}
          />
          {errors.state && (
            <p className="text-red-500 text-sm mt-1">{String(errors.state.message)}</p>
          )}
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-chrome-300 mb-1">Cidade</label>
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <Combobox
                options={cities.map((city) => ({ label: city.nome, value: city.nome }))}
                value={field.value}
                onChange={field.onChange}
                disabled={!selectedState}
                placeholder="Selecione a cidade..."
              />
            )}
          />
          {errors.city && (
            <p className="text-red-500 text-sm mt-1">{String(errors.city.message)}</p>
          )}
        </div>
      </div>

      {/* Row 2: Street, Number */}
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3">
          <label className="block text-sm font-medium text-chrome-300 mb-1">Rua / Logradouro</label>
          <input
            {...register('address')}
            placeholder="Ex: Av. Paulista"
            className="w-full bg-shop-900 border border-leather-800/30 rounded-md px-4 py-3 text-chrome-100 focus:border-leather-500 outline-none"
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{String(errors.address.message)}</p>
          )}
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium text-chrome-300 mb-1">Número</label>
          <input
            {...register('number')}
            placeholder="123"
            className="w-full bg-shop-900 border border-leather-800/30 rounded-md px-4 py-3 text-chrome-100 focus:border-leather-500 outline-none"
          />
          {errors.number && (
            <p className="text-red-500 text-sm mt-1">{String(errors.number.message)}</p>
          )}
        </div>
      </div>

      {/* Row 3: Neighborhood, Complement */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-chrome-300 mb-1">Bairro</label>
          <input
            {...register('neighborhood')}
            placeholder="Ex: Centro"
            className="w-full bg-shop-900 border border-leather-800/30 rounded-md px-4 py-3 text-chrome-100 focus:border-leather-500 outline-none"
          />
          {errors.neighborhood && (
            <p className="text-red-500 text-sm mt-1">{String(errors.neighborhood.message)}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-chrome-300 mb-1">
            Complemento (Opcional)
          </label>
          <input
            {...register('complement')}
            placeholder="Ex: Apt 101"
            className="w-full bg-shop-900 border border-leather-800/30 rounded-md px-4 py-3 text-chrome-100 focus:border-leather-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
}
