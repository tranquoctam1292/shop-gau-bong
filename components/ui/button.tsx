'use client';

import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';
import { buttonVariants } from '@/lib/utils/button-variants';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // asChild đã bị loại bỏ để tránh hydration mismatch
  // Sử dụng Link trực tiếp với buttonVariants thay vì Button asChild
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    const buttonClasses = cn(buttonVariants({ variant, size, className }));

    // Render button bình thường - không còn hỗ trợ asChild
    // Để sử dụng Link với button styling, dùng:
    // <Link href="/path" className={buttonVariants({ variant, size })}>Text</Link>
    
    // Removed normalizedChildren logic - fix hydration error at source (CartDrawer)
    // Render children trực tiếp như bình thường

    return (
      <button
        className={buttonClasses}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
export { buttonVariants } from '@/lib/utils/button-variants';

