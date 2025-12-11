import { useFormContext, Controller } from 'react-hook-form';
import { IMaskInput } from 'react-imask';
import { MASKS } from '@/shared/constants/masks';

export function BusinessInfoStep() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-chrome-300 mb-1">Nome da Barbearia</label>
        <input
          {...register('name')}
          placeholder="Ex: Flavinho Cuts"
          className="w-full bg-shop-900 border border-leather-800/30 rounded-md px-4 py-3 text-chrome-100 focus:border-leather-500 outline-none"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{String(errors.name.message)}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-chrome-300 mb-1">CNPJ (Opcional)</label>
          <Controller
            control={control}
            name="cnpj"
            render={({ field: { onChange, value, ref } }) => (
              <IMaskInput
                mask={MASKS.CNPJ}
                value={value}
                onAccept={(val: any) => onChange(val)}
                inputRef={ref}
                placeholder="00.000.000/0000-00"
                className="w-full bg-shop-900 border border-leather-800/30 rounded-md px-4 py-3 text-chrome-100 focus:border-leather-500 outline-none"
              />
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-chrome-300 mb-1">
            Telefone / WhatsApp
          </label>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value, ref } }) => (
              <IMaskInput
                mask={MASKS.PHONE}
                value={value}
                onAccept={(val: any) => onChange(val)}
                inputRef={ref}
                placeholder="(00) 00000-0000"
                className="w-full bg-shop-900 border border-leather-800/30 rounded-md px-4 py-3 text-chrome-100 focus:border-leather-500 outline-none"
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
