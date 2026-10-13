import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './utils';
export const Switch = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, type = 'checkbox', ...props }, ref) => <input ref={ref} type={type} role="switch" className={cn('h-4 w-4 accent-primary', className)} {...props} />);
Switch.displayName = 'Switch';
export const Checkbox = Switch;
