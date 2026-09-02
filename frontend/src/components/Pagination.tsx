import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
}) => {
  if (totalItems === 0 || totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate pagination buttons
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="pagination-container">
      <div className="pagination-summary">
        Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of <strong>{totalItems}</strong>
      </div>
      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn nav-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous Page"
        >
          &larr; Previous
        </button>

        <div className="pagination-pages">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              className={`pagination-btn page-num ${p === currentPage ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === currentPage ? 'page' : undefined}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="pagination-btn nav-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next Page"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
};