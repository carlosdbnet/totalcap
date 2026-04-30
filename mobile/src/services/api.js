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
      
      const ip = savedIp || 'totalcap.vercel.app/api/v1/'; 
      const port = savedPort || '';

      let baseURL;
      
      if (ip.includes('vercel.app') || ip.startsWith('http')) {
        baseURL = ip.startsWith('http') ? ip : `https://${ip}`;
        
        // Garante que o baseURL termine com / para facilitar verificações
        if (!baseURL.endsWith('/')) baseURL += '/';

        // Se for Vercel e não tiver /api/ nem /api/v1, adiciona /api/v1/
        const hasApiPrefix = baseURL.includes('/api/v1') || baseURL.includes('/api/');
        
        if (ip.includes('vercel.app') && !hasApiPrefix) {
          baseURL += 'api/v1/';
        }
      } else {
        const portSuffix = port ? `:${port}` : ':8000';
        baseURL = `http://${ip}${portSuffix}/api/v1/`;
      }
      
      config.baseURL = baseURL;
      console.log(`[API Request] BaseURL: ${config.baseURL}, Path: ${config.url}`);
      return config;
    } catch (error) {
      console.error('Erro ao recuperar configurações de IP:', error);
      config.baseURL = 'https://totalcap.vercel.app/api/v1/'; // fallback seguro
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
