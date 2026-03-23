import { useEffect, useRef } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

/**
 * A reusable confirmation dialog for destructive actions (delete, block, etc.).
 * Traps focus inside the dialog when open (basic a11y).
 *
 * @param {boolean}  open        - Whether the dialog is visible.
 * @param {string}   title       - Dialog heading.
 * @param {string}   description - Explanatory text.
 * @param {string}   confirmLabel - Label for the confirm button (default: "Confirm").
 * @param {boolean}  loading     - Whether the action is in-flight.
 * @param {function} onConfirm   - Called when the user confirms.
 * @param {function} onCancel    - Called when the user cancels or closes.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);

  // Auto-focus the confirm button when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay to let the element mount
      const t = setTimeout(() => confirmRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative bg-surface-card border border-neutral-border rounded-sm shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">

        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon + Title */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-red-500/10 rounded-sm flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="confirm-dialog-title"
              className="text-base font-medium text-text-primary"
            >
              {title}
            </h2>
            {description && (
              <p className="text-sm text-text-muted mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm text-text-secondary border border-neutral-border hover:border-text-secondary transition-colors rounded-sm disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  );
}