import { apiClient } from './apiClient';
import { buildQueryParams, unwrapItemResponse, unwrapListResponse } from './queryParams';

const BASE_PATH = '/api/v1/doctors';

export const doctorsApi = {
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

  async getCurrent() {
    const response = await apiClient.get(`${BASE_PATH}/me`);

    return unwrapItemResponse(response);
  },

  async listAvailableForCurrent() {
    const response = await apiClient.get(`${BASE_PATH}/me/available-services`);

    return unwrapItemResponse(response);
  },

  async create(payload) {
    const response = await apiClient.post(BASE_PATH, payload);

    return unwrapItemResponse(response);
  },

  async update(id, payload) {
    const { medicalServiceIds = [], ...doctorPayload } = payload;
    const response = await apiClient.put(`${BASE_PATH}/${id}`, doctorPayload);

    if (Array.isArray(medicalServiceIds)) {
      await apiClient.put(`${BASE_PATH}/${id}/services`, {
        medicalServiceIds
      });
    }

    return unwrapItemResponse(response);
  },

  async updateStatus(id, isActive) {
    const response = await apiClient.patch(`${BASE_PATH}/${id}/status`, {
      isActive
    });

    return unwrapItemResponse(response);
  },

  async replaceServices(id, medicalServiceIds) {
    const response = await apiClient.put(`${BASE_PATH}/${id}/services`, {
      medicalServiceIds
    });

    return unwrapItemResponse(response);
  },

  async replaceCurrentServices(medicalServiceIds) {
    const response = await apiClient.put(`${BASE_PATH}/me/services`, {
      medicalServiceIds
    });

    return unwrapItemResponse(response);
  },

  async getAvailableSlots(doctorId, filters) {
    const response = await apiClient.get(`${BASE_PATH}/${doctorId}/available-slots`, {
      params: buildQueryParams(filters)
    });

    return unwrapItemResponse(response);
  }
};
