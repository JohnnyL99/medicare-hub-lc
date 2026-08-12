export function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    data
  });
}

export function sendPaginated(res, data, meta, statusCode = 200) {
  const page = meta.page || 1;
  const pageSize = meta.pageSize || data.length;
  const totalItems = meta.totalItems || 0;
  const totalPages =
    meta.totalPages || (pageSize > 0 ? Math.ceil(totalItems / pageSize) : 0);

  return res.status(statusCode).json({
    data,
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages
    }
  });
}
