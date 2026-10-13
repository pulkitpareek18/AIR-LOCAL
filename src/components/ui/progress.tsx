import type { HTMLAttributes } from 'react';
import { cn } from './utils';
export function Progress({ value = 0, className, ...props }: HTMLAttributes<HTMLDivElement> & { value?: number }) { return <div className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)} {...props}><div className="h-full w-full flex-1 bg-primary transition-all" style={{ transform: `translateX(-${100 - value}%)` }} /></div>; }
