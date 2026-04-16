import axios from 'axios';

// Utiliza a variável de ambiente VITE_API_URL em dev (se existir), 
// caso contrário, usa um caminho relativo '/api/v1' que o Vercel fará o roteamento.
const baseURL = import.meta.env.VITE_API_URL || '/server/v1';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
