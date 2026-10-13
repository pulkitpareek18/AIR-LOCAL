/// <reference types="vite/client" />

declare const lucide: { createIcons: () => void };
declare const QRCode: { new (element: HTMLElement, options: Record<string, unknown>): unknown; CorrectLevel: { M: number } };

declare global {
  interface Window {
    lucide: typeof lucide;
    QRCode: typeof QRCode;
    __dbg?: string[];
  }
}
export {};
