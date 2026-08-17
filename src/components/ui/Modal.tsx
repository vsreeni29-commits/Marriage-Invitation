import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A dialog that behaves like one.
 *
 * Render it only while it should be open. Escape and the backdrop both close
 * it, focus is trapped inside while it is up and returned to whatever opened it
 * on the way out, and the page behind cannot scroll away underneath.
 *
 * It renders through a portal on `document.body`: sections on this page create
 * their own stacking contexts, and a dialog nested inside one cannot lift
 * itself above the floating controls no matter what z-index it claims.
 */
export function Modal({ title, onClose, children, className }: ModalProps) {
  const dialog = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const titleId = useId();

  // Remember the trigger before focus moves, and give it back on close.
  useEffect(() => {
    opener.current = document.activeElement;
    const first = dialog.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialog.current)?.focus();

    return () => {
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, []);

  useEffect(() => {
    const { style } = document.body;
    const previous = style.overflow;
    style.overflow = 'hidden';
    return () => {
      style.overflow = previous;
    };
  }, []);

  const onKeyDown = useCallback(
    (keyEvent: React.KeyboardEvent<HTMLDivElement>) => {
      if (keyEvent.key === 'Escape') {
        keyEvent.stopPropagation();
        onClose();
        return;
      }
      if (keyEvent.key !== 'Tab') return;

      const items = Array.from(dialog.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (keyEvent.shiftKey && (active === first || active === dialog.current)) {
        keyEvent.preventDefault();
        last.focus();
      } else if (!keyEvent.shiftKey && active === last) {
        keyEvent.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  return createPortal(
    <div className="modal" role="presentation" onKeyDown={onKeyDown}>
      <div className="modal__scrim" onClick={onClose} aria-hidden="true" />
      <div
        className={`modal__panel ${className ?? ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialog}
        tabIndex={-1}
      >
        <div className="modal__head">
          <h2 className="modal__title" id={titleId}>
            {title}
          </h2>
          <button type="button" className="modal__close" onClick={onClose}>
            <span aria-hidden="true">×</span>
            <span className="visually-hidden">Close</span>
          </button>
        </div>

        <div className="modal__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
