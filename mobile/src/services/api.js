import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para injetar a Base URL dinâmica de forma assíncrona
api.interceptors.request.use(
  async (config) => {
    try {
      const savedIp = await AsyncStorage.getItem('server_ip');
      const savedPort = await AsyncStorage.getItem('server_port');
      
      const ip = savedIp || 'totalcap.vercel.app/api/v1'; 
      const port = savedPort || '';

      let baseURL;
      
      if (ip.includes('vercel.app') || ip.startsWith('http')) {
        baseURL = ip.startsWith('http') ? ip : `https://${ip}`;
      } else {
        const portSuffix = port ? `:${port}` : ':8000';
        baseURL = `http://${ip}${portSuffix}/api/v1/`;
      }
      
      config.baseURL = baseURL;
      console.log(`[API Request] BaseURL: ${config.baseURL}, Path: ${config.url}`);
      return config;
    } catch (error) {
      console.error('Erro ao recuperar configurações de IP:', error);
      config.baseURL = 'http://192.168.15.99:8000/api/v1/'; // fallback local
      return config;
    }
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Erro na API:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
