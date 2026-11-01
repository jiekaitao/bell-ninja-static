'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface SheetProps {
  open: boolean;
  tone: 'help' | 'about' | 'report';
  label: string;
  /** Escape, the close button, or a click outside: closes one layer. */
  onDismiss: () => void;
  children: ReactNode;
}

/* A native <dialog>: it keeps focus inside, makes the page behind inert, gives
   focus back on close, and handles Escape. */
export default function Sheet({ open, tone, label, onDismiss, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={'sheet sheet-' + tone}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      onClose={() => {
        /* Browsers can close a dialog themselves on a repeated Escape. */
        if (open) onDismiss();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onDismiss();
      }}
    >
      <div className="sheet-frame">
        <button type="button" className="sheet-close" onClick={onDismiss} aria-label="Close">&times;</button>
        {children}
      </div>
    </dialog>
  );
}
