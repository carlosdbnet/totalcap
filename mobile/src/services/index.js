import api from './api';

export const dashboardService = {
  getStats: async () => {
    const { data } = await api.get('/dashboard/');
    return data;
  },
};

export const setorService = {
  listar: async () => {
    const { data } = await api.get('/setores/');
    return data;
  },
  criar: async (setor) => {
    const { data } = await api.post('/setores', setor);
    return data;
  },
};

export const operadorService = {
  listar: async () => {
    const { data } = await api.get('/operadores/');
    return data;
  },
  criar: async (operador) => {
    const { data } = await api.post('/operadores', operador);
    return data;
  },
};


export const pneuService = {
  listar: async (skip = 0, limit = 100) => {
    const { data } = await api.get(`/pneus/?skip=${skip}&limit=${limit}`);
    return data;
  },
  buscar: async (codbarra) => {
    const { data } = await api.get(`/pneus/buscar?codbarra=${codbarra}`);
    return data;
  },
  cadastrar: async (pneu) => {
    const { data } = await api.post('/pneus', pneu);
    return data;
  },
};

export const servicoService = {
  listar: async () => {
    const { data } = await api.get('/servicos/');
    return data;
  },
  criar: async (servico) => {
    const { data } = await api.post('/servicos', servico);
    return data;
  },
};

export const medidaService = {
  listar: async () => {
    const { data } = await api.get('/medidas');
    return data;
  },
};

export const desenhoService = {
  listar: async () => {
    const { data } = await api.get('/desenhos');
    return data;
  },
};

export const auxService = {
  listarSetores: async () => setorService.listar(),
  listarOperadores: async () => operadorService.listar(),
};

export const producaoService = {
  listar: async () => {
    const { data } = await api.get('/apontamento');
    return data;
  },
  criar: async (apontamento) => {
    const { data } = await api.post('/apontamento', apontamento);
    return data;
  },
  buscarExistente: (id_pneu, id_setor) => api.get(`/apontamento/buscar?id_pneu=${id_pneu}&id_setor=${id_setor}`).then(r => r.data),
  excluir: (id) => api.delete(`/apontamento/${id}`).then(r => r.data),
  atualizar: (id, p) => api.put(`/apontamento/${id}`, p).then(r => r.data),
  buscarPneu: async (barcode) => {
    try {
      return await pneuService.buscar(barcode);
    } catch (error) {
      console.error("Erro ao buscar pneu:", error);
      throw error;
    }
  },
};

export const avaliacaoService = {
  listar: async () => {
    const { data } = await api.get('/avaliacoes');
    return data;
  },
  criar: async (avaliacao) => {
    const { data } = await api.post('/avaliacoes', avaliacao);
    return data;
  },
};

export const falhaService = {
  listarCatalogo: async () => {
    try {
      const { data } = await api.get('/falhas');
      return data;
    } catch {
      return [];
    }
  },
  registrar: async (falha) => {
    const { data } = await api.post('/falhas', falha);
    return data;
  }
};

export const credencialService = {
  solicitar: async (android_id, id_setor) => {
    const { data } = await api.post('/credencial', { android_id, id_setor });
    return data;
  },
  verificar: async (android_id) => {
    const { data } = await api.get(`/credencial/${android_id}`);
    return data;
  },
};
