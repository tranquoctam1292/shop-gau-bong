import { cva } from 'class-variance-authority';

// Button variants theo Design System
// Tách ra file riêng để có thể dùng trong cả Server và Client Components
export const buttonVariants = cva(
  // Base styles - Mobile First, touch target 44x44px minimum
  'inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 button-primary-gradient',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        accent: 'bg-accent text-accent-foreground hover:bg-accent/90',
        outline: 'border border-primary text-primary hover:bg-primary/10',
        ghost: 'hover:bg-accent/10 hover:text-accent',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        default: 'h-12 px-6 text-[15px]', // 48px height, theo DESIGN_SYSTEM.md
        sm: 'h-10 px-4 text-sm',
        lg: 'h-14 px-8 text-base',
        icon: 'h-12 w-12', // Minimum 44x44px touch target
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

