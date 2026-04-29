import api from './api';

export const logError = async (message: string, stack?: string) => {
  try {
    // Evita loop infinito se o próprio log falhar
    console.error(`[Frontend Error] ${message}`, stack);
    
    await api.post('/logs/', {
      level: 'ERROR',
      message,
      stack: stack || '',
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    // Apenas loga no console se falhar o envio para não travar o app
    console.warn('Falha ao enviar log para o servidor:', err);
  }
};

export const logWarning = async (message: string) => {
  try {
    await api.post('/logs/', {
      level: 'WARN',
      message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    // Ignora silenciosamente
  }
};
