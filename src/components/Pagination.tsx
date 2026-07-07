interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between pt-3 mt-1 border-t border-border">
      <span className="text-[11.5px] text-muted">
        {total === 0 ? 'No results' : `${rangeStart}-${rangeEnd} of ${total}`}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="text-[12px] font-bold px-3 py-[6px] rounded-lg border border-border text-text bg-card cursor-pointer transition-colors duration-150 hover:bg-bg disabled:opacity-40 disabled:cursor-default disabled:hover:bg-card"
        >
          Prev
        </button>
        <span className="text-[11.5px] text-muted">Page {page} of {totalPages}</span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="text-[12px] font-bold px-3 py-[6px] rounded-lg border border-border text-text bg-card cursor-pointer transition-colors duration-150 hover:bg-bg disabled:opacity-40 disabled:cursor-default disabled:hover:bg-card"
        >
          Next
        </button>
      </div>
    </div>
  );
}
