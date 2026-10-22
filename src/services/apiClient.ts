import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1/', 
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});