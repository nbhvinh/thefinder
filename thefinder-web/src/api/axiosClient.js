import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Bắt buộc để nhận và gửi Session Cookie (JSESSIONID)
});

export default axiosClient;
