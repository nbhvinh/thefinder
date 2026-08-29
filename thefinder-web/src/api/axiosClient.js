import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:8080/api', // Địa chỉ backend Spring Boot của m
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Bắt buộc để nhận và gửi Session Cookie (JSESSIONID)
});

export default axiosClient;