import axios from 'axios';
import { CreatePollData, Poll, PollResults, SubmitResponseData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const pollApi = {
  // Create new poll
  createPoll: async (data: CreatePollData) => {
    const response = await api.post('/polls', data);
    return response.data.data;
  },

  // Get poll by host code
  getPollByHostCode: async (hostCode: string) => {
    const response = await api.get(`/polls/${hostCode}/host`);
    return response.data.data;
  },

  // Get poll by participant code
  getPollByParticipantCode: async (participantCode: string): Promise<Poll> => {
    const response = await api.get(`/polls/${participantCode}/join`);
    return response.data.data;
  },

  // Update poll status
  updatePollStatus: async (hostCode: string, status: string) => {
    const response = await api.put(`/polls/${hostCode}/status`, { status });
    return response.data.data;
  },

  // Submit responses
  submitResponses: async (participantCode: string, data: SubmitResponseData) => {
    const response = await api.post(`/polls/${participantCode}/responses`, data);
    return response.data.data;
  },

  // Get poll results
  getPollResults: async (hostCode: string): Promise<PollResults> => {
    const response = await api.get(`/polls/${hostCode}/results`);
    return response.data.data;
  },
};

export default api;
