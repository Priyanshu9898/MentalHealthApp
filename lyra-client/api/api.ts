import axios from 'axios';
import {Platform} from 'react-native';

const API_BASE_URL =
  // On Android emulator use 10.0.2.2, on iOS simulator use localhost
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api/auth'
    : 'http://localhost:8000/api/auth';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
