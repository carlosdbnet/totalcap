import axios from 'axios';

// Utiliza a variável de ambiente VITE_API_URL em dev (se existir), 
// caso contrário, usa um caminho relativo '/api/v1' que o Vercel fará o roteamento.
// Forçando o endereço do Railway para evitar o conflito com as rewrites do vercel.json
let baseURL = 'https://totalcap-producao-production.up.railway.app/api/v1/';
const api = axios.create({
  baseURL: baseURL,


  timeout: 60000,
  headers: {
    // Deixamos o Axios detectar o Content-Type automaticamente
  },

});

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('totalcap_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Extrai uma mensagem de erro amigável de uma resposta da API (FastAPI/Pydantic)
 */
export const getErrorMessage = (error: any, defaultMessage: string = 'Erro desconhecido'): string => {
  const detail = error.response?.data?.detail;
  
  if (typeof detail === 'string') {
    return detail;
  }
  
  if (Array.isArray(detail)) {
    // Erros de validação do Pydantic chegam como uma lista de objetos {msg, loc, type}
    return detail.map(d => {
      const field = d.loc && d.loc.length > 1 ? `${d.loc[d.loc.length - 1]}: ` : '';
      return `${field}${d.msg}`;
    }).join(', ');
  }
  
  if (detail && typeof detail === 'object') {
    return JSON.stringify(detail);
  }
  
  if (error.code === 'ECONNABORTED') {
    return 'Tempo limite esgotado. A IA demorou demais para responder ou o servidor cortou a conexão.';
  }
  
  if (error.message === 'Network Error') {
    return 'Erro de Rede. Verifique sua conexão ou se o servidor está online. (Pode ser um bloqueio de CORS ou timeout do servidor)';
  }

  return error.response?.data?.message || error.message || defaultMessage;
};

export default api;
