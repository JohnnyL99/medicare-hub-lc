import { apiClient } from './apiClient';
import { unwrapItemResponse } from './queryParams';

const DOCTORS_BASE_PATH = '/api/v1/doctors';
const AVAILABILITIES_BASE_PATH = '/api/v1/availabilities';

export const availabilityApi = {
  async listByDoctor(doctorId) {
    const response = await apiClient.get(`${DOCTORS_BASE_PATH}/${doctorId}/availabilities`);

    return unwrapItemResponse(response);
  },

  async createForDoctor(doctorId, payload) {
    const response = await apiClient.post(`${DOCTORS_BASE_PATH}/${doctorId}/availabilities`, payload);

    return unwrapItemResponse(response);
  },

  async update(id, payload) {
    const response = await apiClient.put(`${AVAILABILITIES_BASE_PATH}/${id}`, payload);

    return unwrapItemResponse(response);
  },

  async remove(id) {
    const response = await apiClient.delete(`${AVAILABILITIES_BASE_PATH}/${id}`);

    return unwrapItemResponse(response);
  }
};
