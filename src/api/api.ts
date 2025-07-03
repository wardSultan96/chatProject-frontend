import axios from 'axios';
import { API_BASE_URL } from '../config/config';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Auto-set token if found
const token = localStorage.getItem('token');
if (token) {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default axiosInstance;
