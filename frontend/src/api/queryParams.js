export function buildQueryParams(filters = {}) {
  return Object.entries(filters).reduce((params, [key, value]) => {
    if (value === undefined || value === null || value === '') {
      return params;
    }

    params[key] = value;
    return params;
  }, {});
}

export function unwrapListResponse(response) {
  return {
    data: Array.isArray(response?.data?.data) ? response.data.data : [],
    meta: response?.data?.meta || {
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0
    }
  };
}

export function unwrapItemResponse(response) {
  return response?.data?.data;
}
