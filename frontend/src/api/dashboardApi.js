import { apiClient } from './apiClient';
import { buildQueryParams, unwrapItemResponse } from './queryParams';

const BASE_PATH = '/api/v1/dashboard';

export const dashboardApi = {
  async getSummary(filters = {}) {
    const response = await apiClient.get(`${BASE_PATH}/summary`, {
      params: buildQueryParams(filters)
    });

    return unwrapItemResponse(response);
  },

  async getAppointmentsTrend(filters = {}) {
    const response = await apiClient.get(`${BASE_PATH}/appointments-trend`, {
      params: buildQueryParams(filters)
    });

    return unwrapItemResponse(response);
  },

  async getBySpecialty(filters = {}) {
    const response = await apiClient.get(`${BASE_PATH}/by-specialty`, {
      params: buildQueryParams(filters)
    });

    return unwrapItemResponse(response);
  },

  async getUpcoming(filters = {}) {
    const response = await apiClient.get(`${BASE_PATH}/upcoming`, {
      params: buildQueryParams(filters)
    });

    return unwrapItemResponse(response);
  }
};
