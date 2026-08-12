import { apiClient } from './apiClient';

export const authApi = {
  async login(payload) {
    const response = await apiClient.post('/api/v1/auth/login', payload, {
      _skipAuthRedirect: true
    });

    return response.data.data;
  },

  async getProfile() {
    const response = await apiClient.get('/api/v1/auth/me', {
      _skipAuthRedirect: true
    });

    return response.data.data;
  }
};
