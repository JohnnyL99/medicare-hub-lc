import { useCallback, useEffect, useMemo, useState } from 'react';

function getSortField(sortModel, defaultSort) {
  if (sortModel.length > 0 && sortModel[0]?.field) {
    return sortModel[0].field;
  }

  return defaultSort.field;
}

function getSortDirection(sortModel, defaultSort) {
  if (sortModel.length > 0 && sortModel[0]?.sort) {
    return sortModel[0].sort;
  }

  return defaultSort.direction;
}

export function useServerCollection({
  fetcher,
  initialFilters,
  defaultSort = { field: 'createdAt', direction: 'desc' },
  sortFieldParam = 'orderBy',
  sortDirectionParam = 'sortOrder'
}) {
  const defaultSortField = defaultSort.field;
  const defaultSortDirection = defaultSort.direction;
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    pageSize: initialFilters.pageSize || 10,
    totalItems: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [paginationModel, setPaginationModel] = useState({
    page: (initialFilters.page || 1) - 1,
    pageSize: initialFilters.pageSize || 10
  });
  const [sortModel, setSortModel] = useState([
    {
      field: defaultSortField,
      sort: defaultSortDirection
    }
  ]);

  const requestParams = useMemo(
    () => ({
      ...filters,
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
      [sortFieldParam]: getSortField(sortModel, {
        field: defaultSortField,
        direction: defaultSortDirection
      }),
      [sortDirectionParam]: getSortDirection(sortModel, {
        field: defaultSortField,
        direction: defaultSortDirection
      })
    }),
    [
      defaultSortDirection,
      defaultSortField,
      filters,
      paginationModel.page,
      paginationModel.pageSize,
      sortDirectionParam,
      sortFieldParam,
      sortModel
    ]
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetcher(requestParams);

      setRows(response.data);
      setMeta(response.meta);
    } catch (requestError) {
      setError(requestError);
      setRows([]);
      setMeta((current) => ({
        ...current,
        totalItems: 0,
        totalPages: 0
      }));
    } finally {
      setLoading(false);
    }
  }, [fetcher, requestParams]);

  useEffect(() => {
    reload();
  }, [reload]);

  const updateFilters = useCallback((updater) => {
    setPaginationModel((current) => ({
      ...current,
      page: 0
    }));

    setFilters((current) =>
      typeof updater === 'function'
        ? {
            ...current,
            ...updater(current)
          }
        : {
            ...current,
            ...updater
          }
    );
  }, []);

  const updateRowById = useCallback((rowId, updater) => {
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        return typeof updater === 'function' ? updater(row) : { ...row, ...updater };
      })
    );
  }, []);

  return {
    rows,
    meta,
    loading,
    error,
    filters,
    sortModel,
    paginationModel,
    setSortModel,
    setPaginationModel,
    setFilters: updateFilters,
    updateRowById,
    reload
  };
}
