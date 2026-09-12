import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-sm text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leather-700 disabled:pointer-events-none disabled:opacity-50 tracking-wider uppercase',
  {
    variants: {
      variant: {
        default:
          'bg-leather-700 text-white hover:bg-leather-800 shadow-[0_4px_0_0_#92400e] hover:shadow-[0_2px_0_0_#92400e] hover:translate-y-[2px] active:translate-y-[4px] active:shadow-none border border-leather-800',
        outline:
          'border-2 border-chrome-400 bg-transparent hover:bg-chrome-400/10 text-chrome-100 hover:text-white hover:border-chrome-100',
        ghost: 'hover:bg-shop-800 text-chrome-300 hover:text-white',
        link: 'text-leather-700 underline-offset-4 hover:underline',
        chrome:
          'bg-gradient-to-b from-chrome-100 to-chrome-300 text-shop-900 hover:from-white hover:to-chrome-200 shadow-md shadow-chrome-900/20 border border-chrome-400 font-bold',
      },
      size: {
        default: 'h-10 px-6 py-2',
        sm: 'h-9 rounded-sm px-3',
        lg: 'h-12 rounded-sm px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
