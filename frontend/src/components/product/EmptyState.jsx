import { Package } from 'lucide-react';

export default function EmptyState({ message = "No products found" }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Package className="w-16 h-16 text-text-muted mb-4" />
      <h3 className="text-2xl font-semibold text-text-primary mb-2">
        {message}
      </h3>
      <p className="text-text-secondary text-center max-w-md">
        Try adjusting your search or filters to find what you're looking for.
      </p>
    </div>
  );
}