import type { HTMLAttributes } from 'react';
import { cn } from './utils';
export function Separator({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div role="separator" className={cn('shrink-0 bg-border h-px w-full', className)} {...props} />; }
