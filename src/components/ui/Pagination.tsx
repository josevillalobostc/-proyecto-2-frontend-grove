import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  size: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

const PAGE_SIZES = [10, 20, 25, 50];

export default function Pagination({
  page,
  totalPages,
  totalElements,
  size,
  onPageChange,
  onSizeChange,
}: PaginationProps) {
  const from = page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 text-sm text-gray-400">
      <div className="flex items-center gap-2">
        <span>Mostrar</span>
        <select
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="bg-grove-surface border border-grove-border rounded px-2 py-1 text-white focus:outline-none focus:border-grove-green"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span>por página</span>
      </div>

      <span>{totalElements === 0 ? 'Sin resultados' : `${from}–${to} de ${totalElements}`}</span>

      <div className="flex items-center gap-1">
        <button
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          className="p-1.5 rounded hover:bg-grove-surface disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-grove-green text-grove-dark'
                  : 'hover:bg-grove-surface text-gray-400'
              }`}
            >
              {p + 1}
            </button>
          );
        })}
        <button
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          className="p-1.5 rounded hover:bg-grove-surface disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
