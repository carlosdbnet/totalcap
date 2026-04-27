import axios from 'axios';

// Utiliza a variável de ambiente VITE_API_URL em dev (se existir), 
// caso contrário, usa um caminho relativo '/api/v1' que o Vercel fará o roteamento.
const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  
  return error.response?.data?.message || error.message || defaultMessage;
};

export default api;
