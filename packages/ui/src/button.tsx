import * as React from 'react'
import { cn } from './utils.js'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          // Plain design: flat colors, sharp borders, no glass or gradient
          variant === 'primary' && 'bg-[#09090b] text-[#fafafa] hover:bg-[#27272a]',
          variant === 'secondary' && 'bg-[#f4f4f5] text-[#09090b] hover:bg-[#e4e4e7]',
          variant === 'outline' && 'border border-[#e4e4e7] bg-white hover:bg-[#f4f4f5] text-[#09090b]',
          variant === 'ghost' && 'hover:bg-[#f4f4f5] text-[#71717a] hover:text-[#09090b]',
          variant === 'destructive' && 'bg-[#ef4444] text-[#fafafa] hover:bg-[#dc2626]',
          size === 'sm' && 'h-8 px-3 text-xs rounded-sm',
          size === 'md' && 'h-10 px-4 text-sm rounded-md',
          size === 'lg' && 'h-12 px-6 text-base rounded-lg',
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
