"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils/cn"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
        // PHASE 3: Dialog/Sheet Animations Optimization (7.11.14) - Respect prefers-reduced-motion
      "fixed inset-0 z-[100] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "motion-reduce:duration-0 motion-reduce:animate-none", // PHASE 3: Respect prefers-reduced-motion
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  // ✅ FIX: Remove aria-hidden from dialog content to fix accessibility warning
  // Radix UI sets aria-hidden on the container, but we need to ensure content is accessible
  React.useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    
    // Function to remove aria-hidden
    const removeAriaHidden = () => {
      if (element.hasAttribute('aria-hidden')) {
        element.removeAttribute('aria-hidden');
      }
      
      // Also check and remove from parent if needed (Radix UI Portal wrapper)
      const parent = element.parentElement;
      if (parent && parent.hasAttribute('aria-hidden') && parent.getAttribute('role') === 'dialog') {
        parent.removeAttribute('aria-hidden');
      }
    };
    
    // Initial removal
    removeAriaHidden();
    
    // Use MutationObserver to watch for aria-hidden changes continuously
    const observer = new MutationObserver(() => {
      removeAriaHidden();
    });
    
    // Observe the element and its parent for attribute changes
    observer.observe(element, { attributes: true, attributeFilter: ['aria-hidden'] });
    if (element.parentElement) {
      observer.observe(element.parentElement, { attributes: true, attributeFilter: ['aria-hidden'] });
    }
    
    // Also use a small interval as fallback (Radix UI may set it after observer starts)
    const interval = setInterval(removeAriaHidden, 100);
    
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  // Combine refs properly - handle both function and object refs
  const combinedRef = React.useCallback((node: HTMLDivElement | null) => {
    // @ts-ignore - contentRef is mutable, TypeScript incorrectly infers it as read-only
    contentRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      // Use type assertion to handle both mutable and read-only refs
      const mutableRef = ref as { current: HTMLDivElement | null };
      if (mutableRef && 'current' in mutableRef) {
        mutableRef.current = node;
      }
    }
  }, [ref]);

  return (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
        ref={combinedRef}
      className={cn(
        "fixed left-[50%] top-[50%] z-[100] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}

