import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 py-8">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 min-w-[48px] rounded-lg border border-neutral-border text-text-secondary hover:text-text-primary hover:border-brand-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Page Numbers */}
      <div className="hidden sm:flex items-center gap-2">
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-text-muted">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-4 py-2 min-w-[48px] rounded-lg border transition-all ${
                currentPage === page
                  ? 'bg-brand-gold text-brand-black font-bold border-brand-gold'
                  : 'border-neutral-border text-text-secondary hover:text-text-primary hover:border-brand-gold'
              }`}
            >
              {page}
            </button>
          )
        ))}
      </div>

      {/* Mobile: Show only current page */}
      <div className="sm:hidden px-4 py-2 text-text-primary">
        {currentPage} / {totalPages}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 min-w-[48px] rounded-lg border border-neutral-border text-text-secondary hover:text-text-primary hover:border-brand-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}