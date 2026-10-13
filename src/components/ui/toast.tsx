import type { HTMLAttributes } from 'react';
import { cn } from './utils';
export function Toast({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div role="status" className={cn('rounded-lg border border-border bg-popover p-3 text-sm shadow-lg', className)} {...props} />; }
export function Toaster({ children }: { children?: React.ReactNode }) { return <div id="toastRegion" className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2">{children}</div>; }
