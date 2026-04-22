/**
 * Purpose: Animated placeholder card shown while product data is loading.
 */
export default function ProductCardSkeleton() {
  return (
    <div className="bg-surface-card rounded-lg overflow-hidden border border-neutral-border animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square bg-surface-dark" />

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Brand */}
        <div className="h-3 bg-surface-dark rounded w-1/3" />
        
        {/* Product Name */}
        <div className="space-y-2">
          <div className="h-4 bg-surface-dark rounded w-full" />
          <div className="h-4 bg-surface-dark rounded w-2/3" />
        </div>

        {/* Price */}
        <div className="h-8 bg-surface-dark rounded w-1/2" />

        {/* Button */}
        <div className="h-12 bg-surface-dark rounded" />
      </div>
    </div>
  );
}