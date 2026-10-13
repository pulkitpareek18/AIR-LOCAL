import type { DialogHTMLAttributes, HTMLAttributes } from 'react';
import { cn } from './utils';
export function Dialog({ className, ...props }: DialogHTMLAttributes<HTMLDialogElement>) { return <dialog className={cn('rounded-lg border border-border bg-card p-0 text-card-foreground shadow-lg', className)} {...props} />; }
export function DialogContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn('p-6', className)} {...props} />; }
export const AlertDialog = Dialog;
export const AlertDialogContent = DialogContent;
