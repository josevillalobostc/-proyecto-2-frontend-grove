import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function usePagination(defaultSize = 20) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '0', 10);
  const size = parseInt(searchParams.get('size') || String(defaultSize), 10);

  const setPage = useCallback((p: number) => {
    setSearchParams((prev) => {
      prev.set('page', String(p));
      return prev;
    });
  }, [setSearchParams]);

  const setSize = useCallback((s: number) => {
    setSearchParams((prev) => {
      prev.set('size', String(s));
      prev.set('page', '0');
      return prev;
    });
  }, [setSearchParams]);

  return { page, size, setPage, setSize };
}

export function usePaginationLocal(defaultSize = 20) {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(defaultSize);
  return { page, size, setPage, setSize };
}
