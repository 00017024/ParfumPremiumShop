import { Package } from 'lucide-react';

/**
 * Generic empty state with an optional context-specific description.
 *
 * @param {string} message     - Primary heading. Defaults to "No products found".
 * @param {string} description - Supporting text. Defaults to the generic search hint.
 */
export default function EmptyState({
  message = 'No products found',
  description = "Try adjusting your search or filters to find what you're looking for.",
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Package className="w-16 h-16 text-text-muted mb-4" />
      <h3 className="text-2xl font-semibold text-text-primary mb-2">
        {message}
      </h3>
      <p className="text-text-secondary text-center max-w-md">
        {description}
      </p>
    </div>
  );
}