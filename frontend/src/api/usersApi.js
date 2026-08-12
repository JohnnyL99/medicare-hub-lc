import { apiClient } from './apiClient';
import { buildQueryParams, unwrapItemResponse, unwrapListResponse } from './queryParams';

const BASE_PATH = '/api/v1/users';

export const usersApi = {
  async list(filters = {}) {
    const response = await apiClient.get(BASE_PATH, {
      params: buildQueryParams(filters)
    });

    return unwrapListResponse(response);
  },

  async getById(id) {
    const response = await apiClient.get(`${BASE_PATH}/${id}`);

    return unwrapItemResponse(response);
  },

  async create(payload) {
    const response = await apiClient.post(BASE_PATH, payload);

    return unwrapItemResponse(response);
  },

  async update(id, payload) {
    const response = await apiClient.put(`${BASE_PATH}/${id}`, payload);

    return unwrapItemResponse(response);
  },

  async updateStatus(id, isActive) {
    const response = await apiClient.patch(`${BASE_PATH}/${id}/status`, {
      isActive
    });

    return unwrapItemResponse(response);
  },

  async updatePassword(id, password) {
    const response = await apiClient.patch(`${BASE_PATH}/${id}/password`, {
      password
    });

    return unwrapItemResponse(response);
  }
};
