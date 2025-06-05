import axios from 'axios';

const API_BASE_URL = 'http://YOUR_BACKEND_URL/api/auth';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
